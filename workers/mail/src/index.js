// Lead-alert sender for __DOMAIN__, through Cloudflare Email Sending.
//
// Called only through the Pages project's service binding (MAIL):
//   POST / { from, to, subject, text, html, replyTo? }
//   → { ok: true, messageId, sent, failed } | { ok: false, error, failed }
//   `to` is an address, a comma list or an array; each gets its own copy.
//
// `from` is on the estate's one sending domain, leads.nashvilleswebdesign.com,
// onboarded once for the whole account (2026-11-07). That is the whole design:
// any address can receive with nothing for the owner to click, and no DNS on
// the client's domain, so nothing changes at the cutover and the form works the
// same from the first pitch to the live site. ~/fleet/docs/reference/email.md.
export default {
  async fetch(request, env) {
    if (request.method !== 'POST') return json({ ok: false, error: 'POST only' }, 405);
    let m;
    try { m = await request.json(); } catch { return json({ ok: false, error: 'bad json' }, 400); }
    const from = parseAddr(m.from);
    const to = (Array.isArray(m.to) ? m.to : String(m.to || '').split(',')).map((s) => String(s).trim()).filter(Boolean);
    if (!from.email || !to.length || !m.subject) return json({ ok: false, error: 'from, to and subject are required' }, 400);

    const text = m.text || htmlToText(m.html || '');
    const html = m.html || `<pre style="font:15px/1.5 -apple-system,Segoe UI,Helvetica,Arial,sans-serif">${escapeHtml(text)}</pre>`;
    const replyTo = m.replyTo ? parseAddr(m.replyTo).email : undefined;
    /* One copy per recipient, all at once. ok when at least one went out;
       `failed` lists the rest, and the endpoint writes them on the row. */
    const rcpts = [...new Set(to.map((a) => parseAddr(a).email))];
    const results = await Promise.allSettled(rcpts.map((rcpt) => env.SEND.send({
      from: from.name ? { email: from.email, name: from.name } : from.email,
      to: rcpt, subject: String(m.subject), text, html, ...(replyTo ? { replyTo } : {}),
    })));
    const sent = [], failed = [];
    let messageId = null;
    results.forEach((r, i) => {
      if (r.status === 'fulfilled') { sent.push(rcpts[i]); messageId = messageId || r.value?.messageId || null; }
      else failed.push({ to: rcpts[i], error: String((r.reason && r.reason.message) || r.reason).slice(0, 160) });
    });
    if (!sent.length) return json({ ok: false, error: failed.map((f) => `${f.to}: ${f.error}`).join('; ').slice(0, 240), failed }, 502);
    return json({ ok: true, messageId, sent, failed });
  },
};

const json = (body, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { 'content-type': 'application/json; charset=utf-8' },
});

/* "Name <a@b>" → { name, email }; a bare address → { email }. */
function parseAddr(s) {
  const mm = String(s || '').match(/^\s*(.*?)\s*<([^>]+)>\s*$/);
  if (mm) return { name: mm[1].replace(/^"|"$/g, ''), email: mm[2].trim() };
  return { email: String(s || '').trim() };
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
