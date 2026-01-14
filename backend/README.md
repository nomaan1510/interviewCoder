# Interview Platform - Backend

WebRTC signaling server for the interview platform.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Start the server:
```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

## Configuration

- Default port: 3001
- Can be changed via PORT environment variable

## API Endpoints

- `GET /health` - Server health check

## Socket Events

### Client → Server
- `join-room` - Join an interview room
- `offer` - Send WebRTC offer
- `answer` - Send WebRTC answer
- `ice-candidate` - Send ICE candidate
- `code-update` - Sync code changes
- `document-update` - Sync document changes
- `output-update` - Sync code execution output

### Server → Client
- `room-joined` - Room join confirmation
- `user-joined` - New user joined room
- `user-left` - User left room
- `offer` - Received WebRTC offer
- `answer` - Received WebRTC answer
- `ice-candidate` - Received ICE candidate
- `code-update` - Code changed by remote user
- `document-update` - Document changed by remote user
- `output-update` - Output updated by remote user

## Deployment

### Heroku
```bash
heroku create your-app-name
git push heroku main
```

### Railway
```bash
railway init
railway up
```

### DigitalOcean
Deploy as a Node.js app on App Platform.
