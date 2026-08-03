import React, { useState } from 'react';
import { User, Mail, Clock, Save, Trash2, Key, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { User as FirebaseUser, updateProfile, reauthenticateWithCredential, EmailAuthProvider, updatePassword, deleteUser } from 'firebase/auth';
import { Card, FieldLabel } from './ui';
import { ConfirmModal } from './ConfirmModal';

interface ProfileSettingsProps {
  user: FirebaseUser | null;
  onUpdate: () => void;
}

export const ProfileSettings: React.FC<ProfileSettingsProps> = ({ user, onUpdate }) => {
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingName, setSavingName] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!user) {
    return (
      <Card className="p-6 text-center">
        <p className="text-sm text-surface-500 dark:text-surface-400">Sign in to view profile settings.</p>
      </Card>
    );
  }

  const handleUpdateName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) return;
    setSavingName(true);
    setMessage(null);
    try {
      await updateProfile(user, { displayName: displayName.trim() });
      setMessage({ type: 'success', text: 'Display name updated successfully.' });
      onUpdate();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to update display name.' });
    } finally {
      setSavingName(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match.' });
      return;
    }
    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters.' });
      return;
    }
    setSavingPassword(true);
    setMessage(null);
    try {
      const credential = EmailAuthProvider.credential(user.email || '', currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);
      setMessage({ type: 'success', text: 'Password changed successfully.' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      let msg = 'Failed to change password.';
      if (err.code === 'auth/wrong-password') msg = 'Current password is incorrect.';
      else if (err.code === 'auth/weak-password') msg = 'New password is too weak.';
      else msg = err.message || msg;
      setMessage({ type: 'error', text: msg });
    } finally {
      setSavingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    setDeleting(true);
    try {
      const credential = EmailAuthProvider.credential(user.email || '', deletePassword);
      await reauthenticateWithCredential(user, credential);
      await deleteUser(user);
      setShowDeleteModal(false);
      onUpdate();
    } catch (err: any) {
      let msg = 'Failed to delete account.';
      if (err.code === 'auth/wrong-password') msg = 'Incorrect password.';
      else msg = err.message || msg;
      setMessage({ type: 'error', text: msg });
    } finally {
      setDeleting(false);
    }
  };

  const inputCls = "w-full px-3 py-2.5 rounded-xl border border-surface-200 bg-white text-sm text-surface-900 placeholder-surface-400 outline-none transition-all duration-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-white/10 dark:bg-white/[0.04] dark:text-white dark:placeholder-surface-500";

  return (
    <div className="space-y-6">
      {message && (
        <div className={`flex items-start gap-2 px-3.5 py-2.5 rounded-xl text-xs border ${
          message.type === 'success'
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
            : 'bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400'
        }`}>
          {message.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" /> : <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />}
          <span className="leading-relaxed">{message.text}</span>
        </div>
      )}

      <Card className="p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center">
            <User className="w-5 h-5 text-brand-500" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-surface-900 dark:text-white">Account Info</h3>
            <p className="text-xs text-surface-500 dark:text-surface-400">Your current account details</p>
          </div>
        </div>
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-50 dark:bg-white/[0.03]">
            <Mail className="w-4 h-4 text-surface-400" />
            <div>
              <p className="text-[11px] text-surface-500 dark:text-surface-400 uppercase tracking-wider font-semibold">Email</p>
              <p className="text-sm text-surface-900 dark:text-white">{user.email || 'No email'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-50 dark:bg-white/[0.03]">
            <User className="w-4 h-4 text-surface-400" />
            <div>
              <p className="text-[11px] text-surface-500 dark:text-surface-400 uppercase tracking-wider font-semibold">Display Name</p>
              <p className="text-sm text-surface-900 dark:text-white">{user.displayName || 'Not set'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-50 dark:bg-white/[0.03]">
            <Clock className="w-4 h-4 text-surface-400" />
            <div>
              <p className="text-[11px] text-surface-500 dark:text-surface-400 uppercase tracking-wider font-semibold">Last Sign-In</p>
              <p className="text-sm text-surface-900 dark:text-white">{user.metadata.lastSignInTime ? new Date(user.metadata.lastSignInTime).toLocaleString() : 'First time'}</p>
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <form onSubmit={handleUpdateName}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
              <Save className="w-5 h-5 text-violet-500" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-surface-900 dark:text-white">Change Display Name</h3>
              <p className="text-xs text-surface-500 dark:text-surface-400">Update your visible name</p>
            </div>
          </div>
          <FieldLabel>New Display Name</FieldLabel>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Your display name"
            className={inputCls}
          />
          <button type="submit" disabled={savingName || displayName === (user.displayName || '')} className="btn-primary text-xs mt-3">
            {savingName ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>{savingName ? 'Saving...' : 'Save Name'}</span>
          </button>
        </form>
      </Card>

      <Card className="p-6">
        <form onSubmit={handleChangePassword}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <Key className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-surface-900 dark:text-white">Change Password</h3>
              <p className="text-xs text-surface-500 dark:text-surface-400">Requires re-authentication</p>
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <FieldLabel>Current Password</FieldLabel>
              <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="Current password" required className={inputCls} />
            </div>
            <div>
              <FieldLabel>New Password</FieldLabel>
              <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="New password (min 6 chars)" required minLength={6} className={inputCls} />
            </div>
            <div>
              <FieldLabel>Confirm New Password</FieldLabel>
              <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm new password" required minLength={6} className={inputCls} />
            </div>
          </div>
          <button type="submit" disabled={savingPassword} className="btn-primary text-xs mt-4">
            {savingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
            <span>{savingPassword ? 'Changing...' : 'Change Password'}</span>
          </button>
        </form>
      </Card>

      <Card className="p-6 border border-rose-500/20">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
            <Trash2 className="w-5 h-5 text-rose-500" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-surface-900 dark:text-white">Delete Account</h3>
            <p className="text-xs text-surface-500 dark:text-surface-400">Permanently remove your account</p>
          </div>
        </div>
        <p className="text-xs text-surface-600 dark:text-surface-400 mb-3">
          This action is irreversible. All your data will be permanently deleted.
        </p>
        <button type="button" onClick={() => setShowDeleteModal(true)} className="btn-danger text-xs">
          <Trash2 className="w-4 h-4" />
          <span>Delete Account</span>
        </button>
      </Card>

      <ConfirmModal
        isOpen={showDeleteModal}
        title="Delete Account"
        message="This action is irreversible. All your apps, licenses, and data will be permanently deleted."
        confirmLabel="Delete Permanently"
        variant="danger"
        isLoading={deleting}
        onConfirm={handleDeleteAccount}
        onClose={() => { setShowDeleteModal(false); setDeletePassword(''); }}
      >
        <div className="mt-3">
          <FieldLabel>Enter your password to confirm</FieldLabel>
          <input
            type="password"
            value={deletePassword}
            onChange={(e) => setDeletePassword(e.target.value)}
            placeholder="Your password"
            className="input"
          />
        </div>
      </ConfirmModal>
    </div>
  );
};
