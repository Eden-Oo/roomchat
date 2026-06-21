const mongoose = require('mongoose');

// Example/demo app: the connection string is hardcoded here for convenience.
// For a real deployment, move this to an environment variable instead.
const MONGODB_URI = 'mongodb+srv://edenrefdata_db_user:nOMdgZgU3KjCSxxJ@cluster0.pfnbt1n.mongodb.net/roomchat?appName=Cluster0';

// How many recent messages to replay when a user joins a room.
const HISTORY_LIMIT = 50;

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
  try {
    await mongoose.connect(MONGODB_URI);
    dbReady = true;
    console.log('[db] Connected to MongoDB — chat history enabled.');
  } catch (err) {
    // Don't crash: a demo on a free tier should still serve live chat.
    console.warn('[db] Could not connect to MongoDB — running without persistence:', err.message);
  }
}

module.exports = { connectDB, isDbReady, Message, HISTORY_LIMIT };
