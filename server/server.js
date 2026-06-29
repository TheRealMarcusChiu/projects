#!/usr/bin/env node
/* ────────────────────────────────────────────────────────────────────────
 * server.js — backend for the "Projects in 3D" gallery.
 *
 * Edits the content/* files that drive the site:
 *   • content/manifest.js   — the project array (single source of truth)
 *   • content/covers.js     — cover screenshots inlined as data URIs
 *   • content/images/<id>.* — the raw uploaded cover image
 *
 * It also serves the static site, so you can run the whole thing with:
 *     node server.js
 * then open  http://localhost:3000  in a browser.
 *
 * No external dependencies — Node.js built-ins only.
 *
 * ── HTTP API (all JSON, CORS-enabled) ──────────────────────────────────
 *   GET    /api/projects[?covers=1]   → { projects, filters [, covers] }
 *   POST   /api/projects              → create   body: { project, coverDataUri? }
 *   PUT    /api/projects/:id          → update   body: { project, coverDataUri? }
 *   PATCH  /api/projects/:id          → partial  body: { patch: {...} }   (e.g. { hidden:true })
 *   DELETE /api/projects/:id          → delete
 *   GET    /api/health                → { ok:true }
 * ──────────────────────────────────────────────────────────────────────── */

'use strict';

const http = require('http');
const fs   = require('fs');
const path = require('path');
const vm   = require('vm');
const url  = require('url');
const { execFile } = require('child_process');

// Project root is the parent of this server/ directory.
const ROOT        = path.resolve(__dirname, '..');
const CONTENT_DIR = path.join(ROOT, 'content');
const IMAGES_DIR  = path.join(CONTENT_DIR, 'images');
const MANIFEST    = path.join(CONTENT_DIR, 'manifest.js');
const COVERS      = path.join(CONTENT_DIR, 'covers.js');
const PORT        = process.env.PORT || 3000;
// Bind address: 0.0.0.0 accepts remote connections; set HOST=127.0.0.1 for local-only.
const HOST        = process.env.HOST || '0.0.0.0';
// Auto-commit + push every edit to the git remote. Disable with GIT_SYNC=0.
const GIT_SYNC    = process.env.GIT_SYNC !== '0';
const GIT_REMOTE  = process.env.GIT_REMOTE || 'origin';

// ── git: commit content changes and push to origin ───────────────────────
// Runs `git add content && git commit && git push`. Serialised so concurrent
// edits don't trample each other; failures are logged, never thrown (a git
// problem must not break the API response).
let gitChain = Promise.resolve();
function run(cmd, args) {
  return new Promise((resolve) => {
    execFile(cmd, args, { cwd: ROOT, timeout: 30000 }, (err, stdout, stderr) => {
      resolve({ code: err ? (err.code || 1) : 0, stdout: stdout || '', stderr: stderr || '' });
    });
  });
}
function gitSync(message) {
  if (!GIT_SYNC) return;
  gitChain = gitChain.then(async () => {
    try {
      await run('git', ['add', 'content']);
      const commit = await run('git', ['commit', '-m', message]);
      // code !== 0 with "nothing to commit" just means no changes — skip push.
      if (commit.code !== 0 && /nothing to commit/i.test(commit.stdout + commit.stderr)) {
        console.log('[git] nothing to commit'); return;
      }
      if (commit.code !== 0) { console.error('[git] commit failed:', commit.stderr.trim()); return; }
      console.log('[git] ' + message);
      const push = await run('git', ['push', GIT_REMOTE, 'HEAD']);
      if (push.code !== 0) console.error('[git] push failed:', push.stderr.trim());
      else console.log('[git] pushed to ' + GIT_REMOTE);
    } catch (e) {
      console.error('[git] sync error:', e && e.message);
    }
  });
}

const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',   '.json': 'application/json; charset=utf-8',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.gif': 'image/gif', '.svg': 'image/svg+xml', '.webp': 'image/webp',
  '.ico': 'image/x-icon', '.woff': 'font/woff', '.woff2': 'font/woff2',
};
const EXT_FOR_MIME = {
  'image/png': '.png', 'image/jpeg': '.jpg', 'image/jpg': '.jpg',
  'image/gif': '.gif', 'image/webp': '.webp', 'image/svg+xml': '.svg',
};

// ── manifest.js read / write ────────────────────────────────────────────
const MANIFEST_HEADER = `// ─────────────────────────────────────────────────────────────────────────
// Project gallery content manifest — SINGLE SOURCE OF TRUTH
//
// Managed by server.js (the admin UI writes through to this file). The site
// reads everything off this file dynamically: the number of projects, all
// copy, dates, tech, links, accent colours, and the hidden flag.
//
// Loaded as a classic script:  <script src="content/manifest.js"></script>
//   → window.PROJECTS and window.PROJECT_FILTERS
// (Also exposes module.exports for CommonJS tooling / this server.)
// ─────────────────────────────────────────────────────────────────────────
`;

