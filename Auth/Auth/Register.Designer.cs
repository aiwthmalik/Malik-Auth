namespace MalikAuthApp
{
    partial class Register
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
            this.lblTitle = new System.Windows.Forms.Label();
            this.lblUser = new System.Windows.Forms.Label();
            this.txtUsername = new System.Windows.Forms.TextBox();
            this.lblPass = new System.Windows.Forms.Label();
            this.txtPassword = new System.Windows.Forms.TextBox();
            this.lblKey = new System.Windows.Forms.Label();
            this.txtLicenseKey = new System.Windows.Forms.TextBox();
            this.btnRegister = new System.Windows.Forms.Button();
            this.btnBackToLogin = new System.Windows.Forms.Button();
            this.SuspendLayout();
            // 
            // lblTitle
            // 
            this.lblTitle.AutoSize = true;
            this.lblTitle.Font = new System.Drawing.Font("Segoe UI", 16F, System.Drawing.FontStyle.Bold);
            this.lblTitle.ForeColor = System.Drawing.Color.FromArgb(((int)(((byte)(15)))), ((int)(((byte)(23)))), ((int)(((byte)(42)))));
            this.lblTitle.Location = new System.Drawing.Point(30, 20);
            this.lblTitle.Name = "lblTitle";
            this.lblTitle.Size = new System.Drawing.Size(211, 30);
            this.lblTitle.TabIndex = 0;
            this.lblTitle.Text = "MalikAuth Register";
            // 
            // lblUser
            // 
            this.lblUser.AutoSize = true;
            this.lblUser.Font = new System.Drawing.Font("Segoe UI", 9.5F, System.Drawing.FontStyle.Bold);
            this.lblUser.ForeColor = System.Drawing.Color.FromArgb(((int)(((byte)(51)))), ((int)(((byte)(65)))), ((int)(((byte)(85)))));
            this.lblUser.Location = new System.Drawing.Point(30, 65);
            this.lblUser.Name = "lblUser";
            this.lblUser.Size = new System.Drawing.Size(73, 17);
            this.lblUser.TabIndex = 1;
            this.lblUser.Text = "Username:";
            // 
            // txtUsername
            // 
            this.txtUsername.Font = new System.Drawing.Font("Segoe UI", 10F);
            this.txtUsername.Location = new System.Drawing.Point(30, 90);
            this.txtUsername.Name = "txtUsername";
            this.txtUsername.Size = new System.Drawing.Size(325, 25);
            this.txtUsername.TabIndex = 2;
            // 
            // lblPass
            // 
            this.lblPass.AutoSize = true;
            this.lblPass.Font = new System.Drawing.Font("Segoe UI", 9.5F, System.Drawing.FontStyle.Bold);
            this.lblPass.ForeColor = System.Drawing.Color.FromArgb(((int)(((byte)(51)))), ((int)(((byte)(65)))), ((int)(((byte)(85)))));
            this.lblPass.Location = new System.Drawing.Point(30, 130);
            this.lblPass.Name = "lblPass";
            this.lblPass.Size = new System.Drawing.Size(69, 17);
            this.lblPass.TabIndex = 3;
            this.lblPass.Text = "Password:";
            // 
            // txtPassword
            // 
            this.txtPassword.Font = new System.Drawing.Font("Segoe UI", 10F);
            this.txtPassword.Location = new System.Drawing.Point(30, 155);
            this.txtPassword.Name = "txtPassword";
            this.txtPassword.PasswordChar = '•';
            this.txtPassword.Size = new System.Drawing.Size(325, 25);
            this.txtPassword.TabIndex = 4;
            // 
            // lblKey
            // 
            this.lblKey.AutoSize = true;
            this.lblKey.Font = new System.Drawing.Font("Segoe UI", 9.5F, System.Drawing.FontStyle.Bold);
            this.lblKey.ForeColor = System.Drawing.Color.FromArgb(((int)(((byte)(51)))), ((int)(((byte)(65)))), ((int)(((byte)(85)))));
            this.lblKey.Location = new System.Drawing.Point(30, 195);
            this.lblKey.Name = "lblKey";
            this.lblKey.Size = new System.Drawing.Size(85, 17);
            this.lblKey.TabIndex = 5;
            this.lblKey.Text = "License Key:";
            // 
            // txtLicenseKey
            // 
            this.txtLicenseKey.Font = new System.Drawing.Font("Consolas", 10F);
            this.txtLicenseKey.Location = new System.Drawing.Point(30, 220);
            this.txtLicenseKey.Name = "txtLicenseKey";
            this.txtLicenseKey.Size = new System.Drawing.Size(325, 23);
            this.txtLicenseKey.TabIndex = 6;
            // 
            // btnRegister
            // 
            this.btnRegister.BackColor = System.Drawing.Color.FromArgb(((int)(((byte)(16)))), ((int)(((byte)(185)))), ((int)(((byte)(129)))));
            this.btnRegister.Cursor = System.Windows.Forms.Cursors.Hand;
            this.btnRegister.FlatAppearance.BorderSize = 0;
            this.btnRegister.FlatStyle = System.Windows.Forms.FlatStyle.Flat;
            this.btnRegister.Font = new System.Drawing.Font("Segoe UI", 9.5F, System.Drawing.FontStyle.Bold);
            this.btnRegister.ForeColor = System.Drawing.Color.White;
            this.btnRegister.Location = new System.Drawing.Point(30, 275);
            this.btnRegister.Name = "btnRegister";
            this.btnRegister.Size = new System.Drawing.Size(195, 38);
            this.btnRegister.TabIndex = 7;
            this.btnRegister.Text = "REGISTER & LOGIN";
            this.btnRegister.UseVisualStyleBackColor = false;
            this.btnRegister.Click += new System.EventHandler(this.BtnRegister_Click);
            // 
            // btnBackToLogin
            // 
            this.btnBackToLogin.BackColor = System.Drawing.Color.FromArgb(((int)(((byte)(226)))), ((int)(((byte)(232)))), ((int)(((byte)(240)))));
            this.btnBackToLogin.Cursor = System.Windows.Forms.Cursors.Hand;
            this.btnBackToLogin.FlatAppearance.BorderSize = 0;
            this.btnBackToLogin.FlatStyle = System.Windows.Forms.FlatStyle.Flat;
            this.btnBackToLogin.Font = new System.Drawing.Font("Segoe UI", 8.5F, System.Drawing.FontStyle.Bold);
            this.btnBackToLogin.ForeColor = System.Drawing.Color.FromArgb(((int)(((byte)(51)))), ((int)(((byte)(65)))), ((int)(((byte)(85)))));
            this.btnBackToLogin.Location = new System.Drawing.Point(235, 275);
            this.btnBackToLogin.Name = "btnBackToLogin";
            this.btnBackToLogin.Size = new System.Drawing.Size(120, 38);
            this.btnBackToLogin.TabIndex = 8;
            this.btnBackToLogin.Text = "BACK TO LOGIN";
            this.btnBackToLogin.UseVisualStyleBackColor = false;
            this.btnBackToLogin.Click += new System.EventHandler(this.BtnBackToLogin_Click);
            // 
            // Register
            // 
            this.AutoScaleDimensions = new System.Drawing.SizeF(6F, 13F);
            this.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
            this.BackColor = System.Drawing.Color.FromArgb(((int)(((byte)(248)))), ((int)(((byte)(250)))), ((int)(((byte)(252)))));
            this.ClientSize = new System.Drawing.Size(384, 341);
            this.Controls.Add(this.lblTitle);
            this.Controls.Add(this.lblUser);
            this.Controls.Add(this.txtUsername);
            this.Controls.Add(this.lblPass);
            this.Controls.Add(this.txtPassword);
            this.Controls.Add(this.lblKey);
            this.Controls.Add(this.txtLicenseKey);
            this.Controls.Add(this.btnRegister);
            this.Controls.Add(this.btnBackToLogin);
            this.FormBorderStyle = System.Windows.Forms.FormBorderStyle.FixedDialog;
            this.MaximizeBox = false;
            this.Name = "Register";
            this.StartPosition = System.Windows.Forms.FormStartPosition.CenterScreen;
            this.Text = "MalikAuth - Create Account";
            this.ResumeLayout(false);
            this.PerformLayout();
        }

        #endregion

        private System.Windows.Forms.Label lblTitle;
        private System.Windows.Forms.Label lblUser;
        private System.Windows.Forms.TextBox txtUsername;
        private System.Windows.Forms.Label lblPass;
        private System.Windows.Forms.TextBox txtPassword;
        private System.Windows.Forms.Label lblKey;
        private System.Windows.Forms.TextBox txtLicenseKey;
        private System.Windows.Forms.Button btnRegister;
        private System.Windows.Forms.Button btnBackToLogin;
    }
}
