# MalikAuth - Enterprise Software Licensing & Hardware Security Platform

## Overview

MalikAuth is a full-stack authentication and license management platform designed for software developers to protect their applications with enterprise-grade security. It combines hardware fingerprinting, AES-256 memory encryption, real-time session management, and remote variable synchronization.

**Key Features:**
- 🔐 **AES-256 GCM Memory Encryption** - License tokens and strings decrypted in memory only upon validation
- 💻 **Hardware Fingerprint (HWID) Locking** - Keys locked to physical machine, preventing sharing
- 📡 **Real-Time Session Heartbeat & Remote Kill Switch** - Active monitoring and immediate revocation
- 🚀 **Live Remote Variable Sync** - Update app config without shipping new builds
- 📊 **Developer Dashboard** - Full control over licenses, users, sessions, and audit logs
- 🎨 **Responsive GUI** - Works on desktop, tablet, and mobile devices
- 🔌 **C# WinForms SDK** - Ready-to-use client library for Windows desktop apps
- 📝 **Audit Logging** - Comprehensive activity tracking with Discord webhook integration

## Tech Stack

### Frontend
- React 19 with TypeScript
- Vite 6 for fast builds
- Tailwind CSS 4 for styling
- Lucide React for icons
- Motion for animations

### Backend
- Node.js with Express
- Firebase Firestore (NoSQL database)
- Firebase Authentication

### SDK
- C# .NET WinForms client library
- REST API endpoints for client-server communication

## Project Structure

```
Malik-Auth-main/
├── src/
│   ├── components/          # React components
│   │   ├── LandingPage.tsx
│   │   ├── Sidebar.tsx
│   │   ├── DashboardOverview.tsx
│   │   ├── LicensesTab.tsx
│   │   ├── UsersTab.tsx
│   │   ├── SessionsTab.tsx
│   │   ├── RemoteVariablesTab.tsx
│   │   ├── ActivityLogsTab.tsx
│   │   ├── ManageAppsTab.tsx
│   │   └── SdkFilesTab.tsx
│   ├── lib/
│   │   ├── malikAuthService.ts  # Firebase CRUD operations
│   │   ├── firebase.ts          # Firebase initialization
│   │   └── dateUtils.ts         # Date formatting utilities
│   ├── types.ts                 # TypeScript type definitions
│   ├── App.tsx                  # Main app component
│   ├── main.tsx                 # Entry point
│   └── index.css                # Global styles
├── sdk/
│   └── csharp-winforms/         # C# WinForms SDK files
├── server.ts                    # Express + Firebase server
├── firebase-applet-config.json  # Firebase configuration
├── firestore.rules              # Firestore security rules
├── package.json                 # Dependencies
├── vite.config.ts               # Vite configuration
├── tsconfig.json                # TypeScript configuration
└── .env.example                 # Environment variables template
```

## Prerequisites

- Node.js (v18 or later)
- Bun or npm
- Firebase account (free tier works)
- (Optional) Discord webhook URL for audit logs

## Local Server Setup

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/Malik-Auth-main.git
cd Malik-Auth-main
```

### 2. Install Dependencies

```bash
# Using Bun (recommended)
bun install

# Or using npm
npm install
```

### 3. Firebase Configuration

Create a Firebase project at https://console.firebase.google.com/

1. Enable Firestore Database
2. Enable Authentication (Email/Password)
3. Download service account key or web app config

Create `firebase-applet-config.json` in the root directory:

```json
{
  "apiKey": "your-api-key",
  "authDomain": "your-project.firebaseapp.com",
  "projectId": "your-project-id",
  "storageBucket": "your-project.appspot.com",
  "messagingSenderId": "your-sender-id",
  "appId": "your-app-id",
  "firestoreDatabaseId": "(default)"
}
```

### 4. Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

### 5. Start the Development Server

```bash
# Development mode with hot reload
npm run dev

# Or with Bun
bun run dev
```

The server will start at http://localhost:3000

### 6. Production Build

```bash
# Build both frontend and backend
npm run build

