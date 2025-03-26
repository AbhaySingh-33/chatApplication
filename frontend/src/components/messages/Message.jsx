import { useEffect, useState } from "react";
import { useAuthContext } from "../../context/AuthContext";
import { extractTime } from "../../utils/extractTime";
import useConversation from "../../zustand/useConversation";
import useSendMessage from "../../hooks/useSendMessage"; // Import the custom hook correctly

const Message = ({ message, onDelete }) => {
	const { authUser } = useAuthContext();
	const { selectedConversation,showDelete, setShowDelete } = useConversation();
	const { deleteMessage } = useSendMessage(); // Correct usage of deleteMessage

	//const [showDelete, setShowDelete] = useState(false);

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

	// Handle message deletion
	const handleDeleteMessage = async () => {
		await deleteMessage(message._id); // Ensure async deletion
		setShowDelete(null);
		if (onDelete) onDelete(); // ✅ Refresh messages after deletion
	};

	// Check if message contains media (image/video)
	const isImage = message.media && message.media.match(/\.(jpeg|jpg|png|gif|webp)$/i);
	const isVideo = message.media && message.media.match(/\.(mp4|webm|ogg)$/i);

	return (
		<div className={`chat ${chatClassName}`} onContextMenu={handleContextMenu}>
			<div className='chat-image avatar'>
				<div className='w-10 rounded-full'>
					<img alt='User avatar' src={profilePic} />
				</div>
			</div>

			<div className="relative flex flex-col">
				{/* 📜 Text Message */}
				{message?.message && (
					<div className={`chat-bubble text-white ${bubbleBgColor} ${shakeClass} pb-2`}>
						{message.message}
					</div>
				)}

				{/* 🖼️ Image Message */}
				{isImage && (
					<img
						src={message.media}
						alt="Sent image"
						className="rounded-lg max-w-xs mt-2 cursor-pointer"
						onClick={() => window.open(message.media, "_blank")} // Open full image
					/>
				)}

				{/* 🎥 Video Message */}
				{isVideo && (
					<video controls className="rounded-lg max-w-xs mt-2">
						<source src={message.media} type="video/mp4" />
						Your browser does not support the video tag.
					</video>
				)}

				<div className='chat-footer opacity-50 text-xs flex gap-1 items-center'>{formattedTime}</div>
				{fromMe && <span className="ml-2 text-gray-400">{statusText}</span>}

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
