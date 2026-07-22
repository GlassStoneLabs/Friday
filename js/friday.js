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
  // small monochrome marks for the social-login buttons
  provider(id) {
    const m = {
      google: `<svg viewBox="0 0 18 18" width="16" height="16" aria-hidden="true"><path fill="#EA4335" d="M9 3.48c1.35 0 2.56.47 3.52 1.38l2.6-2.6C13.46.9 11.43 0 9 0 5.48 0 2.44 2.02.96 4.96l3.02 2.35C4.7 5.16 6.66 3.48 9 3.48z"/><path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72l2.92 2.26c1.71-1.57 2.68-3.89 2.68-6.62z"/><path fill="#FBBC05" d="M3.98 10.69A5.4 5.4 0 0 1 3.7 9c0-.59.1-1.16.28-1.69L.96 4.96A9 9 0 0 0 0 9c0 1.45.35 2.82.96 4.04l3.02-2.35z"/><path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.81.54-1.85.86-3.04.86-2.34 0-4.3-1.58-5.02-3.71L.96 13.04C2.44 15.98 5.48 18 9 18z"/></svg>`,
      apple: `<svg viewBox="0 0 18 18" width="15" height="15" fill="currentColor" aria-hidden="true"><path d="M13.3 9.6c0-1.7 1.4-2.5 1.46-2.55-.8-1.17-2.04-1.33-2.48-1.35-1.05-.11-2.06.62-2.6.62-.53 0-1.36-.6-2.24-.59-1.15.02-2.21.67-2.8 1.7-1.2 2.08-.3 5.15.86 6.84.57.82 1.24 1.74 2.13 1.71.85-.03 1.18-.55 2.2-.55 1.03 0 1.32.55 2.22.53.92-.02 1.5-.83 2.06-1.66.65-.95.92-1.87.93-1.92-.02-.01-1.78-.68-1.8-2.7zM11.6 4.2c.47-.57.79-1.36.7-2.15-.68.03-1.5.45-1.98 1.02-.43.5-.81 1.3-.71 2.07.76.06 1.53-.38 2-.94z"/></svg>`,
      github: `<svg viewBox="0 0 18 18" width="16" height="16" fill="currentColor" aria-hidden="true"><path d="M9 .3a9 9 0 0 0-2.85 17.54c.45.08.6-.2.6-.43v-1.5c-2.5.55-3.04-1.2-3.04-1.2-.4-1.05-1-1.33-1-1.33-.82-.56.06-.55.06-.55.9.06 1.38.93 1.38.93.8 1.38 2.1.98 2.62.75.08-.58.32-.98.57-1.2-2-.23-4.1-1-4.1-4.45 0-.98.35-1.79.93-2.42-.1-.23-.4-1.15.08-2.4 0 0 .76-.24 2.48.92a8.6 8.6 0 0 1 4.51 0c1.72-1.16 2.47-.92 2.47-.92.49 1.25.18 2.17.09 2.4.58.63.92 1.44.92 2.42 0 3.46-2.1 4.22-4.11 4.44.32.28.61.83.61 1.68v2.49c0 .24.16.52.61.43A9 9 0 0 0 9 .3z"/></svg>`,
      microsoft: `<svg viewBox="0 0 18 18" width="15" height="15" aria-hidden="true"><path fill="#F25022" d="M1 1h7.6v7.6H1z"/><path fill="#7FBA00" d="M9.4 1H17v7.6H9.4z"/><path fill="#00A4EF" d="M1 9.4h7.6V17H1z"/><path fill="#FFB900" d="M9.4 9.4H17V17H9.4z"/></svg>`,
    };
    return m[id] || `<svg viewBox="0 0 16 16" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true"><rect x="3.2" y="7" width="9.6" height="6.4" rx="1.8"/><path d="M5.4 7V5.2a2.6 2.6 0 0 1 5.2 0V7"/></svg>`;
  },
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
    const offgrid = !!window.FridayNativeMesh?.available;
    meBox.innerHTML = `<div class="t-name">${esc(Net.name)}</div><div class="t-sub mono" style="word-break:break-all">${Net.id.slice(0, 18)}</div>`
      + (offgrid ? `<div class="transport" style="margin-top:8px"><span class="t-dot"></span><span><div class="t-name">Off-grid relay · active</div><div class="t-sub">MultipeerConnectivity · Wi-Fi + Bluetooth · store &amp; forward</div></span></div>` : "");
    rail.append(meBox);

    rail.append(el("div", "mono rail-head", "LIVE PEERS"));
    const peerList = el("div", "pane");
    peerList.style.padding = "4px 13px";
    rail.append(peerList);

    const link = el("button", "rail-item");
    link.style.cssText = "width:auto;margin-top:10px;background:color-mix(in srgb,var(--accent) 14%,transparent)";
    link.textContent = "Link a device →";
    link.addEventListener("click", () => Net.linkDialog());
    rail.append(link, el("div", "mono rail-foot", (offgrid ? "OFF-GRID: MULTIPEER RELAY + " : "") + "BROADCASTCHANNEL + WEBRTC<br>X25519 · HKDF · AES-256-GCM<br>NO SERVER · REAL PEERS ONLY"));
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

  // adopt a persisted account identity (decrypted from the vault on unlock)
  adopt(idn) {
    this.me = { privateKey: idn.priv, publicKey: idn.pub };
    this.myPubRaw = idn.pubRaw; this.alg = idn.alg;
    this.keys.clear();
    this._init = Promise.resolve();
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

/* ---------------- Account · encrypted local vault (no server) ----------------
   Sign-in is real: a passphrase is stretched with PBKDF2-SHA-256
   (310k iterations) into an AES-256-GCM key that encrypts a vault holding
   your mesh identity (X25519 keypair) and profile. The passphrase and the
   key are never stored — a wrong passphrase simply fails GCM authentication
   and cannot decrypt. Everything sensitive is encrypted at rest in this
   browser; nothing leaves the device. */
/* ---------------- Remember · staying signed in on a trusted device ----------
   The passphrase is never stored — not in any form. What we keep is the
   derived AES-GCM key itself, and only because WebCrypto lets us keep it
   NON-EXTRACTABLE: IndexedDB will hold the CryptoKey and hand it back for
   decryption, but no script (ours or anyone's) can read its bytes out again.
   The honest trade-off, said plainly in the UI: while a login is remembered,
   anyone who can open this browser profile can open that account. */
const Remember = {
  DB: "friday.keys", STORE: "vaultKeys",
  open() {
    return new Promise((res, rej) => {
      const r = indexedDB.open(this.DB, 1);
      r.onupgradeneeded = () => { if (!r.result.objectStoreNames.contains(this.STORE)) r.result.createObjectStore(this.STORE); };
      r.onsuccess = () => res(r.result);
      r.onerror = () => rej(r.error);
    });
  },
  async put(id, key) {
    try {
      const db = await this.open();
      await new Promise((res, rej) => {
        const tx = db.transaction(this.STORE, "readwrite");
        tx.objectStore(this.STORE).put(key, id);
        tx.oncomplete = res; tx.onerror = () => rej(tx.error);
      });
      db.close();
      return true;
    } catch { return false; }
  },
  async get(id) {
    try {
      const db = await this.open();
      const key = await new Promise((res, rej) => {
        const tx = db.transaction(this.STORE, "readonly");
        const rq = tx.objectStore(this.STORE).get(id);
        rq.onsuccess = () => res(rq.result || null); rq.onerror = () => rej(rq.error);
      });
      db.close();
      return key;
    } catch { return null; }
  },
  async drop(id) {
    if (!id) return;
    try {
      const db = await this.open();
      await new Promise((res) => {
        const tx = db.transaction(this.STORE, "readwrite");
        tx.objectStore(this.STORE).delete(id);
        tx.oncomplete = res; tx.onerror = res;
      });
      db.close();
    } catch {}
  },
};

const Account = {
  OLD_KEY: "friday.account.v1",     // the single-login era, migrated on sight
  INDEX: "friday.logins.v1",        // [{ id, name, created, lastUsed, remembered }]
  vaultKey: (id) => "friday.vault." + id,
  ITERS: 310000,
  identity: null,   // { priv, pub, pubRaw, alg }
  id: null,
  name: null,
  unlocked: false,
  store: {},        // decrypted, in-memory "encrypted pages" (profile, notes…)

  /* ---- the list of logins this device remembers (names only; vaults stay sealed) ---- */
  logins() {
    let list = [];
    try { list = JSON.parse(localStorage.getItem(this.INDEX) || "[]"); } catch {}
    // migrate a pre-multi-login vault so nobody loses their account
    try {
      const old = localStorage.getItem(this.OLD_KEY);
      if (old) {
        const meta = JSON.parse(old);
        const id = "l-" + Math.random().toString(36).slice(2, 10);
        localStorage.setItem(this.vaultKey(id), old);
        localStorage.removeItem(this.OLD_KEY);
        list.push({ id, name: meta.name || "Account", created: Date.now(), lastUsed: Date.now() });
        localStorage.setItem(this.INDEX, JSON.stringify(list));
      }
    } catch {}
    return list.sort((a, b) => (b.lastUsed || 0) - (a.lastUsed || 0));
  },
  exists() { return this.logins().length > 0; },
  meta(id) { try { return JSON.parse(localStorage.getItem(this.vaultKey(id))); } catch { return null; } },
  putIndex(list) { try { localStorage.setItem(this.INDEX, JSON.stringify(list)); } catch {} },
  touch(id, patch) {
    const list = this.logins().map((l) => (l.id === id ? { ...l, lastUsed: Date.now(), ...patch } : l));
    this.putIndex(list);
  },
  forget(id) {
    this.putIndex(this.logins().filter((l) => l.id !== id));
    try { localStorage.removeItem(this.vaultKey(id)); } catch {}
    Remember.drop(id);
  },

  async deriveKey(pass, salt) {
    const base = await crypto.subtle.importKey("raw", new TextEncoder().encode(pass), "PBKDF2", false, ["deriveKey"]);
    return crypto.subtle.deriveKey(
      { name: "PBKDF2", salt, iterations: this.ITERS, hash: "SHA-256" },
      base, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
  },

  async writeVault(id, vault, pass) {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const key = await this.deriveKey(pass, salt);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ct = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(JSON.stringify(vault))));
    localStorage.setItem(this.vaultKey(id), JSON.stringify({ v: 2, name: vault.name, salt: b64(salt), iters: this.ITERS, iv: b64(iv), ct: b64(ct) }));
    this._key = key; this._salt = salt;
  },

  async signup(name, pass) {
    let kp, alg;
    try { kp = await crypto.subtle.generateKey({ name: "X25519" }, true, ["deriveBits"]); alg = "X25519"; }
    catch { kp = await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, ["deriveBits"]); alg = "P-256"; }
    const privJwk = await crypto.subtle.exportKey("jwk", kp.privateKey);
    const pubRaw = new Uint8Array(await crypto.subtle.exportKey("raw", kp.publicKey));
    // a second keypair, for signatures: this is what proves who you are to an
    // org server. Reticulum's pairing — X25519 to seal, Ed25519 to sign.
    const sign = await this.makeSigningKey();
    const vault = {
      name, alg, privJwk, pubRaw: b64(pubRaw), createdAt: Date.now(), store: {},
      signAlg: sign.alg, signPrivJwk: sign.privJwk, signPubJwk: sign.pubJwk,
    };
    const id = "l-" + Math.random().toString(36).slice(2, 10);
    await this.writeVault(id, vault, pass);
    const list = this.logins();
    list.push({ id, name, created: Date.now(), lastUsed: Date.now() });
    this.putIndex(list);
    this.id = id;
    await this.activate(vault);
    return id;
  },

  async makeSigningKey() {
    let kp, alg;
    try { kp = await crypto.subtle.generateKey({ name: "Ed25519" }, true, ["sign", "verify"]); alg = "Ed25519"; }
    catch { kp = await crypto.subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, true, ["sign", "verify"]); alg = "P-256"; }
    return {
      alg,
      privJwk: await crypto.subtle.exportKey("jwk", kp.privateKey),
      pubJwk: await crypto.subtle.exportKey("jwk", kp.publicKey),
    };
  },

  // the exact string the server hashes into an account id — key order must never drift
  signPubString() {
    const j = this.vault?.signPubJwk;
    if (!j) return null;
    return j.kty === "OKP"
      ? JSON.stringify({ crv: j.crv, kty: j.kty, x: j.x })
      : JSON.stringify({ crv: j.crv, kty: j.kty, x: j.x, y: j.y });
  },

  async signNonce(nonce) {
    if (!this.signPriv) return null;
    const data = new TextEncoder().encode(nonce);
    const params = this.vault.signAlg === "Ed25519" ? { name: "Ed25519" } : { name: "ECDSA", hash: "SHA-256" };
    return b64(new Uint8Array(await crypto.subtle.sign(params, this.signPriv, data)));
  },

  async unlock(id, pass) {
    const o = this.meta(id);
    if (!o) return false;
    let vault;
    try {
      const key = await this.deriveKey(pass, unb64(o.salt));
      vault = JSON.parse(new TextDecoder().decode(await crypto.subtle.decrypt({ name: "AES-GCM", iv: unb64(o.iv) }, key, unb64(o.ct))));
      this._key = key; this._salt = unb64(o.salt);
    } catch { return false; }   // wrong passphrase → GCM auth fails
    this.id = id;
    this.touch(id, {});
    await this.activate(vault);
    return true;
  },

  // open a login whose key this device is holding for us (no passphrase typed)
  async unlockWithKey(id, key) {
    const o = this.meta(id);
    if (!o) return false;
    let vault;
    try {
      vault = JSON.parse(new TextDecoder().decode(await crypto.subtle.decrypt({ name: "AES-GCM", iv: unb64(o.iv) }, key, unb64(o.ct))));
    } catch { return false; }
    this._key = key; this._salt = unb64(o.salt);
    this.id = id;
    this.touch(id, {});
    await this.activate(vault);
    return true;
  },

  async activate(vault) {
    const imp = vault.alg === "X25519" ? { name: "X25519" } : { name: "ECDH", namedCurve: "P-256" };
    const priv = await crypto.subtle.importKey("jwk", vault.privJwk, imp, false, ["deriveBits"]);
    const pubRaw = unb64(vault.pubRaw);
    const pub = await crypto.subtle.importKey("raw", pubRaw, imp, false, []);
    this.identity = { priv, pub, pubRaw, alg: vault.alg };
    this.name = vault.name;
    this.store = vault.store || {};
    this.vault = vault;
    this.unlocked = true;
    E2E.adopt(this.identity);

    // vaults made before orgs existed have no signing key — mint one and keep it
    if (!vault.signPubJwk && this._key) {
      const sign = await this.makeSigningKey();
      Object.assign(vault, { signAlg: sign.alg, signPrivJwk: sign.privJwk, signPubJwk: sign.pubJwk });
      await this.save({});
    }
    if (vault.signPrivJwk) {
      const sp = vault.signAlg === "Ed25519" ? { name: "Ed25519" } : { name: "ECDSA", namedCurve: "P-256" };
      try { this.signPriv = await crypto.subtle.importKey("jwk", vault.signPrivJwk, sp, false, ["sign"]); } catch { this.signPriv = null; }
    }
  },

  // persist an "encrypted page" of app data back into the vault
  async save(patch) {
    if (!this.unlocked || !this._key || !this.id) return;
    Object.assign(this.store, patch);
    this.vault.store = this.store;
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ct = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, this._key, new TextEncoder().encode(JSON.stringify(this.vault))));
    try {
      localStorage.setItem(this.vaultKey(this.id), JSON.stringify({ v: 2, name: this.vault.name, salt: b64(this._salt), iters: this.ITERS, iv: b64(iv), ct: b64(ct) }));
    } catch (e) { console.warn("vault save failed (storage full?)", e); }
  },

  // both land on the login picker, never silently re-open a remembered account
  lock() { Remember.drop(this.id); try { sessionStorage.setItem("friday.switch", "1"); } catch {} this.unlocked = false; this.identity = null; this._key = null; this.store = {}; location.reload(); },
  signOut() { try { sessionStorage.setItem("friday.switch", "1"); } catch {} this.unlocked = false; this.identity = null; this._key = null; this.store = {}; location.reload(); },
  destroy() { if (this.id) this.forget(this.id); location.reload(); },

  shortId() {
    // a stable node id derived from the identity public key
    let h = 0; const s = this.identity ? b64(this.identity.pubRaw) : "x";
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
    return "n-" + h.toString(36);
  },
};

