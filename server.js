const path = require('path');
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Serve the static frontend from public/
app.use(express.static(path.join(__dirname, 'public')));

io.on('connection', (socket) => {
  // Socket.IO wiring is added in later tasks (T3+).
});

const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';
server.listen(PORT, HOST, () => {
  console.log(`roomchat server listening on http://${HOST}:${PORT}`);
});
