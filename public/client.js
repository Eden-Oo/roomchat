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
  const messagesEl = document.getElementById('messages');
  const messageForm = document.getElementById('message-form');
  const messageInput = document.getElementById('message-input');
  const usersEl = document.getElementById('users');
  const typingEl = document.getElementById('typing');

  // ---------- State ----------
  let socket = null;
  let me = null;
  let currentRoom = null;
  let typingUsers = new Set();
  let amTyping = false;
  let typingTimer = null;

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

    socket.on('chatMessage', function (msg) {
      renderMessage(msg);
    });

    socket.on('systemNotice', function (notice) {
      renderSystemNotice(notice);
    });

    socket.on('userList', function (users) {
      renderUserList(users);
    });

    socket.on('typing', function (data) {
      if (!data || !data.username) return;
      if (data.isTyping) typingUsers.add(data.username);
      else typingUsers.delete(data.username);
      renderTyping();
    });
  }

  function renderTyping() {
    const names = Array.from(typingUsers);
    if (names.length === 0) {
      typingEl.textContent = '';
    } else if (names.length === 1) {
      typingEl.textContent = names[0] + ' is typing…';
    } else if (names.length === 2) {
      typingEl.textContent = names[0] + ' and ' + names[1] + ' are typing…';
    } else {
      typingEl.textContent = 'Several people are typing…';
    }
  }

  function setTyping(state) {
    if (state === amTyping) return;
    amTyping = state;
    if (socket) socket.emit('typing', state);
  }

  function renderUserList(users) {
    usersEl.innerHTML = '';
    (users || []).forEach(function (name) {
      const li = document.createElement('li');
      li.textContent = name;
      usersEl.appendChild(li);
    });
  }

  function renderSystemNotice(notice) {
    const li = document.createElement('li');
    li.className = 'msg system';
    li.textContent = notice.text + ' · ' + formatTime(notice.ts);
    messagesEl.appendChild(li);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  // ---------- Messaging ----------
  messageForm.addEventListener('submit', function (e) {
    e.preventDefault(); // Enter (submit) and the Send button both trigger this
    const text = messageInput.value.trim();
    if (!text || !socket) return; // ignore empty sends
    socket.emit('chatMessage', { text: text });
    messageInput.value = '';
    clearTimeout(typingTimer);
    setTyping(false); // stop the indicator once the message is sent
    messageInput.focus();
  });

  // Emit typing state as the user types, auto-clearing after a short idle.
  messageInput.addEventListener('input', function () {
    if (!socket) return;
    if (messageInput.value.trim().length > 0) {
      setTyping(true);
      clearTimeout(typingTimer);
      typingTimer = setTimeout(function () { setTyping(false); }, 1500);
    } else {
      clearTimeout(typingTimer);
      setTyping(false);
    }
  });

  function formatTime(ts) {
    const d = ts ? new Date(ts) : new Date();
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return hh + ':' + mm;
  }

  function renderMessage(msg) {
    const li = document.createElement('li');
    li.className = 'msg' + (msg.username === me ? ' mine' : '');

    const meta = document.createElement('span');
    meta.className = 'meta';

    const sender = document.createElement('span');
    sender.className = 'sender';
    sender.textContent = msg.username;

    const time = document.createElement('span');
    time.className = 'time';
    time.textContent = ' · ' + formatTime(msg.ts);

    meta.appendChild(sender);
    meta.appendChild(time);

    const text = document.createElement('span');
    text.className = 'text';
    text.textContent = msg.text; // textContent prevents HTML injection

    li.appendChild(meta);
    li.appendChild(text);
    messagesEl.appendChild(li);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function showChatView(room, username) {
    roomNameEl.textContent = room;
    meNameEl.textContent = username;
    lobby.classList.add('hidden');
    chat.classList.remove('hidden');
  }
})();
