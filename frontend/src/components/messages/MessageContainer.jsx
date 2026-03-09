import { useEffect } from "react";
import useConversation from "../../zustand/useConversation";
import MessageInput from "./MessageInput";
import Messages from "./Messages";
import ConflictResolverPanel from "./ConflictResolverPanel";
import AIInsightsPanel from "./AIInsightsPanel";
import { TiMessages } from "react-icons/ti";
import { useAuthContext } from "../../context/AuthContext";
import { Phone, Video, Menu } from "lucide-react";
import useConflictMode from "../../hooks/useConflictMode";
import { useCallContext } from "../../context/CallContext";
import { useNavigate } from "react-router-dom";

const MessageContainer = ({ sidebarOpen, setSidebarOpen }) => {
  const {
    selectedConversation,
    setSelectedConversation,
    setShowDelete,
    typingUsers,
    conflictHints,
  } = useConversation();

  const { authUser } = useAuthContext();
  const { mode, updateMode, loading: conflictModeLoading } = useConflictMode();

  // New Global Call Logic
  const { startCall, callState } = useCallContext();
  const { callStarted } = callState;

  const showRightPanel = selectedConversation?.isAI || (conflictHints && conflictHints[selectedConversation?._id]);

  useEffect(() => {
    return () => setSelectedConversation({});
  }, [setSelectedConversation]);

  const isEmptyObject = (obj) => !Object.keys(obj).length;

  const handleCall = (receiver, isVideo = false) => {
    if (callStarted) return;
    startCall(receiver, isVideo);
  };

  // Close delete modal when clicking outside
  const handleContainerClick = () => {
    if (setShowDelete) setShowDelete(null);
  }

  return (
    <div
      className="flex flex-col h-full w-full min-w-0 bg-blue-900/10 backdrop-filter backdrop-blur-lg"
      onClick={handleContainerClick}
    >
      {isEmptyObject(selectedConversation) ? (
        <NoChatSelected sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      ) : (
        <>
          {/* Header */}
          <div className="bg-white/5 px-4 py-3 mb-0 flex items-center gap-3 shadow-lg border-b border-white/10 backdrop-blur-md relative z-10 w-full overflow-hidden">
             
             <button 
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="hidden sm:flex text-white/80 hover:text-white mr-1 p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-all"
                title={sidebarOpen ? "Hide Sidebar" : "Show Sidebar"}
             >
                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={sidebarOpen ? "M15 19l-7-7 7-7" : "M9 5l7 7-7 7"} />
                 </svg>
             </button>

             <button 
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="sm:hidden text-white/80 hover:text-white mr-1"
             >
                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={sidebarOpen ? "M15 19l-7-7 7-7" : "M9 5l7 7-7 7"} />
                 </svg>
             </button>
              
            <div className="relative shrink-0">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden border-2 border-white/20 shadow-md transition-transform hover:scale-105">
                <img
                    key={selectedConversation._id}
                    src={selectedConversation.profilePic}
                    alt="user avatar"
                    className="w-full h-full object-cover"
                />
                </div>
            </div>
            
            <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
              <span className="text-white font-bold text-base sm:text-lg tracking-wide truncate">
                {selectedConversation.fullName}
              </span>
              <span className="text-gray-400 text-xs truncate animate-pulse">
                {typingUsers[selectedConversation?._id] ? "Typing..." : `@${selectedConversation.username || "user"}`}
              </span>
            </div>

            {/* Conflict Mode Toggle - Compact Row */}
             <div className="hidden md:flex items-center gap-2 bg-black/20 rounded-full p-1 shrink-0">
                {conflictModeLoading ? (
                    <span className="loading loading-spinner loading-xs text-info"></span>
                ) : (
                     <div className="flex bg-white/10 border border-white/10 rounded-lg">
                        <select
                        value={mode}
                        onChange={(e) => updateMode(e.target.value)}
                        className="bg-transparent text-xs text-white outline-none cursor-pointer px-2 py-1 appearance-none hover:bg-white/5"
                        title="Conflict resolution mode"
                        >
                        <option value="off" className="text-black">No Assist</option>
                        <option value="suggest" className="text-black">Suggest</option>
                        <option value="modify" className="text-black">Auto-Fix</option>
                        </select>
                    </div>
                )}
            </div>

            {/* Video/Audio Call Buttons */}
            <div className="flex items-center gap-3 sm:gap-4 border-l border-white/10 pl-3 sm:pl-4 shrink-0">
              <button 
                  onClick={() => handleCall(selectedConversation, false)}
                  disabled={callStarted}
                  className={`transition-all duration-200 ${callStarted ? 'opacity-50 cursor-not-allowed' : 'hover:scale-110'}`}
              >
                  <Phone
                    className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-blue-200 hover:text-green-500"
                  />
              </button>
              <button 
                  onClick={() => handleCall(selectedConversation, true)}
                  disabled={callStarted}
                  className={`transition-all duration-200 ${callStarted ? 'opacity-50 cursor-not-allowed' : 'hover:scale-110'}`}
              >
                  <Video
                    className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-blue-200 hover:text-cyan-400"
                  />
              </button>
            </div>

            <button
              onClick={() => setSelectedConversation({})}
              className="text-blue-200 hover:text-red-400 text-lg sm:text-xl font-bold transition-colors duration-200 hover:scale-110 ml-2"
            >
              &times;
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-hidden flex flex-col md:flex-row relative w-full">
             <div className="flex-1 flex flex-col min-w-0 h-full relative"> 
                <Messages />
                {/* Float Conflict Mode Selector on Mobile since header is crowded */}
                <div className="md:hidden absolute top-2 right-2 z-10">
                    <select
                        value={mode}
                        onChange={(e) => updateMode(e.target.value)}
                        className="bg-black/60 backdrop-blur text-xs text-white border border-white/20 rounded-full px-2 py-1 outline-none"
                    >
                        <option value="off" className="text-black">Assist: Off</option>
                        <option value="suggest" className="text-black">Assist: Suggest</option>
                        <option value="modify" className="text-black">Assist: Auto</option>
                    </select>
                </div>
                <MessageInput />
             </div>
             
             {/* Panels for larger screens */}
             {showRightPanel && (
                <div className="hidden md:flex flex-col w-72 bg-black/20 border-l border-white/10 h-full overflow-hidden">
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        <AIInsightsPanel />
                        <ConflictResolverPanel />
                    </div>
                </div>
             )}
          </div>
        </>
      )}
    </div>
  );
};
export default MessageContainer;

