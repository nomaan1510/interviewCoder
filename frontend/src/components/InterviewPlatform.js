import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import io from "socket.io-client";
import {
  Camera,
  CameraOff,
  Mic,
  MicOff,
  MonitorUp,
  Code,
  FileText,
  Clock,
  Settings,
  Maximize2,
  Play,
  Copy,
  Check,
  Share2,
  PhoneOff,
  MessageSquare,
  Send,
  Minimize2,
  X,
} from "lucide-react";
import "./InterviewPlatform.css";

// Check backend status on mount


const SIGNALING_SERVER =
  process.env.REACT_APP_API_URL || "http://localhost:3001";

// Boilerplate code for all languages
const BOILERPLATE_CODE = {
  javascript: `// JavaScript
function main() {
  console.log("Hello, World!");
  
  // Example: Sum of two numbers
  const a = 5;
  const b = 3;
  console.log("Sum:", a + b);
}

main();`,

  python: `# Python
def main():
    print("Hello, World!")
    
    # Example: Sum of two numbers
    a = 5
    b = 3
    print(f"Sum: {a + b}")

if __name__ == "__main__":
    main()`,

  java: `// Java
public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
        
        // Example: Sum of two numbers
        int a = 5;
        int b = 3;
        System.out.println("Sum: " + (a + b));
    }
}`,

  cpp: `// C++
#include <iostream>
using namespace std;

int main() {
    cout << "Hello, World!" << endl;
    
    // Example: Sum of two numbers
    int a = 5;
    int b = 3;
    cout << "Sum: " << (a + b) << endl;
    
    return 0;
}`,

  c: `// C
#include <stdio.h>

int main() {
    printf("Hello, World!\\n");
    
    // Example: Sum of two numbers
    int a = 5;
    int b = 3;
    printf("Sum: %d\\n", a + b);
    
    return 0;
}`,

  csharp: `// C#
using System;

class Program {
    static void Main() {
        Console.WriteLine("Hello, World!");
        
        // Example: Sum of two numbers
        int a = 5;
        int b = 3;
        Console.WriteLine($"Sum: {a + b}");
    }
}`,

  go: `// Go
package main

import "fmt"

func main() {
    fmt.Println("Hello, World!")
    
    // Example: Sum of two numbers
    a := 5
    b := 3
    fmt.Printf("Sum: %d\\n", a + b)
}`,

  rust: `// Rust
fn main() {
    println!("Hello, World!");
    
    // Example: Sum of two numbers
    let a = 5;
    let b = 3;
    println!("Sum: {}", a + b);
}`,

  typescript: `// TypeScript
function main(): void {
    console.log("Hello, World!");
    
    // Example: Sum of two numbers
    const a: number = 5;
    const b: number = 3;
    console.log(\`Sum: \${a + b}\`);
}

main();`,

  ruby: `# Ruby
def main
  puts "Hello, World!"
  
  # Example: Sum of two numbers
  a = 5
  b = 3
  puts "Sum: #{a + b}"
end

main()`,

  php: `<?php
// PHP
function main() {
    echo "Hello, World!\\n";
    
    // Example: Sum of two numbers
    $a = 5;
    $b = 3;
    echo "Sum: " . ($a + $b) . "\\n";
}

main();
?>`,

  swift: `// Swift
import Foundation

func main() {
    print("Hello, World!")
    
    // Example: Sum of two numbers
    let a = 5
    let b = 3
    print("Sum: \\(a + b)")
}

main()`,

  kotlin: `// Kotlin
fun main() {
    println("Hello, World!")
    
    // Example: Sum of two numbers
    val a = 5
    val b = 3
    println("Sum: \${a + b}")
}`,
};

