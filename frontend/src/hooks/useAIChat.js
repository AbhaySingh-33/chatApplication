import { useState } from "react";
import useConversation from "../zustand/useConversation";
import toast from "react-hot-toast";

const useAIChat = () => {
  const [loading, setLoading] = useState(false);
  const [ragLoading, setRagLoading] = useState(false);
  const [ragPdfSources, setRagPdfSources] = useState([]);
  const [ragSourcesLoading, setRagSourcesLoading] = useState(false);
  const [ragDeletingSourceId, setRagDeletingSourceId] = useState("");
  const { setMessages } = useConversation();

  const sendAIMessage = async ({ text }) => {
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/ai-chat/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ text }),
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      // Upsert and sort so realtime socket races never show AI above the user's message.
      useConversation.getState().upsertMessage(data.userMessage);
      
    } catch (error) {
      console.error("Failed to send AI message:", error.message);
      toast.error("Couldn't send your message. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getAIConversation = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/ai-chat/conversation`, {
        credentials: "include",
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      return data;
    } catch (error) {
      console.error("Failed to fetch AI conversation:", error.message);
      toast.error("Couldn't load AI conversation. Please refresh.");
      return null;
    }
  };

  const getAIMessages = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/ai-chat/messages`, {
        credentials: "include",
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setMessages(data);
    } catch (error) {
      console.error("Failed to fetch AI messages:", error.message);
      toast.error("Couldn't load AI messages. Please refresh.");
    } finally {
      setLoading(false);
    }
  };

  const uploadPdfForRag = async (pdfFile) => {
    if (!pdfFile) {
      toast.error("Please choose a PDF file first.");
      return null;
    }

    setRagLoading(true);
    try {
      const formData = new FormData();
      formData.append("pdf", pdfFile);

      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/ai-chat/rag/upload-pdf`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        const details = Array.isArray(data?.details) ? data.details.join(" ") : "";
        throw new Error([data?.error || "PDF ingestion failed.", details].filter(Boolean).join(" "));
      }

      toast.success(`PDF ingested (${data.chunksAdded || 0} chunks)`);
      await listRagPdfs();
      return data;
    } catch (error) {
      console.error("Failed to upload PDF for RAG:", error.message);
      toast.error(error.message || "PDF ingestion failed. Please try again.");
      return null;
    } finally {
      setRagLoading(false);
    }
  };

  const ingestWebsiteForRag = async ({ url, maxPages }) => {
    if (!url) {
      toast.error("Please enter a website URL.");
      return null;
    }

    setRagLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/ai-chat/rag/crawl`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          url,
          ...(maxPages ? { maxPages: Number(maxPages) } : {}),
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        const details = Array.isArray(data?.details) ? data.details.join(" ") : "";
        throw new Error([data?.error || "Website ingestion failed.", details].filter(Boolean).join(" "));
      }

      toast.success(`Website ingested (${data.chunksAdded || 0} chunks)`);
      return data;
    } catch (error) {
      console.error("Failed to ingest website for RAG:", error.message);
      toast.error(error.message || "Website ingestion failed. Please try again.");
      return null;
    } finally {
      setRagLoading(false);
    }
  };

  const listRagPdfs = async () => {
    setRagSourcesLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/ai-chat/rag/pdfs`, {
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        const details = Array.isArray(data?.details) ? data.details.join(" ") : "";
        throw new Error([data?.error || "Failed to load PDFs.", details].filter(Boolean).join(" "));
      }

      setRagPdfSources(Array.isArray(data?.pdfs) ? data.pdfs : []);
      return Array.isArray(data?.pdfs) ? data.pdfs : [];
    } catch (error) {
      console.error("Failed to list RAG PDFs:", error.message);
      toast.error(error.message || "Couldn't load ingested PDFs.");
      setRagPdfSources([]);
      return [];
    } finally {
      setRagSourcesLoading(false);
    }
  };

  const deleteRagPdf = async (sourceId) => {
    if (!sourceId) return false;

    setRagDeletingSourceId(sourceId);
    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/ai-chat/rag/pdfs/${sourceId}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        const details = Array.isArray(data?.details) ? data.details.join(" ") : "";
        throw new Error([data?.error || "Failed to delete PDF.", details].filter(Boolean).join(" "));
      }

      setRagPdfSources((prev) => prev.filter((item) => item?.sourceId !== sourceId));
      toast.success("PDF removed from knowledge base.");
      return true;
    } catch (error) {
      console.error("Failed to delete RAG PDF:", error.message);
      toast.error(error.message || "Couldn't remove PDF.");
      return false;
    } finally {
      setRagDeletingSourceId("");
    }
  };

  return {
    sendAIMessage,
    loading,
    ragLoading,
    getAIConversation,
    getAIMessages,
    uploadPdfForRag,
    ingestWebsiteForRag,
    listRagPdfs,
    deleteRagPdf,
    ragPdfSources,
    ragSourcesLoading,
    ragDeletingSourceId,
  };
};

export default useAIChat;
