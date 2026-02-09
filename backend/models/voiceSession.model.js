import mongoose from "mongoose";

const voiceSessionSchema = new mongoose.Schema(
	{
		userId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		transcript: [
			{
				text: String,
				timestamp: { type: Date, default: Date.now },
				sender: { type: String, default: "user" },
			},
		],
		knowledgeGraph: {
			nodes: [
				{
					id: String,
					label: String,
					type: { type: String, enum: ["person", "technology", "task", "other"] },
				},
			],
			edges: [
				{
					source: String,
					target: String,
					relation: String,
				},
			],
		},
		summary: String,
	},
	{ timestamps: true }
);

const VoiceSession = mongoose.model("VoiceSession", voiceSessionSchema);

export default VoiceSession;
