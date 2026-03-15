import User from "../models/user.model.js";
import mongoSanitize from "express-mongo-sanitize";
import { getReceiverSocketId, io } from "../socket/socket.js";
import Message from "../models/message.model.js";
import bcrypt from "bcryptjs";

const getDefaultProfilePic = (gender) => {
	const maleDefault = process.env.DEFAULT_MAN_PROFILE_PIC
	const femaleDefault = process.env.DEFAULT_GIRL_PROFILE_PIC

	if (gender === "male") return maleDefault
	return femaleDefault
};

export const getUsersForSidebar = async (req, res) => {
	try {
		const loggedInUserId = req.user._id;

		const filteredUsers = await User.find({ _id: { $ne: loggedInUserId } }).select("-password");
        const currentUser = await User.findById(loggedInUserId).select("friends");

		if (!currentUser) {
			return res.status(404).json({ error: "User not found" });
		}

        const usersWithStatus = await Promise.all(filteredUsers.map(async (user) => {
            const isFriend = currentUser.friends.some(id => id.toString() === user._id.toString());
            const requestSent = user.friendRequests.some(id => id.toString() === loggedInUserId.toString());
            
            const unreadCount = await Message.countDocuments({
                senderId: user._id,
                receiverId: loggedInUserId,
                status: { $ne: "seen" }
            });

            return {
                ...user.toObject(),
                isFriend,
                requestSent,
                unreadCount
            };
        }));

		res.status(200).json(usersWithStatus);
	} catch (error) {
		console.error("Error in getUsersForSidebar: ", error.message);
		res.status(500).json({ error: "Failed to load users" });
	}
};

export const sendFriendRequest = async (req, res) => {
	try {
        const userId = req.user._id;
		const sanitizedBody = mongoSanitize.sanitize(req.body);
		const { receiverId } = sanitizedBody;

		if (!receiverId) {
			return res.status(400).json({ error: "Receiver ID is required" });
		}

		if (receiverId === userId.toString()) {
			return res.status(400).json({ error: "Cannot send friend request to yourself" });
		}

		const receiver = await User.findById(receiverId);
		if (!receiver) {
			return res.status(404).json({ error: "User not found" });
		}

		const sender = await User.findById(userId);

        const areFriends = receiver.friends.some(friendId => friendId.toString() === userId.toString());
		if (areFriends) {
			return res.status(409).json({ error: "Already friends" });
		}
        
        const requestSent = receiver.friendRequests.some(reqId => reqId.toString() === userId.toString());
		if (requestSent) {
			return res.status(409).json({ error: "Request already sent" });
		}

		await User.findByIdAndUpdate(receiverId, { $push: { friendRequests: userId } });

		const receiverSocketId = getReceiverSocketId(receiverId);
		if (receiverSocketId) {
			io.to(receiverSocketId).emit("newFriendRequest", {
				_id: sender._id,
				username: sender.username,
				fullName: sender.fullName,
				profilePic: sender.profilePic,
			});
		}

		res.status(200).json({ message: "Friend request sent successfully" });
	} catch (error) {
		console.error("Send Request Error:", error.message);
		res.status(500).json({ error: "Failed to send friend request" });
	}
};

export const acceptFriendRequest = async (req, res) => {
	try {
		const userId = req.user._id;
        const sanitizedBody = mongoSanitize.sanitize(req.body);
		const { senderId } = sanitizedBody;

		if (!senderId) {
			return res.status(400).json({ error: "Sender ID is required" });
		}

		const sender = await User.findById(senderId);
		if (!sender) {
			return res.status(404).json({ error: "User not found" });
		}

		await User.findByIdAndUpdate(userId, {
			$push: { friends: senderId },
			$pull: { friendRequests: senderId },
		});
		await User.findByIdAndUpdate(senderId, { $push: { friends: userId } });

         const senderSocketId = getReceiverSocketId(senderId);
         if (senderSocketId) {
             io.to(senderSocketId).emit("friendRequestAccepted", { _id: userId });
         }

		res.status(200).json({ message: "Friend request accepted" });
	} catch (error) {
		console.error("Accept Request Error:", error.message);
		res.status(500).json({ error: "Failed to accept friend request" });
	}
};

