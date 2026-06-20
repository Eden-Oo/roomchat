(function () {
  'use strict';

  // ---------- Elements ----------
  const lobby = document.getElementById('lobby');
  const chat = document.getElementById('chat');
  const lobbyForm = document.getElementById('lobby-form');
  const usernameInput = document.getElementById('username');
  const roomInput = document.getElementById('room');
  const lobbyError = document.getElementById('lobby-error');
  const roomNameEl = document.getElementById('room-name');
  const meNameEl = document.getElementById('me-name');

  // ---------- State ----------
  let socket = null;
  let me = null;
  let currentRoom = null;

  // ---------- Lobby validation + submit ----------
  lobbyForm.addEventListener('submit', function (e) {
    e.preventDefault();
    lobbyError.textContent = '';

    const username = usernameInput.value.trim();
    const room = roomInput.value.trim();

    if (!username && !room) {
      lobbyError.textContent = 'Please enter a username and a room name.';
      usernameInput.focus();
      return;
    }
    if (!username) {
      lobbyError.textContent = 'Please enter a username.';
      usernameInput.focus();
      return;
    }
    if (!room) {
      lobbyError.textContent = 'Please enter a room name.';
      roomInput.focus();
      return;
    }

    joinRoom(username, room);
  });

  function joinRoom(username, room) {
    // Connect to the same origin that served the page (works locally and on Render).
    if (!socket) {
      socket = io();
      registerSocketHandlers();
    }
    socket.emit('joinRoom', { username: username, room: room });
  }

  function registerSocketHandlers() {
    socket.on('joinError', function (message) {
      lobbyError.textContent = message || 'Could not join the room.';
    });

    socket.on('joined', function (data) {
      me = data.username;
      currentRoom = data.room;
      showChatView(data.room, data.username);
    });
  }

  function showChatView(room, username) {
    roomNameEl.textContent = room;
    meNameEl.textContent = username;
    lobby.classList.add('hidden');
    chat.classList.remove('hidden');
  }
})();
