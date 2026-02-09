import VoiceSession from "../models/voiceSession.model.js";
import axios from "axios";

// Helper to call Gemini
const callGemini = async (prompt) => {
	try {
		const API_KEY = process.env.GEMINI_API_KEY;
		if (!API_KEY) {
			console.error("GEMINI_API_KEY is missing");
			return null;
		}

		const response = await axios.post(
			`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${API_KEY}`,
			{
				contents: [
					{
						role: "user",
						parts: [{ text: prompt }],
					},
				],
			}
		);

		if (response.data && response.data.candidates && response.data.candidates.length > 0) {
			return response.data.candidates[0].content.parts[0].text;
		}
		return null;
	} catch (error) {
		console.error("AI Error:", error?.response?.data || error.message);
		return null;
	}
};

export const createVoiceSession = async (req, res) => {
	try {
		const userId = req.user._id;
		const session = new VoiceSession({ userId, transcript: [], knowledgeGraph: { nodes: [], edges: [] } });
		await session.save();
		res.status(201).json(session);
	} catch (error) {
		console.error("Error creating voice session:", error);
		res.status(500).json({ error: "Internal server error" });
	}
};

export const updateTranscript = async (req, res) => {
	try {
		const { id } = req.params;
		const { text } = req.body;

		const session = await VoiceSession.findById(id);
		if (!session) return res.status(404).json({ error: "Session not found" });

		session.transcript.push({ text, timestamp: new Date() });
		
        // Optimize: Don't update graph on EVERY word, maybe user triggers it or we do it every X chunks.
        // For this demo, let's update it every time a significant chunk is added, or return the "Pending" state.
        // Let's TRY to update it "Live" (incrementally).
        
        // Construct the full text so far for context
        const fullText = session.transcript.map(t => t.text).join(" ");

        const prompt = `
        Analyze the following conversation transcript. 
        Identify entities strictly falling into these categories: People, Technologies, Tasks, DateTime (dates, times, days).
        Also identify relationships between them.
        
        Transcript: "${fullText}"

        Return strict JSON format ONLY, no markdown formatting:
        {
            "nodes": [
                {"id": "unique_id", "label": "Name", "type": "person|technology|task|datetime"}
            ],
            "edges": [
                {"source": "source_id", "target": "target_id", "relation": "verb_or_description"}
            ]
        }
        `;

        const aiResponse = await callGemini(prompt);
        let graphData = session.knowledgeGraph;

        if (aiResponse) {
             try {
                // remove markdown code blocks if present
                const cleanJson = aiResponse.replace(/```json/g, "").replace(/```/g, "").trim();
                const parsed = JSON.parse(cleanJson);
                if(parsed.nodes && parsed.edges) {
                    graphData = parsed;
                }
             } catch (e) {
                 console.error("Failed to parse AI JSON:", e);
             }
        }

        session.knowledgeGraph = graphData;
		await session.save();

		res.status(200).json(session);
	} catch (error) {
		console.error("Error updating transcript:", error);
		res.status(500).json({ error: "Internal server error" });
	}
};

export const getSession = async (req, res) => {
	try {
		const { id } = req.params;
		const session = await VoiceSession.findById(id);
		if (!session) return res.status(404).json({ error: "Session not found" });
		res.status(200).json(session);
	} catch (error) {
		res.status(500).json({ error: "Internal server error" });
	}
};

export const getUserSessions = async (req, res) => {
    try {
        const userId = req.user._id;
        const sessions = await VoiceSession.find({ userId }).sort({ createdAt: -1 });
        res.status(200).json(sessions);
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
}

export const queryKnowledgeGraph = async (req, res) => {
    try {
        const { id } = req.params;
        const { query } = req.body;

        const session = await VoiceSession.findById(id);
		if (!session) return res.status(404).json({ error: "Session not found" });

        const fullText = session.transcript.map(t => t.text).join(" ");
        const graphContext = JSON.stringify(session.knowledgeGraph);

        const prompt = `
        Context:
        Transcript: "${fullText}"
        Knowledge Graph: ${graphContext}

        User Question: "${query}"

        Answer the question based on the context provided.
        `;

        const answer = await callGemini(prompt);
        res.status(200).json({ answer: answer || "I couldn't generate an answer." });

    } catch (error) {
        console.error("Error querying graph:", error);
		res.status(500).json({ error: "Internal server error" });
    }
};
