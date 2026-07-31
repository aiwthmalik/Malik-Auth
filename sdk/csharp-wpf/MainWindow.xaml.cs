using System;
using System.Threading.Tasks;
using System.Windows;
using MalikAuth;

namespace MalikAuth.WPF
{
    public partial class MainWindow : Window
    {
        private readonly MalikAuthClient _malikAuth;

        public MainWindow()
        {
            InitializeComponent();
            _malikAuth = new MalikAuthClient(
                appId: "malik_vmeulvhj5a8olmn9",
                ownerId: "owner_admin_786",
                appSecret: "sec_key_sample_aes256",
                version: "2.5.0",
                webhookUrl: "https://discord.com/api/webhooks/your_id/your_token"
            );
            Loaded += MainWindow_Loaded;
        }

        private async void MainWindow_Loaded(object sender, RoutedEventArgs e)
        {
            StatusText.Text = "Connecting to MalikAuth Core...";
            bool initialized = await _malikAuth.InitializeAsync();

            if (initialized)
            {
                StatusText.Text = "Security Engine Connected.";
                BtnLogin.IsEnabled = true;
            }
            else
            {
                StatusText.Text = "Failed to initialize security engine.";
            }
        }

        private async void BtnLogin_Click(object sender, RoutedEventArgs e)
        {
            string key = TxtLicenseKey.Text.Trim();
            if (string.IsNullOrEmpty(key))
            {
                MessageBox.Show("Please enter a license key.", "Validation Error", MessageBoxButton.OK, MessageBoxImage.Warning);
                return;
            }

            BtnLogin.IsEnabled = false;
            BtnLogin.Content = "Verifying...";
            StatusText.Text = "Validating HWID & signature...";

            var result = await _malikAuth.ValidateLicenseAsync(key);

            if (result.Success)
            {
                StatusText.Text = "Authentication Successful!";
                _malikAuth.StartHeartbeat(60);

                MessageBox.Show($"Welcome {result.Username}!\nRole: {result.Role}\nSession: {result.SessionId}",
                    "MalikAuth Success", MessageBoxButton.OK, MessageBoxImage.Information);

                // Transition to main WPF application interface
            }
            else
            {
                StatusText.Text = $"Error: {result.Message}";
                BtnLogin.IsEnabled = true;
                BtnLogin.Content = "Login / Activate";
            }
        }

        // Stub WPF UI control declarations for standalone compilation
        public System.Windows.Controls.TextBox TxtLicenseKey { get; set; } = new System.Windows.Controls.TextBox();
        public System.Windows.Controls.Button BtnLogin { get; set; } = new System.Windows.Controls.Button();
        public System.Windows.Controls.TextBlock StatusText { get; set; } = new System.Windows.Controls.TextBlock();
        private void InitializeComponent() { }
    }
}
