using System;
using System.Windows.Forms;
using MalikAuth;

namespace MalikAuthApp
{
    public partial class Login : Form
    {
        // Public static instance of MalikAuthClient so it can be accessed across all forms
        public static MalikAuthClient malikAuth = new MalikAuthClient(
            appId: "RjrB7CrJXc",
            ownerId: "hhVHo",
            appSecret: "6tU5MfodyopJfwyswAaq",
            version: "1.0.0",
            webhookUrl: "https://discord.com/api/webhooks/1531351877915250821/1OjBoSKxR7KXgxK3WiBEtdcvTTss-D_Gr6ZoEdabnBLcl3_O5JM1c33th2XMzJ5vd3kk"
        );

        public Login()
        {
            InitializeComponent();
            // Set your website URL endpoint (defaults to https://malikauth.ai.studio or http://localhost:3000 during local dev)
            malikAuth.ServerUrl = "https://malikauth.ai.studio";
        }

        private async void Login_Load(object sender, EventArgs e)
        {
            btnLogin.Enabled = false;

            // Initialize MalikAuth Security Engine on Form Startup
            bool ok = await malikAuth.InitializeAsync();
            if (ok)
            {
                btnLogin.Enabled = true;
            }
            else
            {
                MessageBox.Show("MalikAuth Security Engine initialization failed!", "Initialization Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
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

            // Authenticate user with MalikAuth
            AuthResult result = await malikAuth.LoginAsync(username, password);

            if (result.Success)
            {
                MessageBox.Show("Login Successful!\n\nWelcome back, " + result.Username + "!\nRole: " + result.Role + "\nSession ID: " + result.SessionId, 
                    "Authentication Success", MessageBoxButtons.OK, MessageBoxIcon.Information);

                // Hide Login form and navigate to Main Dashboard
                this.Hide();
                Main mainForm = new Main();
                mainForm.ShowDialog();
                this.Close();
            }
            else
            {
                btnLogin.Enabled = true;
                MessageBox.Show(result.Message, "Login Failed", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }

        private void BtnGoToRegister_Click(object sender, EventArgs e)
        {
            // Navigate to Register Form
            this.Hide();
            Register registerForm = new Register();
            registerForm.ShowDialog();
            this.Close();
        }
    }
}
