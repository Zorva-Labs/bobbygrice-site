// POST /api/lead — the contact form. Saves the lead to D1 first (the source of
// truth), then emails it through Cloudflare Email Routing (_lib/email.js → the
// MAIL service binding → workers/mail), sent as MAIL_FROM with the visitor as
// Reply-To. The page posts JSON and gets JSON back; a browser with scripts off
// posts the form natively and gets a 303 to /thank-you, but its submission
// carries no hp_ms, so it is held in lead_drops as `no_script`, not emailed
// (spam.js scriptlessReason). Otherwise a saved row is the success — a lead is never silently lost while the mail transport
// is catching up (rulebook 41; ~/fleet/docs/reference/email.md).
//
//   { ok: true, success: true, id }   saved (and emailed, or notify_error recorded on the row)
//   { ok: true }                       received but dropped as a bot or held — the normal shape, so the bot does not retry
//   { ok: false, error }               not saved — the page shows the phone number and the email address instead
//
// Env (wrangler.toml [vars], Pages secrets, bindings): SITE_NAME, SITE_DOMAIN,
// STAFF_EMAIL (who is told), MAIL_FROM, MAIL_DEFAULT_REPLY, GEO_ALLOW,
// TURNSTILE_SECRET (a secret), DB (D1) and MAIL (the mail Worker).
import { sendEmail, brandedEmail, escapeHtml } from '../_lib/email.js';
import { botReason, scriptlessReason, solicitationReason, turnstileReason } from '../_lib/spam.js';
import { visitOf, saveVisit, sourceTag, sourceText, sourceHtml } from '../_lib/visit.js';

const siteOf = (env) => ({
  name: env.SITE_NAME || 'Bobby G. Rice',
  domain: env.SITE_DOMAIN || 'bobbygrice.com',
  email: env.MAIL_DEFAULT_REPLY || 'bobbynalice@yahoo.com',
});

