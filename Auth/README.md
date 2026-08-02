# MalikAuth C# WinForms Example

This is a complete C# Windows Forms application demonstrating the MalikAuth SDK integration.

## Prerequisites

- Visual Studio 2019 or 2022 (Community Edition is fine)
- .NET Framework 4.7.2 or higher
- A MalikAuth account with an application created

## Setup Instructions

### 1. Open the Project

1. Open Visual Studio
2. File → Open → Project/Solution
3. Navigate to the `Auth` folder and open `Auth.slnx`

### 2. Configure Your Credentials

Open `Form1.cs` and replace the placeholder values with your actual MalikAuth credentials:

```csharp
public static MalikAuthClient malikAuth = new MalikAuthClient(
    appId: "YOUR_APP_ID",        // From MalikAuth dashboard
    ownerId: "YOUR_OWNER_ID",    // From MalikAuth dashboard
    appSecret: "YOUR_APP_SECRET", // From MalikAuth dashboard
    version: "1.0.0",
    webhookUrl: ""                // Optional Discord webhook URL
);
```

### 3. Server URL

The SDK defaults to `https://malikauth.ai.studio`. For local development:

```csharp
malikAuth.ServerUrl = "http://localhost:3000";
```

### 4. Build and Run

1. Press `F5` or click the Run button
2. The login form will appear
3. Use the Register button to create an account with a valid license key
4. Login with your credentials

## Project Structure

| File | Description |
|------|-------------|
| `MalikAuthClient.cs` | Core SDK - all server communication and security logic |
| `Form1.cs` | Login form |
| `Register.cs` | Registration form |
| `Main.cs` | Dashboard form with heartbeat monitoring |
| `Program.cs` | Application entry point |

## Features Demonstrated

- ✅ **App Initialization** - Secure handshake with MalikAuth server
- ✅ **User Registration** - Create accounts with license keys
- ✅ **User Login** - Authenticate existing users
- ✅ **License Validation** - Validate standalone license keys
- ✅ **Heartbeat Loop** - Keep session alive, auto-kill on termination
- ✅ **HWID Locking** - Hardware-based device identification
- ✅ **Session Management** - Track active sessions
- ✅ **Discord Webhooks** - Audit logging (optional)

## Troubleshooting

### "Cannot find MalikAuthClient"
Make sure all files are in the same project and the namespace is `MalikAuth`.

### "Connection refused"
Check that the server URL is correct. For local development, ensure the server is running.

### "App initialization failed"
Verify your app credentials in `Form1.cs` are correct.

### "License key not found"
Generate a license key from the MalikAuth dashboard first.

## Notes

- The SDK uses `System.Net.Http` for API calls
- Hardware fingerprint uses `Environment.MachineName + ProcessorCount + OSVersion`
- Session heartbeat runs every 5 seconds in the background
- The app auto-exits if the session is terminated, banned, or expired

## Support

For issues, check the MalikAuth dashboard at https://malikauth.ai.studio
