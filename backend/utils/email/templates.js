const escapeHtml = (value) =>
	String(value ?? "")
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/\"/g, "&quot;")
		.replace(/'/g, "&#39;");

const CTA_BASE_STYLE =
	"display:inline-block;padding:14px 28px;border-radius:999px;color:#ffffff;font-size:14px;font-weight:700;letter-spacing:0.2px;text-decoration:none;";

const baseTemplate = ({ preheader, eyebrow, title, subtitle, accentStart, accentEnd, content }) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>CHATTRIX</title>
</head>
<body style="margin:0;padding:0;background:#f4f6fb;font-family:'Segoe UI',Arial,sans-serif;color:#0f172a;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(preheader)}</div>
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:28px 12px;background:#f4f6fb;">
    <tr>
      <td align="center">
        <table width="620" cellpadding="0" cellspacing="0" style="max-width:620px;background:#ffffff;border:1px solid #e2e8f0;border-radius:20px;overflow:hidden;box-shadow:0 20px 50px rgba(15,23,42,0.08);">
          <tr>
            <td style="padding:18px 32px;background:#0f172a;">
              <span style="display:inline-block;padding:6px 10px;border-radius:999px;background:rgba(255,255,255,0.14);font-size:11px;font-weight:600;letter-spacing:0.4px;color:#e2e8f0;">${escapeHtml(eyebrow)}</span>
            </td>
          </tr>
          <tr>
            <td style="padding:34px 32px 0;background:linear-gradient(135deg, ${accentStart}, ${accentEnd});">
              <h1 style="margin:0;color:#ffffff;font-size:30px;line-height:1.2;">${escapeHtml(title)}</h1>
              <p style="margin:10px 0 0;color:rgba(255,255,255,0.9);font-size:15px;line-height:1.6;">${escapeHtml(subtitle)}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:30px 32px 34px;background:#ffffff;">${content}</td>
          </tr>
          <tr>
            <td style="padding:18px 32px 28px;background:#f8fafc;border-top:1px solid #e2e8f0;">
              <p style="margin:0;color:#475569;font-size:12px;line-height:1.6;">This is an automated transactional email from CHATTRIX. Please do not reply.</p>
              <p style="margin:8px 0 0;color:#64748b;font-size:12px;">© ${new Date().getFullYear()} CHATTRIX. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

export const verificationTemplate = ({ fullName, to, verificationLink }) => {
	const safeName = escapeHtml(fullName || "there");
	const safeEmail = escapeHtml(to);
	const safeLink = escapeHtml(verificationLink);

	return baseTemplate({
		preheader: "Verify your CHATTRIX account to unlock secure messaging.",
		eyebrow: "Account Verification",
		title: "Welcome to CHATTRIX",
		subtitle: "Confirm your email address to activate your account.",
		accentStart: "#0f766e",
		accentEnd: "#155e75",
		content: `
      <p style="margin:0 0 12px;font-size:16px;line-height:1.7;color:#0f172a;">Hi ${safeName},</p>
      <p style="margin:0 0 24px;font-size:15px;line-height:1.8;color:#334155;">Your account has been created successfully. Verify your email to start chatting securely in CHATTRIX.</p>
      <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;">
        <tr>
          <td style="padding:18px 20px;">
            <p style="margin:0 0 6px;font-size:12px;letter-spacing:0.4px;text-transform:uppercase;color:#64748b;">Email</p>
            <p style="margin:0;font-size:15px;color:#0f172a;">${safeEmail}</p>
          </td>
        </tr>
      </table>
      <div style="text-align:center;margin:0 0 20px;">
        <a href="${safeLink}" style="${CTA_BASE_STYLE}background:linear-gradient(135deg,#0f766e,#155e75);">Verify Email Address</a>
      </div>
      <p style="margin:0 0 8px;font-size:13px;color:#475569;line-height:1.7;">This verification link expires in 24 hours.</p>
      <p style="margin:0;font-size:12px;color:#64748b;line-height:1.7;word-break:break-all;">If the button does not work, copy and paste this URL into your browser:<br/>${safeLink}</p>`,
	});
};

export const resetPasswordTemplate = ({ resetLink }) => {
	const safeLink = escapeHtml(resetLink);

	return baseTemplate({
		preheader: "Reset your CHATTRIX password securely.",
		eyebrow: "Security Alert",
		title: "Reset Your Password",
		subtitle: "A request was received to change your CHATTRIX password.",
		accentStart: "#991b1b",
		accentEnd: "#b91c1c",
		content: `
      <p style="margin:0 0 18px;font-size:15px;line-height:1.8;color:#334155;">Use the secure button below to create a new password for your account.</p>
      <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;background:#fef2f2;border:1px solid #fecaca;border-radius:14px;">
        <tr>
          <td style="padding:16px 18px;">
            <p style="margin:0;font-size:13px;line-height:1.7;color:#7f1d1d;">If you did not request a password reset, you can safely ignore this message. Your password will remain unchanged.</p>
          </td>
        </tr>
      </table>
      <div style="text-align:center;margin:0 0 20px;">
        <a href="${safeLink}" style="${CTA_BASE_STYLE}background:linear-gradient(135deg,#991b1b,#b91c1c);">Reset Password</a>
      </div>
      <p style="margin:0 0 8px;font-size:13px;color:#475569;line-height:1.7;">For security, this link expires in 15 minutes.</p>
      <p style="margin:0;font-size:12px;color:#64748b;line-height:1.7;word-break:break-all;">If the button does not work, copy and paste this URL into your browser:<br/>${safeLink}</p>`,
	});
};
