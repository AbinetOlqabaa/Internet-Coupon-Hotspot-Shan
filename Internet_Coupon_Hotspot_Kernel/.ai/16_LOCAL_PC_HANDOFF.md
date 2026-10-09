# Local PC Handoff & Development Guide

This document is the authoritative handoff specification for extracting, installing, developing, and validating the **Internet Coupon Hotspot** platform on a local personal computer (PC/Mac/Linux workstation).

---

## 1. Current Architecture

- **Pattern**: Modular Monolith with clean boundary adapters.
- **Frontend SPA**: React 19 + TypeScript + Vite 6 + centralized CSS tokens (`theme.css`).
  - Supports responsive mobile, tablet, and desktop viewports.
  - PWA standard compliance with Web App Manifest, Service Worker caching, and in-app install UI.
- **Backend API**: Node.js 22 + Express 4.x + TypeScript + Helmet + CORS + Zod validation.
  - Server-authoritative session state machine with UTC duration clocks.
  - General ledger accounting with double-entry tracking and automated reconciliation.
  - Adapter architecture for Gateways (Limited Owner Mode vs Managed Gateway) and Payments (Sandbox, Cash Desk, Signed Webhooks).
  - Privacy-preserving AI Copilot with PII scrubber and multi-provider registry.
- **Persistence Layer**: Dual-mode data access:
  - In-memory thread-safe repository registry for zero-dependency rapid prototyping and automated testing.
  - PostgreSQL 16 compatible schema with sequentially numbered migrations (`001`, `002`, `003`).
- **Unified Entry Point (`server.ts`)**:
  - Unifies backend API and frontend Vite middleware on port 3000 in development.
  - Serves compiled static assets in production.

---

## 2. Directory Structure

```
├── .env.example                                  # Root environment variable template
├── index.html                                    # HTML entry point (SEO & PWA metadata)
├── metadata.json                                 # AI Studio project manifest
├── package.json                                  # Workspace scripts & unified dependencies
├── server.ts                                     # Unified Express + Vite server entry point
├── vite.config.ts                                # Vite configuration resolving client root
├── Internet_Coupon_Hotspot_Kernel/
│   ├── .ai/                                      # Product, architecture, and phase specifications
│   │   ├── 00_START_HERE.md
│   │   ├── 01_MASTER_ENGINEER.md
│   │   ├── 01_PRODUCT_CONTRACTS_SPEC.md
│   │   ├── 02_DATABASE_AND_BACKUP_SPEC.md
│   │   ├── 02_PRODUCT_AND_NETWORK_REALITY.md
│   │   ├── 03_ARCHITECTURE.md
│   │   ├── 03_AUTHENTICATION_AND_ADMIN_SPEC.md
│   │   ├── 04_DOMAIN_MODEL_AND_WORKFLOWS.md
│   │   ├── 05_SECURITY_PAYMENTS_PRIVACY.md
│   │   ├── 06_AI_ROUTING_AND_FEATURES.md
│   │   ├── 07_UI_UX_DESIGN_SYSTEM.md
│   │   ├── 08_TESTING_RELEASE.md
│   │   ├── 09_PHASE_PLAN.md
│   │   ├── 10_API_AND_ERRORS.md
│   │   ├── 11_COMPLETION_GATES.md
│   │   ├── 12_DEPLOYMENT.md
│   │   ├── 13_CURRENT_IMPLEMENTATION_STATUS.md
│   │   ├── 14_CHANGELOG.md
│   │   ├── 15_DECISIONS_AND_OPEN_QUESTIONS.md
│   │   ├── 16_LOCAL_PC_HANDOFF.md               # (This file)
│   │   ├── 17_ANDROID_PACKAGING_SPEC.md
│   │   └── 19_DEPLOYMENT_RUNBOOK_AND_COMPATIBILITY_MATRIX.md
│   ├── capacitor.config.ts                       # Capacitor Android hybrid configuration
│   ├── docker-compose.yml                        # Local PostgreSQL 16 container definition
│   ├── client/                                   # Frontend React SPA
│   │   ├── index.html
│   │   ├── public/                               # PWA manifest & SVG brand icons
│   │   └── src/
│   │       ├── App.tsx                           # Operator dashboard shell
│   │       ├── components/                       # Modular view controllers
│   │       ├── styles.css                        # Responsive styles & layout
│   │       └── theme.css                         # Centralized CSS design tokens
│   └── server/                                   # Backend Express REST API
│       ├── .env.example
│       └── src/
│           ├── admin/                            # SuperAdmin console & user management
│           ├── ai/                               # Privacy scrubber, provider registry & copilot
│           ├── analytics/                        # Revenue, session, retention & CSV exports
│           ├── auth/                             # PBKDF2/SHA-512, tokens & rate limits
│           ├── contracts/                        # Integer money math & state machines
│           ├── coupons/                          # Voucher issuance & validation
│           ├── customers/                        # Customer registration & consent
│           ├── db/                               # Repositories & SQL migrations
│           │   └── migrations/
│           │       ├── 001_initial_schema.sql
│           │       ├── 002_user_management_and_roles.sql
│           │       └── 003_notifications_loyalty_and_ai.sql
│           ├── gateway/                          # Gateway adapters & event webhooks
│           ├── loyalty/                          # Customer segmentation & bounded bonuses
│           ├── notifications/                    # In-app, portal toast & retry engine
│           ├── owner/                            # Hotspot owner profile & dashboard
│           ├── packages/                         # Access package catalog
│           ├── payments/                         # Cash desk, sandbox & signed webhooks
│           └── sessions/                         # Session state clocks & captive portal
```

