using System;
using System.Drawing;
using System.Windows.Forms;
using MalikAuth;

namespace MalikAuthApp
{
    public partial class Login : Form
    {
        // Public static instance of MalikAuthClient so it can be accessed across forms
        public static MalikAuthClient malikAuth = new MalikAuthClient(
            appId: "RjrB7CrJXc",
            ownerId: "hhVHo",
            appSecret: "6tU5MfodyopJfwyswAaq",
            version: "1.0.0",
            webhookUrl: "https://discord.com/api/webhooks/1531351877915250821/1OjBoSKxR7KXgxK3WiBEtdcvTTss-D_Gr6ZoEdabnBLcl3_O5JM1c33th2XMzJ5vd3kk"
        );

        private TextBox txtUsername;
        private TextBox txtPassword;
        private Button btnLogin;
        private Button btnGoToRegister;
        private Label lblStatus;

        public Login()
        {
            InitializeComponent();
        }

        private async void Login_Load(object sender, EventArgs e)
        {
            lblStatus.Text = "Initializing MalikAuth Security Engine...";
            lblStatus.ForeColor = Color.DarkOrange;
            btnLogin.Enabled = false;

            bool isInit = await malikAuth.InitializeAsync();
            if (isInit)
            {
                lblStatus.Text = "Security Engine Ready. Enter your credentials.";
                lblStatus.ForeColor = Color.ForestGreen;
                btnLogin.Enabled = true;
            }
            else
            {
                lblStatus.Text = "Initialization Failed! Check internet connection.";
                lblStatus.ForeColor = Color.Red;
            }
        }

        private async void BtnLogin_Click(object sender, EventArgs e)
        {
            string username = txtUsername.Text.Trim();
            string password = txtPassword.Text.Trim();

            if (string.IsNullOrEmpty(username) || string.IsNullOrEmpty(password))
            {
                MessageBox.Show("Please enter both Username and Password.", "MalikAuth Warning", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                return;
            }

            btnLogin.Enabled = false;
            btnLogin.Text = "Logging in...";
            lblStatus.Text = "Authenticating credentials...";
            lblStatus.ForeColor = Color.DarkOrange;

            AuthResult result = await malikAuth.LoginAsync(username, password);

            if (result.Success)
            {
                lblStatus.Text = "Login Successful! Redirecting...";
                lblStatus.ForeColor = Color.ForestGreen;
                malikAuth.StartHeartbeat(60);

                MessageBox.Show($"Welcome, {result.Username}!\nRole: {result.Role}\nSession ID: {result.SessionId}", 
                    "Authentication Success", MessageBoxButtons.OK, MessageBoxIcon.Information);

                // Hide Login form and redirect to Main form
                this.Hide();
                Main mainForm = new Main();
                mainForm.ShowDialog();
                this.Close();
            }
            else
            {
                lblStatus.Text = result.Message;
                lblStatus.ForeColor = Color.Red;
                btnLogin.Enabled = true;
                btnLogin.Text = "LOGIN";
                MessageBox.Show(result.Message, "Login Failed", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }

        private void BtnGoToRegister_Click(object sender, EventArgs e)
        {
            // Redirect to Register form
            this.Hide();
            Register registerForm = new Register();
            registerForm.ShowDialog();
            this.Close();
        }

        private void InitializeComponent()
        {
            this.Text = "MalikAuth - User Login";
            this.Size = new Size(420, 360);
            this.StartPosition = FormStartPosition.CenterScreen;
            this.FormBorderStyle = FormBorderStyle.FixedDialog;
            this.MaximizeBox = false;
            this.BackColor = Color.FromArgb(248, 250, 252);

            Label lblTitle = new Label
            {
                Text = "Welcome Back",
                Font = new Font("Segoe UI", 16, FontStyle.Bold),
                ForeColor = Color.FromArgb(15, 23, 42),
                Location = new Point(30, 20),
                AutoSize = true
            };

            Label lblSubtitle = new Label
            {
                Text = "Enter your credentials to access your account",
                Font = new Font("Segoe UI", 9, FontStyle.Regular),
                ForeColor = Color.FromArgb(100, 116, 139),
                Location = new Point(30, 52),
                AutoSize = true
            };

            // Username Label & TextBox
            Label lblUser = new Label
            {
                Text = "Username:",
                Font = new Font("Segoe UI", 9.5f, FontStyle.Bold),
                ForeColor = Color.FromArgb(51, 65, 85),
                Location = new Point(30, 90),
                AutoSize = true
            };

            txtUsername = new TextBox
            {
                Location = new Point(30, 115),
                Width = 345,
                Height = 32,
                Font = new Font("Segoe UI", 10),
                PlaceholderText = "Enter your username"
            };

            // Password Label & TextBox
            Label lblPass = new Label
            {
                Text = "Password:",
                Font = new Font("Segoe UI", 9.5f, FontStyle.Bold),
                ForeColor = Color.FromArgb(51, 65, 85),
                Location = new Point(30, 155),
                AutoSize = true
            };

            txtPassword = new TextBox
            {
                Location = new Point(30, 180),
                Width = 345,
                Height = 32,
                Font = new Font("Segoe UI", 10),
                PasswordChar = '•',
                PlaceholderText = "Enter your password"
            };

            // Login Button
            btnLogin = new Button
            {
                Text = "LOGIN",
                Font = new Font("Segoe UI", 10, FontStyle.Bold),
                Location = new Point(30, 230),
                Width = 220,
                Height = 38,
                BackColor = Color.FromArgb(79, 70, 229),
                ForeColor = Color.White,
                FlatStyle = FlatStyle.Flat,
                Cursor = Cursors.Hand
            };
            btnLogin.FlatAppearance.BorderSize = 0;
            btnLogin.Click += BtnLogin_Click;

            // Register Navigation Button
            btnGoToRegister = new Button
            {
                Text = "REGISTER",
                Font = new Font("Segoe UI", 9.5f, FontStyle.Bold),
                Location = new Point(260, 230),
                Width = 115,
                Height = 38,
                BackColor = Color.FromArgb(226, 232, 240),
                ForeColor = Color.FromArgb(51, 65, 85),
                FlatStyle = FlatStyle.Flat,
                Cursor = Cursors.Hand
            };
            btnGoToRegister.FlatAppearance.BorderSize = 0;
            btnGoToRegister.Click += BtnGoToRegister_Click;

            // Status Label
            lblStatus = new Label
            {
                Text = "",
                Font = new Font("Segoe UI", 9),
                Location = new Point(30, 280),
                Width = 345,
                TextAlign = ContentAlignment.MiddleCenter
            };

            this.Controls.Add(lblTitle);
            this.Controls.Add(lblSubtitle);
            this.Controls.Add(lblUser);
            this.Controls.Add(txtUsername);
            this.Controls.Add(lblPass);
            this.Controls.Add(txtPassword);
            this.Controls.Add(btnLogin);
            this.Controls.Add(btnGoToRegister);
            this.Controls.Add(lblStatus);
            this.Load += Login_Load;
        }
    }
}
