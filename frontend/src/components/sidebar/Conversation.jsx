import { useSocketContext } from "../../context/SocketContext";
import useConversation from "../../zustand/useConversation";
import { useAuthContext } from "../../context/AuthContext";
import { useEffect } from "react";
import toast from "react-hot-toast";
import { useState } from "react";

const Conversation = ({ conversation, lastIdx, emoji }) => {
  const {
    selectedConversation,
    setSelectedConversation,
    unreadMessages,
    resetUnreadMessages,
    setMessages,
  } = useConversation();
  const { onlineUsers, socket } = useSocketContext();
  const { authUser } = useAuthContext();

    const [isFriend, setIsFriend] = useState(false);

  const isSelected = selectedConversation?._id === conversation._id;
  const isOnline = onlineUsers.includes(conversation._id);
  const unreadCount = unreadMessages[conversation._id] || 0;

  const handleSelectConversation = () => {
    setSelectedConversation(conversation);
    resetUnreadMessages(conversation._id); // Reset unread count when opening chat
    console.log(conversation.profilePic);

    //  Emit event to mark all messages as seen
    socket.emit("allmessageSeen", {
      receiverId: authUser._id,
      senderId: conversation._id,
    });
  };

  const isEmptyObject = (obj) => !Object.keys(obj).length;

  const handleAddFriend = async (e) => {
    e.stopPropagation(); // prevent selecting conversation on button click

    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/friends/add`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authUser.token}`,
        },
        body: JSON.stringify({ friendId: conversation._id }),
        credentials: "include",
      });

      if (res.ok) {
        setIsFriend(true);
        toast.success("Friend added successfully!");
        socket.emit("friend:added", {
          from: authUser._id,});
      } else {
        const data = await res.json();
       toast.error(data.error || "Failed to add friend");
      }
    } catch (error) {
      console.error("Add friend error:", error);
    }
  };

  useEffect(() => {
    if (!selectedConversation) {
      setMessages([]);
    }
  }, [selectedConversation]);

  return (
    <>
      <div
        className={`flex gap-2 items-center hover:bg-sky-500 rounded p-2 py-1 cursor-pointer 
                ${isSelected ? "bg-sky-500" : ""}`}
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
            <button
              onClick={handleAddFriend}
              disabled={isFriend}
              className="text-white font-bold"
              title={isFriend ? "Already a friend" : "Add Friend"}
            >
              {isFriend ? "✅" : "+"}
            </button>

            {/*  Show Unread Message Count */}
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
        </div>
      </div>

      {!lastIdx && <div className="divider my-0 py-0 h-1" />}
    </>
  );
};

export default Conversation;
