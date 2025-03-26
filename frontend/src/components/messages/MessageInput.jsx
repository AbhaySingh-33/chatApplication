import { useState } from "react";
import { BsSend, BsEmojiSmile, BsPaperclip, BsXCircle } from "react-icons/bs";
import EmojiPicker from "emoji-picker-react";
import useSendMessage from "../../hooks/useSendMessage";
import { useSocketContext } from "../../context/SocketContext";
import useConversation from "../../zustand/useConversation";

const MessageInput = () => {
	const [message, setMessage] = useState("");
	const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);
	const [showEmojiPicker, setShowEmojiPicker] = useState(false);
	const { loading, sendMessage } = useSendMessage();
	const { selectedConversation } = useConversation();
	const { socket } = useSocketContext();

	const handleEmojiClick = (emojiObject) => {
		setMessage((prev) => prev + emojiObject.emoji);
	};

	const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            setFile(selectedFile);
            setPreview(URL.createObjectURL(selectedFile)); // Show preview
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!message && !file) return;

        await sendMessage({ text: message, file });

        setMessage("");
        setFile(null);
        setPreview(null);

		if (socket && selectedConversation) {
            socket.emit("stopTyping", {
                senderId: socket.id,
                receiverId: selectedConversation._id,
            });
        }
    };

	const handleKeyDown = () => {
        socket.emit("typing", { senderId: socket.id, receiverId: selectedConversation._id });
    };
    
    const handleKeyUp = () => {
        setTimeout(() => {
            socket.emit("stopTyping", { senderId: socket.id, receiverId: selectedConversation._id });
        }, 2000); // Stop typing indicator after 2s of no key press
    };

	return (
		<div className="relative">
            <form className="px-4 my-3" onSubmit={handleSubmit}>
                <div className="relative flex items-center">
                    {/* Emoji Button */}
                    <button
                        type="button"
                        className="absolute inset-y-0 left-3 flex items-center"
                        onClick={() => setShowEmojiPicker((prev) => !prev)}
                    >
                        <BsEmojiSmile />
                    </button>

                    {/* Text Input */}
                    <input
                        type="text"
                        className="border text-sm rounded-lg block w-full p-2.5 pl-10 bg-gray-700 border-gray-600 text-white"
                        placeholder="Type a message..."
                        value={message}
                        onKeyDown={handleKeyDown} // Start typing
                        onKeyUp={handleKeyUp}
                        onChange={(e) => {
                            setMessage(e.target.value);
                            if (socket && selectedConversation) {
                                socket.emit("typing", {
                                    senderId: socket.id,
                                    receiverId: selectedConversation._id,
                                });
                            }
                        }}
                        onBlur={() => {
                            if (socket && selectedConversation) {
                                socket.emit("stopTyping", {
                                    senderId: socket.id,
                                    receiverId: selectedConversation._id,
                                });
                            }
                        }}
                    />

                    {/* File Upload */}
                    <label htmlFor="file-upload" className="absolute inset-y-0 right-12 flex items-center cursor-pointer">
                        <BsPaperclip />
                    </label>
                    <input
                        type="file"
                        id="file-upload"
                        className="hidden"
                        onChange={handleFileChange}
                        accept="image/*, video/*"
                    />

                    {/* Send Button */}
                    <button type="submit" className="absolute inset-y-0 right-3 flex items-center">
                        {loading ? <div className="loading loading-spinner"></div> : <BsSend />}
                    </button>
                </div>
            </form>

            {/* File Preview */}
            {preview && (
                <div className="relative mx-4 mt-2">
                    <img src={preview} alt="Preview" className="w-20 h-20 object-cover rounded-md" />
                    <button
                        type="button"
                        className="absolute top-0 right-0 text-white bg-black p-1 rounded-full"
                        onClick={() => {
                            setFile(null);
                            setPreview(null);
                        }}
                    >
                        <BsXCircle />
                    </button>
                </div>
            )}

            {/* Emoji Picker */}
            {showEmojiPicker && (
                <div className="absolute bottom-12 left-4 z-10">
                    <EmojiPicker onEmojiClick={handleEmojiClick} />
                </div>
            )}
        </div>
    );
};

export default MessageInput;
