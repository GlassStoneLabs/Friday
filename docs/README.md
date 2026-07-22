# Friday — Documentation

*Eros Office · Orange PIE V1 Alpha · Glass Stone LLC*

A workspace that needs no server to be one. Sixteen pages, sequenced as a working
manual — from what Friday is, through its security model, mesh, encryption, and
surfaces, to running the backend and building the native apps.

## Contents

| # | Page | What it covers |
|---|------|----------------|
| 01 | [Introduction](01-introduction.md) | What Friday is, the thesis, the platforms |
| 02 | [Getting Started](02-getting-started.md) | Every way to run it — web, PWA, Mac, iPhone, iPad |
| 03 | [Architecture](03-architecture.md) | The layers: web app, optional backend, native shells |
| 04 | [Security Model](04-security-model.md) | Threat model — what's sealed, what a server can see |
| 05 | [Accounts & Logins](05-accounts.md) | The encrypted vault, multiple logins, remember-me |
| 06 | [Social Login (OIDC)](06-social-login.md) | Google/Apple as identity, keys stay on the device |
| 07 | [End-to-End Encryption](07-encryption.md) | X25519 · HKDF · AES-256-GCM, per-recipient sealing |
| 08 | [The Mesh — Dark Core](08-mesh.md) | Presence, transports, peers, the `Net` layer |
| 09 | [Off-Grid Relay](09-offgrid-relay.md) | MultipeerConnectivity, store · transmit · relay |
| 10 | [Organizations & the Backend API](10-backend.md) | Rendezvous, directory, invites, the full API |
| 11 | [The Surfaces](11-surfaces.md) | Mesh, Messages, Boards, Calls, Vault, Ledger, Settings |
| 12 | [Native Apps](12-native-apps.md) | Mac / iOS / iPad — how the WKWebView shell works |
| 13 | [The Hudson Design Language](13-design-language.md) | Tokens, glass, palette, type, motion |
| 14 | [Data & Storage](14-data-storage.md) | What is stored where, and how it's protected |
| 15 | [Deployment & Operations](15-deployment.md) | Serving, HTTPS, providers, ports, the database |
| 16 | [Reference & Glossary](16-reference.md) | API table, config, shortcuts, repo map, glossary |

## Also see

- **[TECHNICAL.md](../TECHNICAL.md)** — the engineering specification: protocols,
  wire formats, sequence/state/ER diagrams, cryptographic constructions, and a
  STRIDE threat model. This manual is the "how to use it"; that is the "how it
  works, exactly."

## Conventions

- Code paths are given relative to the repository root — e.g. `js/friday.js`,
  `server/friday-server.mjs`, `mac/Sources/MeshTransport.swift`.
- "The web app" means the browser client (`index.html` + `css/` + `js/`), which
  is the same code whether it runs in a browser, a home-screen PWA, or inside a
  native shell.
- "The server" always means the *optional* org backend. Friday runs fully
  without one; where a feature needs it, the page says so plainly.

## The one-paragraph version

Your account is a keypair, not a password. Everything you send is sealed
end-to-end (X25519 → HKDF → AES-256-GCM) between devices, which find each other
on a serverless mesh — browser tabs, WebRTC links, and, on Apple devices, a real
off-grid Wi-Fi/Bluetooth relay. A small optional server can host an organization
and introduce devices, but it never sees message plaintext. The interface is the
Hudson Design Language: one material, a palette, a grid, a voice, a horizon.
