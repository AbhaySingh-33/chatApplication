import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import useConversation from "../zustand/useConversation";

const useFriendsList = () => {
  const [loading, setLoading] = useState(false);
  const { friends, setFriends } = useConversation();

  useEffect(() => {
    const fetchFriends = async () => {
      if (friends.length > 0) return;
      setLoading(true);
      try {
        const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/friends/list`, {
          credentials: "include",
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        setFriends(data);
      } catch (error) {
        console.error("Failed to fetch friends:", error.message);
        toast.error("Failed to load friends");
      } finally {
        setLoading(false);
      }
    };

    fetchFriends();
  }, [friends.length, setFriends]);

  return { friends, loading };
};

export default useFriendsList;
