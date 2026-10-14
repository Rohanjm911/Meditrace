import { Router } from 'express';
import { z } from 'zod';
import { UserRole, BatchStatus } from '@prisma/client';
import { prisma } from '../../db/prisma.js';
import { authenticateToken, requireRoles, AuthenticatedRequest } from '../../middleware/auth.js';
import { blockchainService } from '../../services/blockchainService.js';
import { logAuditEvent } from '../../middleware/auditLogger.js';

const router = Router();

const createBatchSchema = z.object({
  productId: z.string().uuid(),
  batchNumber: z.string().min(3).max(30).regex(/^[A-Za-z0-9\-_]+$/, 'Batch number must contain only letters, numbers, hyphens, and underscores'),
  mfgDate: z.string().datetime(),
  expDate: z.string().datetime(),
  quantity: z.coerce.number().int().positive(),
  unitOfMeasure: z.string().default('vials'),
  minTempCelsius: z.coerce.number(),
  maxTempCelsius: z.coerce.number(),
  notes: z.string().optional()
}).refine(data => new Date(data.mfgDate) < new Date(data.expDate), {
  message: 'Manufacturing date must be earlier than expiration date',
  path: ['mfgDate']
}).refine(data => data.minTempCelsius < data.maxTempCelsius, {
  message: 'Minimum temperature must be strictly less than maximum temperature',
  path: ['minTempCelsius']
});

const updateBatchStatusSchema = z.object({
  status: z.nativeEnum(BatchStatus),
  reason: z.string().min(5, 'Reason is mandatory for status change')
});

