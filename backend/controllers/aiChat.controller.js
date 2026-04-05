
import Conversation from "../models/conversation.model.js";
import Message from "../models/message.model.js";
import User from "../models/user.model.js";
import { getReceiverSocketId, io } from "../socket/socket.js";
import mongoSanitize from "express-mongo-sanitize";
import { updateAIInsightsForConversation } from "../utils/aiInsights.js";
import { chatWithMistral, hasMistralApiKey } from "../utils/mistralClient.js";

// Placeholder for AI response
const getAIResponse = async (userMessage) => {
  try {
    if (!hasMistralApiKey()) {
        return "Please configure MISTRAL_API_KEY in your .env file.";
    }

    const responseText = await chatWithMistral({
      prompt: userMessage,
      systemPrompt:
        "You are a concise and helpful AI assistant in a real-time chat app.",
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

    // Get AI response (simulate delay)
    const aiResponseText = await getAIResponse(text);
    
    const aiUser = {
        _id: AI_USER_ID,
        fullName: "AI Assistant",
        username: "AI",
        profilePic: "https://avatar.iran.liara.run/public/job/operator/male",
    };

    // Simulate thinking time
    setTimeout(async () => {
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
          } catch (error) {
            console.error("AI insights update error:", error.message);
          }
        });
    }, 1000);

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
