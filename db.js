const mongoose = require('mongoose');

// How many recent messages to replay when a user joins a room.
const HISTORY_LIMIT = Number(process.env.HISTORY_LIMIT) || 50;

// ---------- Message model ----------
// A single chat message. System notices and typing state are intentionally
// not persisted — only real user messages live in history.
const messageSchema = new mongoose.Schema({
  room: { type: String, required: true },
  username: { type: String, required: true },
  text: { type: String, required: true },
  ts: { type: Date, default: Date.now },
});

// Recent-history queries always filter by room and sort by time.
messageSchema.index({ room: 1, ts: 1 });

const Message = mongoose.model('Message', messageSchema);

// ---------- Connection ----------
// dbReady gates every persistence/history call so the app degrades to a
// pure in-memory live chat when MongoDB is missing or unreachable.
let dbReady = false;

function isDbReady() {
  return dbReady;
}

async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.warn('[db] MONGODB_URI not set — running without persistence (live chat only).');
    return;
  }
  try {
    await mongoose.connect(uri);
    dbReady = true;
    console.log('[db] Connected to MongoDB — chat history enabled.');
  } catch (err) {
    // Don't crash: a demo on a free tier should still serve live chat.
    console.warn('[db] Could not connect to MongoDB — running without persistence:', err.message);
  }
}

module.exports = { connectDB, isDbReady, Message, HISTORY_LIMIT };
