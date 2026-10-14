import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import { config } from './config/index.js';
import { errorHandler } from './middleware/errorHandler.js';

import authRoutes from './modules/auth/authRoutes.js';
import productsRoutes from './modules/products/productsRoutes.js';
import batchesRoutes from './modules/batches/batchesRoutes.js';
import shipmentsRoutes from './modules/shipments/shipmentsRoutes.js';
import telemetryRoutes from './modules/telemetry/telemetryRoutes.js';
import alertsRoutes from './modules/alerts/alertsRoutes.js';
import verificationRoutes from './modules/verification/verificationRoutes.js';
import blockchainRoutes from './modules/blockchain/blockchainRoutes.js';
import usersRoutes from './modules/users/usersRoutes.js';
import auditRoutes from './modules/audit/auditRoutes.js';
import reportsRoutes from './modules/reports/reportsRoutes.js';
import healthRoutes from './modules/health/healthRoutes.js';

export const app = express();

app.use(helmet({
  contentSecurityPolicy: false // Electron and local dev friendly
}));

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-simulator-source']
}));

app.use(express.json({ limit: '10mb' }));

// Swagger setup
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'MediTrace Core API',
      version: '1.0.0',
      description: 'Pharmaceutical authenticity, anti-counterfeit verification, and cold-chain monitoring API'
    },
    servers: [
      { url: `http://localhost:${config.PORT}`, description: 'Local Development Server' }
    ]
  },
  apis: []
};
const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Mount modules
app.use('/api/auth', authRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/batches', batchesRoutes);
app.use('/api/shipments', shipmentsRoutes);
app.use('/api/telemetry', telemetryRoutes);
app.use('/api/alerts', alertsRoutes);
app.use('/api/verification', verificationRoutes);
app.use('/api/blockchain', blockchainRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/audit-logs', auditRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/health', healthRoutes);

// Error handler
app.use(errorHandler);
