import { Navigate, Route, Routes } from "react-router-dom";
import "./App.css";
import Home from "./pages/home/Home";
import Login from "./pages/login/Login";
import SignUp from "./pages/signup/SignUp";
import { Toaster } from "react-hot-toast";
import { useAuthContext } from "./context/AuthContext";
import VerifyEmail from "./pages/verifyEmail/VerifyEmail";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Verification from "./pages/verifyEmail/Verification";
import Profile from "./pages/home/Profile";
import ForgotPassword from "./pages/changePassword/ForgotPassword";
import ResetPassword from "./pages/changePassword/ResetPassword";
import Groups from "./pages/groups/Groups";
import VoiceCall from "./pages/voice/VoiceCall";

function App() {
  const { authUser } = useAuthContext();
  const navigate = useNavigate();

  return (
    <div className="relative h-screen w-full bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex flex-col">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse delay-500"></div>
      </div>

      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-black/20 z-0"></div>

      {/* Header */}
      <div className="relative z-10 py-4 px-4 flex flex-col sm:flex-row items-center justify-center gap-3 text-center bg-white/5 backdrop-blur-md border-b border-white/10">
        <img
          src="/logo.png"
          alt="Chat Application Logo"
          className="h-10 w-10 sm:h-12 sm:w-12 md:h-14 md:w-14 cursor-pointer hover:scale-110 transition-transform duration-300"
          onClick={() => navigate("/")}
          title="Go to Home"
        />
        <h1
          className="text-xl sm:text-3xl md:text-4xl font-extrabold tracking-wide bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent cursor-pointer hover:scale-105 transition-transform duration-300"
          onClick={() => navigate("/")}
          title="Go to Home"
        >
          CHATTRIX
        </h1>
      </div>

      {/* Routes */}
      <div className="relative z-10 flex-1 w-full">
        <Routes>
          <Route
            path="/"
            element={authUser ? <Home /> : <Navigate to="/login" />}
          />
          <Route
            path="/login"
            element={authUser ? <Navigate to="/" /> : <Login />}
          />
          <Route
            path="/signup"
            element={
              authUser ? (
                authUser.isVerified ? (
                  <Navigate to="/" />
                ) : (
                  <Verification />
                )
              ) : (
                <SignUp />
              )
            }
          />

          <Route
            path="/profile"
            element={authUser ? <Profile /> : <Navigate to="/login" />}
          />

          <Route
            path="/groups"
            element={authUser ? <Groups /> : <Navigate to="/login" />}
          />

          <Route
            path="/voice-analysis"
            element={authUser ? <VoiceCall /> : <Navigate to="/login" />}
          />

          <Route
            path="*"
            element={<Navigate to={authUser ? "/" : "/login"} />}
          />

          <Route path="/verify-email/:token" element={<VerifyEmail />} />

          <Route path="/forgot-password" element={<ForgotPassword />} />
				  <Route path="/reset-password/:token" element={<ResetPassword />} />

        </Routes>
      </div>

      {/* Footer */}
      <div className="relative z-10 w-full text-center py-2 text-white text-xs bg-white/5 backdrop-blur-md border-t border-white/10">
        <p className="flex flex-wrap justify-center items-center gap-1 px-2">
          <span>🚀</span> Designed and developed by{" "}
          <a
            href="https://www.linkedin.com/in/abhay-singh-77b81833b/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 hover:underline transition-colors duration-300"
          >
            <span className="font-semibold">Abhay Kumar Singh</span>
          </a>
        </p>
      </div>

      <Toaster />
    </div>
  );
}

export default App;
