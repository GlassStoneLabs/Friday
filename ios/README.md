# Friday for iOS & iPadOS

A native iPhone/iPad app — the Friday web experience in a system WKWebView, with
the bundled web files served over a loopback secure-context origin so WebCrypto
(encrypted accounts, end-to-end encryption), service workers, and the mesh all
run unchanged. Same design as the Mac app; no third-party dependencies.

Because Friday already ships a responsive layout (the HDL "pocket pane"), the one
app is a proper phone UI on iPhone and the wider two-pane layout on iPad — no
separate code paths.

## Run it in the Simulator

```sh
cd ios
./run-sim.sh "iPhone 16"
./run-sim.sh "iPad Pro 11-inch (M4)"
```

`build-sim.sh` compiles a universal (arm64 + x86_64) Simulator binary with
`swiftc`, bundles the web app, generates the app icons from `assets/logo`, and
writes the `Info.plist`. The Simulator needs no code signing.

## Run it on a real iPhone/iPad

A device build must be code-signed with your Apple team. Open the two sources in
a small Xcode app target and add them, or point an existing target at:

- `ios/Sources/main.swift` — the UIKit app (window + `WKWebView`, media
  permissions, external-link handling).
- `../mac/Sources/LocalServer.swift` — the loopback static server (shared with
  the Mac app; Foundation `Network` framework only).

Copy the web app (`index.html`, `css/`, `js/`, `assets/`, `sw.js`,
`manifest.webmanifest`) into the target's bundle under a `web/` folder, keep the
`Info.plist` keys from `build-sim.sh` (device family 1 & 2, mic/camera/local-
network usage strings), set your bundle id + team, and build to the device.

## Notes

- **Stable origin.** The app prefers a fixed loopback port so the WebView's
  per-origin storage (your saved logins) persists across launches; it falls back
  to an ephemeral port only if that one is busy — e.g. an iPhone and an iPad
  Simulator running at once on the same Mac share the host loopback.
- **Org backend.** Social login / organizations still need the Node server
  (`server/friday-server.mjs`) reachable; the app is the client. Peer-to-peer
  messaging, boards, calls and the vault work with no server at all.
