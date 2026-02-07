import MessageContainer from "../../components/messages/MessageContainer";
import Sidebar from "../../components/sidebar/Sidebar";
import useConversation from "../../zustand/useConversation";
import { useAuthContext } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import useListenFriendUpdates from "../../hooks/useListenFriendUpdates";
import useGetMe from "../../hooks/useGetMe";
import useListenMessages from "../../hooks/useListenMessages";
import { useState } from "react";
import { Menu, X } from "lucide-react";

const Home = () => {
  const { selectedConversation } = useConversation();
  const { authUser } = useAuthContext();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Sync fresh user data (friends list) on mount to correct loose states
  useGetMe();
  
  // Listen for friend request acceptance to update UI in real-time
  useListenFriendUpdates();

  // Listen for incoming messages (handles unread counts & message updates globally)
  useListenMessages();

  return (
    <div className="flex items-center justify-center p-4 h-full">
      <div className="flex h-[75vh] sm:h-[420px] md:h-[520px] lg:h-[580px] xl:h-[620px] rounded-2xl overflow-hidden bg-white/5 backdrop-blur-lg border border-white/10 shadow-2xl relative z-10 animate-slide-up w-[90%] sm:w-[90%] max-w-none sm:max-w-[950px]">
        {/* Small screen top bar */}
        {!selectedConversation?._id && (
          <div className="sm:hidden absolute top-0 left-0 right-0 z-20 flex items-center gap-2 p-3 h-14 border-b border-white/10 bg-white/10 backdrop-blur-sm animate-fade-in">
            <img
              src={authUser?.profilePic || "/default-avatar.png"}
              alt={authUser?.username || "User"}
              className="w-9 h-9 rounded-full object-cover border-2 border-blue-400/50 cursor-pointer hover:border-blue-400 transition-all duration-300 hover:scale-110"
              onClick={() => navigate("/profile")}
              title="Go to Profile"
            />
            <span className="font-medium text-white text-sm">{authUser?.username}</span>
          </div>
        )}

        {/* Sidebar */}
        <div
          className={`${
            selectedConversation?._id ? "hidden sm:flex" : "flex"
          } ${sidebarOpen ? "sm:w-[340px]" : "sm:w-0"} w-full h-full flex-col overflow-hidden animate-fade-in-left transition-all duration-300 ${
            !selectedConversation?._id ? "pt-14 sm:pt-0" : ""
          }`}
        >
          <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        </div>

        {/* MessageContainer */}
        <div
          className={`${
            selectedConversation?._id ? "flex " : "hidden sm:flex"
          } w-full flex-1 animate-fade-in-right`}
        >
          <MessageContainer sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        </div>
      </div>
    </div>
  );
};
export default Home;