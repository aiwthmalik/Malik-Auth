import { describe, it, expect } from 'vitest';
import type { MalikApp, MalikLicense, MalikUser, MalikSession } from '../types';

describe('Shared Types', () => {
  it('should compile MalikApp interface', () => {
    const app: MalikApp = {
      name: 'TestApp',
      appId: 'abc123',
      appSecret: 'secret',
      version: '1.0.0',
      status: 'Active',
      ownerId: 'owner1',
      encryptionKey: 'key123',
      allowHwidReset: true,
      motd: 'Hello',
      createdAt: '2026-01-01',
    };
    expect(app.name).toBe('TestApp');
    expect(app.status).toBe('Active');
  });

  it('should compile MalikLicense interface', () => {
    const license: MalikLicense = {
      key: 'LICENSE-KEY-123',
      appId: 'abc123',
      durationDays: 30,
      role: 'User',
      maxDevices: 1,
      status: 'Active',
      note: 'Test license',
      usedBy: 'hwid-123',
      createdAt: '2026-01-01',
    };
    expect(license.key).toBe('LICENSE-KEY-123');
    expect(license.status).toBe('Active');
  });

  it('should compile MalikUser interface', () => {
    const user: MalikUser = {
      username: 'testuser',
      appId: 'abc123',
      hwid: 'hwid-123',
      licenseKey: 'LICENSE-KEY-123',
      ipAddress: '127.0.0.1',
      status: 'Active',
      lastSeen: '2026-01-01',
      createdAt: '2026-01-01',
    };
    expect(user.username).toBe('testuser');
    expect(user.status).toBe('Active');
  });

  it('should compile MalikSession interface', () => {
    const session: MalikSession = {
      sessionId: 'session-123',
      appId: 'abc123',
      username: 'testuser',
      hwid: 'hwid-123',
      ipAddress: '127.0.0.1',
      status: 'Active',
      lastHeartbeat: '2026-01-01',
      createdAt: '2026-01-01',
    };
    expect(session.sessionId).toBe('session-123');
    expect(session.status).toBe('Active');
  });

  it('should allow optional fields to be undefined', () => {
    const app: MalikApp = {
      name: 'TestApp',
      appId: 'abc123',
      appSecret: 'secret',
      version: '1.0.0',
      status: 'Active',
      ownerId: 'owner1',
      encryptionKey: 'key123',
      allowHwidReset: true,
      motd: 'Hello',
      createdAt: '2026-01-01',
    };
    expect(app.appType).toBeUndefined();
    expect(app.discordWebhook).toBeUndefined();
  });

  it('should enforce status union types', () => {
    const app: MalikApp = {
      name: 'TestApp',
      appId: 'abc123',
      appSecret: 'secret',
      version: '1.0.0',
      status: 'Active',
      ownerId: 'owner1',
      encryptionKey: 'key123',
      allowHwidReset: true,
      motd: 'Hello',
      createdAt: '2026-01-01',
    };
    expect(['Active', 'Maintenance', 'Disabled']).toContain(app.status);
  });
});
