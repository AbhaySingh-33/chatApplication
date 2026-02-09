import { useEffect, useRef, useState } from "react";
import { useCallContext } from "../../context/CallContext";
import { Phone, Video, Maximize2, Minimize2 } from "lucide-react";
import { useAuthContext } from "../../context/AuthContext";

const GlobalCallUI = () => {
	const {
		callState,
		endCall,
		acceptCall,
		cleanupCall,
		attachLocalVideo,
		attachRemoteVideo,
		attachRemoteAudio,
		position,
		setPosition,
        isMinimize,
        setIsMinimize
	} = useCallContext();
	const { incomingCall, callAccepted, callStarted, isVideoCall, receiver } = callState;
	const { authUser } = useAuthContext();
    
    // Local refs for this component instance
    const localVideoRef = useRef();
    const remoteVideoRef = useRef();
    const remoteAudioRef = useRef();
    
    // Drag data
    const [isDragging, setIsDragging] = useState(false);
    const dragStartCtx = useRef({ x: 0, y: 0 });

    const [elapsedTime, setElapsedTime] = useState("00:00");

    useEffect(() => {
        if (!callState.startTime || !callAccepted) {
            setElapsedTime("00:00");
            return;
        }

        const interval = setInterval(() => {
            const now = Date.now();
            const start = callState.startTime;
            const diff = Math.floor((now - start) / 1000);

            const minutes = Math.floor(diff / 60).toString().padStart(2, "0");
            const seconds = (diff % 60).toString().padStart(2, "0");
            setElapsedTime(`${minutes}:${seconds}`);
        }, 1000);

        return () => clearInterval(interval);
    }, [callState.startTime, callAccepted]);

    useEffect(() => {
        // Attach refs to context whenever the component mounts or updates
        if (localVideoRef.current) attachLocalVideo(localVideoRef.current);
        if (remoteVideoRef.current) attachRemoteVideo(remoteVideoRef.current);
        if (remoteAudioRef.current) attachRemoteAudio(remoteAudioRef.current);
    });

	// Handle Dragging
	useEffect(() => {
		const handleMouseMove = (e) => {
			if (isDragging) {
				setPosition({
					x: e.clientX - dragStartCtx.current.x,
					y: e.clientY - dragStartCtx.current.y,
				});
			}
		};

		const handleMouseUp = () => {
			setIsDragging(false);
		};

		if (isDragging) {
			window.addEventListener("mousemove", handleMouseMove);
			window.addEventListener("mouseup", handleMouseUp);
		}
		return () => {
			window.removeEventListener("mousemove", handleMouseMove);
			window.removeEventListener("mouseup", handleMouseUp);
		};
	}, [isDragging, setPosition]);

	const handleMouseDown = (e) => {
		setIsDragging(true);
		dragStartCtx.current = { x: e.clientX - position.x, y: e.clientY - position.y };
	};

	if (!incomingCall && !callStarted && !callAccepted) return null;

	// Floating Incoming Call Modal (Before Accept)
	if (incomingCall && !callAccepted) {
		return (
			<div className="fixed inset-0 bg-black/70 flex flex-col items-center justify-center z-[9999]">
				<div className="bg-gray-800 p-8 rounded-2xl shadow-2xl flex flex-col items-center border border-white/10 animate-bounce-in">
					<div className="w-24 h-24 rounded-full p-1 bg-gradient-to-r from-blue-500 to-purple-500 mb-4 animate-pulse">
						<img
							src={"https://avatar.iran.liara.run/public"} // Placeholder or caller pic if available
							alt="Caller"
							className="w-full h-full rounded-full object-cover border-4 border-gray-800"
						/>
					</div>
					<p className="text-white text-2xl font-bold mb-2">{incomingCall.callerName}</p>
					<p className="text-blue-300 mb-6 flex items-center gap-2">
						{incomingCall.isVideoCall ? <Video /> : <Phone />}
						{incomingCall.isVideoCall ? "Incoming Video Call..." : "Incoming Voice Call..."}
					</p>
					<div className="flex gap-4 w-full">
						<button onClick={acceptCall} className="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg hover:shadow-green-500/20 active:scale-95">
							Accept
						</button>
						<button onClick={cleanupCall} className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg hover:shadow-red-500/20 active:scale-95">
							Decline
						</button>
					</div>
				</div>
			</div>
		);
	}

	// Active Call UI (Draggable)
	return (
		<div
			className={`fixed z-[9999] bg-black/90 backdrop-blur-xl border border-white/20 shadow-2xl rounded-2xl overflow-hidden flex flex-col items-center transition-all duration-300 ${isMinimize ? 'w-auto' : 'min-w-[320px]'}`}
			style={{ top: position.y, left: position.x }}
		>
			{/* Header / Drag Handle */}
			<div className="w-full bg-white/10 p-3 cursor-move flex justify-between items-center select-none active:bg-white/20 transition-colors" onMouseDown={handleMouseDown}>
				<div className="flex items-center gap-2">
					<div className={`w-2 h-2 rounded-full ${callAccepted ? "bg-green-500 animate-pulse" : "bg-yellow-500"}`}></div>
					<span className="text-white/90 font-medium text-xs tracking-wide uppercase">
                        {isMinimize ? (callAccepted ? "On Call" : "Calling") : (isVideoCall ? "Video Call" : "Voice Call")}
                    </span>
				</div>
                <button onClick={() => setIsMinimize(!isMinimize)} className="text-white/70 hover:text-white p-1">
                    {isMinimize ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
                </button>
			</div>
            
            {!isMinimize && (
                <div className="p-4 flex flex-col items-center gap-4 w-full">
                    {isVideoCall ? (
                        <div className="flex flex-col gap-3">
                            {/* Self Video */}
                            <div className="relative group">
                                <video ref={localVideoRef} muted autoPlay playsInline className="w-48 h-32 rounded-lg bg-gray-900 object-cover border border-white/10 shadow-lg" />
                                <span className="absolute bottom-2 left-2 text-white/90 text-[10px] font-bold bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-full">You</span>
                            </div>
                            {/* Remote Video */}
                            <div className="relative group">
                                <video ref={remoteVideoRef} autoPlay playsInline className="w-48 h-32 rounded-lg bg-gray-900 object-cover border border-white/10 shadow-lg" />
                                <span className="absolute bottom-2 left-2 text-white/90 text-[10px] font-bold bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-full">
                                    {receiver?.fullName || incomingCall?.callerName || "Remote"}
                                </span>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-4 w-full py-2">
                            <audio ref={remoteAudioRef} autoPlay playsInline style={{ display: "none" }} />
                            <div className="flex gap-4 items-center justify-center">
                                {/* You */}
                                <div className="flex flex-col items-center gap-1">
                                    <div className="w-14 h-14 rounded-full p-0.5 bg-gradient-to-tr from-green-400 to-emerald-600 shadow-lg">
                                        <img src={authUser?.profilePic} alt="You" className="w-full h-full rounded-full object-cover border-2 border-black" />
                                    </div>
                                    <p className="text-white/60 text-[10px] uppercase font-bold">You</p>
                                </div>
                                
                                <span className="text-white/20">-</span>

                                {/* Other */}
                                <div className="flex flex-col items-center gap-1">
                                    <div className="w-14 h-14 rounded-full p-0.5 bg-gradient-to-tr from-blue-400 to-indigo-600 shadow-lg">
                                        <img 
                                            src={receiver?.profilePic || "https://avatar.iran.liara.run/public"} 
                                            alt="Remote" 
                                            className="w-full h-full rounded-full object-cover border-2 border-black" 
                                        />
                                    </div>
                                    <p className="text-white/60 text-[10px] uppercase font-bold">
                                        {receiver?.fullName || incomingCall?.callerName || "User"}
                                    </p>
                                </div>
                            </div>
                            <p className="text-blue-300 text-xs animate-pulse">
                                {callAccepted ? elapsedTime : "Connecting..."}
                            </p>
                        </div>
                    )}

                    <button
                        onClick={endCall}
                        className="w-full bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-4 py-2 rounded-lg transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
                    >
                        <Phone className="w-3 h-3" /> End Call
                    </button>
                </div>
            )}
		</div>
	);
};

export default GlobalCallUI;
