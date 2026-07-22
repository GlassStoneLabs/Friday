# 05 · Accounts & Logins

An account in Friday is a set of keys sealed in an encrypted vault on your device.
This page covers how that vault is made, unlocked, remembered, and how several
logins live side by side. Code: the `Account`, `Remember`, and `Auth` modules in
`js/friday.js`.

## The vault

When you create an account, the browser generates:

- a **mesh keypair** — X25519 (ECDH; P-256 fallback), used to seal messages;
- a **signing keypair** — Ed25519 (ECDSA P-256 fallback), used to prove identity
  to an org server;
- a profile (display name, timestamps) and a `store` object for app data.

All of it is serialized to a `vault` object and encrypted:

```
passphrase ──PBKDF2-SHA-256, 310,000 iterations, random 16-byte salt──▶ AES-256-GCM key
vault (JSON) ──AES-256-GCM, random 12-byte IV──▶ ciphertext
```

The stored record (`localStorage`, key `friday.vault.<id>`) holds only
`{ v, name, salt, iters, iv, ct }`. The passphrase and the derived key are never
written anywhere. Unlocking re-derives the key from your passphrase and attempts
to decrypt; a wrong passphrase cannot authenticate the GCM tag, so it simply
fails — there is no "incorrect password" oracle beyond that.

## Multiple logins on one device

Friday keeps an index at `localStorage["friday.logins.v1"]`:

```json
[{ "id": "l-ab12cd34", "name": "Gabriel · Mac", "created": …, "lastUsed": …, "remembered": true }]
```

Each entry points at its own `friday.vault.<id>`. This powers the **logins page**:
a picker of every account this device knows, newest-used first. From it you can
pick one to unlock, **✕** to forget it (deletes that vault), or **+ Create
another login**.

Key methods on `Account`:

| Method | Does |
|---|---|
| `logins()` | the index, sorted; migrates a pre-multi-login vault on sight |
| `signup(name, pass)` | new keypairs + vault + index entry; returns the id |
| `unlock(id, pass)` | derive key, decrypt, activate; `false` on wrong passphrase |
| `unlockWithKey(id, key)` | open with a remembered (non-extractable) key |
| `save(patch)` | merge into `store`, re-encrypt the vault |
| `lock()` / `signOut()` | drop keys from memory, return to the picker |
| `forget(id)` | delete a vault + index entry + any remembered key |

## Remember-me — how "stay signed in" is safe

Ticking **Keep me signed in on this device** stores the *derived AES-GCM key*, not
the passphrase. It's kept in IndexedDB (`Remember`: database `friday.keys`, store
`vaultKeys`) as a **non-extractable `CryptoKey`**: the browser will use it to
decrypt your vault, but `crypto.subtle.exportKey` on it throws — no script can
read the bytes back out.

On next launch, `Auth.gate` finds a remembered login and calls
`Account.unlockWithKey` — you're in without typing anything. The honest trade-off,
stated in the UI: while remembered, anyone who can open this browser profile can
open this account. Toggle it off in Settings and the key is dropped from
IndexedDB immediately.

## The auth flow (`Auth`)

`Auth.gate(onUnlock)` decides what to show on load:

1. `?guest=1` or no WebCrypto → straight through with ephemeral keys.
2. A remembered login → auto-unlock (unless you chose **Switch login**, which sets
   a one-shot `sessionStorage` flag so the picker is shown instead).
3. Otherwise → the **logins page** (if any exist) or the **create page**.

After unlocking, `afterUnlock` optionally talks to an org server (probe →
authenticate → org step) before opening the desktop. The lock screen is a
two-pane glass shell — brand panel + form — over a live mesh backdrop, with a
"sealing" cipher strip under the passphrase field that reflects length only.

## Switching, locking, erasing — from Settings

The **Account** panel (Settings) shows the current login, its identity
fingerprint, a **Keep me signed in** switch, and **Lock now / Switch login /
Forget this login**, plus a note of any other logins on the device. The Friday
menu also offers **Lock Friday** (⌃⌘Q) and **Switch login**.

## Migration

An account made before multi-login (single `friday.account.v1` key) is migrated
automatically the first time `Account.logins()` runs: its vault is moved to a
`friday.vault.<id>` slot and indexed. Nothing is lost. Verified by a
legacy-vault migration test.
