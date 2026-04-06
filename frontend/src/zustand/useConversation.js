import { create } from "zustand";

const toTimestamp = (value) => {
    const time = new Date(value).getTime();
    return Number.isFinite(time) ? time : 0;
};

const sortMessagesByCreatedAt = (messages = []) =>
    [...messages].sort((a, b) => {
        const aTime = toTimestamp(a?.createdAt);
        const bTime = toTimestamp(b?.createdAt);
        if (aTime === bTime) {
            return String(a?._id || "").localeCompare(String(b?._id || ""));
        }
        return aTime - bTime;
    });

const useConversation = create((set) => ({
    messages: [],
    selectedConversation: {}, // ✅ Set default as an empty object instead of `null`
    unreadMessages: {},
    showDelete: null,
    conversations: [], // ✅ Cache all conversations/users
    setConversations: (conversations) => set({ conversations }),
    clearConversations: () => set({ conversations: [] }), // ✅ Clear cache on logout

    conflictHints: {}, // ✅ Store conflict resolver hints by conversation (user) id
    setConflictHint: (conversationId, hint) =>
        set((state) => ({
            conflictHints: {
                ...state.conflictHints,
                [conversationId]: hint,
            },
        })),
    clearConflictHint: (conversationId) =>
        set((state) => {
            const { [conversationId]: _removed, ...rest } = state.conflictHints;
            return { conflictHints: rest };
        }),

    conflictModes: {},
    setConflictMode: (conversationId, mode) =>
        set((state) => ({
            conflictModes: {
                ...state.conflictModes,
                [conversationId]: mode,
            },
        })),

    draftMessage: "",
    setDraftMessage: (draftMessage) => set({ draftMessage }),
    clearDraftMessage: () => set({ draftMessage: "" }),

    friends: [], // ✅ Cache friends list
    setFriends: (friends) => set({ friends }),

    receiver: null,
    setreceiver: (receiver) => set({ receiver }),

    setMessages: (messages) => set({ messages }),

    upsertMessage: (message) =>
        set((state) => {
            if (!message?._id) {
                return { messages: sortMessagesByCreatedAt([...state.messages, message]) };
            }

            const existingIndex = state.messages.findIndex((msg) => msg._id === message._id);
            if (existingIndex >= 0) {
                const nextMessages = [...state.messages];
                nextMessages[existingIndex] = { ...nextMessages[existingIndex], ...message };
                return { messages: sortMessagesByCreatedAt(nextMessages) };
            }

            return { messages: sortMessagesByCreatedAt([...state.messages, message]) };
        }),

    updateMessageStatus: (messageId, status) =>
        set((state) => ({
            messages: state.messages.map((msg) =>
                msg._id === messageId ? { ...msg, status } : msg
            ),
        })),

        updateAllMessageStatuses: (status) =>
            set((state) => ({
                messages: state.messages.map((msg) =>
                    msg.status !== "seen" ? { ...msg, status } : msg
                ),
            })),
        

    setSelectedConversation: (conversation) => 
        set({ selectedConversation: conversation || {} }), // ✅ Ensure it never becomes `null`

    incrementUnreadMessages: (conversationId) => 
        set((state) => ({
            unreadMessages: {
                ...state.unreadMessages,
                [conversationId]: (state.unreadMessages[conversationId] || 0) + 1,
            },
        })),

    resetUnreadMessages: (conversationId) =>
        set((state) => ({
            unreadMessages: {
                ...state.unreadMessages,
                [conversationId]: 0,
            },
        })),

    // ✅ Bulk set unread counts (fetched from backend)
    setUnreadCounts: (unreadMessages) => set({ unreadMessages }),

    setShowDelete: (messageId) => set({ showDelete: messageId }),

        typingUsers: {}, // ✅ Store typing users
        setTypingStatus: (userId, isTyping) =>
            set((state) => ({
                typingUsers: {
                    ...state.typingUsers,
                    [userId]: isTyping,
                },
            })),

            
            // ✅ Update replies
    addReplyToMessage: (messageId, replyMessage) =>
        set((state) => ({
            messages: state.messages.map((msg) =>
                msg._id === messageId ? { ...msg, reply: replyMessage } : msg
            ),
        })),

    // ✅ Update reactions
    updateMessageReactions: (messageId, reactions) =>
        set((state) => ({
            messages: state.messages.map((msg) =>
                msg._id === messageId ? { ...msg, reactions } : msg
            ),
        })),
}));

export default useConversation;