export async function onRequestPost({ request, env, waitUntil }) {
  const url = new URL(request.url);
  const SITE = siteOf(env);
  const ct = request.headers.get('content-type') || '';
  const wantsJson = ct.includes('application/json') || (request.headers.get('accept') || '').includes('application/json');

  let d = {};
  try {
    if (ct.includes('application/json')) d = await request.json();
    else { const fd = await request.formData(); for (const [k, v] of fd.entries()) d[k] = v; }
  } catch { /* fall through to validation */ }
  const g = (k) => (d[k] == null ? '' : String(d[k]).trim());

  const json = (body, status = 200) => new Response(JSON.stringify(body), {
    status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });
  const thanks = () => Response.redirect(`${url.origin}/thank-you`, 303);
  const back = () => Response.redirect(`${url.origin}/?error=1#contact`, 303);

  // Geo + anti-spam gate. Traffic from outside GEO_ALLOW and bots (a filled honeypot, a
  // submit faster than a human can type, a Turnstile token Cloudflare
  // rejected) are dropped SILENTLY with the normal success shape so they do
  // not retry — never emailed, never counted in `leads`, but kept in
  // `lead_drops` with the reason, so a real person a check caught can still be
  // found and answered. Those checks FAIL OPEN. The one that does not: a
  // submission the page's script never touched (no hp_ms, no Turnstile token)
  // is HELD as `no_script` — form blasters post this way (Michael, 2026-10-03).
  // The middleware exempts /api/, so the geo rule is repeated here.
  {
    const country = (request.cf && request.cf.country) || '';
    const allow = String(env.GEO_ALLOW || '').split(',').map((c) => c.trim().toUpperCase()).filter(Boolean);
    const nonUS = allow.length && country && !allow.includes(country);
    const bot = botReason(d) || scriptlessReason(d) || (await turnstileReason(env, d['cf-turnstile-response'], request.headers.get('CF-Connecting-IP') || ''));
    if (nonUS || bot) {
      const reason = nonUS ? `non-US (${country})` : bot;
      console.warn('[lead] dropped:', reason);
      if (env.DB) {
        try {
          await env.DB.prepare('INSERT INTO lead_drops (reason, name, email, phone, message, page, country, hp_ms, ua) VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9)')
            .bind(reason, g('name').slice(0, 120) || null, g('email').slice(0, 200) || null, g('phone').slice(0, 40) || null, g('message').slice(0, 5000) || null,
              g('page').slice(0, 300) || null, country || null, g('hp_ms').slice(0, 20) || null, (request.headers.get('user-agent') || '').slice(0, 300) || null).run();
        } catch (e) { console.error('[lead] drop log failed', (e && e.message) || e); }
      }
      return wantsJson ? json({ ok: true }) : thanks();
    }
  }

  const name = g('name');
  const email = g('email');
  const phone = g('phone');
  const page = (g('page') || request.headers.get('referer') || '').slice(0, 300);
  const country = (request.cf && request.cf.country) || '';
  const validEmail = /^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(email);
  const validPhone = phone.replace(/\D/g, '').length >= 7;
  // a sales pitch typed into the form: saved and emailed like any lead, the
  // subject marked so the owner can skip it (never dropped)
  const flag = solicitationReason(d, SITE.domain);
  if (!name || !(validEmail || validPhone)) return wantsJson ? json({ ok: false, error: 'invalid' }, 400) : back();

  const fields = {
    name: name.slice(0, 120), phone: phone.slice(0, 40) || null, email: (validEmail ? email : '').slice(0, 200) || null,
    address: g('address').slice(0, 200) || null, city: g('city').slice(0, 80) || null, state: g('state').slice(0, 20) || null, zip: g('zip').slice(0, 20) || null,
    service: g('service').slice(0, 120) || null, hear: g('hear').slice(0, 120) || null, message: g('message').slice(0, 5000) || null,
    page: page || null, country: country || null,
  };

  // 1. Store. This is the lead; everything after it is notification.
  let leadId = null;
  const db = env.DB;
  if (db) {
    try {
      const insert = (row) => {
        const cols = Object.keys(row);
        return db.prepare(`INSERT INTO leads (${cols.join(', ')}) VALUES (${cols.map((_, i) => `?${i + 1}`).join(',')}) RETURNING id`)
          .bind(...cols.map((k) => row[k])).first();
      };
      let r;
      try { r = await insert({ ...fields, flag: flag ? flag.slice(0, 300) : null }); }
      catch (e) {
        // a leads table without the flag column (migrations/lead_flag.sql not yet applied): the row still goes in, unflagged
        if (!/flag/.test(String((e && e.message) || e))) throw e;
        r = await insert(fields);
      }
      leadId = r && r.id;
    } catch (e) { console.error('[lead] insert failed', (e && e.message) || e); }
  }

  // Where the lead came from — the visit cookie and the edge (_lib/visit.js); on the row and in the mail.
  const visit = visitOf(request);
  if (leadId != null) await saveVisit(env.DB, leadId, visit);

  // 2. Notify. From the site's own sending address to the owner's mailbox,
  //    with the visitor as Reply-To so a reply goes to the person — and a
  //    "Reply to <name>" button for clients that ignore Reply-To.
  /* Email Routing takes 5–8 s a send, and waiting for it before answering
     left visitors on "Sending…" long enough to press again or leave: on
     sbcnashville.com (2026-09-28) one browser disconnected, which cancelled
     the send, and that lead was never emailed. So once the row is saved the
     visitor gets the answer at once and the mail goes out after the response
     (waitUntil); only when nothing was saved does the answer wait for the
     mail, since then the mail is the lead. */
  const notify = async () => {
    let notified = false;
    let notifyError = null;
    try {
      const rows = [['Name', name], ['Phone', phone || '—'], ['Email', email || '—'], ['Service', fields.service || '—'],
        ['Address', [fields.address, fields.city, fields.state, fields.zip].filter(Boolean).join(', ') || '—'],
        ['Heard about us', fields.hear || '—'], ['Message', fields.message || '—'], ['Page', page || '—'], ['Country', country || '—'],
        ...(flag ? [['Flagged', `Looks like a sales pitch: ${flag}`]] : [])];
      // STAFF_EMAIL may be a comma list; each address must be a verified destination
      const to = String(env.STAFF_EMAIL || SITE.email).split(',').map((x) => x.trim()).filter(Boolean);
      const subject = `${flag ? '[Likely solicitation] ' : ''}${SITE.name}: ${fields.service || 'New request'} — ${name}${sourceTag(visit)}`;
      const text = `${rows.map(([k, v]) => `${k}: ${v}`).join('\n')}\n\n${sourceText(visit)}`;
      const html = brandedEmail(env, {
        siteName: SITE.name, siteDomain: SITE.domain, siteEmail: SITE.email,
        title: `New request — ${escapeHtml(name)}`,
        preheader: `${fields.service || 'New request'} from ${name}`,
        signature: false,
        body: `<table style="border-collapse:collapse;width:100%;font-size:14px">${rows.map(([k, v]) =>
          `<tr><td style="padding:7px 12px 7px 0;color:#6B6560;white-space:nowrap;vertical-align:top">${escapeHtml(k)}</td><td style="padding:7px 0;color:#1A1919;white-space:pre-wrap">${escapeHtml(v)}</td></tr>`).join('')}</table>${sourceHtml(visit)}`,
        ctaLabel: `Reply to ${name}`,
        ctaUrl: validEmail ? `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(`Re: your message to ${SITE.name}`)}` : (phone ? `tel:${phone.replace(/[^\d+]/g, '')}` : ''),
        footer: `Sent by the form on <a href="https://www.bobbygrice.com/#contact">www.bobbygrice.com/#contact</a>`,
      });
      const res = await sendEmail(env, { to, subject, html, text, replyTo: validEmail ? email : undefined });
      // notified = at least one recipient got it; a partial send still records who missed it
      notified = !res.skipped && (!res.error || res.partial === true);
      if (res.error || res.skipped) notifyError = String(res.reason || res.error || 'unknown').slice(0, 200);
    } catch (e) {
      notifyError = String((e && e.message) || e).slice(0, 200);
      console.error('[lead] email failed', notifyError);
    }
    if (db && leadId != null) {
      await db.prepare('UPDATE leads SET notified=?, notify_error=? WHERE id=?')
        .bind(notified ? 1 : 0, notifyError, leadId).run().catch(() => {});
    }
    return { notified, notifyError };
  };

  // A row is the success. No row and no email is the one case the visitor must
  // hear about, so they call or write instead of waiting for a reply that will
  // never come.
  const success = leadId != null;
  if (success && typeof waitUntil === 'function') {
    waitUntil(notify());
    return wantsJson ? json({ ok: true, success, id: leadId }) : thanks();
  }
  const { notified, notifyError } = await notify();
  if (!success && !notified) {
    console.error('[lead] NOT SAVED and NOT SENT', notifyError);
    return wantsJson ? json({ ok: false, error: 'unavailable' }, 503) : back();
  }
  return wantsJson ? json({ ok: true, success, id: leadId }) : thanks();
}
