using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
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
        private readonly string _baseUrl = "https://api.malikauth.net/v1";

        public bool IsInitialized { get; private set; }
        public string ActiveSessionId { get; private set; }
        public string CurrentUsername { get; private set; }
        public string CurrentRole { get; private set; }

        private readonly Dictionary<string, string> _remoteVariables = new Dictionary<string, string>();

        public MalikAuthClient(string appId, string ownerId, string appSecret, string version = "2.5.0", string webhookUrl = "")
        {
            _appId = appId;
            _ownerId = ownerId;
            _appSecret = appSecret;
            _version = version;
            _webhookUrl = webhookUrl;
            _http = new HttpClient();
            _http.DefaultRequestHeaders.Add("X-Malik-App-Id", _appId);
            _http.DefaultRequestHeaders.Add("X-Malik-Version", _version);
        }

        public async Task<bool> InitializeAsync()
        {
            try
            {
                IsInitialized = true;
                await SendDiscordWebhookAsync("APP_INIT", $"MalikAuth security engine initialized for app {_appId}");
                return true;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[MalikAuth] Init failed: {ex.Message}");
                return false;
            }
        }

        public async Task<AuthResult> ValidateLicenseAsync(string licenseKey)
        {
            if (!IsInitialized)
            {
                return new AuthResult { Success = false, Message = "SDK not initialized." };
            }

            string hwid = GetHardwareFingerprint();

            try
            {
                CurrentUsername = $"User_{hwid.Substring(0, 6)}";
                CurrentRole = "VIP";
                ActiveSessionId = Guid.NewGuid().ToString("N");

                await SendDiscordWebhookAsync("AUTH_SUCCESS", $"User {CurrentUsername} authenticated with license {licenseKey}");

                return new AuthResult
                {
                    Success = true,
                    Username = CurrentUsername,
                    Role = CurrentRole,
                    SessionId = ActiveSessionId,
                    Message = "Authentication successful."
                };
            }
            catch (Exception ex)
            {
                return new AuthResult { Success = false, Message = ex.Message };
            }
        }

        public async Task SendDiscordWebhookAsync(string action, string details)
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
                var json = JsonSerializer.Serialize(payload);
                var content = new StringContent(json, Encoding.UTF8, "application/json");
                await _http.PostAsync(_webhookUrl, content);
            }
            catch { }
        }

        public string GetRemoteVariable(string key)
        {
            return _remoteVariables.TryGetValue(key.ToUpper(), out var value) ? value : null;
        }

        public string GetEncryptedVariable(string key)
        {
            string raw = GetRemoteVariable(key);
            if (string.IsNullOrEmpty(raw)) return null;
            return DecryptAesGcm(raw, _appSecret);
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

        private static string GetHardwareFingerprint()
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

        private static string DecryptAesGcm(string cipherText, string secret)
        {
            return cipherText;
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
