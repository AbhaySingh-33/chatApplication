import express from "express";
import multer from "multer";
import {
  getOrCreateAIConversation,
  sendAIMessage,
  getAIConversationMessages,
  getAIConversationInsights,
} from "../controllers/aiChat.controller.js";
import {
  crawlForRag,
  deleteRagPdf,
  listRagPdfs,
  ragHealth,
  uploadPdfForRag,
} from "../controllers/rag.controller.js";
import protectRoute from "../middleware/protectRoute.js";

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 },
});

router.get("/conversation", protectRoute, getOrCreateAIConversation);
router.post("/send", protectRoute, sendAIMessage);
router.get("/messages", protectRoute, getAIConversationMessages);
router.get("/insights", protectRoute, getAIConversationInsights);
router.get("/rag/health", protectRoute, ragHealth);
router.post("/rag/upload-pdf", protectRoute, upload.single("pdf"), uploadPdfForRag);
router.post("/rag/crawl", protectRoute, crawlForRag);
router.get("/rag/pdfs", protectRoute, listRagPdfs);
router.delete("/rag/pdfs/:sourceId", protectRoute, deleteRagPdf);

export default router;
