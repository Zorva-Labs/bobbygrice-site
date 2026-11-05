-- Where each lead came from, on the lead itself (Michael, 2026-10-24: every
-- form sends the traffic info with the lead; Three Stone's 0013 was the first,
-- 2026-10-23).
--
-- Filled at insert time by functions/api/lead.js (functions/_lib/visit.js)
-- from the first-party entry cookie the edge middleware sets on the visit's
-- first hit (channel, campaign, referrer, landing page, device, when the visit
-- started) and from request.cf (the rest) — the same context `events` has
-- carried since the conversion-context migrations, so a lead and a tap-to-call
-- are counted the same way. The endpoint inserts without these columns if they
-- are missing, so a lead is never lost to an unapplied migration.
--
-- geo_* is the edge's estimate of where the connection was, kept apart from
-- city/state/zip, which are what the customer typed. No IP address is stored
-- here, as nowhere else in this database. `node ~/site-kit/bin/add-lead-source.mjs`
-- adds only the columns a live table lacks.
ALTER TABLE leads ADD COLUMN channel       TEXT;     -- Google Ads | Google (organic) | AI search | Direct …
ALTER TABLE leads ADD COLUMN referrer_host TEXT;     -- host that sent them, when there was one
ALTER TABLE leads ADD COLUMN gclid         INTEGER DEFAULT 0;  -- arrived on a Google Ads click
ALTER TABLE leads ADD COLUMN landing       TEXT;     -- the page they entered the site on
ALTER TABLE leads ADD COLUMN device        TEXT;     -- mobile | tablet | desktop
ALTER TABLE leads ADD COLUMN first_seen    TEXT;     -- when the visit started, for time-to-convert
ALTER TABLE leads ADD COLUMN utm_source    TEXT;
ALTER TABLE leads ADD COLUMN utm_medium    TEXT;
ALTER TABLE leads ADD COLUMN browser       TEXT;
ALTER TABLE leads ADD COLUMN os            TEXT;
ALTER TABLE leads ADD COLUMN language      TEXT;
ALTER TABLE leads ADD COLUMN geo_city      TEXT;
ALTER TABLE leads ADD COLUMN geo_region    TEXT;
ALTER TABLE leads ADD COLUMN geo_postal    TEXT;
ALTER TABLE leads ADD COLUMN metro         TEXT;
ALTER TABLE leads ADD COLUMN timezone      TEXT;
ALTER TABLE leads ADD COLUMN isp           TEXT;
ALTER TABLE leads ADD COLUMN asn           INTEGER;
