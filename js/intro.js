/* ============================================================
   MarkedExiled — intro

   Breaching the Blackwall:

   1. the grid comes up out of black
   2. ICE windows scale open out of nothing, height first
   3. a code matrix in each one solves itself, row then column
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
    decrypt: 1500,   // the matrices keep working
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

  var BYTES = ['1C', '55', '7A', 'BD', 'E9', 'FF'];
  function pick(a) { return a[(Math.random() * a.length) | 0]; }

  /* ---------- build ---------- */

  /* Windows sit down the flanks; the middle band is left clear so the
     lockup has somewhere to land that is not already covered. */
  var SPOTS = [
    [4,  9,  22, 21], [74, 6,  22, 20],
    [6,  58, 20, 24], [77, 52, 21, 26],
    [27, 4,  18, 15], [54, 79, 23, 17],
    [2,  34, 16, 17], [84, 30, 14, 18]
  ];

  var stops = [];   // one stop() per running matrix

  function clearMatrices() {
    stops.forEach(function (fn) { fn(); });
    stops = [];
  }

  function buildWindows() {
    clearMatrices();

    var narrow = window.innerWidth < 720;
    var spots = narrow ? SPOTS.slice(0, 4) : SPOTS;
    var M = window.MEMatrix;

    var html = '';
    for (var i = 0; i < spots.length; i++) {
      var sp = spots[i];
      var size = narrow ? 4 : (Math.random() > 0.5 ? 5 : 4);

      html += '<div class="intro__win" style="left:' + sp[0] + '%;top:' + sp[1] + '%;' +
              'width:' + sp[2] + '%;height:' + sp[3] + '%;--wd:' + (i * 120) + 'ms">' +
                '<div class="intro__win-bar"><b>CODE MATRIX</b><b>0x' + pick(BYTES) + '</b></div>' +
                '<div class="intro__win-body" data-n="' + size + '">' +
                  (M ? M.html(size) : '') +
                '</div>' +
              '</div>';
    }
    wins.innerHTML = html;
  }

  /* The solve only starts once the windows are open, and runs fast -
     this is a machine working through a grid, not a readout. */
  function startMatrices() {
    if (reduced || !window.MEMatrix) return;
    clearMatrices();

    Array.prototype.forEach.call(wins.querySelectorAll('.intro__win-body'), function (body, i) {
      var root = body.querySelector('.matrix');
      if (!root) return;
      var n = parseInt(body.getAttribute('data-n'), 10) || 5;
      window.setTimeout(function () {
        stops.push(window.MEMatrix.run(root, n, 90 + (i % 3) * 25));
      }, i * 90);
    });
  }

  /* ---------- sequence ---------- */

  function at(ms, fn) { timers.push(window.setTimeout(fn, ms)); }
  function setState(n) { intro.setAttribute('data-state', n); }

  function finish() {
    clearMatrices();
    setState('done');
    document.dispatchEvent(new CustomEvent('intro:done'));
  }

  function run() {
    buildWindows();

    if (reduced) {
      setState('lockup');
      document.dispatchEvent(new CustomEvent('intro:reveal'));
      at(900, finish);
      return;
    }

    setState('idle');

    at(40, function () { setState('boot'); });

    var winsAt = TIMING.boot;
    at(winsAt, function () { setState('windows'); });

    at(winsAt + 260, startMatrices);

    var decryptAt = winsAt + TIMING.windows;
    at(decryptAt, function () { setState('decrypt'); });

    var lockupAt = decryptAt + TIMING.decrypt;
    at(lockupAt, function () {
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
      startMatrices();
    }, 200);
  });

  /* skipping: any key or click drops straight to the page */
  function skip() {
    timers.forEach(window.clearTimeout);
    timers = [];
    clearMatrices();
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
