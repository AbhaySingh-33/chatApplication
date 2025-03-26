import { useEffect, useRef } from "react";
import { format, isValid } from "date-fns"; // Install with: npm install date-fns
import useGetMessages from "../../hooks/useGetMessages";
import MessageSkeleton from "../skeletons/MessageSkeleton";
import Message from "./Message";
import useListenMessages from "../../hooks/useListenMessages";

const groupMessagesByDate = (messages) => {
    const groupedMessages = {};
    if (Array.isArray(messages)) {
        messages.forEach((message) => {
            const messageDate = new Date(message.createdAt);
            if (isValid(messageDate)) {
                const formattedDate = format(messageDate, "yyyy-MM-dd"); // Format as YYYY-MM-DD
                if (!groupedMessages[formattedDate]) {
                    groupedMessages[formattedDate] = [];
                }
                groupedMessages[formattedDate].push(message);
            }
        });
    }
    return groupedMessages;
};

const Messages = () => {
    const { messages = [], loading } = useGetMessages(); // ✅ Ensure messages is an array
    useListenMessages();
    const lastMessageRef = useRef();

    const groupedMessages = groupMessagesByDate(messages); // ✅ Group messages by date

    // Auto-scroll to last message
    useEffect(() => {
        setTimeout(() => {
            lastMessageRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
    }, [messages]);

    return (
        <div className='px-4 flex-1 overflow-auto'>
            {/* ✅ Render Grouped Messages */}
            {!loading && messages?.length > 0 && 
                Object.keys(groupedMessages).map((date) => (
                    <div key={date}>
                        {/* 📅 Date Header */}
                        <div className="text-center my-4 text-gray-500 font-semibold">
                            {format(new Date(date), "MMMM d, yyyy")}
                        </div>

                        {/* 📨 Render Messages for this Date */}
                        {groupedMessages[date].map((message, index) => (
                            <div key={message._id} ref={index === groupedMessages[date].length - 1 ? lastMessageRef : null}>
                                <Message message={message} />
                            </div>
                        ))}
                    </div>
                ))
            }

            {/* ⏳ Loading Skeletons */}
            {loading && [...Array(3)].map((_, idx) => <MessageSkeleton key={idx} />)}

            {/* 📨 No Messages */}
            {!loading && messages?.length === 0 && (
                <p className='text-center'>Send a message to start the conversation</p>
            )}
        </div>
    );
};

export default Messages;