function readManifest() {
  const code = fs.readFileSync(MANIFEST, 'utf8');
  const sandbox = { window: {}, module: { exports: {} } };
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox, { filename: 'manifest.js' });
  const out = sandbox.module.exports || {};
  return {
    projects: out.PROJECTS || (sandbox.window.PROJECTS) || [],
    filters:  out.FILTERS  || (sandbox.window.PROJECT_FILTERS) || [],
  };
}

function writeManifest(projects, filters) {
  const body =
    MANIFEST_HEADER +
    '\nvar PROJECTS = ' + JSON.stringify(projects, null, 2) + ';\n' +
    '\nvar FILTERS = ' + JSON.stringify(filters, null, 2) + ';\n' +
    '\n// Browser global (classic <script>)\n' +
    'if (typeof window !== \'undefined\') {\n' +
    '  window.PROJECTS = PROJECTS;\n' +
    '  window.PROJECT_FILTERS = FILTERS;\n' +
    '}\n' +
    '// CommonJS tooling (optional)\n' +
    'if (typeof module !== \'undefined\' && module.exports) {\n' +
    '  module.exports = { PROJECTS, FILTERS };\n' +
    '}\n';
  fs.writeFileSync(MANIFEST, body, 'utf8');
}

// ── covers.js read / write ──────────────────────────────────────────────
const COVERS_HEADER = `// Auto-generated by server.js: cover screenshots inlined as data URIs so the
// page works when opened directly from file:// (local images would taint the
// WebGL canvas; data URIs are same-origin and do not). Classic script:
//   <script src="content/covers.js"></script>  ->  window.COVERS[id]
`;

function readCovers() {
  if (!fs.existsSync(COVERS)) return {};
  const code = fs.readFileSync(COVERS, 'utf8');
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  try { vm.runInContext(code, sandbox, { filename: 'covers.js' }); } catch (e) { return {}; }
  return sandbox.window.COVERS || {};
}

function writeCovers(covers) {
  const body = COVERS_HEADER + 'window.COVERS = ' + JSON.stringify(covers, null, 2) + ';\n';
  fs.writeFileSync(COVERS, body, 'utf8');
}

// ── helpers ───────────────────────────────────────────────────────────────
function slugify(s) {
  return String(s || '').toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || ('project-' + Date.now());
}

// Persist a data-URI cover: writes the raw image to content/images/<id>.<ext>,
// stores the data URI in covers.js, and returns the manifest-relative path.
function saveCover(id, dataUri, covers) {
  const m = /^data:([^;,]+)(;base64)?,(.*)$/s.exec(dataUri || '');
  if (!m) return null;
  const mime = m[1].toLowerCase();
  const ext  = EXT_FOR_MIME[mime] || '.png';
  const buf  = m[2] ? Buffer.from(m[3], 'base64') : Buffer.from(decodeURIComponent(m[3]), 'utf8');
  if (!fs.existsSync(IMAGES_DIR)) fs.mkdirSync(IMAGES_DIR, { recursive: true });
  // clean up any prior extension for this id
  for (const e of ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg']) {
    const old = path.join(IMAGES_DIR, id + e);
    if (e !== ext && fs.existsSync(old)) { try { fs.unlinkSync(old); } catch (_) {} }
  }
  fs.writeFileSync(path.join(IMAGES_DIR, id + ext), buf);
  covers[id] = dataUri;
  return './images/' + id + ext;
}

function removeCoverFiles(id) {
  for (const e of ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg']) {
    const f = path.join(IMAGES_DIR, id + e);
    if (fs.existsSync(f)) { try { fs.unlinkSync(f); } catch (_) {} }
  }
}

function sanitizeProject(p, id) {
  p = p || {};
  return {
    id,
    title:       String(p.title || 'Untitled'),
    description: String(p.description || ''),
    url:         String(p.url || ''),
    displayUrl:  String(p.displayUrl || String(p.url || '').replace(/^https?:\/\//, '')),
    cover:       p.cover || './images/' + id + '.png',
    coverW:      p.coverW || null,
    coverH:      p.coverH || null,
    tag:         String(p.tag || ''),
    category:    String(p.category || 'experiments'),
    tech:        Array.isArray(p.tech) ? p.tech.map(String) : String(p.tech || '').split(',').map(s => s.trim()).filter(Boolean),
    dateCreated: String(p.dateCreated || new Date().toISOString().slice(0, 10)),
    accent:      String(p.accent || '#8d6e2e'),
    hidden:      !!p.hidden,
  };
}

// ── request plumbing ────────────────────────────────────────────────────
function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}
function sendJSON(res, code, obj) {
  cors(res);
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(obj));
}
function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (c) => { data += c; if (data.length > 60 * 1024 * 1024) { reject(new Error('payload too large')); req.destroy(); } });
    req.on('end', () => { try { resolve(data ? JSON.parse(data) : {}); } catch (e) { reject(e); } });
    req.on('error', reject);
  });
}

