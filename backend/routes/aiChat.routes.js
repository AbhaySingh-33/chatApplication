import express from "express";
import {
  getOrCreateAIConversation,
  sendAIMessage,
  getAIConversationMessages,
  getAIConversationInsights,
} from "../controllers/aiChat.controller.js";
import protectRoute from "../middleware/protectRoute.js";

const router = express.Router();

router.get("/conversation", protectRoute, getOrCreateAIConversation);
router.post("/send", protectRoute, sendAIMessage);
router.get("/messages", protectRoute, getAIConversationMessages);
router.get("/insights", protectRoute, getAIConversationInsights);

export default router;
