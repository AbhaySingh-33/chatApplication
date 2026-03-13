import nodemailer from "nodemailer";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const EMAIL_TIMEOUT_MS = Number(process.env.EMAIL_TIMEOUT_MS || 10000);

export class EmailConfigError extends Error {
	constructor(message) {
		super(message);
		this.name = "EmailConfigError";
	}
}

export class EmailDeliveryError extends Error {
	constructor(message, cause) {
		super(message);
		this.name = "EmailDeliveryError";
		this.cause = cause;
	}
}

const parseFromAddress = (from) => {
	const fromMatch = from.match(/^(.+?)\s*<(.+?)>$/);
	const defaultSenderName = process.env.EMAIL_SENDER_NAME || "CHATTRIX";

	return {
		name: fromMatch?.[1]?.trim().replace(/"/g, "") || defaultSenderName,
		email: fromMatch?.[2]?.trim() || from,
	};
};

const getDefaultFromAddress = () => {
	const senderValue =
		process.env.EMAIL_FROM ||
		process.env.EMAIL_FROM_ADDRESS ||
		process.env.BREVO_SENDER_EMAIL ||
		process.env.EMAIL_USER ||
		process.env.SMTP_USER;

	if (!senderValue) {
		throw new EmailConfigError(
			"Missing EMAIL_FROM_ADDRESS, BREVO_SENDER_EMAIL, EMAIL_USER, or SMTP_USER environment variable"
		);
	}

	const sender = parseFromAddress(senderValue);
	return `"${sender.name}" <${sender.email}>`;
};

export const createBrevoTransporter = () => {
	const apiKey = process.env.BREVO_API_KEY;

	if (!apiKey) {
		throw new EmailConfigError("Missing BREVO_API_KEY environment variable");
	}

	return {
		verify: async () => true,
		sendMail: async ({ from, to, subject, html }) => {
			try {
				const sender = parseFromAddress(from);
				const recipients = Array.isArray(to)
					? to.map((email) => ({ email }))
					: [{ email: to }];

				const response = await axios.post(
					"https://api.brevo.com/v3/smtp/email",
					{
						sender,
						to: recipients,
						subject,
						htmlContent: html,
					},
					{
						headers: {
							"api-key": apiKey,
							"Content-Type": "application/json",
							accept: "application/json",
						},
						timeout: EMAIL_TIMEOUT_MS,
					}
				);

				return {
					messageId: response.data?.messageId || "brevo-success",
					accepted: Array.isArray(to) ? to : [to],
					rejected: [],
					response: "OK",
				};
			} catch (error) {
				throw new EmailDeliveryError(
					`Failed to send email via Brevo: ${error.response?.data?.message || error.message}`,
					error
				);
			}
		},
	};
};

const createSmtpTransporter = () => {
	const user = process.env.SMTP_USER || process.env.EMAIL_USER;
	const pass = process.env.SMTP_PASSWORD || process.env.EMAIL_PASS;

	if (!user || !pass) {
		throw new EmailConfigError("Missing SMTP or email credentials environment variables");
	}

	const port = Number(process.env.SMTP_PORT || process.env.EMAIL_PORT || 587);
	const secure = process.env.SMTP_SECURE === "true" || process.env.EMAIL_SECURE === "true" || port === 465;
	const host = process.env.SMTP_HOST || process.env.EMAIL_HOST;
	const service = process.env.SMTP_SERVICE || process.env.EMAIL_SERVICE || "Gmail";

	const config = {
		auth: { user, pass },
		connectionTimeout: EMAIL_TIMEOUT_MS,
		greetingTimeout: EMAIL_TIMEOUT_MS,
		socketTimeout: EMAIL_TIMEOUT_MS,
		secure,
	};

	if (host) {
		return nodemailer.createTransport({
			...config,
			host,
			port,
		});
	}

	return nodemailer.createTransport({
		...config,
		service,
	});
};

let transporter;

export const getTransporter = async () => {
	if (!transporter) {
		transporter = process.env.BREVO_API_KEY
			? createBrevoTransporter()
			: createSmtpTransporter();

		try {
			await transporter.verify();
		} catch (error) {
			transporter = null;
			if (error instanceof EmailConfigError || error instanceof EmailDeliveryError) {
				throw error;
			}

			throw new EmailDeliveryError("Failed to initialize email service", error);
		}
	}

	return transporter;
};

const withTimeout = (promise, timeoutMs, message) => {
	return Promise.race([
		promise,
		new Promise((_, reject) => {
			setTimeout(() => reject(new EmailDeliveryError(message)), timeoutMs);
		}),
	]);
};

export const getClientUrl = () => process.env.CLIENT_URL || process.env.FRONTEND_URL;

export const sendEmail = async ({ to, subject, html }) => {
	try {
		const activeTransporter = await getTransporter();
		await withTimeout(
			activeTransporter.sendMail({
				from: getDefaultFromAddress(),
				to,
				subject,
				html,
			}),
			EMAIL_TIMEOUT_MS,
			`Email delivery timed out after ${EMAIL_TIMEOUT_MS}ms`
		);
	} catch (error) {
		if (error instanceof EmailConfigError || error instanceof EmailDeliveryError) {
			throw error;
		}

		throw new EmailDeliveryError("Failed to send email", error);
	}
};

export const sendVerificationEmail = async ({ to, fullName, verificationLink }) => {
	await sendEmail({
		to,
		subject: "Welcome to ChatApp! Verify your email",
		html: `<p>Hi ${fullName},</p>
		<p>Thanks for signing up! Click <a href="${verificationLink}">here to verify</a> your email address.</p>
		<p>This link expires in 24 hours.</p>`,
	});
};

export const sendResetEmail = async (to, resetLink) => {
	await sendEmail({
		to,
		subject: "Reset Your Password",
		html: `<p>Click <a href="${resetLink}">here to reset</a> your password. Link is valid for 15 minutes.</p>`,
	});
};
