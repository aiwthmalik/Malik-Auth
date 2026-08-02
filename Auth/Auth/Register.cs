using System;
using System.Windows.Forms;
using MalikAuth;

namespace MalikAuthApp
{
    /// <summary>
    /// Registration form — creates new user accounts via MalikAuth SDK.
    /// Requires a valid license key. All logic is handled by MalikAuthClient.
    /// </summary>
    public partial class Register : Form
    {
        public Register()
        {
            InitializeComponent();
        }

        // Handle register button click
        private async void BtnRegister_Click(object sender, EventArgs e)
        {
            string user = txtUsername.Text.Trim();
            string pass = txtPassword.Text.Trim();
            string key = txtLicenseKey.Text.Trim();

            if (string.IsNullOrEmpty(user) || string.IsNullOrEmpty(pass) || string.IsNullOrEmpty(key))
            {
                MessageBox.Show("Please fill out all 3 fields: Username, Password, and License Key.",
                    "Warning", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                return;
            }

            btnRegister.Enabled = false;
            AuthResult result = await Login.malikAuth.RegisterAsync(user, pass, key);

            if (result.Success)
            {
                Login.malikAuth.ShowSuccess(result, "Registration Successful");
                Login.malikAuth.GoToMain(this);
            }
            else
            {
                Login.malikAuth.ShowError(result, "Registration Failed");
                btnRegister.Enabled = true;
            }
        }

        // Navigate back to login form
        private void BtnBackToLogin_Click(object sender, EventArgs e)
        {
            Login.malikAuth.GoToLogin(this);
        }
    }
}
