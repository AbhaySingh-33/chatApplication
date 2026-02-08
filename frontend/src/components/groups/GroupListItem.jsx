import useGroupChat from "../../zustand/useGroupChat";

const GroupListItem = ({ group }) => {
  const { selectedGroup, setSelectedGroup, resetUnread, unread } = useGroupChat();
  const isSelected = selectedGroup?._id === group._id;
  const unreadCount = unread[group._id] || 0;

  const handleSelect = () => {
    setSelectedGroup(group);
    resetUnread(group._id);
  };

  return (
    <div
      onClick={handleSelect}
      className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-all duration-200 ${
        isSelected ? "bg-blue-600/60" : "hover:bg-white/10"
      }`}
    >
      <div className="flex flex-col">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-white text-sm">{group.name}</span>
          {group.isAdmin && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/30 text-amber-200 border border-amber-400/30">
              Admin
            </span>
          )}
        </div>
        <span className="text-xs text-blue-200">
          {group.membersCount || 0} members
        </span>
      </div>

      {unreadCount > 0 && (
        <span className="text-xs bg-red-500 text-white rounded-full px-2 py-0.5">
          {unreadCount}
        </span>
      )}
    </div>
  );
};

export default GroupListItem;
