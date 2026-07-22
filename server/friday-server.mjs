#!/usr/bin/env node
/* ============================================================
   FRIDAY · EROS OFFICE — the backend
   Glass Stone LLC · Orange PIE V1 Alpha

   This server is a RENDEZVOUS and a DIRECTORY. It is deliberately
   not a content server:

     • Accounts are keypairs, not passwords. You prove who you are by
       signing a one-time nonce (Ed25519, ECDSA P-256 fallback). The
       passphrase never leaves the browser — it only decrypts the local
       vault. There is no password to steal here, because there is none.
     • Orgs are membership lists: who belongs, and each member's public
       key, so members can seal messages to one another directly.
     • Signaling is relayed opaquely (SDP blobs) so two devices can find
       each other and then talk PEER-TO-PEER. Once the mesh link is up,
       traffic does not come back through here.
     • The mailbox stores ciphertext the server cannot read, for peers
       who were offline when something was sent.

   What the server therefore knows (be honest about this): display names,
   public keys, org membership, who is online, and the size/timing of
   opaque blobs. It never sees message plaintext — that stays sealed with
   X25519 · HKDF · AES-256-GCM between the endpoints.

   Zero dependencies: node:http, node:sqlite, node:crypto only.
   Run:  node server/friday-server.mjs           (serves API + the app)
   ============================================================ */

import http from "node:http";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { DatabaseSync } from "node:sqlite";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");          // the static app lives one level up
const PORT = Number(process.env.PORT || 4000);
const DB_PATH = process.env.FRIDAY_DB || path.join(HERE, "friday.db");

/* ---------------- store ---------------- */
const db = new DatabaseSync(DB_PATH);
db.exec(`
  PRAGMA journal_mode = WAL;
  CREATE TABLE IF NOT EXISTS accounts (
    id TEXT PRIMARY KEY, name TEXT NOT NULL,
    sign_pub TEXT NOT NULL UNIQUE,   -- JWK json (Ed25519 or P-256)
    box_pub  TEXT NOT NULL,          -- X25519/P-256 public key, base64 (for E2E sealing)
    created INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS orgs (
    id TEXT PRIMARY KEY, name TEXT NOT NULL,
    owner TEXT NOT NULL, created INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS members (
    org_id TEXT NOT NULL, account_id TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'member', joined INTEGER NOT NULL,
    PRIMARY KEY (org_id, account_id)
  );
  CREATE TABLE IF NOT EXISTS invites (
    code TEXT PRIMARY KEY, org_id TEXT NOT NULL, created_by TEXT NOT NULL,
    created INTEGER NOT NULL, expires INTEGER NOT NULL,
    uses INTEGER NOT NULL DEFAULT 0, max_uses INTEGER NOT NULL DEFAULT 25
  );
  CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY, account_id TEXT NOT NULL, created INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS challenges (
    nonce TEXT PRIMARY KEY, sign_pub TEXT NOT NULL, created INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS mailbox (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    to_id TEXT NOT NULL, from_id TEXT NOT NULL,
    payload TEXT NOT NULL,           -- opaque ciphertext; unreadable here
    created INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS mailbox_to ON mailbox(to_id);
  -- a social identity (Google/Apple/…) bound to a Friday account. This is
  -- IDENTITY ONLY: it proves who you are so we can find your account and org
  -- across devices. Your mesh keys still live in a passphrase-encrypted vault
  -- the server can never read — federated login does not change that.
  CREATE TABLE IF NOT EXISTS federated (
    provider TEXT NOT NULL, sub TEXT NOT NULL,
    account_id TEXT NOT NULL, email TEXT, name TEXT, created INTEGER NOT NULL,
    PRIMARY KEY (provider, sub)
  );
  CREATE TABLE IF NOT EXISTS oidc_state (
    state TEXT PRIMARY KEY, provider TEXT NOT NULL, verifier TEXT NOT NULL,
    nonce TEXT NOT NULL, redirect TEXT, created INTEGER NOT NULL
  );
`);

