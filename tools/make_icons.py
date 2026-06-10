#!/usr/bin/env python3
"""Render the Friday app icons (PNG) with no external dependencies.

The mark is a mesh constellation forming an "F" — five nodes joined by
network edges — set on a glass tile that runs from anthracite into
Atlantic blue. Geometry is rendered analytically with signed-distance
functions and 1px smoothstep anti-aliasing.
"""
import math
import struct
import zlib
from pathlib import Path

OUT = Path(__file__).resolve().parent.parent / "assets" / "icons"

# Hudson palette
BG_TOP = (30, 32, 41)        # anthracite, warmed
BG_BOT = (26, 58, 92)        # atlantic #1A3A5C
EDGE = (240, 232, 216)       # warm white #F0E8D8
NODE = (179, 39, 59)         # carmine, brightened for emissive screens
CORE = (244, 239, 230)       # parchment #F4EFE6

# F constellation in unit space: stem A-B-C, arms to D (top) and E (mid)
PTS = {
    "A": (0.355, 0.255), "B": (0.355, 0.505), "C": (0.355, 0.760),
    "D": (0.700, 0.255), "E": (0.625, 0.505),
}
EDGES = [("A", "B"), ("B", "C"), ("A", "D"), ("B", "E"), ("C", "E")]
RADII = {"A": 0.044, "B": 0.048, "C": 0.044, "D": 0.044, "E": 0.037}
LINE_W = 0.0165


def clamp(x, lo=0.0, hi=1.0):
    return lo if x < lo else hi if x > hi else x


def smooth(d, aa):
    """Coverage for signed distance d (negative = inside) with aa falloff."""
    return clamp(0.5 - d / aa)


def sd_round_rect(x, y, cx, cy, hw, hh, r):
    qx = abs(x - cx) - (hw - r)
    qy = abs(y - cy) - (hh - r)
    ox, oy = max(qx, 0.0), max(qy, 0.0)
    return math.hypot(ox, oy) + min(max(qx, qy), 0.0) - r


def sd_segment(x, y, ax, ay, bx, by):
    pax, pay = x - ax, y - ay
    bax, bay = bx - ax, by - ay
    h = clamp((pax * bax + pay * bay) / (bax * bax + bay * bay))
    return math.hypot(pax - bax * h, pay - bay * h)


def over(base, top, alpha):
    return tuple(base[i] + (top[i] - base[i]) * alpha for i in range(3))


def render(size):
    aa = 1.25 / size
    half = 0.5
    radius = 0.225  # macOS-style tile curvature
    px = bytearray()
    for j in range(size):
        row = bytearray()
        v = (j + 0.5) / size
        for i in range(size):
            u = (i + 0.5) / size
            d_tile = sd_round_rect(u, v, half, half, half, half, radius)
            tile_a = smooth(d_tile, aa)
            if tile_a <= 0.0:
                row += b"\x00\x00\x00\x00"
                continue
            # ground gradient
            t = clamp((v - 0.08) / 0.92)
            col = over(BG_TOP, BG_BOT, t * t * (3 - 2 * t))
            # soft carmine bloom low-left, like lamp light on lacquer
            bloom = math.exp(-(((u - 0.30) ** 2 + (v - 0.92) ** 2) / 0.10))
            col = over(col, NODE, 0.14 * bloom)
            # specular sweep across the upper face of the glass
            spec = clamp((0.46 - v) / 0.46)
            col = over(col, (255, 255, 255), 0.13 * spec * spec)
            # mesh edges
            for a, b in EDGES:
                ax, ay = PTS[a]
                bx, by = PTS[b]
                d = sd_segment(u, v, ax, ay, bx, by) - LINE_W / 2
                col = over(col, EDGE, 0.82 * smooth(d, aa))
            # nodes: halo, carmine body, parchment core
            for k, (nx, ny) in PTS.items():
                r = RADII[k]
                d = math.hypot(u - nx, v - ny)
                halo = math.exp(-((max(d - r, 0.0) / 0.05) ** 2))
                col = over(col, NODE, 0.28 * halo)
                col = over(col, NODE, smooth(d - r, aa))
                col = over(col, CORE, smooth(d - r * 0.42, aa))
            # glass edge highlight just inside the tile boundary
            edge_band = smooth(abs(d_tile + 0.006) - 0.0035, aa)
            col = over(col, (255, 255, 255), 0.20 * edge_band * (1.0 - 0.6 * v))
            a8 = round(tile_a * 255)
            row += bytes((round(clamp(c, 0, 255)) for c in col)) + bytes((a8,))
        px += b"\x00" + row  # PNG filter type 0 per row
    return bytes(px)


def write_png(path, size, raw):
    def chunk(tag, data):
        c = tag + data
        return struct.pack(">I", len(data)) + c + struct.pack(">I", zlib.crc32(c))

    ihdr = struct.pack(">IIBBBBB", size, size, 8, 6, 0, 0, 0)
    body = chunk(b"IHDR", ihdr) + chunk(b"IDAT", zlib.compress(raw, 9)) + chunk(b"IEND", b"")
    path.write_bytes(b"\x89PNG\r\n\x1a\n" + body)
    print(f"wrote {path.name} ({size}x{size})")


if __name__ == "__main__":
    OUT.mkdir(parents=True, exist_ok=True)
    for size, name in [(512, "icon-512.png"), (192, "icon-192.png"), (180, "apple-touch-icon.png")]:
        write_png(OUT / name, size, render(size))
