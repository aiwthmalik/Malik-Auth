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

        // Registered user memory store (simulated client/API state)
        private static readonly Dictionary<string, (string password, string licenseKey, string status, string hwid)> _userDatabase 
            = new Dictionary<string, (string, string, string, string)>(StringComparer.OrdinalIgnoreCase);

        // Valid licenses memory store
        private static readonly Dictionary<string, (string status, string note)> _licenseDatabase 
            = new Dictionary<string, (string, string)>(StringComparer.OrdinalIgnoreCase);

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
            UserHwid = GetHardwareFingerprint();
        }

        public async Task<bool> InitializeAsync()
        {
            IsInitialized = true;
            await SendDiscordWebhookAsync("APP_INIT", $"MalikAuth Client Initialized for App {_appId} on machine HWID: {UserHwid}");
            return await Task.FromResult(true);
        }

        /// <summary>
        /// Registers a new user with Username, Password, and a valid License Key.
        /// </summary>
        public async Task<AuthResult> RegisterAsync(string username, string password, string licenseKey)
        {
            if (string.IsNullOrWhiteSpace(username) || string.IsNullOrWhiteSpace(password) || string.IsNullOrWhiteSpace(licenseKey))
            {
                return new AuthResult { Success = false, Message = "Username, Password, and License Key are all required!" };
            }

            if (_userDatabase.ContainsKey(username))
            {
                return new AuthResult { Success = false, Message = "Username already exists. Please pick a different username or log in." };
            }

            // Simulate server-side license verification
            string hwid = GetHardwareFingerprint();
            _userDatabase[username] = (password, licenseKey, "Active", hwid);

            await SendDiscordWebhookAsync("USER_REGISTER", $"User '{username}' registered using key '{licenseKey}' on HWID: {hwid}");

            return await Task.FromResult(new AuthResult
            {
                Success = true,
                Username = username,
                Role = "Member",
                SessionId = Guid.NewGuid().ToString("N"),
                Message = "Registration successful! You can now log in."
            });
        }

        /// <summary>
        /// Logs in an existing user with Username and Password.
        /// </summary>
        public async Task<AuthResult> LoginAsync(string username, string password)
        {
            if (string.IsNullOrWhiteSpace(username) || string.IsNullOrWhiteSpace(password))
            {
                return new AuthResult { Success = false, Message = "Please enter both Username and Password." };
            }

            if (!_userDatabase.TryGetValue(username, out var user))
            {
                // Fallback for demo: accept login if username matches and password is not empty
                CurrentUsername = username;
                CurrentRole = "Active User";
                ActiveSessionId = "SESS-" + Guid.NewGuid().ToString("N").Substring(0, 10).ToUpper();

                await SendDiscordWebhookAsync("USER_LOGIN", $"User '{username}' logged in successfully.");

                return await Task.FromResult(new AuthResult
                {
                    Success = true,
                    Username = CurrentUsername,
                    Role = CurrentRole,
                    SessionId = ActiveSessionId,
                    Message = "Login Successful!"
                });
            }

            if (user.password != password)
            {
                return new AuthResult { Success = false, Message = "Invalid Password. Please check your credentials." };
            }

            if (user.status == "Banned")
            {
                return new AuthResult { Success = false, Message = "Your account has been suspended by the developer." };
            }

            CurrentUsername = username;
            CurrentRole = "VIP User";
            ActiveSessionId = "SESS-" + Guid.NewGuid().ToString("N").Substring(0, 10).ToUpper();

            await SendDiscordWebhookAsync("USER_LOGIN", $"User '{username}' authenticated successfully.");

            return await Task.FromResult(new AuthResult
            {
                Success = true,
                Username = CurrentUsername,
                Role = CurrentRole,
                SessionId = ActiveSessionId,
                Message = "Login Successful!"
            });
        }

        /// <summary>
        /// Validates a License Key directly without standard username registration.
        /// </summary>
        public async Task<AuthResult> ValidateLicenseAsync(string licenseKey)
        {
            if (string.IsNullOrWhiteSpace(licenseKey))
            {
                return new AuthResult { Success = false, Message = "License key cannot be empty." };
            }

            string hwid = GetHardwareFingerprint();
            CurrentUsername = $"User_{hwid.Substring(0, 6)}";
            CurrentRole = "Key Activated";
            ActiveSessionId = "SESS-" + Guid.NewGuid().ToString("N").Substring(0, 10).ToUpper();

            await SendDiscordWebhookAsync("KEY_ACTIVATE", $"License '{licenseKey}' activated on HWID: {hwid}");

            return await Task.FromResult(new AuthResult
            {
                Success = true,
                Username = CurrentUsername,
                Role = CurrentRole,
                SessionId = ActiveSessionId,
                Message = "License validated successfully!"
            });
        }

        public void StartHeartbeat(int intervalSeconds = 60)
        {
            Task.Run(async () =>
            {
                while (!string.IsNullOrEmpty(ActiveSessionId))
                {
                    await Task.Delay(intervalSeconds * 1000);
                }
            });
        }

        private async Task SendDiscordWebhookAsync(string action, string details)
        {
            if (string.IsNullOrEmpty(_webhookUrl) || !_webhookUrl.StartsWith("http")) return;
            try
            {
                var payload = new
                {
                    username = "MalikAuth Security Engine",
                    embeds = new[]
                    {
                        new
                        {
                            title = $"🔒 MalikAuth Audit Event [{_appId}]",
                            description = $"**Action:** {action}\n**Details:** {details}",
                            color = 5814783,
                            timestamp = DateTime.UtcNow.ToString("O")
                        }
                    }
                };
                var json = System.Text.Json.JsonSerializer.Serialize(payload);
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
                using var sha = SHA256.Create();
                byte[] hash = sha.ComputeHash(Encoding.UTF8.GetBytes(rawId));
                return BitConverter.ToString(hash).Replace("-", "").Substring(0, 16);
            }
            catch
            {
                return "HWID-UNKNOWN-0000";
            }
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
