import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema(
	{
		participants: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: "User",
			},
		],
		messages: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: "Message",
				default: [],
			},
		],
		conflictSettings: [
			{
				userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
				mode: {
					type: String,
					enum: ["off", "suggest", "modify", "block"],
					default: "suggest",
				},
			},
		],
		aiInsights: {
			topic: { type: String, default: "" },
			sentiment: {
				type: String,
				enum: ["positive", "neutral", "negative"],
				default: "neutral",
			},
			urgency: {
				type: String,
				enum: ["low", "medium", "high"],
				default: "low",
			},
			summary: { type: String, default: "" },
			decisions: [{ type: String }],
			actionItems: [{ type: String }],
			messageCount: { type: Number, default: 0 },
			updatedAt: { type: Date, default: null },
		},
	},
	{ timestamps: true }
);

const Conversation = mongoose.model("Conversation", conversationSchema);

export default Conversation;
