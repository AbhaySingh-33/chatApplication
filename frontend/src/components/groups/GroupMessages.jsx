import { useEffect, useRef } from "react";
import { format, isValid } from "date-fns";
import { useAuthContext } from "../../context/AuthContext";
import useGetGroupMessages from "../../hooks/useGetGroupMessages";
import useGroupChat from "../../zustand/useGroupChat";
import GroupMessage from "./GroupMessage";

const groupMessagesByDate = (messages) => {
  const grouped = {};
  if (!Array.isArray(messages)) return grouped;
  messages.forEach((message) => {
    const messageDate = new Date(message.createdAt);
    if (isValid(messageDate)) {
      const dateKey = format(messageDate, "yyyy-MM-dd");
      if (!grouped[dateKey]) grouped[dateKey] = [];
      grouped[dateKey].push(message);
    }
  });
  return grouped;
};

const GroupMessages = () => {
  const { authUser } = useAuthContext();
  const { groupDetails } = useGroupChat();
  const { messages, loading } = useGetGroupMessages();
  const lastMessageRef = useRef(null);

  useEffect(() => {
    if (lastMessageRef.current) {
      lastMessageRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const grouped = groupMessagesByDate(messages);
  const isAdmin = groupDetails?.isAdmin;

  return (
    <div className="px-2 py-2 space-y-4">
      {!loading &&
        Object.keys(grouped).map((dateKey) => (
          <div key={dateKey} className="space-y-2">
            <div className="text-center text-xs text-blue-200/70">
              {format(new Date(dateKey), "MMM dd, yyyy")}
            </div>
            {grouped[dateKey].map((message, index) => (
              <div
                key={message._id}
                ref={
                  index === grouped[dateKey].length - 1 ? lastMessageRef : null
                }
              >
                <GroupMessage
                  message={message}
                  currentUserId={authUser?._id}
                  isAdmin={isAdmin}
                />
              </div>
            ))}
          </div>
        ))}

      {!loading && messages.length === 0 && (
        <p className="text-center text-blue-200/70 text-sm">
          Start the conversation in this group.
        </p>
      )}

      {loading && (
        <div className="flex justify-center">
          <span className="loading loading-spinner"></span>
        </div>
      )}
    </div>
  );
};

export default GroupMessages;
