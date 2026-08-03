import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
  setDoc
} from 'firebase/firestore';

function parseExpiryToDate(expiryStr?: string | null): Date | null {
  if (!expiryStr) return null;
  if (typeof expiryStr !== 'string') return null;
  const lower = expiryStr.toLowerCase().trim();
  if (lower.includes('lifetime') || lower.includes('never')) return null;

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

  const stdDate = new Date(expiryStr);
  if (!isNaN(stdDate.getTime())) {
    return stdDate;
  }

  return null;
}

function checkIsExpired(expiryStr?: string | null): boolean {
  if (!expiryStr) return false;
  const d = parseExpiryToDate(expiryStr);
  if (!d) return false;
  return d.getTime() <= Date.now();
}

async function processExpiredUsers(db: any): Promise<number> {
  let expiredCount = 0;

  try {
    const q = query(
      collection(db, 'users'),
      where('status', '!=', 'Expired')
    );
    const snap = await getDocs(q);

    for (const userDoc of snap.docs) {
      const userData = userDoc.data();
      if (userData.expiry && checkIsExpired(userData.expiry)) {
        await updateDoc(doc(db, 'users', userDoc.id), { status: 'Expired' });
        expiredCount++;

        const now = new Date().toISOString();
        const logDocRef = doc(collection(db, 'activity_logs'));
        await setDoc(logDocRef, {
          appId: userData.appId,
          action: 'AUTO_EXPIRE_USER',
          actor: userData.username,
          hwid: userData.hwid || 'N/A',
          details: `User '${userData.username}' auto-expired (expiry: ${userData.expiry})`,
          timestamp: now
        });
      }
    }
  } catch (err) {
    console.error('[Cron] Error processing expired users:', err);
  }

  return expiredCount;
}

async function processExpiredLicenses(db: any): Promise<number> {
  let expiredCount = 0;

  try {
    const q = query(
      collection(db, 'licenses'),
      where('status', '!=', 'Expired')
    );
    const snap = await getDocs(q);

    for (const keyDoc of snap.docs) {
      const keyData = keyDoc.data();
      if (keyData.expiry && checkIsExpired(keyData.expiry)) {
        await updateDoc(doc(db, 'licenses', keyDoc.id), { status: 'Expired' });
        expiredCount++;

        const now = new Date().toISOString();
        const logDocRef = doc(collection(db, 'activity_logs'));
        await setDoc(logDocRef, {
          appId: keyData.appId,
          action: 'AUTO_EXPIRE_LICENSE',
          actor: keyData.usedBy || 'SYSTEM',
          hwid: keyData.hwid || 'N/A',
          details: `License key '${keyData.key}' auto-expired (expiry: ${keyData.expiry})`,
          timestamp: now
        });
      }
    }
  } catch (err) {
    console.error('[Cron] Error processing expired licenses:', err);
  }

  return expiredCount;
}

async function autoExpireTick(db: any): Promise<void> {
  const now = new Date().toISOString();
  console.log(`[Cron] Auto-expire check started at ${now}`);

  const expiredUsers = await processExpiredUsers(db);
  const expiredLicenses = await processExpiredLicenses(db);

  if (expiredUsers > 0 || expiredLicenses > 0) {
    console.log(`[Cron] Auto-expire complete: ${expiredUsers} users, ${expiredLicenses} licenses expired.`);
  } else {
    console.log('[Cron] Auto-expire check complete: no items expired.');
  }
}

export function startAutoExpireCron(db: any): void {
  const intervalMs = 5 * 60 * 1000;

  console.log('[Cron] Starting auto-expire scheduler (every 5 minutes)');

  autoExpireTick(db);

  setInterval(() => {
    autoExpireTick(db);
  }, intervalMs);
}