/* ---------------- Server · org rendezvous & directory (optional) ----------------
   Friday runs perfectly with no server at all — the mesh is peer-to-peer.
   A server adds exactly three things and nothing more:
     • an account you can prove is yours by SIGNING a nonce (no password is
       ever sent; the passphrase only ever decrypts the local vault),
     • an org: who belongs, and each member's public key,
     • a rendezvous so two devices can find each other and then connect
       directly — after which traffic no longer passes through it.
   Message plaintext never reaches the server. It does learn metadata:
   names, public keys, membership, and who is online. */
const Server = {
  base: localStorage.getItem("friday.server") || location.origin,
  available: false,
  token: null, account: null, orgs: [], members: [],
  es: null, subs: new Set(),

  on(fn) { this.subs.add(fn); return () => this.subs.delete(fn); },
  emit(ev, data) { for (const f of this.subs) try { f(ev, data); } catch {} },

  async probe() {
    try {
      const r = await fetch(this.base + "/api/health", { cache: "no-store" });
      this.available = r.ok;
    } catch { this.available = false; }
    return this.available;
  },

  async call(path, body, method) {
    const r = await fetch(this.base + "/api" + path, {
      method: method || (body ? "POST" : "GET"),
      headers: { "content-type": "application/json", ...(this.token ? { authorization: "Bearer " + this.token } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(data.error || `request failed (${r.status})`);
    return data;
  },

  // register or resume a session by signing a one-time nonce
  async authenticate() {
    if (!Account.unlocked || !Account.signPriv) return false;
    const signPub = Account.signPubString();
    const boxPub = b64(Account.identity.pubRaw);
    const { nonce } = await this.call("/challenge", { signPub });
    const sig = await Account.signNonce(nonce);
    let res;
    try {
      res = await this.call("/login", { signPub, nonce, sig, boxPub });
    } catch {
      const again = await this.call("/challenge", { signPub });
      res = await this.call("/register", {
        name: Account.name, signPub, boxPub,
        nonce: again.nonce, sig: await Account.signNonce(again.nonce),
      });
    }
    this.token = res.token; this.account = res.account;
    const me = await this.call("/me");
    this.orgs = me.orgs || [];
    return true;
  },

  /* ---- social login (OIDC): identity only, keys stay on the device ---- */
  providersList: null,
  async providers() {
    if (this.providersList) return this.providersList;
    try { this.providersList = (await this.call("/auth/providers")).providers || []; }
    catch { this.providersList = []; }
    return this.providersList;
  },
  // open the provider's page in a popup, resolve with the session it hands back.
  // The popup MUST be opened synchronously inside the click gesture, else the
  // browser blocks it — so we open it blank first, then point it at the auth URL.
  oidcLogin(providerId) {
    const pop = window.open("about:blank", "friday-oidc", "width=480,height=680");
    return new Promise(async (resolve, reject) => {
      if (!pop) return reject(new Error("Popup blocked — allow popups for Friday and try again."));
      let bc; try { bc = new BroadcastChannel("friday-oidc"); } catch {}
      const handle = (r) => {
        if (!r || r.source !== "friday-oidc") return;
        cleanup();
        const res = r.result;
        if (res.error) return reject(new Error(res.error));
        this.token = res.token; this.account = res.account;
        resolve(res);
      };
      const onMsg = (e) => handle(e.data);
      const poll = setInterval(() => { if (pop.closed) { cleanup(); reject(new Error("cancelled")); } }, 600);
      const cleanup = () => { clearInterval(poll); removeEventListener("message", onMsg); try { bc?.close(); } catch {} try { pop.close(); } catch {} };
      addEventListener("message", onMsg);
      if (bc) bc.onmessage = (e) => handle(e.data);
      try {
        const { authUrl } = await this.call(`/auth/${providerId}/start?redirect=${encodeURIComponent(location.origin)}`);
        pop.location.href = authUrl;
      } catch (e) { cleanup(); reject(e); }
    });
  },
  // bind the vault's freshly-made public keys to the federated account
  async bindKeys() {
    return this.call("/account/keys", { boxPub: b64(Account.identity.pubRaw), signPub: Account.signPubString(), name: Account.name });
  },

  async createOrg(name) {
    const r = await this.call("/orgs", { name });
    this.orgs = (await this.call("/me")).orgs || [];
    return r;
  },
  async joinOrg(code) {
    const r = await this.call("/orgs/join", { code });
    this.orgs = (await this.call("/me")).orgs || [];
    return r;
  },
  async invite(orgId, fresh) { return this.call(`/orgs/${orgId}/invites`, { fresh: !!fresh }); },
  async loadMembers(orgId) {
    const r = await this.call(`/orgs/${orgId}/members`);
    this.members = r.members || [];
    this.emit("members", this.members);
    return this.members;
  },
  org() { return this.orgs[0] || null; },

  // live: presence, rendezvous, and mail that arrived while we were away
  connect() {
    if (!this.token || this.es) return;
    this.es = new EventSource(`${this.base}/api/events?token=${encodeURIComponent(this.token)}`);
    this.es.addEventListener("presence", (e) => {
      const d = JSON.parse(e.data);
      this.emit("presence", d);
      Net.onOrgPresence(d.online || []);
    });
    this.es.addEventListener("signal", (e) => Net.onSignal(JSON.parse(e.data)));
    this.es.addEventListener("member-joined", (e) => {
      const d = JSON.parse(e.data);
      if (this.org()) this.loadMembers(this.org().id);
      this.emit("member-joined", d);
    });
    this.es.addEventListener("mail", (e) => Net.onMail(JSON.parse(e.data)));
    this.es.onerror = () => this.emit("error", null);   // EventSource retries on its own
  },
  disconnect() { try { this.es?.close(); } catch {} this.es = null; },
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
  appSubs: new Set(),        // boards · calls · vault — live app frames over the mesh
  STUN: [{ urls: "stun:stun.l.google.com:19302" }],

  onPeers(fn) { this.peerSubs.add(fn); return () => this.peerSubs.delete(fn); },
  onMsg(fn) { this.msgSubs.add(fn); return () => this.msgSubs.delete(fn); },
  onApp(fn) { this.appSubs.add(fn); return () => this.appSubs.delete(fn); },
  emitPeers() {
    const mc = document.getElementById("mb-mesh-count"); if (mc) mc.textContent = 1 + this.peers.size;
    const dot = document.querySelector("#mb-mesh .mesh-dot"); if (dot) dot.classList.toggle("off", this.peers.size === 0);
    for (const f of this.peerSubs) try { f(); } catch {}
  },
  emitMsg(m) { for (const f of this.msgSubs) try { f(m); } catch {} },
  emitApp(m) { for (const f of this.appSubs) try { f(m); } catch {} },

  async start() {
    if (Account.unlocked) { this.name = Account.name; this.id = Account.shortId(); }
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
    // native off-grid mesh (iOS/iPad/Mac apps): the device relays + stores this
    try { window.FridayNativeMesh?.available && FridayNativeMesh.send(obj); } catch {}
  },
  sendTo(id, obj) {
    const ch = this.rtc.get(id);
    if (ch && ch.readyState === "open") { try { ch.send(JSON.stringify(obj)); return; } catch {} }
    this.send(obj); // BroadcastChannel + native mesh reach peers; recipients filter by .to
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
    } else if (m.t === "typing" && (m.to === this.id || (!m.to && m.room === "darkcore"))) {
      this.emitMsg(m);
    } else if (typeof m.t === "string" && /^(board|call|vault):/.test(m.t) && (m.to == null || m.to === this.id)) {
      // app frames — boards sync, call signaling, vault shard transfer — carry
      // the sender id so subscribers can attribute + seal replies per-peer
      this.emitApp(m);
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
    // Announce down THIS channel directly. Going through send() would skip it:
    // a channel only lands in this.rtc once a hello arrives over it, so waiting
    // for the registry first would deadlock the handshake.
    ch.onopen = () => {
      try { ch.send(JSON.stringify({ t: "hello", id: this.id, name: this.name, pub: this.pub })); } catch {}
      this.announce();
    };
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

  /* ---- org rendezvous: connect to org members with no copy/paste ----
     The server only ferries opaque SDP. Media/data go peer-to-peer.
     Deterministic roles avoid glare: lower account id makes the offer. */
  links: new Map(),          // accountId -> RTCPeerConnection

  onOrgPresence(onlineIds) {
    if (!Server.account) return;
    const mine = Server.account.id;
    for (const id of onlineIds) {
      if (id === mine || this.links.has(id)) continue;
      if (mine < id) this.offerTo(id);        // only one side initiates
    }
    for (const [id, pc] of this.links) {
      if (!onlineIds.includes(id)) { try { pc.close(); } catch {} this.links.delete(id); }
    }
  },

  newLink(peerId) {
    const pc = new RTCPeerConnection({ iceServers: this.STUN });
    this.links.set(peerId, pc);
    pc.onconnectionstatechange = () => {
      if (["failed", "closed", "disconnected"].includes(pc.connectionState)) {
        this.links.delete(peerId);
        try { pc.close(); } catch {}
        this.emitPeers();
      }
    };
    return pc;
  },

  async offerTo(peerId) {
    try {
      const pc = this.newLink(peerId);
      const ch = pc.createDataChannel("dark-core");
      this.wireChannel(pc, ch);
      await pc.setLocalDescription(await pc.createOffer());
      await this.iceDone(pc);
      await Server.call("/signal", { to: peerId, payload: { kind: "offer", sdp: pc.localDescription } });
    } catch { this.links.delete(peerId); }
  },

  async onSignal({ from, payload }) {
    try {
      if (payload.kind === "offer") {
        const pc = this.newLink(from);
        pc.ondatachannel = (e) => this.wireChannel(pc, e.channel);
        await pc.setRemoteDescription(payload.sdp);
        await pc.setLocalDescription(await pc.createAnswer());
        await this.iceDone(pc);
        await Server.call("/signal", { to: from, payload: { kind: "answer", sdp: pc.localDescription } });
      } else if (payload.kind === "answer") {
        const pc = this.links.get(from);
        if (pc && !pc.currentRemoteDescription) await pc.setRemoteDescription(payload.sdp);
      }
    } catch { this.links.delete(from); }
  },

  // ciphertext held for us while we were offline — open it like any sealed frame
  onMail({ from, fromName, payload }) {
    this.emitMsg({ ...payload, from: payload.from || from, fromName, viaMailbox: true });
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
// the native mesh bridge (iOS/iPad/Mac apps) reaches Net through the window
try { window.Net = Net; } catch {}

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

    // real typing indicators — peers announce, rows auto-expire
    const typers = new Map();   // roomId -> Map(peerId -> expiresAt)
    const typingRows = (roomId) => {
      const t = typers.get(roomId);
      if (!t || !t.size) return [];
      return [...t.keys()].map((pid) => {
        const peer = Net.peers.get(pid);
        if (!peer) return null;
        const row = el("div", "msg is-typing");
        row.innerHTML = `<div class="avatar">${initials(peer.name)}</div><div><div class="msg-meta"><span class="who">${esc(peer.name)}</span><span class="when">TYPING…</span></div><div class="bubble typing"><i></i><i></i><i></i></div></div>`;
        return row;
      }).filter(Boolean);
    };
    const noteTyping = (roomId, peerId) => {
      if (!typers.has(roomId)) typers.set(roomId, new Map());
      typers.get(roomId).set(peerId, Date.now() + 3200);
      if (Chat.active === roomId) drawThread();
    };
    const clearTyping = (roomId, peerId) => {
      typers.get(roomId)?.delete(peerId);
    };
    const pruneTyping = setInterval(() => {
      const now = Date.now();
      let changed = false;
      for (const [room, t] of typers) for (const [pid, exp] of t)
        if (exp < now || !Net.peers.has(pid)) { t.delete(pid); if (Chat.active === room) changed = true; }
      if (changed) drawThread();
    }, 900);

    const drawThread = () => {
      const r = Chat.rooms[Chat.active];
      if (!r) { Chat.active = "darkcore"; return drawThread(); }
      const ribbon = r.broadcast
        ? `BROADCAST · ${Net.peers.size} PEER${Net.peers.size === 1 ? "" : "S"} · SEALED PER-RECIPIENT`
        : "DIRECT · X25519 · AES-256-GCM";
      const fp = E2E.ok ? "" : " · UNSEALED — SERVE OVER HTTPS FOR E2E";
      head.innerHTML = `<div class="h-display">${esc(r.label)}</div>
        <div class="mono sec-ribbon"><span class="lock">${Icons.lock}</span> ${ribbon}${fp}</div>`;
      const rows = r.msgs.map(bubble).concat(typingRows(Chat.active));
      if (!rows.length) {
        msgs.replaceChildren(el("div", "t-sub", r.broadcast
          ? (Net.peers.size ? "Say something — it will be sealed for each peer and delivered live." : "You're the only node right now. Open Friday elsewhere to see real delivery.")
          : "Direct, end-to-end. Messages are sealed with this peer's real key."));
      } else {
        msgs.replaceChildren(...rows);
      }
      msgs.scrollTop = msgs.scrollHeight;
    };

    const select = (id) => { Chat.active = id; const r = Chat.rooms[id]; if (r) r.unread = 0; drawRail(); drawThread(); Dock.refresh(); };

    // tell the room I'm typing — throttled, direct in DMs, broadcast in #dark-core
    let lastTyping = 0;
    composer.querySelector("input").addEventListener("input", (e) => {
      if (!e.target.value.trim()) return;
      const now = Date.now();
      if (now - lastTyping < 1200) return;
      lastTyping = now;
      const r = Chat.rooms[Chat.active];
      if (!r) return;
      if (r.broadcast) Net.send({ t: "typing", id: Net.id, room: "darkcore" });
      else if (Net.peers.has(r.peerId)) Net.sendTo(r.peerId, { t: "typing", id: Net.id, to: r.peerId, room: "dm" });
    });

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
      if (m.t === "typing") {
        const typer = Net.peers.get(m.id);
        if (!typer) return;
        const roomId = m.room === "darkcore" ? "darkcore" : (Chat.ensureDM(typer), Chat.dmId(m.id));
        noteTyping(roomId, m.id);
        return;
      }
      const peer = Net.peers.get(m.from);
      if (!peer || !peer.pub) return;
      let text = "(unable to open)";
      try { text = await E2E.open(peer.pub, m.wire); } catch {}
      const roomId = m.room === "darkcore" ? "darkcore" : Chat.ensureDM(peer);
      const r = Chat.rooms[roomId];
      const when = new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
      clearTyping(roomId, m.from);   // their message supersedes the dots
      r.msgs.push({ who: peer.name, ini: initials(peer.name), when, text, wire: m.wire });
      if (Chat.active === roomId) drawThread();
      else { r.unread++; Dock.refresh(); }
      drawRail();
    };
    const onPeers = () => { drawRail(); if (Chat.rooms[Chat.active]?.broadcast) drawThread(); };
    this._unsub = [Net.onMsg(onMsg), Net.onPeers(onPeers), () => clearInterval(pruneTyping)];

    drawRail();
    drawThread();
  },
  teardown() { this._unsub?.forEach((u) => u()); this._unsub = null; },
};

/* ---------------- Boards (REAL · live mesh sync + encrypted at rest) ----------
   A last-write-wins element set (a real CRDT): every card is an object keyed by
   a stable id, carrying a version and the id of the node that last touched it.
   Local edits bump the version and broadcast a `board:op`; incoming ops are
   merged only if they're newer (higher version, node id breaks ties), so any
   two nodes that have seen the same set of ops converge — no server, no order
   guarantees required. Tombstones (del:true) let deletions propagate too.
   State is saved encrypted into the account vault (or localStorage when there
   is no account), so it survives reloads and rides along on the mesh. */
const Board = {
  cols: [
    { id: "backlog", name: "Backlog", color: "#7A7770" },
    { id: "doing", name: "In progress", color: "#1A3A5C" },
    { id: "review", name: "Review", color: "#D8A72A" },
    { id: "done", name: "Done", color: "#2E7D4F" },
  ],
  cards: new Map(),          // id -> { id, col, t, tag, who, ord, v, node, del }
  colv: new Map(),           // colId -> { name, v, node } — LWW override of a column's name
  clock: 0,
  loaded: false,
  subs: new Set(),

  onChange(fn) { this.subs.add(fn); return () => this.subs.delete(fn); },
  emit() { for (const f of this.subs) try { f(); } catch {} },

  // deterministic seed ids → if two fresh nodes both seed, the merge dedups
  seed() {
    const s = [
      ["seed-1", "backlog", "LoRa transceiver firmware — needle MTU tuning", "DARK CORE", "MW"],
      ["seed-2", "backlog", "Sybil-resistance audit with introduction graphs", "SECURITY", "EL"],
      ["seed-3", "doing", "Erasure-coded vault — Reed-Solomon shards", "STORAGE", "SS"],
      ["seed-4", "doing", "Friday glass pass — diffusion & tint signatures", "DESIGN", "AR"],
      ["seed-5", "review", "Voice bridge — WebRTC duplex under 200 ms", "DARK SUN", "GR"],
      ["seed-6", "done", "Reticulum link layer — 297-byte handshake", "DARK CORE", "MW"],
      ["seed-7", "done", "CRDT sync across partitioned offices", "STORAGE", "EL"],
    ];
    s.forEach(([id, col, t, tag, who], i) => this.cards.set(id, { id, col, t, tag, who, ord: i, v: 1, node: "seed", del: false }));
  },

  load() {
    if (this.loaded) return;
    this.loaded = true;
    let raw = null;
    try { raw = (Account.unlocked && Account.store.boards) || JSON.parse(localStorage.getItem("friday.boards") || "null"); } catch {}
    if (raw && Array.isArray(raw.cards)) {
      raw.cards.forEach((c) => this.cards.set(c.id, c));
      (raw.cols || []).forEach((o) => this.colv.set(o.col, { name: o.name, v: o.v, node: o.node }));
      this.clock = raw.clock || 0;
    } else {
      this.seed();
    }
  },
  persist() {
    const snap = {
      cards: [...this.cards.values()],
      cols: [...this.colv.entries()].map(([col, o]) => ({ col, ...o })),
      clock: this.clock,
    };
    // signed in → encrypted in the vault only; otherwise plain localStorage
    if (Account.unlocked) { Account.save({ boards: snap }); try { localStorage.removeItem("friday.boards"); } catch {} }
    else try { localStorage.setItem("friday.boards", JSON.stringify(snap)); } catch {}
  },

  colName(colId) { return this.colv.get(colId)?.name ?? (this.cols.find((c) => c.id === colId)?.name || colId); },
  colSnapshot() { return [...this.colv.entries()].map(([col, o]) => ({ col, ...o })); },

  list(colId) {
    return [...this.cards.values()].filter((c) => !c.del && c.col === colId).sort((a, b) => (a.ord - b.ord) || (a.v - b.v));
  },
  nextOrd(colId) { return this.list(colId).reduce((m, c) => Math.max(m, c.ord), -1) + 1; },

  // a local mutation: stamp a fresh version, persist, and put it on the wire
  edit(id, patch) {
    const cur = this.cards.get(id) || { id, ord: 0 };
    this.clock++;
    const card = { ...cur, ...patch, v: this.clock, node: Net.id };
    this.cards.set(id, card);
    this.persist();
    Net.send({ t: "board:op", id: Net.id, card });
    this.emit();
    return card;
  },
  // a remote op: keep it only if it's strictly newer (version, then node id)
  merge(card) {
    if (!card || !card.id) return false;
    const cur = this.cards.get(card.id);
    if (cur && !(card.v > cur.v || (card.v === cur.v && card.node > cur.node))) return false;
    this.cards.set(card.id, card);
    if (card.v > this.clock) this.clock = card.v;   // stay ahead of what we've seen
    this.persist();
    this.emit();
    return true;
  },

  // rename a column — same LWW discipline as cards, keyed by column id
  editCol(colId, name) {
    this.clock++;
    this.colv.set(colId, { name, v: this.clock, node: Net.id });
    this.persist();
    Net.send({ t: "board:col", id: Net.id, col: colId, name, v: this.clock, node: Net.id });
    this.emit();
  },
  mergeCol(op) {
    if (!op || !op.col) return false;
    const cur = this.colv.get(op.col);
    if (cur && !(op.v > cur.v || (op.v === cur.v && op.node > cur.node))) return false;
    this.colv.set(op.col, { name: op.name, v: op.v, node: op.node });
    if (op.v > this.clock) this.clock = op.v;
    this.persist();
    this.emit();
    return true;
  },
};

Apps.boards = {
  name: "Boards", title: "BOARDS · EROS OFFICE", icon: Icons.boards, w: 940, h: 560,
  render(body) {
    Board.load();
    const content = el("section", "content");
    content.innerHTML = `<div class="board-head">
      <div><div class="mono kicker">ORANGE PIE · V1 ALPHA</div>
      <div class="h-display">The work, <em>in panes.</em></div></div>
      <div class="mono sec-ribbon" id="board-ribbon" style="margin-left:auto"></div></div>`;
    const board = el("div", "board");
    content.append(board);
    body.append(content);
    const ribbon = content.querySelector("#board-ribbon");
    const setRibbon = () => { ribbon.innerHTML = `LWW-CRDT · SYNCED TO ${Net.peers.size} PEER${Net.peers.size === 1 ? "" : "S"} · SAVED ${Account.unlocked ? "ENCRYPTED" : "LOCALLY"}`; };

    const tagColor = { "DARK CORE": "rgba(26,58,92,.16)", SECURITY: "rgba(107,23,33,.14)", STORAGE: "rgba(216,167,42,.18)", DESIGN: "rgba(201,214,219,.5)", "DARK SUN": "rgba(107,23,33,.14)" };
    const tags = ["DARK CORE", "SECURITY", "STORAGE", "DESIGN", "DARK SUN"];
    let dragId = null;

    const draw = () => {
      setRibbon();
      board.replaceChildren();
      for (const col of Board.cols) {
        const cards = Board.list(col.id);
        const c = el("div", "col");
        c.dataset.col = col.id;
        c.innerHTML = `<div class="col-head mono"><span class="col-dot" style="background:${col.color}"></span><span class="col-name" title="Double-click to rename">${esc(Board.colName(col.id).toUpperCase())}</span><span class="count">${cards.length}</span></div>`;
        c.querySelector(".col-name").addEventListener("dblclick", (e) => {
          e.stopPropagation();
          const cur = Board.colName(col.id);
          const inp = el("input");
          inp.type = "text"; inp.value = cur;
          Object.assign(inp.style, { flex: "1", minWidth: "0", padding: "2px 6px", borderRadius: "6px", border: "1px solid var(--pane-edge)", background: "var(--pane-bg)", outline: "none", font: "inherit", textTransform: "uppercase" });
          const nameEl = c.querySelector(".col-name");
          nameEl.replaceWith(inp); inp.focus(); inp.select();
          let done = false;
          const commit = () => { if (done) return; done = true; const t = inp.value.trim(); if (t && t !== cur) Board.editCol(col.id, t); else draw(); };
          inp.addEventListener("keydown", (ev) => { if (ev.key === "Enter") commit(); if (ev.key === "Escape") { done = true; draw(); } });
          inp.addEventListener("blur", commit);
        });
        const drop = el("div", "col-drop");
        cards.forEach((card) => {
          const k = el("div", "card");
          k.draggable = true;
          const nextTag = () => tags[(tags.indexOf(card.tag) + 1) % tags.length];
          k.innerHTML = `<div class="card-title" title="Double-click to rename">${esc(card.t)}</div>
            <div class="card-row"><span class="tag" title="Click to recolor" style="background:${tagColor[card.tag] || "var(--pane-bg)"}">${esc(card.tag || "—")}</span><span class="who">${esc(card.who || "")}</span><button class="card-x" title="Delete" aria-label="Delete card">×</button></div>`;
          k.addEventListener("dragstart", () => { dragId = card.id; k.classList.add("dragging"); });
          k.addEventListener("dragend", () => k.classList.remove("dragging"));
          k.querySelector(".tag").addEventListener("click", (e) => { e.stopPropagation(); Board.edit(card.id, { tag: nextTag() }); });
          k.querySelector(".card-x").addEventListener("click", (e) => { e.stopPropagation(); Board.edit(card.id, { del: true }); });
          k.querySelector(".card-title").addEventListener("dblclick", () => {
            const inp = el("input");
            inp.type = "text"; inp.value = card.t;
            Object.assign(inp.style, { padding: "6px 8px", borderRadius: "8px", border: "1px solid var(--pane-edge)", background: "var(--pane-bg)", outline: "none", width: "100%", font: "inherit" });
            k.querySelector(".card-title").replaceWith(inp); inp.focus(); inp.select();
            let done = false;
            const commit = () => { if (done) return; done = true; const t = inp.value.trim(); if (t && t !== card.t) Board.edit(card.id, { t }); else draw(); };
            inp.addEventListener("keydown", (e) => { if (e.key === "Enter") commit(); if (e.key === "Escape") { done = true; draw(); } });
            inp.addEventListener("blur", commit);
          });
          drop.append(k);
        });
        const add = el("button", "add-card", "+ New pane");
        add.addEventListener("click", () => {
          const inp = el("input");
          inp.type = "text"; inp.placeholder = "Name the work, then Enter";
          Object.assign(inp.style, { padding: "9px 12px", borderRadius: "12px", border: "1px solid var(--pane-edge)", background: "var(--pane-bg)", outline: "none", width: "100%" });
          drop.append(inp); inp.focus();
          let done = false;
          const commit = () => {
            if (done) return; done = true;
            const t = inp.value.trim();
            if (t) Board.edit(crypto.randomUUID ? crypto.randomUUID() : "c-" + Date.now() + Math.random().toString(36).slice(2), { col: col.id, t, tag: "DESIGN", who: initials(Net.name), ord: Board.nextOrd(col.id), del: false });
            else draw();
          };
          inp.addEventListener("keydown", (e) => { if (e.key === "Enter") commit(); if (e.key === "Escape") { done = true; draw(); } });
          inp.addEventListener("blur", commit);
        });
        c.append(drop, add);
        c.addEventListener("dragover", (e) => { e.preventDefault(); c.classList.add("drag-over"); });
        c.addEventListener("dragleave", () => c.classList.remove("drag-over"));
        c.addEventListener("drop", (e) => {
          e.preventDefault();
          c.classList.remove("drag-over");
          if (!dragId) return;
          const card = Board.cards.get(dragId);
          if (card && card.col !== col.id) Board.edit(dragId, { col: col.id, ord: Board.nextOrd(col.id) });
          dragId = null;
        });
        board.append(c);
      }
    };

    // live sync — merge remote ops, answer/emit full-state requests on join
    const onApp = (m) => {
      if (m.t === "board:op") Board.merge(m.card);
      else if (m.t === "board:col") Board.mergeCol(m);
      else if (m.t === "board:full") { (m.cards || []).forEach((c) => Board.merge(c)); (m.cols || []).forEach((o) => Board.mergeCol(o)); }
      else if (m.t === "board:req") Net.send({ t: "board:full", id: Net.id, cards: [...Board.cards.values()], cols: Board.colSnapshot() });
    };
    this._unsub = [
      Board.onChange(draw),
      Net.onApp(onApp),
      Net.onPeers(setRibbon),
    ];
    Net.send({ t: "board:req", id: Net.id });   // pull the freshest state from the mesh
    draw();
  },
  teardown() { this._unsub?.forEach((u) => u()); this._unsub = null; },
};

/* ---------------- Calls · Dark Sun (REAL WebRTC voice, E2E-sealed) ----------
   A genuine peer-to-peer voice call to a live mesh node. The microphone is
   real (getUserMedia); the offer/answer SDP is sealed per-recipient with the
   peer's X25519 key (E2E.seal) before it crosses the mesh. On top of WebRTC's
   mandatory DTLS-SRTP, Friday adds its own end-to-end layer: every encoded
   audio frame is encrypted in the browser with AES-256-GCM under the *same*
   X25519-derived shared key the messages use (WebRTC Encoded Transforms), so
   the voice is sealed by the app itself — not merely trusted to the transport
   — and no server ever sees plaintext. Both peers negotiate the capability;
   where Encoded Transforms are unavailable it falls back to DTLS-SRTP and says
   so. The engine always listens (rings with the app closed); a short call log
   auto-saves encrypted. */
const Call = {
  state: "idle",          // idle | dialing | ringing | live
  peerId: null, peerName: "", pc: null, local: null, remote: null,
  incoming: null,         // { from, name, wire } while ringing in
  audio: null, t0: 0, muted: false,
  frameE2EE: false, frameKey: null, encFrames: 0, decFrames: 0,   // per-frame E2E layer
  E2EE_OK: false,
  subs: new Set(), _wired: false,
  log: [],                // recent calls — auto-saved encrypted

  onChange(fn) { this.subs.add(fn); return () => this.subs.delete(fn); },
  emit() { for (const f of this.subs) try { f(); } catch {} },

  init() {
    if (this._wired) return;
    this._wired = true;
    // per-frame E2E needs WebRTC Encoded Transforms + WebCrypto
    this.E2EE_OK = E2E.ok && typeof RTCRtpSender !== "undefined" && !!RTCRtpSender.prototype.createEncodedStreams;
    this.audio = new Audio(); this.audio.autoplay = true;
    try { this.log = (Account.unlocked && Account.store.callLog) || JSON.parse(localStorage.getItem("friday.calllog") || "[]"); } catch { this.log = []; }
    Net.onApp((m) => this.signal(m));
    Net.onPeers(() => { if (this.peerId && !Net.peers.has(this.peerId) && this.state !== "idle") this.hangup("Peer left the mesh"); this.emit(); });
  },

  async mic() {
    if (this.local) return this.local;
    this.local = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
    return this.local;
  },
  newPC() {
    const pc = new RTCPeerConnection({ iceServers: Net.STUN, encodedInsertableStreams: this.E2EE_OK });
    pc.ontrack = (e) => {
      this.remote = e.streams[0]; this.audio.srcObject = this.remote;
      if (this.frameE2EE && this.frameKey && e.receiver) this.wireReceiver(e.receiver);  // decrypt inbound frames
    };
    pc.onconnectionstatechange = () => { if (["failed", "disconnected", "closed"].includes(pc.connectionState) && this.state === "live") this.hangup("Connection lost"); };
    return pc;
  },
  addTracks(pc) { for (const t of this.local.getTracks()) pc.addTrack(t, this.local); },

  /* ---- end-to-end frame sealing over the same X25519 key as messages ---- */
  async setupFrameCrypto(peer, peerSupports) {
    this.frameE2EE = !!(this.E2EE_OK && peerSupports && peer && peer.pub);
    if (!this.frameE2EE) return;
    try { this.frameKey = (await E2E.keyFor(peer.pub)).key; }
    catch { this.frameE2EE = false; this.frameKey = null; return; }
    this.wired = new WeakSet();   // guard: createEncodedStreams may run once per sender/receiver
    // wire the sender now, plus any receivers that already exist (the callee's inbound
    // track appears during setRemoteDescription(offer), before this runs); ontrack covers
    // receivers that appear later (the caller's, from the answer)
    const sender = this.pc.getSenders().find((s) => s.track && s.track.kind === "audio");
    if (sender) this.wireSender(sender);
    for (const r of this.pc.getReceivers()) if (r.track && r.track.kind === "audio") this.wireReceiver(r);
  },
  wireSender(sender) {
    if (this.wired.has(sender)) return; this.wired.add(sender);
    let s; try { s = sender.createEncodedStreams(); } catch { return; }
    const key = this.frameKey, self = this;
    s.readable.pipeThrough(new TransformStream({
      async transform(frame, ctrl) {
        try {
          const iv = crypto.getRandomValues(new Uint8Array(12));
          const ct = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, frame.data));
          const out = new Uint8Array(12 + ct.length); out.set(iv, 0); out.set(ct, 12);
          frame.data = out.buffer; self.encFrames++;
        } catch {}
        ctrl.enqueue(frame);
      },
    })).pipeTo(s.writable).catch(() => {});
  },
  wireReceiver(receiver) {
    if (this.wired?.has(receiver)) return; this.wired?.add(receiver);
    let s; try { s = receiver.createEncodedStreams(); } catch { return; }
    const key = this.frameKey, self = this;
    s.readable.pipeThrough(new TransformStream({
      async transform(frame, ctrl) {
        try {
          const buf = new Uint8Array(frame.data);
          const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv: buf.subarray(0, 12) }, key, buf.subarray(12));
          frame.data = pt; self.decFrames++; ctrl.enqueue(frame);
        } catch { /* undecryptable — drop the frame rather than feed garbage to the decoder */ }
      },
    })).pipeTo(s.writable).catch(() => {});
  },
  iceDone(pc) {
    return new Promise((res) => {
      if (pc.iceGatheringState === "complete") return res();
      const check = () => { if (pc.iceGatheringState === "complete") { pc.removeEventListener("icegatheringstatechange", check); res(); } };
      pc.addEventListener("icegatheringstatechange", check);
      setTimeout(res, 2500);
    });
  },
  async wrap(peer, sdp) { return E2E.ok && peer.pub ? { sealed: true, wire: await E2E.seal(peer.pub, JSON.stringify(sdp)) } : { sealed: false, sdp }; },
  async unwrap(peer, m) { return m.sealed ? JSON.parse(await E2E.open(peer.pub, m.wire)) : m.sdp; },

  async call(peer) {
    if (this.state !== "idle") return;
    this.peerId = peer.id; this.peerName = peer.name; this.state = "dialing"; this.emit();
    try {
      await this.mic();
      this.pc = this.newPC();
      this.addTracks(this.pc);                              // offerer: tracks before createOffer
      const offer = await this.pc.createOffer(); await this.pc.setLocalDescription(offer);
      await this.iceDone(this.pc);
      const w = await this.wrap(peer, this.pc.localDescription);
      Net.sendTo(peer.id, { t: "call:invite", id: Net.id, to: peer.id, fromName: Net.name, e2ee: this.E2EE_OK, ...w });
      this.state = "ringing"; this.emit();
      this._timeout = setTimeout(() => { if (this.state === "ringing") this.hangup("No answer"); }, 30000);
    } catch (e) { this.fail(e.name === "NotAllowedError" ? "Microphone blocked" : "Couldn't start the call"); }
  },

  async signal(m) {
    if (m.t === "call:invite") {
      if (this.state !== "idle") { Net.sendTo(m.id, { t: "call:busy", id: Net.id, to: m.id }); return; }
      this.incoming = { from: m.id, name: m.fromName || "Peer", ...m };
      this.peerId = m.id; this.peerName = m.fromName || "Peer"; this.state = "ringing-in"; this.emit();
      if (!WM.wins.has("calls")) WM.open("calls"); else WM.focus("calls");
    } else if (m.t === "call:accept") {
      if (this.state !== "ringing" || m.id !== this.peerId) return;
      clearTimeout(this._timeout);
      const peer = Net.peers.get(m.id);
      try {
        await this.setupFrameCrypto(peer, m.e2ee);              // seal outbound frames before media flows
        await this.pc.setRemoteDescription(new RTCSessionDescription(await this.unwrap(peer, m)));
        this.begin();
      } catch (e) { this.fail("Handshake failed"); }
    } else if (m.t === "call:decline") { if (m.id === this.peerId) this.end("Declined", true); }
    else if (m.t === "call:busy") { if (m.id === this.peerId) this.end("Busy", true); }
    else if (m.t === "call:bye") { if (m.id === this.peerId) this.end("Call ended", true); }
  },

  async accept() {
    if (this.state !== "ringing-in" || !this.incoming) return;
    const inc = this.incoming, peer = Net.peers.get(inc.from);
    try {
      await this.mic();
      this.pc = this.newPC();
      // answerer: setRemoteDescription first, then attach tracks so they bind to the
      // transceiver the offer created (per spec) rather than spawning a second one
      await this.pc.setRemoteDescription(new RTCSessionDescription(await this.unwrap(peer, inc)));
      this.addTracks(this.pc);
      await this.setupFrameCrypto(peer, inc.e2ee);              // seal outbound frames before media flows
      const answer = await this.pc.createAnswer(); await this.pc.setLocalDescription(answer);
      await this.iceDone(this.pc);
      const w = await this.wrap(peer, this.pc.localDescription);
      Net.sendTo(inc.from, { t: "call:accept", id: Net.id, to: inc.from, e2ee: this.E2EE_OK, ...w });
      this.incoming = null; this.begin();
    } catch (e) { this.fail(e.name === "NotAllowedError" ? "Microphone blocked" : "Couldn't answer"); }
  },
  decline() { if (this.incoming) { Net.sendTo(this.incoming.from, { t: "call:decline", id: Net.id, to: this.incoming.from }); this.reset(); this.note = "Declined"; this.emit(); } },

  begin() { this.state = "live"; this.t0 = Date.now(); this.muted = false; this.emit(); },
  hangup(note) { if (this.peerId) Net.sendTo(this.peerId, { t: "call:bye", id: Net.id, to: this.peerId }); this.end(note || "Call ended", false); },
  end(note, remote) {
    if (this.state === "live") this.record();
    this.reset(); this.note = note; this.emit();
  },
  fail(note) { this.reset(); this.note = note; this.emit(); },
  reset() {
    clearTimeout(this._timeout);
    try { this.pc?.close(); } catch {}
    if (this.local) { this.local.getTracks().forEach((t) => t.stop()); this.local = null; }
    if (this.audio) this.audio.srcObject = null;
    this.pc = this.remote = this.incoming = null; this.peerId = null; this.state = "idle"; this.muted = false;
    this.frameE2EE = false; this.frameKey = null; this.encFrames = 0; this.decFrames = 0; this.wired = null;
  },
  toggleMute() { this.muted = !this.muted; this.local?.getAudioTracks().forEach((t) => (t.enabled = !this.muted)); this.emit(); },

  record() {
    const secs = ((Date.now() - this.t0) / 1000) | 0;
    this.log.unshift({ name: this.peerName, when: Date.now(), secs });
    this.log = this.log.slice(0, 12);
    // auto-save — encrypted in the vault when signed in, else local
    if (Account.unlocked) { Account.save({ callLog: this.log }); try { localStorage.removeItem("friday.calllog"); } catch {} }
    else try { localStorage.setItem("friday.calllog", JSON.stringify(this.log)); } catch {}
  },
  clock() { const s = ((Date.now() - this.t0) / 1000) | 0; return String((s / 60) | 0).padStart(2, "0") + ":" + String(s % 60).padStart(2, "0"); },
};

