import { useState } from "react";
import useConversation from "../zustand/useConversation";
import toast from "react-hot-toast";
import { uploadToCloudinary } from "../utils/upload";


const useSendMessage = () => {
  const [loading, setLoading] = useState(false);
  const [clearingConversation, setClearingConversation] = useState(false);
  const {
    selectedConversation,
    setConflictHint,
    setDraftMessage,
    setMessages,
  } = useConversation();

  const sendMessage = async ({ text, file, replyTo }) => {
    setLoading(true);
    try {
      let mediaUrl = null;

      if (file) {
        mediaUrl = await uploadToCloudinary(file);
        if (!mediaUrl) throw new Error("File upload failed.");
      }

      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/messages/send/${selectedConversation._id}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text,
            media: mediaUrl,
            replyTo: replyTo || null,
          }),
          credentials: "include",
        }
      );

      const data = await res.json();
      if (!res.ok) {
        if (data?.blocked) {
          setConflictHint(selectedConversation._id, {
            senderId: null,
            receiverId: null,
            messageId: null,
            severity: data.severity || "low",
            neutralRephrase: data.neutralRephrase || "",
            compromiseSuggestions: data.compromiseSuggestions || [],
            action: "blocked",
            createdAt: new Date().toISOString(),
          });
          if (data.neutralRephrase) {
            setDraftMessage(data.neutralRephrase);
          }
        toast.error("Message blocked due to conflict tone. Try rephrasing.");
          return;
        }
        throw new Error(data.error || "Failed to send message");
      }

      if (data?.moderation?.action === "modified") {
        toast("✏️ Your message was softened for a better tone.", { icon: "💬" });
      }
      useConversation.getState().upsertMessage(data);
    } catch (error) {
      console.error("Send message failed:", error.message);
      if (error.message?.includes("i is not iterable")) {
        toast.error("Something went wrong. Please refresh the page.");
        window.location.reload();
      } else if (error.message?.includes("File upload failed")) {
        toast.error("File upload failed. Please try a different file.");
      } else {
        toast.error("Couldn't send your message. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const deleteMessage = async (messageId) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/messages/${messageId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      console.log("Message deleted successfully:", messageId);
    } catch (error) {
      console.error("Error deleting message:", error);
    }
  };

  const clearConversationMessages = async () => {
    if (!selectedConversation?._id) return false;

    setClearingConversation(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/messages/clear/${selectedConversation._id}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      const data = await res.json();
      if (!res.ok || data?.error) {
        throw new Error(data?.error || "Failed to clear conversation");
      }

      setMessages([]);
      toast.success("Conversation cleared");
      return true;
    } catch (error) {
      console.error("Error clearing conversation:", error.message);
      toast.error(error.message || "Couldn't clear conversation.");
      return false;
    } finally {
      setClearingConversation(false);
    }
  };

  return { sendMessage, loading, deleteMessage, clearConversationMessages, clearingConversation };
};

export default useSendMessage;
