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
an app (Chrome/Edge: install icon in the address bar · Safari: File ▸ Add to
Dock…). Works offline after the first visit.

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

| Surface | What it does |
| --- | --- |
| **Mesh** | Live Dark Core view — self-healing topology, transport layers, PoW trust |
| **Messages** | Channels & DMs, end-to-end, onion-routed three hops |
| **Boards** | monday-style work panes, drag cards between columns, CRDT-synced |
| **Calls** | Project Dark Sun voice — GSM-FR at 1200 bps, Triple Diffie-Hellman |
| **Vault** | Reed-Solomon shard map — lose nodes, reconstruct the file |
| **Settings** | Light/Dark/Auto, accent tinting, glass diffusion, profiles |

Also: ⌘K search, Control Center (top right), live menu bar, three wallpapers.

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

No frameworks, no build, no tracking. One material, a palette, a grid,
a voice, a horizon — nothing else, in that order.