export const rejectFriendRequest = async (req, res) => {
	try {
		const userId = req.user._id;
        const sanitizedBody = mongoSanitize.sanitize(req.body);
		const { senderId } = sanitizedBody;

		if (!senderId) {
			return res.status(400).json({ error: "Sender ID is required" });
		}

		await User.findByIdAndUpdate(userId, { $pull: { friendRequests: senderId } });
		res.status(200).json({ message: "Friend request rejected" });
	} catch (error) {
		console.error("Reject Request Error:", error.message);
		res.status(500).json({ error: "Failed to reject friend request" });
	}
};

export const getFriendRequests = async (req, res) => {
	try {
		const userId = req.user._id;
		const user = await User.findById(userId).populate("friendRequests", "username fullName profilePic");
		if (!user) {
			return res.status(404).json({ error: "User not found" });
		}
		res.status(200).json(user.friendRequests || []);
	} catch (error) {
		console.error("Get Notifications Error:", error.message);
		res.status(500).json({ error: "Failed to load friend requests" });
	}
};

export const getFriends = async (req, res) => {
	try {
		const userId = req.user._id;
		const user = await User.findById(userId).populate("friends", "-password");
		if (!user) {
			return res.status(404).json({ error: "User not found" });
		}
		res.status(200).json(user.friends || []);
	} catch (error) {
		console.error("Get Friends Error:", error.message);
		res.status(500).json({ error: "Failed to load friends list" });
	}
};

export const removeFriend = async (req, res) => {
	try {
		const userId = req.user._id;
		const { friendId } = req.params;

		if (!friendId) {
			return res.status(400).json({ error: "Friend ID is required" });
		}

		const friend = await User.findById(friendId);
		if (!friend) {
			return res.status(404).json({ error: "User not found" });
		}

		await User.findByIdAndUpdate(userId, { $pull: { friends: friendId } });
        await User.findByIdAndUpdate(friendId, { $pull: { friends: userId } });

        const friendSocketId = getReceiverSocketId(friendId);
        if (friendSocketId) {
            io.to(friendSocketId).emit("friendRemoved", { _id: userId });
        }
        
		res.status(200).json({ message: "Friend removed successfully" });
	} catch (error) {
		console.error("Remove Friend Error:", error.message);
		res.status(500).json({ error: "Failed to remove friend" });
	}
};

export const updateProfile = async (req, res) => {
    try {
        const userId = req.user._id;
        const sanitizedBody = mongoSanitize.sanitize(req.body);
		const { fullName, username, profilePic, currentPassword, newPassword, removeProfilePic } = sanitizedBody;
    
        const updateData = {};
        if (fullName) updateData.fullName = fullName.trim();
        if (username) {
			const existingUser = await User.findOne({ username, _id: { $ne: userId } });
			if (existingUser) {
				return res.status(409).json({ error: "Username already taken" });
			}
			updateData.username = username.trim();
		}

		let userForFallback = null;
		const loadUserForFallback = async () => {
			if (!userForFallback) {
				userForFallback = await User.findById(userId).select("gender password");
			}
			return userForFallback;
		};

		const shouldResetProfilePic =
			removeProfilePic === true ||
			removeProfilePic === "true" ||
			profilePic === null ||
			profilePic === "";

		if (shouldResetProfilePic) {
			const user = await loadUserForFallback();
			if (!user) {
				return res.status(404).json({ error: "User not found" });
			}
			updateData.profilePic = getDefaultProfilePic(user.gender);
		} else if (typeof profilePic === "string" && profilePic.trim()) {
			updateData.profilePic = profilePic.trim();
		}

        if (currentPassword && newPassword) {
			if (newPassword.length < 6) {
				return res.status(400).json({ error: "Password must be at least 6 characters" });
			}

			const user = (await loadUserForFallback()) || (await User.findById(userId));
			if (!user) {
				return res.status(404).json({ error: "User not found" });
			}
            const isPasswordCorrect = await bcrypt.compare(currentPassword, user.password);
            
            if (!isPasswordCorrect) {
                return res.status(401).json({ error: "Current password is incorrect" });
            }
            
            const salt = await bcrypt.genSalt(10);
            updateData.password = await bcrypt.hash(newPassword, salt);
        }
    
        const updatedUser = await User.findByIdAndUpdate(
          userId,
          updateData,
          { new: true, runValidators: true }
        ).select("-password");

		if (!updatedUser) {
			return res.status(404).json({ error: "User not found" });
		}
    
        res.status(200).json(updatedUser);
      } catch (err) {
        console.error("Update profile error:", err.message);
		if (err.code === 11000) {
			return res.status(409).json({ error: "Username already exists" });
		}
        res.status(500).json({ error: "Failed to update profile" });
      }
};