Apps.calls = {
  name: "Calls", title: "CALLS · PROJECT DARK SUN", icon: Icons.calls, w: 800, h: 560,
  render(body) {
    Call.init();
    const rail = el("aside", "rail");
    rail.append(el("div", "mono rail-head", "LIVE NODES · SECURE LINE"));
    const list = el("div");
    const logHead = el("div", "mono rail-head", "RECENT"); logHead.style.paddingTop = "12px";
    const logList = el("div");
    rail.append(list, logHead, logList, el("div", "mono rail-foot", "WEBRTC VOICE · NO SERVER<br>EACH FRAME SEALED · X25519 · AES-256-GCM<br>OVER DTLS-SRTP · SDP SEALED PER-PEER"));

    const stage = el("section", "content");
    const inner = el("div", "call-stage");
    stage.append(inner);
    body.append(rail, stage);
    let selected = null;   // peer id chosen while idle
    let raf = null, clockTimer = null;

    const stopAnim = () => { if (raf) cancelAnimationFrame(raf), (raf = null); if (clockTimer) clearInterval(clockTimer), (clockTimer = null); };

    const drawRail = () => {
      list.replaceChildren();
      const peers = [...Net.peers.values()];
      if (!peers.length) list.append(el("div", "t-sub", "No one on the mesh yet. Open Friday in another tab or window, or Mesh ▸ Link a device — then call across it."));
      for (const p of peers) {
        const b = el("button", "rail-item" + (p.id === selected ? " active" : ""));
        b.innerHTML = `<span class="who" style="width:24px;height:24px;border-radius:50%;display:grid;place-items:center;font-size:9px;font-weight:600;background:color-mix(in srgb,var(--rule) 18%,transparent)">${initials(p.name)}</span> ${esc(p.name)}` + (p.pub ? "" : ` <span class="t-sub" style="margin-left:auto">no key</span>`);
        b.addEventListener("click", () => { if (Call.state === "idle") { selected = p.id; draw(); } });
        list.append(b);
      }
      logList.replaceChildren();
      if (!Call.log.length) logList.append(el("div", "t-sub", "No calls yet."));
      for (const c of Call.log.slice(0, 6)) {
        const mm = String((c.secs / 60) | 0).padStart(2, "0") + ":" + String(c.secs % 60).padStart(2, "0");
        const row = el("div", "t-sub");
        row.style.cssText = "display:flex;gap:8px;padding:3px 10px";
        row.innerHTML = `<span>${esc(c.name)}</span><span class="mono" style="margin-left:auto;font-size:8px">${mm}</span>`;
        logList.append(row);
      }
    };

    const avatarFor = (id, name) => `<div class="call-avatar">${initials(name || (Net.peers.get(id)?.name) || "··")}</div>`;

    const draw = () => {
      stopAnim();
      drawRail();
      const s = Call.state;
      if (s === "ringing-in") {
        inner.classList.remove("live");
        inner.innerHTML = `${avatarFor(Call.peerId, Call.peerName)}
          <div class="call-name">${esc(Call.peerName)}</div>
          <div class="call-sub">Incoming sealed call…</div>
          <div class="mono kicker">WEBRTC · SDP SEALED · X25519</div>
          <div class="call-actions">
            <button class="call-btn go" aria-label="Answer">${Icons.phone}</button>
            <button class="call-btn end" aria-label="Decline">${Icons.phoneDown}</button>
          </div>`;
        inner.querySelector(".go").addEventListener("click", () => Call.accept());
        inner.querySelector(".end").addEventListener("click", () => Call.decline());
        return;
      }
      if (s === "dialing" || s === "ringing") {
        inner.classList.remove("live");
        inner.innerHTML = `${avatarFor(Call.peerId, Call.peerName)}
          <div class="call-name">${esc(Call.peerName)}</div>
          <div class="call-sub">${s === "dialing" ? "Sealing the line…" : "Ringing…"}</div>
          <div class="mono kicker">EXCHANGING SEALED SDP · GATHERING ICE</div>
          <div class="call-actions"><button class="call-btn end" aria-label="Cancel">${Icons.phoneDown}</button></div>`;
        inner.querySelector(".end").addEventListener("click", () => Call.hangup("Cancelled"));
        return;
      }
      if (s === "live") {
        inner.classList.add("live");
        const sealLabel = Call.frameE2EE ? "END-TO-END SEALED · X25519 · AES-256-GCM PER FRAME" : "CONNECTED · DTLS-SRTP · TRANSPORT ENCRYPTED";
        inner.innerHTML = `${avatarFor(Call.peerId, Call.peerName)}
          <div class="call-name">${esc(Call.peerName)}</div>
          <div class="call-sub" id="call-clock">00:00</div>
          <div class="wave" id="wave">${"<i></i>".repeat(20)}</div>
          <div class="mono kicker">${sealLabel} · NO SERVER</div>
          <div class="mono kicker" id="seal-proof" style="margin-top:-2px"></div>
          <div class="call-actions">
            <button class="call-btn mute${Call.muted ? " on" : ""}" aria-label="Mute">${Icons.mic}</button>
            <button class="call-btn end" aria-label="End call">${Icons.phoneDown}</button>
          </div>`;
        const clock = inner.querySelector("#call-clock");
        const proof = inner.querySelector("#seal-proof");
        const tickProof = () => { proof.innerHTML = Call.frameE2EE ? `<span style="color:#2E7D4F">◉</span> ${Call.encFrames.toLocaleString()} frames sealed · ${Call.decFrames.toLocaleString()} opened` : ""; };
        clockTimer = setInterval(() => { clock.textContent = Call.clock(); tickProof(); }, 500);
        clock.textContent = Call.clock(); tickProof();
        inner.querySelector(".mute").addEventListener("click", (e) => { Call.toggleMute(); e.currentTarget.classList.toggle("on", Call.muted); });
        inner.querySelector(".end").addEventListener("click", () => Call.hangup("Call ended"));
        startWave(inner.querySelector("#wave"));
        return;
      }
      // idle
      inner.classList.remove("live");
      const peer = selected && Net.peers.get(selected);
      if (!peer) {
        inner.innerHTML = `<div class="mono kicker">PROJECT DARK SUN · WEBRTC VOICE</div>
          <div class="call-name" style="font-size:22px">Pick a node to call<em>.</em></div>
          <div class="call-sub" style="max-width:40ch;text-align:center">Real peer-to-peer voice — your mic, sealed signaling, DTLS-SRTP media. ${Call.note ? esc(Call.note) + "." : "Choose a live node on the left."}</div>`;
        return;
      }
      inner.innerHTML = `${avatarFor(peer.id, peer.name)}
        <div class="call-name">${esc(peer.name)}</div>
        <div class="call-sub">${peer.pub ? "Ready to seal the line" : "This peer has no E2E key — signaling won't be sealed"}</div>
        <div class="mono kicker">${Call.note ? esc(Call.note.toUpperCase()) + " · " : ""}LINE IS DARK · READY</div>
        <div class="call-actions"><button class="call-btn go" aria-label="Call">${Icons.phone}</button></div>`;
      inner.querySelector(".go").addEventListener("click", () => Call.call(peer));
    };

    // real amplitude — analyse the live audio and drive the bars
    const startWave = (wave) => {
      if (!wave) return;
      const bars = [...wave.querySelectorAll("i")];
      bars.forEach((b) => (b.style.animation = "none"));
      const stream = Call.remote || Call.local;
      let analyser = null, buf = null;
      try {
        const AC = window.AudioContext || window.webkitAudioContext;
        const ctx = (Call._ac = Call._ac || new AC());
        if (ctx.state === "suspended") ctx.resume();
        if (stream) {
          const src = ctx.createMediaStreamSource(stream);
          analyser = ctx.createAnalyser(); analyser.fftSize = 64;
          src.connect(analyser);
          buf = new Uint8Array(analyser.frequencyBinCount);
        }
      } catch {}
      const tick = () => {
        if (Call.state !== "live") return;
        if (analyser) {
          analyser.getByteFrequencyData(buf);
          bars.forEach((b, i) => {
            const v = buf[(i * buf.length / bars.length) | 0] / 255;
            b.style.height = (7 + v * 27).toFixed(1) + "px";
          });
        }
        raf = requestAnimationFrame(tick);
      };
      tick();
    };

    this._unsub = [Call.onChange(draw), Net.onPeers(drawRail)];
    draw();
    this.teardown = () => { stopAnim(); this._unsub?.forEach((u) => u()); this._unsub = null; };
  },
};

