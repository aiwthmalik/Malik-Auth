import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot
} from 'firebase/firestore';
import { db } from './firebase';
import {
  MalikApp,
  MalikLicense,
  MalikUser,
  MalikSession,
  MalikRemoteVariable,
  MalikActivityLog
} from '../types';

// Helper to log activities (stores in local storage instead of database while open)
export async function logActivity(
  appId: string,
  action: MalikActivityLog['action'],
  actor: string,
  hwid: string,
  details: string
): Promise<void> {
  try {
    const newLog: MalikActivityLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      appId,
      action,
      actor,
      hwid,
      details,
      timestamp: new Date().toISOString(),
    };

    // Save to local audit history
    const historyKey = `malik_audit_logs_${appId}`;
    const existing = JSON.parse(localStorage.getItem(historyKey) || '[]');
    const updated = [newLog, ...existing].slice(0, 500); // Keep last 500 logs locally
    localStorage.setItem(historyKey, JSON.stringify(updated));

    // Save to pending webhook queue to be sent when website is closed
    const pendingKey = `malik_pending_webhook_logs_${appId}`;
    const pending = JSON.parse(localStorage.getItem(pendingKey) || '[]');
    localStorage.setItem(pendingKey, JSON.stringify([...pending, newLog]));
  } catch (err) {
    console.error('Error logging activity to local storage:', err);
  }
}

// Flush pending logs to Discord Webhook when website is closed
export function flushAuditLogsToDiscord(appId: string, webhookUrl?: string): void {
  if (!webhookUrl || !webhookUrl.startsWith('http')) return;
  const pendingKey = `malik_pending_webhook_logs_${appId}`;
  const pendingJson = localStorage.getItem(pendingKey);
  if (!pendingJson) return;
  try {
    const pending: MalikActivityLog[] = JSON.parse(pendingJson);
    if (pending.length === 0) return;

    const embedFields = pending.slice(0, 15).map((log) => ({
      name: `[${log.action}] - ${log.actor}`,
      value: `${log.details} (HWID: ${log.hwid || 'N/A'})`,
      inline: false,
    }));

    const payload = {
      username: 'MalikAuth Security Engine',
      embeds: [
        {
          title: `🔒 MalikAuth Activity & Audit Report [App: ${appId}]`,
          description: `Summary of ${pending.length} audit event(s) logged during session.`,
          color: 5814783,
          fields: embedFields,
          timestamp: new Date().toISOString(),
        },
      ],
    };

    const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
    if (navigator.sendBeacon) {
      navigator.sendBeacon(webhookUrl, blob);
    } else {
      fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: true,
      }).catch(() => {});
    }

    localStorage.removeItem(pendingKey);
  } catch (e) {
    console.error('Error flushing audit logs to discord:', e);
  }
}

// ========================
// APPLICATIONS API
// ========================
export async function getApps(): Promise<MalikApp[]> {
  const q = query(collection(db, 'applications'), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as MalikApp));
}

export async function createApp(data: Omit<MalikApp, 'id' | 'createdAt'>): Promise<string> {
  const docRef = doc(collection(db, 'applications'));
  const newApp: MalikApp = {
    ...data,
    createdAt: new Date().toISOString(),
  };
  await setDoc(docRef, newApp);
  await logActivity(data.appId, 'KEY_GENERATED', 'Developer', 'SYS', `Created app ${data.name} (${data.appId})`);
  return docRef.id;
}

export async function updateApp(id: string, updates: Partial<MalikApp>): Promise<void> {
  await updateDoc(doc(db, 'applications', id), updates);
}

export async function deleteApp(id: string): Promise<void> {
  await deleteDoc(doc(db, 'applications', id));
}

// ========================
// LICENSES API
// ========================
export async function getLicenses(appId?: string): Promise<MalikLicense[]> {
  const colRef = collection(db, 'licenses');
  const q = appId
    ? query(colRef, where('appId', '==', appId))
    : query(colRef, orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as MalikLicense));
}

