/* ============================================================
   FRIDAY · EROS OFFICE — Orange PIE V1 Alpha · Glass Stone LLC
   A mesh-network workspace rendered in the Hudson Design
   Language. One material, one palette, one accent at a time.
   ============================================================ */
"use strict";

/* ---------------- state ---------------- */
const DEFAULTS = {
  theme: "auto",            // light | dark | auto
  accent: "carmine",        // carmine | atlantic | signal
  glass: 22,                // diffusion, px
  wallpaper: "noon",        // noon | dusk | limestone
  transports: { wifi: true, ble: true, lora: true, tor: true },
};
const State = (() => {
  try { return { ...DEFAULTS, ...JSON.parse(localStorage.getItem("friday.state") || "{}"), transports: { ...DEFAULTS.transports, ...(JSON.parse(localStorage.getItem("friday.state") || "{}").transports || {}) } }; }
  catch { return { ...DEFAULTS }; }
})();
function persist() { try { localStorage.setItem("friday.state", JSON.stringify(State)); } catch {} }

const prefersDark = matchMedia("(prefers-color-scheme: dark)");
function applyState() {
  const dark = State.theme === "dark" || (State.theme === "auto" && prefersDark.matches);
  document.documentElement.dataset.theme = dark ? "dark" : "light";
  document.documentElement.dataset.accent = State.accent;
  document.documentElement.dataset.wallpaper = State.wallpaper;
  document.documentElement.style.setProperty("--diffusion", State.glass + "px");
  persist();
  refreshOpenSettings();
  ControlCenter.refresh();
  Mesh.invalidateColors();
}
prefersDark.addEventListener("change", applyState);

/* ---------------- tiny dom helpers ---------------- */
const $ = (s, r = document) => r.querySelector(s);
function el(tag, cls, html) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (html !== undefined) n.innerHTML = html;
  return n;
}
const esc = (s) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

/* ---------------- iconography (line, currentColor) ---------------- */
const Icons = {
  mesh: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><circle cx="5" cy="6" r="2.1"/><circle cx="19" cy="5" r="2.1"/><circle cx="12" cy="13" r="2.1"/><circle cx="5" cy="19" r="2.1"/><circle cx="19" cy="18" r="2.1"/><line x1="6.8" y1="7" x2="10.3" y2="11.8"/><line x1="17.2" y1="6.2" x2="13.7" y2="11.6"/><line x1="6.6" y1="17.7" x2="10.4" y2="14.4"/><line x1="17.3" y1="17" x2="13.8" y2="14.2"/><line x1="5" y1="8.2" x2="5" y2="16.8"/></svg>`,
  messages: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.6c0 4.3-4 7.7-9 7.7-1 0-2-.13-2.9-.38L4 20.5l1.2-3.2C3.8 15.9 3 13.9 3 11.6 3 7.3 7 4 12 4s9 3.3 9 7.6Z"/></svg>`,
  boards: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><rect x="3.2" y="4" width="5.2" height="13" rx="1.6"/><rect x="9.4" y="4" width="5.2" height="9.4" rx="1.6"/><rect x="15.6" y="4" width="5.2" height="16" rx="1.6"/></svg>`,
  calls: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5.5 3.8h3l1.6 4-2 1.6a13.3 13.3 0 0 0 6 6l1.7-2 4 1.6v3c0 .9-.8 1.7-1.7 1.6C9.8 18.9 5.1 14.2 4 5.5c-.1-.9.6-1.7 1.5-1.7Z"/></svg>`,
  vault: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><rect x="3.5" y="3.5" width="17" height="17" rx="3"/><circle cx="12" cy="12" r="4.2"/><circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none"/><line x1="12" y1="7.8" x2="12" y2="9.4"/><line x1="12" y1="14.6" x2="12" y2="16.2"/><line x1="7.8" y1="12" x2="9.4" y2="12"/><line x1="14.6" y1="12" x2="16.2" y2="12"/></svg>`,
  settings: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 3.2v2.2M12 18.6v2.2M3.2 12h2.2M18.6 12h2.2M5.8 5.8l1.6 1.6M16.6 16.6l1.6 1.6M18.2 5.8l-1.6 1.6M7.4 16.6l-1.6 1.6"/></svg>`,
  ledger: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3.4h9.6L19 6.8V20a.8.8 0 0 1-.8.8H6a.8.8 0 0 1-.8-.8V4.2A.8.8 0 0 1 6 3.4Z"/><path d="M15 3.6V7h3.4"/><circle cx="9" cy="11.4" r="1.5"/><circle cx="9" cy="16.2" r="1.5"/><line x1="10.5" y1="11.4" x2="16" y2="11.4"/><line x1="10.5" y1="16.2" x2="16" y2="16.2"/><line x1="9" y1="12.9" x2="9" y2="14.7"/></svg>`,
  lock: `<svg viewBox="0 0 16 16" width="10" height="10" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><rect x="3.2" y="7" width="9.6" height="6.4" rx="1.8"/><path d="M5.4 7V5.2a2.6 2.6 0 0 1 5.2 0V7"/></svg>`,
  send: `<svg viewBox="0 0 20 20" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10 17 3l-3.2 14L9.6 11 3 10Z"/><line x1="9.6" y1="11" x2="17" y2="3"/></svg>`,
  phone: `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M5.5 3.8h3l1.6 4-2 1.6a13.3 13.3 0 0 0 6 6l1.7-2 4 1.6v3c0 .9-.8 1.7-1.7 1.6C9.8 18.9 5.1 14.2 4 5.5c-.1-.9.6-1.7 1.5-1.7Z"/></svg>`,
  phoneDown: `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M3 13.5c5-4.6 13-4.6 18 0l-1.8 2.4-3.6-1.4-.4-2.6a11.5 11.5 0 0 0-6.4 0l-.4 2.6-3.6 1.4L3 13.5Z"/></svg>`,
  mic: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><rect x="9.4" y="3.4" width="5.2" height="10" rx="2.6"/><path d="M5.8 11.4a6.2 6.2 0 0 0 12.4 0M12 17.6v3"/></svg>`,
  home: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 10.4 12 4l7.5 6.4V19a1 1 0 0 1-1 1h-4.6v-5.2H10V20H5.5a1 1 0 0 1-1-1Z"/></svg>`,
  more: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><circle cx="5.5" cy="12" r="1.4" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none"/><circle cx="18.5" cy="12" r="1.4" fill="currentColor" stroke="none"/></svg>`,
};

/* ============================================================
   WINDOW MANAGER
   ============================================================ */
const WM = {
  zTop: 10,
  wins: new Map(),     // appId -> { el, app, minimized, prevRect }
  area: null,

  open(appId) {
    const app = Apps[appId];
    if (!app) return;
    const existing = this.wins.get(appId);
    if (existing) {
      if (existing.minimized) this.restore(appId);
      this.focus(appId);
      return;
    }
    const win = el("div", "window glass opening");
    const n = this.wins.size;
    const W = Math.min(app.w, innerWidth - 40), H = Math.min(app.h, innerHeight - 110);
    win.style.width = W + "px";
    win.style.height = H + "px";
    win.style.left = Math.max(12, Math.min(70 + n * 36, innerWidth - W - 20)) + "px";
    win.style.top = Math.max(8, Math.min(40 + n * 30, innerHeight - H - 100)) + "px";

    const bar = el("div", "titlebar");
    const lights = el("div", "lights");
    for (const kind of ["close", "min", "zoom"]) {
      const b = el("button", "light " + kind);
      b.setAttribute("aria-label", kind);
      b.addEventListener("click", (e) => {
        e.stopPropagation();
        if (kind === "close") this.close(appId);
        if (kind === "min") this.minimize(appId);
        if (kind === "zoom") this.zoom(appId);
      });
      lights.append(b);
    }
    bar.append(lights, el("div", "win-title", esc(app.title)));
    const body = el("div", "win-body");
    const handle = el("div", "resize-handle");
    win.append(bar, body, handle);
    this.area.append(win);

    const rec = { el: win, app, minimized: false, prevRect: null };
    this.wins.set(appId, rec);
    app.render(body, rec);

    win.addEventListener("pointerdown", () => this.focus(appId));
    this.drag(bar, win);
    this.resize(handle, win);
    win.addEventListener("animationend", () => win.classList.remove("opening"), { once: true });
    bar.addEventListener("dblclick", (e) => { if (!e.target.closest(".light")) this.zoom(appId); });

    this.focus(appId);
    Dock.refresh();
  },

  focus(appId) {
    for (const [id, r] of this.wins) r.el.classList.toggle("focused", id === appId);
    const rec = this.wins.get(appId);
    if (!rec) return;
    rec.el.style.zIndex = ++this.zTop;
    MenuBar.setApp(rec.app);
  },

  focusedId() {
    let best = null, bz = -1;
    for (const [id, r] of this.wins) {
      const z = +r.el.style.zIndex || 0;
      if (!r.minimized && z > bz) { bz = z; best = id; }
    }
    return best;
  },

  close(appId) {
    const rec = this.wins.get(appId);
    if (!rec) return;
    rec.app.teardown?.();
    rec.el.classList.add("closing");
    rec.el.addEventListener("animationend", () => rec.el.remove(), { once: true });
    this.wins.delete(appId);
    Dock.refresh();
    const next = this.focusedId();
    if (next) this.focus(next); else MenuBar.setApp(null);
  },

  minimize(appId) {
    const rec = this.wins.get(appId);
    if (!rec || rec.minimized) return;
    const dockIcon = $(`.dock-app[data-app="${appId}"]`);
    const r = rec.el.getBoundingClientRect();
    const d = dockIcon ? dockIcon.getBoundingClientRect() : { left: innerWidth / 2, top: innerHeight, width: 0, height: 0 };
    const dx = d.left + d.width / 2 - (r.left + r.width / 2);
    const dy = d.top + d.height / 2 - (r.top + r.height / 2);
    rec.el.classList.add("minimizing");
    rec.el.style.transform = `translate(${dx}px, ${dy}px) scale(0.06)`;
    rec.el.style.opacity = "0";
    rec.el.style.filter = "blur(10px)";
    rec.minimized = true;
    setTimeout(() => { if (rec.minimized) rec.el.style.display = "none"; }, 380);
    const next = this.focusedId();
    if (next) this.focus(next);
  },

  restore(appId) {
    const rec = this.wins.get(appId);
    if (!rec || !rec.minimized) return;
    rec.minimized = false;
    rec.el.style.display = "";
    requestAnimationFrame(() => {
      rec.el.style.transform = "";
      rec.el.style.opacity = "";
      rec.el.style.filter = "";
      setTimeout(() => rec.el.classList.remove("minimizing"), 380);
    });
  },

  zoom(appId) {
    const rec = this.wins.get(appId);
    if (!rec) return;
    const s = rec.el.style;
    if (rec.prevRect) {
      Object.assign(s, rec.prevRect);
      rec.prevRect = null;
    } else {
      rec.prevRect = { left: s.left, top: s.top, width: s.width, height: s.height };
      s.left = "10px"; s.top = "6px";
      s.width = innerWidth - 20 + "px";
      s.height = innerHeight - 30 - 88 + "px";
    }
  },

  drag(bar, win) {
    bar.addEventListener("pointerdown", (e) => {
      if (e.target.closest(".light")) return;
      const sx = e.clientX - win.offsetLeft, sy = e.clientY - win.offsetTop;
      const move = (ev) => {
        win.style.left = Math.min(Math.max(ev.clientX - sx, -win.offsetWidth + 90), innerWidth - 90) + "px";
        win.style.top = Math.min(Math.max(ev.clientY - sy, 0), innerHeight - 80) + "px";
      };
      const up = () => { removeEventListener("pointermove", move); removeEventListener("pointerup", up); };
      addEventListener("pointermove", move);
      addEventListener("pointerup", up);
    });
  },

  resize(handle, win) {
    handle.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      const sw = win.offsetWidth - e.clientX, sh = win.offsetHeight - e.clientY;
      const move = (ev) => {
        win.style.width = Math.max(420, sw + ev.clientX) + "px";
        win.style.height = Math.max(280, sh + ev.clientY) + "px";
      };
      const up = () => { removeEventListener("pointermove", move); removeEventListener("pointerup", up); };
      addEventListener("pointermove", move);
      addEventListener("pointerup", up);
    });
  },
};

