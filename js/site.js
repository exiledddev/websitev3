/* ============================================================
   Blackwall — shared behaviour
   Loaded on every page. Page-specific work lives elsewhere
   (js/promote.js), so the home page no longer ships the deck.
   ============================================================ */
(function () {
  'use strict';

  var body    = document.body;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- entrance ---------- */

  function revealAll(scope) {
    var els = (scope || document).querySelectorAll('.reveal:not(.is-in)');
    Array.prototype.forEach.call(els, function (el) { el.classList.add('is-in'); });
  }

  /* Anything below the fold waits until it is actually scrolled to. */
  var io = ('IntersectionObserver' in window)
    ? new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (!e.isIntersecting) return;
          e.target.classList.add('is-in');
          glitchOnce(e.target);
          io.unobserve(e.target);
        });
      }, { rootMargin: '0px 0px -12% 0px' })
    : null;

  /* ---------- glitch ---------- */

  /* The split only runs once per element on entry; hover re-arms it
     through CSS alone, so nothing here has to track pointer state. */
  function glitchOnce(el) {
    if (reduced) return;
    var targets = el.classList && el.classList.contains('glitch')
      ? [el]
      : el.querySelectorAll ? el.querySelectorAll('.glitch') : [];

    Array.prototype.forEach.call(targets, function (g) {
      g.classList.remove('is-glitching');
      void g.offsetWidth;
      g.classList.add('is-glitching');
      window.setTimeout(function () { g.classList.remove('is-glitching'); }, 1400);
    });
  }

  /* ---------- reach counter ---------- */

  function countUp(el) {
    var to = parseInt(el.getAttribute('data-count-to'), 10) || 0;
    if (reduced) { el.textContent = to.toLocaleString('en-US'); return; }

    var DUR = 1900;
    var t0 = 0;

    requestAnimationFrame(function step(now) {
      if (!t0) t0 = now;
      var p = Math.min(1, (now - t0) / DUR);
      var eased = 1 - Math.pow(1 - p, 4);            // settles, rather than stopping dead
      el.textContent = Math.round(to * eased).toLocaleString('en-US');
      if (p < 1) requestAnimationFrame(step);
    });
  }

  /* ---------- page transition ---------- */

  /* These are real navigations now, so the wipe has to finish before the
     browser leaves. Covering takes COVER ms; the next document lifts its
     own veil on load. Without JS the link is just a link. */
  var COVER = 620;
  var swipe = document.getElementById('swipe');

  function leaveTo(url) {
    if (!swipe || reduced) { window.location.href = url; return; }
    swipe.setAttribute('data-state', 'cover');
    window.setTimeout(function () { window.location.href = url; }, COVER);
  }

  document.addEventListener('click', function (e) {
    var a = e.target.closest ? e.target.closest('a[data-wipe]') : null;
    if (!a) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;   // let new-tab through

    e.preventDefault();
    leaveTo(a.getAttribute('href'));
  });

  /* Arriving: if the previous page covered the screen, lift it. */
  function uncover() {
    if (!swipe) return;
    swipe.setAttribute('data-state', 'uncover');
    window.setTimeout(function () { swipe.setAttribute('data-state', 'idle'); }, 760);
  }

  /* ---------- start ---------- */

  function begin() {
    revealAll(document.querySelector('.nav'));
    revealAll(document.querySelector('.hero'));

    if (io) {
      Array.prototype.forEach.call(
        document.querySelectorAll('.reveal:not(.is-in), .glitch'),
        function (el) { io.observe(el); }
      );
    } else {
      revealAll();
    }

    var hero = document.querySelector('.hero .glitch');
    if (hero) glitchOnce(hero);

    var counter = document.querySelector('[data-count-to]');
    if (counter) countUp(counter);

    document.dispatchEvent(new CustomEvent('site:ready'));
  }

  document.addEventListener('intro:reveal', function () {
    body.setAttribute('data-reveal', 'in');
  });

  document.addEventListener('intro:done', function () {
    body.setAttribute('data-intro', 'done');
    begin();
  });

  /* The intro lives on the home page only, and plays on every load of it.
     Pages without it start straight away.

     This has to wait for the document: begin() fires site:ready, and the
     page-specific script is still a <script> tag below this one. Dispatching
     synchronously here would hand it to nobody. */
  function skipIntro() {
    body.setAttribute('data-intro', 'done');
    body.setAttribute('data-reveal', 'in');
    uncover();
    begin();
  }

  if (!document.getElementById('intro')) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', skipIntro);
    } else {
      window.setTimeout(skipIntro, 0);
    }
  }
})();
