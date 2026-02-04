import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useSocketContext } from "../../context/SocketContext";
import { useAuthContext } from "../../context/AuthContext";

const Notifications = () => {
    const [requests, setRequests] = useState([]);
    const { socket } = useSocketContext();
    const { authUser, setAuthUser } = useAuthContext();

    useEffect(() => {
        const fetchNotifications = async () => {
            try {
                const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/friends/notifications`, {
                    credentials: "include",
                });
                const data = await res.json();
                if (data.error) throw new Error(data.error);
                setRequests(data);
            } catch (error) {
                console.log(error);
            }
        };

        fetchNotifications();

        if (socket) {
            socket.on("newFriendRequest", (newUser) => {
                setRequests((prev) => [...prev, newUser]);
                toast("New friend request received!", { icon: "🔔" });
            });
        }
        return () => socket?.off("newFriendRequest");
    }, [socket]);

    const handleAccept = async (senderId) => {
        try {
            const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/friends/accept-request`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ senderId }),
                credentials: "include",
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error);

            toast.success("Friend request accepted");
            setRequests(requests.filter((r) => r._id !== senderId));
            
            // ✅ Update local Auth Context to include new friend immediately
            const updatedUser = { ...authUser, friends: [...(authUser.friends || []), senderId] };
            localStorage.setItem("chat-user", JSON.stringify(updatedUser));
            setAuthUser(updatedUser);

        } catch (error) {
            toast.error(error.message);
        }
    };

    const handleReject = async (senderId) => {
        try {
            const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/friends/reject-request`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ senderId }),
                credentials: "include",
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error);

            setRequests(requests.filter((r) => r._id !== senderId));
            toast.success("Request rejected");
        } catch (error) {
            toast.error(error.message);
        }
    };

    return (
        <div className="flex flex-col gap-2 p-2 overflow-auto h-full">
            <h2 className="text-white text-lg font-bold mb-2 border-b border-white/20 pb-2">Friend Requests</h2>
            {requests.length === 0 ? (
                <p className="text-gray-400 text-center py-4">No new requests</p>
            ) : (
                requests.map((request) => (
                    <div key={request._id} className="flex flex-col gap-2 bg-white/10 p-3 rounded-lg animate-fade-in">
                        <div className="flex items-center gap-3">
                            <img src={request.profilePic} alt="avatar" className="w-10 h-10 rounded-full border border-white/20" />
                            <span className="text-white font-medium text-sm truncate">{request.username}</span>
                        </div>
                        <div className="flex gap-2 w-full mt-1">
                            <button onClick={() => handleAccept(request._id)} className="flex-1 bg-green-600 hover:bg-green-700 text-white py-1.5 rounded-md text-xs font-semibold transition-colors">Accept</button>
                            <button onClick={() => handleReject(request._id)} className="flex-1 bg-red-600 hover:bg-red-700 text-white py-1.5 rounded-md text-xs font-semibold transition-colors">Reject</button>
                        </div>
                    </div>
                ))
            )}
        </div>
    );
};

export default Notifications;