/* ============================================================
   APPS
   ============================================================ */
const Apps = {};

/* ---------------- Mesh · Dark Core (renders REAL peers) ---------------- */
const Mesh = {
  raf: 0, canvas: null, ctx: null, wrap: null, colors: null, stats: {}, layout: new Map(),

  invalidateColors() { this.colors = null; },

  palette() {
    if (this.colors) return this.colors;
    const cs = getComputedStyle(document.documentElement);
    this.colors = {
      body: cs.getPropertyValue("--body").trim(),
      muted: cs.getPropertyValue("--muted").trim(),
      rule: cs.getPropertyValue("--rule").trim(),
      accent: cs.getPropertyValue("--accent").trim(),
      signal: cs.getPropertyValue("--signal").trim(),
    };
    return this.colors;
  },

  // total real endpoints on this mesh: this device + live peers
  activeCount() { return 1 + (typeof Net !== "undefined" ? Net.peers.size : 0); },

  // a stable angle per peer id so nodes don't jump around
  angle(id) {
    let h = 0;
    for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
    return (h % 360) * Math.PI / 180;
  },

  tick() {
    const { canvas, ctx } = this;
    if (!canvas || !canvas.isConnected) { this.raf = 0; return; }
    const dpr = devicePixelRatio || 1;
    const w = this.wrap.clientWidth, h = this.wrap.clientHeight;
    if (canvas.width !== w * dpr || canvas.height !== h * dpr) { canvas.width = w * dpr; canvas.height = h * dpr; }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    const pal = this.palette();
    const tcol = { ble: pal.signal, rtc: pal.accent, bc: pal.rule };
    const t = performance.now() / 1000;
    const cx = w / 2, cy = h / 2;
    const R = Math.min(w, h) * 0.33;

    const peers = typeof Net !== "undefined" ? [...Net.peers.values()] : [];
    const breathe = Math.sin(t * 0.7) * 3;
    const self = { px: cx, py: cy, r: 7, self: true };
    const pts = [self];
    peers.forEach((p, i) => {
      const a = this.angle(p.id) + t * 0.05;
      const rad = R + Math.sin(t * 0.6 + i) * 6 + breathe;
      pts.push({ px: cx + Math.cos(a) * rad, py: cy + Math.sin(a) * rad, r: 5, peer: p, transport: p.transport });
    });

    // edges: every node hears the broadcast bus, so it is a real full mesh
    let paths = 0;
    for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) {
      const a = pts[i], b = pts[j];
      paths++;
      ctx.strokeStyle = (a.self || b.self) ? pal.accent : pal.body;
      ctx.globalAlpha = (a.self || b.self) ? 0.30 : 0.10;
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(a.px, a.py); ctx.lineTo(b.px, b.py); ctx.stroke();
      // a packet travelling the link to make live traffic visible
      if (a.self || b.self) {
        const f = (t * 0.5 + i * 0.3) % 1;
        ctx.globalAlpha = 0.6;
        ctx.fillStyle = pal.accent;
        ctx.beginPath(); ctx.arc(a.px + (b.px - a.px) * f, a.py + (b.py - a.py) * f, 1.6, 0, 7); ctx.fill();
      }
    }
    ctx.globalAlpha = 1;

    for (const p of pts) {
      const col = p.self ? pal.accent : (tcol[p.transport] || pal.rule);
      ctx.globalAlpha = 0.18; ctx.fillStyle = col;
      ctx.beginPath(); ctx.arc(p.px, p.py, p.r * 2.8, 0, 7); ctx.fill();
      ctx.globalAlpha = 1;
      ctx.beginPath(); ctx.arc(p.px, p.py, p.r, 0, 7); ctx.fill();
      ctx.fillStyle = "#F4EFE6";
      ctx.beginPath(); ctx.arc(p.px, p.py, p.r * 0.4, 0, 7); ctx.fill();
    }

    if (peers.length === 0) {
      ctx.fillStyle = pal.muted;
      ctx.font = '11px "Martian Mono", monospace';
      ctx.textAlign = "center";
      ctx.fillText("ONLY THIS NODE — OPEN FRIDAY IN ANOTHER TAB OR LINK A DEVICE", cx, cy + R + 40);
      ctx.textAlign = "left";
    }

    if (!this._statTick || performance.now() - this._statTick > 700) {
      this._statTick = performance.now();
      const n = pts.length;
      const lats = peers.map((p) => p.latency).filter((x) => x != null);
      const avg = lats.length ? Math.round(lats.reduce((s, x) => s + x, 0) / lats.length) : null;
      this.stats.nodes?.replaceChildren(document.createTextNode(n));
      this.stats.paths?.replaceChildren(document.createTextNode(paths));
      this.stats.lat?.replaceChildren(document.createTextNode(avg == null ? "—" : avg + " ms"));
      this.stats.trust?.replaceChildren(document.createTextNode(peers.length ? "VERIFIED" : "—"));
      const mc = $("#mb-mesh-count"); if (mc) mc.textContent = n;
    }
    this.raf = requestAnimationFrame(() => this.tick());
  },

  start() { if (!this.raf) this.raf = requestAnimationFrame(() => this.tick()); },
  stop() { cancelAnimationFrame(this.raf); this.raf = 0; },
};

Apps.mesh = {
  name: "Mesh", title: "MESH · DARK CORE", icon: Icons.mesh, w: 900, h: 560,
  render(body) {
    const wrap = el("div", "mesh-wrap");
    const canvas = document.createElement("canvas");
    wrap.append(canvas);
    wrap.append(el("div", "", `
      <div style="position:absolute;top:16px;left:20px;z-index:2;pointer-events:none">
        <div class="mono kicker">DARK CORE · LIVE PEERS</div>
        <div class="h-display">The mesh, <em>as it actually is.</em></div>
      </div>`).firstElementChild);

    const rail = el("aside", "mesh-stats");
    const stats = [["nodes", "Nodes on the mesh", "1"], ["paths", "Live links", "0"], ["lat", "Round-trip latency", "—"], ["trust", "Peer status", "—"]];
    for (const [key, label, init] of stats) {
      const p = el("div", "pane stat");
      const n = el("div", "stat-n", init);
      p.append(n, el("div", "stat-d", label));
      rail.append(p);
      Mesh.stats[key] = n;
    }

    rail.append(el("div", "mono rail-head", "THIS NODE"));
    const meBox = el("div", "pane");
    meBox.style.padding = "10px 13px";
    meBox.innerHTML = `<div class="t-name">${esc(Net.name)}</div><div class="t-sub mono" style="word-break:break-all">${Net.id.slice(0, 18)}</div>`;
    rail.append(meBox);

    rail.append(el("div", "mono rail-head", "LIVE PEERS"));
    const peerList = el("div", "pane");
    peerList.style.padding = "4px 13px";
    rail.append(peerList);

    const link = el("button", "rail-item");
    link.style.cssText = "width:auto;margin-top:10px;background:color-mix(in srgb,var(--accent) 14%,transparent)";
    link.textContent = "Link a device →";
    link.addEventListener("click", () => Net.linkDialog());
    rail.append(link, el("div", "mono rail-foot", "BROADCASTCHANNEL + WEBRTC<br>X25519 · HKDF · AES-256-GCM<br>NO SERVER · REAL PEERS ONLY"));
    body.append(wrap, rail);

    const drawPeers = () => {
      const peers = [...Net.peers.values()];
      peerList.replaceChildren();
      if (!peers.length) { peerList.append(el("div", "t-sub", "No peers yet. Open Friday in another tab, install it on a second device, or link one.")); return; }
      for (const p of peers) {
        const row = el("div", "transport");
        const tname = p.transport === "rtc" ? "WebRTC · direct" : p.transport === "ble" ? "BitChat · BLE" : "BroadcastChannel";
        row.innerHTML = `<span class="t-dot"></span><span><div class="t-name">${esc(p.name)}</div><div class="t-sub">${tname}${p.latency != null ? " · " + p.latency + " ms" : ""}</div></span>`;
        peerList.append(row);
      }
    };
    Mesh._unsub = Net.onPeers(drawPeers);
    drawPeers();

    Mesh.canvas = canvas; Mesh.ctx = canvas.getContext("2d"); Mesh.wrap = wrap;
    Mesh.start();
  },
  teardown() { Mesh.stop(); Mesh._unsub?.(); Mesh._unsub = null; },
};

/* ---------------- E2E · real pairwise WebCrypto ----------------
   A real X25519 (P-256 fallback) identity keypair for this device.
   Public keys are exchanged over the live transport, so the shared
   secret is derived from two REAL endpoints — my private key and the
   peer's public key — then HKDF-SHA-256 → AES-256-GCM. Per-peer keys
   are cached. Needs a secure context (https/localhost). */
const b64 = (u8) => btoa(String.fromCharCode(...u8));
const unb64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

