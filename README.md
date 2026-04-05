<div align="center">

# 💬 ChatApp - Real-Time Communication Platform

### A Modern, Feature-Rich Chat Application

[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)
[![Node.js](https://img.shields.io/badge/Node.js-v16+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-19.0-blue.svg)](https://reactjs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Latest-green.svg)](https://www.mongodb.com/)
[![Socket.io](https://img.shields.io/badge/Socket.io-4.8-black.svg)](https://socket.io/)

A professional, full-stack real-time chat application built with cutting-edge technologies. Experience seamless communication with real-time messaging, AI-powered assistance, video calling, and more.

 [Documentation](#-installation) | [Report Bug](https://github.com/AbhaySingh-33/chatApplication/issues)

</div>

---

## ✨ Features

### 🚀 Core Functionality
- **⚡ Real-Time Messaging**: Instant message delivery using Socket.io with Redis adapter for horizontal scalability across multiple servers
- **🔐 Secure Authentication**: JWT-based authentication with bcrypt password hashing and HTTP-only cookies
- **👥 User Management**: Complete user profiles with avatar uploads and status tracking
- **📧 Email Verification**: Email verification for new accounts and password reset functionality via Nodemailer
- **🌐 Online Status**: Real-time online/offline user presence indicators

### 💡 Advanced Features
- **🤖 AI Assistant**: Integrated Mistral AI for intelligent chat assistance and conversation support
- **📹 Video & Audio Calls**: WebRTC-powered peer-to-peer video and audio calling with SimplePeer
- **📎 Media Sharing**: Image and file uploads with Cloudinary integration for optimized storage
- **💬 Message Reactions**: React to messages with emojis (❤️, 👍, 😂, etc.)
- **↩️ Message Replies**: Quote and reply to specific messages in conversations
- **📬 Notifications**: Real-time push notifications for new messages and calls
- **✅ Message Status**: Delivery and read receipts (sent, delivered, seen)

### 🎨 User Experience
- **📱 Responsive Design**: Fully responsive UI optimized for desktop, tablet, and mobile devices
- **🎨 Modern UI/UX**: Beautiful interface built with TailwindCSS 4 and DaisyUI components
- **🌙 Dark Mode Ready**: Elegant design that works in both light and dark themes
- **🔍 Search**: Quick user search functionality to find and start conversations
- **😊 Emoji Picker**: Built-in emoji picker for expressive messaging

### 🛡️ Security & Performance
- **🔒 Data Sanitization**: MongoDB injection prevention with express-mongo-sanitize
- **🚦 CORS Protection**: Configured CORS policies for secure cross-origin requests
- **⚡ Redis Caching**: High-performance caching with Redis for improved scalability
- **🐳 Docker Support**: Containerized Redis setup for easy deployment
- **🔄 Session Management**: Secure session handling with encrypted cookies

---

## 🛠️ Tech Stack

### Backend Technologies

| Category | Technology | Purpose |
|----------|-----------|---------|
| **Runtime** | Node.js | JavaScript runtime environment |
| **Framework** | Express.js 4.21+ | Fast, minimalist web framework |
| **Database** | MongoDB with Mongoose 8.12+ | NoSQL database with elegant schema modeling |
| **Real-time** | Socket.io 4.8+ | Bidirectional event-based communication |
| **Caching** | Redis 4.6+ | In-memory data structure store for scalability |
| **AI Integration** | Mistral API | Advanced AI-powered chat assistant |
| **Authentication** | JWT + bcryptjs | Secure token-based authentication |
| **File Storage** | Cloudinary + Multer | Cloud-based media storage and handling |
| **Email Service** | Nodemailer 7.0+ | Email sending for verification and password reset |
| **Security** | express-mongo-sanitize, CORS | Protection against injection and cross-origin attacks |

### Frontend Technologies

| Category | Technology | Purpose |
|----------|-----------|---------|
| **Framework** | React 19.0 | Modern UI library with latest features |
| **Build Tool** | Vite 6.2+ | Next-generation frontend tooling |
| **Styling** | TailwindCSS 4.0 + DaisyUI 5.0 | Utility-first CSS with beautiful components |
| **State Management** | Zustand 5.0+ | Lightweight state management solution |
| **Routing** | React Router DOM 7.3+ | Declarative routing for React apps |
| **Real-time** | Socket.io-client 4.8+ | Client-side real-time communication |
| **Video Calling** | SimplePeer 9.11+ | WebRTC wrapper for peer connections |
| **UI Components** | Lucide React, React Icons | Beautiful icon libraries |
| **Notifications** | React Hot Toast 2.5+ | Elegant toast notifications |
| **Emojis** | emoji-picker-react 4.12+ | Interactive emoji picker component |
| **Date Handling** | date-fns 4.1+ | Modern date utility library |

### DevOps & Tools

- **Containerization**: Docker & Docker Compose
- **Version Control**: Git & GitHub
- **Package Manager**: npm
- **Development**: Nodemon (hot reloading), ESLint (code quality)

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        Client (Browser)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   React UI   │  │  Socket.io   │  │   WebRTC     │      │
│  │  Components  │  │    Client    │  │  SimplePeer  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└────────────┬──────────────┬──────────────┬─────────────────┘
             │              │              │
             │ HTTP/HTTPS   │ WebSocket    │ P2P Connection
             │              │              │
┌────────────▼──────────────▼──────────────▼─────────────────┐
│                    Express.js Server                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │     REST     │  │  Socket.io   │  │    Auth      │     │
│  │     API      │  │    Server    │  │  Middleware  │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                          │                                  │
│  ┌──────────────────────▼───────────────────────┐         │
│  │           Redis Adapter (Pub/Sub)             │         │
│  │         (Multi-Server Scalability)            │         │
│  └────────────────────────────────────────────────         │
└────────────┬──────────────┬──────────────┬─────────────────┘
             │              │              │
             │              │              │
     ┌───────▼──────┐ ┌────▼─────┐  ┌────▼────────┐
     │   MongoDB    │ │  Redis   │  │  Cloudinary │
     │   Database   │ │  Cache   │  │   Storage   │
     └──────────────┘ └──────────┘  └─────────────┘
             │
     ┌───────▼──────────┐
    │     Mistral      │
     │    AI Service    │
     └──────────────────┘
```

### Key Architectural Components

- **Frontend (React)**: Single-page application with real-time updates
- **Backend (Express)**: RESTful API server handling business logic
- **WebSocket (Socket.io)**: Real-time bidirectional communication
- **Database (MongoDB)**: Document-based storage for users, messages, and conversations
- **Cache (Redis)**: Session management and Socket.io adapter for horizontal scaling
- **AI Service**: Mistral API integration for intelligent responses
- **Media Storage**: Cloudinary CDN for optimized image delivery

---

## 📋 Prerequisites

Before you begin, ensure you have the following installed on your system:

- **Node.js** (v16 or higher) - [Download](https://nodejs.org/)
- **MongoDB** (v4.4 or higher) - [Download](https://www.mongodb.com/try/download/community) or use [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- **Redis** (v7 or higher) - [Download](https://redis.io/download) or use Docker
- **Docker** (optional, recommended for Redis) - [Download](https://www.docker.com/get-started)
- **Git** - [Download](https://git-scm.com/downloads)

### Additional Requirements

- **Cloudinary Account** (free tier available) - [Sign up](https://cloudinary.com/users/register/free)
- **Mistral API Key** (for AI features) - [Get API Key](https://console.mistral.ai/)
- **Gmail Account** (for email features, with App Password enabled) - [Setup Guide](https://support.google.com/accounts/answer/185833)

---

## ⚙️ Installation & Setup

### Step 1: Clone the Repository

```bash
git clone https://github.com/AbhaySingh-33/chatApplication.git
cd chatApplication
```

### Step 2: Backend Configuration

Navigate to the backend directory and install dependencies:

```bash
cd backend
npm install
```

Create a `.env` file in the `backend` directory with the following configuration:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/chatapp
# Or use MongoDB Atlas:
# MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/chatapp?retryWrites=true&w=majority

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_min_32_characters_long

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173

# Cloudinary Configuration (for file uploads)
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Redis Configuration (for Socket.io scaling)
REDIS_URL=redis://localhost:6379
# Or use Redis Cloud:
# REDIS_URL=redis://username:password@redis-xxxxx.cloud.redislabs.com:12345

# Email Configuration (SMTP / Nodemailer)
EMAIL_FROM_ADDRESS=ChatApp <no-reply@your-domain.com>
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_gmail_app_password
# Optional alternative to SMTP_HOST:
# SMTP_SERVICE=Gmail
# Optional fallback provider (used if SMTP fails):
# BREVO_API_KEY=your_brevo_api_key

# Mistral AI Configuration (for AI assistant)
MISTRAL_API_KEY=your_mistral_api_key
# Optional model override
# MISTRAL_MODEL=mistral-small-latest
```

### Step 3: Frontend Configuration

Navigate to the frontend directory and install dependencies:

```bash
cd ../frontend
npm install
```

Create a `.env` file in the `frontend` directory:

```env
# Backend API URL
VITE_API_URL=http://localhost:5000
```

### Step 4: Start Redis Server

#### Option A: Using Docker (Recommended)

From the project root directory:

```bash
docker-compose up -d
```

This will start Redis in a Docker container with persistent data storage.

#### Option B: Local Redis Installation

If you have Redis installed locally:

```bash
redis-server
```

### Step 5: Verify Installation

Check that Redis is running:

```bash
redis-cli ping
# Should return: PONG
```

---

## 🚀 Running the Application

### Development Mode

You'll need **three terminal windows**:

#### Terminal 1: Redis Server (if not using Docker)
```bash
# Skip if using docker-compose
redis-server
```

#### Terminal 2: Backend Server
```bash
cd backend
npm run dev
```

The backend will start on `http://localhost:5000`

#### Terminal 3: Frontend Development Server
```bash
cd frontend
npm run dev
```

The frontend will start on `http://localhost:5173`

### Production Mode

#### Build the Frontend

```bash
cd frontend
npm run build
```

#### Start the Backend

```bash
cd backend
npm start
```

The backend will serve the built frontend from the `frontend/dist` directory.

### Access the Application

Open your browser and navigate to:
- **Development**: `http://localhost:5173`
- **Production**: `http://localhost:5000`

---

## 📁 Project Structure

```
chatApplication/
├── backend/                      # Backend Node.js/Express application
│   ├── controllers/             # Request handlers and business logic
│   │   ├── aiChat.controller.js         # AI assistant functionality
│   │   ├── auth.controllers.js          # Authentication logic
│   │   ├── message.controller.js        # Message CRUD operations
│   │   ├── resetPassword.controllers.js # Password reset logic
│   │   └── user.controller.js           # User management
│   ├── db/                      # Database configuration
│   │   └── connectToMongoDB.js          # MongoDB connection setup
│   ├── middleware/              # Express middleware
│   │   └── protectRoute.js              # JWT authentication middleware
│   ├── models/                  # MongoDB/Mongoose schemas
│   │   ├── conversation.model.js        # Conversation schema
│   │   ├── message.model.js             # Message schema with reactions
│   │   └── user.model.js                # User schema
│   ├── routes/                  # API route definitions
│   │   ├── aiChat.routes.js             # AI chat endpoints
│   │   ├── auth.routes.js               # Authentication endpoints
│   │   ├── message.routes.js            # Message endpoints
│   │   └── user.routes.js               # User endpoints
│   ├── socket/                  # Socket.io configuration
│   │   └── socket.js                    # WebSocket setup with Redis
│   ├── utils/                   # Utility functions
│   │   ├── generateToken.js             # JWT token generation
│   │   ├── redis.js                     # Redis client setup
│   │   └── sendEmail.js                 # Email sending utility
│   ├── server.js                # Main application entry point
│   ├── package.json             # Backend dependencies
│   └── .env                     # Backend environment variables
│
├── frontend/                    # Frontend React application
│   ├── public/                  # Static public assets
│   │   ├── logo.png                     # Application logo
│   │   └── default.png                  # Default profile picture
│   ├── src/                     # Source code
│   │   ├── assets/             # Images, icons, and sounds
│   │   │   └── sounds/                  # Notification sounds
│   │   ├── components/         # Reusable React components
│   │   │   ├── messages/               # Message-related components
│   │   │   │   ├── Message.jsx                # Individual message
│   │   │   │   ├── MessageContainer.jsx       # Message container with video call
│   │   │   │   ├── MessageInput.jsx           # Message input with file upload
│   │   │   │   └── Messages.jsx               # Message list
│   │   │   ├── sidebar/                # Sidebar components
│   │   │   │   ├── AIAssistant.jsx            # AI chat interface
│   │   │   │   ├── Conversation.jsx           # Conversation item
│   │   │   │   ├── Conversations.jsx          # Conversation list
│   │   │   │   ├── LogoutButton.jsx           # Logout functionality
│   │   │   │   ├── Notifications.jsx          # Notification center
│   │   │   │   ├── SearchInput.jsx            # User search
│   │   │   │   └── Sidebar.jsx                # Main sidebar
│   │   │   ├── skeletons/              # Loading skeleton components
│   │   │   │   └── MessageSkeleton.jsx        # Message loading state
│   │   │   └── EmojiPickerButton.jsx   # Emoji picker component
│   │   ├── context/            # React Context providers
│   │   │   ├── AuthContext.jsx              # Authentication state
│   │   │   └── SocketContext.jsx            # Socket.io connection
│   │   ├── hooks/              # Custom React hooks
│   │   │   ├── useAIChat.js                 # AI chat functionality
│   │   │   ├── useGetConversations.js       # Fetch conversations
│   │   │   ├── useGetMe.js                  # Get current user
│   │   │   ├── useGetMessages.js            # Fetch messages
│   │   │   ├── useListenFriendUpdates.js    # Listen to friend status
│   │   │   ├── useListenMessages.js         # Real-time message listener
│   │   │   ├── useLogin.js                  # Login functionality
│   │   │   ├── useLogout.js                 # Logout functionality
│   │   │   ├── useReactToMessage.js         # Message reactions
│   │   │   ├── useSendMessage.js            # Send messages
│   │   │   └── useSignup.js                 # Signup functionality
│   │   ├── pages/              # Page components (routes)
│   │   │   ├── changePassword/         # Password management
│   │   │   │   ├── ForgotPassword.jsx       # Forgot password page
│   │   │   │   └── ResetPassword.jsx        # Reset password page
│   │   │   ├── home/                   # Main app pages
│   │   │   │   ├── Home.jsx                 # Chat home page
│   │   │   │   └── Profile.jsx              # User profile page
│   │   │   ├── login/                  # Authentication pages
│   │   │   │   └── Login.jsx                # Login page
│   │   │   ├── signup/                 
│   │   │   │   ├── GenderCheckbox.jsx       # Gender selection
│   │   │   │   └── SignUp.jsx               # Signup page
│   │   │   └── verifyEmail/            # Email verification
│   │   │       ├── Verification.jsx         # Email verification page
│   │   │       └── VerifyEmail.jsx          # Verify email handler
│   │   ├── utils/              # Utility functions
│   │   │   ├── emojis.js                    # Emoji utilities
│   │   │   └── extractTime.js               # Time formatting
│   │   ├── zustand/            # Zustand state management
│   │   │   └── useConversation.js           # Conversation state
│   │   ├── App.jsx             # Main App component
│   │   └── main.jsx            # Application entry point
│   ├── index.html              # HTML template
│   ├── vite.config.js          # Vite configuration
│   ├── eslint.config.js        # ESLint configuration
│   ├── package.json            # Frontend dependencies
│   └── .env                    # Frontend environment variables
│
├── docker-compose.yml          # Docker services configuration
├── .gitignore                  # Git ignore rules
└── README.md                   # This file
```

---

## 📡 API Documentation

### Authentication Endpoints

#### POST `/api/auth/signup`
Register a new user account.

**Request Body:**
```json
{
  "fullName": "John Doe",
  "username": "johndoe",
  "email": "john@example.com",
  "password": "securePassword123",
  "confirmPassword": "securePassword123",
  "gender": "male"
}
```

**Response:**
```json
{
  "_id": "65c0c0c0c0c0c0c0c0c0c0c0",
  "fullName": "John Doe",
  "username": "johndoe",
  "email": "john@example.com",
  "profilePic": "https://avatar.iran.liara.run/public/boy"
}
```

#### POST `/api/auth/login`
Authenticate and login a user.

**Request Body:**
```json
{
  "username": "johndoe",
  "password": "securePassword123"
}
```

#### POST `/api/auth/logout`
Logout the current user and clear JWT cookie.

#### POST `/api/auth/reset`
Send password reset email to user.

**Request Body:**
```json
{
  "email": "john@example.com"
}
```

### Message Endpoints

All message endpoints require authentication (JWT token in cookie).

#### GET `/api/messages/:id`
Get all messages in a conversation with a specific user.

**URL Parameters:**
- `id` - User ID of the conversation partner

**Response:**
```json
[
  {
    "_id": "message_id",
    "senderId": "sender_user_id",
    "receiverId": "receiver_user_id",
    "message": "Hello!",
    "media": "https://res.cloudinary.com/...",
    "status": "seen",
    "reactions": [
      {
        "userId": "user_id",
        "emoji": "❤️"
      }
    ],
    "replyTo": {
      "messageId": "original_message_id",
      "text": "Previous message text"
    },
    "createdAt": "2024-02-07T10:30:00.000Z"
  }
]
```

#### POST `/api/messages/send/:id`
Send a message to a specific user.

**URL Parameters:**
- `id` - Receiver's user ID

**Request Body:**
```json
{
  "message": "Hello, how are you?",
  "media": "optional_image_url",
  "replyTo": {
    "messageId": "optional_reply_message_id",
    "text": "optional_original_message_text"
  }
}
```

#### POST `/api/messages/react/:messageId`
Add a reaction to a message.

**Request Body:**
```json
{
  "emoji": "❤️"
}
```

### User Endpoints

#### GET `/api/users`
Get all users for the sidebar (excluding current user).

**Response:**
```json
[
  {
    "_id": "user_id",
    "fullName": "Jane Doe",
    "username": "janedoe",
    "profilePic": "https://avatar.iran.liara.run/public/girl",
    "isOnline": true
  }
]
```

#### GET `/api/users/:id`
Get a specific user by ID.

#### PUT `/api/users/profile`
Update current user's profile.

**Request Body:**
```json
{
  "fullName": "John Doe Updated",
  "profilePic": "new_profile_pic_url"
}
```

### AI Chat Endpoints

#### GET `/api/ai/conversation`
Get or create a conversation with the AI assistant.

#### POST `/api/ai/message`
Send a message to the AI assistant.

**Request Body:**
```json
{
  "text": "What's the weather like?"
}
```

#### GET `/api/ai/messages`
Get all messages in the AI conversation.

---

## 🔌 WebSocket Events

The application uses Socket.io for real-time communication. Here are the key events:

### Client → Server Events

- **`getOnlineUsers`** - Request list of online users
- **`call-user`** - Initiate a video/audio call
- **`accept-call`** - Accept an incoming call
- **`decline-call`** - Decline an incoming call
- **`end-call`** - End an active call
- **`ice-candidate`** - WebRTC ICE candidate exchange
- **`call-signal`** - WebRTC signaling data

### Server → Client Events

- **`getOnlineUsers`** - Receive list of currently online users
- **`newMessage`** - Receive a new message
- **`messageStatusUpdate`** - Message status changed (sent/delivered/seen)
- **`incomingCall`** - Receive incoming call notification
- **`call-accepted`** - Call was accepted by recipient
- **`call-declined`** - Call was declined by recipient
- **`call-ended`** - Call ended by peer
- **`ice-candidate`** - Receive WebRTC ICE candidate
- **`call-signal`** - Receive WebRTC signaling data
- **`userStatusChange`** - User went online/offline

---

## 🐳 Docker Deployment

### Using Docker Compose

The project includes a `docker-compose.yml` file for easy Redis setup:

```bash
# Start Redis container
docker-compose up -d

# Stop Redis container
docker-compose down

# View Redis logs
docker logs chatapp-redis

# Access Redis CLI
docker exec -it chatapp-redis redis-cli
```

### Full Stack Docker Deployment (Optional)

You can create a complete Docker setup for the entire application. Here's a basic `Dockerfile` for the backend:

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

EXPOSE 5000

CMD ["npm", "start"]
```

---

## 🌐 Deployment Guide

### Backend Deployment

#### Deploying to Render.com

1. Create a new Web Service on [Render](https://render.com)
2. Connect your GitHub repository
3. Configure the following:
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Environment Variables**: Add all variables from `.env`
4. Deploy!

#### Deploying to Railway.app

1. Install Railway CLI: `npm i -g @railway/cli`
2. Login: `railway login`
3. Initialize: `railway init`
4. Add environment variables: `railway variables`
5. Deploy: `railway up`

#### Deploying to Heroku

```bash
# Login to Heroku
heroku login

# Create a new Heroku app
heroku create your-app-name

# Set environment variables
heroku config:set JWT_SECRET=your_secret
heroku config:set MONGODB_URI=your_mongodb_uri
# ... (set all other env variables)

# Deploy
git push heroku main
```

### Frontend Deployment

#### Deploying to Vercel

1. Install Vercel CLI: `npm i -g vercel`
2. Navigate to frontend directory: `cd frontend`
3. Build the project: `npm run build`
4. Deploy: `vercel --prod`
5. Set environment variable: `VITE_API_URL` to your backend URL

#### Deploying to Netlify

1. Build the frontend: `npm run build`
2. Install Netlify CLI: `npm i -g netlify-cli`
3. Deploy: `netlify deploy --prod --dir=dist`

### Database & Cache Services

- **MongoDB Atlas**: Free tier available at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
- **Redis Cloud**: Free tier available at [redis.com/try-free](https://redis.com/try-free/)
- **Upstash Redis**: Serverless Redis at [upstash.com](https://upstash.com/)

### Important Deployment Notes

1. **Update CORS Origins**: In `backend/socket/socket.js`, add your production frontend URL to the CORS origins array
2. **Update Frontend URL**: Set `FRONTEND_URL` environment variable to your production frontend URL
3. **Secure JWT Secret**: Use a strong, randomly generated JWT secret (min 32 characters)
4. **Enable SSL**: Ensure both frontend and backend use HTTPS in production
5. **Database Indexes**: Create indexes on frequently queried fields for better performance

---

## 🔐 Security Best Practices

This application implements several security measures:

- ✅ **JWT Authentication**: Secure token-based authentication with HTTP-only cookies
- ✅ **Password Hashing**: Passwords are hashed using bcrypt with salt rounds
- ✅ **MongoDB Injection Prevention**: Using express-mongo-sanitize to clean user input
- ✅ **CORS Configuration**: Properly configured CORS to allow only trusted origins
- ✅ **Environment Variables**: Sensitive data stored in environment variables
- ✅ **Input Validation**: Server-side validation of all user inputs
- ✅ **Rate Limiting**: Consider adding express-rate-limit for API endpoints (optional enhancement)
- ✅ **Helmet**: Consider adding helmet.js for additional HTTP header security (optional enhancement)

### Security Recommendations

1. **Never commit `.env` files** to version control
2. **Use strong JWT secrets** (minimum 32 characters, random)
3. **Enable 2FA for email accounts** used for notifications
4. **Regularly update dependencies** to patch security vulnerabilities
5. **Use HTTPS** in production environments
6. **Implement rate limiting** to prevent abuse
7. **Regular security audits**: Run `npm audit` and fix vulnerabilities

---

## 🧪 Testing

### Backend Testing

```bash
cd backend
npm test
```

### Frontend Testing

```bash
cd frontend
npm test
```

### End-to-End Testing

The application supports E2E testing with tools like Cypress or Playwright. (Setup required)

---

## 🐛 Troubleshooting

### Common Issues and Solutions

#### Redis Connection Failed

**Problem**: `Error: Redis connection failed: ECONNREFUSED`

**Solution**:
```bash
# Check if Redis is running
redis-cli ping

# Start Redis with Docker
docker-compose up -d

# Or start local Redis
redis-server
```

#### MongoDB Connection Error

**Problem**: `MongoNetworkError: failed to connect to server`

**Solution**:
- Check if MongoDB is running: `sudo systemctl status mongod`
- Verify `MONGODB_URI` in `.env` file
- For MongoDB Atlas, ensure your IP is whitelisted

#### Port Already in Use

**Problem**: `Error: listen EADDRINUSE: address already in use :::5000`

**Solution**:
```bash
# Find process using the port
lsof -i :5000

# Kill the process
kill -9 <PID>

# Or change the PORT in .env
```

#### Cloudinary Upload Failed

**Problem**: Images not uploading

**Solution**:
- Verify Cloudinary credentials in `.env`
- Check file size limits (default: 10MB)
- Ensure file format is supported (JPEG, PNG, GIF, WebP)

#### AI Assistant Not Responding

**Problem**: AI returns error messages

**Solution**:
- Verify `MISTRAL_API_KEY` is set correctly in `.env`
- Check API quota limits on your Mistral account
- If needed, set `MISTRAL_MODEL` in `.env` (default: `mistral-small-latest`)

#### WebRTC Video Call Not Working

**Problem**: Video calls fail to connect

**Solution**:
- Ensure both users have granted camera/microphone permissions
- Check browser console for WebRTC errors
- Verify firewall settings allow WebRTC connections
- Test on HTTPS (required for production WebRTC)

#### Email Not Sending

**Problem**: Password reset emails not delivered

**Solution**:
- Use an App Password for Gmail/Google Workspace SMTP
- Verify `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, and `SMTP_PASSWORD` in `.env`
- Verify `EMAIL_FROM_ADDRESS` is set to a valid sender
- Check spam folder
- Review email service console logs

### Debug Mode

To enable verbose logging, set in `.env`:
```env
NODE_ENV=development
DEBUG=socket.io:*
```

---

## 📈 Performance Optimization

### Implemented Optimizations

- **Redis Caching**: Session data and Socket.io adapter for multi-server scalability
- **Lazy Loading**: React components loaded on demand
- **Image Optimization**: Cloudinary automatic format conversion and compression
- **Code Splitting**: Vite automatically splits code into smaller chunks
- **MongoDB Indexes**: Indexed fields for faster queries
- **WebSocket Compression**: Enabled Socket.io payload compression

### Recommended Enhancements

- Implement CDN for static assets
- Add database query caching with Redis
- Enable Gzip/Brotli compression on server
- Implement pagination for message history
- Use React.memo for expensive components
- Add service workers for offline support

---

## 🤝 Contributing

We welcome contributions to ChatApp! Here's how you can help:

### How to Contribute

1. **Fork the repository**
   ```bash
   git clone https://github.com/AbhaySingh-33/chatApplication.git
   ```

2. **Create a feature branch**
   ```bash
   git checkout -b feature/AmazingFeature
   ```

3. **Make your changes**
   - Follow the existing code style
   - Add comments for complex logic
   - Update documentation if needed

4. **Test your changes**
   ```bash
   npm run test
   npm run lint
   ```

5. **Commit your changes**
   ```bash
   git commit -m 'Add some AmazingFeature'
   ```

6. **Push to your branch**
   ```bash
   git push origin feature/AmazingFeature
   ```

7. **Open a Pull Request**
   - Provide a clear description of the changes
   - Reference any related issues

### Code Style Guidelines

- Use ES6+ features
- Follow ESLint configuration
- Write meaningful commit messages
- Add JSDoc comments for functions
- Keep functions small and focused

### Reporting Issues

Found a bug? Please open an issue with:
- Clear description of the problem
- Steps to reproduce
- Expected vs actual behavior
- Screenshots (if applicable)
- Environment details (OS, Browser, Node version)

---

## 🗺️ Roadmap

### Planned Features

- [ ] **Group Chats**: Support for multi-user conversations
- [ ] **Voice Messages**: Record and send voice notes
- [ ] **File Sharing**: Share documents, PDFs, and other file types
- [ ] **Message Search**: Search through message history
- [ ] **User Status**: Custom status messages
- [ ] **Typing Indicators**: Show when users are typing
- [ ] **Message Editing**: Edit sent messages
- [ ] **Message Deletion**: Delete messages for everyone
- [ ] **Push Notifications**: Browser push notifications
- [ ] **Mobile App**: React Native mobile application
- [ ] **End-to-End Encryption**: Enhanced security with E2E encryption
- [ ] **Dark Mode**: Full dark mode support
- [ ] **Themes**: Customizable color themes
- [ ] **Language Support**: Multi-language internationalization

---

## 📜 License

This project is licensed under the **ISC License**.

```
ISC License

Copyright (c) 2024 Abhay Singh

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted, provided that the above
copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE
OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
```

---

## 👨‍💻 Author

**Abhay Singh**

- GitHub: [@AbhaySingh-33](https://github.com/AbhaySingh-33)
- Project: [ChatApp Repository](https://github.com/AbhaySingh-33/chatApplication)

---

## 🙏 Acknowledgments

- [Socket.io](https://socket.io/) for real-time communication
- [MongoDB](https://www.mongodb.com/) for the database
- [React](https://reactjs.org/) for the amazing UI library
- [TailwindCSS](https://tailwindcss.com/) for the utility-first CSS framework
- [Cloudinary](https://cloudinary.com/) for media storage
- [Mistral AI](https://mistral.ai/) for AI capabilities
- All open-source contributors and maintainers

---

## 📞 Support

If you like this project, please give it a ⭐️!

For support, email [support@example.com](mailto:support@example.com) or open an issue on GitHub.

---

<div align="center">

### Made with ❤️ by Abhay Singh

**Happy Coding! 🚀**

[⬆ Back to Top](#-chatapp---real-time-communication-platform)

</div>
