# Git & GitHub — roomchat

**Repo:** [Eden-Oo/roomchat](https://github.com/Eden-Oo/roomchat) (Public)
**Remote URL:** `https://github.com/Eden-Oo/roomchat.git`

**Description (paste into the repo's "About"):**
> Real-time chat rooms built with Node.js and Socket.IO — pick a username, join a room by name, and chat live.

**Topics/tags:** `nodejs` · `socketio` · `express` · `websockets` · `realtime` · `chat` · `chat-application`

---

## Recommended flow for this project

The repo already exists and is empty. After Claude Code finishes building the app **in this folder** (via the loop prompt), push the existing project to it:

```bash
# run these from the project folder, after the app is built
git init
git add .
git commit -m "first commit: roomchat (Node.js + Socket.IO)"
git branch -M main
git remote add origin https://github.com/Eden-Oo/roomchat.git
git push -u origin main
```

> Make sure a `.gitignore` exists with `node_modules` in it **before** `git add .` (Task T1 in the loop prompt creates this). You don't want to commit `node_modules`.

For later changes:

```bash
git add .
git commit -m "describe what changed"
git push
```

---

## Reference (from GitHub's setup page)

**Create a new repository on the command line:**
```bash
echo "# roomchat" >> README.md
git init
git add README.md
git commit -m "first commit"
git branch -M main
git remote add origin https://github.com/Eden-Oo/roomchat.git
git push -u origin main
```

**Push an existing repository from the command line:**
```bash
git remote add origin https://github.com/Eden-Oo/roomchat.git
git branch -M main
git push -u origin main
```

---

## Next step: deploy on Render

Once the code is on GitHub:
1. Go to Render.com → **New** → **Web Service**.
2. Connect your GitHub and pick the **Eden-Oo/roomchat** repo.
3. Settings: **Build Command** `npm install` · **Start Command** `npm start` · **Environment** Node · Plan: Free.
4. Deploy. Render auto-redeploys on every push to `main`.

(If the repo includes a `render.yaml` — created in Task T8 of the loop prompt — Render can read these settings automatically via "Blueprint".)

**Free-tier note:** the service sleeps after ~15 min of inactivity (first request after is slow), and in-memory rooms/users reset whenever it restarts.
