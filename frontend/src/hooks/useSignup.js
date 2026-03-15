import { useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

const useSignup = () => {
	const [loading, setLoading] = useState(false);
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
			if (!res.ok) {
				throw new Error(data.error || "Failed to signup");
			}

			if (data.emailSent === false) {
				toast.error(data.message || "Account created but verification email could not be sent yet");
			} else {
				toast.success(data.message || "Verification link sent to your email");
			}

			navigate("/login");
		} catch (error) {
			console.error("Signup failed:", error.message);
			toast.error(getFriendlyError(error.message));
		} finally {
			setLoading(false);
		}
	};

	return { loading, signup };
};

export default useSignup;

function getFriendlyError(message = "") {
	if (message.includes("Username already")) return "That username is already taken. Try a different one.";
	if (message.includes("Email already")) return "An account with this email already exists.";
	if (message.includes("Passwords don't match")) return "Passwords do not match. Please check and try again.";
	if (message.includes("at least 6")) return "Password must be at least 6 characters.";
	return "Registration failed. Please try again.";
}

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
