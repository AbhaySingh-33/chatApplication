import mongoose from "mongoose";

const groupMessageSchema = new mongoose.Schema(
  {
    groupId: { type: mongoose.Schema.Types.ObjectId, ref: "Group", required: true },
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    message: { type: String, default: null },
    media: { type: String, default: null },
    replyTo: {
      messageId: { type: mongoose.Schema.Types.ObjectId, ref: "GroupMessage" },
      text: { type: String },
      senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    },
    reactions: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        emoji: { type: String },
      },
    ],
    moderation: {
      status: {
        type: String,
        enum: ["clean", "flagged", "blocked"],
        default: "clean",
      },
      flags: [{ type: String }],
      action: {
        type: String,
        enum: ["none", "warned", "muted", "highlighted", "blocked"],
        default: "none",
      },
      toxicityScore: { type: Number, default: 0 },
      spamScore: { type: Number, default: 0 },
      offTopicScore: { type: Number, default: 0 },
      qualityScore: { type: Number, default: 0 },
      note: { type: String, default: "" },
      reviewedAt: { type: Date, default: null },
      highlighted: { type: Boolean, default: false },
    },
    system: { type: Boolean, default: false },
    systemEvent: { type: String, default: "" },
    systemPayload: { type: mongoose.Schema.Types.Mixed, default: null },
  },
  { timestamps: true }
);

const GroupMessage = mongoose.model("GroupMessage", groupMessageSchema);

export default GroupMessage;
