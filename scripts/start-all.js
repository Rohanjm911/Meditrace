/**
 * MediTrace Unified Startup Orchestrator (Windows Native Non-Docker)
 * Starts the local dedicated PostgreSQL cluster, Backend API, IoT Cold-Chain Simulator, and Desktop Shell.
 */
import { spawn, spawnSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('====================================================');
console.log('       Starting MediTrace System Environment        ');
console.log('    "Every Batch. Every Journey. Verified."         ');
console.log('====================================================');

// 1. Run db-setup to verify PostgreSQL is active and migrated
console.log('[Orchestrator] Ensuring PostgreSQL database is active...');
const dbSetupResult = spawnSync('node', ['scripts/db-setup.js'], {
  cwd: rootDir,
  stdio: 'inherit',
  shell: true
});
if (dbSetupResult.status !== 0) {
  console.error('[Orchestrator] Database setup check failed. Exiting.');
  process.exit(1);
}

// 1.1 Check if database has users, seed automatically if empty
try {
  console.log('[Orchestrator] Verifying database records...');
  const seedCheck = spawnSync('node', ['-e', `
    import('@prisma/client').then(async ({ PrismaClient }) => {
      const p = new PrismaClient();
      const count = await p.user.count();
      await p.$disconnect();
      process.exit(count === 0 ? 1 : 0);
    }).catch(() => process.exit(1));
  `], { cwd: rootDir, shell: true });

  if (seedCheck.status === 1) {
    console.log('[Orchestrator] Database is empty. Seeding multi-tenant demonstration data...');
    spawnSync('node', ['scripts/db-seed.js'], { cwd: rootDir, stdio: 'inherit', shell: true });
  } else {
    console.log('[Orchestrator] Database is primed with verified records.');
  }
} catch (err) {
  console.log('[Orchestrator] Note on seed check:', err.message);
}

const processes = [];

function startProcess(name, command, args, cwd) {
  console.log(`[Orchestrator] Launching ${name}...`);
  const child = spawn(command, args, {
    cwd,
    stdio: 'inherit',
    shell: true,
    env: { ...process.env }
  });

  child.on('error', (err) => {
    console.error(`[${name}] Failed to start:`, err);
  });

  child.on('exit', (code) => {
    console.log(`[${name}] Process exited with code ${code}`);
  });

  processes.push(child);
  return child;
}

// 2. Start Backend API
startProcess(
  'API Server',
  'npx',
  ['tsx', 'watch', 'apps/api/src/server.ts'],
  rootDir
);

// 3. Start IoT Simulator
startProcess(
  'IoT Simulator',
  'npx',
  ['tsx', 'watch', 'services/iot-simulator/src/index.ts'],
  rootDir
);

// 4. Start Desktop UI (Vite dev server)
startProcess(
  'Desktop Vite UI',
  'npx',
  ['vite', '--port', '5173'],
  path.join(rootDir, 'apps', 'desktop')
);

// Ensure dist-electron has CommonJS package.json
const distElectronPkg = path.join(rootDir, 'apps', 'desktop', 'dist-electron', 'package.json');
if (!fs.existsSync(distElectronPkg)) {
  fs.mkdirSync(path.dirname(distElectronPkg), { recursive: true });
  fs.writeFileSync(distElectronPkg, JSON.stringify({ type: 'commonjs' }, null, 2));
}

// 5. Start Electron Native Desktop Window (if not explicitly disabled)
if (process.env.NO_ELECTRON !== 'true') {
  setTimeout(() => {
    console.log('[Orchestrator] Launching Native Windows Electron Shell...');
    startProcess(
      'Electron Desktop Shell',
      'npx',
      ['electron', '.'],
      path.join(rootDir, 'apps', 'desktop')
    );
  }, 4000);
}

// Graceful shutdown handling
function cleanup() {
  console.log('\n[Orchestrator] Gracefully shutting down all MediTrace services...');
  for (const p of processes) {
    try {
      if (process.platform === 'win32' && p.pid) {
        spawnSync('taskkill', ['/pid', p.pid.toString(), '/t', '/f'], { stdio: 'ignore' });
      } else {
        p.kill();
      }
    } catch {
      // Ignore
    }
  }
  process.exit(0);
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

