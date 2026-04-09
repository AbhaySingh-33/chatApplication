<div align="center">

<img src="https://readme-typing-svg.demolab.com?font=Fira+Code&size=35&duration=3000&pause=500&color=6C63FF&center=true&vCenter=true&width=600&lines=💬+ChatApp;Real-Time+Chat+%2B+AI+%2B+Voice;Full-Stack+Production+App" alt="Typing SVG" />

<br/>

[![Node.js](https://img.shields.io/badge/Node.js-20-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![MongoDB](https://img.shields.io/badge/MongoDB-8-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Redis](https://img.shields.io/badge/Redis-7-DC382D?style=for-the-badge&logo=redis&logoColor=white)](https://redis.io/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-4-010101?style=for-the-badge&logo=socket.io&logoColor=white)](https://socket.io/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://docker.com/)

[![MIT License](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-Welcome-brightgreen.svg?style=for-the-badge)](CONTRIBUTING.md)
[![Railway](https://img.shields.io/badge/Deploy-Railway-0B0D0E?style=for-the-badge&logo=railway&logoColor=white)](https://railway.app/)
[![Vercel](https://img.shields.io/badge/Deploy-Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com/)

<br/>

> **ChatApp** is a production-ready, full-stack real-time chat platform combining instant messaging, group collaboration, AI-powered conversations with RAG, and WebRTC voice sessions — all in one sleek, modern interface.

<br/>

[🚀 Quick Start](#-quick-start) • [✨ Features](#-features) • [🏗️ Architecture](#️-architecture) • [📚 Docs](#-additional-documentation) • [🤝 Contributing](#-contributing)

</div>

---

## 📋 Table of Contents

- [✨ Features](#-features)
- [🏗️ Architecture](#️-architecture)
- [🛠️ Tech Stack](#️-tech-stack)
- [📁 Repository Structure](#-repository-structure)
- [⚙️ Prerequisites](#️-prerequisites)
- [🚀 Quick Start](#-quick-start)
- [🔐 Environment Variables](#-environment-variables)
- [📜 Scripts Reference](#-scripts-reference)
- [�� Docker Setup](#-docker-setup)
- [🚢 Deployment](#-deployment)
- [📚 Additional Documentation](#-additional-documentation)
- [�� Contributing](#-contributing)

---

## ✨ Features

<table>
<tr>
<td width="50%">

### 💬 Real-Time Messaging
- ⚡ Instant direct & group messaging via **Socket.IO**
- 😄 Message reactions and emoji picker
- ✍️ Live typing indicators
- 👁️ Read receipts and delivery states
- 🔔 Offline push notifications (Firebase FCM)
- 📎 File & image uploads via **Cloudinary**

</td>
<td width="50%">

### 👥 Groups & Social
- 🏘️ Create and manage group conversations
- 🛡️ Moderation controls and conflict resolution
- 🤝 Friend requests and user discovery
- 👤 Rich user profiles with avatars
- 📧 Email verification & password reset (Appwrite)
- �� Presence and online status indicators

</td>
</tr>
<tr>
<td width="50%">

### 🤖 AI & RAG Intelligence
- 🧠 AI chat powered by **Mistral** LLM
- 🔍 Retrieval-Augmented Generation with **LangChain/LangGraph**
- 📌 Vector search via **Pinecone**
- 🌐 Web-augmented answers with DuckDuckGo search
- 📄 PDF ingestion and knowledge base creation
- 🗺️ Intelligent agent routing and orchestration

</td>
<td width="50%">

### 🎙️ Voice & Media
- 🔊 Real-time voice sessions via **WebRTC** (SimplePeer)
- 🎛️ AI noise suppression for crystal-clear audio
- 🔁 Graph-based voice workflow orchestration
- 📷 Media sharing with cloud storage
- 🎨 Beautiful UI with **Tailwind CSS + DaisyUI**
- 📱 Fully responsive, mobile-friendly design

</td>
</tr>
</table>

### 🔒 Security & Auth
- 🍪 JWT cookie-based authentication
- 🔑 Bcrypt password hashing
- 🧹 MongoDB sanitization against NoSQL injection
- 🚦 CORS protection with configurable origins
- 🐳 Dockerized with non-root user for production safety

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                        CLIENT BROWSER                        │
│  React 19 + Vite  │  Zustand  │  Socket.IO  │  SimplePeer   │
└─────────────────────────────┬────────────────────────────────┘
                              │ HTTP / WebSocket / WebRTC
┌─────────────────────────────▼────────────────────────────────┐
│                     BACKEND (Express)                        │
│                                                              │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────────┐  │
│  │ REST Routes │  │  Socket.IO   │  │   RAG Pipeline     │  │
│  │  /auth      │  │  (Redis      │  │  LangChain/        │  │
│  │  /messages  │  │   Adapter)   │  │  LangGraph +       │  │
│  │  /groups    │  │              │  │  Mistral + Pinecone│  │
│  │  /ai        │  └──────┬───────┘  └────────────────────┘  │
│  │  /voice     │         │                                   │
│  └─────────────┘         │                                   │
└─────────────────────┬────┼───────────────────────────────────┘
                      │    │
        ┌─────────────▼─┐  └──────────────┐
        │   MongoDB      │   ┌─────────────▼──┐
        │  (data store)  │   │  Redis          │
        └───────────────┘   │  (pub/sub +      │
                            │   Socket adapter)│
                            └─────────────────┘
        ┌────────────┐  ┌────────────┐  ┌────────────────┐
        │ Cloudinary │  │  Appwrite  │  │    Pinecone     │
        │  (media)   │  │ (email +   │  │ (vector store)  │
        └────────────┘  │   push)    │  └────────────────┘
                        └────────────┘
```

### How it Works
1. **Frontend** — React SPA communicates via REST API and maintains a persistent WebSocket connection for real-time events.
2. **Socket.IO + Redis** — The Redis adapter enables horizontal scaling; all servers share pub/sub channels so messages and presence events are broadcast correctly across instances.
3. **RAG Pipeline** — When an AI query arrives, LangGraph routes it to the appropriate agent (web search, PDF retrieval, or direct LLM), fetches context from Pinecone, and generates a grounded response via Mistral.
4. **Voice** — SimplePeer negotiates WebRTC peer connections; the backend acts as the signaling server using Socket.IO rooms.
5. **Notifications** — Appwrite handles transactional email. Firebase FCM delivers push notifications to offline/background clients.

---

## 🛠️ Tech Stack

### Backend
| Technology | Version | Purpose |
|---|---|---|
| ![Node.js](https://img.shields.io/badge/-Node.js-339933?logo=node.js&logoColor=white) Node.js | 20 | Runtime |
| ![Express](https://img.shields.io/badge/-Express-000000?logo=express&logoColor=white) Express | 4.x | Web framework |
| ![MongoDB](https://img.shields.io/badge/-MongoDB-47A248?logo=mongodb&logoColor=white) Mongoose | 8.x | ODM / Database |
| ![Redis](https://img.shields.io/badge/-Redis-DC382D?logo=redis&logoColor=white) Redis | 7 | Pub/Sub & Socket adapter |
| ![Socket.IO](https://img.shields.io/badge/-Socket.IO-010101?logo=socket.io) Socket.IO | 4.x | Real-time events |
| ![Cloudinary](https://img.shields.io/badge/-Cloudinary-3448C5?logo=cloudinary&logoColor=white) Cloudinary | 2.x | Media storage |
| 🧠 LangChain / LangGraph | 0.3.x | AI agent orchestration |
| 🤖 Mistral AI | via API | LLM for AI chat |
| 📌 Pinecone | 5.x | Vector database (RAG) |
| 📱 Appwrite | 23.x | Email & push workflows |
| 🔐 JWT + bcryptjs | — | Auth & password hashing |

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| ![React](https://img.shields.io/badge/-React-61DAFB?logo=react&logoColor=black) React | 19 | UI library |
| ⚡ Vite | 6.x | Build tool & dev server |
| 🎨 Tailwind CSS + DaisyUI | 4.x / 5.x | Styling |
| 🐻 Zustand | 5.x | State management |
| 🔄 React Router | 7.x | Client-side routing |
| 🔌 Socket.IO Client | 4.x | WebSocket client |
| 📡 SimplePeer | 9.x | WebRTC voice |
| 🔥 Firebase | 12.x | Push notifications |
| 📅 date-fns | 4.x | Date formatting |
| 😄 emoji-picker-react | 4.x | Emoji picker |

### Infrastructure & Tooling
| Tool | Purpose |
|---|---|
| 🐳 Docker + Docker Compose | Containerization & local dev |
| 🚂 Railway | Backend deployment (CI/CD) |
| ▲ Vercel | Frontend deployment |
| ⚙️ GitHub Actions | CI/CD pipeline |
| 📝 Nodemon | Backend hot reload |
| 🔍 ESLint | Frontend code linting |

---

## 📁 Repository Structure

```
chatApplication/
├── 📂 .github/
│   └── workflows/
│       └── backend-railway-cicd.yml  # CI/CD pipeline for Railway
├── 📂 backend/
│   ├── 📂 controllers/              # Route handler logic
│   │   ├── aiChat.controller.js     # AI chat endpoints
│   │   ├── auth.controllers.js      # Login / register / logout
│   │   ├── group.controller.js      # Group management
│   │   ├── message.controller.js    # DM messaging
│   │   ├── rag.controller.js        # RAG / knowledge base
│   │   ├── resetPassword.controllers.js
│   │   ├── user.controller.js       # Profile & friends
│   │   └── voiceGraph.controller.js # Voice session workflow
│   ├── 📂 db/                       # MongoDB connection
│   ├── 📂 middleware/               # Auth, upload, sanitization
│   ├── 📂 models/                   # Mongoose schemas
│   │   ├── conversation.model.js
│   │   ├── group.model.js
│   │   ├── groupMessage.model.js
│   │   ├── message.model.js
│   │   ├── user.model.js
│   │   └── voiceSession.model.js
│   ├── 📂 rag/                      # AI / RAG pipeline
│   │   ├── agents/                  # LangGraph agents
│   │   ├── ingestion/               # PDF & web ingestion
│   │   ├── retrieval/               # Vector retrieval
│   │   ├── routing/                 # Query routing logic
│   │   ├── config.js
│   │   ├── llm.js
│   │   ├── pinecone.js
│   │   └── ragGraph.js
│   ├── 📂 routes/                   # Express route definitions
│   │   ├── aiChat.routes.js
│   │   ├── auth.routes.js
│   │   ├── group.routes.js
│   │   ├── message.routes.js
│   │   ├── user.routes.js
│   │   └── voiceGraph.routes.js
│   ├── 📂 scripts/                  # Utility scripts
│   ├── 📂 socket/
│   │   └── socket.js                # Socket.IO + Redis adapter
│   ├── 📂 utils/                    # Helpers (JWT, email, etc.)
│   ├── Dockerfile
│   └── server.js                    # Entry point
├── 📂 docs/
│   ├── deployment/
│   │   └── backend-cicd.md          # Deployment walkthrough
│   └── push-notifications/
│       └── README.md                # FCM + Appwrite push guide
├── 📂 frontend/
│   ├── 📂 src/
│   │   ├── 📂 components/           # Reusable UI components
│   │   │   ├── EmojiPickerButton.jsx
│   │   │   ├── groups/
│   │   │   ├── messages/
│   │   │   ├── sidebar/
│   │   │   └── skeletons/
│   │   ├── 📂 context/              # React context providers
│   │   ├── 📂 hooks/                # Custom React hooks
│   │   ├── 📂 pages/                # Route-level page components
│   │   │   ├── changePassword/
│   │   │   ├── groups/
│   │   │   ├── home/
│   │   │   ├── login/
│   │   │   ├── signup/
│   │   │   ├── verifyEmail/
│   │   │   └── voice/
│   │   ├── 📂 services/             # API service modules
│   │   ├── 📂 utils/                # Frontend utilities
│   │   ├── 📂 zustand/              # Zustand stores
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js
│   └── vercel.json                  # Vercel deployment config
├── docker-compose.yml               # Redis + backend for local dev
└── package-lock.json
```

---

## ⚙️ Prerequisites

Before getting started, ensure you have the following installed and configured:

| Requirement | Version | Notes |
|---|---|---|
| [Node.js](https://nodejs.org/) | ≥ 20 | JavaScript runtime |
| [npm](https://npmjs.com/) | ≥ 10 | Package manager |
| [Docker](https://docker.com/) | Any | For Redis via Compose |
| [MongoDB](https://www.mongodb.com/) | Any | Hosted (Atlas) or local |
| [Cloudinary](https://cloudinary.com/) | — | Free tier works |
| [Appwrite](https://appwrite.io/) | — | Email & push workflows |
| [Firebase](https://firebase.google.com/) | — | FCM web push keys |
| [Mistral AI](https://mistral.ai/) | — | LLM API key |
| [Pinecone](https://pinecone.io/) | — | Vector DB (free tier) |

---

## 🚀 Quick Start

### 1. Clone the repository
```bash
git clone https://github.com/AbhaySingh-33/chatApplication.git
cd chatApplication
```

### 2. Install dependencies

```bash
# Backend
cd backend && npm install

# Frontend
cd ../frontend && npm install
```

### 3. Configure environment variables
> See the [Environment Variables](#-environment-variables) section below for the full list.

```bash
# Create backend env file
cp backend/.env.example backend/.env
# Edit backend/.env with your credentials

# Create frontend env file
cp frontend/.env.example frontend/.env
# Edit frontend/.env with your credentials
```

### 4. Start Redis (via Docker)
```bash
# From the repo root
docker-compose up -d redis
```

### 5. Start the development servers

```bash
# Terminal 1 — Backend (http://localhost:3000)
cd backend && npm run dev

# Terminal 2 — Frontend (http://localhost:5173)
cd frontend && npm run dev
```

> 🎉 Open `http://localhost:5173` in your browser and start chatting!

### Full Docker Stack (Alternative)
```bash
# Builds and starts both backend + Redis
docker-compose up --build
```

---

## 🔐 Environment Variables

### Backend — `backend/.env`

```env
# ─── Server ──────────────────────────────────────────────
PORT=3000
NODE_ENV=development

# ─── Database ────────────────────────────────────────────
MONGO_DB_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/chatapp

# ─── Auth ────────────────────────────────────────────────
JWT_SECRET=your_super_secret_jwt_key
FRONTEND_URL=http://localhost:5173

# ─── Redis ───────────────────────────────────────────────
REDIS_URL=redis://localhost:6379

# ─── Cloudinary ──────────────────────────────────────────
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# ─── Appwrite ────────────────────────────────────────────
APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
APPWRITE_PROJECT_ID=your_project_id
APPWRITE_API_KEY=your_api_key
APPWRITE_EMAIL_PROVIDER_ID=your_email_provider_id
APPWRITE_PUSH_PROVIDER_ID=chattrix-fcm-prod
EMAIL_FROM_ADDRESS=no-reply@yourdomain.com

# ─── Mistral AI ──────────────────────────────────────────
MISTRAL_API_KEY=your_mistral_api_key
MISTRAL_MODEL=mistral-large-latest   # optional

# ─── Pinecone ────────────────────────────────────────────
PINECONE_API_KEY=your_pinecone_api_key
PINECONE_INDEX=chatapp-index
PINECONE_NAMESPACE_PREFIX=chatapp    # optional
```

**Reference table:**

| Variable | Required | Purpose |
|---|:---:|---|
| `MONGO_DB_URI` | ✅ | MongoDB connection string |
| `JWT_SECRET` | ✅ | JWT signing secret (keep private!) |
| `PORT` | — | Backend port (default: `3000`) |
| `FRONTEND_URL` | ✅ | Allowed CORS origin & cookie domain |
| `REDIS_URL` | ✅ | Redis for Socket.IO adapter |
| `CLOUDINARY_CLOUD_NAME` | ✅ | Cloudinary cloud identifier |
| `CLOUDINARY_API_KEY` | ✅ | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | ✅ | Cloudinary API secret |
| `APPWRITE_ENDPOINT` | ✅ | Appwrite API endpoint |
| `APPWRITE_PROJECT_ID` | ✅ | Appwrite project ID |
| `APPWRITE_API_KEY` | ✅ | Appwrite server API key |
| `APPWRITE_EMAIL_PROVIDER_ID` | — | Email provider (optional) |
| `APPWRITE_PUSH_PROVIDER_ID` | — | FCM push provider ID |
| `EMAIL_FROM_ADDRESS` | — | From address for emails |
| `MISTRAL_API_KEY` | ✅ | Mistral LLM API key |
| `MISTRAL_MODEL` | — | Model override (default: latest) |
| `PINECONE_API_KEY` | ✅ | Pinecone vector DB API key |
| `PINECONE_INDEX` | ✅ | Pinecone index name |
| `PINECONE_NAMESPACE_PREFIX` | — | Optional namespace prefix |

### Frontend — `frontend/.env`

```env
# ─── Backend API ─────────────────────────────────────────
VITE_BACKEND_URL=http://localhost:3000

# ─── Firebase ────────────────────────────────────────────
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef
VITE_FIREBASE_VAPID_KEY=your_public_vapid_key
```

| Variable | Required | Purpose |
|---|:---:|---|
| `VITE_BACKEND_URL` | ✅ | Backend base URL |
| `VITE_FIREBASE_API_KEY` | ✅ | Firebase web API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | ✅ | Firebase auth domain |
| `VITE_FIREBASE_PROJECT_ID` | ✅ | Firebase project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | ✅ | Firebase storage bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | ✅ | FCM sender ID |
| `VITE_FIREBASE_APP_ID` | ✅ | Firebase app ID |
| `VITE_FIREBASE_VAPID_KEY` | ✅ | VAPID public key for web push |

---

## 📜 Scripts Reference

### Backend (`backend/`)
```bash
npm run dev      # Start server with Nodemon (hot reload)
npm start        # Start server in production mode
npm run build    # Install all deps & build frontend bundle
```

### Frontend (`frontend/`)
```bash
npm run dev      # Start Vite dev server (http://localhost:5173)
npm run build    # Production build → dist/
npm run preview  # Preview production build locally
npm run lint     # Run ESLint
```

---

## 🐳 Docker Setup

### Local Development (Redis only)
```bash
docker-compose up -d redis
```

### Full Stack with Docker Compose
```bash
# Build and start backend + Redis
docker-compose up --build

# Run in background
docker-compose up -d --build

# View logs
docker-compose logs -f

# Stop everything
docker-compose down
```

### Backend Docker Image (standalone)
```bash
cd backend
docker build -t chatapp-backend .
docker run -p 3000:3000 --env-file .env chatapp-backend
```

> The Dockerfile uses a **multi-stage build** with a non-root user (`appuser`) for production security.

---

## 🚢 Deployment

### Backend → Railway

The GitHub Actions workflow in `.github/workflows/backend-railway-cicd.yml` automatically deploys the backend to [Railway](https://railway.app/) on every push to `main`.

**Required Railway env variables:** All variables from the backend `.env` table above.

See `docs/deployment/backend-cicd.md` for a step-by-step Railway setup guide.

### Frontend → Vercel

1. Import the repository on [Vercel](https://vercel.com/)
2. Set **Root Directory** to `frontend`
3. Set **Build Command** to `npm run build`
4. Set **Output Directory** to `dist`
5. Add all `VITE_*` environment variables in Vercel's dashboard
6. Deploy — Vercel auto-configures rewrites via `frontend/vercel.json`

### Environment Summary

| Service | Platform | Notes |
|---|---|---|
| Backend API | Railway | Docker-based, auto-deploy from `main` |
| Frontend SPA | Vercel | Vite build, SPA rewrite rules included |
| Redis | Railway / Upstash | Must be reachable by backend |
| MongoDB | MongoDB Atlas | Free M0 tier works |
| Media | Cloudinary | Free tier |
| Email / Push | Appwrite Cloud | Free tier |
| Vector DB | Pinecone | Free starter tier |

---

## 📚 Additional Documentation

| Document | Path | Description |
|---|---|---|
| 🚂 Backend CI/CD | `docs/deployment/backend-cicd.md` | Railway deployment walkthrough |
| 🔔 Push Notifications | `docs/push-notifications/README.md` | Firebase FCM + Appwrite setup |
| 🧠 RAG Pipeline | `backend/rag/` | Agent, retrieval, routing code |
| 🔌 Socket.IO Setup | `backend/socket/socket.js` | Real-time + Redis adapter |
| 🏗️ CI/CD Workflow | `.github/workflows/backend-railway-cicd.yml` | GitHub Actions pipeline |

---

## 🤝 Contributing

Contributions are welcome! Here's how to get started:

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/amazing-feature`
3. **Commit** your changes: `git commit -m 'feat: add amazing feature'`
4. **Push** to your branch: `git push origin feature/amazing-feature`
5. **Open** a Pull Request

Please follow the existing code style and include tests where applicable.

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

<div align="center">

**Built with ❤️ using Node.js, React, and a lot of ☕**

⭐ **Star this repo** if you found it helpful!

[![GitHub Stars](https://img.shields.io/github/stars/AbhaySingh-33/chatApplication?style=social)](https://github.com/AbhaySingh-33/chatApplication/stargazers)
[![GitHub Forks](https://img.shields.io/github/forks/AbhaySingh-33/chatApplication?style=social)](https://github.com/AbhaySingh-33/chatApplication/network/members)

</div>
