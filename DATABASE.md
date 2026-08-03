# MalikAuth Database Architecture

## Overview

MalikAuth uses **Firebase Firestore** (NoSQL) as its primary data store. All server-side operations use the Firebase Admin SDK. Client-side access is denied via security rules (all collections set to `allow read, write: if false`).

---

## Collections & Schemas

### `applications`
Stores registered software applications.

| Field | Type | Description |
|---|---|---|
| `id` | string | Document ID (appId) |
| `name` | string | Display name |
| `appId` | string | 10-char alphanumeric identifier |
| `appSecret` | string | Secret key for API auth |
| `version` | string | Current version |
| `appType` | string | Platform (C#, C++, Python, Web) |
| `status` | string | Active, Maintenance, Disabled |
| `ownerId` | string | Owner user ID |
| `encryptionKey` | string | Encryption key |
| `allowHwidReset` | boolean | Allow HWID resets |
| `motd` | string | Message of the day |
| `discordWebhook` | string | Discord webhook URL |
| `createdAt` | string | ISO timestamp |

### `licenses`
Stores license keys for applications.

| Field | Type | Description |
|---|---|---|
| `id` | string | Document ID |
| `key` | string | MALIK-XXXX-XXXX-XXXX-XXXX |
| `keyName` | string | Optional label |
| `appId` | string | Parent application |
| `durationDays` | number | 9999 = Lifetime |
| `role` | string | Admin, Moderator, User |
| `maxDevices` | number | Max concurrent devices |
| `status` | string | Unused, Active, Expired, Banned |
| `note` | string | Admin note |
| `expiry` | string | Expiry string |
| `usedBy` | string | HWID or username |
| `activatedAt` | string | Activation timestamp |
| `expiresAt` | string | Expiration timestamp |
| `createdAt` | string | Creation timestamp |

### `users`
Registered user accounts.

| Field | Type | Description |
|---|---|---|
| `id` | string | Document ID |
| `username` | string | Username |
| `password` | string | bcrypt hash |
| `email` | string | Email address |
| `appId` | string | Parent application |
| `hwid` | string | Hardware ID |
| `role` | string | Admin, Moderator, User |
| `licenseKey` | string | Assigned license key |
| `ipAddress` | string | Last known IP |
| `status` | string | Active, Banned, Suspended |
| `expiry` | string | Expiry string |
| `lastSeen` | string | Last activity |
| `createdAt` | string | Creation timestamp |
| `emailVerified` | boolean | Email verification status |
| `twoFactorEnabled` | boolean | 2FA status |

### `sessions`
Active user sessions (heartbeat tracking).

| Field | Type | Description |
|---|---|---|
| `id` | string | Document ID |
| `sessionId` | string | SESS-XXXX... |
| `appId` | string | Parent application |
| `username` | string | Session owner |
| `hwid` | string | Hardware ID |
| `ipAddress` | string | Client IP |
| `status` | string | Active, Revoked, Terminated |
| `lastHeartbeat` | string | Last heartbeat timestamp |
| `createdAt` | string | Creation timestamp |

### `remote_variables`
Application key-value configuration store.

| Field | Type | Description |
|---|---|---|
| `id` | string | Document ID |
| `appId` | string | Parent application |
| `key` | string | Variable name |
| `value` | string | Variable value |
| `isEncrypted` | boolean | Whether value is encrypted |
| `minRole` | string | Minimum role to read |
| `updatedAt` | string | Last update timestamp |

### `activity_logs`
Audit log of all actions.

| Field | Type | Description |
|---|---|---|
| `id` | string | Document ID |
| `appId` | string | Parent application |
| `action` | string | LICENSE_ACTIVATED, USER_LOGIN, HWID_RESET, etc. |
| `actor` | string | Username or system |
| `hwid` | string | Hardware ID |
| `details` | string | Action details |
| `timestamp` | string | ISO timestamp |

### `password_resets`
Password reset tokens.

| Field | Type | Description |
|---|---|---|
| `id` | string | Document ID |
| `username` | string | Target user |
| `appId` | string | Parent application |
| `token` | string | Reset token |
| `expiresAt` | string | Token expiry |
| `createdAt` | string | Creation timestamp |

### `email_verifications`
Email verification tokens.

| Field | Type | Description |
|---|---|---|
| `id` | string | Document ID |
| `email` | string | Target email |
| `appId` | string | Parent application |
| `token` | string | Verification token |
| `expiresAt` | string | Token expiry |
| `createdAt` | string | Creation timestamp |

### `migrations`
Tracks applied database migrations.

| Field | Type | Description |
|---|---|---|
| `id` | string | Migration ID (e.g. "001") |
| `name` | string | Migration name |
| `appliedAt` | string | ISO timestamp |

---

## Composite Indexes

Indexes are defined in `firestore.indexes.json`. Deploy with:

```bash
firebase deploy --only firestore:indexes
```

| Collection | Fields | Purpose |
|---|---|---|
| `licenses` | `appId` + `key` | License lookup by app+key |
| `licenses` | `appId` + `status` | List licenses by status |
| `users` | `appId` + `username` | User login/register |
| `users` | `appId` + `status` | List users by status |
| `sessions` | `appId` + `sessionId` | Heartbeat lookup |
| `sessions` | `appId` + `status` | List sessions by status |
| `activity_logs` | `appId` + `timestamp` | Real-time log subscription |
| `remote_variables` | `appId` + `key` | Variable upsert lookup |
| `password_resets` | `username` + `appId` | Reset token lookup |

---

## Security Rules Strategy

All collections in `firestore.rules` deny direct client access:

```
allow read, write: if false;
```

All Firestore operations are performed server-side via the Admin SDK, which bypasses security rules. This ensures:

- Secrets (`appSecret`, `encryptionKey`, `password`) are never exposed to clients
- All writes go through validation logic in `server.ts`
- Rate limiting is enforced at the API layer

---

## Backup & Restore

### Automated Backups

1. Enable **daily automated backups** in Firebase Console:
   - Go to **Firestore > Backups > Schedule backup**
   - Set schedule to daily at 02:00 UTC
   - Retention: 30 days

2. Enable **Point-in-Time Recovery (PITR)** for continuous WAL-based recovery.

### Manual Backup (CLI)

```bash
npx tsx src/lib/backup.ts
```

Creates a timestamped folder in `backups/` with:
- One JSON file per collection
- `_metadata.json` with counts and timestamp

### Restore

```bash
# From Firebase Console
firebase firestore:import gs://YOUR_BUCKET/backups/TIMESTAMP/

# Or use the backup JSON files to repopulate via Admin SDK scripts
```

---

## Migration System

### Running Migrations

```bash
# Run all pending migrations
npx tsx src/lib/migrations.ts

# Rollback last applied migration
npx tsx src/lib/migrations.ts rollback
```

### Writing New Migrations

Add a new `Migration` object to the `migrations` array in `src/lib/migrations.ts`:

```typescript
{
  id: '003',
  name: '003_your_migration_name',
  description: 'What this migration does',
  up: async (db) => {
    // Apply changes
  },
  down: async (db) => {
    // Revert changes
  }
}
```

### Tracked Migrations

| ID | Name | Description |
|---|---|---|
| 001 | `001_add_email_verified` | Add `emailVerified` and `twoFactorEnabled` to users |
| 002 | `002_hash_existing_passwords` | Hash plaintext passwords with bcrypt |

---

## Admin SDK vs Client SDK

| Aspect | Admin SDK (server) | Client SDK (browser) |
|---|---|---|
| **Used in** | `server.ts`, migrations, backups | `src/lib/firebase.ts` |
| **Auth** | Service account credentials | Firebase Auth (end user) |
| **Firestore rules** | Bypassed | Enforced |
| **Access** | All collections | Denied (all rules `false`) |
| **Secrets** | Has full access | Never exposed |

The Admin SDK config template is at `firebase-admin-config.json`. **Never commit real credentials.** Use environment variables in production:

```bash
GOOGLE_APPLICATION_CREDENTIALS=path/to/service-account.json
```

---

## Recommended Firestore Settings

- **Location**: Choose closest to your user base (e.g. `us-central1`)
- **Delete protection**: Enable on production databases
- **Firestore budget alerts**: Set at $5/day for development, $50/day for production
- **Indexing**: Deploy composite indexes via `firebase deploy --only firestore:indexes`
- **Backup schedule**: Daily at 02:00 UTC with 30-day retention
