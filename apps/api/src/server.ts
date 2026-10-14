import { app } from './app.js';
import { config } from './config/index.js';
import { checkDatabaseConnection } from './db/prisma.js';

async function bootstrap() {
  const dbHealth = await checkDatabaseConnection();
  if (!dbHealth.connected) {
    console.warn('[Server Warning] Could not connect to PostgreSQL on initial start. Ensure db:setup has run.');
  } else {
    console.log(`[Server] PostgreSQL connected successfully (latency: ${dbHealth.latencyMs}ms).`);
  }

  app.listen(config.PORT, () => {
    console.log('==================================================');
    console.log(`  MediTrace Backend API started on port ${config.PORT}`);
    console.log(`  API Base: http://localhost:${config.PORT}/api`);
    console.log(`  Swagger Docs: http://localhost:${config.PORT}/api/docs`);
    console.log(`  Blockchain Mode: ${config.FABRIC_MODE}`);
    console.log('==================================================');
  });
}

bootstrap().catch(err => {
  console.error('[Server Fatal] Failed to bootstrap server:', err);
  process.exit(1);
});
