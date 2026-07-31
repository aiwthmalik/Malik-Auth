# MalikAuth C# Example - Official C# Security & Licensing SDKs

Welcome to the **MalikAuth C# Example** repository! This directory contains complete, drop-in C# SDK client implementations and working reference integrations for all major C# application types.

## Supported C# Application Types

1. **[C# Console Application](./csharp-console)** - Lightweight CLI and background loader applications.
2. **[C# Windows Forms (WinForms)](./csharp-winforms)** - Desktop UI tools and game enhancement clients.
3. **[C# Windows Presentation Foundation (WPF)](./csharp-wpf)** - Modern enterprise desktop applications.

---

## 🚀 Quick Initialization Guide (Universal)

All C# examples use the `MalikAuthClient` class to handle secure API communication, SHA-256 Hardware ID (HWID) binding, license key verification, heartbeat sessions, and AES-256 GCM remote variable decryption.

### 1. Initialize the Security Client
```csharp
using MalikAuth;

// Initialize the client with your Application credentials from the MalikAuth Developer Console
var malikAuth = new MalikAuthClient(
    appId: "YOUR_APP_ID",
    ownerId: "YOUR_OWNER_ID",
    appSecret: "YOUR_APP_SECRET",
    version: "2.5.0",
    webhookUrl: "YOUR_DISCORD_WEBHOOK_URL"
);

bool initSuccess = await malikAuth.InitializeAsync();
if (!initSuccess)
{
    Console.WriteLine("MalikAuth Security Engine initialization failed!");
    Environment.Exit(1);
}
```

### 2. Validate a User License Key
```csharp
var authResult = await malikAuth.ValidateLicenseAsync("MALIK-XXXX-XXXX-XXXX");

if (authResult.Success)
{
    Console.WriteLine($"Welcome, {authResult.Username}! [Role: {authResult.Role}]");
    
    // Start automatic session heartbeat (every 60 seconds)
    malikAuth.StartHeartbeat();
}
else
{
    Console.WriteLine($"Authentication Error: {authResult.Message}");
}
```

### 3. Fetch Remote Synchronized Variables
```csharp
// Fetch remote variables pushed live from your dashboard without recompiling your app
string downloadUrl = malikAuth.GetRemoteVariable("DOWNLOAD_URL");
string secretOffset = malikAuth.GetEncryptedVariable("OFFSET_LOCAL_PLAYER");

Console.WriteLine($"Live Download URL: {downloadUrl}");
```

---

## 📦 Publishing to GitHub

To publish your C# application with MalikAuth integrated:
1. Copy the `MalikAuthClient.cs` file from any of the subdirectories into your Visual Studio / C# project.
2. Install `System.Management` via NuGet if building for .NET Core / .NET 6+ to enable hardware fingerprinting.
3. Keep your `appSecret` secure or obfuscate your executable before distribution.
