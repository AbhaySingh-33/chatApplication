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

	// Declare a timeout reference outside the functions
let typingTimeout = null;

const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault(); // Prevents new line
        handleSubmit(e);    // Send message
        return;
    }
    // Emit the "typing" event when the user starts typing
    socket.emit("typing", { 
        senderId: socket.id, 
        receiverId: selectedConversation._id 
    });

    // Clear any existing typing timeout (to avoid prematurely stopping the typing indicator)
    if (typingTimeout) {
        clearTimeout(typingTimeout);
        typingTimeout = null;
    }
};

const handleKeyUp = () => {
    // Clear any previously set timeout to prevent overlaps
    if (typingTimeout) {
        clearTimeout(typingTimeout);
    }

    // Set a new timeout for 2 seconds
    typingTimeout = setTimeout(() => {
        // Emit "stopTyping" after 2 seconds of no key press
        socket.emit("stopTyping", { 
            senderId: socket.id, 
            receiverId: selectedConversation._id 
        });

        // Clear the timeout after emitting to avoid memory leaks
        typingTimeout = null;
    }, 2000);
};


	return (
		<div className="relative">
            <form className="px-4 my-3" onSubmit={handleSubmit}>
                <div className="relative flex items-center">
                    {/* Emoji Button */}
                    <button
                        type="button"
                        className="absolute inset-y-0 left-3 flex items-center cursor-pointer "
                        onClick={() => setShowEmojiPicker((prev) => !prev)}
                    >
                        <BsEmojiSmile />
                    </button>

                    {/* Text Input */}
                    <textarea
                        type="text"
                        className="border text-sm rounded-lg block w-full p-2.5 pl-10 pr-20 bg-gray-700 border-gray-600 text-white resize-none focus:outline-none"
                        placeholder="Type a message..."
                        value={message}
                        rows={2}
                        onKeyDown={handleKeyDown} // Start typing
                        onKeyUp={handleKeyUp}
                        onClick={() => showEmojiPicker && setShowEmojiPicker(false)}

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
                        onClick={() => showEmojiPicker && setShowEmojiPicker(false)}
                        accept="image/*, video/*"
                    />

                    {/* Send Button */}
                    <button type="submit" className="absolute inset-y-0 right-3 flex items-center cursor-pointer"
                    onClick={() => showEmojiPicker && setShowEmojiPicker(false)}>
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
