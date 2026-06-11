# Friday · Eros Office

*Orange PIE V1 Alpha — Glass Stone LLC*

Friday is the web face of Orange PIE: a secure, mesh-network workspace —
messages, boards, calls, and erasure-coded storage that travel an encrypted
mesh (Wi-Fi · Bluetooth LE · LoRa · Tor) with no central server. The more
devices that join the mesh, the safer it becomes.

The interface is a macOS-style Liquid Glass desktop set in **the Hudson
Design Language, by The Acadia** — one material (the Hudson Glass), the
Hudson palette (Parchment by day, Anthracite by night, Carmine as the
voice), serif display type, mono maker's marks, and motion that settles
instead of bouncing.

## Install — pick whichever is easiest

**0 · Just visit the site**
The repo auto-deploys to GitHub Pages:
**<https://glassstonelabs.github.io/Friday/>** — open it, then install it as
an app. Works offline after the first visit. One codebase, four platforms:

| Platform | How to install |
| --- | --- |
| **Web** | Just visit the URL — nothing to install |
| **Mac** | Chrome/Edge: install icon in the address bar · Safari: **File ▸ Add to Dock…** |
| **Android** | Chrome: **⋮ ▸ Add to Home screen ▸ Install** — installs as a real app |
| **iOS / iPadOS** | Safari: **Share ▸ Add to Home Screen** — full-screen, offline-capable |

On phones Friday switches to the **pocket pane** (HDL §11.1): full-screen
surfaces with a floating glass tab bar — the desktop metaphor stays on
desktops.

**1 · Double-click (macOS)**
Open `Install Friday.command`. It serves the app at `http://localhost:4173`
and opens your browser. *(If macOS blocks it the first time: right-click ▸ Open.)*

**2 · Any terminal**
```sh
cd Friday
python3 -m http.server 4173      # or: npx serve
```
Then visit <http://localhost:4173>.

**3 · Zero setup**
Just double-click `index.html`. Everything works straight from the file —
no build step, no dependencies. (Offline mode and "install as app" need
option 1 or 2, since browsers only enable those over http.)

**Install as a real app (PWA)**
With the app open over http: Chrome/Edge show an install icon in the address
bar; in Safari use **File ▸ Add to Dock…**. Friday then launches in its own
window, with its own dock icon, and works offline.

## What's inside

| Surface | What it does | Real? |
| --- | --- | --- |
| **Mesh** | Live Dark Core graph of **actual** connected nodes — real presence, real round-trip latency, real link count | ✅ real |
| **Messages** | `# dark-core` broadcast room + per-peer DMs; every message is **really sealed and delivered** to live peers | ✅ real |
| **Boards** | monday-style work panes, drag cards between columns | illustrative |
| **Calls** | Project Dark Sun voice — GSM-FR at 1200 bps, Triple Diffie-Hellman | illustrative |
| **Vault** | Reed-Solomon shard map — lose nodes, reconstruct the file | illustrative |
| **Ledger** | Two sets of records — editable + permanent, Merkle-chained & **really verifiable** | ✅ real crypto |
| **Settings** | Light/Dark/Auto, accent tinting, glass diffusion, profiles | ✅ real |

### The mesh is real — no simulation

Friday joins a **real, serverless mesh** the moment it loads:

- **BroadcastChannel** — every Friday tab, window, or installed app on a device
  is a real node. Presence, latency (live ping/pong), and messages genuinely
  travel between them. Open Friday in two tabs and watch the node count rise.
- **WebRTC DataChannel** — **Mesh ▸ Link a device** connects a *second device*
  peer-to-peer with copy/paste signaling and **no server** (public STUN is used
  only for NAT discovery and never sees your data).
- **Real pairwise E2E** — peers exchange X25519 public keys over the transport,
  so each message is sealed per-recipient with a real shared key
  (HKDF-SHA-256 → AES-256-GCM) and opened by the real far end. Verified in
  Chrome: A→B and B→A round-trip, third parties cannot open the envelope.

With no peers present, the mesh honestly shows **one node** and the room is
empty — nothing is faked. (E2E needs https or localhost; the Pages URL covers it.)

Also: ⌘K search, Control Center (top right), live menu bar, three
wallpapers, and `#app` deep-links (e.g. `…/Friday/#ledger`).

**Accounts are real and encrypted — no server.** On first run Friday asks
you to create an account: a display name and a passphrase. The passphrase
is stretched with **PBKDF2-SHA-256 (310,000 iterations)** into an
**AES-256-GCM** key that encrypts a vault holding your mesh identity
(X25519 keypair) and profile, stored only in this browser. Signing in is
genuine — the passphrase and key are never stored, so a wrong passphrase
simply fails GCM authentication and **cannot** decrypt the vault. Your
identity (and thus your mesh node) persists across sessions. Lock anytime
from the Friday menu (⌃⌘Q) or the phone header; manage or erase the vault
in **Settings ▸ Account**. (Needs https or localhost; on plain http the
gate is skipped with a notice.)

**Sending is really encrypted, to real peers.** Outgoing messages are
sealed in the browser with WebCrypto — X25519 (or P-256) ECDH →
HKDF-SHA-256 → AES-256-GCM, keyed to each recipient's real public key —
then actually transmitted over BroadcastChannel/WebRTC and opened by the
real far end. Tap the lock on any bubble to read the ciphertext that
went on the wire. Needs https or localhost; over plain http the ribbon
says UNSEALED.

## Anatomy

```
Friday/
├── index.html            the desktop shell
├── css/friday.css        HDL tokens · the Hudson Glass · window chrome
├── js/friday.js          window manager · dock · menu bar · the six apps
├── assets/logo.svg       the Friday mark — a mesh constellation forming an F
├── assets/icons/         PNG app icons (regenerate: python3 tools/make_icons.py)
├── manifest.webmanifest  PWA manifest
└── sw.js                 offline cache
```

## Protocol lineage

The surfaces model the Orange PIE blueprint stack:
[bitchat](https://github.com/permissionlesstech/bitchat) (BLE mesh,
Noise protocol, store-and-forward) ·
[Reticulum](https://github.com/markqvist/Reticulum) (cryptography-first
routing) · [GhostWire](https://github.com/Phantomojo/GhostWire-secure-mesh-communication)
(PoW admission, adaptive transports) · PairPhone/[Torfone](https://github.com/gegel/torfone)
(GSM-FR voice over Tor) · [Tahoe-LAFS](https://github.com/tahoe-lafs/tahoe-lafs)
(erasure-coded grids) · immudb-style Merkle ledgers.

No frameworks, no build, no tracking. One material, a palette, a grid,
a voice, a horizon — nothing else, in that order.
