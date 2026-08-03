import { describe, it, expect } from 'vitest';
import {
  validateInitInput,
  validateRegisterInput,
  validateLoginInput,
  validateLicenseInput,
  validateHeartbeatInput,
  validatePasswordResetInput,
  validatePasswordResetConfirmInput,
  validateEmailVerifyInput,
} from '../lib/validation';

describe('validateInitInput', () => {
  it('should reject missing appId', () => {
    const result = validateInitInput({});
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.error).toContain('appId');
  });

  it('should reject appId that is not 10 characters', () => {
    const result = validateInitInput({ appId: 'short' });
    expect(result.valid).toBe(false);
  });

  it('should accept valid input', () => {
    const result = validateInitInput({ appId: '1234567890' });
    expect(result.valid).toBe(true);
  });
});

describe('validateRegisterInput', () => {
  it('should reject missing appId', () => {
    const result = validateRegisterInput({});
    expect(result.valid).toBe(false);
  });

  it('should reject missing username', () => {
    const result = validateRegisterInput({ appId: '1234567890' });
    expect(result.valid).toBe(false);
  });

  it('should reject missing licenseKey', () => {
    const result = validateRegisterInput({ appId: '1234567890', username: 'user' });
    expect(result.valid).toBe(false);
  });

  it('should accept valid input', () => {
    const result = validateRegisterInput({
      appId: '1234567890',
      username: 'testuser',
      password: 'password123',
      licenseKey: 'MALIK-ABCD-1234-EFGH-5678',
      hwid: 'hwid123',
    });
    expect(result.valid).toBe(true);
  });
});

describe('validateLoginInput', () => {
  it('should reject missing appId', () => {
    const result = validateLoginInput({});
    expect(result.valid).toBe(false);
  });

  it('should reject missing username', () => {
    const result = validateLoginInput({ appId: '1234567890' });
    expect(result.valid).toBe(false);
  });

  it('should accept valid input', () => {
    const result = validateLoginInput({ appId: '1234567890', username: 'user', password: 'pass', hwid: 'hwid123' });
    expect(result.valid).toBe(true);
  });
});

describe('validateLicenseInput', () => {
  it('should reject missing appId', () => {
    const result = validateLicenseInput({});
    expect(result.valid).toBe(false);
  });

  it('should reject invalid license key format', () => {
    const result = validateLicenseInput({ appId: '1234567890', licenseKey: 'invalid-key' });
    expect(result.valid).toBe(false);
  });

  it('should accept valid input', () => {
    const result = validateLicenseInput({ appId: '1234567890', licenseKey: 'MALIK-ABCD-1234-EFGH-5678' });
    expect(result.valid).toBe(true);
  });
});

describe('validateHeartbeatInput', () => {
  it('should reject missing appId', () => {
    const result = validateHeartbeatInput({});
    expect(result.valid).toBe(false);
  });

  it('should reject missing sessionId', () => {
    const result = validateHeartbeatInput({ appId: '1234567890' });
    expect(result.valid).toBe(false);
  });

  it('should accept valid input', () => {
    const result = validateHeartbeatInput({ appId: '1234567890', sessionId: 'SESS-abc123', hwid: 'hwid123' });
    expect(result.valid).toBe(true);
  });
});

describe('validatePasswordResetInput', () => {
  it('should reject missing appId', () => {
    const result = validatePasswordResetInput({});
    expect(result.valid).toBe(false);
  });

  it('should reject missing username', () => {
    const result = validatePasswordResetInput({ appId: '1234567890' });
    expect(result.valid).toBe(false);
  });

  it('should accept valid input', () => {
    const result = validatePasswordResetInput({
      appId: '1234567890',
      username: 'user',
      email: 'test@test.com',
    });
    expect(result.valid).toBe(true);
  });
});

describe('validatePasswordResetConfirmInput', () => {
  it('should reject missing appId', () => {
    const result = validatePasswordResetConfirmInput({});
    expect(result.valid).toBe(false);
  });

  it('should reject invalid token length', () => {
    const result = validatePasswordResetConfirmInput({
      appId: '1234567890',
      username: 'user',
      token: 'short',
      newPassword: 'newpass123',
    });
    expect(result.valid).toBe(false);
  });

  it('should accept valid input', () => {
    const result = validatePasswordResetConfirmInput({
      appId: '1234567890',
      username: 'user',
      token: 'a'.repeat(32),
      newPassword: 'newpass123',
    });
    expect(result.valid).toBe(true);
  });
});

describe('validateEmailVerifyInput', () => {
  it('should reject missing appId', () => {
    const result = validateEmailVerifyInput({});
    expect(result.valid).toBe(false);
  });

  it('should reject missing token', () => {
    const result = validateEmailVerifyInput({ appId: '1234567890', username: 'user' });
    expect(result.valid).toBe(false);
  });

  it('should accept valid input', () => {
    const result = validateEmailVerifyInput({ appId: '1234567890', username: 'user', token: 'tok123' });
    expect(result.valid).toBe(true);
  });
});
