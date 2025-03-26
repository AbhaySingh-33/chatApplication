import { useEffect } from "react";
import { useSocketContext } from "../context/SocketContext";
import useConversation from "../zustand/useConversation";
import notificationSound from "../assets/sounds/notification.mp3";

const useListenMessages = () => {
    const { socket } = useSocketContext();
    const { messages, setMessages, selectedConversation, incrementUnreadMessages,
            setTypingStatus,updateMessageStatus,updateAllMessageStatuses } = useConversation();

    useEffect(() => {
        socket?.on("newMessage", (newMessage, filteredUser) => {
            newMessage.shouldShake = true;
            const sound = new Audio(notificationSound);
            sound.play();

            console.log("📩 New message received: ", newMessage);

            if (selectedConversation._id === filteredUser._id) {
                setMessages([...messages, newMessage]);
                 // 📩 Send messageSeen event when a message is received
            socket.emit("messageSeen", { messageId: newMessage._id, senderId: newMessage.senderId });
            } else {
                incrementUnreadMessages(filteredUser._id);
                 // 📩 Send messageDelivered event when a message is received
            socket.emit("messageDelivered", { messageId: newMessage._id, senderId: newMessage.senderId });

            }
        });

        return () => {
            socket?.off("newMessage");
        };
    }, [socket, setMessages, messages, selectedConversation, incrementUnreadMessages]);

    useEffect(() => {
        socket?.on("messageDeleted", (updatedMessages,filteredUser,RfilteredUser) => {
            if (selectedConversation._id === filteredUser._id || selectedConversation._id === RfilteredUser._id) {
                setMessages(updatedMessages);
            }
        });
    
        return () => {
            socket?.off("messageDeleted");
        };
    }, [socket, setMessages, selectedConversation]);


    useEffect(() => {
        if (!socket) return;

        socket.on("userTyping", (userId) => {
            console.log(`✍️ ${userId} is typing...`);
            setTypingStatus(userId, true);
           
        });

        socket.on("userStopTyping", (userId) => {
            console.log(`❌ ${userId} stopped typing.`);
            setTypingStatus(userId, false);
        });

        return () => {
            socket.off("userTyping");
            socket.off("userStopTyping");
        };
    }, [socket, setTypingStatus]);

    useEffect(() => {
        if (!socket) return;

        // ✅ Listen for message status updates (Sent, Delivered, Seen)
        socket.on("messageStatusUpdated", ({ messageId, status }) => {
            updateMessageStatus(messageId, status);
        });

        return () => {
            socket.off("messageStatusUpdated");
        };
    }, [socket, updateMessageStatus]);


    useEffect(() => {
        if (!socket) return;
    
        socket.on("allmessageStatusUpdated", ({ senderId, status,receiverId }) => {
            // ✅ Update all messages in the selected conversation
            if (selectedConversation._id === receiverId) {
                updateAllMessageStatuses(status);
            }
        });
    
        return () => {
            socket.off("allmessageStatusUpdated");
        };
    }, [socket, selectedConversation, updateAllMessageStatuses]);

    
  useEffect(() => {
    // Listen to the "Message" event
    socket.on("Message", (senderId) => {
      console.log(`Message received from: ${senderId}`);
      setMessages(null); // Set message to null
    });

    // Cleanup listener on component unmount
    return () => {
      socket.off("Message");
    };
  }, [socket]);

    
    return null;
};

export default useListenMessages;