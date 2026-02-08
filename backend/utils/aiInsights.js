import axios from "axios";
import Conversation from "../models/conversation.model.js";
import Message from "../models/message.model.js";

const INSIGHT_STALE_MS = 5 * 60 * 1000;
const MAX_MESSAGES = 30;
const ALLOWED_TAGS = new Set(["decision", "task", "issue"]);
const ALLOWED_SENTIMENTS = new Set(["positive", "neutral", "negative"]);
const ALLOWED_URGENCY = new Set(["low", "medium", "high"]);

const trimText = (value, maxLen) => {
  if (!value || typeof value !== "string") return "";
  const cleaned = value.replace(/\s+/g, " ").trim();
  if (!maxLen) return cleaned;
  return cleaned.length > maxLen ? cleaned.slice(0, maxLen) : cleaned;
};

const uniqueList = (items, maxLen, maxItems) => {
  if (!Array.isArray(items)) return [];
  const seen = new Set();
  const output = [];
  for (const item of items) {
    const cleaned = trimText(item, maxLen);
    if (!cleaned || seen.has(cleaned)) continue;
    seen.add(cleaned);
    output.push(cleaned);
    if (maxItems && output.length >= maxItems) break;
  }
  return output;
};

const safeParseJson = (text) => {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  }
};

const buildPrompt = (messages, userId) => {
  const transcript = messages
    .map((msg) => {
      const speaker = msg.senderId?.toString() === userId.toString() ? "User" : "AI";
      return `ID:${msg._id} | ${speaker}: ${msg.message}`;
    })
    .join("\n");

  return [
    "You are an assistant that analyzes workplace chat transcripts.",
    "Return ONLY valid JSON with this schema:",
    "{",
    '  "topic": string,',
    '  "sentiment": "positive" | "neutral" | "negative",',
    '  "urgency": "low" | "medium" | "high",',
    '  "summary": string,',
    '  "decisions": [string, ...],',
    '  "actionItems": [string, ...],',
    '  "messageTags": [',
    '     {"messageId": string, "tags": ["decision"|"task"|"issue", ...]}',
    "  ]",
    "}",
    "Guidelines:",
    "- Topic should be a short phrase (3-8 words).",
    "- Summary should be 2-4 sentences max.",
    "- Decisions and action items can be empty arrays if none are present.",
    "- Tag only messages that clearly contain a decision, task, or issue.",
    "",
    "Transcript:",
    transcript,
  ].join("\n");
};

const normalizeTags = (tags) => {
  if (!Array.isArray(tags)) return [];
  const cleaned = [];
  for (const tag of tags) {
    const normalized = String(tag || "").toLowerCase().trim();
    if (ALLOWED_TAGS.has(normalized) && !cleaned.includes(normalized)) {
      cleaned.push(normalized);
    }
  }
  return cleaned;
};

const sanitizeInsights = (data) => {
  const topic = trimText(data?.topic, 80);
  const sentiment = ALLOWED_SENTIMENTS.has(data?.sentiment)
    ? data.sentiment
    : "neutral";
  const urgency = ALLOWED_URGENCY.has(data?.urgency) ? data.urgency : "low";
  const summary = trimText(data?.summary, 600);
  const decisions = uniqueList(data?.decisions, 200, 10);
  const actionItems = uniqueList(data?.actionItems, 200, 10);

  const messageTags = Array.isArray(data?.messageTags)
    ? data.messageTags
        .map((entry) => ({
          messageId: entry?.messageId,
          tags: normalizeTags(entry?.tags),
        }))
        .filter((entry) => entry.messageId && entry.tags.length > 0)
    : [];

  return {
    insights: { topic, sentiment, urgency, summary, decisions, actionItems },
    messageTags,
  };
};

export const updateAIInsightsForConversation = async ({
  userId,
  aiUserId,
  force = false,
}) => {
  const conversation = await Conversation.findOne({
    participants: { $all: [userId, aiUserId] },
  });

  if (!conversation) return null;

  const totalCount = conversation.messages?.length || 0;
  const existing = conversation.aiInsights;
  if (!force && existing?.updatedAt) {
    const isFresh =
      existing.messageCount === totalCount &&
      Date.now() - existing.updatedAt.getTime() < INSIGHT_STALE_MS;
    if (isFresh) {
      return { insights: existing, messageTags: [], cached: true };
    }
  }

  if (!process.env.GEMINI_API_KEY) {
    return existing ? { insights: existing, messageTags: [], cached: true } : null;
  }

  if (totalCount === 0) {
    return { insights: null, messageTags: [], cached: false };
  }

  const messages = await Message.find({
    $or: [
      { senderId: userId, receiverId: aiUserId },
      { senderId: aiUserId, receiverId: userId },
    ],
    message: { $ne: null },
  })
    .sort({ createdAt: 1 })
    .limit(MAX_MESSAGES)
    .lean();

  if (!messages.length) {
    return { insights: null, messageTags: [], cached: false };
  }

  const prompt = buildPrompt(messages, userId);
  const response = await axios.post(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }],
        },
      ],
    }
  );

  const text =
    response?.data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
  const parsed = safeParseJson(text);
  if (!parsed) return null;

  const { insights, messageTags } = sanitizeInsights(parsed);

  conversation.aiInsights = {
    ...insights,
    messageCount: totalCount,
    updatedAt: new Date(),
  };
  await conversation.save();

  if (messageTags.length) {
    const allowedIds = new Set(messages.map((msg) => String(msg._id)));
    const ops = messageTags
      .filter((entry) => allowedIds.has(String(entry.messageId)))
      .map((entry) => ({
        updateOne: {
          filter: { _id: entry.messageId },
          update: { $set: { tags: entry.tags } },
        },
      }));

    if (ops.length) {
      await Message.bulkWrite(ops);
    }
  }

  return { insights: conversation.aiInsights, messageTags, cached: false };
};
