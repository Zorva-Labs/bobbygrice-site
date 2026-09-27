/* The share cards: the og:image and twitter:image of every page, 1200×630 JPGs
 * made from Bobby's own pictures in images/ and set in the site's own faces.
 *
 *   node scripts/share-cards.mjs
 *
 * Each card is its page's hero in small: the same picture and the same words,
 * so a card never says what its page doesn't. Only Bobby's pictures go on a
 * card, never a generated one. Chrome draws the card and Pillow writes the JPG.
 * The faces come from Google Fonts and are inlined, so the shot never races the
 * font load.
 *
 * /images/* is served immutable for a year (_headers), so a card that changes
 * gets a new file name, and its page's og:image and twitter:image change with
 * it. Keep a card under 300 KB: WhatsApp shows no picture above that.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn, execFileSync } from 'node:child_process';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const IMG = path.join(ROOT, 'images');
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

/* The site's four faces, the latin subset of each, as data URIs. */
const FONTS = 'family=Playfair+Display:wght@900&family=Cormorant+Garamond:wght@600&family=Bebas+Neue&family=Great+Vibes&display=block';
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36';
const fontCss = await (await fetch(`https://fonts.googleapis.com/css2?${FONTS}`, { headers: { 'user-agent': UA } })).text();
const faces = [];
for (const [, face] of fontCss.matchAll(/\/\*\s*latin\s*\*\/\s*(@font-face\s*\{[^}]*\})/g)) {
  const url = face.match(/url\((https:[^)]+)\)/)[1];
  const woff2 = Buffer.from(await (await fetch(url)).arrayBuffer());
  faces.push(face.replace(url, `data:font/woff2;base64,${woff2.toString('base64')}`));
}
if (faces.length < 4) throw new Error(`Google Fonts sent ${faces.length} of the 4 faces`);
const picture = (f) => `data:image/${path.extname(f) === '.png' ? 'png' : 'jpeg'};base64,${fs.readFileSync(path.join(IMG, f)).toString('base64')}`;

const BASE = `${faces.join('\n')}
html,body{margin:0}
body{width:1200px;height:630px;overflow:hidden;position:relative;background:#0a0a0a;color:#f5f0e8;font-family:'Cormorant Garamond',serif}
.layer{position:absolute;pointer-events:none}
.eyebrow{font-family:'Bebas Neue',sans-serif;font-size:26px;letter-spacing:8px;color:#c9a84c;text-transform:uppercase;margin:0 0 8px}
.gold{font-family:'Playfair Display',serif;font-weight:900;line-height:1.05;margin:0;background:linear-gradient(135deg,#f5f0e8,#c9a84c,#f5f0e8);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent}
.rule{width:150px;height:2px;margin:26px 0;background:linear-gradient(90deg,#c9a84c,#e8d48b,transparent)}
/* The picture's edges melt into the dark, as the heroes do it. */
.melt{-webkit-mask-image:linear-gradient(to bottom,#000 70%,transparent 100%),linear-gradient(to right,transparent 0%,#000 7%,#000 93%,transparent 100%);-webkit-mask-composite:source-in;mask-composite:intersect}`;

