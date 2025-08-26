import { useState } from "react";
import toast from "react-hot-toast";
import { useAuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const useSignup = () => {
	const [loading, setLoading] = useState(false);
	const { setAuthUser } = useAuthContext();
	const navigate = useNavigate(); 

	const signup = async ({ fullName, username, password, confirmPassword, email, gender, profilePic }) => {
		// Validate inputs
		const success = handleInputErrors({ fullName, username, password, confirmPassword, email, gender });
		if (!success) return;

		setLoading(true);

		try {
			// Create a FormData object
			const formData = new FormData();
			formData.append("fullName", fullName);
			formData.append("username", username);
			formData.append("password", password);
			formData.append("confirmPassword", confirmPassword);
			formData.append("email", email);
			formData.append("gender", gender);
			if (profilePic) {
				formData.append("profilePic", profilePic); // Add the profile picture if it exists
			}

			const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/auth/signup`, {
				method: "POST",
				body: formData, // Send FormData directly
				credentials: "include",
			});

			const data = await res.json();
			if (data.error) {
				throw new Error(data.error);
			}

			toast.success("Verification link is sent to Yor email!");
			

			// Save user data to localStorage and update auth context
			localStorage.setItem("chat-user", JSON.stringify(data));
			setAuthUser(data);
		} catch (error) {
			toast.error(error.message);
		} finally {
			setLoading(false);
		}
	};

	return { loading, signup };
};

export default useSignup;

function handleInputErrors({ fullName, username, password, confirmPassword, email, gender }) {
	if (!fullName || !username || !password || !confirmPassword || !email || !gender) {
		toast.error("Please fill in all fields");
		return false;
	}

	if (password !== confirmPassword) {
		toast.error("Passwords do not match");
		return false;
	}

	if (password.length < 6) {
		toast.error("Password must be at least 6 characters");
		return false;
	}

	return true;
}
