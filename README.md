# Internet Coupon Hotspot — Technical Project Kernel

This repository contains the minimal, production-oriented technical kernel and landing environment for the proposed Android-first **Internet Coupon Hotspot** application.

> **IMPORTANT**: This is the technical baseline kernel, **not** the full application implementation. Application business features (coupon generation, customer records, session accounting, hotspot hardware control, payment processing) are intentionally deferred until the authoritative `.ai` instruction pack is uploaded.

---

## Technical Stack

- **Runtime & Backend**: Node.js, Express (`server.ts`)
- **Frontend**: React 19, TypeScript
- **Bundler & Tooling**: Vite, `@tailwindcss/vite`
- **Target Form Factor**: Android phones and tablets (responsive layout, ready for Capacitor/WebView packaging), and desktop inspection

---

## Project Structure

```text
├── index.html          # HTML entry point with synchronized metadata
├── metadata.json       # Applet title and capability definitions
├── package.json        # Dependencies and lifecycle scripts
├── tsconfig.json       # TypeScript compiler options (bundler mode, DOM + Node types)
├── vite.config.ts      # Vite configuration with Tailwind CSS plugin
├── server.ts           # Minimal full-stack entry point with /api/health & Vite dev middleware
├── src/
│   ├── main.tsx        # React client bootstrap
│   ├── App.tsx         # Responsive Technical Status & Boundary Verification page
│   └── index.css       # Tailwind CSS v4 entry point
├── .env.example        # Environment variable definitions
└── README.md           # This setup, execution, and verification guide
```

---

## Scripts & Execution

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Full-Stack Development Server
Starts the Express server with Vite dev middleware on port 3000:
```bash
npm run dev
```

### 3. Build for Production
Compiles TypeScript and creates optimized static assets in `/dist`:
```bash
npm run build
```

### 4. Run Production Server
Serves production assets and the `/api/health` endpoint:
```bash
npm run start
```

### 5. Type Check / Lint
Validates TypeScript typings across the client and server codebases:
```bash
npm run lint
```

---

## Technical Boundary & Health Check

The backend exposes a single health verification endpoint:

- **Method**: `GET`
- **Path**: `/api/health`
- **Response Format**: `application/json`
- **Example Response**:
  ```json
  {
    "status": "ok",
    "service": "internet-coupon-hotspot-kernel",
    "uptime": 42,
    "timestamp": "2026-10-09T17:15:00.000Z",
    "environment": "development",
    "nodeVersion": "v22.x",
    "androidReadiness": {
      "capacitorCompatible": true,
      "networkLayerSeparated": true,
      "businessLogicDeferred": true
    }
  }
  ```

---

## Next Steps for AI Coding Agent

1. **Awaiting User Action**: The user will upload the separately prepared Internet Coupon Hotspot `.ai` ZIP archive into the project root.
2. **Authority Rule**: Once uploaded, inspect the extracted instructions. Treat them as the authoritative specification. Do not overwrite or rewrite without architectural alignment.