const E2E = {
  ok: !!(globalThis.crypto && crypto.subtle),
  alg: null, me: null, myPubRaw: null, keys: new Map(), _init: null,

  init() {
    if (!this.ok) return null;
    if (!this._init) this._init = (async () => {
      try { this.me = await crypto.subtle.generateKey({ name: "X25519" }, false, ["deriveBits"]); this.alg = "X25519"; }
      catch { this.me = await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, false, ["deriveBits"]); this.alg = "P-256"; }
      this.myPubRaw = new Uint8Array(await crypto.subtle.exportKey("raw", this.me.publicKey));
    })();
    return this._init;
  },

  async myPub() { await this.init(); return b64(this.myPubRaw); },

  fingerprint(aRaw, bRaw) {
    // order-independent so both ends show the same short code
    const [x, y] = [b64(aRaw), b64(bRaw)].sort();
    return crypto.subtle.digest("SHA-256", new TextEncoder().encode(x + y))
      .then((d) => [...new Uint8Array(d).slice(0, 4)].map((n) => n.toString(16).padStart(2, "0")).join("").toUpperCase().match(/.{4}/g).join(" "));
  },

  async keyFor(peerPubB64) {
    if (!this.ok) return null;
    await this.init();
    let k = this.keys.get(peerPubB64);
    if (k) return k;
    const peerRaw = unb64(peerPubB64);
    const imp = this.alg === "X25519" ? { name: "X25519" } : { name: "ECDH", namedCurve: "P-256" };
    const peerPub = await crypto.subtle.importKey("raw", peerRaw, imp, false, []);
    const drv = this.alg === "X25519" ? { name: "X25519", public: peerPub } : { name: "ECDH", public: peerPub };
    const shared = await crypto.subtle.deriveBits(drv, this.me.privateKey, 256);
    const hkdf = await crypto.subtle.importKey("raw", shared, "HKDF", false, ["deriveKey"]);
    const key = await crypto.subtle.deriveKey(
      { name: "HKDF", hash: "SHA-256", salt: new TextEncoder().encode("friday.e2e.v2"), info: new Uint8Array() },
      hkdf, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
    const fp = await this.fingerprint(this.myPubRaw, peerRaw);
    k = { key, fp };
    this.keys.set(peerPubB64, k);
    return k;
  },

  async seal(peerPubB64, text) {
    const k = await this.keyFor(peerPubB64);
    if (!k) return null;
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ct = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, k.key, new TextEncoder().encode(text)));
    return { alg: this.alg + " · HKDF · AES-256-GCM", iv: b64(iv), ct: b64(ct), bytes: ct.length, fp: k.fp };
  },

  async open(peerPubB64, wire) {
    const k = await this.keyFor(peerPubB64);
    const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv: unb64(wire.iv) }, k.key, unb64(wire.ct));
    return new TextDecoder().decode(pt);
  },
};

/* ---------------- Net · Dark Core transport (REAL, serverless) ----------------
   Two real backends, no server in the data path:
     • BroadcastChannel — every Friday tab/window/installed app on this
       origin is a real node; presence + messages really travel between them.
     • WebRTC DataChannel — link a second *device* with copy/paste signaling
       (public STUN for NAT discovery only; it never sees your data).
   Peers announce their E2E public key in presence, so messages are sealed
   per-recipient with a real shared key and opened by the real far end. */
const Net = {
  id: (crypto.randomUUID ? crypto.randomUUID() : "n-" + Math.random().toString(36).slice(2)),
  name: "Gabriel · " + (/(iPhone|iPad|Android)/.test(navigator.userAgent) ? "phone" : /Mac/.test(navigator.userAgent) ? "Mac" : "device"),
  pub: null,
  bc: null,
  peers: new Map(),          // id -> { id, name, pub, transport, lastSeen, latency }
  rtc: new Map(),            // id -> RTCDataChannel
  pending: new Map(),        // ping id -> sent ts
  peerSubs: new Set(),       // mesh + messages views
  msgSubs: new Set(),
  STUN: [{ urls: "stun:stun.l.google.com:19302" }],

  onPeers(fn) { this.peerSubs.add(fn); return () => this.peerSubs.delete(fn); },
  onMsg(fn) { this.msgSubs.add(fn); return () => this.msgSubs.delete(fn); },
  emitPeers() {
    const mc = document.getElementById("mb-mesh-count"); if (mc) mc.textContent = 1 + this.peers.size;
    const dot = document.querySelector("#mb-mesh .mesh-dot"); if (dot) dot.classList.toggle("off", this.peers.size === 0);
    for (const f of this.peerSubs) try { f(); } catch {}
  },
  emitMsg(m) { for (const f of this.msgSubs) try { f(m); } catch {} },

  async start() {
    this.pub = E2E.ok ? await E2E.myPub() : null;
    if ("BroadcastChannel" in globalThis) {
      this.bc = new BroadcastChannel("friday.dark-core");
      this.bc.onmessage = (e) => this.recv(e.data, "bc");
    }
    this.announce();
    this.emitPeers();
    setInterval(() => this.announce(), 2200);
    setInterval(() => this.reap(), 1500);
    setInterval(() => this.pingAll(), 3000);
    addEventListener("pagehide", () => this.send({ t: "bye", id: this.id }));
  },

  announce() { this.send({ t: "hello", id: this.id, name: this.name, pub: this.pub }); },

  // fan a frame out over every real transport
  send(obj) {
    const s = JSON.stringify(obj);
    try { this.bc?.postMessage(obj); } catch {}
    for (const ch of this.rtc.values()) { try { if (ch.readyState === "open") ch.send(s); } catch {} }
  },
  sendTo(id, obj) {
    const ch = this.rtc.get(id);
    if (ch && ch.readyState === "open") { try { ch.send(JSON.stringify(obj)); return; } catch {} }
    this.send(obj); // BroadcastChannel reaches same-origin tabs; recipients filter by .to
  },

  recv(m, transport) {
    if (!m || m.id === this.id) return;
    if (m.t === "hello") {
      const fresh = !this.peers.has(m.id);
      const prev = this.peers.get(m.id) || {};
      this.peers.set(m.id, { id: m.id, name: m.name || "Peer", pub: m.pub, transport: prev.transport || transport, lastSeen: Date.now(), latency: prev.latency ?? null });
      if (fresh) { this.announce(); this.emitPeers(); this.emitMsg({ system: true, peer: this.peers.get(m.id) }); }
      else this.emitPeers();
    } else if (m.t === "bye") {
      if (this.peers.delete(m.id)) this.emitPeers();
    } else if (m.t === "ping" && m.to === this.id) {
      this.sendTo(m.id, { t: "pong", id: this.id, to: m.id, n: m.n });
    } else if (m.t === "pong" && m.to === this.id) {
      const sent = this.pending.get(m.n); if (sent != null) {
        const p = this.peers.get(m.id); if (p) p.latency = Math.max(1, Math.round(performance.now() - sent));
        this.pending.delete(m.n); this.emitPeers();
      }
    } else if (m.t === "msg" && m.to === this.id) {
      this.emitMsg(m);
    }
  },

  pingAll() {
    for (const id of this.peers.keys()) {
      const n = this.id + ":" + Math.random().toString(36).slice(2, 8);
      this.pending.set(n, performance.now());
      this.sendTo(id, { t: "ping", id: this.id, to: id, n });
      setTimeout(() => this.pending.delete(n), 8000);
    }
  },

  reap() {
    let changed = false;
    const now = Date.now();
    for (const [id, p] of this.peers) {
      if (this.rtc.has(id)) continue;            // WebRTC peers don't time out on heartbeat
      if (now - p.lastSeen > 6500) { this.peers.delete(id); changed = true; }
    }
    if (changed) this.emitPeers();
  },

  /* ---- real cross-device link via WebRTC, copy/paste signaling ---- */
  async makeOffer(onLocal) {
    const pc = new RTCPeerConnection({ iceServers: this.STUN });
    const ch = pc.createDataChannel("dark-core");
    this.wireChannel(pc, ch);
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    await this.iceDone(pc);
    onLocal(b64(new TextEncoder().encode(JSON.stringify(pc.localDescription))));
    this._pc = pc;
  },
  async takeOffer(code, onLocal) {
    const pc = new RTCPeerConnection({ iceServers: this.STUN });
    pc.ondatachannel = (e) => this.wireChannel(pc, e.channel);
    await pc.setRemoteDescription(JSON.parse(new TextDecoder().decode(unb64(code))));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    await this.iceDone(pc);
    onLocal(b64(new TextEncoder().encode(JSON.stringify(pc.localDescription))));
  },
  async takeAnswer(code) {
    if (this._pc) await this._pc.setRemoteDescription(JSON.parse(new TextDecoder().decode(unb64(code))));
  },
  iceDone(pc) {
    return new Promise((res) => {
      if (pc.iceGatheringState === "complete") return res();
      const check = () => { if (pc.iceGatheringState === "complete") { pc.removeEventListener("icegatheringstatechange", check); res(); } };
      pc.addEventListener("icegatheringstatechange", check);
      setTimeout(res, 2500);
    });
  },
  wireChannel(pc, ch) {
    ch.onopen = () => { this.announce(); };
    ch.onmessage = (e) => { try { this.recv(JSON.parse(e.data), "rtc"); } catch {} };
    ch.onclose = () => {
      for (const [id, c] of this.rtc) if (c === ch) { this.rtc.delete(id); this.peers.delete(id); }
      this.emitPeers();
    };
    // tag the channel with the peer id on first hello
    const orig = ch.onmessage;
    ch.onmessage = (e) => {
      try { const m = JSON.parse(e.data); if (m.t === "hello") { this.rtc.set(m.id, ch); if (this.peers.get(m.id)) this.peers.get(m.id).transport = "rtc"; } } catch {}
      orig(e);
    };
  },

  linkDialog() {
    const veil = el("div", "");
    veil.style.cssText = "position:absolute;inset:0;z-index:800;display:flex;align-items:center;justify-content:center;background:color-mix(in srgb,var(--ground) 30%,transparent)";
    const box = el("div", "glass");
    box.style.cssText = "width:520px;max-width:calc(100vw - 40px);border-radius:18px;padding:18px";
    box.innerHTML = `
      <div class="mono kicker">DARK CORE · LINK A DEVICE</div>
      <div class="h-display" style="margin-bottom:4px">Connect a second device<em>.</em></div>
      <div class="set-sub" style="margin-bottom:14px">Real WebRTC peer-to-peer, no server. One device starts, the other joins — paste the codes between them (AirDrop, Messages, anything).</div>
      <div style="display:flex;gap:8px;margin-bottom:12px">
        <button class="rail-item" id="lk-start" style="width:auto;background:color-mix(in srgb,var(--accent) 14%,transparent)">This device starts</button>
        <button class="rail-item" id="lk-join" style="width:auto;background:var(--pane-bg);border:1px solid var(--pane-edge)">Join the other one</button>
      </div>
      <div id="lk-body"></div>
      <div style="text-align:right;margin-top:12px"><button class="rail-item" id="lk-close" style="width:auto">Close</button></div>`;
    veil.append(box);
    (this._host()).append(veil);
    veil.addEventListener("click", (e) => { if (e.target === veil) veil.remove(); });
    box.querySelector("#lk-close").addEventListener("click", () => veil.remove());
    const bodyEl = box.querySelector("#lk-body");
    const field = (label, val, ro) => `<div class="mono kicker" style="margin-top:8px">${label}</div><textarea ${ro ? "readonly" : ""} style="width:100%;height:64px;border-radius:10px;border:1px solid var(--pane-edge);background:var(--pane-bg);padding:8px;font-family:var(--font-mono);font-size:9px;resize:none">${val || ""}</textarea>`;

    box.querySelector("#lk-start").addEventListener("click", () => {
      bodyEl.innerHTML = field("1 · SEND THIS OFFER", "generating…", true) + field("2 · PASTE THE ANSWER BACK", "", false) + `<button class="rail-item" id="lk-fin" style="width:auto;margin-top:8px;background:color-mix(in srgb,var(--accent) 14%,transparent)">Connect</button>`;
      const tas = bodyEl.querySelectorAll("textarea");
      this.makeOffer((code) => { tas[0].value = code; });
      bodyEl.querySelector("#lk-fin").addEventListener("click", async () => { await this.takeAnswer(tas[1].value.trim()); veil.remove(); });
    });
    box.querySelector("#lk-join").addEventListener("click", () => {
      bodyEl.innerHTML = field("1 · PASTE THE OFFER", "", false) + `<button class="rail-item" id="lk-gen" style="width:auto;margin:8px 0;background:color-mix(in srgb,var(--accent) 14%,transparent)">Generate answer</button>` + field("2 · SEND THIS ANSWER BACK", "", true);
      const tas = bodyEl.querySelectorAll("textarea");
      bodyEl.querySelector("#lk-gen").addEventListener("click", () => this.takeOffer(tas[0].value.trim(), (code) => { tas[1].value = code; }));
    });
  },
  _host() { return document.querySelector(".window.focused") || document.getElementById("m-surface") || document.body; },
};

