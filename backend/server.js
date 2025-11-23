const express = require('express');
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const socketIo = require('socket.io');
const cors = require('cors');
const { ExpressPeerServer } = require('peer');
const { register, login, verifyToken, getProfile } = require('./auth');

const app = express();

// Determine if we should use HTTPS (development) or HTTP (production/Render)
const useHttps = process.env.NODE_ENV !== 'production' && process.env.USE_HTTPS !== 'false';
let server;

if (useHttps) {
  // SSL certificate configuration for development
  const certsPath = path.join(__dirname, '..', 'certs');
  const keyPath = path.join(certsPath, 'key.pem');
  const certPath = path.join(certsPath, 'cert.pem');
  
  // Check if certificates exist
  if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
    const sslOptions = {
      key: fs.readFileSync(keyPath),
      cert: fs.readFileSync(certPath)
    };
    server = https.createServer(sslOptions, app);
    console.log('🔒 Using HTTPS for development');
  } else {
    console.log('⚠️  SSL certificates not found, falling back to HTTP');
    server = http.createServer(app);
  }
} else {
  // Use HTTP for production (Render handles SSL termination)
  server = http.createServer(app);
  console.log('🌐 Using HTTP for production (SSL handled by load balancer)');
}
const io = socketIo(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? [process.env.FRONTEND_URL, process.env.RENDER_EXTERNAL_URL].filter(Boolean)
      : (origin, callback) => callback(null, true), // Allow any origin in development
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Middleware
app.use(cors({ 
  origin: process.env.NODE_ENV === 'production' 
    ? [process.env.FRONTEND_URL, process.env.RENDER_EXTERNAL_URL].filter(Boolean)
    : true, // Allow any origin in development
  credentials: true 
}));
app.use(express.json());

// Trust proxy (required for Render)
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// In-memory state (no database)
const appState = {
  admin: null,
  users: {}, // { socketId: { name, role, streamActive, canDraw, inVideoCall, peerId } }
  chat: [],
  drawingEnabled: true, // global toggle (default: true)
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

    // Add user to state (everyone can draw by default)
    appState.users[socket.id] = {
      name,
      role,
      streamActive: false,
      canDraw: true,
      inVideoCall: false,
      peerId: null
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

  // Jitsi Meet handles all WebRTC signaling internally
  // No need for manual WebRTC signaling anymore

  // PeerJS video conference events
  // New peer announces readiness and receives list of existing peers
  socket.on('peer_ready', (data) => {
    const { peerId } = data;
    const user = appState.users[socket.id];
    if (user) {
      // Prevent duplicate peer registrations
      if (user.peerId === peerId) {
        console.log(`${user.name} already registered with peer ID: ${peerId}`);
        return;
      }
      
      // If user already has a different peerId, they're reconnecting
      if (user.peerId) {
        console.log(`${user.name} changing peer ID from ${user.peerId} to ${peerId}`);
      }
      
      user.inVideoCall = true;
      user.peerId = peerId;

      // Send list of current peers to this user only
      const peers = Object.entries(appState.users)
        .filter(([id, u]) => id !== socket.id && !!u.peerId && u.peerId !== peerId)
        .map(([id, u]) => ({ peerId: u.peerId, userName: u.name, userRole: u.role }));

      socket.emit('peers_in_room', { peers });

      // Notify others about this join (only if it's a new peer)
      socket.to('classroom').emit('peer_joined', {
        peerId,
        userName: user.name,
        userRole: user.role
      });

      console.log(`${user.name} is ready with peer ID: ${peerId}. Informing ${peers.length} peers.`);
    }
  });

  // Clean up duplicate peer IDs from different users
  socket.on('peer_left', (data) => {
    const { peerId } = data;
    const user = appState.users[socket.id];
    if (user && user.peerId === peerId) {
      user.inVideoCall = false;
      user.peerId = null;
      socket.to('classroom').emit('peer_left', { peerId });
      console.log(`Peer left video conference: ${peerId}`);
    }
  });

  // Back-compat: explicit joined event (optional from client)
  socket.on('peer_joined', (data) => {
    const { peerId, userName, userRole } = data;
    const user = appState.users[socket.id];
    if (user) {
      user.inVideoCall = true;
      user.peerId = peerId;
      socket.to('classroom').emit('peer_joined', { peerId, userName, userRole });
      console.log(`${userName} joined video conference with peer ID: ${peerId}`);
    }
  });



  // Handle user leaving session manually
  socket.on('leave_session', () => {
    console.log(`User ${socket.id} leaving session manually`);
    const user = appState.users[socket.id];
    
    if (user) {
      // If admin leaves, end session for everyone
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
    
    socket.disconnect();
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
    
    // Allow admin always; others only if global drawing is enabled and user is allowed
    if (user && (user.role === 'admin' || (appState.drawingEnabled && user.canDraw))) {
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

    // Only admin can toggle global drawing
    if (user && user.role === 'admin') {
      appState.drawingEnabled = enabled;
      io.to('classroom').emit('drawing_toggled', { enabled });
    }
  });

  // Admin: set individual user's draw permission
  socket.on('set_user_draw', (data) => {
    const { targetUserId, canDraw } = data;
    const user = appState.users[socket.id];

    if (user && user.role === 'admin' && appState.users[targetUserId]) {
      appState.users[targetUserId].canDraw = !!canDraw;
      io.to('classroom').emit('user_updated', { userId: targetUserId, user: appState.users[targetUserId] });
    }
  });

  // Admin: kick a user
  socket.on('kick_user', (data) => {
    const { targetUserId } = data;
    const user = appState.users[socket.id];
    if (user && user.role === 'admin') {
      const targetSocket = io.sockets.sockets.get(targetUserId);
      if (targetSocket) {
        try {
          // Inform the user before disconnecting
          targetSocket.emit('kicked', { reason: 'Removed by admin' });
        } catch (e) {
          console.log('Failed to emit kicked to target:', e);
        }
        setTimeout(() => {
          targetSocket.disconnect(true);
        }, 100);
      } else {
        // If socket not found, ensure state is cleaned
        if (appState.users[targetUserId]) {
          delete appState.users[targetUserId];
          io.to('classroom').emit('user_left', { userId: targetUserId });
        }
      }
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
      // If user was in video call, notify peers of peer_left
      if (user.peerId) {
        socket.to('classroom').emit('peer_left', { peerId: user.peerId });
      }

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

// Authentication routes
app.post('/api/auth/register', register);
app.post('/api/auth/login', login);
app.get('/api/auth/profile', verifyToken, getProfile);

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

// Attach PeerJS to the server
const peerServer = ExpressPeerServer(server, { 
  path: '/',
  debug: process.env.NODE_ENV !== 'production'
});
app.use('/peerjs', peerServer);

// Graceful shutdown handling
const shutdown = (signal) => {
  console.log(`${signal} received, shutting down gracefully`);
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

server.listen(PORT, '0.0.0.0', () => {
  const protocol = useHttps ? 'https' : 'http';
  const host = process.env.RENDER_EXTERNAL_URL || `${protocol}://localhost:${PORT}`;
  
  console.log(`🚀 EduCanvas Live server running on port ${PORT}`);
  console.log(`📹 PeerJS signaling available at ${host}/peerjs`);
  console.log(`📊 Health check: ${host}/health`);
  console.log(`🔐 Admin code: ${appState.adminCode}`);
  
  if (useHttps) {
    console.log(`⚠️  Note: Accept self-signed certificate in browser`);
  }
  
  if (process.env.NODE_ENV === 'production') {
    console.log(`🌐 External URL: ${process.env.RENDER_EXTERNAL_URL}`);
  }
});
