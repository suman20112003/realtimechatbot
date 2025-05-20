// eslint-disable-next-line no-unused-vars
import React, { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import './App.css';

const App = () => {
  const socketRef = useRef();
  const [username, setUsername] = useState('');
  const [room, setRoom] = useState('');
  const [currentRoom, setCurrentRoom] = useState('');
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [members, setMembers] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    socketRef.current = io('http://localhost:5000', {
      transports: ['websocket'],
      withCredentials: true,
    });

    socketRef.current.on('connect', () => {
      setIsConnected(true);
      console.log('Connected to server');
    });

    socketRef.current.on('disconnect', () => {
      setIsConnected(false);
      console.log('Disconnected from server');
    });

    socketRef.current.on('connect_error', (err) => {
      setError('Connection error: ' + err.message);
      console.error('Connection error:', err);
    });

    socketRef.current.on('room_joined', (data) => {
      setCurrentRoom(data.room);
      setMembers(data.members);
      setMessages(prev => [...prev, {
        username: 'System',
        message: `You joined room ${data.room}`,
        isSystem: true
      }]);
    });

    socketRef.current.on('user_joined', (data) => {
      setMembers(data.members);
      setMessages(prev => [...prev, {
        username: 'System',
        message: `${data.username} joined the room`,
        isSystem: true
      }]);
    });

    socketRef.current.on('user_left', (data) => {
      setMembers(data.members);
      setMessages(prev => [...prev, {
        username: 'System',
        message: `${data.username} left the room`,
        isSystem: true
      }]);
    });

    socketRef.current.on('receive_message', (data) => {
      setMessages(prev => [...prev, {
        username: data.username,
        message: data.message,
        timestamp: data.timestamp,
        isSystem: false
      }]);
    });

    socketRef.current.on('join_error', (errorMsg) => {
      setError(errorMsg);
    });

    socketRef.current.on('error', (errorMsg) => {
      setError(errorMsg);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  const joinRoom = (e) => {
    e.preventDefault();
    setError('');
    
    if (!username.trim() || !room.trim()) {
      setError('Username and room are required');
      return;
    }

    socketRef.current.emit('join_room', {
      username: username.trim(),
      room: room.trim()
    });
  };

  const sendMessage = (e) => {
    e.preventDefault();
    setError('');

    if (!message.trim()) return;
    if (!currentRoom) {
      setError('You must join a room first');
      return;
    }

    socketRef.current.emit('send_message', {
      room: currentRoom,
      message: message.trim()
    });

    setMessage('');
  };

  const leaveRoom = () => {
    if (currentRoom) {
      setMessages(prev => [...prev, {
        username: 'System',
        message: `You left room ${currentRoom}`,
        isSystem: true
      }]);
      setCurrentRoom('');
      setMembers([]);
    }
  };

  return (
    <div className="chat-app">
      <header className="app-header">
        <h1>Chat.io</h1>
        <div className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
          {isConnected ? 'Connected' : 'Disconnected'}
        </div>
      </header>

      {!currentRoom ? (
        <div className="join-room-container">
          <h2>Join a Chat Room</h2>
          {error && <div className="error-message">{error}</div>}
          <form onSubmit={joinRoom}>
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
            <input
              type="text"
              placeholder="Room ID"
              value={room}
              onChange={(e) => setRoom(e.target.value)}
              required
            />
            <button type="submit">Join Room</button>
          </form>
        </div>
      ) : (
        <div className="chat-container">
          <div className="chat-sidebar">
            <h3>Room: {currentRoom}</h3>
            <h4>Members ({members.length})</h4>
            <ul className="member-list">
              {members.map((member, index) => (
                <li key={index}>{member}</li>
              ))}
            </ul>
            <button onClick={leaveRoom} className="leave-room-btn">
              Leave Room
            </button>
          </div>

          <div className="chat-main">
            <div className="messages-container">
              {messages.map((msg, index) => (
                <div 
                  key={index} 
                  className={`message ${msg.isSystem ? 'system-message' : ''} ${
                    msg.username === username ? 'own-message' : ''
                  }`}
                >
                  {!msg.isSystem && msg.username !== username && (
                    <div className="message-username">{msg.username}</div>
                  )}
                  <div className="message-content">{msg.message}</div>
                  {!msg.isSystem && (
                    <div className="message-time">
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <form onSubmit={sendMessage} className="message-form">
              <input
                type="text"
                placeholder="Type your message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
              <button type="submit">Send</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;