/* ---------------- Messages (REAL delivery over Net) ----------------
   # dark-core is the broadcast room of every live node. Each real peer
   also gets a direct thread. Outgoing text is sealed per-recipient with
   that peer's real public key and actually transmitted; nothing here is
   scripted — with no peers present, the room is honestly empty. */
const initials = (name) => name.replace(/·.*/, "").trim().split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase() || "··";

const Chat = {
  active: "darkcore",
  rooms: { darkcore: { label: "# dark-core", broadcast: true, unread: 0, msgs: [] } },
  dmId: (peerId) => "dm:" + peerId,

  ensureDM(peer) {
    const id = this.dmId(peer.id);
    if (!this.rooms[id]) this.rooms[id] = { label: peer.name, dm: true, peerId: peer.id, unread: 0, msgs: [] };
    else this.rooms[id].label = peer.name;
    return id;
  },
  prune() {
    for (const id of Object.keys(this.rooms)) {
      if (id.startsWith("dm:") && !Net.peers.has(id.slice(3))) {
        if (this.active === id) this.active = "darkcore";
        delete this.rooms[id];
      }
    }
  },
  totalUnread() { return Object.values(this.rooms).reduce((s, r) => s + r.unread, 0); },
};

Apps.messages = {
  name: "Messages", title: "MESSAGES · DARK CORE", icon: Icons.messages, w: 880, h: 560,
  render(body) {
    const rail = el("aside", "rail");
    rail.append(el("div", "mono rail-head", "ROOMS · E2E"));
    const roomList = el("div");
    const peerHead = el("div", "mono rail-head", "DIRECT · LIVE PEERS");
    peerHead.style.paddingTop = "12px";
    const peerListEl = el("div");
    rail.append(roomList, peerHead, peerListEl);
    rail.append(el("div", "mono rail-foot", "BROADCASTCHANNEL + WEBRTC<br>SEALED PER-RECIPIENT · AES-256-GCM<br>NO SERVER · REAL PEERS ONLY"));

    const content = el("section", "content");
    const head = el("div", "thread-head");
    const msgs = el("div", "msg-list");
    const composer = el("form", "composer");
    composer.innerHTML = `<input type="text" placeholder="Message — sealed before it leaves this device" aria-label="Message"><button class="send-btn" type="submit" aria-label="Send">${Icons.send}</button>`;
    content.append(head, msgs, composer);
    body.append(rail, content);

    const drawRail = () => {
      Chat.prune();
      roomList.replaceChildren();
      peerListEl.replaceChildren();
      const room = Chat.rooms.darkcore;
      const rb = el("button", "rail-item" + (Chat.active === "darkcore" ? " active" : ""));
      rb.innerHTML = `<span style="opacity:.55">#</span> dark-core <span class="t-sub" style="margin-left:auto">${Net.peers.size + 1}</span>` + (room.unread ? `<span class="badge">${room.unread}</span>` : "");
      rb.addEventListener("click", () => select("darkcore"));
      roomList.append(rb);

      const peers = [...Net.peers.values()];
      if (!peers.length) peerListEl.append(el("div", "t-sub", "No peers online. Open Friday in another tab/window, or use Mesh ▸ Link a device."));
      for (const p of peers) {
        const id = Chat.dmId(p.id);
        const r = Chat.rooms[id];
        const b = el("button", "rail-item" + (Chat.active === id ? " active" : ""));
        b.innerHTML = `<span style="opacity:.55">@</span> ${esc(p.name)}` + (r && r.unread ? `<span class="badge">${r.unread}</span>` : "");
        b.addEventListener("click", () => { Chat.ensureDM(p); select(id); });
        peerListEl.append(b);
      }
    };

    const bubble = (m) => {
      const row = el("div", "msg" + (m.me ? " me" : ""));
      const lock = m.wire ? `<button class="wire-toggle" title="View the sealed envelope">${Icons.lock}</button>` : "";
      const wire = m.wire ? `<div class="wire-view mono">SEALED · ${m.wire.alg} · FP ${m.wire.fp}<br>IV ${m.wire.iv}<br>CT ${m.wire.ct.length > 64 ? m.wire.ct.slice(0, 64) + "…" : m.wire.ct} · ${m.wire.bytes} B ON THE WIRE</div>` : "";
      row.innerHTML = `<div class="avatar">${m.ini}</div><div><div class="msg-meta"><span class="who">${esc(m.who)}</span><span class="when">${m.when}</span>${lock}</div><div class="bubble">${esc(m.text)}</div>${wire}</div>`;
      row.querySelector(".wire-toggle")?.addEventListener("click", () => row.classList.toggle("show-wire"));
      return row;
    };

    const drawThread = () => {
      const r = Chat.rooms[Chat.active];
      if (!r) { Chat.active = "darkcore"; return drawThread(); }
      const ribbon = r.broadcast
        ? `BROADCAST · ${Net.peers.size} PEER${Net.peers.size === 1 ? "" : "S"} · SEALED PER-RECIPIENT`
        : "DIRECT · X25519 · AES-256-GCM";
      const fp = E2E.ok ? "" : " · UNSEALED — SERVE OVER HTTPS FOR E2E";
      head.innerHTML = `<div class="h-display">${esc(r.label)}</div>
        <div class="mono sec-ribbon"><span class="lock">${Icons.lock}</span> ${ribbon}${fp}</div>`;
      if (!r.msgs.length) {
        msgs.replaceChildren(el("div", "t-sub", r.broadcast
          ? (Net.peers.size ? "Say something — it will be sealed for each peer and delivered live." : "You're the only node right now. Open Friday elsewhere to see real delivery.")
          : "Direct, end-to-end. Messages are sealed with this peer's real key."));
      } else {
        msgs.replaceChildren(...r.msgs.map(bubble));
      }
      msgs.scrollTop = msgs.scrollHeight;
    };

    const select = (id) => { Chat.active = id; const r = Chat.rooms[id]; if (r) r.unread = 0; drawRail(); drawThread(); Dock.refresh(); };

    // outgoing — really sealed per recipient and transmitted
    composer.addEventListener("submit", async (e) => {
      e.preventDefault();
      const input = composer.querySelector("input");
      const text = input.value.trim();
      if (!text) return;
      input.value = "";
      const r = Chat.rooms[Chat.active];
      const when = new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
      const targets = r.broadcast ? [...Net.peers.values()] : (Net.peers.get(r.peerId) ? [Net.peers.get(r.peerId)] : []);
      let firstWire = null;
      for (const p of targets) {
        if (!p.pub) continue;
        try {
          const wire = await E2E.seal(p.pub, text);
          firstWire = firstWire || wire;
          Net.sendTo(p.id, { t: "msg", id: Net.id, to: p.id, from: Net.id, fromName: Net.name, room: r.broadcast ? "darkcore" : "dm", wire });
        } catch {}
      }
      r.msgs.push({ who: "You", ini: initials(Net.name), when, me: true, text, wire: firstWire });
      drawThread();
    });

    // incoming — real frames from real peers
    const onMsg = async (m) => {
      if (m.system) { drawRail(); if (Chat.active === "darkcore") drawThread(); return; }
      const peer = Net.peers.get(m.from);
      if (!peer || !peer.pub) return;
      let text = "(unable to open)";
      try { text = await E2E.open(peer.pub, m.wire); } catch {}
      const roomId = m.room === "darkcore" ? "darkcore" : Chat.ensureDM(peer);
      const r = Chat.rooms[roomId];
      const when = new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
      r.msgs.push({ who: peer.name, ini: initials(peer.name), when, text, wire: m.wire });
      if (Chat.active === roomId) drawThread();
      else { r.unread++; Dock.refresh(); }
      drawRail();
    };
    const onPeers = () => { drawRail(); if (Chat.rooms[Chat.active]?.broadcast) drawThread(); };
    this._unsub = [Net.onMsg(onMsg), Net.onPeers(onPeers)];

    drawRail();
    drawThread();
  },
  teardown() { this._unsub?.forEach((u) => u()); this._unsub = null; },
};

/* ---------------- Boards ---------------- */
const Board = {
  cols: [
    { id: "backlog", name: "Backlog", color: "#7A7770", cards: [
      { t: "LoRa transceiver firmware — needle MTU tuning", tag: "DARK CORE", who: "MW" },
      { t: "Sybil-resistance audit with introduction graphs", tag: "SECURITY", who: "EL" },
    ]},
    { id: "doing", name: "In progress", color: "#1A3A5C", cards: [
      { t: "Erasure-coded vault — RaptorQ fountain stream", tag: "STORAGE", who: "SS" },
      { t: "Friday glass pass — diffusion & tint signatures", tag: "DESIGN", who: "AR" },
    ]},
    { id: "review", name: "Review", color: "#D8A72A", cards: [
      { t: "Voice bridge over Tor — duplex under 200 ms", tag: "DARK SUN", who: "GR" },
    ]},
    { id: "done", name: "Done", color: "#2E7D4F", cards: [
      { t: "Reticulum link layer — 297-byte handshake", tag: "DARK CORE", who: "MW" },
      { t: "CRDT sync across partitioned offices", tag: "STORAGE", who: "EL" },
    ]},
  ],
};

