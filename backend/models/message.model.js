import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
    {
        senderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        receiverId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        message: {
            type: String,
            default: null,
        },
        media: {
            type: String, // Stores Cloudinary URL
            default: null,
        },
        status: {
            type: String,
            enum: ["sent", "delivered", "seen"],
            default: "sent"
        },

        replyTo: {
            messageId: { type: mongoose.Schema.Types.ObjectId, ref: "Message" }, // ✅ Store replied message ID
            text: { type: String }, // ✅ Store replied message text
        },

         // ✅ Reaction Feature
    reactions: [
        {
            userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
            emoji: { type: String } // Example: "❤️", "👍", "😂"
        }
    ]
        
    },
    { timestamps: true }
);

const Message = mongoose.model("Message", messageSchema);

export default Message;
