import { PrismaClient } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var __meditrace_prisma: PrismaClient | undefined;
}

export const prisma =
  global.__meditrace_prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error']
  });

if (process.env.NODE_ENV !== 'production') {
  global.__meditrace_prisma = prisma;
}

export async function checkDatabaseConnection(): Promise<{ connected: boolean; latencyMs: number }> {
  const start = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { connected: true, latencyMs: Date.now() - start };
  } catch {
    return { connected: false, latencyMs: -1 };
  }
}
