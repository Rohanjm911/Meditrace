import { Router } from 'express';
import { z } from 'zod';
import { AlertSeverity, AlertStatus } from '@prisma/client';
import { prisma } from '../../db/prisma.js';
import { authenticateToken, AuthenticatedRequest } from '../../middleware/auth.js';

const router = Router();

const telemetryIngestSchema = z.object({
  serialNumber: z.string().min(3),
  temperatureCelsius: z.coerce.number(),
  humidityPercent: z.coerce.number().optional(),
  batteryLevel: z.coerce.number().optional(),
  location: z.string().optional(),
  isSimulated: z.boolean().default(true),
  isExcursion: z.boolean().optional(),
  timestamp: z.string().datetime().optional()
});

/**
 * Ingestion endpoint called by IoT simulator or hardware ESP32 edge gateways
 */
router.post('/ingest', async (req, res, next) => {
  try {
    const data = telemetryIngestSchema.parse(req.body);
    const readingTime = data.timestamp ? new Date(data.timestamp) : new Date();

    // Find or create sensor
    let sensor = await prisma.sensor.findUnique({
      where: { serialNumber: data.serialNumber }
    });

    if (!sensor) {
      sensor = await prisma.sensor.create({
        data: {
          serialNumber: data.serialNumber,
          name: `Sensor ${data.serialNumber}`,
          location: data.location || 'Unknown Location',
          batteryLevel: data.batteryLevel ?? 100.0,
          isSimulated: data.isSimulated,
          lastReadingAt: readingTime
        }
      });
    } else {
      await prisma.sensor.update({
        where: { id: sensor.id },
        data: {
          lastReadingAt: readingTime,
          batteryLevel: data.batteryLevel ?? sensor.batteryLevel,
          location: data.location ?? sensor.location
        }
      });
    }

    // Check if sensor is attached to an active shipment
    const activeShipment = await prisma.shipment.findFirst({
      where: { sensorId: sensor.id, status: { in: ['CREATED', 'DISPATCHED', 'IN_TRANSIT'] } },
      include: { items: { include: { batch: true } } }
    });

    const activeBatch = activeShipment?.items[0]?.batch || await prisma.batch.findFirst({
      where: { status: { in: ['REGISTERED', 'STORED', 'IN_TRANSIT'] } }
    });

    // Determine threshold excursion
    let isExcursion = data.isExcursion || false;
    let minAllowed = -90.0;
    let maxAllowed = 25.0;

    if (activeBatch) {
      minAllowed = activeBatch.minTempCelsius;
      maxAllowed = activeBatch.maxTempCelsius;
      if (data.temperatureCelsius < minAllowed || data.temperatureCelsius > maxAllowed) {
        isExcursion = true;
      }
    }

    // Persist reading
    const reading = await prisma.sensorReading.create({
      data: {
        sensorId: sensor.id,
        batchId: activeBatch?.id,
        shipmentId: activeShipment?.id,
        temperatureCelsius: data.temperatureCelsius,
        humidityPercent: data.humidityPercent,
        batteryLevel: data.batteryLevel,
        isSimulated: data.isSimulated, // Explicitly labelled
        isExcursion,
        location: data.location || sensor.location,
        timestamp: readingTime
      }
    });

    // If excursion detected, create or escalate temperature alert
    if (isExcursion) {
      const activeAlert = await prisma.temperatureAlert.findFirst({
        where: {
          sensorId: sensor.id,
          status: AlertStatus.ACTIVE
        }
      });

      if (!activeAlert) {
        const severity = (data.temperatureCelsius > maxAllowed + 5 || data.temperatureCelsius < minAllowed - 5)
          ? AlertSeverity.CRITICAL
          : AlertSeverity.HIGH;

        await prisma.temperatureAlert.create({
          data: {
            sensorId: sensor.id,
            batchId: activeBatch?.id,
            shipmentId: activeShipment?.id,
            severity,
            status: AlertStatus.ACTIVE,
            readingCelsius: data.temperatureCelsius,
            minThresholdCelsius: minAllowed,
            maxThresholdCelsius: maxAllowed,
            durationMinutes: 5,
            message: `Temperature excursion detected on sensor ${sensor.serialNumber} (${data.temperatureCelsius}°C outside permitted ${minAllowed}°C to ${maxAllowed}°C).`,
            isSimulated: data.isSimulated
          }
        });
      }
    }

    res.status(201).json({
      success: true,
      readingId: reading.id,
      isExcursion,
      isSimulated: reading.isSimulated
    });
  } catch (err) {
    next(err);
  }
});

router.get('/readings', authenticateToken, async (req, res, next) => {
  try {
    const { sensorId, batchId, shipmentId, limit = '100' } = req.query;

    const where: any = {};
    if (sensorId && typeof sensorId === 'string') where.sensorId = sensorId;
    if (batchId && typeof batchId === 'string') where.batchId = batchId;
    if (shipmentId && typeof shipmentId === 'string') where.shipmentId = shipmentId;

    const readings = await prisma.sensorReading.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: parseInt(limit as string, 10),
      include: { sensor: true, batch: { include: { product: true } } }
    });

    res.json({ success: true, readings });
  } catch (err) {
    next(err);
  }
});

router.get('/sensors', authenticateToken, async (req: AuthenticatedRequest, res, next) => {
  try {
    const user = req.user!;
    const { scope } = req.query;

    const where: any = {};
    if (scope !== 'all' && user && user.role !== 'ADMIN') {
      const org = await prisma.organization.findUnique({
        where: { id: user.organizationId },
        select: { name: true }
      });
      const orgKeyword = (org?.name || '').split(' ')[0] || '';

      where.OR = [
        { location: { contains: orgKeyword, mode: 'insensitive' } },
        { location: { contains: user.role === 'MANUFACTURER' ? 'MFG' : user.role === 'WAREHOUSE_OPERATOR' ? 'Nordic' : user.role === 'DISTRIBUTOR' ? 'MedExpress' : 'Apollo', mode: 'insensitive' } },
        {
          shipments: {
            some: {
              OR: [
                { senderOrgId: user.organizationId },
                { recipientOrgId: user.organizationId }
              ]
            }
          }
        }
      ];
    }

    const sensors = await prisma.sensor.findMany({
      where,
      include: {
        _count: { select: { readings: true, alerts: true } }
      },
      orderBy: { updatedAt: 'desc' }
    });

    res.json({ success: true, sensors });
  } catch (err) {
    next(err);
  }
});

export default router;
