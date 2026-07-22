# 12 · Native Apps (Mac / iOS / iPad)

Friday runs as real native apps on Apple platforms — a small **Swift + WKWebView**
shell around the same web client. No Electron, no bundled Chromium, no npm, no
third-party dependencies. One app on iPhone/iPad, one on Mac; the web layer's
responsive design gives each the right layout automatically.

## The idea

A native window hosts the web app in `WKWebView` (system WebKit, the same engine
as Safari). The bundled web files are served by a tiny **loopback HTTP server**
inside the app at `http://127.0.0.1:47821`.

**Why loopback and not `file://`?** Friday depends on WebCrypto (accounts,
encryption), service workers, and BroadcastChannel — all of which require a
*secure context*. `http://127.0.0.1` is one; `file://` is not, reliably. Serving
over loopback gives WKWebView the exact origin the app was designed to run on, so
everything behaves as in a browser. A **fixed** port keeps the origin stable, so
the WebView's per-origin storage (your saved logins) persists across launches; it
falls back to an ephemeral port only if the fixed one is taken.

## Shared sources

| File | Role |
|---|---|
| `mac/Sources/LocalServer.swift` | the loopback static server (Foundation `Network`) |
| `mac/Sources/RelayStore.swift` | the off-grid relay/store engine ([09](09-offgrid-relay.md)) |
| `mac/Sources/MeshTransport.swift` | MultipeerConnectivity transport |
| `mac/Sources/MeshBridge.swift` | the JS shim exposing `window.FridayNativeMesh` |
| `mac/Sources/main.swift` | the AppKit app (window, menu, permissions) |
| `ios/Sources/main.swift` | the UIKit app (window + WKWebView) |

The iOS build reuses the Mac's shared Swift files; only the app entry point
(AppKit vs UIKit) differs.

## What the shell adds

- **Native window & menu** — traffic lights, transparent titlebar, real menu bar
  (Mac); full-screen with safe areas (iOS/iPad).
- **Media permission** — grants camera/mic to the bundled origin only, for Dark
  Sun voice.
- **External links** — provider OAuth and docs open in the real browser; the app
  stays on Friday.
- **Off-grid mesh** — the MultipeerConnectivity relay, bridged into `Net`. →
  [09](09-offgrid-relay.md)

## Build & run — Mac

```sh
cd mac && ./build.sh && open build/Friday.app
```

`build.sh` compiles the Swift (universal where the SDK allows), bundles the web
app under `Resources/web`, generates `AppIcon.icns` from `assets/logo` via
`sips`+`iconutil`, writes `Info.plist` (mic/camera/local-network usage,
`NSBonjourServices`), and ad-hoc signs. Or double-click `mac/Build
Friday.app.command`, then drag `Friday.app` to `/Applications`. First launch from
Finder may need **right-click ▸ Open** (ad-hoc signed, not notarized).

## Build & run — iOS / iPad (Simulator)

```sh
cd ios
./run-sim.sh "iPhone 16"
./run-sim.sh "iPad Pro 11-inch (M4)"
```

`build-sim.sh` builds a universal (arm64 + x86_64) Simulator binary, bundles the
web app, generates home-screen icons, and writes an iOS `Info.plist` (device
family 1 & 2, orientations, usage strings, Bonjour). The Simulator needs no code
signing.

## Real devices

A device build must be **code-signed with your Apple team** — the Simulator path
can't do that. Add `ios/Sources/main.swift` plus the shared `mac/Sources/*.swift`
to a small Xcode app target, copy the web app into the bundle under `web/`, keep
the `Info.plist` keys from `build-sim.sh`, set your bundle id + team, and build to
the device. For distribution, sign and notarize.

## Requirements & notes

- macOS 12+ / iOS 15+, and the Xcode command-line tools (`swiftc`, `sips`,
  `iconutil`, `codesign`) — all standard with Xcode.
- **Single instance / shared origin** — relaunching focuses the existing window;
  multiple Friday windows in one app share the origin and mesh together.
- **Org backend** — social login and organizations still need the Node server
  reachable; the native app is the client. Peer-to-peer messaging, boards, calls,
  the vault, and the off-grid mesh all work with no server.
