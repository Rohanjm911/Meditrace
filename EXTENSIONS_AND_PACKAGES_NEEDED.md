# MediTrace — Extensions and Packages Needed

A verified manifest of editor tooling, system runtimes, backend libraries, frontend dependencies, and non-Docker infrastructure components required for developing, executing, and packaging MediTrace on Windows.

---

## 1. Recommended Editor & Editor Extensions (VS Code / Antigravity IDE)

| Logo | Extension Name | Extension Identifier | Purpose | Status |
| :---: | :--- | :--- | :--- | :--- |
| <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/prisma/prisma-original.svg" width="22" height="22" alt="Prisma" /> | **Prisma** | `Prisma.prisma` | Syntax highlighting, schema formatting, and validation for `schema.prisma`. | Mandatory |
| <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/tailwindcss/tailwindcss-original.svg" width="22" height="22" alt="Tailwind CSS" /> | **Tailwind CSS IntelliSense** | `bradlc.vscode-tailwindcss` | Class autocomplete, hover preview, and linting for Tailwind CSS. | Mandatory |
| <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/eslint/eslint-original.svg" width="22" height="22" alt="ESLint" /> | **ESLint** | `dbaeumer.vscode-eslint` | Integrates ESLint rules into the editor. | Recommended |
| <img src="https://cdn.simpleicons.org/prettier/F7B93E" width="22" height="22" alt="Prettier" /> | **Prettier - Code formatter** | `esbenp.prettier-vscode` | Consistent code formatting across TypeScript, CSS, and JSON. | Recommended |
| <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/go/go-original.svg" width="22" height="22" alt="Go" /> | **Go** | `golang.go` | Syntax highlighting, code navigation, and vetting for Fabric chaincode in `blockchain/fabric/chaincode/`. | Optional |

---

## 2. Required System Software & Host Runtimes

| Logo | Component | Verified Version | Installation Command / Windows Path | Purpose |
| :---: | :--- | :--- | :--- | :--- |
| <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nodejs/nodejs-original.svg" width="22" height="22" alt="Node.js" /> | **Node.js** | `v20.x` or `v24.11.x` (Tested: `v24.11.1`) | Download installer from [nodejs.org](https://nodejs.org) or `winget install OpenJS.NodeJS.LTS` | Monorepo execution, API runtime, and Electron packaging. |
| <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/npm/npm-original-wordmark.svg" width="30" height="20" alt="npm" /> | **npm** | `v10.x` or `v11.5.x` (Tested: `11.5.2`) | Bundled with Node.js (`npm -v`) | Workspaces package manager. |
| <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/postgresql/postgresql-original.svg" width="22" height="22" alt="PostgreSQL" /> | **PostgreSQL** | `16.x` to `18.x` (Tested: `18.4`) | `C:\Program Files\PostgreSQL\18\bin` or `winget install PostgreSQL.PostgreSQL.18` | Persistent relational database. MediTrace manages a dedicated local cluster on port 5433 with trust auth. |
| <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/git/git-original.svg" width="22" height="22" alt="Git" /> | **Git for Windows** | `2.x+` (Tested: `2.50.1`) | `winget install Git.Git` | Version control. |
| <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/go/go-original.svg" width="22" height="22" alt="Go Toolchain" /> | **Go Toolchain** | `1.20+` | `winget install GoLang.Go` | Optional. Required only if compiling Go smart contracts directly on Windows. |
| <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/ubuntu/ubuntu-plain.svg" width="22" height="22" alt="WSL2 / Ubuntu" /> | **WSL2 (Ubuntu 22.04)** | Latest | `wsl --install -d Ubuntu-22.04` | Optional. Only needed if deploying a live multi-peer Fabric network natively without Docker. |

> **Note on Docker:** Docker and Docker Compose are strictly prohibited and not used anywhere in MediTrace.

---

## 3. Frontend Packages (`apps/desktop`)

Installed via npm workspace:

