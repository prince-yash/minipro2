const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// In-memory state (no database)
const appState = {
  admin: null,
  users: {}, // { socketId: { name, role, streamActive } }
  chat: [],
  drawingEnabled: true,
  adminCode: 'teach123'
};

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Join room event
  socket.on('join_room', (data) => {
    const { name, adminCode } = data;
    
    // Check if user wants to be admin
    let role = 'student';
    if (adminCode === appState.adminCode && !appState.admin) {
      role = 'admin';
      appState.admin = socket.id;
    }

    // Add user to state
    appState.users[socket.id] = {
      name,
      role,
      streamActive: false
    };

    // Join the classroom room
    socket.join('classroom');

    // Send current state to new user
    socket.emit('join_success', {
      role,
      users: appState.users,
      chat: appState.chat,
      drawingEnabled: appState.drawingEnabled,
      isAdmin: role === 'admin'
    });

    // Notify all users about new user
    socket.to('classroom').emit('user_joined', {
      userId: socket.id,
      user: appState.users[socket.id]
    });

    console.log(`${name} joined as ${role}`);
  });

  // Set admin event (if no admin exists)
  socket.on('set_admin', (data) => {
    const { adminCode } = data;
    
    if (adminCode === appState.adminCode && !appState.admin) {
      appState.admin = socket.id;
      appState.users[socket.id].role = 'admin';

      socket.emit('admin_set', { isAdmin: true });
      socket.to('classroom').emit('new_admin', {
        userId: socket.id,
        user: appState.users[socket.id]
      });
    } else {
      socket.emit('admin_set', { isAdmin: false, error: 'Invalid code or admin already exists' });
    }
  });

  // WebRTC signaling
  socket.on('offer', (data) => {
    socket.to(data.to).emit('offer', {
      from: socket.id,
      offer: data.offer
    });
  });

  socket.on('answer', (data) => {
    socket.to(data.to).emit('answer', {
      from: socket.id,
      answer: data.answer
    });
  });

  socket.on('ice-candidate', (data) => {
    socket.to(data.to).emit('ice-candidate', {
      from: socket.id,
      candidate: data.candidate
    });
  });

  // Chat system
  socket.on('chat_message', (data) => {
    const { message } = data;
    const user = appState.users[socket.id];
    
    if (user) {
      const chatMessage = {
        id: Date.now().toString(),
        userId: socket.id,
        username: user.name,
        message,
        timestamp: new Date().toISOString(),
        role: user.role
      };

      appState.chat.push(chatMessage);
      io.to('classroom').emit('new_message', chatMessage);
    }
  });

  socket.on('delete_message', (data) => {
    const { messageId } = data;
    const user = appState.users[socket.id];

    // Only admin can delete messages
    if (user && user.role === 'admin') {
      appState.chat = appState.chat.filter(msg => msg.id !== messageId);
      io.to('classroom').emit('message_deleted', { messageId });
    }
  });

  // Whiteboard events
  socket.on('draw_data', (data) => {
    const user = appState.users[socket.id];
    
    // Check if drawing is enabled and user has permission
    if (appState.drawingEnabled || (user && user.role === 'admin')) {
      socket.to('classroom').emit('draw_data', {
        ...data,
        userId: socket.id
      });
    }
  });

  socket.on('clear_canvas', () => {
    const user = appState.users[socket.id];
    
    // Only admin can clear canvas
    if (user && user.role === 'admin') {
      io.to('classroom').emit('clear_canvas');
    }
  });

  socket.on('toggle_draw', (data) => {
    const { enabled } = data;
    const user = appState.users[socket.id];

    // Only admin can toggle drawing
    if (user && user.role === 'admin') {
      appState.drawingEnabled = enabled;
      io.to('classroom').emit('drawing_toggled', { enabled });
    }
  });

  // User stream status
  socket.on('stream_status', (data) => {
    const { streamActive } = data;
    const user = appState.users[socket.id];

    if (user) {
      user.streamActive = streamActive;
      socket.to('classroom').emit('user_stream_status', {
        userId: socket.id,
        streamActive
      });
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
    
    const user = appState.users[socket.id];
    if (user) {
      // If admin disconnects, end session for everyone
      if (user.role === 'admin') {
        io.to('classroom').emit('session_ended', { reason: 'Admin left the session' });
        
        // Reset app state
        appState.admin = null;
        appState.users = {};
        appState.chat = [];
        appState.drawingEnabled = true;
      } else {
        // Remove user and notify others
        delete appState.users[socket.id];
        socket.to('classroom').emit('user_left', { userId: socket.id });
      }
    }
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    users: Object.keys(appState.users).length,
    admin: appState.admin ? 'present' : 'none'
  });
});

// Get current state endpoint
app.get('/state', (req, res) => {
  res.json({
    userCount: Object.keys(appState.users).length,
    hasAdmin: !!appState.admin,
    chatMessages: appState.chat.length,
    drawingEnabled: appState.drawingEnabled
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 EduCanvas Live server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔐 Admin code: ${appState.adminCode}`);
});
