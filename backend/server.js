const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);


const allowedOrigins = [
  "http://localhost:3000",
  "https://nomaan-interviewcoder.netlify.app"
];

app.use(cors({
  origin: allowedOrigins,
  methods: ["GET", "POST"],
  credentials: true
}));

app.use(express.json());

const io = socketIo(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true
  }
});

app.use(cors());
app.use(express.json());

const rooms = new Map();

io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  socket.on('join-room', (roomId) => {
    socket.join(roomId);
    
    if (!rooms.has(roomId)) {
      rooms.set(roomId, new Set());
    }
    
    const usersInRoom = Array.from(rooms.get(roomId));
    rooms.get(roomId).add(socket.id);
    
    socket.emit('room-joined', { 
      roomId, 
      users: usersInRoom 
    });
    
    socket.to(roomId).emit('user-joined', socket.id);
    
    console.log(`User ${socket.id} joined room ${roomId}`);
  });

  socket.on('offer', ({ offer, to }) => {
    console.log(`Sending offer from ${socket.id} to ${to}`);
    io.to(to).emit('offer', { 
      offer, 
      from: socket.id 
    });
  });

  socket.on('answer', ({ answer, to }) => {
    console.log(`Sending answer from ${socket.id} to ${to}`);
    io.to(to).emit('answer', { 
      answer, 
      from: socket.id 
    });
  });

  socket.on('ice-candidate', ({ candidate, to }) => {
    io.to(to).emit('ice-candidate', { 
      candidate, 
      from: socket.id 
    });
  });

  socket.on('code-update', ({ roomId, code, language, mode }) => {
    socket.to(roomId).emit('code-update', { 
      code, 
      language, 
      mode 
    });
  });

  socket.on('document-update', ({ roomId, text }) => {
    socket.to(roomId).emit('document-update', { 
      text 
    });
  });

  socket.on('output-update', ({ roomId, output }) => {
    socket.to(roomId).emit('output-update', { 
      output 
    });
  });

  socket.on('chat-message', ({ roomId, message, senderRole, senderName, timestamp }) => {
    console.log(`Chat message in room ${roomId} from ${socket.id}:`, message);
    
    // Broadcast to all users in the room including sender
    io.to(roomId).emit('chat-message', {
      message,
      senderId: socket.id,
      senderRole,
      senderName,
      timestamp: timestamp || new Date().toISOString()
    });
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    
    rooms.forEach((users, roomId) => {
      if (users.has(socket.id)) {
        users.delete(socket.id);
        socket.to(roomId).emit('user-left', socket.id);
        
        if (users.size === 0) {
          rooms.delete(roomId);
        }
      }
    });
  });
});

const PORT = process.env.PORT || 3001;

app.get("/", (req, res) => {
  res.send("Signaling server is running 🚀");
});

// Health check endpoint for backend wake-up detection


server.listen(PORT, () => {
  console.log(`Signaling server running on port ${PORT}`);
});