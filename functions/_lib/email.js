// Transactional mail for the site: Cloudflare Email Routing through the MAIL
// service binding (workers/mail), sending as MAIL_FROM. No Google Cloud, no
// third party, nothing that expires. With no MAIL binding the send is skipped
// and reported (`no_transport`) — the lead is still in D1, and the row says so.
//
// Env (wrangler.toml [vars]): MAIL_FROM ("Name <website@forms.<domain>>"),
// MAIL_DEFAULT_REPLY (Reply-To when the caller sets none), SITE_NAME,
// SITE_DOMAIN (the shell's header and footer).
const DEFAULT_REPLY = 'michael@nashvilleswebdesign.com';

// Best-effort send. Never throws. Returns { status, json, messageId } on
// success or { skipped, reason | error, messageId } on failure.
//   to (string or array; every address gets its own copy, all sent at once by
//   the Worker — ok when at least one went out, `partial` + `error` naming the
//   rest), subject, html, text,
//   replyTo, from, messageId
export async function sendEmail(env, opts) {
  const toList = Array.isArray(opts.to) ? opts.to : (opts.to ? [opts.to] : []);
  if (!toList.length) return { skipped: true, reason: 'no_recipients' };
  const from = opts.from || env.MAIL_FROM || `${siteBrand(env).name} <website@forms.${siteBrand(env).domain}>`;
  const messageId = opts.messageId || makeMessageId(addrDomain(from));
  if (!(env.MAIL && typeof env.MAIL.fetch === 'function')) {
    console.warn('[email] no mail transport (MAIL binding) — skipping send');
    return { skipped: true, reason: 'no_transport', messageId };
  }
  // Both alternative parts, always: an empty text/html part renders as a blank
  // email in HTML-preferring clients.
  const text = opts.text || (opts.html ? htmlToText(opts.html) : '');
  const html = opts.html || (text ? textToHtml(text) : '');
  try {
    const res = await env.MAIL.fetch('https://mail/', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ from, to: toList, replyTo: opts.replyTo || env.MAIL_DEFAULT_REPLY || DEFAULT_REPLY, subject: opts.subject, html, text, messageId }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || !json.ok) {
      console.error('[email] Cloudflare send failed:', res.status, json.error);
      return { skipped: true, status: res.status, error: json.error || `mail_worker_http_${res.status}`, messageId };
    }
    if (Array.isArray(json.failed) && json.failed.length) {
      const error = json.failed.map((f) => `${f.to}: ${f.error}`).join('; ').slice(0, 240);
      console.error('[email] not delivered to', error);
      return { status: res.status, json, messageId, partial: true, error };
    }
    return { status: res.status, json, messageId };
  } catch (e) {
    console.error('[email] Cloudflare send threw:', (e && e.message) || e);
    return { skipped: true, error: (e && e.message) || 'mail_worker_failed', messageId };
  }
}

const addrDomain = (s) => ((String(s).match(/@([^>\s]+)/) || [])[1] || 'nashvilleswebdesign.com').toLowerCase();

export function makeMessageId(domain = 'nashvilleswebdesign.com') {
  return `<${Math.random().toString(36).slice(2, 14)}.${Date.now().toString(36)}@${domain}>`;
}

/* Which site this mail is from: the name in the header, the signature and the
   footer is the site the visitor used — never the agency behind it. */
export function siteBrand(env, over) {
  const e = env || {}, o = over || {};
  const fromName = String(e.MAIL_FROM || '').match(/^\s*"?([^"<]*?)"?\s*</)?.[1]?.trim();
  const name = String(o.siteName || e.SITE_NAME || fromName || 'Bobby G. Rice').trim();
  const domain = String(o.siteDomain || e.SITE_DOMAIN || 'bobbygrice.com').replace(/^https?:\/\//, '').replace(/\/+$/, '').toLowerCase();
  return { name, domain, url: `https://${domain}`, email: o.siteEmail || e.MAIL_DEFAULT_REPLY || DEFAULT_REPLY };
}

