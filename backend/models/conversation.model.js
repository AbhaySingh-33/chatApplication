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
	},
	{ timestamps: true }
);

const Conversation = mongoose.model("Conversation", conversationSchema);

export default Conversation;
