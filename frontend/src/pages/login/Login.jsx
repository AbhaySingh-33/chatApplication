import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import useLogin from "../../hooks/useLogin";

const Login = () => {
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");

	const { loading, login, show } = useLogin();
	const navigate = useNavigate(); // ✅ useNavigate hook

	const handleSubmit = async (e) => {
		e.preventDefault();
		await login(username, password);
	};

	return (
		<div className="min-h-full flex justify-center items-center bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
			{/* Animated Background Elements */}
			<div className="absolute inset-0">
				<div className="absolute top-1/4 left-1/4 w-64 h-64 bg-slate-500/10 rounded-full blur-3xl animate-pulse"></div>
				<div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gray-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
				<div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-slate-600/5 rounded-full blur-3xl animate-pulse delay-500"></div>
			</div>

			<div className="w-full max-w-md lg:max-w-lg relative z-10">
				{/* Logo/Brand Section */}
				<div className="text-center mb-6 sm:mb-8 animate-fade-in-down">
					<div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-blue-400 to-cyan-500 rounded-full mb-3 sm:mb-4 animate-bounce-slow shadow-lg shadow-blue-500/50">
						<svg className="w-6 h-6 sm:w-8 sm:h-8 text-white animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
						</svg>
					</div>
					<h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2 animate-fade-in">Welcome Back</h1>
					<p className="text-blue-200 text-sm sm:text-base animate-fade-in delay-200">Sign in to continue your conversations</p>
				</div>

				{/* Login Form */}
				<div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 sm:p-8 shadow-2xl border border-blue-300/20 animate-slide-up hover:shadow-blue-500/20 transition-all duration-500">
					<form onSubmit={handleSubmit} className="space-y-6">
						<div className="space-y-2 animate-fade-in-left delay-300">
							<label className="text-sm font-medium text-blue-200">
								Username
							</label>
							<div className="relative group">
								<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
									<svg className="h-5 w-5 text-blue-300 group-focus-within:text-blue-400 transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
									</svg>
								</div>
								<input
									type="text"
									placeholder="Enter your username"
									className="w-full pl-10 pr-4 py-3 bg-blue-900/20 border border-blue-300/30 rounded-xl text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 focus:bg-blue-800/30 transition-all duration-300 hover:border-blue-400/50"
									value={username}
									onChange={(e) => setUsername(e.target.value)}
									required
								/>
							</div>
						</div>

						<div className="space-y-2 animate-fade-in-right delay-400">
							<label className="text-sm font-medium text-blue-200">
								Password
							</label>
							<div className="relative group">
								<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
									<svg className="h-5 w-5 text-blue-300 group-focus-within:text-blue-400 transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
									</svg>
								</div>
								<input
									type="password"
									placeholder="Enter your password"
									className="w-full pl-10 pr-4 py-3 bg-blue-900/20 border border-blue-300/30 rounded-xl text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 focus:bg-blue-800/30 transition-all duration-300 hover:border-blue-400/50"
									value={password}
									onChange={(e) => setPassword(e.target.value)}
									required
								/>
							</div>
						</div>

						<button
							type="submit"
							className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none animate-fade-in-up delay-500"
							disabled={loading}
						>
							{loading ? (
								<div className="flex items-center justify-center">
									<svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
										<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
										<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
									</svg>
									Signing in...
								</div>
							) : (
								"Sign In"
							)}
						</button>

						{show && (
							<button 
								type="button"
								className="w-full bg-red-500/20 hover:bg-red-500/30 text-red-300 font-medium py-3 px-4 rounded-xl transition-all duration-300 border border-red-400/30 hover:border-red-400/50 animate-fade-in delay-600"
								onClick={() => navigate("/forgot-password")} 
							>
								Reset Password
							</button>
						)}
					</form>

					<div className="mt-6 text-center animate-fade-in delay-700">
						<p className="text-blue-200">
							Don't have an account?{" "}
							<Link
								to="/signup"
								className="text-cyan-400 hover:text-cyan-300 font-medium transition-all duration-200 hover:underline"
							>
								Sign up here
							</Link>
						</p>
					</div>
				</div>
			</div>
		</div>
	);
};

export default Login;
