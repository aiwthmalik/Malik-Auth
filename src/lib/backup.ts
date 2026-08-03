import { initializeApp, getApps } from 'firebase/app';
import {
  getFirestore,
  collection,
  getDocs,
  query,
  orderBy
} from 'firebase/firestore';
import fs from 'fs';
import path from 'path';

const COLLECTIONS = [
  'applications',
  'licenses',
  'users',
  'sessions',
  'remote_variables',
  'activity_logs',
  'password_resets',
  'email_verifications',
  'crash_reports',
  'analytics_logs'
];

function getDb() {
  const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
  if (!fs.existsSync(configPath)) {
    throw new Error('firebase-applet-config.json not found. Run from project root.');
  }
  const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  const app = getApps().length === 0 ? initializeApp(config) : getApps()[0];
  return getFirestore(app, config.firestoreDatabaseId || undefined);
}

interface BackupMetadata {
  timestamp: string;
  collections: Record<string, number>;
  totalDocuments: number;
}

async function backupCollection(
  db: ReturnType<typeof getFirestore>,
  collectionName: string
): Promise<{ documents: Record<string, unknown>[]; count: number }> {
  const snapshot = await getDocs(collection(db, collectionName));
  const documents: Record<string, unknown>[] = [];
  snapshot.forEach(docSnap => {
    documents.push({ id: docSnap.id, ...docSnap.data() });
  });
  return { documents, count: documents.length };
}

export async function runBackup(): Promise<void> {
  const db = getDb();
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.join(process.cwd(), 'backups', timestamp);

  fs.mkdirSync(backupDir, { recursive: true });

  const metadata: BackupMetadata = {
    timestamp: new Date().toISOString(),
    collections: {},
    totalDocuments: 0
  };

  console.log(`Starting backup to: backups/${timestamp}/`);

  for (const colName of COLLECTIONS) {
    try {
      const { documents, count } = await backupCollection(db, colName);
      const filePath = path.join(backupDir, `${colName}.json`);
      fs.writeFileSync(filePath, JSON.stringify(documents, null, 2), 'utf-8');
      metadata.collections[colName] = count;
      metadata.totalDocuments += count;
      console.log(`  ${colName}: ${count} documents`);
    } catch (err) {
      console.error(`  ${colName}: FAILED -`, (err as Error).message);
      metadata.collections[colName] = -1;
    }
  }

  const metaPath = path.join(backupDir, '_metadata.json');
  fs.writeFileSync(metaPath, JSON.stringify(metadata, null, 2), 'utf-8');
  console.log(`\nBackup complete. Total documents: ${metadata.totalDocuments}`);
  console.log(`Metadata saved to: backups/${timestamp}/_metadata.json`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runBackup().catch(err => {
    console.error('Backup failed:', err);
    process.exit(1);
  });
}
