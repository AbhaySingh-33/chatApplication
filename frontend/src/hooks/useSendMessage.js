import { useState } from "react";
import useConversation from "../zustand/useConversation";
import toast from "react-hot-toast";

const uploadToCloudinary = async (file) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append(
    "upload_preset",
    import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET
  ); // ✅ Replace with your actual preset
  formData.append("api_key", import.meta.env.VITE_CLOUDINARY_API_KEY); // ✅ Replace with your Cloudinary API Key

  // Determine folder & resource type
  const fileType = file.type.startsWith("image") ? "image" : "video";
  const folder = fileType === "image" ? "chat_images" : "chat_videos";

  formData.append("folder", folder);

  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${
        import.meta.env.VITE_CLOUDINARY_NAME
      }/${fileType}/upload`,
      { method: "POST", body: formData }
    );

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.secure_url;
  } catch (error) {
    console.error("Cloudinary Upload Error:", error);
    return null;
  }
};

const useSendMessage = () => {
  const [loading, setLoading] = useState(false);
  const { messages, setMessages, selectedConversation } = useConversation();

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
      if (data.error) throw new Error(data.error);

      setMessages([...messages, data]);
    } catch (error) {
      if (error.message && error.message.includes("i is not iterable")) {
        toast.error("An error occurred. Refresh the page");
        window.location.reload();
      } else {
        toast.error(error.message);
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

  return { sendMessage, loading, deleteMessage };
};

export default useSendMessage;
