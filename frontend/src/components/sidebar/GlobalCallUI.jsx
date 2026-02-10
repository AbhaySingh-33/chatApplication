import { useEffect, useRef, useState } from "react";
import { useCallContext } from "../../context/CallContext";
import { Phone, Video, Maximize2, Minimize2, Mic, MicOff, VideoOff, X } from "lucide-react";
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
		toggleAudio,
		toggleVideo,
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
    const [isAudioMuted, setIsAudioMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const [isLocalMainView, setIsLocalMainView] = useState(false); // false = remote is main

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
				const newX = e.clientX - dragStartCtx.current.x;
				const newY = e.clientY - dragStartCtx.current.y;
				
				// Get window dimensions
				const maxX = window.innerWidth - 420; // Approximate width
				const maxY = window.innerHeight - 100; // Minimum visible height
				
				// Constrain position within viewport
				const constrainedX = Math.max(0, Math.min(newX, maxX));
				const constrainedY = Math.max(0, Math.min(newY, maxY));
				
				setPosition({
					x: constrainedX,
					y: constrainedY,
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

	const handleToggleAudio = () => {
		const enabled = toggleAudio();
		setIsAudioMuted(!enabled);
	};

	const handleToggleVideo = () => {
		const enabled = toggleVideo();
		setIsVideoOff(!enabled);
	};

	const handleSwapView = () => {
		setIsLocalMainView(!isLocalMainView);
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
			className={`fixed z-[9999] transition-all duration-300 ${isMinimize ? 'w-auto' : 'w-[420px] max-w-[95vw]'}`}
			style={{ top: position.y, left: position.x }}
		>
			{isMinimize ? (
				// Minimized View
				<div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 backdrop-blur-xl border border-white/20 shadow-2xl rounded-2xl overflow-hidden">
					<div className="p-3 cursor-move flex justify-between items-center select-none" onMouseDown={handleMouseDown}>
						<div className="flex items-center gap-3">
							<div className="relative">
								<div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 p-0.5">
									<img src={receiver?.profilePic || authUser?.profilePic} alt="User" className="w-full h-full rounded-full object-cover" />
								</div>
								<div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-900 animate-pulse"></div>
							</div>
							<div>
								<p className="text-white text-sm font-semibold">{receiver?.fullName || incomingCall?.callerName}</p>
								<p className="text-green-400 text-xs font-medium">{callAccepted ? elapsedTime : "Connecting..."}</p>
							</div>
						</div>
						<div className="flex items-center gap-2">
							<button onClick={() => setIsMinimize(false)} className="text-white/70 hover:text-white hover:bg-white/10 p-2 rounded-lg transition-all">
								<Maximize2 className="w-4 h-4" />
							</button>
							<button onClick={endCall} className="text-red-400 hover:text-red-300 hover:bg-red-500/10 p-2 rounded-lg transition-all">
								<X className="w-4 h-4" />
							</button>
						</div>
					</div>
				</div>
			) : (
				// Full View
				<div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 backdrop-blur-xl border border-white/20 shadow-2xl rounded-3xl overflow-hidden">
					{/* Header */}
					<div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 backdrop-blur-md border-b border-white/10 p-3 sm:p-4 cursor-move select-none" onMouseDown={handleMouseDown}>
						<div className="flex justify-between items-center">
							<div className="flex items-center gap-2 sm:gap-3">
								<div className="p-1.5 sm:p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg">
									{isVideoCall ? <Video className="w-4 h-4 sm:w-5 sm:h-5 text-white" /> : <Phone className="w-4 h-4 sm:w-5 sm:h-5 text-white" />}
								</div>
								<div>
									<h3 className="text-white font-bold text-sm sm:text-lg truncate max-w-[150px] sm:max-w-none">{receiver?.fullName || incomingCall?.callerName}</h3>
									<p className="text-blue-300 text-xs sm:text-sm font-medium flex items-center gap-2">
										<span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
										{callAccepted ? elapsedTime : "Connecting..."}
									</p>
								</div>
							</div>
							<button onClick={() => setIsMinimize(true)} className="text-white/70 hover:text-white hover:bg-white/10 p-1.5 sm:p-2 rounded-xl transition-all">
								<Minimize2 className="w-4 h-4 sm:w-5 sm:h-5" />
							</button>
						</div>
					</div>

					{/* Video/Audio Content */}
					<div className="p-3 sm:p-6">
						{isVideoCall ? (
							<div className="relative">
								{/* Main Video - Fullscreen */}
								<div className="relative rounded-xl sm:rounded-2xl overflow-hidden shadow-2xl bg-gradient-to-br from-gray-800 to-gray-900 border border-white/10">
									<video 
										ref={isLocalMainView ? localVideoRef : remoteVideoRef} 
										muted={isLocalMainView}
										autoPlay 
										playsInline 
										className="w-full h-48 sm:h-80 object-cover" 
									/>
									<div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none"></div>
									<div className="absolute bottom-2 sm:bottom-4 left-2 sm:left-4 flex items-center gap-1 sm:gap-2 bg-black/60 backdrop-blur-md px-2 sm:px-3 py-1 sm:py-2 rounded-full">
										<div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full animate-pulse"></div>
										<span className="text-white text-xs sm:text-sm font-semibold">
											{isLocalMainView ? "You" : (receiver?.fullName || incomingCall?.callerName || "Remote")}
										</span>
									</div>
								</div>

								{/* PIP Video - Small Corner (Clickable) */}
								<div 
									onClick={handleSwapView}
									className="absolute top-2 sm:top-4 right-2 sm:right-4 w-20 h-16 sm:w-32 sm:h-24 rounded-lg sm:rounded-xl overflow-hidden shadow-2xl bg-gradient-to-br from-gray-700 to-gray-800 border-2 border-blue-500/50 cursor-pointer hover:border-blue-400 hover:scale-105 transition-all group"
								>
									<video 
										ref={isLocalMainView ? remoteVideoRef : localVideoRef} 
										muted={!isLocalMainView}
										autoPlay 
										playsInline 
										className="w-full h-full object-cover" 
									/>
									<div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none"></div>
									<div className="absolute bottom-0.5 sm:bottom-1 left-0.5 sm:left-1 bg-black/60 backdrop-blur-md px-1 sm:px-2 py-0.5 rounded-full">
										<span className="text-white text-[10px] sm:text-xs font-bold">
											{isLocalMainView ? (receiver?.fullName || incomingCall?.callerName || "Remote") : "You"}
										</span>
									</div>
									{/* Swap hint overlay */}
									<div className="absolute inset-0 bg-blue-500/0 group-hover:bg-blue-500/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
										<span className="text-white text-[10px] sm:text-xs font-bold bg-black/60 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded">Swap</span>
									</div>
								</div>
							</div>
						) : (
							// Audio Call View
							<div className="flex flex-col items-center py-4 sm:py-8">
								<audio ref={remoteAudioRef} autoPlay playsInline style={{ display: "none" }} />
								<div className="relative mb-4 sm:mb-6">
									<div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full blur-2xl opacity-50 animate-pulse"></div>
									<div className="relative w-24 h-24 sm:w-32 sm:h-32 rounded-full p-1 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 shadow-2xl">
										<img 
											src={receiver?.profilePic || "https://avatar.iran.liara.run/public"} 
											alt="Remote" 
											className="w-full h-full rounded-full object-cover border-4 border-gray-900" 
										/>
									</div>
									<div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-green-500 px-3 sm:px-4 py-0.5 sm:py-1 rounded-full shadow-lg">
										<span className="text-white text-xs font-bold">Connected</span>
									</div>
								</div>
								<h3 className="text-white text-lg sm:text-2xl font-bold mb-1 sm:mb-2 truncate max-w-[250px]">{receiver?.fullName || incomingCall?.callerName}</h3>
								<p className="text-blue-300 text-base sm:text-lg font-medium mb-4 sm:mb-6">{callAccepted ? elapsedTime : "Connecting..."}</p>
								
								{/* Audio Visualizer Effect */}
								<div className="flex items-center gap-1 h-8 sm:h-12">
									{[...Array(5)].map((_, i) => (
										<div key={i} className="w-1 bg-gradient-to-t from-blue-500 to-purple-500 rounded-full animate-pulse" style={{ height: `${20 + Math.random() * 30}px`, animationDelay: `${i * 0.1}s` }}></div>
									))}
								</div>
							</div>
						)}

						{/* Control Buttons */}
						<div className="flex items-center justify-center gap-3 sm:gap-4 mt-4 sm:mt-6">
							<button 
								onClick={handleToggleAudio}
								className={`p-3 sm:p-4 rounded-full transition-all shadow-lg backdrop-blur-md border border-white/20 group ${
									isAudioMuted ? 'bg-red-500/80 hover:bg-red-600/80' : 'bg-white/10 hover:bg-white/20'
								}`}
							>
								{isAudioMuted ? (
									<MicOff className="w-4 h-4 sm:w-5 sm:h-5 text-white group-hover:scale-110 transition-transform" />
								) : (
									<Mic className="w-4 h-4 sm:w-5 sm:h-5 text-white group-hover:scale-110 transition-transform" />
								)}
							</button>
							{isVideoCall && (
								<button 
									onClick={handleToggleVideo}
									className={`p-3 sm:p-4 rounded-full transition-all shadow-lg backdrop-blur-md border border-white/20 group ${
										isVideoOff ? 'bg-red-500/80 hover:bg-red-600/80' : 'bg-white/10 hover:bg-white/20'
									}`}
								>
									{isVideoOff ? (
										<VideoOff className="w-4 h-4 sm:w-5 sm:h-5 text-white group-hover:scale-110 transition-transform" />
									) : (
										<Video className="w-4 h-4 sm:w-5 sm:h-5 text-white group-hover:scale-110 transition-transform" />
									)}
								</button>
							)}
							<button
								onClick={endCall}
								className="p-3 sm:p-4 bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 rounded-full transition-all shadow-xl active:scale-95 group"
							>
								<Phone className="w-4 h-4 sm:w-5 sm:h-5 text-white rotate-[135deg] group-hover:scale-110 transition-transform" />
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default GlobalCallUI;
