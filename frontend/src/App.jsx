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

function App() {
  const { authUser } = useAuthContext();
  const navigate = useNavigate();

  return (
    <div className="relative h-screen w-full bg-cover bg-center flex flex-col">
      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-opacity-60 z-0"></div>

      {/* Header */}
      <div className="relative z-10 py-4 px-4 flex flex-col sm:flex-row items-center justify-center gap-3 text-center bg-black/20 backdrop-blur-sm">
        <img
          src="/logo.png"
          alt="Chat Application Logo"
          className="h-10 w-10 sm:h-12 sm:w-12 md:h-14 md:w-14 cursor-pointer"
          onClick={() => navigate("/")}
          title="Go to Home"
        />
        <h1
          className="text-xl sm:text-3xl md:text-4xl font-extrabold tracking-wide text-blue-400 cursor-pointer"
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
            path="*"
            element={<Navigate to={authUser ? "/" : "/login"} />}
          />

          <Route path="/verify-email/:token" element={<VerifyEmail />} />

          <Route path="/forgot-password" element={<ForgotPassword />} />
				  <Route path="/reset-password/:token" element={<ResetPassword />} />

        </Routes>
      </div>

      {/* Footer */}
      <div className="relative z-10 w-full text-center py-2 text-white text-xs bg-black/20 backdrop-blur-sm">
        <p className="flex flex-wrap justify-center items-center gap-1 px-2">
          <span>🚀</span> Designed and developed by{" "}
          <a
            href="https://www.linkedin.com/in/abhay-singh-77b81833b/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:underline"
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
