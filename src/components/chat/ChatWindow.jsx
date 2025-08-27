// ChatBox.jsx

import React, { useEffect, useState, useContext, useRef } from "react";
import { userDataContext } from "../../context/UserContext";
import { authDataContext } from "../../context/AuthContext";
import { useConnections } from "../../hooks/useConnections";
import dp from "../../assets/dp.webp";
import axios from "axios";
import { FiPhone, FiVideo } from "react-icons/fi";
import CallWindow from "./CallWindow";

function ChatBox() {
  const { userData, socket } = useContext(userDataContext);
  const { serverUrl } = useContext(authDataContext);
  const [receiverId, setReceiverId] = useState("");
  const [receiverObj, setReceiverObj] = useState(null);
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState([]);
  const listRef = useRef(null);
  const [isTyping, setIsTyping] = useState(false);
  const [peerTyping, setPeerTyping] = useState(false);
  const connections = useConnections();

  // WebRTC state
  const pcRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const [inCall, setInCall] = useState(false);
  const [callType, setCallType] = useState(null); // 'audio' | 'video'
  const [incomingCall, setIncomingCall] = useState(null); // { from, offer, callType }
  const [callPeerId, setCallPeerId] = useState(null);
  const [muted, setMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [callError, setCallError] = useState("");

  // Socket listeners
  useEffect(() => {
    if (!userData?._id || !socket) return;

    const onReceive = (data) => {
      if (data?.from && receiverId && data.from !== receiverId) return;
      setChat((prev) => [
        ...prev,
        { ...data, incoming: true, status: "delivered" }
      ]);
      markReadIfVisible();
    };
    const onStatus = ({ clientId, messageId, delivered }) => {
      if (!clientId) return;
      setChat((prev) => prev.map(m => m.clientId === clientId ? { ...m, messageId, status: delivered ? "delivered" : "sent" } : m));
    };
    const onTyping = ({ from, isTyping }) => {
      if (from === receiverId) setPeerTyping(isTyping);
    };
    const onRead = ({ peerId }) => {
      if (peerId === receiverId) {
        setChat(prev => prev.map(m => (m.incoming ? m : { ...m, status: "read" })));
      }
    };

    const onIncomingCall = ({ from, offer, callType }) => {
      setIncomingCall({ from, offer, callType });
    };
    const onCallAnswer = async ({ from, answer }) => {
      try {
        if (pcRef.current) {
          await pcRef.current.setRemoteDescription(new RTCSessionDescription(answer));
          setInCall(true);
        }
      } catch (e) { console.error(e); }
    };
    const onIceCandidate = async ({ from, candidate }) => {
      try {
        if (pcRef.current && candidate) {
          await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
        }
      } catch (e) { console.error(e); }
    };
    const onCallEnded = () => {
      endCall(false);
    };
    const onCallRejected = () => {
      setIncomingCall(null);
      setInCall(false);
      setCallError("Call rejected");
      cleanupCall();
    };

    socket.on("receive_message", onReceive);
    socket.on("message_status", onStatus);
    socket.on("typing", onTyping);
    socket.on("messages_read", onRead);

    socket.on("incoming_call", onIncomingCall);
    socket.on("call_answer", onCallAnswer);
    socket.on("ice_candidate", onIceCandidate);
    socket.on("call_ended", onCallEnded);
    socket.on("call_rejected", onCallRejected);

    return () => {
      socket.off("receive_message", onReceive);
      socket.off("message_status", onStatus);
      socket.off("typing", onTyping);
      socket.off("messages_read", onRead);

      socket.off("incoming_call", onIncomingCall);
      socket.off("call_answer", onCallAnswer);
      socket.off("ice_candidate", onIceCandidate);
      socket.off("call_ended", onCallEnded);
      socket.off("call_rejected", onCallRejected);
    };
  }, [socket, userData?._id, receiverId]);

  // Fetch chat history whenever receiver changes
  useEffect(() => {
    const fetchHistory = async () => {
      if (!userData?._id || !receiverId || !serverUrl) return;
      try {
        const res = await axios.get(`${serverUrl}/api/chat/history/${receiverId}?page=1&limit=30`, { withCredentials: true });
        const rawItems = res.data.items || [];
        const items = rawItems.map(msg => ({
          ...msg,
          text: msg.text,
          incoming: msg.from !== userData._id,
          clientId: undefined,
          messageId: msg._id,
          status: msg.readAt ? "read" : (msg.deliveredAt ? "delivered" : (msg.from === userData._id ? "sent" : undefined))
        }));
        setChat(items);
        markRead();
        setTimeout(() => {
          if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
        }, 0);
      } catch (err) {
        setChat([]);
      }
    };
    fetchHistory();
  }, [receiverId, userData?._id, serverUrl]);

  const markRead = () => {
    if (!userData?._id || !receiverId) return;
    socket?.emit("mark_read", { from: receiverId, to: userData._id });
  };

  const markReadIfVisible = () => {
    const el = listRef.current;
    if (!el) return;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
    if (nearBottom) markRead();
  };

  const sendMessage = () => {
    if (!receiverId || !message.trim() || !userData?._id) return;
    const cid = Date.now().toString();
    setChat((prev) => [
      ...prev,
      { senderId: userData._id, text: message, incoming: false, clientId: cid, status: "sent" },
    ]);
    socket?.emit("send_message", {
      senderId: userData._id,
      receiverId,
      text: message,
      clientId: cid,
    });
    setMessage("");
    socket?.emit("typing", { from: userData._id, to: receiverId, isTyping: false });
    setTimeout(() => {
      if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
    }, 0);
  };

  // typing events
  useEffect(() => {
    if (!userData?._id || !receiverId) return;
    if (message && !isTyping) {
      setIsTyping(true);
      socket?.emit("typing", { from: userData._id, to: receiverId, isTyping: true });
    }
    const t = setTimeout(() => {
      if (isTyping) {
        setIsTyping(false);
        socket?.emit("typing", { from: userData._id, to: receiverId, isTyping: false });
      }
    }, 800);
    return () => clearTimeout(t);
  }, [message, userData?._id, receiverId, isTyping, socket]);

  // Helper: create peer connection
  const createPeerConnection = (targetId) => {
    const iceServers = [
      { urls: [
        "stun:stun.l.google.com:19302",
        "stun:stun1.l.google.com:19302",
        "stun:stun2.l.google.com:19302"
      ]}
    ];
    // Optional TURN from env (comma-separated URLs)
    const turnUrls = import.meta.env.VITE_TURN_URL;
    const turnUser = import.meta.env.VITE_TURN_USERNAME;
    const turnCred = import.meta.env.VITE_TURN_CREDENTIAL;
    if (turnUrls && turnUser && turnCred) {
      iceServers.push({ urls: turnUrls.split(","), username: turnUser, credential: turnCred });
    }
    const pc = new RTCPeerConnection({ iceServers });
    pc.onicecandidate = (e) => {
      if (e.candidate && targetId) {
        socket?.emit("ice_candidate", { to: targetId, from: userData._id, candidate: e.candidate });
      }
    };
    pc.ontrack = (e) => {
      if (!remoteStreamRef.current) {
        remoteStreamRef.current = new MediaStream();
      }
      e.streams[0]?.getTracks().forEach(t => remoteStreamRef.current.addTrack(t));
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = e.streams[0];
      }
    };
    return pc;
  };

  const ensureSocketReady = async () => {
    if (!socket) throw new Error("Socket not available");
    if (socket.connected) return;
    await new Promise((resolve) => setTimeout(resolve, 400));
    if (!socket.connected) throw new Error("Socket not connected");
  };

  const getMedia = async (type) => {
    if (!navigator?.mediaDevices?.getUserMedia) {
      throw new Error("Media devices not supported in this browser");
    }
    const constraintsVideo = { video: { facingMode: "user" }, audio: true };
    const constraintsAudio = { audio: { echoCancellation: true } };
    try {
      const constraints = type === 'video' ? constraintsVideo : constraintsAudio;
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      localStreamRef.current = stream;
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      return stream;
    } catch (e) {
      if (type === 'video') {
        // Fallback to audio-only if video fails
        const stream = await navigator.mediaDevices.getUserMedia(constraintsAudio);
        localStreamRef.current = stream;
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;
        return stream;
      }
      throw e;
    }
  };

  const startCall = async (type) => {
    if (!receiverId || !userData?._id) return;
    try {
      setCallError("");
      await ensureSocketReady();
      setCallType(type);
      setCallPeerId(receiverId);
      const stream = await getMedia(type);
      const pc = createPeerConnection(receiverId);
      pcRef.current = pc;
      stream.getTracks().forEach(track => pc.addTrack(track, stream));
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket?.emit("call_user", { to: receiverId, from: userData._id, offer, callType: type });
    } catch (e) {
      console.error("startCall error", e);
      setCallError(e?.message || "Unable to start call");
      cleanupCall();
    }
  };

  const acceptCall = async () => {
    if (!incomingCall) return;
    const { from, offer, callType: t } = incomingCall;
    try {
      setCallType(t);
      setCallPeerId(from);
      const stream = await getMedia(t);
      const pc = createPeerConnection(from);
      pcRef.current = pc;
      stream.getTracks().forEach(track => pc.addTrack(track, stream));
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket?.emit("answer_call", { to: from, from: userData._id, answer });
      setInCall(true);
      setIncomingCall(null);
    } catch (e) {
      console.error("acceptCall error", e);
      setCallError(e?.message || "Failed to accept call");
      cleanupCall();
    }
  };

  const rejectCall = () => {
    if (!incomingCall) return;
    socket?.emit("reject_call", { to: incomingCall.from, from: userData._id });
    setIncomingCall(null);
    cleanupCall();
  };

  const endCall = (notifyPeer = true) => {
    try {
      if (notifyPeer && callPeerId) {
        socket?.emit("end_call", { to: callPeerId, from: userData._id });
      }
    } catch {}
    cleanupCall();
    setInCall(false);
    setCallType(null);
    setCallPeerId(null);
  };

  const cleanupCall = () => {
    try {
      pcRef.current?.getSenders()?.forEach(s => { try { s.track?.stop?.(); } catch {} });
      pcRef.current?.close?.();
    } catch {}
    pcRef.current = null;
    localStreamRef.current?.getTracks()?.forEach(t => t.stop());
    localStreamRef.current = null;
    remoteStreamRef.current = null;
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    setMuted(false);
    setCameraOff(false);
  };

  const toggleMute = () => {
    const stream = localStreamRef.current;
    if (!stream) return;
    stream.getAudioTracks().forEach(t => (t.enabled = !t.enabled));
    setMuted(prev => !prev);
  };

  const toggleCamera = () => {
    const stream = localStreamRef.current;
    if (!stream) return;
    stream.getVideoTracks().forEach(t => (t.enabled = !t.enabled));
    setCameraOff(prev => !prev);
  };

  if (!userData?._id) {
    return (
      <div className="w-full flex items-center justify-center h-screen bg-gradient-to-br from-[#1A1F71] to-[#2C2C2C]">
        <div className="bg-white p-6 rounded-lg shadow-md w-96 text-center text-gray-700 font-semibold">
          Please log in to use chat.
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-[#1A1F71] to-[#2C2C2C] px-2 py-4">
        <div className="bg-white w-full max-w-md h-[80vh] max-h-[700px] rounded-lg shadow-md flex flex-col p-2 sm:p-4 mt-4 sm:mt-[100px]">
          <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4 justify-between">
            {receiverObj ? (
              <>
                <div className="flex items-center gap-2">
                  <img src={receiverObj.profileImage || dp} alt="" className="w-9 h-9 rounded-full border" />
                  <span className="text-lg font-semibold text-gray-800">{receiverObj.firstName} {receiverObj.lastName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    className="p-2 rounded-full bg-blue-50 hover:bg-blue-100 text-blue-600 disabled:opacity-50"
                    disabled={!receiverId || inCall}
                    title="Voice call"
                    onClick={() => startCall('audio')}
                  >
                    <FiPhone />
                  </button>
                  <button
                    className="p-2 rounded-full bg-blue-50 hover:bg-blue-100 text-blue-600 disabled:opacity-50"
                    disabled={!receiverId || inCall}
                    title="Video call"
                    onClick={() => startCall('video')}
                  >
                    <FiVideo />
                  </button>
                </div>
              </>
            ) : (
              <span className="text-lg font-semibold text-gray-800">Real-Time Chat</span>
            )}
          </div>
          {callError && (
            <div className="mb-2 text-xs text-red-600">{callError}</div>
          )}
          {connections.length > 0 && (
            <div className="mb-2 sm:mb-3">
              <div className="text-xs sm:text-sm text-gray-700 mb-1">Start chat with:</div>
              <div className="flex flex-wrap gap-1 sm:gap-2">
                {connections.map(conn => (
                  <button
                    key={conn._id}
                    className={`flex items-center gap-1 sm:gap-2 px-2 py-1 rounded-full border text-xs sm:text-sm ${receiverId === conn._id ? "bg-blue-100 border-blue-400" : "bg-gray-100 border-gray-300"}`}
                    onClick={() => {
                      setReceiverId(conn._id);
                      setReceiverObj(conn);
                    }}
                  >
                    <img src={conn.profileImage || dp} alt="" className="w-5 h-5 sm:w-6 sm:h-6 rounded-full" />
                    <span className="text-xs text-gray-800">{conn.firstName} {conn.lastName}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
          {receiverObj && (
            <div className="flex items-center gap-1 sm:gap-2 mb-1 sm:mb-2">
              <img src={receiverObj.profileImage || dp} alt="" className="w-6 h-6 sm:w-7 sm:h-7 rounded-full" />
              <span className="text-xs sm:text-sm text-gray-700 font-semibold">Chatting with {receiverObj.firstName} {receiverObj.lastName}</span>
            </div>
          )}
          <div
            ref={listRef}
            onScroll={markReadIfVisible}
            className="flex-1 overflow-y-auto border border-gray-300 rounded p-1 sm:p-2 mb-2 sm:mb-3 bg-gray-50 scrollbar-hide"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            <style>{`.scrollbar-hide::-webkit-scrollbar { display: none; }`}</style>
            {chat.map((msg, index) => (
              <div
                key={index}
                className={`flex ${msg.incoming ? "justify-start" : "justify-end"} mb-1 sm:mb-2`}
              >
                <div className={`max-w-[80%] ${msg.incoming ? "text-left" : "text-right"}`}>
                  <span
                    className={`inline-block px-2 sm:px-3 py-1 sm:py-2 rounded-lg text-xs sm:text-sm ${msg.incoming ? "bg-gray-300 text-black" : "bg-blue-500 text-white"}`}
                  >
                    {msg.text}
                  </span>
                  {!msg.incoming && (
                    <div className="mt-0.5 text-[10px] text-gray-500">
                      {msg.status === "read" ? "✔✔ Read" : msg.status === "delivered" ? "✔✔ Delivered" : "✔ Sent"}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="flex mt-auto">
            <input
              type="text"
              placeholder="Type message..."
              value={message}
              onChange={e => setMessage(e.target.value)}
              className="flex-1 p-2 sm:p-2 border border-gray-300 rounded-l focus:outline-none focus:ring-2 focus:ring-blue-400 text-black text-xs sm:text-base"
            />
            <button
              onClick={sendMessage}
              className="bg-blue-500 hover:bg-blue-600 text-white px-3 sm:px-4 rounded-r transition duration-200 text-xs sm:text-base"
            >
              Send
            </button>
          </div>
          {peerTyping && (
            <div className="text-xs text-gray-500 mt-1">Typing…</div>
          )}
        </div>
      </div>

      <CallWindow
        incoming={Boolean(incomingCall)}
        callType={incomingCall?.callType || callType}
        inCall={inCall}
        peerName={`${receiverObj?.firstName || ''} ${receiverObj?.lastName || ''}`.trim() || 'Unknown'}
        peerImage={receiverObj?.profileImage || dp}
        minimized={minimized}
        onToggleMinimize={() => setMinimized(v => !v)}
        onAccept={acceptCall}
        onReject={rejectCall}
        onEnd={() => endCall(true)}
        onMuteToggle={toggleMute}
        onCamToggle={toggleCamera}
        muted={muted}
        cameraOff={cameraOff}
        localVideoRef={localVideoRef}
        remoteVideoRef={remoteVideoRef}
      />
    </>
  );
}

export default ChatBox;
