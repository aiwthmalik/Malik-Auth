# MalikAuth C# Windows Forms (WinForms) Integration SDK

Complete C# source code and Form Designer files for integrating **MalikAuth** authentication and licensing into your C# Windows Forms desktop application (.NET 4.5+, .NET Core, .NET 6, .NET 7, .NET 8).

---

## 📁 Included Solution Files

1. **`MalikAuthClient.cs`**: Core SDK client handling HWID generation, user registration, authentication, license key verification, server REST API communication, and Discord webhooks without external library dependencies. Compatible with C# 7.3 and newer.
2. **`Login.cs` & `Login.Designer.cs`**: Form 1 (Login Page) containing:
   - 2 TextBoxes (`txtUsername`, `txtPassword`)
   - 2 Buttons (`btnLogin` for authentication, `btnGoToRegister` for navigation)
3. **`Register.cs` & `Register.Designer.cs`**: Form 2 (Register Page) containing:
   - 3 TextBoxes (`txtUsername`, `txtPassword`, `txtLicenseKey`)
   - 2 Buttons (`btnRegister` to register & navigate directly to `Main.cs`, `btnBackToLogin`)
4. **`Main.cs` & `Main.Designer.cs`**: Main Dashboard displaying authenticated user info (Username, Role, Active Session ID, Hardware HWID) and a Logout button.
5. **`Program.cs`**: Main application entry point starting `Application.Run(new Login());`.

---

## 🌐 Real-Time Database Synchronization (Website API)

When a user registers from the WinForms app:
1. `MalikAuthClient` sends an HTTP REST API request to `https://malikauth.ai.studio/api/v1/client/register`.
2. The server verifies the license key, marks the license key status as **`Used`**, assigns `usedBy = username`, and records the machine's HWID.
3. The user record is created in Firestore under the `users` collection, and an active session is recorded under `sessions`.
4. The website dashboard at `https://malikauth.ai.studio/` updates **in real-time** via Firestore listeners (`onSnapshot`).

---

## 🚀 How to Add to Your Visual Studio C# WinForms Project

1. Open your C# Windows Forms project in Visual Studio.
2. Add all `.cs` and `.Designer.cs` files to your project (`Right-click project -> Add -> Existing Item`).
3. Set `malikAuth.ServerUrl = "https://malikauth.ai.studio";` (or `http://localhost:3000` during local development).
4. Run your application!

