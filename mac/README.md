# Friday for macOS

A native macOS app — a real `.app` you can drop in `/Applications`, with its own
Dock icon, window, and menu bar. No Electron, no bundled Chromium, no npm.

It's a thin **Swift + WKWebView** shell (the same engine as Safari) around the
Friday web app. The bundled web files are served over a loopback HTTP server
(`http://127.0.0.1:47821`) inside the app, which gives WKWebView a real
*secure-context* origin — so WebCrypto (your encrypted accounts and end-to-end
encryption), service workers, and the BroadcastChannel/WebRTC mesh all work
exactly as they do in a browser. Nothing leaves the machine.

## Build it

```sh
cd mac
./build.sh
open build/Friday.app
```

Or double-click **`Build Friday.app.command`** in Finder, then drag the built
`Friday.app` into Applications.

Requirements: macOS 12+ and the Xcode command-line tools (`swiftc`, `sips`,
`iconutil`, `codesign`) — all standard with Xcode. Zero third-party dependencies.
The app is ad-hoc signed so it runs locally; the first launch may need
**right-click ▸ Open** (unsigned-developer Gatekeeper prompt).

## What's in the bundle

```
Friday.app/Contents/
├── MacOS/Friday            the native executable (arm64; universal where the SDK allows)
├── Resources/
│   ├── web/                the whole Friday web app (index.html, css, js, assets…)
│   └── AppIcon.icns        generated from assets/logo
└── Info.plist              incl. mic/camera usage strings for Dark Sun voice
```

## Sources

- `Sources/main.swift` — the AppKit app: window, WKWebView, native menu,
  media-permission and external-link handling.
- `Sources/LocalServer.swift` — the tiny loopback static-file server
  (Foundation `Network` framework only).

## Notes

- **Stable origin.** The server prefers a fixed port so your saved logins
  (kept in the WebView's per-origin storage) persist across launches.
- **Single instance.** Relaunching focuses the existing window; multiple Friday
  windows in the one app share the origin, so they mesh together over
  BroadcastChannel.
- **Org backend.** Social login / organizations still need the Node server
  (`server/friday-server.mjs`) running somewhere reachable; the Mac app is the
  client. Peer-to-peer messaging, boards, calls and the vault work with no
  server at all.
