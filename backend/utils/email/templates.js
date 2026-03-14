const baseTemplate = (content) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>CHATTRIX</title>
</head>
<body style="margin:0;padding:0;background:#0f0f0f;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f0f0f;padding:40px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#1a1a2e;border-radius:16px;overflow:hidden;border:1px solid #2d2d4e;">
        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#6c63ff 0%,#a855f7 100%);padding:36px 40px;text-align:center;">
            <div style="font-size:28px;font-weight:800;color:#fff;letter-spacing:2px;">💬 CHATTRIX</div>
            <div style="color:rgba(255,255,255,0.8);font-size:13px;margin-top:6px;letter-spacing:1px;">Real-Time Communication Platform</div>
          </td>
        </tr>
        <!-- Body -->
        <tr><td style="padding:40px;color:#e2e8f0;">${content}</td></tr>
        <!-- Footer -->
        <tr>
          <td style="background:#111827;padding:24px 40px;text-align:center;border-top:1px solid #2d2d4e;">
            <p style="margin:0;color:#6b7280;font-size:12px;">© ${new Date().getFullYear()} CHATTRIX · All rights reserved</p>
            <p style="margin:8px 0 0;color:#4b5563;font-size:11px;">This is an automated message, please do not reply.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

export const verificationTemplate = ({ fullName, to, verificationLink }) =>
	baseTemplate(`
    <h2 style="margin:0 0 8px;font-size:22px;color:#fff;">Welcome aboard, ${fullName}! 🎉</h2>
    <p style="margin:0 0 24px;color:#9ca3af;font-size:15px;">You're one step away from joining CHATTRIX. Verify your email to activate your account.</p>
    <div style="background:#111827;border-radius:12px;padding:24px;margin-bottom:28px;border:1px solid #2d2d4e;">
      <p style="margin:0 0 6px;color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Account Details</p>
      <p style="margin:0;color:#e2e8f0;font-size:15px;">📧 ${to}</p>
    </div>
    <div style="text-align:center;margin-bottom:28px;">
      <a href="${verificationLink}" style="display:inline-block;background:linear-gradient(135deg,#6c63ff,#a855f7);color:#fff;text-decoration:none;padding:14px 36px;border-radius:50px;font-size:15px;font-weight:700;letter-spacing:0.5px;">✅ Verify My Email</a>
    </div>
    <div style="background:#1f2937;border-radius:8px;padding:16px;border-left:3px solid #6c63ff;">
      <p style="margin:0;color:#9ca3af;font-size:13px;">⏰ This link expires in <strong style="color:#a855f7;">24 hours</strong>. If you didn't create an account, you can safely ignore this email.</p>
    </div>
    <p style="margin:24px 0 0;color:#6b7280;font-size:12px;">Or copy this link: <span style="color:#6c63ff;word-break:break-all;">${verificationLink}</span></p>`);

export const resetPasswordTemplate = ({ resetLink }) =>
	baseTemplate(`
    <h2 style="margin:0 0 8px;font-size:22px;color:#fff;">Password Reset Request 🔐</h2>
    <p style="margin:0 0 24px;color:#9ca3af;font-size:15px;">We received a request to reset your CHATTRIX password. Click the button below to create a new one.</p>
    <div style="background:#2d1b1b;border-radius:12px;padding:16px 20px;margin-bottom:28px;border:1px solid #7f1d1d;">
      <p style="margin:0;color:#fca5a5;font-size:13px;">⚠️ If you didn't request this, please ignore this email. Your password will remain unchanged.</p>
    </div>
    <div style="text-align:center;margin-bottom:28px;">
      <a href="${resetLink}" style="display:inline-block;background:linear-gradient(135deg,#ef4444,#dc2626);color:#fff;text-decoration:none;padding:14px 36px;border-radius:50px;font-size:15px;font-weight:700;letter-spacing:0.5px;">🔑 Reset My Password</a>
    </div>
    <div style="background:#1f2937;border-radius:8px;padding:16px;border-left:3px solid #ef4444;">
      <p style="margin:0;color:#9ca3af;font-size:13px;">⏰ This link expires in <strong style="color:#ef4444;">15 minutes</strong> for your security.</p>
    </div>
    <p style="margin:24px 0 0;color:#6b7280;font-size:12px;">Or copy this link: <span style="color:#6c63ff;word-break:break-all;">${resetLink}</span></p>`);
