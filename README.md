# 💬 ChatApp

A full-stack real-time chat application built with React, Node.js, Express, MongoDB, Socket.io, and Redis. Features include real-time messaging, user authentication, file uploads, and WebRTC video calling capabilities.

## 🚀 Features

- **Real-time Messaging**: Instant messaging using Socket.io with Redis adapter for multi-server scalability
- **User Authentication**: Secure JWT-based authentication with bcrypt password hashing
- **File Uploads**: Image sharing via Cloudinary integration
- **Video Calling**: WebRTC peer-to-peer video calls with SimplePeer
- **Email Notifications**: Password reset functionality with Nodemailer
- **Responsive UI**: Modern interface built with React and TailwindCSS
- **Security**: MongoDB sanitization, CORS protection, and secure cookie handling

## 🛠️ Tech Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Real-time**: Socket.io with Redis adapter
- **Caching**: Redis
- **Authentication**: JWT, bcryptjs
- **File Upload**: Cloudinary, Multer
- **Email**: Nodemailer
- **Security**: express-mongo-sanitize, CORS, cookie-parser

### Frontend
- **Framework**: React 19
- **Build Tool**: Vite
- **Styling**: TailwindCSS 4, DaisyUI
- **State Management**: Zustand
- **Routing**: React Router DOM
- **Real-time**: Socket.io-client
- **Video Calling**: SimplePeer
- **UI Components**: Lucide React, React Icons
- **Notifications**: React Hot Toast
- **Date Handling**: date-fns

## 📋 Prerequisites

- Node.js (v16 or higher)
- MongoDB
- Redis (for multi-server support)
- Docker (optional, for running Redis)

## ⚙️ Installation

### 1. Clone the repository
```bash
git clone <repository-url>
cd ChatApp
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in the `backend` directory:

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
FRONTEND_URL=http://localhost:5173

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Redis Configuration
REDIS_URL=redis://localhost:6379

# Email Configuration
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_app_password
```

### 3. Frontend Setup

```bash
cd frontend
npm install
```

Create a `.env` file in the `frontend` directory:

```env
VITE_API_URL=http://localhost:5000
```

## 🚀 Running the Application

### Start Redis (using Docker)
```bash
docker-compose up -d
```

### Development Mode

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

The application will be available at:
- Frontend: `http://localhost:5173`
- Backend: `http://localhost:5000`

## 📁 Project Structure

```
ChatApp/
├── backend/
│   ├── controllers/          # Request handlers
│   ├── db/                   # Database configuration
│   ├── middleware/           # Express middleware
│   ├── models/               # MongoDB models
│   ├── routes/               # API routes
│   ├── socket/               # Socket.io configuration
│   ├── utils/                # Utility functions
│   ├── server.js             # Main server file
│   └── package.json          # Backend dependencies
│
├── frontend/
│   ├── public/               # Static assets
│   ├── src/
│   │   ├── assets/          # Images, icons, etc.
│   │   ├── components/      # React components
│   │   ├── context/         # React context providers
│   │   ├── hooks/           # Custom React hooks
│   │   ├── pages/           # Page components
│   │   ├── utils/           # Utility functions
│   │   ├── zustand/         # Zustand state management
│   │   ├── App.jsx          # Main App component
│   │   └── main.jsx         # Entry point
│   ├── index.html
│   ├── package.json          # Frontend dependencies
│   └── vite.config.js        # Vite configuration
│
├── docker-compose.yml        # Docker services configuration
└── README.md
```

## 📦 API Routes

### Authentication Routes (`/api/auth`)
- `POST /signup` - Register a new user
- `POST /login` - User login
- `POST /logout` - User logout
- `POST /reset` - Password reset

### Message Routes (`/api/messages`)
- `GET /` - Get all messages
- `POST /send/:id` - Send a message to a user

### User Routes (`/api/users`)
- `GET /` - Get all users
- `GET /:id` - Get user by ID
- `PUT /profile` - Update user profile

## 🔐 Security Features

- JWT-based authentication
- Password hashing with bcryptjs
- MongoDB injection prevention
- CORS configuration
- HTTP-only cookies
- Environment variable protection

## 🌐 Deployment

### Frontend (Vercel)
```bash
cd frontend
npm run build
```

### Backend
Deploy to any Node.js hosting service (Render, Railway, Heroku, etc.)

Update environment variables with production URLs.

## 🤝 Contributing

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the ISC License.

---

**Happy Coding! 🚀**