const InterviewPlatform = () => {
  // State management
  
  const [showBackendWarning, setShowBackendWarning] = useState(true);
  const [mode, setMode] = useState("ide");
  const [language, setLanguage] = useState("javascript");
  const [timeLimit, setTimeLimit] = useState(60);
  const [timeRemaining, setTimeRemaining] = useState(60 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showInputPanel, setShowInputPanel] = useState(false);
  const [customInput, setCustomInput] = useState("");
  const [output, setOutput] = useState("");
  const [roomId, setRoomId] = useState("");
  const [linkCopied, setLinkCopied] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState("disconnected");
  const [userRole, setUserRole] = useState(null);
  const [userName, setUserName] = useState("");
  const [showRoleModal, setShowRoleModal] = useState(true);
  const [showEndCallModal, setShowEndCallModal] = useState(false);
  

  // Chat state - FIXED: Use controlled state instead of defaultValue
  const [messages, setMessages] = useState([]);
  const [showChat, setShowChat] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [chatInput, setChatInput] = useState(""); // NEW: Controlled input

  // Code execution state
  const [isExecuting, setIsExecuting] = useState(false);

  // Refs for UNCONTROLLED components (this prevents focus loss!)
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const socketRef = useRef(null);
  const peerConnectionsRef = useRef(new Map());
  const screenStreamRef = useRef(null);
  const chatMessagesRef = useRef(null);
  const codeEditorRef = useRef(null);
  const documentEditorRef = useRef(null);

  // Track values without causing re-renders
  const isReceivingUpdate = useRef(false);
  const emitTimeoutRef = useRef(null);

  // Judge0 API configuration
  const JUDGE0_API = "https://judge0-ce.p.rapidapi.com";
  const JUDGE0_API_KEY = process.env.REACT_APP_JUDGE0_API_KEY || "";

  // Language ID mapping for Judge0
  const languageIds = {
    javascript: 63,
    python: 71,
    java: 62,
    cpp: 54,
    c: 50,
    csharp: 51,
    go: 60,
    rust: 73,
    typescript: 74,
    ruby: 72,
    php: 68,
    swift: 83,
    kotlin: 78,
  };

  const languages = [
    "javascript",
    "python",
    "java",
    "cpp",
    "c",
    "csharp",
    "go",
    "rust",
    "typescript",
    "ruby",
    "php",
    "swift",
    "kotlin",
  ];

  const iceServers = {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
    ],
  };

  const generateRoomId = () => {
    return (
      Math.random().toString(36).substring(2, 10) +
      Math.random().toString(36).substring(2, 10)
    );
  };

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    }
  }, [messages]);

  // Reset unread count when chat is opened
  useEffect(() => {
    if (showChat) {
      setUnreadCount(0);
    }
  }, [showChat]);

  // Initialize room and socket
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const roomFromUrl = urlParams.get("room");

    if (roomFromUrl) {
      setRoomId(roomFromUrl);
    } else {
      const newRoomId = generateRoomId();
      setRoomId(newRoomId);
      window.history.pushState({}, "", `?room=${newRoomId}`);
    }

    socketRef.current = io(SIGNALING_SERVER, {
      transports: ["websocket"],
      withCredentials: true,
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (emitTimeoutRef.current) {
        clearTimeout(emitTimeoutRef.current);
      }
    };
  }, []);

  // Setup socket event listeners
  useEffect(() => {
    if (!socketRef.current || !roomId) return;

    const socket = socketRef.current;

    const handleConnect = () => {
      console.log("Connected to signaling server");
      setConnectionStatus("connected");
    };

    const handleDisconnect = () => {
      console.log("Disconnected from signaling server");
      setConnectionStatus("disconnected");
    };

    const handleRoomJoined = async ({ roomId: joinedRoom, users }) => {
      console.log("Joined room:", joinedRoom, "with users:", users);
      setConnectionStatus("in-room");

      await startLocalVideo();

      for (const userId of users) {
        await createPeerConnection(userId, true);
      }
    };

    const handleUserJoined = async (userId) => {
      console.log("User joined:", userId);
      await createPeerConnection(userId, false);
    };

    const handleOffer = async ({ offer, from }) => {
      console.log("Received offer from:", from);
      const pc =
        peerConnectionsRef.current.get(from) ||
        (await createPeerConnection(from, false));

      try {
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        socket.emit("answer", {
          answer: answer,
          to: from,
        });
      } catch (error) {
        console.error("Error handling offer:", error);
      }
    };

    const handleAnswer = async ({ answer, from }) => {
      console.log("Received answer from:", from);
      const pc = peerConnectionsRef.current.get(from);
      if (pc) {
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(answer));
        } catch (error) {
          console.error("Error handling answer:", error);
        }
      }
    };

    const handleIceCandidate = async ({ candidate, from }) => {
      const pc = peerConnectionsRef.current.get(from);
      if (pc && candidate) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (error) {
          console.error("Error adding ICE candidate:", error);
        }
      }
    };

    const handleUserLeft = (userId) => {
      console.log("User left:", userId);
      const pc = peerConnectionsRef.current.get(userId);
      if (pc) {
        pc.close();
        peerConnectionsRef.current.delete(userId);
      }
    };

    const handleCodeUpdate = ({
      code: newCode,
      language: newLang,
      mode: newMode,
    }) => {
      if (isReceivingUpdate.current) return;

      isReceivingUpdate.current = true;

      // Update DOM directly without re-render
      if (
        codeEditorRef.current &&
        document.activeElement !== codeEditorRef.current
      ) {
        codeEditorRef.current.value = newCode;
      }

      setLanguage(newLang);
      setMode(newMode);

      setTimeout(() => {
        isReceivingUpdate.current = false;
      }, 100);
    };

    const handleDocumentUpdate = ({ text }) => {
      if (isReceivingUpdate.current) return;

      isReceivingUpdate.current = true;

      if (
        documentEditorRef.current &&
        document.activeElement !== documentEditorRef.current
      ) {
        documentEditorRef.current.value = text;
      }

      setTimeout(() => {
        isReceivingUpdate.current = false;
      }, 100);
    };

    const handleOutputUpdate = ({ output: newOutput }) => {
      setOutput(newOutput);
    };

    const handleChatMessage = ({
      message,
      senderId,
      senderRole,
      senderName,
      timestamp,
    }) => {
      console.log("Received chat message:", {
        message,
        senderId,
        senderRole,
        senderName,
      });

      const newMsg = {
        id: Date.now() + Math.random(),
        text: message,
        senderId,
        senderRole,
        senderName,
        timestamp,
        isOwn: senderId === socket.id,
      };

      setMessages((prev) => [...prev, newMsg]);

      if (senderId !== socket.id) {
        setUnreadCount((prev) => {
          const chatPanel = document.querySelector(".chat-panel");
          if (!chatPanel) {
            return prev + 1;
          }
          return prev;
        });
      }
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("room-joined", handleRoomJoined);
    socket.on("user-joined", handleUserJoined);
    socket.on("offer", handleOffer);
    socket.on("answer", handleAnswer);
    socket.on("ice-candidate", handleIceCandidate);
    socket.on("user-left", handleUserLeft);
    socket.on("code-update", handleCodeUpdate);
    socket.on("document-update", handleDocumentUpdate);
    socket.on("output-update", handleOutputUpdate);
    socket.on("chat-message", handleChatMessage);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("room-joined", handleRoomJoined);
      socket.off("user-joined", handleUserJoined);
      socket.off("offer", handleOffer);
      socket.off("answer", handleAnswer);
      socket.off("ice-candidate", handleIceCandidate);
      socket.off("user-left", handleUserLeft);
      socket.off("code-update", handleCodeUpdate);
      socket.off("document-update", handleDocumentUpdate);
      socket.off("output-update", handleOutputUpdate);
      socket.off("chat-message", handleChatMessage);
    };
  }, [roomId]);

  useEffect(() => {
    if (socketRef.current && roomId && connectionStatus === "connected") {
      joinRoom(roomId);
    }
  }, [roomId, connectionStatus]);

  useEffect(() => {
    let interval;
    if (isTimerRunning && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining((prev) => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timeRemaining]);

  // Update code editor when language changes
  useEffect(() => {
    if (codeEditorRef.current) {
      codeEditorRef.current.value = BOILERPLATE_CODE[language] || "";

      // Emit change
      if (socketRef.current && roomId && !isReceivingUpdate.current) {
        socketRef.current.emit("code-update", {
          roomId,
          code: codeEditorRef.current.value,
          language,
          mode,
        });
      }
    }
  }, [language]);

  

  const startLocalVideo = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      return stream;
    } catch (error) {
      console.error("Error accessing media devices:", error);
      alert("Unable to access camera/microphone. Please check permissions.");
    }
  };

  const createPeerConnection = async (userId, shouldCreateOffer) => {
    const pc = new RTCPeerConnection(iceServers);
    peerConnectionsRef.current.set(userId, pc);

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current);
      });
    }

    pc.onicecandidate = (event) => {
      if (event.candidate && socketRef.current) {
        socketRef.current.emit("ice-candidate", {
          candidate: event.candidate,
          to: userId,
        });
      }
    };

    pc.ontrack = (event) => {
      console.log("Received remote track from:", userId);
      if (remoteVideoRef.current && event.streams[0]) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    pc.onconnectionstatechange = () => {
      console.log("Connection state:", pc.connectionState);
    };

    if (shouldCreateOffer) {
      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        socketRef.current.emit("offer", {
          offer: offer,
          to: userId,
        });
      } catch (error) {
        console.error("Error creating offer:", error);
      }
    }

    return pc;
  };

  const joinRoom = (room) => {
    if (socketRef.current) {
      socketRef.current.emit("join-room", room);
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setVideoEnabled(videoTrack.enabled);
      }
    }
  };

  const toggleAudio = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setAudioEnabled(audioTrack.enabled);
      }
    }
  };

  const toggleScreenShare = async () => {
    if (!isScreenSharing) {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
        });

        screenStreamRef.current = screenStream;
        const videoTrack = screenStream.getVideoTracks()[0];

        peerConnectionsRef.current.forEach((pc) => {
          const sender = pc.getSenders().find((s) => s.track?.kind === "video");
          if (sender) {
            sender.replaceTrack(videoTrack);
          }
        });

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = screenStream;
        }

        setIsScreenSharing(true);

        videoTrack.onended = () => {
          stopScreenShare();
        };
      } catch (error) {
        console.error("Error sharing screen:", error);
      }
    } else {
      stopScreenShare();
    }
  };

  const stopScreenShare = () => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((track) => track.stop());
      screenStreamRef.current = null;
    }

    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];

      peerConnectionsRef.current.forEach((pc) => {
        const sender = pc.getSenders().find((s) => s.track?.kind === "video");
        if (sender && videoTrack) {
          sender.replaceTrack(videoTrack);
        }
      });

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = localStreamRef.current;
      }
    }

    setIsScreenSharing(false);
  };

  const confirmEndCall = () => {
    setShowEndCallModal(true);
  };

  const endCall = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }

    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((track) => track.stop());
      screenStreamRef.current = null;
    }

    peerConnectionsRef.current.forEach((pc) => {
      pc.close();
    });
    peerConnectionsRef.current.clear();

    if (socketRef.current) {
      socketRef.current.disconnect();
    }

    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }

    setConnectionStatus("disconnected");
    setVideoEnabled(true);
    setAudioEnabled(true);
    setIsScreenSharing(false);
    setShowEndCallModal(false);

    window.location.href = window.location.origin + window.location.pathname;
  };

  const createInterviewLink = () => {
    return `${window.location.origin}${window.location.pathname}?room=${roomId}`;
  };

  const copyLinkToClipboard = () => {
    const link = createInterviewLink();
    navigator.clipboard.writeText(link).then(() => {
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    });
  };

  // Debounced emit for code changes
  const emitCodeUpdate = useCallback(
    (newCode) => {
      if (emitTimeoutRef.current) {
        clearTimeout(emitTimeoutRef.current);
      }

      emitTimeoutRef.current = setTimeout(() => {
        if (socketRef.current && roomId && !isReceivingUpdate.current) {
          socketRef.current.emit("code-update", {
            roomId,
            code: newCode,
            language,
            mode,
          });
        }
      }, 300);
    },
    [roomId, language, mode]
  );

  const emitDocumentUpdate = useCallback(
    (newText) => {
      if (emitTimeoutRef.current) {
        clearTimeout(emitTimeoutRef.current);
      }

      emitTimeoutRef.current = setTimeout(() => {
        if (socketRef.current && roomId && !isReceivingUpdate.current) {
          socketRef.current.emit("document-update", {
            roomId,
            text: newText,
          });
        }
      }, 300);
    },
    [roomId]
  );

  // Handle code change - NO STATE UPDATE = NO RE-RENDER = NO FOCUS LOSS
  const handleCodeChange = (e) => {
    emitCodeUpdate(e.target.value);
  };

  const handleDocumentChange = (e) => {
    emitDocumentUpdate(e.target.value);
  };

  // FIXED: Improved error handling with detailed messages
  const executeCode = async () => {
    const code = codeEditorRef.current?.value || "";

    if (!code.trim()) {
      setOutput("⚠️ Error: No code to execute");
      return;
    }

    if (!JUDGE0_API_KEY) {
      const errorMsg =
        "⚠️ Judge0 API Key Missing!\n\n1. Go to: https://rapidapi.com/judge0-official/api/judge0-ce\n2. Sign up and get FREE API key\n3. Add to .env file:\n   REACT_APP_JUDGE0_API_KEY=your_key\n4. RESTART both server and React app";
      setOutput(errorMsg);

      if (socketRef.current && roomId) {
        socketRef.current.emit("output-update", {
          roomId,
          output: errorMsg,
        });
      }
      return;
    }

    setIsExecuting(true);
    const submittingMsg = "⏳ Submitting code...";
    setOutput(submittingMsg);

    if (socketRef.current && roomId) {
      socketRef.current.emit("output-update", {
        roomId,
        output: submittingMsg,
      });
    }

    try {
      const languageId = languageIds[language];

      if (!languageId) {
        throw new Error(`Language ${language} is not supported`);
      }

      console.log("Submitting to Judge0...");
      console.log("Language:", language, "ID:", languageId);
      console.log("Code length:", code.length);

      const submitResponse = await fetch(
        `${JUDGE0_API}/submissions?base64_encoded=true&wait=false`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-RapidAPI-Key": JUDGE0_API_KEY,
            "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com",
          },
          body: JSON.stringify({
            source_code: btoa(code),
            language_id: languageId,
            stdin: btoa(customInput),
          }),
        }
      );

      console.log("Submit response status:", submitResponse.status);

      if (!submitResponse.ok) {
        let errorText;
        try {
          const errorJson = await submitResponse.json();
          errorText = JSON.stringify(errorJson, null, 2);
        } catch (e) {
          errorText = await submitResponse.text();
        }

        console.error("Submit failed:", submitResponse.status, errorText);

        if (submitResponse.status === 403) {
          throw new Error(
            '🚫 403 Forbidden\n\nYour RapidAPI key is invalid or you are not subscribed to Judge0.\n\nSteps to fix:\n1. Go to https://rapidapi.com/judge0-official/api/judge0-ce\n2. Make sure you are LOGGED IN\n3. Click "Subscribe" and select the FREE Basic plan\n4. Copy your NEW API key from the Endpoints tab\n5. Update frontend/.env file with the new key\n6. RESTART React app (Ctrl+C then npm start)'
          );
        } else if (submitResponse.status === 429) {
          throw new Error(
            "⏱️ Rate Limit Exceeded\n\nYou have exceeded the free tier limit (50 requests/day).\n\nWait 24 hours or upgrade your plan at RapidAPI."
          );
        } else if (submitResponse.status === 401) {
          throw new Error(
            "🔑 Unauthorized\n\nYour API key is missing or invalid.\n\nCheck your .env file and make sure REACT_APP_JUDGE0_API_KEY is set correctly."
          );
        }

        throw new Error(
          `Submission failed (${submitResponse.status}):\n\n${errorText}`
        );
      }

      const submitData = await submitResponse.json();
      const token = submitData.token;

      console.log("Submission token:", token);

      const executingMessage = "⚙️ Code submitted. Waiting for results...";
      setOutput(executingMessage);

      if (socketRef.current && roomId) {
        socketRef.current.emit("output-update", {
          roomId,
          output: executingMessage,
        });
      }

      // Poll for results
      let attempts = 0;
      const maxAttempts = 20;

      while (attempts < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, 1000));

        const resultResponse = await fetch(
          `${JUDGE0_API}/submissions/${token}?base64_encoded=true`,
          {
            method: "GET",
            headers: {
              "X-RapidAPI-Key": JUDGE0_API_KEY,
              "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com",
            },
          }
        );

        if (!resultResponse.ok) {
          let errorText;
          try {
            const errorJson = await resultResponse.json();
            errorText = JSON.stringify(errorJson, null, 2);
          } catch (e) {
            errorText = await resultResponse.text();
          }
          console.error(
            "Result fetch failed:",
            resultResponse.status,
            errorText
          );
          throw new Error(
            `Failed to get results (${resultResponse.status}):\n${errorText}`
          );
        }

        const resultData = await resultResponse.json();

        // Helper function to decode base64 with UTF-8 support
        const decodeBase64 = (str) => {
          if (!str) return "";
          try {
            // Decode base64 to binary string, then decode UTF-8
            const binaryString = atob(str);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
              bytes[i] = binaryString.charCodeAt(i);
            }
            return new TextDecoder("utf-8").decode(bytes);
          } catch (e) {
            return str;
          }
        };

        // Decode base64 responses with UTF-8 support
        if (resultData.stdout)
          resultData.stdout = decodeBase64(resultData.stdout);
        if (resultData.stderr)
          resultData.stderr = decodeBase64(resultData.stderr);
        if (resultData.compile_output)
          resultData.compile_output = decodeBase64(resultData.compile_output);
        if (resultData.message)
          resultData.message = decodeBase64(resultData.message);

        console.log(
          "Attempt",
          attempts + 1,
          "- Status:",
          resultData.status.description,
          "(ID:",
          resultData.status.id + ")"
        );

        const progressMessage = `⏳ Executing... (${
          attempts + 1
        }/${maxAttempts})\nStatus: ${resultData.status.description}`;
        setOutput(progressMessage);

        if (socketRef.current && roomId) {
          socketRef.current.emit("output-update", {
            roomId,
            output: progressMessage,
          });
        }

        // Check if execution completed
        if (resultData.status.id > 2) {
          let newOutput = "";

          if (resultData.status.id === 3) {
            // Accepted - Success
            newOutput = `✅ Execution Successful\n\n`;
            if (resultData.stdout) {
              newOutput += `📤 Output:\n${resultData.stdout}\n`;
            } else {
              newOutput += `📤 Output:\n(No output)\n`;
            }
            if (resultData.stderr) {
              newOutput += `\n⚠️ Stderr:\n${resultData.stderr}\n`;
            }
            newOutput += `\n⏱️ Time: ${resultData.time}s | 💾 Memory: ${resultData.memory} KB`;
          } else if (resultData.status.id === 4) {
            // Wrong Answer
            newOutput = `❌ Wrong Answer\n\n${
              resultData.stdout || "(no output)"
            }`;
          } else if (resultData.status.id === 5) {
            // Time Limit Exceeded
            newOutput = `⏱️ Time Limit Exceeded\n\nYour code took too long to execute.`;
          } else if (resultData.status.id === 6) {
            // Compilation Error
            newOutput = `🔨 Compilation Error\n\n${
              resultData.compile_output ||
              resultData.stderr ||
              "Unknown compilation error"
            }`;

            if (
              resultData.compile_output &&
              resultData.compile_output.includes("expected")
            ) {
              newOutput +=
                "\n\n💡 Tip: Check for missing semicolons, brackets, or typos.";
            }
          } else if ([7, 8, 9].includes(resultData.status.id)) {
            // Runtime Errors
            const errorNames = {
              7: "Runtime Error (SIGSEGV - Segmentation Fault)",
              8: "Runtime Error (SIGXFSZ - Output Limit Exceeded)",
              9: "Runtime Error (SIGFPE - Floating Point Exception)",
            };
            newOutput = `❌ ${
              errorNames[resultData.status.id] || "Runtime Error"
            }\n\n`;
            newOutput +=
              resultData.stderr ||
              resultData.message ||
              "Your program crashed during execution.";

            if (resultData.status.id === 7) {
              newOutput +=
                "\n\n💡 Tip: Check for array out of bounds, null pointer dereference, or stack overflow.";
            }
          } else if (resultData.status.id === 10) {
            newOutput = `⏱️ Time Limit Exceeded\n\nExecution took too long.`;
          } else if (resultData.status.id === 11) {
            newOutput = `💾 Memory Limit Exceeded\n\nYour program used too much memory.`;
          } else if (resultData.status.id === 12) {
            newOutput = `🚫 Illegal System Call\n\nYour program tried to perform a restricted operation.`;
          } else if (resultData.status.id === 13) {
            newOutput = `⚠️ Judge0 Internal Error\n\n${
              resultData.message ||
              "The judge system encountered an error. Try again."
            }`;
          } else {
            newOutput = `Status: ${resultData.status.description}\n\n`;
            if (resultData.stdout)
              newOutput += `Output:\n${resultData.stdout}\n\n`;
            if (resultData.stderr)
              newOutput += `Stderr:\n${resultData.stderr}\n\n`;
            if (resultData.compile_output)
              newOutput += `Compile Output:\n${resultData.compile_output}`;
          }

          console.log(
            "Execution completed. Status:",
            resultData.status.description
          );
          setOutput(newOutput);

          if (socketRef.current && roomId) {
            socketRef.current.emit("output-update", {
              roomId,
              output: newOutput,
            });
          }

          break;
        }

        attempts++;
      }

      if (attempts >= maxAttempts) {
        throw new Error(
          "⏱️ Execution Timeout\n\nThe code is taking too long to execute. It may have an infinite loop or be waiting for input."
        );
      }
    } catch (error) {
      console.error("Execution error:", error);

      // FIXED: Create detailed error output
      let errorOutput = `❌ Execution Error\n\n`;

      if (error.message) {
        errorOutput += `${error.message}\n`;
      } else {
        errorOutput += `${error.toString()}\n`;
      }

      // Add stack trace for debugging if available
      if (error.stack && !error.message.includes("Judge0")) {
        errorOutput += `\n📋 Debug Info:\n${error.stack
          .split("\n")
          .slice(0, 3)
          .join("\n")}`;
      }

      // Add network error details if available
      if (error.name === "TypeError" && error.message.includes("fetch")) {
        errorOutput +=
          "\n\n🌐 Network Error: Could not connect to Judge0 API. Check your internet connection.";
      }

      setOutput(errorOutput);

      if (socketRef.current && roomId) {
        socketRef.current.emit("output-update", {
          roomId,
          output: errorOutput,
        });
      }
    } finally {
      setIsExecuting(false);
    }
  };

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, "0")}:${mins
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const startInterview = () => {
    setTimeRemaining(timeLimit * 60);
    setIsTimerRunning(true);
  };

  const selectRole = (role) => {
    setUserRole(role);
    setShowRoleModal(false);
  };

  // FIXED: Updated sendMessage to use controlled state
  const sendMessage = useCallback(() => {
    const message = chatInput.trim();

    if (message && socketRef.current && roomId) {
      const messageData = {
        roomId,
        message,
        senderRole: userRole,
        senderName:
          userName ||
          (userRole === "interviewer" ? "Interviewer" : "Candidate"),
        timestamp: new Date().toISOString(),
      };

      console.log("Sending message:", messageData);
      socketRef.current.emit("chat-message", messageData);

      setChatInput(""); // Clear controlled input
    }
  }, [chatInput, roomId, userRole, userName]);

  const handleChatKeyDown = useCallback(
    (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    },
    [sendMessage]
  );

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const getRoleLabel = (role) => {
    return role === "interviewer" ? "Interviewer" : "Candidate";
  };

  const getOppositeRole = () => {
    return userRole === "interviewer" ? "Candidate" : "Interviewer";
  };

  // FIXED: ChatPanel with controlled textarea wrapped in useMemo
  const ChatPanel = useMemo(() => {
    return (
      <div className="chat-panel">
        <div className="chat-header">
          <div className="chat-title">
            <MessageSquare size={18} />
            Chat
            {unreadCount > 0 && (
              <span className="unread-badge">{unreadCount}</span>
            )}
          </div>
          <button
            className="chat-toggle-btn"
            onClick={() => setShowChat(false)}
            title="Minimize chat"
            type="button"
          >
            <Minimize2 size={16} />
          </button>
        </div>

        <div className="chat-messages" ref={chatMessagesRef}>
          {messages.length === 0 ? (
            <div className="chat-empty">
              No messages yet. Start the conversation!
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`chat-message ${msg.isOwn ? "own" : "other"}`}
              >
                {!msg.isOwn && (
                  <div className="message-sender">
                    {msg.senderName ||
                      (msg.senderRole === "interviewer"
                        ? "Interviewer"
                        : "Candidate")}
                  </div>
                )}
                <div className="message-bubble">{msg.text}</div>
                <div className="message-timestamp">
                  {formatTimestamp(msg.timestamp)}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="chat-input-container">
          <textarea
            className="chat-input"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={handleChatKeyDown}
            placeholder="Type a message..."
            rows={1}
          />
          <button
            className="chat-send-btn"
            onClick={sendMessage}
            title="Send message"
            type="button"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    );
  }, [messages, unreadCount, chatInput, handleChatKeyDown, sendMessage]);

  return (
    <div className="interview-platform">
    {showBackendWarning && (
  <div className="modal-overlay" style={{ zIndex: 9999 }}>
    <div className="modal" style={{ maxWidth: '450px', textAlign: 'center' }}>
      <div style={{ 
        fontSize: '48px',
        marginBottom: '20px'
      }}>
        ⚠️
      </div>
      <div className="modal-header">Backend Wake-up Notice</div>
      <div className="modal-description" style={{ 
        fontSize: '15px',
        lineHeight: '1.6',
        marginBottom: '20px',
        color: '#e8eaed'
      }}>
        Our backend server is hosted on Render's free tier and may be sleeping. 
        <br/><br/>
        <strong style={{ color: '#63b3ed' }}>First-time loading may take 30-60 seconds.</strong>
        <br/><br/>
        Please be patient while the server wakes up. Thank you for your understanding! 🙏
      </div>
      <button 
        className="btn btn-primary" 
        onClick={() => setShowBackendWarning(false)}
        style={{ 
          width: '100%',
          justifyContent: 'center',
          fontSize: '16px',
          padding: '14px'
        }}
      >
        OK, I Understand
      </button>
    </div>
  </div>
)}
      {showRoleModal && (
        <div className="modal-overlay">
          <div className="modal role-modal">
            <div className="modal-header">Welcome to CodeInterview</div>
            <div className="modal-description">
              Please select your role to continue
            </div>
            <div className="role-buttons">
              <button
                className="role-btn interviewer-btn"
                onClick={() => selectRole("interviewer")}
              >
                <div className="role-icon">👔</div>
                <div className="role-title">Interviewer</div>
                <div className="role-desc">
                  Watch candidate's screen and conduct interview
                </div>
              </button>
              <button
                className="role-btn candidate-btn"
                onClick={() => selectRole("candidate")}
              >
                <div className="role-icon">💻</div>
                <div className="role-title">Candidate</div>
                <div className="role-desc">Write code and solve problems</div>
              </button>
            </div>
          </div>
        </div>
      )}

      {showEndCallModal && (
        <div className="modal-overlay">
          <div className="modal end-call-modal">
            <div className="end-call-icon">
              <PhoneOff size={48} />
            </div>
            <div className="modal-header">End Interview?</div>
            <div className="modal-description">
              Are you sure you want to end this interview session? This action
              cannot be undone.
            </div>
            <div className="modal-actions">
              <button
                className="btn btn-secondary"
                onClick={() => setShowEndCallModal(false)}
              >
                Cancel
              </button>
              <button className="btn btn-danger" onClick={endCall}>
                <PhoneOff size={18} />
                End Interview
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="header">
        <div className="logo">⚡ CodeInterview</div>

        <div className="timer-control">
          <div
            className="timer-display"
            style={{
              color: timeRemaining < 300 ? "#ef4444" : "#63b3ed",
            }}
          >
            {formatTime(timeRemaining)}
          </div>
          {!isTimerRunning && (
            <button className="btn btn-primary" onClick={startInterview}>
              <Clock size={18} />
              Start Interview
            </button>
          )}
        </div>

        <div className="controls">
          <div className={`status-indicator ${connectionStatus}`}>
            {connectionStatus === "in-room"
              ? "🟢 Connected"
              : connectionStatus === "connected"
              ? "🟡 Joining..."
              : "🔴 Disconnected"}
          </div>
          <button
            className="btn btn-primary chat-btn"
            onClick={() => setShowChat(!showChat)}
            title={showChat ? "Hide chat" : "Show chat"}
          >
            <MessageSquare size={18} />
            {!showChat && unreadCount > 0 && (
              <span className="unread-badge">{unreadCount}</span>
            )}
          </button>
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
            onClick={() => setShowInputPanel(!showInputPanel)}
            title="Custom Input"
          >
            <FileText size={20} />
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

      {showShareModal && (
        <div className="modal-overlay" onClick={() => setShowShareModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">Share Interview Link</div>
            <div className="modal-description">
              Share this link with the {getOppositeRole().toLowerCase()} to join
              the interview
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
              <button
                className="btn btn-secondary"
                onClick={() => setShowShareModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {showSettings && (
        <div className="settings-panel">
          <div className="settings-header">
            <span>Interview Settings</span>
            {!JUDGE0_API_KEY && (
              <span style={{ color: "#ef4444", fontSize: "12px" }}>
                ⚠️ API Key Missing
              </span>
            )}
          </div>
          <div className="setting-item">
            <label className="setting-label">Time Limit (minutes)</label>
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <input
                type="number"
                value={timeLimit}
                onChange={(e) => setTimeLimit(parseInt(e.target.value) || 60)}
                min="1"
                max="180"
                style={{ flex: 1 }}
              />
              <button
                className="btn btn-primary"
                onClick={() => {
                  setTimeRemaining(timeLimit * 60);
                  setIsTimerRunning(false);
                }}
                style={{ padding: "8px 16px", fontSize: "14px" }}
              >
                Apply
              </button>
            </div>
          </div>
          <div className="setting-item">
            <label className="setting-label">Default Language</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
            >
              {languages.map((lang) => (
                <option key={lang} value={lang}>
                  {lang.charAt(0).toUpperCase() + lang.slice(1)}
                </option>
              ))}
            </select>
          </div>
          <div className="setting-item">
            <label className="setting-label">Room ID</label>
            <input type="text" value={roomId} readOnly />
          </div>
          <div className="setting-item">
            <label className="setting-label">Your Name</label>
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="Enter your name (optional)"
            />
          </div>
          <div className="setting-item">
            <label className="setting-label">Your Role</label>
            <input type="text" value={getRoleLabel(userRole)} readOnly />
          </div>
          <div className="setting-item">
            <label className="setting-label">API Key Status</label>
            <input
              type="text"
              value={
                JUDGE0_API_KEY
                  ? `Configured (${JUDGE0_API_KEY.substring(0, 10)}...)`
                  : "NOT CONFIGURED"
              }
              readOnly
              style={{ color: JUDGE0_API_KEY ? "#0a0" : "#f00" }}
            />
          </div>
        </div>
      )}

      {showInputPanel && (
        <div className="settings-panel" style={{ right: "140px" }}>
          <div className="settings-header">Custom Input</div>
          <div className="setting-item">
            <label className="setting-label">
              Enter input for your program (optional)
            </label>
            <textarea
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              placeholder="Enter input here... (e.g., numbers, text)"
              style={{
                width: "100%",
                minHeight: "200px",
                padding: "10px",
                background: "rgba(0, 0, 0, 0.3)",
                border: "1px solid rgba(99, 179, 237, 0.3)",
                borderRadius: "8px",
                color: "#e8eaed",
                fontSize: "13px",
                fontFamily: "Consolas, Monaco, monospace",
                resize: "vertical",
              }}
            />
          </div>
          <div style={{ fontSize: "12px", color: "#94a3b8", marginTop: "8px" }}>
            💡 Tip: Each line will be treated as separate input
          </div>
        </div>
      )}

      <div className="main-content">
        {userRole === "interviewer" ? (
          <>
            <div className="interviewer-view">
              <div className="large-video-container">
                <video ref={remoteVideoRef} autoPlay playsInline />
                <div className="video-label">Candidate</div>
              </div>
              <div className="small-video-container">
                <video ref={localVideoRef} autoPlay muted playsInline />
                <div className="video-label">You</div>
              </div>
              <div className="interviewer-controls">
                <button
                  className={`icon-btn ${videoEnabled ? "active" : "danger"}`}
                  onClick={toggleVideo}
                  title={videoEnabled ? "Turn off camera" : "Turn on camera"}
                >
                  {videoEnabled ? (
                    <Camera size={20} />
                  ) : (
                    <CameraOff size={20} />
                  )}
                </button>

                <button
                  className={`icon-btn ${audioEnabled ? "active" : "danger"}`}
                  onClick={toggleAudio}
                  title={audioEnabled ? "Mute" : "Unmute"}
                >
                  {audioEnabled ? <Mic size={20} /> : <MicOff size={20} />}
                </button>

                <button
                  className={`icon-btn ${isScreenSharing ? "active" : ""}`}
                  onClick={toggleScreenShare}
                  title="Share screen"
                >
                  <MonitorUp size={20} />
                </button>

                <button
                  className="icon-btn"
                  onClick={() => {
                    if (document.fullscreenElement) {
                      document.exitFullscreen();
                    } else {
                      document.documentElement.requestFullscreen();
                    }
                  }}
                  title="Fullscreen"
                >
                  <Maximize2 size={20} />
                </button>

                <button
                  className="icon-btn end-call-btn"
                  onClick={confirmEndCall}
                  title="End Call"
                >
                  <PhoneOff size={20} />
                </button>
              </div>
            </div>
            {showChat && ChatPanel}
          </>
        ) : (
          <>
            <div className="video-section">
              <div className="video-container">
                <video ref={localVideoRef} autoPlay muted playsInline />
                <div className="video-label">
                  You {isScreenSharing && "(Sharing)"}
                </div>
              </div>

              <div className="video-container">
                <video ref={remoteVideoRef} autoPlay playsInline />
                <div className="video-label">Interviewer</div>
              </div>

              <div className="video-controls">
                <button
                  className={`icon-btn ${videoEnabled ? "active" : "danger"}`}
                  onClick={toggleVideo}
                  title={videoEnabled ? "Turn off camera" : "Turn on camera"}
                >
                  {videoEnabled ? (
                    <Camera size={20} />
                  ) : (
                    <CameraOff size={20} />
                  )}
                </button>

                <button
                  className={`icon-btn ${audioEnabled ? "active" : "danger"}`}
                  onClick={toggleAudio}
                  title={audioEnabled ? "Mute" : "Unmute"}
                >
                  {audioEnabled ? <Mic size={20} /> : <MicOff size={20} />}
                </button>

                <button
                  className={`icon-btn ${isScreenSharing ? "active" : ""}`}
                  onClick={toggleScreenShare}
                  title="Share screen"
                >
                  <MonitorUp size={20} />
                </button>

                <button
                  className="icon-btn"
                  onClick={() => {
                    if (document.fullscreenElement) {
                      document.exitFullscreen();
                    } else {
                      document.documentElement.requestFullscreen();
                    }
                  }}
                  title="Fullscreen"
                >
                  <Maximize2 size={20} />
                </button>

                <button
                  className="icon-btn end-call-btn"
                  onClick={confirmEndCall}
                  title="End Call"
                >
                  <PhoneOff size={20} />
                </button>
              </div>
            </div>

            <div className="editor-section">
              <div className="editor-header">
                <div className="mode-selector">
                  <button
                    className={`mode-button ${mode === "ide" ? "active" : ""}`}
                    onClick={() => setMode("ide")}
                  >
                    <Code size={16} />
                    Code Editor
                  </button>
                  <button
                    className={`mode-button ${
                      mode === "document" ? "active" : ""
                    }`}
                    onClick={() => setMode("document")}
                  >
                    <FileText size={16} />
                    Plain Text
                  </button>
                </div>

                <div className="language-selector">
                  {mode === "ide" && (
                    <>
                      <select
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                      >
                        {languages.map((lang) => (
                          <option key={lang} value={lang}>
                            {lang.charAt(0).toUpperCase() + lang.slice(1)}
                          </option>
                        ))}
                      </select>
                      <button
                        className="btn btn-primary"
                        onClick={executeCode}
                        disabled={isExecuting}
                      >
                        <Play size={16} />
                        {isExecuting ? "Executing..." : "Run Code"}
                      </button>
                    </>
                  )}
                </div>
              </div>

              {mode === "ide" ? (
                <div className="editor-container">
                  <textarea
                    ref={codeEditorRef}
                    className="code-editor"
                    onChange={handleCodeChange}
                    spellCheck="false"
                    placeholder={`// Write your ${language} code here...`}
                    defaultValue={BOILERPLATE_CODE[language]}
                  />
                </div>
              ) : (
                <div className="editor-container">
                  <textarea
                    ref={documentEditorRef}
                    className="text-editor"
                    onChange={handleDocumentChange}
                    placeholder="Start writing your notes..."
                    defaultValue=""
                  />
                </div>
              )}

              {mode === "ide" && (
                <div className="output-section">
                  <strong style={{ color: "#63b3ed" }}>Output:</strong>
                  <pre
                    style={{
                      marginTop: "8px",
                      color: "#94a3b8",
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {output || 'Click "Run Code" to see output...'}
                  </pre>
                </div>
              )}
            </div>

            {showChat && ChatPanel}
          </>
        )}
      </div>
    </div>
  );
};

export default InterviewPlatform;
