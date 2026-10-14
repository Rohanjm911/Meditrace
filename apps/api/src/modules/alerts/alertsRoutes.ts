import { Router } from 'express';
import { z } from 'zod';
import { AlertStatus } from '@prisma/client';
import { prisma } from '../../db/prisma.js';
import { authenticateToken, AuthenticatedRequest } from '../../middleware/auth.js';
import { logAuditEvent } from '../../middleware/auditLogger.js';

const router = Router();

const acknowledgeSchema = z.object({
  notes: z.string().min(5, 'Review acknowledgement notes are required')
});

const resolveSchema = z.object({
  resolutionNotes: z.string().min(10, 'Detailed corrective action resolution notes are required')
});

router.get('/', authenticateToken, async (req: AuthenticatedRequest, res, next) => {
  try {
    const user = req.user!;
    const { status, severity, scope } = req.query;

    const where: any = {};
    if (status && typeof status === 'string') {
      where.status = status as AlertStatus;
    }
    if (severity && typeof severity === 'string') {
      where.severity = severity as any;
    }

    // Role-specific scoping for non-admin users
    if (scope !== 'all' && user && user.role !== 'ADMIN') {
      where.OR = [
        { shipment: { OR: [{ senderOrgId: user.organizationId }, { recipientOrgId: user.organizationId }] } },
        { batch: { manufacturerId: user.organizationId } },
        { batch: { shipmentItems: { some: { shipment: { OR: [{ senderOrgId: user.organizationId }, { recipientOrgId: user.organizationId }] } } } } }
      ];
    }

    const alerts = await prisma.temperatureAlert.findMany({
      where,
      include: {
        sensor: true,
        batch: { include: { product: true } },
        shipment: true,
        acknowledgedByUser: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ success: true, alerts });
  } catch (err) {
    next(err);
  }
});

router.post('/:id/acknowledge', authenticateToken, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { notes } = acknowledgeSchema.parse(req.body);
    const user = req.user!;

    const alert = await prisma.temperatureAlert.findUnique({
      where: { id: req.params.id }
    });

    if (!alert) {
      return res.status(404).json({ success: false, error: 'Alert not found' });
    }

    const updated = await prisma.temperatureAlert.update({
      where: { id: alert.id },
      data: {
        status: AlertStatus.ACKNOWLEDGED,
        acknowledgedByUserId: user.id,
        acknowledgedAt: new Date(),
        resolutionNotes: notes
      }
    });

    await logAuditEvent({
      userId: user.id,
      userName: user.fullName,
      userRole: user.role,
      organizationName: user.organizationName,
      action: 'ALERT_ACKNOWLEDGE',
      resourceType: 'ALERT',
      resourceId: alert.id,
      details: { notes, readingCelsius: alert.readingCelsius }
    });

    res.json({ success: true, alert: updated });
  } catch (err) {
    next(err);
  }
});

router.post('/:id/resolve', authenticateToken, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { resolutionNotes } = resolveSchema.parse(req.body);
    const user = req.user!;

    const alert = await prisma.temperatureAlert.findUnique({
      where: { id: req.params.id }
    });

    if (!alert) {
      return res.status(404).json({ success: false, error: 'Alert not found' });
    }

    const updated = await prisma.temperatureAlert.update({
      where: { id: alert.id },
      data: {
        status: AlertStatus.RESOLVED,
        acknowledgedByUserId: alert.acknowledgedByUserId || user.id,
        acknowledgedAt: alert.acknowledgedAt || new Date(),
        resolutionNotes
      }
    });

    await logAuditEvent({
      userId: user.id,
      userName: user.fullName,
      userRole: user.role,
      organizationName: user.organizationName,
      action: 'ALERT_RESOLVE',
      resourceType: 'ALERT',
      resourceId: alert.id,
      details: { resolutionNotes }
    });

    res.json({ success: true, alert: updated });
  } catch (err) {
    next(err);
  }
});

export default router;
