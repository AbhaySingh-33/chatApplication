import axios from "axios";
import Message from "../models/message.model.js";

const CONFLICT_KEYWORDS = [
  "stupid",
  "idiot",
  "wtf",
  "bullshit",
  "incompetent",
  "lazy",
  "shut up",
  "fuck",
  "fucking",
  "bitch",
  "asshole",
  "dick",
  "cunt",
  "piss off",
  "motherfucker",
  "bastard",
  "moron",
  "dumbass",
  "loser",
  "retard",
  "trash",
  "garbage",
  "piece of shit",
  "faggot",
  "slut",
  "whore"
];


const AGGRESSIVE_PUNCT = /[!?]{3,}/;
const ALL_CAPS = /\b[A-Z]{4,}\b/;
const SECOND_PERSON_NEG = /(you|your)\s+(always|never|keep|constantly|failed|failing|messed|ruined|wrong|late|unacceptable|careless)/i;

const CONFLICT_COOLDOWN_MS = 2 * 60 * 1000;
const lastConflictByPair = new Map();

const normalize = (text) => (text || "").toLowerCase();

const computeConflictScore = (text) => {
  if (!text) return 0;
  const normalized = normalize(text);
  let score = 0;

  if (AGGRESSIVE_PUNCT.test(text)) score += 2;
  if (ALL_CAPS.test(text)) score += 1;
  if (SECOND_PERSON_NEG.test(text)) score += 2;

  for (const keyword of CONFLICT_KEYWORDS) {
    if (normalized.includes(keyword)) score += 2;
  }

  const exclamations = (text.match(/!/g) || []).length;
  const questions = (text.match(/\?/g) || []).length;
  if (exclamations + questions >= 4) score += 1;

  return score;
};

const shouldAnalyzeConflict = (messages) => {
  if (!messages || messages.length < 2) return false;
  const recent = messages.slice(-4);
  const participants = new Set(recent.map((m) => String(m.senderId)));
  if (participants.size < 2) return false;

  const combinedText = recent.map((m) => m.message).filter(Boolean).join(" ");
  const lastText = recent[recent.length - 1]?.message || "";

  const score = computeConflictScore(combinedText) + computeConflictScore(lastText);
  return score >= 3;
};

const buildPrompt = (messages, latestMessageId) => {
  const primaryId = String(messages[messages.length - 1]?.senderId || "");
  const labelFor = (id) => (String(id) === primaryId ? "Person A" : "Person B");

  const transcript = messages
    .map((m) => `${labelFor(m.senderId)}: ${m.message}`)
    .join("\n");

  return [
    "You are a conflict-resolution assistant for professional workplace chat.",
    "Decide if the tone shows escalating conflict (blame, hostility, repeated disagreement).",
    "If conflict, provide a neutral rephrasing of the latest message and 2-4 compromise suggestions.",
    "Return ONLY valid JSON matching this schema:",
    "{",
    '  "isConflict": boolean,',
    '  "severity": "low" | "medium" | "high",',
    '  "neutralRephrase": string,',
    '  "compromiseSuggestions": [string, ...]',
    "}",
    'If not conflict, return: {"isConflict": false}',
    "Keep neutralRephrase under 200 characters. Keep suggestions concise and professional.",
    "",
    "Conversation:",
    transcript,
    "",
    "Latest message ID:",
    String(latestMessageId || ""),
  ].join("\n");
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

const analyzeConflict = async ({
  senderId,
  receiverId,
  draftText,
  latestMessageId,
  applyCooldown,
}) => {
  if (!draftText) return null;
  if (!process.env.GEMINI_API_KEY) return null;

  const pairKey = [String(senderId), String(receiverId)].sort().join(":");
  if (applyCooldown) {
    const lastSent = lastConflictByPair.get(pairKey);
    if (lastSent && Date.now() - lastSent < CONFLICT_COOLDOWN_MS) {
      return null;
    }
  }

  const recentMessages = await Message.find({
    $or: [
      { senderId, receiverId },
      { senderId: receiverId, receiverId: senderId },
    ],
    message: { $ne: null },
  })
    .sort({ createdAt: -1 })
    .limit(8)
    .lean();

  const ordered = recentMessages.reverse().filter((m) => m.message);
  const messagesForCheck = [
    ...ordered,
    { senderId, message: draftText },
  ];

  if (!shouldAnalyzeConflict(messagesForCheck)) return null;

  const prompt = buildPrompt(messagesForCheck, latestMessageId || "draft");
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
  if (!parsed || !parsed.isConflict) return null;

  const neutralRephrase = (parsed.neutralRephrase || "").trim();
  const compromiseSuggestions = Array.isArray(parsed.compromiseSuggestions)
    ? parsed.compromiseSuggestions.map((s) => String(s)).filter(Boolean)
    : [];

  if (!neutralRephrase && compromiseSuggestions.length === 0) return null;

  if (applyCooldown) {
    lastConflictByPair.set(pairKey, Date.now());
  }

  return {
    severity: parsed.severity || "low",
    neutralRephrase,
    compromiseSuggestions,
  };
};

export const analyzeConflictForDraft = async ({
  senderId,
  receiverId,
  draftText,
}) =>
  analyzeConflict({
    senderId,
    receiverId,
    draftText,
    latestMessageId: "draft",
    applyCooldown: false,
  });

export const resolveConflictIfNeeded = async ({
  senderId,
  receiverId,
  latestMessage,
}) =>
  analyzeConflict({
    senderId,
    receiverId,
    draftText: latestMessage?.message || "",
    latestMessageId: latestMessage?._id,
    applyCooldown: true,
  });
