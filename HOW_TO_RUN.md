# MediTrace — How to Run Guide (Windows Native Non-Docker)

**Tagline:** Every Batch. Every Journey. Verified.  
**Platform:** Windows 10 / 11 64-bit  
**Docker Status:** Strictly Prohibited & Zero Docker Required.

---

## 1. Prerequisites & Verified System Requirements

| Tool / Runtime | Required / Verified Version | Purpose |
| :--- | :--- | :--- |
| **Node.js** | `v20.x` or `v24.11.x` (Verified: `v24.11.1`) | Monorepo runtime, Express API, Electron & Vite |
| **npm** | `v10.x` or `v11.5.x` (Verified: `v11.5.2`) | Workspaces package manager |
| **PostgreSQL** | `18.x` or `16.x+` (Verified: `18.4` at `C:\Program Files\PostgreSQL\18`) | Authoritative relational database for all transactions |
| **Git** | `2.x+` (Verified: `2.50.1`) | Version control |
| **Go** (Optional for Chaincode) | `1.20+` | Go toolchain if compiling Fabric chaincode locally |
| **WSL2 / Linux VM** (Optional for Live Fabric) | Ubuntu 22.04 LTS | Only if running a live multi-peer Hyperledger Fabric cluster without Docker |

---

## 2. Fast Track — Single Double-Click Startup

If first-time setup has been completed, you can double-click **`RUN_MEDITRACE.bat`** in the project root directory.

It will:
1. Verify Node.js and PostgreSQL presence.
2. Initialize or verify the dedicated local database on port 5433.
3. Synchronize database tables via Prisma.
4. Launch the Backend API (`http://localhost:4000`), the IoT Cold-Chain Simulator (`http://localhost:4001`), and the Desktop interface (`http://localhost:5173`).

---

## 3. First-Time Setup Instructions (Step by Step)

### Step 3.1: Install Dependencies
Open PowerShell or Command Prompt in the project root:
```powershell
npm install
```
This installs all monorepo workspace packages (`@meditrace/shared-types`, `@meditrace/api`, `@meditrace/desktop`, and `@meditrace/iot-simulator`).

### Step 3.2: Environment Configuration
Copy `.env.example` to `.env` if not already present:
```powershell
Copy-Item .env.example .env
```
Default configuration values:
- `PORT=4000`
- `DATABASE_URL="postgresql://postgres@localhost:5433/meditrace"`
- `JWT_SECRET="meditrace-secure-production-ready-jwt-secret-key-32chars"`
- `FABRIC_MODE="DEMO_INTEGRITY"`
- `IOT_SIMULATOR_PORT=4001`

### Step 3.3: Database Initialization & Migration
Run the automated non-Docker database setup helper:
```powershell
npm run db:setup
```
This script automatically:
1. Checks if standard PostgreSQL port 5432 is accessible.
2. If 5432 requires custom credentials or is busy, it provisions a dedicated local cluster in `database/pgdata` on port `5433` with trust authentication (requires ZERO administrator privileges).
3. Creates the `meditrace` catalog.
4. Deploys the Prisma schema and creates all 14 database tables.

### Step 3.4: Populate Seed Data (Demo Accounts & Batches)
Seed demonstration users, products, lots with SHA-256 hashes, shipments, and simulated sensors:
```powershell
npm run db:seed
```

### Preconfigured Enterprise Demo Logins:
All demo passwords use Argon2id cryptographic hashing. The login page provides an instant **1-Click Quick Role Switcher** with high-contrast buttons for rapid testing without entering credentials.