const CARDS = [
  {
    /* index.html: the hero, with its words and its stats. */
    file: 'share-bobby-guitar.jpg',
    css: `.back{left:0;top:0;width:620px;height:630px;background:radial-gradient(closest-side at 50% 42%,rgba(201,168,76,.30) 0%,rgba(201,168,76,.09) 55%,transparent 100%);filter:blur(30px)}
.photo{left:14px;top:40px;width:590px;height:590px}
.text{position:absolute;left:634px;right:44px;top:0;bottom:0;display:flex;flex-direction:column;justify-content:center}
.eyebrow{font-size:23px;letter-spacing:6px}
h1{font-family:'Great Vibes',cursive;font-weight:400;font-size:92px;line-height:1.1;margin:0;white-space:nowrap;text-shadow:0 0 80px rgba(201,168,76,.35)}
.stats{display:flex;gap:14px}
.stat{width:156px;box-sizing:border-box;padding:16px 6px 14px;text-align:center;border:1px solid rgba(201,168,76,.3);background:rgba(201,168,76,.05)}
.n{font-family:'Bebas Neue',sans-serif;font-size:54px;line-height:1;color:#c9a84c}
.l{font-size:14px;letter-spacing:2px;white-space:nowrap;text-transform:uppercase;color:rgba(245,240,232,.72);margin-top:6px}`,
    body: `<div class="layer back"></div>
<img class="layer photo melt" src="${picture('hero-bobby.png')}" alt="">
<div class="text">
  <p class="eyebrow">Legendary Country Music Artist</p>
  <h1>Bobby G. Rice</h1>
  <div class="rule"></div>
  <div class="stats">
    <div class="stat"><div class="n">30</div><div class="l">Billboard Hits</div></div>
    <div class="stat"><div class="n">4+</div><div class="l">Decades</div></div>
    <div class="stat"><div class="n">#1</div><div class="l">Hit Single</div></div>
  </div>
</div>`,
  },
  {
    /* bio.html: the bio hero, its picture and its three lines. */
    file: 'share-about-bobby.jpg',
    css: `.back{left:60px;top:0;width:560px;height:630px;background:radial-gradient(closest-side at 50% 38%,rgba(201,168,76,.30) 0%,rgba(201,168,76,.09) 55%,transparent 100%);filter:blur(30px)}
.photo{left:120px;top:0;height:700px;width:auto}
.text{position:absolute;left:640px;right:56px;top:0;bottom:0;display:flex;flex-direction:column;justify-content:center}
.gold{font-size:88px}
.sub{font-family:'Great Vibes',cursive;font-size:64px;line-height:1.1;color:#c9a84c;margin:18px 0 0}`,
    body: `<div class="layer back"></div>
<img class="layer photo melt" src="${picture('bio-bobby.png')}" alt="">
<div class="text">
  <p class="eyebrow">The Legend</p>
  <h1 class="gold">About Bobby</h1>
  <p class="sub">Bobby G. Rice</p>
</div>`,
  },
  {
    /* merch.html: the merch hero's words beside the album it sells first. */
    file: 'share-legacy-edition.jpg',
    css: `.back{left:0;top:0;width:644px;height:630px;background:radial-gradient(closest-side,rgba(201,168,76,.26) 0%,rgba(201,168,76,.08) 60%,transparent 100%);filter:blur(30px)}
.cover{left:72px;top:65px;width:500px;height:500px;box-shadow:0 0 0 1px rgba(201,168,76,.4),0 30px 70px rgba(0,0,0,.75)}
.text{position:absolute;left:640px;right:56px;top:0;bottom:0;display:flex;flex-direction:column;justify-content:center}
.gold{font-size:66px}
.note{display:inline-block;align-self:flex-start;margin-top:30px;padding:12px 22px;border:1px solid rgba(201,168,76,.35);background:rgba(201,168,76,.06);font-family:'Bebas Neue',sans-serif;font-size:22px;letter-spacing:3px;color:#c9a84c;text-transform:uppercase}`,
    body: `<div class="layer back"></div>
<img class="layer cover" src="${picture('album-legacy-front.jpg')}" alt="">
<div class="text">
  <p class="eyebrow">Bobby’s Merch</p>
  <h1 class="gold">Albums &amp;<br>Autographed CDs</h1>
  <div class="note">&#9733; Free Shipping in the USA &#9733;</div>
</div>`,
  },
];

/* Chrome's headless shot on this Mac: a fresh profile and its own process group
   per card, the file polled until its size holds, then the group killed —
   headless Chrome writes the picture and may never exit (~/fleet/docs/gotchas.md). */
function shot(page, out, tmp) {
  const profile = path.join(tmp, `profile-${path.basename(out)}`);
  const child = spawn(CHROME, ['--headless', '--disable-gpu', '--hide-scrollbars', '--force-device-scale-factor=1',
    '--no-first-run', '--no-default-browser-check', '--disable-background-networking', '--disable-sync',
    '--disable-extensions', '--disable-component-update', `--user-data-dir=${profile}`,
    '--window-size=1200,630', `--screenshot=${out}`, '--virtual-time-budget=3000', `file://${page}`],
  { stdio: 'ignore', detached: true });
  let last = -1, stable = 0;
  for (const until = Date.now() + 20000; Date.now() < until && stable < 2;) {
    execFileSync('sleep', ['0.15']);
    const size = fs.existsSync(out) ? fs.statSync(out).size : 0;
    stable = size > 0 && size === last ? stable + 1 : 0;
    last = size;
  }
  try { process.kill(-child.pid, 'SIGKILL'); } catch { /* already gone */ }
  try { execFileSync('pkill', ['-9', '-f', profile], { stdio: 'ignore' }); } catch { /* nothing left */ }
  if (!fs.existsSync(out) || !fs.statSync(out).size) throw new Error(`Chrome wrote no picture for ${path.basename(out)}`);
}

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'share-cards-'));
try {
  for (const c of CARDS) {
    const page = path.join(tmp, `${c.file}.html`), png = path.join(tmp, `${c.file}.png`), jpg = path.join(IMG, c.file);
    fs.writeFileSync(page, `<!doctype html><html lang="en"><head><meta charset="utf-8"><style>${BASE}\n${c.css}</style></head><body>${c.body}</body></html>`);
    shot(page, png, tmp);
    const size = execFileSync('python3', ['-c', `import sys
from PIL import Image
im = Image.open(sys.argv[1]).convert('RGB')
im.save(sys.argv[2], 'JPEG', quality=86, optimize=True, progressive=True, subsampling=0)
print('%dx%d' % im.size)`, png, jpg], { encoding: 'utf8' }).trim();
    const kb = Math.round(fs.statSync(jpg).size / 1024);
    if (size !== '1200x630') throw new Error(`${c.file}: ${size}, not 1200x630`);
    console.log(`  images/${c.file}  ${size}  ${kb} KB${kb > 300 ? '  ! over 300 KB: WhatsApp shows no picture' : ''}`);
  }
} finally {
  fs.rmSync(tmp, { recursive: true, force: true });
}
