import { Router } from 'express';
import { prisma } from '../../db/prisma.js';
import { authenticateToken, AuthenticatedRequest } from '../../middleware/auth.js';
import { UserRole } from '@prisma/client';

const router = Router();

router.get('/', authenticateToken, async (req: AuthenticatedRequest, res, next) => {
  try {
    const user = req.user!;
    const { action, resourceType, limit = '100', scope } = req.query;

    const where: any = {};
    if (action && typeof action === 'string') where.action = action;
    if (resourceType && typeof resourceType === 'string') where.resourceType = resourceType;

    // Role-specific scoping: non-admin users see their organization's audit trail
    if (scope !== 'all' && user && user.role !== UserRole.ADMIN) {
      const org = await prisma.organization.findUnique({
        where: { id: user.organizationId },
        select: { name: true }
      });
      where.OR = [
        { organizationName: org?.name || '' },
        { userId: user.id }
      ];
    }

    const logs = await prisma.auditLog.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: parseInt(limit as string, 10)
    });

    res.json({ success: true, logs });
  } catch (err) {
    next(err);
  }
});

export default router;
