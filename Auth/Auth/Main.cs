using System;
using System.Drawing;
using System.Threading.Tasks;
using System.Windows.Forms;
using MalikAuth;

namespace MalikAuthApp
{
    /// <summary>
    /// Main dashboard form — displayed after successful login/registration.
    /// Shows user info and runs the heartbeat loop in background.
    /// </summary>
    public partial class Main : Form
    {
        private Label lblWelcome, lblRole, lblSession, lblHWID, lblExpiry;
        private Button btnLogout;

        public Main() { InitializeComponent(); }

        // Populate user info from the shared MalikAuth client
        private void Main_Load(object sender, EventArgs e)
        {
            var auth = Login.malikAuth;
            lblWelcome.Text = $"Welcome, {auth.CurrentUsername}!";
            lblRole.Text = $"Role: {auth.CurrentRole}";
            lblSession.Text = $"Session: {auth.ActiveSessionId}";
            lblHWID.Text = $"HWID: {auth.UserHwid}";
            lblExpiry.Text = string.IsNullOrEmpty(auth.CurrentExpiry) ? "Expiry: N/A" : $"Expiry: {auth.CurrentExpiry}";

            // Start background heartbeat (kills app if session is terminated/expired)
            Task.Run(() => auth.StartHeartbeatLoopAsync(auth.ActiveSessionId));
        }

        // Logout and return to login form
        private void BtnLogout_Click(object sender, EventArgs e)
        {
            if (MessageBox.Show("Are you sure you want to log out?", "Confirm Logout",
                MessageBoxButtons.YesNo, MessageBoxIcon.Question) == DialogResult.Yes)
            {
                Login.malikAuth.GoToLogin(this);
            }
        }

        // Build the form UI programmatically (no Designer needed)
        private void InitializeComponent()
        {
            Text = "MalikAuth - Dashboard";
            Size = new Size(480, 350);
            StartPosition = FormStartPosition.CenterScreen;
            FormBorderStyle = FormBorderStyle.FixedDialog;
            MaximizeBox = false;
            BackColor = Color.FromArgb(248, 250, 252);

            var header = new Label
            {
                Text = "MalikAuth Dashboard",
                Font = new Font("Segoe UI", 16, FontStyle.Bold),
                ForeColor = Color.FromArgb(79, 70, 229),
                Location = new Point(30, 20),
                AutoSize = true
            };

            lblWelcome = MakeLabel("Welcome, User!", new Font("Segoe UI", 12, FontStyle.Bold), Color.FromArgb(15, 23, 42), 30, 60);
            lblRole = MakeLabel("Role: ...", new Font("Segoe UI", 9.5f), Color.FromArgb(51, 65, 85), 15, 15);
            lblSession = MakeLabel("Session: ...", new Font("Consolas", 9f), Color.FromArgb(79, 70, 229), 15, 45);
            lblHWID = MakeLabel("HWID: ...", new Font("Consolas", 9f), Color.FromArgb(16, 185, 129), 15, 75);
            lblExpiry = MakeLabel("Expiry: ...", new Font("Consolas", 9f), Color.FromArgb(234, 88, 12), 15, 105);

            var infoBox = new Panel
            {
                Location = new Point(30, 95),
                Size = new Size(405, 140),
                BackColor = Color.White,
                BorderStyle = BorderStyle.FixedSingle
            };
            infoBox.Controls.AddRange(new Control[] { lblRole, lblSession, lblHWID, lblExpiry });

            btnLogout = new Button
            {
                Text = "LOG OUT",
                Font = new Font("Segoe UI", 9.5f, FontStyle.Bold),
                Location = new Point(30, 250),
                Size = new Size(130, 36),
                BackColor = Color.FromArgb(225, 29, 72),
                ForeColor = Color.White,
                FlatStyle = FlatStyle.Flat,
                Cursor = Cursors.Hand
            };
            btnLogout.FlatAppearance.BorderSize = 0;
            btnLogout.Click += BtnLogout_Click;

            Controls.AddRange(new Control[] { header, lblWelcome, infoBox, btnLogout });
            Load += Main_Load;
        }

        private static Label MakeLabel(string text, Font font, Color color, int x, int y)
        {
            return new Label { Text = text, Font = font, ForeColor = color, Location = new Point(x, y), AutoSize = true };
        }
    }
}
