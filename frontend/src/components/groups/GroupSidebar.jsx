import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import useGetGroups from "../../hooks/useGetGroups";
import useCreateGroup from "../../hooks/useCreateGroup";
import useFriendsList from "../../hooks/useFriendsList";
import useGroupChat from "../../zustand/useGroupChat";
import GroupListItem from "./GroupListItem";

const GroupSidebar = ({ sidebarOpen, setSidebarOpen }) => {
  const navigate = useNavigate();
  const { groups } = useGroupChat();
  const { loading } = useGetGroups();
  const { createGroup, loading: creating } = useCreateGroup();
  const { friends } = useFriendsList();

  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedMembers, setSelectedMembers] = useState([]);

  const filteredGroups = useMemo(() => {
    if (!search.trim()) return groups;
    return groups.filter((group) =>
      group.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [groups, search]);

  const toggleMember = (id) => {
    setSelectedMembers((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );
  };

  const handleCreate = async () => {
    if (!name.trim()) return;
    await createGroup({
      name: name.trim(),
      description: description.trim(),
      memberIds: selectedMembers,
    });
    setName("");
    setDescription("");
    setSelectedMembers([]);
    setShowCreate(false);
  };

  return (
    <div className="border-r-0 sm:border-r border-white/10 p-3 flex flex-col h-full overflow-hidden bg-white/5 backdrop-blur-sm relative">
      <div className="flex items-center justify-between gap-2">
        <button
          onClick={() => navigate("/")}
          className="text-xs text-blue-200 hover:text-white transition-colors"
        >
          Back to Chats
        </button>
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

      <div className="mt-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search groups..."
          className="w-full px-3 py-2 rounded-lg bg-white/10 text-white text-sm outline-none placeholder:text-blue-200/70 border border-white/10 focus:border-blue-400/60"
        />
      </div>

      <div className="mt-3">
        <button
          onClick={() => setShowCreate((prev) => !prev)}
          className="w-full text-sm py-2 rounded-lg bg-blue-600/70 hover:bg-blue-600 text-white transition-all"
        >
          {showCreate ? "Cancel" : "Create Group"}
        </button>
      </div>

      {showCreate && (
        <div className="mt-3 p-3 rounded-lg bg-blue-900/30 border border-blue-300/20">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Group name"
            className="w-full px-3 py-2 rounded-md bg-white/10 text-white text-sm outline-none placeholder:text-blue-200/70 border border-white/10"
          />
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description (optional)"
            className="w-full mt-2 px-3 py-2 rounded-md bg-white/10 text-white text-sm outline-none placeholder:text-blue-200/70 border border-white/10"
          />
          <div className="mt-3">
            <p className="text-xs text-blue-200 mb-1">Add friends</p>
            <div className="max-h-28 overflow-y-auto space-y-1">
              {friends.length === 0 && (
                <p className="text-xs text-blue-200/70">No friends available</p>
              )}
              {friends.map((friend) => (
                <label key={friend._id} className="flex items-center gap-2 text-xs text-white">
                  <input
                    type="checkbox"
                    checked={selectedMembers.includes(friend._id)}
                    onChange={() => toggleMember(friend._id)}
                  />
                  <span>{friend.fullName || friend.username}</span>
                </label>
              ))}
            </div>
          </div>
          <button
            disabled={!name.trim() || creating}
            onClick={handleCreate}
            className="mt-3 w-full text-sm py-2 rounded-md bg-emerald-500/80 hover:bg-emerald-500 text-white transition-all disabled:opacity-50"
          >
            {creating ? "Creating..." : "Create"}
          </button>
        </div>
      )}

      <div className="divider px-3 border-white/20 my-3"></div>

      <div className="flex-1 overflow-y-auto space-y-2">
        {filteredGroups.map((group) => (
          <GroupListItem key={group._id} group={group} />
        ))}
        {loading && <span className="loading loading-spinner mx-auto"></span>}
        {!loading && filteredGroups.length === 0 && (
          <p className="text-xs text-blue-200/70 text-center">No groups yet</p>
        )}
      </div>
    </div>
  );
};

export default GroupSidebar;