---

## 3. Runtime & Toolchain Requirements

- **Node.js**: `v20.x` or `v22.x` (LTS recommended).
- **npm**: `v10.x` or higher.
- **Git**: For version control tracking.
- **PostgreSQL (Optional for production)**: Version 16.x or Docker engine.
- **Android Studio (Optional for native APK build)**: Ladybug / Iguana with Android SDK 34/35.

---

## 4. Local Setup Commands

```bash
# 1. Clone or extract project archive into local workspace
git clone <repository_url> hotspot-app
cd hotspot-app

# 2. Install workspace dependencies
npm install

# 3. Create environment configuration
cp .env.example .env
```

---

## 5. Environment Variables Reference

| Variable | Required In | Default / Configured | Description |
|---|---|---|---|
| `PORT` | Dev / Prod | `3000` | Port for the unified server |
| `NODE_ENV` | All | `development` | Environment mode (`development`, `test`, `production`) |
| `APP_URL` | Dev / Prod | `https://ais-dev-4pch7e7go4rvcwe5nzng64-364100045543.europe-west2.run.app` | Public canonical base URL |
| `CORS_ORIGIN` | Dev / Prod | `http://localhost:5173,http://localhost:3000` | Allowed origin header matching |
| `INITIAL_ADMIN_EMAIL` | Optional / Configured | `superadmin@gmail.com` | Email for automated initial SuperAdmin setup |
| `INITIAL_ADMIN_PASSWORD` | Optional / Configured | `Superadmin@12345` | Password for automated SuperAdmin (min 8 chars) |
| `ADMIN_BOOTSTRAP_TOKEN` | Optional | `boot_sec_7a9f4c21e68b350d` | Secret token required to run `/api/v1/admin/bootstrap` |
| `WEBHOOK_SECRET` | Prod | `dev_hotspot_webhook_secret_f839c04a` | HMAC-SHA256 signature key for incoming payment webhooks |
| `DATABASE_URL` | Optional (Prod) | `""` | PostgreSQL connection string (defaults to in-memory repos) |
| `GEMINI_API_KEY` | Optional | Server-configured | Google Gemini API key for AI Copilot |

### Configured Administrator Credentials (for local testing & reference):
- **Email**: `superadmin@gmail.com`
- **Password**: `Superadmin@12345`
- **Role**: `SUPER_ADMIN`
- **Display Name**: `System Administrator`
- **Business Name**: `System Administration`

---

## 6. Database Initialization & Migrations

For in-memory development and test execution, no database configuration is required.

To run against a local PostgreSQL database:
```bash
# Start PostgreSQL via docker-compose
cd Internet_Coupon_Hotspot_Kernel
docker compose up -d postgres

# Apply sequential SQL migrations using psql
export PGPASSWORD=hotspot_dev_secret
psql -h localhost -p 5432 -U hotspot -d hotspot_db -f server/src/db/migrations/001_initial_schema.sql
psql -h localhost -p 5432 -U hotspot -d hotspot_db -f server/src/db/migrations/002_user_management_and_roles.sql
psql -h localhost -p 5432 -U hotspot -d hotspot_db -f server/src/db/migrations/003_notifications_loyalty_and_ai.sql
```

