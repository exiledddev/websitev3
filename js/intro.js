/* ============================================================
   MarkedExiled — intro sequence

   1. the mark is framed so tightly that its white fill IS the screen
   2. it pulls back until it is a logo sitting dead centre
   3. it slides left, "MarkedExiled" rises letter by letter beside it
   4. a circle mask closes upward and carries the lockup away

   Step 2 is driven by animating the SVG viewBox rather than by CSS
   transform: scale(). The pull-back covers a ~100x range, and a scaled
   raster would be a blurry mess on the way down — a viewBox is re-rendered
   from the vector every frame, so every frame is sharp.
   ============================================================ */

(function () {
  'use strict';

  var TIMING = {
    whiteHold:     170,  // beat of full white before the pull-back starts
    zoom:         1250,  // mark pulls back to logo size
    handoff:        80,  // beat once it lands
    slide:         740,  // row slides left to make room for the text
    letter:        620,  // per-letter rise
    letterStagger:  46,  // gap between letters
    lettersLead:   440,  // letters begin while the row is still settling
    holdAfterText: 300,  // beat on the finished lockup
    wipe:          850   // circle mask carries everything upward
  };

  /* Geometry of the mark, in its own 600x600 viewBox.
     ANCHOR is the centre of the largest fully-solid area of the glyph — found
     by running a distance transform over the filled region, then confirming
     the clearance by ray-marching isPointInFill in 720 directions (43.04).
     Framing tighter than SOLID_R around that point guarantees a screen of
     pure white with no background showing through, at any aspect ratio.
     Re-measure these two if the mark itself ever changes. */
  var GLYPH  = 600;
  var ANCHOR = { x: 412.5, y: 370.5 };
  var SOLID_R = 43;
  var FILL_SAFETY = 0.85;   // stay comfortably inside that solid area

  var intro   = document.getElementById('intro');
  var zoom    = document.getElementById('introZoom');
  var row     = document.getElementById('introRow');
  var brand   = document.getElementById('introBrand');
  var letters = document.getElementById('brandLetters');

  if (!intro || !zoom || !row || !brand || !letters) return;

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var timers  = [];
  var raf     = 0;
  var started = false;

  /* ---------- easing ---------- */

  // cubic-bezier(x1, y1, x2, y2), solved for y at a given x
  function bezier(x1, y1, x2, y2) {
    function A(a, b) { return 1 - 3 * b + 3 * a; }
    function B(a, b) { return 3 * b - 6 * a; }
    function C(a)    { return 3 * a; }
    function calc(t, a, b) { return ((A(a, b) * t + B(a, b)) * t + C(a)) * t; }
    function slope(t, a, b) { return 3 * A(a, b) * t * t + 2 * B(a, b) * t + C(a); }

    return function (x) {
      if (x <= 0) return 0;
      if (x >= 1) return 1;
      var t = x;
      for (var i = 0; i < 8; i++) {
        var d = slope(t, x1, x2);
        if (d === 0) break;
        var err = calc(t, x1, x2) - x;
        if (Math.abs(err) < 1e-5) break;
        t -= err / d;
      }
      return calc(t, y1, y2);
    };
  }

  // slow to leave the white, quick through the middle, soft landing
  var easeZoom = bezier(0.66, 0, 0.26, 1);

  /* ---------- push timings into CSS ---------- */

  function syncCssTimings() {
    var s = document.documentElement.style;
    s.setProperty('--t-slide',  TIMING.slide + 'ms');
    s.setProperty('--t-letter', TIMING.letter + 'ms');
    s.setProperty('--t-wipe',   TIMING.wipe + 'ms');
  }

  /* ---------- build the per-letter masks ---------- */

  function buildLetters() {
    var text = brand.getAttribute('data-text') || '';
    var frag = document.createDocumentFragment();
    var index = 0;

    for (var i = 0; i < text.length; i++) {
      var ch = text.charAt(i);
      var outer = document.createElement('span');
      outer.className = 'brand__ch';

      if (ch === ' ') {
        outer.className += ' brand__ch--space';
        frag.appendChild(outer);
        continue;
      }

      var inner = document.createElement('span');
      inner.className = 'brand__in';
      inner.textContent = ch;
      inner.style.setProperty('--d', (index * TIMING.letterStagger) + 'ms');
      outer.appendChild(inner);
      frag.appendChild(outer);
      index++;
    }

    letters.innerHTML = '';
    letters.appendChild(frag);
    return index; // number of animated glyphs
  }

  /* ---------- how far the logo must travel ---------- */
  /* The row is laid out at its final width. Shifting it right by half the
     text block (text + gap) puts the logo dead centre; animating that offset
     back to 0 is the slide. */

  function measureShift() {
    var gap = parseFloat(getComputedStyle(row).columnGap || '0') || 0;
    return (brand.getBoundingClientRect().width + gap) / 2;
  }

  function applyShift() {
    row.style.setProperty('--row-shift', measureShift() + 'px');
  }

  /* ---------- the pull-back ---------- */

  /* Everything is expressed as "px per glyph unit" (s). The viewBox that puts
     a given glyph point at a given screen point, at scale s, is:
         w = vw / s,  h = vh / s
         x = glyphX - screenX / s
     The pull-back interpolates s geometrically (a constant-speed dolly; a
     linear ramp over a 100x range would collapse instantly and then crawl)
     while walking the anchor from the solid spot to the middle of the mark,
     and the screen target from the centre of the screen to the logo's slot. */

  function frame() {
    var vw = document.documentElement.clientWidth;
    var vh = document.documentElement.clientHeight;
    var logo = document.getElementById('introLogo').getBoundingClientRect();

    return {
      vw: vw,
      vh: vh,
      // tight enough that the viewport sits inside the mark's solid area
      s0: Math.hypot(vw, vh) / (2 * SOLID_R * FILL_SAFETY),
      s1: logo.width / GLYPH,
      cx: logo.left + logo.width / 2,
      cy: logo.top + logo.height / 2
    };
  }

  function setZoom(f, p) {
    var s  = f.s0 * Math.pow(f.s1 / f.s0, p);
    var gx = ANCHOR.x + (GLYPH / 2 - ANCHOR.x) * p;
    var gy = ANCHOR.y + (GLYPH / 2 - ANCHOR.y) * p;
    var sx = f.vw / 2 + (f.cx - f.vw / 2) * p;
    var sy = f.vh / 2 + (f.cy - f.vh / 2) * p;

    zoom.setAttribute('viewBox',
      (gx - sx / s) + ' ' + (gy - sy / s) + ' ' + (f.vw / s) + ' ' + (f.vh / s));
  }

  function runZoom(done) {
    var f = frame();
    var vw = f.vw, vh = f.vh;
    var t0 = 0;

    setZoom(f, 0);

    raf = requestAnimationFrame(function step(now) {
      if (!t0) t0 = now;

      // a resize mid-flight would otherwise land the mark off its slot
      if (document.documentElement.clientWidth !== vw ||
          document.documentElement.clientHeight !== vh) {
        applyShift();
        f = frame();
        vw = f.vw;
        vh = f.vh;
      }

      var p = Math.min(1, (now - t0) / TIMING.zoom);
      setZoom(f, easeZoom(p));

      if (p < 1) {
        raf = requestAnimationFrame(step);
      } else {
        raf = 0;
        done();
      }
    });
  }

  /* ---------- timeline ---------- */

  function at(ms, fn) {
    timers.push(window.setTimeout(fn, ms));
  }

  function clearTimeline() {
    timers.forEach(window.clearTimeout);
    timers = [];
    if (raf) { cancelAnimationFrame(raf); raf = 0; }
  }

  function setState(name) {
    intro.setAttribute('data-state', name);
  }

  function finish() {
    setState('done');
    document.dispatchEvent(new CustomEvent('intro:done'));
  }

  // everything from the moment the mark lands on its slot
  function lockup() {
    setState('logo');

    at(TIMING.handoff, function () { setState('slide'); });

    var lettersAt = TIMING.handoff + TIMING.slide - TIMING.lettersLead;
    at(lettersAt, function () { setState('letters'); });

    var textDone = lettersAt
      + Math.max(0, glyphCount - 1) * TIMING.letterStagger
      + TIMING.letter;

    var wipeAt = textDone + TIMING.holdAfterText;
    at(wipeAt, function () {
      setState('wipe');
      // the page underneath comes in while the mask is on its way out
      document.dispatchEvent(new CustomEvent('intro:reveal'));
    });
    at(wipeAt + TIMING.wipe, finish);
  }

  var glyphCount = 0;

  function play() {
    started = true;
    clearTimeline();
    glyphCount = buildLetters();
    applyShift();

    if (reduced) {
      setState('letters');
      document.dispatchEvent(new CustomEvent('intro:reveal'));
      at(900, finish);
      return;
    }

    setState('idle');
    setZoom(frame(), 0);

    at(TIMING.whiteHold, function () {
      setState('zoom');
      runZoom(lockup);
    });
  }

  /* ---------- keep the measurements honest ---------- */

  window.addEventListener('resize', function () {
    var state = intro.getAttribute('data-state');
    if (state === 'idle') { applyShift(); setZoom(frame(), 0); }
    else if (state === 'logo') { applyShift(); }
  });

  // Dev convenience: press R to replay the sequence.
  window.addEventListener('keydown', function (e) {
    if (e.key === 'r' || e.key === 'R') play();
  });

  /* Hidden tabs clamp setTimeout to ~1s and freeze rAF, which would shred
     the timeline. Wait until the page is actually being looked at. */
  function whenVisible(fn) {
    if (!document.hidden) { fn(); return; }
    document.addEventListener('visibilitychange', function onVis() {
      if (document.hidden) return;
      document.removeEventListener('visibilitychange', onVis);
      fn();
    });
  }

  // Auto-start once and once only — a manual replay counts as the start.
  function start() {
    whenVisible(function () { if (!started) play(); });
  }

  syncCssTimings();

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(start).catch(start);
  } else {
    window.addEventListener('load', start);
  }
})();
