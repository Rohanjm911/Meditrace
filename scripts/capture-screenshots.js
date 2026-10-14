/**
 * Automated UI Screenshot Capture Script for MediTrace
 * Launches a headless Electron browser, authenticates, navigates each portal,
 * and saves crisp high-resolution PNG screenshots to docs/images/
 */
import { app, BrowserWindow } from 'electron';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const imagesDir = path.join(rootDir, 'docs', 'images');

if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true });
}

app.whenReady().then(async () => {
  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: false
    }
  });

  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  try {
    // 1. Login Portal (Cyber-Pharma Dark Mode)
    console.log('[Screenshots] Capturing 1: Login Portal...');
    await win.loadURL('http://localhost:5173/#/login');
    await sleep(2000);
    let image = await win.webContents.capturePage();
    fs.writeFileSync(path.join(imagesDir, 'ui-login-portal.png'), image.toPNG());
    console.log('[Screenshots] Saved ui-login-portal.png');

    // Authenticate as Regulatory Administrator
    console.log('[Screenshots] Authenticating as Admin...');
    await win.webContents.executeJavaScript(`
      (async () => {
        const res = await fetch('http://localhost:4000/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: 'admin@meditrace.internal', password: 'Admin@123456' })
        });
        const data = await res.json();
        localStorage.setItem('meditrace_token', data.token);
        localStorage.setItem('meditrace_user', JSON.stringify(data.user));
        localStorage.setItem('meditrace_has_seen_guide', 'true');
        window.location.hash = '/';
      })()
    `);
    await sleep(2500);

    // 2. Command Dashboard (National Regulatory Authority)
    console.log('[Screenshots] Capturing 2: National Regulatory Command Center...');
    await win.loadURL('http://localhost:5173/#/');
    await sleep(2500);
    image = await win.webContents.capturePage();
    fs.writeFileSync(path.join(imagesDir, 'ui-dashboard-admin.png'), image.toPNG());
    console.log('[Screenshots] Saved ui-dashboard-admin.png');

    // 3. User Guide Modal Popup
    console.log('[Screenshots] Capturing 3: User Guide Modal...');
    await win.webContents.executeJavaScript(`
      window.dispatchEvent(new CustomEvent('meditrace:open-guide', { detail: { tab: 0 } }));
    `);
    await sleep(1500);
    image = await win.webContents.capturePage();
    fs.writeFileSync(path.join(imagesDir, 'ui-user-guide-modal.png'), image.toPNG());
    console.log('[Screenshots] Saved ui-user-guide-modal.png');

    // 4. Verification Page (Holographic HUD & GS1 DataMatrix Parser)
    console.log('[Screenshots] Capturing 4: Verification Scanner...');
    await win.loadURL('http://localhost:5173/#/verify');
    await sleep(2500);
    image = await win.webContents.capturePage();
    fs.writeFileSync(path.join(imagesDir, 'ui-verification-scanner.png'), image.toPNG());
    console.log('[Screenshots] Saved ui-verification-scanner.png');

    // 5. Cold-Chain Monitoring (GIS Route Map & Probes)
    console.log('[Screenshots] Capturing 5: Cold-Chain Route Map...');
    await win.loadURL('http://localhost:5173/#/cold-chain');
    await sleep(2500);
    image = await win.webContents.capturePage();
    fs.writeFileSync(path.join(imagesDir, 'ui-cold-chain-map.png'), image.toPNG());
    console.log('[Screenshots] Saved ui-cold-chain-map.png');

    // 6. Blockchain Ledger Explorer
    console.log('[Screenshots] Capturing 6: Blockchain Explorer...');
    await win.loadURL('http://localhost:5173/#/blockchain');
    await sleep(2500);
    image = await win.webContents.capturePage();
    fs.writeFileSync(path.join(imagesDir, 'ui-blockchain-ledger.png'), image.toPNG());
    console.log('[Screenshots] Saved ui-blockchain-ledger.png');

    console.log('[Screenshots] All 6 authentic UI screenshots captured successfully!');
  } catch (err) {
    console.error('[Screenshots] Capture error:', err);
  } finally {
    app.quit();
  }
});
