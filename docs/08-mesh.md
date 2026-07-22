# 08 · The Mesh — Dark Core

Dark Core is Friday's routing substrate: the way devices find each other and move
frames with no central server. It lives in the `Net` module (`js/friday.js`),
augmented on Apple devices by a native transport ([09](09-offgrid-relay.md)).

## What "the mesh" is

A set of peers, each identified by a node id and a public key, exchanging a small
vocabulary of frames over whatever transports are available. `Net` doesn't care
which transport carried a frame — it fans every outgoing frame across all of them
and de-duplicates on the way in.

## Transports

| Transport | Reach | Needs |
|---|---|---|
| **BroadcastChannel** | same-origin tabs / windows / installed app on one machine | nothing |
| **WebRTC DataChannel** | device ↔ device, peer-to-peer | signaling (copy/paste or server) |
| **Native MultipeerConnectivity** | nearby Apple devices, Wi-Fi + Bluetooth | the native app |

BroadcastChannel makes "open two tabs" a real two-node mesh with no network.
WebRTC crosses machines. The native transport takes it off-grid. → [09](09-offgrid-relay.md)

## Frames

```
hello   { t, id, name, pub }              presence + public key
bye     { t, id }                         leaving
ping    { t, id, to, n }  /  pong …       real round-trip latency
msg     { t, id, to, from, room, wire }   a sealed message envelope
typing  { t, id, room, to? }              throttled typing indicator
```

`wire` is the E2E envelope ([07](07-encryption.md)); the mesh never inspects it.
Peers announce `pub` in `hello`, so any two peers that meet can immediately seal
to each other.

## Presence and identity

- `Net.id` / `Net.name` come from the unlocked account (a stable id derived from
  the identity key) so peers persist across reloads.
- `announce()` sends `hello` on start and every ~2.2 s; peers expire after ~6.5 s
  of silence (`reap`), except WebRTC/native links which track connection state
  directly.
- `Net.peers` is the live map; `onPeers()` subscribers (the Mesh view, Messages)
  re-render on change. `emitPeers()` also updates the menu-bar node count.

## Latency and paths

`ping`/`pong` measure real round-trip time per peer; the Mesh view shows the
average. "Live links" is the count of edges — because every node hears the same
bus, connected nodes form a real full mesh, so paths are genuine, not decorative.

## Linking two devices by hand (no server)

**Mesh ▸ Link a device** runs a WebRTC handshake with copy/paste signaling: one
device starts (produces an offer code), the other joins (pastes it, returns an
answer code), and a direct DataChannel opens. Public STUN is used only for NAT
discovery — it never sees your data — and on a LAN even that is unnecessary.

## Linking automatically (with a server)

When an org server is present, it relays opaque SDP over its SSE stream. As org
members come online, Friday connects them peer-to-peer with no copy/paste
(deterministic roles avoid glare: the lower account id makes the offer). After
the link is up, traffic is direct — it does not go back through the server. →
[10](10-backend.md)

## The Mesh surface

The **Mesh** app draws the live topology on a canvas — this node at the center,
real peers around it, packets travelling the links — with a side rail showing
node count, live links, round-trip latency, peer status, this node's identity,
and a **Link a device** button. When the native off-grid transport is active it
shows an "Off-grid relay · active" line. With no peers it says so honestly:
*"Only this node — open Friday in another tab or link a device."*

## Store and forward

For peers that were offline, an org server holds sealed frames in a **mailbox**
and delivers them on reconnect; on the off-grid native mesh, each device keeps a
short store-and-forward buffer and replays recent frames to peers that join a
moment later ([09](09-offgrid-relay.md)). Either way, the stored bytes are the
opaque `wire` — unreadable in transit.
