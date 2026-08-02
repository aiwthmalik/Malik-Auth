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

        private void InitializeComponent()
        {
            this.txtUsername = new System.Windows.Forms.TextBox();
            this.txtPassword = new System.Windows.Forms.TextBox();
            this.txtLicenseKey = new System.Windows.Forms.TextBox();
            this.btnRegister = new System.Windows.Forms.Button();
            this.btnBackToLogin = new System.Windows.Forms.Button();
            this.label1 = new System.Windows.Forms.Label();
            this.label2 = new System.Windows.Forms.Label();
            this.label3 = new System.Windows.Forms.Label();
            this.lblTitle = new System.Windows.Forms.Label();
            this.SuspendLayout();

            // txtUsername
            this.txtUsername.Font = new System.Drawing.Font("Segoe UI", 10F);
            this.txtUsername.Location = new System.Drawing.Point(130, 70);
            this.txtUsername.Name = "txtUsername";
            this.txtUsername.Size = new System.Drawing.Size(200, 27);
            this.txtUsername.TabIndex = 0;
            this.txtUsername.PlaceholderText = "Choose a username";

            // txtPassword
            this.txtPassword.Font = new System.Drawing.Font("Segoe UI", 10F);
            this.txtPassword.Location = new System.Drawing.Point(130, 110);
            this.txtPassword.Name = "txtPassword";
            this.txtPassword.Size = new System.Drawing.Size(200, 27);
            this.txtPassword.TabIndex = 1;
            this.txtPassword.UseSystemPasswordChar = true;
            this.txtPassword.PlaceholderText = "Create a password";

            // txtLicenseKey
            this.txtLicenseKey.Font = new System.Drawing.Font("Segoe UI", 10F);
            this.txtLicenseKey.Location = new System.Drawing.Point(130, 150);
            this.txtLicenseKey.Name = "txtLicenseKey";
            this.txtLicenseKey.Size = new System.Drawing.Size(200, 27);
            this.txtLicenseKey.TabIndex = 2;
            this.txtLicenseKey.PlaceholderText = "MALIK-XXXX-XXXX-XXXX-XXXX";

            // btnRegister
            this.btnRegister.BackColor = System.Drawing.Color.FromArgb(79, 70, 229);
            this.btnRegister.FlatStyle = System.Windows.Forms.FlatStyle.Flat;
            this.btnRegister.Font = new System.Drawing.Font("Segoe UI", 10F, System.Drawing.FontStyle.Bold);
            this.btnRegister.ForeColor = System.Drawing.Color.White;
            this.btnRegister.Location = new System.Drawing.Point(130, 200);
            this.btnRegister.Name = "btnRegister";
            this.btnRegister.Size = new System.Drawing.Size(200, 40);
            this.btnRegister.TabIndex = 3;
            this.btnRegister.Text = "REGISTER";
            this.btnRegister.UseVisualStyleBackColor = false;
            this.btnRegister.Click += new System.EventHandler(this.BtnRegister_Click);

            // btnBackToLogin
            this.btnBackToLogin.FlatStyle = System.Windows.Forms.FlatStyle.Flat;
            this.btnBackToLogin.Font = new System.Drawing.Font("Segoe UI", 9F);
            this.btnBackToLogin.ForeColor = System.Drawing.Color.FromArgb(79, 70, 229);
            this.btnBackToLogin.Location = new System.Drawing.Point(130, 255);
            this.btnBackToLogin.Name = "btnBackToLogin";
            this.btnBackToLogin.Size = new System.Drawing.Size(200, 30);
            this.btnBackToLogin.TabIndex = 4;
            this.btnBackToLogin.Text = "Already have an account? Login";
            this.btnBackToLogin.UseVisualStyleBackColor = true;
            this.btnBackToLogin.Click += new System.EventHandler(this.BtnBackToLogin_Click);

            // label1
            this.label1.AutoSize = true;
            this.label1.Font = new System.Drawing.Font("Segoe UI", 10F);
            this.label1.Location = new System.Drawing.Point(40, 73);
            this.label1.Name = "label1";
            this.label1.Size = new System.Drawing.Size(78, 23);
            this.label1.TabIndex = 5;
            this.label1.Text = "Username:";

            // label2
            this.label2.AutoSize = true;
            this.label2.Font = new System.Drawing.Font("Segoe UI", 10F);
            this.label2.Location = new System.Drawing.Point(40, 113);
            this.label2.Name = "label2";
            this.label2.Size = new System.Drawing.Size(73, 23);
            this.label2.TabIndex = 6;
            this.label2.Text = "Password:";

            // label3
            this.label3.AutoSize = true;
            this.label3.Font = new System.Drawing.Font("Segoe UI", 10F);
            this.label3.Location = new System.Drawing.Point(40, 153);
            this.label3.Name = "label3";
            this.label3.Size = new System.Drawing.Size(91, 23);
            this.label3.TabIndex = 7;
            this.label3.Text = "License Key:";

            // lblTitle
            this.lblTitle.AutoSize = true;
            this.lblTitle.Font = new System.Drawing.Font("Segoe UI", 18F, System.Drawing.FontStyle.Bold);
            this.lblTitle.ForeColor = System.Drawing.Color.FromArgb(79, 70, 229);
            this.lblTitle.Location = new System.Drawing.Point(100, 20);
            this.lblTitle.Name = "lblTitle";
            this.lblTitle.Size = new System.Drawing.Size(190, 41);
            this.lblTitle.TabIndex = 8;
            this.lblTitle.Text = "Create Account";

            // Register
            this.AutoScaleDimensions = new System.Drawing.SizeF(8F, 20F);
            this.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
            this.BackColor = System.Drawing.Color.FromArgb(248, 250, 252);
            this.ClientSize = new System.Drawing.Size(400, 330);
            this.Controls.Add(this.lblTitle);
            this.Controls.Add(this.label3);
            this.Controls.Add(this.label2);
            this.Controls.Add(this.label1);
            this.Controls.Add(this.btnBackToLogin);
            this.Controls.Add(this.btnRegister);
            this.Controls.Add(this.txtLicenseKey);
            this.Controls.Add(this.txtPassword);
            this.Controls.Add(this.txtUsername);
            this.FormBorderStyle = System.Windows.Forms.FormBorderStyle.FixedDialog;
            this.MaximizeBox = false;
            this.Name = "Register";
            this.StartPosition = System.Windows.Forms.FormStartPosition.CenterScreen;
            this.Text = "MalikAuth - Register";
            this.ResumeLayout(false);
            this.PerformLayout();
        }

        private System.Windows.Forms.TextBox txtUsername;
        private System.Windows.Forms.TextBox txtPassword;
        private System.Windows.Forms.TextBox txtLicenseKey;
        private System.Windows.Forms.Button btnRegister;
        private System.Windows.Forms.Button btnBackToLogin;
        private System.Windows.Forms.Label label1;
        private System.Windows.Forms.Label label2;
        private System.Windows.Forms.Label label3;
        private System.Windows.Forms.Label lblTitle;
    }
}
