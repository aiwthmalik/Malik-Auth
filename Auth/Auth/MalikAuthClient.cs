using System;
using System.Net.Http;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Forms;

namespace MalikAuth
{
    /// <summary>
    /// MalikAuth SDK Client — handles authentication, licensing, heartbeat, and form navigation.
    /// All server communication and security logic lives here. Forms only handle UI.
    /// </summary>
    public class MalikAuthClient
    {
        private readonly string _appId;
        private readonly string _ownerId;
        private readonly string _appSecret;
        private readonly string _version;
        private readonly string _webhookUrl;
        private readonly HttpClient _http;

        /// <summary>Backend server URL (change to "http://localhost:3000" for local dev).</summary>
        public string ServerUrl { get; set; } = "https://malikauth.ai.studio";

        public bool IsInitialized { get; private set; }
        public string CurrentUsername { get; private set; }
        public string CurrentRole { get; private set; }
        public string ActiveSessionId { get; private set; }
        public string CurrentExpiry { get; private set; }
        public string UserHwid { get; private set; }

        /// <summary>
        /// Create a new MalikAuth client instance.
        /// Replace placeholder values with your own from the MalikAuth dashboard.
        /// </summary>
        /// <param name="appId">Your Application ID from MalikAuth dashboard.</param>
        /// <param name="ownerId">Your Owner ID from MalikAuth dashboard.</param>
        /// <param name="appSecret">Your App Secret from MalikAuth dashboard.</param>
        /// <param name="version">App version string for audit logs.</param>
        /// <param name="webhookUrl">Discord webhook URL for audit events (optional).</param>
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

        // ============================================
        // CORE API METHODS
        // ============================================

        /// <summary>Initialize the security engine with the backend server.</summary>
        public async Task<bool> InitializeAsync()
        {
            try
            {
                var payload = new
                {
                    appId = _appId,
                    ownerId = _ownerId,
                    appSecret = _appSecret,
                    version = _version,
                    hwid = UserHwid
                };

                var response = await PostAsync("/api/v1/client/init", payload);
                IsInitialized = true;
                await SendDiscordWebhookAsync("APP_INIT", $"Initialized for App: {_appId} | HWID: {UserHwid}");
                return response.IsSuccess || response.StatusCode == 0;
            }
            catch
            {
                IsInitialized = true;
                return true; // Offline fail-safe
            }
        }

        /// <summary>Register a new user account with username, password, and license key.</summary>
        public async Task<AuthResult> RegisterAsync(string username, string password, string licenseKey)
        {
            if (string.IsNullOrWhiteSpace(username) || string.IsNullOrWhiteSpace(password) || string.IsNullOrWhiteSpace(licenseKey))
                return Fail("Username, Password, and License Key are all required!");

            try
            {
                var payload = new
                {
                    appId = _appId, ownerId = _ownerId, appSecret = _appSecret,
                    username = username.Trim(), password = password.Trim(),
                    licenseKey = licenseKey.Trim(), hwid = UserHwid
                };

                var response = await PostAsync("/api/v1/client/register", payload);

                if (response.IsSuccess)
                {
                    CurrentUsername = response.GetString("username", username.Trim());
                    CurrentRole = response.GetString("role", "Premium Member");
                    ActiveSessionId = response.GetString("sessionId", NewSessionId());
                    CurrentExpiry = response.GetString("expiry", null);
                    await SendDiscordWebhookAsync("USER_REGISTER", $"'{CurrentUsername}' registered with key '{licenseKey}' | HWID: {UserHwid}");
                    return Ok(response.GetString("message", "Account registered successfully!"));
                }

                return Fail(response.GetString("message", "Registration failed on server."));
            }
            catch (Exception ex)
            {
                return Fail($"Unable to connect to server ({ServerUrl}): {ex.Message}");
            }
        }

        /// <summary>Login an existing user with username and password.</summary>
        public async Task<AuthResult> LoginAsync(string username, string password)
        {
            if (string.IsNullOrWhiteSpace(username) || string.IsNullOrWhiteSpace(password))
                return Fail("Please fill in both Username and Password.");

            try
            {
                var payload = new
                {
                    appId = _appId, ownerId = _ownerId, appSecret = _appSecret,
                    username = username.Trim(), password = password.Trim(),
                    hwid = UserHwid
                };

                var response = await PostAsync("/api/v1/client/login", payload);

                if (response.IsSuccess)
                {
                    CurrentUsername = response.GetString("username", username.Trim());
                    CurrentRole = response.GetString("role", "Active User");
                    ActiveSessionId = response.GetString("sessionId", NewSessionId());
                    CurrentExpiry = response.GetString("expiry", null);
                    await SendDiscordWebhookAsync("USER_LOGIN", $"'{CurrentUsername}' logged in | HWID: {UserHwid}");
                    return Ok(response.GetString("message", "Login Successful!"));
                }

                return Fail(response.GetString("message", "Invalid credentials or access denied."));
            }
            catch (Exception ex)
            {
                return Fail($"Unable to connect to server ({ServerUrl}): {ex.Message}");
            }
        }

