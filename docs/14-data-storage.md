# 14 · Data & Storage

Where every piece of Friday's data lives, and how it's protected. The short
version: sensitive data is encrypted at the edge; a server, if present, holds only
public keys, membership, and opaque blobs.

## On the device (the web client)

| Store | Key(s) | Contents | Protection |
|---|---|---|---|
| `localStorage` | `friday.logins.v1` | login index (names, ids, flags) | plaintext (non-sensitive) |
| `localStorage` | `friday.vault.<id>` | the encrypted vault | PBKDF2 → AES-256-GCM |
| `localStorage` | `friday.state` | theme, accent, glass, wallpaper | plaintext (non-sensitive) |
| `localStorage` | `friday.board.v1` | board (when signed out) | plaintext until signed in |
| `IndexedDB` | `friday.keys` / `vaultKeys` | remembered vault key | **non-extractable** CryptoKey |
| WebView storage | (per origin) | service-worker cache, etc. | browser-managed |

The **vault** (`friday.vault.<id>`) is the sensitive one: it holds your mesh
private key, signing private key, profile, and an app-data `store` (e.g. board,
call log, ledger), all inside one AES-256-GCM blob keyed by your passphrase. See
[05](05-accounts.md).

`Account.save(patch)` merges into the in-memory `store` and re-encrypts the whole
vault. Apps that persist through it: Boards (`store.boards`), Calls
(`store.callLog`), Ledger (`store.ledger`) — encrypted at rest when you're signed
in, with a plaintext `localStorage` fallback only for guest/signed-out use.

## Encrypted at rest — the vault

Nothing in the vault is readable without the passphrase. A wrong passphrase fails
GCM authentication; there is no partial-decrypt or hint. Remember-me stores the
*key* (non-extractable), never the passphrase — see [04](04-security-model.md).

## The Vault surface — distributed, erasure-coded

Distinct from the account vault: the **Vault app** models Tahoe-LAFS-style
storage. A file is **encrypted, then erasure-coded** with Reed-Solomon over
GF(2⁸) (generator `0x11D`) into data + parity shards spread across nodes. Any
sufficient subset of surviving shards rebuilds the file; no single node holds a
complete, readable copy. → [11](11-surfaces.md)

## The Ledger — two record sets

- **Editable** — mutable working records.
- **Permanent** — append-only, secured by an FNV-1a hash chain; each entry seals
  the hash of the prior one, so tampering breaks the proof. Persisted (encrypted)
  through the account vault when unlocked. → [11](11-surfaces.md)

This mirrors the spec's "two sets of records: one editable, one permanent, both
verifiable."

## On a server (only if you run one)

| Table | Holds | Sensitive? |
|---|---|---|
| `accounts` | id, name, **public** keys | public |
| `orgs` / `members` | org membership + roles | metadata |
| `invites` | codes, expiry, uses | metadata |
| `sessions` | bearer tokens | secret (session only) |
| `challenges` / `oidc_state` | short-lived nonces/state | ephemeral |
| `federated` | provider:sub → account, email | metadata |
| `mailbox` | **opaque ciphertext** for offline peers | unreadable by server |

The server never stores or receives message plaintext, board contents, voice, or
vault files. `mailbox` payloads are the sealed E2E `wire` ([07](07-encryption.md)).
Database file: `server/friday.db` (SQLite, WAL). Challenges expire (5 min), state
(10 min), and mailbox entries are swept (30 days) on a timer.

## In transit

Everything of substance is the opaque E2E `wire` — an IV plus AES-GCM ciphertext
— carried over BroadcastChannel, WebRTC (itself DTLS-encrypted), the native
Multipeer session (`.required` encryption), or, for offline peers, the server
mailbox. An observer sees ciphertext and, at most, size/timing.

## Backups & portability

- **Account** — the vault is local; there is no server-side key escrow (by
  design). Losing every device that holds a login means losing that vault's keys.
  Social login gives *account/org continuity* on a new device, but keys are
  per-device — see [06](06-social-login.md).
- **Server** — back up `server/friday.db` to preserve accounts, orgs, and
  membership. It contains no secrets that would expose message content.
