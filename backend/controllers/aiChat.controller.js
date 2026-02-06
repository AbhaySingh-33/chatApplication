
import Conversation from "../models/conversation.model.js";
import Message from "../models/message.model.js";
import User from "../models/user.model.js";
import { getReceiverSocketId, io } from "../socket/socket.js";
import mongoSanitize from "express-mongo-sanitize";
import axios from "axios";

// Placeholder for AI response
const getAIResponse = async (userMessage) => {
  try {
    const API_KEY = process.env.GEMINI_API_KEY;
    if (!API_KEY) {
        return "Please configure the GEMINI_API_KEY in your .env file.";
    }

    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${API_KEY}`,
      {
        contents: [
            {
                role: "user",
                parts: [{ text: userMessage }]
            }
        ]
      }
    );

    if (response.data && response.data.candidates && response.data.candidates.length > 0) {
        return response.data.candidates[0].content.parts[0].text;
    } else {
        return "I'm not sure how to respond to that.";
    }

  } catch (error) {
    console.error("AI Response Error:", error?.response?.data || error.message);
    
    // Attempt to list available models to help debug "Model not found" errors
    if (error.response?.status === 404 || (error.response?.data?.error?.message && error.response.data.error.message.includes("not found"))) {
        try {
            const listRes = await axios.get(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`);
            const availableModels = listRes.data.models
                .filter(m => m.supportedGenerationMethods && m.supportedGenerationMethods.includes("generateContent"))
                .map(m => m.name.replace("models/", ""))
                .join(", ");
            return `AI Error: Model not found. Your key has access to: ${availableModels}`;
        } catch (listError) {
             return `AI Error: Model not found and could not list available models.`;
        }
    }

    // Return specific error message
    if (error.response && error.response.data && error.response.data.error) {
        return `AI Error: ${error.response.data.error.message}`;
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
      select: "senderId receiverId message media status reactions replyTo createdAt",
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
      createdAt: msg.createdAt,
    }));

    res.status(200).json(formattedMessages);
  } catch (error) {
    console.error("Error fetching AI messages:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};
