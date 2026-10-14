import { Router } from 'express';
import { reportService } from '../../services/reportService.js';
import { authenticateToken } from '../../middleware/auth.js';

const router = Router();

router.get('/export/:type', authenticateToken, async (req: any, res, next) => {
  try {
    const { type } = req.params;
    const format = (req.query.format === 'csv' ? 'csv' : 'pdf') as 'csv' | 'pdf';
    const user = req.user;

    let result;
    switch (type) {
      case 'batches':
        result = await reportService.exportBatches(format, user);
        break;
      case 'shipments':
        result = await reportService.exportShipments(format, user);
        break;
      case 'temperatures':
        result = await reportService.exportTemperatures(format, user);
        break;
      case 'audit':
        result = await reportService.exportAuditLogs(format, user);
        break;
      default:
        return res.status(400).json({ success: false, error: `Invalid report type: ${type}` });
    }

    res.setHeader('Content-Type', result.contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
    res.send(result.buffer);
  } catch (err) {
    next(err);
  }
});

export default router;
