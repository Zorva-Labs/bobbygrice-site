# Bobby G. Rice — operating manual

bobbygrice.com · Cloudflare Pages `bobbygrice` · github.com/Zorva-Labs/bobbygrice-site · status: **live**

**Before changing anything:** read the top of `CHANGELOG.md`. **After:** append an entry there; if infrastructure changed (a secret, a database, a domain, an account id), update `site.json` and this file too. The rules that apply to every site are in `~/.claude/CLAUDE.md`; estate-wide facts (accounts, conventions, gotchas) are in `~/fleet/docs`.

## What this is
Artist site for country singer Bobby G. Rice: home, bio, merch (Legacy Edition album with PayPal buy link and Apple Music), contact form. Canonical host is `www.bobbygrice.com`.

## Build & deploy
```bash
set -a; . ~/.env; set +a; unset CLOUDFLARE_API_TOKEN   # credentials live in ~/.env, never in the repo
git fetch origin && git rev-list --count HEAD..origin/main   # must print 0 before any build or deploy
npx wrangler pages deploy . --project-name=bobbygrice --branch=main --commit-dirty=true
```
- deploys the repo root; nothing to build
- Or `node ~/fleet/bin/fleet.mjs deploy bobbygrice`, which does the same from `site.json` and refuses a checkout that is behind origin.
- Pages binds secrets at deploy time — after any `wrangler pages secret put`, deploy again.

## How it works
- `index.html`, `bio.html`, `merch.html`, `404.html`; `images/`; `manifest.json`.
- Hand-written static HTML/CSS/JS — no build step, no framework. Edit the files, deploy the repo root.
- Every page carries title/description within the SEO windows, canonical, OG + Twitter card, JSON-LD graph, `llms.txt`, `robots.txt`, `sitemap.xml`; `_headers` sets the CSP and security headers (2026-05-15 SEO sweep, scanner 96–100).
- Footer credit: `Web Design, SEO and Hosting by Nashville's Web Design`, a `rel="nofollow noopener"` link (every credit in the estate is nofollow since 2026-09-19), with creator/provider on the WebSite schema node (switched from the Zorva Labs credit 2026-09-17).

## Infrastructure & accounts
- Cloudflare Pages project `bobbygrice` → bobbygrice.pages.dev; domain bobbygrice.com (canonical www.bobbygrice.com).
- Google: GA4 `G-1RNWQ6TWQV` (property 539719729). On the zorva-labs-site daily digest (admin rollup + per-site daily and monthly client report to bobbynalice@yahoo.com) since 2026-06-01. GA4 tag installed 2026-08-04 and verified live.

## Forms, mail, tracking
- `/traffic` (traffic-kit, installed 2026-09-17): `functions/_middleware.js` logs every HTML page view at the edge into D1 `bobbygrice-analytics` before any script runs; `assets/js/traffic-beacons.js` (loaded on every page) sends tap-to-call/email conversions, `/thanks` or `/thank-you` arrivals and time on page; dashboard is `traffic.html` at the root (served at `/traffic`), password = Pages secret `TRAFFIC_PASSWORD` = `BOBBYGRICE_TRAFFIC_PASSWORD` in `~/.env`. No geo-gate (`GEO_ALLOW=""`) — the site kept its worldwide audience. `_routes.json` keeps static folders out of the Function; `.assetsignore` keeps migrations and the manuals off the CDN.
- Contact form → FormSubmit → bobbynalice@yahoo.com.
- GA4 `G-1RNWQ6TWQV` (property 539719729) on every page; the site is on the legacy daily digest from `~/zorva-labs-site` (see `~/fleet/docs/reference/google.md`).

## Gotchas
- Album covers are expandable and the Legacy Edition title once clipped — check merch layout at 375px after edits.

## Open items
- (nothing recorded yet)
