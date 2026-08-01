using System;
using System.Windows.Forms;
using MalikAuth;

namespace MalikAuthApp
{
    public partial class Register : Form
    {
        public Register()
        {
            InitializeComponent();
        }

        private async void BtnRegister_Click(object sender, EventArgs e)
        {
            string username = txtUsername.Text.Trim();
            string password = txtPassword.Text.Trim();
            string licenseKey = txtLicenseKey.Text.Trim();

            if (string.IsNullOrEmpty(username) || string.IsNullOrEmpty(password) || string.IsNullOrEmpty(licenseKey))
            {
                MessageBox.Show("Please fill out all 3 fields: Username, Password, and License Key.", 
                    "Registration Warning", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                return;
            }

            btnRegister.Enabled = false;

            // Register account using MalikAuth Client
            AuthResult result = await Login.malikAuth.RegisterAsync(username, password, licenseKey);

            if (result.Success)
            {
                MessageBox.Show("Account successfully created for '" + result.Username + "'!\n\nRole: " + result.Role + "\nSession ID: " + result.SessionId + "\n\nRedirecting to Main Application...", 
                    "Registration Success", MessageBoxButtons.OK, MessageBoxIcon.Information);

                // Navigate directly to Main Application (Main.cs)
                this.Hide();
                Main mainForm = new Main();
                mainForm.ShowDialog();
                this.Close();
            }
            else
            {
                btnRegister.Enabled = true;
                MessageBox.Show(result.Message, "Registration Failed", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }

        private void BtnBackToLogin_Click(object sender, EventArgs e)
        {
            // Navigate back to Login Form
            this.Hide();
            Login loginForm = new Login();
            loginForm.ShowDialog();
            this.Close();
        }
    }
}
