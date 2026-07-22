# 03 · Architecture

Friday is three things layered thinly: a **web client** that holds all the logic,
an **optional backend** that only introduces devices, and **native shells** that
let the client run as a real app. Content and keys live at the edges; the middle
is deliberately dumb.

## The layers

```
┌───────────────────────────────────────────────────────────────┐
│  Native shell (optional)   mac/ · ios/                         │
│  WKWebView + loopback server + off-grid mesh (MultipeerConn.)  │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │  WEB CLIENT   index.html · css/friday.css · js/friday.js │  │
│  │                                                          │  │
│  │  UI:    WM · Dock · MenuBar · Spotlight · ControlCenter  │  │
│  │  Apps:  Mesh Messages Boards Calls Vault Ledger Settings │  │
│  │  Crypto: E2E (X25519·HKDF·AES-GCM)   Account (vault)     │  │
│  │  Mesh:  Net  ──bc──  ──webrtc──  ──native mpc──          │  │
│  │  Server client: Server (fetch + SSE)                     │  │
│  └─────────────────────────────────────────────────────────┘  │
└───────────────────────────────┬───────────────────────────────┘
                                 │  HTTPS + SSE (metadata only)
                    ┌────────────┴─────────────┐
                    │  BACKEND (optional)       │
                    │  server/friday-server.mjs │
                    │  accounts · orgs · signal │
                    │  mailbox · OIDC · SQLite  │
                    └───────────────────────────┘
```

## The web client (`js/friday.js`, ~3,000 lines, one file)

Organized into clearly delimited `/* ---- Section ---- */` blocks. The important
modules:

| Module | Role | Page |
|---|---|---|
| `State` / `applyState` | theme, accent, glass, wallpaper; persisted | [13](13-design-language.md) |
| `Account` / `Remember` | encrypted vault, multiple logins, remember-me | [05](05-accounts.md) |
| `E2E` | pairwise X25519/HKDF/AES-GCM sealing | [07](07-encryption.md) |
| `Server` | org backend client (auth, orgs, signaling, OIDC, SSE) | [10](10-backend.md) |
| `Net` | the mesh: presence, transports, framing, relay | [08](08-mesh.md) |
| `WM` | window manager (open/focus/drag/resize/minimize/zoom) | [11](11-surfaces.md) |
| `Apps.*` | the six surfaces + About | [11](11-surfaces.md) |
| `Auth` | the lock screen / logins page / org step | [05](05-accounts.md) |
| `Mobile` | the pocket-pane layout under 760px | [11](11-surfaces.md) |

Rendering is plain DOM built with three helpers — `el(tag, cls, html)`,
`$(sel, root)`, `esc(str)` — no virtual DOM, no reactivity library. Each app has
`render(body, rec)` and an optional `teardown()` that cleans up intervals,
timers, and subscriptions.

## The mesh (`Net`)

`Net` is transport-agnostic. It speaks one small frame vocabulary — `hello`,
`bye`, `ping`/`pong`, `msg`, `typing` — and fans each frame out over every
available transport:

- **BroadcastChannel** — every same-origin tab/window/installed app (works with
  no network, on one machine).
- **WebRTC DataChannel** — device-to-device, established by copy/paste or by the
  server's signaling relay.
- **Native MultipeerConnectivity** — on Apple apps, Wi-Fi + Bluetooth off-grid,
  with multi-hop relay and store-and-forward. → [09](09-offgrid-relay.md)

Peers announce their public key in `hello`, so any two peers can seal to each
other directly regardless of which transport carried the introduction.

## The backend (`server/friday-server.mjs`)

A **rendezvous and directory**, not a content server. It stores accounts
(public keys), org membership, and short-lived signaling/mailbox data in SQLite,
and relays opaque WebRTC offers so two devices can find each other and then talk
peer-to-peer. Once a link is up, traffic does not route back through it. It never
receives message plaintext. → [10](10-backend.md)

## The native shells (`mac/`, `ios/`)

A thin Swift app hosting the web client in `WKWebView`. It serves the bundled
web files over a **loopback HTTP server** (`http://127.0.0.1:47821`) so the
WebView gets a real secure-context origin — the reason WebCrypto, service
workers, and the mesh all behave exactly as in a browser. The native side adds
the off-grid MultipeerConnectivity transport and bridges it to `Net`. →
[12](12-native-apps.md)

## Data-flow example: sending a message

1. You type in Messages. `E2E.seal(peerPub, text)` produces AES-GCM ciphertext.
2. `Net.sendTo(peerId, {t:"msg", …, wire})` transmits the *ciphertext* over
   whichever transports reach that peer (WebRTC, BroadcastChannel, native mesh).
3. If the peer is offline and a server exists, the ciphertext is left in the
   server **mailbox** — still unreadable by the server.
4. The peer's `Net.recv` decrypts with `E2E.open(yourPub, wire)` and renders it.

The server, at most, saw an opaque blob move from A toward B.
