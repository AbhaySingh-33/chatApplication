import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import useGroupChat from "../zustand/useGroupChat";

const useGroupDetails = () => {
  const [loading, setLoading] = useState(false);
  const { selectedGroup, setGroupDetails } = useGroupChat();

  const refresh = useCallback(
    async (groupId = selectedGroup?._id) => {
      if (!groupId) return;
      setLoading(true);
      try {
        const res = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/api/groups/${groupId}`,
          { credentials: "include" }
        );
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        setGroupDetails(data);
      } catch (error) {
        console.error("Failed to fetch group details:", error.message);
        toast.error("Failed to load group details");
      } finally {
        setLoading(false);
      }
    },
    [selectedGroup?._id, setGroupDetails]
  );

  useEffect(() => {
    if (selectedGroup?._id) {
      refresh(selectedGroup._id);
    } else {
      setGroupDetails(null);
    }
  }, [selectedGroup?._id, refresh, setGroupDetails]);

  return { loading, refresh };
};

export default useGroupDetails;
