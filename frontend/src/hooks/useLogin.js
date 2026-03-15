import { useState } from "react";
import toast from "react-hot-toast";
import { useAuthContext } from "../context/AuthContext";

const useLogin = () => {
	const [loading, setLoading] = useState(false);
	const { setAuthUser } = useAuthContext();
	const [show, setshow] = useState(false)

	const login = async (username, password) => {
		const success = handleInputErrors(username, password);
		if (!success) return;
		setLoading(true);
		try {
			const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/auth/login`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ username, password }),
				credentials: "include", 
			});

			const data = await res.json();
			if (data.error) {
				throw new Error(data.error);
			}

			localStorage.setItem("chat-user", JSON.stringify(data));
			setAuthUser(data);
		} catch (error) {
			setshow(true);
			console.error("Login failed:", error.message);
			toast.error(getFriendlyError(error.message));
		} finally {
			setLoading(false);
		}
	};

	return { loading, login ,show};
};
export default useLogin;

function getFriendlyError(message = "") {
	if (message.includes("Invalid username or password")) return "Incorrect username or password. Please try again.";
	if (message.includes("verify your email")) return "Please verify your email before logging in.";
	if (message.includes("required")) return "Please fill in all fields.";
	return "Something went wrong. Please try again.";
}

function handleInputErrors(username, password) {
	if (!username || !password) {
		toast.error("Please fill in all fields");
		return false;
	}

	return true;
}