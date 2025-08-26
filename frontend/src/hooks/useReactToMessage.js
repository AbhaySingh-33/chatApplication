import { useState } from "react";
import { useAuthContext } from "../context/AuthContext";
import useConversation from "../zustand/useConversation";
import toast from "react-hot-toast";
import axios from "axios";

const useReactToMessage = () => {
    const { authUser } = useAuthContext();
    const { messages, updateMessageStatus } = useConversation();
    const [loading, setLoading] = useState(false);

    const reactToMessage = async (messageId, emoji) => {
        if (!authUser) return;

        setLoading(true);
        try {
            const { data } = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/messages/react`, { messageId, emoji });

            // ✅ Update messages locally in Zustand store
            const updatedMessages = messages.map((msg) =>
                msg._id === messageId ? { ...msg, reactions: data.reactions } : msg
            );

            updateMessageStatus(updatedMessages);
        } catch (error) {
            console.error("Reaction failed:", error);
            toast.error("Failed to react to message.");
        } finally {
            setLoading(false);
        }
    };

    return { reactToMessage, loading };
};

export default useReactToMessage;
