import User from "../models/user.model.js";
import mongoSanitize from "express-mongo-sanitize";

export const getUsersForSidebar = async (req, res) => {
	try {
		const loggedInUserId = req.user._id;

		const filteredUsers = await User.find({ _id: { $ne: loggedInUserId } }).select("-password");

		res.status(200).json(filteredUsers);
	} catch (error) {
		console.error("Error in getUsersForSidebar: ", error.message);
		res.status(500).json({ error: "Internal server error" });
	}
};

//  Add Friend
export const addFriend = async (req, res) => {
	try {
		const userId = req.user._id;
		// Sanitize input data
		const sanitizedBody = mongoSanitize.sanitize(req.body);
		const { friendId } = sanitizedBody;

		// Check if already friends
		const user = await User.findById(userId);
		if (user.friends.includes(friendId)) {
			return res.status(400).json({ error: "Already friends" });
		}

		// Add to both users (mutual friendship)
		await User.findByIdAndUpdate(userId, { $push: { friends: friendId } });

		res.status(200).json({ message: "Friend added successfully" });
	} catch (error) {
		console.error("Add Friend Error:", error.message);
		res.status(500).json({ error: "Internal server error" });
	}
};

//  Get Friend List
export const getFriends = async (req, res) => {
	try {
		const userId = req.user._id;

		const user = await User.findById(userId).populate("friends", "-password");
		res.status(200).json(user.friends);
	} catch (error) {
		console.error("Get Friends Error:", error.message);
		res.status(500).json({ error: "Internal server error" });
	}
};

export const removeFriend = async (req, res) => {
	try {
		const userId = req.user._id;
		const { friendId } = req.params;

		await User.findByIdAndUpdate(userId, { $pull: { friends: friendId } });
		res.status(200).json({ message: "Friend removed successfully" });
	} catch (error) {
		console.error("Remove Friend Error:", error.message);
		res.status(500).json({ error: "Internal server error" });
	}
};

export const updateProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    // Sanitize input data
    const sanitizedBody = mongoSanitize.sanitize(req.body);
    const { username, profilePic } = sanitizedBody;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { username, profilePic },
      { new: true }
    ).select("-password");

    res.status(200).json(updatedUser);
  } catch (err) {
    console.error("Update profile error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
};