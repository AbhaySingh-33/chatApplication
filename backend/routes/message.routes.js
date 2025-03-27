import express from "express";
import { getMessages, sendMessage,reactToMessage,deleteMessage } from "../controllers/message.controller.js";
import protectRoute from "../middleware/protectRoute.js";

const router = express.Router();

router.get("/:id", protectRoute, getMessages);
router.post("/send/:id", protectRoute, sendMessage);
router.post("/react", protectRoute, reactToMessage);
router.delete("/:messageId", protectRoute, deleteMessage);


export default router;