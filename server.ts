import express from 'express';
import path from 'path';
import fs from 'fs';
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
  limit
} from 'firebase/firestore';

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

    // Frontend stores PKT (UTC+5), so convert to UTC by subtracting 5 hours
    const d = new Date(Date.UTC(year, month, day, hours - 5, minutes, seconds));
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

  // Pattern 3: YYYY-MM-DD (date-only, treat as end of day PKT)
  const isoDateMatch = lower.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoDateMatch) {
    const year = parseInt(isoDateMatch[1], 10);
    const month = parseInt(isoDateMatch[2], 10) - 1;
    const day = parseInt(isoDateMatch[3], 10);
    // End of day PKT = 23:59 PKT = 18:59 UTC
    const d = new Date(Date.UTC(year, month, day, 18, 59, 59));
    if (!isNaN(d.getTime())) return d;
  }

  // Pattern 4: Standard Date string or ISO string
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

/**
 * Auto-expire scan: marks all expired users and licenses in Firestore.
 */
async function autoExpireScan() {
  try {
    let usersExpired = 0;
    let licensesExpired = 0;

    const usersSnap = await getDocs(collection(db, 'users'));
    for (const userDoc of usersSnap.docs) {
      const userData = userDoc.data();
      if (userData.status !== 'Expired' && checkIsExpired(userData.expiry)) {
        await updateDoc(doc(db, 'users', userDoc.id), { status: 'Expired' });
        usersExpired++;
      }
    }

    const licsSnap = await getDocs(collection(db, 'licenses'));
    for (const licDoc of licsSnap.docs) {
      const licData = licDoc.data();
      if (licData.status !== 'Expired' && checkIsExpired(licData.expiry)) {
        await updateDoc(doc(db, 'licenses', licDoc.id), { status: 'Expired' });
        licensesExpired++;
      }
    }

    if (usersExpired > 0 || licensesExpired > 0) {
      console.log(`[Auto-Expire] Marked ${usersExpired} users and ${licensesExpired} licenses as expired.`);
    }
  } catch (err) {
    console.error('[Auto-Expire] Scan error:', err);
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware for CORS & Body Parsing
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // ============================================
  // MALIKAUTH SECURE CLIENT REST API ENDPOINTS
  // ============================================

  // Health Check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', service: 'MalikAuth Security Platform' });
  });

  // Auto-Expire: Scan all users & licenses and mark expired ones in Firestore
  app.get('/api/v1/admin/auto-expire', async (req, res) => {
    try {
      const results = { usersChecked: 0, usersExpired: 0, licensesChecked: 0, licensesExpired: 0, errors: [] as string[] };

      // Scan all users across all apps
      const usersSnap = await getDocs(collection(db, 'users'));
      for (const userDoc of usersSnap.docs) {
        const userData = userDoc.data();
        results.usersChecked++;
        try {
          if (userData.status !== 'Expired' && checkIsExpired(userData.expiry)) {
            await updateDoc(doc(db, 'users', userDoc.id), { status: 'Expired' });
            results.usersExpired++;
          }
        } catch (e: any) {
          results.errors.push(`User ${userDoc.id}: ${e.message}`);
        }
      }

      // Scan all licenses across all apps
      const licsSnap = await getDocs(collection(db, 'licenses'));
      for (const licDoc of licsSnap.docs) {
        const licData = licDoc.data();
        results.licensesChecked++;
        try {
          if (licData.status !== 'Expired' && checkIsExpired(licData.expiry)) {
            await updateDoc(doc(db, 'licenses', licDoc.id), { status: 'Expired' });
            results.licensesExpired++;
          }
        } catch (e: any) {
          results.errors.push(`License ${licDoc.id}: ${e.message}`);
        }
      }

      return res.json({ success: true, ...results });
    } catch (err: any) {
      console.error('Auto-expire error:', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  });

  // Client Initialization: Verification of App ID & Secret
  app.post('/api/v1/client/init', async (req, res) => {
    try {
      const { appId, appSecret, version, hwid } = req.body;
      if (!appId) {
        return res.status(400).json({ success: false, message: 'App ID is required.' });
      }

      // Check Application in Firestore
      const appQuery = query(collection(db, 'applications'), where('appId', '==', appId));
      const appSnap = await getDocs(appQuery);

      let appData: any = null;

      if (appSnap.empty) {
        // Auto-bootstrap application in Firestore if not present yet
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
    } catch (err: any) {
      console.error('API Init Error:', err);
      // Return success fail-safe response so client initialization never blocks execution
      return res.json({
        success: true,
        message: 'MalikAuth Security Engine Initialized (Fail-safe Mode)',
        appName: 'MalikAuth Application',
        version: '1.0.0',
        hwid: req.body?.hwid || 'N/A'
      });
    }
  });

  // Client User Registration with License Key
  app.post('/api/v1/client/register', async (req, res) => {
    try {
      const { appId, appSecret, username, password, licenseKey, hwid } = req.body;

      if (!appId || !username || !password || !licenseKey) {
        return res.status(400).json({
          success: false,
          message: 'appId, username, password, and licenseKey are required fields.'
        });
      }

      const cleanUsername = String(username).trim();
      const cleanKey = String(licenseKey).trim();
      const userHwid = hwid || 'HWID-AUTO-DETECT';

      // 1. Verify Application Credentials if appSecret provided
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

      // 5. Create User Record in Firestore Database
      const userDocRef = doc(collection(db, 'users'));
      const newUser = {
        appId,
        username: cleanUsername,
        email: cleanUsername.includes('@') ? cleanUsername : `${cleanUsername}@malikauth.local`,
        password: String(password).trim(),
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
        hwid: userHwid,
        expiry: keyData.expiry || null
      });
    } catch (err: any) {
      console.error('API Register Error:', err);
      return res.status(500).json({ success: false, message: err.message || 'Internal server error during registration' });
    }
  });

  // Client Login / Authentication
  app.post('/api/v1/client/login', async (req, res) => {
    try {
      const { appId, appSecret, username, password, hwid } = req.body;

      if (!appId || !username || !password) {
        return res.status(400).json({ success: false, message: 'appId, username, and password are required.' });
      }

      const cleanUsername = String(username).trim();
      const cleanPassword = String(password).trim();
      const clientHwid = hwid || 'HWID-AUTO-DETECT';

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

      if (userData.password !== cleanPassword) {
        return res.status(401).json({ success: false, message: 'Invalid password. Access denied.' });
      }

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
        // Lock HWID to this PC
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

      // Update user lastSeen and backfill email field for old users
      const updateData: any = { lastSeen: now, ipAddress: clientIp };
      if (!userData.email) {
        updateData.email = `${cleanUsername}@malikauth.local`;
      }
      await updateDoc(doc(db, 'users', userDoc.id), updateData);

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
        hwid: clientHwid,
        expiry: userData.expiry || null
      });
    } catch (err: any) {
      console.error('API Login Error:', err);
      return res.status(500).json({ success: false, message: err.message || 'Internal server error during login' });
    }
  });

  // Direct License Validation (without user account)
  app.post('/api/v1/client/license', async (req, res) => {
    try {
      const { appId, licenseKey, hwid } = req.body;
      if (!appId || !licenseKey) {
        return res.status(400).json({ success: false, message: 'appId and licenseKey are required.' });
      }

      const cleanKey = String(licenseKey).trim();
      const userHwid = hwid || 'HWID-AUTO-DETECT';

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
    } catch (err: any) {
      console.error('API License Error:', err);
      return res.status(500).json({ success: false, message: err.message || 'Internal server error' });
    }
  });

  // Live Session Heartbeat & Remote Kill Switch Endpoint
  app.post('/api/v1/client/session-heartbeat', async (req, res) => {
    try {
      const { appId, sessionId, hwid } = req.body;
      if (!appId || !sessionId) {
        return res.json({ active: false, status: 'NotFound' });
      }

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

          if (userData.status === 'Banned') {
            if (sessionData.status !== 'Terminated') {
              await updateDoc(doc(db, 'sessions', sessionDoc.id), { status: 'Terminated' });
            }
            return res.json({ active: false, status: 'Terminated' });
          }

          if (userData.status === 'Expired' || checkIsExpired(userData.expiry)) {
            if (userData.status !== 'Expired') {
              await updateDoc(doc(db, 'users', userDoc.id), { status: 'Expired' });
            }
            if (sessionData.status !== 'Terminated') {
              await updateDoc(doc(db, 'sessions', sessionDoc.id), { status: 'Terminated' });
            }
            return res.json({ active: false, status: 'Expired' });
          }

          // Also check linked license key expiry
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
                if (sessionData.status !== 'Terminated') {
                  await updateDoc(doc(db, 'sessions', sessionDoc.id), { status: 'Terminated' });
                }
                return res.json({ active: false, status: 'Terminated' });
              }
              if (keyData.status === 'Expired' || checkIsExpired(keyData.expiry)) {
                if (userData.status !== 'Expired') {
                  await updateDoc(doc(db, 'users', userDoc.id), { status: 'Expired' });
                }
                if (keyData.status !== 'Expired') {
                  await updateDoc(doc(db, 'licenses', keyDoc.id), { status: 'Expired' });
                }
                if (sessionData.status !== 'Terminated') {
                  await updateDoc(doc(db, 'sessions', sessionDoc.id), { status: 'Terminated' });
                }
                return res.json({ active: false, status: 'Expired' });
              }
            }
          }
        }
      }

      // Update heartbeat timestamp
      const now = new Date().toISOString();
      await updateDoc(doc(db, 'sessions', sessionDoc.id), { lastHeartbeat: now });

      return res.json({ active: true, status: 'Active' });
    } catch (err) {
      console.error('Heartbeat check failed:', err);
      return res.json({ active: false, status: 'Error' });
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

  app.listen(PORT, '0.0.0.0', async () => {
    console.log(`MalikAuth Server running on http://0.0.0.0:${PORT}`);
    // Run auto-expire scan on startup and every 5 minutes
    await autoExpireScan();
    setInterval(autoExpireScan, 5 * 60 * 1000);
  });
}

startServer();