/* ---------------- Reed-Solomon (REAL erasure code over GF(2⁸), poly 0x11D) ----
   A systematic MDS code: the (k+m)×k encode matrix is the identity on top and a
   Cauchy matrix below, so *any* k of the k+m shards invert back to the data —
   the mathematical guarantee behind "lose nodes, rebuild the file". Encode +
   decode are exact over the finite field; verified against random loss patterns. */
const RS = {
  EXP: new Uint8Array(512), LOG: new Uint8Array(256), _ready: false,
  _init() {
    if (this._ready) return;
    let x = 1;
    for (let i = 0; i < 255; i++) { this.EXP[i] = x; this.LOG[x] = i; x <<= 1; if (x & 0x100) x ^= 0x11d; }
    for (let i = 255; i < 512; i++) this.EXP[i] = this.EXP[i - 255];
    this._ready = true;
  },
  mul(a, b) { if (!a || !b) return 0; return this.EXP[this.LOG[a] + this.LOG[b]]; },
  inv(a) { return this.EXP[255 - this.LOG[a]]; },

  matrix(k, m) {                          // [ I_k ; Cauchy(m×k) ] — x_i=i, y_j=m+j (disjoint)
    this._init();
    const M = Array.from({ length: k + m }, () => new Uint8Array(k));
    for (let i = 0; i < k; i++) M[i][i] = 1;
    for (let i = 0; i < m; i++) for (let j = 0; j < k; j++) M[k + i][j] = this.inv(i ^ (m + j));
    return M;
  },
  invert(A) {                             // Gauss-Jordan over GF(256)
    const n = A.length;
    const M = A.map((r) => Uint8Array.from(r));
    const I = Array.from({ length: n }, (_, i) => { const r = new Uint8Array(n); r[i] = 1; return r; });
    for (let c = 0; c < n; c++) {
      let p = c; while (p < n && M[p][c] === 0) p++;
      if (p === n) return null;
      if (p !== c) { [M[p], M[c]] = [M[c], M[p]]; [I[p], I[c]] = [I[c], I[p]]; }
      const pv = this.inv(M[c][c]);
      for (let j = 0; j < n; j++) { M[c][j] = this.mul(M[c][j], pv); I[c][j] = this.mul(I[c][j], pv); }
      for (let r = 0; r < n; r++) {
        if (r === c || M[r][c] === 0) continue;
        const f = M[r][c];
        for (let j = 0; j < n; j++) { M[r][j] ^= this.mul(f, M[c][j]); I[r][j] ^= this.mul(f, I[c][j]); }
      }
    }
    return I;
  },
  encode(bytes, k, m) {                    // → { shards:[k+m], len, origLen, k, m }
    this._init();
    const len = Math.ceil(bytes.length / k) || 1;
    const shards = [];
    for (let i = 0; i < k; i++) { const s = new Uint8Array(len); s.set(bytes.subarray(i * len, Math.min((i + 1) * len, bytes.length))); shards.push(s); }
    const M = this.matrix(k, m);
    for (let i = 0; i < m; i++) {
      const p = new Uint8Array(len);
      for (let j = 0; j < k; j++) { const row = M[k + i][j], sj = shards[j]; if (!row) continue; for (let b = 0; b < len; b++) p[b] ^= this.mul(row, sj[b]); }
      shards.push(p);
    }
    return { shards, len, origLen: bytes.length, k, m };
  },
  decode(present, meta) {                  // present[i] = shard bytes or null; needs ≥ k
    const { k, m, len, origLen } = meta;
    const M = this.matrix(k, m);
    const have = [];
    for (let i = 0; i < k + m && have.length < k; i++) if (present[i]) have.push(i);
    if (have.length < k) throw new Error("too many shards lost");
    const inv = this.invert(have.map((i) => M[i]));
    if (!inv) throw new Error("singular submatrix");
    const data = [];
    for (let j = 0; j < k; j++) {
      const d = new Uint8Array(len);
      for (let t = 0; t < k; t++) { const f = inv[j][t]; if (!f) continue; const st = present[have[t]]; for (let b = 0; b < len; b++) d[b] ^= this.mul(f, st[b]); }
      data.push(d);
    }
    const out = new Uint8Array(origLen);
    for (let j = 0; j < k; j++) { const off = j * len; if (off >= origLen) break; out.set(data[j].subarray(0, Math.min(len, origLen - off)), off); }
    return out;
  },
  // rebuild every shard from the recovered data (re-encode) — used to "heal" the grid
  reencode(dataBytes, meta) { return this.encode(dataBytes, meta.k, meta.m).shards; },
};

