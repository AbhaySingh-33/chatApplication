import express from "express";
import { login, logout, signup, uploadProfilePicture } from "../controllers/auth.controllers.js";

const router = express.Router();

router.post("/signup", uploadProfilePicture, signup);

router.post("/login", login);

router.post("/logout", logout);

export default router;