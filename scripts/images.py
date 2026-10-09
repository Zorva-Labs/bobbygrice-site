#!/usr/bin/env python3
"""Responsive copies of the pictures the pages show (2026-10-09).

    python3 scripts/images.py

Writes images/<name>-<width>.webp (and .avif for the two hero photos) beside
each original. The pages name only these copies, with width, height, srcset
and sizes; build.mjs leaves any image no page, manifest or schema names out of
dist/, so the multi-megabyte originals stay in the repo as sources and never
ship. Re-run after replacing an original; a copy that exists and is newer than
its source is kept.
"""
import os
from PIL import Image

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'images')
GALLERY = [f'nashvilleweddingcollection-{n}.jpg' for n in (1, 2, 3, 4, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16)]
SPEC = {
    'hero-bobby.png': ([300, 450, 600, 900], True),
    'bio-bobby.png': ([240, 320, 400, 500], True),
    'album-legacy-front.jpg': ([400, 800, 1200], False),
    'album-legacy-back.jpg': ([400, 800, 1200], False),
    'album-then-and-now.jpg': ([300, 600], False),
    'album-legend.jpg': ([300, 600], False),
    'album-bobbys-best.jpg': ([300, 600], False),
    'hat-white.jpg': ([400, 800], False),
    'koozie.jpg': ([400, 800], False),
    'gallery-1.jpg': ([450, 900], False),
    'grt-records.jpg': ([400, 800, 1200], False),
    'grt-show.jpg': ([400, 800, 1200], False),
    'bobby-johnny-k.jpg': ([280, 560], False),
    'chart-number-1.jpg': ([430, 863], False),
    'cover-then-and-now.jpg': ([400, 773], False),
    'you-lay-so-easy-cover.jpg': ([285, 571], False),
    **{g: ([400, 800], False) for g in GALLERY},
}

for name, (widths, avif) in SPEC.items():
    src = os.path.join(ROOT, name)
    stem = os.path.splitext(name)[0]
    im = Image.open(src)
    keep_alpha = im.mode in ('RGBA', 'LA') and im.getchannel('A').getextrema()[0] < 255
    im = im.convert('RGBA' if keep_alpha else 'RGB')
    for w in widths:
        w = min(w, im.width)
        h = round(im.height * w / im.width)
        small = im if w == im.width else im.resize((w, h), Image.LANCZOS)
        for ext, kw in (('webp', {'quality': 78, 'method': 6}), ('avif', {'quality': 55})):
            if ext == 'avif' and not avif:
                continue
            out = os.path.join(ROOT, f'{stem}-{w}.{ext}')
            if os.path.exists(out) and os.path.getmtime(out) >= os.path.getmtime(src):
                continue
            small.save(out, ext.upper(), **kw)
            print(f'  {os.path.basename(out)}  {w}x{h}  {os.path.getsize(out) // 1024} KB')
