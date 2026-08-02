import React, { useState } from 'react';
import {
  ShieldCheck,
  Mail,
  Lock,
  User,
  AlertCircle,
  Loader2,
  X,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signInAnonymously,
  updateProfile
} from 'firebase/auth';
import { auth, googleProvider, db } from '../lib/firebase';
import { collection, query, where, getDocs, or } from 'firebase/firestore';
import { isExpired } from '../lib/dateUtils';

async function checkUserExpired(userEmail: string): Promise<{ expired: boolean; message?: string }> {
  try {
    const usersRef = collection(db, 'users');
    const emailPrefix = userEmail.split('@')[0];
    // Check both email and username fields across all apps
    const q = query(usersRef, or(
      where('email', '==', userEmail),
      where('username', '==', emailPrefix),
      where('username', '==', userEmail)
    ));
    const snap = await getDocs(q);
    if (snap.empty) return { expired: false };

    for (const userDoc of snap.docs) {
      const userData = userDoc.data();
      if (userData.status === 'Banned') {
        return { expired: true, message: 'Your account has been BANNED by the administrator.' };
      }
      if (userData.status === 'Expired' || isExpired(userData.expiry)) {
        return { expired: true, message: `Your account has EXPIRED on ${userData.expiry || 'past date'}. Please renew your license.` };
      }
    }
    return { expired: false };
  } catch {
    return { expired: false };
  }
}

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const fallbackAnonymous = async (label: string) => {
    try {
      const cred = await signInAnonymously(auth);
      await updateProfile(cred.user, { displayName: label || 'Developer' });
      onSuccess?.();
      onClose();
      return true;
    } catch (anonErr: any) {
      console.error('Anonymous fallback also failed:', anonErr);
      setError(`All auth methods failed. Check Firebase Console to enable at least Email/Password or Anonymous sign-in under Authentication > Sign-in method.`);
      return false;
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isSignUp) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        if (displayName.trim()) {
          await updateProfile(userCredential.user, { displayName: displayName.trim() });
        }
        const check = await checkUserExpired(email);
        if (check.expired) {
          await auth.signOut();
          setError(check.message || 'Your account has expired. Access denied.');
          return;
        }
      } else {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const check = await checkUserExpired(email);
        if (check.expired) {
          await auth.signOut();
          setError(check.message || 'Your account has expired. Access denied.');
          return;
        }
      }
      onSuccess?.();
      onClose();
    } catch (err: any) {
      console.error('Email Auth Error:', err.code);
      const blocked =
        err.code === 'auth/operation-not-allowed' ||
        err.code === 'auth/unauthorized-domain' ||
        err.code === 'auth/configuration-not-found' ||
        err.code === 'auth/invalid-api-key';

      if (blocked) {
        const label = displayName.trim() || email.split('@')[0] || 'Developer';
        await fallbackAnonymous(label);
      } else {
        let msg = err.message || 'Authentication failed.';
        if (err.code === 'auth/email-already-in-use') {
          msg = 'An account with this email already exists. Try signing in.';
        } else if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
          msg = 'Invalid email or password.';
        } else if (err.code === 'auth/weak-password') {
          msg = 'Password should be at least 6 characters.';
        } else if (err.code === 'auth/user-not-found') {
          msg = 'No account found with this email.';
        }
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      const userEmail = cred.user.email || '';
      if (userEmail) {
        const check = await checkUserExpired(userEmail);
        if (check.expired) {
          await auth.signOut();
          setError(check.message || 'Your account has expired. Access denied.');
          return;
        }
      }
      onSuccess?.();
      onClose();
    } catch (err: any) {
      console.error('Google Sign-In Error:', err.code);
      const blocked =
        err.code === 'auth/operation-not-allowed' ||
        err.code === 'auth/unauthorized-domain' ||
        err.code === 'auth/popup-blocked';

      if (blocked) {
        await fallbackAnonymous('Google Developer');
      } else {
        setError('Google sign-in was cancelled or failed. Try Quick Demo below.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const cred = await signInAnonymously(auth);
      await updateProfile(cred.user, { displayName: 'Demo Developer' });
      onSuccess?.();
      onClose();
    } catch (err: any) {
      console.error('Anonymous Sign-In Error:', err.code);
      if (err.code === 'auth/operation-not-allowed') {
        setError('Anonymous auth not enabled. Go to Firebase Console > Authentication > Sign-in method > Enable Anonymous, then reload this page.');
      } else {
        setError('Could not create demo session. Check your Firebase configuration.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSkipToConsole = async () => {
    setLoading(true);
    setError(null);
    try {
      // Try anonymous sign-in first for a proper Firebase session
      const cred = await signInAnonymously(auth);
      await updateProfile(cred.user, { displayName: 'Guest Developer' });
      onSuccess?.();
      onClose();
    } catch (err: any) {
      console.error('Anonymous sign-in failed for skip:', err);
      // If anonymous auth fails, still allow skip with a warning
      // but at least try to proceed without auth
      setError('Anonymous auth not enabled. Some features may not work properly.');
      // Still proceed after a short delay
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 1500);
    } finally {
      setLoading(false);
    }
  };

  const inputIcon = "w-full pl-10 pr-4 py-2.5 rounded-xl border border-surface-200 bg-white text-sm text-surface-900 placeholder-surface-400 outline-none transition-all duration-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-white/10 dark:bg-white/[0.04] dark:text-white dark:placeholder-surface-500";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="card relative w-full max-w-md p-6 sm:p-8 animate-scale-in overflow-hidden">
        <div className="bg-grid absolute inset-0 opacity-20 pointer-events-none"></div>
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-surface-400 hover:text-surface-700 p-2 rounded-xl hover:bg-surface-100 dark:hover:text-surface-100 dark:hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6 relative z-10">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-500 to-violet-500 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-brand-600/30">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-xl font-bold tracking-tight text-surface-900 dark:text-white">
            {isSignUp ? 'Create Developer Account' : 'Sign In to MalikAuth'}
          </h2>
          <p className="text-xs text-surface-500 dark:text-surface-400 mt-1">
            {isSignUp
              ? 'Get started with enterprise MalikAuth licensing'
              : 'Access your MalikAuth security console and license keys'}
          </p>
        </div>

        {error && (
          <div className="mb-5 bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 px-3.5 py-2.5 rounded-xl text-xs flex items-start gap-2 shadow-xs relative z-10">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
            <span className="leading-relaxed">{error}</span>
          </div>
        )}

        <form onSubmit={handleEmailAuth} className="space-y-4 relative z-10">
          {isSignUp && (
            <div>
              <label className="block text-xs font-semibold text-surface-700 dark:text-surface-300 mb-1">
                Developer Name / Company
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-surface-400 dark:text-surface-500">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. Apex Software LLC"
                  required={isSignUp}
                  className={inputIcon}
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-surface-700 dark:text-surface-300 mb-1">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-surface-400 dark:text-surface-500">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="developer@example.com"
                required
                className={inputIcon}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-surface-700 dark:text-surface-300 mb-1">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-surface-400 dark:text-surface-500">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                className={inputIcon}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-3"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Authenticating...</span>
              </>
            ) : (
              <span>{isSignUp ? 'Create Developer Account' : 'Sign In'}</span>
            )}
          </button>
        </form>

        <div className="my-5 flex items-center gap-3 text-xs text-surface-400 dark:text-surface-500 relative z-10">
          <div className="flex-1 h-px bg-surface-200 dark:bg-white/10" />
          <span>or continue with</span>
          <div className="flex-1 h-px bg-surface-200 dark:bg-white/10" />
        </div>

        <div className="space-y-2.5 relative z-10">
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="btn-ghost w-full py-2.5 font-medium"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            <span>Sign in with Google</span>
          </button>

          <button
            type="button"
            onClick={handleQuickDemoLogin}
            disabled={loading}
            className="btn-ghost w-full py-2.5 font-medium"
          >
            <Sparkles className="w-4 h-4 text-brand-500" />
            <span>Quick Demo Sign-In</span>
          </button>

          <button
            type="button"
            onClick={handleSkipToConsole}
            disabled={loading}
            className="w-full py-2.5 bg-brand-500/10 hover:bg-brand-500/20 border border-brand-500/25 text-brand-600 dark:text-brand-400 font-semibold rounded-xl text-xs transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
          >
            <ArrowRight className="w-4 h-4" />
            <span>Skip to Console (No Auth Required)</span>
          </button>
        </div>

        <div className="mt-6 text-center text-xs text-surface-500 dark:text-surface-400 relative z-10">
          <span>{isSignUp ? 'Already have an account?' : "Don't have an account yet?"}</span>{' '}
          <button
            type="button"
            onClick={() => { setIsSignUp(!isSignUp); setError(null); }}
            className="text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 font-semibold underline underline-offset-2"
          >
            {isSignUp ? 'Sign In' : 'Create Account'}
          </button>
        </div>
      </div>
    </div>
  );
};
