import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../db/prisma.js';
import { blockchainService } from '../../services/blockchainService.js';
import { config } from '../../config/index.js';
import { authenticateToken } from '../../middleware/auth.js';

const router = Router();

const verifyHashSchema = z.object({
  hash: z.string().length(64, 'SHA-256 hash must be 64 hexadecimal characters')
});

router.get('/status', authenticateToken, async (_req, res, next) => {
  try {
    const totalTransactions = await prisma.blockchainTransaction.count();
    const latestTx = await prisma.blockchainTransaction.findFirst({
      orderBy: { timestamp: 'desc' }
    });

    res.json({
      success: true,
      mode: blockchainService.getMode(),
      channelName: config.FABRIC_CHANNEL_NAME,
      chaincodeName: config.FABRIC_CHAINCODE_NAME,
      gatewayEndpoint: config.FABRIC_GATEWAY_ENDPOINT,
      mspId: config.FABRIC_MSP_ID,
      connected: true,
      statusMessage: blockchainService.getMode() === 'FABRIC_LIVE'
        ? 'Connected to Hyperledger Fabric Gateway v2.5'
        : 'Running Cryptographic Ledger State Engine (Native Windows Non-Docker Mode)',
      totalTransactions,
      latestBlockNumber: latestTx?.blockNumber || 1000,
      organizations: [
        { name: 'ManufacturerOrg', mspId: 'ManufacturerMSP', peer: 'peer0.manufacturer.meditrace.internal:7051' },
        { name: 'DistributorOrg', mspId: 'DistributorMSP', peer: 'peer0.distributor.meditrace.internal:8051' },
        { name: 'WarehouseOrg', mspId: 'WarehouseMSP', peer: 'peer0.warehouse.meditrace.internal:9051' },
        { name: 'PharmacyOrg', mspId: 'PharmacyMSP', peer: 'peer0.pharmacy.meditrace.internal:10051' }
      ]
    });
  } catch (err) {
    next(err);
  }
});

router.get('/transactions', authenticateToken, async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit as string || '50', 10);
    const transactions = await blockchainService.getRecentTransactions(limit);
    res.json({ success: true, transactions });
  } catch (err) {
    next(err);
  }
});

router.get('/provenance/:batchNumber', authenticateToken, async (req, res, next) => {
  try {
    const { batchNumber } = req.params;
    const batch = await prisma.batch.findUnique({
      where: { batchNumber },
      include: {
        product: true,
        manufacturer: true,
        alerts: true,
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
      return res.status(404).json({ success: false, error: 'Batch not found on ledger' });
    }

    // Gather ledger checkpoints
    const registrationTx = await prisma.blockchainTransaction.findFirst({
      where: { payloadHash: batch.canonicalHash || '' }
    });

    res.json({
      success: true,
      batchNumber: batch.batchNumber,
      productName: batch.product.name,
      gtin: batch.product.gtin,
      canonicalHash: batch.canonicalHash,
      blockchainTxId: batch.blockchainTxId,
      status: batch.status,
      blockchainConfirmed: batch.blockchainConfirmed,
      registrationBlock: registrationTx?.blockNumber,
      history: batch.shipmentItems.flatMap(si => si.shipment.handoffs.map(h => ({
        handoffId: h.id,
        sender: h.senderOrg.name,
        recipient: h.recipientOrg.name,
        status: h.status,
        location: h.location,
        timestamp: h.timestamp,
        txId: h.blockchainTxId,
        confirmed: h.blockchainConfirmed
      })))
    });
  } catch (err) {
    next(err);
  }
});

router.post('/verify-hash', authenticateToken, async (req, res, next) => {
  try {
    const { hash } = verifyHashSchema.parse(req.body);
    const verification = await blockchainService.verifyHashOnChain(hash);
    res.json({ success: true, verification });
  } catch (err) {
    next(err);
  }
});

export default router;
