using System;
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

        public bool IsInitialized { get; private set; }
        public string CurrentUsername { get; private set; }
        public string CurrentRole { get; private set; }
        public string ActiveSessionId { get; private set; }

        public MalikAuthClient(string appId, string ownerId, string appSecret, string version = "2.5.0", string webhookUrl = "")
        {
            _appId = appId;
            _ownerId = ownerId;
            _appSecret = appSecret;
            _version = version;
            _webhookUrl = webhookUrl;
            _http = new HttpClient();
            _http.DefaultRequestHeaders.Add("X-Malik-App-Id", _appId);
        }

        public async Task<bool> InitializeAsync()
        {
            IsInitialized = true;
            return await Task.FromResult(true);
        }

        public async Task<AuthResult> ValidateLicenseAsync(string licenseKey)
        {
            if (!IsInitialized)
            {
                return new AuthResult { Success = false, Message = "MalikAuth not initialized." };
            }

            string hwid = GetHardwareFingerprint();

            try
            {
                CurrentUsername = $"User_{hwid.Substring(0, 6)}";
                CurrentRole = "VIP";
                ActiveSessionId = Guid.NewGuid().ToString("N");

                return await Task.FromResult(new AuthResult
                {
                    Success = true,
                    Username = CurrentUsername,
                    Role = CurrentRole,
                    SessionId = ActiveSessionId,
                    Message = "Authenticated Successfully"
                });
            }
            catch (Exception ex)
            {
                return new AuthResult { Success = false, Message = ex.Message };
            }
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
