// Lead-alert sender for bobbygrice.com, through Cloudflare Email Routing.
//
// Called only through the Pages project's service binding (MAIL):
//   POST / { from, to, subject, text, html, replyTo?, messageId? }
//   → { ok: true, messageId, sent, failed } | { ok: false, error, failed }
//   `to` is an address, a comma list or an array; each gets its own copy.
//
// `from` must be on a domain whose mail records Cloudflare holds — the site's
// forms.<domain> subdomain once its zone is on Cloudflare (scripts/hookup.mjs
// enables it; a SUBDOMAIN so the client's own MX stays), and
// forms.nashvilleswebdesign.com while the site is a pitch — and `to` must be
// a verified destination address in the account (the owner clicks
// Cloudflare's one-time verification email). Cloudflare signs the message with
// the zone's cf2024-1 DKIM selector. No third party, nothing that expires.
import { EmailMessage } from 'cloudflare:email';

export default {
  async fetch(request, env) {
    if (request.method !== 'POST') return json({ ok: false, error: 'POST only' }, 405);
    let m;
    try { m = await request.json(); } catch { return json({ ok: false, error: 'bad json' }, 400); }
    const from = String(m.from || '').trim();
    const to = (Array.isArray(m.to) ? m.to : String(m.to || '').split(',')).map((s) => String(s).trim()).filter(Boolean);
    if (!from || !to.length || !m.subject) return json({ ok: false, error: 'from, to and subject are required' }, 400);

    const messageId = m.messageId || `<${crypto.randomUUID()}@${addr(from).split('@')[1] || 'forms.bobbygrice.com'}>`;
    const raw = buildMime({ ...m, from, to: to.join(', '), messageId });
    /* One copy per recipient, all at once: each Email Routing send takes 5–8 s,
       and one after another three of them took up to 25 s on sbcnashville.com
       (2026-09-28). ok when at least one went out; `failed` lists the rest —
       typically "destination address not verified" until the owner clicks. */
    const rcpts = [...new Set(to.map(addr))];
    const results = await Promise.allSettled(rcpts.map((rcpt) => env.SEND.send(new EmailMessage(addr(from), rcpt, raw))));
    const sent = [], failed = [];
    results.forEach((r, i) => {
      if (r.status === 'fulfilled') sent.push(rcpts[i]);
      else failed.push({ to: rcpts[i], error: String((r.reason && r.reason.message) || r.reason).slice(0, 160) });
    });
    if (!sent.length) return json({ ok: false, error: failed.map((f) => `${f.to}: ${f.error}`).join('; ').slice(0, 240), failed, messageId }, 502);
    return json({ ok: true, messageId, sent, failed });
  },
};

const json = (body, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { 'content-type': 'application/json; charset=utf-8' },
});

/* The bare address out of "Name <a@b>" — EmailMessage wants envelope addresses. */
function addr(s) { const mm = /<([^>]+)>/.exec(s); return (mm ? mm[1] : s).trim(); }

/* ---- RFC 822 message: multipart/alternative, base64 parts ----------------- */
function buildMime(m) {
  const boundary = `alt_${crypto.randomUUID()}`;
  const text = m.text || htmlToText(m.html || '');
  const html = m.html || `<pre style="font:15px/1.5 -apple-system,Segoe UI,Helvetica,Arial,sans-serif">${escapeHtml(text)}</pre>`;
  const H = [
    `From: ${fmtAddr(m.from)}`,
    `To: ${fmtAddr(m.to)}`,
    m.replyTo ? `Reply-To: ${fmtAddr(m.replyTo)}` : null,
    `Subject: ${encodeHeaderWord(m.subject)}`,
    `Message-ID: ${m.messageId}`,
    `Date: ${new Date().toUTCString()}`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
  ].filter(Boolean);
  return `${H.join('\r\n')}\r\n\r\n` +
    `--${boundary}\r\nContent-Type: text/plain; charset="UTF-8"\r\nContent-Transfer-Encoding: base64\r\n\r\n${b64(text)}\r\n` +
    `--${boundary}\r\nContent-Type: text/html; charset="UTF-8"\r\nContent-Transfer-Encoding: base64\r\n\r\n${b64(html)}\r\n` +
    `--${boundary}--\r\n`;
}

function b64(str) {
  const bytes = new TextEncoder().encode(String(str));
  let bin = ''; for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/(.{76})/g, '$1\r\n');
}

/* "Name <a@b>" with a MIME-encoded or quoted display name; a bare address as-is. */
function fmtAddr(s) {
  const mm = String(s || '').match(/^\s*(.*?)\s*<([^>]+)>\s*$/);
  if (mm) { const name = mm[1].replace(/^"|"$/g, ''); return name ? `${encodeHeaderWord(name, true)} <${mm[2]}>` : mm[2]; }
  return String(s || '').trim();
}

function encodeHeaderWord(v, isName) {
  const s = String(v || '');
  if (/^[\x00-\x7F]*$/.test(s)) return isName && /[",<>()@:;.\\[\]]/.test(s) ? `"${s.replace(/([\\"])/g, '\\$1')}"` : s;
  const bytes = new TextEncoder().encode(s);
  let bin = ''; for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return `=?UTF-8?B?${btoa(bin)}?=`;
}

function htmlToText(html) {
  return String(html).replace(/<(style|script|head)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<(?:br|\/p|\/div|\/tr|\/li|\/h[1-6]|\/table)[^>]*>/gi, '\n').replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ').replace(/&amp;/gi, '&').replace(/&lt;/gi, '<').replace(/&gt;/gi, '>').replace(/&quot;/gi, '"').replace(/&#39;/gi, "'")
    .replace(/[ \t]+/g, ' ').replace(/ *\n */g, '\n').replace(/\n{3,}/g, '\n\n').trim();
}

function escapeHtml(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
