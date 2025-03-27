import { create } from "zustand";

const useConversation = create((set) => ({
    messages: [],
    selectedConversation: null, // ✅ Set default as an empty object instead of `null`
    unreadMessages: {},
    showDelete: null,

    setShowDelete: (messageId) => set({ showDelete: messageId }),
    
    setMessages: (messages) => set({ messages }),

    updateMessageStatus: (messageId, status) =>
        set((state) => ({
            messages: state.messages.map((msg) =>
                msg._id === messageId ? { ...msg, status } : msg
            ),
        })),

        updateAllMessageStatuses:(status)=>
            set((state) => ({
                messages: state.messages.map((msg) => ({
                    ...msg,
                    status,
                }),
                ),
            })),

    setSelectedConversation: (conversation) => 
        set({ selectedConversation: conversation || null }), // ✅ Ensure it never becomes `null`

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
