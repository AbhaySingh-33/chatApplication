import { useEffect, useState, useRef } from "react";
import useConversation from "../../zustand/useConversation";
import MessageInput from "./MessageInput";
import Messages from "./Messages";
import { TiMessages } from "react-icons/ti";
import { useAuthContext } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Phone, Video } from "lucide-react";
import { useSocketContext } from "../../context/SocketContext";
import Peer from "simple-peer/simplepeer.min.js";
import toast from "react-hot-toast";

const MessageContainer = () => {
  const {
    selectedConversation,
    setSelectedConversation,
    setShowDelete,
    typingUsers,
  } = useConversation();

  const receiver = useConversation((state) => state.receiver);
  const setreceiver = useConversation((state) => state.setreceiver);
  const navigate = useNavigate();
  const { socket } = useSocketContext();
  const { authUser } = useAuthContext();

  const [incomingCall, setIncomingCall] = useState(null);
  const [callAccepted, setCallAccepted] = useState(false);
  const [peer, setPeer] = useState(null);
  const [isVideoCall, setIsVideoCall] = useState(false);
  const [callStarted, setCallStarted] = useState(false);

  const myVideo = useRef();
  const userVideo = useRef();
  const userAudio = useRef();
  const myStream = useRef();

  useEffect(() => {
    return () => setSelectedConversation({});
  }, [setSelectedConversation]);

  const isEmptyObject = (obj) => !Object.keys(obj).length;

  const cleanupCall = () => {
    if (incomingCall && !callAccepted) {
      socket.emit("call:rejected", { to: incomingCall.fromId, from: authUser._id });
    }

    socket.off("call:accepted"); // Prevent stacking multiple listeners

    if (peer && !peer.destroyed) peer.destroy();
    if (myStream.current) {
      myStream.current.getTracks().forEach((track) => track.stop());
      myStream.current = null;
    }
    if (myVideo.current) myVideo.current.srcObject = null;
    if (userVideo.current) userVideo.current.srcObject = null;
    if (userAudio.current) userAudio.current.srcObject = null;

    setIncomingCall(null);
    setCallAccepted(false);
    setPeer(null);
    setIsVideoCall(false);
    setCallStarted(false);
  };

  const endCall = () => {
    socket.emit("call:end", {
      to: selectedConversation._id,
      from: authUser._id,
    });
    cleanupCall();
  };

  const setupVideoElement = (videoElement, stream, muted = false) => {
    if (videoElement && stream) {
      videoElement.srcObject = stream;
      videoElement.muted = muted;
      videoElement.playsInline = true;
      videoElement.autoplay = true;
      videoElement.play().catch((error) => {
        console.error("Error playing video:", error);
      });
    }
  };

  const handleCall = async (receiverId, isVideo = false) => {
    try {
      setIsVideoCall(isVideo);
      setCallStarted(true);

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

      const stream = await navigator.mediaDevices.getUserMedia(
        mediaConstraints
      );
      myStream.current = stream;

      if (isVideo && myVideo.current) {
        setupVideoElement(myVideo.current, stream, true);
      }

      const newPeer = new Peer({
        initiator: true,
        trickle: false,
        stream: stream,
        config: {
          iceServers: [
            { urls: ["stun:bn-turn2.xirsys.com"] },
            {
              username:
                "Z2pl8YreKImIPLzdxO-sxtgO1msUbImFvRAehu25ArXj7ogBIyqYqonVOUWtk7hRAAAAAGhpIT5BYmhheQ==",
              credential: "9e93ad80-599f-11f0-bdaa-0242ac140004",
              urls: [
                "turn:bn-turn2.xirsys.com:80?transport=udp",
                "turn:bn-turn2.xirsys.com:3478?transport=udp",
                "turn:bn-turn2.xirsys.com:80?transport=tcp",
                "turn:bn-turn2.xirsys.com:3478?transport=tcp",
                "turns:bn-turn2.xirsys.com:443?transport=tcp",
                "turns:bn-turn2.xirsys.com:5349?transport=tcp",
              ],
            },
          ],
        },
      });

      newPeer.on("signal", (signal) => {
        socket.emit("call:user", {
          to: receiverId,
          from: authUser,
          fromId: authUser._id,
          callerName: authUser.fullName,
          signal,
          isVideoCall: isVideo,
        });
      });

      newPeer.on("stream", (remoteStream) => {
        if (isVideo && userVideo.current) {
          setupVideoElement(userVideo.current, remoteStream, false);
        } else if (!isVideo && userAudio.current) {
          userAudio.current.srcObject = remoteStream;
          userAudio.current.play().catch(console.error);
        }
        setCallAccepted(true);
      });

      newPeer.on("error", (error) => {
        console.error("Peer error:", error);
        cleanupCall();
      });

      socket.off("call:accepted"); // Prevent stacking multiple listeners
      const handleCallAccepted = (signal) => {
        if (!newPeer.destroyed) {
          newPeer.signal(signal);
        }
      };

      socket.on("call:accepted", handleCallAccepted);
      setPeer(newPeer);

      return () => {
        socket.off("call:accepted", handleCallAccepted);
      };
    } catch (error) {
      console.error("Error starting call:", error);
      alert("Could not access camera/microphone. Please check permissions.");
      cleanupCall();
    }
  };

  const acceptCall = async () => {
    try {
      setIsVideoCall(incomingCall.isVideoCall);
      setCallStarted(true);

      const mediaConstraints = {
        video: incomingCall.isVideoCall
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
      const stream = await navigator.mediaDevices.getUserMedia(
        mediaConstraints
      );
      myStream.current = stream;

      if (incomingCall.isVideoCall && myVideo.current) {
        setupVideoElement(myVideo.current, stream, true);
      }

      const newPeer = new Peer({
        initiator: false,
        trickle: false,
        stream: stream,
        config: {
          iceServers: [
            { urls: ["stun:bn-turn2.xirsys.com"] },
            {
              username:
                "Z2pl8YreKImIPLzdxO-sxtgO1msUbImFvRAehu25ArXj7ogBIyqYqonVOUWtk7hRAAAAAGhpIT5BYmhheQ==",
              credential: "9e93ad80-599f-11f0-bdaa-0242ac140004",
              urls: [
                "turn:bn-turn2.xirsys.com:80?transport=udp",
                "turn:bn-turn2.xirsys.com:3478?transport=udp",
                "turn:bn-turn2.xirsys.com:80?transport=tcp",
                "turn:bn-turn2.xirsys.com:3478?transport=tcp",
                "turns:bn-turn2.xirsys.com:443?transport=tcp",
                "turns:bn-turn2.xirsys.com:5349?transport=tcp",
              ],
            },
          ],
        },
      });

      newPeer.on("signal", (signal) => {
        socket.emit("call:answer", { signal, to: incomingCall.fromId });
      });

      newPeer.on("stream", (remoteStream) => {
        if (incomingCall.isVideoCall && userVideo.current) {
          setupVideoElement(userVideo.current, remoteStream, false);
        } else if (!incomingCall.isVideoCall && userAudio.current) {
          userAudio.current.srcObject = remoteStream;
          userAudio.current.play().catch(console.error);
        }
        setCallAccepted(true);
      });

      newPeer.on("error", (error) => {
        console.error("Peer error on accept:", error);
        cleanupCall();
      });

      if (!newPeer.destroyed) {
        newPeer.signal(incomingCall.signal);
      }

      setPeer(newPeer);
    } catch (error) {
      console.error("Error accepting call:", error);
      alert("Could not access camera/microphone. Please check permissions.");
      cleanupCall();
    }
  };

  useEffect(() => {
    if (!socket) return;

    const handleIncoming = ({
      from,
      signal,
      callerName,
      isVideoCall,
      fromId,
    }) => {
      setIncomingCall({ from, signal, callerName, isVideoCall, fromId });
      setreceiver(from);
    };

    const handleEnd = () => {
      cleanupCall();
    };

    const handleRejected = () => {
      cleanupCall();
    };

    const handleUnavailable = ({ reason }) => {
      toast.error(reason || "User is currently on another call.");
      setIncomingCall(false); // Optional: if you show a 'calling...' state
      cleanupCall();
    };

    socket.on("call:incoming", handleIncoming);
    socket.on("call:end", handleEnd);
    socket.on("call:rejected", handleRejected);
    socket.on("call:unavailable", handleUnavailable);

    return () => {
      socket.off("call:incoming", handleIncoming);
      socket.off("call:end", handleEnd);
      socket.off("call:rejected", handleRejected);
      socket.off("call:unavailable", handleUnavailable);
    };
  }, [socket]);

  return (
    <div
      className="flex flex-col h-full w-full min-w-0 bg-blue-900/10 backdrop-filter backdrop-blur-lg"
      onClick={() => setShowDelete(null)}
    >
      {isEmptyObject(selectedConversation) ? (
        <NoChatSelected />
      ) : (
        <>
          <div className="bg-blue-900/40 backdrop-blur-sm px-2 sm:px-4 py-2 sm:py-3 flex justify-between items-center sticky top-0 z-20 border-b border-blue-300/20 animate-fade-in">
            <div>
              <span className="text-blue-200 text-xs sm:text-sm">To:</span>{" "}
              <span className="text-white font-bold text-sm sm:text-base">
                {selectedConversation.fullName}
              </span>
            </div>
            <div className="flex gap-2 sm:gap-3">
              <Phone
                className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-blue-200 cursor-pointer hover:text-green-400 transition-all duration-200 hover:scale-110"
                onClick={() => {
                  if (callStarted) return;
                  setreceiver({ ...selectedConversation });
                  handleCall(selectedConversation._id, false);
                }}
              />
              <Video
                className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-blue-200 cursor-pointer hover:text-cyan-400 transition-all duration-200 hover:scale-110"
                onClick={() => {
                  if (callStarted) return;
                  setreceiver({ ...selectedConversation });
                  handleCall(selectedConversation._id, true);
                }}
              />
            </div>
            <button
              onClick={() => setSelectedConversation({})}
              className="text-blue-200 hover:text-red-400 text-lg sm:text-xl font-bold transition-colors duration-200 hover:scale-110"
            >
              &times;
            </button>
          </div>

          {typingUsers[selectedConversation?._id] && (
            <p className="text-sm text-blue-300 px-4 py-1 animate-pulse">✍️ Typing...</p>
          )}

          {incomingCall && !callAccepted && (
            <div className="fixed inset-0 bg-black bg-opacity-70 flex flex-col items-center justify-center z-50">
              <p className="text-white mb-2 text-xl">
                {incomingCall.callerName} is calling you...
              </p>
              <p className="text-white mb-4">
                {incomingCall.isVideoCall ? "📹 Video Call" : "📞 Voice Call"}
              </p>
              <div className="flex gap-4 mt-4">
                <button
                  onClick={acceptCall}
                  className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700"
                >
                  Accept
                </button>
                <button
                  onClick={cleanupCall}
                  className="bg-red-600 text-white px-6 py-2 rounded hover:bg-red-700"
                >
                  Reject
                </button>
              </div>
            </div>
          )}

          {(callAccepted || callStarted) && (
            <div className="fixed top-4 left-4 z-40 bg-black bg-opacity-90 p-4 rounded-lg flex flex-col items-center gap-3">
              {isVideoCall ? (
                <div className="flex flex-col gap-3">
                  <div className="relative">
                    <video
                      ref={myVideo}
                      muted
                      autoPlay
                      playsInline
                      className="w-48 h-36 rounded bg-gray-800 object-cover"
                    />
                    <span className="absolute bottom-2 left-2 text-white text-xs bg-black bg-opacity-50 px-2 py-1 rounded">
                      You
                    </span>
                  </div>
                  <div className="relative">
                    <video
                      ref={userVideo}
                      autoPlay
                      playsInline
                      className="w-48 h-36 rounded bg-gray-800 object-cover"
                    />
                    <span className="absolute bottom-2 left-2 text-white text-xs bg-black bg-opacity-50 px-2 py-1 rounded">
                      {receiver.fullName}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <audio
                    ref={userAudio}
                    autoPlay
                    playsInline
                    style={{ display: "none" }}
                  />
                  <div className="flex gap-4 items-center">
                    <div className="text-center">
                      <img
                        src={authUser.profilePic}
                        alt="You"
                        className="w-20 h-20 rounded-full border-2 border-green-400"
                      />
                      <p className="text-white text-xs mt-1">You</p>
                    </div>
                    {receiver ? (
                      <div className="text-center">
                        <img
                          src={receiver.profilePic}
                          alt={receiver.fullName}
                          className="w-20 h-20 rounded-full border-2 border-blue-400"
                        />
                        <p className="text-white text-xs mt-1">
                          {receiver.fullName}
                        </p>
                      </div>
                    ) : (
                      <div className="text-center">
                        <p className="text-white text-xs mt-1 italic">
                          No active call
                        </p>
                      </div>
                    )}
                  </div>
                  <p className="text-white text-sm">
                    {callAccepted ? "📞 Connected" : "📞 Calling..."}
                  </p>
                </div>
              )}

              <button
                onClick={endCall}
                className="bg-red-500 text-white px-6 py-2 mt-2 rounded hover:bg-red-600 transition-colors"
              >
                End Call
              </button>
            </div>
          )}

          <div className="flex-1 overflow-y-auto px-1 sm:px-2 py-1 animate-fade-in delay-200">
            <Messages />
          </div>
          <div className="p-1 sm:p-2 border-t border-blue-300/20 bg-blue-900/20 backdrop-blur-sm animate-fade-in delay-300">
            <MessageInput />
          </div>
        </>
      )}
    </div>
  );
};

export default MessageContainer;

const NoChatSelected = () => {
  const { authUser } = useAuthContext();
  const navigate = useNavigate();
  return (
    <div className="flex items-center justify-center w-full h-full bg-blue-900/10 backdrop-blur-sm">
      <div className="px-4 text-center sm:text-lg md:text-xl text-blue-100 font-semibold flex flex-col items-center justify-center gap-6 animate-fade-in">
        {authUser?.profilePic && (
          <div
            className="w-40 h-40 rounded-full cursor-pointer group animate-bounce-slow overflow-hidden border-4 border-blue-400/50 hover:border-blue-400 transition-all duration-300 hover:scale-110 shadow-lg shadow-blue-500/30"
            onClick={() => navigate("/profile")}
            title="Go to Profile"
          >
            <img
              src={authUser.profilePic}
              alt="user avatar"
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <div className="animate-fade-in delay-200">
          <p className="text-2xl mb-2">Welcome 👋 <span className="text-cyan-300">{authUser.fullName}</span> ❄</p>
          <p className="text-blue-200 mb-4">Select a chat to start messaging</p>
        </div>
        <TiMessages className="text-4xl md:text-7xl text-center text-blue-300 animate-pulse" />
      </div>
    </div>
  );
};