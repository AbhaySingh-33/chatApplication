import { useState } from "react";
import toast from "react-hot-toast";
import useGroupChat from "../zustand/useGroupChat";
import { uploadToCloudinary } from "../utils/upload";

const useSendGroupMessage = () => {
  const [loading, setLoading] = useState(false);
  const { selectedGroup, addMessage } = useGroupChat();

  const sendMessage = async ({ text, file }) => {
    if (!selectedGroup?._id) return;
    setLoading(true);
    try {
      let mediaUrl = null;

      if (file) {
        mediaUrl = await uploadToCloudinary(file);
        if (!mediaUrl) throw new Error("File upload failed.");
      }

      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/groups/${selectedGroup._id}/messages`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ text, media: mediaUrl }),
        }
      );

      const data = await res.json();
      if (data.error) throw new Error(data.error);
      addMessage(data);
      return data;
    } catch (error) {
      console.error("Failed to send group message:", error.message);
      if (error.message?.includes("muted")) {
        toast.error(error.message);
      } else {
        toast.error("Failed to send message");
      }
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return { sendMessage, loading };
};

export default useSendGroupMessage;
