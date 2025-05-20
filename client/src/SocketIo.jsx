// socketio.jsx
import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

const useSocket = () => {
  const socketRef = useRef();
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState('');
  const [messages, setMessages] = useState([]);
  const [members, setMembers] = useState([]);
  const [currentRoom, setCurrentRoom] = useState('');

  useEffect(() => {
    socketRef.current = io('http://localhost:5000', {
      transports: ['websocket'],
      withCredentials: true,
    });

    socketRef.current.on('connect', () => {
      setIsConnected(true);
    });

    socketRef.current.on('disconnect', () => {
      setIsConnected(false);
    });

    socketRef.current.on('connect_error', (err) => {
      setError('Connection error: ' + err.message);
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

    return () => {
      socketRef.current.disconnect();
    };
  }, []);

  const joinRoom = (username, room) => {
    setError('');
    socketRef.current.emit('join_room', { username, room });
  };

  const sendMessage = (room, message) => {
    socketRef.current.emit('send_message', { room, message });
  };

  const leaveRoom = () => {
    setMessages(prev => [...prev, {
      username: 'System',
      message: `You left room ${currentRoom}`,
      isSystem: true
    }]);
    setCurrentRoom('');
    setMembers([]);
  };

  return {
    socket: socketRef.current,
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
  };
};

export default useSocket;
