# 16 · Reference & Glossary

Quick lookups: the repo map, API and config tables, keyboard shortcuts,
cryptographic parameters, verification commands, and a glossary.

## Repository map

```
Friday/
├── index.html                 the desktop shell
├── css/friday.css             HDL tokens · the Hudson Glass · window chrome
├── js/friday.js               the entire web client (one file)
├── assets/                    logo.svg, PNG icons
├── sw.js                      offline service worker (never caches /api/*)
├── manifest.webmanifest       PWA manifest
├── server/
│   ├── friday-server.mjs      the optional backend (accounts, orgs, OIDC, signaling)
│   └── providers.example.json social-login config template
├── mac/
│   ├── Sources/{main,LocalServer,RelayStore,MeshTransport,MeshBridge}.swift
│   ├── Tests/RelayStoreTests.swift
│   └── build.sh
├── ios/
│   ├── Sources/main.swift
│   ├── build-sim.sh · run-sim.sh
│   └── README.md
└── docs/                      you are here (16 pages)
```

## API endpoints

| Method · Path | Auth | Page |
|---|:--:|---|
| `GET /api/health` | – | [10](10-backend.md) |
| `POST /api/challenge` · `/register` · `/login` · `/logout` | –/✓ | [10](10-backend.md) |
| `GET /api/me` | ✓ | [10](10-backend.md) |
| `POST /api/account/keys` | ✓ | [06](06-social-login.md) |
| `POST /api/orgs` · `/orgs/join` · `GET /api/orgs/:id/members` · `POST /api/orgs/:id/invites` | ✓ | [10](10-backend.md) |
| `POST /api/signal` · `/mailbox` | ✓ | [10](10-backend.md) |
| `GET /api/events` (SSE) | ✓ | [10](10-backend.md) |
| `GET /api/auth/providers` · `/auth/:p/start` · `/auth/:p/callback` | – | [06](06-social-login.md) |

## Configuration & environment

| Variable | Default | Purpose |
|---|---|---|
| `PORT` | `4000` | backend listen port |
| `FRIDAY_DB` | `server/friday.db` | SQLite path |
| `FRIDAY_PUBLIC_URL` | `http://localhost:$PORT` | OIDC redirect origin |
| `FRIDAY_OIDC_FILE` / `FRIDAY_OIDC` | `server/providers.json` | provider config |
| native loopback port | `47821` (fixed) | WKWebView origin |
| `?guest=1` | – | ephemeral session / test hook |

## Cryptographic parameters

| Purpose | Primitive |
|---|---|
| Vault key derivation | PBKDF2-SHA-256, 310,000 iterations, 16-byte salt |
| Vault encryption | AES-256-GCM, 12-byte IV |
| Message key agreement | X25519 ECDH (P-256 fallback) |
| Message key derivation | HKDF-SHA-256, salt `friday.e2e.v2` |
| Message encryption | AES-256-GCM, per recipient |
| Server auth signature | Ed25519 (ECDSA P-256 fallback), nonce challenge |
| OIDC ID-token verify | RS256 / ES256 against provider JWKS |
| Off-grid transport | MultipeerConnectivity, `.required` encryption |
| Vault erasure coding | Reed-Solomon over GF(2⁸), generator `0x11D` |
| Ledger permanence | FNV-1a hash chain |

## Keyboard & gestures

| Key | Action |
|---|---|
| `⌘K` | Spotlight search |
| `⇧⌘D` | toggle Light/Dark |
| `⌃⌘Q` | Lock Friday |
| `Esc` | close Spotlight / Control Center / menus |
| double-click titlebar | zoom window |

## Verification commands

```sh
# relay/store engine unit tests
swiftc mac/Sources/RelayStore.swift mac/Tests/RelayStoreTests.swift -o /tmp/rt && /tmp/rt

# web client syntax
node --check js/friday.js

# backend syntax + health
node --check server/friday-server.mjs
node server/friday-server.mjs &  curl -s localhost:4000/api/health
```

The project has no automated suite checked in as a runner; verification through
this build was done with focused unit tests (relay engine, crypto round-trips),
a backend API exercise (challenge/response, org join, signaling, mailbox), and
in-browser DevTools-Protocol runs of the auth, multi-login, and OIDC flows.

## Glossary

- **Orange PIE** — the platform; Friday is its web face. Final name: **Eros Office**.
- **Dark Core** — the routing substrate (the mesh). See [08](08-mesh.md).
- **Dark Sun** — the encrypted voice subsystem (Calls).
- **HDL** — the Hudson Design Language, by The Acadia. See [13](13-design-language.md).
- **The Hudson Glass** — HDL's single translucent UI material.
- **Vault** — the passphrase-encrypted local store of your keys (account), or the
  erasure-coded file store (Vault app). Context distinguishes them.
- **wire** — the E2E envelope (`{iv, ct, …}`) that actually crosses the network.
- **Envelope / `fid` / `ttl`** — the off-grid relay wrapper and its dedup id +
  hop count. See [09](09-offgrid-relay.md).
- **Node / peer** — a running Friday instance on the mesh, identified by a public
  key.
- **Rendezvous** — the server's only live role: relaying opaque signaling so
  devices connect directly.
- **Federated account** — an account whose identity is proven by a social login
  (`provider:sub`). See [06](06-social-login.md).
- **Pocket pane** — the mobile layout (HDL §11.1) under 760px.

## Credits

Glass Stone LLC · CEO Gabriel B. Rodriguez · Orange PIE V1 Alpha · 2026–2027.
Design language original to The Acadia. Repository:
<https://github.com/GlassStoneLabs/Friday>.
