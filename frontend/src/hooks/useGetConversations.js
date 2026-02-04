import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import useConversation from "../zustand/useConversation";

const useGetConversations = () => {
  const [loading, setLoading] = useState(false);
  const { conversations, setConversations, setUnreadCounts } = useConversation();

  useEffect(() => {
    const getConversations = async () => {
      // ✅ If conversations already cached in Zustand, skip fetching
      if (conversations.length > 0) {
        return;
      }

      setLoading(true);
      try {
        const res = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/api/users`,
          {
            credentials: "include", //send jwt cookie
          }
        );
        const data = await res.json();
        if (data.error) {
          throw new Error(data.error);
        }
        setConversations(data); // ✅ Store in Zustand

        // ✅ Extract and set initial unread counts
        const initialUnreadMap = data.reduce((acc, user) => {
            if (user.unreadCount && user.unreadCount > 0) {
                acc[user._id] = user.unreadCount;
            }
            return acc;
        }, {});
        setUnreadCounts(initialUnreadMap);
      } catch (error) {
        toast.error(error.message);
      } finally {
        setLoading(false);
      }
    };

    getConversations();
  }, [conversations.length, setConversations, setUnreadCounts]);

  return { loading, conversations };
};
export default useGetConversations;