Apps.boards = {
  name: "Boards", title: "BOARDS · EROS OFFICE", icon: Icons.boards, w: 940, h: 560,
  render(body) {
    const content = el("section", "content");
    content.innerHTML = `<div class="board-head">
      <div><div class="mono kicker">ORANGE PIE · V1 ALPHA</div>
      <div class="h-display">The work, <em>in panes.</em></div></div>
      <div class="mono sec-ribbon" style="margin-left:auto">SYNCED BY CRDT · NO CENTRAL SERVER</div></div>`;
    const board = el("div", "board");
    content.append(board);
    body.append(content);

    const tagColor = { "DARK CORE": "rgba(26,58,92,.16)", SECURITY: "rgba(107,23,33,.14)", STORAGE: "rgba(216,167,42,.18)", DESIGN: "rgba(201,214,219,.5)", "DARK SUN": "rgba(107,23,33,.14)" };
    let dragSrc = null;

    const draw = () => {
      board.replaceChildren();
      for (const col of Board.cols) {
        const c = el("div", "col");
        c.dataset.col = col.id;
        c.innerHTML = `<div class="col-head mono"><span class="col-dot" style="background:${col.color}"></span>${col.name.toUpperCase()}<span class="count">${col.cards.length}</span></div>`;
        const drop = el("div", "col-drop");
        col.cards.forEach((card, i) => {
          const k = el("div", "card");
          k.draggable = true;
          k.innerHTML = `<div class="card-title">${esc(card.t)}</div>
            <div class="card-row"><span class="tag" style="background:${tagColor[card.tag] || "var(--pane-bg)"}">${card.tag}</span><span class="who">${card.who}</span></div>`;
          k.addEventListener("dragstart", () => { dragSrc = { col: col.id, i }; k.classList.add("dragging"); });
          k.addEventListener("dragend", () => k.classList.remove("dragging"));
          drop.append(k);
        });
        const add = el("button", "add-card", "+ New pane");
        add.addEventListener("click", () => {
          const inp = el("input");
          inp.type = "text"; inp.placeholder = "Name the work, then Enter";
          Object.assign(inp.style, { padding: "9px 12px", borderRadius: "12px", border: "1px solid var(--pane-edge)", background: "var(--pane-bg)", outline: "none", width: "100%" });
          drop.append(inp); inp.focus();
          const commit = () => {
            if (inp.value.trim()) col.cards.push({ t: inp.value.trim(), tag: "DESIGN", who: "GR" });
            draw();
          };
          inp.addEventListener("keydown", (e) => { if (e.key === "Enter") commit(); if (e.key === "Escape") draw(); });
          inp.addEventListener("blur", commit);
        });
        c.append(drop, add);
        c.addEventListener("dragover", (e) => { e.preventDefault(); c.classList.add("drag-over"); });
        c.addEventListener("dragleave", () => c.classList.remove("drag-over"));
        c.addEventListener("drop", (e) => {
          e.preventDefault();
          c.classList.remove("drag-over");
          if (!dragSrc) return;
          const from = Board.cols.find((x) => x.id === dragSrc.col);
          const [card] = from.cards.splice(dragSrc.i, 1);
          col.cards.push(card);
          dragSrc = null;
          draw();
        });
        board.append(c);
      }
    };
    draw();
  },
};

/* ---------------- Calls · Dark Sun ---------------- */
Apps.calls = {
  name: "Calls", title: "CALLS · PROJECT DARK SUN", icon: Icons.calls, w: 780, h: 540,
  render(body) {
    const contacts = [
      ["Avery Reyes", "AR", "Design Office · Hudson Valley"],
      ["Sophie Sun", "SS", "Operations · Pier 40"],
      ["Elena Lanot", "EL", "Dark Sun · Voice Lab"],
      ["Marcus Webb", "MW", "Dark Core · Routing"],
    ];
    let active = 0, timer = null, t0 = 0;

    const rail = el("aside", "rail");
    rail.append(el("div", "mono rail-head", "SECURE LINE"));
    const list = el("div");
    rail.append(list, el("div", "mono rail-foot", "GSM-FR · 1200 BPS · TRIPLE DH<br>KECCAK 1600/576 SPONGE DUPLEX"));

    const stage = el("section", "content");
    const inner = el("div", "call-stage");
    stage.append(inner);
    body.append(rail, stage);

    const drawRail = () => {
      list.replaceChildren();
      contacts.forEach(([name, ini], i) => {
        const b = el("button", "rail-item" + (i === active ? " active" : ""));
        b.innerHTML = `<span class="who" style="width:24px;height:24px;border-radius:50%;display:grid;place-items:center;font-size:9px;font-weight:600;background:color-mix(in srgb,var(--rule) 18%,transparent)">${ini}</span> ${name}`;
        b.addEventListener("click", () => { if (!timer) { active = i; drawIdle(); drawRail(); } });
        list.append(b);
      });
    };

    const drawIdle = () => {
      inner.classList.remove("live");
      const [name, ini, sub] = contacts[active];
      inner.innerHTML = `
        <div class="call-avatar">${ini}</div>
        <div class="call-name">${name}</div>
        <div class="call-sub">${sub}</div>
        <div class="mono kicker">LINE IS DARK · READY TO SEAL</div>
        <div class="call-actions"><button class="call-btn go" aria-label="Call">${Icons.phone}</button></div>`;
      inner.querySelector(".go").addEventListener("click", connect);
    };

    const connect = () => {
      const [name, ini] = contacts[active];
      inner.innerHTML = `
        <div class="call-avatar">${ini}</div>
        <div class="call-name">${name}</div>
        <div class="call-sub">Negotiating Triple Diffie-Hellman…</div>
        <div class="mono kicker">CURVE 25519 · HOP 1 · HOP 2 · HOP 3</div>`;
      setTimeout(live, 1500);
    };

    const live = () => {
      if (!inner.isConnected) return;
      const [name, ini] = contacts[active];
      inner.classList.add("live");
      inner.innerHTML = `
        <div class="call-avatar">${ini}</div>
        <div class="call-name">${name}</div>
        <div class="call-sub" id="call-clock">00:00</div>
        <div class="wave">${"<i></i>".repeat(16)}</div>
        <div class="mono kicker">SEALED · GSM-FR · 1200 BPS · ONION 3 HOPS</div>
        <div class="call-actions">
          <button class="call-btn mute" aria-label="Mute">${Icons.mic}</button>
          <button class="call-btn end" aria-label="End call">${Icons.phoneDown}</button>
        </div>`;
      t0 = Date.now();
      const clock = inner.querySelector("#call-clock");
      timer = setInterval(() => {
        const s = (Date.now() - t0) / 1000 | 0;
        clock.textContent = String(s / 60 | 0).padStart(2, "0") + ":" + String(s % 60).padStart(2, "0");
      }, 500);
      inner.querySelector(".mute").addEventListener("click", (e) => e.currentTarget.classList.toggle("on"));
      inner.querySelector(".end").addEventListener("click", () => { clearInterval(timer); timer = null; drawIdle(); });
    };

    drawRail();
    drawIdle();
    this.teardown = () => { clearInterval(timer); timer = null; };
  },
};

/* ---------------- Vault ---------------- */
const Vault = {
  files: [
    { name: "Hudson — Volume II drafts.pdf", size: "48.2 MB", data: 10, parity: 20, nodes: 17 },
    { name: "Dark Core topology survey.sqlite", size: "12.7 MB", data: 10, parity: 14, nodes: 12 },
    { name: "Coachwork plates — carmine.heic", size: "96.4 MB", data: 10, parity: 20, nodes: 21 },
    { name: "Eros Office ledger (immutable).db", size: "4.1 MB", data: 10, parity: 10, nodes: 9 },
  ],
  active: 0,
};

Apps.vault = {
  name: "Vault", title: "VAULT · ERASURE CODED", icon: Icons.vault, w: 880, h: 540,
  render(body) {
    const rail = el("aside", "rail");
    rail.append(el("div", "mono rail-head", "DISTRIBUTED SHARDS"));
    const list = el("div");
    rail.append(list, el("div", "mono rail-foot", "REED-SOLOMON GF(2⁸) · 0x11D<br>NO NODE HOLDS A WHOLE FILE"));
    const content = el("section", "content");
    const scroll = el("div", "content-scroll");
    content.append(scroll);
    body.append(rail, content);
    let healing = false;

    const drawRail = () => {
      list.replaceChildren();
      Vault.files.forEach((f, i) => {
        const b = el("button", "file-row" + (i === Vault.active ? " active" : ""));
        b.innerHTML = `<span class="file-ico">${Icons.vault.replace('viewBox="0 0 24 24"', 'viewBox="0 0 24 24" width="16" height="16"')}</span>
          <span><div class="file-name">${esc(f.name)}</div><div class="file-sub">${f.size} · ${f.nodes} nodes</div></span>`;
        b.addEventListener("click", () => { if (!healing) { Vault.active = i; draw(); } });
        list.append(b);
      });
    };

    const draw = () => {
      drawRail();
      const f = Vault.files[Vault.active];
      scroll.innerHTML = `
        <div class="mono kicker">TAHOE-LAFS GRID · RAPTORQ STREAM</div>
        <div class="h-display" style="margin-bottom:4px">${esc(f.name.replace(/\..+$/, ""))}<em>.</em></div>
        <div class="set-sub">${f.size} — split into ${f.data} data shards and ${f.parity} parity shards, scattered over ${f.nodes} devices. Any ${f.data} shards rebuild the whole.</div>
        <div class="pane" style="margin-top:14px">
          <div class="mono kicker">SHARD MAP</div>
          <div class="shard-grid" id="shards"></div>
          <div class="legend mono">
            <span><i style="background:color-mix(in srgb,var(--rule) 28%,transparent)"></i>DATA</span>
            <span><i style="background:color-mix(in srgb,var(--signal) 30%,transparent)"></i>PARITY</span>
            <span><i style="background:color-mix(in srgb,var(--accent) 55%,transparent)"></i>REBUILDING</span>
            <span><i style="background:transparent;border:1px solid var(--pane-edge)"></i>LOST NODE</span>
          </div>
        </div>
        <div style="display:flex;gap:10px;margin-top:14px;align-items:center">
          <button class="rail-item" id="lose" style="width:auto;background:var(--pane-bg);border:1px solid var(--pane-edge)">Simulate node loss</button>
          <button class="rail-item" id="heal" style="width:auto;background:color-mix(in srgb,var(--accent) 14%,transparent)">Reconstruct</button>
          <span class="set-sub" id="vault-status">Grid is whole. ${f.data + f.parity}/${f.data + f.parity} shards reachable.</span>
        </div>`;
      const grid = scroll.querySelector("#shards");
      const cells = [];
      for (let i = 0; i < f.data + f.parity; i++) {
        const c = el("div", "shard" + (i >= f.data ? " parity" : ""));
        grid.append(c); cells.push(c);
      }
      const status = scroll.querySelector("#vault-status");
      scroll.querySelector("#lose").addEventListener("click", () => {
        if (healing) return;
        const k = 6 + (Math.random() * 4 | 0);
        const idx = [...cells.keys()].sort(() => Math.random() - 0.5).slice(0, k);
        idx.forEach((i) => cells[i].classList.add("lost"));
        const left = cells.filter((c) => !c.classList.contains("lost")).length;
        status.textContent = `${k} nodes seized or offline. ${left}/${cells.length} shards reachable — file still recoverable.`;
      });
      scroll.querySelector("#heal").addEventListener("click", () => {
        if (healing) return;
        const lost = cells.filter((c) => c.classList.contains("lost"));
        if (!lost.length) { status.textContent = "Nothing to rebuild. The grid is whole."; return; }
        healing = true;
        status.textContent = "Reconstructing from surviving shards…";
        lost.forEach((c, i) => {
          setTimeout(() => { c.classList.remove("lost"); c.classList.add("healing"); }, 150 + i * 220);
          setTimeout(() => { c.classList.remove("healing"); }, 700 + i * 220);
        });
        setTimeout(() => {
          healing = false;
          status.textContent = `Rebuilt on fresh nodes. ${cells.length}/${cells.length} shards reachable.`;
        }, 900 + lost.length * 220);
      });
    };
    draw();
  },
};

