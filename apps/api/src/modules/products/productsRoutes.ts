import { Router } from 'express';
import { z } from 'zod';
import { UserRole } from '@prisma/client';
import { prisma } from '../../db/prisma.js';
import { authenticateToken, requireRoles, AuthenticatedRequest } from '../../middleware/auth.js';
import { logAuditEvent } from '../../middleware/auditLogger.js';

const router = Router();

const createProductSchema = z.object({
  name: z.string().min(2),
  genericName: z.string().min(2),
  gtin: z.string().regex(/^\d{14}$/, 'GTIN must be exactly 14 digits'),
  dosageForm: z.string().min(2),
  strength: z.string().min(1),
  description: z.string().min(5),
  minTempCelsius: z.coerce.number(),
  maxTempCelsius: z.coerce.number(),
  requiresColdChain: z.boolean().default(false),
  regulatoryApprovalId: z.string().min(3)
}).refine(data => data.minTempCelsius < data.maxTempCelsius, {
  message: 'Minimum temperature must be strictly less than maximum temperature',
  path: ['minTempCelsius']
});

router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const products = await prisma.product.findMany({
      where: { isActive: true },
      include: {
        manufacturer: true,
        _count: { select: { batches: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ success: true, products });
  } catch (err) {
    next(err);
  }
});

router.post('/', authenticateToken, requireRoles(UserRole.MANUFACTURER, UserRole.ADMIN), async (req: AuthenticatedRequest, res, next) => {
  try {
    const data = createProductSchema.parse(req.body);
    const user = req.user!;

    // Check unique GTIN
    const existing = await prisma.product.findUnique({
      where: { gtin: data.gtin }
    });
    if (existing) {
      return res.status(409).json({
        success: false,
        error: `Product with GTIN ${data.gtin} already exists in the system.`,
        code: 'DUPLICATE_GTIN'
      });
    }

    const product = await prisma.product.create({
      data: {
        ...data,
        manufacturerId: user.organizationId
      },
      include: { manufacturer: true }
    });

    await logAuditEvent({
      userId: user.id,
      userName: user.fullName,
      userRole: user.role,
      organizationName: user.organizationName,
      action: 'PRODUCT_CREATE',
      resourceType: 'PRODUCT',
      resourceId: product.id,
      details: { gtin: product.gtin, name: product.name }
    });

    res.status(201).json({ success: true, product });
  } catch (err) {
    next(err);
  }
});

router.get('/:id', authenticateToken, async (req, res, next) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: req.params.id },
      include: {
        manufacturer: true,
        batches: {
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    });

    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }

    res.json({ success: true, product });
  } catch (err) {
    next(err);
  }
});

export default router;
