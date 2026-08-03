import bcrypt from 'bcryptjs';
import { type Request, type Response, type NextFunction } from 'express';
import crypto from 'crypto';

// ============================================
// PASSWORD HASHING (Item 2)
// ============================================

const SALT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// ============================================
// INPUT SANITIZATION (Item 5)
// ============================================

export function sanitizeString(str: unknown, maxLength: number = 500): string {
  if (typeof str !== 'string') return '';
  return str
    .trim()
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .substring(0, maxLength);
}

export function validateAppId(appId: string): boolean {
  return /^[a-zA-Z0-9]{10}$/.test(appId);
}

export function validateLicenseKey(key: string): boolean {
  return /^MALIK-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/i.test(key);
}

// ============================================
// CSRF PROTECTION (Item 6)
// ============================================

const csrfTokens = new Map<string, { token: string; expires: number }>();

const CSRF_TOKEN_LENGTH = 64;
const CSRF_TOKEN_EXPIRY_MS = 3600000; // 1 hour

export function generateCsrfToken(sessionId: string): string {
  const token = crypto.randomBytes(CSRF_TOKEN_LENGTH).toString('hex');
  csrfTokens.set(sessionId, { token, expires: Date.now() + CSRF_TOKEN_EXPIRY_MS });
  return token;
}

export function validateCsrfToken(sessionId: string, token: string): boolean {
  const stored = csrfTokens.get(sessionId);
  if (!stored) return false;
  if (Date.now() > stored.expires) {
    csrfTokens.delete(sessionId);
    return false;
  }
  return crypto.timingSafeEqual(Buffer.from(stored.token), Buffer.from(token));
}

export function csrfMiddleware(req: Request, res: Response, next: NextFunction): void {
  if (req.method === 'GET') {
    const sessionId = crypto.randomBytes(16).toString('hex');
    const token = generateCsrfToken(sessionId);
    res.setHeader('X-CSRF-Token', token);
    res.setHeader('X-CSRF-Session', sessionId);
    return next();
  }

  if (req.method === 'POST') {
    const token = req.headers['x-csrf-token'] as string | undefined;
    const sessionId = req.headers['x-csrf-session'] as string | undefined;

    if (!token || !sessionId) {
      res.status(403).json({ success: false, message: 'CSRF token missing.' });
      return;
    }

    if (!validateCsrfToken(sessionId, token)) {
      res.status(403).json({ success: false, message: 'Invalid CSRF token.' });
      return;
    }
  }

  next();
}

// ============================================
// API KEY AUTHENTICATION (Item 8)
// ============================================

export function apiKeyMiddleware(req: Request, res: Response, next: NextFunction): void {
  if (req.method === 'OPTIONS') {
    return next();
  }

  if (req.method === 'GET') {
    return next();
  }

  const apiKeysEnv = process.env.API_KEYS || '';
  const validKeys = apiKeysEnv.split(',').map(k => k.trim()).filter(k => k.length > 0);

  if (validKeys.length === 0) {
    return next();
  }

  const providedKey = req.headers['x-api-key'] as string | undefined;

  if (providedKey && validKeys.includes(providedKey)) {
    return next();
  }

  const action = req.body?.action;
  if (action === 'heartbeat') {
    const { sessionId } = req.body || {};
    if (sessionId && typeof sessionId === 'string' && sessionId.startsWith('SESS-')) {
      return next();
    }
  }

  res.status(401).json({ success: false, message: 'Invalid or missing API key.' });
}

// ============================================
// RATE LIMITING HELPERS (Item 3)
// ============================================

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

export function createRateLimiter(windowMs: number, maxRequests: number) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const key = `${req.ip}-${req.path}`;
    const now = Date.now();

    let entry = rateLimitStore.get(key);

    if (!entry || now > entry.resetTime) {
      entry = { count: 0, resetTime: now + windowMs };
      rateLimitStore.set(key, entry);
    }

    entry.count++;

    const remaining = Math.max(0, maxRequests - entry.count);
    const resetInSeconds = Math.ceil((entry.resetTime - now) / 1000);

    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', remaining);
    res.setHeader('X-RateLimit-Reset', resetInSeconds);

    if (entry.count > maxRequests) {
      res.status(429).json({
        success: false,
        message: 'Too many requests. Please try again later.'
      });
      return;
    }

    next();
  };
}

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, 300000);
