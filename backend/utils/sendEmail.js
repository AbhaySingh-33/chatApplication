// Barrel re-export — all consumers import from here as before.
// Actual implementation lives in ./email/
export {
	EmailConfigError,
	EmailDeliveryError,
	getTransporter,
	getTransporters,
	createSmtpTransporter,
	createBrevoTransporter,
	getClientUrl,
	sendEmail,
	sendVerificationEmail,
	sendResetEmail,
} from "./email/index.js";
