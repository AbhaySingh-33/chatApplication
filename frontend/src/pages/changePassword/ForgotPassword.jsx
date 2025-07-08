import { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";

const ForgotPassword = () => {
	const [email, setEmail] = useState("");
	const [success, setSuccess] = useState(false);
	const [loading, setLoading] = useState(false); // ✅ loading state

	const handleSubmit = async (e) => {
		e.preventDefault();
		setLoading(true); // Start loading
		try {
			await axios.post("/api/reset/reset-password", { email });
			setSuccess(true);
			toast.success("Reset link sent to your email.");
			setEmail("");
		} catch (err) {
			toast.error("Failed to send reset email. Please try again.");
		} finally {
			setLoading(false); // End loading
		}
	};

	return (
		<div className="flex justify-center items-center min-h-[50vh] bg-gray-900 px-4">
			<div className="w-full max-w-md bg-slate-800 p-6 rounded-lg shadow-md">
				<h2 className="text-2xl font-bold text-white mb-4">Forgot Password</h2>
				{success ? (
					<p className="text-green-400">Check your email for the reset link.</p>
				) : (
					<form onSubmit={handleSubmit}>
						<label className="block text-white mb-2">Email</label>
						<input
							type="email"
							className="w-full input input-bordered h-10 bg-gray-700 text-white mb-4"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							required
							disabled={loading}
						/>
						<button
							type="submit"
							className="btn btn-primary w-full"
							disabled={loading}
						>
							{loading ? (
								<div className="flex items-center justify-center gap-2">
									<span className="loading loading-spinner loading-sm"></span>
									<span>Sending...</span>
								</div>
							) : (
								"Send Reset Link"
							)}
						</button>
					</form>
				)}
			</div>
		</div>
	);
};

export default ForgotPassword;
