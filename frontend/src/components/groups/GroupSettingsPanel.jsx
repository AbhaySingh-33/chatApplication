import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useAuthContext } from "../../context/AuthContext";
import useFriendsList from "../../hooks/useFriendsList";
import useGroupChat from "../../zustand/useGroupChat";

const GroupSettingsPanel = ({ onClose, refreshDetails }) => {
  const { authUser } = useAuthContext();
  const { groupDetails, selectedGroup } = useGroupChat();
  const { friends } = useFriendsList();

  const [selectedFriend, setSelectedFriend] = useState("");
  const [muteMinutes, setMuteMinutes] = useState(10);
  const [settings, setSettings] = useState(groupDetails?.settings || {});

  const isAdmin = groupDetails?.isAdmin;
  const groupId = selectedGroup?._id;

  const memberIds = useMemo(
    () => (groupDetails?.members || []).map((m) => m._id?.toString()),
    [groupDetails?.members]
  );

  const availableFriends = friends.filter(
    (friend) => !memberIds.includes(friend._id.toString())
  );

  const mutedMap = useMemo(() => {
    const map = new Map();
    (groupDetails?.mutedUsers || []).forEach((entry) => {
      const id = entry.userId?._id || entry.userId;
      map.set(id?.toString(), entry);
    });
    return map;
  }, [groupDetails?.mutedUsers]);

  const callApi = async (url, options) => {
    const res = await fetch(url, {
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      ...options,
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    return data;
  };

  const handleAddMember = async () => {
    if (!selectedFriend) return;
    try {
      await callApi(
        `${import.meta.env.VITE_BACKEND_URL}/api/groups/${groupId}/members`,
        {
          method: "POST",
          body: JSON.stringify({ memberId: selectedFriend }),
        }
      );
      toast.success("Member added");
      setSelectedFriend("");
      refreshDetails?.();
    } catch (error) {
      toast.error(error.message || "Failed to add member");
    }
  };

  const handleRemoveMember = async (memberId) => {
    try {
      await callApi(
        `${import.meta.env.VITE_BACKEND_URL}/api/groups/${groupId}/members/${memberId}`,
        { method: "DELETE" }
      );
      toast.success("Member removed");
      refreshDetails?.();
    } catch (error) {
      toast.error(error.message || "Failed to remove member");
    }
  };

  const handlePromote = async (memberId) => {
    try {
      await callApi(
        `${import.meta.env.VITE_BACKEND_URL}/api/groups/${groupId}/admins`,
        { method: "POST", body: JSON.stringify({ memberId }) }
      );
      toast.success("Member promoted");
      refreshDetails?.();
    } catch (error) {
      toast.error(error.message || "Failed to promote member");
    }
  };

  const handleDemote = async (memberId) => {
    try {
      await callApi(
        `${import.meta.env.VITE_BACKEND_URL}/api/groups/${groupId}/admins/${memberId}`,
        { method: "DELETE" }
      );
      toast.success("Admin demoted");
      refreshDetails?.();
    } catch (error) {
      toast.error(error.message || "Failed to demote admin");
    }
  };

  const handleMute = async (memberId) => {
    try {
      await callApi(
        `${import.meta.env.VITE_BACKEND_URL}/api/groups/${groupId}/mute`,
        {
          method: "POST",
          body: JSON.stringify({
            memberId,
            minutes: Number(muteMinutes) || 10,
            reason: "Muted by admin",
          }),
        }
      );
      toast.success("Member muted");
      refreshDetails?.();
    } catch (error) {
      toast.error(error.message || "Failed to mute member");
    }
  };

  const handleUnmute = async (memberId) => {
    try {
      await callApi(
        `${import.meta.env.VITE_BACKEND_URL}/api/groups/${groupId}/mute/${memberId}`,
        { method: "DELETE" }
      );
      toast.success("Member unmuted");
      refreshDetails?.();
    } catch (error) {
      toast.error(error.message || "Failed to unmute member");
    }
  };

  const handleLeaveGroup = async () => {
    try {
      await callApi(
        `${import.meta.env.VITE_BACKEND_URL}/api/groups/${groupId}/members/${authUser._id}`,
        { method: "DELETE" }
      );
      toast.success("Left group");
    } catch (error) {
      toast.error(error.message || "Failed to leave group");
    }
  };

  const handleSaveSettings = async () => {
    try {
      await callApi(
        `${import.meta.env.VITE_BACKEND_URL}/api/groups/${groupId}/settings`,
        { method: "PATCH", body: JSON.stringify({ settings }) }
      );
      toast.success("Settings updated");
      refreshDetails?.();
    } catch (error) {
      toast.error(error.message || "Failed to update settings");
    }
  };

  return (
    <div className="absolute top-0 right-0 h-full w-full sm:w-80 bg-slate-900/95 border-l border-white/10 p-4 overflow-y-auto z-30">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-semibold text-sm">Group Settings</h3>
        <button onClick={onClose} className="text-blue-200 hover:text-white">
          ✕
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <p className="text-xs text-blue-200 mb-2">Members</p>
          <div className="space-y-2">
            {(groupDetails?.members || []).map((member) => {
              const isMemberAdmin = groupDetails?.admins?.some(
                (admin) => admin._id === member._id
              );
              const isSelf = member._id === authUser?._id;
              const mutedEntry = mutedMap.get(member._id);
              return (
                <div
                  key={member._id}
                  className="flex items-center justify-between text-xs text-white bg-white/5 rounded-md p-2"
                >
                  <div>
                    <p>{member.fullName || member.username}</p>
                    {isMemberAdmin && (
                      <span className="text-[10px] text-amber-200">Admin</span>
                    )}
                    {mutedEntry && (
                      <span className="text-[10px] text-rose-200 ml-2">
                        Muted
                      </span>
                    )}
                  </div>
                  {isAdmin && !isSelf && (
                    <div className="flex flex-wrap gap-1 justify-end">
                      {isMemberAdmin ? (
                        <button
                          onClick={() => handleDemote(member._id)}
                          className="text-[10px] px-2 py-1 rounded bg-amber-500/30 hover:bg-amber-500/50"
                        >
                          Demote
                        </button>
                      ) : (
                        <button
                          onClick={() => handlePromote(member._id)}
                          className="text-[10px] px-2 py-1 rounded bg-emerald-500/30 hover:bg-emerald-500/50"
                        >
                          Promote
                        </button>
                      )}
                      {mutedEntry ? (
                        <button
                          onClick={() => handleUnmute(member._id)}
                          className="text-[10px] px-2 py-1 rounded bg-sky-500/30 hover:bg-sky-500/50"
                        >
                          Unmute
                        </button>
                      ) : (
                        <button
                          onClick={() => handleMute(member._id)}
                          className="text-[10px] px-2 py-1 rounded bg-rose-500/30 hover:bg-rose-500/50"
                        >
                          Mute
                        </button>
                      )}
                      <button
                        onClick={() => handleRemoveMember(member._id)}
                        className="text-[10px] px-2 py-1 rounded bg-red-500/30 hover:bg-red-500/50"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <div className="mt-2 flex items-center gap-2">
            <label className="text-[10px] text-blue-200">Mute (min)</label>
            <input
              type="number"
              min="1"
              value={muteMinutes}
              onChange={(e) => setMuteMinutes(e.target.value)}
              className="w-20 px-2 py-1 rounded bg-white/10 text-white text-xs border border-white/10"
            />
          </div>
        </div>

        {isAdmin && (
          <div>
            <p className="text-xs text-blue-200 mb-2">Add Member</p>
            <div className="flex items-center gap-2">
              <select
                value={selectedFriend}
                onChange={(e) => setSelectedFriend(e.target.value)}
                className="flex-1 px-2 py-1 rounded bg-white text-gray-900 text-xs border border-white/10"
              >
                <option value="">Select friend</option>
                {availableFriends.map((friend) => (
                  <option key={friend._id} value={friend._id}>
                    {friend.fullName || friend.username}
                  </option>
                ))}
              </select>
              <button
                onClick={handleAddMember}
                className="text-xs px-2 py-1 rounded bg-emerald-500/30 hover:bg-emerald-500/50"
              >
                Add
              </button>
            </div>
          </div>
        )}

        {isAdmin && (
          <div>
            <p className="text-xs text-blue-200 mb-2">AI Moderator</p>
            <div className="space-y-2 text-xs text-white">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={settings.aiModeratorEnabled ?? true}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      aiModeratorEnabled: e.target.checked,
                    }))
                  }
                />
                Enable AI moderation
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={settings.autoMuteEnabled ?? true}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      autoMuteEnabled: e.target.checked,
                    }))
                  }
                />
                Auto mute on repeated warnings
              </label>
              <label className="flex items-center gap-2">
                <span>Auto mute minutes</span>
                <input
                  type="number"
                  min="1"
                  value={settings.autoMuteMinutes || 10}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      autoMuteMinutes: Number(e.target.value),
                    }))
                  }
                  className="w-16 px-2 py-1 rounded bg-white/10 text-white text-xs border border-white/10"
                />
              </label>
              <label className="flex items-center gap-2">
                <span>Warn threshold</span>
                <input
                  type="number"
                  min="1"
                  value={settings.warnThreshold || 2}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      warnThreshold: Number(e.target.value),
                    }))
                  }
                  className="w-16 px-2 py-1 rounded bg-white/10 text-white text-xs border border-white/10"
                />
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={settings.highlightQuality ?? true}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      highlightQuality: e.target.checked,
                    }))
                  }
                />
                Highlight high-quality messages
              </label>
            </div>
            <button
              onClick={handleSaveSettings}
              className="mt-2 text-xs px-3 py-1 rounded bg-blue-500/40 hover:bg-blue-500/60 text-white"
            >
              Save Settings
            </button>
          </div>
        )}

        <div>
          <button
            onClick={handleLeaveGroup}
            className="w-full text-xs px-3 py-2 rounded bg-rose-500/30 hover:bg-rose-500/50 text-white"
          >
            Leave Group
          </button>
        </div>
      </div>
    </div>
  );
};

export default GroupSettingsPanel;
