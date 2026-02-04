import { useEffect } from "react";
import { useSocketContext } from "../context/SocketContext";
import { useAuthContext } from "../context/AuthContext";
import useConversation from "../zustand/useConversation";
import toast from "react-hot-toast";

const useListenFriendUpdates = () => {
    const { socket } = useSocketContext();
    const { authUser, setAuthUser } = useAuthContext();
    const { selectedConversation, setSelectedConversation } = useConversation();

    useEffect(() => {
        if (!socket) return;

        //  Friend Request Accepted Listener
        const handleFriendAccepted = ({ _id }) => {
            toast.success("Friend request accepted!");
            
            const currentFriends = authUser.friends || [];
            const alreadyExists = currentFriends.some(f => {
                const id = typeof f === 'object' ? f._id : f;
                return id?.toString() === _id?.toString();
            });
            
            if (!alreadyExists) {
                const updatedUser = { ...authUser, friends: [...currentFriends, _id] };
                localStorage.setItem("chat-user", JSON.stringify(updatedUser));
                setAuthUser(updatedUser);
            }
        };

        //  Friend Removed Listener
        const handleFriendRemoved = ({ _id }) => {
            // Remove friend from local context
            const currentFriends = authUser.friends || [];
            const updatedFriends = currentFriends.filter(f => {
                const id = typeof f === 'object' ? f._id : f;
                return id?.toString() !== _id?.toString();
            });

            const updatedUser = { ...authUser, friends: updatedFriends };
            localStorage.setItem("chat-user", JSON.stringify(updatedUser));
            setAuthUser(updatedUser);

            // If the removed friend was the active chat, close it
            if (selectedConversation?._id === _id) {
                setSelectedConversation(null);
                toast("Chat closed because friend was removed", { icon: "ℹ️" });
            } else {
                 // Trigger re-render of conversation items by invalidating or forcing update
                 // Since Conversation.jsx uses authUser.friends, it should auto-update
            }
        };

        socket.on("friendRequestAccepted", handleFriendAccepted);
        socket.on("friendRemoved", handleFriendRemoved);

        return () => {
            socket.off("friendRequestAccepted", handleFriendAccepted);
            socket.off("friendRemoved", handleFriendRemoved);
        };
    }, [socket, authUser, setAuthUser, selectedConversation, setSelectedConversation]);
};

export default useListenFriendUpdates;
