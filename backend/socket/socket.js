import { Server } from "socket.io";
import http from "http";
import express from "express";
import Message from "../models/message.model.js";
import Group from "../models/group.model.js";
import { createAdapter } from "@socket.io/redis-adapter";
import { getRedisClients, isRedisConnected } from "../utils/redis.js";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: [
      process.env.FRONTEND_URL,
      "http://localhost:5173",
      "https://chat-application-bice-ten.vercel.app",
      "https://chat-application-927d5by2g-abhay-singhs-projects-5c06d5f1.vercel.app",
    ].filter(Boolean),
    methods: ["GET", "POST"],
    credentials: true, // Ensure cookies and auth headers are passed
  },
});

// ==================== REDIS ADAPTER SETUP ====================
// Initialize Redis adapter for multi-server scalability
// This allows Socket.IO to broadcast messages across multiple server instances
const setupRedisAdapter = async () => {
  try {
    // Give Redis time to connect (it connects asynchronously in server.js)
    await new Promise((resolve) => setTimeout(resolve, 1000));

    if (isRedisConnected()) {
      const { pubClient, subClient } = getRedisClients();
      if (pubClient && subClient) {
        io.adapter(createAdapter(pubClient, subClient));
        console.log(" Socket.IO Redis adapter initialized");
      }
    } else {
      console.log("Redis not available, using default in-memory adapter");
    }
  } catch (error) {
    console.error("Error setting up Redis adapter:", error.message);
    console.log(" Falling back to default in-memory adapter");
  }
};

setupRedisAdapter();
// ================================================================

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

  // Prevent if either caller or receiver is busy
  if (activeCalls[to] || activeCalls[fromId]) {
    io.to(socket.id).emit("call:unavailable", { reason: "User is currently on another call" });
    return;
  }

  //  Set both users as in call
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

  //  Handle call end
socket.on("call:end", ({ to, from }) => {
  const receiverSocketId = getReceiverSocketId(to);
  if (receiverSocketId) {
    io.to(receiverSocketId).emit("call:end");
  }
  //  Clean active calls
  delete activeCalls[to];
  delete activeCalls[from];
});

socket.on("call:rejected", ({ to, from }) => {
  const receiverSocketId = getReceiverSocketId(to);
  if (receiverSocketId) {
    io.to(receiverSocketId).emit("call:rejected");
  }
  //  Clean active calls
  delete activeCalls[to];
  delete activeCalls[from];
});


  //  Mark message as "delivered" when received
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

  // Mark message as "seen" when opened
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

    // Auto-join user to all their groups for real-time updates
    Group.find({ members: userId })
      .select("_id")
      .then((groups) => {
        groups.forEach((g) => socket.join(`group:${g._id.toString()}`));
      })
      .catch((err) => console.error("Auto-join groups error:", err));
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
      //  Update all messages to "seen" in the database
      await Message.updateMany(
        { receiverId, senderId, status: { $ne: "seen" } },
        { $set: { status: "seen" } }
      );

      //  Get sender's socket ID
      const senderSocketId = getReceiverSocketId(senderId);

      if (senderSocketId) {
        //  Notify sender in real-time that messages are seen
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

  socket.on("group:join", async ({ groupId }) => {
    try {
      const userId = socket.handshake.query.userId;
      if (!groupId || !userId) return;
      const group = await Group.findById(groupId).select("members");
      if (!group) return;
      const isMember = group.members?.some(
        (id) => id.toString() === userId.toString()
      );
      if (!isMember) return;
      socket.join(`group:${groupId}`);
    } catch (error) {
      console.error("Group join error:", error.message);
    }
  });

  socket.on("group:leave", ({ groupId }) => {
    if (!groupId) return;
    socket.leave(`group:${groupId}`);
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
