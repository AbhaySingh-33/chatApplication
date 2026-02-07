import { useSocketContext } from "../../context/SocketContext";
import useConversation from "../../zustand/useConversation";
import { useAuthContext } from "../../context/AuthContext";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

const Conversation = ({ conversation, lastIdx, emoji }) => {
  const {
    selectedConversation,
    setSelectedConversation,
    unreadMessages,
    resetUnreadMessages,
  } = useConversation();
  const { onlineUsers, socket } = useSocketContext();
  const { authUser, setAuthUser } = useAuthContext();
  
  // Initialize requestSent from backend data
  const [requestSent, setRequestSent] = useState(conversation.requestSent || false);
  
  // Initialize isFriend from backend data. 
  // We use state so we can update it locally if we discover we are friends (e.g. "Already friends" error)
  const [isFriend, setIsFriend] = useState(conversation.isFriend);

  // Sync state if prop changes OR if authUser friends list updates (e.g. accepted in Notifications)
  useEffect(() => {
    // Check if truly friends via AuthContext (most up-to-date source for accepted requests)
    const isFriendInContext = authUser.friends?.some(friend => {
        const id = typeof friend === 'object' ? friend._id : friend;
        return id?.toString() === conversation._id?.toString();
    });
    
    // STRICTLY trust AuthContext for friendship status to handle both additions and removals dynamically
    setIsFriend(!!isFriendInContext);
    
    // For requestSent, we still rely on the prop snapshot or could track it locally if we had a "sentRequests" context
    setRequestSent(conversation.requestSent || false);
  }, [conversation.isFriend, conversation.requestSent, authUser.friends, conversation._id]);
  
  const isSelected = selectedConversation?._id === conversation._id;
  const isOnline = onlineUsers.includes(conversation._id);
  const unreadCount = unreadMessages[conversation._id] || 0;

  const handleSelectConversation = () => {
    // Restriction Logic
    if (!isFriend) {
        toast.error("Add user to friends to start chatting");
        return; 
    }
    setSelectedConversation(conversation);
    resetUnreadMessages(conversation._id);
    
    if (socket) {
        socket.emit("allmessageSeen", {
            receiverId: authUser._id,
            senderId: conversation._id,
        });
    }
  };

  const handleSendRequest = async (e) => {
    e.stopPropagation(); // prevent triggering parent onClick
    
    // Optimistic UI update
    if(requestSent) return;

    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/friends/send-request`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ receiverId: conversation._id }),
        credentials: "include",
      });

      const data = await res.json();
      
      if (data.error) {
          if (data.error === "Already friends") {
              toast.success("You are already friends!");
              
              // Update local state to reflect friendship immediately
              setIsFriend(true); 
              
              // Update local auth context as backup
              const updatedUser = { ...authUser, friends: [...(authUser.friends || []), conversation._id] };
              localStorage.setItem("chat-user", JSON.stringify(updatedUser)); 
              setAuthUser(updatedUser);
              return;
          }
          if (data.error === "Request already sent") {
              toast.error("Request already sent");
              setRequestSent(true);
              return;
          }
          throw new Error(data.error);
      }

      toast.success("Friend request sent!");
      setRequestSent(true);
    } catch (error) {
      console.error("Failed to send friend request:", error.message);
      toast.error("Failed to send friend request");
    }
  };

  return (
    <>
      <div
        className={`flex gap-2 items-center hover:bg-sky-500 rounded p-1.5 py-1 cursor-pointer transition-all duration-200
                ${isSelected ? "bg-sky-500" : ""} ${!isFriend && !isSelected ? "opacity-75 hover:opacity-100" : ""}`}
        onClick={handleSelectConversation}
      >
        {/* User Avatar */}
        <div className={`avatar ${isOnline ? "online" : ""}`}>
          <div className="w-12 rounded-full">
            <img src={conversation.profilePic} alt="user avatar" />
          </div>
        </div>

        {/* Conversation Info */}
        <div className="flex flex-col flex-1">
          <div className="flex gap-3 justify-between items-center">
            <p className="font-bold text-gray-200">{conversation.username}</p>
            
            {/* "Add" Button if not friend */}
            {!isFriend ? (
               <button 
                onClick={handleSendRequest}
                className={`text-xs px-3 py-1.5 rounded-lg flex items-center justify-center font-semibold shadow-md transition-all duration-300
                    ${requestSent 
                        ? "bg-gray-600 text-gray-300 cursor-not-allowed" 
                        : "bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white hover:scale-105 active:scale-95"}`}
                disabled={requestSent}
               >
                   {requestSent ? "Sent" : "Add +"}
               </button>
            ) : (
                // Show emoji only if friends
                <span className='text-xl'>{emoji}</span>
            )}
          </div>
        </div>
        
        {/* Unread count only valid if friend */}
        {isFriend && unreadCount > 0 && (
           <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full ml-1">
             {unreadCount}
           </span>
         )}
      </div>

      {!lastIdx && <div className="divider my-0 py-0 h-1" />}
    </>
  );
};

export default Conversation;
