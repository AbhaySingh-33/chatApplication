import { create } from "zustand";

const useGroupChat = create((set) => ({
  groups: [],
  selectedGroup: null,
  groupDetails: null,
  messages: [],
  unread: {},

  setGroups: (groups) => set({ groups }),
  addGroup: (group) =>
    set((state) => ({
      groups: [group, ...state.groups.filter((g) => g._id !== group._id)],
    })),
  updateGroup: (groupId, patch) =>
    set((state) => ({
      groups: state.groups.map((g) => (g._id === groupId ? { ...g, ...patch } : g)),
    })),
  removeGroup: (groupId) =>
    set((state) => ({
      groups: state.groups.filter((g) => g._id !== groupId),
    })),

  setSelectedGroup: (group) => set({ selectedGroup: group }),
  setGroupDetails: (details) => set({ groupDetails: details }),

  setMessages: (messages) => set({ messages }),
  addMessage: (message) =>
    set((state) => {
      if (state.messages.some((msg) => msg._id === message._id)) {
        return state;
      }
      return { messages: [...state.messages, message] };
    }),
  updateMessageModeration: (messageId, moderation) =>
    set((state) => ({
      messages: state.messages.map((msg) =>
        msg._id === messageId ? { ...msg, moderation } : msg
      ),
    })),

  incrementUnread: (groupId) =>
    set((state) => ({
      unread: {
        ...state.unread,
        [groupId]: (state.unread[groupId] || 0) + 1,
      },
    })),
  resetUnread: (groupId) =>
    set((state) => ({
      unread: {
        ...state.unread,
        [groupId]: 0,
      },
    })),

  // Fine-grained updates for Group Details
  detailsAddMember: (member) =>
    set((state) => {
      if (!state.groupDetails) return state;
      return {
        groupDetails: {
          ...state.groupDetails,
          members: [...state.groupDetails.members, member],
        },
      };
    }),
  detailsRemoveMember: (memberId) =>
    set((state) => {
      if (!state.groupDetails) return state;
      return {
        groupDetails: {
          ...state.groupDetails,
          members: state.groupDetails.members.filter((m) => m._id !== memberId),
          admins: state.groupDetails.admins.filter((a) => a._id !== memberId),
        },
      };
    }),
  detailsUpdateAdmin: (memberId, isAdmin) =>
    set((state) => {
      if (!state.groupDetails) return state;
      const member = state.groupDetails.members.find((m) => m._id === memberId);
      let newAdmins = state.groupDetails.admins;

      if (isAdmin) {
        if (member && !newAdmins.some((a) => a._id === memberId)) {
          newAdmins = [...newAdmins, member];
        }
      } else {
        newAdmins = newAdmins.filter((a) => a._id !== memberId);
      }
      return {
        groupDetails: { ...state.groupDetails, admins: newAdmins },
      };
    }),
  detailsMuteUser: (muteEntry) =>
    set((state) => {
      if (!state.groupDetails) return state;
      const targetId = muteEntry.userId?._id || muteEntry.userId;
      const filtered = (state.groupDetails.mutedUsers || []).filter(
        (m) => (m.userId?._id || m.userId) !== targetId
      );
      return {
        groupDetails: {
          ...state.groupDetails,
          mutedUsers: [...filtered, muteEntry],
        },
      };
    }),
  detailsUnmuteUser: (memberId) =>
    set((state) => {
      if (!state.groupDetails) return state;
      return {
        groupDetails: {
          ...state.groupDetails,
          mutedUsers: (state.groupDetails.mutedUsers || []).filter(
            (m) => (m.userId?._id || m.userId) !== memberId
          ),
        },
      };
    }),
}));

export default useGroupChat;