export async function generateLicenses(
  appId: string,
  amount: number,
  keyName: string,
  note: string,
  expiry: string
): Promise<string[]> {
  const generatedKeys: string[] = [];
  for (let i = 0; i < amount; i++) {
    const randomSeg1 = Math.random().toString(36).substring(2, 6).toUpperCase();
    const randomSeg2 = Math.random().toString(36).substring(2, 6).toUpperCase();
    const randomSeg3 = Math.random().toString(36).substring(2, 6).toUpperCase();
    const randomSeg4 = Math.random().toString(36).substring(2, 6).toUpperCase();
    const key = `MALIK-${randomSeg1}-${randomSeg2}-${randomSeg3}-${randomSeg4}`;
    
    const docRef = doc(collection(db, 'licenses'));
    const newLicense: MalikLicense = {
      key,
      keyName: keyName || 'Standard Key',
      appId,
      status: 'Unused',
      note: note || '',
      expiry: expiry || '',
      usedBy: '',
      createdAt: new Date().toISOString(),
    };
    await setDoc(docRef, newLicense);
    generatedKeys.push(key);
  }

  await logActivity(
    appId,
    'KEY_GENERATED',
    'Admin',
    'N/A',
    `Generated ${amount} license key(s) [${keyName}] with expiry ${expiry}`
  );

  return generatedKeys;
}

export async function updateLicense(id: string, updates: Partial<MalikLicense>): Promise<void> {
  await updateDoc(doc(db, 'licenses', id), updates);
}

export async function deleteLicense(id: string): Promise<void> {
  await deleteDoc(doc(db, 'licenses', id));
}

// ========================
// USERS API
// ========================
export async function getUsers(appId?: string): Promise<MalikUser[]> {
  const colRef = collection(db, 'users');
  const q = appId ? query(colRef, where('appId', '==', appId)) : query(colRef, orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as MalikUser));
}

export async function createUser(
  appId: string,
  username: string,
  password?: string,
  email?: string,
  expiry?: string
): Promise<string> {
  const docRef = doc(collection(db, 'users'));
  const newUser: MalikUser = {
    username: username.trim(),
    password: password || '',
    email: email || '',
    appId,
    hwid: 'UNASSIGNED',
    licenseKey: 'CUSTOM_USER_AUTH',
    ipAddress: '0.0.0.0',
    status: 'Active',
    expiry: expiry || '',
    lastSeen: 'Never',
    createdAt: new Date().toISOString(),
  };
  await setDoc(docRef, newUser);
  await logActivity(
    appId,
    'USER_LOGIN',
    username,
    'N/A',
    `Created custom public user ${username} with expiry ${expiry}`
  );
  return docRef.id;
}

export async function updateUserStatus(id: string, status: MalikUser['status']): Promise<void> {
  await updateDoc(doc(db, 'users', id), { status });
}

export async function resetUserHwid(id: string, username: string, appId: string): Promise<void> {
  await updateDoc(doc(db, 'users', id), { hwid: 'RESET_PENDING' });
  await logActivity(appId, 'HWID_RESET', username, 'RESET_PENDING', `HWID reset cleared for user ${username}`);
}

export async function deleteUser(id: string): Promise<void> {
  await deleteDoc(doc(db, 'users', id));
}

// ========================
// SESSIONS API (REAL-TIME)
// ========================
export async function getSessions(appId?: string): Promise<MalikSession[]> {
  const colRef = collection(db, 'sessions');
  const q = appId ? query(colRef, where('appId', '==', appId)) : query(colRef, orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as MalikSession));
}

export async function terminateSession(id: string, sessionId: string, appId: string): Promise<void> {
  await updateDoc(doc(db, 'sessions', id), { status: 'Terminated' });
  await logActivity(appId, 'SESSION_REVOKED', 'Admin', sessionId, `Session terminated remotely by admin`);
}

export async function deleteSession(id: string): Promise<void> {
  await deleteDoc(doc(db, 'sessions', id));
}

