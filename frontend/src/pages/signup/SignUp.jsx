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
		profilePic: null, // Added for profile picture
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

		console.log("Form submitted:", inputs);
	
		// Pass the form inputs and the profilePic file
		await signup({
			fullName: inputs.fullName,
			username: inputs.username,
			password: inputs.password,
			confirmPassword: inputs.confirmPassword,
			gender: inputs.gender,
			profilePic: inputs.profilePic, // Profile picture file
		});
	};
	

	return (
		<div className="flex flex-col items-center justify-center  min-w-96 mx-auto">
			<div className="w-full p-6 rounded-lg shadow-md bg-clip-padding backdrop-filter backdrop-blur-lg bg-opacity-0">
				<h1 className="text-3xl font-semibold text-center text-gray-300">
					Sign Up <span className="text-blue-500"> ChatApp</span>
				</h1>

				<form onSubmit={handleSubmit}>
					<div>
						<label className="label p-2">
							<span className="text-base label-text">Full Name</span>
						</label>
						<input
							type="text"
							placeholder="Enter Name"
							className="w-full input input-bordered h-10"
							value={inputs.fullName}
							onChange={(e) => setInputs({ ...inputs, fullName: e.target.value })}
						/>
					</div>

					<div>
						<label className="label p-2 ">
							<span className="text-base label-text">Username</span>
						</label>
						<input
							type="text"
							placeholder="Enter Username"
							className="w-full input input-bordered h-10"
							value={inputs.username}
							onChange={(e) => setInputs({ ...inputs, username: e.target.value })}
						/>
					</div>

					<div>
						<label className="label">
							<span className="text-base label-text">Password</span>
						</label>
						<input
							type="password"
							placeholder="Enter Password"
							className="w-full input input-bordered h-10"
							value={inputs.password}
							onChange={(e) => setInputs({ ...inputs, password: e.target.value })}
						/>
					</div>

					<div className="mt-2">
						<label className="label">
							<span className="text-base label-text">Confirm Password</span>
						</label>
						<input
							type="password"
							placeholder="Confirm Password"
							className="w-full input input-bordered h-10"
							value={inputs.confirmPassword}
							onChange={(e) => setInputs({ ...inputs, confirmPassword: e.target.value })}
						/>
					</div>

					<GenderCheckbox onCheckboxChange={handleCheckboxChange} selectedGender={inputs.gender} />

					<div className="mt-4">
						<label className="label">
							<span className="text-base label-text">Profile Picture (optional)</span>
						</label>
						<input
							type="file"
							accept="image/*"
							className="w-full input input-bordered h-10"
							onChange={handleFileChange}
						/>
					</div>

					<Link
						to={"/login"}
						className="text-sm hover:underline hover:text-blue-600 mt-2 inline-block"
						href="#"
					>
						Already have an account?
					</Link>

					<div>
						<button className="btn btn-block btn-sm mt-2 border border-slate-700" disabled={loading}>
							{loading ? <span className="loading loading-spinner"></span> : "Sign Up"}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
};

export default SignUp;
