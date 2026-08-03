# Deployment Guide

Comprehensive guide for deploying MalikAuth to various environments.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Local Development](#local-development)
- [Docker Deployment](#docker-deployment)
- [Cloud Run Deployment](#cloud-run-deployment)
- [Firebase Configuration](#firebase-configuration)
- [Environment Variables](#environment-variables)
- [SSL/HTTPS Setup](#sslhttps-setup)
- [Custom Domain](#custom-domain)
- [Scaling](#scaling)
- [Monitoring](#monitoring)

---

## Prerequisites

| Requirement | Version |
|-------------|---------|
| Node.js | 20+ |
| npm or yarn | Latest |
| Firebase project | Blaze plan (for Firestore) |
| Docker | 20.10+ (for container deployment) |
| Git | 2.30+ |

### Firebase Setup

1. Create a new Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable **Cloud Firestore** in production mode
3. Enable **Authentication** (Email/Password provider)
4. Generate a service account key (Project Settings > Service Accounts > Generate New Private Key)
5. Save the key as `firebase-applet-config.json` in the project root

---

## Local Development

```bash
# 1. Clone the repository
git clone https://github.com/your-org/malikauth.git
cd malikauth

# 2. Install dependencies
npm install

# 3. Configure Firebase
# Place your firebase-applet-config.json in the project root

# 4. Start development server
npm run dev

# The app will be available at http://localhost:3000
```

### Development Features

- Hot Module Replacement (HMR) via Vite
- Firebase Emulator Suite (optional): `firebase emulators:start`
- TypeScript type checking: `npm run typecheck`
- Linting: `npm run lint`

---

## Docker Deployment

### Dockerfile

The project includes a multi-stage Dockerfile:

```dockerfile
# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Production
FROM node:20-alpine AS production
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/server.ts ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/firebase-applet-config.json ./

EXPOSE 3000
ENV NODE_ENV=production
CMD ["node", "--import", "tsx", "server.ts"]
```

### Build and Run

```bash
# Build the Docker image
docker build -t malikauth:latest .

# Run the container
docker run -d \
  --name malikauth \
  -p 3000:3000 \
  -v /path/to/firebase-applet-config.json:/app/firebase-applet-config.json \
  -e NODE_ENV=production \
  -e ALLOWED_ORIGINS=https://yourdomain.com \
  malikauth:latest

# Check logs
docker logs -f malikauth
```

### Docker Compose

```yaml
version: '3.8'
services:
  malikauth:
    build: .
    ports:
      - "3000:3000"
    volumes:
      - ./firebase-applet-config.json:/app/firebase-applet-config.json
    environment:
      - NODE_ENV=production
      - ALLOWED_ORIGINS=https://yourdomain.com
    restart: unless-stopped
```

---

## Cloud Run Deployment

For deploying to Google Cloud Run (suitable for AI Studio):

### 1. Configure gcloud

```bash
gcloud auth login
gcloud config set project YOUR_PROJECT_ID
```

### 2. Build and push to Container Registry

```bash
# Tag the image
export IMAGE=gcr.io/YOUR_PROJECT_ID/malikauth

# Build
docker build -t $IMAGE .

# Push
docker push $IMAGE
```

### 3. Deploy to Cloud Run

```bash
gcloud run deploy malikauth \
  --image $IMAGE \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --memory 512Mi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 10 \
  --set-env-vars NODE_ENV=production \
  --set-env-vars ALLOWED_ORIGINS=https://yourdomain.com \
  --concurrency 80
```

### 4. Set up Firebase Service Account

Upload the service account key as a secret:

```bash
gcloud secrets create firebase-config --data-file=firebase-applet-config.json

# Grant Cloud Run access
gcloud secrets add-iam-policy-binding firebase-config \
  --member=serviceAccount:YOUR_SERVICE_ACCOUNT \
  --role=roles/secretmanager.secretAccessor
```

---

## Firebase Configuration

### Firestore Collections

| Collection | Description |
|------------|-------------|
| `applications` | App configurations |
| `users` | Registered users |
| `licenses` | License keys |
| `sessions` | Active sessions |
| `remote_variables` | Sync variables |
| `activity_logs` | Audit trail |
| `password_resets` | Reset tokens |
| `email_verifications` | Verification tokens |

### Composite Indexes

Create the following composite indexes in Firebase Console > Firestore > Indexes:

```
Collection: users
  Fields: appId (Ascending), username (Ascending)

Collection: licenses
  Fields: appId (Ascending), key (Ascending)

Collection: sessions
  Fields: appId (Ascending), sessionId (Ascending)
  Fields: appId (Ascending), username (Ascending), status (Ascending)

Collection: activity_logs
  Fields: appId (Ascending), timestamp (Descending)
```

### Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow admin access via service account
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

> **Note:** The backend uses the Firebase Admin SDK which bypasses security rules. Rules are a safety net for direct client access.

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | `development` | `development` or `production` |
| `PORT` | `3000` | Server port |
| `ALLOWED_ORIGINS` | `http://localhost:3000` | Comma-separated CORS origins |
| `MAX_LOGIN_ATTEMPTS` | `5` | Failed login attempts before lockout |
| `LOCKOUT_DURATION_MINUTES` | `15` | Lockout duration in minutes |
| `SESSION_MAX_AGE_HOURS` | `24` | Session TTL in hours |
| `MAX_SESSIONS` | `5` | Max concurrent sessions per user |

---

## SSL/HTTPS Setup

### Option 1: Reverse Proxy (Nginx)

```nginx
server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Option 2: Cloud Run (Automatic SSL)

Cloud Run provides automatic SSL certificates for custom domains.

---

## Custom Domain

### Cloud Run

1. Go to Cloud Run > your service > Manage Custom Domains
2. Add your domain
3. Verify domain ownership via DNS TXT record
4. Create a CNAME record pointing to `ghs.googlehosted.com`

### Nginx

1. Obtain SSL certificate: `certbot certonly --nginx -d yourdomain.com`
2. Update Nginx config with certificate paths
3. Restart Nginx: `systemctl restart nginx`

---

## Scaling

### Cloud Run

- Set `--min-instances 0` for cost savings (cold starts apply)
- Set `--min-instances 1` for production (no cold starts)
- Set `--max-instances` based on expected load
- Set `--concurrency 80` for optimal throughput

### Firestore

Firestore auto-scales. Monitor usage in Firebase Console > Usage tab.

### Connection Pooling

For high-traffic deployments, consider:
- Firebase connection pooling (built into Admin SDK)
- Redis for session caching (reduces Firestore reads)

---

## Monitoring

### Health Check Endpoint

```
GET /api/v1?action=health
```

Response:
```json
{
  "status": "ok",
  "service": "MalikAuth Security Platform",
  "db": "connected",
  "uptime": 12345.678
}
```

### Logging

Logs are written to stdout/stderr. In production:

- **Cloud Run:** View in Cloud Logging
- **Docker:** `docker logs -f malikauth`
- **Nginx:** `/var/log/nginx/access.log` and `error.log`

### Metrics to Monitor

| Metric | Warning Threshold | Critical Threshold |
|--------|-------------------|-------------------|
| Response time (p95) | > 500ms | > 2000ms |
| Error rate | > 1% | > 5% |
| Firestore reads/day | > 80% quota | > 95% quota |
| Memory usage | > 70% | > 90% |
| Session count | > 1000 | > 5000 |

### Recommended Tools

- **Uptime monitoring:** UptimeRobot, Pingdom
- **Error tracking:** Sentry
- **Performance:** Google Cloud Monitoring
- **Logs:** Google Cloud Logging / Papertrail

---

## Backup Strategy

### Firestore Backups

Enable automatic backups:

```bash
gcloud firestore export gs://YOUR_BUCKET/backups/
```

Schedule daily exports via Cloud Scheduler.

### Manual Backup

```bash
gcloud firestore export gs://YOUR_BUCKET/backups/$(date +%Y%m%d)
```

### Restore

```bash
gcloud firestore import gs://YOUR_BUCKET/backups/YYYYMMDD
```

---

## Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| `EADDRINUSE` | Port 3000 is in use. Change PORT env var. |
| Firebase connection error | Verify `firebase-applet-config.json` exists and is valid |
| CORS errors | Add your domain to `ALLOWED_ORIGINS` |
| Rate limiting | Increase limits in rate limiter config or disable for internal use |
| Memory exceeded | Increase Cloud Run memory or optimize Firestore queries |
