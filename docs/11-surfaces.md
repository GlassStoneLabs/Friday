# 11 · The Surfaces

Friday's desktop carries six working apps plus About, opened from the dock, the
menu bar's Friday menu, Spotlight (⌘K), or `#app` deep-links (e.g.
`…/Friday/#ledger`). Each is an entry in the `Apps` registry with a
`render(body, rec)` and, where needed, a `teardown()`.

## The shell

- **Window manager (`WM`)** — real windows: drag, resize, minimize (genie to the
  dock), zoom, focus/z-order, open/close animations. Traffic-light controls,
  transparent titlebars.
- **Dock** — running dots, hover tips, unread badges, magnify on hover.
- **Menu bar** — the Friday menu (About, Settings, appearance, Lock, Switch
  login), File/Edit/View/Window/Help, the live mesh node count, search, Control
  Center, and a clock.
- **Spotlight (⌘K)** — fuzzy launcher over apps and actions.
- **Control Center** — quick toggles for transports, appearance, glass diffusion,
  accent.
- **Mobile** — under 760px the whole thing becomes the **pocket pane** (HDL §11.1):
  a floating glass tab bar (Home · Mesh · Chat · Boards · More), full-screen
  surfaces, a "More" sheet, and safe-area insets.

## Mesh — Dark Core

The live topology and peers. Covered in [08](08-mesh.md).

## Messages

Real end-to-end delivery over the mesh. `# dark-core` is the broadcast room of
every live node; each real peer also gets a direct thread. Outgoing text is
sealed **per recipient** and actually transmitted ([07](07-encryption.md)); the
lock on a bubble reveals the ciphertext. Typing indicators are real throttled
frames. A **Nearby** section models BitChat-style store-and-forward. With no
peers, it says so — nothing is scripted.

## Boards

A monday-style board of columns and cards. Cards drag between columns (with a
keyboard/touch "move" affordance too), and the board **syncs live over the mesh**
as an LWW-CRDT — edits converge across devices with no central server — and is
**encrypted at rest** in the account vault. Rename columns, add cards, persist
across reloads.

## Calls — Dark Sun

Real **WebRTC voice** between mesh peers, with each audio frame **E2E-sealed**
beyond WebRTC's own DTLS-SRTP, so media is protected end-to-end even across a
relay. A tracked-timer state machine (idle → connecting → live) with mute
(`aria-pressed`) and honest disclosure of what's live versus preview.

## Vault

**Encrypt-then-erasure-code** storage, Tahoe-LAFS style. Files are encrypted, then
split with **Reed-Solomon over GF(2⁸)** (generator polynomial `0x11D`) into data
+ parity shards scattered across nodes; any sufficient subset rebuilds the file.
The shard map lets you simulate node loss and watch reconstruction from surviving
shards. No single node holds a whole, readable file.

## Ledger — two sets of records

An **editable** working set and a **permanent**, append-only set secured by an
FNV-1a **hash chain** (immudb-style): each entry seals the hash of the one before
it, so any silent edit breaks the proof, visibly. **Verify chain / Simulate
tampering / Restore** demonstrate it; committing an editable record seals it into
the chain. Persisted encrypted via the account vault when unlocked.

## Settings

Appearance (Light/Dark/Auto, accent, glass diffusion, wallpaper — all real),
**Account** (fingerprint, remember-me, lock/switch/forget), **Organization**
(members, invite code — when a server is present), and **Dark Core** transport
policy. → [05](05-accounts.md), [10](10-backend.md), [13](13-design-language.md)

## About

Version, credits, and the one-paragraph statement of what Friday is. Glass Stone
LLC · Eros Office · Orange PIE V1 Alpha · set in the Hudson Design Language.

## A note on honesty

Where a surface models a capability that isn't yet fully native to the web
platform, it labels what is real and what is illustrative (e.g. a voice-pipeline
preview, or a shard-map demonstration). This is a project rule, not an accident —
believe the labels.