const NoChatSelected = ({ sidebarOpen, setSidebarOpen }) => {
	const { authUser } = useAuthContext();
	const navigate = useNavigate();
	return (
		<div className='flex items-center justify-center w-full h-full relative p-4'>
                 <button 
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="absolute top-4 left-4 text-white/50 hover:text-white p-2 z-10 bg-white/10 hover:bg-white/20 rounded-lg transition-all"
                    title={sidebarOpen ? "Hide Sidebar" : "Show Sidebar"}
                >
                     <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={sidebarOpen ? "M15 19l-7-7 7-7" : "M9 5l7 7-7 7"} />
                     </svg>
                </button>
			<div className='px-4 text-center sm:text-lg md:text-xl text-gray-200 font-semibold flex flex-col items-center gap-4 animate-fade-in'>
				<img
					src={authUser.profilePic}
					alt="Profile"
					className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-full object-cover border-4 border-blue-400/50 cursor-pointer hover:border-blue-400 transition-all duration-300 hover:scale-110 shadow-xl"
					onClick={() => navigate("/profile")}
					title="Go to Profile"
				/>
				<div>
                    <p className="text-xl sm:text-2xl">Welcome 👋 <span className="text-blue-400">{authUser.fullName}</span> ❄</p>
				    <p className="text-xs sm:text-sm opacity-70 mt-2">Select a chat to start messaging, use conflict resolution, or AI insights.</p>
                </div>
				<TiMessages className='text-5xl sm:text-6xl md:text-8xl text-center text-blue-500/50' />
			</div>
		</div>
	);
};
