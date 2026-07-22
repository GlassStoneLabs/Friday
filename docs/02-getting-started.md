# 02 · Getting Started

Every way to run Friday, quickest first. The web app is identical in all of them;
what differs is the shell around it.

## 0 · Just open the site

The repository auto-deploys to GitHub Pages:

**<https://glassstonelabs.github.io/Friday/>**

Open it, create an account, and you're in. Install it as an app from there:

| Platform | Install |
|---|---|
| Web | Nothing to install — just use the URL |
| Mac | Chrome/Edge: install icon in the address bar · Safari: **File ▸ Add to Dock…** |
| Android | Chrome: **⋮ ▸ Add to Home screen ▸ Install** |
| iOS/iPadOS | Safari: **Share ▸ Add to Home Screen** |

The Pages deployment has **no backend**, so it runs peer-to-peer only —
organizations and social login need a server (below). Messaging, boards, calls,
and the vault all work with no server.

## 1 · Run it locally (no dependencies)

From the repo root:

```sh
python3 -m http.server 4173      # or: npx serve
```

Then visit <http://localhost:4173>. On macOS you can instead double-click
`Install Friday.command`, which serves the app and opens your browser.

> **Why a server for local dev?** WebCrypto (accounts, encryption), service
> workers, and offline mode require a *secure context*. `http://localhost` is one;
> opening `index.html` as a `file://` URL is not, so accounts are disabled there.

## 2 · Run the backend (accounts + orgs, still local)

```sh
node server/friday-server.mjs        # serves the API *and* the app on :4000
```

Open <http://localhost:4000>, create an account, then **create an org or join one
with an invite code**. Zero dependencies — `node:http`, `node:sqlite`,
`node:crypto`. Data lives in `server/friday.db` (`FRIDAY_DB=…` to relocate it).
Full details: [10 · Backend](10-backend.md).

## 3 · Native Mac app

```sh
cd mac && ./build.sh && open build/Friday.app
```

Or double-click `mac/Build Friday.app.command`, then drag `Friday.app` into
`/Applications`. It's a Swift + WKWebView shell — no Electron. First launch from
Finder may need **right-click ▸ Open** (ad-hoc signed, not notarized). See
[12 · Native Apps](12-native-apps.md).

## 4 · Native iOS / iPad app (Simulator)

```sh
cd ios
./run-sim.sh "iPhone 16"
./run-sim.sh "iPad Pro 11-inch (M4)"
```

Builds a universal Simulator binary and launches it. For a **real device** you
must code-sign with your Apple team — open the sources in an Xcode target. See
[12 · Native Apps](12-native-apps.md).

## First-run flow

1. **Create your account** — display name + a passphrase (≥ 8 characters), or
   "Continue with Google/Apple" if a configured server offers it. The passphrase
   encrypts a local vault holding your keys; it is never transmitted.
2. **Your organization** (only if a server is reachable) — create one and get an
   invite code, join with a code, or skip and stay peer-to-peer.
3. **The desktop opens** — Mesh and Messages appear first.

## Guest / ephemeral session

Append `?guest=1` to the URL to skip the lock screen with fresh, non-persisted
keys. This is handy for demos and is also the automated-test hook. Nothing is
saved; closing the tab discards the identity.

## Seeing the mesh work

Open Friday in **two tabs** (or two windows) of the same browser: the node count
rises and both can talk in `# dark-core` with live typing indicators — that is
the real BroadcastChannel transport, no server involved. To connect two *devices*,
use **Mesh ▸ Link a device** (WebRTC copy/paste) or an org server's automatic
rendezvous. On Apple devices, nearby copies mesh over Wi-Fi/Bluetooth
automatically. → [08](08-mesh.md), [09](09-offgrid-relay.md)
