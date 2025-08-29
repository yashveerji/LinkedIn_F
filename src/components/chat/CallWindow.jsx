import React, { forwardRef } from "react";
import { FiMic, FiMicOff, FiCamera, FiCameraOff, FiPhoneOff, FiMaximize2, FiMinimize2, FiPhone, FiVideo } from "react-icons/fi";

// Video elements are controlled by parent via refs.
const CallWindow = ({
  callType = 'audio',
  incoming = false,
  inCall = false,
  ringing = false,
  iceState = 'new',
  pcState = 'new',
  peerName = 'Unknown',
  peerImage,
  minimized = false,
  onToggleMinimize,
  onAccept,
  onReject,
  onEnd,
  onMuteToggle,
  onCamToggle,
  muted = false,
  cameraOff = false,
  localVideoRef,
  remoteVideoRef,
  remoteAudioRef
}) => {
  if (incoming) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-4 w-80 text-gray-800 shadow-xl">
          <div className="flex items-center gap-3 mb-3">
            <img src={peerImage} alt="" className="w-10 h-10 rounded-full border" />
            <div>
              <div className="font-semibold">Incoming {callType === 'video' ? 'Video' : 'Voice'} Call</div>
              <div className="text-sm text-gray-600">From: {peerName}</div>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button className="px-3 py-1 rounded bg-gray-200" onClick={onReject}>Reject</button>
            <button className="px-3 py-1 rounded bg-blue-600 text-white" onClick={onAccept}>Accept</button>
          </div>
        </div>
      </div>
    );
  }

  if (!inCall) return null;

  return (
  <div className={`fixed ${minimized ? 'bottom-4 right-4 w-64' : 'bottom-6 right-6 w-80'} bg-white rounded-lg shadow-lg p-2 z-40 text-gray-800`}>
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs font-semibold">{callType === 'video' ? 'Video' : 'Voice'} call with {peerName}</div>
        <button onClick={onToggleMinimize} className="p-1 rounded hover:bg-gray-100" title={minimized ? 'Expand' : 'Minimize'}>
          {minimized ? <FiMaximize2 /> : <FiMinimize2 />}
        </button>
      </div>
      <div className="text-[10px] text-gray-500 mb-1">
        {ringing ? 'Ringing… ' : ''}ICE: {iceState} · PC: {pcState}
      </div>
    {callType === 'video' && !minimized ? (
        <div className="relative w-full aspect-video bg-black rounded overflow-hidden">
          <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
          <video ref={localVideoRef} autoPlay muted playsInline className="w-24 h-16 object-cover absolute bottom-1 right-1 border-2 border-white rounded" />
        </div>
      ) : (
        <div className="flex items-center gap-3 p-3">
          <img src={peerImage} alt="" className="w-10 h-10 rounded-full border" />
          <div className="text-sm">Connected</div>
      {/* Hidden audio element is rendered below for both audio & video calls */}
        </div>
      )}
      {/* Always render a hidden audio element to ensure remote audio plays reliably (even in video calls) */}
      <audio ref={remoteAudioRef} autoPlay className="absolute w-0 h-0 opacity-0" />
      <div className="flex items-center justify-center gap-3 mt-2">
        <button onClick={onMuteToggle} className="p-2 rounded-full bg-gray-100 hover:bg-gray-200" title={muted ? 'Unmute' : 'Mute'}>
          {muted ? <FiMicOff /> : <FiMic />}
        </button>
        {callType === 'video' && (
          <button onClick={onCamToggle} className="p-2 rounded-full bg-gray-100 hover:bg-gray-200" title={cameraOff ? 'Camera on' : 'Camera off'}>
            {cameraOff ? <FiCameraOff /> : <FiCamera />}
          </button>
        )}
        <button onClick={onEnd} className="p-2 rounded-full bg-red-500 text-white hover:bg-red-600" title="End call">
          <FiPhoneOff />
        </button>
      </div>
    </div>
  );
};

export default CallWindow;
