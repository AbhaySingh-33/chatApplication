import { EmailConfigError, EmailDeliveryError } from "./errors.js";
import { EMAIL_TIMEOUT_MS, getTransporters, getDefaultFromAddress } from "./transporter.js";
import { verificationTemplate, resetPasswordTemplate } from "./templates.js";

export { EmailConfigError, EmailDeliveryError } from "./errors.js";
export { getTransporter, getTransporters, createSmtpTransporter, createBrevoTransporter } from "./transporter.js";

export const getClientUrl = () => process.env.CLIENT_URL || process.env.FRONTEND_URL;

const withTimeout = (promise, timeoutMs, message) =>
	Promise.race([
		promise,
		new Promise((_, reject) =>
			setTimeout(() => reject(new EmailDeliveryError(message)), timeoutMs)
		),
	]);

export const sendEmail = async ({ to, subject, html }) => {
	try {
		const activeTransporters = await getTransporters();
		let lastError;

		for (const { provider, transporter } of activeTransporters) {
			try {
				await withTimeout(
					transporter.sendMail({ from: getDefaultFromAddress(), to, subject, html }),
					EMAIL_TIMEOUT_MS,
					`Email delivery timed out after ${EMAIL_TIMEOUT_MS}ms`
				);
				console.info(`[email] Delivered via ${provider}; to=${Array.isArray(to) ? to.join(",") : to}; subject=${subject}`);
				return;
			} catch (providerError) {
				lastError = new EmailDeliveryError(
					`Email delivery via ${provider} failed: ${providerError.message}`,
					providerError
				);
			}
		}

		throw lastError || new EmailDeliveryError("Failed to send email through configured providers");
	} catch (error) {
		if (error instanceof EmailConfigError || error instanceof EmailDeliveryError) throw error;
		throw new EmailDeliveryError("Failed to send email", error);
	}
};

export const sendVerificationEmail = async ({ to, fullName, verificationLink }) => {
	await sendEmail({
		to,
		subject: "✅ Verify your CHATTRIX account",
		html: verificationTemplate({ fullName, to, verificationLink }),
	});
};

export const sendResetEmail = async (to, resetLink) => {
	await sendEmail({
		to,
		subject: "🔐 Reset your CHATTRIX password",
		html: resetPasswordTemplate({ resetLink }),
	});
};
