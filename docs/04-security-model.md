# 04 · Security Model

What Friday protects, from whom, and how — stated plainly, including the limits.
The guiding rule of the whole project: **nothing is presented as more secure than
it is.**

## Principles

1. **The account is a keypair, not a password.** There is no password on any
   server, so there is no password database to breach.
2. **The passphrase never leaves the device.** It only derives the key that
   decrypts your local vault. A wrong passphrase simply fails GCM authentication.
3. **Content is sealed end-to-end.** Message/board/voice/file data is encrypted
   between endpoints; intermediaries carry opaque bytes.
4. **The server is a directory, not a vault.** It learns *who* and *when*, never
   *what*.

## What is encrypted, and with what

| Data | Protection | Where |
|---|---|---|
| Local vault (mesh keys, profile, app data) | PBKDF2-SHA-256 (310k) → AES-256-GCM | `localStorage` |
| Messages, board ops, typing | X25519 ECDH → HKDF-SHA-256 → AES-256-GCM, per recipient | in transit + server mailbox |
| Voice (Calls) | E2E-sealed audio frames over WebRTC (beyond DTLS-SRTP) | in transit |
| Vault files | encrypt-then-erasure-code (Reed-Solomon GF(2⁸)) | sharded |
| Server session token | random 256-bit, bearer | server DB + client memory |

See [05](05-accounts.md) for the vault, [07](07-encryption.md) for the message
sealing, [10](10-backend.md) for auth.

## The server's view — honest accounting

A server, **if you run one**, can observe:

- display names, public keys (box + signing), org membership;
- who is currently online (presence via the SSE stream);
- the size and timing of opaque blobs it relays or mailboxes;
- for social login, the fact that you authenticated with a given provider.

It **cannot** observe: message/board/voice/file plaintext, your passphrase, your
vault, or the content of anything it relays. With **no** server (peer-to-peer or
off-grid), it observes nothing because it isn't there.

## Authentication — challenge/response

Registration and login never send a secret. The client:

1. requests a one-time `nonce` from `/api/challenge` (bound to the signing key);
2. signs the nonce with its **Ed25519** key (ECDSA P-256 fallback);
3. sends the signature to `/api/register` or `/api/login`.

The server verifies the signature against the presented public key. A forged
signature is rejected (401); a replayed nonce is rejected (400, nonce is
consumed). The account id is derived from the signing key, so it is stable and
self-certifying. Verified by the backend test suite (see [16](16-reference.md)).

## Social login — identity only

"Continue with Google/Apple" proves *who you are* to an org server so your
account follows you across devices. It does **not** hand your keys to anyone:
your mesh keys stay in a passphrase-encrypted vault the server and the provider
can never read. You still set a device passphrase after a social login. The
honest cost: the provider learns you use Friday. → [06](06-social-login.md)

## "Keep me signed in"

Remember-me stores the **derived AES-GCM key** (not the passphrase) in IndexedDB,
and only because WebCrypto keeps it **non-extractable**: the browser can decrypt
with it but no script can read its bytes. The stated trade-off, shown in the UI:
while a login is remembered, anyone who can open that browser profile can open
that account. → [05](05-accounts.md)

## Threats it addresses

- **Server compromise / subpoena** — no passwords, no plaintext, no keys to take.
- **Network outage / censorship** — the mesh and off-grid relay keep working.
- **Passive network observer** — sees ciphertext; message content is AES-GCM
  sealed and, over onion/WebRTC, further wrapped.
- **Message tampering** — AES-GCM is authenticated; a flipped bit fails to
  decrypt (verified in tests).
- **Sybil flooding (design intent)** — the spec's proof-of-work admission and
  reputation model make density increase safety.

## Limits — what it does *not* claim

- **Metadata to a running server.** If you use an org server, it sees presence
  and membership. Run peer-to-peer or off-grid to avoid this.
- **Endpoint security.** Encryption protects data in transit and at rest in the
  vault; it cannot protect a device that is already compromised.
- **Ad-hoc-signed native apps.** The Mac/iOS builds here are ad-hoc signed for
  local use, not notarized; ship signed builds for distribution.
- **Illustrative surfaces.** Where a capability isn't yet fully native to the
  platform, the surface labels itself (e.g. voice pipeline previews). Believe the
  labels.
- **This is not a formally audited cryptosystem.** It uses standard primitives
  (WebCrypto, MultipeerConnectivity's `.required` encryption) correctly, but has
  not undergone third-party cryptographic audit.
