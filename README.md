# roomchat

Real-time chat rooms built with **Node.js + Express + Socket.IO**. Pick a username, join (or create) a room by name, and chat live with everyone in that room. No build step, no database — rooms and users live in memory on the server.

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

## Requirements

- Node.js **18+**

## Run locally

```bash
npm install
npm start
```

Then open **http://localhost:3000** in your browser. To test real-time chat, open a **second tab** (or browser), join the same room with a different username, and watch messages appear instantly in both.

The server binds to `process.env.PORT || 3000` on host `0.0.0.0`.

## How it works

- **`server.js`** — Express serves the static `public/` folder and Socket.IO handles the realtime events:
  - `joinRoom { username, room }` → joins the Socket.IO room, stores the user, rejects duplicate names in that room
  - `chatMessage { text }` → broadcast to that room only
  - `typing <bool>` → relayed to others in the room
  - `disconnect` → removes the user, notifies the room, deletes the room if empty
- **`public/`** — plain HTML/CSS/vanilla JS. The client connects with a bare `io()` (same origin), so it works both locally and on a deployed domain.
- **State** is in-memory: `rooms` is a `Map<roomName, Map<socketId, username>>`. It resets if the server restarts.

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

**Free-tier caveats:**
- The service **spins down after ~15 minutes of inactivity**, so the first request after idle is slow while it wakes up.
- Because rooms and users are stored **in memory**, they **reset whenever the service restarts or spins down**.

## How this app was built

This project was built by Claude Code working a **loop prompt** — a spec broken into discrete tasks (T1–T8), each with acceptance criteria, verified and committed one at a time. The prompt is included for reference:

- [`roomchat-loop-prompt.md`](roomchat-loop-prompt.md) — the full loop prompt (PROJECT_SPEC + PROGRESS + THE LOOP PROMPT)
- [`roomchat-loop-prompt-clean.md`](roomchat-loop-prompt-clean.md) — cleaned-up version

## Possible next steps (out of scope here)

- Authentication / passwords
- Private or direct messages
- Message persistence (a database)
- File uploads
- Multi-instance scaling with a Redis Socket.IO adapter

## License

MIT
