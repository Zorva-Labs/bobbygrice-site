# Changelog — Bobby G. Rice

Newest first. One entry per session that changed this repo: what changed, why, what the client asked for, what is still owed. Infrastructure changes also go in `site.json` and `CLAUDE.md`. Entries dated before 2026-09-17 are reconstructed from git history; the reasoning behind them is in `CLAUDE.md` and in `~/fleet/docs/archive`.

## 2026-10-26 — /traffic sign-in: a Show button in the password box

- **What:** the password box on `/traffic` has a Show / Hide button inside its right edge, so a password typed on a phone can be read back before it is sent (traffic-kit `bin/add-show-password.mjs`, 7b52481).
- **Why:** Michael, 2026-10-26: "Show the password on all login screens". One agency password has `$` and `!` in it and is easy to mistype.
- **Owed:** nothing.

## 2026-10-26 — /traffic sign-in: stray spaces ignored, a blocked sign-in says so

- **Why:** Michael, 2026-10-26: Terry's password was not opening Noctis Aurora's `/traffic`, yet that live sign-in accepted both agency passwords and the site's own. Two ways a right password reads as wrong were closed on every site: a space or line break pasted in with it, and a request refused before the password was checked (the US-only gate, a Cloudflare block), which the form reported as "That password is not right."
- **What:** `functions/_lib/auth.js` → `checkPassword` trims the typed password before comparing (`login-trim` block); the sign-in form in `traffic.html` shows our endpoint's own error as a wrong password and, for anything else, names the HTTP status and says the password was not checked (`login-error` block). Both lifted from traffic-kit's template by `bin/add-login-hardening.mjs`. Sessions are still signed with the stored `TRAFFIC_PASSWORD`, so nobody was signed out.
- **Owed:** nothing.

## 2026-10-24 — every inquiry says where it came from
- **What Michael asked:** "all forms are supposed to send the traffic info with the lead form info." Here the contact form posts straight to FormSubmit, so nothing about the visit reached the inbox.
- **What:** the edge already keeps the visit's entry in the HttpOnly `ts_src` cookie; a page cannot read it, so `functions/api/visit.js` (new, site-kit's copy, with `functions/_lib/visit.js`) reads it from a same-origin GET and answers with the rows, in the words `/traffic` uses (Direct reads Direct/ChatGPT). `assets/js/lead-source.js` (site-kit's copy, loaded by `index.html`) asks for it the first time someone starts on a form, and the FormSubmit form carries it as hidden fields (a "Where this lead came from" heading, then Source, Campaign, Referred by, Landed on with the time to convert, Form on, Device, the edge's estimate of the area, Connection, and the Direct/Unknown explanation), with the channel at the end of `_subject`. Nothing waits on it: a form sent before the answer arrives goes as it was. Nothing is stored and `/api/visit` logs nothing.
- **Checked:** live: a visit landing from bing.com with a test `utm_source` gets the cookie and `/api/visit` answers with Source, Campaign, Referred by, Landed on and Form on. The form itself was not sent, so the owner got nothing.
- **Owed:** nothing.

## 2026-10-23 — Direct is called Direct/ChatGPT on /traffic

