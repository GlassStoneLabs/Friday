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

## Off-grid mesh — store, transmit, relay

Each app is a real mesh node. The native side runs **MultipeerConnectivity**
(peer discovery + encrypted transport over Wi-Fi, peer-to-peer Wi-Fi, and
Bluetooth — no server, no internet) and bridges it into the web app's `Net`
layer as another transport alongside BroadcastChannel and WebRTC.

- **Transmit** — the app's frames (presence, messages, typing…) are carried
  between nearby devices with no infrastructure.
- **Relay** — a device re-broadcasts frames it hasn't seen before, with a hop
  count, so A reaches C through B (multi-hop flooding, de-duplicated).
- **Store & forward** — recent frames are held briefly and replayed to a peer
  that connects a moment later, so a device that was away still receives them.

The relay engine (`mac/Sources/RelayStore.swift`) is transport-agnostic and
unit-tested: `swiftc mac/Sources/RelayStore.swift mac/Tests/RelayStoreTests.swift -o /tmp/rt && /tmp/rt`.
Message content is never inspected by the mesh — it stays sealed end-to-end
between the web endpoints.

> Live device-to-device discovery uses real Wi-Fi/Bluetooth radios, so it must
> be exercised on **physical devices** (the Simulator doesn't emulate them). The
> relay logic and the web↔native bridge are verified without hardware.

## Notes

- **Stable origin.** The app prefers a fixed loopback port so the WebView's
  per-origin storage (your saved logins) persists across launches; it falls back
  to an ephemeral port only if that one is busy — e.g. an iPhone and an iPad
  Simulator running at once on the same Mac share the host loopback.
- **Org backend.** Social login / organizations still need the Node server
  (`server/friday-server.mjs`) reachable; the app is the client. Peer-to-peer
  messaging, boards, calls and the vault work with no server at all.
