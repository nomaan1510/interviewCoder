# Interview Platform - Frontend

React application for the interview platform with video calling and collaborative coding.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create environment file:
```bash
cp .env.example .env
```

3. Update `.env` with your backend URL:
```
REACT_APP_SIGNALING_SERVER=http://localhost:3001
```

4. Start the development server:
```bash
npm start
```

The app will open at `http://localhost:3000`

## Features

- ✅ WebRTC video calling
- ✅ Real-time code collaboration
- ✅ Multiple programming languages
- ✅ Plain text document mode
- ✅ Screen sharing
- ✅ Interview timer
- ✅ Room-based sessions with shareable links

## Build for Production

```bash
npm run build
```

This creates an optimized production build in the `build` folder.

## Environment Variables

- `REACT_APP_SIGNALING_SERVER` - WebSocket server URL for signaling

## Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge

WebRTC requires HTTPS in production (except localhost).

## Deployment

### Vercel
```bash
vercel
```

### Netlify
```bash
netlify deploy --prod
```

### GitHub Pages
```bash
npm run build
# Deploy the build folder
```

Make sure to update the signaling server URL in your environment variables for production.
