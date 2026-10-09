# Authentication, RBAC, Administration & Anti-Automation Specification

Status: IMPLEMENTED & VERIFIED (via `server/src/auth/`, `server/src/admin/`, and test suites)

## 1. Authentication Architecture & Session Security
- **Algorithm**: PBKDF2 with SHA-512 and cryptographically secure per-user salt (16 bytes), 10,000 iterations, 64-byte key length.
- **Timing Safe**: Password verification uses `timingSafeEqual` over pre-computed buffers to eliminate timing attacks.
- **Session Tokens**: 32-byte cryptographically random hex strings with 24-hour expiration.
- **Session Revocation**: Active user sessions are immediately revoked upon explicit logout, password change, password reset, or account deactivation.
- **Transport Security**: Helmet security headers configured on all responses (`Content-Security-Policy`, `X-Content-Type-Options`, `Strict-Transport-Security`, `X-Frame-Options: SAMEORIGIN`).

## 2. Role-Based Access Control (RBAC) Matrix
The application models distinct account tiers:
1. `SUPER_ADMIN`:
   - Controls application-wide administration, system overview, and audit trails.
   - Can activate, deactivate, or delete user accounts.
   - Can create other `SUPER_ADMIN` accounts.
   - Safeguard: The system forbids deactivating, demoting, or deleting the last active `SUPER_ADMIN`.
2. `OWNER`:
   - Manages an authorized hotspot business tenant.
   - Manages their customers, access packages, and vouchers.
   - Can provision and manage `STAFF` operators within their business.
   - Cannot create or elevate users to `SUPER_ADMIN`.
3. `STAFF`:
   - Operational employee performing customer registrations, voucher validations, and viewing session status.
   - Cannot modify system settings, access packages, or administrative roles.
4. `CUSTOMER`:
   - End-user connected to the captive portal to purchase packages or redeem coupons.
   - Accesses only their personal session timers.

## 3. Secure Administrator Provisioning & Closed Bootstrap
- **Configured Super Administrator Credentials** (Provisioned via UI First-Run Bootstrap):
  - **Email**: `superadmin@gmail.com`
  - **Password**: `Superadmin@12345`
  - **Display Name**: `System Administrator`
  - **Business Name**: `System Administration`
  - **Role**: `SUPER_ADMIN`
  - **Default Currency**: `USD`
  - **Account ID**: `df02667c-93a2-4976-a482-ed1d987ae63e`
  - **State**: Verified active, authenticated with PBKDF2/SHA-512 + cryptographic salt.

- **Essential Environment Variables Reference**:
  - `PORT`: `3000` (Unified Express server port)
  - `NODE_ENV`: `development` | `production`
  - `APP_URL`: Public app base URL (e.g. `https://ais-dev-4pch7e7go4rvcwe5nzng64-364100045543.europe-west2.run.app`)
  - `CORS_ORIGIN`: Allowed origins for API requests (`http://localhost:5173,http://localhost:3000`)
  - `GEMINI_API_KEY`: Server-side API key for AI Copilot, anomaly detection, and forecasting
  - `INITIAL_ADMIN_EMAIL`: Initial admin provisioning email (`superadmin@gmail.com`)
  - `INITIAL_ADMIN_PASSWORD`: Initial admin provisioning password (`Superadmin@12345`)
  - `ADMIN_BOOTSTRAP_TOKEN`: Secret protection token for `/api/v1/admin/bootstrap` (`boot_sec_7a9f4c21e68b350d`)
  - `WEBHOOK_SECRET`: HMAC-SHA256 signature secret for verifying incoming payment callbacks (`dev_hotspot_webhook_secret_f839c04a`)
  - `DATABASE_URL`: Relational PostgreSQL 16 connection string (optional in development; uses in-memory repository layer by default)

- **Primary Super Administrator Provisioning**:
  - Environment variables: `INITIAL_ADMIN_EMAIL` and `INITIAL_ADMIN_PASSWORD` (min 8 characters).
  - Provisioned automatically on startup using a unique cryptographic random salt and PBKDF2/SHA-512 hashing (10,000 iterations).
  - No default production passwords are ever hardcoded in application source code.
- **First-Run Bootstrap**:
  - If no administrator exists in the database, `POST /api/v1/admin/bootstrap` opens to permit initial setup.
  - Can be further protected by `ADMIN_BOOTSTRAP_TOKEN` in the environment.
  - **Permanent Lockdown**: As soon as any `SUPER_ADMIN` is initialized, the endpoint permanently locks with `BOOTSTRAP_FAILED` ("System already initialized. Administrator bootstrap is closed.").
- **In-Dashboard Credential & Profile Updates**:
  - Administrators can update their account password (`POST /api/v1/auth/change-password`) after logging into the dashboard under Account Security. Old sessions are immediately revoked.
  - Administrators can update their email address and display name (`PUT /api/v1/owner/profile` / `PATCH /api/v1/admin/users/:id`), with strict email uniqueness validation.

## 4. Password Lifecycle & Anti-Automation Protection
- **Change Password**: Requires current password verification and validates new password (minimum 8 characters). Invalidates all existing sessions upon change.
- **Forgot Password**: Returns generic non-enumerating confirmation response (`"If the provided email is registered, password reset instructions have been sent."`).
- **Reset Token**: Single-use token with 15-minute expiration. Stored as SHA-256 hash. Marked used upon successful reset.
- **Anti-Automation Rate Limiting**: In-memory rate limiting tracks failed attempts per account. Enforces a 15-minute security lockout after 5 consecutive failed login attempts.

## 5. Responsive Application Shell
- **Responsive Layout**: Designed for mobile phones (320px+), tablets, and desktop browsers.
- **Collapsible Sidebar & Navigation**:
  - Desktop: Collapsible between 250px and 68px icon view.
  - Mobile: Sliding backdrop drawer toggled via navbar hamburger.
  - Role-aware links: Administration tabs hidden from unauthorized roles.
- **Logout Confirmation Dialog**: Accessible modal requiring explicit confirmation before calling `POST /api/v1/auth/logout`.
- **Honest Disclosures**: Live service capability matrix honestly discloses the status of all subsystems (Ready vs Planned) with explicit network reality advisories.
