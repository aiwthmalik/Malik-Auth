import { sanitizeString } from './security';

export interface ValidationResult {
  valid: true;
  data: Record<string, any>;
}

export interface ValidationErrorResult {
  valid: false;
  error: string;
}

export type ValidationResultType = ValidationResult | ValidationErrorResult;

export function validateInitInput(body: any): ValidationResultType {
  const { appId, appSecret, version, hwid } = body || {};

  if (!appId || typeof appId !== 'string' || appId.trim().length !== 10) {
    return { valid: false, error: 'appId is required and must be exactly 10 characters.' };
  }

  if (appSecret !== undefined && typeof appSecret !== 'string') {
    return { valid: false, error: 'appSecret must be a string.' };
  }

  if (version !== undefined && typeof version !== 'string') {
    return { valid: false, error: 'version must be a string.' };
  }

  if (hwid !== undefined && typeof hwid !== 'string') {
    return { valid: false, error: 'hwid must be a string.' };
  }

  return {
    valid: true,
    data: {
      appId: sanitizeString(appId, 20),
      appSecret: sanitizeString(appSecret, 100),
      version: sanitizeString(version, 20),
      hwid: sanitizeString(hwid, 100)
    }
  };
}

export function validateRegisterInput(body: any): ValidationResultType {
  const { appId, username, password, licenseKey, hwid } = body || {};

  if (!appId || typeof appId !== 'string' || appId.trim().length !== 10) {
    return { valid: false, error: 'appId is required and must be exactly 10 characters.' };
  }

  if (!username || typeof username !== 'string') {
    return { valid: false, error: 'username is required.' };
  }

  const cleanUsername = username.trim();
  if (cleanUsername.length < 3 || cleanUsername.length > 30) {
    return { valid: false, error: 'username must be between 3 and 30 characters.' };
  }

  if (!/^[a-zA-Z0-9_]+$/.test(cleanUsername)) {
    return { valid: false, error: 'username must contain only alphanumeric characters and underscores.' };
  }

  if (!password || typeof password !== 'string' || password.length < 6) {
    return { valid: false, error: 'password is required and must be at least 6 characters.' };
  }

  if (!licenseKey || typeof licenseKey !== 'string') {
    return { valid: false, error: 'licenseKey is required.' };
  }

  if (!/^MALIK-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/i.test(licenseKey.trim())) {
    return { valid: false, error: 'Invalid license key format. Expected: MALIK-XXXX-XXXX-XXXX-XXXX' };
  }

  if (hwid !== undefined && typeof hwid !== 'string') {
    return { valid: false, error: 'hwid must be a string.' };
  }

  return {
    valid: true,
    data: {
      appId: sanitizeString(appId, 20),
      username: sanitizeString(username, 50),
      password: sanitizeString(password, 100),
      licenseKey: sanitizeString(licenseKey, 30),
      hwid: sanitizeString(hwid, 100)
    }
  };
}

export function validateLoginInput(body: any): ValidationResultType {
  const { appId, username, password, hwid } = body || {};

  if (!appId || typeof appId !== 'string' || appId.trim().length !== 10) {
    return { valid: false, error: 'appId is required and must be exactly 10 characters.' };
  }

  if (!username || typeof username !== 'string' || username.trim().length < 1) {
    return { valid: false, error: 'username is required.' };
  }

  if (!password || typeof password !== 'string' || password.length < 1) {
    return { valid: false, error: 'password is required.' };
  }

  if (hwid !== undefined && typeof hwid !== 'string') {
    return { valid: false, error: 'hwid must be a string.' };
  }

  return {
    valid: true,
    data: {
      appId: sanitizeString(appId, 20),
      username: sanitizeString(username, 50),
      password: sanitizeString(password, 100),
      hwid: sanitizeString(hwid, 100)
    }
  };
}

