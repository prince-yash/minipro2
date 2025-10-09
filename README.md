# EduCanvas Live 🎓

A lightweight, real-time collaborative teaching platform featuring a shared whiteboard, chat system, and video conferencing capabilities. Perfect for interactive online learning sessions!

## ✨ Features

- 🎨 **Real-time Whiteboard**: Collaborative drawing with color picker, brush size control, and instant synchronization
- 💬 **Live Chat**: Instant messaging with admin moderation capabilities
- 👥 **User Management**: Simple admin/student role system with secret code authentication
- 🎯 **No Database Required**: Everything runs in memory - perfect for temporary sessions
- 📱 **Responsive Design**: Works seamlessly on desktop and mobile devices
- ⚡ **Real-time Everything**: Powered by Socket.IO for instant updates

## 🏗️ Tech Stack

**Frontend:**
- React.js with TypeScript
- Tailwind CSS for styling
- Socket.IO client for real-time communication

**Backend:**
- Node.js with Express
- Socket.IO for WebSocket communication
- In-memory state management (no database)

## 🚀 Quick Start

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. **Clone and navigate to the project:**
   ```bash
   cd /home/yash/projects/educanvas-live
   ```

2. **Install all dependencies:**
   ```bash
   npm run install-all
   ```

3. **Start the development servers:**
   ```bash
   npm run dev
   ```

This will start:
- Backend server on http://localhost:5000
- Frontend development server on http://localhost:3000

### Alternative: Start servers individually

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm start
```

## 🎮 How to Use

### For Teachers (Admin)

1. Open http://localhost:3000 in your browser
2. Enter your name
3. Check "I want to be the teacher/admin"
4. Enter the admin code: `teach123`
5. Click "Join Classroom"

**Admin Powers:**
- Toggle student drawing permissions on/off
- Clear the whiteboard for everyone
- Delete any chat message
- When admin leaves, the session ends for everyone

### For Students

1. Open http://localhost:3000 in your browser
2. Enter your name
3. Click "Join Classroom" (leave admin checkbox unchecked)

**Student Capabilities:**
- Draw on whiteboard (when enabled by admin)
- Participate in chat
- View all participants

## 🎯 Core Functionality

### Admin Access System
- **Admin Code**: `teach123` (hardcoded, change in `backend/server.js` if needed)
- Only the **first person** with the correct code becomes admin
- If admin disconnects, all users are kicked out and session resets

### Whiteboard Features
- **Drawing Tools**: Freehand drawing with customizable colors and brush sizes
- **Real-time Sync**: Every stroke appears instantly for all users
- **Admin Controls**: 
  - Toggle drawing permissions for students
  - Clear entire canvas
- **Permissions**: Admin can always draw, students only when enabled

### Chat System
- **Real-time Messaging**: Instant message delivery via Socket.IO
- **User Identification**: Messages show username and role (teacher/student)
- **Timestamps**: Each message includes time sent
- **Admin Moderation**: Teachers can delete any message
- **Emoji Support**: Teacher messages show 👨‍🏫, student messages show 👨‍🎓

### Session Management
- **Temporary Sessions**: Everything resets when server restarts
- **Auto-cleanup**: Users automatically removed when they disconnect
- **Session End**: When admin leaves, session ends for everyone

## 🔧 Configuration

### Changing the Admin Code

Edit `backend/server.js` line 25:
```javascript
adminCode: 'your-new-secret-code'
```

### Changing Ports

**Backend Port** (default: 5000):
Edit `backend/server.js` line 232:
```javascript
const PORT = process.env.PORT || 5000;
```

**Frontend Socket Connection** (if backend port changes):
Edit `frontend/src/App.tsx` line 26:
```javascript
const newSocket = io('http://localhost:YOUR_BACKEND_PORT');
```

## 📁 Project Structure

```
educanvas-live/
├── backend/
│   ├── package.json
│   └── server.js          # Express + Socket.IO server
├── frontend/
│   ├── package.json
│   ├── public/
│   └── src/
│       ├── components/
│       │   ├── LandingPage.tsx    # Join form
│       │   └── Classroom.tsx      # Main app interface
│       ├── App.tsx               # Main app logic
│       └── index.css             # Tailwind styles
├── package.json          # Root package with dev scripts
└── README.md
```

## 🛠️ Development Scripts

```bash
# Install all dependencies (root, backend, frontend)
npm run install-all

# Start both backend and frontend in development mode
npm run dev

# Start only backend server
npm run server

# Start only frontend client
npm run client

# Build frontend for production
npm run build

# Start backend in production mode
npm start
```

## 🌐 API Endpoints

**Health Check:**
- `GET /health` - Server status and basic stats

**State Information:**
- `GET /state` - Current session information (user count, admin status, etc.)

## 🔮 Future Enhancements

The current implementation provides a solid foundation. Here are some ideas for extending the platform:

- **Video Conferencing**: WebRTC integration for real-time video calls
- **Screen Sharing**: Allow admin to share their screen
- **File Upload**: Share documents and images
- **Persistent Sessions**: Optional database integration
- **Authentication**: User accounts and session management
- **Recording**: Save and replay sessions
- **Mobile App**: Native mobile applications

## 🐛 Troubleshooting

**Connection Issues:**
- Ensure backend server is running on port 5000
- Check browser console for Socket.IO connection errors
- Verify firewall isn't blocking the ports

**Whiteboard Not Working:**
- Try refreshing the page
- Check if drawing is enabled (admin control)
- Ensure Canvas API is supported in your browser

**Chat Issues:**
- Verify Socket.IO connection is established
- Check network connectivity
- Try clearing browser cache

## 📄 License

ISC License - Feel free to use this project for educational purposes!

## 🤝 Contributing

This is a learning project! Feel free to:
- Report bugs
- Suggest improvements  
- Submit pull requests
- Add new features

---

**Happy Teaching! 🎉**

*EduCanvas Live - Making online education interactive and fun!*
