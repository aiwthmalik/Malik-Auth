import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider, setPersistence, browserLocalPersistence } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

// Ensure Firebase is initialized only once
const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];

// Initialize Firestore with default database
export const db = getFirestore(app);

// Initialize Auth with persistence
export const auth = getAuth(app);
// Set persistence to local so user stays logged in
setPersistence(auth, browserLocalPersistence).catch((err) => {
  console.warn('Failed to set auth persistence:', err);
});

export const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('email');
googleProvider.addScope('profile');

export { firebaseConfig };
