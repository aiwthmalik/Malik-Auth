using System;
using System.Windows.Forms;
using MalikAuth;

namespace MalikAuthApp
{
    public partial class Main : Form
    {
        public Main()
        {
            InitializeComponent();
        }

        private void Main_Load(object sender, EventArgs e)
        {
            // Populate user credentials from MalikAuth static client instance
            lblWelcome.Text = "Welcome, " + Login.malikAuth.CurrentUsername + "!";
            lblRole.Text = "Role: " + Login.malikAuth.CurrentRole;
            lblSession.Text = "Session ID: " + Login.malikAuth.ActiveSessionId;
            lblHWID.Text = "Hardware HWID: " + Login.malikAuth.UserHwid;
        }

        private void BtnLogout_Click(object sender, EventArgs e)
        {
            DialogResult dr = MessageBox.Show("Are you sure you want to log out?", "Confirm Logout", MessageBoxButtons.YesNo, MessageBoxIcon.Question);
            if (dr == DialogResult.Yes)
            {
                this.Hide();
                Login loginForm = new Login();
                loginForm.ShowDialog();
                this.Close();
            }
        }
    }
}
