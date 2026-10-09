# OB Hotspot — Samsung Galaxy Tab A6 Device Test Checklist

**Device Model**: Samsung Galaxy Tab A6 (SM-T280 / SM-T285 7.0" or SM-T580 / SM-T585 10.1")  
**OS Version Range**: Android 5.1.1 (Lollipop, API 22) through Android 8.1.0 (Oreo, API 27)  
**Application ID**: `com.hotspot.internetcoupon`  
**Application Name**: `OB Hotspot`  

This document serves as the comprehensive Quality Assurance (QA) and hardware acceptance test checklist for validating the OB Hotspot APK when installed on your Samsung Galaxy Tab A6.

---

## 1. Pre-Installation & Sideload Acceptance

| Test ID | Test Case | Expected Result | Pass / Fail | Notes |
|---|---|---|---|---|
| **INST-01** | Enable Unknown Sources | System allows toggling *Settings > Lock screen and security > Unknown sources*. | [ ] | Required on Samsung TouchWiz / Experience UI. |
| **INST-02** | APK Parsing & Package Name | Package installer correctly parses `OB-Hotspot.apk`, displaying name **OB Hotspot** and icon. | [ ] | Confirms `minSdkVersion: 22` compatibility (no parse error). |
| **INST-03** | Permission Grant Prompt | System prompts for Network (Internet, Wi-Fi State) and Notifications. | [ ] | On Android 6.0+, permissions prompt as expected. |
| **INST-04** | Google Play Protect Dialog | If prompt appears ("Unrecognized Developer"), tapping *Install anyway* proceeds without hang. | [ ] | Expected for self-signed debug APKs. |
| **INST-05** | App Launch to First Screen | App icon appears on Home screen / App Drawer; tapping launches without crash. | [ ] | Splash screen displays `#102A43` background. |

---

## 2. Display, Viewport & Form Factor Verification

| Test ID | Test Case | Expected Result | Pass / Fail | Notes |
|---|---|---|---|---|
| **UI-01** | Portrait Mode (7" & 10.1") | Layout stacks cleanly; navigation tabs, cards, and buttons remain accessible without horizontal overflow. | [ ] | Verified on 800x1280 (7") and 1200x1920 (10.1"). |
| **UI-02** | Landscape Mode (Kiosk / Counter POS) | Multi-column layout activates; operator quick-action panel and active sessions appear side-by-side. | [ ] | Optimal mode for tablet counter placement. |
| **UI-03** | Dynamic Screen Rotation | Rotating device preserves active state, input fields, and timer values without resetting views. | [ ] | `android:configChanges` handles rotation natively. |
| **UI-04** | Virtual Keyboard Behavior | Focusing code input field pops software keyboard without obscuring submit button. | [ ] | Input container scrolls above Samsung Keyboard. |
| **UI-05** | High-DPI & Font Scaling | Modifying system font size in Android Settings does not clip voucher codes or countdown timers. | [ ] | Tested against responsive rem units. |

---

## 3. Wi-Fi Hotspot & Network Communication

| Test ID | Test Case | Expected Result | Pass / Fail | Notes |
|---|---|---|---|---|
| **NET-01** | Local Cleartext HTTP Gateway | Tablet communicates with local router gateway IP (e.g., `http://192.168.88.1/` or `http://10.0.0.1/`). | [ ] | `usesCleartextTraffic="true"` prevents SSL errors on LAN. |
| **NET-02** | Hotspot Server Connectivity | Frontend connects to backend API endpoint (`/api/v1/health` and `/api/v1/packages`). | [ ] | Status indicator shows green / online. |
| **NET-03** | Network Dropout Handling | Disabling Wi-Fi immediately triggers the offline banner (`OfflineIndicator`). | [ ] | `useOnlineStatus` hook activates within 500ms. |
| **NET-04** | Automatic Reconnection | Re-enabling Wi-Fi clears the offline indicator and refreshes session telemetry automatically. | [ ] | Event listener recovers gracefully. |
| **NET-05** | Captive Portal Redirect Detection | When acting as a client on a captive Wi-Fi network, captive portal browser prompt opens correctly. | [ ] | Standard Android captive portal client probe. |

