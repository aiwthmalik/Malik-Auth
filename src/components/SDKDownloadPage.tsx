import React, { useState } from 'react';
import {
  Download,
  Code2,
  FileCode,
  Copy,
  Check,
  ExternalLink,
  Shield,
  Terminal,
  Package,
  ChevronRight,
  BookOpen
} from 'lucide-react';
import { Card, PageHeader } from './ui';

interface SdkInfo {
  id: string;
  name: string;
  language: string;
  version: string;
  framework: string;
  description: string;
  icon: string;
  color: string;
  status: 'available' | 'coming-soon';
  downloadUrl?: string;
  docsUrl?: string;
  integrationCode: string;
}

const SDKS: SdkInfo[] = [
  {
    id: 'csharp-winforms',
    name: 'C# WinForms SDK',
    language: 'C#',
    version: '2.5.0',
    framework: '.NET Framework 4.7.2+',
    description: 'Full-featured SDK for C# Windows Forms applications. Includes authentication, license validation, session management, and remote variable sync.',
    icon: '🟣',
    color: 'violet',
    status: 'available',
    integrationCode: `using MalikAuth;

// Initialize the client
var client = new MalikAuthClient(
    appId: "YOUR_APP_ID",
    appSecret: "YOUR_APP_SECRET",
    version: "1.0.0"
);

// Initialize connection
var initResult = await client.Init(hwid: "HWID-HERE");
if (initResult.Success)
{
    Console.WriteLine("Connected to MalikAuth");

    // Register a new user
    var regResult = await client.Register(
        username: "john_doe",
        password: "securePass123",
        licenseKey: "MALIK-XXXX-XXXX-XXXX-XXXX",
        hwid: "HWID-HERE"
    );

    // Login
    var loginResult = await client.Login(
        username: "john_doe",
        password: "securePass123",
        hwid: "HWID-HERE"
    );

    if (loginResult.Success)
    {
        Console.WriteLine($"Welcome {loginResult.Username}!");
        Console.WriteLine($"Session: {loginResult.SessionId}");

        // Start heartbeat loop
        while (true)
        {
            var hb = await client.Heartbeat(loginResult.SessionId, "HWID-HERE");
            if (!hb.Active) break;
            await Task.Delay(15000);
        }
    }
}`
  },
  {
    id: 'python',
    name: 'Python SDK',
    language: 'Python',
    version: '1.0.0',
    framework: 'Python 3.8+',
    description: 'Lightweight SDK for Python applications. Simple API for authentication and license management.',
    icon: '🐍',
    color: 'amber',
    status: 'coming-soon',
    integrationCode: `# Coming Soon
# The Python SDK is currently in development.
# Join our Discord for updates and beta access.`
  },
  {
    id: 'cpp',
    name: 'C++ SDK',
    language: 'C++',
    version: '1.0.0',
    framework: 'C++17 / Visual Studio 2019+',
    description: 'Native C++ SDK for high-performance desktop applications with minimal overhead.',
    icon: '⚙️',
    color: 'sky',
    status: 'coming-soon',
    integrationCode: `// Coming Soon
// The C++ SDK is currently in development.
// Join our Discord for updates and beta access.`
  },
  {
    id: 'web-js',
    name: 'Web JavaScript SDK',
    language: 'JavaScript',
    version: '1.0.0',
    framework: 'ES6+ / Node.js 18+',
    description: 'Browser and Node.js SDK for web applications. Works with React, Vue, Angular, and vanilla JS.',
    icon: '🌐',
    color: 'emerald',
    status: 'coming-soon',
    integrationCode: `// Coming Soon
// The Web JS SDK is currently in development.
// Join our Discord for updates and beta access.`
  }
];

