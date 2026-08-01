import React, { useState } from 'react';
import {
  ShieldCheck,
  Copy,
  Check,
  Radio,
  Users,
  Key,
  FileText,
  Save,
  Lock,
  Code,
  Terminal,
  X,
  Layout,
  Shield
} from 'lucide-react';
import { MalikApp, MalikLicense, MalikUser, MalikSession, MalikActivityLog } from '../types';
import { updateApp, logActivity } from '../lib/malikAuthService';
import { isExpired } from '../lib/dateUtils';

interface DashboardOverviewProps {
  app: MalikApp;
  licenses: MalikLicense[];
  users: MalikUser[];
  sessions: MalikSession[];
  logs: MalikActivityLog[];
  onRefresh: () => void;
  onNavigateToTab: (tab: string) => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  app,
  licenses,
  users,
  sessions,
  logs,
  onRefresh,
  onNavigateToTab,
}) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showInitModal, setShowInitModal] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [motd, setMotd] = useState(app.motd || '');
  const [version, setVersion] = useState(app.version || '1.0.0');
  const [status, setStatus] = useState(app.status || 'Active');
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const [activeSdkTab, setActiveSdkTab] = useState<'winforms' | 'sdk' | 'console'>('winforms');

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const getWinFormsSnippet = () => `using System;
using System.Drawing;
using System.Threading.Tasks;
using System.Windows.Forms;
using MalikAuth;

namespace MyWinFormsApp
{
    public partial class LoginForm : Form
    {
        // 1. Initialize Pre-configured MalikAuth Client SDK
        public static MalikAuthClient malikAuth = new MalikAuthClient(
            appId: "${app.appId}",
            ownerId: "${app.ownerId || 'owner_78625'}",
            appSecret: "${(app.appSecret || '').replace(/^(secret_|sec_|scret_|secret)/i, '')}",
            version: "${app.version || '1.0.0'}",
            webhookUrl: "${app.discordWebhook || ''}"
        );

        private TextBox txtUsername;
        private TextBox txtPassword;
        private TextBox txtLicenseKey;
        private Button btnLogin;
        private Button btnRegister;
        private Label lblStatus;

        public LoginForm()
        {
            InitializeComponent();
            this.Text = "MalikAuth Security Portal - ${app.name}";
            this.Size = new Size(440, 520);
            this.StartPosition = FormStartPosition.CenterScreen;
            this.FormBorderStyle = FormBorderStyle.FixedSingle;
            this.MaximizeBox = false;
            this.BackColor = Color.FromArgb(24, 30, 42);

            this.Load += async (s, e) => {
                lblStatus.Text = "Connecting to MalikAuth Security Server...";
                bool ok = await malikAuth.InitializeAsync();
                if (!ok) {
                    MessageBox.Show("SDK Initialization failed! Application disabled or version outdated.", "Security Alert", MessageBoxButtons.OK, MessageBoxIcon.Error);
                    Application.Exit();
                }
                lblStatus.Text = "Status: Connected • Secured by MalikAuth";
                lblStatus.ForeColor = Color.ForestGreen;
            };
        }

        private async void btnLogin_Click(object sender, EventArgs e)
        {
            btnLogin.Enabled = false;
            lblStatus.Text = "Authenticating user credentials...";

            // 2. Validate User Login & Check Expiry / Ban Status
            AuthResult result = await malikAuth.LoginAsync(txtUsername.Text, txtPassword.Text);

            if (result.Success)
            {
                lblStatus.Text = "Access Granted! Welcome " + result.Username;
                MessageBox.Show($"Welcome {result.Username}!\nRole: {result.Role}\nSession ID: {result.SessionId}", "Login Success", MessageBoxButtons.OK, MessageBoxIcon.Information);

                // 3. Start Live Session Heartbeat & Remote Kill Switch (Background Loop)
                _ = Task.Run(() => malikAuth.StartHeartbeatLoopAsync(result.SessionId));

                this.Hide();
                // Form mainForm = new MainForm(result);
                // mainForm.Show();
            }
            else
            {
                lblStatus.Text = "Login Failed: " + result.Message;
                lblStatus.ForeColor = Color.Crimson;
                MessageBox.Show(result.Message, "Access Denied", MessageBoxButtons.OK, MessageBoxIcon.Stop);
                btnLogin.Enabled = true;
            }
        }

        private async void btnRegister_Click(object sender, EventArgs e)
        {
            btnRegister.Enabled = false;
            lblStatus.Text = "Validating license key & registering...";

            // Register User Account & Bind Hardware ID
            AuthResult result = await malikAuth.RegisterAsync(txtUsername.Text, txtPassword.Text, txtLicenseKey.Text);

            if (result.Success)
            {
                lblStatus.Text = "License Key Activated Successfully!";
                MessageBox.Show("Registration Successful! You can now log in.", "Success", MessageBoxButtons.OK, MessageBoxIcon.Information);
            }
            else
            {
                lblStatus.Text = "Registration Error: " + result.Message;
                lblStatus.ForeColor = Color.Crimson;
                MessageBox.Show(result.Message, "Registration Failed", MessageBoxButtons.OK, MessageBoxIcon.Warning);
            }
            btnRegister.Enabled = true;
        }
    }
}`;

  const getFullSdkSnippet = () => `using System;
using System.Collections;
using System.Collections.Generic;
using System.Diagnostics;
using System.Net.Http;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;

namespace MalikAuth
{
    /// <summary>
    /// MalikAuth C# Production SDK Client
    /// Handles HWID Fingerprinting, Expiry Validation, Discord Webhook Audit, and Live Session Remote Kill Switch.
    /// </summary>
    public class MalikAuthClient
    {
        private readonly string _appId;
        private readonly string _ownerId;
        private readonly string _appSecret;
        private readonly string _version;
        private readonly string _webhookUrl;
        private readonly HttpClient _http;

        public string ServerUrl { get; set; } = "${window.location.origin}";
        public bool IsInitialized { get; private set; }
        public string CurrentUsername { get; private set; }
        public string CurrentRole { get; private set; }
        public string ActiveSessionId { get; private set; }
        public string UserHwid { get; private set; }

        public MalikAuthClient(string appId, string ownerId, string appSecret, string version = "1.0.0", string webhookUrl = "")
        {
            _appId = appId;
            _ownerId = ownerId;
            _appSecret = appSecret;
            _version = version;
            _webhookUrl = webhookUrl;
            _http = new HttpClient { Timeout = TimeSpan.FromSeconds(15) };
            UserHwid = GetHardwareFingerprint();
        }

        public async Task<bool> InitializeAsync()
        {
            try
            {
                string jsonPayload = "{\"appId\":\"" + EscapeJson(_appId) +
                                     "\",\"ownerId\":\"" + EscapeJson(_ownerId) +
                                     "\",\"appSecret\":\"" + EscapeJson(_appSecret) +
                                     "\",\"version\":\"" + EscapeJson(_version) +
                                     "\",\"hwid\":\"" + EscapeJson(UserHwid) + "\"}";

                var content = new StringContent(jsonPayload, Encoding.UTF8, "application/json");
                string requestUrl = ServerUrl.TrimEnd('/') + "/api/v1/client/init";

                HttpResponseMessage response = await _http.PostAsync(requestUrl, content);
                string responseString = await response.Content.ReadAsStringAsync();

                IsInitialized = true;
                bool isSuccess = ExtractJsonBool(responseString, "success");
                await SendDiscordWebhookAsync("APP_INIT", "MalikAuth Client Initialized for App ID: " + _appId + " | Machine HWID: " + UserHwid);
                return isSuccess;
            }
            catch
            {
                IsInitialized = true;
                await SendDiscordWebhookAsync("APP_INIT", "MalikAuth Client Initialized (Offline mode) for App ID: " + _appId + " | Machine HWID: " + UserHwid);
                return true;
            }
        }

        public async Task<AuthResult> RegisterAsync(string username, string password, string licenseKey)
        {
            if (string.IsNullOrWhiteSpace(username) || string.IsNullOrWhiteSpace(password) || string.IsNullOrWhiteSpace(licenseKey))
                return new AuthResult { Success = false, Message = "Username, Password, and License Key are required!" };

            try
            {
                string jsonPayload = "{\"appId\":\"" + EscapeJson(_appId) +
                                     "\",\"ownerId\":\"" + EscapeJson(_ownerId) +
                                     "\",\"appSecret\":\"" + EscapeJson(_appSecret) +
                                     "\",\"username\":\"" + EscapeJson(username.Trim()) +
                                     "\",\"password\":\"" + EscapeJson(password.Trim()) +
                                     "\",\"licenseKey\":\"" + EscapeJson(licenseKey.Trim()) +
                                     "\",\"hwid\":\"" + EscapeJson(UserHwid) + "\"}";

                var content = new StringContent(jsonPayload, Encoding.UTF8, "application/json");
                string requestUrl = ServerUrl.TrimEnd('/') + "/api/v1/client/register";

                HttpResponseMessage response = await _http.PostAsync(requestUrl, content);
                string responseString = await response.Content.ReadAsStringAsync();

                bool success = ExtractJsonBool(responseString, "success");
                string message = ExtractJsonString(responseString, "message");
                string respUsername = ExtractJsonString(responseString, "username");
                string role = ExtractJsonString(responseString, "role");
                string sessionId = ExtractJsonString(responseString, "sessionId");

                if (success)
                {
                    CurrentUsername = !string.IsNullOrEmpty(respUsername) ? respUsername : username;
                    CurrentRole = !string.IsNullOrEmpty(role) ? role : "User";
                    ActiveSessionId = !string.IsNullOrEmpty(sessionId) ? sessionId : ("SESS-" + Guid.NewGuid().ToString("N").Substring(0, 10).ToUpper());

                    await SendDiscordWebhookAsync("USER_REGISTER", "User '" + CurrentUsername + "' registered with key '" + licenseKey + "' on HWID: " + UserHwid);

                    return new AuthResult { Success = true, Username = CurrentUsername, Role = CurrentRole, SessionId = ActiveSessionId, Message = !string.IsNullOrEmpty(message) ? message : "Registration successful!" };
                }
                return new AuthResult { Success = false, Message = !string.IsNullOrEmpty(message) ? message : "Registration failed." };
            }
            catch (Exception ex)
            {
                return new AuthResult { Success = false, Message = "Unable to connect to MalikAuth Server: " + ex.Message };
            }
        }

        public async Task<AuthResult> LoginAsync(string username, string password)
        {
            if (string.IsNullOrWhiteSpace(username) || string.IsNullOrWhiteSpace(password))
                return new AuthResult { Success = false, Message = "Username and Password are required." };

            try
            {
                string jsonPayload = "{\"appId\":\"" + EscapeJson(_appId) +
                                     "\",\"ownerId\":\"" + EscapeJson(_ownerId) +
                                     "\",\"appSecret\":\"" + EscapeJson(_appSecret) +
                                     "\",\"username\":\"" + EscapeJson(username.Trim()) +
                                     "\",\"password\":\"" + EscapeJson(password.Trim()) +
                                     "\",\"hwid\":\"" + EscapeJson(UserHwid) + "\"}";

                var content = new StringContent(jsonPayload, Encoding.UTF8, "application/json");
                string requestUrl = ServerUrl.TrimEnd('/') + "/api/v1/client/login";

                HttpResponseMessage response = await _http.PostAsync(requestUrl, content);
                string responseString = await response.Content.ReadAsStringAsync();

                bool success = ExtractJsonBool(responseString, "success");
                string message = ExtractJsonString(responseString, "message");
                string respUsername = ExtractJsonString(responseString, "username");
                string role = ExtractJsonString(responseString, "role");
                string sessionId = ExtractJsonString(responseString, "sessionId");

                if (success)
                {
                    CurrentUsername = !string.IsNullOrEmpty(respUsername) ? respUsername : username;
                    CurrentRole = !string.IsNullOrEmpty(role) ? role : "Active User";
                    ActiveSessionId = !string.IsNullOrEmpty(sessionId) ? sessionId : ("SESS-" + Guid.NewGuid().ToString("N").Substring(0, 10).ToUpper());

                    await SendDiscordWebhookAsync("USER_LOGIN", "User '" + CurrentUsername + "' logged in on HWID: " + UserHwid);

                    return new AuthResult { Success = true, Username = CurrentUsername, Role = CurrentRole, SessionId = ActiveSessionId, Message = !string.IsNullOrEmpty(message) ? message : "Login Successful!" };
                }

                return new AuthResult { Success = false, Message = !string.IsNullOrEmpty(message) ? message : "Invalid credentials or account expired/banned." };
            }
            catch (Exception ex)
            {
                return new AuthResult { Success = false, Message = "Unable to connect to MalikAuth Server: " + ex.Message };
            }
        }

        public async Task StartHeartbeatLoopAsync(string sessionId)
        {
            if (string.IsNullOrEmpty(sessionId)) return;

            while (true)
            {
                try
                {
                    await Task.Delay(5000);

                    string jsonPayload = "{\"appId\":\"" + EscapeJson(_appId) +
                                         "\",\"sessionId\":\"" + EscapeJson(sessionId) +
                                         "\",\"hwid\":\"" + EscapeJson(UserHwid) + "\"}";

                    var content = new StringContent(jsonPayload, Encoding.UTF8, "application/json");
                    string requestUrl = ServerUrl.TrimEnd('/') + "/api/v1/client/session-heartbeat";

                    HttpResponseMessage response = await _http.PostAsync(requestUrl, content);
                    string responseString = await response.Content.ReadAsStringAsync();

                    bool isActive = ExtractJsonBool(responseString, "active");
                    string status = ExtractJsonString(responseString, "status");

                    if (!isActive || status == "Terminated" || status == "Deleted" || status == "NotFound")
                    {
                        Console.WriteLine("\n[!] SECURITY ALERT: Session killed remotely by MalikAuth Admin!");
                        Process.GetCurrentProcess().Kill();
                        Environment.Exit(0);
                    }
                }
                catch { }
            }
        }

        private async Task SendDiscordWebhookAsync(string action, string details)
        {
            if (string.IsNullOrEmpty(_webhookUrl) || !_webhookUrl.StartsWith("http")) return;
            try
            {
                string safeDetails = details.Replace("\"", "\\\"").Replace("\n", " ");
                string json = "{\"username\":\"MalikAuth Security Engine\",\"embeds\":[{\"title\":\"🔒 MalikAuth Audit Event [" + _appId + "]\",\"description\":\"**Action:** " + action + "\\n**Details:** " + safeDetails + "\",\"color\":5814783,\"timestamp\":\"" + DateTime.UtcNow.ToString("O") + "\"}]}";
                var content = new StringContent(json, Encoding.UTF8, "application/json");
                await _http.PostAsync(_webhookUrl, content);
            }
            catch { }
        }

        public static string GetHardwareFingerprint()
        {
            try
            {
                string rawId = Environment.MachineName + Environment.ProcessorCount + Environment.OSVersion;
                using (SHA256 sha = SHA256.Create())
                {
                    byte[] hash = sha.ComputeHash(Encoding.UTF8.GetBytes(rawId));
                    return BitConverter.ToString(hash).Replace("-", "").Substring(0, 16);
                }
            }
            catch
            {
                return "HWID-UNKNOWN-0000";
            }
        }

        private static string EscapeJson(string str)
        {
            if (string.IsNullOrEmpty(str)) return "";
            return str.Replace("\\", "\\\\").Replace("\"", "\\\"").Replace("\n", "\\n").Replace("\r", "\\r");
        }

        private static bool ExtractJsonBool(string json, string key)
        {
            if (string.IsNullOrEmpty(json)) return false;
            int idx = json.IndexOf("\"" + key + "\"");
            if (idx < 0) return false;
            int colon = json.IndexOf(':', idx);
            if (colon < 0) return false;
            string sub = json.Substring(colon + 1).TrimStart();
            return sub.StartsWith("true", StringComparison.OrdinalIgnoreCase);
        }

        private static string ExtractJsonString(string json, string key)
        {
            if (string.IsNullOrEmpty(json)) return "";
            int idx = json.IndexOf("\"" + key + "\"");
            if (idx < 0) return "";
            int colon = json.IndexOf(':', idx);
            if (colon < 0) return "";
            int quote1 = json.IndexOf('"', colon + 1);
            if (quote1 < 0) return "";
            int quote2 = json.IndexOf('"', quote1 + 1);
            if (quote2 < 0) return "";
            return json.Substring(quote1 + 1, quote2 - quote1 - 1);
        }
    }

    public class AuthResult
    {
        public bool Success { get; set; }
        public string Username { get; set; }
        public string Role { get; set; }
        public string SessionId { get; set; }
        public string Message { get; set; }
    }
}`;

  const getConsoleSnippet = () => `using System;
using System.Threading.Tasks;
using MalikAuth;

namespace MalikAuthTestConsole
{
    class Program
    {
        public static MalikAuthClient malikAuth = new MalikAuthClient(
            appId: "${app.appId}",
            ownerId: "${app.ownerId || 'owner_78625'}",
            appSecret: "${(app.appSecret || '').replace(/^(secret_|sec_|scret_|secret)/i, '')}",
            version: "${app.version || '1.0.0'}",
            webhookUrl: "${app.discordWebhook || ''}"
        );

        static async Task Main(string[] args)
        {
            Console.WriteLine("=============================================");
            Console.WriteLine("     MalikAuth Security Engine Test         ");
            Console.WriteLine("=============================================");

            bool initOk = await malikAuth.InitializeAsync();
            if (!initOk)
            {
                Console.WriteLine("[-] Initialization failed! Version mismatch or App disabled.");
                return;
            }

            Console.WriteLine("\nSelect Option: [1] Login  [2] Register License Key");
            string choice = Console.ReadLine();

            AuthResult result;
            if (choice == "2")
            {
                Console.Write("Username: ");
                string user = Console.ReadLine();
                Console.Write("Password: ");
                string pass = Console.ReadLine();
                Console.Write("License Key: ");
                string key = Console.ReadLine();
                result = await malikAuth.RegisterAsync(user, pass, key);
            }
            else
            {
                Console.Write("Username: ");
                string user = Console.ReadLine();
                Console.Write("Password: ");
                string pass = Console.ReadLine();
                result = await malikAuth.LoginAsync(user, pass);
            }

            if (!result.Success)
            {
                Console.WriteLine($"\n[-] Access Denied: {result.Message}");
                return;
            }

            Console.WriteLine($"\n[+] Welcome {result.Username}! Role: {result.Role}");
            Console.WriteLine($"[+] Active Session ID: {result.SessionId}");

            // Start Remote Kill Switch Loop
            _ = Task.Run(() => malikAuth.StartHeartbeatLoopAsync(result.SessionId));

            Console.WriteLine("\n[+] Press Enter to Exit...");
            Console.ReadLine();
        }
    }
}`;

  const copySelectedSnippet = () => {
    let textToCopy = '';
    if (activeSdkTab === 'winforms') textToCopy = getWinFormsSnippet();
    else if (activeSdkTab === 'sdk') textToCopy = getFullSdkSnippet();
    else textToCopy = getConsoleSnippet();

    navigator.clipboard.writeText(textToCopy);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!app.id && !app.appId) return;
    setSaving(true);
    setSaveMessage(null);
    try {
      if (app.id) {
        await updateApp(app.id, {
          motd,
          version,
          status: status as any,
        });
      }
      await logActivity(
        app.appId,
        'REMOTE_SYNC',
        'Developer',
        'SYS',
        `Updated MOTD/Version to v${version} [Status: ${status}]`
      );
      setSaveMessage('Settings updated successfully & synchronized across connected clients');
      onRefresh();
    } catch (err) {
      console.error('Error saving settings:', err);
      setSaveMessage('Failed to save settings');
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMessage(null), 4000);
    }
  };

  const activeLicenses = licenses.filter(
    (l) => (l.status === 'Active' || l.status === 'Unused') && !isExpired(l.expiry)
  ).length;
  const activeUsersCount = users.filter((u) => u.status === 'Active' && !isExpired(u.expiry)).length;
  const activeSessions = sessions.filter((s) => s.status === 'Active').length;

  return (
    <div className="space-y-6">
      {/* Stats Grid at the Very Top (3 Column Grid) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div
          onClick={() => onNavigateToTab('licenses')}
          className="bg-white border border-slate-200 hover:border-indigo-300 p-5 rounded-2xl shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-500 group-hover:text-slate-700 transition-colors">
              Available & Active Keys
            </span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
              <Key className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-slate-900">{activeLicenses}</span>
            <span className="text-xs text-slate-500 font-medium">
              {licenses.length} Total Keys
            </span>
          </div>
        </div>

        <div
          onClick={() => onNavigateToTab('users')}
          className="bg-white border border-slate-200 hover:border-indigo-300 p-5 rounded-2xl shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-500 group-hover:text-slate-700 transition-colors">
              Authenticated Users
            </span>
            <div className="w-9 h-9 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center border border-violet-100">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-slate-900">{users.length}</span>
            <span className="text-xs text-emerald-600 font-medium flex items-center space-x-1">
              <span>HWID Locked</span>
            </span>
          </div>
        </div>

        <div
          onClick={() => onNavigateToTab('sessions')}
          className="bg-white border border-slate-200 hover:border-indigo-300 p-5 rounded-2xl shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-500 group-hover:text-slate-700 transition-colors">
              Live Connected Sessions
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
              <Radio className="w-4 h-4 animate-pulse" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-slate-900">{activeSessions}</span>
            <span className="text-xs text-slate-500">Heartbeat Live</span>
          </div>
        </div>
      </div>

      {/* API Credentials & Configuration */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Credentials Column */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <Lock className="w-4 h-4 text-indigo-600" />
                <span>MalikAuth / KeyAuth Credentials</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Pass these values into your client application initialization. Hover over blurred fields to reveal.
              </p>
            </div>

            <button
              onClick={() => setShowInitModal(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold rounded-xl text-xs border border-indigo-200 transition-colors"
            >
              <Code className="w-3.5 h-3.5" />
              <span>Show Connecting Init Code</span>
            </button>
          </div>

          <div className="space-y-4">
            {/* APP ID */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                  App ID (10 Chars)
                </label>
                <span className="text-[11px] text-slate-400">Used in client initialization</span>
              </div>
              <input
                type="text"
                readOnly
                value={app.appId}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-mono text-indigo-700 focus:outline-none select-all"
              />
            </div>

            {/* OWNER ID */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Owner ID (5 Chars)
                </label>
                <span className="text-[11px] text-slate-400">Account identifier</span>
              </div>
              <input
                type="text"
                readOnly
                value={app.ownerId || 'N/A'}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-mono text-slate-800 focus:outline-none select-all"
              />
            </div>

            {/* APP SECRET (Blurred by default, clear on hover) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                  App Secret (20 Chars - Hover to Reveal)
                </label>
                <span className="text-[11px] text-slate-400">Cryptographic Signature</span>
              </div>
              <input
                type="text"
                readOnly
                value={(app.appSecret || '').replace(/^(secret_|sec_|scret_|secret)/i, '')}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-mono text-slate-900 focus:outline-none blur-sm hover:blur-none transition-all duration-200 cursor-pointer select-all"
                title="Hover to reveal secret"
              />
            </div>

            {/* AES ENCRYPTION KEY (Blurred by default, clear on hover) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                  AES-256 Remote Sync Encryption Key (Hover to Reveal)
                </label>
                <span className="text-[11px] text-slate-400">Remote variables key</span>
              </div>
              <input
                type="text"
                readOnly
                value={app.encryptionKey}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-mono text-emerald-700 focus:outline-none blur-sm hover:blur-none transition-all duration-200 cursor-pointer select-all"
                title="Hover to reveal encryption key"
              />
            </div>
          </div>
        </div>

        {/* MOTD & Version Settings Column */}
        <form
          onSubmit={handleSaveSettings}
          className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between space-y-4"
        >
          <div>
            <div className="border-b border-slate-200 pb-3 mb-4">
              <h3 className="text-base font-bold text-slate-900">App Config & MOTD</h3>
              <p className="text-xs text-slate-500">
                Live variables pushed to all clients upon launch.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-700 mb-1.5">
                  Client Build Version
                </label>
                <input
                  type="text"
                  value={version}
                  onChange={(e) => setVersion(e.target.value)}
                  placeholder="1.0.0"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-sm text-slate-900 font-mono focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-700 mb-1.5">
                  Application Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:border-indigo-600"
                >
                  <option value="Active">Active (Accepting Logins)</option>
                  <option value="Maintenance">Maintenance (Block New Logins)</option>
                  <option value="Disabled">Disabled (Revoke All Access)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-700 mb-1.5">
                  Message of the Day (MOTD)
                </label>
                <textarea
                  rows={3}
                  value={motd}
                  onChange={(e) => setMotd(e.target.value)}
                  placeholder="Welcome message or server status news for users"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:border-indigo-600"
                />
              </div>
            </div>
          </div>

          <div className="pt-2">
            {saveMessage && (
              <div className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-lg mb-2 text-center font-medium">
                {saveMessage}
              </div>
            )}
            <button
              type="submit"
              disabled={saving}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs flex items-center justify-center space-x-1.5 transition-colors shadow-sm shadow-indigo-600/20"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Syncing...' : 'Save & Push to Clients'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* C# / KeyAuth-style Connecting Code Modal */}
      {showInitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-4xl w-full my-8 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-900 text-white shrink-0">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-600/30 border border-indigo-400/40 flex items-center justify-center">
                  <Code className="w-4 h-4 text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold tracking-wide text-white">
                    C# Windows Forms & Security SDK Integration
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Pre-filled Credentials • App ID: <span className="text-indigo-300 font-mono">{app.appId}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowInitModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <p className="text-xs text-slate-600 leading-relaxed">
                  Select a template below to view or copy ready-to-use C# code for your Windows Forms or Console project:
                </p>

                <div className="flex items-center space-x-1 bg-slate-200 p-1 rounded-xl self-start sm:self-auto shrink-0">
                  <button
                    onClick={() => setActiveSdkTab('winforms')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center space-x-1.5 ${
                      activeSdkTab === 'winforms'
                        ? 'bg-white text-indigo-600 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Layout className="w-3.5 h-3.5" />
                    <span>LoginForm.cs (WinForms)</span>
                  </button>
                  <button
                    onClick={() => setActiveSdkTab('sdk')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center space-x-1.5 ${
                      activeSdkTab === 'sdk'
                        ? 'bg-white text-indigo-600 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Code className="w-3.5 h-3.5" />
                    <span>MalikAuthClient.cs (SDK)</span>
                  </button>
                  <button
                    onClick={() => setActiveSdkTab('console')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center space-x-1.5 ${
                      activeSdkTab === 'console'
                        ? 'bg-white text-indigo-600 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Terminal className="w-3.5 h-3.5" />
                    <span>Program.cs (Console)</span>
                  </button>
                </div>
              </div>

              <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-[#1e1e1e] text-slate-200 font-mono text-xs p-4 shadow-inner">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
                  <span className="text-[11px] text-slate-400 font-sans flex items-center space-x-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
                    <span>
                      {activeSdkTab === 'winforms' && 'Windows Forms UI & Event Logic (LoginForm.cs)'}
                      {activeSdkTab === 'sdk' && 'MalikAuth Security Core Engine (MalikAuthClient.cs)'}
                      {activeSdkTab === 'console' && 'C# Console Application Quick Start (Program.cs)'}
                    </span>
                  </span>
                  <button
                    onClick={copySelectedSnippet}
                    className="px-3 py-1 bg-indigo-600/80 hover:bg-indigo-600 text-white rounded-lg text-xs font-sans flex items-center space-x-1.5 transition-colors z-10 shadow-xs"
                  >
                    {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedCode ? 'Copied File!' : 'Copy File'}</span>
                  </button>
                </div>

                <div className="overflow-x-auto max-w-full">
                  <pre className="whitespace-pre text-xs font-mono leading-relaxed max-h-[360px] overflow-y-auto pr-2" style={{ fontFamily: 'Consolas, Monaco, "Andale Mono", "Ubuntu Mono", monospace' }}>
                    {activeSdkTab === 'winforms' && getWinFormsSnippet()}
                    {activeSdkTab === 'sdk' && getFullSdkSnippet()}
                    {activeSdkTab === 'console' && getConsoleSnippet()}
                  </pre>
                </div>
              </div>

              <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3 flex items-start space-x-2 text-xs text-indigo-900">
                <Shield className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Pro Tip for C# WinForms Developers:</span> Include both <code className="bg-white px-1 py-0.5 rounded border border-indigo-200 font-mono text-indigo-700">MalikAuthClient.cs</code> and <code className="bg-white px-1 py-0.5 rounded border border-indigo-200 font-mono text-indigo-700">LoginForm.cs</code> in your Visual Studio project solution (.csproj). Make sure to add <code className="bg-white px-1 py-0.5 rounded border border-indigo-200 font-mono text-indigo-700">System.Net.Http</code> assembly reference if compiling on older Framework versions.
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 bg-slate-50 shrink-0">
              <span className="text-xs text-slate-500 font-medium">
                Server Endpoint: <code className="bg-slate-200/80 px-1.5 py-0.5 rounded text-slate-700">{window.location.origin}</code>
              </span>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setShowInitModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200/70 rounded-xl transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={copySelectedSnippet}
                  className="flex items-center space-x-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition-all shadow-sm shadow-indigo-600/20"
                >
                  {copiedCode ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-300" />
                      <span>Copied Active Code!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copy Active Code File</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

