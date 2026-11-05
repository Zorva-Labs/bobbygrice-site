// High-confidence BOT signals for the public lead form. Near-zero false
// positives, so callers DROP these silently (the normal success shape, so the
// bot does not retry) into D1 lead_drops. botReason and turnstileReason FAIL
// OPEN when their field is absent (a no-JS submit, an old cached page);
// scriptlessReason is the one that does not — a submission with neither field
// is held (below). solicitationReason never drops: it flags a sales pitch.
//
//   1. honeypot `zq7x` — a display:none field a human never sees or fills. A
//      non-semantic name on purpose: a semantic one ("company") is autofilled by
//      password managers and discarded real people for weeks. A value that
//      copies the person's own name, email, phone or address is a browser's
//      autofill, not a bot (Chrome on cabinetmakerpro.com, 2026-10-01: the field
//      was only off-screen, so it could be filled, and a real lead was dropped).
//      A real drop's reason carries the value (`honeypot: …`).
//   2. `hp_ms` — active ms from form render to submit; under 2 s is not a human.
//
// Returns a short reason string for a drop, or null.
const MIN_FILL_MS = 2000;
export function botReason(data) {
  const g = (k) => (data && data[k] != null ? String(data[k]) : '');
  const hp = g('zq7x').trim();
  if (hp) {
    const low = hp.toLowerCase();
    const own = ['name', 'email', 'phone', 'address', 'city', 'zip'].map((k) => g(k).trim().toLowerCase()).filter((v) => v.length >= 2);
    if (!own.some((v) => v.includes(low) || low.includes(v))) return `honeypot: ${hp.slice(0, 60)}`;
  }
  const ms = parseInt(g('hp_ms'), 10);
  if (Number.isFinite(ms) && ms >= 0 && ms < MIN_FILL_MS) return 'too_fast';
  return null;
}

// Verify a Cloudflare Turnstile token server-side (env.TURNSTILE_SECRET, the
// Pages secret site-kit deploy stores when it makes the widget). Returns
// "turnstile_failed" ONLY when siteverify rejects the token itself
// (invalid-input-response). FAILS OPEN (null) on no secret, no token, a
// stale or reused token (timeout-or-duplicate: a real person who idled), any
// network error, and every other failure code — invalid-input-secret,
// missing-input-secret, bad-request and internal-error mean a wrong or
// rotated secret, a malformed call or Cloudflare's own fault, not a bot. Those
// are logged, so a broken secret shows in the logs instead of silently
// dropping every visitor who got a token (2026-09-24, ~/fleet/docs/gotchas.md).
export async function turnstileReason(env, token, ip) {
  const secret = env && env.TURNSTILE_SECRET;
  if (!secret) return null;
  if (!token) return null;
  try {
    const body = new URLSearchParams();
    body.set('secret', secret);
    body.set('response', String(token));
    if (ip) body.set('remoteip', ip);
    const r = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body });
    const out = await r.json().catch(() => null);
    if (out && out.success === false) {
      const codes = out['error-codes'] || [];
      if (codes.includes('timeout-or-duplicate')) return null;
      if (codes.length && codes.every((c) => c === 'invalid-input-response')) return 'turnstile_failed';
      console.warn('[turnstile] siteverify error, not counted as a bot (check TURNSTILE_SECRET):', codes.join(', ') || 'no error code');
      return null;
    }
    return null;
  } catch {
    return null;
  }
}

// A submission the page's own script never touched: main.js stamps `hp_ms` on
// every submit, and the Turnstile widget adds `cf-turnstile-response`. With
// neither, the form was posted straight to the endpoint by a tool, not sent
// from the page — the contact-form blasters of Sept–Oct 2026 all looked like
// this (sbcnashville.com: empty `page`, CRLF line breaks, made-up towns; the
// honeypot and the time trap caught none of them, since both fail open on a
// missing field). Such a submission is HELD: kept in lead_drops as `no_script`,
// never emailed (Michael, 2026-10-03, the estate default since). A real visitor
// with JavaScript off lands here too, so look in lead_drops before telling
// anyone a lead never came. Every form posting here needs the hidden `hp_ms`
// field (`site-kit check` → Lead form fails one without it), and anything else
// that posts here (the site assistant, the scan widget) sends `hp_ms` itself.
export function scriptlessReason(data) {
  const g = (k) => (data && data[k] != null ? String(data[k]).trim() : '');
  if (/^\d+$/.test(g('hp_ms'))) return null;
  if (g('cf-turnstile-response')) return null;
  return 'no_script';
}