# Start production server
npm run start
```

## API Endpoints

The server exposes REST API endpoints for client communication:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check |
| `/api/v1/client/init` | POST | Client initialization with app ID/secret |
| `/api/v1/client/register` | POST | Register user with license key |
| `/api/v1/client/login` | POST | Authenticate user and create session |
| `/api/v1/client/license` | POST | Validate license key directly |
| `/api/v1/client/session-heartbeat` | POST | Update session heartbeat (remote kill switch) |
| `/api/v1/sdk/csharp-files` | GET | Retrieve C# SDK files |

## C# SDK Usage

Include the SDK in your Windows Forms application:

```csharp
using MalikAuth;

// Initialize client
var malikAuth = new MalikAuthClient(
    appId: "YOUR_APP_ID",
    ownerId: "YOUR_OWNER_ID",
    appSecret: "YOUR_APP_SECRET",
    version: "1.0.0",
    webhookUrl: "your_discord_webhook"
);

// Initialize connection
await malikAuth.InitializeAsync();

// Register user with license key
var result = await malikAuth.RegisterAsync(username, password, licenseKey);

// Login user
var loginResult = await malikAuth.LoginAsync(username, password);

// Start heartbeat (remote kill switch)
_ = Task.Run(() => malikAuth.StartHeartbeatLoopAsync(loginResult.SessionId));
```

## Database Schema

The platform uses Firebase Firestore with the following collections:

### applications
| Field | Type | Description |
|-------|------|-------------|
| appId | string | Unique application identifier |
| name | string | Application name |
| ownerId | string | Developer owner ID |
| appSecret | string | Secret for client authentication |
| version | string | Current app version |
| status | enum | Active/Maintenance/Disabled |
| motd | string | Message of the day |
| encryptionKey | string | AES-256 encryption key |

### licenses
| Field | Type | Description |
|-------|------|-------------|
| key | string | License key (MALIK-XXXX-XXXX-XXXX-XXXX) |
| appId | string | Associated application |
| keyName | string | Human-readable name |
| status | enum | Unused/Active/Expired/Banned |
| expiry | string | Expiration date/time |
| usedBy | string | Username who redeemed it |
| hwid | string | Hardware fingerprint of redeemer |

### users
| Field | Type | Description |
|-------|------|-------------|
| username | string | Unique username |
| password | string | Hashed password |
| appId | string | Associated application |
| hwid | string | Hardware fingerprint |
| licenseKey | string | Redeemed license key |
| status | enum | Active/Expired/Banned |
| expiry | string | Account expiration |
| ipAddress | string | Last known IP |
| lastSeen | timestamp | Last activity |

### sessions
| Field | Type | Description |
|-------|------|-------------|
| sessionId | string | Unique session identifier |
| appId | string | Associated application |
| username | string | User owning the session |
| hwid | string | Hardware fingerprint |
| ipAddress | string | Client IP address |
| status | enum | Active/Terminated |
| loginTime | timestamp | Session start |
| lastHeartbeat | timestamp | Last ping received |

### remote_variables
| Field | Type | Description |
|-------|------|-------------|
| key | string | Variable name |
| value | string | Encrypted value |
| appId | string | Associated application |
| minRole | string | Minimum role required |
| updatedAt | timestamp | Last update time |

## Security Considerations

1. **Firestore Security Rules** - Always deploy `firestore.rules` to prevent unauthorized access
2. **App Secret Rotation** - Rotate secrets periodically via the dashboard
3. **HWID Spoofing** - The SDK uses multiple system identifiers for robust fingerprinting
4. **Memory Safety** - License keys and sensitive strings are blurred in the UI by default
5. **Audit Trail** - All admin actions are logged for forensic analysis

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Troubleshooting

### Firebase Connection Issues
- Verify `firebase-applet-config.json` has correct credentials
- Ensure Firestore is enabled in your Firebase console
- Check that security rules allow read/write from your IP

### Build Errors
- Clear `node_modules` and reinstall: `rm -rf node_modules && bun install`
- Ensure Node.js version is 18 or higher
- Check TypeScript errors with `npm run lint`

### SDK Compilation Issues
- Target .NET Framework 4.7.2 or higher
- Add `System.Net.Http` reference if missing
- Enable unsafe code if using advanced memory features

## License

This project is proprietary software. All rights reserved.

## Support

For issues, feature requests, or commercial licensing inquiries:
- Open an issue on GitHub
- Contact: support@malikauth.com
- Documentation: https://malikauth.com/docs

---

**Built with ❤️ for developers who take security seriously.**
