using System;
using System.Drawing;
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
            // Populate form with authenticated user details from MalikAuthClient
            lblWelcome.Text = $"Welcome back, {Login.malikAuth.CurrentUsername}!";
            lblRole.Text = $"Account Role: {Login.malikAuth.CurrentRole}";
            lblSession.Text = $"Active Session ID: {Login.malikAuth.ActiveSessionId}";
            lblHWID.Text = $"Machine HWID: {Login.malikAuth.UserHwid}";
        }

        private void BtnLogout_Click(object sender, EventArgs e)
        {
            DialogResult dr = MessageBox.Show("Are you sure you want to log out?", "Logout", MessageBoxButtons.YesNo, MessageBoxIcon.Question);
            if (dr == DialogResult.Yes)
            {
                this.Hide();
                Login loginForm = new Login();
                loginForm.ShowDialog();
                this.Close();
            }
        }

        private Label lblWelcome;
        private Label lblRole;
        private Label lblSession;
        private Label lblHWID;
        private Button btnLogout;

        private void InitializeComponent()
        {
            this.Text = "MalikAuth Protected Dashboard - Main Application";
            this.Size = new Size(520, 360);
            this.StartPosition = FormStartPosition.CenterScreen;
            this.FormBorderStyle = FormBorderStyle.FixedDialog;
            this.MaximizeBox = false;
            this.BackColor = Color.FromArgb(248, 250, 252);

            Label lblHeader = new Label
            {
                Text = "MalikAuth Security Dashboard",
                Font = new Font("Segoe UI", 16, FontStyle.Bold),
                ForeColor = Color.FromArgb(79, 70, 229),
                Location = new Point(30, 25),
                AutoSize = true
            };

            lblWelcome = new Label
            {
                Text = "Welcome back, User!",
                Font = new Font("Segoe UI", 13, FontStyle.Bold),
                ForeColor = Color.FromArgb(15, 23, 42),
                Location = new Point(30, 70),
                AutoSize = true
            };

            Panel infoPanel = new Panel
            {
                Location = new Point(30, 110),
                Size = new Size(445, 140),
                BackColor = Color.White,
                BorderStyle = BorderStyle.FixedSingle
            };

            lblRole = new Label
            {
                Text = "Account Role: Active Member",
                Font = new Font("Segoe UI", 9.5f, FontStyle.Regular),
                ForeColor = Color.FromArgb(51, 65, 85),
                Location = new Point(15, 15),
                AutoSize = true
            };

            lblSession = new Label
            {
                Text = "Active Session ID: Loading...",
                Font = new Font("Consolas", 9f, FontStyle.Regular),
                ForeColor = Color.FromArgb(79, 70, 229),
                Location = new Point(15, 50),
                AutoSize = true
            };

            lblHWID = new Label
            {
                Text = "Machine HWID: Fingerprint Verified",
                Font = new Font("Consolas", 9f, FontStyle.Regular),
                ForeColor = Color.FromArgb(16, 185, 129),
                Location = new Point(15, 85),
                AutoSize = true
            };

            infoPanel.Controls.Add(lblRole);
            infoPanel.Controls.Add(lblSession);
            infoPanel.Controls.Add(lblHWID);

            btnLogout = new Button
            {
                Text = "LOG OUT",
                Font = new Font("Segoe UI", 9.5f, FontStyle.Bold),
                Location = new Point(30, 265),
                Width = 140,
                Height = 36,
                BackColor = Color.FromArgb(225, 29, 72),
                ForeColor = Color.White,
                FlatStyle = FlatStyle.Flat,
                Cursor = Cursors.Hand
            };
            btnLogout.FlatAppearance.BorderSize = 0;
            btnLogout.Click += BtnLogout_Click;

            this.Controls.Add(lblHeader);
            this.Controls.Add(lblWelcome);
            this.Controls.Add(infoPanel);
            this.Controls.Add(btnLogout);
            this.Load += Main_Load;
        }
    }
}
