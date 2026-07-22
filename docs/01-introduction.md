# 01 · Introduction

*The Hudson, the Acadia, and the Naming of a Workspace.*

Friday is the web face of **Orange PIE** — Glass Stone LLC's off-grid,
end-to-end-encrypted collaboration platform, internally *Project Dark Sun*, whose
final name is the **Eros Office**. It is a combination of the things a team
actually does all day — messages, boards, calls, shared storage — built so that
none of it depends on a company's servers staying up, or on a network existing
at all.

## What it is

A single-page web application (`index.html`, `css/friday.css`, `js/friday.js`)
that renders as a small macOS-style *Liquid Glass* desktop and carries six
working surfaces. It runs four ways from one codebase:

- in a **browser**,
- as an installed **PWA** (its own window and dock/home icon, offline-capable),
- as a native **macOS** app (`mac/`),
- as a native **iOS / iPadOS** app (`ios/`).

There are no frameworks, no build step, and no third-party runtime dependencies.
The optional backend (`server/friday-server.mjs`) uses only Node's built-ins.

## The thesis

Classical client–server chat has a single point of failure and a single point of
surveillance: the server. Friday inverts both. Its defining constraint is an
inverse relationship between **node density and vulnerability** — the more
devices join, the more path diversity and cryptographic resilience the mesh has,
and the safer it gets. That runs against centralized systems, which get more
fragile and more attackable as they grow.

Three properties follow, and everything in these docs serves them:

1. **No password, anywhere.** Your account is a keypair. You prove who you are by
   signing a challenge; the passphrase never leaves your device. There is nothing
   for a server to leak. → [04](04-security-model.md), [05](05-accounts.md)
2. **Content the server can't read.** Messages, boards, voice, and files are
   sealed end-to-end between endpoints. A server, if present, sees names, public
   keys, and who is online — never plaintext. → [07](07-encryption.md)
3. **Works with no infrastructure.** Devices discover each other and relay for
   one another over browser channels, WebRTC, and — on Apple hardware — Wi-Fi and
   Bluetooth, with no server in the data path. → [08](08-mesh.md), [09](09-offgrid-relay.md)

## Lineage

Orange PIE synthesizes a body of open protocol work: Reticulum-style
cryptographic routing, GhostWire's adaptive transports and proof-of-work
admission, BitChat's BLE store-and-forward, PairPhone/Torfone voice, Tahoe-LAFS
erasure coding, and immudb-style tamper-evident ledgers. Friday models this stack
honestly at the client layer — where a full component isn't yet native to the
web, the surface says what is real and what is illustrative.

The interface is set in **the Hudson Design Language, by The Acadia** — one
material (the Hudson Glass), a small palette drawn from a place, serif display
type, and motion that settles instead of bouncing. → [13](13-design-language.md)

## Who made it

Glass Stone LLC · CEO Gabriel B. Rodriguez · 2026–2027. The design language is
original to The Acadia. This documentation describes Friday as built — every
endpoint, key derivation, and file path here corresponds to code in the repo.

## Where to go next

- Just want to run it? → [02 · Getting Started](02-getting-started.md)
- Want the shape of the whole thing? → [03 · Architecture](03-architecture.md)
- Care about the crypto first? → [04 · Security Model](04-security-model.md)
