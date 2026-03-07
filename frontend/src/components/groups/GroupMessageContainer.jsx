import { useEffect, useState } from "react";
import { Menu, Settings2 } from "lucide-react";
import useGroupChat from "../../zustand/useGroupChat";
import GroupMessages from "./GroupMessages";
import GroupMessageInput from "./GroupMessageInput";
import GroupSettingsPanel from "./GroupSettingsPanel";
import useGroupDetails from "../../hooks/useGroupDetails";

const GroupMessageContainer = ({ sidebarOpen, setSidebarOpen }) => {
  const { selectedGroup, setSelectedGroup, groupDetails } = useGroupChat();
  const { refresh } = useGroupDetails();
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    setSettingsOpen(false);
  }, [selectedGroup?._id]);

  if (!selectedGroup?._id) {
    return (
      <div className="flex items-center justify-center w-full h-full bg-blue-900/10 backdrop-blur-sm relative">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="absolute top-4 left-4 z-30 p-2 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-lg transition-all duration-300 border border-white/20"
          title={sidebarOpen ? "Hide Sidebar" : "Show Sidebar"}
        >
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={sidebarOpen ? "M15 19l-7-7 7-7" : "M9 5l7 7-7 7"} />
          </svg>
        </button>
        <div className="px-4 text-center text-blue-100 font-semibold flex flex-col items-center gap-4">
          <p className="text-xl">Select a group to start chatting</p>
          <span className="text-sm text-blue-200/70">
            Your AI moderator keeps conversations friendly.
          </span>
        </div>
      </div>
    );
  }

  const memberCount =
    groupDetails?.members?.length || selectedGroup?.membersCount || 0;

  return (
    <div className="relative flex flex-col h-full w-full min-w-0 bg-blue-900/10 backdrop-filter backdrop-blur-lg">
      <div className="bg-blue-900/40 backdrop-blur-sm px-3 sm:px-4 py-2 sm:py-3 flex justify-between items-center sticky top-0 z-20 border-b border-blue-300/20">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-lg transition-all duration-300 border border-white/20"
            title={sidebarOpen ? "Hide Sidebar" : "Show Sidebar"}
          >
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={sidebarOpen ? "M15 19l-7-7 7-7" : "M9 5l7 7-7 7"} />
            </svg>
          </button>
          <div>
            <p className="text-white font-bold text-sm sm:text-base">
              {selectedGroup?.name}
            </p>
            <p className="text-xs text-blue-200">
              {memberCount} members
              {groupDetails?.isAdmin && (
                <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/30 text-amber-200 border border-amber-400/30">
                  Admin
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setSettingsOpen((prev) => !prev)}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white"
            title="Group settings"
          >
            <Settings2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setSelectedGroup(null)}
            className="text-blue-200 hover:text-red-400 text-lg font-bold"
          >
            &times;
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <GroupMessages />
      </div>

      <GroupMessageInput />

      {settingsOpen && (
        <GroupSettingsPanel onClose={() => setSettingsOpen(false)} refreshDetails={refresh} />
      )}
    </div>
  );
};

export default GroupMessageContainer;
