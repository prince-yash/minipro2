# Getting Started with EduCanvas Live

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- Modern web browser with WebRTC support (Chrome, Firefox, Safari, Edge)

### Installation & Setup

1. **Install dependencies** (from project root):
   ```bash
   npm run install-all
   ```

2. **Start both frontend and backend**:
   ```bash
   npm run dev
   ```

   Or start them individually:
   ```bash
   # Terminal 1 - Backend
   cd backend && npm run dev

   # Terminal 2 - Frontend  
   cd frontend && npm start
   ```

3. **Access the application**:
   - Frontend: http://localhost:3000
   - Backend health: http://localhost:5000/health

## 🎯 Testing Video Conferencing

### Single Machine Testing
Open multiple browser windows/tabs to simulate different users:

1. **Create Admin Session**:
   - Open http://localhost:3000
   - Enter name: "Teacher"
   - Enter admin code: `teach123`
   - Click "Join Classroom"

2. **Create Student Sessions**:
   - Open new tabs/windows
   - Enter different names: "Student1", "Student2", etc.
   - Leave admin code blank
   - Click "Join Classroom"

3. **Test Video Features**:
   - Click "Start Video" button in header
   - Allow camera/microphone permissions
   - Test camera on/off, mute/unmute
   - **Admin only**: Test screen sharing

### Multi-Device Testing
For real multi-user testing:

1. **Find your local IP**:
   ```bash
   # On Linux/Mac
   hostname -I
   # Or
   ifconfig | grep "inet "
   ```

2. **Update frontend connection** (temporarily):
   - Edit `frontend/src/App.tsx`
   - Change `'http://localhost:5000'` to `'http://YOUR_IP:5000'`

3. **Update backend CORS** (temporarily):
   - Edit `backend/server.js` 
   - Change `"http://localhost:3000"` to `"http://YOUR_IP:3000"`

4. **Access from other devices**:
   - Connect devices to same network
   - Navigate to `http://YOUR_IP:3000`

## 📋 Feature Testing Checklist

### ✅ Basic Functionality
- [ ] User can join as student (no admin code)
- [ ] User can join as admin (with `teach123`)
- [ ] Multiple users can join simultaneously
- [ ] Users see participant list update in real-time

### ✅ Video Conferencing (Jitsi Meet)
- [ ] Video call can be started from "Start Video" button
- [ ] Jitsi Meet interface loads properly
- [ ] Camera and microphone controls work in Jitsi interface
- [ ] Multiple participants can join the same room
- [ ] Screen sharing works (all participants)
- [ ] Chat works within Jitsi Meet
- [ ] Admin gets moderator privileges
- [ ] Video call status shows in participant list

### ✅ Whiteboard
- [ ] Drawing works with mouse/touch
- [ ] Color picker changes drawing color
- [ ] Brush size slider adjusts line thickness
- [ ] Drawing syncs between all users in real-time
- [ ] **Admin only**: Can clear entire canvas
- [ ] **Admin only**: Can toggle student drawing permissions
- [ ] Students can/cannot draw based on admin setting

### ✅ Chat System
- [ ] Messages send in real-time
- [ ] Messages display with username and timestamp
- [ ] Admin messages show teacher icon (👨‍🏫)
- [ ] **Admin only**: Can delete any message
- [ ] Chat auto-scrolls to newest messages

### ✅ Session Management
- [ ] When admin leaves, all students get disconnected
- [ ] Session state resets when admin leaves
- [ ] Individual students can leave without affecting others
- [ ] Everything resets when server restarts

## 🔧 Development Commands

```bash
# Backend commands (from backend/)
npm run dev          # Development mode with nodemon
npm start           # Production mode
node server.js      # Manual start

# Frontend commands (from frontend/)
npm start           # Development server
npm run build       # Build for production
npm test           # Run tests

# Root commands
npm run install-all  # Install all dependencies
npm run dev         # Start both frontend and backend
```

## 🛠️ Troubleshooting

### Common Issues

1. **"Cannot connect to server"**
   - Check if backend is running on port 5000
   - Check `curl http://localhost:5000/health`

2. **Video/Audio not working**
   - Allow browser permissions for camera/microphone
   - Try in Chrome/Firefox (best WebRTC support)
   - Check browser console for errors

3. **WebRTC connection fails**
   - Disable browser extensions temporarily
   - Try incognito/private mode
   - Check firewall settings

4. **Drawing not syncing**
   - Check Socket.IO connection in browser dev tools
   - Verify drawing permissions (admin can always draw)

5. **Screen sharing not available**
   - Only available for admin users
   - Requires HTTPS in production (works on localhost)

### Debug Commands

```bash
# Check server health
curl http://localhost:5000/health

# Get current app state
curl http://localhost:5000/state

# Enable Socket.IO debug logs in browser console
localStorage.debug = 'socket.io-client:socket';
```

## 🌐 Architecture Notes

- **No Database**: Everything is in-memory, resets on restart
- **Single Room**: All users join the same "classroom" 
- **Admin Code**: Hardcoded as `teach123` in backend
- **Video Conferencing**: Powered by Jitsi Meet (meet.jit.si)
- **WebRTC**: Handled automatically by Jitsi Meet
- **HTTPS**: Required for camera/microphone access
- **CORS**: Limited to localhost for development

## 📱 Browser Compatibility

- ✅ Chrome (recommended)
- ✅ Firefox  
- ✅ Safari (Mac/iOS)
- ✅ Edge
- ❌ Internet Explorer

## 🔐 Security Notes

⚠️ **Development Only**: This is not production-ready:
- No authentication system
- Admin code visible in source
- No data persistence
- CORS open to localhost only
- No user management

Perfect for learning WebRTC and Socket.IO concepts!

## 📞 Support

If you encounter issues:
1. Check this troubleshooting guide
2. Look for errors in browser console
3. Check backend logs in terminal
4. Verify all dependencies are installed correctly

Happy coding! 🎉
