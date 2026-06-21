# roomchat

Real-time chat rooms built with **Node.js + Express + Socket.IO**, with **MongoDB** message history. Pick a username, join (or create) a room by name, and chat live with everyone in that room. The last messages in a room are replayed to anyone who joins, so conversations survive restarts.

![stack](https://img.shields.io/badge/node-%3E%3D18-43853d) ![socket.io](https://img.shields.io/badge/realtime-socket.io-black)

**🔴 Live demo: [roomchat-bmla.onrender.com](https://roomchat-bmla.onrender.com/)** — hosted on Render's free tier, so the first load after idle may take ~30s while the service wakes up.

## Features

- Username + room lobby with client-side validation
- Create or join rooms by name (created implicitly on first join)
- Live messaging scoped to a room, with sender, text, and `HH:MM` timestamp
- Your own messages are visually distinguished
- Live presence list and **join/leave** system notices
- **Typing indicator** ("alice is typing…")
- Duplicate usernames rejected **within the same room**
- Message text is escaped, so pasting `<script>…</script>` renders as plain text
- Empty rooms are cleaned up from memory on disconnect
- **Persistent history** — the last `HISTORY_LIMIT` (default 50) messages are replayed when you join a room (stored in MongoDB)

## Requirements

- Node.js **18+**

## Run locally

```bash
npm install
npm start
```

Then open **http://localhost:3000** in your browser. To test real-time chat, open a **second tab** (or browser), join the same room with a different username, and watch messages appear instantly in both.

The server binds to `process.env.PORT || 3000` on host `0.0.0.0`.

## Message history (MongoDB)

Chat messages are persisted to MongoDB. When you join a room, the last
`HISTORY_LIMIT` (default 50) messages are replayed before any live ones.
On boot you'll see `[db] Connected to MongoDB — chat history enabled.`

This is a **demo app**, so the MongoDB Atlas connection string is hardcoded
in **`db.js`** for convenience — no environment setup needed, just
`npm start`. For a real deployment, move that string into an environment
variable and rotate the credentials.

Messages live in a `messages` collection (`{ room, username, text, ts }`,
indexed on `{ room, ts }`). Only chat messages are persisted — join/leave
notices and typing indicators stay ephemeral. If the database is
unreachable, the server logs a warning and keeps serving live chat (no
crash).

To run the end-to-end history test:

```bash
npm test
```

## How it works

- **`server.js`** — Express serves the static `public/` folder and Socket.IO handles the realtime events:
  - `joinRoom { username, room }` → joins the Socket.IO room, stores the user, rejects duplicate names in that room
  - `chatMessage { text }` → broadcast to that room only, then persisted to MongoDB
  - `typing <bool>` → relayed to others in the room
  - `disconnect` → removes the user, notifies the room, deletes the room if empty
  - On `joinRoom`, the server replays the room's recent history to the joining socket via a `history` event
- **`db.js`** — owns the Mongoose connection (`connectDB`, `isDbReady`) and the `Message` model. The Atlas URI is hardcoded here (demo app). Connection failure is non-fatal: the app degrades to live-only chat.
- **`public/`** — plain HTML/CSS/vanilla JS. The client connects with a bare `io()` (same origin), so it works both locally and on a deployed domain. A `history` handler renders replayed messages before any live ones.
- **Live state** is in-memory: `rooms` is a `Map<roomName, Map<socketId, username>>` (presence resets on restart). **Message history** is in MongoDB when configured, so conversations survive restarts.

## Deploy to Render

This app is ready to deploy on [Render.com](https://render.com) as a Node **Web Service**.

1. Push this project to a GitHub repo.
2. In Render: **New** → **Web Service** → connect GitHub and pick the repo.
   - Or use the included **`render.yaml`** via **New → Blueprint**, and Render reads the settings automatically.
3. Settings (if not using the Blueprint):
   - **Environment:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Plan:** Free
   - **Health Check Path:** `/`
4. Deploy. Render auto-redeploys on every push to your main branch.

The MongoDB connection string is hardcoded in `db.js`, so no extra Render configuration is needed for history to work.

**Free-tier caveats:**
- The service **spins down after ~15 minutes of inactivity**, so the first request after idle is slow while it wakes up.
- **Presence** (who's currently in a room) is in memory and **resets when the service restarts or spins down**. **Message history** persists in MongoDB, so past messages survive restarts.

## How this app was built

This project was built by Claude Code working a **loop prompt** — a spec broken into discrete tasks (T1–T8), each with acceptance criteria, verified and committed one at a time. The prompt is included for reference:

- [`roomchat-loop-prompt.md`](roomchat-loop-prompt.md) — the full loop prompt (PROJECT_SPEC + PROGRESS + THE LOOP PROMPT)
- [`roomchat-loop-prompt-clean.md`](roomchat-loop-prompt-clean.md) — cleaned-up version

**Kickoff prompt** (paste this to start the loop in Claude Code):

> Read the file `roomchat-loop-prompt-clean.md` in this folder. Follow the instructions in its "THE LOOP PROMPT" section to build the roomchat app — work one task at a time from PROJECT_SPEC, verify each task against its acceptance criteria, update PROGRESS as you go, and keep looping until all tasks (T1–T8) are done. Start now.

## Possible next steps (out of scope here)

- Authentication / passwords
- Private or direct messages
- ~~Message persistence (a database)~~ — done: optional MongoDB history
- History pagination ("load older messages")
- File uploads
- Multi-instance scaling with a Redis Socket.IO adapter

## License

MIT
