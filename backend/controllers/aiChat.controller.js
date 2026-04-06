
import Conversation from "../models/conversation.model.js";
import Message from "../models/message.model.js";
import User from "../models/user.model.js";
import { getReceiverSocketId, io } from "../socket/socket.js";
import mongoSanitize from "express-mongo-sanitize";
import { updateAIInsightsForConversation } from "../utils/aiInsights.js";
import { chatWithMistral, hasMistralApiKey } from "../utils/mistralClient.js";
import { answerWithRag } from "../rag/ragGraph.js";

const MAX_CONTEXT_MESSAGES = 12;
const MAX_MEMORY_ITEMS = 20;

const safeJsonParse = (value) => {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

const uniqueTrimmed = (items = [], limit = MAX_MEMORY_ITEMS) => {
  const set = new Set();
  for (const item of items) {
    const normalized = String(item || "").trim();
    if (!normalized) continue;
    set.add(normalized);
    if (set.size >= limit) break;
  }
  return [...set];
};

const buildConversationContext = async (conversation) => {
  if (!conversation?.messages?.length) return "";

  const recentMessageIds = conversation.messages.slice(-MAX_CONTEXT_MESSAGES);
  const recentMessages = await Message.find({
    _id: { $in: recentMessageIds },
  })
    .select("senderId message createdAt")
    .sort({ createdAt: 1 });

  return recentMessages
    .map((msg) => {
      const role = String(msg.senderId) === AI_USER_ID ? "assistant" : "user";
      const text = String(msg.message || "").replace(/\s+/g, " ").trim();
      return `${role}: ${text}`;
    })
    .filter(Boolean)
    .join("\n");
};

const buildUserMemoryString = (user) => {
  const summary = user?.aiMemory?.summary || "";
  const preferences = user?.aiMemory?.preferences || [];
  const goals = user?.aiMemory?.goals || [];
  const topics = user?.aiMemory?.lastTopics || [];

  const parts = [];
  if (summary) parts.push(`Summary: ${summary}`);
  if (preferences.length) parts.push(`Preferences: ${preferences.join(", ")}`);
  if (goals.length) parts.push(`Goals: ${goals.join(", ")}`);
  if (topics.length) parts.push(`Recent topics: ${topics.join(", ")}`);

  return parts.join("\n");
};

const updateUserAIMemory = async ({ user, userMessage, aiResponseText }) => {
  try {
    const existingMemory = buildUserMemoryString(user);

    const extracted = await chatWithMistral({
      prompt: [
        "Extract durable user memory from this exchange.",
        "Only include stable preferences/goals/topics useful for future personalization.",
        "Do NOT include secrets or one-time sensitive details.",
        "Return JSON with keys: summary (string), preferences (string[]), goals (string[]), lastTopics (string[]).",
        existingMemory ? `Existing memory:\n${existingMemory}` : "",
        `User message: ${userMessage}`,
        `Assistant message: ${aiResponseText}`,
      ]
        .filter(Boolean)
        .join("\n\n"),
      systemPrompt: "You are a memory extraction engine. Output only valid JSON.",
      jsonMode: true,
      temperature: 0,
    });

    const parsed = safeJsonParse(extracted);
    if (!parsed || typeof parsed !== "object") return;

    const mergedPreferences = uniqueTrimmed([
      ...(user?.aiMemory?.preferences || []),
      ...(parsed.preferences || []),
    ]);

    const mergedGoals = uniqueTrimmed([
      ...(user?.aiMemory?.goals || []),
      ...(parsed.goals || []),
    ]);

    const mergedTopics = uniqueTrimmed([
      ...(user?.aiMemory?.lastTopics || []),
      ...(parsed.lastTopics || []),
    ]);

    const newSummary = String(parsed.summary || "").trim();
    const summary = newSummary || user?.aiMemory?.summary || "";

    await User.updateOne(
      { _id: user._id },
      {
        $set: {
          "aiMemory.summary": summary,
          "aiMemory.preferences": mergedPreferences,
          "aiMemory.goals": mergedGoals,
          "aiMemory.lastTopics": mergedTopics,
          "aiMemory.updatedAt": new Date(),
        },
      }
    );
  } catch (error) {
    console.error("AI memory update error:", error.message);
  }
};

// Placeholder for AI response
const getAIResponse = async ({ userId, user, userMessage, conversationContext }) => {
  try {
    if (!hasMistralApiKey()) {
        return "Please configure MISTRAL_API_KEY in your .env file.";
    }

    const userMemory = buildUserMemoryString(user);
    const canUseRag = Boolean(user?.ragContext?.hasIngestedDocs);

    try {
      const ragResult = await answerWithRag({
        userId,
        question: userMessage,
        conversationContext,
        userMemory,
        allowVector: canUseRag,
      });

      if (ragResult?.answer) {
        const sources = (ragResult.sources || []).slice(0, 3);
        const sourceLine = sources.length
          ? `\n\nSources: ${sources.join(" | ")}`
          : "";

        return `${ragResult.answer}${sourceLine}`;
      }
    } catch (ragError) {
      console.error("RAG/web lookup skipped due to error:", ragError?.response?.data || ragError.message);
    }

    const responseText = await chatWithMistral({
      prompt: [
        userMemory ? `User memory:\n${userMemory}` : "",
        conversationContext ? `Recent conversation:\n${conversationContext}` : "",
        `Current user message: ${userMessage}`,
      ]
        .filter(Boolean)
        .join("\n\n"),
      systemPrompt: [
        "You are a concise and helpful AI assistant in a real-time chat app.",
        "Use recent conversation for continuity.",
        "Personalize replies using user memory when relevant.",
      ].join(" "),
      temperature: 0.7,
    });

    return responseText || "I'm not sure how to respond to that.";

  } catch (error) {
    console.error("AI Response Error:", error?.response?.data || error.message);

    // Return specific error message
    if (error.response && error.response.data && error.response.data.error) {
        return `AI Error: ${error.response.data.error.message || "Mistral request failed"}`;
    }
    
    return "Sorry, I encountered an error processing your message. Please try again later.";
  }
};

const AI_USER_ID = "65c0c0c0c0c0c0c0c0c0c0c0"; // Valid MongoDB ObjectId for AI

export const getOrCreateAIConversation = async (req, res) => {
  try {
    const userId = req.user._id;

    // Check if AI conversation already exists
    let conversation = await Conversation.findOne({
      participants: { $all: [userId, AI_USER_ID] },
    }).populate("messages");

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [userId, AI_USER_ID],
      });
    }

    res.status(200).json(conversation);
  } catch (error) {
    console.error("Error getting AI conversation:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const sendAIMessage = async (req, res) => {
  try {
    // Sanitize input
    const sanitizedBody = mongoSanitize.sanitize(req.body);
    const { text } = sanitizedBody;
    const userId = req.user._id;

    if (!text || text.trim() === "") {
      return res.status(400).json({ error: "Message content is required" });
    }

    // Get or create conversation
    let conversation = await Conversation.findOne({
      participants: { $all: [userId, AI_USER_ID] },
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [userId, AI_USER_ID],
      });
    }

    const user = await User.findById(userId).select(
      "fullName username aiMemory ragContext"
    );
    const conversationContext = await buildConversationContext(conversation);

    // Save user message
    const userMessage = new Message({
      senderId: userId,
      receiverId: AI_USER_ID,
      message: text,
      status: "seen",
    });

    if (userMessage) {
        conversation.messages.push(userMessage._id);
        await Promise.all([conversation.save(), userMessage.save()]);
    }

    // Emit user message immediately - SKIP emitting user message back to sender to avoid "unread" notification from self
    // const userSocketId = getReceiverSocketId(userId);
    // if (userSocketId) {
    //     io.to(userSocketId).emit("newMessage", userMessage); 
    // }

    // Get AI response
    const aiResponseText = await getAIResponse({
      userId,
      user,
      userMessage: text,
      conversationContext,
    });
    
    const aiUser = {
        _id: AI_USER_ID,
        fullName: "AI Assistant",
        username: "AI",
        profilePic: "https://res.cloudinary.com/dkdpddzac/image/upload/v1775475390/bq8crhk7qmzgli5vcqww.jpg",
    };

    const aiMessage = new Message({
      senderId: AI_USER_ID,
      receiverId: userId,
      message: aiResponseText,
      status: "seen",
    });

    if (aiMessage) {
      conversation.messages.push(aiMessage._id);
      await Promise.all([conversation.save(), aiMessage.save()]);
    }

    // Emit AI message
    const userSocketId = getReceiverSocketId(userId);
    if (userSocketId) {
      io.to(userSocketId).emit("newMessage", aiMessage, aiUser);
    }

    setImmediate(async () => {
      try {
        await updateAIInsightsForConversation({
          userId,
          aiUserId: AI_USER_ID,
        });
        if (user) {
          await updateUserAIMemory({
            user,
            userMessage: text,
            aiResponseText,
          });
        }
      } catch (error) {
        console.error("AI background update error:", error.message);
      }
    });

    // Return current user message status immediately
    res.status(201).json({ userMessage });
  } catch (error) {
    console.log("Error in sendAIMessage controller:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getAIConversationMessages = async (req, res) => {
  try {
    const userId = req.user._id;

    const conversation = await Conversation.findOne({
      participants: { $all: [userId, AI_USER_ID] },
    }).populate({
      path: "messages",
      select: "senderId receiverId message media status reactions replyTo moderation tags createdAt",
      options: { sort: { createdAt: 1 } },
    });

    if (!conversation) {
      return res.status(200).json([]);
    }

    const formattedMessages = conversation.messages.map((msg) => ({
      _id: msg._id,
      senderId: msg.senderId,
      receiverId: msg.receiverId,
      message: msg.message,
      media: msg.media,
      status: msg.status,
      reactions: msg.reactions,
      replyTo: msg.replyTo,
      moderation: msg.moderation || { action: "none" },
      tags: msg.tags || [],
      createdAt: msg.createdAt,
    }));

    res.status(200).json(formattedMessages);
  } catch (error) {
    console.error("Error fetching AI messages:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getAIConversationInsights = async (req, res) => {
  try {
    const userId = req.user._id;
    const result = await updateAIInsightsForConversation({
      userId,
      aiUserId: AI_USER_ID,
    });

    if (!result) {
      return res.status(200).json({ insights: null, messageTags: [], cached: true });
    }

    res.status(200).json({
      insights: result.insights,
      messageTags: result.messageTags,
      cached: result.cached,
    });
  } catch (error) {
    console.error("Error fetching AI insights:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};
