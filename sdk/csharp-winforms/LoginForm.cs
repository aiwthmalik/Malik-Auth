using System;
using System.Drawing;
using System.Windows.Forms;
using System.Threading.Tasks;
using MalikAuth;

namespace MalikAuth.WinForms
{
    public partial class LoginForm : Form
    {
        private readonly MalikAuthClient _malikAuth;
        private TextBox _txtLicenseKey;
        private Button _btnLogin;
        private Label _lblStatus;

        public LoginForm()
        {
            InitializeComponent();
            _malikAuth = new MalikAuthClient(
                appId: "malik_vmeulvhj5a8olmn9",
                ownerId: "owner_admin_786",
                appSecret: "sec_key_sample_aes256",
                version: "2.5.0",
                webhookUrl: "https://discord.com/api/webhooks/your_id/your_token"
            );
        }

        private async void LoginForm_Load(object sender, EventArgs e)
        {
            _lblStatus.Text = "Initializing MalikAuth Core...";
            _lblStatus.ForeColor = Color.DarkOrange;
            _btnLogin.Enabled = false;

            bool init = await _malikAuth.InitializeAsync();
            if (init)
            {
                _lblStatus.Text = "Security Engine Ready.";
                _lblStatus.ForeColor = Color.Green;
                _btnLogin.Enabled = true;
            }
            else
            {
                _lblStatus.Text = "Initialization Failed!";
                _lblStatus.ForeColor = Color.Red;
            }
        }

        private async void BtnLogin_Click(object sender, EventArgs e)
        {
            string key = _txtLicenseKey.Text.Trim();
            if (string.IsNullOrEmpty(key))
            {
                MessageBox.Show("Please enter a valid license key.", "MalikAuth Error", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                return;
            }

            _btnLogin.Enabled = false;
            _btnLogin.Text = "Verifying...";
            _lblStatus.Text = "Checking hardware fingerprint...";

            var result = await _malikAuth.ValidateLicenseAsync(key);

            if (result.Success)
            {
                _lblStatus.Text = "Authentication Successful!";
                _lblStatus.ForeColor = Color.Green;
                _malikAuth.StartHeartbeat(60);

                MessageBox.Show($"Welcome {result.Username}!\nRole: {result.Role}\nSession: {result.SessionId}", 
                    "MalikAuth Success", MessageBoxButtons.OK, MessageBoxIcon.Information);

                this.Hide();
                // Show Main Application Window here
            }
            else
            {
                _lblStatus.Text = $"Error: {result.Message}";
                _lblStatus.ForeColor = Color.Red;
                _btnLogin.Enabled = true;
                _btnLogin.Text = "Login / Activate";
            }
        }

        private void InitializeComponent()
        {
            this.Text = "MalikAuth - WinForms Licensing";
            this.Size = new Size(420, 260);
            this.StartPosition = FormStartPosition.CenterScreen;
            this.FormBorderStyle = FormBorderStyle.FixedDialog;
            this.MaximizeBox = false;

            Label lblTitle = new Label
            {
                Text = "Software Activation",
                Font = new Font("Segoe UI", 14, FontStyle.Bold),
                Location = new Point(25, 20),
                AutoSize = true
            };

            Label lblKey = new Label
            {
                Text = "License Key:",
                Location = new Point(25, 70),
                AutoSize = true
            };

            _txtLicenseKey = new TextBox
            {
                Location = new Point(25, 95),
                Width = 350,
                Font = new Font("Consolas", 10),
                PlaceholderText = "MALIK-XXXX-XXXX-XXXX"
            };

            _btnLogin = new Button
            {
                Text = "Login / Activate",
                Location = new Point(25, 140),
                Width = 350,
                Height = 36,
                BackColor = Color.FromArgb(79, 70, 229),
                ForeColor = Color.White,
                FlatStyle = FlatStyle.Flat
            };
            _btnLogin.Click += BtnLogin_Click;

            _lblStatus = new Label
            {
                Text = "",
                Location = new Point(25, 185),
                Width = 350,
                TextAlign = ContentAlignment.MiddleCenter
            };

            this.Controls.Add(lblTitle);
            this.Controls.Add(lblKey);
            this.Controls.Add(_txtLicenseKey);
            this.Controls.Add(_btnLogin);
            this.Controls.Add(_lblStatus);
            this.Load += LoginForm_Load;
        }
    }
}
