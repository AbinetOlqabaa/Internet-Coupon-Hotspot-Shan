# Internet Coupon Hotspot — Kernel

This is a minimal full-stack landing pad, not the complete application. It establishes a React/TypeScript frontend, Express/TypeScript API, centralized design tokens, health check, and autonomous build instructions in `.ai/`.

## Important network limitation
An ordinary Android application cannot universally control the system hotspot, disconnect individual clients, apply per-client speed limits, or obtain reliable per-client traffic accounting. Genuine enforcement requires a compatible managed gateway/router or a specifically supported privileged integration. Never simulate enforcement or claim it has happened without confirmation.

## Administrator Provisioning
- Configure `INITIAL_ADMIN_EMAIL` and `INITIAL_ADMIN_PASSWORD` in `.env`, or complete first-run setup via the web interface / `POST /api/v1/admin/bootstrap`.
- The bootstrap endpoint is open only on first run when no super administrator exists, and permanently locks once initialized.
- Passwords are securely hashed with per-user cryptographic random salts using PBKDF2/SHA-512. Update credentials anytime from the Admin Dashboard > Account Security tab.

## Run
Requires Node.js 20+ and npm. In two terminals:

```sh
cd server && npm install && cp .env.example .env && npm run dev
```
```sh
cd client && npm install && npm run dev
```

API health: `http://localhost:4000/api/v1/health`. Run `npm test` and `npm run build` in each package. The kernel has no business database, authentication, payments, gateway integration, or AI integration yet. Do not call it production-ready until the `.ai/` completion gates pass. Start with `.ai/00_START_HERE.md`.
