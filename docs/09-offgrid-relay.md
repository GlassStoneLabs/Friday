# 09 · Off-Grid Relay

On Apple devices, Friday is a real mesh node — it **stores, transmits, and relays**
for its peers with no server and no internet. This is delivered by the native
apps and bridged into the web client's `Net` layer. Code:
`mac/Sources/MeshTransport.swift`, `mac/Sources/RelayStore.swift`,
`mac/Sources/MeshBridge.swift` (shared by the Mac and iOS targets).

## The transport — MultipeerConnectivity

`MeshTransport` uses Apple's **MultipeerConnectivity**: peer discovery and
encrypted transport over Wi-Fi, peer-to-peer Wi-Fi, and **Bluetooth**, with no
infrastructure. It advertises and browses for the service `friday-mesh`
(Bonjour `_friday-mesh._tcp` / `._udp`), accepts invitations from other Friday
nodes, and uses a deterministic initiator (lower display name invites) to avoid
handshake glare. The session is created with `.required` encryption.

It carries the same opaque frames the web `Net` already speaks — `hello`, `msg`,
`typing`, `ping` — and **never inspects a payload**. Message content stays sealed
end-to-end between the web endpoints ([07](07-encryption.md)).

## The relay engine — `RelayStore`

Transport-agnostic and unit-tested, `RelayStore` gives every device the three
behaviors:

- **Transmit** — frames travel between nearby devices with no infrastructure.
- **Relay** — a device re-broadcasts a frame it hasn't seen, with a decremented
  hop count, to its *other* peers — so A reaches C through B (multi-hop flooding).
- **Store & forward** — recent frames are held in a bounded buffer and replayed
  to a peer that connects a moment later, so a device that was away still gets
  them.

De-duplication is by unique frame id, which is what stops a flood from looping.

## Frame envelope

Each web frame is wrapped for the wire:

```
MeshEnvelope {
  fid:     String   // unique frame id — the dedup key
  ttl:     Int      // hops remaining (starts at 6); 0 ⇒ do not relay further
  origin:  String   // originating transport node
  payload: String   // the opaque web frame, as a JSON string
  ts:      Double    // created, epoch ms
}
```

On receive: `RelayStore.accept(fid)` returns true only the first time → deliver
the payload to the web layer once; then, if `ttl > 1`, decrement and re-broadcast
to peers other than the sender. Buffers and the "seen" set expire on timers
(defaults: seen 5 min, buffer 10 min, buffer cap 256) so a long-lived relay never
leaks memory.

## The bridge — native ↔ web

`MeshBridge.shim` is injected into the WebView at document-start. It exposes:

```js
window.FridayNativeMesh = {
  available: true,
  send(frame),   // web frame → native mesh (postMessage to Swift)
  recv(frame),   // native → web: routes into Net.recv(frame, "mpc")
  peers(list),   // native → web: connected transport peers
}
```

The web client wires it up automatically: `Net.send()` also fans frames to
`FridayNativeMesh.send`; incoming native frames arrive via `FridayNativeMesh.recv`
and become peers tagged with the `mpc` transport (they carry real Friday
identities via `hello`, so they seal like any other peer). `window.Net` is exposed
so the injected shim can reach it. The Mesh view shows an **"Off-grid relay ·
active"** line when the bridge is present.

## What was verified

- **`RelayStore` unit tests** (`mac/Tests/RelayStoreTests.swift`): dedup, TTL hop
  decrement, store-and-forward replay with expiry, bounded buffer, JSON
  round-trip — all pass. Run: `swiftc mac/Sources/RelayStore.swift
  mac/Tests/RelayStoreTests.swift -o /tmp/rt && /tmp/rt`.
- **The web↔native contract** tested in a browser with the real injected shim:
  outgoing frames reach the native handler; incoming native frames create `mpc`
  peers.
- Both native apps build with the mesh and launch without crashing.

## Limit

Live device-to-device **discovery** uses real Wi-Fi/Bluetooth radios, which the
iOS Simulator does not emulate — so the actual "two phones find each other and
relay" step must be exercised on **physical devices**. The relay algorithm and
the bridge are verified without hardware; the radio discovery is not simulable.