// ── API handlers ────────────────────────────────────────────────────────
async function handleApi(req, res, pathname, query) {
  const idMatch = pathname.match(/^\/api\/projects\/(.+)$/);
  const id = idMatch ? decodeURIComponent(idMatch[1]) : null;

  if (pathname === '/api/health') return sendJSON(res, 200, { ok: true });

  // GET list
  if (pathname === '/api/projects' && req.method === 'GET') {
    const { projects, filters } = readManifest();
    const payload = { projects, filters };
    if (query.covers) payload.covers = readCovers();
    return sendJSON(res, 200, payload);
  }

  // CREATE
  if (pathname === '/api/projects' && req.method === 'POST') {
    const body = await readBody(req);
    const { projects, filters } = readManifest();
    const covers = readCovers();
    let pid = body.project && body.project.id ? slugify(body.project.id) : slugify(body.project && body.project.title);
    while (projects.some((x) => x.id === pid)) pid += '-' + Math.floor(Math.random() * 1000);
    const proj = sanitizeProject(body.project, pid);
    if (body.coverDataUri) { const rel = saveCover(pid, body.coverDataUri, covers); if (rel) proj.cover = rel; }
    projects.push(proj);
    writeManifest(projects, filters); writeCovers(covers);
    gitSync('admin: create project "' + proj.id + '"');
    return sendJSON(res, 201, { project: proj, projects });
  }

  // UPDATE (full)
  if (id && req.method === 'PUT') {
    const body = await readBody(req);
    const { projects, filters } = readManifest();
    const covers = readCovers();
    const idx = projects.findIndex((x) => x.id === id);
    if (idx === -1) return sendJSON(res, 404, { error: 'not found' });
    const proj = sanitizeProject(Object.assign({}, projects[idx], body.project), id);
    if (body.coverDataUri) { const rel = saveCover(id, body.coverDataUri, covers); if (rel) proj.cover = rel; }
    projects[idx] = proj;
    writeManifest(projects, filters); writeCovers(covers);
    gitSync('admin: update project "' + id + '"');
    return sendJSON(res, 200, { project: proj, projects });
  }

  // PATCH (partial — e.g. hide/show)
  if (id && req.method === 'PATCH') {
    const body = await readBody(req);
    const { projects, filters } = readManifest();
    const idx = projects.findIndex((x) => x.id === id);
    if (idx === -1) return sendJSON(res, 404, { error: 'not found' });
    projects[idx] = sanitizeProject(Object.assign({}, projects[idx], body.patch || {}), id);
    writeManifest(projects, filters);
    gitSync('admin: ' + (projects[idx].hidden ? 'hide' : 'update') + ' project "' + id + '"');
    return sendJSON(res, 200, { project: projects[idx], projects });
  }

  // DELETE
  if (id && req.method === 'DELETE') {
    const { projects, filters } = readManifest();
    const covers = readCovers();
    const idx = projects.findIndex((x) => x.id === id);
    if (idx === -1) return sendJSON(res, 404, { error: 'not found' });
    projects.splice(idx, 1);
    delete covers[id];
    removeCoverFiles(id);
    writeManifest(projects, filters); writeCovers(covers);
    gitSync('admin: delete project "' + id + '"');
    return sendJSON(res, 200, { projects });
  }

  return sendJSON(res, 405, { error: 'method not allowed' });
}

// ── static file serving ───────────────────────────────────────────────────
function serveStatic(req, res, pathname) {
  let rel = decodeURIComponent(pathname);
  if (rel === '/' || rel === '') rel = '/index.html';
  const filePath = path.normalize(path.join(ROOT, rel));
  if (!filePath.startsWith(ROOT)) { res.writeHead(403); return res.end('Forbidden'); }
  fs.stat(filePath, (err, stat) => {
    if (err || !stat.isFile()) { res.writeHead(404); return res.end('Not found'); }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    fs.createReadStream(filePath).pipe(res);
  });
}

// ── server ──────────────────────────────────────────────────────────────
const server = http.createServer(async (req, res) => {
  const parsed = url.parse(req.url, true);
  const pathname = parsed.pathname;
  if (req.method === 'OPTIONS') { cors(res); res.writeHead(204); return res.end(); }
  if (pathname.startsWith('/api/')) {
    try { await handleApi(req, res, pathname, parsed.query); }
    catch (e) { sendJSON(res, 400, { error: String(e && e.message || e) }); }
    return;
  }
  serveStatic(req, res, pathname);
});

server.listen(PORT, HOST, () => {
  console.log('\n  Projects in 3D — admin server');
  console.log('  ───────────────────────────────');
  console.log('  Listening on ' + HOST + ':' + PORT);
  console.log('  Site : http://localhost:' + PORT + '/');
  console.log('  API  : http://localhost:' + PORT + '/api/projects');
  console.log('  Editing content/ in: ' + ROOT + '\n');
});
