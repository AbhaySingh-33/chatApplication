import { useEffect, useRef, useState } from "react";
import useConversation from "../zustand/useConversation";

const useAIInsights = () => {
  const { selectedConversation, messages, setMessages } = useConversation();
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const lastCountRef = useRef(0);
  const lastConversationRef = useRef(null);

  useEffect(() => {
    const conversationId = selectedConversation?._id || null;
    const isAI = selectedConversation?.isAI;
    if (lastConversationRef.current !== conversationId) {
      lastConversationRef.current = conversationId;
      lastCountRef.current = 0;
      setInsights(null);
      setError("");
    }

    if (!isAI) {
      setInsights(null);
      setError("");
      return;
    }

    const currentCount = messages?.length || 0;
    if (currentCount === 0) {
      setInsights(null);
      setError("");
      lastCountRef.current = 0;
      return;
    }

    if (currentCount === lastCountRef.current) return;
    lastCountRef.current = currentCount;

    const fetchInsights = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/api/ai-chat/insights`,
          { credentials: "include" }
        );
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Failed to load AI insights");
        }

        if (data?.insights) {
          setInsights(data.insights);
        }

        if (Array.isArray(data?.messageTags) && data.messageTags.length) {
          const tagMap = new Map(
            data.messageTags.map((entry) => [String(entry.messageId), entry.tags])
          );
          const currentMessages = useConversation.getState().messages || [];
          setMessages(
            currentMessages.map((msg) => {
              const tags = tagMap.get(String(msg._id));
              return tags ? { ...msg, tags } : msg;
            })
          );
        }
      } catch (error) {
        console.error("Failed to fetch AI insights:", error.message);
        setError(error.message || "Failed to fetch AI insights");
      } finally {
        setLoading(false);
      }
    };

    fetchInsights();
  }, [selectedConversation?._id, selectedConversation?.isAI, messages, setMessages]);

  return { insights, loading, error };
};

export default useAIInsights;
