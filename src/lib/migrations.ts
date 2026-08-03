import { initializeApp, getApps } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  writeBatch,
  query,
  where,
  limit as fbLimit
} from 'firebase/firestore';
import fs from 'fs';
import path from 'path';

// ============================================
// TYPES
// ============================================

interface Migration {
  id: string;
  name: string;
  description: string;
  up: (db: ReturnType<typeof getFirestore>) => Promise<void>;
  down: (db: ReturnType<typeof getFirestore>) => Promise<void>;
}

interface MigrationRecord {
  id: string;
  name: string;
  appliedAt: string;
}

// ============================================
// DB HELPER
// ============================================

function getDb(): ReturnType<typeof getFirestore> {
  const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
  if (!fs.existsSync(configPath)) {
    throw new Error('firebase-applet-config.json not found. Run from project root.');
  }
  const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  const app = getApps().length === 0 ? initializeApp(config) : getApps()[0];
  return getFirestore(app, config.firestoreDatabaseId || undefined);
}

// ============================================
// MIGRATION DEFINITIONS
// ============================================

const migrations: Migration[] = [
  {
    id: '001',
    name: '001_add_email_verified',
    description: 'Add emailVerified and twoFactorEnabled fields to users missing them',
    up: async (db) => {
      const usersRef = collection(db, 'users');
      const snapshot = await getDocs(usersRef);

      const BATCH_SIZE = 400;
      let batch = writeBatch(db);
      let count = 0;
      let total = 0;

      for (const docSnap of snapshot.docs) {
        const data = docSnap.data();
        const updates: Record<string, unknown> = {};

        if (data.emailVerified === undefined) {
          updates.emailVerified = false;
        }
        if (data.twoFactorEnabled === undefined) {
          updates.twoFactorEnabled = false;
        }

        if (Object.keys(updates).length > 0) {
          batch.update(doc(db, 'users', docSnap.id), updates);
          count++;
          total++;

          if (count >= BATCH_SIZE) {
            await batch.commit();
            console.log(`  Committed batch of ${count} user updates`);
            batch = writeBatch(db);
            count = 0;
          }
        }
      }

      if (count > 0) {
        await batch.commit();
        console.log(`  Committed final batch of ${count} user updates`);
      }

      console.log(`  Total users updated: ${total}`);
    },
    down: async (db) => {
      const usersRef = collection(db, 'users');
      const snapshot = await getDocs(usersRef);
      const batch = writeBatch(db);
      let count = 0;

      for (const docSnap of snapshot.docs) {
        batch.update(doc(db, 'users', docSnap.id), {
          emailVerified: undefined,
          twoFactorEnabled: undefined
        });
        count++;
      }

      if (count > 0) await batch.commit();
      console.log(`  Reverted ${count} users`);
    }
  },
  {
    id: '002',
    name: '002_hash_existing_passwords',
    description: 'Hash plaintext passwords with bcrypt (one-time data migration)',
    up: async (db) => {
      const bcrypt = await import('bcryptjs');
      const usersRef = collection(db, 'users');
      const snapshot = await getDocs(usersRef);

      const BATCH_SIZE = 400;
      let batch = writeBatch(db);
      let count = 0;
      let total = 0;

      for (const docSnap of snapshot.docs) {
        const data = docSnap.data();
        const password = data.password;

        if (!password || typeof password !== 'string') continue;

        // bcrypt hashes start with $2a$, $2b$, or $2y$ and are 60 chars
        const isBcrypt = /^\$2[aby]\$/.test(password) && password.length === 60;
        if (isBcrypt) continue;

        const hashed = await bcrypt.hash(password, 12);
        batch.update(doc(db, 'users', docSnap.id), { password: hashed });
        count++;
        total++;

        if (count >= BATCH_SIZE) {
          await batch.commit();
          console.log(`  Committed batch of ${count} password hashes`);
          batch = writeBatch(db);
          count = 0;
        }
      }

      if (count > 0) {
        await batch.commit();
        console.log(`  Committed final batch of ${count} password hashes`);
      }

      console.log(`  Total passwords hashed: ${total}`);
    },
    down: async (_db) => {
      console.log('  WARNING: Cannot reverse password hashing. Skipping down migration.');
    }
  }
];

// ============================================
// MIGRATION RUNNER
// ============================================

async function getAppliedMigrations(
  db: ReturnType<typeof getFirestore>
): Promise<MigrationRecord[]> {
  try {
    const snapshot = await getDocs(collection(db, 'migrations'));
    return snapshot.docs.map(d => d.data() as MigrationRecord);
  } catch {
    return [];
  }
}

export async function runPendingMigrations(
  db: ReturnType<typeof getFirestore>
): Promise<void> {
  const applied = await getAppliedMigrations(db);
  const appliedIds = new Set(applied.map(m => m.id));

  const pending = migrations.filter(m => !appliedIds.has(m.id));

  if (pending.length === 0) {
    console.log('No pending migrations.');
    return;
  }

  console.log(`Running ${pending.length} pending migration(s)...\n`);

  for (const migration of pending) {
    console.log(`[${migration.id}] ${migration.name} - ${migration.description}`);

    try {
      await migration.up(db);

      await setDoc(doc(db, 'migrations', migration.id), {
        id: migration.id,
        name: migration.name,
        appliedAt: new Date().toISOString()
      });

      console.log(`[${migration.id}] Completed successfully.\n`);
    } catch (err) {
      console.error(`[${migration.id}] FAILED:`, (err as Error).message);
      throw err;
    }
  }

  console.log('All migrations complete.');
}

export async function rollbackLastMigration(
  db: ReturnType<typeof getFirestore>
): Promise<void> {
  const applied = await getAppliedMigrations(db);
  if (applied.length === 0) {
    console.log('No migrations to rollback.');
    return;
  }

  const lastApplied = applied.sort((a, b) => b.id.localeCompare(a.id))[0];
  const migration = migrations.find(m => m.id === lastApplied.id);

  if (!migration) {
    console.error(`Migration ${lastApplied.id} not found in definitions.`);
    return;
  }

  console.log(`Rolling back [${migration.id}] ${migration.name}...`);

  try {
    await migration.down(db);
    await updateDoc(doc(db, 'migrations', migration.id), {
      rolledBackAt: new Date().toISOString()
    });
    console.log(`[${migration.id}] Rolled back successfully.`);
  } catch (err) {
    console.error(`[${migration.id}] Rollback FAILED:`, (err as Error).message);
    throw err;
  }
}

// ============================================
// CLI ENTRY POINT
// ============================================

if (import.meta.url === `file://${process.argv[1]}`) {
  const db = getDb();
  const action = process.argv[2] || 'up';

  if (action === 'rollback') {
    rollbackLastMigration(db).catch(err => {
      console.error(err);
      process.exit(1);
    });
  } else {
    runPendingMigrations(db).catch(err => {
      console.error(err);
      process.exit(1);
    });
  }
}
