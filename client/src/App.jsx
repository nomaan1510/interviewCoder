import React, { useState, useEffect, useRef } from 'react';
import { Camera, CameraOff, Mic, MicOff, MonitorUp, Users, Code, FileText, Clock, Settings, Maximize2, Minimize2, Play, Copy, Check, Share2 } from 'lucide-react';

// Monaco Editor Component (simplified - in production you'd use @monaco-editor/react)
const MonacoEditor = ({ value, onChange, language }) => {
  const editorRef = useRef(null);
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleChange = (e) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    onChange(newValue);
  };

  return (
    <div className="editor-container">
      <textarea
        ref={editorRef}
        value={localValue}
        onChange={handleChange}
        className="code-editor"
        spellCheck="false"
        placeholder={`// Write your ${language} code here...\n// This is a simplified editor. In production, Monaco Editor would provide:\n// - Syntax highlighting\n// - IntelliSense\n// - Error detection\n// - Multi-cursor editing`}
      />
    </div>
  );
};

const InterviewPlatform = () => {
  const [mode, setMode] = useState('ide'); // 'ide' or 'document'
  const [language, setLanguage] = useState('javascript');
  const [code, setCode] = useState('');
  const [documentText, setDocumentText] = useState('');
  const [timeLimit, setTimeLimit] = useState(60);
  const [timeRemaining, setTimeRemaining] = useState(60 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [output, setOutput] = useState('');
  const [roomId, setRoomId] = useState('');
  const [isInRoom, setIsInRoom] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  
  // Video refs
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const peerConnectionRef = useRef(null);

  const languages = [
    'javascript', 'python', 'java', 'cpp', 'c', 'csharp',
    'go', 'rust', 'typescript', 'ruby', 'php', 'swift', 'kotlin'
  ];

  // Generate random room ID
  const generateRoomId = () => {
    return Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10);
  };

  // Initialize room on mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const roomFromUrl = urlParams.get('room');
    
    if (roomFromUrl) {
      setRoomId(roomFromUrl);
      joinRoom(roomFromUrl);
    } else {
      const newRoomId = generateRoomId();
      setRoomId(newRoomId);
    }
  }, []);

  // Start local video
  const startLocalVideo = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      
      return stream;
    } catch (error) {
      console.error('Error accessing media devices:', error);
      alert('Unable to access camera/microphone. Please check permissions.');
    }
  };

  // Join room and start video call
  const joinRoom = async (room) => {
    setIsInRoom(true);
    await startLocalVideo();
    
    // In production, you would:
    // 1. Connect to signaling server (WebSocket/Socket.io)
    // 2. Create RTCPeerConnection
    // 3. Exchange ICE candidates and SDP offers/answers
    // 4. Handle remote stream
    
    console.log('Joined room:', room);
  };

  // Create and share interview link
  const createInterviewLink = () => {
    const link = `${window.location.origin}${window.location.pathname}?room=${roomId}`;
    return link;
  };

  // Copy link to clipboard
  const copyLinkToClipboard = () => {
    const link = createInterviewLink();
    navigator.clipboard.writeText(link).then(() => {
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    });
  };

  // Toggle video
  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setVideoEnabled(videoTrack.enabled);
      }
    } else {
      setVideoEnabled(!videoEnabled);
    }
  };

  // Toggle audio
  const toggleAudio = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setAudioEnabled(audioTrack.enabled);
      }
    } else {
      setAudioEnabled(!audioEnabled);
    }
  };

  // Share screen
  const toggleScreenShare = async () => {
    if (!isScreenSharing) {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true
        });
        
        // Replace video track with screen share
        if (peerConnectionRef.current && localStreamRef.current) {
          const videoTrack = screenStream.getVideoTracks()[0];
          const sender = peerConnectionRef.current.getSenders().find(s => s.track?.kind === 'video');
          if (sender) {
            sender.replaceTrack(videoTrack);
          }
        }
        
        setIsScreenSharing(true);
        
        // Handle screen share stop
        screenStream.getVideoTracks()[0].onended = () => {
          setIsScreenSharing(false);
          // Switch back to camera
          if (localStreamRef.current) {
            const videoTrack = localStreamRef.current.getVideoTracks()[0];
            const sender = peerConnectionRef.current?.getSenders().find(s => s.track?.kind === 'video');
            if (sender && videoTrack) {
              sender.replaceTrack(videoTrack);
            }
          }
        };
      } catch (error) {
        console.error('Error sharing screen:', error);
      }
    }
  };

  useEffect(() => {
    let interval;
    if (isTimerRunning && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining(prev => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timeRemaining]);

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const executeCode = async () => {
    setOutput('Executing code...\n\n// In production, this would send code to Judge0 API\n// Sample output:\nHello, World!\nCode executed successfully.');
  };

  const startInterview = () => {
    setTimeRemaining(timeLimit * 60);
    setIsTimerRunning(true);
  };

  return (
    <div className="interview-platform">
      <style>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          overflow: hidden;
        }

        .interview-platform {
          width: 100vw;
          height: 100vh;
          background: linear-gradient(135deg, #0a0e27 0%, #1a1f3a 100%);
          display: flex;
          flex-direction: column;
          color: #e8eaed;
          position: relative;
        }

        /* Header */
        .header {
          height: 70px;
          background: rgba(15, 20, 40, 0.9);
          backdrop-filter: blur(10px);
          border-bottom: 1px solid rgba(99, 179, 237, 0.2);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 24px;
          z-index: 100;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        }

        .logo {
          font-size: 24px;
          font-weight: 700;
          background: linear-gradient(135deg, #63b3ed 0%, #a78bfa 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          letter-spacing: -0.5px;
        }

        .timer-control {
          display: flex;
          gap: 16px;
          align-items: center;
        }

        .timer-display {
          font-size: 28px;
          font-weight: 600;
          font-variant-numeric: tabular-nums;
          color: ${timeRemaining < 300 ? '#ef4444' : '#63b3ed'};
          text-shadow: 0 0 20px ${timeRemaining < 300 ? 'rgba(239, 68, 68, 0.3)' : 'rgba(99, 179, 237, 0.3)'};
          min-width: 140px;
          text-align: center;
        }

        .controls {
          display: flex;
          gap: 12px;
        }

        /* Main Content */
        .main-content {
          flex: 1;
          display: flex;
          gap: 16px;
          padding: 16px;
          overflow: hidden;
        }

        /* Video Grid */
        .video-section {
          width: 280px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .video-container {
          position: relative;
          background: #000;
          border-radius: 12px;
          overflow: hidden;
          border: 2px solid rgba(99, 179, 237, 0.3);
          transition: all 0.3s ease;
          aspect-ratio: 4/3;
        }

        .video-container:hover {
          border-color: rgba(99, 179, 237, 0.6);
          box-shadow: 0 8px 32px rgba(99, 179, 237, 0.2);
        }

        .video-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
        }

        video {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .video-label {
          position: absolute;
          bottom: 8px;
          left: 8px;
          background: rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(10px);
          padding: 4px 12px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 500;
        }

        /* Share Modal */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          animation: fadeIn 0.2s ease;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .modal {
          background: rgba(15, 20, 40, 0.95);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(99, 179, 237, 0.3);
          border-radius: 20px;
          padding: 32px;
          width: 90%;
          max-width: 500px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
          animation: slideUp 0.3s ease;
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .modal-header {
          font-size: 24px;
          font-weight: 600;
          margin-bottom: 8px;
          background: linear-gradient(135deg, #63b3ed 0%, #a78bfa 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .modal-description {
          font-size: 14px;
          color: #94a3b8;
          margin-bottom: 24px;
        }

        .link-container {
          display: flex;
          gap: 8px;
          margin-bottom: 24px;
        }

        .link-input {
          flex: 1;
          padding: 12px 16px;
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(99, 179, 237, 0.3);
          border-radius: 10px;
          color: #e8eaed;
          font-size: 14px;
          font-family: 'JetBrains Mono', monospace;
        }

        .link-input:focus {
          outline: none;
          border-color: #63b3ed;
          box-shadow: 0 0 0 3px rgba(99, 179, 237, 0.1);
        }

        .copy-btn {
          padding: 12px 20px;
          background: linear-gradient(135deg, #63b3ed 0%, #a78bfa 100%);
          border: none;
          border-radius: 10px;
          color: white;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          gap: 8px;
          font-family: inherit;
        }

        .copy-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(99, 179, 237, 0.4);
        }

        .modal-actions {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
        }

        .video-controls {
          display: flex;
          gap: 8px;
          padding: 12px;
          background: rgba(15, 20, 40, 0.6);
          backdrop-filter: blur(10px);
          border-radius: 12px;
          border: 1px solid rgba(99, 179, 237, 0.2);
        }

        /* Editor Section */
        .editor-section {
          flex: 1;
          display: flex;
          flex-direction: column;
          background: rgba(15, 20, 40, 0.6);
          backdrop-filter: blur(10px);
          border-radius: 16px;
          border: 1px solid rgba(99, 179, 237, 0.2);
          overflow: hidden;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        }

        .editor-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          background: rgba(10, 14, 39, 0.8);
          border-bottom: 1px solid rgba(99, 179, 237, 0.2);
        }

        .mode-selector {
          display: flex;
          gap: 8px;
          background: rgba(0, 0, 0, 0.3);
          padding: 4px;
          border-radius: 10px;
        }

        .mode-button {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          background: transparent;
          border: none;
          color: #94a3b8;
          cursor: pointer;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 500;
          transition: all 0.2s ease;
          font-family: inherit;
        }

        .mode-button.active {
          background: linear-gradient(135deg, #63b3ed 0%, #a78bfa 100%);
          color: #fff;
          box-shadow: 0 4px 12px rgba(99, 179, 237, 0.3);
        }

        .language-selector {
          display: flex;
          gap: 8px;
          align-items: center;
        }

        select {
          padding: 8px 16px;
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(99, 179, 237, 0.3);
          border-radius: 8px;
          color: #e8eaed;
          font-size: 13px;
          font-family: inherit;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        select:hover {
          border-color: rgba(99, 179, 237, 0.6);
        }

        select:focus {
          outline: none;
          border-color: #63b3ed;
          box-shadow: 0 0 0 3px rgba(99, 179, 237, 0.1);
        }

        .editor-container {
          flex: 1;
          position: relative;
          overflow: hidden;
        }

        .code-editor, .text-editor {
          width: 100%;
          height: 100%;
          padding: 20px;
          background: #0a0e27;
          border: none;
          color: #e8eaed;
          font-family: 'JetBrains Mono', monospace;
          font-size: 14px;
          line-height: 1.6;
          resize: none;
          outline: none;
        }

        .code-editor {
          tab-size: 4;
        }

        .output-section {
          height: 200px;
          background: rgba(0, 0, 0, 0.4);
          border-top: 1px solid rgba(99, 179, 237, 0.2);
          padding: 16px 20px;
          overflow-y: auto;
          font-size: 13px;
          line-height: 1.6;
        }

        .output-section::-webkit-scrollbar {
          width: 8px;
        }

        .output-section::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.2);
        }

        .output-section::-webkit-scrollbar-thumb {
          background: rgba(99, 179, 237, 0.3);
          border-radius: 4px;
        }

        .output-section::-webkit-scrollbar-thumb:hover {
          background: rgba(99, 179, 237, 0.5);
        }

        /* Buttons */
        .btn {
          padding: 10px 20px;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          gap: 8px;
          font-family: inherit;
        }

        .btn-primary {
          background: linear-gradient(135deg, #63b3ed 0%, #a78bfa 100%);
          color: #fff;
          box-shadow: 0 4px 12px rgba(99, 179, 237, 0.3);
        }

        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(99, 179, 237, 0.4);
        }

        .btn-secondary {
          background: rgba(255, 255, 255, 0.1);
          color: #e8eaed;
          border: 1px solid rgba(99, 179, 237, 0.3);
        }

        .btn-secondary:hover {
          background: rgba(255, 255, 255, 0.15);
          border-color: rgba(99, 179, 237, 0.5);
        }

        .icon-btn {
          width: 42px;
          height: 42px;
          padding: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(99, 179, 237, 0.3);
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.2s ease;
          color: #e8eaed;
        }

        .icon-btn:hover {
          background: rgba(255, 255, 255, 0.15);
          border-color: rgba(99, 179, 237, 0.5);
        }

        .icon-btn.active {
          background: linear-gradient(135deg, #63b3ed 0%, #a78bfa 100%);
          border-color: transparent;
          box-shadow: 0 4px 12px rgba(99, 179, 237, 0.3);
        }

        .icon-btn.danger {
          background: rgba(239, 68, 68, 0.2);
          border-color: rgba(239, 68, 68, 0.4);
        }

        .icon-btn.danger:hover {
          background: rgba(239, 68, 68, 0.3);
        }

        /* Settings Panel */
        .settings-panel {
          position: absolute;
          top: 80px;
          right: 24px;
          width: 320px;
          background: rgba(15, 20, 40, 0.95);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(99, 179, 237, 0.3);
          border-radius: 16px;
          padding: 20px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
          z-index: 200;
          animation: slideIn 0.3s ease;
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .settings-header {
          font-size: 18px;
          font-weight: 600;
          margin-bottom: 16px;
          color: #63b3ed;
        }

        .setting-item {
          margin-bottom: 16px;
        }

        .setting-label {
          font-size: 13px;
          color: #94a3b8;
          margin-bottom: 8px;
          display: block;
        }

        input[type="number"] {
          width: 100%;
          padding: 10px;
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(99, 179, 237, 0.3);
          border-radius: 8px;
          color: #e8eaed;
          font-size: 14px;
          font-family: inherit;
        }

        input[type="number"]:focus {
          outline: none;
          border-color: #63b3ed;
          box-shadow: 0 0 0 3px rgba(99, 179, 237, 0.1);
        }

        /* Responsive */
        @media (max-width: 1024px) {
          .video-section {
            width: 220px;
          }
          
          .main-content {
            gap: 12px;
            padding: 12px;
          }
        }

        /* Animations */
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }

        .recording-indicator {
          width: 8px;
          height: 8px;
          background: #ef4444;
          border-radius: 50%;
          animation: pulse 2s infinite;
        }
      `}</style>

      {/* Header */}
      <div className="header">
        <div className="logo">⚡ CodeInterview</div>
        
        <div className="timer-control">
          <div className="timer-display">{formatTime(timeRemaining)}</div>
          {!isTimerRunning && (
            <button className="btn btn-primary" onClick={startInterview}>
              <Clock size={18} />
              Start Interview
            </button>
          )}
        </div>

        <div className="controls">
          <button 
            className="btn btn-primary" 
            onClick={() => setShowShareModal(true)}
            title="Share Interview Link"
          >
            <Share2 size={18} />
            Share Link
          </button>
          <button 
            className="icon-btn" 
            onClick={() => setShowSettings(!showSettings)}
            title="Settings"
          >
            <Settings size={20} />
          </button>
        </div>
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <div className="modal-overlay" onClick={() => setShowShareModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">Share Interview Link</div>
            <div className="modal-description">
              Share this link with the candidate to join the interview
            </div>
            <div className="link-container">
              <input 
                type="text" 
                className="link-input" 
                value={createInterviewLink()} 
                readOnly 
              />
              <button className="copy-btn" onClick={copyLinkToClipboard}>
                {linkCopied ? (
                  <>
                    <Check size={18} />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy size={18} />
                    Copy
                  </>
                )}
              </button>
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowShareModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settings Panel */}
      {showSettings && (
        <div className="settings-panel">
          <div className="settings-header">Interview Settings</div>
          <div className="setting-item">
            <label className="setting-label">Time Limit (minutes)</label>
            <input 
              type="number" 
              value={timeLimit} 
              onChange={(e) => setTimeLimit(parseInt(e.target.value) || 60)}
              min="1"
              max="180"
            />
          </div>
          <div className="setting-item">
            <label className="setting-label">Default Language</label>
            <select value={language} onChange={(e) => setLanguage(e.target.value)}>
              {languages.map(lang => (
                <option key={lang} value={lang}>
                  {lang.charAt(0).toUpperCase() + lang.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="main-content">
        {/* Video Section */}
        <div className="video-section">
          <div className="video-container">
            {localStreamRef.current ? (
              <video ref={localVideoRef} autoPlay muted playsInline />
            ) : (
              <div className="video-placeholder">
                {videoEnabled ? <Camera size={40} color="#64748b" /> : <CameraOff size={40} color="#64748b" />}
              </div>
            )}
            <div className="video-label">You</div>
          </div>

          <div className="video-container">
            <video ref={remoteVideoRef} autoPlay playsInline />
            <div className="video-label">Participant</div>
          </div>

          <div className="video-controls">
            <button 
              className={`icon-btn ${videoEnabled ? 'active' : 'danger'}`}
              onClick={toggleVideo}
              title={videoEnabled ? 'Turn off camera' : 'Turn on camera'}
            >
              {videoEnabled ? <Camera size={20} /> : <CameraOff size={20} />}
            </button>
            
            <button 
              className={`icon-btn ${audioEnabled ? 'active' : 'danger'}`}
              onClick={toggleAudio}
              title={audioEnabled ? 'Mute' : 'Unmute'}
            >
              {audioEnabled ? <Mic size={20} /> : <MicOff size={20} />}
            </button>
            
            <button 
              className={`icon-btn ${isScreenSharing ? 'active' : ''}`}
              onClick={toggleScreenShare}
              title="Share screen"
            >
              <MonitorUp size={20} />
            </button>

            <button 
              className="icon-btn"
              onClick={() => setIsFullscreen(!isFullscreen)}
              title="Fullscreen"
            >
              {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
            </button>
          </div>
        </div>

        {/* Editor Section */}
        <div className="editor-section">
          <div className="editor-header">
            <div className="mode-selector">
              <button 
                className={`mode-button ${mode === 'ide' ? 'active' : ''}`}
                onClick={() => setMode('ide')}
              >
                <Code size={16} />
                Code Editor
              </button>
              <button 
                className={`mode-button ${mode === 'document' ? 'active' : ''}`}
                onClick={() => setMode('document')}
              >
                <FileText size={16} />
                Plain Text
              </button>
            </div>

            <div className="language-selector">
              {mode === 'ide' && (
                <>
                  <select value={language} onChange={(e) => setLanguage(e.target.value)}>
                    {languages.map(lang => (
                      <option key={lang} value={lang}>
                        {lang.charAt(0).toUpperCase() + lang.slice(1)}
                      </option>
                    ))}
                  </select>
                  <button className="btn btn-primary" onClick={executeCode}>
                    <Play size={16} />
                    Run Code
                  </button>
                </>
              )}
            </div>
          </div>

          {mode === 'ide' ? (
            <MonacoEditor 
              value={code}
              onChange={setCode}
              language={language}
            />
          ) : (
            <div className="editor-container">
              <textarea
                className="text-editor"
                value={documentText}
                onChange={(e) => setDocumentText(e.target.value)}
                placeholder="Start writing your notes, solutions, or documentation here..."
              />
            </div>
          )}

          {mode === 'ide' && (
            <div className="output-section">
              <strong style={{ color: '#63b3ed' }}>Output:</strong>
              <pre style={{ marginTop: '8px', color: '#94a3b8' }}>{output || 'Click "Run Code" to see output...'}</pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InterviewPlatform;
