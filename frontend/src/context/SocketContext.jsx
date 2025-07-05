import { createContext, useState, useEffect, useContext } from "react";
import { useAuthContext } from "./AuthContext";
import io from "socket.io-client";

const SocketContext = createContext();

export const useSocketContext = () => {
	return useContext(SocketContext);
};

export const SocketContextProvider = ({ children }) => {
	const [socket, setSocket] = useState(null);
	const [onlineUsers, setOnlineUsers] = useState([]);
	const { authUser } = useAuthContext();

	useEffect(() => {
		if (authUser) {
			const newSocket = io("https://chatapplication-4asu.onrender.com", {
				query: { userId: authUser._id },
				withCredentials: true, // Ensure proper authentication handling
			});

			setSocket(newSocket);

			// Listen for online users event
			newSocket.on("getOnlineUsers", (users) => {
				setOnlineUsers(users);
			});

			// Cleanup on unmount
			return () => {
				newSocket.disconnect();
				setSocket(null);
			};
		} else {
			if (socket) {
				socket.disconnect();
				setSocket(null);
			}
		}
	}, [authUser]);

	return (
		<SocketContext.Provider value={{ socket, onlineUsers }}>
			{children}
		</SocketContext.Provider>
	);
};
