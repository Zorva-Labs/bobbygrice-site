# Bobby G. Rice — operating manual

bobbygrice.com · Cloudflare Pages `bobbygrice` · github.com/Zorva-Labs/bobbygrice-site · status: **live**

**Before changing anything:** read the top of `CHANGELOG.md`. **After:** append an entry there; if infrastructure changed (a secret, a database, a domain, an account id), update `site.json` and this file too. The rules that apply to every site are in `~/.claude/CLAUDE.md`; estate-wide facts (accounts, conventions, gotchas) are in `~/fleet/docs`.

## What this is
Artist site for country singer Bobby G. Rice: home, bio, merch (Legacy Edition album with PayPal buy link and Apple Music), contact form. **One host: `www.bobbygrice.com`** — every canonical, sitemap and schema URL uses it, and the apex answers only with a 301 to it (2026-09-23; the estate's usual host is the apex, but this site has been canonical and indexed on www since it was built). Pages are linked and canonicalized by their clean URLs (`/bio`, `/merch`); Pages 308s the `.html` names to them.

## Build & deploy
```bash
set -a; . ~/.env; set +a; unset CLOUDFLARE_API_KEY CLOUDFLARE_EMAIL   # the account token CLOUDFLARE_API_TOKEN (since 2026-09-23); credentials live in ~/.env, never in the repo
git fetch origin && git rev-list --count HEAD..origin/main   # must print 0 before any build or deploy
node build.mjs   # dist/ = the allow-list of public files; ends with site-kit lastmod (the sitemap's real dates)
npx wrangler pages deploy dist --project-name=bobbygrice --branch=main --commit-dirty=true
node ~/site-kit/bin/site-kit.mjs submit   # IndexNow + Search Console + Bing, once the real domain serves the deploy; commit .indexnow.json after
```
- **Deploy `dist/`, never the repo root** — a root deploy publishes the repo: `CLAUDE.md`, `CHANGELOG.md`, `site.json`, `wrangler.toml`, `.indexnow.json`, `migrations/` and `.claude/` all answered 200 until 2026-09-23 (Pages never reads `.assetsignore`; `~/fleet/docs/gotchas.md`). `build.mjs` copies an allow-list — every root `.html` page, the named files and folders, the IndexNow key — and names any file a page links to that it did not copy; a new public file at the root goes on its list. It ends with `site-kit lastmod`, so `dist/sitemap.xml` carries each page's real last change (the root `sitemap.xml` carries no dates). Functions still ship: wrangler reads `./functions` and `wrangler.toml` from the repo root whatever it uploads.
- Or `node ~/fleet/bin/fleet.mjs deploy bobbygrice`, which runs build → deploy from `site.json` and refuses a checkout that is behind origin.
- Pages binds secrets at deploy time — after any `wrangler pages secret put`, deploy again.

## How it works
- `index.html`, `bio.html`, `merch.html`, `404.html`; `images/`; `manifest.json`.
- Hand-written static HTML/CSS/JS, no framework. Edit the files at the root; `node build.mjs` copies the public ones into `dist/`, which is what deploys.
- Every page carries title/description within the SEO windows, canonical, OG + Twitter card, JSON-LD graph, `llms.txt`, `robots.txt`, `sitemap.xml`; `_headers` sets the CSP and security headers (2026-05-15 SEO sweep, scanner 96–100).
- Footer credit: `Web Design, SEO and Hosting by Nashville's Web Design`, a `rel="nofollow noopener"` link (every credit in the estate is nofollow since 2026-09-19), with creator/provider on the WebSite schema node (switched from the Zorva Labs credit 2026-09-17).

## Infrastructure & accounts
- Cloudflare Pages project `bobbygrice` → bobbygrice.pages.dev (noindexed by the middleware); apex and www both attached. The zone `bobbygrice.com` is on our account (`1c7ae11d1cc73e3279ec2d18d43a4b50`, Free) with one Single Redirect rule: the apex → `https://www.bobbygrice.com` + path, 301, query kept, `/.well-known/` excluded. `functions/_middleware.js` carries the same redirect first thing, so it travels with the repo; the zone rule also covers `/images/*` and `/assets/*`, which never reach the function (`_routes.json`).
- Search Console: the domain property `sc-domain:bobbygrice.com` (michael@nashvilleswebdesign.com since 2026-09-23).
- Google: GA4 `G-FM5M8NEW51` (property 555802348, the Nashville's Web Design account). The zorva-labs-site GA4 digest email (daily and monthly to bobbynalice@yahoo.com since 2026-06-01) ended 2026-09-23 with the estate's retirement of the traffic emails; the client's numbers are on `/traffic`. Since 2026-09-24, in place of `G-1RNWQ6TWQV` (property 539719729, installed 2026-08-04), a property michael@nashvilleswebdesign.com cannot see (the old Zorva daily digest), so nothing could feed `/traffic` from it.

## Forms, mail, tracking
- `/traffic` (traffic-kit, installed 2026-09-17): `functions/_middleware.js` logs every HTML page view at the edge into D1 `bobbygrice-analytics` before any script runs; `assets/js/traffic-beacons.js` (loaded on every page) sends tap-to-call/email conversions, `/thanks` or `/thank-you` arrivals and time on page; dashboard is `traffic.html` at the root (served at `/traffic`), password = Pages secret `TRAFFIC_PASSWORD` = `BOBBYGRICE_TRAFFIC_PASSWORD` in `~/.env`. No geo-gate (`GEO_ALLOW=""`) — the site kept its worldwide audience. `_routes.json` keeps static folders out of the Function; `build.mjs`'s allow-list and the middleware's `isRepoFile` keep migrations and the manuals off the CDN.
- Contact form → FormSubmit → bobbynalice@yahoo.com.
- GA4 `G-FM5M8NEW51` (property 555802348, the Nashville's Web Design account) on every page.

## Gotchas
- Album covers are expandable and the Legacy Edition title once clipped — check merch layout at 375px after edits.

## Open items
- (nothing recorded yet)
