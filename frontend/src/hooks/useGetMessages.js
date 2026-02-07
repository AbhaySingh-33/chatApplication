import { useEffect, useState } from "react";
import useConversation from "../zustand/useConversation";
import toast from "react-hot-toast";

const useGetMessages = () => {
  const [loading, setLoading] = useState(false);
  const { messages, setMessages, selectedConversation } = useConversation();

  useEffect(() => {
    const getMessages = async () => {
      // Skip fetching if it's the AI conversation
      if (selectedConversation?.isAI) return;

      setLoading(true);
      try {
        const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/messages/${selectedConversation._id}`,
          {
            credentials: "include", //send jwt cookie
          });
        const data = await res.json();
        if (data.error) {
          // Don't show error toast for "No Conversation yet" - it's a normal state
          if (data.error === "No Conversation yet!") {
            setMessages([]);
            return;
          }
          throw new Error(data.error);
        }
        setMessages(data);
      } catch (error) {
        console.error("Failed to fetch messages:", error.message);
        if (error.message && error.message.includes("i is not iterable")) {
          toast.error("An error occurred. Refresh the page");
          window.location.reload();
        } else {
          toast.error("Failed to fetch messages");
        }
      } finally {
        setLoading(false);
      }
    };

    if (selectedConversation?._id) getMessages();
  }, [selectedConversation?._id, setMessages, selectedConversation]);

  return { messages, loading };
};
export default useGetMessages;