export const SDKDownloadPage: React.FC = () => {
  const [selectedSdk, setSelectedSdk] = useState<string>(SDKS[0].id);
  const [copiedCode, setCopiedCode] = useState(false);

  const currentSdk = SDKS.find(s => s.id === selectedSdk) || SDKS[0];

  const handleCopyCode = () => {
    navigator.clipboard.writeText(currentSdk.integrationCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Download}
        title="SDK Downloads"
        subtitle="Download and integrate MalikAuth into your application."
        accent="violet"
        actions={
          <a
            href="/openapi.yaml"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-ghost flex items-center gap-2"
          >
            <BookOpen className="h-4 w-4" />
            API Docs
          </a>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-3 lg:col-span-1">
          {SDKS.map((sdk) => (
            <button
              key={sdk.id}
              onClick={() => setSelectedSdk(sdk.id)}
              className={`w-full text-left rounded-xl border p-4 transition-all ${
                selectedSdk === sdk.id
                  ? `border-${sdk.color}-500/40 bg-${sdk.color}-500/10 shadow-sm`
                  : 'border-surface-200 bg-surface-50/50 hover:border-surface-300 dark:border-white/10 dark:bg-white/[0.02] dark:hover:border-white/20'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="text-2xl">{sdk.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-surface-900 dark:text-white">{sdk.name}</span>
                    {sdk.status === 'coming-soon' && (
                      <span className="rounded-md bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-bold uppercase text-amber-600 dark:text-amber-400">
                        Soon
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-surface-500 dark:text-surface-400">{sdk.framework}</div>
                </div>
                <ChevronRight className="h-4 w-4 text-surface-400" />
              </div>
            </button>
          ))}
        </div>

        <div className="space-y-6 lg:col-span-2">
          <Card className="space-y-5 p-6">
            <div className="flex items-start justify-between border-b border-surface-200 pb-4 dark:border-white/10">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{currentSdk.icon}</span>
                  <div>
                    <h3 className="text-lg font-bold text-surface-900 dark:text-white">{currentSdk.name}</h3>
                    <div className="flex items-center gap-2 text-xs text-surface-500 dark:text-surface-400">
                      <span>Version {currentSdk.version}</span>
                      <span>·</span>
                      <span>{currentSdk.framework}</span>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-surface-600 dark:text-surface-300 max-w-xl">{currentSdk.description}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {currentSdk.status === 'available' ? (
                <>
                  <button className="btn-primary flex items-center gap-2">
                    <Download className="h-4 w-4" />
                    Download SDK
                  </button>
                  <a
                    href="#integration"
                    className="btn-ghost flex items-center gap-2"
                  >
                    <Code2 className="h-4 w-4" />
                    View Integration
                  </a>
                </>
              ) : (
                <div className="flex items-center gap-2 rounded-lg border border-amber-500/25 bg-amber-500/10 px-4 py-2 text-xs font-semibold text-amber-600 dark:text-amber-400">
                  <Package className="h-4 w-4" />
                  Coming Soon — Join our Discord for beta access
                </div>
              )}
            </div>
          </Card>

          <Card id="integration" className="space-y-5 p-6">
            <div className="flex items-center justify-between border-b border-surface-200 pb-4 dark:border-white/10">
              <div>
                <h3 className="flex items-center gap-2 text-base font-bold tracking-tight">
                  <Terminal className="h-4 w-4 text-violet-500" />
                  Integration Guide
                </h3>
                <p className="mt-0.5 text-xs text-surface-500 dark:text-surface-400">
                  Quick start code example for {currentSdk.name}
                </p>
              </div>
              <button
                onClick={handleCopyCode}
                className="btn-ghost flex items-center gap-2 text-xs"
              >
                {copiedCode ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                {copiedCode ? 'Copied!' : 'Copy Code'}
              </button>
            </div>

            <div className="rounded-xl border border-surface-200 bg-[#1e1e1e] p-4 dark:border-white/10">
              <pre className="overflow-x-auto font-mono text-xs leading-relaxed text-slate-200">
                <code>{currentSdk.integrationCode}</code>
              </pre>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="flex items-center gap-2 text-base font-bold tracking-tight mb-4">
              <Shield className="h-4 w-4 text-emerald-500" />
              SDK Features
            </h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {[
                { label: 'License Key Validation', desc: 'Validate and activate license keys' },
                { label: 'User Authentication', desc: 'Register and login users securely' },
                { label: 'Session Management', desc: 'Heartbeat-based session tracking' },
                { label: 'HWID Locking', desc: 'Hardware-based license binding' },
                { label: 'Remote Variables', desc: 'Sync configuration from dashboard' },
                { label: 'Auto Expiry', desc: 'Automatic license expiration handling' },
              ].map((feature) => (
                <div
                  key={feature.label}
                  className="flex items-start gap-3 rounded-lg border border-surface-200 p-3 dark:border-white/10"
                >
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                  <div>
                    <div className="text-xs font-bold text-surface-900 dark:text-white">{feature.label}</div>
                    <div className="text-[11px] text-surface-500 dark:text-surface-400">{feature.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
