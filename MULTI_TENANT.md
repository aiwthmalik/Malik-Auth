# Multi-Tenant Architecture

Design document for extending MalikAuth to support multiple tenants (organizations).

## Current Architecture

MalikAuth currently operates as a **single-tenant** system:

- All apps, users, licenses, and sessions share the same Firestore collections
- Tenant isolation is achieved via `appId` field queries
- There is no concept of an "organization" or "workspace"
- A single Firebase project serves all data

```
Firestore Collections (Current):
  applications/    → { appId, name, ownerId, ... }
  users/           → { appId, username, ... }
  licenses/        → { appId, key, ... }
  sessions/        → { appId, sessionId, ... }
  remote_variables/ → { appId, key, ... }
  activity_logs/   → { appId, action, ... }
```

### Limitations of Current Design

1. **No billing isolation** — all apps share one Firebase billing plan
2. **No RBAC across apps** — an admin of App A can potentially see App B data
3. **No data residency** — all data lives in one Firestore region
4. **No usage quotas per org** — limits are global
5. **No organization-level settings** — branding, webhooks are per-app only

---

## Multi-Tenant Design

### Option A: Shared Collection with `tenantId` (Recommended)

Add a `tenantId` field to all documents. Queries filter by `tenantId`.

```
Firestore Collections (Proposed):
  tenants/         → { tenantId, name, plan, settings, ... }
  applications/    → { tenantId, appId, name, ... }
  users/           → { tenantId, appId, username, ... }
  licenses/        → { tenantId, appId, key, ... }
  sessions/        → { tenantId, appId, sessionId, ... }
  remote_variables/ → { tenantId, appId, key, ... }
  activity_logs/   → { tenantId, appId, action, ... }
```

**Pros:**
- Minimal Firestore read cost (single collection scans)
- Easy to query across apps within a tenant
- Simple backup/restore per tenant
- Lower operational overhead

**Cons:**
- Requires composite indexes on `(tenantId, appId, ...)`
- No physical data separation
- Cross-tenant queries require security rules

### Option B: Collection-per-Tenant

Each tenant gets its own set of collections:

```
Firestore Collections (Proposed):
  tenants_abc123/
    applications/
    users/
    licenses/
    ...
  tenants_def456/
    applications/
    users/
    licenses/
    ...
```

**Pros:**
- Complete data isolation
- Independent backup/restore per tenant
- No risk of cross-tenant data leaks

**Cons:**
- High Firestore read costs (each collection is billed separately)
- Complex to manage schema across tenants
- Backup/restore at scale is impractical
- Cannot query across tenants

### Recommendation

**Option A (Shared Collection with `tenantId`)** is recommended for MalikAuth because:
- It aligns with the existing `appId`-based query pattern
- Firestore auto-scales with shared collections
- Security rules can enforce tenant isolation
- Billing is predictable

---

## Authentication Changes

### Current Flow

```
1. Client sends: { action: "login", appId, username, password, hwid }
2. Server queries: users WHERE appId = X AND username = Y
3. Server returns: session token
```

### Proposed Flow

```
1. Client sends: { action: "login", tenantId, appId, username, password, hwid }
2. Server queries: users WHERE tenantId = X AND appId = Y AND username = Z
3. Server validates: user belongs to tenant
4. Server returns: JWT with tenantId claim
```

### JWT Token Structure

```json
{
  "sub": "user_abc123",
  "tenantId": "tenant_xyz",
  "appId": "app_def456",
  "role": "Admin",
  "iat": 1691000000,
  "exp": 1691086400
}
```

### Auth Middleware

```typescript
function tenantAuthMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  const decoded = jwt.verify(token, SECRET);

  // Attach tenant context to request
  req.tenantId = decoded.tenantId;
  req.appId = decoded.appId;
  req.userRole = decoded.role;

  next();
}
```

---

## Billing/Subscription Integration

### Tenant Model

```typescript
interface Tenant {
  id: string;
  name: string;
  plan: 'free' | 'starter' | 'pro' | 'enterprise';
  status: 'active' | 'suspended' | 'cancelled';
  limits: {
    maxApps: number;
    maxUsers: number;
    maxLicenses: number;
    maxSessions: number;
    apiCallsPerMonth: number;
  };
  billing: {
    stripeCustomerId?: string;
    subscriptionId?: string;
    currentPeriodEnd?: string;
  };
  createdAt: string;
}
```

### Usage Tracking

