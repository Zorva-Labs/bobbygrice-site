# Changelog — Bobby G. Rice

Newest first. One entry per session that changed this repo: what changed, why, what the client asked for, what is still owed. Infrastructure changes also go in `site.json` and `CLAUDE.md`. Entries dated before 2026-09-17 are reconstructed from git history; the reasoning behind them is in `CLAUDE.md` and in `~/fleet/docs/archive`.

## 2026-09-23 (real sitemap dates)
- **Every sitemap date is now the day that page last changed** (Michael: "Switch [sitemaps] to real change dates"). `site.json → deploy.command` and the manual's deploy block start with `node ~/site-kit/bin/site-kit.mjs lastmod`: each `<lastmod>` is the day the page's own content last changed (the words, links and structured data of the page itself — not the header or footer), read from `.indexnow.json`, where `submit` records the day a page's content changes. A changed page gets that day; an unchanged one keeps its date. Google trusts lastmod only from sites whose dates prove accurate, and Bing leans on it.
- Dates seeded once from git history (`site-kit lastmod --history`): 2026-09-17. The old sitemap said 2026-05-15, a hand-set date. Deployed; the sitemap resubmitted to Search Console (`submit --resubmit`). The step rewrites `sitemap.xml` — commit it with each deploy, as `.indexnow.json`.

## 2026-09-23 (submit on every deploy)
- **Every deploy now submits to IndexNow, Google Search Console and Bing** (Michael: "when a site is created or updated it needs to be submitted to indexnow, google search console and bing"). An IndexNow key file at the site root (a 32-hex `.txt`; not a secret — it can only submit this site's URLs), and `site.json → deploy.command` plus the manual's deploy block end with `node ~/site-kit/bin/site-kit.mjs submit`: IndexNow for the pages that changed, the sitemap resubmitted to Search Console when anything changed, the sitemap to Bing when Bing lacks it — only once the real domain serves the deploy; state in `.indexnow.json` (commit it with each deploy). It joined michael@'s Search Console today (`gsc-onboard.mjs`: a verification TXT beside the older zorvalabs@ owner's) and Bing Webmaster Tools (`~/fleet/bin/bing.mjs add`: a CNAME to verify.bing.com) — before today its Search Console sat where no token here could submit, and it was not in Bing. Deployed: IndexNow's first submission sent all 1 URL(s) (202), Search Console took the sitemap; Bing's daily sitemap cap was used up tonight, so its sitemap goes to Bing tomorrow (`node ~/fleet/bin/bing.mjs sitemaps --apply`); IndexNow already carries every change to Bing.
- Found while doing this, not changed here: this site is deployed from the repo root, so `/CLAUDE.md`, `/CHANGELOG.md`, `/site.json` and `/wrangler.toml` are served publicly (`.assetsignore` does nothing for Pages) — flagged as its own task (an allow-list build into `dist/`).

## 2026-09-22 (Bing on /traffic)
- **/traffic has a fourth section, Bing** (Michael: add Bing's report info to the traffic page on all sites). Added by `~/traffic-kit/bin/add-bing.mjs` — patched, not copied over, so this page's own changes stay: the nav link, the section (clicks and impressions from Bing against the window before, a day chart, the searches and pages Bing showed with position, a crawl table) and its self-contained script in `traffic.html`, and the endpoint `functions/api/traffic/bing.js`, behind the same password middleware as the rest of `/api/traffic`. The numbers come from gsc-ingest's daily Bing push (09:40 UTC) into this site's own D1 (`bing_*` tables). Not in Bing yet — this site's Search Console property is under the other Google account, so the import did not bring it; once it is added to Bing (`~/fleet/docs/reference/bing.md` → Not in Bing yet) and `gsc-ingest/scripts/map-bing.mjs --apply` is re-run, the section fills itself. Until then it says the site is not in Bing Webmaster Tools yet. Deployed; verified live without signing in — the page carries the section and `/api/traffic/bing` answers 401 to a request with no session.

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
