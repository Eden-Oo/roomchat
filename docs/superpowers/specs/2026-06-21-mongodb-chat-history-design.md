# MongoDB Chat History — Design

**Date:** 2026-06-21
**Status:** Approved

## Goal

Persist RoomChat messages so that when a user joins a room they see the
recent conversation, instead of every message vanishing the moment it is
sent. Today all state lives in memory (`server.js`'s `rooms` Map) and is
lost on disconnect/restart.

## Decisions

- **Database:** MongoDB Atlas (cloud), reachable from Render and locally.
- **Access layer:** Mongoose ODM.
- **History on join:** load the last 50 messages (configurable).
- **DB unavailable:** degrade gracefully — app keeps running as a live
  in-memory chat, persistence/history disabled with a console warning.
- **Stored:** chat messages only. System notices (join/left) and typing
  remain ephemeral.

## Architecture

A new `db.js` module owns the Mongoose connection and the `Message`
model. `server.js` stays focused on Socket.IO and depends on `db.js`.

### `db.js`

- `connectDB()` — `mongoose.connect(process.env.MONGODB_URI)`. If
  `MONGODB_URI` is unset or the connection throws, log a warning, leave
  `dbReady = false`, and return (no throw).
- `isDbReady()` — boolean flag.
- `Message` — Mongoose model.
- `HISTORY_LIMIT` — from `process.env.HISTORY_LIMIT`, default 50.

### `Message` schema

```js
{ room: String, username: String, text: String, ts: Date }
```

Compound index `{ room: 1, ts: 1 }` for fast recent-history queries.

## Data flow (changes in `server.js`)

1. **Startup** (inside the `require.main === module` block, so tests do
   not auto-connect): `await connectDB()` before `server.listen`.
2. **`chatMessage`**: after the existing broadcast, if `isDbReady()`,
   `await Message.create({ room, username, text, ts })` in a try/catch.
   A save failure logs but never affects the live broadcast.
3. **`joinRoom`**: after emitting `joined` / `userList`, if `isDbReady()`,
   query `find({ room }).sort({ ts: -1 }).limit(HISTORY_LIMIT)`, reverse
   to chronological order, and emit a new `history` event **to the joining
   socket only**.

## Client (`client.js`)

Add `socket.on('history', msgs => msgs.forEach(renderMessage))`. The
`joined` event fires first, so history renders before any live messages.
Existing `renderMessage` already reads `username`, `text`, `ts` — no
change needed.

## Config / deps

- Add `mongoose` to `package.json` dependencies.
- `MONGODB_URI` and optional `HISTORY_LIMIT` via environment variables.
- Local: a gitignored `.env` (already in `.gitignore`). The app reads the
  raw `process.env` — a tiny `require('dotenv')` or manual load may be
  added; for Render the value is set in the dashboard env settings.
- README documents both variables. The credential is **never committed**.

## Testing

- **Degradation:** with no `MONGODB_URI`, the server still starts and a
  message broadcasts (live chat works, no crash).
- **Persistence/history:** with a DB connected, a sent message is stored
  and a second client joining the same room receives it via `history`.

## Out of scope

- Editing/deleting messages, pagination beyond the last N, persisting
  presence/typing, authentication, per-user message ownership.