        /// <summary>Validate a standalone license key (no user account).</summary>
        public async Task<AuthResult> ValidateLicenseAsync(string licenseKey)
        {
            if (string.IsNullOrWhiteSpace(licenseKey))
                return Fail("License key cannot be empty.");

            try
            {
                var payload = new
                {
                    appId = _appId,
                    licenseKey = licenseKey.Trim(),
                    hwid = UserHwid
                };

                var response = await PostAsync("/api/v1/client/license", payload);

                if (response.IsSuccess)
                {
                    CurrentUsername = "User_" + UserHwid.Substring(0, 6);
                    CurrentRole = "Key Activated";
                    ActiveSessionId = NewSessionId();
                    await SendDiscordWebhookAsync("KEY_ACTIVATE", $"License '{licenseKey}' activated | HWID: {UserHwid}");
                    return Ok(response.GetString("message", "License key activated successfully!"));
                }

                return Fail(response.GetString("message", "License key validation failed."));
            }
            catch (Exception ex)
            {
                return Fail($"Unable to connect to server: {ex.Message}");
            }
        }

        /// <summary>
        /// Heartbeat loop — sends periodic keep-alive to server.
        /// Kills the process if session is terminated, banned, expired, or not found.
        /// </summary>
        public async Task StartHeartbeatLoopAsync(string sessionId)
        {
            if (string.IsNullOrEmpty(sessionId)) return;
            while (true)
            {
                try
                {
                    await Task.Delay(5000);
                    var payload = new { appId = _appId, sessionId, hwid = UserHwid };
                    var response = await PostAsync("/api/v1/client/session-heartbeat", payload);

                    if (!response.IsActive || response.Status == "Terminated" || response.Status == "Banned"
                        || response.Status == "NotFound" || response.Status == "Expired")
                    {
                        MessageBox.Show($"Session {response.Status}. The application will now close.",
                            "MalikAuth Security", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                        Application.Exit();
                        Environment.Exit(0);
                    }
                }
                catch { /* Continue heartbeat on network error */ }
            }
        }

        // ============================================
        // FORM NAVIGATION HELPERS — keeps forms short
        // ============================================

        /// <summary>Navigate from current form to the Login form.</summary>
        public void GoToLogin(Form current)
        {
            current.Hide();
            var login = (Form)Activator.CreateInstance(Type.GetType("MalikAuthApp.Login") ?? typeof(Form));
            login.ShowDialog();
            current.Close();
        }

        /// <summary>Navigate from current form to the Register form.</summary>
        public void GoToRegister(Form current)
        {
            current.Hide();
            var reg = (Form)Activator.CreateInstance(Type.GetType("MalikAuthApp.Register") ?? typeof(Form));
            reg.ShowDialog();
            current.Close();
        }

        /// <summary>Navigate from current form to the Main dashboard.</summary>
        public void GoToMain(Form current)
        {
            current.Hide();
            var main = (Form)Activator.CreateInstance(Type.GetType("MalikAuthApp.Main") ?? typeof(Form));
            main.ShowDialog();
            current.Close();
        }

        /// <summary>Show a success message box with user info from an AuthResult.</summary>
        public void ShowSuccess(AuthResult result, string title = "Success")
        {
            string expiry = string.IsNullOrEmpty(result.Expiry) ? "" : $"\nExpiry: {result.Expiry}";
            MessageBox.Show(
                $"Welcome, {result.Username}!\n\nRole: {result.Role}\nSession: {result.SessionId}{expiry}\n\n{result.Message}",
                title, MessageBoxButtons.OK, MessageBoxIcon.Information);
        }

        /// <summary>Show an error message box from an AuthResult.</summary>
        public void ShowError(AuthResult result, string title = "Error")
        {
            MessageBox.Show(result.Message, title, MessageBoxButtons.OK, MessageBoxIcon.Error);
        }

        // ============================================
        // PRIVATE HELPERS
        // ============================================

        private async Task<ServerResponse> PostAsync(string endpoint, object payload)
        {
            string json = ToJson(payload);
            var content = new StringContent(json, Encoding.UTF8, "application/json");
            string url = ServerUrl.TrimEnd('/') + endpoint;
            HttpResponseMessage resp = await _http.PostAsync(url, content);
            string body = await resp.Content.ReadAsStringAsync();
            return new ServerResponse(body);
        }

        private static string NewSessionId() => "SESS-" + Guid.NewGuid().ToString("N").Substring(0, 10).ToUpper();
        private static AuthResult Ok(string msg) => new AuthResult { Success = true, Message = msg };
        private static AuthResult Fail(string msg) => new AuthResult { Success = false, Message = msg };

        private async Task SendDiscordWebhookAsync(string action, string details)
        {
            if (string.IsNullOrEmpty(_webhookUrl) || !_webhookUrl.StartsWith("http")) return;
            try
            {
                string safe = details.Replace("\"", "\\\"").Replace("\n", " ");
                string json = "{\"username\":\"MalikAuth Security Engine\",\"embeds\":[{\"title\":\"🔒 [" + _appId + "] " + action + "\",\"description\":\"" + safe + "\",\"color\":5814783,\"timestamp\":\"" + DateTime.UtcNow.ToString("O") + "\"}]}";
                await _http.PostAsync(_webhookUrl, new StringContent(json, Encoding.UTF8, "application/json"));
            }
            catch { }
        }

        /// <summary>Generate hardware fingerprint from machine info (SHA256, 16 chars).</summary>
        public static string GetHardwareFingerprint()
        {
            try
            {
                string raw = Environment.MachineName + Environment.ProcessorCount + Environment.OSVersion;
                using (var sha = SHA256.Create())
                {
                    byte[] hash = sha.ComputeHash(Encoding.UTF8.GetBytes(raw));
                    return BitConverter.ToString(hash).Replace("-", "").Substring(0, 16);
                }
            }
            catch { return "HWID-UNKNOWN-0000"; }
        }

        /// <summary>Convert an anonymous object to a flat JSON string (no external dependency).</summary>
        private static string ToJson(object obj)
        {
            var sb = new StringBuilder("{");
            var props = obj.GetType().GetProperties();
            for (int i = 0; i < props.Length; i++)
            {
                object val = props[i].GetValue(obj);
                string strVal = val == null ? "null" : "\"" + EscapeJson(val.ToString()) + "\"";
                if (i > 0) sb.Append(",");
                sb.Append("\"").Append(props[i].Name).Append("\":").Append(strVal);
            }
            return sb.Append("}").ToString();
        }

        private static string EscapeJson(string s)
        {
            if (string.IsNullOrEmpty(s)) return "";
            return s.Replace("\\", "\\\\").Replace("\"", "\\\"").Replace("\n", "\\n").Replace("\r", "\\r");
        }

        private static string ExtractJsonString(string json, string key)
        {
            if (string.IsNullOrEmpty(json)) return "";
            int idx = json.IndexOf("\"" + key + "\"");
            if (idx < 0) return "";
            int colon = json.IndexOf(':', idx);
            if (colon < 0) return "";
            int q1 = json.IndexOf('"', colon + 1);
            if (q1 < 0) return "";
            int q2 = json.IndexOf('"', q1 + 1);
            if (q2 < 0) return "";
            return json.Substring(q1 + 1, q2 - q1 - 1);
        }

        private static bool ExtractJsonBool(string json, string key)
        {
            if (string.IsNullOrEmpty(json)) return false;
            int idx = json.IndexOf("\"" + key + "\"");
            if (idx < 0) return false;
            int colon = json.IndexOf(':', idx);
            if (colon < 0) return false;
            return json.Substring(colon + 1).TrimStart().StartsWith("true", StringComparison.OrdinalIgnoreCase);
        }

        // ============================================
        // INTERNAL RESPONSE WRAPPER
        // ============================================

        private class ServerResponse
        {
            private readonly string _body;
            public bool IsSuccess => ExtractJsonBool(_body, "success");
            public bool IsActive => ExtractJsonBool(_body, "active");
            public string Status => ExtractJsonString(_body, "status");
            public int StatusCode { get; }

            public ServerResponse(string body)
            {
                _body = body ?? "";
                // Detect HTTP status from body (fallback)
                if (_body.Contains("\"success\":false") && _body.Contains("does not exist")) StatusCode = 404;
                else if (_body.Contains("\"success\":false") && _body.Contains("expired")) StatusCode = 403;
                else StatusCode = 0;
            }

            public string GetString(string key, string fallback) =>
                ExtractJsonString(_body, key) ?? fallback;
        }
    }

    /// <summary>Result object returned by all auth operations (Login, Register, Validate).</summary>
    public class AuthResult
    {
        public bool Success { get; set; }
        public string Username { get; set; }
        public string Role { get; set; }
        public string SessionId { get; set; }
        public string Expiry { get; set; }
        public string Message { get; set; }
    }
}
