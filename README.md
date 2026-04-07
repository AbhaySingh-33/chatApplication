<div align="center">

# 💬 ChatApp

### A Modern Real-Time Communication Platform

[![Node.js](https://img.shields.io/badge/Node.js-20.x-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Latest-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Socket.io](https://img.shields.io/badge/Socket.io-4.8-010101?style=for-the-badge&logo=socket.io&logoColor=white)](https://socket.io/)
[![Redis](https://img.shields.io/badge/Redis-7-DC382D?style=for-the-badge&logo=redis&logoColor=white)](https://redis.io/)

**ChatApp** is a feature-rich, full-stack real-time communication platform built with modern web technologies. It combines instant messaging, AI-powered features, voice calls, and intelligent group management in a sleek, responsive interface.

[Features](#-features) • [Demo](#-demo) • [Tech Stack](#-tech-stack) • [Quick Start](#-quick-start) • [Deployment](#-deployment) • [API Docs](#-api-documentation)

</div>

## ✨ Features

### 💬 Real-Time Messaging
- **1:1 Chat**: Private conversations with real-time message delivery
- **Group Chat**: Create and manage group conversations with multiple participants
- **Emoji Support**: Rich emoji picker for expressive communication
- **Message Reactions**: React to messages with emojis
- **Read Receipts**: Track message delivery and read status
- **Online Presence**: Real-time user online/offline status

### 🤖 AI-Powered Features
- **AI Chat Assistant**: Integrated AI chatbot for intelligent conversations
- **RAG (Retrieval-Augmented Generation)**: Advanced document ingestion and retrieval
  - Web crawling and content extraction
  - Document chunking and classification
  - Vector database storage with Pinecone
  - Multi-query retrieval strategies
  - Query decomposition for complex questions
- **AI Insights Panel**: Get AI-powered insights about your conversations
- **Conflict Resolution**: AI-assisted conflict detection and resolution

### 👥 Social Features
- **Friend Request System**: Send, accept, or decline friend requests
- **User Search**: Find and connect with other users
- **Profile Management**: Customizable user profiles with avatars
- **Real-time Notifications**: Get notified about friend requests, messages, and events

### 🎤 Voice Communication
- **WebRTC Voice Calls**: High-quality peer-to-peer voice calls
- **Voice Session Graphs**: Advanced voice workflow management using LangGraph
- **Noise Suppression**: Built-in noise reduction for crystal-clear audio

### 👨‍💼 Group Management
- **Admin Controls**: Comprehensive moderation tools for group admins
- **Member Management**: Add/remove members, assign roles
- **Group Settings**: Customize group name, description, and avatar
- **Moderation Tools**: Ban, mute, and manage group members

### 🔐 Security & Authentication
- **JWT Authentication**: Secure token-based authentication via cookies
- **Email Verification**: Email verification workflow with Appwrite
- **Password Reset**: Secure password reset via email
- **Input Sanitization**: MongoDB injection protection
- **Secure File Uploads**: Cloudinary integration for safe media handling

---

## 🎯 Demo

> **Note**: Add screenshots or GIFs of your application here

### Chat Interface
![Chat Interface](docs/images/chat-interface.png)

### Group Management
![Group Chat](docs/images/group-chat.png)

### AI Assistant
![AI Chat](docs/images/ai-chat.png)

## 🛠 Tech Stack

### Backend Technologies

| Technology | Purpose |
|------------|---------|
| ![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat&logo=node.js&logoColor=white) | Runtime environment |
| ![Express](https://img.shields.io/badge/Express-000000?style=flat&logo=express&logoColor=white) | Web framework |
| ![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=flat&logo=mongodb&logoColor=white) | Database |
| ![Mongoose](https://img.shields.io/badge/Mongoose-880000?style=flat&logo=mongoose&logoColor=white) | ODM for MongoDB |
| ![Socket.io](https://img.shields.io/badge/Socket.io-010101?style=flat&logo=socket.io&logoColor=white) | Real-time communication |
| ![Redis](https://img.shields.io/badge/Redis-DC382D?style=flat&logo=redis&logoColor=white) | Caching & Socket.io adapter |
| ![JWT](https://img.shields.io/badge/JWT-000000?style=flat&logo=jsonwebtokens&logoColor=white) | Authentication |
| ![Cloudinary](https://img.shields.io/badge/Cloudinary-3448C5?style=flat&logo=cloudinary&logoColor=white) | Media storage |

### AI & Machine Learning

| Technology | Purpose |
|------------|---------|
| ![LangChain](https://img.shields.io/badge/LangChain-121212?style=flat) | LLM framework |
| ![LangGraph](https://img.shields.io/badge/LangGraph-FF6B6B?style=flat) | Agent workflows |
| ![Mistral AI](https://img.shields.io/badge/Mistral_AI-FF7000?style=flat) | Language model |
| ![Pinecone](https://img.shields.io/badge/Pinecone-000000?style=flat) | Vector database |

### Frontend Technologies

| Technology | Purpose |
|------------|---------|
| ![React](https://img.shields.io/badge/React_19-61DAFB?style=flat&logo=react&logoColor=black) | UI library |
| ![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat&logo=vite&logoColor=white) | Build tool |
| ![React Router](https://img.shields.io/badge/React_Router-CA4245?style=flat&logo=react-router&logoColor=white) | Routing |
| ![Zustand](https://img.shields.io/badge/Zustand-443E38?style=flat) | State management |
| ![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat&logo=tailwind-css&logoColor=white) | Styling |
| ![DaisyUI](https://img.shields.io/badge/DaisyUI-5A0EF8?style=flat&logo=daisyui&logoColor=white) | UI components |
| ![SimplePeer](https://img.shields.io/badge/SimplePeer-000000?style=flat) | WebRTC wrapper |

### DevOps & Tools

| Technology | Purpose |
|------------|---------|
| ![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat&logo=docker&logoColor=white) | Containerization |
| ![GitHub Actions](https://img.shields.io/badge/GitHub_Actions-2088FF?style=flat&logo=github-actions&logoColor=white) | CI/CD |
| ![Railway](https://img.shields.io/badge/Railway-0B0D0E?style=flat&logo=railway&logoColor=white) | Backend deployment |
| ![Vercel](https://img.shields.io/badge/Vercel-000000?style=flat&logo=vercel&logoColor=white) | Frontend deployment |

---

## 📁 Project Structure

```
chatApplication/
├── backend/                    # Backend Node.js application
│   ├── controllers/           # Route controllers
│   │   ├── aiChat.controller.js
│   │   ├── auth.controllers.js
│   │   ├── group.controller.js
│   │   ├── message.controller.js
│   │   ├── rag.controller.js
│   │   ├── user.controller.js
│   │   └── voiceGraph.controller.js
│   ├── models/                # Mongoose models
│   │   ├── conversation.model.js
│   │   ├── group.model.js
│   │   ├── groupMessage.model.js
│   │   ├── message.model.js
│   │   ├── user.model.js
│   │   └── voiceSession.model.js
│   ├── routes/                # API routes
│   │   ├── aiChat.routes.js
│   │   ├── auth.routes.js
│   │   ├── group.routes.js
│   │   ├── message.routes.js
│   │   ├── user.routes.js
│   │   └── voiceGraph.routes.js
│   ├── rag/                   # RAG implementation
│   │   ├── agents/            # LangGraph agents
│   │   ├── ingestion/         # Document ingestion
│   │   ├── retrieval/         # Retrieval strategies
│   │   ├── routing/           # Query routing
│   │   └── ragGraph.js        # Main RAG graph
│   ├── socket/                # Socket.io configuration
│   ├── utils/                 # Utility functions
│   │   ├── email/             # Email templates & transporter
│   │   ├── aiInsights.js
│   │   ├── conflictResolver.js
│   │   └── redis.js
│   ├── middleware/            # Express middleware
│   ├── Dockerfile             # Docker configuration
│   ├── server.js              # Entry point
│   └── package.json
│
├── frontend/                   # React frontend application
│   ├── src/
│   │   ├── components/        # React components
│   │   │   ├── groups/        # Group chat components
│   │   │   ├── messages/      # Messaging components
│   │   │   ├── sidebar/       # Sidebar components
│   │   │   └── skeletons/     # Loading skeletons
│   │   ├── pages/             # Page components
│   │   │   ├── home/          # Home & profile
│   │   │   ├── groups/        # Group pages
│   │   │   ├── login/         # Authentication
│   │   │   ├── signup/
│   │   │   ├── voice/         # Voice call page
│   │   │   ├── verifyEmail/
│   │   │   └── changePassword/
│   │   ├── context/           # React contexts
│   │   │   ├── AuthContext.jsx
│   │   │   ├── CallContext.jsx
│   │   │   └── SocketContext.jsx
│   │   ├── hooks/             # Custom React hooks
│   │   ├── zustand/           # Zustand stores
│   │   ├── utils/             # Utility functions
│   │   └── App.jsx            # Main App component
│   ├── public/                # Static assets
│   ├── vite.config.js         # Vite configuration
│   ├── vercel.json            # Vercel deployment config
│   └── package.json
│
├── .github/
│   └── workflows/             # CI/CD workflows
│       └── backend-railway-cicd.yml
│
├── docs/                      # Documentation
│   └── deployment/
│       └── backend-cicd.md
│
├── docker-compose.yml         # Docker Compose configuration
└── README.md
```

## 🚀 Quick Start

### Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v20.x or higher)
- **MongoDB** (v6.x or higher)
- **Redis** (v7.x or higher)
- **Docker & Docker Compose** (optional, for containerized Redis)
- **npm** or **yarn** package manager

### 🔧 Environment Setup

#### Backend Environment Variables

Create a `.env` file in the `backend/` directory with the following variables:

```env
# Server Configuration
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# Database
MONGO_DB_URI=mongodb://localhost:27017/chatapp
# Alternative: MONGODB_URI=mongodb://localhost:27017/chatapp

# Authentication
JWT_SECRET=your_super_secret_jwt_key_here

# Redis (for Socket.io scaling)
REDIS_URL=redis://localhost:6379

# Cloudinary (for media uploads)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Appwrite (for email services)
APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
APPWRITE_PROJECT_ID=your_project_id
APPWRITE_API_KEY=your_api_key
APPWRITE_EMAIL_PROVIDER_ID=your_email_provider_id
EMAIL_FROM_ADDRESS=noreply@yourapp.com

# AI Services
MISTRAL_API_KEY=your_mistral_api_key
MISTRAL_MODEL=mistral-large-latest  # optional
PINECONE_API_KEY=your_pinecone_api_key
PINECONE_INDEX=your_index_name
PINECONE_NAMESPACE_PREFIX=chatapp  # optional
```

#### Frontend Environment Variables

Create a `.env` file in the `frontend/` directory:

```env
VITE_API_URL=http://localhost:3000
```

### 📦 Installation

#### Option 1: Manual Setup

**1. Clone the repository**
```bash
git clone https://github.com/AbhaySingh-33/chatApplication.git
cd chatApplication
```

**2. Install backend dependencies**
```bash
cd backend
npm install
```

**3. Install frontend dependencies**
```bash
cd ../frontend
npm install
```

**4. Start Redis (using Docker)**
```bash
cd ..
docker-compose up -d redis
```

Or start Redis locally if you have it installed:
```bash
redis-server
```

**5. Start the backend server**
```bash
cd backend
npm run dev
```
The backend will run on `http://localhost:3000`

**6. Start the frontend development server**
```bash
cd ../frontend
npm run dev
```
The frontend will run on `http://localhost:5173`

#### Option 2: Docker Compose (Full Stack)

Start all services with a single command:

```bash
docker-compose up -d
```

This will start:
- Redis on port `6379`
- Backend on port `3000`

Then start the frontend separately:
```bash
cd frontend
npm run dev
```

### 🧪 Available Scripts

#### Backend Scripts

```bash
npm run dev      # Start development server with nodemon
npm start        # Start production server
npm run build    # Install deps and build frontend
```

#### Frontend Scripts

```bash
npm run dev      # Start Vite dev server
npm run build    # Build for production
npm run lint     # Run ESLint
npm run preview  # Preview production build
```

## 📡 API Documentation

### Base URL
```
Development: http://localhost:3000/api
Production: https://your-backend-url.com/api
```

### API Endpoints

#### Authentication (`/api/auth`)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/signup` | Register new user | No |
| POST | `/login` | User login | No |
| POST | `/logout` | User logout | Yes |
| GET | `/verify-email/:token` | Verify email address | No |

#### Password Reset (`/api/reset`)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/forgot-password` | Request password reset | No |
| POST | `/reset-password/:token` | Reset password | No |

#### Messages (`/api/messages`)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/:id` | Get messages with user | Yes |
| POST | `/send/:id` | Send message to user | Yes |
| POST | `/:id/react` | React to a message | Yes |
| GET | `/conflicts/:conversationId` | Get conflict insights | Yes |

#### Users (`/api/users`)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/` | Get all users | Yes |
| GET | `/me` | Get current user | Yes |
| PUT | `/profile` | Update profile | Yes |
| POST | `/friend-request/:id` | Send friend request | Yes |
| PUT | `/friend-request/:id/accept` | Accept friend request | Yes |
| DELETE | `/friend-request/:id/decline` | Decline friend request | Yes |

#### Groups (`/api/groups`)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/create` | Create new group | Yes |
| GET | `/` | Get user's groups | Yes |
| GET | `/:id` | Get group details | Yes |
| PUT | `/:id` | Update group settings | Yes |
| POST | `/:id/messages` | Send group message | Yes |
| GET | `/:id/messages` | Get group messages | Yes |
| POST | `/:id/members` | Add member | Yes |
| DELETE | `/:id/members/:userId` | Remove member | Yes |

#### AI Chat (`/api/ai-chat`)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/message` | Send message to AI | Yes |
| POST | `/ingest` | Ingest documents for RAG | Yes |
| GET | `/insights/:conversationId` | Get AI insights | Yes |

#### Voice Graph (`/api/voice-graph`)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/session` | Start voice session | Yes |
| GET | `/session/:id` | Get session details | Yes |
| PUT | `/session/:id` | Update session state | Yes |

### Socket.io Events

#### Client → Server Events
| Event | Payload | Description |
|-------|---------|-------------|
| `join-conversation` | `{ conversationId }` | Join a conversation room |
| `leave-conversation` | `{ conversationId }` | Leave a conversation room |
| `typing` | `{ receiverId }` | Notify typing status |
| `call-user` | `{ to, signal }` | Initiate voice call |
| `accept-call` | `{ to, signal }` | Accept voice call |
| `end-call` | `{ to }` | End voice call |

#### Server → Client Events
| Event | Payload | Description |
|-------|---------|-------------|
| `new-message` | `{ message }` | Receive new message |
| `message-reaction` | `{ messageId, reaction }` | Message reaction update |
| `user-online` | `{ userId }` | User came online |
| `user-offline` | `{ userId }` | User went offline |
| `friend-request` | `{ request }` | New friend request |
| `group-update` | `{ groupId, data }` | Group changes |
| `incoming-call` | `{ from, signal }` | Incoming voice call |
| `call-accepted` | `{ signal }` | Call was accepted |
| `call-ended` | `{}` | Call ended |

---

## 🚢 Deployment

### Backend Deployment (Railway)

The project includes automated CI/CD for backend deployment to Railway:

**1. GitHub Secrets Setup**

Add these secrets in your GitHub repository:
- `DOCKERHUB_USERNAME` - Your Docker Hub username
- `DOCKERHUB_TOKEN` - Docker Hub access token
- `RAILWAY_TOKEN` - Railway project token
- `RAILWAY_SERVICE` - Railway service name/ID
- `RAILWAY_ENVIRONMENT` - (optional) Railway environment

**2. Automatic Deployment**

The workflow automatically:
- ✅ Runs CI checks on pull requests
- 🐳 Builds and pushes Docker image to Docker Hub
- 🚀 Deploys to Railway on pushes to `main`

**3. Railway Environment Variables**

Configure these in Railway dashboard:
```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
REDIS_URL=your_redis_url
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
# ... other environment variables
```

For detailed deployment instructions, see [docs/deployment/backend-cicd.md](/home/runner/work/chatApplication/chatApplication/docs/deployment/backend-cicd.md:1)

### Frontend Deployment (Vercel)

**Option 1: Vercel CLI**
```bash
cd frontend
npm install -g vercel
vercel
```

**Option 2: Vercel Dashboard**
1. Import your GitHub repository
2. Set root directory to `frontend`
3. Add environment variable: `VITE_API_URL=https://your-backend-url.com`
4. Deploy!

The project includes a `frontend/vercel.json` configuration file.

### Docker Deployment

Build and run with Docker Compose:

```bash
# Build images
docker-compose build

# Start services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend (React)                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │  Chat UI │  │ Groups   │  │ Voice    │  │ AI Chat  │       │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘       │
│       └─────────────┴─────────────┴─────────────┘               │
│                         │                                        │
│              ┌──────────┴──────────┐                            │
│              │  Socket.io Client   │                            │
│              │  Axios HTTP Client  │                            │
│              └──────────┬──────────┘                            │
└─────────────────────────┼─────────────────────────────────────┘
                          │ WebSocket + HTTP
┌─────────────────────────┼─────────────────────────────────────┐
│                         │     Backend (Node.js/Express)        │
│              ┌──────────┴──────────┐                            │
│              │   Socket.io Server  │                            │
│              │   + Redis Adapter   │                            │
│              └──────────┬──────────┘                            │
│                         │                                        │
│  ┌──────────────────────┴───────────────────────┐              │
│  │            API Routes & Controllers           │              │
│  ├────────┬────────┬────────┬────────┬──────────┤              │
│  │ Auth   │ Users  │Messages│ Groups │ AI Chat  │              │
│  └────┬───┴────┬───┴────┬───┴────┬───┴────┬─────┘              │
│       │        │        │        │        │                     │
│  ┌────┴────────┴────────┴────────┴────────┴─────┐              │
│  │           MongoDB (Mongoose)                  │              │
│  │  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐        │              │
│  │  │Users │ │Msgs  │ │Groups│ │Convs │        │              │
│  │  └──────┘ └──────┘ └──────┘ └──────┘        │              │
│  └───────────────────────────────────────────────┘              │
│                                                                  │
│  ┌────────────────────────────────────────────────┐            │
│  │        AI/RAG Pipeline (LangChain/LangGraph)   │            │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐    │            │
│  │  │ Mistral  │→ │LangGraph │→ │ Pinecone │    │            │
│  │  │   LLM    │  │ Agents   │  │  Vector  │    │            │
│  │  └──────────┘  └──────────┘  └──────────┘    │            │
│  └────────────────────────────────────────────────┘            │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │    Redis     │  │  Cloudinary  │  │   Appwrite   │        │
│  │   (Cache)    │  │   (Media)    │  │   (Email)    │        │
│  └──────────────┘  └──────────────┘  └──────────────┘        │
└─────────────────────────────────────────────────────────────────┘
```

### Key Components

- **Authentication Layer**: JWT-based auth with secure cookies
- **Real-time Layer**: Socket.io with Redis adapter for horizontal scaling
- **Data Layer**: MongoDB with Mongoose ODM
- **AI Layer**: LangChain/LangGraph with Mistral LLM and Pinecone vector DB
- **Media Layer**: Cloudinary for file uploads and storage
- **Email Layer**: Appwrite for transactional emails

## 🤝 Contributing

We welcome contributions to ChatApp! Here's how you can help:

### Getting Started

1. **Fork the repository**
2. **Clone your fork**
   ```bash
   git clone https://github.com/your-username/chatApplication.git
   cd chatApplication
   ```
3. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
4. **Make your changes**
5. **Commit your changes**
   ```bash
   git commit -m "Add some amazing feature"
   ```
6. **Push to your fork**
   ```bash
   git push origin feature/amazing-feature
   ```
7. **Open a Pull Request**

### Contribution Guidelines

- Write clear, descriptive commit messages
- Follow the existing code style and conventions
- Add comments for complex logic
- Update documentation for new features
- Test your changes thoroughly
- Keep pull requests focused on a single feature/fix

### Code Style

- **Backend**: Follow Node.js best practices, use ES6+ features
- **Frontend**: Follow React best practices, use functional components and hooks
- **Formatting**: The project uses ESLint for linting

### Reporting Issues

Found a bug? Have a feature request? Please [open an issue](https://github.com/AbhaySingh-33/chatApplication/issues) with:
- Clear title and description
- Steps to reproduce (for bugs)
- Expected vs actual behavior
- Screenshots if applicable
- Your environment (OS, Node version, etc.)

---

## 📝 License

This project is licensed under the **ISC License**.

---

## 👨‍💻 Author

**Abhay Singh**

- GitHub: [@AbhaySingh-33](https://github.com/AbhaySingh-33)
- Repository: [chatApplication](https://github.com/AbhaySingh-33/chatApplication)

---

## 🙏 Acknowledgments

- [Socket.io](https://socket.io/) for real-time communication
- [LangChain](https://www.langchain.com/) for AI/LLM framework
- [Mistral AI](https://mistral.ai/) for language models
- [Pinecone](https://www.pinecone.io/) for vector database
- [Cloudinary](https://cloudinary.com/) for media management
- [Railway](https://railway.app/) for backend hosting
- [Vercel](https://vercel.com/) for frontend hosting

---

## 📊 Project Status

🚀 **Active Development** - This project is actively maintained and accepting contributions.

### Upcoming Features

- [ ] End-to-end message encryption
- [ ] Video calling support
- [ ] Message search functionality
- [ ] File sharing improvements
- [ ] Mobile app (React Native)
- [ ] Message threading
- [ ] Custom themes

---

## 📞 Support

If you have any questions or need help with setup:

1. Check the [documentation](#-quick-start)
2. Search [existing issues](https://github.com/AbhaySingh-33/chatApplication/issues)
3. Open a new issue with the `question` label

---

<div align="center">

### ⭐ Star this repository if you find it helpful!

**Made with ❤️ by Abhay Singh**

[Back to Top](#-chatapp)

</div>