/* ---------------- Vault (REAL · encrypt-then-erasure-code, Tahoe-LAFS style) ---
   Pick any file. It's sealed with a fresh AES-256-GCM key (the read capability),
   then the *ciphertext* is Reed-Solomon coded into K data + M parity shards —
   so no single shard reveals anything, and any K of the K+M rebuild the file.
   Seize shards (click them, or the button); reconstruct runs the real decoder,
   AES-GCM-decrypts, and verifies the recovered bytes against the original's
   SHA-256. Everything happens in this browser; nothing is faked. */
const sha256hex = async (bytes) => [...new Uint8Array(await crypto.subtle.digest("SHA-256", bytes))].map((n) => n.toString(16).padStart(2, "0")).join("");
const humanSize = (n) => n < 1024 ? n + " B" : n < 1048576 ? (n / 1024).toFixed(1) + " KB" : (n / 1048576).toFixed(1) + " MB";

const Vault = {
  K: 10, M: 6, CAP: 25 * 1024 * 1024,     // 25 MB cap keeps encode/decode instant
  current: null,   // { name, origLen, sha, keyRaw, iv, meta, present:[bool] }

  async ingest(file) {
    const bytes = new Uint8Array(await file.arrayBuffer());
    const keyRaw = crypto.getRandomValues(new Uint8Array(32));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const key = await crypto.subtle.importKey("raw", keyRaw, "AES-GCM", false, ["encrypt", "decrypt"]);
    const ct = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, bytes));
    const sha = await sha256hex(bytes);
    const meta = RS.encode(ct, this.K, this.M);           // erasure-code the ciphertext
    this.current = { name: file.name, origLen: bytes.length, sha, keyRaw, iv, meta, present: meta.shards.map(() => true) };
    return this.current;
  },
  reachable() { return this.current ? this.current.present.filter(Boolean).length : 0; },
  recoverable() { return this.reachable() >= this.K; },

  async reconstruct() {
    const c = this.current;
    const shards = c.meta.shards.map((s, i) => (c.present[i] ? s : null));
    const ct = RS.decode(shards, c.meta);                 // real erasure decode → ciphertext
    const key = await crypto.subtle.importKey("raw", c.keyRaw, "AES-GCM", false, ["decrypt"]);
    const plain = new Uint8Array(await crypto.subtle.decrypt({ name: "AES-GCM", iv: c.iv }, key, ct));
    const sha = await sha256hex(plain);
    c.meta.shards = RS.reencode(ct, c.meta);              // heal: every shard back on the grid
    c.present = c.meta.shards.map(() => true);
    return { plain, ok: sha === c.sha, sha };
  },
};

