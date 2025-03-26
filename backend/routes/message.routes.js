import express from "express";
import { getMessages, sendMessage,deleteMessage } from "../controllers/message.controller.js";
import protectRoute from "../middleware/protectRoute.js";

const router = express.Router();

router.get("/:id", protectRoute, getMessages);
router.post("/send/:id", protectRoute, sendMessage);
router.delete("/:messageId", protectRoute, deleteMessage);

export default router;