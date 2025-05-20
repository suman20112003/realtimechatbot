// eslint-disable-next-line no-unused-vars
import React, { useState } from 'react';
import useSocket from './SocketIo';
import JoinRoom from './JoinRoom';
import './App.css';

const App = () => {
  const {
    isConnected,
    error,
    setError,
    messages,
    setMessages,
    members,
    currentRoom,
    joinRoom,
    sendMessage,
    leaveRoom
  } = useSocket();

  const [message, setMessage] = useState('');
  const [username, setUsername] = useState('');

  const handleSend = (e) => {
    e.preventDefault();
    setError('');
    if (!message.trim()) return;
    if (!currentRoom) {
      setError('You must join a room first');
      return;
    }

    sendMessage(currentRoom, message.trim());
    setMessage('');
  };

  const handleJoin = (name, room) => {
    setUsername(name);
    joinRoom(name, room);
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
        <JoinRoom onJoin={handleJoin} error={error} />
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
                  {!msg.isSystem && msg.timestamp && (
                    <div className="message-time">
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <form onSubmit={handleSend} className="message-form">
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
