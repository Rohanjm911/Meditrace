import { Router } from 'express';
import { z } from 'zod';
import { UserRole, ShipmentStatus, HandoffStatus, BatchStatus } from '@prisma/client';
import { prisma } from '../../db/prisma.js';
import { authenticateToken, requireRoles, AuthenticatedRequest } from '../../middleware/auth.js';
import { blockchainService } from '../../services/blockchainService.js';
import { logAuditEvent } from '../../middleware/auditLogger.js';

const router = Router();

const createShipmentSchema = z.object({
  recipientOrgId: z.string().uuid(),
  originLocation: z.string().min(3),
  destinationLocation: z.string().min(3),
  assignedCarrier: z.string().optional(),
  sensorId: z.string().uuid().optional(),
  items: z.array(z.object({
    batchId: z.string().uuid(),
    quantity: z.coerce.number().int().positive()
  })).min(1, 'At least one batch item is required')
});

const handoffActionSchema = z.object({
  location: z.string().min(2),
  notes: z.string().optional(),
  rejectionReason: z.string().optional()
});

router.get('/', authenticateToken, async (req: AuthenticatedRequest, res, next) => {
  try {
    const user = req.user!;
    const { status } = req.query;

    const where: any = {};
    if (status && typeof status === 'string') {
      where.status = status as ShipmentStatus;
    }

    // Role-based visibility: organizations see shipments they sent or receive, Admin sees all
    if (user.role !== UserRole.ADMIN) {
      where.OR = [
        { senderOrgId: user.organizationId },
        { recipientOrgId: user.organizationId }
      ];
    }

    const shipments = await prisma.shipment.findMany({
      where,
      include: {
        senderOrg: true,
        recipientOrg: true,
        sensor: true,
        items: { include: { batch: { include: { product: true } } } },
        handoffs: {
          include: { senderOrg: true, recipientOrg: true },
          orderBy: { timestamp: 'desc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ success: true, shipments });
  } catch (err) {
    next(err);
  }
});

router.post('/', authenticateToken, requireRoles(UserRole.MANUFACTURER, UserRole.DISTRIBUTOR, UserRole.ADMIN), async (req: AuthenticatedRequest, res, next) => {
  try {
    const data = createShipmentSchema.parse(req.body);
    const user = req.user!;

    // Validate recipient org exists
    const recipientOrg = await prisma.organization.findUnique({
      where: { id: data.recipientOrgId }
    });
    if (!recipientOrg) {
      return res.status(404).json({ success: false, error: 'Recipient organization not found' });
    }

    // Validate batch stock availability
    for (const item of data.items) {
      const batch = await prisma.batch.findUnique({ where: { id: item.batchId } });
      if (!batch) {
        return res.status(404).json({ success: false, error: `Batch ID ${item.batchId} not found` });
      }
      if (batch.remainingQuantity < item.quantity) {
        return res.status(400).json({
          success: false,
          error: `Insufficient inventory for batch ${batch.batchNumber}. Available: ${batch.remainingQuantity}, Requested: ${item.quantity}`
        });
      }
    }

    const trackingNumber = `TRK-MT-${Math.floor(10000 + Math.random() * 90000)}`;

    const shipment = await prisma.$transaction(async (tx) => {
      // Deduct batch quantity
      for (const item of data.items) {
        await tx.batch.update({
          where: { id: item.batchId },
          data: {
            remainingQuantity: { decrement: item.quantity },
            status: BatchStatus.IN_TRANSIT
          }
        });
      }

      return tx.shipment.create({
        data: {
          trackingNumber,
          senderOrgId: user.organizationId,
          recipientOrgId: data.recipientOrgId,
          originLocation: data.originLocation,
          destinationLocation: data.destinationLocation,
          assignedCarrier: data.assignedCarrier,
          sensorId: data.sensorId,
          status: ShipmentStatus.CREATED,
          items: {
            create: data.items.map(i => ({
              batchId: i.batchId,
              quantity: i.quantity
            }))
          }
        },
        include: {
          senderOrg: true,
          recipientOrg: true,
          items: { include: { batch: true } }
        }
      });
    });

    await logAuditEvent({
      userId: user.id,
      userName: user.fullName,
      userRole: user.role,
      organizationName: user.organizationName,
      action: 'SHIPMENT_CREATE',
      resourceType: 'SHIPMENT',
      resourceId: shipment.id,
      details: { trackingNumber, recipient: recipientOrg.name }
    });

    res.status(201).json({ success: true, shipment });
  } catch (err) {
    next(err);
  }
});

router.post('/:id/dispatch', authenticateToken, async (req: AuthenticatedRequest, res, next) => {
  try {
    const user = req.user!;
    const shipment = await prisma.shipment.findUnique({
      where: { id: req.params.id },
      include: { senderOrg: true, recipientOrg: true, items: { include: { batch: true } } }
    });

    if (!shipment) {
      return res.status(404).json({ success: false, error: 'Shipment not found' });
    }

    if (user.role !== UserRole.ADMIN && shipment.senderOrgId !== user.organizationId) {
      return res.status(403).json({ success: false, error: 'Only the sender organization can dispatch this shipment' });
    }

    if (shipment.status !== ShipmentStatus.CREATED) {
      return res.status(400).json({ success: false, error: `Cannot dispatch shipment with status '${shipment.status}'` });
    }

    // Record initial dispatch handoff on blockchain
    const primaryBatch = shipment.items[0]?.batch;
    const handoffPayload = {
      shipmentId: shipment.id,
      batchNumber: primaryBatch?.batchNumber || 'MULTI-BATCH',
      senderOrgName: shipment.senderOrg.name,
      recipientOrgName: shipment.recipientOrg.name,
      location: shipment.originLocation,
      timestamp: new Date().toISOString()
    };

    const blockchainResult = await blockchainService.recordHandoff(handoffPayload);

    const updated = await prisma.shipment.update({
      where: { id: shipment.id },
      data: {
        status: ShipmentStatus.DISPATCHED,
        dispatchTime: new Date(),
        blockchainTxId: blockchainResult.txId,
        blockchainConfirmed: blockchainResult.confirmed,
        handoffs: {
          create: {
            senderOrgId: shipment.senderOrgId,
            senderUserId: user.id,
            recipientOrgId: shipment.recipientOrgId,
            status: HandoffStatus.PENDING,
            location: shipment.originLocation,
            notes: 'Shipment dispatched from origin loading facility.',
            blockchainTxId: blockchainResult.txId,
            blockchainConfirmed: blockchainResult.confirmed
          }
        }
      },
      include: { handoffs: true }
    });

    res.json({ success: true, shipment: updated });
  } catch (err) {
    next(err);
  }
});

router.post('/:id/handoff/:handoffId/accept', authenticateToken, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { location, notes } = handoffActionSchema.parse(req.body);
    const user = req.user!;

    const shipment = await prisma.shipment.findUnique({
      where: { id: req.params.id },
      include: { senderOrg: true, recipientOrg: true, items: { include: { batch: true } } }
    });

    if (!shipment) {
      return res.status(404).json({ success: false, error: 'Shipment not found' });
    }

    // Recipient verification
    if (user.role !== UserRole.ADMIN && shipment.recipientOrgId !== user.organizationId) {
      return res.status(403).json({
        success: false,
        error: `Only recipient organization '${shipment.recipientOrg.name}' can accept this handoff.`
      });
    }

    const handoff = await prisma.handoffEvent.findUnique({
      where: { id: req.params.handoffId }
    });

    if (!handoff || handoff.shipmentId !== shipment.id) {
      return res.status(404).json({ success: false, error: 'Handoff event not found' });
    }

    // Submit acceptance to blockchain
    const primaryBatch = shipment.items[0]?.batch;
    const handoffPayload = {
      shipmentId: shipment.id,
      batchNumber: primaryBatch?.batchNumber || 'MULTI-BATCH',
      senderOrgName: shipment.senderOrg.name,
      recipientOrgName: shipment.recipientOrg.name,
      location,
      timestamp: new Date().toISOString()
    };
    const blockchainResult = await blockchainService.recordHandoff(handoffPayload);

    await prisma.$transaction([
      prisma.handoffEvent.update({
        where: { id: handoff.id },
        data: {
          status: HandoffStatus.ACCEPTED,
          recipientUserId: user.id,
          location,
          notes: notes || 'Handoff verified and accepted into custody.',
          blockchainTxId: blockchainResult.txId,
          blockchainConfirmed: blockchainResult.confirmed
        }
      }),
      prisma.shipment.update({
        where: { id: shipment.id },
        data: {
          status: ShipmentStatus.ACCEPTED,
          deliveryTime: new Date()
        }
      })
    ]);

    await logAuditEvent({
      userId: user.id,
      userName: user.fullName,
      userRole: user.role,
      organizationName: user.organizationName,
      action: 'HANDOFF_ACCEPT',
      resourceType: 'SHIPMENT',
      resourceId: shipment.id,
      details: { trackingNumber: shipment.trackingNumber, location, txId: blockchainResult.txId }
    });

    res.json({ success: true, message: 'Handoff successfully accepted and recorded on blockchain ledger' });
  } catch (err) {
    next(err);
  }
});

router.post('/:id/handoff/:handoffId/reject', authenticateToken, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { location, rejectionReason } = handoffActionSchema.parse(req.body);
    const user = req.user!;

    if (!rejectionReason) {
      return res.status(400).json({ success: false, error: 'rejectionReason is mandatory when rejecting a handoff' });
    }

    const shipment = await prisma.shipment.findUnique({
      where: { id: req.params.id },
      include: { recipientOrg: true }
    });

    if (!shipment) {
      return res.status(404).json({ success: false, error: 'Shipment not found' });
    }

    if (user.role !== UserRole.ADMIN && shipment.recipientOrgId !== user.organizationId) {
      return res.status(403).json({ success: false, error: 'Only designated recipient can reject this handoff' });
    }

    await prisma.$transaction([
      prisma.handoffEvent.update({
        where: { id: req.params.handoffId },
        data: {
          status: HandoffStatus.REJECTED,
          recipientUserId: user.id,
          location,
          rejectionReason
        }
      }),
      prisma.shipment.update({
        where: { id: shipment.id },
        data: { status: ShipmentStatus.REJECTED }
      })
    ]);

    await logAuditEvent({
      userId: user.id,
      userName: user.fullName,
      userRole: user.role,
      organizationName: user.organizationName,
      action: 'HANDOFF_REJECT',
      resourceType: 'SHIPMENT',
      resourceId: shipment.id,
      details: { trackingNumber: shipment.trackingNumber, rejectionReason, location }
    });

    res.json({ success: true, message: 'Handoff rejected and recorded' });
  } catch (err) {
    next(err);
  }
});

export default router;
