import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import useGroupChat from "../zustand/useGroupChat";

const useGetGroups = () => {
  const [loading, setLoading] = useState(false);
  const { groups, setGroups } = useGroupChat();

  useEffect(() => {
    const fetchGroups = async () => {
      if (groups.length > 0) return;
      setLoading(true);
      try {
        const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/groups`, {
          credentials: "include",
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        setGroups(data);
      } catch (error) {
        console.error("Failed to fetch groups:", error.message);
        toast.error("Failed to fetch groups");
      } finally {
        setLoading(false);
      }
    };

    fetchGroups();
  }, [groups.length, setGroups]);

  return { loading, groups };
};

export default useGetGroups;
