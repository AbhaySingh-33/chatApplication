// controllers/auth.controller.js
import User from "../models/user.model.js";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import {
  EmailConfigError,
  EmailDeliveryError,
  getClientUrl,
  sendResetEmail,
} from "../utils/sendEmail.js";

export const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: "No account found with this email" });
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expiry = Date.now() + 15 * 60 * 1000; // 15 minutes

    user.resetToken = token;
    user.resetTokenExpiry = expiry;
    await user.save();

    const clientUrl = getClientUrl();
    if (!clientUrl) {
      throw new EmailConfigError("Missing CLIENT_URL or FRONTEND_URL environment variable");
    }

    const resetLink = `${clientUrl}/reset-password/${token}`;
    await sendResetEmail(email, resetLink);

    res.status(200).json({ message: "Password reset link sent to your email" });
  } catch (err) {
    console.error("Error in requestPasswordReset:", err);
    if (err instanceof EmailConfigError || err instanceof EmailDeliveryError) {
      return res.status(503).json({ error: "Unable to send reset email right now. Check email service configuration and try again." });
    }
    res.status(500).json({ error: "Failed to send reset email. Please try again later" });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ error: "Password is required" });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }

    const user = await User.findOne({
      resetToken: token,
      resetTokenExpiry: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ error: "Invalid or expired reset link" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;
    await user.save();

    res.status(200).json({ message: "Password reset successful! You can now login" });
  } catch (err) {
    console.error("Error in resetPassword:", err);
    res.status(500).json({ error: "Password reset failed. Please try again" });
  }
};
