import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const transporter = nodemailer.createTransport({
	service: "Gmail",
	auth: {
		user: process.env.EMAIL_USER,
		pass: process.env.EMAIL_PASS,
	},
});

export const sendResetEmail = async (to, resetLink) => {
	await transporter.sendMail({
		from: `"CHATTRIX" <${process.env.EMAIL_USER}>`,
		to,
		subject: "Reset Your Password",
		html: `<p>Click <a href="${resetLink}">here to reset</a> your password. Link is valid for 15 minutes.</p>`,
	});
};
