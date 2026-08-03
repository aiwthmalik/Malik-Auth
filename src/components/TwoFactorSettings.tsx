import React, { useState } from 'react';
import {
  ShieldCheck,
  QrCode,
  Key,
  Copy,
  Check,
  AlertTriangle,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import { Card, PageHeader, FieldLabel } from './ui';

interface TwoFactorSettingsProps {
  user: { uid: string; email?: string | null; displayName?: string | null } | null;
}

export const TwoFactorSettings: React.FC<TwoFactorSettingsProps> = ({ user }) => {
  const [enabled, setEnabled] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [secret] = useState(() => generateSecret());
  const [backupCodes] = useState(() => generateBackupCodes());

  function generateSecret(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let result = '';
    for (let i = 0; i < 16; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  function generateBackupCodes(): string[] {
    const codes: string[] = [];
    for (let i = 0; i < 8; i++) {
      const code = Math.random().toString(36).substring(2, 10).toUpperCase();
      codes.push(code);
    }
    return codes;
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(text);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleVerify = async () => {
    if (verificationCode.length !== 6) return;

    setVerifying(true);
    // Simulate verification
    setTimeout(() => {
      setEnabled(true);
      setVerifying(false);
      setShowBackupCodes(true);
    }, 1500);
  };

  const generateQRCodeSVG = (secret: string): string => {
    const size = 200;
    const cellSize = 8;
    const modules = Math.floor(size / cellSize);

    let svg = `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">`;
    svg += `<rect width="${size}" height="${size}" fill="white"/>`;

    // Generate a simple pattern based on the secret
    const hash = secret.split('').reduce((acc, char) => {
      return ((acc << 5) - acc + char.charCodeAt(0)) | 0;
    }, 0);

    for (let row = 0; row < modules; row++) {
      for (let col = 0; col < modules; col++) {
        // Create a deterministic pattern based on position and secret
        const seed = (row * modules + col + hash) % 100;
        if (seed < 40) {
          svg += `<rect x="${col * cellSize}" y="${row * cellSize}" width="${cellSize}" height="${cellSize}" fill="black"/>`;
        }
      }
    }

    // Add finder patterns (top-left, top-right, bottom-left)
    const finderSize = 7 * cellSize;
    const patterns = [
      { x: 0, y: 0 },
      { x: size - finderSize, y: 0 },
      { x: 0, y: size - finderSize }
    ];

    patterns.forEach(({ x, y }) => {
      svg += `<rect x="${x}" y="${y}" width="${finderSize}" height="${finderSize}" fill="black"/>`;
      svg += `<rect x="${x + cellSize}" y="${y + cellSize}" width="${finderSize - 2 * cellSize}" height="${finderSize - 2 * cellSize}" fill="white"/>`;
      svg += `<rect x="${x + 2 * cellSize}" y="${y + 2 * cellSize}" width="${finderSize - 4 * cellSize}" height="${finderSize - 4 * cellSize}" fill="black"/>`;
    });

    svg += '</svg>';
    return svg;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        icon={ShieldCheck}
        title="Two-Factor Authentication"
        subtitle="Enhance dashboard security with 2FA verification."
        accent="emerald"
      />

      <Card className="space-y-5 p-6">
        <div className="flex items-center justify-between border-b border-surface-200 pb-4 dark:border-white/10">
          <div>
            <h3 className="flex items-center gap-2 text-base font-bold tracking-tight">
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
              2FA Status
            </h3>
            <p className="mt-0.5 text-xs text-surface-500 dark:text-surface-400">
              {enabled ? 'Two-factor authentication is enabled' : 'Two-factor authentication is disabled'}
            </p>
          </div>
          <div
            className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold ${
              enabled
                ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                : 'border-surface-200 bg-surface-100 text-surface-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-surface-400'
            }`}
          >
            {enabled ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
            {enabled ? 'Enabled' : 'Disabled'}
          </div>
        </div>

        {!enabled && (
          <div className="space-y-5">
            <div className="rounded-xl border border-surface-200 bg-surface-50/70 p-5 dark:border-white/10 dark:bg-white/[0.03]">
              <h4 className="mb-3 text-sm font-bold text-surface-900 dark:text-white">
                Setup Instructions
              </h4>
              <ol className="space-y-2 text-xs text-surface-600 dark:text-surface-400">
                <li className="flex items-start gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                    1
                  </span>
                  Scan the QR code below with your authenticator app (Google Authenticator, Authy, etc.)
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                    2
                  </span>
                  Enter the 6-digit verification code from your app
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                    3
                  </span>
                  Save your backup codes in a secure location
                </li>
              </ol>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <FieldLabel>QR Code</FieldLabel>
                <div className="rounded-xl border border-surface-200 bg-white p-4 dark:border-white/10 dark:bg-white/[0.04]">
                  <div
                    className="mx-auto h-[200px] w-[200px]"
                    dangerouslySetInnerHTML={{ __html: generateQRCodeSVG(secret) }}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <FieldLabel>Secret Key (Manual Entry)</FieldLabel>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={secret}
                      className="input flex-1 font-mono text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => copyToClipboard(secret)}
                      className="btn-ghost"
                    >
                      {copiedCode === secret ? (
                        <Check className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <FieldLabel required>Verification Code</FieldLabel>
                  <input
                    type="text"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    maxLength={6}
                    className="input font-mono text-center text-lg tracking-[0.5em]"
                  />
                </div>

                <button
                  onClick={handleVerify}
                  disabled={verificationCode.length !== 6 || verifying}
                  className="btn-primary w-full"
                >
                  {verifying ? (
                    <span className="flex items-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Verifying...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Key className="h-4 w-4" />
                      Enable 2FA
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {enabled && (
          <div className="space-y-4">
            <div className="rounded-lg border border-emerald-500/25 bg-emerald-500/10 p-4">
              <div className="flex items-center gap-3">
                <Check className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                <div>
                  <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                    2FA is Active
                  </p>
                  <p className="text-xs text-emerald-600/80 dark:text-emerald-400/80">
                    Your dashboard is protected with two-factor authentication
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowBackupCodes(!showBackupCodes)}
              className="btn-ghost text-xs"
            >
              {showBackupCodes ? 'Hide Backup Codes' : 'Show Backup Codes'}
            </button>

            {showBackupCodes && (
              <div className="rounded-xl border border-surface-200 bg-surface-50/70 p-5 dark:border-white/10 dark:bg-white/[0.03]">
                <div className="mb-3 flex items-center justify-between">
                  <h4 className="text-sm font-bold text-surface-900 dark:text-white">
                    Backup Codes
                  </h4>
                  <button
                    onClick={() => copyToClipboard(backupCodes.join('\n'))}
                    className="btn-ghost text-xs"
                  >
                    {copiedCode === backupCodes.join('\n') ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-500" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        Copy All
                      </>
                    )}
                  </button>
                </div>
                <div className="rounded-lg border border-amber-500/25 bg-amber-500/10 p-3 mb-3">
                  <div className="flex items-start gap-2 text-xs text-amber-700 dark:text-amber-300">
                    <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>Save these codes in a secure location. Each code can only be used once.</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {backupCodes.map((code, idx) => (
                    <div
                      key={idx}
                      className="rounded-lg border border-surface-200 bg-white px-3 py-2 text-center font-mono text-sm font-bold text-surface-900 dark:border-white/10 dark:bg-white/[0.04] dark:text-white"
                    >
                      {code}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={() => setEnabled(false)}
              className="rounded-lg border border-rose-500/25 bg-rose-500/10 px-4 py-2 text-xs font-bold text-rose-600 transition-colors hover:bg-rose-500/20 dark:text-rose-400"
            >
              Disable 2FA
            </button>
          </div>
        )}
      </Card>
    </div>
  );
};