export function validateLicenseInput(body: any): ValidationResultType {
  const { appId, licenseKey, hwid } = body || {};

  if (!appId || typeof appId !== 'string' || appId.trim().length !== 10) {
    return { valid: false, error: 'appId is required and must be exactly 10 characters.' };
  }

  if (!licenseKey || typeof licenseKey !== 'string') {
    return { valid: false, error: 'licenseKey is required.' };
  }

  if (!/^MALIK-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/i.test(licenseKey.trim())) {
    return { valid: false, error: 'Invalid license key format. Expected: MALIK-XXXX-XXXX-XXXX-XXXX' };
  }

  if (hwid !== undefined && typeof hwid !== 'string') {
    return { valid: false, error: 'hwid must be a string.' };
  }

  return {
    valid: true,
    data: {
      appId: sanitizeString(appId, 20),
      licenseKey: sanitizeString(licenseKey, 30),
      hwid: sanitizeString(hwid, 100)
    }
  };
}

export function validateHeartbeatInput(body: any): ValidationResultType {
  const { appId, sessionId, hwid } = body || {};

  if (!appId || typeof appId !== 'string' || appId.trim().length !== 10) {
    return { valid: false, error: 'appId is required and must be exactly 10 characters.' };
  }

  if (!sessionId || typeof sessionId !== 'string') {
    return { valid: false, error: 'sessionId is required.' };
  }

  if (!/^SESS-[A-Za-z0-9]+$/.test(sessionId.trim())) {
    return { valid: false, error: 'Invalid sessionId format. Expected: SESS-xxxx' };
  }

  if (hwid !== undefined && typeof hwid !== 'string') {
    return { valid: false, error: 'hwid must be a string.' };
  }

  return {
    valid: true,
    data: {
      appId: sanitizeString(appId, 20),
      sessionId: sanitizeString(sessionId, 50),
      hwid: sanitizeString(hwid, 100)
    }
  };
}

export function validatePasswordResetInput(body: any): ValidationResultType {
  const { appId, username, email } = body || {};

  if (!appId || typeof appId !== 'string' || appId.trim().length !== 10) {
    return { valid: false, error: 'appId is required and must be exactly 10 characters.' };
  }

  if (!username || typeof username !== 'string' || username.trim().length < 1) {
    return { valid: false, error: 'username is required.' };
  }

  if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { valid: false, error: 'A valid email address is required.' };
  }

  return {
    valid: true,
    data: {
      appId: sanitizeString(appId, 20),
      username: sanitizeString(username, 50),
      email: sanitizeString(email, 100)
    }
  };
}

export function validatePasswordResetConfirmInput(body: any): ValidationResultType {
  const { appId, username, token, newPassword } = body || {};

  if (!appId || typeof appId !== 'string' || appId.trim().length !== 10) {
    return { valid: false, error: 'appId is required and must be exactly 10 characters.' };
  }

  if (!username || typeof username !== 'string' || username.trim().length < 1) {
    return { valid: false, error: 'username is required.' };
  }

  if (!token || typeof token !== 'string' || token.trim().length !== 32) {
    return { valid: false, error: 'A valid 32-character reset token is required.' };
  }

  if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 6) {
    return { valid: false, error: 'newPassword is required and must be at least 6 characters.' };
  }

  return {
    valid: true,
    data: {
      appId: sanitizeString(appId, 20),
      username: sanitizeString(username, 50),
      token: sanitizeString(token, 64),
      newPassword: sanitizeString(newPassword, 100)
    }
  };
}

export function validateEmailVerifyInput(body: any): ValidationResultType {
  const { appId, username, token } = body || {};

  if (!appId || typeof appId !== 'string' || appId.trim().length !== 10) {
    return { valid: false, error: 'appId is required and must be exactly 10 characters.' };
  }

  if (!username || typeof username !== 'string' || username.trim().length < 1) {
    return { valid: false, error: 'username is required.' };
  }

  if (!token || typeof token !== 'string' || token.trim().length < 1) {
    return { valid: false, error: 'token is required.' };
  }

  return {
    valid: true,
    data: {
      appId: sanitizeString(appId, 20),
      username: sanitizeString(username, 50),
      token: sanitizeString(token, 64)
    }
  };
}
