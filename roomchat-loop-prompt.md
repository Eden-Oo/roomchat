# RoomChat — Loop Prompt for Claude Code

**Project name:** `roomchat`
(Alt names if you want something punchier: `huddle`, `dropin`, `chatterbox`. Pick one and use it as the folder + package name.)

This file is written to be handed to **Claude Code** as a *loop*, not a one-shot prompt. It contains three parts:
1. **PROJECT_SPEC** — what to build, as small discrete tasks each with acceptance criteria.
2. **PROGRESS** — the live checklist the agent updates every iteration (its memory).
3. **THE LOOP PROMPT** — the instruction you paste in to make Claude Code work the spec task-by-task.

How to use: in Claude Code, create the project folder, drop this file in as `LOOP.md` (or split it into `PROJECT_SPEC.md` + `PROGRESS.md`), then paste **THE LOOP PROMPT** section as your message.

---

## PROJECT_SPEC

### Goal (definition of done for the whole project)
A working real-time chat web app where a user enters a **username**, then **creates or joins a room by name**, and chats live with everyone in that room. Running `npm install && npm start` serves the app locally; two browser tabs can join the same room and see each other's messages in real time. No build step, no database required. The app must also be **deployable to Render.com as-is** (see T8).

### Deployment target
This will be deployed on **Render.com** as a Node Web Service (Build Command `npm install`, Start Command `npm start`). Build the app from the start so it works there without changes — the main requirements are: bind to `process.env.PORT` on host `0.0.0.0`, keep `npm start` as the entry point, and don't rely on anything that won't survive a restart (in-memory rooms are fine; just know they reset when the service restarts/spins down).

### Tech constraints (do not deviate without asking)
- **Backend:** Node.js + Express + Socket.IO.
- **Frontend:** plain HTML + CSS + vanilla JS served as static files (no framework, no bundler).
- **State:** in-memory on the server (rooms and users live in plain JS objects/Maps). No database.
- **Dependencies:** only `express` and `socket.io`. Do not add other packages without flagging why.
- Keep the whole thing small and readable — this is a starter app, not production infra.

### Tasks (work them in order; each must pass its acceptance criteria before moving on)

**T1 — Project scaffold**
- Create `package.json` (name `roomchat`, `"start": "node server.js"`, and an `"engines": { "node": ">=18" }` field), install `express` and `socket.io`.
- Create `server.js` that serves a `public/` folder and starts Socket.IO. **Listen on `process.env.PORT || 3000` and bind host `0.0.0.0`** (required for Render; localhost-only binding will fail there).
- Add a `.gitignore` that excludes `node_modules`.
- Acceptance: `npm install` succeeds; `npm start` logs the port it's listening on; visiting `/` returns a page locally.

**T2 — Lobby screen (username + room)**
- `public/index.html` + `public/style.css` + `public/client.js`. A lobby view with: a **username** field, a **room name** field, a **Join / Create Room** button.
- Client-side validation: username and room name are required and trimmed; block submit if empty.
- Acceptance: opening `/` shows the lobby; submitting with an empty field shows an inline error and does not proceed.

**T3 — Join/create room over Socket.IO**
- On submit, emit a `joinRoom` event with `{ username, room }`. Server joins that socket to the Socket.IO room (creating it implicitly if new), stores the user, and switches the client to the **chat view** showing the room name.
- Reject duplicate usernames *within the same room* (server emits an error the client shows).
- Acceptance: from two tabs, joining room "test" as "alice" and "bob" both land in the chat view; joining as "alice" twice in the same room is rejected with a clear message.

**T4 — Real-time messaging**
- Chat view: message list, a text input, a Send button (and Enter to send). Client emits `chatMessage`; server broadcasts to everyone in that room only (not other rooms).
- Each message shows **sender username**, **text**, and a **timestamp** (HH:MM). The sender's own messages are visually distinguished.
- Trim messages; ignore empty sends.
- Acceptance: alice and bob in room "test" see each other's messages instantly; a third tab in room "other" sees none of them.

**T5 — Presence + join/leave notices**
- Maintain and display the **list of users currently in the room** (updates live). Broadcast a system notice when someone joins ("alice joined") and when they leave.
- Acceptance: the user list updates correctly as tabs join; closing a tab removes that user and shows a "left" notice to the others.

**T6 — Disconnect handling**
- On socket `disconnect`, remove the user from their room, update the user list, broadcast the leave notice, and clean up empty rooms from memory.
- Acceptance: after a tab closes, the server's in-memory state no longer lists that user; an emptied room is deleted.

