# ChatApp

Real-time messaging, voice calls, and AI-powered assistance wrapped in a modern full-stack experience.

## Contents
- Overview
- Highlights
- Architecture
- Tech Stack
- Repository Layout
- Prerequisites
- Quickstart
- Environment Variables
- Common Scripts
- Deployment
- Additional Documentation

## Overview
ChatApp combines real-time chat, group collaboration, AI-assisted conversations, and voice session workflows. It is designed to be production-ready with auth, moderation, and push notifications out of the box.

## Highlights
- Direct and group messaging with reactions, conflict resolution, and moderation controls
- Presence, typing, and read-state updates through Socket.IO with Redis adapter
- AI chat, insights, and retrieval-augmented generation backed by Mistral, LangChain/LangGraph, and Pinecone
- Voice session graph workflows with WebRTC (SimplePeer)
- Friend requests, user profiles, and email flows (Appwrite)
- Offline push notifications via Firebase FCM + Appwrite

## Architecture
- **Backend**: Node.js + Express with MongoDB/Mongoose, Redis-backed Socket.IO, JWT cookie auth, Cloudinary uploads, Appwrite email/push workflows, and LangChain/LangGraph for RAG.
- **Frontend**: React 19 + Vite with React Router, Zustand state, Tailwind CSS + DaisyUI, Socket.IO client, SimplePeer/WebRTC voice, and Firebase for push delivery.
- **Shared runtime**: Backend serves the Vite build from `frontend/dist` when present. Docker Compose is provided for Redis, and CI/CD targets Railway for backend deployment.

## Tech Stack
- **Backend**: Node 20, Express, Mongoose, Redis, Cloudinary, Appwrite SDK, LangChain/LangGraph, Mistral, Pinecone.
- **Frontend**: React 19, Vite, Tailwind CSS + DaisyUI, Zustand, React Router, Socket.IO client, SimplePeer, Firebase.
- **Tooling**: ESLint (frontend), Nodemon for local backend dev, GitHub Actions workflow for Railway deploys.

## Repository Layout
- `.github/workflows/backend-railway-cicd.yml` — CI/CD pipeline for backend
- `backend/` — Express API, Socket.IO, RAG pipeline, Dockerfile
- `docs/` — Deployment notes and push-notification guide
- `frontend/` — React app, Vite config, Tailwind styles
- `docker-compose.yml` — Redis and service wiring for local dev
- `package-lock.json` — Root lockfile (backend + frontend)

## Prerequisites
- Node.js 20+ and npm
- MongoDB instance
- Redis (Docker Compose provided)
- Cloudinary account for media uploads
- Appwrite project for email/push workflows
- Firebase project + FCM keys for web push

## Quickstart
1. Install backend dependencies:
   ```bash
   cd backend
   npm install
   ```
2. Install frontend dependencies:
   ```bash
   cd ../frontend
   npm install
   ```
3. Start Redis (from the repo root):
   ```bash
   docker-compose up -d
   ```
4. Create `.env` files for `backend/` and `frontend/` using the variables below.
5. Run the backend:
   ```bash
   cd backend
   npm run dev
   ```
6. Run the frontend:
   ```bash
   cd ../frontend
   npm run dev
   ```

## Environment Variables

**Backend**

| Variable | Purpose |
| --- | --- |
| `MONGO_DB_URI` (or `MONGODB_URI`) | MongoDB connection string |
| `JWT_SECRET` | JWT signing secret |
| `PORT` | Backend port |
| `FRONTEND_URL` | Allowed origin for CORS and cookies |
| `REDIS_URL` | Redis connection string for Socket.IO adapter |
| `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | Media upload credentials |
| `APPWRITE_ENDPOINT` / `APPWRITE_PROJECT_ID` / `APPWRITE_API_KEY` | Email + push workflows |
| `APPWRITE_EMAIL_PROVIDER_ID` | Optional email provider identifier |
| `APPWRITE_PUSH_PROVIDER_ID` | Push provider for FCM (e.g., `chattrix-fcm-prod`) |
| `EMAIL_FROM_ADDRESS` | From address for transactional emails |
| `MISTRAL_API_KEY` | API key for Mistral models |
| `MISTRAL_MODEL` | Optional model override |
| `PINECONE_API_KEY` / `PINECONE_INDEX` | Vector store credentials |
| `PINECONE_NAMESPACE_PREFIX` | Optional namespace prefix for Pinecone |

**Frontend**

| Variable | Purpose |
| --- | --- |
| `VITE_BACKEND_URL` (or `VITE_API_URL`) | Backend base URL |
| `VITE_FIREBASE_API_KEY` | Firebase API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase auth domain |
| `VITE_FIREBASE_PROJECT_ID` | Firebase project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase storage bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase sender ID |
| `VITE_FIREBASE_APP_ID` | Firebase app ID |
| `VITE_FIREBASE_VAPID_KEY` | Public VAPID key for web push |

## Common Scripts

**Backend**
- `npm run dev` — start the API with Nodemon
- `npm start` — start the API in production mode
- `npm run build` — install backend + frontend deps and build the frontend bundle

**Frontend**
- `npm run dev` — start Vite dev server
- `npm run build` — production build
- `npm run lint` — run ESLint
- `npm run preview` — preview the production build

## Deployment
- CI/CD: `.github/workflows/backend-railway-cicd.yml`
- Backend Dockerfile: `backend/Dockerfile`
- Docker Compose for local services: `docker-compose.yml`
- Deployment notes: `docs/deployment/backend-cicd.md`
- Frontend config for Vercel: `frontend/vercel.json`

## Additional Documentation
- Push notifications: `docs/push-notifications/README.md`
- RAG components: see `backend/rag/` (agents, retrievers, routing)
- Socket.IO and Redis integration: `backend/socket/socket.js`
