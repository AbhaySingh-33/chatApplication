import Conversations from "./Conversations";
import LogoutButton from "./LogoutButton";
import SearchInput from "./SearchInput";
import { useState, useEffect } from "react";
import { IoNotifications } from "react-icons/io5";
import Notifications from "./Notifications";
import { useNavigate } from "react-router-dom";
import { FaUsers } from "react-icons/fa";
import { useSocketContext } from "../../context/SocketContext";

const Sidebar = ({ sidebarOpen, setSidebarOpen }) => {
    const navigate = useNavigate();
    const [showNotifications, setShowNotifications] = useState(false);
    const { socket } = useSocketContext();
    const [hasNewNotification, setHasNewNotification] = useState(false);

    useEffect(() => {
        if (socket) {
            socket.on("newFriendRequest", () => {
                setHasNewNotification(true);
            });
        }
        return () => socket?.off("newFriendRequest");
    }, [socket]);

	return (
		<div className='border-r-0 sm:border-r border-white/10 p-2 flex flex-col h-full overflow-hidden bg-white/5 backdrop-blur-sm relative'>
            <div className="flex items-center justify-between gap-2 px-1">
                <div className="flex-1">
                    <SearchInput />
                </div>
                <div 
                   className="p-2 cursor-pointer rounded-full hover:bg-white/10 transition-all duration-300"
                   onClick={() => navigate("/groups")}
                   title="Groups"
                >
                    <FaUsers className="text-white text-2xl" />
                </div>
                <div 
                    className={`relative cursor-pointer p-2 rounded-full transition-all duration-300 ${showNotifications ? 'bg-blue-600' : 'hover:bg-white/10'}`} 
                    onClick={() => {
                        setShowNotifications(!showNotifications);
                        if (!showNotifications) setHasNewNotification(false);
                    }}
                    title="Friend Requests"
                >
                    <IoNotifications className="text-white text-2xl" />
                    {hasNewNotification && <span className="absolute top-1 right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse ring-2 ring-gray-800"></span>}
                </div>
                {sidebarOpen && (
                    <button
                        onClick={() => setSidebarOpen(false)}
                        className="hidden sm:flex p-1.5 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-lg transition-all duration-300 border border-white/20"
                        title="Hide Sidebar"
                    >
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                )}
            </div>
			
			<div className='divider px-3 border-white/20 my-2'></div>
			
            {showNotifications ? (
                <div className="animate-fade-in delay-100 flex-1 overflow-hidden">
                    <Notifications />
                </div>
            ) : (
                <div className="animate-fade-in delay-100 flex-1 overflow-hidden">
                    <Conversations />
                </div>
            )}
			
			<div className="mt-auto pt-2 animate-fade-in delay-400">
				<LogoutButton />
			</div>
		</div>
	);
};
export default Sidebar;
