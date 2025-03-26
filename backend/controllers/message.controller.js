import Conversation from "../models/conversation.model.js";
import Message from "../models/message.model.js";
import { getReceiverSocketId, io } from "../socket/socket.js";
import User from "../models/user.model.js";
import { Socket } from "socket.io";

export const sendMessage = async (req, res) => {
    try {
        const { text, media } = req.body;
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

        const newMessage = new Message({
            senderId,
            receiverId,
            message: text || "",
            media: media || null,
            status: "sent",
        });

        conversation.messages.push(newMessage._id);

        await Promise.all([conversation.save(), newMessage.save()]);

        // Send real-time message with Socket.IO
        const receiverSocketId = getReceiverSocketId(receiverId);
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("newMessage", newMessage, filteredUser);
            io.to(receiverSocketId).emit("messageStatusUpdated", { messageId: newMessage._id, status: "delivered" });
        }

        res.status(201).json(newMessage);
    } catch (error) {
        console.log("Error in sendMessage controller: ", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const getMessages = async (req, res) => {
    try {
        const { id: userToChatId } = req.params;
        const senderId = req.user._id;

        // ✅ Find conversation where both users are participants
        const conversation = await Conversation.findOne({
            participants: { $all: [senderId, userToChatId] },
        }).populate({
            path: "messages",
            select: "senderId receiverId message media status createdAt", // ✅ Added "status"
            options: { sort: { createdAt: 1 } }, // ✅ Sort messages oldest to newest
        }).lean(); // ✅ Faster performance

        if (!conversation) {
            const senderSocketId = getReceiverSocketId(senderId);
            if (senderSocketId) {
                io.to(senderSocketId).emit("Message",senderId);
            }
            return res.status(404).json({ error: "No Conversation yet" });
        }

        // ✅ Format messages properly
        const formattedMessages = conversation.messages.map((msg) => ({
            _id: msg._id,
            senderId: msg.senderId,
            receiverId: msg.receiverId,
            message: msg.message || null, // Ensures message is not null
            media: msg.media || null, // Media (image/video) URL
            status: msg.status, // ✅ Now included
            createdAt: msg.createdAt,
        }));
        res.status(200).json(formattedMessages);
    } catch (error) {
        console.error("Error in getMessages controller:", error.message);
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