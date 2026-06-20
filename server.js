const path = require('path');
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Serve the static frontend from public/
app.use(express.static(path.join(__dirname, 'public')));

// ---------- In-memory state ----------
// rooms: Map<roomName, Map<socketId, username>>
const rooms = new Map();

function getRoom(room) {
  if (!rooms.has(room)) rooms.set(room, new Map());
  return rooms.get(room);
}

function usernameTaken(room, username) {
  const members = rooms.get(room);
  if (!members) return false;
  const lower = username.toLowerCase();
  for (const name of members.values()) {
    if (name.toLowerCase() === lower) return true;
  }
  return false;
}

function userList(room) {
  const members = rooms.get(room);
  return members ? Array.from(members.values()) : [];
}

function systemNotice(text) {
  return { system: true, text, ts: Date.now() };
}

// ---------- Socket.IO ----------
io.on('connection', (socket) => {
  socket.on('joinRoom', (payload) => {
    const username = (payload && typeof payload.username === 'string') ? payload.username.trim() : '';
    const room = (payload && typeof payload.room === 'string') ? payload.room.trim() : '';

    if (!username || !room) {
      socket.emit('joinError', 'Username and room are required.');
      return;
    }
    if (usernameTaken(room, username)) {
      socket.emit('joinError', `The name "${username}" is already taken in #${room}.`);
      return;
    }

    // Join the Socket.IO room (created implicitly if new) and record the user.
    socket.join(room);
    socket.data.username = username;
    socket.data.room = room;
    getRoom(room).set(socket.id, username);

    // Confirm to the joining client, then announce presence to the room.
    socket.emit('joined', { room, username });
    io.to(room).emit('userList', userList(room));
    socket.to(room).emit('systemNotice', systemNotice(`${username} joined`));
  });

  socket.on('chatMessage', (raw) => {
    const room = socket.data.room;
    const username = socket.data.username;
    if (!room || !username) return; // not in a room yet

    const text = (typeof raw === 'string' ? raw : (raw && raw.text) || '').trim();
    if (!text) return; // ignore empty sends

    // Broadcast to everyone in this room only (including the sender).
    io.to(room).emit('chatMessage', {
      username,
      text,
      ts: Date.now(),
    });
  });

  socket.on('typing', (isTyping) => {
    const room = socket.data.room;
    const username = socket.data.username;
    if (!room || !username) return;
    // Tell everyone else in the room about this user's typing state.
    socket.to(room).emit('typing', { username, isTyping: !!isTyping });
  });

  socket.on('disconnect', () => {
    const room = socket.data.room;
    const username = socket.data.username;
    if (!room || !username) return; // never joined a room

    const members = rooms.get(room);
    if (members) {
      members.delete(socket.id);
      // Tell the rest of the room who left and refresh their user list.
      socket.to(room).emit('typing', { username, isTyping: false });
      socket.to(room).emit('systemNotice', systemNotice(`${username} left`));
      io.to(room).emit('userList', userList(room));
      // Clean up empty rooms so memory doesn't grow without bound.
      if (members.size === 0) rooms.delete(room);
    }
  });
});

// Start listening only when run directly (`npm start`); when required by a
// test the caller controls the lifecycle and can inspect `rooms`.
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  const HOST = '0.0.0.0';
  server.listen(PORT, HOST, () => {
    console.log(`roomchat server listening on http://${HOST}:${PORT}`);
  });
}

module.exports = { app, server, io, rooms };
