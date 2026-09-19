# Changelog — Bobby G. Rice

Newest first. One entry per session that changed this repo: what changed, why, what the client asked for, what is still owed. Infrastructure changes also go in `site.json` and `CLAUDE.md`. Entries dated before 2026-09-17 are reconstructed from git history; the reasoning behind them is in `CLAUDE.md` and in `~/fleet/docs/archive`.

## 2026-09-19
- Footer credit link to nashvilleswebdesign.com is now `rel="nofollow noopener"` (was followed). Michael's call, estate-wide: every credit on every site, ours and clients', is nofollow from today — a credit, not a link signal; the WebSite schema creator/provider is unchanged. No other change; redeployed.

## 2026-09-17
- `/traffic` dashboard installed with traffic-kit: D1 `bobbygrice-analytics`, all nine migrations, edge page-view logging, conversion beacons on every page, password `BOBBYGRICE_TRAFFIC_PASSWORD` in `~/.env`. Verified live at https://www.bobbygrice.com/traffic (one test page view was logged during the install). traffic-kit itself was fixed the same day to ship every migration — earlier scaffolds got only two.
- Operating manual added: `CLAUDE.md` (how it works), `site.json` (the manifest `fleet` reads) and this log. The old `CLAUDE.md`, where one existed, is replaced.
- Footer credit: Web Design, SEO and Hosting by Nashville's Web Design, followed link; creator/provider on the WebSite schema

## 2026-09-01
- Commit a portable dev-server config
- Standardise .gitignore

## 2026-08-19
- Add Legacy Edition album to merch page with PayPal buy link

## 2026-06-01
- Add Google Analytics (GA4 G-1RNWQ6TWQV) to all pages

## 2026-05-30
- Remove vintage live performance video; add Legacy Edition announcement

## 2026-05-29
- Replace contact mailto button with a contact form to bobbynalice@yahoo.com
- Restore bio.html and merch.html pages
- Fix Legacy Edition title clipping and make album covers expandable
- Add Apple Music link to Legacy Edition album section
- Add Legacy Edition new album section under hero

## 2026-05-15
- Final 100/100 SEO pass: pad meta desc to 155ch, add llms.txt + robots.txt + sitemap.xml, set hero img width/height to nail CLS
- Initial commit — Bobby G. Rice site mirrored from live + full SEO sweep
