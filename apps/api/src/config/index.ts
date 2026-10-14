import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { z } from 'zod';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });

const configSchema = z.object({
  PORT: z.coerce.number().default(4000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters'),
  JWT_EXPIRES_IN: z.string().default('8h'),
  FABRIC_MODE: z.enum(['FABRIC_LIVE', 'DEMO_INTEGRITY']).default('DEMO_INTEGRITY'),
  FABRIC_GATEWAY_ENDPOINT: z.string().default('localhost:7051'),
  FABRIC_CHANNEL_NAME: z.string().default('meditracechannel'),
  FABRIC_CHAINCODE_NAME: z.string().default('meditrace-cc'),
  FABRIC_MSP_ID: z.string().default('ManufacturerMSP'),
  CORS_ORIGIN: z.string().default('*')
});

export const config = configSchema.parse(process.env);
