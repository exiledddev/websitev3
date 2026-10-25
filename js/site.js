/* ============================================================
   Blackwall — shared behaviour
   Loaded on every page. Page-specific work lives elsewhere
   (js/promote.js), so the home page no longer ships the deck.
   ============================================================ */
/* ============================================================
   Code matrix

   The Breach Protocol grid: a square of hex bytes solved by
   alternating between a row and a column. The cursor locks to a
   row, takes a cell, locks to that cell's column, takes another,
   and so on - which is what gives it its rhythm.

   Shared, because the intro and the contact reveal both use it.
   ============================================================ */
window.MEMatrix = (function () {
  'use strict';

  var BYTES = ['1C', '55', '7A', 'BD', 'E9', 'FF'];

  function html(n, label) {
    var cells = '';
    for (var i = 0; i < n * n; i++) {
      cells += '<i>' + BYTES[(Math.random() * BYTES.length) | 0] + '</i>';
    }
    var id = BYTES[(Math.random() * BYTES.length) | 0] + BYTES[(Math.random() * BYTES.length) | 0];
    return '<div class="matrix" style="--n:' + n + '">' +
             '<div class="matrix__head">' +
               '<span class="matrix__glyph"></span>' +
               '<span class="matrix__title">' + (label || 'Code Matrix') + '</span>' +
               '<span class="matrix__id">0x' + id + '</span>' +
             '</div>' +
             '<div class="matrix__cells">' + cells + '</div>' +
           '</div>';
  }

  /* Returns a stop(). Pass speed in ms per pick. */
  function run(root, n, speed) {
    var cells = root.querySelectorAll('.matrix__cells i');
    if (!cells.length) return function () {};

    var axis = 0;        // 0 = locked to a row, 1 = locked to a column
    var r = 0, c = 0;
    var picks = 0;
    var timer = 0;

    function idx(row, col) { return row * n + col; }

    function clear(cls) {
      for (var i = 0; i < cells.length; i++) cells[i].classList.remove(cls);
    }

    function paintAxis() {
      clear('is-axis');
      for (var k = 0; k < n; k++) {
        cells[axis === 0 ? idx(r, k) : idx(k, c)].classList.add('is-axis');
      }
    }

    function reset() {
      clear('is-picked');
      clear('is-axis');
      clear('is-head');
      axis = 0; r = 0; c = 0; picks = 0;
      // reshuffle so the same square never solves the same way twice
      for (var i = 0; i < cells.length; i++) {
        cells[i].textContent = BYTES[(Math.random() * BYTES.length) | 0];
      }
    }

    function step() {
      if (picks >= n + 2) { reset(); }

      paintAxis();

      if (axis === 0) c = (Math.random() * n) | 0;
      else            r = (Math.random() * n) | 0;

      var cell = cells[idx(r, c)];
      clear('is-head');
      cell.classList.add('is-picked', 'is-head');

      axis = axis ? 0 : 1;
      picks++;
    }

    timer = window.setInterval(step, speed || 110);
    step();

    return function () { window.clearInterval(timer); };
  }

  return { html: html, run: run };
})();

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

  /* The picture tears rather than fading: scan lines and displaced slabs
     over a juddering page, red on black. These are real navigations, so
     the tear has to finish before the browser leaves; the next document
     opens with the same tear clearing. Without JS the link is a link. */
  var LEAVE = 640;
  var tear  = document.getElementById('tear');
  var halves = document.getElementById('tearHalves');
  var page  = document.getElementById('page');

  /* Half-lines: short horizontal slices at random heights that flicker
     and shunt sideways. Generated per run rather than baked into a
     gradient, so no two tears look the same and the density is real
     rather than a repeating pattern. */
  function buildTear() {
    if (!halves) return;

    var n = Math.round(Math.min(64, Math.max(30, window.innerHeight / 12)));
    var html = '';

    for (var i = 0; i < n; i++) {
      var top = (Math.random() * 100).toFixed(2);
      var w   = (6 + Math.random() * 62).toFixed(1);
      var left = (Math.random() * (100 - w)).toFixed(2);
      var h   = (1 + Math.random() * 7).toFixed(1);
      var dx  = ((Math.random() - 0.5) * 180).toFixed(0);
      var d   = (Math.random() * 420).toFixed(0);
      var hot = Math.random();

      html += '<span class="tear__half' + (hot > 0.84 ? ' is-hot' : '') + '" style="' +
              'top:' + top + '%;left:' + left + '%;width:' + w + '%;height:' + h + 'px;' +
              '--dx:' + dx + 'px;--d:' + d + 'ms"></span>';
    }
    halves.innerHTML = html;
  }

  function leaveTo(url) {
    if (!tear || reduced) { window.location.href = url; return; }
    buildTear();
    tear.classList.add('is-on', 'is-leaving');
    if (page) page.classList.add('is-tearing-page');
    window.setTimeout(function () { window.location.href = url; }, LEAVE);
  }

  document.addEventListener('click', function (e) {
    var a = e.target.closest ? e.target.closest('a[data-wipe]') : null;
    if (!a) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;   // let new-tab through

    e.preventDefault();
    leaveTo(a.getAttribute('href'));
  });

  /* Arriving: the tear is already over the screen, so glitch it away. */
  function arrive() {
    if (!tear || reduced) return;
    buildTear();
    tear.classList.add('is-on', 'is-arriving');
    if (page) page.classList.add('is-tearing-page');

    window.setTimeout(function () {
      tear.classList.remove('is-on', 'is-arriving');
      if (page) page.classList.remove('is-tearing-page');
      if (halves) halves.innerHTML = '';
    }, 680);
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

  /* The intro hands over through the same tear the pages use, so the
     sequence and the navigation read as one effect. */
  document.addEventListener('intro:reveal', function () {
    body.setAttribute('data-reveal', 'in');
    arrive();
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
    arrive();
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