function htmlToText(html) {
  if (!html) return '';
  let t = String(html);
  t = t.replace(/<(style|script|head)[\s\S]*?<\/\1>/gi, ' ');
  t = t.replace(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi, (_m, href, inner) => {
    const label = inner.replace(/<[^>]+>/g, '').trim(); const u = href.trim();
    return label && label !== u ? `${label} (${u})` : u;
  });
  t = t.replace(/<(?:br|\/p|\/div|\/tr|\/li|\/h[1-6]|\/table|\/ul|\/ol)[^>]*>/gi, '\n').replace(/<[^>]+>/g, '');
  t = t.replace(/&nbsp;/gi, ' ').replace(/&amp;/gi, '&').replace(/&lt;/gi, '<').replace(/&gt;/gi, '>').replace(/&quot;/gi, '"').replace(/&#39;/gi, "'").replace(/&mdash;/gi, '—');
  return t.replace(/[ \t]+/g, ' ').replace(/ *\n */g, '\n').replace(/\n{3,}/g, '\n\n').trim();
}

function textToHtml(text) {
  const esc = escapeHtml(String(text || '')).replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" style="color:#1f3a5f;text-decoration:underline">$1</a>');
  return `<div style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6;color:#1A1919;white-space:pre-wrap">${esc}</div>`;
}

/* The shared shell: neutral paper, the site's name in the header and footer.
   No remote fonts or images — a web-font pull is a minor spam signal. */
const BRAND = { bg: '#F6F5F1', accent: '#1f3a5f', ink: '#1A1919', inkSoft: '#403B38', muted: '#6B6560', line: '#E2DFD6' };

function defaultSignature(site) {
  return `<div style="margin-top:28px;padding-top:18px;border-top:1px solid ${BRAND.line};font-size:14px;line-height:1.7;color:${BRAND.inkSoft}">Thanks,<br/><strong style="color:${BRAND.ink}">${escapeHtml(site.name)}</strong><br/><a href="${site.url}" style="color:${BRAND.accent};text-decoration:none">${escapeHtml(site.domain)}</a><br/><a href="mailto:${escapeHtml(site.email)}" style="color:${BRAND.accent};text-decoration:none">${escapeHtml(site.email)}</a></div>`;
}

export function brandedEmail(env, { title, preheader, body, ctaLabel, ctaUrl, footer, signature, siteName, siteDomain, siteEmail } = {}) {
  const site = siteBrand(env, { siteName, siteDomain, siteEmail });
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>${escapeHtml(title)}</title>
</head>
<body style="margin:0;padding:0;background:${BRAND.bg};font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;color:${BRAND.ink}">
<span style="display:none;font-size:1px;color:${BRAND.bg};max-height:0;max-width:0;opacity:0;overflow:hidden">${escapeHtml(preheader || '')}</span>
<div style="max-width:600px;margin:0 auto;padding:32px 20px">
  <div style="text-align:center;padding:8px 0 22px"><a href="${site.url}" style="color:${BRAND.ink};text-decoration:none;font-weight:800;font-size:19px;letter-spacing:-0.01em">${escapeHtml(site.name)}</a></div>
  <div style="background:#ffffff;border:1px solid ${BRAND.line};border-top:4px solid ${BRAND.accent};border-radius:10px;padding:38px 34px">
    <div style="font-size:11px;font-weight:700;letter-spacing:0.22em;color:${BRAND.accent};text-transform:uppercase;margin:0 0 10px">${escapeHtml(site.name)}</div>
    <h1 style="font-weight:800;font-size:26px;line-height:1.12;letter-spacing:-0.02em;margin:0 0 18px;color:${BRAND.ink}">${title}</h1>
    ${body}
    ${ctaUrl ? `<p style="text-align:center;margin-top:24px"><a href="${ctaUrl}" style="display:inline-block;background:${BRAND.accent};color:#ffffff;text-decoration:none;padding:15px 30px;font-size:14px;font-weight:700;border-radius:6px">${escapeHtml(ctaLabel || 'Open')}</a></p>` : ''}
    ${signature === false ? '' : (signature || defaultSignature(site))}
  </div>
  <div style="text-align:center;font-size:12px;color:${BRAND.muted};margin-top:22px;line-height:1.7">
    ${footer || `${escapeHtml(site.name)}<br/><a href="mailto:${escapeHtml(site.email)}" style="color:${BRAND.accent};text-decoration:none">${escapeHtml(site.email)}</a> · <a href="${site.url}" style="color:${BRAND.accent};text-decoration:none">${escapeHtml(site.domain)}</a>`}
  </div>
</div>
</body>
</html>`;
}

export function escapeHtml(s) {
  if (s == null) return '';
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
