import express from "express";
import protectRoute from "../middleware/protectRoute.js";
import { createVoiceSession, getSession, getUserSessions, queryKnowledgeGraph, updateTranscript } from "../controllers/voiceGraph.controller.js";

const router = express.Router();

router.post("/", protectRoute, createVoiceSession);
router.get("/", protectRoute, getUserSessions);
router.get("/:id", protectRoute, getSession);
router.post("/:id/transcript", protectRoute, updateTranscript);
router.post("/:id/query", protectRoute, queryKnowledgeGraph);

export default router;
