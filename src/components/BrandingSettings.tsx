import React, { useState } from 'react';
import {
  Palette,
  Image,
  Type,
  Save,
  Eye
} from 'lucide-react';
import { MalikApp } from '../types';
import { updateApp, logActivity } from '../lib/malikAuthService';
import { Card, PageHeader, FieldLabel } from './ui';

interface BrandingSettingsProps {
  app: MalikApp;
  onUpdate: () => void;
}

export const BrandingSettings: React.FC<BrandingSettingsProps> = ({ app, onUpdate }) => {
  const [logoUrl, setLogoUrl] = useState((app as any).branding?.logoUrl || '');
  const [themeColor, setThemeColor] = useState((app as any).branding?.themeColor || '#6366f1');
  const [loginBanner, setLoginBanner] = useState((app as any).branding?.loginBanner || '');
  const [footerText, setFooterText] = useState((app as any).branding?.footerText || '');
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const presetColors = [
    { name: 'Indigo', value: '#6366f1' },
    { name: 'Violet', value: '#8b5cf6' },
    { name: 'Blue', value: '#3b82f6' },
    { name: 'Cyan', value: '#06b6d4' },
    { name: 'Emerald', value: '#10b981' },
    { name: 'Amber', value: '#f59e0b' },
    { name: 'Rose', value: '#f43f5e' },
    { name: 'Slate', value: '#64748b' },
  ];

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!app.id) return;

    setSaving(true);
    setSaveMessage(null);
    try {
      await updateApp(app.id, {
        branding: {
          logoUrl,
          themeColor,
          loginBanner,
          footerText,
        },
      } as any);
      await logActivity(app.appId, 'REMOTE_SYNC', 'Admin', 'SYS', 'Branding settings updated');
      setSaveMessage('Branding settings saved successfully');
      onUpdate();
    } catch (err) {
      console.error('Error saving branding:', err);
      setSaveMessage('Failed to save branding settings');
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMessage(null), 4000);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Palette}
        title="Custom Branding"
        subtitle="Customize the look and feel of your application."
        accent="violet"
      />

      <form onSubmit={handleSave} className="space-y-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card className="space-y-5 p-6">
            <div className="border-b border-surface-200 pb-4 dark:border-white/10">
              <h3 className="flex items-center gap-2 text-base font-bold tracking-tight">
                <Image className="h-4 w-4 text-violet-500" />
                Logo & Theme
              </h3>
            </div>

            <div className="space-y-4">
              <div>
                <FieldLabel>App Logo URL</FieldLabel>
                <input
                  type="url"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  placeholder="https://example.com/logo.png"
                  className="input text-sm"
                />
                <p className="mt-1 text-xs text-surface-500 dark:text-surface-400">
                  URL to your app's logo image (PNG, SVG, or JPG)
                </p>
              </div>

              <div>
                <FieldLabel>Theme Color</FieldLabel>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={themeColor}
                      onChange={(e) => setThemeColor(e.target.value)}
                      className="h-10 w-10 cursor-pointer rounded-lg border border-surface-200 dark:border-white/10"
                    />
                    <input
                      type="text"
                      value={themeColor}
                      onChange={(e) => setThemeColor(e.target.value)}
                      className="input flex-1 font-mono text-sm"
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {presetColors.map((color) => (
                      <button
                        key={color.value}
                        type="button"
                        onClick={() => setThemeColor(color.value)}
                        className={`flex h-8 w-8 items-center justify-center rounded-lg border-2 transition-all ${
                          themeColor === color.value
                            ? 'border-surface-900 dark:border-white scale-110'
                            : 'border-transparent hover:scale-105'
                        }`}
                        style={{ backgroundColor: color.value }}
                        title={color.name}
                      >
                        {themeColor === color.value && (
                          <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <Card className="space-y-5 p-6">
            <div className="border-b border-surface-200 pb-4 dark:border-white/10">
              <h3 className="flex items-center gap-2 text-base font-bold tracking-tight">
                <Type className="h-4 w-4 text-violet-500" />
                Text & Messages
              </h3>
            </div>

            <div className="space-y-4">
              <div>
                <FieldLabel>Login Banner Text</FieldLabel>
                <textarea
                  rows={3}
                  value={loginBanner}
                  onChange={(e) => setLoginBanner(e.target.value)}
                  placeholder="Welcome to our secure application"
                  className="input resize-none text-sm"
                />
                <p className="mt-1 text-xs text-surface-500 dark:text-surface-400">
                  Text displayed on the login screen
                </p>
              </div>

              <div>
                <FieldLabel>Footer Text</FieldLabel>
                <input
                  type="text"
                  value={footerText}
                  onChange={(e) => setFooterText(e.target.value)}
                  placeholder="© 2024 Your Company. All rights reserved."
                  className="input text-sm"
                />
                <p className="mt-1 text-xs text-surface-500 dark:text-surface-400">
                  Text displayed in the footer
                </p>
              </div>
            </div>
          </Card>
        </div>

        <Card className="p-6">
          <div className="mb-4 border-b border-surface-200 pb-4 dark:border-white/10">
            <h3 className="flex items-center gap-2 text-base font-bold tracking-tight">
              <Eye className="h-4 w-4 text-violet-500" />
              Preview
            </h3>
          </div>

          <div className="rounded-xl border border-surface-200 bg-surface-50/50 p-6 dark:border-white/10 dark:bg-white/[0.02]">
            <div className="mx-auto max-w-md space-y-4">
              {loginBanner && (
                <div
                  className="rounded-lg p-4 text-center text-sm font-medium"
                  style={{ backgroundColor: `${themeColor}15`, color: themeColor }}
                >
                  {loginBanner}
                </div>
              )}

              <div className="rounded-xl border border-surface-200 bg-white p-6 shadow-lg dark:border-white/10 dark:bg-white/[0.04]">
                <div className="mb-4 text-center">
                  {logoUrl ? (
                    <img
                      src={logoUrl}
                      alt="App Logo"
                      className="mx-auto h-16 w-16 rounded-xl object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <div
                      className="mx-auto flex h-16 w-16 items-center justify-center rounded-xl text-2xl font-bold text-white"
                      style={{ backgroundColor: themeColor }}
                    >
                      {app.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <h4 className="mt-3 text-lg font-bold text-surface-900 dark:text-white">{app.name}</h4>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-surface-600 dark:text-surface-400">
                      Username
                    </label>
                    <div className="input flex items-center bg-surface-50 dark:bg-white/[0.02]">
                      <span className="text-surface-400">Enter username</span>
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-surface-600 dark:text-surface-400">
                      Password
                    </label>
                    <div className="input flex items-center bg-surface-50 dark:bg-white/[0.02]">
                      <span className="text-surface-400">Enter password</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="w-full rounded-lg py-2.5 text-sm font-semibold text-white transition-colors"
                    style={{ backgroundColor: themeColor }}
                  >
                    Sign In
                  </button>
                </div>
              </div>

              {footerText && (
                <div className="text-center text-xs text-surface-500 dark:text-surface-400">
                  {footerText}
                </div>
              )}
            </div>
          </div>
        </Card>

        <div className="flex items-center justify-end gap-3">
          {saveMessage && (
            <div className="rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-3 py-2 text-xs font-medium text-emerald-600 dark:text-emerald-400">
              {saveMessage}
            </div>
          )}
          <button type="submit" disabled={saving} className="btn-primary">
            <Save className="h-4 w-4" />
            {saving ? 'Saving...' : 'Save Branding'}
          </button>
        </div>
      </form>
    </div>
  );
};