router.get('/', authenticateToken, async (req: AuthenticatedRequest, res, next) => {
  try {
    const user = req.user!;
    const { status, productId, search, scope } = req.query;

    const where: any = {};
    if (status && typeof status === 'string') {
      where.status = status as BatchStatus;
    }
    if (productId && typeof productId === 'string') {
      where.productId = productId;
    }
    if (search && typeof search === 'string') {
      where.OR = [
        { batchNumber: { contains: search, mode: 'insensitive' } },
        { product: { name: { contains: search, mode: 'insensitive' } } }
      ];
    }

    // Role-specific dataset scoping:
    // If scope !== 'all' and user is not ADMIN, provide dedicated datasets for that organization
    if (scope !== 'all' && user && user.role !== UserRole.ADMIN) {
      if (user.role === UserRole.MANUFACTURER) {
        where.manufacturerId = user.organizationId;
      } else {
        // Distributor, Warehouse, Pharmacist: batches tied to shipments of their organization
        where.shipmentItems = {
          some: {
            shipment: {
              OR: [
                { senderOrgId: user.organizationId },
                { recipientOrgId: user.organizationId }
              ]
            }
          }
        };
      }
    }

    const batches = await prisma.batch.findMany({
      where,
      include: {
        product: true,
        manufacturer: true,
        _count: { select: { alerts: true, shipmentItems: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ success: true, batches });
  } catch (err) {
    next(err);
  }
});

router.post('/', authenticateToken, requireRoles(UserRole.MANUFACTURER, UserRole.ADMIN), async (req: AuthenticatedRequest, res, next) => {
  try {
    const data = createBatchSchema.parse(req.body);
    const user = req.user!;

    // Check unique batchNumber
    const existing = await prisma.batch.findUnique({
      where: { batchNumber: data.batchNumber }
    });
    if (existing) {
      return res.status(409).json({
        success: false,
        error: `Batch number '${data.batchNumber}' is already registered in the ledger.`,
        code: 'DUPLICATE_BATCH_NUMBER'
      });
    }

    // Verify product exists
    const product = await prisma.product.findUnique({
      where: { id: data.productId },
      include: { manufacturer: true }
    });
    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }

    const mfgDate = new Date(data.mfgDate);
    const expDate = new Date(data.expDate);

    // 1. Compute Canonical SHA-256 Hash
    const canonicalPayload = {
      batchNumber: data.batchNumber,
      gtin: product.gtin,
      mfgDate: mfgDate.toISOString(),
      expDate: expDate.toISOString(),
      quantity: data.quantity,
      manufacturerName: user.organizationName,
      minTempCelsius: data.minTempCelsius,
      maxTempCelsius: data.maxTempCelsius
    };

    // 2. Submit to Blockchain Service
    const blockchainResult = await blockchainService.recordBatchRegistration(canonicalPayload);

    // 3. Generate Standard Payloads
    const qrPayload = JSON.stringify({
      app: 'MEDITRACE',
      batch: data.batchNumber,
      gtin: product.gtin,
      exp: expDate.toISOString().slice(0, 10),
      hash: blockchainResult.canonicalHash,
      tx: blockchainResult.txId
    });

    const expYYMMDD = `${expDate.toISOString().slice(2, 4)}${expDate.toISOString().slice(5, 7)}${expDate.toISOString().slice(8, 10)}`;
    const serial = `SN${Math.floor(10000000 + Math.random() * 90000000)}`;
    const gs1DataMatrixPayload = `(01)${product.gtin}(17)${expYYMMDD}(10)${data.batchNumber}(21)${serial}`;

    // 4. Persist in Database
    const batch = await prisma.batch.create({
      data: {
        batchNumber: data.batchNumber,
        productId: data.productId,
        manufacturerId: user.organizationId,
        mfgDate,
        expDate,
        quantity: data.quantity,
        remainingQuantity: data.quantity,
        unitOfMeasure: data.unitOfMeasure,
        minTempCelsius: data.minTempCelsius,
        maxTempCelsius: data.maxTempCelsius,
        status: BatchStatus.REGISTERED,
        canonicalHash: blockchainResult.canonicalHash,
        blockchainTxId: blockchainResult.txId,
        blockchainConfirmed: blockchainResult.confirmed,
        blockchainMode: blockchainResult.mode,
        qrPayload,
        gs1DataMatrixPayload,
        notes: data.notes
      },
      include: { product: true, manufacturer: true }
    });

    await logAuditEvent({
      userId: user.id,
      userName: user.fullName,
      userRole: user.role,
      organizationName: user.organizationName,
      action: 'BATCH_REGISTRATION',
      resourceType: 'BATCH',
      resourceId: batch.id,
      details: {
        batchNumber: batch.batchNumber,
        canonicalHash: batch.canonicalHash,
        txId: batch.blockchainTxId
      }
    });

    res.status(201).json({ success: true, batch });
  } catch (err) {
    next(err);
  }
});

router.get('/:id', authenticateToken, async (req, res, next) => {
  try {
    const batch = await prisma.batch.findUnique({
      where: { id: req.params.id },
      include: {
        product: { include: { manufacturer: true } },
        manufacturer: true,
        alerts: { orderBy: { createdAt: 'desc' } },
        sensorReadings: {
          orderBy: { timestamp: 'desc' },
          take: 50
        },
        shipmentItems: {
          include: {
            shipment: {
              include: {
                senderOrg: true,
                recipientOrg: true,
                handoffs: {
                  include: { senderOrg: true, recipientOrg: true },
                  orderBy: { timestamp: 'asc' }
                }
              }
            }
          }
        }
      }
    });

    if (!batch) {
      return res.status(404).json({ success: false, error: 'Batch not found' });
    }

    res.json({ success: true, batch });
  } catch (err) {
    next(err);
  }
});

router.patch('/:id/status', authenticateToken, requireRoles(UserRole.MANUFACTURER, UserRole.ADMIN), async (req: AuthenticatedRequest, res, next) => {
  try {
    const { status, reason } = updateBatchStatusSchema.parse(req.body);
    const user = req.user!;

    const batch = await prisma.batch.findUnique({ where: { id: req.params.id } });
    if (!batch) {
      return res.status(404).json({ success: false, error: 'Batch not found' });
    }

    const updated = await prisma.batch.update({
      where: { id: batch.id },
      data: {
        status,
        notes: batch.notes ? `${batch.notes} | Status changed to ${status}: ${reason}` : `Status changed to ${status}: ${reason}`
      }
    });

    await logAuditEvent({
      userId: user.id,
      userName: user.fullName,
      userRole: user.role,
      organizationName: user.organizationName,
      action: 'BATCH_STATUS_UPDATE',
      resourceType: 'BATCH',
      resourceId: batch.id,
      details: { previousStatus: batch.status, newStatus: status, reason }
    });

    res.json({ success: true, batch: updated });
  } catch (err) {
    next(err);
  }
});

export default router;
