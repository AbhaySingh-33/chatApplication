import { create } from "zustand";

const useConversation = create((set) => ({
    messages: [],
    selectedConversation: {}, // ✅ Set default as an empty object instead of `null`
    unreadMessages: {},
    showDelete: null,

    setMessages: (messages) => set({ messages }),

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