---

## 7. Execution Commands

### Development Server
```bash
# Start unified dev server on http://localhost:3000
npm run dev
```

### Running Tests
```bash
# Run all server and client test suites
npm test
```

### Static Analysis
```bash
# Check TypeScript types across the entire project
npm run lint
```

### Production Build
```bash
# Compile client assets into dist/
npm run build

# Start production server
NODE_ENV=production npm run start
```

---

## 8. Administrator Provisioning Workflow

1. **Option A — Automated First-Run Setup via `.env`**:
   - Set `INITIAL_ADMIN_EMAIL="admin@yourdomain.com"` and `INITIAL_ADMIN_PASSWORD="YourStrongPassword123!"` in `.env`.
   - Start the server (`npm run dev`).
   - The platform creates the `SUPER_ADMIN` account with random salt PBKDF2/SHA-512 hashing.
2. **Option B — Web Setup Mode**:
   - Leave `INITIAL_ADMIN_PASSWORD` blank.
   - Start the server and navigate to `http://localhost:3000`.
   - The login screen detects `adminBootstrapOpen: true` and displays **"⚙ First-Run Setup: Initialize SuperAdmin"**.
   - Fill in email, display name, and password (min 8 characters).
   - Once submitted, `/api/v1/admin/bootstrap` provisions the administrator and **locks permanently**.

---

## 9. Gateway & Hardware Reality Disclosures

1. **Mode A: Limited Owner Mode (Built-in Android Hotspot)**:
   - Does not require router hardware.
   - Operating reality: The Android OS controls WiFi tethering; individual client disconnects and per-client hardware throttling cannot be enforced by user-space applications.
   - Session duration is monitored via server-authoritative timestamps.
2. **Mode B: Managed Gateway Mode (Hardware Router)**:
   - For real-world captive portal enforcement, connect to a MikroTik RouterOS, OpenWrt, or RADIUS gateway.
   - Adapter boundaries are implemented in `server/src/gateway/adapters/`.
   - Test suites utilize `MockTestGatewayAdapter` (marked TEST ONLY).

---

## 10. Android Packaging with Capacitor

To build an Android APK locally:
```bash
cd Internet_Coupon_Hotspot_Kernel

# Install Capacitor CLI
npm install -g @capacitor/cli

# Build web distribution
npm run build

# Add Android platform and sync assets
npx cap add android
npx cap sync android

# Open in Android Studio
npx cap open android
```
- Refer to `.ai/17_ANDROID_PACKAGING_SPEC.md` for required Android manifest permissions and background execution boundaries.

---

## 11. Acceptance & Release Gates Summary

| Gate | Scope | Status | Evidence |
|---|---|---|---|
| **GATE 1** | Source & architecture audit | **PASS** | Full audit completed; directory & module inventory verified |
| **GATE 2** | Critical credentials & security | **PASS** | Hardcoded passwords eliminated; random salt PBKDF2; closed bootstrap |
| **GATE 3** | Database migrations & integrity | **PASS** | Migrations 001, 002, 003 verified via `migrations.test.ts` |
| **GATE 4** | Authentication & RBAC | **PASS** | 4-tier roles, rate limiting, session revocation verified |
| **GATE 5** | Core business workflows | **PASS** | Packages, vouchers, customers, cash desk verified |
| **GATE 6** | Payment & session state clocks | **PASS** | UTC duration clocks, idempotency, ledger reconciliation verified |
| **GATE 7** | Gateway boundaries & reality | **PASS** | Mode A/B disclosures honest; adapters verified via tests |
| **GATE 8** | Analytics, notifications, AI | **PASS** | CSV exports, toast notifications, PII scrubbed Copilot verified |
| **GATE 9** | PWA & browser experience | **PASS** | Manifest, offline detection, install button, theme tokens verified |
| **GATE 10** | Production build & clean start | **PASS** | `npm run build` clean; unified server runs on port 3000 |
| **GATE 11** | Deployment & recovery runbook | **PASS** | Documented in `.ai/19_...` and `.ai/02_...` |
| **GATE 12** | Local PC handoff package | **PASS** | Complete step-by-step handoff documented in `.ai/16_...` |
