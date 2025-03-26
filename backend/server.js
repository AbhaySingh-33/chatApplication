import path from "path";
import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";

import authRoutes from "./routes/auth.routes.js";
import messageRoutes from "./routes/message.routes.js";
import userRoutes from "./routes/user.routes.js";

import connectToMongoDB from "./db/connectToMongoDB.js";
import { app, server } from "./socket/socket.js";

import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename); // For resolving directory paths

dotenv.config();

const PORT = process.env.PORT || 5000;

app.use(express.json()); // Parse incoming JSON requests
app.use(cookieParser()); // Parse cookies from requests

// Enable CORS with credentials
app.use(
	cors({
		origin: "http://localhost:5173", // Change this to your frontend's deployed URL for production
		credentials: true,
	})
);

// API Routes
app.use("/api/auth", authRoutes); // Authentication routes
app.use("/api/messages", messageRoutes); // Messaging routes
app.use("/api/users", userRoutes); // User-related routes

// Serve uploaded files statically
app.use("/uploads", express.static(path.join(__dirname, "./controllers/uploads")));

// Serve frontend static files (for deployment)
app.use(express.static(path.join(__dirname, "../frontend/dist")));

// Handle all other routes and serve the frontend app
app.get("*", (req, res) => {
	res.sendFile(path.join(__dirname, "../frontend", "dist", "index.html"));
});

// Ensure MongoDB is connected before starting the server
server.listen(PORT, async () => {
	await connectToMongoDB(); // Connect to MongoDB
	console.log(`Server Running on port ${PORT}`);
});
