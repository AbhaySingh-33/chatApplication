// pages/VerifyEmail.jsx
import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";

const VerifyEmail = () => {
	const { token } = useParams();
	const navigate = useNavigate();

	useEffect(() => {
		const verify = async () => {
			try {
				await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/auth/verify-email/${token}`,{ withCredentials: true });
				toast.success("Email verified! You can now log in.");
				navigate("/login");
			} catch (err) {
				console.log("Invalid or expired verification link.");
			}
		};

		verify();
	}, [token, navigate]);

	return (
		<div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
			<div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl shadow-2xl px-8 py-8 flex flex-col items-center w-72 sm:w-96 animate-slide-up">
				<div className="relative w-14 h-14 mb-5">
					<div className="absolute inset-0 border-4 border-blue-400/40 border-t-blue-400 rounded-full animate-spin"></div>
					<div className="absolute inset-2 border-4 border-purple-400/30 border-t-purple-400 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '0.8s' }}></div>
				</div>
				<p className="text-center text-base font-semibold text-white animate-pulse">Verifying your email...</p>
				<p className="text-sm text-blue-200 mt-2 text-center">Please wait, you'll be redirected shortly.</p>
			</div>
		</div>
	);

};

export default VerifyEmail;
