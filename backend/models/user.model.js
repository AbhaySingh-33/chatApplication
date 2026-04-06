import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
	{
		fullName: {
			type: String,
			required: true,
		},
		username: {
			type: String,
			required: true,
			unique: true,
		},
		password: {
			type: String,
			required: true,
			minlength: 6,
		},
		gender: {
			type: String,
			required: true,
			enum: ["male", "female"],
		},
		profilePic: {
			type: String,
			default: "",
		},
		// createdAt, updatedAt => Member since <createdAt>
		email: {
			type: String,
			required: true,
			 unique: true,
			match: /.+\@.+\..+/,
		},
		isVerified: {
			type: Boolean,
			default: false,
		},
		friends: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
		friendRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // Added friendRequests field
		aiMemory: {
			summary: { type: String, default: "" },
			preferences: [{ type: String }],
			goals: [{ type: String }],
			lastTopics: [{ type: String }],
			updatedAt: { type: Date, default: null },
		},
		ragContext: {
			hasIngestedDocs: { type: Boolean, default: false },
			lastIngestedAt: { type: Date, default: null },
			sources: [
				{
					sourceId: { type: String, required: true },
					type: { type: String, enum: ["pdf", "web"], required: true },
					name: { type: String, required: true },
					chunksAdded: { type: Number, default: 0 },
					namespace: { type: String, default: "" },
					ingestedAt: { type: Date, default: Date.now },
				},
			],
		},
		
		 resetToken: String, 
  		 resetTokenExpiry: Date, 
	},
	{ timestamps: true }
);

const User = mongoose.model("User", userSchema);

export default User;