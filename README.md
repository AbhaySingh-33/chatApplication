# ChatApp

ChatApp is a full-stack real-time communication platform with:

- 1:1 messaging
- Group chat with moderation controls
- AI chat + RAG ingestion/retrieval
- Voice session graph workflows
- Friend request system
- Real-time presence and events via Socket.IO
- Offline web push notifications for chat messages (Appwrite + Firebase FCM)

This README is updated to match the current repository contents.

## Repository Layout

Top-level folders/files:

- `.github/workflows/backend-railway-cicd.yml`
- `backend/`
- `docs/deployment/backend-cicd.md`
- `frontend/`
- `docker-compose.yml`
- `README.md`
- `package-lock.json`

## Backend Overview

Backend stack:

- Node.js + Express
- MongoDB + Mongoose
- Socket.IO + Redis adapter
- JWT auth via cookies
- Cloudinary uploads
- Appwrite email workflows
- Mistral + LangChain/LangGraph + Pinecone for RAG

Backend scripts from `backend/package.json`:

- `npm run dev` -> start with nodemon
- `npm start` -> start production server
- `npm run build` -> install deps and build frontend from backend context

Backend API route mounts from `backend/server.js`:

- `/api/auth`
- `/api/reset`
- `/api/messages`
- `/api/users`
- `/api/friends`
- `/api/ai-chat`
- `/api/groups`
- `/api/voice-graph`

Backend service behavior:

- Connects to MongoDB on startup
- Initializes Redis and Socket.IO Redis adapter when available
- Serves frontend build from `frontend/dist` if present
- Uses CORS with `FRONTEND_URL` and configured production origins
- Applies `express-mongo-sanitize` and cookie parsing middleware

## Frontend Overview

Frontend stack:

- React 19 + Vite
- React Router
- Zustand for state
- Socket.IO client
- SimplePeer (WebRTC)
- Tailwind CSS + DaisyUI

Frontend scripts from `frontend/package.json`:

- `npm run dev`
- `npm run build`
- `npm run lint`
- `npm run preview`

Frontend includes:

- Auth pages (login/signup/verify/reset)
- 1:1 chat UI + emoji + reactions + conflict panel + AI insights panel
- Group chat UI + settings/admin moderation controls
- Voice call page/components
- Shared contexts for auth, call, socket state
- Browser push notifications for offline message alerts

Detailed setup and implementation notes for push notifications:

- `docs/push-notifications/README.md`

## Environment Variables

Backend required at minimum:

- `MONGO_DB_URI` (or `MONGODB_URI`)
- `JWT_SECRET`

Common backend variables used in the codebase:

- `PORT`
- `FRONTEND_URL`
- `REDIS_URL`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `APPWRITE_ENDPOINT`
- `APPWRITE_PROJECT_ID`
- `APPWRITE_API_KEY`
- `APPWRITE_EMAIL_PROVIDER_ID` (optional)
- `APPWRITE_PUSH_PROVIDER_ID` (required for push notifications, example: `chattrix-fcm-prod`)
- `EMAIL_FROM_ADDRESS`
- `MISTRAL_API_KEY`
- `MISTRAL_MODEL` (optional)
- `PINECONE_API_KEY`
- `PINECONE_INDEX`
- `PINECONE_NAMESPACE_PREFIX` (optional)

Frontend variables:

