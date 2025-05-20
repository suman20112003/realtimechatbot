// eslint-disable-next-line no-unused-vars
import React, { useState } from 'react';

const JoinRoom = ({ onJoin, error }) => {
  const [username, setUsername] = useState('');
  const [room, setRoom] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (username.trim() && room.trim()) {
      onJoin(username.trim(), room.trim());
    }
  };

  return (
    <div className="join-room-container">
      <h2>Join a Chat Room</h2>
      {error && <div className="error-message">{error}</div>}
      <form onSubmit={handleSubmit}>
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
  );
};

export default JoinRoom;
