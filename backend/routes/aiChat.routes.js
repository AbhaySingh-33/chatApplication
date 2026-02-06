import express from "express";
import {
  getOrCreateAIConversation,
  sendAIMessage,
  getAIConversationMessages,
} from "../controllers/aiChat.controller.js";
import protectRoute from "../middleware/protectRoute.js";

const router = express.Router();

router.get("/conversation", protectRoute, getOrCreateAIConversation);
router.post("/send", protectRoute, sendAIMessage);
router.get("/messages", protectRoute, getAIConversationMessages);

export default router;