// ========================
// REMOTE VARIABLES API
// ========================
export async function getRemoteVariables(appId?: string): Promise<MalikRemoteVariable[]> {
  const colRef = collection(db, 'remote_variables');
  const q = appId ? query(colRef, where('appId', '==', appId)) : query(colRef, orderBy('updatedAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as MalikRemoteVariable));
}

export async function setRemoteVariable(data: Omit<MalikRemoteVariable, 'id' | 'updatedAt'>): Promise<void> {
  const colRef = collection(db, 'remote_variables');
  const q = query(colRef, where('appId', '==', data.appId), where('key', '==', data.key));
  const existing = await getDocs(q);

  const updatedAt = new Date().toISOString();
  if (!existing.empty) {
    const docId = existing.docs[0].id;
    await updateDoc(doc(db, 'remote_variables', docId), { ...data, updatedAt });
  } else {
    const newDoc = doc(collection(db, 'remote_variables'));
    await setDoc(newDoc, { ...data, updatedAt });
  }

  await logActivity(
    data.appId,
    'REMOTE_SYNC',
    'Admin',
    'N/A',
    `Updated remote sync variable: ${data.key} [Role: ${data.minRole}]`
  );
}

export async function deleteRemoteVariable(id: string): Promise<void> {
  await deleteDoc(doc(db, 'remote_variables', id));
}

// ========================
// ACTIVITY LOGS API (Local storage + Discord Webhook on close)
// ========================
export async function getActivityLogs(appId?: string): Promise<MalikActivityLog[]> {
  try {
    if (appId) {
      const historyKey = `malik_audit_logs_${appId}`;
      const logs = JSON.parse(localStorage.getItem(historyKey) || '[]');
      return logs;
    }
    // If no appId, return all audit logs across local storage
    const allLogs: MalikActivityLog[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('malik_audit_logs_')) {
        const logs = JSON.parse(localStorage.getItem(key) || '[]');
        allLogs.push(...logs);
      }
    }
    return allLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  } catch (err) {
    console.error('Error loading local audit logs:', err);
    return [];
  }
}

// ============================================
// REAL-TIME FIRESTORE SUBSCRIPTIONS (ONSNAPSHOT)
// ============================================
export function subscribeLicenses(
  appId: string,
  callback: (licenses: MalikLicense[]) => void
): () => void {
  const colRef = collection(db, 'licenses');
  const q = query(colRef, where('appId', '==', appId));
  return onSnapshot(q, (snapshot) => {
    const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as MalikLicense));
    callback(list);
  }, (err) => {
    console.error('Error subscribing to licenses:', err);
  });
}

export function subscribeUsers(
  appId: string,
  callback: (users: MalikUser[]) => void
): () => void {
  const colRef = collection(db, 'users');
  const q = query(colRef, where('appId', '==', appId));
  return onSnapshot(q, (snapshot) => {
    const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as MalikUser));
    callback(list);
  }, (err) => {
    console.error('Error subscribing to users:', err);
  });
}

export function subscribeSessions(
  appId: string,
  callback: (sessions: MalikSession[]) => void
): () => void {
  const colRef = collection(db, 'sessions');
  const q = query(colRef, where('appId', '==', appId));
  return onSnapshot(q, (snapshot) => {
    const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as MalikSession));
    callback(list);
  }, (err) => {
    console.error('Error subscribing to sessions:', err);
  });
}

export function subscribeActivityLogs(
  appId: string,
  callback: (logs: MalikActivityLog[]) => void
): () => void {
  const colRef = collection(db, 'activity_logs');
  const q = query(colRef, where('appId', '==', appId), orderBy('timestamp', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const firestoreLogs = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as MalikActivityLog));
    const localKey = `malik_audit_logs_${appId}`;
    const localLogs: MalikActivityLog[] = JSON.parse(localStorage.getItem(localKey) || '[]');
    const combined = [...firestoreLogs, ...localLogs].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    callback(combined);
  }, (err) => {
    console.error('Error subscribing to activity logs:', err);
  });
}
