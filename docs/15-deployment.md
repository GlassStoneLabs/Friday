# 15 · Deployment & Operations

How to serve Friday and run its optional backend in production. The web app is
static; the backend is a single dependency-free Node process.

## Serving the web app

It's static files (`index.html`, `css/`, `js/`, `assets/`, `sw.js`,
`manifest.webmanifest`) — any static host works. Two requirements:

1. **HTTPS** (or `http://localhost`). WebCrypto, service workers, and offline
   mode need a secure context. Plain `http://` on a public host disables accounts.
2. Serve `sw.js` from the app root so the service worker's scope covers the app.

### GitHub Pages (built in)

The repo mirrors `main` to the `gh-pages` branch on push
(`.github/workflows/pages.yml`), publishing to
**<https://glassstonelabs.github.io/Friday/>**. This build has **no backend**, so
it runs peer-to-peer only — organizations and social login are absent, which the
UI states honestly. Everything else works.

The service worker never caches `/api/*` or `/api/events` — only the app shell —
so a deployed backend is never shadowed by a stale response.

## Running the backend

```sh
node server/friday-server.mjs
```

Serves the API **and** the app on one port. Zero dependencies (`node:http`,
`node:sqlite`, `node:crypto`); requires a recent Node with `node:sqlite`.

### Environment

| Variable | Default | Purpose |
|---|---|---|
| `PORT` | `4000` | listen port |
| `FRIDAY_DB` | `server/friday.db` | SQLite database path |
| `FRIDAY_PUBLIC_URL` | `http://localhost:$PORT` | public origin for OIDC redirect URIs |
| `FRIDAY_OIDC_FILE` | `server/providers.json` | social-login provider config |
| `FRIDAY_OIDC` | – | provider config inline as JSON |

### Behind a reverse proxy

Terminate TLS at your proxy (nginx/Caddy) and forward to the Node port. For the
SSE stream (`/api/events`) **disable response buffering** and allow long-lived
connections (the server sends a 25 s heartbeat). Example nginx location:

```
location /api/events { proxy_pass http://127.0.0.1:4000; proxy_buffering off;
                       proxy_read_timeout 3600s; proxy_set_header Connection ''; }
```

CORS is permissive on the API, so you may serve the static app from one origin
(e.g. Pages) and point it at the backend on another — set the app's server base
accordingly (`localStorage["friday.server"]` or same-origin by default).

### Enabling social login

Configure providers and run over HTTPS at a real domain — full steps in
[06 · Social Login](06-social-login.md). Register
`<public-url>/api/auth/<provider>/callback` with each provider.

## Operations

- **Backup** — copy `server/friday.db` (WAL: include `-wal`/`-shm` or checkpoint
  first). It holds accounts, orgs, membership, and opaque mailbox blobs — no
  message plaintext, no passwords.
- **Housekeeping** — challenges (5 min), OIDC state (10 min), and mailbox (30
  days) are swept automatically; no cron needed.
- **Scaling** — the server is a light rendezvous/directory; real traffic goes
  peer-to-peer after signaling. A single modest instance serves a large mesh. It
  keeps SSE clients in memory, so run one instance (or add sticky sessions +
  shared presence if you must scale out).
- **Secrets** — `providers.json` holds OAuth client secrets; keep it off the web
  root (the static handler refuses to serve the `server/` directory) and out of
  git (it's `.gitignore`d).

## Native distribution

The `.app` builds here are **ad-hoc signed** for local use. For distribution,
sign with a Developer ID and **notarize** (Mac) or ship through TestFlight/App
Store with your team profile (iOS/iPad). → [12 · Native Apps](12-native-apps.md).

## Health & smoke checks

```sh
curl -s http://localhost:4000/api/health          # {"ok":true,…,"accounts":N}
curl -s -o /dev/null -w '%{http_code}\n' http://localhost:4000/   # 200 (the app)
```
