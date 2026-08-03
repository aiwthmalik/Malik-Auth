import React, { useState } from 'react';
import { SkipToContent } from './SkipToContent';
import {
  ShieldCheck,
  Code2,
  Lock,
  Cpu,
  Radio,
  FileCode,
  Zap,
  CheckCircle2,
  ArrowRight,
  Terminal,
  Key,
  ShieldAlert,
  LogOut,
  Sparkles,
  Check,
  Sun,
  Moon,
  Menu,
  X,
  Github,
  Globe
} from 'lucide-react';
import { useTheme } from '../lib/useTheme';

interface LandingPageProps {
  onOpenAuthModal: () => void;
  onLaunchConsole: () => void;
  isLoggedIn: boolean;
  userEmail?: string | null;
  onSignOut?: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onOpenAuthModal,
  onLaunchConsole,
  isLoggedIn,
  userEmail,
  onSignOut,
}) => {
  const { theme, toggleTheme } = useTheme();
  const [activeCodeTab, setActiveCodeTab] = useState<'initialize' | 'validate' | 'hwid' | 'remote'>('initialize');
  const [mobileOpen, setMobileOpen] = useState(false);

  const codeSnippets: Record<string, string> = {
    initialize: `// 1. Initialize MalikAuth Security Client
import { MalikAuthClient } from '@malikauth/client';

const authApp = new MalikAuthClient({
  name: "Apex Platform v2",
  ownerId: "Developer_Malik",
  appSecret: "secret_4c8e9b2a1f0d3a5e",
  version: "2.4.1"
});

await authApp.initialize();
if (!authApp.isInitialized) {
  console.error("MalikAuth initialization failed!");
  process.exit(1);
}`,
    validate: `// 2. Validate License Key & Check Expiration
const licenseKey = "MALIK-X9A2-K7L1-B4M9-Q2W8";

const result = await authApp.license.validateKey(licenseKey);

if (result.success) {
  console.log(\`Welcome back, \${result.user.username}!\`);
  startProtectedSession(result.sessionToken);
} else {
  console.error("Authentication error:", result.message);
}`,
    hwid: `// 3. Hardware ID (HWID) Check & Machine Locking
// Generates SHA-256 fingerprint from hardware UUID
const currentHwid = await authApp.security.getHardwareFingerprint();

if (result.isHwidMismatch) {
  console.warn("HWID mismatch detected! License locked to another PC.");
  process.exit(0);
}`,
    remote: `// 4. Fetch Remote Encrypted Variables (Memory Guarded)
const downloadUrl = authApp.remoteVars.getString("DOWNLOAD_URL");
const memOffset   = authApp.remoteVars.getEncryptedString("OFFSET_LOCAL_PLAYER");

console.log("Remote sync successful. Target offset:", memOffset);
// Auto-decrypted in memory using AES-256 GCM`,
  };

  const codeTabs = [
    { id: 'initialize' as const, label: 'Initialize' },
    { id: 'validate' as const, label: 'Validate' },
    { id: 'hwid' as const, label: 'HWID Lock' },
    { id: 'remote' as const, label: 'Remote Sync' },
  ];

  const features = [
    {
      icon: Lock,
      color: 'text-brand-500 bg-brand-500/10 border-brand-500/20',
      title: 'AES-256 Memory Encryption',
      desc: 'Strings and license tokens are decrypted in memory using AES-256 GCM only upon validation, defeating static string dumpers and reverse engineering.',
    },
    {
      icon: Cpu,
      color: 'text-violet-500 bg-violet-500/10 border-violet-500/20',
      title: 'Hardware Fingerprint Binding',
      desc: 'Each license is automatically locked to the physical machine fingerprint. Users cannot share keys across different computers.',
    },
    {
      icon: Zap,
      color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
      title: 'Live Remote Variable Sync',
      desc: 'Update configuration parameters, download URLs, or emergency maintenance banners globally without shipping a new build.',
    },
    {
      icon: Radio,
      color: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
      title: 'Real-Time Session Revocation',
      desc: 'Monitor live heartbeat pings from active clients. Revoke sessions or ban suspicious users instantly from the console.',
    },
    {
      icon: ShieldAlert,
      color: 'text-cyan-500 bg-cyan-500/10 border-cyan-500/20',
      title: 'Anti-Tamper Protections',
      desc: 'Built-in validation detects common analysis tools and rejects initialization immediately to safeguard your IP.',
    },
    {
      icon: FileCode,
      color: 'text-sky-500 bg-sky-500/10 border-sky-500/20',
      title: 'Role-Based Tier Access',
      desc: 'Assign license keys to Basic, VIP, or Enterprise tiers. Restrict features and remote variables automatically by rank.',
    },
  ];

  const pricing = [
    {
      name: 'Developer Starter',
      tagline: 'Perfect for developers & prototypes',
      price: '$0',
      period: '/ forever',
      featured: false,
      cta: 'Get Started Free',
      features: ['Up to 50 active license keys', 'Hardware fingerprint locking', 'AES-256 memory encryption', '1 Application project'],
    },
    {
      name: 'Commercial Pro',
      tagline: 'For commercial software & premium tools',
      price: '$29',
      period: '/ month',
      featured: true,
      cta: 'Start Pro Trial',
      features: ['Up to 5,000 active license keys', 'Unlimited Remote Sync Variables', 'Live Session heartbeat revocation', 'Full Audit Logs & Forensics', 'Up to 10 Application projects'],
    },
    {
      name: 'Enterprise & Custom',
      tagline: 'Dedicated cloud hosting & custom SDK',
      price: '$99',
      period: '/ month',
      featured: false,
      cta: 'Contact Enterprise',
      features: ['Unlimited License Keys & Users', 'Unlimited Application projects', 'Custom obfuscated SDK wrapper', 'Priority 24/7 developer support'],
    },
  ];

  return (
    <div className="min-h-screen bg-surface-50 text-surface-900 dark:bg-[#0b0b12] dark:text-surface-100">
      <SkipToContent />
      {/* Top Navigation */}
      <header role="banner" className="sticky top-0 z-50 border-b border-surface-200/70 bg-white/80 backdrop-blur-xl dark:border-white/10 dark:bg-[#0b0b12]/80">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-violet-600 shadow-md shadow-brand-500/25">
              <ShieldCheck className="h-6 w-6 text-white" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-black tracking-tight">MalikAuth</span>
              <span className="rounded-full border border-brand-500/25 bg-brand-500/10 px-2.5 py-0.5 text-xs font-semibold text-brand-600 dark:text-brand-300">
                Security Platform
              </span>
            </div>
          </div>

          <nav aria-label="Main navigation" className="hidden items-center gap-8 text-sm font-medium text-surface-600 dark:text-surface-300 md:flex">
            <a href="#features" className="transition-colors hover:text-brand-500">Features</a>
            <a href="#security" className="transition-colors hover:text-brand-500">Security Engine</a>
            <a href="#pricing" className="transition-colors hover:text-brand-500">Pricing</a>
          </nav>

          <div className="flex items-center gap-2.5">
            <button
              onClick={toggleTheme}
              aria-label="Toggle theme"
              title="Toggle theme"
              className="rounded-xl border border-surface-200 bg-white p-2 text-surface-500 transition-colors hover:text-surface-900 dark:border-white/10 dark:bg-white/[0.04] dark:text-surface-300 dark:hover:text-white"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            {isLoggedIn ? (
              <div className="hidden items-center gap-2.5 sm:flex">
                <span className="rounded-lg border border-surface-200 bg-surface-100 px-3 py-1.5 text-xs font-medium text-surface-600 dark:border-white/10 dark:bg-white/[0.05] dark:text-surface-300">
                  {userEmail || 'Authenticated Developer'}
                </span>
                <button onClick={onLaunchConsole} className="btn-primary">
                  Developer Console
                  <ArrowRight className="h-4 w-4" />
                </button>
                {onSignOut && (
                  <button
                    onClick={onSignOut}
                    aria-label="Sign Out"
                    title="Sign Out"
                    className="rounded-xl border border-surface-200 bg-white p-2 text-surface-500 transition-colors hover:text-rose-500 dark:border-white/10 dark:bg-white/[0.04] dark:text-surface-300"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                )}
              </div>
            ) : (
              <div className="hidden items-center gap-2 sm:flex">
                <button onClick={onOpenAuthModal} className="btn-ghost">
                  Sign In
                </button>
                <button onClick={onOpenAuthModal} className="btn-primary">
                  Get Started
                </button>
              </div>
            )}

            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileOpen}
              className="rounded-xl border border-surface-200 bg-white p-2 text-surface-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-surface-300 md:hidden"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="border-t border-surface-200 bg-white px-4 py-4 dark:border-white/10 dark:bg-[#0d0d16] md:hidden">
            <div className="flex flex-col gap-2">
              <a href="#features" onClick={() => setMobileOpen(false)} className="rounded-lg px-3 py-2 text-sm font-medium hover:bg-surface-100 dark:hover:bg-white/5">Features</a>
              <a href="#security" onClick={() => setMobileOpen(false)} className="rounded-lg px-3 py-2 text-sm font-medium hover:bg-surface-100 dark:hover:bg-white/5">Security Engine</a>
              <a href="#pricing" onClick={() => setMobileOpen(false)} className="rounded-lg px-3 py-2 text-sm font-medium hover:bg-surface-100 dark:hover:bg-white/5">Pricing</a>
              <div className="mt-2 flex gap-2">
                {isLoggedIn ? (
                  <button onClick={onLaunchConsole} className="btn-primary flex-1">Developer Console</button>
                ) : (
                  <>
                    <button onClick={onOpenAuthModal} className="btn-ghost flex-1">Sign In</button>
                    <button onClick={onOpenAuthModal} className="btn-primary flex-1">Get Started</button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Hero */}
      <section id="main-content" aria-label="Hero" className="relative overflow-hidden">
        <div className="absolute inset-0 bg-grid" />
        <div className="absolute -top-40 left-1/2 h-[500px] w-[900px] -translate-x-1/2 rounded-full bg-gradient-to-r from-brand-500/20 via-violet-500/20 to-cyan-500/20 blur-3xl" />
        <div className="relative mx-auto max-w-7xl px-4 pb-24 pt-16 text-center sm:px-6 lg:px-8 lg:pt-24">
          <div className="animate-in-up inline-flex items-center gap-2 rounded-full border border-brand-500/25 bg-brand-500/10 px-3.5 py-1.5 text-xs font-semibold text-brand-600 dark:text-brand-300">
            <ShieldCheck className="h-4 w-4" />
            MalikAuth Software Licensing & Memory Security Engine v2.5
          </div>

          <h1 className="animate-in-up mx-auto mt-6 max-w-4xl text-4xl font-black leading-tight tracking-tight sm:text-6xl">
            Enterprise Software Licensing &{' '}
            <span className="text-gradient">Hardware Security</span>
          </h1>

          <p className="animate-in-up mx-auto mt-6 max-w-2xl text-base leading-relaxed text-surface-600 dark:text-surface-300 sm:text-lg">
            Protect your software with AES-256 memory encryption, hardware ID locking,
            live session revocation, and instant remote variable synchronization.
          </p>

          <div className="animate-in-up mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <button
              onClick={isLoggedIn ? onLaunchConsole : onOpenAuthModal}
              className="btn-primary w-full px-7 py-3.5 text-base sm:w-auto"
            >
              {isLoggedIn ? 'Open Developer Console' : 'Launch Free Console'}
              <ArrowRight className="h-5 w-5" />
            </button>
            <a
              href="#features"
              className="btn-ghost w-full px-7 py-3.5 text-base sm:w-auto"
            >
              <Code2 className="h-5 w-5 text-brand-500" />
              Explore Security Features
            </a>
          </div>

          {/* Metrics */}
          <div className="animate-in-up mx-auto mt-16 grid max-w-4xl grid-cols-2 gap-4 md:grid-cols-4">
            {[
              { value: 'AES-256', label: 'GCM Memory Encryption', color: 'text-surface-900 dark:text-white' },
              { value: '< 15ms', label: 'API Verification Latency', color: 'text-brand-500' },
              { value: '100%', label: 'Hardware Fingerprint Lock', color: 'text-emerald-500' },
              { value: 'Zero Patch', label: 'Live Remote Variable Sync', color: 'text-violet-500' },
            ].map((m) => (
              <div key={m.label} className="card p-5 text-center">
                <div className={`text-2xl font-extrabold ${m.color}`}>{m.value}</div>
                <div className="mt-1 text-xs text-surface-500 dark:text-surface-400">{m.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" aria-label="Features" className="relative py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto mb-16 max-w-3xl text-center">
            <span className="text-xs font-bold uppercase tracking-widest text-brand-500">Features</span>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Built For Software Security & Licensing</h2>
            <p className="mt-3 text-sm text-surface-600 dark:text-surface-400">
              Stop unauthorized distribution, account sharing, and memory analysis with a hardened licensing architecture.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {features.map((f) => (
              <div
                key={f.title}
                className="card group p-6 transition-all duration-300 hover:-translate-y-1 hover:border-brand-400/40 hover:shadow-xl hover:shadow-brand-500/5"
              >
                <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl border ${f.color}`}>
                  <f.icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold tracking-tight">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-surface-600 dark:text-surface-400">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Security Engine / Code */}
      <section id="security" aria-label="Security Engine" className="relative py-24">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-brand-500/[0.04] to-transparent" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-brand-500">Security Engine</span>
              <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                Drop-in protection for your <span className="text-gradient">desktop applications</span>
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-surface-600 dark:text-surface-400">
                Integrate the MalikAuth SDK in minutes. Initialize the security engine, validate license keys,
                lock to hardware, and sync encrypted remote variables — all with a few lines of code.
              </p>

              <div className="mt-8 space-y-4">
                {[
                  { icon: Terminal, text: 'Zero external dependencies in the C# SDK' },
                  { icon: Globe, text: 'Works with C#, C++, Python, and Web clients' },
                  { icon: ShieldCheck, text: 'Offline fail-safe mode keeps clients running' },
                ].map((item) => (
                  <div key={item.text} className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-brand-500/20 bg-brand-500/10 text-brand-500">
                      <item.icon className="h-4 w-4" />
                    </div>
                    <span className="text-sm font-medium text-surface-700 dark:text-surface-200">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Code Window */}
            <div className="overflow-hidden rounded-2xl border border-surface-200 bg-[#0d0d16] shadow-2xl shadow-black/30 dark:border-white/10">
              <div className="flex items-center justify-between border-b border-white/10 bg-white/[0.03] px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-rose-500" />
                  <span className="h-3 w-3 rounded-full bg-amber-500" />
                  <span className="h-3 w-3 rounded-full bg-emerald-500" />
                  <span className="ml-2 font-mono text-xs text-surface-400">client.ts</span>
                </div>
                <span className="font-mono text-[10px] text-surface-500">MalikAuth SDK</span>
              </div>

              <div className="flex gap-1 border-b border-white/10 px-3 pt-3">
                {codeTabs.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setActiveCodeTab(t.id)}
                    className={`rounded-t-lg px-3 py-2 font-mono text-xs transition-colors ${
                      activeCodeTab === t.id
                        ? 'bg-white/[0.06] text-brand-300'
                        : 'text-surface-500 hover:text-surface-300'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              <pre className="overflow-x-auto p-5 font-mono text-xs leading-relaxed text-surface-200">
                <code>{codeSnippets[activeCodeTab]}</code>
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" aria-label="Pricing" className="py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto mb-16 max-w-3xl text-center">
            <span className="text-xs font-bold uppercase tracking-widest text-brand-500">Pricing</span>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Simple, Transparent Developer Tiers</h2>
            <p className="mt-3 text-sm text-surface-600 dark:text-surface-400">
              Start building for free. Scale when your software reaches commercial distribution.
            </p>
          </div>

          <div className="mx-auto grid max-w-5xl grid-cols-1 gap-8 md:grid-cols-3">
            {pricing.map((p) => (
              <div
                key={p.name}
                className={`card relative flex flex-col justify-between p-6 transition-all duration-300 ${
                  p.featured
                    ? 'border-2 border-brand-500 shadow-xl shadow-brand-500/10'
                    : 'hover:-translate-y-1 hover:shadow-lg'
                }`}
              >
                {p.featured && (
                  <span className="absolute -top-3 right-6 rounded-full bg-gradient-to-r from-brand-500 to-violet-600 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
                    Most Popular
                  </span>
                )}
                <div>
                  <h3 className="text-lg font-bold tracking-tight">{p.name}</h3>
                  <p className="mt-1 text-xs text-surface-500 dark:text-surface-400">{p.tagline}</p>
                  <div className="mt-6 flex items-baseline">
                    <span className="text-3xl font-extrabold">{p.price}</span>
                    <span className="ml-1 text-xs text-surface-500 dark:text-surface-400">{p.period}</span>
                  </div>
                  <ul className="mt-6 space-y-3 text-xs text-surface-600 dark:text-surface-300">
                    {p.features.map((f) => (
                      <li key={f} className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-brand-500" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <button
                  onClick={onOpenAuthModal}
                  className={`mt-8 w-full ${p.featured ? 'btn-primary' : 'btn-ghost'}`}
                >
                  {p.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section aria-label="Call to action" className="relative overflow-hidden py-24">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-600 via-violet-600 to-brand-800" />
        <div className="absolute inset-0 bg-grid opacity-20" />
        <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Ready to secure your software?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm text-white/80">
            Join developers who protect their applications with enterprise-grade licensing and hardware security.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <button
              onClick={isLoggedIn ? onLaunchConsole : onOpenAuthModal}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-7 py-3.5 text-base font-bold text-brand-700 shadow-lg transition-all hover:bg-surface-50 active:scale-[0.98]"
            >
              {isLoggedIn ? 'Open Developer Console' : 'Launch Free Console'}
              <ArrowRight className="h-5 w-5" />
            </button>
            <a
              href="#features"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/30 px-7 py-3.5 text-base font-semibold text-white transition-colors hover:bg-white/10"
            >
              <Check className="h-5 w-5" />
              View Features
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer role="contentinfo" className="border-t border-surface-200 bg-white/60 py-8 text-xs text-surface-500 backdrop-blur dark:border-white/10 dark:bg-white/[0.02] dark:text-surface-400">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-brand-500" />
            <span className="font-bold text-surface-900 dark:text-white">MalikAuth Security Platform</span>
            <span className="text-surface-300 dark:text-surface-600">•</span>
            <span>Real-Time Licensing & Hardware Security</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="#features" className="transition-colors hover:text-brand-500">Features</a>
            <a href="#security" className="transition-colors hover:text-brand-500">SDK</a>
            <a href="#pricing" className="transition-colors hover:text-brand-500">Pricing</a>
            <span className="flex items-center gap-1.5 font-semibold text-emerald-600 dark:text-emerald-400">
              <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
              Firebase Secure Cloud Active
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};