# 🎥 CodeInterview - Interview Platform

A modern, real-time interview platform with video calling and collaborative code editing.

## ✨ Features

- **WebRTC Video Calling** - High-quality peer-to-peer video communication
- **Real-time Code Collaboration** - Sync code changes instantly between participants
- **Multiple Programming Languages** - Support for JavaScript, Python, Java, C++, and more
- **Plain Text Mode** - Switch to document mode for notes and documentation
- **Screen Sharing** - Share your screen with participants
- **Interview Timer** - Configurable countdown timer for timed interviews
- **Room-based Sessions** - Unique shareable links for each interview
- **Code Execution** - Ready for Judge0 API integration

## 🚀 Quick Start

### Prerequisites

- Node.js 16+ and npm
- Modern web browser (Chrome recommended)

### Installation

1. **Clone the repository**
```bash
git clone <your-repo-url>
cd interview-platform
```

2. **Setup Backend**
```bash
cd backend
npm install
npm start
```

The signaling server will start on `http://localhost:3001`

3. **Setup Frontend** (in a new terminal)
```bash
cd frontend
npm install
cp .env.example .env
npm start
```

The app will open at `http://localhost:3000`

## 📁 Project Structure

```
interview-platform/
├── backend/                 # Node.js signaling server
│   ├── server.js           # WebSocket server with Socket.io
│   ├── package.json
│   └── README.md
│
├── frontend/               # React application
│   ├── src/
│   │   ├── components/
│   │   │   ├── InterviewPlatform.js    # Main component
│   │   │   └── InterviewPlatform.css   # Styles
│   │   ├── App.js
│   │   ├── App.css
│   │   ├── index.js
│   │   └── index.css
│   ├── public/
│   │   └── index.html
│   ├── package.json
│   └── README.md
│
└── README.md               # This file
```

## 🎯 How to Use

1. **Start an Interview**
   - Open the application
   - Click "Share Link" button
   - Copy and send the link to the candidate

2. **Join an Interview**
   - Open the shared link
   - Allow camera and microphone permissions
   - You're connected!

3. **During the Interview**
   - Use video controls to toggle camera/mic
   - Switch between Code Editor and Plain Text modes
   - Share your screen if needed
   - Set a timer before starting the interview
   - Write and run code collaboratively

## 🔧 Configuration

### Backend Configuration

Edit `backend/.env`:
```
PORT=3001
NODE_ENV=development
```

### Frontend Configuration

Edit `frontend/.env`:
```
REACT_APP_SIGNALING_SERVER=http://localhost:3001
```

## 🌐 Deployment

### Backend Deployment

**Heroku:**
```bash
cd backend
heroku create your-app-name
git push heroku main
```

**Railway:**
```bash
cd backend
railway init
railway up
```

### Frontend Deployment

**Vercel:**
```bash
cd frontend
vercel
```

**Netlify:**
```bash
cd frontend
npm run build
netlify deploy --prod
```

### Production Environment

For production, you'll need:

1. **HTTPS** - WebRTC requires secure connections
2. **TURN Server** - For NAT traversal (use Twilio, Xirsys, or self-host Coturn)
3. **Environment Variables** - Update signaling server URL

## 🔌 Judge0 Integration (Optional)

To enable real code execution:

1. Sign up for Judge0 API at [RapidAPI](https://rapidapi.com/judge0-official/api/judge0-ce)
2. Get your API key
3. Update the `executeCode` function in `InterviewPlatform.js`

Example:
```javascript
const JUDGE0_API = 'https://judge0-ce.p.rapidapi.com';
const RAPIDAPI_KEY = 'your-api-key-here';
```

## 🛠️ Technologies Used

- **Frontend**: React, Socket.io-client, Lucide React
- **Backend**: Node.js, Express, Socket.io
- **WebRTC**: Native browser APIs
- **Styling**: CSS3 with modern features

## 📝 Browser Compatibility

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

## 🤝 Contributing

Contributions are welcome! Feel free to:

- Report bugs
- Suggest features
- Submit pull requests

## 📄 License

MIT License - feel free to use this project for your own purposes.

## 🆘 Troubleshooting

### Video not working?
- Check browser permissions for camera/microphone
- Ensure you're using HTTPS (or localhost)
- Check if another application is using the camera

### Connection issues?
- Verify the signaling server is running
- Check firewall settings
- Ensure correct server URL in frontend `.env`

### Code not syncing?
- Check browser console for errors
- Verify WebSocket connection
- Refresh both participants' browsers

## 📧 Support

For issues or questions, please open an issue on GitHub.

---

Made with ❤️ for better technical interviews
