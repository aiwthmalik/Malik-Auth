import express, { type Request, type Response, type NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';
import { initializeApp, getApps } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  deleteDoc
} from 'firebase/firestore';
import {
  hashPassword,
  comparePassword,
  sanitizeString,
  validateAppId,
  validateLicenseKey,
  csrfMiddleware,
  apiKeyMiddleware,
  createRateLimiter
} from './src/lib/security';
import { startAutoExpireCron } from './src/lib/cron';
import { AppError, NotFoundError, ValidationError, AuthError, RateLimitError } from './src/lib/errors';
import {
  validateInitInput,
  validateRegisterInput,
  validateLoginInput,
  validateLicenseInput,
  validateHeartbeatInput,
  validatePasswordResetInput,
  validatePasswordResetConfirmInput,
  validateEmailVerifyInput,
  type ValidationResult,
  type ValidationErrorResult
} from './src/lib/validation';

function isValidationFailure(result: any): result is ValidationErrorResult {
  return result.valid === false;
}

// 1. Initialize Firebase Admin / Client SDK on Node Server
let firebaseConfig: any = {};
try {
  const configFile = path.join(process.cwd(), 'firebase-applet-config.json');
  if (fs.existsSync(configFile)) {
    firebaseConfig = JSON.parse(fs.readFileSync(configFile, 'utf-8'));
  }
} catch (e) {
  console.error('Error reading firebase-applet-config.json:', e);
}

const firebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId || undefined);

/**
 * Parses expiry strings into a JavaScript Date object for accurate comparison.
 */
function parseExpiryToDate(expiryStr?: string | null): Date | null {
  if (!expiryStr) return null;
  if (typeof expiryStr !== 'string') return null;
  const lower = expiryStr.toLowerCase().trim();
  if (lower.includes('lifetime') || lower.includes('never')) return null;

  // Pattern 1: DD/MM/YYYY hh:mm am/pm or DD/MM/YYYY hh:mm:ss am/pm
  const cleanMatch = lower.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?\s*(am|pm)?$/i);
  if (cleanMatch) {
    const day = parseInt(cleanMatch[1], 10);
    const month = parseInt(cleanMatch[2], 10) - 1;
    const year = parseInt(cleanMatch[3], 10);
    let hours = parseInt(cleanMatch[4], 10);
    const minutes = parseInt(cleanMatch[5], 10);
    const seconds = cleanMatch[6] ? parseInt(cleanMatch[6], 10) : 0;
    const ampm = (cleanMatch[7] || '').toUpperCase();

    if (ampm === 'PM' && hours < 12) hours += 12;
    if (ampm === 'AM' && hours === 12) hours = 0;

    const d = new Date(year, month, day, hours, minutes, seconds);
    if (!isNaN(d.getTime())) return d;
  }

  // Pattern 2: Legacy [DD/MM/YYYY][HH:MM:SS AM/PM PKT]
  const pktMatch = expiryStr.match(/\[(\d{1,2})\/(\d{1,2})\/(\d{4})\]\s*\[(\d{1,2}):(\d{1,2}):(\d{1,2})\s*(AM|PM)?\s*PKT\]/i);
  if (pktMatch) {
    const day = parseInt(pktMatch[1], 10);
    const month = parseInt(pktMatch[2], 10) - 1;
    const year = parseInt(pktMatch[3], 10);
    let hours = parseInt(pktMatch[4], 10);
    const minutes = parseInt(pktMatch[5], 10);
    const seconds = parseInt(pktMatch[6], 10);
    const ampm = (pktMatch[7] || '').toUpperCase();

    if (ampm === 'PM' && hours < 12) hours += 12;
    if (ampm === 'AM' && hours === 12) hours = 0;

    const utcDate = new Date(Date.UTC(year, month, day, hours - 5, minutes, seconds));
    if (!isNaN(utcDate.getTime())) return utcDate;
  }

  // Pattern 3: Standard Date string or ISO string
  const stdDate = new Date(expiryStr);
  if (!isNaN(stdDate.getTime())) {
    return stdDate;
  }

  return null;
}

/**
 * Checks if an expiry string has passed the current timestamp
 */
function checkIsExpired(expiryStr?: string | null): boolean {
  if (!expiryStr) return false;
  const d = parseExpiryToDate(expiryStr);
  if (!d) return false;
  return d.getTime() <= Date.now();
}

// ============================================
// ITEM 13: FAILED LOGIN LOCKOUT
// ============================================

interface LockoutEntry {
  attempts: number;
  lockedUntil: number;
}

const lockoutStore = new Map<string, LockoutEntry>();

