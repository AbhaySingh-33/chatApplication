import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import useConversation from "../zustand/useConversation";

const DEFAULT_MODE = "suggest";

const useConflictMode = () => {
  const {
    selectedConversation,
    conflictModes,
    setConflictMode,
    clearConflictHint,
  } = useConversation();
  const [loading, setLoading] = useState(false);

  const conversationId = selectedConversation?._id;
  const isAI = selectedConversation?.isAI;
  const mode = useMemo(() => {
    if (!conversationId) return DEFAULT_MODE;
    return conflictModes?.[conversationId] || DEFAULT_MODE;
  }, [conflictModes, conversationId]);

  useEffect(() => {
    const fetchMode = async () => {
      if (!conversationId || isAI) return;
      if (conflictModes?.[conversationId]) return;
      setLoading(true);
      try {
        const res = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/api/messages/conflict-settings/${conversationId}`,
          { credentials: "include" }
        );
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to fetch mode");
        const resolvedMode = data.mode || DEFAULT_MODE;
        setConflictMode(conversationId, resolvedMode);
        if (resolvedMode === "off") {
          clearConflictHint(conversationId);
        }
      } catch (error) {
        console.error("Failed to fetch conflict mode:", error.message);
        setConflictMode(conversationId, DEFAULT_MODE);
      } finally {
        setLoading(false);
      }
    };

    fetchMode();
  }, [conversationId, isAI, conflictModes, setConflictMode, clearConflictHint]);

  const updateMode = async (nextMode) => {
    if (!conversationId || isAI) return;
    const previous = conflictModes?.[conversationId] || DEFAULT_MODE;
    setConflictMode(conversationId, nextMode);
    clearConflictHint(conversationId);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/messages/conflict-settings/${conversationId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ mode: nextMode }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save mode");
      setConflictMode(conversationId, data.mode || nextMode);
    } catch (error) {
      console.error("Failed to set conflict mode:", error.message);
      setConflictMode(conversationId, previous);
      toast.error("Failed to update conflict mode");
    }
  };

  return { mode, updateMode, loading };
};

export default useConflictMode;
