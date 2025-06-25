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
				await axios.get(`/api/auth/verify-email/${token}`);
				toast.success("Email verified! You can now log in.");
				navigate("/login");
			} catch (err) {
				console.log("Invalid or expired verification link.");
			}
		};

		verify();
	}, [token, navigate]);

	return (
		<div className="flex flex-col items-center justify-center mt-20 p-4">
  <div className="bg-white rounded-2xl shadow-lg px-8 py-6 flex flex-col items-center justify-center w-72 sm:w-96">
    <div className="relative w-10 h-10 mb-4">
      <div className="absolute inset-0 border-4 border-blue-400 border-dashed rounded-full animate-spin"></div>
    </div>
    <p className="text-center text-base sm:text-lg font-semibold text-gray-700 animate-pulse">
      Verifying your email...
    </p>
  </div>
</div>

	);

};

export default VerifyEmail;
