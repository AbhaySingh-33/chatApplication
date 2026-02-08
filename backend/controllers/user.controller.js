import User from "../models/user.model.js";
import mongoSanitize from "express-mongo-sanitize";
import { getReceiverSocketId, io } from "../socket/socket.js";
import Message from "../models/message.model.js";
import bcrypt from "bcryptjs";

export const getUsersForSidebar = async (req, res) => {
	try {
		const loggedInUserId = req.user._id;

        // Fetch all users except logged in one
		const filteredUsers = await User.find({ _id: { $ne: loggedInUserId } }).select("-password");
        
        // Fetch current user with populated data to check status efficiently
        const currentUser = await User.findById(loggedInUserId).select("friends");

        // Use Promise.all to fetch unread message counts for each user concurrently
        const usersWithStatus = await Promise.all(filteredUsers.map(async (user) => {
            const isFriend = currentUser.friends.some(id => id.toString() === user._id.toString());
            const requestSent = user.friendRequests.some(id => id.toString() === loggedInUserId.toString());
            
            // Count messages sent by this user to me that are NOT seen
            const unreadCount = await Message.countDocuments({
                senderId: user._id,
                receiverId: loggedInUserId,
                status: { $ne: "seen" }
            });

            return {
                ...user.toObject(),
                isFriend,
                requestSent,
                unreadCount // Add count to response
            };
        }));

		res.status(200).json(usersWithStatus);
	} catch (error) {
		console.error("Error in getUsersForSidebar: ", error.message);
		res.status(500).json({ error: "Internal server error" });
	}
};

// ✅ Send Friend Request
export const sendFriendRequest = async (req, res) => {
	try {
        const userId = req.user._id;
		// Sanitize input data
		const sanitizedBody = mongoSanitize.sanitize(req.body);
		const { receiverId } = sanitizedBody;

		const receiver = await User.findById(receiverId);
		const sender = await User.findById(userId);

		// Check if already friends using .map to compare ObjectIds as strings or use .includes if they are ObjectIds
        const areFriends = receiver.friends.some(friendId => friendId.toString() === userId.toString());
		if (areFriends) {
			return res.status(400).json({ error: "Already friends" });
		}
        
        const requestSent = receiver.friendRequests.some(reqId => reqId.toString() === userId.toString());
		if (requestSent) {
			return res.status(400).json({ error: "Request already sent" });
		}

		await User.findByIdAndUpdate(receiverId, { $push: { friendRequests: userId } });

		// Notify receiver via Socket.IO
		const receiverSocketId = getReceiverSocketId(receiverId);
		if (receiverSocketId) {
			io.to(receiverSocketId).emit("newFriendRequest", {
				_id: sender._id,
				username: sender.username,
				fullName: sender.fullName,
				profilePic: sender.profilePic,
			});
		}

		res.status(200).json({ message: "Friend request sent" });
	} catch (error) {
		console.error("Send Request Error:", error.message);
		res.status(500).json({ error: "Internal server error" });
	}
};

// ✅ Accept Friend Request
export const acceptFriendRequest = async (req, res) => {
	try {
		const userId = req.user._id;
        const sanitizedBody = mongoSanitize.sanitize(req.body);
		const { senderId } = sanitizedBody;

		// Add each other to friends list and remove request
		await User.findByIdAndUpdate(userId, {
			$push: { friends: senderId },
			$pull: { friendRequests: senderId },
		});
		await User.findByIdAndUpdate(senderId, { $push: { friends: userId } });

        // Notify the sender that request was accepted
         const senderSocketId = getReceiverSocketId(senderId);
         if (senderSocketId) {
             io.to(senderSocketId).emit("friendRequestAccepted", { _id: userId });
         }

		res.status(200).json({ message: "Friend request accepted" });
	} catch (error) {
		console.error("Accept Request Error:", error.message);
		res.status(500).json({ error: "Internal server error" });
	}
};

// ✅ Reject Friend Request
export const rejectFriendRequest = async (req, res) => {
	try {
		const userId = req.user._id;
        const sanitizedBody = mongoSanitize.sanitize(req.body);
		const { senderId } = sanitizedBody;

		await User.findByIdAndUpdate(userId, { $pull: { friendRequests: senderId } });
		res.status(200).json({ message: "Friend request rejected" });
	} catch (error) {
		console.error("Reject Request Error:", error.message);
		res.status(500).json({ error: "Internal server error" });
	}
};

// ✅ Get Notifications (Friend Requests)
export const getFriendRequests = async (req, res) => {
	try {
		const userId = req.user._id;
		const user = await User.findById(userId).populate("friendRequests", "username fullName profilePic");
		res.status(200).json(user.friendRequests);
	} catch (error) {
		console.error("Get Notifications Error:", error.message);
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
        // Also remove from other user
        await User.findByIdAndUpdate(friendId, { $pull: { friends: userId } });

        // Notify the removed friend via Socket.IO
        const friendSocketId = getReceiverSocketId(friendId);
        if (friendSocketId) {
            io.to(friendSocketId).emit("friendRemoved", { _id: userId });
        }
        
		res.status(200).json({ message: "Friend removed successfully" });
	} catch (error) {
		console.error("Remove Friend Error:", error.message);
		res.status(500).json({ error: "Internal server error" });
	}
};

export const updateProfile = async (req, res) => {
    try {
        const userId = req.user._id;
        const sanitizedBody = mongoSanitize.sanitize(req.body);
        const { fullName, username, profilePic, currentPassword, newPassword } = sanitizedBody;
    
        const updateData = {};
        if (fullName) updateData.fullName = fullName;
        if (username) updateData.username = username;
        if (profilePic) updateData.profilePic = profilePic;

        // Handle password update
        if (currentPassword && newPassword) {
            const user = await User.findById(userId);
            const isPasswordCorrect = await bcrypt.compare(currentPassword, user.password);
            
            if (!isPasswordCorrect) {
                return res.status(400).json({ error: "Current password is incorrect" });
            }
            
            const salt = await bcrypt.genSalt(10);
            updateData.password = await bcrypt.hash(newPassword, salt);
        }
    
        const updatedUser = await User.findByIdAndUpdate(
          userId,
          updateData,
          { new: true }
        ).select("-password");
    
        res.status(200).json(updatedUser);
      } catch (err) {
        console.error("Update profile error:", err.message);
        res.status(500).json({ error: "Internal server error" });
      }
};
