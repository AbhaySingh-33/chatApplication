import axios from "axios";

const TOXIC_KEYWORDS = [
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
  "whore",
];

const SPAM_KEYWORDS = [
  "free",
  "buy now",
  "subscribe",
  "click",
  "promo",
  "sale",
  "limited offer",
  "earn money",
];

const LINK_REGEX = /(https?:\/\/\S+)/gi;
const REPEAT_CHAR_REGEX = /(.)\1{6,}/;
const ALL_CAPS_REGEX = /\b[A-Z]{4,}\b/;
const AGGRESSIVE_PUNCT_REGEX = /[!?]{3,}/;

const FLOOD_WINDOW_MS = 60 * 1000;
const messageWindow = new Map();

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

const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));

const computeHeuristicScores = (text) => {
  if (!text) {
    return { toxicity: 0, spam: 0, quality: 0 };
  }

  const normalized = text.toLowerCase();
  let toxicity = 0;
  let spam = 0;

  for (const keyword of TOXIC_KEYWORDS) {
    if (normalized.includes(keyword)) toxicity += 0.7; // Single keyword triggers threshold (0.6)
  }

  if (ALL_CAPS_REGEX.test(text)) toxicity += 0.1;
  if (AGGRESSIVE_PUNCT_REGEX.test(text)) toxicity += 0.1;

  for (const keyword of SPAM_KEYWORDS) {
    if (normalized.includes(keyword)) spam += 0.2;
  }

  const links = text.match(LINK_REGEX);
  if (links && links.length >= 2) spam += 0.3;
  if (REPEAT_CHAR_REGEX.test(text)) spam += 0.2;

  const quality =
    text.length > 140 && /(\bhow\b|\bwhy\b|\bbecause\b|\bconsider\b)/i.test(text)
      ? 0.7
      : text.length > 200
      ? 0.6
      : 0;

  return {
    toxicity: clamp(toxicity),
    spam: clamp(spam),
    quality: clamp(quality),
  };
};

const buildPrompt = ({ text, topic }) => {
  const scope = topic
    ? `Group topic/description: ${topic}`
    : "Group topic/description: (not provided)";

  return [
    "You are a live AI moderator for group chat.",
    "Score the message for spam, toxic/abusive language, off-topic content, and high-quality helpfulness.",
    "Return ONLY valid JSON with this schema:",
    "{",
    '  "spam": number (0-1),',
    '  "toxicity": number (0-1),',
    '  "offTopic": number (0-1),',
    '  "quality": number (0-1),',
    '  "note": string (short explanation)',
    "}",
    "",
    scope,
    "Message:",
    text,
  ].join("\n");
};

const analyzeWithAI = async ({ text, topic }) => {
  if (!process.env.GEMINI_API_KEY) return null;
  if (!text || text.trim().length < 6) return null;

  console.log("🤖 Calling Gemini API for message analysis...");

  const prompt = buildPrompt({ text, topic });
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

  const raw =
    response?.data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
  const parsed = safeParseJson(raw);
  if (!parsed) return null;

  return {
    spam: clamp(Number(parsed.spam || 0)),
    toxicity: clamp(Number(parsed.toxicity || 0)),
    offTopic: clamp(Number(parsed.offTopic || 0)),
    quality: clamp(Number(parsed.quality || 0)),
    note: String(parsed.note || "").slice(0, 180),
  };
};

export const trackFloodScore = ({ groupId, userId }) => {
  const key = `${groupId}:${userId}`;
  const now = Date.now();
  const timestamps = (messageWindow.get(key) || []).filter(
    (t) => now - t < FLOOD_WINDOW_MS
  );
  timestamps.push(now);
  messageWindow.set(key, timestamps);
  return timestamps.length;
};

export const evaluateGroupMessage = async ({
  text,
  groupTopic,
  floodCount,
  floodLimit,
  aiEnabled,
}) => {
  const heuristic = computeHeuristicScores(text);
  const ai =
    aiEnabled && process.env.GEMINI_API_KEY
      ? await analyzeWithAI({ text, topic: groupTopic })
      : null;

  const scores = {
    spam: Math.max(heuristic.spam, ai?.spam || 0),
    toxicity: Math.max(heuristic.toxicity, ai?.toxicity || 0),
    offTopic: ai?.offTopic || 0,
    quality: Math.max(heuristic.quality, ai?.quality || 0),
    flood: floodLimit ? clamp(floodCount / floodLimit) : 0,
  };

  const flags = [];
  if (scores.spam >= 0.6) flags.push("spam");
  if (scores.toxicity >= 0.6) flags.push("toxic");
  if (scores.offTopic >= 0.6) flags.push("off_topic");
  if (scores.flood >= 0.6) flags.push("flood");

  let action = "none";
  const severe =
    scores.toxicity >= 0.85 ||
    scores.spam >= 0.85 ||
    scores.flood >= 0.9;

  if (severe) {
    action = "mute";
  } else if (flags.length > 0) {
    action = "warn";
  } else if (scores.quality >= 0.85) {
    action = "highlight";
  }

  return {
    action,
    flags,
    scores,
    note: ai?.note || "",
  };
};
