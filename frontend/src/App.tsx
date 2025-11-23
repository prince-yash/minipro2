import React, { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import AuthPage from './components/AuthPage';
import LandingPage from './components/LandingPage';
import Classroom from './components/Classroom';

interface AppState {
  socket: Socket | null;
  isConnected: boolean;
  isAuthenticated: boolean;
  authToken: string | null;
  inClassroom: boolean;
  userRole: 'admin' | 'student';
  userName: string;
  userEmail: string;
  error: string | null;
}

function App() {
  const [state, setState] = useState<AppState>({
    socket: null,
    isConnected: false,
    isAuthenticated: false,
    authToken: null,
    inClassroom: false,
    userRole: 'student',
    userName: '',
    userEmail: '',
    error: null
  });

  // Check for existing auth token on mount
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const userStr = localStorage.getItem('user');
    
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        setState(prev => ({
          ...prev,
          isAuthenticated: true,
          authToken: token,
          userName: user.username,
          userEmail: user.email,
          userRole: user.role
        }));
      } catch (error) {
        // Invalid stored data, clear it
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
      }
    }
  }, []);

  const connectSocket = () => {
    // Use environment variable or construct URL based on current location
    const host = window.location.hostname;
    const protocol = window.location.protocol; // Use same protocol as the frontend
    const backendUrl = (process.env.REACT_APP_BACKEND_URL || `${protocol}//${host}:5000`).replace(/\/$/, '');

    console.log('Connecting to backend:', backendUrl);

    const newSocket = io(backendUrl, {
      // Accept self-signed certificates in development only
      rejectUnauthorized: process.env.NODE_ENV === 'production'
    });
    
    newSocket.on('connect', () => {
      console.log('Connected to server', backendUrl);
      setState(prev => ({ ...prev, socket: newSocket, isConnected: true }));
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from server');
      setState(prev => ({ ...prev, isConnected: false }));
    });

    newSocket.on('join_success', (data) => {
      setState(prev => ({
        ...prev,
        inClassroom: true,
        userRole: data.role,
        error: null
      }));
    });

    newSocket.on('connect_error', (error) => {
      console.error('Connection failed:', error);
      setState(prev => ({ ...prev, error: 'Failed to connect to server. Make sure the backend is running.' }));
    });

    return newSocket;
  };

  const handleAuthSuccess = (token: string, user: { id: string; username: string; email: string; role: string }) => {
    setState(prev => ({
      ...prev,
      isAuthenticated: true,
      authToken: token,
      userName: user.username,
      userEmail: user.email,
      userRole: user.role as 'admin' | 'student',
      error: null
    }));
  };

  const handleJoinClassroom = (name: string, adminCode?: string) => {
    setState(prev => ({ ...prev, error: null }));
    
    let socket = state.socket;
    if (!socket || !socket.connected) {
      socket = connectSocket();
    }

    // Wait for connection then join room
    const joinRoom = () => {
      if (socket && socket.connected) {
        socket.emit('join_room', { name, adminCode });
      } else {
        setTimeout(joinRoom, 100);
      }
    };
    
    joinRoom();
  };

  const handleLeaveSession = () => {
    if (state.socket) {
      state.socket.disconnect();
    }
    setState(prev => ({
      ...prev,
      socket: null,
      isConnected: false,
      inClassroom: false
    }));
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    if (state.socket) {
      state.socket.disconnect();
    }
    setState({
      socket: null,
      isConnected: false,
      isAuthenticated: false,
      authToken: null,
      inClassroom: false,
      userRole: 'student',
      userName: '',
      userEmail: '',
      error: null
    });
  };

  useEffect(() => {
    return () => {
      if (state.socket) {
        state.socket.disconnect();
      }
    };
  }, [state.socket]);

  if (state.error) {
    return (
      <div className="min-h-screen bg-red-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Connection Error</h2>
          <p className="text-gray-600 mb-6">{state.error}</p>
          <button
            onClick={() => setState(prev => ({ ...prev, error: null }))}
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Show auth page if not authenticated
  if (!state.isAuthenticated) {
    return <AuthPage onAuthSuccess={handleAuthSuccess} />;
  }

  // Show landing page if authenticated but not in classroom
  if (!state.inClassroom) {
    return <LandingPage onJoinClassroom={handleJoinClassroom} onLogout={handleLogout} userName={state.userName} />;
  }

  if (state.socket && state.inClassroom) {
    return (
      <Classroom
        socket={state.socket}
        userRole={state.userRole}
        userName={state.userName}
        onLeaveSession={handleLeaveSession}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Connecting to classroom...</p>
      </div>
    </div>
  );
}

export default App;