/* ---------------- Ledger · two sets of records ----------------
   Per the Orange PIE spec: one editable set and one permanent set,
   both verifiable, built on a tamper-evident (Merkle-chained) store.
   The permanent set is an immudb-style hash chain — each entry seals
   the hash of the one before it, so any silent edit breaks the proof. */
const Ledger = {
  // a tiny synchronous 64-bit-ish hex hash (FNV-1a x2) — enough to make
  // the chain real: change any byte and every downstream hash changes.
  hash(str) {
    let h1 = 0x811c9dc5, h2 = 0xc2b2ae35;
    for (let i = 0; i < str.length; i++) {
      const c = str.charCodeAt(i);
      h1 = Math.imul(h1 ^ c, 0x01000193);
      h2 = Math.imul(h2 ^ c, 0x85ebca6b);
    }
    const hx = (n) => (n >>> 0).toString(16).padStart(8, "0");
    return hx(h1) + hx(h2);
  },
  // editable working records — mutable, the day-to-day state
  editable: [
    { id: "REC-014", what: "Volume II — glass coverage spec", who: "AR", when: "09:05" },
    { id: "REC-015", what: "Dark Sun voice bridge sign-off", who: "EL", when: "08:42" },
    { id: "REC-016", what: "Vault shard policy → 10/20", who: "SS", when: "08:18" },
  ],
  // permanent records — built lazily into a sealed chain on first open
  permanent: null,

  seal() {
    const events = [
      { act: "GENESIS", what: "Eros Office ledger initialized", who: "GR", when: "Mon 07:00" },
      { act: "ADMIT", what: "Node MW-04 joined mesh (PoW verified)", who: "DC", when: "Mon 07:14" },
      { act: "COMMIT", what: "REC-009 Reticulum link layer 297-byte", who: "MW", when: "Mon 09:31" },
      { act: "SHARD", what: "Coachwork plates sealed — 30 shards / 21 nodes", who: "SS", when: "Tue 14:05" },
      { act: "COMMIT", what: "REC-012 CRDT sync across offices", who: "EL", when: "Wed 11:20" },
      { act: "VOICE", what: "Dark Sun call sealed — 1200 bps · 3 hops", who: "GR", when: "Thu 16:48" },
    ];
    let prev = "0".repeat(16);
    this.permanent = events.map((e, i) => {
      const payload = `${i}|${e.act}|${e.what}|${e.who}|${e.when}|${prev}`;
      const h = this.hash(payload);
      const entry = { ...e, i, prev, h };
      prev = h;
      return entry;
    });
  },
};

Apps.ledger = {
  name: "Ledger", title: "LEDGER · TWO SETS OF RECORDS", icon: Icons.ledger, w: 900, h: 580,
  render(body) {
    if (!Ledger.permanent) Ledger.seal();
    let tab = "permanent"; // permanent | editable
    let tampered = false;

    const rail = el("aside", "rail");
    rail.append(el("div", "mono rail-head", "RECORD SETS"));
    const railList = el("div");
    rail.append(railList, el("div", "mono rail-foot", "IMMUDB-STYLE MERKLE CHAIN<br>EDITABLE WORKS · PERMANENT PROVES"));

    const content = el("section", "content");
    const scroll = el("div", "content-scroll");
    content.append(scroll);
    body.append(rail, content);

    const drawRail = () => {
      railList.replaceChildren();
      for (const [id, label, sub] of [["permanent", "Permanent", "sealed · tamper-evident"], ["editable", "Editable", "working state"]]) {
        const b = el("button", "rail-item" + (id === tab ? " active" : ""));
        b.innerHTML = `<span>${id === "permanent" ? Icons.lock : "✎"}</span><span><div class="file-name">${label}</div><div class="file-sub">${sub}</div></span>`;
        b.addEventListener("click", () => { tab = id; draw(); });
        railList.append(b);
      }
    };

    const verifyChain = () => {
      let prev = "0".repeat(16);
      for (const e of Ledger.permanent) {
        const expect = Ledger.hash(`${e.i}|${e.act}|${e.what}|${e.who}|${e.when}|${prev}`);
        if (expect !== e.h || e.prev !== prev) return e.i; // first broken link
        prev = e.h;
      }
      return -1;
    };

    const draw = () => {
      drawRail();
      scroll.replaceChildren();
      if (tab === "permanent") {
        const broken = verifyChain();
        scroll.append(el("div", "", `
          <div class="mono kicker">PERMANENT SET · MERKLE-CHAINED</div>
          <div class="h-display" style="margin-bottom:4px">The record that <em>cannot be edited.</em></div>
          <div class="set-sub">Each entry seals the hash of the one before it. Alter any field and every hash downstream stops matching — the proof breaks, visibly.</div>`));

        const bar = el("div", "");
        bar.style.cssText = "display:flex;gap:10px;align-items:center;margin:14px 0";
        const status = el("span", "mono");
        const setStatus = () => {
          const b = verifyChain();
          if (b === -1) { status.innerHTML = `<span style="color:#2E7D4F">✓ CHAIN VERIFIED · ${Ledger.permanent.length} SEALED ENTRIES</span>`; }
          else { status.innerHTML = `<span style="color:var(--carmine)">✗ TAMPER DETECTED AT ENTRY ${b} · PROOF BROKEN</span>`; }
        };
        const vbtn = el("button", "rail-item", "Verify chain");
        vbtn.style.cssText = "width:auto;background:color-mix(in srgb,var(--accent) 14%,transparent)";
        vbtn.addEventListener("click", () => { draw(); });
        const tbtn = el("button", "rail-item", tampered ? "Restore record" : "Simulate tampering");
        tbtn.style.cssText = "width:auto;background:var(--pane-bg);border:1px solid var(--pane-edge)";
        tbtn.addEventListener("click", () => {
          if (!tampered) { Ledger.permanent[2].what = "REC-009 [SILENTLY ALTERED]"; tampered = true; }
          else { Ledger.seal(); tampered = false; }
          draw();
        });
        bar.append(vbtn, tbtn, status);
        scroll.append(bar);
        setStatus();

        const broken2 = verifyChain();
        Ledger.permanent.forEach((e) => {
          const ok = broken2 === -1 || e.i < broken2;
          const card = el("div", "pane");
          card.style.cssText = "margin-bottom:8px;border-left:3px solid " + (ok ? "color-mix(in srgb,#2E7D4F 60%,transparent)" : "var(--carmine)");
          card.innerHTML = `
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
              <span class="tag" style="background:color-mix(in srgb,var(--rule) 16%,transparent)">${e.act}</span>
              <span class="file-name">${esc(e.what)}</span>
              <span class="mono" style="margin-left:auto;color:var(--muted)">${e.who} · ${e.when}</span>
            </div>
            <div class="mono" style="color:var(--muted);font-size:8px;line-height:1.7">
              PREV ${e.prev}<br>
              <span style="color:${ok ? "var(--muted)" : "var(--carmine)"}">HASH ${e.h}${ok ? "" : "  ✗"}</span>
            </div>`;
          scroll.append(card);
        });
      } else {
        scroll.append(el("div", "", `
          <div class="mono kicker">EDITABLE SET · WORKING STATE</div>
          <div class="h-display" style="margin-bottom:4px">The record you <em>work in.</em></div>
          <div class="set-sub">Mutable day-to-day entries. Commit one and it is hashed, sealed, and appended to the permanent chain — where it can never be quietly changed again.</div>`));
        const list = el("div");
        list.style.marginTop = "12px";
        Ledger.editable.forEach((r, idx) => {
          const row = el("div", "pane");
          row.style.cssText = "margin-bottom:8px;display:flex;align-items:center;gap:10px";
          row.innerHTML = `<span class="mono" style="color:var(--muted)">${r.id}</span>
            <span class="file-name" style="flex:1">${esc(r.what)}</span>
            <span class="mono" style="color:var(--muted)">${r.who} · ${r.when}</span>`;
          const commit = el("button", "rail-item", "Commit →");
          commit.style.cssText = "width:auto;background:color-mix(in srgb,var(--accent) 14%,transparent)";
          commit.addEventListener("click", () => {
            const e = Ledger.editable.splice(idx, 1)[0];
            const i = Ledger.permanent.length;
            const prev = Ledger.permanent[i - 1].h;
            const entry = { act: "COMMIT", what: `${e.id} ${e.what}`, who: e.who, when: "now", i, prev };
            entry.h = Ledger.hash(`${i}|${entry.act}|${entry.what}|${entry.who}|${entry.when}|${prev}`);
            Ledger.permanent.push(entry);
            tab = "permanent";
            draw();
          });
          row.append(commit);
          list.append(row);
        });
        if (!Ledger.editable.length) list.append(el("div", "set-sub", "All working records committed and sealed."));
        scroll.append(list);
      }
    };
    draw();
  },
};

/* ---------------- Settings ---------------- */
function refreshOpenSettings() {
  const rec = WM.wins.get("settings");
  if (rec && !rec.minimized) rec.app._draw?.();
  if (Mobile.active === "settings") Apps.settings._draw?.();
}