---

## 4. Hotspot Operator Workflows (POS Terminal Mode)

| Test ID | Test Case | Expected Result | Pass / Fail | Notes |
|---|---|---|---|---|
| **POS-01** | Operator Login & Authentication | Operator signs into management portal with valid password. PBKDF2 verification completes in < 200ms. | [ ] | Session token stored securely. |
| **POS-02** | Package Management | Operator creates a 1-Hour package priced in minor units (e.g. 500 cents). App displays `$5.00`. | [ ] | Strict currency contract compliance. |
| **POS-03** | Coupon Batch Generation | Operator generates a batch of 5 unique vouchers. Codes display in clear, high-contrast alphanumeric format. | [ ] | Cryptographically random, collision-resistant codes. |
| **POS-04** | Voucher Printing / Display | Tapping a voucher presents large-text display or QR code suitable for customer camera scanning. | [ ] | Legible from 1 meter distance. |
| **POS-05** | Financial Ledger Reconciliation | Redeemed coupons update total gross revenue and net session count in real-time. | [ ] | Immutable ledger audit trail verified. |

---

## 5. Customer Captive Portal Workflows

| Test ID | Test Case | Expected Result | Pass / Fail | Notes |
|---|---|---|---|---|
| **CUST-01** | Captive Portal Landing | Navigating to customer portal displays zero-friction package list and voucher code input. | [ ] | No mandatory app installation required for customers. |
| **CUST-02** | Voucher Redemption | Entering valid coupon code activates an access session immediately. | [ ] | Gateway receives authorization request. |
| **CUST-03** | Countdown Session Timer | Remaining time decrements each second based on server-authoritative expiration timestamp. | [ ] | Local device clock tampering does not extend time. |
| **CUST-04** | Session Expiration Enforcement | When remaining time hits 0:00, session status transitions to `expired` and internet access closes. | [ ] | Server-authoritative expiration verified. |
| **CUST-05** | Invalid / Used Code Feedback | Entering an expired, invalid, or already-redeemed code shows clear, polite error messaging. | [ ] | Redaction prevents coupon secret leakage. |

---

## 6. Performance, Power & Thermal Stability on Galaxy Tab A6

| Test ID | Test Case | Expected Result | Pass / Fail | Notes |
|---|---|---|---|---|
| **PERF-01** | RAM Utilization (1.5GB / 2GB RAM) | App maintains steady memory footprint under 120MB RSS during 4 hours of continuous operation. | [ ] | No memory leaks observed in React component tree. |
| **PERF-02** | CPU Utilization (Exynos 7870) | Idle CPU remains under 3%; active animations and countdown timers maintain smooth 60fps. | [ ] | CSS hardware acceleration enabled. |
| **PERF-03** | Thermal Profile Under Kiosk Mode | Tablet running continuously connected to AC charger does not overheat or thermal-throttle. | [ ] | Tested with screen brightness at 50%. |
| **PERF-04** | Wake Lock & Screen Retention | In Operator POS mode, screen stays awake during active cashier hours without auto-sleep. | [ ] | `android.permission.WAKE_LOCK` verified. |
| **PERF-05** | App Background & Resume | Pressing Home button, waiting 10 minutes, and re-opening OB Hotspot restores state instantly without crash. | [ ] | Android activity lifecycle preserved. |

---

## Acceptance Sign-Off

- **Tester Name**: __________________________
- **Device Serial / IMEI**: __________________________
- **Android OS Build**: __________________________
- **Date Tested**: __________________________
- **Overall Result**: `[ ] ACCEPTED FOR PRODUCTION`  `[ ] REJECTED (See Notes)`