const q = {
  accountBySign: db.prepare("SELECT * FROM accounts WHERE sign_pub = ?"),
  accountById: db.prepare("SELECT * FROM accounts WHERE id = ?"),
  insertAccount: db.prepare("INSERT INTO accounts (id,name,sign_pub,box_pub,created) VALUES (?,?,?,?,?)"),
  updateBoxPub: db.prepare("UPDATE accounts SET box_pub = ?, name = ? WHERE id = ?"),
  insertOrg: db.prepare("INSERT INTO orgs (id,name,owner,created) VALUES (?,?,?,?)"),
  orgById: db.prepare("SELECT * FROM orgs WHERE id = ?"),
  insertMember: db.prepare("INSERT OR IGNORE INTO members (org_id,account_id,role,joined) VALUES (?,?,?,?)"),
  membership: db.prepare("SELECT * FROM members WHERE org_id = ? AND account_id = ?"),
  myOrgs: db.prepare(`SELECT o.id,o.name,o.owner,o.created,m.role FROM orgs o
                      JOIN members m ON m.org_id = o.id WHERE m.account_id = ? ORDER BY o.created`),
  orgMembers: db.prepare(`SELECT a.id,a.name,a.box_pub,m.role,m.joined FROM members m
                          JOIN accounts a ON a.id = m.account_id WHERE m.org_id = ? ORDER BY m.joined`),
  insertInvite: db.prepare("INSERT INTO invites (code,org_id,created_by,created,expires,uses,max_uses) VALUES (?,?,?,?,?,0,?)"),
  inviteByCode: db.prepare("SELECT * FROM invites WHERE code = ?"),
  bumpInvite: db.prepare("UPDATE invites SET uses = uses + 1 WHERE code = ?"),
  latestInvite: db.prepare("SELECT * FROM invites WHERE org_id = ? AND expires > ? AND uses < max_uses ORDER BY created DESC LIMIT 1"),
  insertSession: db.prepare("INSERT INTO sessions (token,account_id,created) VALUES (?,?,?)"),
  sessionByToken: db.prepare("SELECT * FROM sessions WHERE token = ?"),
  dropSession: db.prepare("DELETE FROM sessions WHERE token = ?"),
  insertChallenge: db.prepare("INSERT INTO challenges (nonce,sign_pub,created) VALUES (?,?,?)"),
  challengeByNonce: db.prepare("SELECT * FROM challenges WHERE nonce = ?"),
  dropChallenge: db.prepare("DELETE FROM challenges WHERE nonce = ?"),
  sweepChallenges: db.prepare("DELETE FROM challenges WHERE created < ?"),
  putMail: db.prepare("INSERT INTO mailbox (to_id,from_id,payload,created) VALUES (?,?,?,?)"),
  takeMail: db.prepare("SELECT * FROM mailbox WHERE to_id = ? ORDER BY id LIMIT 200"),
  dropMail: db.prepare("DELETE FROM mailbox WHERE id = ?"),
  sweepMail: db.prepare("DELETE FROM mailbox WHERE created < ?"),
  federatedGet: db.prepare("SELECT * FROM federated WHERE provider = ? AND sub = ?"),
  isFederated: db.prepare("SELECT 1 FROM federated WHERE account_id = ? LIMIT 1"),
  federatedPut: db.prepare("INSERT OR IGNORE INTO federated (provider,sub,account_id,email,name,created) VALUES (?,?,?,?,?,?)"),
  setKeys: db.prepare("UPDATE accounts SET box_pub = ?, sign_pub = ?, name = ? WHERE id = ?"),
  setBox: db.prepare("UPDATE accounts SET box_pub = ?, name = ? WHERE id = ?"),
  putState: db.prepare("INSERT INTO oidc_state (state,provider,verifier,nonce,redirect,created) VALUES (?,?,?,?,?,?)"),
  getState: db.prepare("SELECT * FROM oidc_state WHERE state = ?"),
  dropState: db.prepare("DELETE FROM oidc_state WHERE state = ?"),
  sweepState: db.prepare("DELETE FROM oidc_state WHERE created < ?"),
};

const now = () => Date.now();
const rid = (n = 16) => crypto.randomBytes(n).toString("hex");
// invite codes people can read aloud: no 0/O/1/I ambiguity
const inviteCode = () => {
  const A = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const pick = (n) => [...crypto.randomBytes(n)].map((b) => A[b % A.length]).join("");
  return `${pick(4)}-${pick(4)}-${pick(4)}`;
};

