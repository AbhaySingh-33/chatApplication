import { useMemo, useState, useRef } from "react";
import { useAuthContext } from "../../context/AuthContext";
import useGroupChat from "../../zustand/useGroupChat";
import useSendGroupMessage from "../../hooks/useSendGroupMessage";
import { BsEmojiSmile, BsPaperclip, BsXCircle, BsSend } from "react-icons/bs";
import EmojiPicker from "emoji-picker-react";

const GroupMessageInput = () => {
  const [message, setMessage] = useState("");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const fileInputRef = useRef(null);

  const { authUser } = useAuthContext();
  const { groupDetails } = useGroupChat();
  const { sendMessage, loading } = useSendGroupMessage();

  const muteEntry = useMemo(() => {
    return groupDetails?.mutedUsers?.find((entry) => {
      const entryId = entry.userId?._id || entry.userId;
      return entryId?.toString() === authUser?._id?.toString();
    });
  }, [groupDetails?.mutedUsers, authUser?._id]);

  const mutedUntil = muteEntry?.mutedUntil ? new Date(muteEntry.mutedUntil) : null;
  const isMuted = mutedUntil && mutedUntil > new Date();

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
        setFile(selectedFile);
        setPreview(URL.createObjectURL(selectedFile)); 
    }
  };

  const handleEmojiClick = (emojiObject) => {
    setMessage((prev) => prev + emojiObject.emoji);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if ((!message.trim() && !file) || loading) return;
    await sendMessage({ text: message.trim(), file });
    setMessage("");
    setFile(null);
    setPreview(null);
    setShowEmojiPicker(false);
  };

  return (
    <div className="p-2 border-t border-blue-300/20 bg-blue-900/20 backdrop-blur-sm relative">
       {showEmojiPicker && (
         <div className="absolute bottom-16 left-2 z-50">
             <EmojiPicker onEmojiClick={handleEmojiClick} theme="dark" />
         </div>
       )}

      {isMuted && (
        <div className="text-xs text-amber-200 mb-2">
          You are muted until {mutedUntil.toLocaleTimeString()}.
        </div>
      )}

      {preview && (
        <div className="mb-2 relative w-fit group">
            <img src={preview} alt="Preview" className="h-20 rounded-lg border border-blue-500/30" />
            <button
                onClick={() => {
                    setFile(null);
                    setPreview(null);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                }}
                className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1 text-white hover:bg-red-600 transition-colors"
            >
                <BsXCircle size={14} />
            </button>
        </div>
      )}

      <form onSubmit={handleSend} className="flex items-end gap-2">
        <div className="flex gap-2 mb-2">
            <button
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="text-blue-300 hover:text-blue-100 transition-colors p-2"
                disabled={isMuted}
            >
                <BsEmojiSmile size={20} />
            </button>
            <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-blue-300 hover:text-blue-100 transition-colors p-2"
                disabled={isMuted}
            >
                <BsPaperclip size={20} />
            </button>
            <input 
                type="file" 
                hidden 
                ref={fileInputRef} 
                onChange={handleFileChange}
                accept="image/*,video/*"
                disabled={isMuted}
            />
        </div>

        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          disabled={isMuted}
          placeholder={isMuted ? "Muted..." : "Type a message..."}
          className="flex-1 px-3 py-2 rounded-lg bg-white/10 text-white text-sm outline-none placeholder:text-blue-200/70 border border-white/10 focus:border-blue-400/60 disabled:opacity-50 min-h-[40px] max-h-[100px]"
        />
        <button
          disabled={loading || isMuted}
          className="px-4 py-2 rounded-lg bg-blue-600/80 hover:bg-blue-600 text-white text-sm transition-all disabled:opacity-50 flex items-center justify-center h-[40px]"
        >
          {loading ? <span className="loading loading-spinner loading-xs"></span> : <BsSend size={18} />}
        </button>
      </form>
    </div>
  );
};

export default GroupMessageInput;
