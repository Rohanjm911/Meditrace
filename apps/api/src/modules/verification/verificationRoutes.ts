import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../db/prisma.js';
import { verificationService } from '../../services/verificationService.js';
import { authenticateToken } from '../../middleware/auth.js';

const router = Router();

const verifySchema = z.object({
  code: z.string().min(1, 'Scan code cannot be empty'),
  scanType: z.enum(['QR', 'GS1_DATAMATRIX', 'MANUAL']),
  location: z.string().optional()
});

router.post('/verify', async (req, res, next) => {
  try {
    const data = verifySchema.parse(req.body);

    const result = await verificationService.verifyCode(data.code, data.scanType, {
      location: data.location,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.json({ success: true, result });
  } catch (err) {
    next(err);
  }
});

router.get('/history', authenticateToken, async (_req, res, next) => {
  try {
    const history = await prisma.productScanAudit.findMany({
      take: 50,
      orderBy: { scannedAt: 'desc' },
      include: { batch: { include: { product: true } } }
    });

    res.json({ success: true, history });
  } catch (err) {
    next(err);
  }
});

export default router;