/* ============================================================
   OIDC · "Sign in with Google / Apple / …" (identity only)
   Real OpenID Connect Authorization Code + PKCE. The provider
   proves who you are; we bind that identity to a Friday account.
   Your mesh keys and vault stay passphrase-encrypted on the device —
   this never gives the server the ability to read your data.

   Configure providers in server/providers.json (git-ignored) or the
   FRIDAY_OIDC env var. Each entry, keyed by id:
     { "name": "Google",
       "issuer": "https://accounts.google.com",   // discovery is automatic
       "clientId": "...", "clientSecret": "...",
       "scope": "openid email profile" }
   Apple additionally needs a client_secret you generate as a signed JWT
   (ES256) from your Apple key, and uses response_mode=form_post.

   Nothing here is faked: with no config, no provider buttons appear.
   ============================================================ */
const b64url = (buf) => Buffer.from(buf).toString("base64url");
function loadProviders() {
  let cfg = {};
  try {
    const f = process.env.FRIDAY_OIDC_FILE || path.join(HERE, "providers.json");
    if (fs.existsSync(f)) cfg = JSON.parse(fs.readFileSync(f, "utf8"));
  } catch (e) { console.warn("providers.json unreadable:", e.message); }
  if (process.env.FRIDAY_OIDC) { try { Object.assign(cfg, JSON.parse(process.env.FRIDAY_OIDC)); } catch {} }
  return cfg;
}
let PROVIDERS = loadProviders();
const PUBLIC_URL = process.env.FRIDAY_PUBLIC_URL || `http://localhost:${PORT}`;

const _discoCache = new Map();   // issuer -> { doc, jwks, at }
async function discover(p) {
  if (p.authorization_endpoint && p.token_endpoint && p.jwks_uri) return p;   // explicit config
  const c = _discoCache.get(p.issuer);
  if (c && Date.now() - c.at < 3600e3) return c.doc;
  const r = await fetch(p.issuer.replace(/\/$/, "") + "/.well-known/openid-configuration");
  if (!r.ok) throw new Error("discovery failed for " + p.issuer);
  const doc = { ...p, ...(await r.json()) };
  _discoCache.set(p.issuer, { doc, at: Date.now() });
  return doc;
}
async function jwks(doc) {
  const c = _discoCache.get("jwks:" + doc.jwks_uri);
  if (c && Date.now() - c.at < 3600e3) return c.keys;
  const r = await fetch(doc.jwks_uri);
  const { keys } = await r.json();
  _discoCache.set("jwks:" + doc.jwks_uri, { keys, at: Date.now() });
  return keys;
}
// verify an ID token's signature + core claims, return its payload
async function verifyIdToken(doc, idToken, clientId, nonce) {
  const [h, pl, sig] = idToken.split(".");
  if (!h || !pl || !sig) throw new Error("malformed id_token");
  const header = JSON.parse(Buffer.from(h, "base64url"));
  const payload = JSON.parse(Buffer.from(pl, "base64url"));
  const keys = await jwks(doc);
  let jwk = keys.find((k) => k.kid === header.kid) || keys.find((k) => k.kty === (header.alg[0] === "R" ? "RSA" : "EC"));
  if (!jwk) throw new Error("no matching signing key");
  const key = crypto.createPublicKey({ key: jwk, format: "jwk" });
  const data = Buffer.from(h + "." + pl);
  const s = Buffer.from(sig, "base64url");
  let ok;
  if (header.alg === "RS256") ok = crypto.verify("RSA-SHA256", data, key, s);
  else if (header.alg === "ES256") ok = crypto.verify("sha256", data, { key, dsaEncoding: "ieee-p1363" }, s);
  else throw new Error("unsupported alg " + header.alg);
  if (!ok) throw new Error("id_token signature invalid");
  const iss = (doc.issuer || "").replace(/\/$/, "");
  if ((payload.iss || "").replace(/\/$/, "") !== iss) throw new Error("issuer mismatch");
  const aud = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
  if (!aud.includes(clientId)) throw new Error("audience mismatch");
  if (payload.exp && payload.exp * 1000 < Date.now() - 60000) throw new Error("id_token expired");
  if (nonce && payload.nonce && payload.nonce !== nonce) throw new Error("nonce mismatch");
  return payload;
}
const fedAccountId = (provider, sub) =>
  "a-" + crypto.createHash("sha256").update(`oidc:${provider}:${sub}`).digest("hex").slice(0, 20);

