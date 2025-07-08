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
		<div className="flex justify-center items-center mt-8 px-4">
			<div className="w-full max-w-sm p-6 rounded-lg shadow-md bg-clip-padding backdrop-filter backdrop-blur-lg bg-opacity-10 bg-gradient-to-br from-slate-900/30 to-slate-700/20">
				<h1 className="text-3xl font-semibold text-center text-blue-500 mb-6">
					Login 
				</h1>

				<form onSubmit={handleSubmit}>
					<div className="mb-4">
						<label className="label">
							<span className="text-base text-white">Username</span>
						</label>
						<input
							type="text"
							placeholder="Enter username"
							className="w-full input input-bordered h-10 bg-gray-800 text-white"
							value={username}
							onChange={(e) => setUsername(e.target.value)}
						/>
					</div>

					<div className="mb-4">
						<label className="label">
							<span className="text-base text-white">Password</span>
						</label>
						<input
							type="password"
							placeholder="Enter Password"
							className="w-full input input-bordered h-10 bg-gray-800 text-white"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
						/>
					</div>

					<Link
						to="/signup"
						className="text-sm text-blue-400 hover:underline mt-1 inline-block"
					>
						Don't have an account?
					</Link>

					<button
						type="submit"
						className="btn btn-block btn-sm mt-4 bg-blue-600 hover:bg-blue-700 text-white"
						disabled={loading}
					>
						{loading ? (
							<span className="loading loading-spinner" />
						) : (
							"Login"
						)}
					</button>
				</form>

				{show && (
					<button 
						className="btn btn-block btn-sm mt-4 bg-red-600 hover:bg-red-700 text-white"
						onClick={() => navigate("/forgot-password")} 
					>			
						<span className="text-white">Reset Password</span>
					</button>
				)}
			</div>
		</div>
	);
};

export default Login;
