/* GA4 for bobbygrice.com (2026-10-09). The measurement id sits on this
   file's own tag as data-ga4, so no script is inline. The queue starts at
   once and holds the page view; Google's gtag/js (about 150 KB) waits for the
   first tap, key or scroll, or GA4_WAIT ms after the page has loaded, so it
   stays clear of the first paint (the home page's phone LCP was 10.7 s on
   2026-10-09 with it loading at once). A visit that ends before it loads is
   still in /traffic, which logs every page at the edge. /privacy says this. */
(function () {
  var GA4_WAIT = 3500;
  var tag = document.querySelector('script[data-ga4]');
  var id = tag && tag.getAttribute('data-ga4');
  if (!id) return;
  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { window.dataLayer.push(arguments); };
  window.gtag('js', new Date());
  window.gtag('config', id);

  var first = ['pointerdown', 'keydown', 'scroll', 'touchstart'];
  var loaded = false;
  function load() {
    if (loaded) return;
    loaded = true;
    first.forEach(function (t) { window.removeEventListener(t, load, true); });
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(id);
    document.head.appendChild(s);
  }
  first.forEach(function (t) { window.addEventListener(t, load, { capture: true, passive: true }); });
  function later() { setTimeout(load, GA4_WAIT); }
  if (document.readyState === 'complete') later();
  else window.addEventListener('load', later);
})();
