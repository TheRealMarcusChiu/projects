# Projects in 3D

A scroll-driven 3D gallery of projects, with a built-in **admin mode** for
editing content and a small Node backend (`server/server.js`) that writes
changes straight to the `content/` files.

The site itself is static and works with **no server** (open `index.html`
directly, even from `file://`). The server is only needed when you want admin
edits to **persist** to disk.

---

## Project structure

```
index.html            The gallery + admin UI (single page, styles inlined)
favicon.ico
content/
  manifest.js         SINGLE SOURCE OF TRUTH — the project array
  covers.js           Cover screenshots inlined as data URIs (so file:// works)
  images/             Raw cover images (<id>.png / .jpg …)
server/
  server.js           Optional Node backend (CRUD for projects)
  projects-admin.service   systemd unit (Proxmox LXC / Ubuntu)
  update-local.sh     Deploy helper: ssh in, git pull, restart the service
```

Everything the page shows — the number of projects, titles, descriptions,
links, dates, tech, accent colours, and the `hidden` flag — is read from
`content/manifest.js` at runtime. There is no project data in the HTML.

---

## Running

### Static only (no persistence)

Just open `index.html` in a browser, or serve the folder with anything:

```bash
npx serve .          # or: python3 -m http.server
```

Admin edits will apply live in the page but won't be saved.

### With the backend (edits persist)

Requires Node.js (built-in modules only — nothing to `npm install`).

```bash
node server/server.js
```

Then open **http://localhost:3000**. The server:

- serves the static site, and
- exposes a JSON API that rewrites `content/manifest.js`, `content/covers.js`,
  and `content/images/` as you edit.

Change the port with `PORT=8080 node server/server.js`.

### Git auto-sync

Every successful create / update / hide / delete is **committed and pushed to
the git remote** automatically (`git add content && git commit && git push`),
so edits made through the admin UI are versioned and survive a redeploy.

- Runs in the project root and only stages `content/` (manifest, covers, images).
- Commits are serialised, and any git failure is logged but never breaks the
  API response.
- Requires the deploy to be a git checkout whose remote accepts pushes (e.g. an
  SSH deploy key or cached credentials on the container).
- Env: `GIT_SYNC=0` disables it; `GIT_REMOTE=origin` sets the remote name.

### As a service (Proxmox LXC / Ubuntu)

A ready-made systemd unit is included: **`server/projects-admin.service`**.
Clone the repo to `/root/projects`, then:

```bash
git clone <your-repo> /root/projects
cp /root/projects/server/projects-admin.service /etc/systemd/system/
systemctl daemon-reload
systemctl enable --now projects-admin.service
journalctl -u projects-admin -f          # follow logs
```

It auto-starts on boot, restarts on failure, and is hardened. It listens on all
interfaces (`HOST=0.0.0.0`) on port **9005** by default, so point the admin
UI's **Server** endpoint at `http://<container-ip>:9005`.

To redeploy after pushing changes, run **`server/update-local.sh`** (it SSHes
in, `git pull`s, and restarts the service).

---

## Admin mode

1. Click the **⚙ gear** in the top-right of the header to toggle admin mode.
2. An **Admin** bar appears. Click **Server** to set the backend endpoint
   (e.g. `http://localhost:3000`) — it's tested and saved to `localStorage`.
   Leave it blank to edit locally without saving.
3. Each project gains **Edit / Hide / Delete** controls.
4. The floating **+** button (bottom-right) creates a new project.

### Editing / creating

The editor covers every field: title, description, link URL, display URL,
tag/badge, category, tech (comma-separated), date created, accent colour, and
a **cover image** (chosen from disk, stored inline as a data URI so it renders
even over `file://`).

### Hiding

**Hide** sets `hidden: true` on a project. Hidden projects are removed from the
public view but still appear (dimmed, marked *Hidden*) while admin mode is on,
so you can bring them back with **Show**.

---

## HTTP API

All JSON, CORS-enabled.

| Method | Path | Body | Purpose |
|---|---|---|---|
| `GET` | `/api/projects?covers=1` | — | List projects (+ filters, + cover data URIs) |
| `POST` | `/api/projects` | `{ project, coverDataUri? }` | Create |
| `PUT` | `/api/projects/:id` | `{ project, coverDataUri? }` | Update |
| `PATCH` | `/api/projects/:id` | `{ patch: { hidden: true } }` | Partial update (hide/show) |
| `DELETE` | `/api/projects/:id` | — | Delete (also removes its image + cover) |
| `GET` | `/api/health` | — | `{ ok: true }` |

`coverDataUri` is a `data:image/...;base64,...` string. The server decodes it,
writes the raw file to `content/images/<id>.<ext>`, stores the data URI in
`content/covers.js`, and points the manifest's `cover` field at the new file.

---

## A project record

```js
{
  id: 'my-room',                       // stable slug (also the covers.js key)
  title: 'My Room in 3D',
  description: 'An explorable 3D model of my room, built in the browser.',
  url: 'https://my-room.marcuschiu.com',
  displayUrl: 'my-room.marcuschiu.com',
  cover: './images/my-room.png',
  coverW: 3024, coverH: 1888,
  tag: '3D',
  category: 'interactive',             // visualization | interactive | tools | experiments
  tech: ['Three.js', 'WebGL', 'JavaScript'],
  dateCreated: '2023-03-14',           // YYYY-MM-DD
  accent: '#b9883f',                   // hex tint for the 3D slab
  hidden: false,
}
```
