import { useEffect, useRef, useState } from "react";
import { BsSend, BsEmojiSmile, BsPaperclip, BsXCircle } from "react-icons/bs";
import EmojiPicker from "emoji-picker-react";
import useSendMessage from "../../hooks/useSendMessage";
import { useSocketContext } from "../../context/SocketContext";
import useConversation from "../../zustand/useConversation";
import useAIChat from "../../hooks/useAIChat";

const MessageInput = () => {
    const [message, setMessage] = useState("");
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [ragUrl, setRagUrl] = useState("");
    const [ragPdfFile, setRagPdfFile] = useState(null);
    const [showKnowledgeBase, setShowKnowledgeBase] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const ragPdfInputRef = useRef(null);
    const typingTimeoutRef = useRef(null);
    const { loading, sendMessage } = useSendMessage();
    const {
        sendAIMessage,
        loading: aiLoading,
        ragLoading,
        uploadPdfForRag,
        ingestWebsiteForRag,
        listRagPdfs,
        deleteRagPdf,
        ragPdfSources,
        ragSourcesLoading,
        ragDeletingSourceId,
    } = useAIChat();
    const { selectedConversation, draftMessage, clearDraftMessage } = useConversation();
    const { socket } = useSocketContext();

    const handleEmojiClick = (emojiObject) => {
        setMessage((prev) => prev + emojiObject.emoji);
    };

    useEffect(() => {
        if (!draftMessage) return;
        setMessage(draftMessage);
        clearDraftMessage();
    }, [draftMessage, clearDraftMessage]);

    useEffect(() => {
        if (!selectedConversation?.isAI) {
            setShowKnowledgeBase(false);
        }
    }, [selectedConversation?.isAI]);

    useEffect(() => {
        if (!selectedConversation?.isAI || !showKnowledgeBase) return;
        listRagPdfs();
    }, [selectedConversation?.isAI, showKnowledgeBase]);

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            setFile(selectedFile);
            setPreview(URL.createObjectURL(selectedFile)); // Show preview
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!message && !file) return;

        if (selectedConversation?.isAI) {
            await sendAIMessage({ text: message });
        } else {
            await sendMessage({ text: message, file });
        }

        setMessage("");
        setFile(null);
        setPreview(null);

        if (socket && selectedConversation && !selectedConversation.isAI) {
            socket.emit("stopTyping", {
                senderId: socket.id,
                receiverId: selectedConversation._id,
            });
        }
    };
    const handleKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
            return;
        }

        if (selectedConversation?.isAI) return;

        socket.emit("typing", {
            senderId: socket.id,
            receiverId: selectedConversation._id,
        });

        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = null;
        }
    };

    const handleKeyUp = () => {
        if (selectedConversation?.isAI) return;

        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        typingTimeoutRef.current = setTimeout(() => {
            socket.emit("stopTyping", {
                senderId: socket.id,
                receiverId: selectedConversation._id,
            });
            typingTimeoutRef.current = null;
        }, 2000);
    };

    const handleRagPdfSelect = (e) => {
        const selectedFile = e.target.files?.[0];
        if (!selectedFile) return;
        if (selectedFile.type !== "application/pdf") {
            setRagPdfFile(null);
            return;
        }
        setRagPdfFile(selectedFile);
    };

    const handleRagPdfUpload = async () => {
        const result = await uploadPdfForRag(ragPdfFile);
        if (result) {
            setRagPdfFile(null);
            if (ragPdfInputRef.current) {
                ragPdfInputRef.current.value = "";
            }
        }
    };

    const handleRagWebsiteIngest = async () => {
        const result = await ingestWebsiteForRag({ url: ragUrl.trim() });
        if (result) {
            setRagUrl("");
        }
    };

    return (
        <div className="relative">
            {selectedConversation?.isAI && (
                <div className="mx-4 mt-3 rounded-xl border border-blue-400/25 bg-blue-950/30 p-3">
                    <button
                        type="button"
                        onClick={() => setShowKnowledgeBase((prev) => !prev)}
                        className="w-full flex items-center justify-between text-xs text-blue-100/90 font-semibold tracking-wide"
                    >
                        <span>AI Knowledge Base</span>
                        <span>{showKnowledgeBase ? "Hide" : "Show"}</span>
                    </button>

                    {showKnowledgeBase && (
                    <div className="flex flex-col gap-2 mt-2">
                        <div className="flex flex-wrap items-center gap-2">
                            <input
                                ref={ragPdfInputRef}
                                type="file"
                                accept="application/pdf"
                                onChange={handleRagPdfSelect}
                                className="hidden"
                                id="rag-pdf-upload"
                            />
                            <label
                                htmlFor="rag-pdf-upload"
                                className="px-3 py-1.5 text-xs rounded-md bg-white/10 text-white hover:bg-white/20 cursor-pointer"
                            >
                                Choose PDF
                            </label>
                            <button
                                type="button"
                                onClick={handleRagPdfUpload}
                                disabled={!ragPdfFile || ragLoading}
                                className="px-3 py-1.5 text-xs rounded-md bg-blue-500/80 text-white hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Upload PDF
                            </button>
                            {ragPdfFile && (
                                <span className="text-xs text-blue-100/80 truncate max-w-[210px]">{ragPdfFile.name}</span>
                            )}
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2">
                            <input
                                type="url"
                                placeholder="https://docs.example.com"
                                value={ragUrl}
                                onChange={(e) => setRagUrl(e.target.value)}
                                className="flex-1 px-3 py-2 rounded-md bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/40 focus:outline-none"
                            />
                            <button
                                type="button"
                                onClick={handleRagWebsiteIngest}
                                disabled={!ragUrl.trim() || ragLoading}
                                className="px-3 py-2 text-xs rounded-md bg-cyan-500/80 text-white hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Ingest Website
                            </button>
                        </div>
                        {ragLoading && <div className="text-[11px] text-blue-100/80">Ingestion in progress...</div>}

                        <div className="mt-2 rounded-md border border-white/10 bg-black/20 p-2">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[11px] uppercase tracking-wide text-blue-100/70">Ingested PDFs</span>
                                <button
                                    type="button"
                                    onClick={listRagPdfs}
                                    className="text-[11px] text-cyan-300 hover:text-cyan-200"
                                >
                                    Refresh
                                </button>
                            </div>

                            {ragSourcesLoading && (
                                <div className="text-[11px] text-blue-100/70">Loading PDFs...</div>
                            )}

                            {!ragSourcesLoading && ragPdfSources.length === 0 && (
                                <div className="text-[11px] text-blue-100/60">No PDFs ingested yet.</div>
                            )}

                            {!ragSourcesLoading && ragPdfSources.length > 0 && (
                                <div className="flex flex-col gap-1">
                                    {ragPdfSources.map((item) => (
                                        <div
                                            key={item.sourceId}
                                            className="flex items-center justify-between gap-2 rounded bg-white/5 px-2 py-1"
                                        >
                                            <div className="min-w-0">
                                                <div className="text-xs text-white truncate">{item.name}</div>
                                                <div className="text-[10px] text-blue-100/60">{item.chunksAdded || 0} chunks</div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => deleteRagPdf(item.sourceId)}
                                                disabled={ragDeletingSourceId === item.sourceId}
                                                className="text-[11px] px-2 py-1 rounded bg-red-500/70 hover:bg-red-500 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {ragDeletingSourceId === item.sourceId ? "Removing..." : "Remove"}
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                    )}
                </div>
            )}
            <form className="px-4 my-3" onSubmit={handleSubmit}>
                <div className="relative flex items-center">
                    {/* Emoji Button */}
                    <button
                        type="button"
                        className="absolute inset-y-0 left-3 flex items-center cursor-pointer "
                        onClick={() => setShowEmojiPicker((prev) => !prev)}
                    >
                        <BsEmojiSmile />
                    </button>

                    {/* Text Input */}
                    <textarea
                        type="text"
                        className={`border text-sm rounded-lg block w-full p-2.5 pl-10 ${selectedConversation?.isAI ? "pr-12" : "pr-20"} bg-gray-700 border-gray-600 text-white resize-none focus:outline-none`}
                        placeholder="Type a message..."
                        value={message}
                        rows={2}
                        onKeyDown={handleKeyDown} // Start typing
                        onKeyUp={handleKeyUp}
                        onClick={() => showEmojiPicker && setShowEmojiPicker(false)}

                        onChange={(e) => {
                            setMessage(e.target.value);
                            if (socket && selectedConversation && !selectedConversation.isAI) {
                                socket.emit("typing", {
                                    senderId: socket.id,
                                    receiverId: selectedConversation._id,
                                });
                            }
                        }}
                        onBlur={() => {
                            if (socket && selectedConversation && !selectedConversation.isAI) {
                                socket.emit("stopTyping", {
                                    senderId: socket.id,
                                    receiverId: selectedConversation._id,
                                });
                            }
                        }}
                    />

                    {/* File Upload */}
                    {!selectedConversation?.isAI && (
                        <>
                            <label htmlFor="file-upload" className="absolute inset-y-0 right-12 flex items-center cursor-pointer">
                                <BsPaperclip />
                            </label>
                            <input
                                type="file"
                                id="file-upload"
                                className="hidden"
                                onChange={handleFileChange}
                                onClick={() => showEmojiPicker && setShowEmojiPicker(false)}
                                accept="image/*, video/*"
                            />
                        </>
                    )}

                    {/* Send Button */}
                    <button type="submit" className="absolute inset-y-0 right-3 flex items-center cursor-pointer"
                    onClick={() => showEmojiPicker && setShowEmojiPicker(false)}>
                        {(loading || aiLoading) ? <div className="loading loading-spinner"></div> : <BsSend />}
                    </button>
                </div>
            </form>

            {/* File Preview */}
            {preview && (
                <div className="relative mx-4 mt-2">
                    <img src={preview} alt="Preview" className="w-20 h-20 object-cover rounded-md" />
                    <button
                        type="button"
                        className="absolute top-0 right-0 text-white bg-black p-1 rounded-full"
                        onClick={() => {
                            setFile(null);
                            setPreview(null);
                        }}
                    >
                        <BsXCircle />
                    </button>
                </div>
            )}

            {/* Emoji Picker */}
            {showEmojiPicker && (
                <div className="absolute bottom-12 left-4 z-10">
                    <EmojiPicker onEmojiClick={handleEmojiClick} />
                </div>
            )}
        </div>
    );
};

export default MessageInput;
