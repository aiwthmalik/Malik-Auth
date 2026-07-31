using System;
using System.Drawing;
using System.Windows.Forms;
using MalikAuth;

namespace MalikAuthApp
{
    public partial class Register : Form
    {
        private TextBox txtUsername;
        private TextBox txtPassword;
        private TextBox txtLicenseKey;
        private Button btnRegister;
        private Button btnBackToLogin;
        private Label lblStatus;

        public Register()
        {
            InitializeComponent();
        }

        private void Register_Load(object sender, EventArgs e)
        {
            lblStatus.Text = "Enter your desired credentials & valid license key.";
            lblStatus.ForeColor = Color.FromArgb(71, 85, 105);
        }

        private async void BtnRegister_Click(object sender, EventArgs e)
        {
            string username = txtUsername.Text.Trim();
            string password = txtPassword.Text.Trim();
            string license = txtLicenseKey.Text.Trim();

            if (string.IsNullOrEmpty(username) || string.IsNullOrEmpty(password) || string.IsNullOrEmpty(license))
            {
                MessageBox.Show("Please fill out all 3 fields: Username, Password, and License Key.", 
                    "Registration Error", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                return;
            }

            btnRegister.Enabled = false;
            btnRegister.Text = "Registering...";
            lblStatus.Text = "Verifying license and registering account...";
            lblStatus.ForeColor = Color.DarkOrange;

            // Call MalikAuth client to register user with license
            AuthResult result = await Login.malikAuth.RegisterAsync(username, password, license);

            if (result.Success)
            {
                lblStatus.Text = "Registration Successful! Account created.";
                lblStatus.ForeColor = Color.ForestGreen;

                MessageBox.Show($"Account successfully registered for '{username}'!\n\nYou can now log in using your Username and Password.", 
                    "Registration Successful", MessageBoxButtons.OK, MessageBoxIcon.Information);

                // Redirect back to Login form
                this.Hide();
                Login loginForm = new Login();
                loginForm.ShowDialog();
                this.Close();
            }
            else
            {
                lblStatus.Text = result.Message;
                lblStatus.ForeColor = Color.Red;
                btnRegister.Enabled = true;
                btnRegister.Text = "CREATE ACCOUNT";
                MessageBox.Show(result.Message, "Registration Failed", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }

        private void BtnBackToLogin_Click(object sender, EventArgs e)
        {
            this.Hide();
            Login loginForm = new Login();
            loginForm.ShowDialog();
            this.Close();
        }

        private void InitializeComponent()
        {
            this.Text = "MalikAuth - Create Account";
            this.Size = new Size(420, 430);
            this.StartPosition = FormStartPosition.CenterScreen;
            this.FormBorderStyle = FormBorderStyle.FixedDialog;
            this.MaximizeBox = false;
            this.BackColor = Color.FromArgb(248, 250, 252);

            Label lblTitle = new Label
            {
                Text = "Create Account",
                Font = new Font("Segoe UI", 16, FontStyle.Bold),
                ForeColor = Color.FromArgb(15, 23, 42),
                Location = new Point(30, 20),
                AutoSize = true
            };

            Label lblSubtitle = new Label
            {
                Text = "Activate software using your license key",
                Font = new Font("Segoe UI", 9, FontStyle.Regular),
                ForeColor = Color.FromArgb(100, 116, 139),
                Location = new Point(30, 52),
                AutoSize = true
            };

            // Field 1: Username
            Label lblUser = new Label
            {
                Text = "Desired Username:",
                Font = new Font("Segoe UI", 9.5f, FontStyle.Bold),
                ForeColor = Color.FromArgb(51, 65, 85),
                Location = new Point(30, 85),
                AutoSize = true
            };

            txtUsername = new TextBox
            {
                Location = new Point(30, 110),
                Width = 345,
                Height = 32,
                Font = new Font("Segoe UI", 10),
                PlaceholderText = "Choose a username"
            };

            // Field 2: Password
            Label lblPass = new Label
            {
                Text = "Desired Password:",
                Font = new Font("Segoe UI", 9.5f, FontStyle.Bold),
                ForeColor = Color.FromArgb(51, 65, 85),
                Location = new Point(30, 150),
                AutoSize = true
            };

            txtPassword = new TextBox
            {
                Location = new Point(30, 175),
                Width = 345,
                Height = 32,
                Font = new Font("Segoe UI", 10),
                PasswordChar = '•',
                PlaceholderText = "Choose a strong password"
            };

            // Field 3: License Key
            Label lblLicense = new Label
            {
                Text = "License Key:",
                Font = new Font("Segoe UI", 9.5f, FontStyle.Bold),
                ForeColor = Color.FromArgb(51, 65, 85),
                Location = new Point(30, 215),
                AutoSize = true
            };

            txtLicenseKey = new TextBox
            {
                Location = new Point(30, 240),
                Width = 345,
                Height = 32,
                Font = new Font("Consolas", 10),
                PlaceholderText = "MALIK-XXXX-XXXX-XXXX"
            };

            // Register Button
            btnRegister = new Button
            {
                Text = "CREATE ACCOUNT",
                Font = new Font("Segoe UI", 10, FontStyle.Bold),
                Location = new Point(30, 290),
                Width = 220,
                Height = 38,
                BackColor = Color.FromArgb(16, 185, 129),
                ForeColor = Color.White,
                FlatStyle = FlatStyle.Flat,
                Cursor = Cursors.Hand
            };
            btnRegister.FlatAppearance.BorderSize = 0;
            btnRegister.Click += BtnRegister_Click;

            // Back to Login Button
            btnBackToLogin = new Button
            {
                Text = "BACK TO LOGIN",
                Font = new Font("Segoe UI", 8.5f, FontStyle.Bold),
                Location = new Point(260, 290),
                Width = 115,
                Height = 38,
                BackColor = Color.FromArgb(226, 232, 240),
                ForeColor = Color.FromArgb(51, 65, 85),
                FlatStyle = FlatStyle.Flat,
                Cursor = Cursors.Hand
            };
            btnBackToLogin.FlatAppearance.BorderSize = 0;
            btnBackToLogin.Click += BtnBackToLogin_Click;

            // Status Label
            lblStatus = new Label
            {
                Text = "",
                Font = new Font("Segoe UI", 9),
                Location = new Point(30, 340),
                Width = 345,
                TextAlign = ContentAlignment.MiddleCenter
            };

            this.Controls.Add(lblTitle);
            this.Controls.Add(lblSubtitle);
            this.Controls.Add(lblUser);
            this.Controls.Add(txtUsername);
            this.Controls.Add(lblPass);
            this.Controls.Add(txtPassword);
            this.Controls.Add(lblLicense);
            this.Controls.Add(txtLicenseKey);
            this.Controls.Add(btnRegister);
            this.Controls.Add(btnBackToLogin);
            this.Controls.Add(lblStatus);
            this.Load += Register_Load;
        }
    }
}
