using System;
using System.Threading.Tasks;
using MalikAuth;

namespace MalikAuth.ConsoleExample
{
    class Program
    {
        static async Task Main(string[] args)
        {
            Console.Title = "MalikAuth C# Console Integration Example";
            Console.WriteLine("==================================================");
            Console.WriteLine("        MalikAuth Security & Licensing C#         ");
            Console.WriteLine("==================================================");

            // 1. Initialize MalikAuth Security Engine
            var malikAuth = new MalikAuthClient(
                appId: "malik_vmeulvhj5a8olmn9",
                ownerId: "owner_admin_786",
                appSecret: "sec_key_sample_aes256",
                version: "2.5.0",
                webhookUrl: "https://discord.com/api/webhooks/your_id/your_token"
            );

            Console.Write("[*] Initializing MalikAuth Core SDK... ");
            bool ok = await malikAuth.InitializeAsync();
            if (!ok)
            {
                Console.WriteLine("FAILED!");
                Console.WriteLine("Please verify your App ID and network connection.");
                return;
            }
            Console.WriteLine("SUCCESS!");

            // 2. Prompt for License Key
            Console.Write("\n[?] Enter your MalikAuth License Key: ");
            string licenseKey = Console.ReadLine()?.Trim();

            if (string.IsNullOrEmpty(licenseKey))
            {
                licenseKey = "MALIK-TEST-DEMO-VIP";
                Console.WriteLine($"[*] Using default test key: {licenseKey}");
            }

            // 3. Authenticate & Verify Hardware Fingerprint (HWID)
            Console.WriteLine("[*] Authenticating license & checking HWID bind...");
            var result = await malikAuth.ValidateLicenseAsync(licenseKey);

            if (!result.Success)
            {
                Console.ForegroundColor = ConsoleColor.Red;
                Console.WriteLine($"[-] Authentication Failed: {result.Message}");
                Console.ResetColor();
                return;
            }

            Console.ForegroundColor = ConsoleColor.Green;
            Console.WriteLine($"[+] Successfully Authenticated!");
            Console.ResetColor();
            Console.WriteLine($"    Username   : {result.Username}");
            Console.WriteLine($"    Assigned Role : {result.Role}");
            Console.WriteLine($"    Session ID : {result.SessionId}");

            // 4. Start Live Heartbeat
            malikAuth.StartHeartbeat(60);
            Console.WriteLine("\n[*] Heartbeat monitor started (60s interval).");

            // 5. Fetch Remote Synchronized Variables
            string downloadUrl = malikAuth.GetRemoteVariable("DOWNLOAD_URL");
            Console.WriteLine($"[*] Live Remote Variable [DOWNLOAD_URL]: {downloadUrl ?? "None configured"}");

            Console.WriteLine("\n[+] Application running securely. Press any key to exit.");
            Console.ReadKey();
        }
    }
}
