# 10 · Organizations & the Backend API

Friday runs with **no server at all**. A server adds exactly three things: an
**account** you can prove is yours, an **organization** (who belongs, and each
member's public key), and a **rendezvous** so two devices can find each other and
then talk peer-to-peer. Code: `server/friday-server.mjs` — zero dependencies
(`node:http`, `node:sqlite`, `node:crypto`).

```sh
node server/friday-server.mjs        # serves the API and the app on :4000
```

It is a **directory and a meeting point, never a content server**. It knows names,
public keys, org membership, who is online, and blob sizes/timing. It never sees
message plaintext, board contents, voice, vault files, or your passphrase.

## Data model (SQLite)

`accounts` (id, name, sign_pub, box_pub) · `orgs` (id, name, owner) ·
`members` (org_id, account_id, role) · `invites` (code, org_id, expiry, uses) ·
`sessions` (token → account) · `challenges` (nonce) · `mailbox` (to, from,
opaque payload) · `federated` (provider, sub → account) · `oidc_state`.
Location: `server/friday.db` (WAL); override with `FRIDAY_DB=…`.

## Authentication

No passwords. Sign a one-time nonce with your Ed25519 key ([04](04-security-model.md)):

1. `POST /api/challenge {signPub}` → `{nonce}`
2. sign the nonce, then `POST /api/register {name, signPub, boxPub, nonce, sig}`
   or `POST /api/login {signPub, nonce, sig, boxPub?}` → `{token, account}`

The account id is derived from the signing key (self-certifying). Forged
signatures → 401; replayed nonces → 400. Authenticated routes take
`Authorization: Bearer <token>`.

## Endpoints

| Method · Path | Auth | Purpose |
|---|:--:|---|
| `GET /api/health` | – | liveness + account count |
| `POST /api/challenge` | – | issue a login nonce |
| `POST /api/register` | – | create/refresh account, return session |
| `POST /api/login` | – | sign in with a signature |
| `POST /api/logout` | ✓ | drop the session |
| `GET /api/me` | ✓ | account + orgs |
| `POST /api/account/keys` | ✓ | bind mesh/signing public keys (federated) |
| `POST /api/orgs` | ✓ | create an org, become owner, get an invite |
| `POST /api/orgs/join` | ✓ | join with an invite code |
| `GET /api/orgs/:id/members` | ✓ | member directory (with box pubkeys) |
| `POST /api/orgs/:id/invites` | ✓ | issue / fetch an invite code |
| `POST /api/signal` | ✓ | relay an opaque WebRTC offer/answer to a peer |
| `POST /api/mailbox` | ✓ | store sealed ciphertext for an offline peer |
| `GET /api/events` | ✓ | **SSE** — presence, signaling, mail |
| `GET /api/auth/providers` | – | configured social-login providers |
| `GET /api/auth/:provider/start` | – | begin OIDC (PKCE) |
| `GET/POST /api/auth/:provider/callback` | – | finish OIDC, return session |

## Organizations

- **Create** — `POST /api/orgs {name}` makes you the owner and returns a readable
  invite code (`ABCD-EFGH-JKMN`, no ambiguous characters).
- **Join** — `POST /api/orgs/join {code}` adds you; expired/used-up/bogus codes
  are rejected (410/404). Members learn each other via the directory.
- **Directory** — `GET /api/orgs/:id/members` lists members with their **box
  public keys**, so members can seal to one another directly. Non-members are
  refused (403).
- **Invites** — 14-day expiry, capped uses; any member may invite (policy is a
  one-line change in the server if you want owner-only).

In the client, this is the **Organization** panel in Settings: the live member
list with online state, and a copyable invite code.

## Live events (SSE)

`GET /api/events?token=…` opens a keep-alive stream that pushes:

- `presence` — who in your orgs is online (drives auto-connect);
- `signal` — an opaque WebRTC offer/answer from a peer (rendezvous);
- `member-joined` — a new member for your directory;
- `mail` — sealed ciphertext that arrived while you were away, drained on connect.

## Rendezvous, not relay

Signaling is the only thing the server does for live traffic, and it only carries
opaque SDP. Once two devices exchange offer/answer, they connect **directly** over
WebRTC; media and messages do not route back through the server. The mailbox is
the sole place the server holds anything, and what it holds is unreadable
ciphertext for peers that were offline.

## Configuration

`PORT` (4000) · `FRIDAY_DB` (server/friday.db) · `FRIDAY_PUBLIC_URL` (redirect
origin for OIDC) · `FRIDAY_OIDC_FILE` / `FRIDAY_OIDC` (provider config). CORS is
permissive so the app may be served from a different origin (e.g. Pages) against
this API. See [15 · Deployment](15-deployment.md).
