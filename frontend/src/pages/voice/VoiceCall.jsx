import { useEffect, useState, useRef } from "react";
import useVoiceGraph from "../../hooks/useVoiceGraph";
import { useNavigate } from "react-router-dom";
import { FaMicrophone, FaMicrophoneSlash, FaPaperPlane, FaProjectDiagram } from "react-icons/fa";

const VoiceCall = () => {
	const { loading, session, createSession, updateTranscript, queryGraph } = useVoiceGraph();
	const [isRecording, setIsRecording] = useState(false);
	const [transcript, setTranscript] = useState("");
	const [query, setQuery] = useState("");
	const [answer, setAnswer] = useState(null);
	const recognitionRef = useRef(null);
    const sessionRef = useRef(session); // Keep track of session without re-triggering effect
    const isRecordingRef = useRef(isRecording); // Track recording state for event handlers
	const navigate = useNavigate();

    // Update refs
    useEffect(() => {
        sessionRef.current = session;
    }, [session]);
    
    useEffect(() => {
        isRecordingRef.current = isRecording;
    }, [isRecording]);

	useEffect(() => {
		const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert("Browser does not support Speech Recognition. Please use Chrome or Edge.");
            return;
        }
		
        // Only initialize if we are recording
        if (isRecording) {
            const recognition = new SpeechRecognition();
            recognition.continuous = true;
            recognition.interimResults = true;

            recognition.onresult = (event) => {
                let interimTranscript = "";
                let finalTranscriptChunk = "";

                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        finalTranscriptChunk += event.results[i][0].transcript;
                    } else {
                        interimTranscript += event.results[i][0].transcript;
                    }
                }

                if (finalTranscriptChunk) {
                    setTranscript((prev) => prev + " " + finalTranscriptChunk);
                    // Use ref to get current session ID
                    if (sessionRef.current?._id) {
                        updateTranscript(sessionRef.current._id, finalTranscriptChunk);
                    }
                }
            };
            
            // Handle auto-restart
            recognition.onend = () => {
                // Check the REF, not the state variable from closure
                if (isRecordingRef.current) {
                    console.log("Auto-restarting speech recognition...");
                    try {
                        recognition.start();
                    } catch (e) {
                        console.log("Recognition restart error", e);
                    }
                }
            };

            recognitionRef.current = recognition;
            recognition.start();

            return () => {
                recognition.stop();
            };
        } else {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
        }

	}, [isRecording]); // Only depend on isRecording state check

	const toggleRecording = async () => {
		if (isRecording) {
            setIsRecording(false);
            // useEffect cleanup will handle stopping
		} else {
            // Start new session if none exists
            if (!session) {
                await createSession();
            }
			setIsRecording(true);
            // useEffect will handle starting
		}
	};

	const handleQuery = async (e) => {
		e.preventDefault();
		if (!query || !session) return;
		const result = await queryGraph(session._id, query);
		setAnswer(result);
        setQuery("");
	};

    const renderNodes = (type) => {
        if(!session?.knowledgeGraph?.nodes) return null;
        const nodes = session.knowledgeGraph.nodes.filter(n => n.type === type);
        if(nodes.length === 0) return null;

        return (
            <div className="mb-4">
                <h4 className="text-gray-300 font-semibold capitalize mb-2">{type}s</h4>
                <div className="flex flex-wrap gap-2">
                    {nodes.map((node, idx) => (
                        <span key={idx} className="px-3 py-1 bg-gray-700/50 rounded-full text-sm border border-gray-600">
                            {node.label}
                        </span>
                    ))}
                </div>
            </div>
        )
    }

	return (
		<div className="flex flex-col h-screen bg-gray-900 text-gray-100 p-4">
			<div className="flex justify-between items-center mb-6 border-b border-gray-700 pb-4">
				<h2 className="text-2xl font-bold flex items-center gap-2">
                    <FaProjectDiagram className="text-blue-400" />
                    Voice Knowledge Graph
                </h2>
                <button onClick={() => navigate("/")} className="text-sm text-gray-400 hover:text-white">
                    Back to Home
                </button>
			</div>

			<div className="flex flex-col md:flex-row gap-6 flex-1 overflow-hidden">
				{/* Left: Call & Transcript */}
				<div className="flex-1 flex flex-col gap-4">
					<div className="bg-gray-800 p-6 rounded-lg shadow-lg flex flex-col items-center justify-center min-h-[200px]">
						<div className={`w-24 h-24 rounded-full flex items-center justify-center text-3xl mb-4 transition-all duration-300 ${isRecording ? "bg-red-500/20 text-red-500 animate-pulse border-2 border-red-500" : "bg-gray-700 text-gray-400"}`}>
							{isRecording ? <FaMicrophone /> : <FaMicrophoneSlash />}
						</div>
						<button
							onClick={toggleRecording}
							className={`px-6 py-2 rounded-full font-bold transition-colors ${
								isRecording ? "bg-red-600 hover:bg-red-700 text-white" : "bg-green-600 hover:bg-green-700 text-white"
							}`}
						>
							{isRecording ? "Stop Analysis" : "Start Listening"}
						</button>
                        <div className="mt-4 text-center">
                             <p className="text-sm font-semibold text-gray-300">
                                {isRecording ? "Analyzing your conversation..." : "Ready to analyze"}
                            </p>
                            {!isRecording && (
                                <p className="text-xs text-gray-500 mt-1 max-w-xs mx-auto">
                                    Click start to transcribe your meeting or brainstorming session.
                                </p>
                            )}
                        </div>
					</div>

					<div className="bg-gray-800 p-4 rounded-lg flex-1 overflow-auto shadow-lg border border-gray-700">
						<h3 className="text-lg font-semibold mb-2 text-gray-300 sticky top-0 bg-gray-800 pb-2">Live Transcript</h3>
						<div className="h-full">
                            {!transcript && !session?.transcript?.length ? (
                                <div className="flex flex-col items-center justify-center h-full text-gray-500 space-y-4 opacity-70">
                                    <p className="italic">"Waiting for speech..."</p>
                                    <div className="text-xs max-w-sm text-center border-t border-gray-700 pt-4">
                                        <p className="font-semibold text-gray-400 mb-1">Tips for best results:</p>
                                        <p>Try saying: <span className="text-blue-400">"Assign John to the frontend task."</span></p>
                                        <p>Or: <span className="text-blue-400">"We need to migrate to PostgreSQL."</span></p>
                                    </div>
                                </div>
                            ) : (
                                <p className="whitespace-pre-wrap text-gray-300 leading-relaxed font-mono text-sm">
                                    {transcript || session?.transcript?.map(t => t.text).join(" ")}
                                </p>
                            )}
                        </div>
					</div>
				</div>

				{/* Right: Knowledge Graph & Query */}
				<div className="flex-1 flex flex-col gap-4">
					
                    {/* Graph Visualization (Simplified) */}
					<div className="bg-gray-800 p-4 rounded-lg flex-1 overflow-auto shadow-lg border border-gray-700 relative">
                        <div className="sticky top-0 bg-gray-800 z-10 pb-2 mb-2 border-b border-gray-700 flex justify-between items-center">
						    <h3 className="text-lg font-semibold text-blue-300">Extracted Knowledge</h3>
                            {loading && <span className="text-xs text-yellow-400 animate-pulse">Updating...</span>}
                        </div>
                        
                        {!session?.knowledgeGraph?.nodes?.length ? (
                            <div className="flex items-center justify-center h-full text-gray-500 italic">
                                No entities extracted yet...
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {renderNodes("person")}
                                {renderNodes("technology")}
                                {renderNodes("task")}
                                
                                {session.knowledgeGraph.edges.length > 0 && (
                                    <div>
                                        <h4 className="text-gray-300 font-semibold mb-2">Relationships</h4>
                                        <ul className="space-y-2 text-sm">
                                            {session.knowledgeGraph.edges.map((edge, i) => (
                                                <li key={i} className="flex items-center gap-2 text-gray-400 bg-gray-900/30 p-2 rounded">
                                                    <span className="text-blue-400">{session.knowledgeGraph.nodes.find(n => n.id === edge.source)?.label || edge.source}</span>
                                                    <span className="text-gray-500">→</span>
                                                    <span className="text-purple-400 text-xs uppercase font-bold">{edge.relation}</span>
                                                    <span className="text-gray-500">→</span>
                                                    <span className="text-blue-400">{session.knowledgeGraph.nodes.find(n => n.id === edge.target)?.label || edge.target}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        )}
					</div>

                    {/* Query Interface */}
					<div className="bg-gray-800 p-4 rounded-lg shadow-lg border border-gray-700">
						<h3 className="text-lg font-semibold mb-2 text-gray-300">Ask about the call</h3>
						<form onSubmit={handleQuery} className="flex gap-2">
							<input
								type="text"
								value={query}
								onChange={(e) => setQuery(e.target.value)}
								placeholder="e.g., What did we decide about the database?"
								className="flex-1 bg-gray-700 border-none outline-none text-white px-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-500"
							/>
							<button type="submit" disabled={loading || !session} className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg disabled:opacity-50">
								<FaPaperPlane />
							</button>
						</form>
                        {answer && (
                            <div className="mt-4 p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg text-blue-200 text-sm">
                                <strong>Answer: </strong> {answer}
                            </div>
                        )}
					</div>
				</div>
			</div>
		</div>
	);
};

export default VoiceCall;
