import Conversation from "../models/conversation.model.js";
import Message from "../models/message.model.js";
import { getReceiverSocketId, io } from "../socket/socket.js";
import User from "../models/user.model.js";
import mongoSanitize from "express-mongo-sanitize";
import {
    analyzeConflictForDraft,
    resolveConflictIfNeeded,
} from "../utils/conflictResolver.js";

const DEFAULT_CONFLICT_MODE = "suggest";
const ALLOWED_CONFLICT_MODES = new Set(["off", "suggest", "modify", "block"]);

const getConflictModeForUser = (conversation, userId) => {
    const entry = conversation?.conflictSettings?.find(
        (setting) => setting.userId?.toString() === userId.toString()
    );
    return entry?.mode || DEFAULT_CONFLICT_MODE;
};

export const sendMessage = async (req, res) => {
    try {
        // Sanitize input data
        const sanitizedBody = mongoSanitize.sanitize(req.body);
        const { text, media, replyTo } = sanitizedBody;
        const { id: receiverId } = req.params;
        const senderId = req.user._id;

        if (!text && !media) {
            return res.status(400).json({ error: "Message content is required" });
        }

        let conversation = await Conversation.findOne({
            participants: { $all: [senderId, receiverId] },
        });

        if (!conversation) {
            conversation = await Conversation.create({
                participants: [senderId, receiverId],
            });
        }

        const filteredUser = await User.findById(senderId).select("-password");

        const conflictMode = getConflictModeForUser(conversation, senderId);
        let textToSend = text || "";
        let moderation = null;
        let preResolution = null;

        if (text && (conflictMode === "modify" || conflictMode === "block")) {
            preResolution = await analyzeConflictForDraft({
                senderId,
                receiverId,
                draftText: text,
            });

            if (preResolution && conflictMode === "block") {
                return res.status(409).json({
                    blocked: true,
                    severity: preResolution.severity,
                    neutralRephrase: preResolution.neutralRephrase,
                    compromiseSuggestions: preResolution.compromiseSuggestions,
                });
            }

            if (preResolution && conflictMode === "modify" && preResolution.neutralRephrase) {
                textToSend = preResolution.neutralRephrase;
                moderation = {
                    action: "modified",
                    originalText: text,
                    createdAt: new Date(),
                };
            }
        }

        const newMessage = new Message({
            senderId,
            receiverId,
            message: textToSend || "",
            media: media || null,
            status: "sent", //  Initially, set status as "sent"
            replyTo: replyTo ? { messageId: replyTo.messageId, text: replyTo.message } : null, //  Store replied message
            moderation: moderation || undefined,
        });

        conversation.messages.push(newMessage._id);

        await Promise.all([conversation.save(), newMessage.save()]);

        // Send real-time message with Socket.IO
        const receiverSocketId = getReceiverSocketId(receiverId);
        const senderSocketId = getReceiverSocketId(senderId);
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("newMessage", newMessage, filteredUser);
            io.to(senderSocketId).emit("messageStatusUpdated", { messageId: newMessage._id, status: "delivered" });
        }

        res.status(201).json(newMessage);

        if (conflictMode !== "off") {
            setImmediate(async () => {
                try {
                    const resolution =
                        preResolution ||
                        (await resolveConflictIfNeeded({
                            senderId,
                            receiverId,
                            latestMessage: newMessage,
                        }));

                    if (!resolution) return;

                    const payload = {
                        senderId,
                        receiverId,
                        messageId: newMessage._id,
                        severity: resolution.severity,
                        neutralRephrase: resolution.neutralRephrase,
                        compromiseSuggestions: resolution.compromiseSuggestions,
                        action: moderation?.action === "modified" ? "modified" : "suggested",
                        originalText: moderation?.originalText || null,
                        createdAt: new Date().toISOString(),
                    };

                    const receiverSocketId = getReceiverSocketId(receiverId);
                    const senderSocketId = getReceiverSocketId(senderId);

                    if (receiverSocketId) {
                        io.to(receiverSocketId).emit("conflictResolution", payload);
                    }
                    if (senderSocketId) {
                        io.to(senderSocketId).emit("conflictResolution", payload);
                    }
                } catch (error) {
                    console.error("Conflict resolver error:", error.message);
                }
            });
        }
    } catch (error) {
        console.log("Error in sendMessage controller: ", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const getMessages = async (req, res) => {
    try {
        const { id: userToChatId } = req.params;
        const senderId = req.user._id;

        //  Find conversation where both users are participants
        const conversation = await Conversation.findOne({
            participants: { $all: [senderId, userToChatId] },
        }).populate({
            path: "messages",
            select: "senderId receiverId message media status reactions replyTo moderation tags createdAt", //  Added "reactions"
            options: { sort: { createdAt: 1 } }, // Sort messages oldest to newest
        }).lean(); // Faster performance

        if (!conversation) {
            const senderSocketId = getReceiverSocketId(senderId);
            if (senderSocketId) {
                io.to(senderSocketId).emit("Message",senderId);
            }
            return res.status(404).json({ error: "No Conversation yet!" });
        } 

        //  Format messages properly to include text, media, and reactions
        const formattedMessages = conversation.messages.map((msg) => ({
            _id: msg._id,
            senderId: msg.senderId,
            receiverId: msg.receiverId,
            message: msg.message || null, // Ensures message can be null
            media: msg.media || null, // Media (image/video) URL
            status: msg.status, //  Include status
            reactions: msg.reactions || [], //  Include reactions
            replyTo: msg.replyTo || null, // Include reply message details
            moderation: msg.moderation || { action: "none" },
            tags: msg.tags || [],
            createdAt: msg.createdAt,
        }));

        res.status(200).json(formattedMessages);
    } catch (error) {
        console.log("Error in getMessages controller: ", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const getConflictMode = async (req, res) => {
    try {
        const { id: userToChatId } = req.params;
        const userId = req.user._id;

        const conversation = await Conversation.findOne({
            participants: { $all: [userId, userToChatId] },
        }).lean();

        const mode = conversation
            ? getConflictModeForUser(conversation, userId)
            : DEFAULT_CONFLICT_MODE;

        res.status(200).json({ mode });
    } catch (error) {
        console.error("Error getting conflict mode:", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const setConflictMode = async (req, res) => {
    try {
        const sanitizedBody = mongoSanitize.sanitize(req.body);
        const { mode } = sanitizedBody;
        const { id: userToChatId } = req.params;
        const userId = req.user._id;

        if (!ALLOWED_CONFLICT_MODES.has(mode)) {
            return res.status(400).json({ error: "Invalid conflict mode" });
        }

        let conversation = await Conversation.findOne({
            participants: { $all: [userId, userToChatId] },
        });

        if (!conversation) {
            conversation = await Conversation.create({
                participants: [userId, userToChatId],
                conflictSettings: [{ userId, mode }],
            });
        } else {
            const existing = conversation.conflictSettings?.find(
                (setting) => setting.userId?.toString() === userId.toString()
            );
            if (existing) {
                existing.mode = mode;
            } else {
                conversation.conflictSettings = [
                    ...(conversation.conflictSettings || []),
                    { userId, mode },
                ];
            }
            await conversation.save();
        }

        res.status(200).json({ mode });
    } catch (error) {
        console.error("Error setting conflict mode:", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
};


export const reactToMessage = async (req, res) => {
    try {
        // Sanitize input data
        const sanitizedBody = mongoSanitize.sanitize(req.body);
        const { messageId, emoji } = sanitizedBody;
        const userId = req.user._id;

        // Check if the user already reacted
        const message = await Message.findById(messageId);
        const existingReaction = message.reactions.find(r => r.userId.toString() === userId.toString());

        if (existingReaction) {
            //  Update existing reaction if different, else remove it
            if (existingReaction.emoji === emoji) {
                message.reactions = message.reactions.filter(r => r.userId.toString() !== userId.toString());
            } else {
                existingReaction.emoji = emoji;
            }
        } else {
            //  Add new reaction
            message.reactions.push({ userId, emoji });
        }

        await message.save();

        //  Emit real-time update
        io.emit("reactionUpdated", { messageId, reactions: message.reactions });

        res.status(200).json(message);
    } catch (error) {
        console.error("Error reacting to message:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};


export const deleteMessage = async (req, res) => {
    try {
        const { messageId } = req.params;
        const senderId = req.user._id;

        // Find the message
        const message = await Message.findById(messageId);
        if (!message) return res.status(404).json({ error: "Message not found" });

        // Check authorization
        if (message.senderId.toString() !== senderId.toString()) {
            return res.status(403).json({ error: "You are not authorized to delete this message" });
        }

        // Remove the message from the conversation
        await Conversation.updateOne(
            { participants: { $all: [senderId, message.receiverId] } },
            { $pull: { messages: messageId } }
        );

        // Delete the message
        await Message.findByIdAndDelete(messageId);

        // Fetch updated conversation
        const updatedConversation = await Conversation.findOne({
            participants: { $all: [senderId, message.receiverId] },
        }).populate("messages");

        const filteredUser = await User.findOne({ _id: senderId }).select("-password");
        const RfilteredUser = await User.findOne({ _id: message.receiverId }).select("-password");

        // Notify sender & receiver
        const receiverSocketId = getReceiverSocketId(message.receiverId);
        const senderSocketId = getReceiverSocketId(senderId);

        if (receiverSocketId) io.to(receiverSocketId).emit("messageDeleted", updatedConversation.messages,filteredUser,RfilteredUser);
        if (senderSocketId) io.to(senderSocketId).emit("messageDeleted", updatedConversation.messages,filteredUser,RfilteredUser);

        res.status(200).json({ message: "Message deleted successfully" });
    } catch (error) {
        console.error("Error in deleteMessage:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};
