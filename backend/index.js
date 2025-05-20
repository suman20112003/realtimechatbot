const express = require('express');
const cors = require('cors');
const http = require('http');
const mongoose = require('mongoose');
const dotenv = require('dotenv'); 
dotenv.config();
const { Server } = require('socket.io');

const app = express();
const port = process.env.PORT || 5000;

app.use(cors({
  origin: 'http://localhost:5173', 
  credentials: true
}));
app.use(express.json());

const server = http.createServer(app);

app.get('/', (req, res) => {
  res.json({ message: 'Chat server is running', status: 'healthy' });
});

const io = new Server(server, {
  cors: {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['websocket'],
  connectionStateRecovery: {
    maxDisconnectionDuration: 2 * 60 * 1000,
    skipMiddlewares: true,
  }
});

const activeUsers = new Map(); 
const roomMembers = new Map(); 

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on('join_room', (data) => {
    if (!data.username || !data.room) {
      socket.emit('join_error', 'Username and room are required');
      return;
    }

    if (activeUsers.has(socket.id)) {
      const prevRoom = activeUsers.get(socket.id).room;
      socket.leave(prevRoom);
      updateRoomMembers(prevRoom, socket.id, false);
    }

    socket.join(data.room);
    activeUsers.set(socket.id, { username: data.username, room: data.room });
    updateRoomMembers(data.room, socket.id, true);

    console.log(`User ${data.username} joined room ${data.room}`);
    
    socket.emit('room_joined', { 
      room: data.room,
      members: getRoomMembers(data.room)
    });

    socket.to(data.room).emit('user_joined', {
      username: data.username,
      members: getRoomMembers(data.room)
    });
  });

  socket.on('send_message', (data) => {
    if (!activeUsers.has(socket.id)) {
      socket.emit('error', 'You must join a room first');
      return;
    }

    const user = activeUsers.get(socket.id);
    if (user.room !== data.room) {
      socket.emit('error', 'You are not in this room');
      return;
    }

    const messageData = {
      room: data.room,
      username: user.username,
      message: data.message,
      timestamp: new Date().toISOString()
    };

    io.to(data.room).emit('receive_message', messageData);
    console.log(`Message in ${data.room}: ${user.username}: ${data.message}`);
  });

  socket.on('disconnect', () => {
    if (activeUsers.has(socket.id)) {
      const user = activeUsers.get(socket.id);
      console.log(`User ${user.username} disconnected from room ${user.room}`);
      
      updateRoomMembers(user.room, socket.id, false);
      socket.to(user.room).emit('user_left', {
        username: user.username,
        members: getRoomMembers(user.room)
      });
      
      activeUsers.delete(socket.id);
    }
    console.log(`User disconnected: ${socket.id}`);
  });

  socket.on('error', (error) => {
    console.error(`Socket error (${socket.id}):`, error);
  });
});

function updateRoomMembers(room, socketId, isJoining) {
  if (!roomMembers.has(room)) {
    roomMembers.set(room, new Set());
  }
  const members = roomMembers.get(room);
  isJoining ? members.add(socketId) : members.delete(socketId);
  if (members.size === 0) {
    roomMembers.delete(room);
  }
}

function getRoomMembers(room) {
  if (!roomMembers.has(room)) return [];
  return Array.from(roomMembers.get(room))
    .map(id => activeUsers.get(id)?.username)
    .filter(Boolean);
}

server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});