/* ---------------- signature verification (the whole auth story) ---------------- */
function verifySig(signPubJwkStr, message, sigB64) {
  let jwk;
  try { jwk = JSON.parse(signPubJwkStr); } catch { return false; }
  const data = Buffer.from(message, "utf8");
  const sig = Buffer.from(sigB64, "base64");
  try {
    if (jwk.kty === "OKP" && jwk.crv === "Ed25519") {
      const key = crypto.createPublicKey({ key: { ...jwk, key_ops: undefined, ext: undefined }, format: "jwk" });
      return crypto.verify(null, data, key, sig);
    }
    if (jwk.kty === "EC" && jwk.crv === "P-256") {
      const key = crypto.createPublicKey({ key: { ...jwk, key_ops: undefined, ext: undefined }, format: "jwk" });
      return crypto.verify("sha256", data, { key, dsaEncoding: "ieee-p1363" }, sig);
    }
  } catch { return false; }
  return false;
}
// account id is derived from the signing key, so it is stable and self-certifying
const idForKey = (signPubJwkStr) =>
  "a-" + crypto.createHash("sha256").update(signPubJwkStr).digest("hex").slice(0, 20);

/* ---------------- live connections (SSE) ---------------- */
const live = new Map();  // accountId -> Set<res>
function pushTo(accountId, event, data) {
  const set = live.get(accountId);
  if (!set || !set.size) return false;
  const frame = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const res of set) { try { res.write(frame); } catch {} }
  return true;
}
function onlineIds() { return new Set([...live.keys()]); }
// tell an org that someone's presence changed
function broadcastPresence(orgId, exceptId) {
  for (const m of q.orgMembers.all(orgId)) {
    if (m.id === exceptId) continue;
    pushTo(m.id, "presence", { orgId, online: [...onlineIds()].filter((id) => id !== m.id) });
  }
}

/* ---------------- tiny rate limiter ---------------- */
const hits = new Map();
function limited(key, max = 60, windowMs = 60000) {
  const t = now();
  const rec = hits.get(key);
  if (!rec || t - rec.start > windowMs) { hits.set(key, { start: t, n: 1 }); return false; }
  rec.n++;
  return rec.n > max;
}

