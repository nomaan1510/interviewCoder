# System Architecture

## Overview

The Interview Platform uses a client-server architecture with WebRTC for peer-to-peer video communication and Socket.io for signaling.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         Interview Platform                       │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────┐                              ┌──────────────────┐
│   Browser 1      │                              │   Browser 2      │
│  (Interviewer)   │                              │  (Candidate)     │
└──────────────────┘                              └──────────────────┘
        │                                                  │
        │ ┌──────────────────────────────────────────┐   │
        ├─┤    WebRTC P2P Connection (Video/Audio)   │───┤
        │ └──────────────────────────────────────────┘   │
        │                                                  │
        │              Socket.io (Signaling)              │
        ├──────────────────┬──────────────────────────────┤
        │                  │                              │
        ▼                  ▼                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Signaling Server                             │
│                    (Node.js + Socket.io)                         │
│                                                                   │
│  • Room Management                                               │
│  • WebRTC Signaling (SDP Offer/Answer, ICE)                     │
│  • Code Synchronization                                          │
│  • Document Synchronization                                      │
└─────────────────────────────────────────────────────────────────┘
```

## Component Breakdown

### Frontend (React)
```
src/
├── components/
│   ├── InterviewPlatform.js     # Main component
│   │   ├── Video Management
│   │   ├── WebRTC Connection
│   │   ├── Socket.io Client
│   │   ├── Code Editor
│   │   └── UI Controls
│   │
│   └── InterviewPlatform.css    # Styling
├── App.js                        # Root component
└── index.js                      # Entry point
```

### Backend (Node.js)
```
backend/
└── server.js
    ├── Express HTTP Server
    ├── Socket.io WebSocket Server
    ├── Room Management
    └── Event Handlers:
        ├── join-room
        ├── offer/answer
        ├── ice-candidate
        ├── code-update
        └── disconnect
```

## Data Flow

### 1. Connection Establishment

```
User 1                    Signaling Server              User 2
  │                              │                         │
  │─── join-room(roomId) ────────>                        │
  │<──── room-joined ────────────│                        │
  │                              │                         │
  │                              │<─── join-room(roomId) ──│
  │<──── user-joined ────────────┤──── room-joined ───────>│
  │                              │                         │
```

### 2. WebRTC Handshake

```
User 1                    Signaling Server              User 2
  │                              │                         │
  │─── offer ───────────────────>│                        │
  │                              │──── offer ─────────────>│
  │                              │                         │
  │                              │<──── answer ────────────│
  │<──── answer ─────────────────│                        │
  │                              │                         │
  │─── ice-candidate ───────────>│                        │
  │                              │──── ice-candidate ─────>│
  │                              │                         │
        [WebRTC P2P Connection Established]
```

### 3. Code Synchronization

```
User 1                    Signaling Server              User 2
  │                              │                         │
  │─── code-update ─────────────>│                        │
  │    { code, language }        │──── code-update ───────>│
  │                              │                         │
```

## Key Technologies

### WebRTC
- **RTCPeerConnection**: Manages peer-to-peer connection
- **getUserMedia**: Accesses camera and microphone
- **getDisplayMedia**: Screen sharing capability
- **ICE**: Network traversal and connectivity

### Socket.io
- **Rooms**: Isolated communication channels
- **Events**: Real-time bidirectional communication
- **Reconnection**: Automatic reconnection handling

### React
- **Hooks**: useState, useEffect, useRef
- **Components**: Modular UI architecture
- **Real-time Updates**: State management for live collaboration

## Security Considerations

1. **HTTPS Required**: WebRTC requires secure context in production
2. **TURN Server**: Needed for NAT traversal in production
3. **Room Validation**: Prevent unauthorized access
4. **Input Sanitization**: Validate all user inputs
5. **Rate Limiting**: Prevent abuse of signaling server

## Scalability

### Current Architecture
- Direct P2P connections
- Signaling server only for handshake
- Low server bandwidth usage

### Scaling Considerations
- Use SFU (Selective Forwarding Unit) for 3+ participants
- Load balance signaling servers
- Use Redis for distributed room management
- Implement connection pooling

## Performance Optimization

1. **Lazy Loading**: Load Monaco Editor on demand
2. **Code Splitting**: Separate vendor and app bundles
3. **WebRTC Quality**: Adaptive bitrate based on network
4. **Debouncing**: Throttle code sync events
5. **Connection Reuse**: Maintain persistent WebSocket

## Monitoring & Debugging

### Logs to Monitor
- Connection state changes
- ICE candidate gathering
- Room join/leave events
- WebSocket connection status

### Debug Tools
- Chrome DevTools → WebRTC Internals (chrome://webrtc-internals)
- Socket.io Admin UI
- Network tab for signaling messages
- Console for connection states
