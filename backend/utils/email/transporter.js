import nodemailer from "nodemailer";
import axios from "axios";
import dotenv from "dotenv";
import { EmailConfigError, EmailDeliveryError } from "./errors.js";

dotenv.config();

export const EMAIL_TIMEOUT_MS = Number(process.env.EMAIL_TIMEOUT_MS || 10000);

export const parseFromAddress = (from) => {
	const fromMatch = from.match(/^(.+?)\s*<(.+?)>$/);
	const defaultSenderName = process.env.EMAIL_SENDER_NAME || "CHATTRIX";
	return {
		name: fromMatch?.[1]?.trim().replace(/"/g, "") || defaultSenderName,
		email: fromMatch?.[2]?.trim() || from,
	};
};

export const getDefaultFromAddress = () => {
	const senderValue =
		process.env.EMAIL_FROM ||
		process.env.EMAIL_FROM_ADDRESS ||
		process.env.BREVO_SENDER_EMAIL ||
		process.env.SMTP_FROM_ADDRESS ||
		process.env.EMAIL_USER ||
		process.env.SMTP_USER;

	if (!senderValue) {
		throw new EmailConfigError(
			"Missing EMAIL_FROM_ADDRESS, BREVO_SENDER_EMAIL, SMTP_FROM_ADDRESS, EMAIL_USER, or SMTP_USER environment variable"
		);
	}

	const sender = parseFromAddress(senderValue);
	return `"${sender.name}" <${sender.email}>`;
};

export const createBrevoTransporter = () => {
	const apiKey = process.env.BREVO_API_KEY;
	if (!apiKey) throw new EmailConfigError("Missing BREVO_API_KEY environment variable");

	return {
		verify: async () => true,
		sendMail: async ({ from, to, subject, html }) => {
			try {
				const sender = parseFromAddress(from);
				const recipients = Array.isArray(to) ? to.map((email) => ({ email })) : [{ email: to }];

				const response = await axios.post(
					"https://api.brevo.com/v3/smtp/email",
					{ sender, to: recipients, subject, htmlContent: html },
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

export const createSmtpTransporter = () => {
	const user = process.env.SMTP_USER || process.env.EMAIL_USER;
	const pass = process.env.SMTP_PASSWORD || process.env.EMAIL_PASS;

	if (!user || !pass) {
		throw new EmailConfigError("Missing SMTP or email credentials environment variables");
	}

	const port = Number(process.env.SMTP_PORT || process.env.EMAIL_PORT || 587);
	const secure = process.env.SMTP_SECURE === "true" || process.env.EMAIL_SECURE === "true" || port === 465;
	const host = process.env.SMTP_HOST || process.env.EMAIL_HOST;
	const service = process.env.SMTP_SERVICE || process.env.EMAIL_SERVICE;

	const config = {
		auth: { user, pass },
		connectionTimeout: EMAIL_TIMEOUT_MS,
		greetingTimeout: EMAIL_TIMEOUT_MS,
		socketTimeout: EMAIL_TIMEOUT_MS,
		secure,
	};

	if (!host && !service) {
		throw new EmailConfigError("Missing SMTP_HOST or SMTP_SERVICE environment variable");
	}

	return host
		? nodemailer.createTransport({ ...config, host, port })
		: nodemailer.createTransport({ ...config, service });
};

const isSmtpConfigured = () => {
	const user = process.env.SMTP_USER || process.env.EMAIL_USER;
	const pass = process.env.SMTP_PASSWORD || process.env.EMAIL_PASS;
	const host = process.env.SMTP_HOST || process.env.EMAIL_HOST;
	const service = process.env.SMTP_SERVICE || process.env.EMAIL_SERVICE;
	return Boolean(user && pass && (host || service));
};

const isBrevoConfigured = () => Boolean(process.env.BREVO_API_KEY);

let transporters;

const initTransporters = async () => {
	const candidates = [];

	if (isSmtpConfigured()) {
		candidates.push({ provider: "smtp", transporter: createSmtpTransporter() });
	}

	if (isBrevoConfigured()) {
		candidates.push({ provider: "brevo", transporter: createBrevoTransporter() });
	}

	if (!candidates.length) {
		throw new EmailConfigError(
			"No email provider configured. Set SMTP_* credentials or BREVO_API_KEY"
		);
	}

	const healthy = [];
	for (const candidate of candidates) {
		try {
			if (typeof candidate.transporter.verify === "function") {
				await candidate.transporter.verify();
			}
			healthy.push(candidate);
		} catch (error) {
			// Try next provider when one provider fails verification.
		}
	}

	if (!healthy.length) {
		throw new EmailDeliveryError("Failed to initialize all configured email providers");
	}

	transporters = healthy;
	return transporters;
};

export const getTransporter = async () => {
	const activeTransporters = await getTransporters();
	return activeTransporters[0].transporter;
	};

export const getTransporters = async () => {
	if (!transporters) {
		await initTransporters();
	}
	return transporters;
};

export const resetTransporter = () => {
	transporters = null;
};
