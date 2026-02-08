import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import useGroupChat from "../zustand/useGroupChat";

const useGetGroupMessages = () => {
  const [loading, setLoading] = useState(false);
  const { selectedGroup, messages, setMessages } = useGroupChat();

  useEffect(() => {
    const fetchMessages = async () => {
      if (!selectedGroup?._id) return;
      setLoading(true);
      try {
        const res = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/api/groups/${selectedGroup._id}/messages`,
          { credentials: "include" }
        );
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        setMessages(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Failed to fetch group messages:", error.message);
        toast.error("Failed to fetch group messages");
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, [selectedGroup?._id, setMessages]);

  return { loading, messages };
};

export default useGetGroupMessages;
