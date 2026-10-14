/**
 * MediTrace Non-Docker PostgreSQL Setup Helper
 * Automatically handles database detection, local non-admin cluster creation if port 5432 is locked,
 * database creation, and Prisma schema synchronization.
 */
import { execSync, spawnSync, spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const envPath = path.join(rootDir, '.env');
const envExamplePath = path.join(rootDir, '.env.example');

// Find PostgreSQL binaries
function findPgBinDir() {
  const commonPaths = [
    'C:\\Program Files\\PostgreSQL\\18\\bin',
    'C:\\Program Files\\PostgreSQL\\17\\bin',
    'C:\\Program Files\\PostgreSQL\\16\\bin',
    'C:\\Program Files\\PostgreSQL\\15\\bin',
    'C:\\Program Files\\PostgreSQL\\14\\bin',
  ];
  for (const p of commonPaths) {
    if (fs.existsSync(path.join(p, 'initdb.exe')) && fs.existsSync(path.join(p, 'pg_ctl.exe'))) {
      return p;
    }
  }
  return null;
}

const pgBinDir = findPgBinDir();

// Ensure .env exists
if (!fs.existsSync(envPath) && fs.existsSync(envExamplePath)) {
  fs.copyFileSync(envExamplePath, envPath);
  console.log('[Setup] Created .env from .env.example');
}

function readEnv() {
  if (!fs.existsSync(envPath)) return {};
  const content = fs.readFileSync(envPath, 'utf-8');
  const env = {};
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx !== -1) {
      const k = trimmed.substring(0, eqIdx).trim();
      const v = trimmed.substring(eqIdx + 1).trim();
      env[k] = v;
    }
  }
  return env;
}

function updateEnv(key, value) {
  let content = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf-8') : '';
  const regex = new RegExp(`^${key}=.*$`, 'm');
  if (regex.test(content)) {
    content = content.replace(regex, `${key}=${value}`);
  } else {
    content += `\n${key}=${value}\n`;
  }
  fs.writeFileSync(envPath, content, 'utf-8');
  console.log(`[Setup] Updated ${key} in .env`);
}

async function main() {
  console.log('====================================================');
  console.log('   MediTrace Database Initialization & Migration   ');
  console.log('====================================================');

  const currentEnv = readEnv();
  let dbUrl = currentEnv.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/meditrace';

  let canConnect5432 = false;
  if (pgBinDir) {
    const psql = path.join(pgBinDir, 'psql.exe');
    const testResult = spawnSync(psql, ['-U', 'postgres', '-h', 'localhost', '-p', '5432', '-c', 'SELECT 1;', '-w'], {
      env: { ...process.env, PGPASSWORD: 'postgres' },
      timeout: 3000
    });
    if (testResult.status === 0) {
      canConnect5432 = true;
      console.log('[Setup] Standard PostgreSQL on port 5432 is accessible.');
    }
  }

  if (!canConnect5432 && pgBinDir) {
    console.log('[Setup] Port 5432 requires custom credentials or is busy.');
    console.log('[Setup] Managing local dedicated PostgreSQL cluster on port 5433 (no Docker needed)...');

    const pgDataDir = path.join(rootDir, 'database', 'pgdata');
    const pgCtl = path.join(pgBinDir, 'pg_ctl.exe');
    const initdb = path.join(pgBinDir, 'initdb.exe');
    const createdb = path.join(pgBinDir, 'createdb.exe');
    const psql = path.join(pgBinDir, 'psql.exe');

    if (!fs.existsSync(pgDataDir)) {
      console.log('[Setup] Initializing dedicated PostgreSQL cluster at:', pgDataDir);
      spawnSync(initdb, ['-D', pgDataDir, '-U', 'postgres', '-A', 'trust'], { stdio: 'inherit' });
    }

    // Check if stale postmaster.pid exists while server is not reachable
    const pidFile = path.join(pgDataDir, 'postmaster.pid');
    if (fs.existsSync(pidFile)) {
      const pingTest = spawnSync(psql, ['-U', 'postgres', '-h', 'localhost', '-p', '5433', '-c', 'SELECT 1;'], { timeout: 2000 });
      if (pingTest.status !== 0) {
        try {
          const pidContent = fs.readFileSync(pidFile, 'utf-8');
          const oldPid = parseInt(pidContent.split('\n')[0].trim(), 10);
          if (oldPid) {
            const procCheck = spawnSync('tasklist', ['/FI', `PID eq ${oldPid}`], { encoding: 'utf-8' });
            if (!procCheck.stdout || !procCheck.stdout.includes(String(oldPid))) {
              console.log(`[Setup] Removing stale postmaster.pid (PID ${oldPid} is not active)...`);
              fs.unlinkSync(pidFile);
            }
          }
        } catch {
          // Ignore
        }
      }
    }

    // Check if cluster is already running and accepting connections on port 5433
    const pingResult = spawnSync(psql, ['-U', 'postgres', '-h', 'localhost', '-p', '5433', '-c', 'SELECT 1;'], { timeout: 3000 });
    if (pingResult.status !== 0) {
      const logFile = path.join(rootDir, 'database', 'postgres_server.log');
      spawnSync(pgCtl, ['start', '-w', '-t', '60', '-D', pgDataDir, '-l', logFile], {
        stdio: 'inherit'
      });
      // Wait until database is fully ready to accept connections (handling recovery/startup delay)
      let retries = 20;
      while (retries > 0) {
        const check = spawnSync(psql, ['-U', 'postgres', '-h', 'localhost', '-p', '5433', '-c', 'SELECT 1;'], { timeout: 2000 });
        if (check.status === 0) break;
        execSync('node -e "setTimeout(()=>{}, 1000)"');
        retries--;
      }
    } else {
      console.log('[Setup] Dedicated PostgreSQL cluster is already active on port 5433.');
    }

    // Ensure meditrace database exists
    spawnSync(createdb, ['-h', 'localhost', '-p', '5433', '-U', 'postgres', 'meditrace'], { stdio: 'ignore' });

    dbUrl = 'postgresql://postgres@localhost:5433/meditrace';
    updateEnv('DATABASE_URL', dbUrl);
  } else if (canConnect5432 && pgBinDir) {
    const createdb = path.join(pgBinDir, 'createdb.exe');
    spawnSync(createdb, ['-h', 'localhost', '-p', '5432', '-U', 'postgres', 'meditrace'], {
      env: { ...process.env, PGPASSWORD: 'postgres' },
      stdio: 'ignore'
    });
  }

  console.log('[Setup] Target DATABASE_URL:', dbUrl);
  process.env.DATABASE_URL = dbUrl;

  console.log('[Setup] Generating Prisma Client and synchronizing database schema...');
  try {
    execSync('npx prisma db push --schema=database/prisma/schema.prisma --accept-data-loss', {
      cwd: rootDir,
      env: { ...process.env, DATABASE_URL: dbUrl },
      stdio: 'inherit'
    });
    console.log('[Setup] Database schema push succeeded!');
  } catch (err) {
    console.error('[Setup] Prisma db push error:', err.message);
    process.exit(1);
  }

  console.log('[Setup] Database setup complete.');
}

main().catch((err) => {
  console.error('[Setup] Fatal error:', err);
  process.exit(1);
});
