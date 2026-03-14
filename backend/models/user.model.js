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
		
		 resetToken: String, 
  		 resetTokenExpiry: Date, 
	},
	{ timestamps: true }
);

const User = mongoose.model("User", userSchema);

export default User;