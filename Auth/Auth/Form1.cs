using System;
using System.Windows.Forms;
using MalikAuth;

namespace MalikAuthApp
{
    /// <summary>
    /// Login form — handles user authentication via MalikAuth SDK.
    /// All logic (API calls, validation, navigation) is handled by MalikAuthClient.
    /// </summary>
    public partial class Login : Form
    {
        // Shared SDK instance accessible from all forms.
        // Replace placeholder values with your own from the MalikAuth dashboard.
        public static MalikAuthClient malikAuth = new MalikAuthClient(
            appId: "RjrB7CrJXc",
            ownerId: "hhVHo",
            appSecret: "6tU5MfodyopJfwyswAaq",
            version: "1.0.0",
            webhookUrl: "https://discord.com/api/webhooks/1531351877915250821/1OjBoSKxR7KXgxK3WiBEtdcvTTss-D_Gr6ZoEdabnBLcl3_O5JM1c33th2XMzJ5vd3kk" // Discord webhook URL (optional)
        );

        public Login()
        {
            InitializeComponent();
            malikAuth.ServerUrl = "https://malikauth.ai.studio"; // or "http://localhost:3000"
        }

        // Initialize the security engine when the form loads
        private async void Login_Load(object sender, EventArgs e)
        {
            btnLogin.Enabled = false;
            btnLogin.Text = "CONNECTING...";
            bool ok = await malikAuth.InitializeAsync();
            btnLogin.Enabled = ok;
            btnLogin.Text = "LOGIN";
            if (!ok)
                MessageBox.Show("Security Engine initialization failed!", "Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
        }

        // Handle login button click
        private async void BtnLogin_Click(object sender, EventArgs e)
        {
            string user = txtUsername.Text.Trim();
            string pass = txtPassword.Text.Trim();

            if (string.IsNullOrEmpty(user) || string.IsNullOrEmpty(pass))
            {
                MessageBox.Show("Please enter both Username and Password.", "Warning", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                return;
            }

            btnLogin.Enabled = false;
            AuthResult result = await malikAuth.LoginAsync(user, pass);

            if (result.Success)
            {
                malikAuth.ShowSuccess(result, "Login Successful");
                malikAuth.GoToMain(this);
            }
            else
            {
                malikAuth.ShowError(result, "Login Failed");
                btnLogin.Enabled = true;
            }
        }

        // Navigate to register form
        private void BtnGoToRegister_Click(object sender, EventArgs e)
        {
            malikAuth.GoToRegister(this);
        }
    }
}
