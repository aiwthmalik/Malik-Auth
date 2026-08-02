namespace MalikAuthApp
{
    partial class Main
    {
        private System.ComponentModel.IContainer components = null;

        protected override void Dispose(bool disposing)
        {
            if (disposing && (components != null))
            {
                components.Dispose();
            }
            base.Dispose(disposing);
        }

        #region Windows Form Designer generated code

        private void InitializeComponent()
        {
            this.lblHeader = new System.Windows.Forms.Label();
            this.lblWelcome = new System.Windows.Forms.Label();
            this.infoBox = new System.Windows.Forms.Panel();
            this.lblRole = new System.Windows.Forms.Label();
            this.lblSession = new System.Windows.Forms.Label();
            this.lblHWID = new System.Windows.Forms.Label();
            this.btnLogout = new System.Windows.Forms.Button();
            this.infoBox.SuspendLayout();
            this.SuspendLayout();
            // 
            // lblHeader
            // 
            this.lblHeader.AutoSize = true;
            this.lblHeader.Font = new System.Drawing.Font("Segoe UI", 16F, System.Drawing.FontStyle.Bold);
            this.lblHeader.ForeColor = System.Drawing.Color.FromArgb(((int)(((byte)(79)))), ((int)(((byte)(70)))), ((int)(((byte)(229)))));
            this.lblHeader.Location = new System.Drawing.Point(30, 25);
            this.lblHeader.Name = "lblHeader";
            this.lblHeader.Size = new System.Drawing.Size(306, 30);
            this.lblHeader.TabIndex = 0;
            this.lblHeader.Text = "Main Application Dashboard";
            // 
            // lblWelcome
            // 
            this.lblWelcome.AutoSize = true;
            this.lblWelcome.Font = new System.Drawing.Font("Segoe UI", 12F, System.Drawing.FontStyle.Bold);
            this.lblWelcome.ForeColor = System.Drawing.Color.FromArgb(((int)(((byte)(15)))), ((int)(((byte)(23)))), ((int)(((byte)(42)))));
            this.lblWelcome.Location = new System.Drawing.Point(30, 65);
            this.lblWelcome.Name = "lblWelcome";
            this.lblWelcome.Size = new System.Drawing.Size(130, 21);
            this.lblWelcome.TabIndex = 1;
            this.lblWelcome.Text = "Welcome, User!";
            // 
            // infoBox
            // 
            this.infoBox.BackColor = System.Drawing.Color.White;
            this.infoBox.BorderStyle = System.Windows.Forms.BorderStyle.FixedSingle;
            this.infoBox.Controls.Add(this.lblRole);
            this.infoBox.Controls.Add(this.lblSession);
            this.infoBox.Controls.Add(this.lblHWID);
            this.infoBox.Location = new System.Drawing.Point(30, 100);
            this.infoBox.Name = "infoBox";
            this.infoBox.Size = new System.Drawing.Size(405, 120);
            this.infoBox.TabIndex = 2;
            // 
            // lblRole
            // 
            this.lblRole.AutoSize = true;
            this.lblRole.Font = new System.Drawing.Font("Segoe UI", 9.5F);
            this.lblRole.ForeColor = System.Drawing.Color.FromArgb(((int)(((byte)(51)))), ((int)(((byte)(65)))), ((int)(((byte)(85)))));
            this.lblRole.Location = new System.Drawing.Point(15, 15);
            this.lblRole.Name = "lblRole";
            this.lblRole.Size = new System.Drawing.Size(97, 17);
            this.lblRole.TabIndex = 0;
            this.lblRole.Text = "Role: Loading...";
            // 
            // lblSession
            // 
            this.lblSession.AutoSize = true;
            this.lblSession.Font = new System.Drawing.Font("Consolas", 9F);
            this.lblSession.ForeColor = System.Drawing.Color.FromArgb(((int)(((byte)(79)))), ((int)(((byte)(70)))), ((int)(((byte)(229)))));
            this.lblSession.Location = new System.Drawing.Point(15, 45);
            this.lblSession.Name = "lblSession";
            this.lblSession.Size = new System.Drawing.Size(140, 14);
            this.lblSession.TabIndex = 1;
            this.lblSession.Text = "Session ID: Loading...";
            // 
            // lblHWID
            // 
            this.lblHWID.AutoSize = true;
            this.lblHWID.Font = new System.Drawing.Font("Consolas", 9F);
            this.lblHWID.ForeColor = System.Drawing.Color.FromArgb(((int)(((byte)(16)))), ((int)(((byte)(185)))), ((int)(((byte)(129)))));
            this.lblHWID.Location = new System.Drawing.Point(15, 75);
            this.lblHWID.Name = "lblHWID";
            this.lblHWID.Size = new System.Drawing.Size(238, 14);
            this.lblHWID.TabIndex = 2;
            this.lblHWID.Text = "Hardware HWID: Fingerprint Verified";
            // 
            // btnLogout
            // 
            this.btnLogout.BackColor = System.Drawing.Color.FromArgb(((int)(((byte)(225)))), ((int)(((byte)(29)))), ((int)(((byte)(72)))));
            this.btnLogout.Cursor = System.Windows.Forms.Cursors.Hand;
            this.btnLogout.FlatAppearance.BorderSize = 0;
            this.btnLogout.FlatStyle = System.Windows.Forms.FlatStyle.Flat;
            this.btnLogout.Font = new System.Drawing.Font("Segoe UI", 9.5F, System.Drawing.FontStyle.Bold);
            this.btnLogout.ForeColor = System.Drawing.Color.White;
            this.btnLogout.Location = new System.Drawing.Point(30, 235);
            this.btnLogout.Name = "btnLogout";
            this.btnLogout.Size = new System.Drawing.Size(130, 36);
            this.btnLogout.TabIndex = 3;
            this.btnLogout.Text = "LOG OUT";
            this.btnLogout.UseVisualStyleBackColor = false;
            this.btnLogout.Click += new System.EventHandler(this.BtnLogout_Click);
            // 
            // Main
            // 
            this.AutoScaleDimensions = new System.Drawing.SizeF(6F, 13F);
            this.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
            this.BackColor = System.Drawing.Color.FromArgb(((int)(((byte)(248)))), ((int)(((byte)(250)))), ((int)(((byte)(252)))));
            this.ClientSize = new System.Drawing.Size(464, 291);
            this.Controls.Add(this.lblHeader);
            this.Controls.Add(this.lblWelcome);
            this.Controls.Add(this.infoBox);
            this.Controls.Add(this.btnLogout);
            this.FormBorderStyle = System.Windows.Forms.FormBorderStyle.FixedDialog;
            this.MaximizeBox = false;
            this.Name = "Main";
            this.StartPosition = System.Windows.Forms.FormStartPosition.CenterScreen;
            this.Text = "MalikAuth Protected Main Dashboard";
            this.Load += new System.EventHandler(this.Main_Load);
            this.infoBox.ResumeLayout(false);
            this.infoBox.PerformLayout();
            this.ResumeLayout(false);
            this.PerformLayout();
        }

        #endregion

        private System.Windows.Forms.Label lblHeader;
        private System.Windows.Forms.Label lblWelcome;
        private System.Windows.Forms.Panel infoBox;
        private System.Windows.Forms.Label lblRole;
        private System.Windows.Forms.Label lblSession;
        private System.Windows.Forms.Label lblHWID;
        private System.Windows.Forms.Button btnLogout;
    }
}
