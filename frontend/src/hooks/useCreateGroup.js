import { useState } from "react";
import toast from "react-hot-toast";
import useGroupChat from "../zustand/useGroupChat";

const useCreateGroup = () => {
  const [loading, setLoading] = useState(false);
  const { addGroup, setSelectedGroup } = useGroupChat();

  const createGroup = async ({ name, description, memberIds }) => {
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/groups`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name, description, memberIds }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      addGroup(data);
      setSelectedGroup(data);
      toast.success("Group created");
      return data;
    } catch (error) {
      console.error("Failed to create group:", error.message);
      toast.error(error.message || "Failed to create group");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return { createGroup, loading };
};

export default useCreateGroup;
