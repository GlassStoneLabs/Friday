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

## The backend (optional)

Friday works with **no server at all** — the mesh is peer-to-peer. A server adds
exactly three things: an account you can prove is yours, an **organization**, and
a rendezvous so devices connect without copy/pasting codes.

```sh
node server/friday-server.mjs        # serves the API *and* the app on :4000
```
Then open <http://localhost:4000>, create an account, and **create an org or join
one with an invite code** (`ABCD-EFGH-JKMN`). Zero dependencies — `node:http`,
`node:sqlite`, `node:crypto`. Data lives in `server/friday.db` (`FRIDAY_DB=` to move it).

**There is no password on the server.** Your account *is* a keypair: you sign a
one-time nonce with Ed25519 to prove it's you. The passphrase never leaves the
browser — it only decrypts your local vault.

| The server knows | The server never sees |
| --- | --- |
| display names, public keys, org membership, who's online, blob sizes/timing | message plaintext, board contents, voice audio, vault files, your passphrase |

Everything stays sealed end-to-end (X25519 · HKDF · AES-256-GCM) between the
endpoints. Once two devices are introduced, traffic goes **direct** — it does not
route back through the server. Without a server, the org panel says so plainly and
the mesh keeps working.

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
| **Boards** | monday-style panes; card add/rename/move/delete **really sync live** across tabs & devices (LWW-CRDT) and **auto-save encrypted** | ✅ real |
| **Calls** | **Real WebRTC voice** to a live peer — your mic, SDP **sealed per-peer** (X25519), and **every audio frame end-to-end encrypted** (AES-256-GCM) on top of DTLS-SRTP, no server | ✅ real |
| **Vault** | **Real Reed-Solomon erasure coding** — seal a file, scatter it into shards, seize any few, **rebuild the exact bytes** (SHA-256 verified) | ✅ real |
| **Ledger** | Two sets of records — editable + permanent, Merkle-chained & **really verifiable** | ✅ real crypto |
| **Settings** | Light/Dark/Auto, accent tinting, glass diffusion, profiles | ✅ real |

Boards, Calls, and Vault used to be illustrative. They aren't any more — see below.

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

**Boards really sync, and auto-save.** Each card is an element in a
last-write-wins set — a genuine CRDT. Add, rename, recolor, drag, or
delete a card and the operation is broadcast over the mesh; any node that
has seen the same operations converges to the same board, no server and no
ordering required. Open Friday in two tabs (or link a device) and watch an
edit in one appear in the other. State auto-saves — **encrypted into your
account vault** when signed in, otherwise to local storage — so it survives
reloads and rides along on the mesh.

**Calls are real WebRTC voice — end-to-end sealed.** Pick a live node and
call it: Friday opens your microphone (`getUserMedia`), and the offer/answer
**SDP is sealed per-recipient** with the peer's X25519 key before it crosses
the mesh. On top of WebRTC's mandatory **DTLS-SRTP**, Friday adds its own
**end-to-end layer**: using [WebRTC Encoded
Transforms](https://developer.mozilla.org/en-US/docs/Web/API/RTCRtpSender/transform),
every encoded audio frame is encrypted in the browser with **AES-256-GCM**
under the *same* X25519-derived shared key the messages use — so the voice
is sealed by the app itself, not merely trusted to the transport, and **no
server ever sees plaintext**. Both peers negotiate the capability and the
live call shows a running count of frames sealed/opened as proof; where
Encoded Transforms aren't available it falls back to DTLS-SRTP and says so.
Calls ring even with the app closed, the waveform is driven by real audio
amplitude, mute really disables the track, and a short call log
**auto-saves encrypted**. (Two tabs on one machine will echo — use
headphones, or a second device.)

**The Vault really erasure-codes your files.** Drop in any file. Friday
seals it with a fresh **AES-256-GCM** key (the read capability), then
Reed-Solomon-codes the *ciphertext* over **GF(2⁸)** (primitive polynomial
`0x11D`) into **10 data + 6 parity shards** — a systematic MDS code, so no
single shard reveals anything and **any 10 of the 16 rebuild the file**.
Click shards to seize their nodes, then reconstruct: the real decoder
recovers the ciphertext, AES-GCM decrypts it, and the result is checked
byte-for-byte against the original's **SHA-256** before you download it.
Encrypt-then-shard is the Tahoe-LAFS discipline; the math here is the real
thing, not a picture of it.

All three need WebCrypto (https or localhost) for sealing; WebRTC voice and
cross-device sync also want a secure origin. The Pages URL covers both.

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