- `VITE_BACKEND_URL` (or `VITE_API_URL` if used in your local setup)
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_FIREBASE_VAPID_KEY`

## Local Development

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

3. Start Redis (Docker):

```bash
cd ..
docker-compose up -d
```

4. Run backend:

```bash
cd backend
npm run dev
```

5. Run frontend:

```bash
cd frontend
npm run dev
```

## Complete Tracked File Map

The following is the current tracked file inventory from this repository:

```text
.github/workflows/backend-railway-cicd.yml
.gitignore
README.md
backend/.dockerignore
backend/.gitignore
backend/Dockerfile
backend/controllers/aiChat.controller.js
backend/controllers/auth.controllers.js
backend/controllers/group.controller.js
backend/controllers/message.controller.js
backend/controllers/rag.controller.js
backend/controllers/resetPassword.controllers.js
backend/controllers/user.controller.js
backend/controllers/voiceGraph.controller.js
backend/db/connectToMongoDB.js
backend/middleware/protectRoute.js
backend/models/conversation.model.js
backend/models/group.model.js
backend/models/groupMessage.model.js
backend/models/message.model.js
backend/models/user.model.js
backend/models/voiceSession.model.js
backend/package-lock.json
backend/package.json
backend/rag/agents/query_decomposer.js
backend/rag/config.js
backend/rag/ingestion/build_vector_db.js
backend/rag/ingestion/chunker.js
backend/rag/ingestion/classifier.js
backend/rag/ingestion/crawler.js
backend/rag/llm.js
backend/rag/pinecone.js
backend/rag/ragGraph.js
backend/rag/retrieval/advanced_retriever.js
backend/rag/retrieval/multi_query.js
backend/rag/retrieval/retriever.js
backend/rag/routing/router.js
backend/routes/aiChat.routes.js
backend/routes/auth.routes.js
backend/routes/group.routes.js
backend/routes/message.routes.js
backend/routes/user.routes.js
backend/routes/voiceGraph.routes.js
backend/scripts/checkAppwriteEmailLogs.mjs
backend/server.js
backend/socket/socket.js
backend/utils/aiInsights.js
backend/utils/conflictResolver.js
backend/utils/email/errors.js
backend/utils/email/index.js
backend/utils/email/templates.js
backend/utils/email/transporter.js
backend/utils/generateToken.js
backend/utils/groupModerator.js
backend/utils/mistralClient.js
backend/utils/redis.js
backend/utils/sendEmail.js
docker-compose.yml
docs/deployment/backend-cicd.md
frontend/.gitignore
frontend/eslint.config.js
frontend/index.html
frontend/package-lock.json
frontend/package.json
frontend/public/default-girl.jpg
frontend/public/default-man.jpg
frontend/public/default.png
frontend/public/logo.png
frontend/src/App.css
frontend/src/App.jsx
frontend/src/assets/sounds/notification.mp3
frontend/src/components/EmojiPickerButton.jsx
frontend/src/components/groups/GroupListItem.jsx
frontend/src/components/groups/GroupMessage.jsx
frontend/src/components/groups/GroupMessageContainer.jsx
frontend/src/components/groups/GroupMessageInput.jsx
frontend/src/components/groups/GroupMessages.jsx
frontend/src/components/groups/GroupSettingsPanel.jsx
frontend/src/components/groups/GroupSidebar.jsx
frontend/src/components/messages/AIInsightsPanel.jsx
frontend/src/components/messages/ConflictResolverPanel.jsx
frontend/src/components/messages/Message.jsx
frontend/src/components/messages/MessageContainer.jsx
frontend/src/components/messages/MessageInput.jsx
frontend/src/components/messages/Messages.jsx
frontend/src/components/sidebar/AIAssistant.jsx
frontend/src/components/sidebar/Conversation.jsx
frontend/src/components/sidebar/Conversations.jsx
frontend/src/components/sidebar/GlobalCallUI.jsx
frontend/src/components/sidebar/LogoutButton.jsx
frontend/src/components/sidebar/Notifications.jsx
frontend/src/components/sidebar/SearchInput.jsx
frontend/src/components/sidebar/Sidebar.jsx
frontend/src/components/skeletons/MessageSkeleton.jsx
frontend/src/context/AuthContext.jsx
frontend/src/context/CallContext.jsx
frontend/src/context/SocketContext.jsx
frontend/src/hooks/useAIChat.js
frontend/src/hooks/useAIInsights.js
frontend/src/hooks/useConflictMode.js
frontend/src/hooks/useCreateGroup.js
frontend/src/hooks/useFriendsList.js
frontend/src/hooks/useGetConversations.js
frontend/src/hooks/useGetGroupMessages.js
frontend/src/hooks/useGetGroups.js
frontend/src/hooks/useGetMe.js
frontend/src/hooks/useGetMessages.js
frontend/src/hooks/useGroupDetails.js
frontend/src/hooks/useListenFriendUpdates.js
frontend/src/hooks/useListenGroupEvents.js
frontend/src/hooks/useListenMessages.js
frontend/src/hooks/useLogin.js
frontend/src/hooks/useLogout.js
frontend/src/hooks/useReactToMessage.js
frontend/src/hooks/useSendGroupMessage.js
frontend/src/hooks/useSendMessage.js
frontend/src/hooks/useSignup.js
frontend/src/hooks/useVoiceGraph.js
frontend/src/index.css
frontend/src/main.jsx
frontend/src/pages/changePassword/ForgotPassword.jsx
frontend/src/pages/changePassword/ResetPassword.jsx
frontend/src/pages/groups/Groups.jsx
frontend/src/pages/home/Home.jsx
frontend/src/pages/home/Profile.jsx
frontend/src/pages/login/Login.jsx
frontend/src/pages/signup/GenderCheckbox.jsx
frontend/src/pages/signup/SignUp.jsx
frontend/src/pages/verifyEmail/Verification.jsx
frontend/src/pages/verifyEmail/VerifyEmail.jsx
frontend/src/pages/voice/VoiceCall.jsx
frontend/src/utils/emojis.js
frontend/src/utils/extractTime.js
frontend/src/utils/upload.js
frontend/src/zustand/useConversation.js
frontend/src/zustand/useGroupChat.js
frontend/vercel.json
frontend/vite.config.js
package-lock.json
```

## Deployment Artifacts Present

- Docker compose for Redis + backend service wiring
- Backend Dockerfile (Node 20 Alpine, non-root user)
- GitHub Actions workflow for backend Railway CI/CD
- Deployment documentation in `docs/deployment/backend-cicd.md`
- Frontend Vercel config in `frontend/vercel.json`

## Notes

- This document intentionally reflects current repository state rather than planned roadmap items.
- To keep this section accurate over time, regenerate the tracked file list after adding/removing files.