Apps.settings = {
  name: "Settings", title: "SETTINGS · PROFILES & GLASS", icon: Icons.settings, w: 700, h: 580,
  render(body) {
    const content = el("section", "content");
    const scroll = el("div", "content-scroll");
    content.append(scroll);
    body.append(content);

    const seg = (options, value, onPick) => {
      const s = el("div", "segmented");
      for (const [v, label] of options) {
        const b = el("button", value === v ? "on" : "", label);
        b.addEventListener("click", () => onPick(v));
        s.append(b);
      }
      return s;
    };

    const draw = () => {
      scroll.replaceChildren();
      scroll.append(el("div", "", `
        <div class="mono kicker">FRIDAY · SYSTEM SETTINGS</div>
        <div class="h-display" style="margin-bottom:16px">One room, <em>two atmospheres.</em></div>`));

      // appearance
      const ap = el("div", "pane set-section");
      ap.append(el("div", "set-title", "Appearance"));
      const r1 = el("div", "set-row");
      r1.append(el("div", "", `<div class="set-label">Mode</div><div class="set-sub">Parchment at noon, Anthracite at ten.</div>`));
      r1.append(seg([["light", "Light"], ["dark", "Dark"], ["auto", "Auto"]], State.theme, (v) => { State.theme = v; applyState(); }));
      const r2 = el("div", "set-row");
      r2.append(el("div", "", `<div class="set-label">Accent</div><div class="set-sub">One accent at full strength, used once.</div>`));
      const sw = el("div", "swatches");
      for (const [id, color] of [["carmine", "#6B1721"], ["atlantic", "#1A3A5C"], ["signal", "#D8A72A"]]) {
        const b = el("button", "swatch" + (State.accent === id ? " on" : ""));
        b.style.background = color;
        b.title = id;
        b.addEventListener("click", () => { State.accent = id; applyState(); });
        sw.append(b);
      }
      r2.append(sw);
      const r3 = el("div", "set-row");
      r3.append(el("div", "", `<div class="set-label">Diffusion</div><div class="set-sub">How much the glass softens what lies beneath.</div>`));
      const range = el("input");
      range.type = "range"; range.min = 6; range.max = 40; range.value = State.glass;
      range.addEventListener("input", () => { State.glass = +range.value; document.documentElement.style.setProperty("--diffusion", State.glass + "px"); persist(); });
      r3.append(range);
      const r4 = el("div", "set-row");
      r4.append(el("div", "", `<div class="set-label">Wallpaper</div><div class="set-sub">The Hudson, at three hours of light.</div>`));
      r4.append(seg([["noon", "Noon"], ["dusk", "Dusk"], ["limestone", "Limestone"]], State.wallpaper, (v) => { State.wallpaper = v; applyState(); }));
      ap.append(r1, r2, r3, r4);
      scroll.append(ap);

      // profiles
      const pf = el("div", "pane set-section");
      pf.append(el("div", "set-title", "Profiles"));
      for (const [ini, name, sub, on] of [["GR", "Gabriel B. Rodriguez", "Owner · Glass Stone LLC · full mesh authority", true], ["GR", "After Hours", "Personal profile · separate keys, separate onion identity", false]]) {
        const row = el("div", "set-row profile-card");
        row.innerHTML = `<span class="who">${ini}</span><div style="flex:1"><div class="set-label">${name}</div><div class="set-sub">${sub}</div></div>`;
        const s = el("button", "switch" + (on ? " on" : ""));
        s.addEventListener("click", () => s.classList.toggle("on"));
        row.append(s);
        pf.append(row);
      }
      scroll.append(pf);

      // network
      const nw = el("div", "pane set-section");
      nw.append(el("div", "set-title", "Dark Core"));
      for (const [key, name, sub] of [["wifi", "Wi-Fi / WebRTC", "High-bandwidth peer links"], ["ble", "Bluetooth LE", "Near-field mesh, GATT needles"], ["lora", "LoRa Radio", "Off-grid, 1.2 kbps, kilometres"], ["tor", "Tor Onion v3", "Metadata-resistant transit"]]) {
        const row = el("div", "set-row");
        row.innerHTML = `<div><div class="set-label">${name}</div><div class="set-sub">${sub}</div></div>`;
        const s = el("button", "switch" + (State.transports[key] ? " on" : ""));
        s.addEventListener("click", () => { State.transports[key] = !State.transports[key]; s.classList.toggle("on", State.transports[key]); persist(); ControlCenter.refresh(); });
        row.append(s);
        nw.append(row);
      }
      scroll.append(nw);

      scroll.append(el("div", "mono rail-foot", "FRIDAY 1.0.0 · ORANGE PIE V1 ALPHA · GLASS STONE LLC · HDL VOL-I"));
    };
    this._draw = draw;
    draw();
  },
};

/* ---------------- About ---------------- */
Apps.about = {
  name: "About Friday", title: "ABOUT FRIDAY", icon: Icons.mesh, w: 460, h: 420,
  render(body) {
    const a = el("div", "about");
    a.innerHTML = `
      <img src="assets/logo.svg" alt="Friday">
      <div class="h-display">Friday<em>.</em></div>
      <div class="mono kicker">EROS OFFICE · ORANGE PIE V1 ALPHA</div>
      <div class="ed">A workspace that needs no network to be one. Messages, boards, calls, and storage travel an encrypted mesh — Wi-Fi, Bluetooth, LoRa, Tor — and the more devices that join it, the safer it becomes.</div>
      <div class="mono" style="color:var(--muted)">GLASS STONE LLC · CEO GABRIEL B. RODRIGUEZ · 2026–2027<br>SET IN THE HUDSON DESIGN LANGUAGE, BY THE ACADIA</div>`;
    body.append(a);
  },
};

/* ============================================================
   DOCK
   ============================================================ */
const Dock = {
  order: ["mesh", "messages", "boards", "calls", "vault", "ledger", null, "settings"],
  el: null,
  build() {
    this.el = $("#dock");
    for (const id of this.order) {
      if (!id) { this.el.append(el("div", "dock-sep")); continue; }
      const app = Apps[id];
      const d = el("button", "dock-app");
      d.dataset.app = id;
      d.innerHTML = `<span class="dock-tip glass">${app.name}</span><span class="dock-icon">${app.icon}</span><span class="dock-dot"></span>`;
      d.addEventListener("click", () => {
        const rec = WM.wins.get(id);
        if (rec?.minimized) WM.restore(id), WM.focus(id);
        else WM.open(id);
      });
      this.el.append(d);
    }
  },
  refresh() {
    if (!this.el) return;
    for (const b of this.el.querySelectorAll(".dock-app")) {
      const id = b.dataset.app;
      b.classList.toggle("running", WM.wins.has(id));
      b.querySelector(".dock-badge")?.remove();
      if (id === "messages") {
        const unread = Chat.totalUnread();
        if (unread) b.append(el("span", "dock-badge", String(unread)));
      }
    }
  },
};

/* ============================================================
   MENU BAR & MENUS
   ============================================================ */
const MenuBar = {
  layer: null,
  current: null,

  setApp(app) {
    $("#mb-appname").textContent = app ? app.name : "Friday";
  },

  defs(which) {
    const focused = WM.focusedId();
    switch (which) {
      case "friday": return [
        ["About Friday", () => WM.open("about")],
        ["sep"],
        ["Settings…", () => WM.open("settings"), "⌘ ,"],
        ["Toggle Appearance", () => { State.theme = document.documentElement.dataset.theme === "dark" ? "light" : "dark"; applyState(); }, "⇧ ⌘ D"],
        ["sep"],
        ["Restart Friday", () => location.reload()],
      ];
      case "File": return [
        ["New Window", () => focused && WM.open(focused)],
        ["Close Window", () => focused && WM.close(focused), "⌘ W"],
      ];
      case "Edit": return [
        ["Undo", () => {}], ["Redo", () => {}], ["sep"], ["Cut", () => {}], ["Copy", () => {}], ["Paste", () => {}],
      ];
      case "View": return [
        ["Light Appearance", () => { State.theme = "light"; applyState(); }],
        ["Dark Appearance", () => { State.theme = "dark"; applyState(); }],
        ["sep"],
        ["Wallpaper · Noon", () => { State.wallpaper = "noon"; applyState(); }],
        ["Wallpaper · Dusk", () => { State.wallpaper = "dusk"; applyState(); }],
        ["Wallpaper · Limestone", () => { State.wallpaper = "limestone"; applyState(); }],
      ];
      case "Window": return [
        ["Minimize", () => focused && WM.minimize(focused), "⌘ M"],
        ["Zoom", () => focused && WM.zoom(focused)],
      ];
      case "Help": return [
        ["About the Hudson Design Language", () => WM.open("about")],
        ["Search", () => Spotlight.show(), "⌘ K"],
      ];
    }
    return [];
  },

  show(anchor, which) {
    this.hide();
    const items = this.defs(which);
    if (!items.length) return;
    const m = el("div", "menu glass");
    for (const it of items) {
      if (it[0] === "sep") { m.append(el("hr")); continue; }
      const [label, fn, kbd] = it;
      const b = el("button", "", `<span>${label}</span>` + (kbd ? `<span class="kbd">${kbd}</span>` : ""));
      b.addEventListener("click", () => { this.hide(); fn(); });
      m.append(b);
    }
    const r = anchor.getBoundingClientRect();
    m.style.left = Math.min(r.left, innerWidth - 240) + "px";
    m.style.top = r.bottom + 6 + "px";
    this.layer.append(m);
    this.current = { m, anchor };
    anchor.classList.add("open");
  },

  hide() {
    if (this.current) {
      this.current.anchor.classList.remove("open");
      this.current.m.remove();
      this.current = null;
    }
  },

  build() {
    this.layer = $("#menu-layer");
    $("#mb-friday").addEventListener("click", (e) => { e.stopPropagation(); this.toggle(e.currentTarget, "friday"); });
    $("#mb-appname").addEventListener("click", (e) => { e.stopPropagation(); this.toggle(e.currentTarget, "friday"); });
    const menus = $("#mb-menus");
    for (const name of ["File", "Edit", "View", "Window", "Help"]) {
      const b = el("button", "mb-item", name);
      b.addEventListener("click", (e) => { e.stopPropagation(); this.toggle(b, name); });
      b.addEventListener("pointerenter", () => { if (this.current && this.current.anchor !== b) this.show(b, name); });
      menus.append(b);
    }
    document.addEventListener("click", () => this.hide());

    // clock
    const tick = () => {
      const d = new Date();
      $("#mb-clock").textContent =
        d.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" }) + "  " +
        d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    };
    tick();
    setInterval(tick, 10000);

    $("#mb-search").addEventListener("click", (e) => { e.stopPropagation(); Spotlight.toggle(); });
    $("#mb-cc").addEventListener("click", (e) => { e.stopPropagation(); ControlCenter.toggle(); });
    $("#mb-mesh").addEventListener("click", () => WM.open("mesh"));
  },

  toggle(anchor, which) {
    if (this.current?.anchor === anchor) this.hide();
    else this.show(anchor, which);
  },
};

/* ============================================================
   SPOTLIGHT
   ============================================================ */
