# MASTER PROJECT SUMMARY — MalikAuth

> **Memory document.** All agents MUST read this before working. Update after significant batches of changes. Do NOT re-analyze unchanged files.

## 1. Project Context
- **Name:** MalikAuth — Enterprise Software Licensing & Hardware Security Platform (KeyAuth-style).
- **Purpose:** Full-stack licensing/auth platform for software developers to protect desktop apps. Combines hardware fingerprinting (HWID), AES-256 memory encryption, real-time session heartbeat + remote kill switch, and live remote variable sync.
- **Status:** Working full-stack app. Not a git repo (no `.git`). Version banner: `v2.5.0`.
- **Deployment target:** AI Studio applet (Cloud Run). Server URL referenced in SDK: `https://malikauth.ai.studio`. Local dev on `http://localhost:3000`.

## 2. Tech Stack
- **Frontend:** React 19 + TypeScript, Vite 6, Tailwind CSS 4 (`@tailwindcss/vite`), Lucide React icons, Motion (installed, minimal use).
- **Backend:** Node.js + Express 4, Firebase Admin/Client SDK (Firestore + Auth). Single `server.ts` runs both API and serves the Vite SPA.
- **Database:** Firebase Firestore (NoSQL). Config in `firebase-applet-config.json`.
- **Auth (dashboard):** Firebase Authentication (Email/Password, Google, Anonymous). `src/lib/firebase.ts`.
- **SDK:** C# .NET WinForms client library (`.NET Framework 4.7.2`), served via REST API.
- **Package manager:** Bun (`bun.lock`) or npm (`package-lock.json`). Scripts use `tsx` for dev server.

## 3. Scripts (package.json)
- `dev`: `tsx server.ts` (Express + Vite middleware, HMR)
- `build`: `vite build && esbuild server.ts --bundle --platform=node --format=cjs --packages=external --outfile=dist/server.cjs`
- `start`: `node dist/server.cjs`
- `lint`: `tsc --noEmit`

## 4. Directory / File Map
```
Malik-Auth-main/
├── server.ts                    # Express + Firestore REST API + Vite serving + auto-expire cron
├── src/
│   ├── main.tsx                # React entry (StrictMode)
│   ├── App.tsx                 # Root: landing/console view switch, app selection, tab routing, data loading
│   ├── types.ts                # All Malik* TypeScript interfaces
│   ├── index.css               # Tailwind import + custom keyframes (.glass, .animate-in, .glow)
│   ├── lib/
│   │   ├── firebase.ts         # Firebase init (db, auth, googleProvider)
│   │   ├── malikAuthService.ts # All Firestore CRUD + real-time subscriptions + local audit logs
│   │   └── dateUtils.ts        # PKT (GMT+5) timezone formatting + expiry parsing
│   └── components/
│       ├── LandingPage.tsx     # Marketing landing (hero, features, pricing)
│       ├── AuthModal.tsx       # Sign in/up (email, Google, anonymous demo, skip)
│       ├── Sidebar.tsx         # App switcher + nav tabs
│       ├── DashboardOverview.tsx  # Stats + credentials + MOTD/version settings
│       ├── ManageAppsTab.tsx   # App list, edit, delete, switch
│       ├── LicensesTab.tsx     # Generate/ban/delete/extend keys, search/filter
│       ├── UsersTab.tsx        # Custom users, HWID reset, ban, expiry
│       ├── SessionsTab.tsx     # Live sessions, kill/delete
│       ├── RemoteVariablesTab.tsx # Remote vars CRUD
│       ├── ActivityLogsTab.tsx # Audit logs (Firestore + localStorage merged)
│       ├── SdkFilesTab.tsx     # C# SDK file viewer/downloader (fetches /api/v1/sdk/csharp-files)
│       ├── ActionMenu.tsx      # Portal-based dropdown menu
│       ├── ConfirmModal.tsx    # Generic confirm dialog
│       ├── CreateAppModal.tsx  # Create app w/ auto-generated credentials
│       ├── ExpiryCountdown.tsx # Live countdown / lifetime / expired badge
│       ├── ExtendExpiryModal.tsx # Preset + custom expiry editor
│       └── PktClockHeader.tsx  # Live PKT clock header (NOT currently mounted in App)
├── sdk/csharp-winforms/        # CANONICAL C# WinForms SDK (served by server)
│   ├── MalikAuthClient.cs      # Core SDK (HWID, register, login, license, heartbeat, webhooks)
│   ├── Login.cs/.Designer.cs, Register.cs/.Designer.cs, Main.cs/.Designer.cs, Program.cs
│   └── MalikAuthApp.csproj     # net472 WinForms
├── Auth/                       # OLDER/DUPLICATE Guna.UI2 WinForms project (separate, uses Form1.cs as Login)
│   └── Auth/Auth.csproj        # net472, references Guna.UI2 2.0.4.8 (packages/ folder)
├── sdk/README.md               # SDK integration docs
├── firebase-applet-config.json # Firebase web config (REAL credentials — do not commit/leak)
├── firestore.rules             # Security rules (currently allow read/write: if true — INSECURE)
├── firebase-blueprint.json     # Entity schema blueprint (MalikApp, MalikLicense)
├── metadata.json               # AI Studio applet metadata (Gemini capability)
├── leespeak.ts                 # Empty placeholder file (1 comment line)
├── .env.example                # GEMINI_API_KEY, APP_URL (AI Studio injected)
├── index.html                  # SPA shell (title has stray backticks: ``Malik Auth``)
├── vite.config.ts              # React + Tailwind plugins, @ alias, HMR toggle
├── tsconfig.json               # ES2022, bundler resolution, @/* -> ./
├── package.json / bun.lock / package-lock.json
└── assets/.aistudio/           # AI Studio metadata
```

