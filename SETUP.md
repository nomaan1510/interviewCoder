# 🚀 Quick Setup Guide

## Step 1: Install Dependencies

Open two terminal windows.

**Terminal 1 - Backend:**
```bash
cd backend
npm install
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm install
```

## Step 2: Start the Servers

**Terminal 1 - Backend:**
```bash
npm start
```
You should see:
```
🚀 Signaling server running on port 3001
📡 WebSocket ready for connections
```

**Terminal 2 - Frontend:**
```bash
npm start
```
The app will automatically open at `http://localhost:3000`

## Step 3: Test the Application

1. **In Browser 1:**
   - Click "Share Link"
   - Copy the interview link

2. **In Browser 2 (or Incognito):**
   - Paste the link
   - Both browsers should connect via video

3. **Test Features:**
   - Type in the code editor → should sync
   - Toggle camera/mic
   - Try screen sharing
   - Switch to Plain Text mode

## Common Issues

### Port Already in Use
If port 3001 or 3000 is already in use:

**Backend:** Edit `backend/.env` and change PORT
```bash
PORT=3002
```

**Frontend:** Update `frontend/.env`
```bash
REACT_APP_SIGNALING_SERVER=http://localhost:3002
```

### Camera Permission Denied
- Click the camera icon in browser address bar
- Allow camera and microphone access
- Refresh the page

### Cannot Connect to Server
- Make sure backend is running first
- Check firewall settings
- Verify the URL in `frontend/.env` matches your backend

## Production Deployment

### Backend (Heroku)
```bash
cd backend
heroku create your-app-name
git init
git add .
git commit -m "Initial commit"
git push heroku main
```

### Frontend (Vercel)
```bash
cd frontend
npm run build
vercel --prod
```

Don't forget to update `REACT_APP_SIGNALING_SERVER` in Vercel environment variables!

## Need Help?

Check the main README.md for detailed documentation.