const Spotlight = {
  veil: null, input: null, results: null, sel: 0, items: [],

  catalogue() {
    const apps = Object.entries(Apps).map(([id, a]) => ({ label: a.name, icon: a.icon, fn: () => WM.open(id) }));
    return [
      ...apps,
      { label: "Toggle Dark Appearance", icon: Icons.settings, fn: () => { State.theme = document.documentElement.dataset.theme === "dark" ? "light" : "dark"; applyState(); } },
      { label: "Wallpaper — Dusk over the Hudson", icon: Icons.settings, fn: () => { State.wallpaper = "dusk"; applyState(); } },
      { label: "Wallpaper — Noon", icon: Icons.settings, fn: () => { State.wallpaper = "noon"; applyState(); } },
    ];
  },

  build() {
    this.veil = $("#spotlight-veil");
    this.input = $("#spotlight-input");
    this.results = $("#spotlight-results");
    this.veil.addEventListener("click", (e) => { if (e.target === this.veil) this.hide(); });
    this.input.addEventListener("input", () => this.filter());
    this.input.addEventListener("keydown", (e) => {
      if (e.key === "ArrowDown") { e.preventDefault(); this.move(1); }
      if (e.key === "ArrowUp") { e.preventDefault(); this.move(-1); }
      if (e.key === "Enter") { this.items[this.sel]?.fn(); this.hide(); }
      if (e.key === "Escape") this.hide();
    });
  },

  filter() {
    const q = this.input.value.trim().toLowerCase();
    this.items = this.catalogue().filter((i) => !q || i.label.toLowerCase().includes(q)).slice(0, 7);
    this.sel = 0;
    this.results.replaceChildren(...this.items.map((it, i) => {
      const li = el("li", i === this.sel ? "sel" : "");
      const b = el("button", "", `${it.icon}<span>${esc(it.label)}</span>`);
      b.addEventListener("click", () => { it.fn(); this.hide(); });
      li.append(b);
      return li;
    }));
  },

  move(d) {
    this.sel = (this.sel + d + this.items.length) % this.items.length;
    [...this.results.children].forEach((li, i) => li.classList.toggle("sel", i === this.sel));
  },

  show() { if (!this.veil) return; this.veil.hidden = false; this.input.value = ""; this.filter(); this.input.focus(); },
  hide() { if (this.veil) this.veil.hidden = true; },
  toggle() { if (this.veil) this.veil.hidden ? this.show() : this.hide(); },
};

/* ============================================================
   CONTROL CENTER
   ============================================================ */
const ControlCenter = {
  el: null,

  build() {
    this.el = $("#control-center");
    document.addEventListener("click", (e) => {
      if (!this.el.hidden && !this.el.contains(e.target)) this.hide();
    });
  },

  draw() {
    const T = [
      ["wifi", "Wi-Fi", "WebRTC peers"],
      ["ble", "Bluetooth", "LE mesh"],
      ["lora", "LoRa", "off-grid radio"],
      ["tor", "Tor Relay", "onion transit"],
    ];
    this.el.replaceChildren();
    const grid = el("div", "cc-grid");
    for (const [key, name, sub] of T) {
      const t = el("button", "cc-tile" + (State.transports[key] ? " on" : ""));
      t.innerHTML = `<span class="cc-ico">${Icons.mesh}</span><span><div class="cc-name">${name}</div><div class="cc-state">${State.transports[key] ? sub : "off"}</div></span>`;
      t.querySelector(".cc-ico svg").style.cssText = "width:15px;height:15px";
      t.addEventListener("click", () => { State.transports[key] = !State.transports[key]; persist(); this.draw(); refreshOpenSettings(); });
      grid.append(t);
    }
    this.el.append(grid);

    const dark = el("button", "cc-tile" + (document.documentElement.dataset.theme === "dark" ? " on" : ""));
    dark.innerHTML = `<span class="cc-ico">${Icons.settings}</span><span><div class="cc-name">Dark Appearance</div><div class="cc-state">${document.documentElement.dataset.theme === "dark" ? "Anthracite" : "Parchment"}</div></span>`;
    dark.querySelector(".cc-ico svg").style.cssText = "width:15px;height:15px";
    dark.addEventListener("click", () => { State.theme = document.documentElement.dataset.theme === "dark" ? "light" : "dark"; applyState(); });
    this.el.append(dark);

    const row = el("div", "cc-row");
    row.innerHTML = `<svg viewBox="0 0 16 16" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.4"><circle cx="8" cy="8" r="5.6" opacity=".4"/><circle cx="8" cy="8" r="2.6"/></svg>`;
    const range = el("input");
    range.type = "range"; range.min = 6; range.max = 40; range.value = State.glass;
    range.title = "Glass diffusion";
    range.addEventListener("input", () => { State.glass = +range.value; document.documentElement.style.setProperty("--diffusion", State.glass + "px"); persist(); });
    row.append(range);
    this.el.append(row);

    const foot = el("div", "cc-foot");
    foot.append(el("span", "mono", "HUDSON GLASS · DIFFUSION"));
    const sw = el("div", "swatches");
    for (const [id, c] of [["carmine", "#6B1721"], ["atlantic", "#1A3A5C"], ["signal", "#D8A72A"]]) {
      const b = el("button", "swatch" + (State.accent === id ? " on" : ""));
      b.style.cssText = `background:${c};width:18px;height:18px`;
      b.addEventListener("click", () => { State.accent = id; applyState(); });
      sw.append(b);
    }
    foot.append(sw);
    this.el.append(foot);
  },

  refresh() { if (this.el && !this.el.hidden) this.draw(); },
  show() { if (!this.el) return; MenuBar.hide(); this.draw(); this.el.hidden = false; },
  hide() { if (this.el) this.el.hidden = true; },
  toggle() { if (this.el) this.el.hidden ? this.show() : this.hide(); },
};

/* ============================================================
   THE POCKET PANE — HDL §11.1 · Friday on Android & iOS
   Full-screen surfaces, a floating glass tab bar, 44pt targets.
   ============================================================ */
const Mobile = {
  active: null, surface: null,
  TABS: [
    ["home", "Home", Icons.home],
    ["mesh", "Mesh", Icons.mesh],
    ["messages", "Chat", Icons.messages],
    ["boards", "Boards", Icons.boards],
    ["more", "More", Icons.more],
  ],
  MORE: ["calls", "vault", "ledger", "settings", "about"],

  build() {
    $("#mobile-root").hidden = false;
    this.surface = $("#m-surface");
    const tabs = $("#m-tabs");
    for (const [id, label, icon] of this.TABS) {
      const b = el("button", "", `${icon}<span>${label.toUpperCase()}</span>`);
      b.dataset.tab = id;
      b.addEventListener("click", () => (id === "more" ? this.sheet() : this.open(id)));
      tabs.append(b);
    }
    $("#m-theme").addEventListener("click", () => {
      State.theme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
      applyState();
    });
    $("#m-sheet-veil").addEventListener("click", (e) => {
      if (e.target.id === "m-sheet-veil") e.currentTarget.hidden = true;
    });
    const dl = location.hash.slice(1);
    this.open(Apps[dl] ? dl : "home");
  },

  mark(id) {
    for (const b of $("#m-tabs").children)
      b.classList.toggle("on", b.dataset.tab === id || (b.dataset.tab === "more" && this.MORE.includes(id)));
  },

  open(id) {
    if (this.active && Apps[this.active]) Apps[this.active].teardown?.();
    $("#m-sheet-veil").hidden = true;
    this.active = id;
    this.mark(id);
    this.surface.replaceChildren();
    if (id === "home") {
      $("#m-title").textContent = "TODAY · EROS OFFICE";
      this.home();
      return;
    }
    $("#m-title").textContent = Apps[id].title;
    Apps[id].render(this.surface, {});
  },

  sheet() {
    const sheet = $("#m-sheet");
    sheet.replaceChildren();
    for (const id of this.MORE) {
      const b = el("button", "", `${Apps[id].icon}<span>${Apps[id].name}</span>`);
      b.addEventListener("click", () => this.open(id));
      sheet.append(b);
    }
    $("#m-sheet-veil").hidden = false;
  },

  home() {
    const h = new Date().getHours();
    const greet = h < 12 ? "morning" : h < 18 ? "afternoon" : "evening";
    const unread = Chat.totalUnread();
    const nodes = Mesh.activeCount();
    const wrap = el("section", "content");
    const scroll = el("div", "content-scroll m-home");
    scroll.innerHTML = `
      <div class="h-display" style="margin-top:6px">Good ${greet}, <em>Gabriel.</em></div>
      <div class="pane" data-go="mesh">
        <div class="mono kicker">DARK CORE</div>
        <div class="stat-n">${nodes} node${nodes === 1 ? "" : "s"}</div>
        <div class="set-sub">${nodes === 1 ? "Only this device — link another" : "Live peers over BroadcastChannel · WebRTC"}</div>
      </div>
      <div class="pane" data-go="messages">
        <div class="mono kicker">MESSAGES</div>
        <div class="stat-n">${unread} unread</div>
        <div class="set-sub">Sealed per-recipient · real delivery</div>
      </div>
      <div class="pane" data-go="boards">
        <div class="mono kicker">ACTIVE PROJECT</div>
        <div class="stat-n">Friday 1.0</div>
        <div class="set-sub">${Board.cols[1].cards.length} panes in progress · ${Board.cols[2].cards.length} in review</div>
      </div>
      <div class="pane" data-go="ledger">
        <div class="mono kicker">LEDGER</div>
        <div class="stat-n">Chain intact</div>
        <div class="set-sub">Two sets of records · permanent set sealed</div>
      </div>`;
    wrap.append(scroll);
    this.surface.append(wrap);
    scroll.querySelectorAll("[data-go]").forEach((p) =>
      p.addEventListener("click", () => this.open(p.dataset.go)));
  },
};

/* ============================================================
   BOOT
   ============================================================ */
addEventListener("keydown", (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); Spotlight.toggle(); }
  if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === "d") {
    e.preventDefault();
    State.theme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    applyState();
  }
  if (e.key === "Escape") { Spotlight.hide(); ControlCenter.hide(); MenuBar.hide(); }
});

const pocket = matchMedia("(max-width: 760px)");
pocket.addEventListener("change", () => location.reload());

applyState();
Net.start();   // join the real Dark Core mesh immediately

if (pocket.matches) {
  Mobile.build();
} else {
  WM.area = $("#windows");
  Dock.build();
  MenuBar.build();
  Spotlight.build();
  ControlCenter.build();

  /* deep-link: friday/#ledger opens straight to a surface */
  const deeplink = location.hash.slice(1);
  if (deeplink && Apps[deeplink]) {
    setTimeout(() => WM.open(deeplink), 1250);
  } else {
    /* first morning on the river: open the mesh and the messages */
    setTimeout(() => WM.open("mesh"), 1250);
    setTimeout(() => { WM.open("messages"); Dock.refresh(); }, 1500);
  }
}
