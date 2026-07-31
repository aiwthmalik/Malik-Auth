import React, { useState } from 'react';
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
  Server,
  Key,
  ShieldAlert,
  LogOut,
  Sparkles,
  Check
} from 'lucide-react';

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
  const [activeCodeTab, setActiveCodeTab] = useState<'initialize' | 'validate' | 'hwid' | 'remote'>('initialize');

  const codeSnippets: Record<string, string> = {
    initialize: `// 1. Initialize MalikAuth Security Client (REST API / SDK)
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
  console.log(\`Welcome back, \${result.user.username}! Role: \${result.user.role}\`);
  // Proceed to protected main application flow
  startProtectedSession(result.sessionToken);
} else {
  console.error("Authentication error:", result.message);
}`,
    hwid: `// 3. Hardware ID (HWID) Check & Machine Locking
// Automatically generates SHA-256 fingerprint from hardware UUID
const currentHwid = await authApp.security.getHardwareFingerprint();

if (result.isHwidMismatch) {
  console.warn(
    "HWID mismatch detected! Your license is locked to another computer. " +
    "Please request an HWID reset in the MalikAuth Dashboard."
  );
  process.exit(0);
}`,
    remote: `// 4. Fetch Remote Encrypted Variables (Memory Guarded)
// Pull remote variables without shipping patch updates
const downloadUrl = authApp.remoteVars.getString("DOWNLOAD_URL");
const memOffset   = authApp.remoteVars.getEncryptedString("OFFSET_LOCAL_PLAYER");

console.log("Remote sync successful. Target offset:", memOffset);
// Automatically decrypted in memory using AES-256 GCM`
  };

  return (
    <div className="min-h-screen bg-white text-slate-800 flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-indigo-600 shadow-sm shadow-indigo-600/20">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-lg text-slate-900 tracking-tight">MalikAuth</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                Security Platform
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center space-x-8 text-sm font-medium text-slate-600">
            <a href="#features" className="hover:text-indigo-600 transition-colors">Features</a>
            <a href="#security" className="hover:text-indigo-600 transition-colors">Security Engine</a>
            <a href="#pricing" className="hover:text-indigo-600 transition-colors">Pricing</a>
          </nav>

          <div className="flex items-center space-x-3">
            {isLoggedIn ? (
              <div className="flex items-center space-x-3">
                <span className="hidden sm:inline-block text-xs font-medium text-slate-600 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-lg">
                  {userEmail || 'Authenticated Developer'}
                </span>
                <button
                  onClick={onLaunchConsole}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-sm shadow-indigo-600/20 transition-all flex items-center space-x-1.5"
                >
                  <span>Developer Console</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                {onSignOut && (
                  <button
                    onClick={onSignOut}
                    title="Sign Out"
                    className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 rounded-xl border border-slate-200 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <button
                  onClick={onOpenAuthModal}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl border border-slate-200 transition-colors"
                >
                  Sign In
                </button>
                <button
                  onClick={onOpenAuthModal}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-sm shadow-indigo-600/25 transition-all flex items-center space-x-1.5"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Get Started</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-24 lg:pt-24 lg:pb-32 bg-gradient-to-b from-white via-indigo-50/30 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold mb-6">
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
            <span>MalikAuth Software Licensing & Memory Security Engine v2.5</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black text-slate-900 tracking-tight max-w-4xl mx-auto leading-tight">
            Enterprise Software Licensing & <br className="hidden sm:inline" />
            <span className="text-indigo-600">
              Hardware Security Platform
            </span>
          </h1>

          <p className="mt-6 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Protect your software applications with AES-256 memory encryption,
            hardware ID locking, live session revocation, and instant remote variable synchronization.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={isLoggedIn ? onLaunchConsole : onOpenAuthModal}
              className="w-full sm:w-auto px-7 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center space-x-2 text-base"
            >
              <span>{isLoggedIn ? 'Open Developer Console' : 'Launch Free Console'}</span>
              <ArrowRight className="w-5 h-5" />
            </button>
            <a
              href="#features"
              className="w-full sm:w-auto px-7 py-3.5 bg-white hover:bg-slate-50 text-slate-700 font-semibold rounded-xl border border-slate-300 transition-colors flex items-center justify-center space-x-2 text-base shadow-xs"
            >
              <Code2 className="w-5 h-5 text-indigo-600" />
              <span>Explore Security Features</span>
            </a>
          </div>

          {/* Key Metrics Banner */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 text-center shadow-xs">
              <div className="text-2xl font-bold text-slate-900">AES-256 GCM</div>
              <div className="text-xs text-slate-500 mt-1">Memory Stream Encryption</div>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-5 text-center shadow-xs">
              <div className="text-2xl font-bold text-indigo-600">&lt; 15ms</div>
              <div className="text-xs text-slate-500 mt-1">API Verification Latency</div>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-5 text-center shadow-xs">
              <div className="text-2xl font-bold text-emerald-600">100% HWID</div>
              <div className="text-xs text-slate-500 mt-1">Hardware Fingerprint Lock</div>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-5 text-center shadow-xs">
              <div className="text-2xl font-bold text-violet-600">Zero Patch</div>
              <div className="text-xs text-slate-500 mt-1">Live Remote Variable Sync</div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Breakdown Grid */}
      <section id="features" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-slate-900">Built For Software Security & Licensing</h2>
            <p className="text-slate-600 mt-2 text-sm">
              Stop unauthorized distribution, account sharing, and memory analysis with a hardened licensing architecture.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white border border-slate-200 p-6 rounded-2xl hover:border-indigo-300 transition-all shadow-xs">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4 border border-indigo-100">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">AES-256 Memory Encryption</h3>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                Strings and license tokens are decrypted in memory using AES-256 GCM only upon validation, preventing static string dumpers and reverse engineering.
              </p>
            </div>

            <div className="bg-white border border-slate-200 p-6 rounded-2xl hover:border-indigo-300 transition-all shadow-xs">
              <div className="w-12 h-12 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center mb-4 border border-violet-100">
                <Cpu className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Hardware Fingerprint Binding</h3>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                Each license is automatically locked to the user&apos;s physical machine fingerprint. Users cannot share keys across different computers.
              </p>
            </div>

            <div className="bg-white border border-slate-200 p-6 rounded-2xl hover:border-indigo-300 transition-all shadow-xs">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4 border border-emerald-100">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Live Remote Variable Sync</h3>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                Update configuration parameters, download URLs, or enable emergency maintenance banners globally without releasing a new application build.
              </p>
            </div>

            <div className="bg-white border border-slate-200 p-6 rounded-2xl hover:border-indigo-300 transition-all shadow-xs">
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4 border border-amber-100">
                <Radio className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Real-Time Session Revocation</h3>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                Monitor live heartbeat pings from active software clients. Revoke sessions or ban suspicious users instantly from your developer console.
              </p>
            </div>

            <div className="bg-white border border-slate-200 p-6 rounded-2xl hover:border-indigo-300 transition-all shadow-xs">
              <div className="w-12 h-12 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center mb-4 border border-cyan-100">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Anti-Tamper Protections</h3>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                Built-in validation checks detect common analysis tools and reject initialization immediately to safeguard your intellectual property.
              </p>
            </div>

            <div className="bg-white border border-slate-200 p-6 rounded-2xl hover:border-indigo-300 transition-all shadow-xs">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4 border border-indigo-100">
                <FileCode className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Role-Based Tier Access</h3>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                Assign license keys to Basic, VIP, or Enterprise tiers. Restrict specific application features or remote variables automatically based on user rank.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Comparison Section */}
      <section id="pricing" className="py-20 bg-slate-50 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-slate-900">Simple, Transparent Developer Tiers</h2>
            <p className="text-slate-600 mt-2 text-sm">
              Start building for free. Scale when your software reaches commercial distribution.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Free Developer */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col justify-between shadow-xs">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Developer Starter</h3>
                <p className="text-xs text-slate-500 mt-1">Perfect for developers & prototypes</p>
                <div className="mt-6 flex items-baseline">
                  <span className="text-3xl font-bold text-slate-900">$0</span>
                  <span className="text-xs text-slate-500 ml-1">/ forever</span>
                </div>
                <ul className="mt-6 space-y-3 text-xs text-slate-600">
                  <li className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span>Up to 50 active license keys</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span>Hardware fingerprint locking</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span>AES-256 memory stream encryption</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span>1 Application project</span>
                  </li>
                </ul>
              </div>
              <button
                onClick={onOpenAuthModal}
                className="mt-8 w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded-xl text-xs transition-colors"
              >
                Get Started Free
              </button>
            </div>

            {/* Pro Tier (Featured) */}
            <div className="bg-white border-2 border-indigo-600 rounded-2xl p-6 flex flex-col justify-between relative shadow-lg shadow-indigo-600/5">
              <div className="absolute -top-3 right-6 bg-indigo-600 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full">
                Most Popular
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Commercial Pro</h3>
                <p className="text-xs text-slate-500 mt-1">For commercial software & premium tools</p>
                <div className="mt-6 flex items-baseline">
                  <span className="text-3xl font-bold text-slate-900">$29</span>
                  <span className="text-xs text-slate-500 ml-1">/ month</span>
                </div>
                <ul className="mt-6 space-y-3 text-xs text-slate-600">
                  <li className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span>Up to 5,000 active license keys</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span>Unlimited Remote Sync Variables</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span>Live Session heartbeat revocation</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span>Full Audit Logs & Forensics</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span>Up to 10 Application projects</span>
                  </li>
                </ul>
              </div>
              <button
                onClick={onOpenAuthModal}
                className="mt-8 w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs transition-colors shadow-sm shadow-indigo-600/20"
              >
                Start Pro Trial
              </button>
            </div>

            {/* Enterprise Tier */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col justify-between shadow-xs">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Enterprise & Custom</h3>
                <p className="text-xs text-slate-500 mt-1">Dedicated cloud hosting & custom SDK builds</p>
                <div className="mt-6 flex items-baseline">
                  <span className="text-3xl font-bold text-slate-900">$99</span>
                  <span className="text-xs text-slate-500 ml-1">/ month</span>
                </div>
                <ul className="mt-6 space-y-3 text-xs text-slate-600">
                  <li className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span>Unlimited License Keys & Users</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span>Unlimited Application projects</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span>Custom obfuscated SDK wrapper</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span>Priority 24/7 developer support</span>
                  </li>
                </ul>
              </div>
              <button
                onClick={onOpenAuthModal}
                className="mt-8 w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded-xl text-xs transition-colors"
              >
                Contact Enterprise
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-indigo-600" />
            <span className="font-bold text-slate-900">MalikAuth Security Platform</span>
            <span className="text-slate-300">•</span>
            <span>Real-Time Licensing & Hardware Security</span>
          </div>
          <div className="flex items-center space-x-6">
            <a href="#features" className="hover:text-indigo-600 transition-colors">Features</a>
            <a href="#api-preview" className="hover:text-indigo-600 transition-colors">SDK</a>
            <a href="#pricing" className="hover:text-indigo-600 transition-colors">Pricing</a>
            <span className="text-emerald-600 font-semibold">Firebase Secure Cloud Active</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
