/* ============================================================
   MarkedExiled — intro

   Breaching the Blackwall:

   1. the grid comes up out of black
   2. ICE windows scale open out of nothing, height first
   3. the traffic inside them decrypts into readable strings
   4. the lockup is the last window through, and says WELCOME
   5. the whole layer lifts

   Nothing zooms. The old sequence pulled the mark back from a
   screen-filling viewBox; this one is built entirely out of
   windows opening, so the mark only ever appears at its real size.
   ============================================================ */

(function () {
  'use strict';

  var TIMING = {
    boot:     520,   // grid and bars rise out of black
    windows: 1700,   // ICE windows snap open, staggered
    decrypt: 1500,   // the traffic resolves
    lockup:   820,   // the lockup window comes through
    hold:    1000,   // long enough to actually read it
    wipe:     820
  };

  var intro = document.getElementById('intro');
  var wins  = document.getElementById('introWins');
  var main  = document.getElementById('introMain');
  var brand = document.getElementById('introBrand');
  var hello = document.getElementById('introWelcome');

  if (!intro || !wins || !main) return;

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var timers  = [];
  var raf     = 0;

  var GLYPHS = '0123456789ABCDEF#$%&/\\|<>[]{}=+*';
  var BYTES  = ['1C', '55', '7A', 'BD', 'E9', 'FF', 'A3', '0D', 'B6', 'F8', '06', '2E'];

  function pick(a) { return a[(Math.random() * a.length) | 0]; }
  function glyph()  { return GLYPHS.charAt((Math.random() * GLYPHS.length) | 0); }
  function hex(n)   { var o = []; while (n--) o.push(pick(BYTES)); return o.join(' '); }

  /* ---------- build ---------- */

  /* Windows sit down the flanks; the middle band is left clear so the
     lockup has somewhere to land that is not already covered. */
  var SPOTS = [
    [4,  10, 21, 17], [75, 7,  21, 15],
    [7,  60, 19, 19], [78, 55, 19, 21],
    [27, 5,  18, 12], [55, 78, 22, 14],
    [3,  36, 15, 14], [84, 32, 14, 16]
  ];

  var lines = [];   // every decrypting line on screen

  function buildWindows() {
    var narrow = window.innerWidth < 720;
    var spots = narrow ? SPOTS.slice(0, 4) : SPOTS;

    var html = '';
    for (var i = 0; i < spots.length; i++) {
      var s = spots[i];
      var body = '';
      var rows = 2 + ((Math.random() * 2) | 0);

      for (var r = 0; r < rows; r++) {
        var text = (r === rows - 1 && Math.random() > 0.45)
          ? pick(['ICE BYPASSED', 'LAYER OPEN', 'DAEMON OK', 'KEY ACCEPTED', 'TRACE CLEAR'])
          : hex(3);
        body += '<span data-target="' + text + '"></span>';
      }

      html += '<div class="intro__win" style="left:' + s[0] + '%;top:' + s[1] + '%;' +
              'width:' + s[2] + '%;height:' + s[3] + '%;--wd:' + (i * 135) + 'ms">' +
                '<div class="intro__win-bar"><b>0x' + pick(BYTES) + pick(BYTES) + '</b><b>//</b></div>' +
                '<div class="intro__win-body">' + body + '</div>' +
              '</div>';
    }
    wins.innerHTML = html;

    lines = Array.prototype.map.call(
      wins.querySelectorAll('[data-target]'),
      function (el, i) {
        return { el: el, target: el.getAttribute('data-target'), start: i * 55 };
      }
    );

    // start every line as noise so nothing pops in empty
    lines.forEach(function (l) { paint(l, 0); });
  }

  /* ---------- decrypt ---------- */

  /* Characters resolve left to right; anything not yet resolved keeps
     churning. p is 0..1 across the line's own window of the phase. */
  function paint(line, p) {
    var t = line.target;
    var settled = Math.floor(t.length * p);
    var out = '';

    for (var i = 0; i < t.length; i++) {
      if (t.charAt(i) === ' ') { out += ' '; continue; }
      out += i < settled ? t.charAt(i) : glyph();
    }

    line.el.textContent = out;
    line.el.classList.toggle('is-done', p >= 1);
  }

  function runDecrypt(duration) {
    if (reduced) { finishText(); return; }

    var t0 = 0;
    cancelAnimationFrame(raf);

    raf = requestAnimationFrame(function step(now) {
      if (!t0) t0 = now;
      var elapsed = now - t0;

      lines.forEach(function (l) {
        var p = (elapsed - l.start) / (duration * 0.72);
        paint(l, Math.min(1, Math.max(0, p)));
      });

      if (elapsed < duration) raf = requestAnimationFrame(step);
      else finishText();
    });
  }

  /* Force every line to its final value. Called when the phase ends, so
     a throttled tab cannot leave half-decrypted noise on screen. */
  function finishText() {
    cancelAnimationFrame(raf);
    raf = 0;
    lines.forEach(function (l) { paint(l, 1); });
  }

  /* ---------- sequence ---------- */

  function at(ms, fn) { timers.push(window.setTimeout(fn, ms)); }
  function setState(n) { intro.setAttribute('data-state', n); }

  function finish() {
    setState('done');
    document.dispatchEvent(new CustomEvent('intro:done'));
  }

  function run() {
    buildWindows();

    if (reduced) {
      finishText();
      setState('lockup');
      document.dispatchEvent(new CustomEvent('intro:reveal'));
      at(900, finish);
      return;
    }

    setState('idle');

    at(40, function () { setState('boot'); });

    var winsAt = TIMING.boot;
    at(winsAt, function () { setState('windows'); });

    var decryptAt = winsAt + TIMING.windows;
    at(decryptAt, function () {
      setState('decrypt');
      runDecrypt(TIMING.decrypt);
    });

    var lockupAt = decryptAt + TIMING.decrypt;
    at(lockupAt, function () {
      finishText();
      setState('lockup');
      if (brand) {
        brand.classList.add('is-glitching');
        window.setTimeout(function () { brand.classList.remove('is-glitching'); }, 1600);
      }
      if (main) {
        main.classList.add('is-tearing');
        window.setTimeout(function () { main.classList.remove('is-tearing'); }, 1400);
      }
    });

    var wipeAt = lockupAt + TIMING.lockup + TIMING.hold;
    at(wipeAt, function () {
      setState('wipe');
      document.dispatchEvent(new CustomEvent('intro:reveal'));
    });

    at(wipeAt + TIMING.wipe, finish);
  }

  /* the windows are placed against the viewport, so a rotation part-way
     through has to rebuild them or they bunch to one side */
  var rebuild = 0;
  window.addEventListener('resize', function () {
    var state = intro.getAttribute('data-state');
    if (state === 'done' || state === 'wipe') return;

    window.clearTimeout(rebuild);
    rebuild = window.setTimeout(function () {
      buildWindows();
      if (state === 'decrypt' || state === 'lockup') finishText();
    }, 200);
  });

  /* skipping: any key or click drops straight to the page */
  function skip() {
    timers.forEach(window.clearTimeout);
    timers = [];
    cancelAnimationFrame(raf);
    document.dispatchEvent(new CustomEvent('intro:reveal'));
    setState('wipe');
    window.setTimeout(finish, TIMING.wipe);
  }

  intro.addEventListener('click', skip);
  document.addEventListener('keydown', function (e) {
    if (intro.getAttribute('data-state') === 'done') return;
    if (e.key === 'Escape' || e.key === ' ' || e.key === 'Enter') skip();
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }
})();
