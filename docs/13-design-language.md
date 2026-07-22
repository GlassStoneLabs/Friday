# 13 · The Hudson Design Language

Friday's interface is set in **the Hudson Design Language (HDL), by The Acadia** —
a specification for surfaces, type, color, and motion. This page describes HDL as
Friday applies it. The governing instinct: *a material, a palette, a grid, a
voice, a horizon — nothing else, in that order.*

## The material — the Hudson Glass

One material throughout: a translucent pane that takes its color from what lies
beneath, lightly diffused. In CSS it is `backdrop-filter: blur(var(--diffusion))
saturate(1.5)` over a semi-transparent ground, with an inset specular highlight
and a soft drop shadow (`.glass`). Diffusion is tunable (Settings ▸ glass); panes
can stack, deepening like a second coat of varnish.

## The palette — the Hudson Nine

Three triads — earth (ground), water (structure), accent (voice). Color is used
to point, not to decorate: one accent at full strength per surface, used once.

| Token | Light | Dark |
|---|---|---|
| `--ground` | `#F4EFE6` Parchment | `#131316` Anthracite |
| `--raised` | `#ECDFCA` Dune | `#1C1C1F` |
| `--rule` (Atlantic) | `#1A3A5C` | `#274B72` |
| `--carmine` | `#6B1721` | `#9A2531` (embered) |
| `--signal` | `#D8A72A` | `#E29B32` (lantern) |
| `--accent` | = carmine (choose carmine / atlantic / signal) | — |

Everything is themed for **light and dark** — one room, two atmospheres. The
accent doesn't move between modes; only the air around it does.

## Type — four voices

| Family | Role |
|---|---|
| **Bodoni Moda** (`--font-display`) | display serif — titles, the carved first word |
| **EB Garamond** (`--font-editorial`) | editorial serif — long-form reading |
| **Quicksand** (`--font-sans`) | humanist sans — UI, captions, labels |
| **Martian Mono** (`--font-mono`) | monospace — IDs, versions, the maker's mark |

Headlines use `.h-display` with an italic accent (`<em>`) for the terminal word.
Mono is small, tracked, uppercase — a stamp, not a voice.

## Motion — how the glass breathes

One easing curve, one prohibition, four durations. *We do not bounce.*

- **Ease** — `--ease: cubic-bezier(0.22, 0.61, 0.36, 1)`: begins slowly, reaches
  terminal velocity halfway, decelerates over the rest — a heavy door closing.
- **Durations** — `--t-hover` 120ms (property hovers) · `--t-pane` 240ms (panes
  in/out) · `--t-section` 360ms (sectional) · `--t-cinema` 600ms (rare cinematic:
  boot, minimize).
- **Reduced motion** — honored without exception; panes fade instead of slide,
  the login mesh renders static. The system remains itself; it simply stops
  breathing.

## Grid & layout — a quiet Mondrian

Rectangles of varying weight, generous margin, a willingness to leave a block
empty for the sake of the others. Windows, rails, and panes follow the same
substructure; the mobile pocket pane collapses the desktop grid to a single
column with a floating glass tab bar.

## Applying it in code

- **Colors** only via CSS custom properties (never hard-coded hex in components),
  so light/dark and accent switching are free.
- **Motion** only via `var(--ease)` and the four duration steps — no arbitrary
  timings, no bounce.
- **Type** via the four `--font-*` tokens; display headings via `.h-display`.
- **Classes** to reuse: `.glass`, `.pane`, `.mono`, `.rail-item`, `.h-display`,
  `.set-row`, `.segmented`, `.switch`.

## Where you can see it

The login (two-pane glass shell over a live mesh backdrop), the desktop windows,
the dock and menu bar, and every app surface. The lock screen's "sealing" cipher
strip and the drifting constellation are HDL motion in service of meaning — the
glass receiving the world and giving it back, softened.

> HDL draws on the contemporary lineage of translucent interface materials —
> including Apple's Liquid Glass — alongside frosted architectural glass and the
> lithic quietude of limestone. It is informed by them without being reproduced
> from them; the language is original to The Acadia.
