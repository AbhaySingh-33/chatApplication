import { useState } from "react";
import useConversation from "../zustand/useConversation";
import toast from "react-hot-toast";

const useAIChat = () => {
  const [loading, setLoading] = useState(false);
  const { messages, setMessages } = useConversation();

  const sendAIMessage = async ({ text }) => {
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/ai-chat/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ text }),
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      // Manually add user message to state since we stopped emitting it via socket for self
      setMessages([...messages, data.userMessage]);
      
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const getAIConversation = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/ai-chat/conversation`, {
        credentials: "include",
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      return data;
    } catch (error) {
      toast.error(error.message);
      return null;
    }
  };

  const getAIMessages = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/ai-chat/messages`, {
        credentials: "include",
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setMessages(data);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return { sendAIMessage, loading, getAIConversation, getAIMessages };
};

export default useAIChat;
