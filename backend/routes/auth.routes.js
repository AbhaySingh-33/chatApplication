import express from "express";
import { getMe, login, logout, resendVerificationEmail, signup, uploadProfilePicture, verifyEmail } from "../controllers/auth.controllers.js";
import { resetPassword,requestPasswordReset } from "../controllers/resetPassword.controllers.js";
import protectRoute from "../middleware/protectRoute.js";

const router = express.Router();

router.post("/signup", uploadProfilePicture, signup);

router.post("/login", login);

router.post("/logout", logout);

router.get("/me", protectRoute, getMe);

router.get("/verify-email/:token", verifyEmail);

router.post("/resend-verification", resendVerificationEmail);

router.post("/reset-password",requestPasswordReset)
router.post("/reset-password/:token",resetPassword)



export default router;