## 5. Firestore Collections & Schema
All collections are top-level. `firestore.rules` currently allows **read/write: true for everyone** (security risk).

| Collection | Key fields |
|---|---|
| `applications` | appId (10 chars), name, ownerId (5 chars), appSecret (20 chars), encryptionKey, version, status (Active/Maintenance/Disabled), motd, discordWebhook, allowHwidReset, appType, createdAt |
| `licenses` | key (`MALIK-XXXX-XXXX-XXXX-XXXX`), appId, keyName, status (Unused/Active/Expired/Banned), expiry, note, usedBy, hwid, createdAt |
| `users` | username, password (PLAINTEXT — security risk), email, appId, hwid, licenseKey, role, status, expiry, ipAddress, lastSeen, createdAt |
| `sessions` | sessionId (`SESS-...`), appId, username, hwid, ipAddress, status (Active/Terminated), loginTime, lastHeartbeat, createdAt |
| `remote_variables` | appId, key, value, isEncrypted, minRole, updatedAt |
| `activity_logs` | appId, action, actor, hwid, details, timestamp |
| `crash_reports` | (blueprint only) |
| `analytics_logs` | (blueprint only) |

## 6. REST API Endpoints (server.ts)
| Endpoint | Method | Purpose |
|---|---|---|
| `/api/health` | GET | Health check |
| `/api/v1/admin/auto-expire` | GET | Scan users+licenses, mark expired |
| `/api/v1/client/init` | POST | Verify appId/appSecret, auto-bootstrap app, return appName/version |
| `/api/v1/client/register` | POST | Register user w/ license key (validates, marks Used, creates user+session+log) |
| `/api/v1/client/login` | POST | Auth user, HWID check, create session |
| `/api/v1/client/license` | POST | Direct license validation/activation |
| `/api/v1/client/session-heartbeat` | POST | Heartbeat + remote kill switch (checks session/user/license status) |
| `/api/v1/sdk/csharp-files` | GET | **Documented in README but NOT implemented in server.ts** — SdkFilesTab calls it |

> **GAP:** `/api/v1/sdk/csharp-files` is referenced by `SdkFilesTab.tsx` but has no route in `server.ts`. The SdkFilesTab will show an error. This is a known broken flow.

## 7. Timezone System (CRITICAL)
- All expiry/timestamps use **PKT (GMT+5, Asia/Karachi)**.
- `src/lib/dateUtils.ts` is the canonical parser/formatter. `server.ts` has a **duplicate** `parseExpiryToDate`/`checkIsExpired` implementation.
- **IMPORTANT INCONSISTENCY:** `dateUtils.parseExpiryToDate` Pattern 1 (clean `DD/MM/YYYY hh:mm am/pm`) creates a **local-time** Date (`new Date(year, month, day, hours, minutes, seconds)`), while `server.ts`'s version subtracts 5 hours (treats input as PKT → UTC). This can cause off-by-5-hours expiry comparisons between frontend and backend. Verify before changing expiry logic.

## 8. Data Flow
- `App.tsx` loads apps via `getApps()`, then `loadAllData(app)` fetches licenses/users/sessions/remoteVariables/logs via `Promise.allSettled`.
- Real-time: `onSnapshot` subscriptions for licenses, users, sessions, activity_logs (per selected app).
- Activity logs are stored in **localStorage** (`malik_audit_logs_<appId>`) and merged with Firestore `activity_logs`; flushed to Discord webhook via `sendBeacon` on page close (`flushAuditLogsToDiscord`).
- `SdkFilesTab` fetches SDK files from the server and injects the selected app's credentials via regex replacement.

## 9. Known Issues / Risks
1. **`/api/v1/sdk/csharp-files` endpoint missing** in server.ts → SdkFilesTab broken.
2. **Firestore rules allow all reads/writes** (`allow read, write: if true`) — critical security risk.
3. **Passwords stored in plaintext** in `users` collection (server.ts register/login compare raw strings).
4. **Hardcoded credentials** in server.ts init auto-bootstrap: `ownerId: 'hhVHo'`, `appSecret: '6tU5MfodyopJfwyswAaq'`.
5. **Timezone inconsistency** between frontend `dateUtils.ts` and backend `server.ts` expiry parsing (see §7).
6. **`index.html` title** has stray backticks: ```Malik Auth```.
7. **`leespeak.ts`** is an empty placeholder file.
8. **Auth folder** is a duplicate/legacy Guna.UI2 WinForms project — not part of the served SDK.
9. **`SdkFilesTab`** is defined but **not rendered** in `App.tsx` (no tab route wired to it).
10. **`PktClockHeader`** is defined but **not rendered** in `App.tsx`.
11. `firebase-applet-config.json` contains **real Firebase credentials** — must not be committed/leaked.
12. `firestore.rules` uses `allow read, write: if true` — needs proper auth-based rules.