**T7 — Polish (only after T1–T6 pass)**
- Add a **typing indicator** ("alice is typing…"), basic responsive CSS, escape/sanitize message text to prevent HTML injection, and a short `README.md` with run instructions.
- Acceptance: typing indicator appears/clears correctly; pasting `<script>` as a message renders as text, not HTML; README explains `npm install && npm start`.

**T8 — Render.com deployment readiness (do after T1–T7 pass)**
- Confirm the server uses `process.env.PORT` and binds `0.0.0.0`, `npm start` runs `node server.js`, and `node_modules` is gitignored.
- Add a `render.yaml` (Infrastructure-as-Code) describing one web service: `env: node`, `buildCommand: npm install`, `startCommand: npm start`, a free plan, and a health check path of `/`.
- Confirm the Socket.IO client connects to the **same origin** (use a bare `io()` on the client, not a hardcoded `http://localhost` URL) so it works on the deployed domain.
- Add a **Deploy to Render** section to the `README.md`: push to a GitHub repo → New Web Service on Render → pick the repo → Build `npm install`, Start `npm start` → deploy. Note the free-tier caveats: the service spins down after ~15 min idle (slow first load), and because rooms/users are in-memory, they reset whenever the service restarts.
- Acceptance: `render.yaml` is valid; the client has no hardcoded localhost URL; the README deploy steps are present and correct. (Actual deploy is done by the user via their Render account.)

### Out of scope (do not build unless asked)
Authentication/passwords, private/DM messages, message persistence, file uploads, multi-instance scaling (a Redis Socket.IO adapter). Note them in the README as "possible next steps" instead.

---

## PROGRESS
*(The agent updates this every iteration. Status: TODO / DOING / DONE / BLOCKED.)*

- [x] T1 — Project scaffold — **DONE**
- [x] T2 — Lobby screen — **DONE**
- [ ] T3 — Join/create room — **TODO**
- [ ] T4 — Real-time messaging — **TODO**
- [ ] T5 — Presence + join/leave — **TODO**
- [ ] T6 — Disconnect handling — **TODO**
- [ ] T7 — Polish — **TODO**
- [ ] T8 — Render.com deployment readiness — **TODO**

Notes / decisions log:
- T1: scaffold with express + socket.io; server binds 0.0.0.0 on PORT||3000; serves public/. Verified npm install + npm start (logs port) + GET / returns 200.
- T2: lobby (username+room+button), dark CSS, client-side trim/required validation with inline error. Verified markup served + real submit handler exercised via DOM stub (empty/whitespace blocked, valid passes).

---

## THE LOOP PROMPT
*(Paste this as your message to Claude Code.)*

> You are building the `roomchat` app defined in `PROJECT_SPEC` above. Work in a **loop**, one task at a time — do not try to build everything at once.
>
> Each iteration:
> 1. Read `PROJECT_SPEC` and `PROGRESS`.
> 2. Pick the **first task that is not DONE**. Mark it DOING in `PROGRESS`.
> 3. Implement **only that one task** — the smallest change that satisfies its acceptance criteria.
> 4. **Verify** it against that task's acceptance criteria: start the server and actually exercise the behavior (use two clients where the criteria mention two tabs — e.g. a quick Node/Socket.IO test client or a Playwright check). Do not mark a task done on the basis of "the code looks right."
> 5. If it passes: mark the task **DONE** in `PROGRESS`, append a one-line note to the decisions log, and commit with a message like `feat: T3 join/create room`.
> 6. If it fails: fix and re-verify. After **3 failed attempts** on the same task, stop and report what's blocking you instead of thrashing.
> 7. Repeat from step 1.
>
> **Stop when:** all tasks are DONE *and* the whole app runs end-to-end (`npm install && npm start`, two tabs chat in the same room) — then give me a short summary and how to run it. Also stop if you hit a BLOCKED task or have looped more than ~12 times without finishing.
>
> **Guardrails:**
> - Only use `express` and `socket.io`. If you think you need another dependency, stop and ask first.
> - Keep `PROGRESS` accurate at all times — it is your memory between iterations.
> - Don't delete or overwrite files outside this project folder. Don't run destructive commands. Commit after each passing task so progress is recoverable.
> - Prefer small, working increments over big rewrites. A running app at every step beats a clever unfinished one.

---

### Why it's shaped this way (the loop-engineering bits)
- **Discrete tasks + acceptance criteria** = the agent always has one clear, checkable goal — the thing that keeps loops from drifting.
- **`PROGRESS` as external memory** = state lives in a file, so each iteration can start fresh without losing the thread (beats one giant degrading conversation).
- **Verify-then-mark-done** = the built-in checker; without it the model declares victory too early.
- **3-attempt + 12-loop caps** = the hard stop, so it can't thrash or run away on cost.
- **Dependency + file guardrails** = keeps an autonomous agent from doing something irreversible.