const MAX_LOGIN_ATTEMPTS = parseInt(process.env.MAX_LOGIN_ATTEMPTS || '5', 10);
const LOCKOUT_DURATION_MS = parseInt(process.env.LOCKOUT_DURATION_MINUTES || '15', 10) * 60 * 1000;
const SESSION_MAX_AGE_MS = parseInt(process.env.SESSION_MAX_AGE_HOURS || '24', 10) * 60 * 60 * 1000;
const MAX_SESSIONS = parseInt(process.env.MAX_SESSIONS || '5', 10);

function getLockoutKey(username: string, appId: string): string {
  return `${appId}:${username}`.toLowerCase();
}

function isLockedOut(username: string, appId: string): { locked: boolean; remainingMs: number } {
  const key = getLockoutKey(username, appId);
  const entry = lockoutStore.get(key);
  if (!entry) return { locked: false, remainingMs: 0 };

  if (Date.now() > entry.lockedUntil) {
    lockoutStore.delete(key);
    return { locked: false, remainingMs: 0 };
  }

  return { locked: true, remainingMs: entry.lockedUntil - Date.now() };
}

function recordFailedAttempt(username: string, appId: string): { locked: boolean; remainingMs: number } {
  const key = getLockoutKey(username, appId);
  let entry = lockoutStore.get(key);

  if (!entry) {
    entry = { attempts: 1, lockedUntil: 0 };
  } else {
    entry.attempts++;
  }

  if (entry.attempts >= MAX_LOGIN_ATTEMPTS) {
    entry.lockedUntil = Date.now() + LOCKOUT_DURATION_MS;
    lockoutStore.set(key, entry);
    return { locked: true, remainingMs: LOCKOUT_DURATION_MS };
  }

  lockoutStore.set(key, entry);
  return { locked: false, remainingMs: 0 };
}

function clearLockout(username: string, appId: string): void {
  const key = getLockoutKey(username, appId);
  lockoutStore.delete(key);
}

// Cleanup expired lockouts every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of lockoutStore.entries()) {
    if (now > entry.lockedUntil) {
      lockoutStore.delete(key);
    }
  }
}, 300000);

// ============================================
// ITEM 18: REQUEST LOGGER
// ============================================

