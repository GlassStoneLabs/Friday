# 06 · Social Login (OIDC)

"Continue with Google / Apple / Microsoft" is available when an org server is
configured for it. It is **identity only**: the provider proves who you are so
your account and org follow you across devices; it never takes your keys.

## The model (and why the extra passphrase step)

A social login authenticates you to the **org server**. Your mesh keys still live
in a passphrase-encrypted vault the server *and the provider* can never read.
That's why, the first time you use a provider on a device, Friday asks you to
**set a device passphrase** — it's what keeps your data end-to-end encrypted.
This is the "identity + keep passphrase" model; it preserves the E2E promise.

An alternative "social login replaces the passphrase" model would let the server
custody your vault key — simpler, but the server could then decrypt your data.
Friday does **not** do that.

The honest cost either way: signing in with Google/Apple tells them you use
Friday — the one bit of metadata the rest of the system avoids.

## The flow

```
[Continue with Google] ─▶ popup ─▶ provider sign-in ─▶ /api/auth/google/callback
   client                                                   │ verifies id_token
   sets device passphrase ◀── federated session ◀───────────┘ (JWKS, RS256/ES256)
   generates mesh keys, POST /api/account/keys ─▶ bound to the federated account
   org step ─▶ desktop
```

Under the hood it is real **OpenID Connect, Authorization Code + PKCE**:

1. `GET /api/auth/:provider/start` — the server makes a `state` + PKCE verifier,
   stores them briefly, and returns the provider's authorization URL (with an
   `S256` code challenge and a `nonce`).
2. The popup completes sign-in and is redirected to
   `GET /api/auth/:provider/callback?code=…&state=…`.
3. The server exchanges the code (+ verifier + client secret) for tokens,
   **verifies the ID token** against the provider's JWKS (RS256/ES256) and checks
   `iss`/`aud`/`exp`/`nonce`, then upserts an account keyed by `provider:sub`.
4. The callback page hands the session back to the app over **BroadcastChannel**
   (plus `postMessage` and a `#oidc=` redirect fallback — robust to a null
   `window.opener`), and the client binds its freshly-made mesh public key via
   `POST /api/account/keys`.

Re-logging in with the same identity returns the **same account id**, so org
membership is continuous across devices.

## Configuring providers (server-side)

Copy the example and fill in real credentials:

```sh
cp server/providers.example.json server/providers.json   # git-ignored
```

Each entry, keyed by id; discovery is automatic from `issuer`:

```json
{ "google": {
    "name": "Google",
    "issuer": "https://accounts.google.com",
    "clientId": "…apps.googleusercontent.com",
    "clientSecret": "…",
    "scope": "openid email profile" } }
```

Then run the server over **HTTPS at a real domain** and set the public URL so
redirect URIs are correct:

```sh
FRIDAY_PUBLIC_URL=https://friday.example.com node server/friday-server.mjs
```

Register this redirect URI with each provider:
`https://friday.example.com/api/auth/<provider>/callback`.

- **Google** needs a Cloud OAuth client (id + secret).
- **Apple** needs a paid developer account, a client secret that is a short-lived
  **ES256 JWT** you generate from your Apple key, and uses `response_mode=form_post`
  (the callback handles both GET and POST).
- **Microsoft** uses the standard v2.0 issuer.

**With no `providers.json`, no social buttons appear** — nothing is faked. The
GitHub Pages build (no server) therefore shows only the passphrase flow.

## What was verified

Against a mock OIDC issuer: PKCE, JWKS signature verification, claim checks,
account continuity on re-login, key binding, and bad-state rejection — plus an
in-browser run of the whole popup → device-passphrase → org → desktop flow. See
[16 · Reference](16-reference.md). Google/Apple themselves need your real
credentials to light up, which is a configuration step, not a code change.
