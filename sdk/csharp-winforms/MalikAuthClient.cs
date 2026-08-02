using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;

namespace MalikAuth
{
    public class MalikAuthClient
    {
        private readonly string _appId;
        private readonly string _ownerId;
        private readonly string _appSecret;
        private readonly string _version;
        private readonly string _webhookUrl;
        private readonly HttpClient _http;

        /// <summary>
        /// Base URL for MalikAuth Backend Server API (e.g. "https://malikauth.ai.studio" or "http://localhost:3000")
        /// </summary>
        public string ServerUrl { get; set; } = "https://malikauth.ai.studio";

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
            _http = new HttpClient();
            _http.Timeout = TimeSpan.FromSeconds(15);
            UserHwid = GetHardwareFingerprint();
        }

        /// <summary>
        /// Initializes the MalikAuth Security Engine with backend server verification.
        /// </summary>
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

                if (response.IsSuccessStatusCode)
                {
                    bool isSuccess = ExtractJsonBool(responseString, "success");
                    await SendDiscordWebhookAsync("APP_INIT", "MalikAuth Client Initialized for App ID: " + _appId + " | Machine HWID: " + UserHwid);
                    return isSuccess;
                }
                else
                {
                    // Fail-safe mode for server responses
                    await SendDiscordWebhookAsync("APP_INIT", "MalikAuth Client Initialized (Fail-safe mode) for App ID: " + _appId + " | Machine HWID: " + UserHwid);
                    return true;
                }
            }
            catch
            {
                // Fallback for offline mode or network initialization
                IsInitialized = true;
                await SendDiscordWebhookAsync("APP_INIT", "MalikAuth Client Initialized (Offline mode) for App ID: " + _appId + " | Machine HWID: " + UserHwid);
                return true;
            }
        }

        /// <summary>
        /// Registers a new account with Username, Password, and a valid License Key.
        /// Connects directly to MalikAuth Server & Firestore Database to validate key and record user creation.
        /// </summary>
        public async Task<AuthResult> RegisterAsync(string username, string password, string licenseKey)
        {
            if (string.IsNullOrWhiteSpace(username) || string.IsNullOrWhiteSpace(password) || string.IsNullOrWhiteSpace(licenseKey))
            {
                return new AuthResult { Success = false, Message = "Username, Password, and License Key are all required!" };
            }

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
                    CurrentRole = !string.IsNullOrEmpty(role) ? role : "Premium Member";
                    ActiveSessionId = !string.IsNullOrEmpty(sessionId) ? sessionId : ("SESS-" + Guid.NewGuid().ToString("N").Substring(0, 10).ToUpper());

                    await SendDiscordWebhookAsync("USER_REGISTER", "User '" + CurrentUsername + "' registered with key '" + licenseKey + "' on HWID: " + UserHwid);

                    return new AuthResult
                    {
                        Success = true,
                        Username = CurrentUsername,
                        Role = CurrentRole,
                        SessionId = ActiveSessionId,
                        Message = !string.IsNullOrEmpty(message) ? message : "Account registered successfully!"
                    };
                }
                else
                {
                    return new AuthResult
                    {
                        Success = false,
                        Message = !string.IsNullOrEmpty(message) ? message : "Registration failed on server."
                    };
                }
            }
            catch (Exception ex)
            {
                return new AuthResult
                {
                    Success = false,
                    Message = "Unable to connect to MalikAuth Server (" + ServerUrl + "): " + ex.Message
                };
            }
        }

        /// <summary>
        /// Authenticates an existing user with Username and Password against MalikAuth Backend.
        /// </summary>
        public async Task<AuthResult> LoginAsync(string username, string password)
        {
            if (string.IsNullOrWhiteSpace(username) || string.IsNullOrWhiteSpace(password))
            {
                return new AuthResult { Success = false, Message = "Please fill in both Username and Password." };
            }

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

                    await SendDiscordWebhookAsync("USER_LOGIN", "User '" + CurrentUsername + "' logged in successfully on HWID: " + UserHwid);

                    return new AuthResult
                    {
                        Success = true,
                        Username = CurrentUsername,
                        Role = CurrentRole,
                        SessionId = ActiveSessionId,
                        Message = !string.IsNullOrEmpty(message) ? message : "Login Successful!"
                    };
                }
                else
                {
                    return new AuthResult
                    {
                        Success = false,
                        Message = !string.IsNullOrEmpty(message) ? message : "Invalid credentials or access denied."
                    };
                }
            }
            catch (Exception ex)
            {
                return new AuthResult
                {
                    Success = false,
                    Message = "Unable to connect to MalikAuth Server (" + ServerUrl + "): " + ex.Message
                };
            }
        }

        /// <summary>
        /// Validates a direct License Key.
        /// </summary>
        public async Task<AuthResult> ValidateLicenseAsync(string licenseKey)
        {
            if (string.IsNullOrWhiteSpace(licenseKey))
            {
                return new AuthResult { Success = false, Message = "License key cannot be empty." };
            }

            try
            {
                string jsonPayload = "{\"appId\":\"" + EscapeJson(_appId) + 
                                     "\",\"licenseKey\":\"" + EscapeJson(licenseKey.Trim()) + 
                                     "\",\"hwid\":\"" + EscapeJson(UserHwid) + "\"}";

                var content = new StringContent(jsonPayload, Encoding.UTF8, "application/json");
                string requestUrl = ServerUrl.TrimEnd('/') + "/api/v1/client/license";

                HttpResponseMessage response = await _http.PostAsync(requestUrl, content);
                string responseString = await response.Content.ReadAsStringAsync();

                bool success = ExtractJsonBool(responseString, "success");
                string message = ExtractJsonString(responseString, "message");

                if (success)
                {
                    CurrentUsername = "User_" + UserHwid.Substring(0, 6);
                    CurrentRole = "Key Activated";
                    ActiveSessionId = "SESS-" + Guid.NewGuid().ToString("N").Substring(0, 10).ToUpper();

                    await SendDiscordWebhookAsync("KEY_ACTIVATE", "License '" + licenseKey + "' activated on HWID: " + UserHwid);

                    return new AuthResult
                    {
                        Success = true,
                        Username = CurrentUsername,
                        Role = CurrentRole,
                        SessionId = ActiveSessionId,
                        Message = !string.IsNullOrEmpty(message) ? message : "License key activated successfully!"
                    };
                }
                else
                {
                    return new AuthResult
                    {
                        Success = false,
                        Message = !string.IsNullOrEmpty(message) ? message : "License key validation failed."
                    };
                }
            }
            catch (Exception ex)
            {
                return new AuthResult
                {
                    Success = false,
                    Message = "Unable to connect to MalikAuth Server: " + ex.Message
                };
            }
        }

        /// <summary>
        /// Remote Kill Switch Listener Loop: Sends heartbeat every 5 seconds.
        /// If Admin terminates session or bans user, client process terminates immediately!
        /// </summary>
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

                    if (!isActive || status == "Terminated" || status == "Banned" || status == "NotFound")
                    {
                        System.Diagnostics.Process.GetCurrentProcess().Kill();
                        Environment.Exit(0);
                    }
                }
                catch
                {
                    // Fail-safe loop continuation
                }
            }
        }

        /// <summary>
        /// Sends automated audit events to Discord Webhook without external JSON library dependency.
        /// </summary>
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

        /// <summary>
        /// Generates unique hardware fingerprint for PC locking compatible with C# 7.3 and older.
        /// </summary>
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

        // ============================================
        // PURE C# 7.3 JSON PARSING HELPERS
        // ============================================
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
}