| Logo | Package | Version | Purpose |
| :---: | :--- | :--- | :--- |
| <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg" width="22" height="22" alt="React" /> | `react` & `react-dom` | `^18.3.1` | Core UI library. |
| <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/vitejs/vitejs-original.svg" width="22" height="22" alt="Vite" /> | `vite` | `^5.2.11` | High-speed frontend build tool & HMR server. |
| <img src="https://cdn.simpleicons.org/reactrouter/CA4245" width="22" height="22" alt="React Router" /> | `react-router-dom` | `^6.23.1` | Declarative routing across all 14 desktop screens. |
| <img src="https://cdn.simpleicons.org/reactquery/FF4154" width="22" height="22" alt="TanStack Query" /> | `@tanstack/react-query` | `^5.39.0` | Asynchronous server-state management & real-time cache polling. |
| <img src="https://cdn.simpleicons.org/reacthookform/EC5990" width="22" height="22" alt="React Hook Form" /> | `react-hook-form` & `@hookform/resolvers` | `^7.51.5` / `^3.4.2` | Type-safe form controllers and schema validation. |
| <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/tailwindcss/tailwindcss-original.svg" width="22" height="22" alt="Tailwind CSS" /> | `tailwindcss` | `^3.4.3` | Utility-first CSS framework configured for permanent Light Mode & 2px dark outlines. |
| <img src="https://cdn.simpleicons.org/lucide/F56565" width="22" height="22" alt="Lucide React" /> | `lucide-react` | `^0.379.0` | Professional icon set for pharmaceutical logistics. |
| <img src="https://cdn.simpleicons.org/chartdotjs/FF6384" width="22" height="22" alt="Recharts" /> | `recharts` | `^2.12.7` | Time-series charting for cold-chain temperature telemetry and threshold lines. |
| <img src="https://img.shields.io/badge/ZXing-Barcode-blue?logo=barcode&logoColor=white" height="20" alt="ZXing" /> | `@zxing/library` | `^0.20.0` | Barcode & optical image decoder for live webcam QR & GS1 DataMatrix codes. |
| <img src="https://img.shields.io/badge/QR-Generator-black?logo=qr-code&logoColor=white" height="20" alt="QR Code" /> | `qrcode` | `^1.5.3` | High-resolution SVG / Canvas QR matrix generator. |
| <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/tailwindcss/tailwindcss-original.svg" width="22" height="22" alt="Tailwind Merge" /> | `clsx` & `tailwind-merge` | `^2.1.1` / `^2.3.0` | Conditional class name concatenation utilities. |
| <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/electron/electron-original.svg" width="22" height="22" alt="Electron" /> | `electron` | `^30.0.9` | Windows desktop shell container with hardened security sandbox. |
| <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/electron/electron-original.svg" width="22" height="22" alt="Electron Builder" /> | `electron-builder` | `^24.13.3` | Standalone Windows NSIS installer packaging tool. |
| <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nodejs/nodejs-original.svg" width="22" height="22" alt="Node Utilities" /> | `wait-on` & `concurrently` | `^7.2.0` / `^8.2.2` | Multi-service synchronization for Electron development. |

---

## 4. Backend Packages (`apps/api`)

