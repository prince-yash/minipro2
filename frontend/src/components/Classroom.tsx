import React, { useEffect, useState, useRef } from 'react';
import { Socket } from 'socket.io-client';

interface User {
  name: string;
  role: 'admin' | 'student';
  streamActive: boolean;
}

interface ChatMessage {
  id: string;
  userId: string;
  username: string;
  message: string;
  timestamp: string;
  role: 'admin' | 'student';
}

interface ClassroomProps {
  socket: Socket;
  userRole: 'admin' | 'student';
  userName: string;
  onLeaveSession: () => void;
}

const Classroom: React.FC<ClassroomProps> = ({ socket, userRole, userName, onLeaveSession }) => {
  const [users, setUsers] = useState<{ [socketId: string]: User }>({});
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [drawingEnabled, setDrawingEnabled] = useState(true);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentColor, setCurrentColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(3);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Socket event listeners
    socket.on('join_success', (data) => {
      setUsers(data.users);
      setChatMessages(data.chat);
      setDrawingEnabled(data.drawingEnabled);
    });

    socket.on('user_joined', (data) => {
      setUsers(prev => ({
        ...prev,
        [data.userId]: data.user
      }));
    });

    socket.on('user_left', (data) => {
      setUsers(prev => {
        const newUsers = { ...prev };
        delete newUsers[data.userId];
        return newUsers;
      });
    });

    socket.on('new_message', (message) => {
      setChatMessages(prev => [...prev, message]);
    });

    socket.on('message_deleted', (data) => {
      setChatMessages(prev => prev.filter(msg => msg.id !== data.messageId));
    });

    socket.on('draw_data', (data) => {
      // Handle drawing on canvas
      drawOnCanvas(data);
    });

    socket.on('clear_canvas', () => {
      clearCanvas();
    });

    socket.on('drawing_toggled', (data) => {
      setDrawingEnabled(data.enabled);
    });

    socket.on('session_ended', () => {
      alert('Session ended - Admin left the classroom');
      onLeaveSession();
    });

    return () => {
      socket.off('join_success');
      socket.off('user_joined');
      socket.off('user_left');
      socket.off('new_message');
      socket.off('message_deleted');
      socket.off('draw_data');
      socket.off('clear_canvas');
      socket.off('drawing_toggled');
      socket.off('session_ended');
    };
  }, [socket, onLeaveSession]);

  useEffect(() => {
    // Scroll to bottom of chat
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const sendMessage = () => {
    if (newMessage.trim()) {
      socket.emit('chat_message', { message: newMessage });
      setNewMessage('');
    }
  };

  const deleteMessage = (messageId: string) => {
    socket.emit('delete_message', { messageId });
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
  };

  const drawOnCanvas = (data: any) => {
    const canvas = canvasRef.current;
    if (canvas && data) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.globalCompositeOperation = data.type === 'erase' ? 'destination-out' : 'source-over';
        ctx.strokeStyle = data.color || '#000000';
        ctx.lineWidth = data.size || 3;
        ctx.lineCap = 'round';
        
        ctx.beginPath();
        ctx.moveTo(data.fromX, data.fromY);
        ctx.lineTo(data.toX, data.toY);
        ctx.stroke();
      }
    }
  };

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (drawingEnabled || userRole === 'admin') {
      setIsDrawing(true);
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || (!drawingEnabled && userRole !== 'admin')) return;

    const canvas = canvasRef.current;
    if (canvas) {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const drawData = {
        fromX: x,
        fromY: y,
        toX: x,
        toY: y,
        color: currentColor,
        size: brushSize,
        type: 'draw'
      };

      drawOnCanvas(drawData);
      socket.emit('draw_data', drawData);
    }
  };

  const handleCanvasMouseUp = () => {
    setIsDrawing(false);
  };

  const handleClearCanvas = () => {
    socket.emit('clear_canvas');
  };

  const handleToggleDrawing = () => {
    socket.emit('toggle_draw', { enabled: !drawingEnabled });
  };

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-gray-800">EduCanvas Live</h1>
          <p className="text-sm text-gray-600">
            Welcome, {userName} ({userRole === 'admin' ? 'Teacher' : 'Student'})
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          {userRole === 'admin' && (
            <>
              <button
                onClick={handleToggleDrawing}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  drawingEnabled 
                    ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                    : 'bg-red-100 text-red-800 hover:bg-red-200'
                }`}
              >
                {drawingEnabled ? 'Drawing: ON' : 'Drawing: OFF'}
              </button>
              
              <button
                onClick={handleClearCanvas}
                className="px-4 py-2 bg-yellow-100 text-yellow-800 rounded-lg text-sm font-medium hover:bg-yellow-200"
              >
                Clear Canvas
              </button>
            </>
          )}
          
          <button
            onClick={onLeaveSession}
            className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700"
          >
            Leave Session
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Left Side - Video Grid */}
        <div className="w-1/3 bg-white border-r p-4">
          <h3 className="text-lg font-semibold mb-4">Participants ({Object.keys(users).length})</h3>
          
          <div className="grid grid-cols-1 gap-4">
            {Object.entries(users).map(([socketId, user]) => (
              <div key={socketId} className="bg-gray-100 rounded-lg p-4 text-center">
                <div className="w-16 h-16 bg-gray-300 rounded-full mx-auto mb-2 flex items-center justify-center">
                  <span className="text-gray-600 font-semibold">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <p className="text-sm font-medium">{user.name}</p>
                <p className="text-xs text-gray-500">
                  {user.role === 'admin' ? '👨‍🏫 Teacher' : '👨‍🎓 Student'}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side - Whiteboard and Chat */}
        <div className="flex-1 flex flex-col">
          {/* Whiteboard */}
          <div className="flex-1 p-4">
            <div className="mb-4 flex items-center space-x-4">
              <h3 className="text-lg font-semibold">Whiteboard</h3>
              
              <div className="flex items-center space-x-2">
                <label className="text-sm">Color:</label>
                <input
                  type="color"
                  value={currentColor}
                  onChange={(e) => setCurrentColor(e.target.value)}
                  className="w-8 h-8 rounded border"
                  disabled={!drawingEnabled && userRole !== 'admin'}
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <label className="text-sm">Size:</label>
                <input
                  type="range"
                  min="1"
                  max="20"
                  value={brushSize}
                  onChange={(e) => setBrushSize(Number(e.target.value))}
                  className="w-20"
                  disabled={!drawingEnabled && userRole !== 'admin'}
                />
                <span className="text-sm">{brushSize}px</span>
              </div>
            </div>
            
            <canvas
              ref={canvasRef}
              width={800}
              height={400}
              className="border border-gray-300 rounded-lg bg-white cursor-crosshair"
              onMouseDown={handleCanvasMouseDown}
              onMouseMove={handleCanvasMouseMove}
              onMouseUp={handleCanvasMouseUp}
              onMouseLeave={handleCanvasMouseUp}
            />
          </div>

          {/* Chat */}
          <div className="h-64 border-t bg-white">
            <div className="p-4 border-b">
              <h3 className="text-lg font-semibold">Chat</h3>
            </div>
            
            <div className="h-40 overflow-y-auto p-4">
              {chatMessages.map((message) => (
                <div key={message.id} className="mb-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className={`font-medium ${message.role === 'admin' ? 'text-indigo-600' : 'text-gray-700'}`}>
                          {message.username}
                          {message.role === 'admin' && <span className="text-xs">👨‍🏫</span>}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(message.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{message.message}</p>
                    </div>
                    
                    {userRole === 'admin' && (
                      <button
                        onClick={() => deleteMessage(message.id)}
                        className="text-red-500 hover:text-red-700 text-xs ml-2"
                      >
                        ×
                      </button>
                    )}
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
            
            <div className="p-4 border-t flex">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Type a message..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                onClick={sendMessage}
                className="px-4 py-2 bg-indigo-600 text-white rounded-r-lg hover:bg-indigo-700"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Classroom;