Apps.vault = {
  name: "Vault", title: "VAULT · ERASURE CODED", icon: Icons.vault, w: 900, h: 580,
  render(body) {
    const rail = el("aside", "rail");
    rail.append(el("div", "mono rail-head", "DISTRIBUTED SHARDS"));
    const list = el("div");
    rail.append(list, el("div", "mono rail-foot", `REED-SOLOMON GF(2⁸) · 0x11D<br>${Vault.K} DATA + ${Vault.M} PARITY · ANY ${Vault.K} OF ${Vault.K + Vault.M}<br>ENCRYPT-THEN-SHARD · NO SHARD REVEALS THE FILE`));
    const content = el("section", "content");
    const scroll = el("div", "content-scroll");
    content.append(scroll);
    body.append(rail, content);
    let recovered = null;   // { blob, name }

    const pickFile = () => {
      const inp = el("input"); inp.type = "file";
      inp.addEventListener("change", () => inp.files[0] && ingest(inp.files[0]));
      inp.click();
    };
    const ingest = async (file) => {
      if (file.size > Vault.CAP) { alert(`Keep it under ${humanSize(Vault.CAP)} for this demo — the codec runs on the main thread.`); return; }
      recovered = null;
      scroll.innerHTML = `<div class="mono kicker">SEALING · ERASURE CODING</div><div class="set-sub">Encrypting ${esc(file.name)} and computing ${Vault.K + Vault.M} shards…</div>`;
      try { await Vault.ingest(file); draw(); }
      catch (e) { scroll.innerHTML = `<div class="set-sub">Couldn't process that file: ${esc(e.message)}</div>`; }
    };

    const drawRail = () => {
      list.replaceChildren();
      const c = Vault.current;
      if (c) {
        const b = el("button", "file-row active");
        b.innerHTML = `<span class="file-ico">${Icons.vault.replace('viewBox="0 0 24 24"', 'viewBox="0 0 24 24" width="16" height="16"')}</span>
          <span><div class="file-name">${esc(c.name)}</div><div class="file-sub">${humanSize(c.origLen)} · ${Vault.reachable()}/${c.meta.shards.length} shards</div></span>`;
        list.append(b);
      }
      const add = el("button", "rail-item", "+ Seal a file");
      add.style.cssText = "width:auto;margin-top:8px;background:color-mix(in srgb,var(--accent) 14%,transparent)";
      add.addEventListener("click", pickFile);
      list.append(add);
    };

    const drawEmpty = () => {
      drawRail();
      const drop = el("div", "vault-drop");
      drop.innerHTML = `<div class="mono kicker">TAHOE-LAFS GRID · REAL ERASURE CODING</div>
        <div class="h-display" style="margin:4px 0 6px">Seal a file into the mesh<em>.</em></div>
        <div class="set-sub" style="max-width:52ch">Drop a file here, or choose one. Friday encrypts it with a fresh AES-256-GCM key, then Reed-Solomon-codes the ciphertext into ${Vault.K} data + ${Vault.M} parity shards. Lose any ${Vault.M} and the file still rebuilds — verified byte-for-byte.</div>
        <button class="rail-item" id="v-pick" style="width:auto;margin-top:16px;background:color-mix(in srgb,var(--accent) 14%,transparent)">Choose a file…</button>`;
      scroll.replaceChildren(drop);
      drop.querySelector("#v-pick").addEventListener("click", pickFile);
      drop.addEventListener("dragover", (e) => { e.preventDefault(); drop.classList.add("over"); });
      drop.addEventListener("dragleave", () => drop.classList.remove("over"));
      drop.addEventListener("drop", (e) => { e.preventDefault(); drop.classList.remove("over"); const f = e.dataTransfer.files[0]; if (f) ingest(f); });
    };

    const draw = () => {
      drawRail();
      const c = Vault.current;
      if (!c) return drawEmpty();
      const N = c.meta.shards.length;
      scroll.innerHTML = `
        <div class="mono kicker">TAHOE-LAFS GRID · REED-SOLOMON</div>
        <div class="h-display" style="margin-bottom:4px">${esc(c.name)}</div>
        <div class="set-sub">${humanSize(c.origLen)} · sealed AES-256-GCM, then coded into ${Vault.K} data + ${Vault.M} parity shards. SHA-256 <span class="mono" style="font-size:9px">${c.sha.slice(0, 16)}…</span></div>
        <div class="pane" style="margin-top:14px">
          <div class="mono kicker">SHARD MAP · CLICK A SHARD TO SEIZE OR RESTORE ITS NODE</div>
          <div class="shard-grid" id="shards"></div>
          <div class="legend mono">
            <span><i style="background:color-mix(in srgb,var(--rule) 28%,transparent)"></i>DATA</span>
            <span><i style="background:color-mix(in srgb,var(--signal) 30%,transparent)"></i>PARITY</span>
            <span><i style="background:transparent;border:1px solid var(--pane-edge)"></i>SEIZED · OFFLINE</span>
          </div>
          <div class="hex-peek mono" id="peek"></div>
        </div>
        <div style="display:flex;gap:10px;margin-top:14px;align-items:center;flex-wrap:wrap">
          <button class="rail-item" id="seize" style="width:auto;background:var(--pane-bg);border:1px solid var(--pane-edge)">Seize a node</button>
          <button class="rail-item" id="rebuild" style="width:auto;background:color-mix(in srgb,var(--accent) 14%,transparent)">Reconstruct &amp; verify</button>
          <button class="rail-item" id="dl" style="width:auto;background:var(--pane-bg);border:1px solid var(--pane-edge);display:none">Download recovered file</button>
          <span class="set-sub" id="vstat" style="flex:1;min-width:16ch"></span>
        </div>`;
      const grid = scroll.querySelector("#shards");
      const status = scroll.querySelector("#vstat");
      const dlBtn = scroll.querySelector("#dl");
      const peek = scroll.querySelector("#peek");

      const setStatus = () => {
        const r = Vault.reachable(), rec = Vault.recoverable();
        status.innerHTML = rec
          ? `<span style="color:#2E7D4F">${r}/${N} shards reachable — recoverable (need ${Vault.K}).</span>`
          : `<span style="color:var(--carmine)">${r}/${N} shards reachable — BELOW ${Vault.K}, unrecoverable. Restore a node.</span>`;
      };
      const cells = [];
      const drawGrid = () => {
        grid.replaceChildren();
        cells.length = 0;
        c.meta.shards.forEach((sh, i) => {
          const cell = el("div", "shard" + (i >= Vault.K ? " parity" : "") + (c.present[i] ? "" : " lost"));
          cell.title = (i < Vault.K ? "Data shard " : "Parity shard ") + i + " — click to " + (c.present[i] ? "seize" : "restore");
          cell.addEventListener("click", () => { c.present[i] = !c.present[i]; cell.classList.toggle("lost", !c.present[i]); setStatus(); drawRail(); showPeek(i); });
          grid.append(cell); cells.push(cell);
        });
      };
      const showPeek = (i) => {
        const sh = c.meta.shards[i] || c.meta.shards[0];
        const hex = [...sh.slice(0, 16)].map((b) => b.toString(16).padStart(2, "0")).join(" ");
        peek.innerHTML = `SHARD ${i ?? 0} · ${sh.length} B · ${i >= Vault.K ? "PARITY" : "DATA"} — CIPHERTEXT, MEANINGLESS ALONE<br>${hex} …`;
      };

      drawGrid(); setStatus(); showPeek(0);

      scroll.querySelector("#seize").addEventListener("click", () => {
        const live = c.present.map((p, i) => (p ? i : -1)).filter((i) => i >= 0);
        if (!live.length) return;
        const i = live[Math.random() * live.length | 0];
        c.present[i] = false; cells[i].classList.add("lost"); setStatus(); drawRail(); showPeek(i);
      });
      scroll.querySelector("#rebuild").addEventListener("click", async () => {
        if (!Vault.recoverable()) { setStatus(); return; }
        status.textContent = "Reconstructing from surviving shards…";
        dlBtn.style.display = "none";
        try {
          const { plain, ok, sha } = await Vault.reconstruct();
          drawGrid(); setStatus();
          recovered = { blob: new Blob([plain]), name: c.name };
          status.innerHTML = ok
            ? `<span style="color:#2E7D4F">✓ Rebuilt ${humanSize(plain.length)} from ${Vault.K} shards · SHA-256 matches the original.</span>`
            : `<span style="color:var(--carmine)">✗ Rebuilt, but SHA-256 differs (${sha.slice(0, 12)}…).</span>`;
          if (ok) dlBtn.style.display = "";
        } catch (e) {
          status.innerHTML = `<span style="color:var(--carmine)">Reconstruction failed: ${esc(e.message)}</span>`;
        }
      });
      dlBtn.addEventListener("click", () => {
        if (!recovered) return;
        const url = URL.createObjectURL(recovered.blob);
        const a = el("a"); a.href = url; a.download = recovered.name; a.click();
        setTimeout(() => URL.revokeObjectURL(url), 4000);
      });
    };

    if (Vault.current) draw(); else drawEmpty();
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
      { act: "VOICE", what: "Dark Sun call sealed — WebRTC · DTLS-SRTP · X25519", who: "GR", when: "Thu 16:48" },
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

      // account — real, encrypted
      const pf = el("div", "pane set-section");
      pf.append(el("div", "set-title", "Account"));
      if (Account.unlocked) {
        const ini = Account.name.split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase();
        const row = el("div", "set-row profile-card");
        row.innerHTML = `<span class="who">${esc(ini)}</span><div style="flex:1"><div class="set-label">${esc(Account.name)}</div><div class="set-sub">Signed in · vault encrypted at rest · ${E2E.alg} identity</div></div><span class="mono" style="color:#2E7D4F">● UNLOCKED</span>`;
        pf.append(row);
        const fpRow = el("div", "set-row");
        fpRow.innerHTML = `<div><div class="set-label">Identity fingerprint</div><div class="set-sub mono" id="acct-fp">computing…</div></div>`;
        pf.append(fpRow);
        E2E.fingerprint(Account.identity.pubRaw, Account.identity.pubRaw).then((fp) => { const e = scroll.querySelector("#acct-fp"); if (e) e.textContent = fp; });
        // staying signed in — an explicit, reversible trade
        const me = Account.logins().find((l) => l.id === Account.id);
        const remRow = el("div", "set-row");
        remRow.innerHTML = `<div><div class="set-label">Keep me signed in on this device</div><div class="set-sub">Holds this vault's key here so Friday opens without the passphrase. Anyone who can open this browser profile can then open this account. Your passphrase is never stored either way.</div></div>`;
        const remSw = el("button", "switch" + (me?.remembered ? " on" : ""));
        remSw.setAttribute("role", "switch");
        remSw.setAttribute("aria-checked", String(!!me?.remembered));
        remSw.addEventListener("click", async () => {
          const on = !remSw.classList.contains("on");
          if (on) {
            const kept = await Remember.put(Account.id, Account._key);
            Account.touch(Account.id, { remembered: kept });
            if (!kept) return;
          } else {
            await Remember.drop(Account.id);
            Account.touch(Account.id, { remembered: false });
          }
          remSw.classList.toggle("on", on);
          remSw.setAttribute("aria-checked", String(on));
        });
        remRow.append(remSw);
        pf.append(remRow);

        const acts = el("div", "set-row");
        acts.style.cssText = "gap:10px;flex-wrap:wrap";
        const lock = el("button", "rail-item", "Lock now");
        lock.style.cssText = "width:auto;background:color-mix(in srgb,var(--accent) 14%,transparent)";
        lock.addEventListener("click", () => Account.lock());
        const switcher = el("button", "rail-item", "Switch login…");
        switcher.style.cssText = "width:auto;background:var(--pane-bg);border:1px solid var(--pane-edge)";
        switcher.addEventListener("click", () => Account.signOut());
        const out = el("button", "rail-item", "Forget this login");
        out.style.cssText = "width:auto;background:var(--pane-bg);border:1px solid var(--pane-edge)";
        out.addEventListener("click", () => { if (confirm("Forget this login on this device?\n\nIts encrypted vault is deleted and cannot be recovered without the passphrase.")) Account.destroy(); });
        acts.append(lock, switcher, out);
        pf.append(acts);

        const others = Account.logins().filter((l) => l.id !== Account.id);
        if (others.length) pf.append(el("div", "set-sub", `${others.length} other login${others.length === 1 ? "" : "s"} remembered on this device: ${others.map((l) => esc(l.name)).join(", ")}.`));
      } else {
        pf.append(el("div", "set-sub", E2E.ok ? "No account on this device." : "Encryption unavailable — serve over https or localhost to enable accounts."));
      }
      scroll.append(pf);

      // organization — only real if a server is reachable
      const og = el("div", "pane set-section");
      og.append(el("div", "set-title", "Organization"));
      const org = Server.org();
      if (!Server.available) {
        og.append(el("div", "set-sub", "No org server reachable — Friday is running peer-to-peer only. Messages, boards, calls and the vault all still work between devices on the mesh."));
      } else if (!org) {
        const row = el("div", "set-row");
        row.innerHTML = `<div><div class="set-label">Not in an organization</div><div class="set-sub">Join one with an invite code, or create your own.</div></div>`;
        const b = el("button", "rail-item", "Join or create…");
        b.style.cssText = "width:auto;background:color-mix(in srgb,var(--accent) 14%,transparent)";
        b.addEventListener("click", () => Auth.orgStep(() => refreshOpenSettings()));
        row.append(b);
        og.append(row);
      } else {
        const head = el("div", "set-row");
        head.innerHTML = `<div><div class="set-label">${esc(org.name)}</div><div class="set-sub">You are ${esc(org.role)} · signed in as ${esc(Server.account?.name || Account.name)}</div></div>`;
        og.append(head);

        const memRow = el("div", "set-row");
        memRow.style.display = "block";
        memRow.innerHTML = `<div class="set-label" style="margin-bottom:7px">Members</div>`;
        const list = el("div");
        memRow.append(list);
        const paintMembers = (ms) => {
          list.replaceChildren();
          if (!ms.length) { list.append(el("div", "set-sub", "Loading the directory…")); return; }
          for (const m of ms) {
            const r = el("div", "transport" + (m.online ? "" : " off"));
            r.innerHTML = `<span class="t-dot"></span><span><div class="t-name">${esc(m.name)}${m.id === Server.account?.id ? " · you" : ""}</div><div class="t-sub">${esc(m.role)} · ${m.online ? "online" : "offline"}</div></span>`;
            list.append(r);
          }
        };
        paintMembers(Server.members);
        Server.loadMembers(org.id).then(paintMembers).catch(() => list.replaceChildren(el("div", "set-sub", "Could not reach the directory.")));
        og.append(memRow);

        const invRow = el("div", "set-row");
        invRow.innerHTML = `<div><div class="set-label">Invite someone</div><div class="set-sub">They enter this code when they create their account.</div></div>`;
        const codeBox = el("span", "invite-code", "····-····-····");
        const copy = el("button", "rail-item", "Copy");
        copy.style.cssText = "width:auto;background:var(--pane-bg);border:1px solid var(--pane-edge)";
        copy.addEventListener("click", async () => {
          try { await navigator.clipboard.writeText(codeBox.textContent); copy.textContent = "Copied"; setTimeout(() => (copy.textContent = "Copy"), 1200); }
          catch { const r = document.createRange(); r.selectNode(codeBox); getSelection().removeAllRanges(); getSelection().addRange(r); }
        });
        const wrap = el("div");
        wrap.style.cssText = "display:flex;gap:8px;align-items:center";
        wrap.append(codeBox, copy);
        invRow.append(wrap);
        og.append(invRow);
        Server.invite(org.id).then((r) => { codeBox.textContent = r.code; }).catch(() => { codeBox.textContent = "unavailable"; });

        og.append(el("div", "mono rail-foot", "THE SERVER SEES NAMES, PUBLIC KEYS AND MEMBERSHIP.<br>IT NEVER SEES MESSAGE PLAINTEXT — THAT STAYS SEALED END-TO-END."));
      }
      scroll.append(og);

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
        ...(Account.unlocked ? [["Lock Friday", () => Account.lock(), "⌃ ⌘ Q"]] : []),
        ...(Account.unlocked ? [["Switch login…", () => Account.signOut()]] : []),
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
    if (Account.unlocked) {
      const lk = el("button", "", Icons.lock);
      lk.setAttribute("aria-label", "Lock Friday");
      lk.style.cssText = "width:40px;height:32px;border-radius:9px;display:grid;place-items:center";
      lk.addEventListener("click", () => Account.lock());
      $("#m-top").append(lk);
    }
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
    // the board loads asynchronously — never index into it blind
    const panes = (Board.cols || []).reduce((n, c) => n + (c.cards ? c.cards.length : 0), 0);
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
        <div class="stat-n">${panes} pane${panes === 1 ? "" : "s"}</div>
        <div class="set-sub">${Server.org() ? esc(Server.org().name) : "Across the mesh"} · synced live</div>
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
  if ((e.metaKey || e.ctrlKey) && e.ctrlKey && e.key.toLowerCase() === "q" && Account.unlocked) { e.preventDefault(); Account.lock(); }
  if (e.key === "Escape") { Spotlight.hide(); ControlCenter.hide(); MenuBar.hide(); }
});