// Sales pitches typed into the real form by people (or by bots that drive a
// whole browser) — no captcha stops those. They are never dropped: the lead is
// saved and emailed as usual, with "[Likely solicitation]" at the front of the
// subject and the signs in leads.flag, so the owner can skip it. One strong
// sign flags; weak signs need two. Returns the signs that matched, joined, or
// null. Tuned on sbcnashville.com's rows (2026-10-03): all 7 pitches flagged,
// none of the 9 real leads.
const STRONG = [
  [/\bdear (sir|madam|sir\/madam)\b/i, '“Dear Sir”'],
  [/\b(generate|get|more|new) (more )?(leads|traffic)\b/i, 'selling leads or traffic'],
  [/\b(seo|search engine optimi[sz]ation|backlinks?|first page of google)\b/i, 'selling SEO'],
  [/\bunsubscribe\b|\breply (with )?["“]?yes\b|\bfree (report|audit|demo|trial)\b/i, 'marketing mail'],
  [/\b(web visitors|lead generation|marketing (services|agency|strategy)|virtual assistants?|business coach)\b/i, 'selling marketing'],
  [/\b\d{1,2}% off\b|\bfree shipping\b|\border (yours|now)\b/i, 'selling products'],
  [/\b(rfq|request for quotation|qualified (providers|vendors|suppliers|contractors)|vendor registration)\b/i, 'vendor sign-up pitch'],
  /* Buying or selling links. The dominant pitch of late 2026: three reached
     postcardsforless.com in two weeks (2026-10-22, 2026-11-04) and the list
     above caught none of them on their words — only their fake phone numbers,
     which a real customer can also mistype. Added 2026-11-04. */
  [/\b(link (insertions?|placements?|exchanges?|building)|paid (links?|placements?|insertions?|collaboration)|guest post|add a link|backlink opportunit)/i, 'buying or selling links'],
  [/\bin exchange for payment\b|\btakes placements\b|\bsponsored (post|article|content)\b/i, 'paying for placement'],
  [/\b(chief (executive|operating|financial) officer|sales manager|business development (manager|executive))\b/i, 'sender signs with a sales title'],
  [/\binterest in your services\b|\bappropriate (person|contact)\b/i, 'vendor-inquiry template'],
];
const WEAK = [
  [/https?:\/\/|\bwww\./i, 'a link'],
  [/\byour (website|site|business|company)\b/i, '“your website/business”'],
  [/\b(finds|find) you well\b/i, '“finds you well”'],
  [/\b(llc|ltd|inc|gmbh|pvt)\b\.?/i, 'a company suffix'],
  [/\b(potential customers|visitors|leads|sales)\b/i, 'talks about leads or sales'],
];
const MARKETING_DOMAIN = /(seo|marketing|leadgen|leads|coach|digital|media|agency|growth|outreach|webdesign|websolutions?|\bvas?\b)/i;

export function solicitationReason(data, siteDomain) {
  const g = (k) => (data && data[k] != null ? String(data[k]) : '');
  const email = g('email').trim().toLowerCase();
  const phone = g('phone').replace(/\D/g, '');
  const text = [g('message'), g('name')].join('\n');
  const site = String(siteDomain || '').toLowerCase().replace(/^www\./, '');
  const hits = [];
  const domain = email.split('@')[1] || '';
  if (site && (domain === site || domain.endsWith(`.${site}`))) hits.push(`email at ${site} itself`);
  if (domain && MARKETING_DOMAIN.test(domain.replace(/\.[a-z]+$/, ''))) hits.push(`marketing email domain (${domain})`);
  /* An impossible US number is a WEAK sign, not a strong one (2026-11-04). It
     used to flag on its own, and on postcardsforless.com's rows that cost a
     real customer: he mistyped his area code and his quote request would have
     reached the owner marked as a likely sales pitch. It catches nothing the
     words above miss — all three link pitches that hit that site flag on their
     wording, and the one with a valid number (bizcentralhelp.com, 2026-10-22)
     was invisible to this check anyway. */
  const soft = [];
  if (phone) {
    const n = phone.length === 11 && phone[0] === '1' ? phone.slice(1) : phone;
    if (!/^[2-9](?!11)\d\d[2-9]\d{6}$/.test(n)) soft.push('phone is not a real US number');
  }
  for (const [re, label] of STRONG) if (re.test(text)) hits.push(label);
  if (hits.length) return hits.join('; ');
  const weak = [...soft, ...WEAK.filter(([re]) => re.test(text)).map(([, label]) => label)];
  if (site && text.toLowerCase().replace(/\s+/g, '').includes(site.split('.')[0])) weak.push('names our domain');
  return weak.length >= 2 ? weak.join('; ') : null;
}
