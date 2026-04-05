import crypto from "crypto";
import { Client, ID, Messaging, Users } from "node-appwrite";
import dotenv from "dotenv";
import { EmailConfigError, EmailDeliveryError } from "./errors.js";

dotenv.config();

export const EMAIL_TIMEOUT_MS = Number(process.env.EMAIL_TIMEOUT_MS || 10000);

const APPWRITE_TARGET_TYPE_EMAIL = "email";

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
		process.env.APPWRITE_FROM_EMAIL;

	if (!senderValue) {
		throw new EmailConfigError("Missing EMAIL_FROM or EMAIL_FROM_ADDRESS environment variable");
	}

	const sender = parseFromAddress(senderValue);
	return `"${sender.name}" <${sender.email}>`;
};

const getAppwriteConfig = () => {
	const endpoint = process.env.APPWRITE_ENDPOINT;
	const projectId = process.env.APPWRITE_PROJECT_ID;
	const apiKey = process.env.APPWRITE_API_KEY;
	const providerId = process.env.APPWRITE_EMAIL_PROVIDER_ID;

	if (!endpoint || !projectId || !apiKey) {
		throw new EmailConfigError(
			"Missing APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID, or APPWRITE_API_KEY environment variable"
		);
	}

	return { endpoint, projectId, apiKey, providerId };
};

const normalizeRecipients = (to) => {
	if (Array.isArray(to)) {
		return [...new Set(to.map((entry) => String(entry).trim().toLowerCase()).filter(Boolean))];
	}

	const value = String(to || "").trim().toLowerCase();
	return value ? [value] : [];
};

const toStableHash = (value) => crypto.createHash("sha256").update(value).digest("hex");

const recipientToIds = (email) => {
	const hash = toStableHash(email);
	const targetHash = toStableHash(`${email}:email-target`);
	return {
		userId: `mailusr_${hash.slice(0, 24)}`,
		targetId: `mailtgt_${targetHash.slice(0, 24)}`,
	};
};

const isNotFoundError = (error) => error?.code === 404 || error?.response?.status === 404;
const isConflictError = (error) => error?.code === 409 || error?.response?.status === 409;

let appwriteClients;

const getAppwriteClients = () => {
	if (appwriteClients) {
		return appwriteClients;
	}

	const { endpoint, projectId, apiKey } = getAppwriteConfig();
	const client = new Client().setEndpoint(endpoint).setProject(projectId).setKey(apiKey);

	appwriteClients = {
		users: new Users(client),
		messaging: new Messaging(client),
	};

	return appwriteClients;
};

const pickExistingEmailTarget = (targets, email) => {
	const normalizedEmail = String(email).trim().toLowerCase();
	return targets.find(
		(target) =>
			target?.providerType === APPWRITE_TARGET_TYPE_EMAIL &&
			String(target?.identifier || "").trim().toLowerCase() === normalizedEmail
	);
};

const ensureEmailTarget = async ({ users, email, providerId }) => {
	const { userId, targetId } = recipientToIds(email);

	try {
		await users.get({ userId });
	} catch (error) {
		if (!isNotFoundError(error)) {
			throw error;
		}

		try {
			await users.create({
				userId,
				email,
				password: `${toStableHash(email).slice(0, 16)}Aa1!`,
				name: "CHATTRIX Mail Recipient",
			});
		} catch (createError) {
			if (!isConflictError(createError)) {
				throw createError;
			}
		}
	}

	let targets = [];
	try {
		const listed = await users.listTargets({ userId });
		targets = listed?.targets || [];
	} catch (error) {
		if (!isNotFoundError(error)) {
			throw error;
		}
	}

	const existingEmailTarget = pickExistingEmailTarget(targets, email);
	if (existingEmailTarget?.$id) {
		const updatePayload = { userId, targetId: existingEmailTarget.$id, identifier: email };
		if (providerId) {
			updatePayload.providerId = providerId;
		}
		await users.updateTarget(updatePayload);
		return existingEmailTarget.$id;
	}

	const createPayload = {
		userId,
		targetId,
		providerType: APPWRITE_TARGET_TYPE_EMAIL,
		identifier: email,
		name: "Primary email",
	};
	if (providerId) {
		createPayload.providerId = providerId;
	}

	try {
		await users.createTarget(createPayload);
		return targetId;
	} catch (createError) {
		if (!isConflictError(createError)) {
			throw createError;
		}

		const refreshed = await users.listTargets({ userId });
		const fallbackTarget = pickExistingEmailTarget(refreshed?.targets || [], email);
		if (fallbackTarget?.$id) {
			return fallbackTarget.$id;
		}

		throw new EmailDeliveryError("Failed to resolve an Appwrite email target for recipient", createError);
	}
};

export const createAppwriteTransporter = () => {
	const { providerId } = getAppwriteConfig();

	return {
		provider: "appwrite",
		verify: async () => true,
		sendMail: async ({ to, subject, html }) => {
			try {
				const recipients = normalizeRecipients(to);
				if (!recipients.length) {
					throw new EmailDeliveryError("No valid recipient provided");
				}

				const { users, messaging } = getAppwriteClients();
				const targets = await Promise.all(
					recipients.map((email) => ensureEmailTarget({ users, email, providerId }))
				);

				const result = await messaging.createEmail({
					messageId: ID.unique(),
					subject,
					content: html,
					targets,
					html: true,
					draft: false,
				});

				return {
					messageId: result?.$id || result?.messageId || "appwrite-message",
					accepted: recipients,
					rejected: [],
					response: "queued",
				};
			} catch (error) {
				throw new EmailDeliveryError(
					`Failed to send email via Appwrite: ${error.message}`,
					error
				);
			}
		},
	};
};

export const createSmtpTransporter = () => createAppwriteTransporter();

export const createBrevoTransporter = () => createAppwriteTransporter();

let transporters;

const initTransporters = async () => {
	const candidates = [{ provider: "appwrite", transporter: createAppwriteTransporter() }];

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
		throw new EmailDeliveryError("Failed to initialize configured Appwrite email provider");
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
	appwriteClients = null;
};
