import { useEffect } from "react";
import useConversation from "../../zustand/useConversation";
import MessageInput from "./MessageInput";
import Messages from "./Messages";
import { TiMessages } from "react-icons/ti";
import { useAuthContext } from "../../context/AuthContext";

const MessageContainer = () => {
	const { selectedConversation, setSelectedConversation, setShowDelete,typingUsers } = useConversation();

	useEffect(() => {
		// Reset conversation when component unmounts
		return () => setSelectedConversation({});
	}, [setSelectedConversation]);

	// Check if selectedConversation is empty
	const isEmptyObject = (obj) => !Object.keys(obj).length;

	return (
		<div
		  className="flex flex-col h-[100dvh] sm:h-auto w-full sm:min-w-[450px] backdrop-filter backdrop-blur-lg"
		  onClick={() => setShowDelete(null)}
		>
		  {isEmptyObject(selectedConversation) ? (
			<NoChatSelected />
		  ) : (
			<>
			  {/* Header */}
			  <div className="bg-slate-500 px-4 py-2 flex justify-between items-center">
				<div>
				  <span className="label-text">To:</span>{" "}
				  <span className="text-gray-900 font-bold">{selectedConversation.fullName}</span>
				</div>
				<button
				  onClick={() => setSelectedConversation({})}
				  className="text-white hover:text-red-500 text-xl font-bold"
				>
				  &times;
				</button>
			  </div>
	  
			  {/* Typing Indicator */}
			  {typingUsers[selectedConversation?._id] && (
				<p className="text-sm text-gray-400 px-4 py-1">✍️ Typing...</p>
			  )}
	  
			  {/* Messages */}
			  <div className="flex-1 overflow-y-auto px-2 py-1">
				<Messages />
			  </div>
	  
			  {/* Message Input */}
			  <div className="p-2 border-t border-gray-600">
				<MessageInput />
			  </div>
			</>
		  )}
		</div>
	  );
	  
};

export default MessageContainer;

const NoChatSelected = () => {
	const { authUser } = useAuthContext();
	return (
		<div className='flex items-center justify-center w-full h-full'>
			<div className='px-4 text-center sm:text-lg md:text-xl text-gray-200 font-semibold flex flex-col items-center gap-2'>

				{/* User Avatar */}
				{authUser && authUser.profilePic && (
                    <div className="w-18 py-4 rounded-full">
                    <img src={authUser.profilePic} alt="user avatar" />
                </div>
				)}

				<p>Welcome 👋 {authUser.fullName} ❄</p>
				<p>Select a chat to start messaging</p>
				<TiMessages className='text-3xl md:text-6xl text-center' />
			</div>
		</div>
	);
};
