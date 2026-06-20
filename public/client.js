(function () {
  'use strict';

  // ---------- Elements ----------
  const lobby = document.getElementById('lobby');
  const lobbyForm = document.getElementById('lobby-form');
  const usernameInput = document.getElementById('username');
  const roomInput = document.getElementById('room');
  const lobbyError = document.getElementById('lobby-error');

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

    // Valid input — joining is wired up in T3.
    joinRoom(username, room);
  });

  // Placeholder until T3 wires Socket.IO.
  function joinRoom(username, room) {
    // no-op for T2
  }
})();