| Logo | Package | Version | Purpose |
| :---: | :--- | :--- | :--- |
| <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/express/express-original.svg" width="22" height="22" alt="Express" /> | `express` | `^4.19.2` | Robust HTTP application server. |
| <img src="https://img.shields.io/badge/Helmet-Security-24C882?logo=securityscorecard&logoColor=white" height="20" alt="Helmet" /> | `helmet` | `^7.1.0` | HTTP security headers. |
| <img src="https://cdn.simpleicons.org/curl/073551" width="22" height="22" alt="CORS" /> | `cors` | `^2.8.5` | Cross-Origin Resource Sharing control. |
| <img src="https://cdn.simpleicons.org/webauthn/000000" width="22" height="22" alt="Argon2" /> | `argon2` | `^0.40.1` | Secure password hashing algorithm (Argon2id RFC 9106). |
| <img src="https://cdn.simpleicons.org/jsonwebtokens/000000" width="22" height="22" alt="JWT" /> | `jsonwebtoken` | `^9.0.2` | Session authentication token generation and verification. |
| <img src="https://cdn.simpleicons.org/auth0/EB5424" width="22" height="22" alt="UUID" /> | `uuid` | `^9.0.1` | Cryptographically random UUID v4 identifier generation. |
| <img src="https://cdn.simpleicons.org/zod/3E67B1" width="22" height="22" alt="Zod" /> | `zod` | `^3.23.8` | Schema validation for all REST request bodies and queries. |
| <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/prisma/prisma-original.svg" width="22" height="22" alt="Prisma" /> | `@prisma/client` | `^5.14.0` | Type-safe database queries and migrations. |
| <img src="https://img.shields.io/badge/jsPDF-Engine-EC1C24?logo=adobe-acrobat-reader&logoColor=white" height="20" alt="jsPDF" /> | `jspdf` & `jspdf-autotable` | `^2.5.1` / `^3.8.2` | Formatted PDF regulatory report generation with vector charts. |
| <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/swagger/swagger-original.svg" width="22" height="22" alt="Swagger" /> | `swagger-ui-express` & `swagger-jsdoc` | `^5.0.0` / `^6.2.8` | Interactive OpenAPI documentation hosted at `/api/docs`. |
| <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/typescript/typescript-original.svg" width="22" height="22" alt="TSX" /> | `tsx` | `^4.10.5` | High-performance TypeScript execution in development. |

---

## 5. IoT Simulator Packages (`services/iot-simulator`)

| Logo | Package | Version | Purpose |
| :---: | :--- | :--- | :--- |
| <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/express/express-original.svg" width="22" height="22" alt="Express" /> | `express` | `^4.19.2` | REST control interface for the simulator. |
| <img src="https://cdn.simpleicons.org/dotenv/ECD53F" width="22" height="22" alt="Dotenv" /> | `dotenv` | `^16.4.5` | Environment variable loader. |
| <img src="https://cdn.simpleicons.org/curl/073551" width="22" height="22" alt="CORS" /> | `cors` | `^2.8.5` | Simulator HTTP control allowance. |

---

## 6. Testing & Quality Assurance Tooling

| Logo | Package | Version | Command | Purpose |
| :---: | :--- | :--- | :--- | :--- |
| <img src="https://cdn.simpleicons.org/vitest/6E9F18" width="22" height="22" alt="Vitest" /> | `vitest` | `^1.6.0` | `npm test` | Unit and integration testing engine. |
| <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/jest/jest-plain.svg" width="22" height="22" alt="Supertest" /> | `supertest` | `^7.0.0` | Used in tests | High-level HTTP assertions for Express endpoints. |
| <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/typescript/typescript-original.svg" width="22" height="22" alt="TypeScript" /> | `typescript` | `^5.4.5` | `npm run typecheck` | Strict static type checking. |

---

## 7. Future Hardware & Extensibility Dependencies (Optional)

When integrating physical hardware edge gateways:

| Logo | Component / Protocol | Ecosystem / Version | Purpose |
| :---: | :--- | :--- | :--- |
| <img src="https://cdn.simpleicons.org/mqtt/660066" width="22" height="22" alt="MQTT" /> | **MQTT Protocol** (`mqtt`) | `^5.6.0` (`npm install mqtt`) | Subscribing to Mosquitto brokers or MQTT telemetry topics. |
| <img src="https://cdn.simpleicons.org/espressif/E7352C" width="22" height="22" alt="ESP32" /> | **ESP32 Microcontroller** | Espressif ESP-WROOM-32 | Flashed with Arduino or ESP-IDF firmware sending JSON payloads via HTTP POST to `/api/telemetry/ingest`. |
| <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/arduino/arduino-original.svg" width="22" height="22" alt="Arduino / Sensors" /> | **DS18B20 / DHT22 Sensors** | 1-Wire Digital Bus | Digital cold-chain temperature and ambient humidity sensors connected to GPIO pins. |
| <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/raspberrypi/raspberrypi-original.svg" width="22" height="22" alt="Raspberry Pi" /> | **Raspberry Pi Edge Gateway** | Raspberry Pi OS | Local edge gateway running headless Node.js buffer service in transit vehicles. |
