import path from "path";
import fs from "fs";
import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import mongoSanitize from "express-mongo-sanitize";

import authRoutes from "./routes/auth.routes.js";
import messageRoutes from "./routes/message.routes.js";
import userRoutes from "./routes/user.routes.js";
import aiChatRoutes from "./routes/aiChat.routes.js";

import connectToMongoDB from "./db/connectToMongoDB.js";
import { app, server, io } from "./socket/socket.js";
import { initializeRedis, closeRedis } from "./utils/redis.js";

// use for serving static files
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename); // For resolving directory paths


dotenv.config();
console.log("Cloudinary Cloud Name:", process.env.CLOUDINARY_CLOUD_NAME);

// Validate required environment variables
const requiredEnvVars = ["MONGO_DB_URI", "JWT_SECRET"];
const missingEnvVars = requiredEnvVars.filter((key) => !process.env[key]);
if (missingEnvVars.length > 0) {
  console.error(`CRITICAL ERROR: Missing required environment variables: ${missingEnvVars.join(", ")}`);
  console.error("Please add these to your .env file or deployment environment variables.");
  // process.exit(1); // Optional: Exit process if critical variables are missing
}



const PORT = process.env.PORT || 5000;

app.use(express.json()); // Parse incoming JSON requests
app.use(cookieParser()); // Parse cookies from requests
app.use(mongoSanitize()); // Sanitize user input to prevent NoSQL injection attacks

// Enable CORS with credentials
app.use(
	cors({
		origin: [
			process.env.FRONTEND_URL,
		].filter(Boolean), // Allow mapped origins
		credentials: true,
	})
);

// API Routes
app.use("/api/auth", authRoutes); // Authentication routes
app.use("/api/messages", messageRoutes); // Messaging routes
app.use("/api/users", userRoutes); // User-related routes
app.use("/api/friends", userRoutes);
app.use("/api/reset", authRoutes);
app.use("/api/ai-chat", aiChatRoutes); 


// Serve frontend static files (for deployment)  express.static is middleware serve ststic files whithout creating routes
app.use(express.static(path.join(__dirname, "../frontend/dist")));

// Handle all other routes and serve the frontend app
app.get("*", (req, res) => {
	const frontendIndex = path.join(__dirname, "../frontend", "dist", "index.html");
	if (fs.existsSync(frontendIndex)) {
		res.sendFile(frontendIndex);
	} else {
		res.status(404).json({ message: "Frontend files not found. Ensure the frontend is built and exists in ../frontend/dist, or use the API routes." });
	}
});

// Ensure MongoDB is connected before starting the server
server.listen(PORT, async () => {
	await connectToMongoDB(); // Connect to MongoDB
	await initializeRedis(); // Initialize Redis for Socket.IO adapter (optional)
	console.log(`Server Running on port ${PORT}`);
});

// Graceful shutdown
process.on("SIGTERM", async () => {
	console.log("SIGTERM received, shutting down gracefully");
	await closeRedis();
	process.exit(0);
});

process.on("SIGINT", async () => {
	console.log("SIGINT received, shutting down gracefully");
	await closeRedis();
	process.exit(0);
});