- **Why:** Michael, across the estate ("every site present and in the future"). A visit with no referrer is most often an AI assistant now — ChatGPT and the rest send none when a link is opened inside their app or pasted — so that traffic has always landed in Direct, while `/traffic` explained Direct as "someone who typed the address or used a bookmark". Wrong, and read as "they already knew us".
- **What (`traffic.html`), the four edits `~/traffic-kit/bin/add-direct-chatgpt.mjs` makes:** the legend and `chName` say **Direct/ChatGPT** wherever a channel is printed — the rows, the chips, the summary line; the channels card now says no referrer was sent at all, that most of that is an AI assistant, and that the **AI assistants** channel is therefore the floor and not the total; the leads card says what **Unknown** means — no visit cookie came back, so the edge never saw that visit begin (a page left open since the browser last closed, or a browser that keeps none).
- **Display only.** The classifier and the stored channel stay `Direct`, so the edge log, the rows and every figure already recorded still line up; nothing was backfilled (Michael's standing rule: leave the data alone, fix it for future).
- The wording and the patcher are the kit's (`~/traffic-kit/CHANGELOG.md`, 2026-10-23), so a new site gets it from the template.

## 2026-10-11 (geo gate moved into the code)
- **Why:** Lighthouse SEO scores of 40 across the estate (the monitor's findings; Springhaven's #285 tonight): Cloudflare zone WAF country rules, set up in the dashboard before the fleet and never in a repo, answered PageSpeed's Lighthouse run from Google's Taiwan data center with a 403. Michael, 2026-10-11: one gate for every site, in the code — "US only everywhere except Elopements Inc".
- **What:** `GEO_ALLOW="US"` in `wrangler.toml [vars]` (was empty) and `site.json` (`geo`, `deploy.vars`), so the traffic-kit middleware gates every page to the US, with crawlers, Lighthouse and PageSpeed (by user agent), static files, `/traffic` and `/api/` exempt. Then the zone's WAF custom rule "Block all non-US/Canada traffic" (rule `8ca7d510`) was deleted. Canada is no longer let in (the rule allowed it; the estate's gate is US only). CLAUDE.md rewritten where it said the site had no gate.
- **Checked:** `site-kit check` passes; deployed `215ea976`; the zone sweep (all 80 zones) finds no country rule; PageSpeed mobile SEO 100.

## 2026-10-11 — billing recorded in site.json
- **What Michael asked:** "fix the stripe subscription issues that you keep reporting" — the estate monitor's "No Stripe subscription recorded" notice on this site.
- **What changed:** `site.json → billing` now records billing.plan "free" — a freebie for Bobby G Rice. Nothing on the site changed; no deploy. The monitor's billing check reads the subscription from here (`fleet index` pushes it) and watches it for past-due, canceled or cancel-at-period-end from now on.

## 2026-10-11 (Search Console: shipping on the merch offers)
- **Why:** Search Console's two emails of 2026-10-11 for bobbygrice.com. Merchant listings: the six Offers on /merch carry no `shippingDetails` and no `hasMerchantReturnPolicy`. Product snippets: the six Products carry no `review` and no `aggregateRating`. All four are non-critical. The client asked for nothing here.
- **What:** each Offer now carries `shippingDetails` (OfferShippingDetails, destination US) with the rate the page already states: 0.00 on the four CDs ("Free shipping in the USA"), 6.00 on the hat and 3.00 on the koozie (the merch FAQ and the PayPal buttons). Nothing else in the graph changed.
- **Left out on purpose:** a return policy (the page states none, so none is marked up) and reviews or a rating (none on the page; the estate never invents them). Search Console will keep listing those three as missing; that is correct.
- **Checked:** `site-kit check`: 0 failures, the same llms.txt warning as before. Deployed `469e4532`; submitted (IndexNow 1 URL, 200; Search Console; Bing).
- **Owed:** nothing new.

## 2026-10-11 (monitor triage: the zone's country block lets crawlers and Lighthouse through)
- **Why:** the estate monitor reported "Lighthouse SEO score 40" on www.bobbygrice.com twice in a row (failing audits: http-status-code, is-crawlable, meta-description). The zone's firewall events show why: PageSpeed ran Lighthouse from Taiwan at the minute of the check, and the zone's custom WAF rule "Block all non-US/Canada traffic" (expression `(ip.geoip.country ne "US" and ip.geoip.country ne "CA")`, in place since spring 2026) answered it with the 403 block page. The same rule blocked every search and AI crawler that fetched from outside the US and Canada.
- **What:** the rule's expression now excludes verified bots (`cf.client.bot`) and any user agent containing `Chrome-Lighthouse` or `PageSpeed`; the block on people outside the allowed countries is unchanged. Changed over the Cloudflare API on the zone; nothing in this repo's build changed, so no deploy. The rule is now recorded in `CLAUDE.md → Infrastructure & accounts` (it was not written down anywhere before).
- **Checked:** the monitor's daily check re-run for the host closed the finding.
- **Owed:** nothing on the site. Michael's call whether the gate should live in `GEO_ALLOW` (the standard, crawler-exempt by user agent) instead of the zone rule.

## 2026-10-09 (estate scan Phase 4: titles carry "Bobby Rice", FAQs on bio and merch, pictures and LCP, schema, robots, llms.txt)
- **Why:** the 2026-10-09 estate scan (plan row 4.14, `~/fleet/reports/seo/estate/2026-10-09/A.md` §2): Search Console showed "bobby rice" with 74 impressions a week on page 1 and no clicks, and no title carried the name that way; the phone LCP was 11.3 s; `sameAs` was a YouTube search URL; robots.txt named no private path; bio and merch had no FAQ. The client asked for nothing here.
- **Titles and descriptions** (og/twitter titles follow):
  - Home: "Bobby G. Rice — Country Singer · 30 Billboard Hits · CMA" → "Bobby G. Rice (Bobby Rice) | Country Singer & Songwriter" (56); description → "Official site of Bobby G. Rice (Bobby Rice), country singer-songwriter from Boscobel, Wisconsin: 30 Billboard charted singles, two-time CMA nominee." (148; "two-time CMA nominee" kept word for word, see Owed).
  - Bio: "About Bobby G. Rice | Country Music Legend Biography" → "Bobby Rice (Bobby G. Rice) Biography | Country Music Legend" (59); description 221 → 158.
  - Merch: "Merch | Bobby G. Rice — Albums & Autographed CDs" → "Bobby G. Rice Merch | Albums & Autographed CDs"; description 179 → 148.
- **FAQs:** bio gains four questions (how he started, who recorded the song, TV and radio, the Top 10 singles), merch five (Legacy Edition price, autographs, song count, streaming, hat and koozie shipping), each answered from the page's own text; `build.mjs` writes each FAQPage from its accordion.
- **Schema:** the home page's two blocks are one graph; `alternateName` "Bobby Rice" on the Person and MusicGroup; the search-URL `sameAs` removed (no profile URL is on file); albums and tracks point at `#musicgroup` by `@id`; the WebPage has an `@id`, `isPartOf`, `about`, `dateModified` and speakable selectors that match (`.bio` matched nothing). Bio: one graph, its Person is `#person` (was `bio#person`, a second id for the same man), an AboutPage with `dateModified`. Merch: a CollectionPage, a BreadcrumbList, and the Legacy Edition Product the page sells but the schema lacked. `site-kit lastmod` dates each page.
- **Pictures and speed:** `scripts/images.py` makes WebP copies (AVIF for the hero and bio photos) at two to four widths; every `<img>` names them with `srcset`, `sizes`, `width` and `height`; the hero preload carries `imagesrcset`; the bio photo gets `fetchpriority`. `build.mjs` leaves out any image nothing names: 32 originals, the 2.6 MB and 2.4 MB GRT scans and the 1.1 MB hero PNG among them, no longer ship. The fifteen gallery photos that all said "Bobby G. Rice" have alts that say what each shows. GA4 now loads at the first tap, key or scroll (`assets/js/ga4.js`, no inline tag); `/privacy` says so. PageSpeed, phone, live: home LCP 10.7 s → 3.9 s (score 67 → 70), bio LCP 6.9 s → 3.3 s and CLS 0.342 → 0.001 (score 52 → 85).
- **Technical:** robots.txt repeats `Disallow: /traffic` and `/api/` in all nine groups; the CSP names googletagmanager.com and google-analytics.com; the logo link went from `href="#"` to `/`; the footer year is the build's (it said 2024); the home page's story links to /bio. HSTS and the `*.pages.dev` noindex were already in `_headers`; the sitemap already listed only the four pages.
- **llms.txt:** adds what the pages say (the pages, "Bobby Rice", the Top 10 and charted singles, the nine artists, the awards as listed, TV and radio, hit albums, the CDs and prices, the streaming links, booking); "30 Billboard-charted" now reads as the pages do. Nothing else in it changed (see Owed).
- **`site.json → build.check`** is plain `site-kit check`: 6 failures and 12 warnings before, 0 failures and 7 warnings after (GEO_ALLOW, FormSubmit, inline scripts in the CSP, no stylesheet file, two hero treatments, no `src/facts.md`, llms.txt's unsupported "1960"/"60"/"Memories").
- **Checked:** at 375 px in the browser pane: home, bio and merch with no sideways scroll, the FAQ open and closing, taps 89 px tall.
- **Deployed** `8ff55a83`; submitted (IndexNow 4 URLs, 200; Search Console; Bing).
- **Left as they are, per Michael:** "two-time CMA nominee" (home description), "two CMA Award nominations" and "over six decades"/"60+ years" in llms.txt against the three 1973 nominations and "4+ Decades" on the pages; the 2022/2023 anniversary; "Mainstream of Memories" and "You Are What Made Me Love You" in llms.txt; "reached #1 on the Billboard Country chart"; the "#1 Billboard Chart" label; every award, count and year. The FormSubmit form, the Yahoo address in it, and no phone. `GEO_ALLOW` stays empty (the site's worldwide audience, a standing decision).
- **Owed (Bobby):** the profile URLs for `sameAs`; the single's release year and the chart (the gallery picture is Record World's chart page); one number each for the CMA nominations, the anniversary and the decades; "Jim Taylor" or "Joe Taylor" Artist Agency; a first-person paragraph on writing the song (for a song page); which gallery photos are his; a booking phone or email he will publish.

## 2026-09-29 (/traffic takes the agency passwords)
- **What:** `functions/_lib/auth.js` accepts our agency passwords beside this site's own `TRAFFIC_PASSWORD`, which is unchanged and still signs the session (`traffic-kit bin/add-agency-passwords.mjs`). The Pages secret `TRAFFIC_AGENCY_PASSWORDS` is stored on `bobbygrice` and named in `site.json → cloudflare.secrets` (where the list exists) and `CLAUDE.md`.
- **Why:** Michael, 2026-09-29: keep every site's traffic password, and make the two agency passwords (`TRAFFIC_AGENCY_PASSWORD_1` and `_2` in `~/.env`) open every `/traffic`, this one and every future one.
- **Deployed** `eedfb408`. The deployment binds `TRAFFIC_AGENCY_PASSWORDS` (secret_text) beside `TRAFFIC_PASSWORD`, `/api/traffic/auth` reports `configured: true` and a wrong password still gets a 401.

## 2026-09-28 (the preview hosts noindex every file: the `/migrate www` rule in `_headers`)
- **Why:** a live check on 2026-09-28 found `bobbygrice.pages.dev` serving the site's files with no noindex: `bobbygrice.pages.dev/images/share-bobby-guitar.jpg` answered 200 with no `X-Robots-Tag`. The middleware noindexes everything on the preview host that reaches it, but `_routes.json` keeps `/images/*` and `/assets/*` out of Functions, and the root `_headers` had no rule for the host. The estate standard is that `*.pages.dev` is never indexed, and `/migrate www` puts the rule in `_headers` so images are covered too. The check found the same on seven other sites, and Michael asked for that rule alone on all eight; the client asked for nothing here.
- **Changed:** the rule `/migrate www` writes, appended word for word to the root `_headers`, the one the build copies into `dist/`:
  - `https://:project.pages.dev/*` → `X-Robots-Tag: noindex, nofollow`, for `bobbygrice.pages.dev`;
  - `https://:version.:project.pages.dev/*` → the same, for each deployment's own `<hash>.bobbygrice.pages.dev`;
  - nothing else. The rest of `/migrate www` wasn't run: its www → apex step stops on this site, where www is the canonical host.
- **Checked:**
  - `node build.mjs`: `dist/_headers` is the root `_headers` byte for byte, both rules in it. lastmod kept all 4 dates, since no page changed.
  - `site-kit check`: the same output as before the change, word for word (the 3 problems it already had).
- **Deployed** `1c5e55ea`. **Submitted:** no page changed, so nothing was sent.
- **Verified live** (user agent `NashvillesWebDesignCheck`):
  - `bobbygrice.pages.dev/images/share-bobby-guitar.jpg` and `/assets/js/traffic-beacons.js`: 200 with `X-Robots-Tag: noindex, nofollow`. Before, neither carried one. The pages load no stylesheet file of their own (the styles are inline, the fonts come from Google), so the beacon script stood in for one.
  - `1c5e55ea.bobbygrice.pages.dev/images/share-bobby-guitar.jpg`: the same.
  - `bobbygrice.pages.dev/`: one `X-Robots-Tag: noindex, nofollow`, as before, not two. The middleware sets it with `headers.set`, which replaces a value already on the response.
  - `www.bobbygrice.com/images/share-bobby-guitar.jpg` and `/assets/js/traffic-beacons.js`: 200 with no `X-Robots-Tag`, as before.
- **Owed:** nothing for this.

## 2026-09-27 (a privacy page, linked from every page's footer)
- **Why:** the estate's scanner (core 4.0, check `about-privacy`, rulebook rule 8) found no privacy policy linked from the home page, and `/privacy` answered 404. Michael asked for one on every site that lacked it: what the site's own form and analytics keep, read from the repo, in Bobby's name.
- **`/privacy` (`privacy.html`)**: the bio page's head and stylesheet, the merch page's text hero (`.merch-hero`, so the site keeps its two hero treatments rather than gaining a third), and a reading block (`.legal`). The share card is the home page's (`share-bobby-guitar.jpg`), since the page has no picture of its own. What it says, each from the code:
  - the contact form (`index.html`): name, email and message, posted from the browser straight to FormSubmit, which delivers it to Bobby. The site keeps no copy. The address isn't printed: the site shows none;
  - the Merch page's Buy buttons: PayPal takes the payment and the shipping address (`no_shipping=2`) on its own pages;
  - the three YouTube embeds on the home page, and the Spotify, Apple Music, Amazon Music and YouTube links;
  - our own log (`functions/_middleware.js`): the page, what sent the visitor, device and browser, town, state, country and provider as Cloudflare estimates them; no IP. The beacon records seconds on the page. It doesn't count the form, which carries no `data-form`;
  - `ts_src`, GA4's `_ga` / `_ga_FM5M8NEW51`, YouTube's own cookies;
  - Cloudflare, Google Fonts;
  - questions through the contact form, the only way to reach Bobby the site offers.
- Title "Privacy Policy for bobbygrice.com | Bobby G. Rice" (49), description 157, canonical, OG and Twitter image, `WebPage` + `BreadcrumbList` tied to `#website` and `#person`, the GA4 tag and the beacon. In `sitemap.xml` (yearly, 0.3).
- **The footers:** Privacy after Contact on the home, bio and merch pages (`404.html` has no footer).
- **Checked:** `node build.mjs` (52 files; lastmod: only `/privacy` new). `site-kit check` still reports the earlier items; its FormSubmit note now names `privacy.html` too, for the link to FormSubmit's policy. In the browser pane at 375px: no sideways scroll, 20px gutters, the footer link.
- **Deployed** `30c9a1e5`; submitted (IndexNow 1 URL, 200; Search Console; Bing). Live `https://www.bobbygrice.com/privacy` 200.
- **Scanner** (`--no-psi`): 75, `about-privacy` **pass**: "The home page links an About page (/bio) and a privacy policy (/privacy)."
- **Owed:** nothing for this.

## 2026-09-27 (share cards from Bobby's own pictures; the schema's pictures; the dashboard's icons)
- **What Michael asked:** fix three of the items noted yesterday, each confirmed by `site-kit check`:
  - `/images/og-image.jpg`, the share image on all three pages, had never been in the repo and answered 404, so every share of the site went out with no picture;
  - the MusicGroup's `logo` named `/images/icon-512.png`, removed 2026-09-23;
  - `traffic.html` linked `/favicon.svg` and `/favicon.ico` again. They'd been fixed 2026-09-23 and came back when traffic-kit's `upgrade.mjs --apply` replaced the page on 24 Sept.
- **A share card for each page.** Each is 1200×630, made from Bobby's own pictures already in `images/` (nothing generated), and each is that page's hero in small, with its words in the site's own faces:
  - Home, `images/share-bobby-guitar.jpg`: `hero-bobby.png`, the photo with his Yamaha guitar, so the alt "Bobby G. Rice with his Yamaha guitar" is true now. Beside it are "Legendary Country Music Artist", "Bobby G. Rice" and the hero's three stats (30 Billboard Hits, 4+ Decades, #1 Hit Single).
  - Bio, `images/share-about-bobby.jpg`: `bio-bobby.png`, the bio hero's photo, with "The Legend", "About Bobby" and "Bobby G. Rice". The alt is new: "Bobby G. Rice, arms folded, in an embroidered white western shirt".
  - Merch, `images/share-legacy-edition.jpg`: the Legacy Edition cover, the album the page sells first, beside "Bobby's Merch", "Albums & Autographed CDs" and "Free Shipping in the USA". The alt is "Bobby G. Rice's Legacy Edition album cover".
  - The cards are 106, 89 and 128 KB, under WhatsApp's 300 KB. They're named for their subjects: site-kit calls `og-image` a generic name.
- **The tags:** each page's `og:image`, `og:image:secure_url` and `twitter:image` name its card, with the width and height true (1200×630). Bio gained `twitter:image:alt`. Merch gained `og:image:secure_url`, `og:image:type`, `og:image:alt` and `twitter:image:alt`, the image tags the other two pages already had.
- **The schema's pictures:** the home page's MusicGroup and Person `image` is now `hero-bobby.png`, the photo the hero shows. Structured data describes what's on the page, and the bio's Person already names its own photo. A card with words on it isn't a photo of him. The MusicGroup's `logo` is `icon-192.png`, the one the Organization node uses.
- **`scripts/share-cards.mjs`** draws the cards again: Chrome sets them in the site's faces from Google Fonts, inlined, and Pillow writes the JPGs. `/images/*` is cached immutable for a year (`_headers`), so a card that changes gets a new file name. The home card carries the hero's stats and changes with them (`CLAUDE.md`).
- **`/traffic`'s icons are the site's own:** `/images/favicon-32.png`, `/images/icon-192.png` and `/images/apple-touch-icon.png`, the home page's three. They sit in a `<!-- brand: icons -->` block, written by traffic-kit's `upgrade.mjs --apply`. The page changed by that block alone.
  - traffic-kit `5c99086` (Michael: should the upgrade carry a site's icons so this doesn't regress?). It does now. A page's icon block comes over verbatim. Where a page links an icon its site doesn't serve, the home page's own icons go in instead, and `traffic-kit check` warns about one.
  - Seven other dashboards link icons their sites don't serve. They're in traffic-kit's open items, waiting for Michael's go-ahead.
- **Checked:**
  - `node build.mjs`: 51 files, and no file named that isn't in `dist/`. Before, it named `/favicon.svg` and `/favicon.ico`.
  - `site-kit check`: 4 problems, down from 9. The share image on the three pages and the two icon links are gone. What's left was there before: the meta descriptions of `/bio` (231) and `/merch` (179), the robots.txt groups and the `/traffic` detection. The FAQ step is unchanged: 4 questions, all on the page.
  - `traffic-kit check`: "the icons it links are files the site serves".
  - In the browser pane on `dist/`: each page's `og:image` and `twitter:image` answer 200 `image/jpeg` at 1200×630. The schema's pictures answer 200, and so do the dashboard's icons. The FAQPage is written with its 4 questions, and there are no console errors.
- **Deployed** `2134353f` (production, confirmed through the Pages API).
- **Submitted:** IndexNow took 1 URL (200), and the sitemap was resubmitted to Search Console. Bing has it.
  - The home page is the changed one: its structured data changed. Share tags aren't page content to `site-kit lastmod`, so `/bio` and `/merch` keep their dates.
- **Verified live on www.bobbygrice.com:**
  - The three cards answer 200 `image/jpeg`, 1200×630, the same bytes as the repo's.
  - Each page names its own card in both tags, with its alt, and every schema picture answers 200.
  - `/traffic` links the three icons (200 each) and no longer names `/favicon.svg` or `/favicon.ico`.
  - Nothing names `/images/og-image.jpg` any more (still 404). The apex 301s to www, and bobbygrice.pages.dev still sends `X-Robots-Tag: noindex, nofollow`.
- **Noticed along the way, not changed:** Facebook and LinkedIn keep a page's preview for a while after they first read it. A share there may show the old preview with no picture until they read the page again. Facebook's Sharing Debugger and LinkedIn's Post Inspector refresh it at once (Michael's login).
- **Owed:** nothing for these three. The copy items from yesterday wait for Bobby's word: two CMA nominations against three, and the 50th anniversary as 2022 and 2023. So does one more: "4+ decades" on the site against "six decades" in `llms.txt`. They're recorded in `CLAUDE.md` → Open items.

## 2026-09-26 (the FAQ schema is the visible FAQ: one list, written by the build)
- **The finding** (Michael, confirmed on the live site today): the home page's FAQPage JSON-LD asked four questions that appeared nowhere a visitor could read them, because the page had no FAQ at all. The four: "What was Bobby G. Rice's biggest hit?", "Was Bobby G. Rice nominated for any CMA awards?", "Where is Bobby G. Rice from?" and "Is Bobby G. Rice still performing?". Google's FAQ rules want the markup to describe what the page shows, and ours say the visible FAQ and the schema come from one list.
- The hidden answers had also drifted from the site:
  - one said he moved to Nashville, which the site never says;
  - one named "Then and Now" as his most recent album, where the page's new album is Legacy Edition;
  - one dated the #1 to 1972, where the singles card and the bio say 1973.
- **The fix: a visible FAQ, and the build writes the schema from it.** It's the rule Harmony Tax and Nittany Tax got the same day.
  - `index.html`: a "Questions About Bobby" section between Awards & Honors and Book Bobby, built from the page's own section header, type and gold rules. It holds the four questions in an accordion (`.faq-item`: `button.faq-q` + `.faq-a-inner`). The answers stay open until the page's script runs, so they read without it.
  - The hand-written FAQPage node is gone from the JSON-LD graph. It was cut by its text span; every other node parses back unchanged.
  - `build.mjs` writes the FAQPage into `dist/` from the accordion, word for word. Its `@id` is https://www.bobbygrice.com/#faq, the section's own anchor.
  - A page that carries its own FAQPage stops the build, and so does an accordion item it can't read. Tested in a throwaway copy: both stopped it (exit 1, no dated sitemap).
- **Every answer comes from what the site already says:**
  - The biggest hit: "You Lay So Easy On My Mind", his #1 of 1973 (the singles card, the bio's highlights), with the ASCAP Award it won him (Awards & Honors), the artists who recorded it (About Bobby) and his 30 Billboard singles.
  - CMA: nominated in 1973 for Male Vocalist, Single and Album of the Year, and a CMA/CRS New Faces artist in 1971 (Awards & Honors, the bio).
  - Where he's from: Boscobel, Wisconsin, with the family radio show, the 1970 remakes of "Sugar Shack" and "Hey Baby" and the hometown sign (the bio). The move to Nashville is gone.
  - Still performing: Michael's call, asked in this session, was to answer from the bio and Book Bobby. The bio says "Rice still continues to record, write songs and tour", and Book Bobby offers concerts, festivals, private events and special appearances. The answer also names Legacy Edition as his newest album. If he stops touring, the bio, Book Bobby and this answer change together.
- `.claude/launch.json`: a `bobbygrice-dist` preview (port 4104) that serves `dist/`, since the FAQPage exists only there now.
- **Checked:**
  - `node build.mjs`: FAQPage written from the accordion on 1 page.
  - `site-kit check` (FAQ step, site-kit `aa168ec`): "every FAQPage question and answer is on its page (4 question(s) on 1 page(s))". Before the fix it reported "no page has a visible FAQ" and 4 questions not on the page. Its other 9 problems are the ones it reported before (below, and the meta descriptions of `/bio` and `/merch`, robots.txt groups, the `/traffic` detection).
  - In the browser pane, on `dist/` served locally, the schema's questions and answers equal the accordion's text, 4 of 4. At 375px the accordion opens and closes, the question buttons are 72–89px tall and nothing is wider than the screen. Checked at 1280 too.
- **Deployed** `b6acfea0` (production, confirmed through the Pages API).
- **Submitted:** IndexNow took the 1 changed URL (200), the sitemap was resubmitted to Search Console, and Bing has it.
- **Verified live:** all 3 sitemap URLs fetched. The home page carries one FAQPage with 4 questions, and every question and answer is in its visible text (head, scripts and tags out, case and punctuation aside). The same check on the previous deployment (`147f37dc`) reports all 4 not on the page. bobbygrice.pages.dev is still `noindex, nofollow`.
- **Noticed along the way, not changed:**
  - The meta description says "two-time CMA nominee", while the page lists three nominations in 1973.
  - The bio dates the song's 50th release anniversary to both 2022 and 2023.
  - `/images/og-image.jpg`, the share image on all three pages, has never been in the repo and answers 404 live. The MusicGroup `logo` still names `/images/icon-512.png`, which was removed 2026-09-23.
  - `traffic.html` links `/favicon.svg` and `/favicon.ico` again (the build names them), since the tabbed dashboard replaced the page.
- **Owed:** nothing for the FAQ. To add or change a question, edit the accordion in `index.html`. The items above need Michael's word, and the first two need Bobby's.

## 2026-09-26 (/traffic: Lead Gen Digital Marketing's scanner is logged as ours, never as a visit)
- leadgendigitalmarketing.com now runs a free scan. Its fetches carry `LeadGenDigitalScanner` in a Chrome user agent, and no rule here named it, so the middleware took the scanner for a person and a scan's first page for a visit. Michael asked for it on every site's own-checks list, beside our other two scanners.
- `functions/_middleware.js`: one line in the `// our-checks:` block (traffic-kit `bin/add-our-checks.mjs`, `ccf9c82`). The scanner is now logged as "Nashville's Web Design scanner", the label the agency's own scanner has here, and like any named bot it passes the geo gate.
- Built, checked (`traffic-kit check` Classification ✓), deployed (`147f37dc`, production confirmed through the Pages API), submitted (nothing had changed). Live: a request with the scanner's user agent to the new deployment was logged as "Nashville's Web Design scanner" (`pageviews` 564).
- **Owed:** nothing.

## 2026-09-25 (/traffic: a thank-you page load counts as a sent form only with a saved lead behind it)
- Michael: "roll it out to all the sites", after Three Stone's `/traffic` listed a sent form that was only a load of its thank-you page (traffic-kit CHANGELOG, 2026-09-25).
- `functions/api/pv-event.js` (traffic-kit `bin/add-lead-proof.mjs`, the `// lead-proof:` block) keeps a thank-you page's `form_complete` only while a lead saved in the last two minutes has no `form_complete` yet. Any other load, such as a reload, a restored tab, the address typed or a crawler that runs scripts, is logged as `thankyou_view`, which no count reads.
- This site's D1 has no `leads` table, so nothing changes here yet: every `form_complete` stands, as before. The rule starts to count the day the site's form saves each submission to `leads`.
- Built, deployed (`df1a3430`, production confirmed through the Pages API), submitted. A test beacon to `/api/pv-event` with no lead behind it was logged `form_complete`, as it should be without a `leads` table (events 1), and relabeled `test_form_complete`.
- Past rows are left as they are.
- **Owed:** nothing.

## 2026-09-25 (/traffic: scripts and hosting networks are labeled, never counted)
- Michael, on the traffic audit's options: "go with your recommendation for the hosting networks" (traffic-kit CHANGELOG, 2026-09-25).
- `functions/_middleware.js` (traffic-kit `bin/add-not-people.mjs`, `82b6a28`) now logs two kinds of request as bots, never as visits:
  - "Script": a user agent with no browser engine.
  - "Hosting network": a request from a data-center network (741 of them), less the ones people browse through (iCloud Private Relay, WARP, office security proxies, Google's own network, Meta's).
- It's a label on the logged row only. The geo gate and the source cookie treat these requests as people, so a VPN user's call or form keeps its source.
- Every page view now also keeps the network's number and the user agent (`pageviews.asn`, `pageviews.ua`). The columns were added to the live D1 first, then `migrations/0011_pageviews_asn_ua.sql` and the code.
- Built, checked (`traffic-kit check` Classification ✓), deployed (`6d16db14`, production confirmed through the Pages API), submitted. A request with no browser engine to the new deployment: HTTP 200, logged as "Script" with its network (AS13335) and user agent (pageviews 474).
- Past rows are left as they are.
- **Owed:** nothing.

## 2026-09-25 (/traffic: our own tools and Google's quiet fetchers are no longer visitors)
- Michael asked for an audit of what `/traffic` counts as people (the full audit is in traffic-kit's CHANGELOG, 2026-09-25). Here, 33 page views were ours: 27 from `fleet audit`'s preview-host fetch (Node's own user agent, a Direct visit per run since 19 Sept), and 6 from a run on 23 Sept at 14:18 UTC.
- `functions/_middleware.js` (traffic-kit `bin/add-our-checks.mjs`, `467fe81`) now logs these by name, never as visits:
  - our own tools, which have carried `NashvillesWebDesignCheck` in their user agent since today;
  - our scanners;
  - the desktop app's preview browser;
  - Google's fetchers that don't say "bot": AdWords-Express and AdWords-Instant, Read-Aloud, BusinessLinkVerification, NotebookLM, Apps Script, a bare "Google", and the rest of Google's list.
- Built, checked (`traffic-kit check` Classification ✓), deployed (`0feb9a4f`, production confirmed through the Pages API), submitted. A request with the token to the new deployment: HTTP 200, logged as "Nashville's Web Design check" (pageviews 469).
- Past rows are left as they are (Michael: "leave the current data alone and just fix for future").
- **Owed:** nothing.

## 2026-09-25 (/traffic: the Bing tab draws again)
- Michael: "bing is working on the traffic page for sbcnashville, but not on nittanytax or harmonytax, check all sites and fix bing."
- **The cause:** since the tabbed page went on (24 Sept), its Bing tab threw whenever Bing had no search figures for the site. It counted the window back from Bing's latest day, which is null until Bing reports, and the date made from it threw, so the whole tab read "This part of the page couldn't be drawn". The sitemap, the pages Bing has found and the pages it couldn't read never showed, though the data was there.
- **Fixed** in traffic-kit (`182c67b`), with truer copy on how long Bing takes. Refreshed here with `upgrade.mjs --apply`, which changed the page only. Built, checked, deployed (`754e2dce`) and submitted through `fleet deploy`. The live page carries the fix. Its Bing tab was drawn in a local harness with this site's own live data: no error.
- **What Bing shows today:** no search figures yet (Bing prepares a newly added site’s figures over about two days, then runs a few days behind); the sitemap read 23 Sept (1 page); no page asked about yet (first in line tonight, client sites first now); no page Bing couldn’t read.
- **Owed:** nothing.

## 2026-09-24 (/traffic: a Chrome prefetch is not Google's ad review)
- Michael: roll out to every dashboard the fix first made on Blair Custom Interiors, where a lead from a Google ad came out "Unknown". Chrome fetches Google's results and ads before the click through Google's own proxy, so the fetch comes from Google's network with the ad's gclid on it. This morning's ad-review rule filed those fetches as "Google ad review", which gets no source cookie. An opened one was never counted as a visit, and its call or form lost where it came from.
- `node ~/traffic-kit/bin/add-ad-review.mjs . --apply` (traffic-kit): a request with `Sec-Purpose: prefetch` is never ad review. It is logged as "Chrome prefetch", not as a visit, and keeps its source cookie. `functions/api/pv-view.js` was added, and the `prefetched-view` block went into `assets/js/traffic-beacons.js`: when someone opens a prefetched page, it posts the visit there, once per page. The crawler card on /traffic names prefetches on their own line. Built, checked, deployed (`242a0596`), submitted.
- No Google-network ad hits in this site's log, so there was nothing to correct.
- **Owed:** nothing.

## 2026-09-24 (/traffic: the sender's name on each form)
- Michael: show the name of the person who filled out the form in the Edge tab. This site sends through FormSubmit, so there is no record of the submission on the site to read a name from; where forms appear the card says so (traffic-kit `76050de`). Names come for free if the site moves to the Cloudflare lead form.
- `upgrade.mjs --apply`: `data.js` patched (`leadNames()`), `ads.js` and the page refreshed. Built, checked, deployed (`65f57c3f`); `/traffic` live with the new page.

## 2026-09-24 (/traffic: the tabbed dashboard)
- Michael: redesign the traffic page on every site — a tab for each source (Edge first, then Search Console, Analytics, Google Ads, Bing), colorful, with explanations, charts, and a Download PDF for each tab. We don't run this business's Google Ads, so its Google Ads tab is the offer: what ads would do for the business, built from its own numbers (visits from Google search, the searches ranking 4–20, visits from anyone else's ads), how we run them, and Book a call / Email Michael / the phone.
- `node ~/traffic-kit/bin/upgrade.mjs . --apply` (traffic-kit `491ce36`): `traffic.html` replaced with the tabbed page, the bar and the name carried over; `functions/api/traffic/ads.js` added (the Google Ads tab); `migrations/0010_ads.sql` added (the Ads tables, only ever applied where we run the ads).
- `functions/api/traffic/data.js` patched: day-of-week × hour and visits by source by day for the new charts, forms credited to the page their visit began on (a form is logged on the thank-you page), 53 weeks of Search Console (was 26).
- `functions/api/traffic/watch.js` added: the Search Console tab's "Edit the list" (the searches we are working to win) had no endpoint here — traffic-kit's installer never shipped it — so saving answered "Could not reach the server". It now saves to this site's `rank_watch`, which the weekly Search Console ingest mirrors.
- Built; `traffic-kit check` clean. Deployed (`d3fa565c`), submitted. Live: `https://www.bobbygrice.com/traffic` serves the tabbed page; `/api/traffic/ads` and `/api/traffic/watch` answer 401 signed out. Every column the new queries read was checked in the live D1 first.
- Refreshed the same evening with the kit's second print pass (traffic-kit `6dde5a5`: reports break between rows instead of leaving half-empty pages, the stacked cards print side by side, each switchable chart says what it shows); redeployed (`8fed9907`).
- **Owed:** nothing.

## 2026-09-24 (Bing: www.bobbygrice.com)
- Michael: add the www host in Bing (the open item in the entry below).
- `bing.mjs add www.bobbygrice.com --apply`: added and verified. Bing uses one verification record for the bare domain and www, and it was already in the zone, so no DNS changed.
- **Bing then folded the two into one property.** It now lists only `https://www.bobbygrice.com/`, and both URLs answer with the same sitemap record (`/sitemap.xml`, read 24 Sept, no errors).
- gsc-ingest's `map-bing.mjs --apply` now pushes `https://www.bobbygrice.com/` into this site's D1, and it retired the bare-domain row.
  - Nothing needed clearing. The bare-domain property had left no history here, only its sitemap row, which the first www push replaced.
  - That run also mapped sbcnashville.com, which SBC's switch had added to Bing minutes earlier. It was the only other change.
- Section 4 now reads "Connected as https://www.bobbygrice.com/". "Pages Bing has found" lists the sitemap's 3 pages, not asked about yet: Bing had throttled the account's page lookups for the day, so the nightly pull asks next run.
- `site-kit submit` finds the www property from now on, since it tries the site's own host first. It reported that Bing has the sitemap. Nothing on the site changed, so no build and no deploy.
- **Owed:** nothing.

## 2026-09-24 (/traffic section 4: what Bing holds now)
- Michael: add four things from Bing to the traffic page on every dashboard: which of the site's pages Bing has found and when it last read each, the pages it couldn't read, pages in its index over time, and the sitemap's status. `add-bing.mjs --apply` (traffic-kit `cf8ef48`) refreshed section 4 and `functions/api/traffic/bing.js`. The figures come from gsc-ingest's nightly Bing pull (`66f863c`). "What Bing has read" and the two new panels show even while Bing has no search figures.
- What Bing holds for bobbygrice.com today: the sitemap `www.bobbygrice.com/sitemap.xml` read 24 Sept, 1 page, no errors; no problem pages; its pages can't be asked about (below).
- **Bing's site is `https://bobbygrice.com/`, but the site now serves www** (the apex 301s there, and the sitemap lists `www.bobbygrice.com` pages). Bing refuses page lookups outside its property's host, so "Pages Bing has found" stays empty, and Bing's search figures for the www pages don't land in this property. Fixing it means adding `https://www.bobbygrice.com/` in Bing Webmaster Tools and re-running gsc-ingest's `map-bing.mjs --apply`. That's Michael's call; it isn't done.
- Built, deployed (`321a52e2`), submitted (nothing new to send).
- **Owed:** Michael's call on adding the www host in Bing (above); until then section 4 shows only the bare domain's property.

## 2026-09-24 (GA4 moved to a Nashville's Web Design property; /traffic Analytics)
- **GA4 is now `G-FM5M8NEW51` (property 555802348, the Nashville's Web Design account)**, in place of `G-1RNWQ6TWQV` (property 539719729). That property sits in the old Zorva daily-digest account, which michael@nashvilleswebdesign.com cannot see, so nothing could feed this site's `/traffic` from it. Michael's call, after an audit of every dashboard. The ID is swapped in `index.html`, `bio.html`, `merch.html` and `404.html`. The new property starts its history today; the old one is simply no longer fed.
- `/traffic` section 3: the site is in `~/nashvilles-network/scripts/ga4-ingest.mjs` (nightly, 06:00 CT). `functions/api/traffic/data.js` now returns `dims`, the breakdowns the six Analytics cards read (pages, channels, events, new users, countries, devices). GA4 needs a day or two before the first figures.
- Built, deployed, submitted. Confirmed on the live domain: the tag loads with the new ID and sends its page view, and the visit showed in the property's GA4 Realtime.

## 2026-09-24 (ad-review visits)
- **/traffic logs Google's own ad-review visits as bots.** Google loads ad landing pages from its own network with an ordinary browser user agent and a gclid, so the edge log counted each one as a person arriving from an ad. On Blair Custom Interiors, where it was found, that was 18 of the first 40 ad visits. `functions/_middleware.js` now carries traffic-kit's `adReviewBot()`, patched in by `~/traffic-kit/bin/add-ad-review.mjs`: a request from Google's networks (AS15169, AS396982) with a click id is the bot "Google ad review". It matches by network number, so Google Fiber customers still count as people. Committed, not deployed from here: another session's uncommitted work was in this working tree, so the change goes live with the next deploy.
- Backfill: 0 earlier row(s) matched (`isp = 'Google LLC' AND gclid = 1`) and are now `is_bot = 1, bot_name = 'Google ad review'` (re-run after the deploy for anything logged in between).

## 2026-09-23 (the /traffic edge panel's token)
- **The `/traffic` edge panel has credentials again.** It read Cloudflare's zone analytics with the global API key (`CF_ANALYTICS_EMAIL` + `CF_ANALYTICS_KEY`), which stopped authenticating when the account's email changed (22:09 UTC); those secrets were cleared, but the replacement was never put on this project, so the panel sat dark. `CF_ANALYTICS_TOKEN` — the read-only "Traffic-API" token (Zone Analytics: Read, `~/.env`), which the panel's code already reads first — is now a Pages secret on `bobbygrice` (`wrangler pages secret put`), listed in `site.json → cloudflare.secrets`; redeployed the same night so it binds (0 pages changed). The token was checked against this estate's zone analytics before it went on.

## 2026-09-23 (one host — the apex 301s to www; clean page URLs)
- **Found from zorvalabs.com's client list session:** `https://bobbygrice.com/` and `https://www.bobbygrice.com/` both answered 200 with no redirect — the whole site on two hosts, one of them held back only by the canonical tag.
- **The host is www, not the estate's usual apex.** The site has been canonical on www since it was built — all 63 URLs in its pages, sitemap, robots.txt and llms.txt say www — and Search Console (the domain property `sc-domain:bobbygrice.com`, URL Inspection) shows Google indexing `https://www.bobbygrice.com/` and filing the apex as "Alternate page with proper canonical tag"; every click and impression of the last 90 days (85 and 3,415 on the home page) is on www. Moving to the apex would only make Google re-choose every URL. zorvalabs.com's links already point at www — nothing to change there.
- **The apex now answers only with a 301 to www**, path and query kept (gclid, fbclid, utm), `/.well-known/` excluded so the apex certificate can renew — in two places: a Single Redirect rule on the zone, which turned out to be on our Cloudflare account all along (`1c7ae11d…`, Free; `site.json` had `zoneId: null`) and catches everything, `/images/*` and `/assets/*` and plain http included, in one hop; and the same block first thing in `functions/_middleware.js`, so it travels with the repo. Tested the middleware with fake requests first. Checked live with curl: the apex's pages, images, script and `http://` all 301 to the same path on www with the query kept; `/.well-known/acme-challenge/test` is not redirected; www answers 200.
- **The same kind of duplicate inside the site.** The bio and merch pages declared their canonical, og:url, twitter:url and schema URLs (the Person `@id`, the offers, the breadcrumb) as `/bio.html` and `/merch.html`, which Pages 308s to `/bio` and `/merch` — a canonical pointing at a redirect. Google had overridden it for the bio page (`/bio` indexed, "user canonical" `bio.html`) and did not know `/merch` at all, and the sitemap listed only the home page. Now every one of those URLs is the clean one, the nav and footer links go straight to `/`, `/bio`, `/merch` and `/#…` (no redirect hop), and the sitemap lists all three pages (`site-kit lastmod` dated bio and merch today; the home page keeps 2026-09-17). The old `.html` addresses keep working through Pages' 308.
- `*.pages.dev` was already noindexed (the 2026-09-23 middleware change is live: `x-robots-tag: noindex, nofollow`). Built (48 files, no missing links); a preview deployment (`host-check`) checked in the pane — the Bio and Merch links land on `/bio` and `/merch`, the canonicals and schema carry no `.html`; deployed to production with `site.json → deploy.command`: IndexNow took the 2 changed pages (200), the sitemap was resubmitted to Search Console, Bing notified.
- `site.json`: the zone id, the redirect rule, why the host is www, the Search Console property; the manual says the same and drops three stale lines (deploying the repo root, `.assetsignore`, the GA4 digest email, which ended estate-wide on 2026-09-23).

## 2026-09-24
- Code only: the /traffic edge panel (Cloudflare zone analytics over GraphQL) now authenticates with `CF_ANALYTICS_TOKEN` — the read-only account token "Traffic-API" (Zone Analytics: Read), `CF_ANALYTICS_TOKEN` in `~/.env` — and falls back to the old `CF_ANALYTICS_EMAIL` + `CF_ANALYTICS_KEY` pair, which held the global API key that stopped authenticating estate-wide on 2026-09-23 (traffic-kit, same change in every copy). This site has no zone id and no analytics credentials, so its panel stays off; the fix is here for when it is connected.

## 2026-09-23 (bobbygrice.pages.dev noindex — deploy pending)
- **`bobbygrice.pages.dev` gets noindex.** Found in the estate sweep that followed a Search Console notice about harmonytax.pages.dev: this site's preview host answered 200 with `index, follow` and no header — an indexable copy of bobbygrice.com, held back only by the canonical tag. `functions/_middleware.js` now sets `x-robots-tag: noindex, nofollow` on every response whose host ends in `.pages.dev` (deployment aliases included) — the same block as Nittany Tax's (the HTML path that may also set the source cookie, and everything else) — and never on bobbygrice.com. Checked first that bobbygrice.com (apex and www) serves the site itself and does not redirect to the pages.dev host, and that the pages.dev canonical points at bobbygrice.com. Tested with a fake context (on pages.dev the page, a stylesheet, a 404 and a deployment alias carry the header; on bobbygrice.com nothing does); built.
- **Not deployed yet.** The Cloudflare Global API Key in `~/.env` stopped authenticating at 22:10 UTC — a change of the Cloudflare account's email was requested at 22:09 — so `wrangler pages deploy` answered `Unknown X-Auth-Key or X-Auth-Email`. Owed: run `site.json → deploy.command` once `~/.env` works, then check `curl -sI https://bobbygrice.pages.dev/` shows the header and `https://bobbygrice.com/` does not. `fleet audit` fails this site until then.

## 2026-09-23 (build check, icons)
- `build.mjs`'s link check no longer reports an encoded fragment (`%23…`, from an inline SVG data URI) as a missing file, so a build that warns is a build with a real broken link.
- **`/traffic` linked icons this site never had** (`/favicon.svg`, `/favicon.ico` from the dashboard template — 404s the build now names); it links the site's own (/images/favicon-32.png). Deployed; checked live, every icon answers 200.
- **`manifest.json` listed a 512px icon that was never made** (`/images/icon-512.png`, 404). Removed rather than stretching the 192px one into a blurry icon; the 192px and apple-touch icons remain.

## 2026-09-23 (stop publishing the repo)
- **The site no longer publishes its internal files.** It was deployed from the repo root (`wrangler pages deploy .`), and Pages uploads everything there except `functions/`, `node_modules` and `.git` — the `.assetsignore` meant to prevent that is a Workers static-assets file Pages never reads. So `/CLAUDE.md`, `/CHANGELOG.md`, `/site.json` (client contact details), `/wrangler.toml`, `/.indexnow.json`, `/.gitignore`, `/.claude/launch.json` and every `/migrations/*.sql` answered 200. New `build.mjs` copies an allow-list into `dist/` — every root `.html` page (404 and `/traffic` included), the named files and folders, the IndexNow key; inside the folders nothing for the repo (`.md`, `.sql`, `.py`, `.sh`, `.log`, `.toml`, dotfiles, `migrations/`) — names any file a page links to that it did not copy, and ends with `site-kit lastmod` (the sitemap's real dates now go into `dist/sitemap.xml`; the root `sitemap.xml` carries none). `site.json → deploy.command` is `npx wrangler pages deploy dist …`; `site.json → build` is `node build.mjs` → `dist`; `wrangler.toml` `pages_build_output_dir = "dist"`; `.assetsignore` removed. Functions ship as before (wrangler reads `./functions` from the repo root).
- **The middleware refuses repo files** (`isRepoFile` → the site's own 404, `no-store`), whatever a deploy uploads. It was needed at once: after the first `dist/` deploy the domain still answered 200 for the exact URLs fetched during the before-check — copies held by Pages' edge (`s-maxage=604800`, a growing `age`, `cf-cache-status: DYNAMIC`; a zone purge did not reach them) while any other path, or the same one with a query string, was already 404. The middleware answers before that cache, so they went 404 on the next deploy.
- Checked: of the 64 files the root deploy published, the 48 in `dist/` are exactly the public ones, byte for byte — everything dropped is internal. A preview deployment (`--branch=allowlist-check`) served every `dist/` file and none of the internal ones, in the browser pane the pages rendered and the forms were intact (not submitted — a test would reach the client), and `/traffic` rendered its sign-in with the API answering as a function. After the production deploy the live domain serves every public file (200), `/CLAUDE.md`, `/CHANGELOG.md`, `/site.json`, `/wrangler.toml` and `/.indexnow.json` answer 404, `/traffic` shows its sign-in and `/api/traffic/data` answers 401 without a session.

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
