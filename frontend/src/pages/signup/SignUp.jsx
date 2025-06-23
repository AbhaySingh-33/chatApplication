import { Link } from "react-router-dom";
import GenderCheckbox from "./GenderCheckbox";
import { useState } from "react";
import useSignup from "../../hooks/useSignup";

const SignUp = () => {
	const [inputs, setInputs] = useState({
		fullName: "",
		username: "",
		password: "",
		confirmPassword: "",
		gender: "",
		profilePic: null,
	});

	const { loading, signup } = useSignup();

	const handleCheckboxChange = (gender) => {
		setInputs({ ...inputs, gender });
	};

	const handleFileChange = (e) => {
		const file = e.target.files[0];
		setInputs({ ...inputs, profilePic: file });
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		await signup({
			fullName: inputs.fullName,
			username: inputs.username,
			password: inputs.password,
			confirmPassword: inputs.confirmPassword,
			gender: inputs.gender,
			profilePic: inputs.profilePic,
		});
	};

	return (
		<div className="flex justify-center items-center px-4">
			<div className="w-full max-w-sm p-6 rounded-lg shadow-md bg-clip-padding backdrop-filter backdrop-blur-lg bg-opacity-10 bg-gradient-to-br from-slate-900/30 to-slate-700/20">
				<h1 className="text-3xl font-semibold text-center text-blue-500 mb-4">
					Sign Up 
				</h1>

				<form onSubmit={handleSubmit}>
					<div className="mb-3">
						<label className="label">
							<span className="text-base text-white">Full Name</span>
						</label>
						<input
							type="text"
							placeholder="Enter Name"
							className="w-full input input-bordered h-10 bg-gray-800 text-white"
							value={inputs.fullName}
							onChange={(e) => setInputs({ ...inputs, fullName: e.target.value })}
						/>
					</div>

					<div className="mb-3">
						<label className="label">
							<span className="text-base text-white">Username</span>
						</label>
						<input
							type="text"
							placeholder="Enter Username"
							className="w-full input input-bordered h-10 bg-gray-800 text-white"
							value={inputs.username}
							onChange={(e) => setInputs({ ...inputs, username: e.target.value })}
						/>
					</div>

					<div className="mb-3">
						<label className="label">
							<span className="text-base text-white">Password</span>
						</label>
						<input
							type="password"
							placeholder="Enter Password"
							className="w-full input input-bordered h-10 bg-gray-800 text-white"
							value={inputs.password}
							onChange={(e) => setInputs({ ...inputs, password: e.target.value })}
						/>
					</div>

					<div className="mb-3">
						<label className="label">
							<span className="text-base text-white">Confirm Password</span>
						</label>
						<input
							type="password"
							placeholder="Confirm Password"
							className="w-full input input-bordered h-10 bg-gray-800 text-white"
							value={inputs.confirmPassword}
							onChange={(e) => setInputs({ ...inputs, confirmPassword: e.target.value })}
						/>
					</div>

					<GenderCheckbox
						onCheckboxChange={handleCheckboxChange}
						selectedGender={inputs.gender}
					/>

					<div className="mt-4">
						<label className="label">
							<span className="text-base text-white">Profile Picture (optional)</span>
						</label>
						<input
							type="file"
							accept="image/*"
							className="w-full input input-bordered h-10 bg-gray-800 text-white"
							onChange={handleFileChange}
						/>
					</div>

					<Link
						to={"/login"}
						className="text-sm hover:underline text-blue-400 mt-3 inline-block"
					>
						Already have an account?
					</Link>

					<button
						className="btn btn-block btn-sm mt-4 bg-blue-600 hover:bg-blue-700 text-white"
						disabled={loading}
					>
						{loading ? <span className="loading loading-spinner"></span> : "Sign Up"}
					</button>
				</form>
			</div>
		</div>
	);
};

export default SignUp;
