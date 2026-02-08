import { useEffect } from "react";
import toast from "react-hot-toast";
import useGroupChat from "../zustand/useGroupChat";
import { useSocketContext } from "../context/SocketContext";

const useListenGroupEvents = () => {
  const { socket } = useSocketContext();
  const {
    selectedGroup,
    addMessage,
    updateMessageModeration,
    incrementUnread,
    resetUnread,
    addGroup,
    removeGroup,
    setGroupDetails,
    detailsAddMember,
    detailsRemoveMember,
    detailsUpdateAdmin,
    detailsMuteUser,
    detailsUnmuteUser,
  } = useGroupChat();

  useEffect(() => {
    if (!socket) return;

    const handleGroupMessage = (message) => {
      if (selectedGroup?._id === message.groupId) {
        addMessage(message);
        resetUnread(message.groupId);
      } else {
        incrementUnread(message.groupId);
      }
    };

    const handleGroupSystemMessage = (message) => {
      if (selectedGroup?._id === message.groupId) {
        addMessage(message);
      } else {
        incrementUnread(message.groupId);
      }
    };

    const handleGroupMessageUpdated = ({ messageId, moderation }) => {
      updateMessageModeration(messageId, moderation);
    };

    const handleModerationNotice = ({ action, mutedUntil, reason, warnings }) => {
      if (action === "muted") {
        toast.error(
          `You were muted${mutedUntil ? ` until ${new Date(mutedUntil).toLocaleTimeString()}` : ""}. ${reason || ""}`
        );
      } else if (action === "warned") {
        toast(`Warning issued. Total warnings: ${warnings || 1}`, {
          icon: "⚠️",
        });
      } else if (action === "unmuted") {
        toast.success("You were unmuted");
      }
    };

    const handleGroupAdded = (group) => {
      addGroup(group);
    };

    const handleGroupRemoved = ({ groupId }) => {
      removeGroup(groupId);
      if (selectedGroup?._id === groupId) {
        setGroupDetails(null);
      }
    };

    const handleGroupMemberAdded = ({ groupId, member }) => {
      if (selectedGroup?._id === groupId) {
        detailsAddMember(member);
      }
    };

    const handleGroupMemberRemoved = ({ groupId, memberId }) => {
      if (selectedGroup?._id === groupId) {
        detailsRemoveMember(memberId);
      }
    };

    const handleGroupAdminUpdated = ({ groupId, memberId, isAdmin }) => {
      if (selectedGroup?._id === groupId) {
        detailsUpdateAdmin(memberId, isAdmin);
      }
    };

    const handleGroupUserMuted = ({ groupId, memberId, mutedUntil, reason, by }) => {
      if (selectedGroup?._id === groupId) {
        detailsMuteUser({ userId: memberId, mutedUntil, reason, by });
      }
    };

    const handleGroupUserUnmuted = ({ groupId, memberId }) => {
      if (selectedGroup?._id === groupId) {
        detailsUnmuteUser(memberId);
      }
    };

    socket.on("groupMessage", handleGroupMessage);
    socket.on("groupSystemMessage", handleGroupSystemMessage);
    socket.on("groupMessageUpdated", handleGroupMessageUpdated);
    socket.on("groupModerationNotice", handleModerationNotice);
    socket.on("groupAdded", handleGroupAdded);
    socket.on("groupRemoved", handleGroupRemoved);

    socket.on("groupMemberAdded", handleGroupMemberAdded);
    socket.on("groupMemberRemoved", handleGroupMemberRemoved);
    socket.on("groupAdminUpdated", handleGroupAdminUpdated);
    socket.on("groupUserMuted", handleGroupUserMuted);
    socket.on("groupUserUnmuted", handleGroupUserUnmuted);

    return () => {
      socket.off("groupMessage", handleGroupMessage);
      socket.off("groupSystemMessage", handleGroupSystemMessage);
      socket.off("groupMessageUpdated", handleGroupMessageUpdated);
      socket.off("groupModerationNotice", handleModerationNotice);
      socket.off("groupAdded", handleGroupAdded);
      socket.off("groupRemoved", handleGroupRemoved);

      socket.off("groupMemberAdded", handleGroupMemberAdded);
      socket.off("groupMemberRemoved", handleGroupMemberRemoved);
      socket.off("groupAdminUpdated", handleGroupAdminUpdated);
      socket.off("groupUserMuted", handleGroupUserMuted);
      socket.off("groupUserUnmuted", handleGroupUserUnmuted);
    };
  }, [
    socket,
    selectedGroup?._id,
    addMessage,
    updateMessageModeration,
    incrementUnread,
    resetUnread,
    addGroup,
    removeGroup,
    setGroupDetails,
    detailsAddMember,
    detailsRemoveMember,
    detailsUpdateAdmin,
    detailsMuteUser,
    detailsUnmuteUser,
  ]);
};

export default useListenGroupEvents;