```typescript
interface TenantUsage {
  tenantId: string;
  period: string; // "2026-08"
  apiCalls: number;
  totalUsers: number;
  totalLicenses: number;
  totalSessions: number;
  storageBytes: number;
}
```

### Enforcement Points

1. **API Gateway:** Check `tenantId` against plan limits before processing
2. **Cron Job:** Monthly usage aggregation and billing sync
3. **Dashboard:** Real-time usage display per tenant
4. **Webhooks:** Notify tenant admins when approaching limits

---

## Data Migration Strategy

### Phase 1: Add `tenantId` to All Collections

1. Create a default tenant for existing data
2. Run a one-time migration script:

```typescript
async function migrateToMultiTenant() {
  const defaultTenantId = 'default';

  // Migrate applications
  const apps = await getDocs(collection(db, 'applications'));
  for (const doc of apps.docs) {
    await updateDoc(doc.ref, { tenantId: defaultTenantId });
  }

  // Migrate users
  const users = await getDocs(collection(db, 'users'));
  for (const doc of users.docs) {
    await updateDoc(doc.ref, { tenantId: defaultTenantId });
  }

  // ... repeat for licenses, sessions, remote_variables, activity_logs
}
```

### Phase 2: Update All Queries

Replace:
```typescript
query(collection(db, 'users'), where('appId', '==', appId))
```

With:
```typescript
query(collection(db, 'users'), where('tenantId', '==', tenantId), where('appId', '==', appId))
```

### Phase 3: Deploy New API Version

- Add `tenantId` to all API request schemas
- Update validation functions
- Update frontend to send `tenantId` in all requests

---

## API Changes

### New Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/tenants` | GET | List tenants (admin) |
| `/api/v1/tenants` | POST | Create tenant |
| `/api/v1/tenants/:id` | PUT | Update tenant |
| `/api/v1/tenants/:id` | DELETE | Delete tenant |
| `/api/v1/tenants/:id/users` | GET | List tenant users |
| `/api/v1/tenants/:id/usage` | GET | Get tenant usage stats |

### Modified Endpoints

All existing endpoints gain a `tenantId` parameter:

```typescript
// Before
{ action: "register", appId, username, password, licenseKey, hwid }

// After
{ action: "register", tenantId, appId, username, password, licenseKey, hwid }
```

### Backward Compatibility

- If `tenantId` is omitted, default to the user's primary tenant
- Legacy API keys continue to work with the default tenant
- Migration period: 90 days

---

## UI Changes

### New Navigation Items

```
├── Organization
│   ├── Settings
│   ├── Members
│   ├── Billing
│   └── Usage
├── Applications (filtered by tenant)
├── Dashboard (aggregated across tenant apps)
```

### Tenant Switcher

Add a tenant/org switcher to the sidebar:

```tsx
const TenantSwitcher: React.FC = () => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [currentTenant, setCurrentTenant] = useState<Tenant | null>(null);

  return (
    <select value={currentTenant?.id} onChange={handleSwitch}>
      {tenants.map(t => (
        <option key={t.id} value={t.id}>{t.name}</option>
      ))}
    </select>
  );
};
```

### RBAC Changes

| Role | Current Scope | New Scope |
|------|---------------|-----------|
| Owner | Full app access | Full tenant access |
| Admin | Full app access | Full tenant access |
| Moderator | Limited app access | Limited tenant access |
| User | Read-only | Read-only within tenant |

---

## Security Rules (Firestore)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Tenant isolation
    match /users/{doc} {
      allow read, write: if request.auth != null
        && request.auth.token.tenantId == resource.data.tenantId;
    }

    match /licenses/{doc} {
      allow read, write: if request.auth != null
        && request.auth.token.tenantId == resource.data.tenantId;
    }

    // ... similar for all collections
  }
}
```

---

## Implementation Phases

| Phase | Scope | Duration |
|-------|-------|----------|
| 1 | Add `tenantId` field, migrate data | 2 weeks |
| 2 | Update all queries and API endpoints | 2 weeks |
| 3 | Add tenant management UI | 2 weeks |
| 4 | Billing integration (Stripe) | 3 weeks |
| 5 | Usage tracking and limits | 2 weeks |
| 6 | Testing and rollout | 2 weeks |

**Total estimated timeline: 13 weeks**

---

## Open Questions

1. **Tenant invitation flow** — email-based invite vs. direct add?
2. **Data export per tenant** — full export or just CSV?
3. **Audit log retention** — per-tenant or global policy?
4. **Custom domains per tenant** — supported or not?
5. **Webhook isolation** — separate webhooks per tenant or shared?
