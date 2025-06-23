import { useEffect, useState } from "react";
import { useAuthContext } from "../../context/AuthContext";
import { extractTime } from "../../utils/extractTime";
import useConversation from "../../zustand/useConversation";
import useSendMessage from "../../hooks/useSendMessage";
import useReactToMessage from "../../hooks/useReactToMessage"; // ✅ Import the hook
import { BsReply, BsEmojiSmile } from "react-icons/bs"; // Icons for reply & reactions
import EmojiPicker from "emoji-picker-react";

const Message = ({ message }) => {
    const { authUser } = useAuthContext();
    const { selectedConversation, setShowDelete, showDelete } = useConversation();
    const { deleteMessage, sendMessage } = useSendMessage();
    const { reactToMessage, loading: reacting } = useReactToMessage(); // ✅ Use reaction hook

    const [reactionMenuOpen, setReactionMenuOpen] = useState(false);
    const [replyingTo, setReplyingTo] = useState(null); // Track reply

    const fromMe = message.senderId === authUser._id;
    const formattedTime = extractTime(message.createdAt);
    const chatClassName = fromMe ? "chat-end" : "chat-start";
    const profilePic = fromMe ? authUser.profilePic : selectedConversation?.profilePic;
    const bubbleBgColor = fromMe ? "bg-blue-500" : "";
    const shakeClass = message.shouldShake ? "shake" : "";

    // Determine message status
    const messageStatus = fromMe ? message.status : "";
    const statusText = messageStatus === "seen" ? "✓✓ Seen" : messageStatus === "delivered" ? "✓ Delivered" : "✓ Sent";

    // Handle right-click to show delete option
    const handleContextMenu = (e) => {
        e.preventDefault();
        if (fromMe) setShowDelete(message._id);
    };

    // ✅ Handle Reply
    const handleReply = () => {
        setReplyingTo((prev) => (prev ? null : message));
    };

    // ✅ Handle Sending Reply
    const sendReply = async (replyText) => {
        if (!replyText.trim()) return;
        
        // Structure reply message with reference to the original message
        const newMessage = {
            text: replyText,
            replyTo: {
                message: replyingTo.message, // Store the replied message text
                messageId: replyingTo._id,  // Store the replied message ID
                senderId: replyingTo.senderId, // Store sender info
            }
        };
    
        await sendMessage(newMessage); // Send the reply message
        setReplyingTo(null); // Reset reply box
    };
    

    // ✅ Handle Reaction using the hook
    const handleReaction = (emojiObject) => {
        const emoji = emojiObject.emoji; // Extract emoji
        reactToMessage(message._id, emoji); // Call hook function
        setReactionMenuOpen(false); // Close reaction menu
    };

    // Handle message deletion
	const handleDeleteMessage = async () => {
		await deleteMessage(message._id); // Ensure async deletion
		setShowDelete(null);
		//if (onDelete) onDelete(); // ✅ Refresh messages after deletion
	};

    return (
        <div className={`chat ${chatClassName}`} onContextMenu={handleContextMenu} >
            <div className="chat-image avatar">
                <div className="w-10 rounded-full">
                    <img alt="User avatar" src={profilePic} />
                </div>
            </div>

            <div className="relative flex flex-col mt-6">
                {/* ✅ Display Reply if exists */}
                {message.replyTo && (
                    <div className="reply-box bg-blue-950 p-2  rounded-md text-gray-200">
                        <p className="text-xs ">Replying to:  {message.replyTo.text}</p>
                    </div>
                )}

                {/* 📜 Text Message */}
                {message.message && (
                    <div className={`chat-bubble text-white ${bubbleBgColor} ${shakeClass} pb-2`}>
                        {message.message}
                    </div>
                )}

                {/* 🖼️ Image/Video Message */}
                {message.media && (
                    message.media.match(/\.(jpeg|jpg|png|gif|webp)$/i) ? (
                        <img
                            src={message.media}
                            alt="Sent media"
                            className="rounded-lg max-w-xs mt-2 cursor-pointer"
                            onClick={() => window.open(message.media, "_blank")}
                        />
                    ) : (
                        <video controls className="rounded-lg max-w-xs mt-2">
                            <source src={message.media} type="video/mp4" />
                            Your browser does not support the video tag.
                        </video>
                    )
                )}

                {/* ✅ Display Reactions */}
                {message.reactions?.length > 0 && (
                    <div className="reactions flex gap-1 mt-1">
                        {message.reactions.map((r, index) => (
                            <span key={index} className="text-lg cursor-pointer">{r.emoji}</span>
                        ))}
                    </div>
                )}

                {/* ✅ Action Buttons (Reply & React) */}
                <div className="chat-footer opacity-50 text-xs flex gap-1 items-center">
                    {formattedTime}
                    {fromMe && <span className="ml-2 text-gray-400">{statusText}</span>}
                    <BsReply className="cursor-pointer text-gray-400 ml-2" onClick={handleReply} />
                    <BsEmojiSmile className="cursor-pointer text-gray-400" onClick={() => setReactionMenuOpen(!reactionMenuOpen)} />
                </div>

                {/* ✅ Reaction Menu */}
                {reactionMenuOpen && (
                    <div className="absolute bottom-8 left-0">
                    <EmojiPicker onEmojiClick={handleReaction} />
                </div>
                )}

                {/* ✅ Reply Input Box */}
                {replyingTo && (
                    <div className="reply-input mt-2 p-2 bg-blue-950 rounded-md flex items-center">
                        <input
                            type="text"
                            placeholder={`Reply to : ${replyingTo.message}`}
                            className="flex-1 p-1 outline-none "
                            onKeyDown={(e) => e.key === "Enter" && sendReply(e.target.value)}
                        />
                        <button onClick={() => sendReply(document.querySelector(".reply-input input").value)} className="ml-2 text-blue-500">
                            Send
                        </button>
                    </div>
                )}

                {/* ❌ Delete Message Option */}
				{showDelete === message._id &&(
					<div
						className="absolute bottom-6 right-0 bg-gray-700 text-white text-sm p-2 rounded shadow-md cursor-pointer"
						onClick={handleDeleteMessage}
					>
						Delete Message
					</div>
				)}

            </div>
        </div>
    );
};

export default Message;
