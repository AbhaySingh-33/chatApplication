import { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";

const ForgotPassword = () => {
	const [email, setEmail] = useState("");
	const [success, setSuccess] = useState(false);
	const [loading, setLoading] = useState(false); //  loading state

	const handleSubmit = async (e) => {
		e.preventDefault();
		setLoading(true); // Start loading
		try {
			await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/reset/reset-password`, { email },{ withCredentials: true });
			setSuccess(true);
			toast.success("Reset link sent to your email.");
			setEmail("");
		} catch (err) {
			const backendMessage = err?.response?.data?.error || err?.response?.data?.message;
			toast.error(backendMessage || "Failed to send reset email. Please try again.");
		} finally {
			setLoading(false); // End loading
		}
	};

	return (
		<div className="flex justify-center items-center min-h-[60vh] px-4">
			<div className="w-full max-w-md bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-8 shadow-2xl animate-slide-up">
				<div className="text-center mb-6">
					<div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-4 shadow-lg">
						<svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
						</svg>
					</div>
					<h2 className="text-2xl font-bold text-white">Forgot Password?</h2>
					<p className="text-blue-200 text-sm mt-1">Enter your email to receive a reset link</p>
				</div>

				{success ? (
					<div className="flex flex-col items-center gap-3 py-4">
						<div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center">
							<svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
							</svg>
						</div>
						<p className="text-green-400 font-semibold text-center">Reset link sent!</p>
						<p className="text-blue-200 text-sm text-center">Check your inbox and follow the instructions.</p>
					</div>
				) : (
					<form onSubmit={handleSubmit} className="space-y-4">
						<div className="space-y-1">
							<label className="block text-sm font-medium text-blue-200">Email Address</label>
							<input
								type="email"
								placeholder="you@example.com"
								className="w-full px-4 py-3 bg-blue-900/20 border border-blue-300/30 rounded-xl text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all duration-300 disabled:opacity-50"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								required
								disabled={loading}
							/>
						</div>
						<button
							type="submit"
							className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-3 rounded-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
							disabled={loading}
						>
							{loading ? (
								<div className="flex items-center justify-center gap-2">
									<span className="loading loading-spinner loading-sm"></span>
									<span>Sending...</span>
								</div>
							) : "Send Reset Link"}
						</button>
					</form>
				)}
			</div>
		</div>
	);
};

export default ForgotPassword;
