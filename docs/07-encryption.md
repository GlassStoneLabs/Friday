# 07 · End-to-End Encryption

Every message Friday sends is genuinely sealed before it leaves the device. This
page describes the pairwise scheme in `E2E` (`js/friday.js`), which uses only the
browser's WebCrypto — no crypto libraries.

## The scheme, in one line

**X25519 ECDH → HKDF-SHA-256 → AES-256-GCM** (ECDH P-256 as a fallback where
X25519 is unavailable).

## Keys

- Each account has a mesh keypair, generated at signup and stored in the
  encrypted vault ([05](05-accounts.md)). The public key is announced to peers in
  the mesh `hello` frame.
- There is no long-term shared secret and no server-held key. A shared key is
  derived pairwise, on demand, from *your* private key and the *peer's* public
  key.

## Deriving a per-peer key

```
shared = ECDH(myPrivate, peerPublic)                     // 32 bytes
key    = HKDF-SHA-256(shared, salt="friday.e2e.v2",      // → AES-256-GCM key
                      info=<empty>)
```

Because ECDH is symmetric — `ECDH(a_priv, b_pub) == ECDH(b_priv, a_pub)` — both
endpoints derive the **same** AES key without ever transmitting it. Derived keys
are cached per peer (`E2E.keys`). The HKDF salt is a fixed domain-separation
constant so both sides agree.

## Sealing and opening

```js
wire = E2E.seal(peerPubB64, text)
// → { alg, iv, ct, bytes, fp }   ct = AES-256-GCM(key, iv=12 random bytes, text)

text = E2E.open(peerPubB64, wire) // AES-GCM decrypt + authenticate
```

- **Sender** seals with the *recipient's* public key.
- **Recipient** opens with the *sender's* public key.
- A broadcast room message is sealed **once per recipient** (fan-out), so each
  member gets a copy only they can open. A direct message is sealed for one peer.

What actually crosses the wire is the `wire` object — an IV and Base64 ciphertext.
Message plaintext never appears in a "sent" form; what you see in your own bubble
is the decrypted round-trip of the envelope you just sealed.

## Fingerprints

`E2E.fingerprint(aRaw, bRaw)` hashes the two public keys (order-independent) to a
short hex code shown on the thread ribbon and in Settings. Two endpoints display
the **same** fingerprint for their shared channel — a human-checkable confirmation
that no key was substituted.

## Seeing the ciphertext

In Messages, tap the small lock on any sent bubble to reveal the sealed envelope
— algorithm, fingerprint, IV, and the real ciphertext with its byte count on the
wire. The thread ribbon shows the live session fingerprint, or **UNSEALED —
SERVE OVER HTTPS FOR E2E** if WebCrypto is unavailable (an insecure context).

## Properties

- **Confidentiality** — only the two endpoints derive the key.
- **Integrity / authenticity** — AES-GCM is authenticated; a single flipped
  ciphertext bit fails to decrypt (verified in tests). A third party who lacks
  the shared key cannot open a message (verified).
- **No server trust** — the server, if present, only relays or mailboxes the
  opaque `wire`. It has neither private key.

## Where E2E is used

- **Messages** — every frame, direct and broadcast. → [11](11-surfaces.md)
- **Boards** — CRDT operations are sealed and synced over the mesh.
- **Calls** — audio frames are E2E-sealed *beyond* WebRTC's own DTLS-SRTP, so the
  media is protected end-to-end even across a relay.
- **Vault** — files are encrypted before being erasure-coded and sharded.
- **Mailbox** — offline delivery stores only the sealed `wire`.

## Limits

E2E protects content between endpoints. It does not hide *metadata* from a running
server (see [04](04-security-model.md)), and it cannot help a compromised device.
The scheme uses standard primitives correctly but has not been formally audited.
