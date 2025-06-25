import express from "express";
import { login, logout, signup, uploadProfilePicture, verifyEmail } from "../controllers/auth.controllers.js";

const router = express.Router();

router.post("/signup", uploadProfilePicture, signup);

router.post("/login", login);

router.post("/logout", logout);

router.get("/verify-email/:token", verifyEmail);


export default router;