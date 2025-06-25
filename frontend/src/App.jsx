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

function App() {

	const { authUser } = useAuthContext();

	return (
		<div className="relative min-h-screen w-full bg-cover bg-center flex flex-col items-center justify-start p-4">

			{/* Dark Overlay */}
			<div className="absolute inset-0  bg-opacity-60 z-0"></div>

			{/* Header */}
			<div className="relative z-10 mt-16 mb-6  px-4 flex flex-col sm:flex-row items-center justify-center gap-3 text-center">
				<img
					src="/logo.png"
					alt="Chat Application Logo"
					className="h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16"
				/>
				<h1 className="text-2xl sm:text-4xl md:text-5xl font-extrabold tracking-wide text-blue-400">
					CHATTRIX
				</h1>
			</div>

			{/* Routes */}
			<div className="relative z-10 w-full max-w-md sm:max-w-2xl flex-grow">
				<Routes>
					<Route path="/" element={authUser ? <Home /> : <Navigate to="/login" />} />
					<Route path="/login" element={authUser ? <Navigate to="/" /> : <Login />} />
					<Route path="/signup" element={authUser ? (authUser.isVerified ? (<Navigate to="/" />) 
					  : (<Verification />)) 
					  : (<SignUp />)}/>

					<Route path="*" element={<Navigate to={authUser ? "/" : "/login"} />} />

					<Route path="/verify-email/:token" element={<VerifyEmail />} />
				</Routes>
			</div>

			{/* Footer */}
			<div className="relative z-10 w-full mt-auto text-center py-3 text-white text-sm">
				<p className="flex flex-wrap justify-center items-center gap-1 px-2">
					<span>🚀</span> Designed and developed by{" "}
					<span className="font-semibold">Abhay Kumar Singh</span>
				</p>
			</div>

			<Toaster />
		</div>
	);
}

export default App;