/* ---------------- http helpers ---------------- */
const json = (res, code, obj) => {
  const body = JSON.stringify(obj);
  res.writeHead(code, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" });
  res.end(body);
};
const readBody = (req) => new Promise((resolve, reject) => {
  let n = 0; const chunks = [];
  req.on("data", (c) => { n += c.length; if (n > 512 * 1024) { reject(new Error("too large")); req.destroy(); } chunks.push(c); });
  req.on("end", () => { try { resolve(chunks.length ? JSON.parse(Buffer.concat(chunks).toString("utf8")) : {}); } catch (e) { reject(e); } });
  req.on("error", reject);
});
function auth(req) {
  const h = req.headers.authorization || "";
  const token = h.startsWith("Bearer ") ? h.slice(7) : new URL(req.url, "http://x").searchParams.get("token");
  if (!token) return null;
  const s = q.sessionByToken.get(token);
  if (!s) return null;
  const a = q.accountById.get(s.account_id);
  return a ? { account: a, token } : null;
}
const pub = (a) => ({ id: a.id, name: a.name, boxPub: a.box_pub, federated: !!q.isFederated.get(a.id) });

// the little page the OIDC popup renders; it hands the session to the opener
function oidcResultPage(result) {
  const data = JSON.stringify(result).replace(/</g, "\\u003c");
  return `<!doctype html><meta charset=utf-8><title>Friday — signing in…</title>
<body style="margin:0;display:grid;place-items:center;height:100vh;font-family:-apple-system,sans-serif;background:#F4EFE6;color:#1B1B1C">
<div style="text-align:center">
  <div style="font-size:15px">${result.error ? "Sign-in failed" : "Signed in — returning to Friday…"}</div>
  ${result.error ? `<div style="color:#6B1721;font-size:12px;margin-top:6px">${String(result.error).replace(/</g, "&lt;")}</div>` : ""}
</div>
<script id="friday-oidc-result" type="application/json">${data}</script>
<script>
  var r = ${data};
  var sent = false;
  // BroadcastChannel reaches the opener even when window.opener is null
  // (headless, COOP, noopener). postMessage is a belt-and-braces second path.
  try { var bc = new BroadcastChannel("friday-oidc"); bc.postMessage({ source: "friday-oidc", result: r }); sent = true; } catch (e) {}
  try { if (window.opener) { window.opener.postMessage({ source: "friday-oidc", result: r }, "*"); sent = true; } } catch (e) {}
  if (sent) { setTimeout(function(){ try { window.close(); } catch (e) {} }, 400); }
  else { location.replace("/#oidc=" + encodeURIComponent(JSON.stringify(r))); }
</script>`;
}

/* ---------------- API ---------------- */
async function api(req, res, url) {
  const ip = req.socket.remoteAddress || "?";
  if (limited(ip, 240)) return json(res, 429, { error: "slow down" });
  const seg = url.pathname.split("/").filter(Boolean);   // ["api", ...]
  const route = seg.slice(1);
  const method = req.method;

  // GET /api/health — lets the client discover whether a backend exists at all
  if (method === "GET" && route[0] === "health")
    return json(res, 200, { ok: true, service: "friday", version: "1.0.0", accounts: db.prepare("SELECT COUNT(*) n FROM accounts").get().n });

  // GET /api/auth/providers → which social logins this server actually offers
  if (method === "GET" && route[0] === "auth" && route[1] === "providers") {
    const list = Object.entries(PROVIDERS)
      .filter(([, p]) => p.clientId)
      .map(([id, p]) => ({ id, name: p.name || id }));
    return json(res, 200, { providers: list });
  }

  // GET /api/auth/:provider/start?redirect= → build the authorization URL (PKCE)
  if (method === "GET" && route[0] === "auth" && route[2] === "start") {
    const pid = route[1];
    const p = PROVIDERS[pid];
    if (!p || !p.clientId) return json(res, 404, { error: "provider not configured" });
    let doc;
    try { doc = await discover(p); } catch (e) { return json(res, 502, { error: "provider discovery failed" }); }
    const state = rid(24), nonce = rid(24);
    const verifier = b64url(crypto.randomBytes(48));
    const challenge = b64url(crypto.createHash("sha256").update(verifier).digest());
    q.sweepState.run(now() - 10 * 60000);
    q.putState.run(state, pid, verifier, nonce, url.searchParams.get("redirect") || "", now());
    const authUrl = new URL(doc.authorization_endpoint);
    authUrl.searchParams.set("client_id", p.clientId);
    authUrl.searchParams.set("redirect_uri", `${PUBLIC_URL}/api/auth/${pid}/callback`);
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("scope", p.scope || "openid email profile");
    authUrl.searchParams.set("state", state);
    authUrl.searchParams.set("nonce", nonce);
    authUrl.searchParams.set("code_challenge", challenge);
    authUrl.searchParams.set("code_challenge_method", "S256");
    if (pid === "apple") authUrl.searchParams.set("response_mode", "form_post");
    return json(res, 200, { authUrl: authUrl.toString() });
  }

  // GET/POST /api/auth/:provider/callback — provider redirects here with a code
  if (route[0] === "auth" && route[2] === "callback") {
    const pid = route[1];
    const p = PROVIDERS[pid];
    let code, state;
    if (method === "POST") { const b = await readBody(req).catch(() => ({})); code = b.code; state = b.state; }
    else { code = url.searchParams.get("code"); state = url.searchParams.get("state"); }
    const fail = (msg) => {
      res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
      res.end(oidcResultPage({ error: msg }));
    };
    if (!p || !p.clientId) return fail("provider not configured");
    const st = q.getState.get(String(state || ""));
    if (!st || st.provider !== pid || now() - st.created > 10 * 60000) return fail("expired or unknown login attempt");
    q.dropState.run(st.state);
    try {
      const doc = await discover(p);
      const form = new URLSearchParams({
        grant_type: "authorization_code", code: String(code),
        redirect_uri: `${PUBLIC_URL}/api/auth/${pid}/callback`,
        client_id: p.clientId, code_verifier: st.verifier,
      });
      if (p.clientSecret) form.set("client_secret", p.clientSecret);
      const tr = await fetch(doc.token_endpoint, { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: form });
      const tok = await tr.json();
      if (!tr.ok || !tok.id_token) throw new Error(tok.error_description || tok.error || "token exchange failed");
      const claims = await verifyIdToken(doc, tok.id_token, p.clientId, st.nonce);
      const sub = claims.sub;
      const name = claims.name || (claims.email ? claims.email.split("@")[0] : (p.name || pid) + " user");
      const id = fedAccountId(pid, sub);
      if (!q.accountById.get(id)) {
        // an OIDC account starts with no keys; the browser binds them after it
        // makes a vault. sign_pub stays a unique non-colliding provenance tag.
        q.insertAccount.run(id, name, `oidc:${pid}:${sub}`, "", now());
      }
      q.federatedPut.run(pid, sub, id, claims.email || null, name, now());
      const token = rid(32);
      q.insertSession.run(token, id, now());
      const acct = q.accountById.get(id);
      res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
      res.end(oidcResultPage({ token, account: pub(acct), provider: pid, needsKeys: !acct.box_pub }));
    } catch (e) {
      return fail(String(e.message || e));
    }
    return;
  }

  // POST /api/challenge {signPub} → {nonce}
  if (method === "POST" && route[0] === "challenge") {
    const b = await readBody(req);
    if (!b.signPub) return json(res, 400, { error: "signPub required" });
    q.sweepChallenges.run(now() - 5 * 60000);
    const nonce = rid(24);
    q.insertChallenge.run(nonce, String(b.signPub), now());
    return json(res, 200, { nonce });
  }

  // POST /api/register {name, signPub, boxPub, nonce, sig}
  if (method === "POST" && route[0] === "register") {
    const b = await readBody(req);
    if (limited("reg:" + ip, 10)) return json(res, 429, { error: "too many registrations" });
    const name = String(b.name || "").trim().slice(0, 64);
    if (!name) return json(res, 400, { error: "name required" });
    if (!b.signPub || !b.boxPub || !b.nonce || !b.sig) return json(res, 400, { error: "missing fields" });
    const ch = q.challengeByNonce.get(String(b.nonce));
    if (!ch || ch.sign_pub !== String(b.signPub) || now() - ch.created > 5 * 60000)
      return json(res, 400, { error: "bad or expired challenge" });
    if (!verifySig(String(b.signPub), String(b.nonce), String(b.sig)))
      return json(res, 401, { error: "signature did not verify" });
    q.dropChallenge.run(String(b.nonce));

    const id = idForKey(String(b.signPub));
    const existing = q.accountById.get(id);
    if (existing) {                       // same key registering again → just refresh + log in
      q.updateBoxPub.run(String(b.boxPub), name, id);
    } else {
      q.insertAccount.run(id, name, String(b.signPub), String(b.boxPub), now());
    }
    const token = rid(32);
    q.insertSession.run(token, id, now());
    return json(res, 200, { token, account: pub(q.accountById.get(id)) });
  }

  // POST /api/login {signPub, nonce, sig, boxPub?}
  if (method === "POST" && route[0] === "login") {
    const b = await readBody(req);
    if (limited("login:" + ip, 30)) return json(res, 429, { error: "too many attempts" });
    const ch = q.challengeByNonce.get(String(b.nonce || ""));
    if (!ch || ch.sign_pub !== String(b.signPub) || now() - ch.created > 5 * 60000)
      return json(res, 400, { error: "bad or expired challenge" });
    if (!verifySig(String(b.signPub), String(b.nonce), String(b.sig || "")))
      return json(res, 401, { error: "signature did not verify" });
    q.dropChallenge.run(String(b.nonce));
    const acct = q.accountBySign.get(String(b.signPub));
    if (!acct) return json(res, 404, { error: "no account for this key" });
    if (b.boxPub) q.updateBoxPub.run(String(b.boxPub), acct.name, acct.id);   // key may rotate per device
    const token = rid(32);
    q.insertSession.run(token, acct.id, now());
    return json(res, 200, { token, account: pub(q.accountById.get(acct.id)) });
  }

  /* --- everything below needs a session --- */
  const me = auth(req);
  if (!me) return json(res, 401, { error: "unauthorized" });

  if (method === "POST" && route[0] === "logout") { q.dropSession.run(me.token); return json(res, 200, { ok: true }); }

  // GET /api/me → account + orgs
  if (method === "GET" && route[0] === "me")
    return json(res, 200, { account: pub(me.account), orgs: q.myOrgs.all(me.account.id) });

  // POST /api/account/keys {boxPub, signPub?, name?} — the browser binds the
  // vault it just made to this account. For a federated account this is how it
  // gets a mesh public key (for E2E) and, optionally, a signing key so this
  // device can re-authenticate later without repeating the OIDC dance.
  if (method === "POST" && route[0] === "account" && route[1] === "keys") {
    const b = await readBody(req);
    if (!b.boxPub) return json(res, 400, { error: "boxPub required" });
    const name = String(b.name || me.account.name).slice(0, 64);
    const federated = me.account.sign_pub?.startsWith("oidc:");
    if (b.signPub && federated) {
      // don't let a second account claim a signing key already in use
      const clash = q.accountBySign.get(String(b.signPub));
      if (clash && clash.id !== me.account.id) return json(res, 409, { error: "key already bound" });
      q.setKeys.run(String(b.boxPub), String(b.signPub), name, me.account.id);
    } else {
      q.setBox.run(String(b.boxPub), name, me.account.id);
    }
    return json(res, 200, { account: pub(q.accountById.get(me.account.id)) });
  }

  // POST /api/orgs {name} → create an org, become its owner, get an invite
  if (method === "POST" && route[0] === "orgs" && route.length === 1) {
    const b = await readBody(req);
    const name = String(b.name || "").trim().slice(0, 64);
    if (!name) return json(res, 400, { error: "org name required" });
    const id = "o-" + rid(8);
    q.insertOrg.run(id, name, me.account.id, now());
    q.insertMember.run(id, me.account.id, "owner", now());
    const code = inviteCode();
    q.insertInvite.run(code, id, me.account.id, now(), now() + 14 * 864e5, 25);
    return json(res, 200, { org: { id, name, owner: me.account.id, role: "owner" }, invite: { code } });
  }

  // POST /api/orgs/join {code}
  if (method === "POST" && route[0] === "orgs" && route[1] === "join") {
    const b = await readBody(req);
    if (limited("join:" + ip, 20)) return json(res, 429, { error: "too many attempts" });
    const code = String(b.code || "").trim().toUpperCase();
    const inv = q.inviteByCode.get(code);
    if (!inv) return json(res, 404, { error: "invite not found" });
    if (inv.expires < now()) return json(res, 410, { error: "invite expired" });
    if (inv.uses >= inv.max_uses) return json(res, 410, { error: "invite already used up" });
    const org = q.orgById.get(inv.org_id);
    if (!org) return json(res, 404, { error: "org gone" });
    const already = q.membership.get(org.id, me.account.id);
    if (!already) {
      q.insertMember.run(org.id, me.account.id, "member", now());
      q.bumpInvite.run(code);
      for (const m of q.orgMembers.all(org.id))
        if (m.id !== me.account.id) pushTo(m.id, "member-joined", { orgId: org.id, member: { id: me.account.id, name: me.account.name, boxPub: me.account.box_pub } });
    }
    return json(res, 200, { org: { id: org.id, name: org.name, owner: org.owner, role: already ? already.role : "member" } });
  }

  // GET /api/orgs/:id/members
  if (method === "GET" && route[0] === "orgs" && route[2] === "members") {
    const orgId = route[1];
    if (!q.membership.get(orgId, me.account.id)) return json(res, 403, { error: "not a member" });
    const on = onlineIds();
    return json(res, 200, {
      members: q.orgMembers.all(orgId).map((m) => ({ id: m.id, name: m.name, boxPub: m.box_pub, role: m.role, online: on.has(m.id) })),
    });
  }

  // POST /api/orgs/:id/invites → fresh code (any member may invite; owner-only would be a policy change)
  if (method === "POST" && route[0] === "orgs" && route[2] === "invites") {
    const orgId = route[1];
    if (!q.membership.get(orgId, me.account.id)) return json(res, 403, { error: "not a member" });
    const existing = q.latestInvite.get(orgId, now());
    if (existing && !(await readBody(req)).fresh) return json(res, 200, { code: existing.code, expires: existing.expires });
    const code = inviteCode();
    q.insertInvite.run(code, orgId, me.account.id, now(), now() + 14 * 864e5, 25);
    return json(res, 200, { code, expires: now() + 14 * 864e5 });
  }

  // POST /api/signal {to, payload} — opaque WebRTC rendezvous; this is how devices find each other
  if (method === "POST" && route[0] === "signal") {
    const b = await readBody(req);
    const to = String(b.to || "");
    if (!to || !b.payload) return json(res, 400, { error: "to + payload required" });
    const delivered = pushTo(to, "signal", { from: me.account.id, fromName: me.account.name, payload: b.payload });
    return json(res, delivered ? 200 : 202, { delivered });
  }

  // POST /api/mailbox {to, payload} — store-and-forward ciphertext for an offline peer
  if (method === "POST" && route[0] === "mailbox") {
    const b = await readBody(req);
    if (!b.to || !b.payload) return json(res, 400, { error: "to + payload required" });
    const item = { from: me.account.id, fromName: me.account.name, payload: b.payload, created: now() };
    if (pushTo(String(b.to), "mail", item)) return json(res, 200, { delivered: true });
    q.putMail.run(String(b.to), me.account.id, JSON.stringify(b.payload), now());
    return json(res, 202, { delivered: false, stored: true });
  }

  // GET /api/events (SSE) — presence, signaling, and any mail that piled up
  if (method === "GET" && route[0] === "events") {
    res.writeHead(200, {
      "content-type": "text/event-stream", "cache-control": "no-cache",
      connection: "keep-alive", "x-accel-buffering": "no",
    });
    res.write(`retry: 3000\n\n`);
    res.write(`event: ready\ndata: ${JSON.stringify({ id: me.account.id })}\n\n`);

    if (!live.has(me.account.id)) live.set(me.account.id, new Set());
    live.get(me.account.id).add(res);

    for (const o of q.myOrgs.all(me.account.id)) broadcastPresence(o.id, me.account.id);
    for (const o of q.myOrgs.all(me.account.id))
      pushTo(me.account.id, "presence", { orgId: o.id, online: [...onlineIds()].filter((id) => id !== me.account.id) });

    // drain the mailbox
    for (const row of q.takeMail.all(me.account.id)) {
      let payload; try { payload = JSON.parse(row.payload); } catch { payload = row.payload; }
      const from = q.accountById.get(row.from_id);
      pushTo(me.account.id, "mail", { from: row.from_id, fromName: from ? from.name : "unknown", payload, created: row.created });
      q.dropMail.run(row.id);
    }

    const beat = setInterval(() => { try { res.write(": beat\n\n"); } catch {} }, 25000);
    req.on("close", () => {
      clearInterval(beat);
      const set = live.get(me.account.id);
      if (set) { set.delete(res); if (!set.size) live.delete(me.account.id); }
      for (const o of q.myOrgs.all(me.account.id)) broadcastPresence(o.id, me.account.id);
    });
    return;
  }

  return json(res, 404, { error: "no such route" });
}

/* ---------------- static app ---------------- */
const MIME = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8", ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json", ".svg": "image/svg+xml",
  ".png": "image/png", ".ico": "image/x-icon", ".woff2": "font/woff2",
};
function serveStatic(req, res, url) {
  let p = decodeURIComponent(url.pathname);
  if (p === "/") p = "/index.html";
  const file = path.join(ROOT, path.normalize(p).replace(/^(\.\.[/\\])+/, ""));
  if (!file.startsWith(ROOT) || file.includes(path.join(ROOT, "server"))) { res.writeHead(403); return res.end("forbidden"); }
  fs.stat(file, (err, st) => {
    if (err || !st.isFile()) { res.writeHead(404); return res.end("not found"); }
    res.writeHead(200, {
      "content-type": MIME[path.extname(file)] || "application/octet-stream",
      "cache-control": p === "/index.html" ? "no-cache" : "public, max-age=60",
    });
    fs.createReadStream(file).pipe(res);
  });
}

/* ---------------- server ---------------- */
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  // permissive CORS so the app can also run from a different origin (e.g. Pages) against this server
  res.setHeader("access-control-allow-origin", req.headers.origin || "*");
  res.setHeader("access-control-allow-headers", "content-type, authorization");
  res.setHeader("access-control-allow-methods", "GET, POST, OPTIONS");
  res.setHeader("vary", "origin");
  if (req.method === "OPTIONS") { res.writeHead(204); return res.end(); }

  if (url.pathname.startsWith("/api/")) {
    try { await api(req, res, url); }
    catch (e) { if (!res.headersSent) json(res, 400, { error: String(e.message || e) }); }
    return;
  }
  serveStatic(req, res, url);
});

setInterval(() => { q.sweepChallenges.run(now() - 5 * 60000); q.sweepMail.run(now() - 30 * 864e5); q.sweepState.run(now() - 10 * 60000); }, 60000).unref();

server.listen(PORT, () => {
  console.log(`\n  Friday · Eros Office — backend`);
  console.log(`  http://localhost:${PORT}`);
  console.log(`  db: ${DB_PATH}`);
  console.log(`  rendezvous + directory only — message plaintext never reaches this process.\n`);
});