const pocket = matchMedia("(max-width: 760px)");
pocket.addEventListener("change", () => location.reload());

/* ============================================================
   AUTH GATE · the encrypted lock screen
   ============================================================ */
const Auth = {
  initials(name) { return (name || "?").split(/\s+/).filter((w) => /\w/.test(w)).map((w) => w[0]).join("").slice(0, 2).toUpperCase() || "··"; },
  ago(t) {
    if (!t) return "never";
    const s = (Date.now() - t) / 1000;
    if (s < 90) return "just now";
    if (s < 3600) return `${Math.round(s / 60)} min ago`;
    if (s < 172800) return `${Math.round(s / 3600)} h ago`;
    return new Date(t).toLocaleDateString([], { month: "short", day: "numeric" });
  },

  // the animated mark used on the brand panel — an F constellation sealed in a
  // slowly-orbiting encryption ring
  MARK: `<svg viewBox="0 0 120 120" class="auth-mark" aria-hidden="true">
    <defs>
      <linearGradient id="am-tile" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#1E2029"/><stop offset="1" stop-color="#1A3A5C"/>
      </linearGradient>
      <radialGradient id="am-glow" cx="0.5" cy="0.5" r="0.5">
        <stop offset="0" stop-color="#B3273B" stop-opacity="0.5"/><stop offset="1" stop-color="#B3273B" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect x="14" y="14" width="92" height="92" rx="26" fill="url(#am-tile)"/>
    <rect x="14" y="14" width="92" height="92" rx="26" fill="url(#am-glow)" class="am-pulse"/>
    <circle cx="60" cy="60" r="52" fill="none" stroke="#F0E8D8" stroke-opacity="0.22" stroke-width="1" stroke-dasharray="3 7" class="am-ring"/>
    <g stroke="#F0E8D8" stroke-opacity="0.85" stroke-width="3" stroke-linecap="round">
      <line x1="45" y1="38" x2="45" y2="82"/><line x1="45" y1="38" x2="78" y2="38"/><line x1="45" y1="60" x2="70" y2="60"/>
    </g>
    <g fill="#B3273B">
      <circle cx="45" cy="38" r="6"/><circle cx="78" cy="38" r="6"/><circle cx="45" cy="60" r="6.4"/><circle cx="70" cy="60" r="5.2"/><circle cx="45" cy="82" r="6"/>
    </g>
    <g fill="#F4EFE6">
      <circle cx="45" cy="38" r="2.4"/><circle cx="78" cy="38" r="2.4"/><circle cx="45" cy="60" r="2.6"/><circle cx="70" cy="60" r="2.1"/><circle cx="45" cy="82" r="2.4"/>
    </g>
  </svg>`,

  // wrap mode-specific panel content in the two-pane brand + form shell
  wrap(panelHTML) {
    const veil = el("div", "lock-veil");
    veil.innerHTML = `
      <canvas class="lock-mesh" aria-hidden="true"></canvas>
      <div class="lock-shell glass">
        <aside class="lock-brand">
          <div class="brand-top">${this.MARK}
            <div><div class="brand-word h-display">Friday</div><div class="brand-word-sub mono">EROS OFFICE</div></div>
          </div>
          <div class="brand-tag">A workspace that needs no server to be one — messages, boards, calls and storage, sealed end-to-end and carried device to device.</div>
          <ul class="brand-points mono">
            <li>END-TO-END · X25519 · AES-256-GCM</li>
            <li>YOUR KEYS NEVER LEAVE THIS DEVICE</li>
            <li>NO PASSWORD STORED, ANYWHERE</li>
          </ul>
          <div class="brand-foot mono">GLASS STONE LLC · ORANGE PIE V1 ALPHA</div>
        </aside>
        <section class="lock-panel">${panelHTML}</section>
      </div>`;
    document.body.append(veil);
    this.startMesh(veil.querySelector(".lock-mesh"));
    return veil;
  },

  // calm drifting constellation behind the card; self-stops when the veil is gone
  startMesh(canvas) {
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const N = 30;
    const nodes = Array.from({ length: N }, () => ({ x: Math.random(), y: Math.random(), vx: (Math.random() - 0.5) * 0.0005, vy: (Math.random() - 0.5) * 0.0005 }));
    const cs = getComputedStyle(document.documentElement);
    const accent = cs.getPropertyValue("--accent").trim() || "#6B1721";
    const body = cs.getPropertyValue("--body").trim() || "#1B1B1C";
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const draw = () => {
      if (!canvas.isConnected) return;
      const dpr = devicePixelRatio || 1, w = canvas.clientWidth, h = canvas.clientHeight;
      if (!w || !h) { requestAnimationFrame(draw); return; }
      if (canvas.width !== w * dpr || canvas.height !== h * dpr) { canvas.width = w * dpr; canvas.height = h * dpr; }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      if (!reduce) for (const n of nodes) { n.x += n.vx; n.y += n.vy; if (n.x < 0 || n.x > 1) n.vx *= -1; if (n.y < 0 || n.y > 1) n.vy *= -1; }
      const pts = nodes.map((n) => ({ x: n.x * w, y: n.y * h }));
      const max = Math.min(w, h) * 0.26;
      for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) {
        const d = Math.hypot(pts[i].x - pts[j].x, pts[i].y - pts[j].y);
        if (d < max) { ctx.strokeStyle = body; ctx.globalAlpha = 0.05 * (1 - d / max); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(pts[i].x, pts[i].y); ctx.lineTo(pts[j].x, pts[j].y); ctx.stroke(); }
      }
      ctx.globalAlpha = 0.22; ctx.fillStyle = accent;
      for (const p of pts) { ctx.beginPath(); ctx.arc(p.x, p.y, 1.4, 0, 7); ctx.fill(); }
      ctx.globalAlpha = 1;
      if (!reduce) requestAnimationFrame(draw);
    };
    requestAnimationFrame(draw);
  },

  // a small "sealing" strip under a passphrase field — reflects LENGTH ONLY
  // (never the value), so it evokes ciphertext without leaking anything
  cipherStrip(input) {
    const strip = el("div", "cipher-strip mono");
    strip.setAttribute("aria-hidden", "true");
    input.after(strip);
    const A = "0123456789ABCDEF";
    const render = () => {
      const n = Math.min(input.value.length, 40);
      if (!n) { strip.textContent = ""; strip.classList.remove("on"); return; }
      strip.classList.add("on");
      let s = "";
      for (let i = 0; i < n; i++) s += A[(Math.random() * 16) | 0];
      strip.textContent = "⌁ " + s;
    };
    input.addEventListener("input", render);
    return strip;
  },

  async gate(onUnlock) {
    // no WebCrypto (insecure context) → can't encrypt; let the user in with a notice.
    // ?guest=1 starts an ephemeral session (fresh keys, nothing persisted) — also the e2e hook.
    if (!E2E.ok || new URLSearchParams(location.search).has("guest")) { onUnlock(); return; }
    // returning from an OIDC full-page redirect (popup was blocked)
    if (location.hash.startsWith("#oidc=")) {
      try {
        const r = JSON.parse(decodeURIComponent(location.hash.slice(6)));
        history.replaceState(null, "", location.pathname + location.search);
        if (!r.error && r.token) {
          Server.token = r.token; Server.account = r.account;
          try { Server.orgs = (await Server.call("/me")).orgs || []; } catch {}
          const local = Account.logins().find((l) => l.federated?.accountId === r.account.id);
          return local ? this.unlockPage(local, onUnlock) : this.federatedSetup({ id: r.provider, name: r.provider }, r, onUnlock);
        }
      } catch {}
    }
    // an explicit "switch login" / "lock" lands on the picker, not straight back in
    let switching = false;
    try { switching = sessionStorage.getItem("friday.switch") === "1"; sessionStorage.removeItem("friday.switch"); } catch {}
    // a login this device is holding the key for opens straight up
    const remembered = switching ? null : Account.logins().find((l) => l.remembered);
    if (remembered) {
      const key = await Remember.get(remembered.id);
      if (key && await Account.unlockWithKey(remembered.id, key)) return this.afterUnlock(null, onUnlock);
      if (!key) Account.touch(remembered.id, { remembered: false });   // key went away
    }
    const list = Account.logins();
    if (!list.length) this.createPage(onUnlock);
    else this.loginsPage(onUnlock);
  },

  /* ---- the logins page: everyone this device remembers ---- */
  loginsPage(onUnlock, pick) {
    const list = Account.logins();
    const veil = this.wrap(`
      <div class="lock-title h-display">Welcome back<em>.</em></div>
      <div class="lock-sub mono">${list.length} LOGIN${list.length === 1 ? "" : "S"} ON THIS DEVICE</div>
      <div class="login-list" id="ll" role="list"></div>
      <div class="lock-foot mono"><button class="lock-link" id="a-add">+ Create another login</button></div>`);
    const ll = veil.querySelector("#ll");

    for (const l of list) {
      const row = el("div", "login-row");
      row.setAttribute("role", "listitem");
      const tag = l.federated ? `${esc((l.federated.providerName || l.federated.provider) || "").toUpperCase()} · ` : "";
      row.innerHTML = `
        <button class="login-pick" aria-label="Sign in as ${esc(l.name)}">
          <span class="login-ini">${l.federated ? Icons.provider(l.federated.provider) : esc(this.initials(l.name))}</span>
          <span class="login-meta"><span class="login-name">${esc(l.name)}</span>
          <span class="login-sub mono">${tag}${l.remembered ? "REMEMBERED" : "LAST USED " + esc(this.ago(l.lastUsed)).toUpperCase()}</span></span>
        </button>
        <button class="login-forget" aria-label="Forget ${esc(l.name)}" title="Forget this login">×</button>`;
      row.querySelector(".login-pick").addEventListener("click", () => { veil.remove(); this.unlockPage(l, onUnlock); });
      row.querySelector(".login-forget").addEventListener("click", () => {
        if (!confirm(`Forget “${l.name}” on this device?\n\nIts encrypted vault is deleted. Without the passphrase it cannot be recovered — but the account itself still exists in any org it joined.`)) return;
        Account.forget(l.id);
        veil.remove();
        Account.logins().length ? this.loginsPage(onUnlock) : this.createPage(onUnlock);
      });
      ll.append(row);
    }
    veil.querySelector("#a-add").addEventListener("click", () => { veil.remove(); this.createPage(onUnlock, true); });
    ll.querySelector(".login-pick")?.focus();
    if (pick) { const p = list.findIndex((l) => l.id === pick); if (p >= 0) ll.children[p].querySelector(".login-pick").click(); }
    this.providerButtons(ll, onUnlock);
  },

  /* ---- unlock one login ---- */
  unlockPage(login, onUnlock) {
    const av = login.federated ? Icons.provider(login.federated.provider) : esc(this.initials(login.name));
    const veil = this.wrap(`
      <span class="login-ini big">${av}</span>
      <div class="lock-title h-display" style="font-size:24px">${esc(login.name)}<em>.</em></div>
      <div class="lock-sub mono">${login.federated ? esc((login.federated.providerName || login.federated.provider)).toUpperCase() + " · " : ""}ENCRYPTED VAULT</div>
      <form class="lock-form" autocomplete="off">
        <input class="lock-in" id="a-pass" type="password" placeholder="Passphrase" autocomplete="current-password">
        <label class="lock-check"><input type="checkbox" id="a-remember"> <span>Keep me signed in on this device</span></label>
        <div class="lock-err" id="a-err"></div>
        <button class="lock-btn" type="submit">Unlock</button>
      </form>
      <div class="lock-foot mono"><button class="lock-link" id="a-back">← All logins</button></div>`);
    const err = veil.querySelector("#a-err"), pass = veil.querySelector("#a-pass"), btn = veil.querySelector(".lock-btn");
    this.cipherStrip(pass);
    pass.focus();
    veil.querySelector("#a-back").addEventListener("click", () => { veil.remove(); this.loginsPage(onUnlock); });

    veil.querySelector(".lock-form").addEventListener("submit", async (e) => {
      e.preventDefault();
      err.textContent = "";
      if (!pass.value) { err.textContent = "Enter your passphrase."; return; }
      btn.textContent = "Unlocking…"; btn.disabled = true;
      const slow = setTimeout(() => { if (btn.disabled) btn.textContent = "Stretching key…"; }, 900);
      try {
        const ok = await Account.unlock(login.id, pass.value);
        clearTimeout(slow);
        if (!ok) { err.textContent = "Wrong passphrase — cannot decrypt."; btn.textContent = "Unlock"; btn.disabled = false; pass.select(); return; }
        if (veil.querySelector("#a-remember").checked) {
          const kept = await Remember.put(login.id, Account._key);
          Account.touch(login.id, { remembered: kept });
        }
        await this.afterUnlock(veil, onUnlock);
      } catch (ex) {
        clearTimeout(slow);
        err.textContent = "Something went wrong. Try again.";
        btn.disabled = false; btn.textContent = "Unlock";
      }
    });
  },

  /* ---- create a new login ---- */
  createPage(onUnlock, hasOthers) {
    const veil = this.wrap(`
      <div class="lock-title h-display">Create your account<em>.</em></div>
      <div class="lock-sub mono">END-TO-END ENCRYPTED · NOTHING LEAVES THIS DEVICE</div>
      <form class="lock-form" autocomplete="off">
        <input class="lock-in" id="a-name" type="text" placeholder="Display name" autocomplete="off">
        <input class="lock-in" id="a-pass" type="password" placeholder="Choose a passphrase" autocomplete="new-password">
        <input class="lock-in" id="a-pass2" type="password" placeholder="Confirm passphrase" autocomplete="new-password">
        <label class="lock-check"><input type="checkbox" id="a-remember"> <span>Keep me signed in on this device</span></label>
        <div class="lock-err" id="a-err"></div>
        <button class="lock-btn" type="submit">Create account</button>
      </form>
      <div class="lock-foot mono">${hasOthers
        ? `<button class="lock-link" id="a-back">← All logins</button>`
        : `PBKDF2 · AES-256-GCM · KEYS SEALED ON THIS DEVICE`}</div>`);
    const err = veil.querySelector("#a-err"), pass = veil.querySelector("#a-pass"), btn = veil.querySelector(".lock-btn");
    this.cipherStrip(pass);
    veil.querySelector("#a-name").focus();
    veil.querySelector("#a-back")?.addEventListener("click", () => { veil.remove(); this.loginsPage(onUnlock); });
    veil.querySelector("#a-name").addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); pass.focus(); } });
    this.providerButtons(veil.querySelector(".lock-form"), onUnlock);

    veil.querySelector(".lock-form").addEventListener("submit", async (e) => {
      e.preventDefault();
      err.textContent = "";
      const name = veil.querySelector("#a-name").value.trim() || "Operator";
      const p1 = pass.value, p2 = veil.querySelector("#a-pass2").value;
      if (p1.length < 8) { err.textContent = "Use at least 8 characters."; return; }
      if (p1 !== p2) { err.textContent = "Passphrases do not match."; return; }
      btn.textContent = "Sealing…"; btn.disabled = true;
      try {
        const id = await Account.signup(name, p1);
        if (veil.querySelector("#a-remember").checked) {
          const kept = await Remember.put(id, Account._key);
          Account.touch(id, { remembered: kept });
        }
        await this.afterUnlock(veil, onUnlock);
      } catch (ex) {
        err.textContent = "Something went wrong. Try again.";
        btn.disabled = false; btn.textContent = "Create login";
      }
    });
  },

  /* ---- shared tail: greet the org server, then open the desktop ---- */
  async afterUnlock(veil, onUnlock, opts = {}) {
    const btn = veil?.querySelector(".lock-btn");
    if (btn) btn.textContent = "Connecting…";
    let needsOrg = false;
    if (opts.session) {
      // an OIDC session is already in hand; Server.orgs was loaded during the flow
      needsOrg = !Server.orgs.length;
    } else if (await Server.probe()) {
      try { await Server.authenticate(); needsOrg = !Server.orgs.length; }
      catch { /* server had a bad day — carry on peer-to-peer */ }
    }
    const go = () => { if (needsOrg) this.orgStep(onUnlock); else { Server.connect(); onUnlock(); } };
    if (!veil) return go();
    veil.classList.add("done");
    setTimeout(() => { veil.remove(); go(); }, 360);
  },

  /* ---- social login: OIDC proves identity, a passphrase still guards the vault ---- */
  async providerButtons(form, onUnlock) {
    if (!form.isConnected) return;           // page may have moved on during the probe
    if (!await Server.probe()) return;
    const provs = await Server.providers();
    if (!provs.length || !form.isConnected) return;
    const wrap = el("div", "oidc-wrap");
    wrap.append(el("div", "oidc-divider mono", "OR CONTINUE WITH"));
    for (const p of provs) {
      const b = el("button", "oidc-btn", `${Icons.provider(p.id)}<span>${esc(p.name)}</span>`);
      b.type = "button";
      b.addEventListener("click", () => this.oidcFlow(p, onUnlock));
      wrap.append(b);
    }
    form.after(wrap);
  },

  async oidcFlow(provider, onUnlock) {
    const banner = document.querySelector(".lock-err");
    if (banner) banner.textContent = "";
    try {
      const sess = await Server.oidcLogin(provider.id);       // popup → federated session
      try { Server.orgs = (await Server.call("/me")).orgs || []; } catch {}
      const local = Account.logins().find((l) => l.federated?.accountId === sess.account.id);
      document.querySelector(".lock-veil")?.remove();
      if (local) return this.unlockPage(local, onUnlock);      // vault is here — just unlock it
      this.federatedSetup(provider, sess, onUnlock);           // first time on this device — set a device passphrase
    } catch (e) {
      if (String(e.message) === "cancelled") return;
      if (banner) banner.textContent = String(e.message || e);
    }
  },

  // first time a social identity is used on this device: make a local encrypted
  // vault for the mesh keys, then bind those public keys to the federated account
  federatedSetup(provider, sess, onUnlock) {
    const veil = this.wrap(`
      <span class="login-ini big">${Icons.provider(provider.id)}</span>
      <div class="lock-title h-display" style="font-size:23px">${esc(sess.account.name)}<em>.</em></div>
      <div class="lock-sub mono">SIGNED IN WITH ${esc(provider.name).toUpperCase()} · SECURE THIS DEVICE</div>
      <div class="set-sub" style="margin:2px 0 8px">Your identity is verified. Set a passphrase to encrypt this device's keys — ${esc(provider.name)} and the server never see it, and it's what keeps your data end-to-end encrypted.</div>
      <form class="lock-form" autocomplete="off">
        <input class="lock-in" id="a-pass" type="password" placeholder="Choose a device passphrase" autocomplete="new-password">
        <input class="lock-in" id="a-pass2" type="password" placeholder="Confirm passphrase" autocomplete="new-password">
        <label class="lock-check"><input type="checkbox" id="a-remember"> <span>Keep me signed in on this device</span></label>
        <div class="lock-err" id="a-err"></div>
        <button class="lock-btn" type="submit">Secure &amp; continue</button>
      </form>
      <div class="lock-foot mono"><button class="lock-link" id="a-cancel">← Back</button></div>`);
    const err = veil.querySelector("#a-err"), pass = veil.querySelector("#a-pass"), btn = veil.querySelector(".lock-btn");
    this.cipherStrip(pass);
    pass.focus();
    veil.querySelector("#a-cancel").addEventListener("click", () => { veil.remove(); this.gate(onUnlock); });

    veil.querySelector(".lock-form").addEventListener("submit", async (e) => {
      e.preventDefault();
      err.textContent = "";
      const p1 = pass.value, p2 = veil.querySelector("#a-pass2").value;
      if (p1.length < 8) { err.textContent = "Use at least 8 characters."; return; }
      if (p1 !== p2) { err.textContent = "Passphrases do not match."; return; }
      btn.textContent = "Sealing…"; btn.disabled = true;
      try {
        const id = await Account.signup(sess.account.name, p1);
        Account.touch(id, { federated: { provider: provider.id, providerName: provider.name, accountId: sess.account.id } });
        await Server.bindKeys();                    // the federated account now has this device's mesh key
        if (veil.querySelector("#a-remember").checked) {
          const kept = await Remember.put(id, Account._key);
          Account.touch(id, { remembered: kept });
        }
        await this.afterUnlock(veil, onUnlock, { session: true });
      } catch (ex) {
        err.textContent = "Something went wrong. Try again.";
        btn.disabled = false; btn.textContent = "Secure & continue";
      }
    });
  },

  /* create an org, or join one with an invite code */
  orgStep(done) {
    const veil = this.wrap(`
      <div class="lock-title h-display">Your organization<em>.</em></div>
      <div class="lock-sub mono">SIGNED IN AS ${esc(Account.name || "")}</div>
      <div class="org-tabs" role="tablist">
        <button class="org-tab on" id="t-join" role="tab" aria-selected="true">Join an org</button>
        <button class="org-tab" id="t-make" role="tab" aria-selected="false">Create one</button>
      </div>
      <form class="lock-form" autocomplete="off">
        <div id="org-pane"></div>
        <div class="lock-err" id="o-err"></div>
        <button class="lock-btn" type="submit" id="o-go">Join</button>
      </form>
      <div class="lock-foot mono"><button class="lock-link" id="o-skip">Skip — use Friday on this device only</button></div>`);
    const pane = veil.querySelector("#org-pane");
    const err = veil.querySelector("#o-err");
    const go = veil.querySelector("#o-go");
    let mode = "join";

    const paint = () => {
      pane.innerHTML = mode === "join"
        ? `<input class="lock-in" id="o-code" placeholder="Invite code — ABCD-EFGH-JKMN" autocomplete="off" spellcheck="false" style="text-transform:uppercase">
           <div class="set-sub" style="text-align:left;margin-top:2px">Ask a member for a code. Joining shares your name and public key with that org.</div>`
        : `<input class="lock-in" id="o-name" placeholder="Organization name" autocomplete="off">
           <div class="set-sub" style="text-align:left;margin-top:2px">You'll be the owner, and get an invite code to hand out.</div>`;
      go.textContent = mode === "join" ? "Join" : "Create organization";
      veil.querySelector("#t-join").classList.toggle("on", mode === "join");
      veil.querySelector("#t-make").classList.toggle("on", mode === "make");
      veil.querySelector("#t-join").setAttribute("aria-selected", String(mode === "join"));
      veil.querySelector("#t-make").setAttribute("aria-selected", String(mode === "make"));
      pane.querySelector("input").focus();
    };
    veil.querySelector("#t-join").addEventListener("click", () => { mode = "join"; err.textContent = ""; paint(); });
    veil.querySelector("#t-make").addEventListener("click", () => { mode = "make"; err.textContent = ""; paint(); });
    paint();

    const finish = () => { veil.classList.add("done"); setTimeout(() => { veil.remove(); Server.connect(); done(); }, 360); };

    veil.querySelector(".lock-form").addEventListener("submit", async (e) => {
      e.preventDefault();
      err.textContent = ""; go.disabled = true;
      const label = go.textContent;
      try {
        if (mode === "join") {
          const code = veil.querySelector("#o-code").value.trim().toUpperCase();
          if (!code) { err.textContent = "Enter the invite code."; go.disabled = false; return; }
          go.textContent = "Joining…";
          await Server.joinOrg(code);
        } else {
          const name = veil.querySelector("#o-name").value.trim();
          if (!name) { err.textContent = "Name the organization."; go.disabled = false; return; }
          go.textContent = "Creating…";
          await Server.createOrg(name);
        }
        finish();
      } catch (ex) {
        err.textContent = String(ex.message || ex);
        go.disabled = false; go.textContent = label;
      }
    });
    veil.querySelector("#o-skip").addEventListener("click", finish);
  },
};

function bootApp() {
  Net.start();   // join the real Dark Core mesh with the account identity
  Call.init();   // always listen for incoming sealed voice calls, app open or not
  if (Server.org()) Server.loadMembers(Server.org().id).catch(() => {});

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
      setTimeout(() => WM.open(deeplink), 250);
    } else {
      setTimeout(() => WM.open("mesh"), 250);
      setTimeout(() => { WM.open("messages"); Dock.refresh(); }, 500);
    }
  }
}

applyState();
Auth.gate(bootApp);
