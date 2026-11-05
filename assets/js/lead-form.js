/* The booking form on the home page. It posts to /api/lead, which saves the
   message in the site's database first and emails it afterward. A 200 means
   received; only success:true means saved, and only that goes to /thank-you,
   the arrival the visit log counts as a completed form. The site prints no
   phone or email address, so a failure asks the visitor to try again. */
(function () {
  'use strict';
  var form = document.querySelector('form[action="/api/lead"]');
  if (!form) return;
  var button = form.querySelector('button[type="submit"]');
  var status = form.querySelector('[data-form-status]');
  var label = button.textContent;
  var rendered = Date.now();

  function say(message) { status.textContent = message; status.hidden = false; }
  function ready() { button.disabled = false; button.textContent = label; }

  /* Back from /thank-you can restore this page with the button still on "Sending…". */
  window.addEventListener('pageshow', function (e) { if (e.persisted) ready(); });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var payload = {};
    new FormData(form).forEach(function (value, key) { payload[key] = value; });
    payload.page = location.pathname;
    payload.hp_ms = String(Date.now() - rendered);

    button.disabled = true;
    button.textContent = 'Sending…';
    status.hidden = true;

    fetch('/api/lead', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(function (res) { return res.json(); })
      .then(function (body) {
        if (body && body.success === true) { location.href = '/thank-you'; return; }
        if (!body || body.ok !== true) throw new Error('not saved');
        say('Thank you. Your message was sent.');
        form.reset();
        ready();
      })
      .catch(function () {
        say('Sorry, your message did not go through. Please try again in a few minutes.');
        ready();
      });
  });
})();