| Role | Email | Password | Organization | Operational Capabilities |
| :--- | :--- | :--- | :--- | :--- |
| **Administrator** | `admin@meditrace.internal` | `Admin@123456` | National Regulatory Authority | Full system oversight, 21 CFR audits, user provisioning |
| **Manufacturer** | `manufacturer@pfizer-demo.com` | `Mfg@123456` | Pfizer Bio-Pharma Labs | Create medicine batches, print serialized QR labels, initiate dispatches |
| **Distributor** | `distributor@medexpress.com` | `Dist@123456` | MedExpress Cold Logistics | Manage reefer fleet, sign handoffs, monitor in-transit telemetry |
| **Warehouse Operator** | `warehouse@nordic-hub.com` | `Wh@123456` | Nordic Central Vaccine Depot | Inward dock acceptance, ULT freezer probes, excursion handling |
| **Pharmacist** | `pharmacist@apollo-central.com` | `Pharm@123456` | Apollo Central Healthcare Pharmacy | GS1/QR product verification, patient dispensing, zero-trust validation |

---

## 4. Interactive Live Testing Guide

### ☀️ UI Theme & Design System
Medi Trace operates in **Permanent Light Mode** with an **Industrial High-Contrast Outlined Aesthetic** (`border-2 border-slate-900`). All cards, modal dialogs, status badges, and input elements are rendered on clean white (`#ffffff`) or light slate (`#f8fafc`) surfaces with crisp 2px dark outlines to ensure 100% legibility in laboratory and warehouse environments.

### 🧪 Verification Scenarios (`/verify`)
Navigate to **Verify Product (QR/GS1)** in the sidebar to test:
1. **Authentic Vaccine Verification:** Click the preset button for `VAC-2026-089A` or scan its QR code to verify canonical SHA-256 match and provenance trail on the ledger.
2. **GS1 DataMatrix Parsing:** Test `(01)00300010034567(17)271010(10)VAX-2026-104B(21)SN20489912` to see automated AI identifier decomposition (GTIN, Expiration, Batch, Serial).
3. **Excursion Detection:** Test `ROT-2026-441D` to inspect temperature boundary breach alerts.
4. **Counterfeit Blocking:** Test `FAKE-COUNTERFEIT-BATCH-9999` to witness the zero-trust ledger rejection guide.
5. **Hardware Optical Scanner:** Click **Camera Input**, authorize the 21 CFR Part 11 consent dialog, and scan physical pharmaceutical barcodes in real-time.

### ❄️ Cold-Chain & Route Map (`/cold-chain`)
1. Click nodes on the **Interactive GIS Route Map** to inspect cargo payloads, active vehicles, and telemetry readings.
2. Use the live simulation controls in the top banner:
   - **Trigger Excursion:** Injects a spike above 8.0°C to test acoustic alerts and red excursion toasts.
   - **Stabilize Temp:** Returns sensors to compliant corridor temperatures (e.g. 4.2°C).
   - **Simulate Transit Drain:** Tests sensor battery drop warnings.

### 📑 21 CFR Part 11 Regulatory PDF Dossiers (`/reports`)
Navigate to **Reports & Export** to generate publication-grade regulatory dossiers with vector charts and digital attestations:
- **Batches & Lot Serialization Dossier**
- **Chain-of-Custody Manifest Dossier**
- **Cold-Chain IoT Telemetry & Excursions Dossier**
- **Audit Logs & Security Integrity Dossier**

---

## 5. Running the Application

### Option A: Unified Launcher (Recommended)
```powershell
npm run dev
```
Starts Backend API, IoT Simulator, and Desktop Vite UI simultaneously.

### Option B: Running Services Individually
- **Terminal 1 (Backend API):**
  ```powershell
  npm run dev:api
  ```
  API runs on `http://localhost:4000`. Swagger API documentation is available at `http://localhost:4000/api/docs`.
- **Terminal 2 (IoT Cold-Chain Simulator):**
  ```powershell
  npm run dev:simulator
  ```
  Simulator service runs on `http://localhost:4001`.
- **Terminal 3 (Desktop UI):**
  ```powershell
  npm run dev:desktop
  ```
  Desktop UI starts on `http://localhost:5173`.
- **Terminal 4 (Electron Shell):**
  ```powershell
  npm run --workspace=@meditrace/desktop dev:electron
  ```

### Option C: Standalone Windows Native Executable & Installer (.exe)

MediTrace is packaged as a native standalone Windows desktop application that can run directly without a browser or Vite dev server:

#### 📍 Exact File Locations:
| Format | Relative Path | Size | Description |
| :--- | :--- | :---: | :--- |
| **Portable Standalone App** | [`apps/desktop/release/win-unpacked/MediTrace.exe`](file:///d:/projects%20and%20certificates/projects/block/Meditrace/apps/desktop/release/win-unpacked/MediTrace.exe) | **177 MB** | Direct portable executable. Double-click to launch immediately without installation. |
| **Windows Setup Installer** | [`apps/desktop/release/MediTrace Setup 1.0.0.exe`](file:///d:/projects%20and%20certificates/projects/block/Meditrace/apps/desktop/release/MediTrace%20Setup%201.0.0.exe) | **84.5 MB** | Official NSIS Windows setup wizard with customizable destination directory. |

#### Direct Launch Command:
```powershell
& ".\apps\desktop\release\win-unpacked\MediTrace.exe"
```

#### To Rebuild the Executables:
```powershell
npm run package:win
```

---

## 6. Running Automated Tests

Run the Vitest test suite covering cryptographic hashing, GS1 DataMatrix parsing, role boundaries, and API endpoints:
```powershell
npm test
```
To run type checking across all packages:
```powershell
npm run typecheck
```

---

## 7. Hyperledger Fabric Deployment (Non-Docker Architecture)

### Operating Mode 1: `DEMO_INTEGRITY` (Default on Windows)
Because Hyperledger Fabric core peer and orderer binaries are compiled natively for Linux, running a native live Fabric network on Windows without Docker requires WSL2 or a Linux VM.

In `DEMO_INTEGRITY` mode:
- The system executes **genuine SHA-256 canonical hashing** for all batch registrations and handoff custody transfers.
- It records transaction records in the immutable `blockchain_transactions` table with block heights, function calls, and multi-org endorsement records.
- The UI and reports clearly display `Mode: DEMO_INTEGRITY` so mock transactions are **never misrepresented as live confirmations**.

### Operating Mode 2: `FABRIC_LIVE` (Native Linux / WSL2)
To run a live Fabric network natively without Docker:
1. In WSL2 Ubuntu 22.04 LTS:
   ```bash
   sudo apt-get update && sudo apt-get install -y curl git golang-go jq
   # Download Hyperledger Fabric v2.5.9 binary release
   curl -sSLO https://github.com/hyperledger/fabric/releases/download/v2.5.9/hyperledger-fabric-linux-amd64-2.5.9.tar.gz
   tar -xzf hyperledger-fabric-linux-amd64-2.5.9.tar.gz
   export PATH=$PATH:$(pwd)/bin
   ```
2. Start native peer and orderer daemons following `blockchain/fabric/README.md`.
3. Deploy the chaincode from `blockchain/fabric/chaincode/meditrace_contract.go`.
4. Update `.env` on Windows:
   ```env
   FABRIC_MODE="FABRIC_LIVE"
   FABRIC_GATEWAY_ENDPOINT="localhost:7051"
   ```

---

## 8. Packaging the Windows Desktop Application

To compile and package MediTrace into a standalone Windows installer:
```powershell
npm run package:win
```
The resulting NSIS installer will be output to `apps/desktop/release/MediTrace Setup 1.0.0.exe`.

---

## 9. Troubleshooting Common Errors

### 1. Database Connection Refused (`port 5433` or `5432`)
- Ensure PostgreSQL 18 is installed at `C:\Program Files\PostgreSQL\18`.
- If the local cluster stopped, re-run `npm run db:setup` to start it.
- Check `database/pgdata/postgres.log` for details.

### 2. Port Conflict (`4000`, `4001`, or `5173` already in use)
Find and terminate the occupying process in PowerShell:
```powershell
Get-NetTCPConnection -LocalPort 4000, 4001, 5173 -ErrorAction SilentlyContinue | Select-Object OwningProcess
Stop-Process -Id <PID> -Force
```

### 3. Missing `.env` File
Run `Copy-Item .env.example .env` in the root directory.

### 4. Prisma Client Out of Sync
Run:
```powershell
npx prisma generate --schema=database/prisma/schema.prisma
```