## 10. Design System
- **Palette:** Indigo primary (`indigo-600`), slate neutrals, semantic accents (emerald=active, amber=expired, rose=banned/danger, violet=users, sky=logs, cyan=anti-tamper).
- **Style:** Tailwind utility classes, rounded-2xl cards, `shadow-xs`/`shadow-sm`, `blur-sm hover:blur-none` for sensitive values (keys, secrets, HWID, IPs), `animate-in fade-in` transitions, dark code editor (`#1e1e1e`) for SDK viewer.
- **Layout:** Fixed 64-width sidebar (desktop), responsive tables with `overflow-x-auto`, max-w-7xl content container.
- **Icons:** lucide-react. **Animations:** motion (installed), CSS keyframes in index.css.

## 11. Conventions
- React function components with `React.FC<Props>` + explicit prop interfaces.
- Named exports for components; default export for `App`.
- Path alias `@/*` → project root.
- All dates formatted via `dateUtils` helpers (never raw `toLocaleString` except PktClockHeader).
- Sensitive values blurred by default, revealed on hover.
- Activity logging via `logActivity()` helper (localStorage + optional Discord).

## 12. Build / Run / Verify
- **Dev:** `npm run dev` (or `bun run dev`) → http://localhost:3000
- **Lint:** `npm run lint` (tsc --noEmit)
- **Build:** `npm run build` → `dist/` (frontend) + `dist/server.cjs`
- **Start (prod):** `npm run start`
- Requires `firebase-applet-config.json` present (already exists) and `.env` (GEMINI_API_KEY, APP_URL) for AI Studio.

## 13. Change Log
- (Initial analysis) Full codebase analyzed and documented. No code changes made.
- (GUI Modernization v2.5) Full frontend redesign:
  - **Design system:** New `src/index.css` with class-based dark mode (`@custom-variant dark`), `brand-*`/`surface-*` color tokens, Inter + JetBrains Mono fonts, reusable `.card`/`.btn-primary`/`.btn-ghost`/`.btn-danger`/`.input`/`.select`/`.badge` classes, animations (fadeInUp, scaleIn, float, glow, shimmer), `.text-gradient`, `.bg-grid`.
  - **New files:** `src/lib/useTheme.ts` (dark/light toggle persisted to localStorage), `src/components/ui.tsx` (shared primitives: Card, PageHeader, StatusBadge, EmptyState, TableShell, Sensitive, FieldLabel), `src/components/MaintenanceBanner.tsx` (maintenance/disabled banner + CloudStatus).
  - **Rebuilt:** `index.html` (title, meta, favicon, fonts), `App.tsx` (dark mode, maintenance banner, wired up SdkFilesTab via new `sdk` tab), `Sidebar.tsx` (glass, theme toggle, SDK nav item), `LandingPage.tsx` (premium modern landing), `DashboardOverview.tsx`, and all tab + shared UI components (Licenses, Users, Sessions, RemoteVariables, ActivityLogs, ManageApps, SdkFiles, ActionMenu, ConfirmModal, CreateAppModal, ExpiryCountdown, ExtendExpiryModal, AuthModal).
  - **Data layer unchanged:** All Firebase reads/writes, `malikAuthService.ts`, `firebase.ts`, `dateUtils.ts`, and `types.ts` untouched. Only JSX/visual styling changed.
  - **Backend fix:** Added missing `GET /api/v1/sdk/csharp-files` endpoint to `server.ts` (reads `sdk/csharp-winforms/*.cs|.csproj|.config|.resx`). Verified returns 9 files.
  - **Verified:** `npx tsc --noEmit` passes clean; `npm run build` succeeds; local server serves health + SDK endpoint + SPA correctly.
  - **Note:** Production JS bundle is ~1MB (Firebase + all components) — flagged for future code-splitting optimization.
- (v2.5 follow-up — SDK removal + theme + data fix):
  - **Default theme changed to LIGHT/white** (`useTheme.ts` default `'light'`; removed `class="dark"` from `index.html`). Dark mode still available via toggle.
  - **Removed C# SDK Files feature from the website entirely:** removed `sdk` nav item from `Sidebar.tsx`, removed `SdkFilesTab` from `App.tsx`, deleted `src/components/SdkFilesTab.tsx`, removed the `GET /api/v1/sdk/csharp-files` endpoint from `server.ts`, and deleted the `sdk/` folder. The C# SDK now lives ONLY in the external `Auth/` WinForms project (managed separately).
  - **Data-loading fix:** `getApps()` no longer uses `orderBy('createdAt')` (which silently excluded apps missing a `createdAt` field). It now fetches all apps and sorts in-memory, so every app appears in both the sidebar and Manage Applications.
  - **Verified:** `tsc --noEmit` clean, `npm run build` succeeds, dev server starts and serves `/api/health` + SPA correctly.