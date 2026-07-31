export interface MalikApp {
  id?: string;
  name: string;
  appId: string;
  appSecret: string;
  version: string;
  status: 'Active' | 'Maintenance' | 'Disabled';
  ownerId: string;
  encryptionKey: string;
  allowHwidReset: boolean;
  motd: string;
  discordWebhook?: string;
  createdAt: string;
}

export interface MalikLicense {
  id?: string;
  key: string;
  keyName?: string;
  appId: string;
  durationDays?: number; // 9999 for Lifetime
  role?: string;
  maxDevices?: number;
  status: 'Unused' | 'Active' | 'Expired' | 'Banned';
  note: string;
  expiry?: string; // [dd/mm/yyyy][hh:mm:ss am/pm]
  usedBy: string; // HWID or username
  activatedAt?: string;
  expiresAt?: string;
  createdAt: string;
}

export interface MalikUser {
  id?: string;
  username: string;
  password?: string;
  email?: string;
  appId: string;
  hwid: string;
  role?: string;
  licenseKey: string;
  ipAddress: string;
  status: 'Active' | 'Banned' | 'Suspended';
  expiry?: string; // [dd/mm/yyyy][hh:mm:ss am/pm]
  lastSeen: string;
  createdAt: string;
}

export interface MalikSession {
  id?: string;
  sessionId: string;
  appId: string;
  username: string;
  hwid: string;
  ipAddress: string;
  status: 'Active' | 'Revoked' | 'Terminated';
  lastHeartbeat: string;
  createdAt: string;
}

export interface MalikRemoteVariable {
  id?: string;
  appId: string;
  key: string;
  value: string;
  isEncrypted: boolean;
  minRole: string; // e.g. "Basic", "VIP", "Admin"
  updatedAt: string;
}

export interface MalikActivityLog {
  id?: string;
  appId: string;
  action: 'LICENSE_ACTIVATED' | 'USER_LOGIN' | 'HWID_RESET' | 'REMOTE_SYNC' | 'SESSION_REVOKED' | 'KEY_GENERATED';
  actor: string;
  hwid: string;
  details: string;
  timestamp: string;
}
