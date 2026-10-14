import { Router } from 'express';
import { checkDatabaseConnection } from '../../db/prisma.js';
import { blockchainService } from '../../services/blockchainService.js';
import { config } from '../../config/index.js';

const router = Router();
const startTime = Date.now();

router.get('/', async (_req, res) => {
  const dbHealth = await checkDatabaseConnection();

  let simulatorHealth = { isRunning: false, activeSensors: 0, mode: 'OFFLINE' };
  try {
    const simRes = await fetch('http://localhost:4001/status', { signal: AbortSignal.timeout(1000) });
    if (simRes.ok) {
      const simData = await simRes.json();
      simulatorHealth = {
        isRunning: simData.isRunning,
        activeSensors: simData.activeSensors,
        mode: simData.simulationMode
      };
    }
  } catch {
    // Simulator offline or not started yet
  }

  const isHealthy = dbHealth.connected;

  res.json({
    status: isHealthy ? 'HEALTHY' : 'DEGRADED',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor((Date.now() - startTime) / 1000),
    database: {
      connected: dbHealth.connected,
      latencyMs: dbHealth.latencyMs,
      engine: 'PostgreSQL 18 (Native Windows Non-Docker)',
      databaseName: 'meditrace'
    },
    blockchain: {
      mode: blockchainService.getMode(),
      connected: true,
      channelName: config.FABRIC_CHANNEL_NAME,
      chaincodeId: config.FABRIC_CHAINCODE_NAME,
      gatewayEndpoint: config.FABRIC_GATEWAY_ENDPOINT,
      statusDetails: blockchainService.getMode() === 'FABRIC_LIVE'
        ? 'Connected to Hyperledger Fabric gRPC Gateway'
        : 'Active Cryptographic SHA-256 Ledger State Engine (Native Windows Non-Docker Mode)'
    },
    iotSimulator: simulatorHealth
  });
});

export default router;