function requestLogger(req: Request, res: Response, next: NextFunction): void {
  if (req.path === '/api/v1' && req.method === 'GET' && req.query?.action === 'health') {
    return next();
  }

  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.path} ${res.statusCode} ${duration}ms`);
  });

  next();
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // ============================================
  // SECURITY MIDDLEWARE (Items 3, 4, 7, 8)
  // ============================================

  // Item 7: Helmet Security Headers
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"]
      }
    },
    frameguard: { action: 'deny' },
    noSniff: true,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    hsts: process.env.NODE_ENV === 'production' ? { maxAge: 31536000, includeSubDomains: true } : false
  }));

  // Item 4: CORS Restricted Origins
  const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000').split(',').map(o => o.trim());
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin && allowedOrigins.includes(origin)) {
      res.header('Access-Control-Allow-Origin', origin);
    } else if (!origin && req.headers.host) {
      res.header('Access-Control-Allow-Origin', `http://${req.headers.host}`);
    }
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-API-Key, X-CSRF-Token, X-CSRF-Session');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Item 3: Rate Limiters
  const globalLimiter = createRateLimiter(15 * 60 * 1000, 100); // 100 requests per 15 min
  const authLimiter = createRateLimiter(15 * 60 * 1000, 10); // 10 requests per 15 min for auth
  const heartbeatLimiter = createRateLimiter(60 * 1000, 60); // 60 requests per minute

  // Item 8: API Key Authentication
  app.use('/api/v1', apiKeyMiddleware);

  // Apply global rate limiter to API endpoint
  app.use('/api/v1', globalLimiter);

  // Serve static SDK & Auth solution directories (once only)
  app.use('/sdk', express.static(path.join(process.cwd(), 'sdk')));
  app.use('/Auth', express.static(path.join(process.cwd(), 'Auth')));

  // Item 18: Request Logger
  app.use(requestLogger);

  // ============================================
  // MALIKAUTH — SINGLE UNIFIED API ENDPOINT
  // ============================================
  // POST /api/v1  { "action": "<action_name>", ...params }
  // GET  /api/v1  { "action": "health" }
  //
  // Supported actions:
  //   health          — Health check
  //   sdk-files       — Retrieve C# SDK files for viewer
  //   init            — Client initialization (verify appId/appSecret)
  //   register        — User registration with license key
  //   login           — User login / authentication
  //   license         — Direct license key validation
  //   heartbeat       — Session heartbeat & remote kill switch

  app.all('/api/v1', async (req, res) => {
    try {
      // --- Health check (works for both GET and POST) ---
      const action = (req.method === 'GET')
        ? 'health'
        : (req.body?.action || '');

      const body = req.body || {};

      // Apply auth-specific rate limiting for register/login
      if (action === 'register' || action === 'login') {
        const authLimiterInstance = rateLimit({
          windowMs: 15 * 60 * 1000,
          max: 10,
          keyGenerator: () => `auth-${req.ip}`,
          handler: (req: express.Request, res: express.Response) => {
            res.status(429).json({ success: false, message: 'Too many authentication attempts. Please try again later.' });
          }
        });
        await new Promise<void>((resolve) => {
          authLimiterInstance(req, res, () => resolve());
        });
        if (res.headersSent) return;
      }

      // Apply heartbeat-specific rate limiting
      if (action === 'heartbeat') {
        const heartbeatLimiterInstance = rateLimit({
          windowMs: 60 * 1000,
          max: 60,
          keyGenerator: () => `heartbeat-${req.ip}`,
          handler: (req: express.Request, res: express.Response) => {
            res.status(429).json({ success: false, message: 'Too many heartbeat requests. Please try again later.' });
          }
        });
        await new Promise<void>((resolve) => {
          heartbeatLimiterInstance(req, res, () => resolve());
        });
        if (res.headersSent) return;
      }

      // ── HEALTH ──────────────────────────────────────────
      if (action === 'health') {
        let dbStatus = 'connected';
        try {
          const testQuery = query(collection(db, '_health_check'), limit(1));
          await getDocs(testQuery);
        } catch (dbErr) {
          dbStatus = 'disconnected';
        }

        if (dbStatus === 'disconnected') {
          return res.status(503).json({
            status: 'degraded',
            service: 'MalikAuth Security Platform',
            db: 'disconnected',
            uptime: process.uptime()
          });
        }

        return res.json({
          status: 'ok',
          service: 'MalikAuth Security Platform',
          db: 'connected',
          uptime: process.uptime()
        });
      }

      // ── SDK FILES ───────────────────────────────────────
      if (action === 'sdk-files') {
        const dirPath = fs.existsSync(path.join(process.cwd(), 'Auth', 'Auth'))
          ? path.join(process.cwd(), 'Auth', 'Auth')
          : path.join(process.cwd(), 'sdk', 'csharp-winforms');

        if (!fs.existsSync(dirPath)) {
          return res.status(404).json({ success: false, message: 'SDK directory not found.' });
        }

        const fileNames = fs.readdirSync(dirPath);
        const textExtensions = ['.cs', '.csproj', '.config', '.json', '.xml', '.md'];
        const files: any[] = [];

        fileNames.forEach((fileName) => {
          const filePath = path.join(dirPath, fileName);
          const stat = fs.statSync(filePath);
          if (stat.isFile()) {
            const ext = path.extname(fileName).toLowerCase();
            if (textExtensions.includes(ext) || fileName === 'packages.config') {
              const content = fs.readFileSync(filePath, 'utf-8');
              files.push({
                fileName,
                path: `/Auth/Auth/${fileName}`,
                content
              });
            }
          }
        });

        return res.json({ success: true, files });
      }

      // ── All remaining actions require POST ──────────────
      if (req.method !== 'POST') {
        return res.status(405).json({ success: false, message: `Action '${action}' requires POST method.` });
      }

      // ── INIT ────────────────────────────────────────────
      if (action === 'init') {
        const validation = validateInitInput(body);
        if (isValidationFailure(validation)) {
          return res.status(400).json({ success: false, message: validation.error });
        }

        let { appId, appSecret, version, hwid } = validation.data;

        const appQuery = query(collection(db, 'applications'), where('appId', '==', appId));
        const appSnap = await getDocs(appQuery);

        let appData: any = null;

        if (appSnap.empty) {
          const appRef = doc(collection(db, 'applications'));
          appData = {
            appId,
            name: 'MalikAuth Application',
            ownerId: 'hhVHo',
            appSecret: appSecret || '6tU5MfodyopJfwyswAaq',
            version: version || '1.0.0',
            status: 'Active',
            webhookUrl: '',
            createdAt: new Date().toISOString()
          };
          await setDoc(appRef, appData);
        } else {
          appData = appSnap.docs[0].data();
        }

        if (appData.status === 'Disabled' || appData.status === 'Banned') {
          return res.status(403).json({ success: false, message: 'Application has been disabled by security administrator.' });
        }

        return res.json({
          success: true,
          message: 'MalikAuth Security Engine Initialized Successfully',
          appName: appData.name || 'MalikAuth Application',
          version: appData.version || '1.0.0',
          hwid: hwid || 'N/A'
        });
      }

      // ── REGISTER ────────────────────────────────────────
      if (action === 'register') {
        const validation = validateRegisterInput(body);
        if (isValidationFailure(validation)) {
          return res.status(400).json({ success: false, message: validation.error });
        }

        let { appId, username, password, licenseKey, hwid } = validation.data;

        const cleanUsername = String(username).trim();
        const cleanKey = String(licenseKey).trim();
        const userHwid = hwid || 'HWID-AUTO-DETECT';

        // Item 5: Validate license key format
        if (!validateLicenseKey(cleanKey)) {
          return res.status(400).json({
            success: false,
            message: 'Invalid license key format. Expected format: MALIK-XXXX-XXXX-XXXX-XXXX'
          });
        }

        // 1. Verify Application Credentials if appSecret provided
        const appSecret = (body as any).appSecret;
        if (appSecret) {
          const appQuery = query(collection(db, 'applications'), where('appId', '==', appId));
          const appSnap = await getDocs(appQuery);
          if (!appSnap.empty) {
            const appData = appSnap.docs[0].data();
            if (appData.appSecret !== appSecret) {
              return res.status(401).json({ success: false, message: 'Invalid Application Secret credentials.' });
            }
          }
        }

        // 2. Check if username already exists for this App
        const userQuery = query(
          collection(db, 'users'),
          where('appId', '==', appId),
          where('username', '==', cleanUsername)
        );
        const userSnap = await getDocs(userQuery);

        if (!userSnap.empty) {
          return res.status(400).json({
            success: false,
            message: `Username '${cleanUsername}' is already registered. Please choose a different username.`
          });
        }

        // 3. Query & Validate License Key in Firestore
        const keyQuery = query(
          collection(db, 'licenses'),
          where('appId', '==', appId),
          where('key', '==', cleanKey)
        );
        const keySnap = await getDocs(keyQuery);

        if (keySnap.empty) {
          return res.status(404).json({
            success: false,
            message: `Invalid License Key '${cleanKey}'. Key does not exist for this application.`
          });
        }

        const keyDoc = keySnap.docs[0];
        const keyData = keyDoc.data();

        if (keyData.status === 'Banned') {
          return res.status(403).json({
            success: false,
            message: `License key '${cleanKey}' has been BANNED by security administration.`
          });
        }

        if (keyData.status === 'Used') {
          return res.status(400).json({
            success: false,
            message: `License key '${cleanKey}' has ALREADY been used/redeemed by user '${keyData.usedBy || 'another user'}'.`
          });
        }

        // Check Expiry for License Key
        if (keyData.status === 'Expired' || checkIsExpired(keyData.expiry)) {
          if (keyData.status !== 'Expired') {
            await updateDoc(doc(db, 'licenses', keyDoc.id), { status: 'Expired' });
          }
          return res.status(403).json({
            success: false,
            message: `License key '${cleanKey}' has EXPIRED on ${keyData.expiry || 'past date'}. Registration denied.`
          });
        }

        const now = new Date().toISOString();
        const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '0.0.0.0';

        // 4. Mark License Key as USED in Firestore Database
        await updateDoc(doc(db, 'licenses', keyDoc.id), {
          status: 'Used',
          usedBy: cleanUsername,
          usedAt: now,
          hwid: userHwid
        });

        // 5. Create User Record in Firestore Database (with hashed password)
        const userDocRef = doc(collection(db, 'users'));
        const hashedPassword = await hashPassword(String(password).trim());
        const newUser = {
          appId,
          username: cleanUsername,
          password: hashedPassword,
          licenseKey: cleanKey,
          hwid: userHwid,
          role: 'Premium Member',
          status: 'Active',
          expiry: keyData.expiry || 'Lifetime (Never Expires)',
          ipAddress: clientIp,
          lastSeen: now,
          createdAt: now
        };
        await setDoc(userDocRef, newUser);

        // 6. Create Active Session Record in Firestore Database
        const sessionId = `SESS-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
        const sessionDocRef = doc(collection(db, 'sessions'));
        const newSession = {
          appId,
          username: cleanUsername,
          sessionId,
          hwid: userHwid,
          ipAddress: clientIp,
          status: 'Active',
          loginTime: now,
          lastHeartbeat: now,
          createdAt: now
        };
        await setDoc(sessionDocRef, newSession);

        // 6b. Enforce max sessions limit - terminate oldest if exceeded
        const sessQuery = query(
          collection(db, 'sessions'),
          where('appId', '==', appId),
          where('username', '==', cleanUsername),
          where('status', '==', 'Active')
        );
        const sessSnap = await getDocs(sessQuery);
        if (sessSnap.docs.length > MAX_SESSIONS) {
          const sorted = sessSnap.docs
            .map(d => ({ id: d.id, data: d.data() }))
            .sort((a, b) => {
              const ta = new Date(a.data.loginTime).getTime();
              const tb = new Date(b.data.loginTime).getTime();
              return ta - tb;
            });
          const toTerminate = sorted.slice(0, sessSnap.docs.length - MAX_SESSIONS);
          for (const s of toTerminate) {
            await updateDoc(doc(db, 'sessions', s.id), { status: 'Terminated' });
          }
        }

        // 7. Record Activity & Audit Log in Firestore
        const logDocRef = doc(collection(db, 'activity_logs'));
        await setDoc(logDocRef, {
          appId,
          action: 'USER_REGISTER',
          actor: cleanUsername,
          hwid: userHwid,
          details: `Registered user '${cleanUsername}' using key '${cleanKey}' (Status updated to USED)`,
          timestamp: now
        });

        return res.json({
          success: true,
          message: `Account '${cleanUsername}' registered successfully! License key redeemed.`,
          username: cleanUsername,
          role: 'Premium Member',
          sessionId,
          hwid: userHwid
        });
      }

      // ── LOGIN ───────────────────────────────────────────
      if (action === 'login') {
        const validation = validateLoginInput(body);
        if (isValidationFailure(validation)) {
          return res.status(400).json({ success: false, message: validation.error });
        }

        let { appId, username, password, hwid } = validation.data;

        const cleanUsername = String(username).trim();
        const cleanPassword = String(password).trim();
        const clientHwid = hwid || 'HWID-AUTO-DETECT';

        // Item 13: Check lockout before querying DB
        const lockoutStatus = isLockedOut(cleanUsername, appId);
        if (lockoutStatus.locked) {
          const remainingMin = Math.ceil(lockoutStatus.remainingMs / 60000);
          return res.status(423).json({
            success: false,
            message: `Account temporarily locked due to too many failed attempts. Try again in ${remainingMin} minute(s).`
          });
        }

        // 1. Verify User Credentials in Firestore
        const userQuery = query(
          collection(db, 'users'),
          where('appId', '==', appId),
          where('username', '==', cleanUsername)
        );
        const userSnap = await getDocs(userQuery);

        if (userSnap.empty) {
          return res.status(404).json({
            success: false,
            message: `User '${cleanUsername}' does not exist. Please register with a valid license key first.`
          });
        }

        const userDoc = userSnap.docs[0];
        const userData = userDoc.data();

        // Item 2: Password comparison with bcrypt
        const passwordMatch = await comparePassword(cleanPassword, userData.password);
        if (!passwordMatch) {
          // Item 13: Record failed attempt
          const lockout = recordFailedAttempt(cleanUsername, appId);
          if (lockout.locked) {
            return res.status(423).json({
              success: false,
              message: 'Account temporarily locked due to too many failed attempts.'
            });
          }
          return res.status(401).json({ success: false, message: 'Invalid password. Access denied.' });
        }

        // Item 13: Clear lockout on successful login
        clearLockout(cleanUsername, appId);

        if (userData.status === 'Banned') {
          return res.status(403).json({ success: false, message: 'User account has been BANNED by security administrator.' });
        }

        // Check Expiry for User Account
        if (userData.status === 'Expired' || checkIsExpired(userData.expiry)) {
          if (userData.status !== 'Expired') {
            await updateDoc(doc(db, 'users', userDoc.id), { status: 'Expired' });
          }
          return res.status(403).json({
            success: false,
            message: `Access Denied: User account '${cleanUsername}' expired on ${userData.expiry || 'past date'}. Access denied.`
          });
        }

        // Check Expiry for Linked License Key
        if (userData.licenseKey && userData.licenseKey !== 'CUSTOM_USER_AUTH') {
          const keyQuery = query(
            collection(db, 'licenses'),
            where('appId', '==', appId),
            where('key', '==', userData.licenseKey)
          );
          const keySnap = await getDocs(keyQuery);
          if (!keySnap.empty) {
            const keyDoc = keySnap.docs[0];
            const keyData = keyDoc.data();
            if (keyData.status === 'Banned') {
              return res.status(403).json({
                success: false,
                message: `Access Denied: The license key (${userData.licenseKey}) assigned to your account has been BANNED.`
              });
            }
            if (keyData.status === 'Expired' || checkIsExpired(keyData.expiry)) {
              if (userData.status !== 'Expired') {
                await updateDoc(doc(db, 'users', userDoc.id), { status: 'Expired' });
              }
              if (keyData.status !== 'Expired') {
                await updateDoc(doc(db, 'licenses', keyDoc.id), { status: 'Expired' });
              }
              return res.status(403).json({
                success: false,
                message: `Access Denied: The license key (${userData.licenseKey}) linked to your account EXPIRED on ${keyData.expiry || 'past date'}.`
              });
            }
          }
        }

        // 2. Hardware Lock (HWID) Validation
        if (userData.hwid === 'UNASSIGNED' || userData.hwid === 'RESET_PENDING') {
          await updateDoc(doc(db, 'users', userDoc.id), {
            hwid: clientHwid,
            lastSeen: new Date().toISOString()
          });
        } else if (userData.hwid !== clientHwid) {
          return res.status(403).json({
            success: false,
            message: `HWID Mismatch! Registered HWID: ${userData.hwid} does not match your current PC HWID: ${clientHwid}. Please request an HWID reset.`
          });
        }

        const now = new Date().toISOString();
        const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '0.0.0.0';

        // 3. Create Session Record in Firestore
        const sessionId = `SESS-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
        const sessionDocRef = doc(collection(db, 'sessions'));
        await setDoc(sessionDocRef, {
          appId,
          username: cleanUsername,
          sessionId,
          hwid: clientHwid,
          ipAddress: clientIp,
          status: 'Active',
          loginTime: now,
          lastHeartbeat: now,
          createdAt: now
        });

        // 3b. Enforce max sessions limit - terminate oldest if exceeded
        const sessQuery = query(
          collection(db, 'sessions'),
          where('appId', '==', appId),
          where('username', '==', cleanUsername),
          where('status', '==', 'Active')
        );
        const sessSnap = await getDocs(sessQuery);
        if (sessSnap.docs.length > MAX_SESSIONS) {
          const sorted = sessSnap.docs
            .map(d => ({ id: d.id, data: d.data() }))
            .sort((a, b) => {
              const ta = new Date(a.data.loginTime).getTime();
              const tb = new Date(b.data.loginTime).getTime();
              return ta - tb;
            });
          const toTerminate = sorted.slice(0, sessSnap.docs.length - MAX_SESSIONS);
          for (const s of toTerminate) {
            await updateDoc(doc(db, 'sessions', s.id), { status: 'Terminated' });
          }
        }

        // Update user lastSeen
        await updateDoc(doc(db, 'users', userDoc.id), { lastSeen: now, ipAddress: clientIp });

        // Log Login Activity
        const logDocRef = doc(collection(db, 'activity_logs'));
        await setDoc(logDocRef, {
          appId,
          action: 'USER_LOGIN',
          actor: cleanUsername,
          hwid: clientHwid,
          details: `User '${cleanUsername}' logged in successfully`,
          timestamp: now
        });

        return res.json({
          success: true,
          message: 'Login Successful!',
          username: cleanUsername,
          role: userData.role || 'Active Member',
          sessionId,
          hwid: clientHwid
        });
      }

      // ── LICENSE ─────────────────────────────────────────
      if (action === 'license') {
        const validation = validateLicenseInput(body);
        if (isValidationFailure(validation)) {
          return res.status(400).json({ success: false, message: validation.error });
        }

        let { appId, licenseKey, hwid } = validation.data;

        const cleanKey = String(licenseKey).trim();
        const userHwid = hwid || 'HWID-AUTO-DETECT';

        // Item 5: Validate license key format
        if (!validateLicenseKey(cleanKey)) {
          return res.status(400).json({ success: false, message: 'Invalid license key format.' });
        }

        const keyQuery = query(
          collection(db, 'licenses'),
          where('appId', '==', appId),
          where('key', '==', cleanKey)
        );
        const keySnap = await getDocs(keyQuery);

        if (keySnap.empty) {
          return res.status(404).json({ success: false, message: 'Invalid License Key.' });
        }

        const keyDoc = keySnap.docs[0];
        const keyData = keyDoc.data();

        if (keyData.status === 'Banned') {
          return res.status(403).json({ success: false, message: 'License Key is Banned.' });
        }
        if (keyData.status === 'Used') {
          return res.status(400).json({ success: false, message: 'License Key has already been used.' });
        }
        if (keyData.status === 'Expired' || checkIsExpired(keyData.expiry)) {
          if (keyData.status !== 'Expired') {
            await updateDoc(doc(db, 'licenses', keyDoc.id), { status: 'Expired' });
          }
          return res.status(403).json({ success: false, message: `License Key '${cleanKey}' has EXPIRED on ${keyData.expiry || 'past date'}.` });
        }

        const now = new Date().toISOString();
        await updateDoc(doc(db, 'licenses', keyDoc.id), {
          status: 'Used',
          usedBy: `KEY_ACTIVATION_${userHwid.substring(0, 6)}`,
          usedAt: now,
          hwid: userHwid
        });

        return res.json({
          success: true,
          message: 'License Key activated successfully!',
          key: cleanKey,
          status: 'Used',
          hwid: userHwid
        });
      }

      // ── HEARTBEAT ───────────────────────────────────────
      if (action === 'heartbeat') {
        const validation = validateHeartbeatInput(body);
        if (isValidationFailure(validation)) {
          return res.json({ active: false, status: 'NotFound' });
        }

        let { appId, sessionId, hwid } = validation.data;

        const q = query(
          collection(db, 'sessions'),
          where('appId', '==', appId),
          where('sessionId', '==', sessionId)
        );
        const snap = await getDocs(q);

        if (snap.empty) {
          return res.json({ active: false, status: 'NotFound' });
        }

        const sessionDoc = snap.docs[0];
        const sessionData = sessionDoc.data();

        if (sessionData.status === 'Terminated' || sessionData.status === 'Banned') {
          return res.json({ active: false, status: 'Terminated' });
        }

        // Item 12: Session TTL check
        if (sessionData.loginTime) {
          const loginTs = new Date(sessionData.loginTime).getTime();
          if (Date.now() - loginTs > SESSION_MAX_AGE_MS) {
            await updateDoc(doc(db, 'sessions', sessionDoc.id), { status: 'Terminated' });
            return res.json({ active: false, status: 'Expired' });
          }
        }

        // Check if user account associated with session is banned or expired
        if (sessionData.username) {
          const userQ = query(
            collection(db, 'users'),
            where('appId', '==', appId),
            where('username', '==', sessionData.username)
          );
          const userSnap = await getDocs(userQ);
          if (!userSnap.empty) {
            const userDoc = userSnap.docs[0];
            const userData = userDoc.data();
            if (userData.status === 'Banned' || userData.status === 'Expired' || checkIsExpired(userData.expiry)) {
              if (userData.status !== 'Expired' && checkIsExpired(userData.expiry)) {
                await updateDoc(doc(db, 'users', userDoc.id), { status: 'Expired' });
              }
              if (sessionData.status !== 'Terminated') {
                await updateDoc(doc(db, 'sessions', sessionDoc.id), { status: 'Terminated' });
              }
              return res.json({ active: false, status: 'Terminated' });
            }
          }
        }

        // Update heartbeat timestamp
        const now = new Date().toISOString();
        await updateDoc(doc(db, 'sessions', sessionDoc.id), { lastHeartbeat: now });

        return res.json({ active: true, status: 'Active' });
      }

      // ── PASSWORD-RESET ────────────────────────────────
      if (action === 'password-reset') {
        const validation = validatePasswordResetInput(body);
        if (isValidationFailure(validation)) {
          return res.status(400).json({ success: false, message: validation.error });
        }

        const { appId, username, email } = validation.data;

        const userQuery = query(
          collection(db, 'users'),
          where('appId', '==', appId),
          where('username', '==', username)
        );
        const userSnap = await getDocs(userQuery);

        if (userSnap.empty) {
          return res.json({ success: true, message: 'Reset instructions sent.' });
        }

        const userDoc = userSnap.docs[0];
        const userData = userDoc.data();

        const resetToken = crypto.randomBytes(16).toString('hex');
        const now = new Date().toISOString();
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();

        const resetDocRef = doc(collection(db, 'password_resets'));
        await setDoc(resetDocRef, {
          appId,
          username,
          email,
          token: resetToken,
          userId: userDoc.id,
          used: false,
          createdAt: now,
          expiresAt
        });

        const logDocRef = doc(collection(db, 'activity_logs'));
        await setDoc(logDocRef, {
          appId,
          action: 'PASSWORD_RESET_REQUEST',
          actor: username,
          hwid: userData.hwid || 'N/A',
          details: `Password reset requested for user '${username}'`,
          timestamp: now
        });

        return res.json({ success: true, message: 'Reset instructions sent.' });
      }

      // ── PASSWORD-RESET-CONFIRM ────────────────────────
      if (action === 'password-reset-confirm') {
        const validation = validatePasswordResetConfirmInput(body);
        if (isValidationFailure(validation)) {
          return res.status(400).json({ success: false, message: validation.error });
        }

        const { appId, username, token, newPassword } = validation.data;

        const resetQuery = query(
          collection(db, 'password_resets'),
          where('appId', '==', appId),
          where('username', '==', username),
          where('token', '==', token),
          where('used', '==', false)
        );
        const resetSnap = await getDocs(resetQuery);

        if (resetSnap.empty) {
          return res.status(400).json({ success: false, message: 'Invalid or expired reset token.' });
        }

        const resetDoc = resetSnap.docs[0];
        const resetData = resetDoc.data();

        if (new Date(resetData.expiresAt).getTime() < Date.now()) {
          await deleteDoc(doc(db, 'password_resets', resetDoc.id));
          return res.status(400).json({ success: false, message: 'Reset token has expired. Please request a new one.' });
        }

        const hashedPassword = await hashPassword(newPassword);

        const userQuery = query(
          collection(db, 'users'),
          where('appId', '==', appId),
          where('username', '==', username)
        );
        const userSnap = await getDocs(userQuery);
        if (!userSnap.empty) {
          const userDoc = userSnap.docs[0];
          await updateDoc(doc(db, 'users', userDoc.id), { password: hashedPassword });
        }

        await updateDoc(doc(db, 'password_resets', resetDoc.id), { used: true });

        const now = new Date().toISOString();
        const logDocRef = doc(collection(db, 'activity_logs'));
        await setDoc(logDocRef, {
          appId,
          action: 'PASSWORD_RESET_CONFIRM',
          actor: username,
          hwid: 'N/A',
          details: `Password successfully reset for user '${username}'`,
          timestamp: now
        });

        return res.json({ success: true, message: 'Password reset successful.' });
      }

      // ── VERIFY-EMAIL ──────────────────────────────────
      if (action === 'verify-email') {
        const validation = validateEmailVerifyInput(body);
        if (isValidationFailure(validation)) {
          return res.status(400).json({ success: false, message: validation.error });
        }

        const { appId, username, token } = validation.data;

        const verifyQuery = query(
          collection(db, 'email_verifications'),
          where('appId', '==', appId),
          where('username', '==', username),
          where('token', '==', token),
          where('used', '==', false)
        );
        const verifySnap = await getDocs(verifyQuery);

        if (verifySnap.empty) {
          return res.status(400).json({ success: false, message: 'Invalid or already used verification token.' });
        }

        const verifyDoc = verifySnap.docs[0];
        const verifyData = verifyDoc.data();

        if (verifyData.expiresAt && new Date(verifyData.expiresAt).getTime() < Date.now()) {
          await deleteDoc(doc(db, 'email_verifications', verifyDoc.id));
          return res.status(400).json({ success: false, message: 'Verification token has expired.' });
        }

        const userQuery = query(
          collection(db, 'users'),
          where('appId', '==', appId),
          where('username', '==', username)
        );
        const userSnap = await getDocs(userQuery);
        if (!userSnap.empty) {
          const userDoc = userSnap.docs[0];
          await updateDoc(doc(db, 'users', userDoc.id), { emailVerified: true });
        }

        await updateDoc(doc(db, 'email_verifications', verifyDoc.id), { used: true });

        const now = new Date().toISOString();
        const logDocRef = doc(collection(db, 'activity_logs'));
        await setDoc(logDocRef, {
          appId,
          action: 'EMAIL_VERIFIED',
          actor: username,
          hwid: 'N/A',
          details: `Email verified for user '${username}'`,
          timestamp: now
        });

        return res.json({ success: true, message: 'Email verified successfully.' });
      }

      // ── UNKNOWN ACTION ──────────────────────────────────
      return res.status(400).json({
        success: false,
        message: `Unknown action '${action}'. Supported: health, sdk-files, init, register, login, license, heartbeat, password-reset, password-reset-confirm, verify-email`
      });
    } catch (err: any) {
      if (err instanceof AppError) {
        console.error(`[AppError] ${err.message} (${err.statusCode})`);
        return res.status(err.statusCode).json({ success: false, message: err.message });
      }
      console.error(`API Error [action=${req.body?.action || 'unknown'}]:`, err);
      return res.status(500).json({ success: false, message: err.message || 'Internal server error' });
    }
  });

  // Vite middleware for development / static serving in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Item 17: Error handling middleware (must be after routes, before Vite)
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    if (err instanceof AppError) {
      console.error(`[AppError] ${err.message} (${err.statusCode})`);
      res.status(err.statusCode).json({ success: false, message: err.message });
      return;
    }

    console.error('[UnhandledError]', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  });

  // Item 11: Start auto-expire cron job
  startAutoExpireCron(db);

  // Item 19: Graceful shutdown
  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`MalikAuth Server running on http://0.0.0.0:${PORT}`);
  });

  const shutdown = (signal: string) => {
    console.log(`\n[${signal}] Received. Shutting down gracefully...`);
    server.close(() => {
      console.log('[Shutdown] HTTP server closed.');
      process.exit(0);
    });

    setTimeout(() => {
      console.error('[Shutdown] Forced exit after timeout.');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

startServer();
