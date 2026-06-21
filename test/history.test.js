// End-to-end check of MongoDB-backed history:
//   1. user A joins a room and sends a message (which gets persisted)
//   2. user B joins the same room and must receive that message via 'history'
//
// Run with a real MONGODB_URI set (loaded from .env). If no DB is
// configured the test self-skips, matching the app's graceful degradation.
require('dotenv').config();
const assert = require('assert');
const { io: ioClient } = require('socket.io-client');
const { connectDB, isDbReady, Message } = require('../db');
const { server } = require('../server');

const ROOM = 'test-room-' + process.pid;

function once(socket, event) {
  return new Promise((resolve) => socket.once(event, resolve));
}

(async () => {
  await connectDB();
  if (!isDbReady()) {
    console.log('SKIP: no MONGODB_URI — degradation path, nothing to persist.');
    process.exit(0);
  }

  // Start on an ephemeral port.
  await new Promise((res) => server.listen(0, '127.0.0.1', res));
  const port = server.address().port;
  const url = `http://127.0.0.1:${port}`;

  // Clean any leftovers from a previous run of this room.
  await Message.deleteMany({ room: ROOM });

  // ----- User A joins and sends a message -----
  const a = ioClient(url);
  a.emit('joinRoom', { username: 'alice', room: ROOM });
  await once(a, 'joined');
  const sent = 'hello from the past ' + Date.now();
  a.emit('chatMessage', { text: sent });
  await once(a, 'chatMessage'); // sender also receives the broadcast

  // Give the fire-and-forget DB write a moment to land.
  await new Promise((r) => setTimeout(r, 300));

  // ----- User B joins later and should see the history -----
  const b = ioClient(url);
  b.emit('joinRoom', { username: 'bob', room: ROOM });
  await once(b, 'joined');
  const history = await once(b, 'history');

  assert(Array.isArray(history), 'history should be an array');
  const found = history.find((m) => m.text === sent && m.username === 'alice');
  assert(found, 'bob should receive alice\'s earlier message in history');
  assert(typeof found.ts === 'number', 'history ts should be a number (ms)');

  console.log(`PASS: history replayed ${history.length} message(s); found the persisted one.`);

  // Cleanup
  await Message.deleteMany({ room: ROOM });
  a.close();
  b.close();
  process.exit(0);
})().catch((err) => {
  console.error('FAIL:', err);
  process.exit(1);
});
