# MalikAuth Operations Runbook

## Table of Contents

1. [Docker Deployment](#docker-deployment)
2. [Environment Variables](#environment-variables)
3. [Logging](#logging)
4. [Error Tracking](#error-tracking)
5. [Uptime Monitoring](#uptime-monitoring)
6. [Backup & Restore](#backup--restore)
7. [Incident Response](#incident-response)
8. [Scaling](#scaling)

---

## Docker Deployment

### Prerequisites

- Docker & Docker Compose v2+
- Firebase Admin SDK credentials (service account JSON)
- Node.js 20+ (for local dev only)

### Quick Start

```bash
# Clone and configure
git clone <repo-url> && cd Malik-Auth-main
cp .env.example .env.development
cp .env.example .env.production
# Edit .env.production with real values

# Development (hot-reload)
docker compose up dev

# Production
docker compose up -d prod
```

### Build Commands

```bash
# Build production image
docker build -t malikauth:latest .

# Build with no cache
docker build --no-cache -t malikauth:latest .

# Run standalone
docker run -d \
  --name malikauth \
  -p 3000:3000 \
  --env-file .env.production \
  --restart unless-stopped \
  malikauth:latest
```

### Health Check

```bash
curl http://localhost:3000/api/v1
# Expected: {"status":"ok"}
```

### Logs

```bash
# Production logs (JSON, structured)
docker compose logs -f prod

# Filter errors
docker compose logs prod 2>&1 | grep '"level":"error"'
```

---

## Environment Variables

| Variable | Description | Dev Default | Production |
|---|---|---|---|
| `NODE_ENV` | Runtime environment | `development` | `production` |
| `PORT` | Server listen port | `3000` | `3000` |
| `ALLOWED_ORIGINS` | CORS allowed origins | `http://localhost:3000` | `https://yourdomain.com` |
| `API_KEYS` | Comma-separated API keys | `dev-key-change-in-production` | `CHANGE_ME_TO_SECURE_KEYS` |
| `SESSION_MAX_AGE_HOURS` | Session lifetime in hours | `24` | `24` |
| `MAX_SESSIONS` | Max concurrent sessions per user | `5` | `5` |
| `MAX_LOGIN_ATTEMPTS` | Failed attempts before lockout | `5` | `5` |
| `LOCKOUT_DURATION_MINUTES` | Account lockout duration | `15` | `15` |
| `GEMINI_API_KEY` | Google Gemini API key | — | — |
| `GOOGLE_APPLICATION_CREDENTIALS` | Path to Firebase service account | — | — |

### Generating Secure API Keys

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Logging

The application uses a structured JSON logger (`src/lib/logger.ts`).

### Log Levels

| Level | Priority | Use Case |
|---|---|---|
| `error` | 0 | System errors, unhandled exceptions |
| `warn` | 1 | Degraded functionality, near limits |
| `info` | 2 | Request logging, key lifecycle events |
| `debug` | 3 | Detailed diagnostic info (dev only) |

### Output Format

**Development** (colorized):
```
[2025-01-15T10:30:00.000Z] INFO  Server listening on port 3000
```

**Production** (JSON):
```json
{"timestamp":"2025-01-15T10:30:00.000Z","level":"info","message":"Server listening on port 3000"}
```

### Usage

```typescript
import { logger } from './lib/logger';

logger.info('Server started', { port: 3000 });
logger.error('Database connection failed', { error: err.message });
logger.debug('Query result', { count: results.length });

// Request logging middleware
logger.logRequest('GET', '/api/v1/license/validate', 200, 45);
```

### Container Log Aggregation

For production log aggregation, pipe JSON stdout to your log service:

```bash
# With Docker
docker compose logs -f prod | jq .

# With Loki (Grafana)
# Add logging driver to docker-compose.yml:
# logging:
#   driver: loki
#   options:
#     loki-url: "http://loki:3100/loki/api/v1/push"
```

---

## Error Tracking

### Sentry Integration

```bash
npm install @sentry/node
```

Initialize in `server.ts` (DO NOT modify server.ts directly — integrate via a new module):

```typescript
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  integrations: [
    Sentry.expressIntegration(),
  ],
});

// In error handler (must be after all routes)
app.use(Sentry.Handlers.errorHandler());
```

### Error Reporting Configuration

- **Production**: Sample 10% of transactions, capture all errors
- **Development**: Capture everything, no sampling
- **Sensitive data**: Strip API keys, passwords, tokens before sending
- **Release tracking**: Set `release` option to git SHA for deploy correlation

### Alert Rules

| Condition | Channel | Severity |
|---|---|---|
| Error rate > 5% in 5 min | PagerDuty / Slack | Critical |
| Error rate > 1% in 15 min | Slack | Warning |
| New error type detected | Email | Info |
| P95 latency > 2s | Slack | Warning |
| P95 latency > 5s | PagerDuty | Critical |

### LogRocket (Frontend)

```bash
npm install logrocket
```

```typescript
import LogRocket from 'logrocket';

LogRocket.init('your-app-id/logrocket', {
  root: document.body,
  release: import.meta.env.VITE_APP_VERSION,
});
```

---

## Uptime Monitoring

### Health Check Endpoint

```
GET /api/v1
Response: {"status":"ok"}
```

### Recommended Services

| Service | Free Tier | Response Time | Alerts |
|---|---|---|---|
| [UptimeRobot](https://uptimerobot.com/) | 50 monitors | 5 min | Email, SMS, Slack, Webhook |
| [Betterstack](https://betterstack.com/) | 25 monitors | 30 sec | Email, SMS, Slack, PagerDuty |
| [Checkly](https://checklyhq.com/) | 5 monitors | 10 sec | Email, Slack, PagerDuty, Webhook |

### UptimeRobot Configuration

1. Create account → Add Monitor
2. Monitor Type: HTTP(s)
3. URL: `https://yourdomain.com/api/v1`
4. Monitoring Interval: 5 minutes
5. Alert Contacts: Add email, SMS, or Slack webhook
6. Advanced: Expected Response = `200`, Keyword = `ok`

### Betterstack Configuration

1. Create monitors → URL Check
2. URL: `https://yourdomain.com/api/v1`
3. Period: 30 seconds
4. Expected Status: 200
5. Response must contain: `ok`

### Checkly Configuration

1. Create API check
2. URL: `https://yourdomain.com/api/v1`
3. Assertions: `status` equals `200`
4. Frequency: Every 10 seconds
5. Retry: 3 attempts before alert

### Alert Escalation

1. **First failure**: Automated alert to on-call via Slack/email
2. **5 min downtime**: Escalate to SMS alert
3. **15 min downtime**: Page on-call engineer
4. **30 min downtime**: Escalate to engineering lead
5. **60 min downtime**: Incident commander activated, status page updated

### Status Page

Use [Instatus](https://instatus.com/) or [Betterstack Status](https://status.betterstack.com/) for public status pages. Auto-link to monitoring for incident updates.

---

## Backup & Restore

See [DATABASE.md](./DATABASE.md) for full backup/restore procedures.

### Quick Reference

```bash
# Manual backup
npx tsx src/lib/backup.ts

# Automated (add to cron or CI)
0 2 * * * cd /app && npx tsx src/lib/backup.ts
```

### Backup Schedule

- **Automated**: Daily at 02:00 UTC via Firebase Console
- **Manual**: Before any migration or major change
- **Retention**: 30 days (automated), indefinite (manual)
- **Point-in-Time Recovery**: Enable for production

### Restore

```bash
# From Firebase Console
firebase firestore:import gs://YOUR_BUCKET/backups/TIMESTAMP/
```

---

## Incident Response

### Severity Levels

| Level | Description | Response Time |
|---|---|---|
| P0 | Complete outage, data loss | Immediate |
| P1 | Major feature broken, auth failures | 15 min |
| P2 | Degraded performance, partial outage | 1 hour |
| P3 | Minor issue, cosmetic | Next business day |

### Runbook

1. **Detect**: Monitoring alerts or user reports
2. **Triage**: Check health endpoint, logs, error tracker
3. **Communicate**: Update status page, notify stakeholders
4. **Mitigate**: Rollback if needed, apply hotfix
5. **Resolve**: Deploy fix, verify health
6. **Post-mortem**: Document root cause, prevention steps

### Rollback Procedure

```bash
# Docker rollback
docker compose down
docker compose up -d prod --force-recreate

# Or pull previous version
docker pull malikauth:previous-tag
docker run -d --name malikauth -p 3000:3000 malikauth:previous-tag
```

### Emergency Contacts

| Role | Name | Contact |
|---|---|---|
| Primary On-Call | — | — |
| Engineering Lead | — | — |
| Firebase Support | — | https://support.firebase.google.com |

---

## Scaling

### Current Architecture

- Single Express process (Node.js)
- Firebase Firestore (auto-scales)
- Stateful sessions in Firestore

### Horizontal Scaling

```yaml
# docker-compose.yml scaling
services:
  prod:
    deploy:
      replicas: 3
      resources:
        limits:
          cpus: '0.5'
          memory: 512M
```

### Considerations

- Sessions are stored in Firestore — stateless horizontally
- Rate limiting uses in-memory store — use Redis for multi-instance
- Health check endpoint enables load balancer routing
- Consider nginx reverse proxy for SSL termination and load balancing

### Load Balancer (nginx)

```nginx
upstream malikauth {
    server malikauth-1:3000;
    server malikauth-2:3000;
    server malikauth-3:3000;
}

server {
    listen 443 ssl;
    server_name yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://malikauth;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## Maintenance

### Updating Dependencies

```bash
npm update
npm audit fix
docker build --no-cache -t malikauth:latest .
```

### SSL/TLS Renewal

```bash
# Let's Encrypt auto-renewal
certbot renew --quiet
```

### Log Rotation

```bash
# Docker log rotation (add to daemon.json)
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
```
