import { Server } from "socket.io";
import http from "http";
import express from "express";
import Message from "../models/message.model.js";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: [
  "http://localhost:5173",
  "https://your-frontend-domain.com"
],
    methods: ["GET", "POST"],
    credentials: true, // Ensure cookies and auth headers are passed
  },
});

const userSocketMap = {}; // {userId: socketId}
const activeCalls = {}; // { userId: peerUserId }

export const getReceiverSocketId = (receiverId) => {
  return userSocketMap[receiverId];
};

const getUserIdFromSocketId = (socketId) => {
  const userEntry = Object.entries(userSocketMap).find(
    ([userId, sId]) => sId === socketId
  );
  return userEntry ? userEntry[0] : null; // Return userId if found, else null
};

io.on("connection", (socket) => {
  console.log("A user connected", socket.id);

  socket.on("call:user", ({ to, signal, from, callerName, isVideoCall, fromId }) => {
  const receiverSocketId = getReceiverSocketId(to);

  // 🔒 Prevent if either caller or receiver is busy
  if (activeCalls[to] || activeCalls[fromId]) {
    io.to(socket.id).emit("call:unavailable", { reason: "User is currently on another call" });
    return;
  }

  // ✅ Set both users as in call
  activeCalls[to] = fromId;
  activeCalls[fromId] = to;

  if (receiverSocketId) {
    io.to(receiverSocketId).emit("call:incoming", { from, signal, callerName, isVideoCall, fromId });
  }
});


  socket.on("call:answer", ({ to, signal,from }) => {
	const receiverSocketId = getReceiverSocketId(to);
    io.to(receiverSocketId).emit("call:accepted", signal);
  });

  // ✅ Handle call end
socket.on("call:end", ({ to, from }) => {
  const receiverSocketId = getReceiverSocketId(to);
  if (receiverSocketId) {
    io.to(receiverSocketId).emit("call:end");
  }
  // 🧹 Clean active calls
  delete activeCalls[to];
  delete activeCalls[from];
});

socket.on("call:rejected", ({ to, from }) => {
  const receiverSocketId = getReceiverSocketId(to);
  if (receiverSocketId) {
    io.to(receiverSocketId).emit("call:rejected");
  }
  // 🧹 Clean active calls
  delete activeCalls[to];
  delete activeCalls[from];
});


  // ✅ Mark message as "delivered" when received
  socket.on("messageDelivered", async ({ messageId, senderId }) => {
    if (!messageId) return;

    await Message.findByIdAndUpdate(messageId, { status: "delivered" });

    const senderSocketId = getReceiverSocketId(senderId); // Get sender's socket
    if (senderSocketId) {
      io.to(senderSocketId).emit("messageStatusUpdated", {
        messageId,
        status: "delivered",
      });
    }
  });

  // ✅ Mark message as "seen" when opened
  socket.on("messageSeen", async ({ messageId, senderId }) => {
    if (!messageId) return;

    await Message.findByIdAndUpdate(messageId, { status: "seen" });

    const senderSocketId = getReceiverSocketId(senderId); // Get sender's socket
    if (senderSocketId) {
      io.to(senderSocketId).emit("messageStatusUpdated", {
        messageId,
        status: "seen",
      });
    }
  });

  const userId = socket.handshake.query.userId;
  if (userId && userId !== "undefined") {
    userSocketMap[userId] = socket.id;
  }

  // Notify all clients about online users
  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  socket.on("typing", ({ senderId, receiverId }) => {
    const userId = getUserIdFromSocketId(senderId);

    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("userTyping", userId);
    }
  });

  socket.on("stopTyping", ({ senderId, receiverId }) => {
    const userId = getUserIdFromSocketId(senderId);
    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("userStopTyping", userId);
    }
  });

  socket.on("allmessageSeen", async ({ receiverId, senderId }) => {
    if (!receiverId || !senderId) return;

    try {
      // ✅ Update all messages to "seen" in the database
      await Message.updateMany(
        { receiverId, senderId, status: { $ne: "seen" } },
        { $set: { status: "seen" } }
      );

      // ✅ Get sender's socket ID
      const senderSocketId = getReceiverSocketId(senderId);

      if (senderSocketId) {
        // ✅ Notify sender in real-time that messages are seen
        io.to(senderSocketId).emit("allmessageStatusUpdated", {
          senderId,
          receiverId, // Include receiverId for better tracking
          status: "seen",
        });
      }
    } catch (error) {
      console.error("Error updating message status:", error);
    }
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    const userId = getUserIdFromSocketId(socket.id);
    const peerId = activeCalls[userId];

    if (peerId) {
      const peerSocketId = getReceiverSocketId(peerId);
      if (peerSocketId) {
        io.to(peerSocketId).emit("call:end");
      }
      delete activeCalls[peerId];
    }

    delete activeCalls[userId];
    delete userSocketMap[userId];
  });
});

export { app, io, server };
