import { createContext, useContext, useState, useRef, useEffect } from "react";
import { useSocketContext } from "./SocketContext";
import { useAuthContext } from "./AuthContext";
import Peer from "simple-peer/simplepeer.min.js";
import toast from "react-hot-toast";
import { NoiseSuppressionProcessor } from "@shiguredo/noise-suppression";

const CallContext = createContext();

const STUN_URL = import.meta.env.VITE_STUN_URL;
const TURN_USERNAME = import.meta.env.VITE_TURN_USERNAME;
const TURN_CREDENTIAL = import.meta.env.VITE_TURN_CREDENTIAL;
const TURN_URLS = (import.meta.env.VITE_TURN_URLS || "")
    .split(",")
    .map((url) => url.trim())
    .filter(Boolean);

const PEER_CONFIG = {
    iceServers: [
        ...(STUN_URL ? [{ urls: [STUN_URL] }] : []),
        ...(TURN_USERNAME && TURN_CREDENTIAL && TURN_URLS.length
            ? [{ username: TURN_USERNAME, credential: TURN_CREDENTIAL, urls: TURN_URLS }]
            : []),
    ],
};

export const useCallContext = () => {
	return useContext(CallContext);
};

export const CallContextProvider = ({ children }) => {
	const { socket } = useSocketContext();
	const { authUser } = useAuthContext();
    const [callState, setCallState] = useState({
        incomingCall: null,
        callAccepted: false,
        callStarted: false,
        isVideoCall: false,
        receiver: null,
        startTime: null
    });
    
    // UI Positioning logic
    const [position, setPosition] = useState({ x: 20, y: 70 }); // Lower slightly avoiding nav
    const [isMinimize, setIsMinimize] = useState(false);

    const [peer, setPeer] = useState(null);
    const myVideo = useRef();
    const userVideo = useRef();
    const userAudio = useRef(); // This needs to be attached in UI
    const myStream = useRef();
    const remoteStreamRef = useRef(null);
    const noiseProcessor = useRef(null);

    useEffect(() => {
        if (!socket) return;
    
        socket.on("call:incoming", (data) => {
            setCallState(prev => ({...prev, incomingCall: data}));
        });
    
        socket.on("call:accepted", (data) => {
            setCallState(prev => ({...prev, callAccepted: true, startTime: Date.now()}));
        });
    
        socket.on("call:end", () => {
             cleanupCall();
        });
    
        socket.on("call:rejected", () => {
             toast.error("Call rejected");
             cleanupCall();
        });
    
        return () => {
            socket.off("call:incoming");
            socket.off("call:accepted");
            socket.off("call:end");
            socket.off("call:rejected");
        };
    }, [socket]);

    const cleanupCall = () => {
        const { incomingCall, callAccepted, receiver } = callState;
        if (incomingCall && !callAccepted && incomingCall.fromId && authUser) {
             socket.emit("call:rejected", { to: incomingCall.fromId, from: authUser._id });
        }
    
        if (peer && !peer.destroyed) peer.destroy();
        if (myStream.current) {
          myStream.current.getTracks().forEach((track) => track.stop());
          myStream.current = null;
        }
        if (noiseProcessor.current) {
          noiseProcessor.current.stopProcessing();
          noiseProcessor.current = null;
        }

        remoteStreamRef.current = null;

        // Reset refs
        if (myVideo.current) myVideo.current.srcObject = null;
        if (userVideo.current) userVideo.current.srcObject = null;
        // if (userAudio.current) userAudio.current.srcObject = null;
    
        setCallState({
            incomingCall: null,
            callAccepted: false,
            callStarted: false,
            isVideoCall: false,
            receiver: null,
            startTime: null
        });
        setPeer(null);
    };

    const startCall = async (participant, isVideo) => {
        setCallState(prev => ({
            ...prev,
            callStarted: true,
            isVideoCall: isVideo,
            receiver: participant
        }));

        try {
             const mediaConstraints = {
                video: isVideo
                  ? {
                      width: { ideal: 1280 },
                      height: { ideal: 720 },
                      facingMode: "user",
                    }
                  : false,
                audio: {
                  echoCancellation: true,
                  noiseSuppression: true,
                  autoGainControl: true,
                },
              };
        
              let stream = await navigator.mediaDevices.getUserMedia(mediaConstraints);
              
              // Apply noise suppression to audio track
              if (stream.getAudioTracks().length > 0) {
                  try {
                      if (!noiseProcessor.current) {
                          noiseProcessor.current = new NoiseSuppressionProcessor();
                          await noiseProcessor.current.startProcessing(stream);
                      }
                      const processedStream = noiseProcessor.current.getProcessedStream();
                      // Combine processed audio with original video if exists
                      const videoTracks = stream.getVideoTracks();
                      const audioTracks = processedStream.getAudioTracks();
                      stream = new MediaStream([...audioTracks, ...videoTracks]);
                  } catch (err) {
                      console.warn("Noise suppression failed, using original stream:", err);
                  }
              }
              
              myStream.current = stream;
              if (myVideo.current) myVideo.current.srcObject = stream; // Attach if local video element exists

              const newPeer = new Peer({
                initiator: true,
                trickle: false,
                stream: stream,
                config: PEER_CONFIG
              });

              newPeer.on("signal", (data) => {
                  socket.emit("call:user", {
                      to: participant._id,
                      signal: data,
                      from: authUser,
                      fromId: authUser._id,
                      callerName: authUser.fullName,
                      isVideoCall: isVideo
                  });
              });

              newPeer.on("stream", (remoteStream) => {
                   remoteStreamRef.current = remoteStream;
                   if (userVideo.current && isVideo) {
                        userVideo.current.srcObject = remoteStream;
                   }
                   if (userAudio.current && !isVideo) {
                       userAudio.current.srcObject = remoteStream;
                   }
                   // We might need to store this stream in state if we re-mount components
              });
              
              socket.on("call:accepted", (signal) => {
                  setCallState(prev => ({...prev, callAccepted: true}));
                  newPeer.signal(signal);
              });

              setPeer(newPeer);

        } catch(err) {
             console.error("Failed to start call", err);
             toast.error("Could not access camera/microphone");
             cleanupCall();
        }
    };

    const acceptCall = async () => {
         // Logic similar to startCall but initiator: false
         const { incomingCall } = callState;
         const isVideo = incomingCall.isVideoCall;

         setCallState(prev => ({
            ...prev, 
            callAccepted: true, 
            startTime: Date.now(),
            isVideoCall: isVideo
         }));

          try {
             const mediaConstraints = {
                video: isVideo
                  ? {
                      width: { ideal: 1280 },
                      height: { ideal: 720 },
                      facingMode: "user",
                    }
                  : false,
                audio: {
                  echoCancellation: true,
                  noiseSuppression: true,
                  autoGainControl: true,
                },
              };

              let stream = await navigator.mediaDevices.getUserMedia(mediaConstraints);
              
              // Apply noise suppression to audio track
              if (stream.getAudioTracks().length > 0) {
                  try {
                      if (!noiseProcessor.current) {
                          noiseProcessor.current = new NoiseSuppressionProcessor();
                          await noiseProcessor.current.startProcessing(stream);
                      }
                      const processedStream = noiseProcessor.current.getProcessedStream();
                      // Combine processed audio with original video if exists
                      const videoTracks = stream.getVideoTracks();
                      const audioTracks = processedStream.getAudioTracks();
                      stream = new MediaStream([...audioTracks, ...videoTracks]);
                  } catch (err) {
                      console.warn("Noise suppression failed, using original stream:", err);
                  }
              }
              
              myStream.current = stream;
              if (myVideo.current && isVideo) myVideo.current.srcObject = stream;

              const newPeer = new Peer({
                  initiator: false,
                  trickle: false,
                  stream: stream,
                  config: PEER_CONFIG
              });

              newPeer.on("signal", (data) => {
                  socket.emit("call:answer", { signal: data, to: incomingCall.fromId });
              });

              newPeer.on("stream", (remoteStream) => {
                   remoteStreamRef.current = remoteStream;
                   if (userVideo.current && isVideo) userVideo.current.srcObject = remoteStream;
                   if (userAudio.current && !isVideo) userAudio.current.srcObject = remoteStream;
              });

              newPeer.signal(incomingCall.signal);
              setPeer(newPeer);

          } catch (err) {
               console.error(err);
               cleanupCall();
          }
    };

    const endCall = () => {
         const { incomingCall, receiver } = callState;
         const targetId = incomingCall ? incomingCall.fromId : receiver?._id;
         
         if(targetId) {
             socket.emit("call:end", { to: targetId, from: authUser._id });
         }
         cleanupCall();
    }
    
    // We need to expose refs so the GlobalCallUI can attach the video elements
    const attachLocalVideo = (el) => {
        myVideo.current = el;
        if(myStream.current && el && el.srcObject !== myStream.current) {
            el.srcObject = myStream.current;
        }
    };

    const attachRemoteVideo = (el) => {
        userVideo.current = el;
        // If peer has stream, we might need to re-attach. 
        // Use stored remoteStreamRef for reliability
        const remoteStream = remoteStreamRef.current || (peer && peer._remoteStreams && peer._remoteStreams[0]);
        
        if (remoteStream && el && el.srcObject !== remoteStream) {
             el.srcObject = remoteStream;
        }
    };

    const attachRemoteAudio = (el) => {
        userAudio.current = el;
        const remoteStream = remoteStreamRef.current || (peer && peer._remoteStreams && peer._remoteStreams[0]);

        if (remoteStream && el && el.srcObject !== remoteStream) {
            el.srcObject = remoteStream;
        }
    }

    const toggleAudio = () => {
        if (myStream.current) {
            const audioTrack = myStream.current.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                return audioTrack.enabled;
            }
        }
        return true;
    };

    const toggleVideo = () => {
        if (myStream.current) {
            const videoTrack = myStream.current.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled;
                return videoTrack.enabled;
            }
        }
        return true;
    };


	return <CallContext.Provider value={{ 
        callState, 
        startCall, 
        endCall, 
        acceptCall, 
        cleanupCall,
        // Refs/Attachments
        attachLocalVideo,
        attachRemoteVideo,
        attachRemoteAudio,
        toggleAudio,
        toggleVideo,
        position, setPosition, isMinimize, setIsMinimize
    }}>{children}</CallContext.Provider>;
};
