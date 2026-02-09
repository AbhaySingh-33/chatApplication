import { useState } from "react";
import toast from "react-hot-toast";

const useVoiceGraph = () => {
	const [loading, setLoading] = useState(false);
	const [session, setSession] = useState(null);

	const createSession = async () => {
		setLoading(true);
		try {
			const res = await fetch("/api/voice-graph", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
			});
			const data = await res.json();
			if (data.error) throw new Error(data.error);
			setSession(data);
			return data;
		} catch (error) {
			toast.error(error.message);
		} finally {
			setLoading(false);
		}
	};

	const updateTranscript = async (sessionId, text) => {
		try {
			const res = await fetch(`/api/voice-graph/${sessionId}/transcript`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ text }),
			});
			const data = await res.json();
			if (data.error) throw new Error(data.error);
			setSession(data); // Update session with new graph
		} catch (error) {
			console.error("Error updating transcript", error);
		}
	};

	const queryGraph = async (sessionId, query) => {
		setLoading(true);
		try {
			const res = await fetch(`/api/voice-graph/${sessionId}/query`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ query }),
			});
			const data = await res.json();
			if (data.error) throw new Error(data.error);
			return data.answer;
		} catch (error) {
			toast.error(error.message);
		} finally {
			setLoading(false);
		}
	};
    
    const getSession = async (sessionId) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/voice-graph/${sessionId}`);
            const data = await res.json();
            if(data.error) throw new Error(data.error);
            setSession(data);
        } catch (error) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    }

	return { loading, session, createSession, updateTranscript, queryGraph, getSession };
};

export default useVoiceGraph;
