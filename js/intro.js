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
    [3,  8,  25], [72, 5,  25],
    [5,  57, 24], [71, 54, 26],
    [26, 3,  22], [52, 78, 26],
    [2,  33, 21], [78, 29, 20]
  ];

  var stops = [];   // one stop() per running matrix

  function clearMatrices() {
    stops.forEach(function (fn) { fn(); });
    stops = [];
    clearCycles();
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
              'width:' + sp[2] + '%" data-n="' + size + '">' +
                (M ? M.html(size, 'Code Matrix') : '') +
              '</div>';
    }
    wins.innerHTML = html;
  }

  /* Each window runs its own clock: it opens, holds for a while, closes,
     waits, opens again. Fixed timings made them read as one block
     appearing; staggered ones make the wall feel like it is being worked
     over in several places at once. */
  var cycles = [];

  function cycleWindows() {
    clearCycles();

    Array.prototype.forEach.call(wins.querySelectorAll('.intro__win'), function (win, i) {
      var t = 0;

      function open() {
        win.classList.add('is-open');
        t = window.setTimeout(close, 900 + Math.random() * 2400);
        cycles.push(t);
      }
      function close() {
        win.classList.remove('is-open');
        t = window.setTimeout(open, 260 + Math.random() * 900);
        cycles.push(t);
      }

      t = window.setTimeout(open, i * 110 + Math.random() * 420);
      cycles.push(t);
    });
  }

  function clearCycles() {
    cycles.forEach(window.clearTimeout);
    cycles = [];
  }

  /* The solve only starts once the windows are open, and runs fast -
     this is a machine working through a grid, not a readout. */
  function startMatrices() {
    if (reduced || !window.MEMatrix) return;
    clearMatrices();

    Array.prototype.forEach.call(wins.querySelectorAll('.intro__win'), function (win, i) {
      var root = win.querySelector('.matrix');
      if (!root) return;
      var n = parseInt(win.getAttribute('data-n'), 10) || 5;
      window.setTimeout(function () {
        stops.push(window.MEMatrix.run(root, n, 80 + (i % 3) * 22));
      }, i * 70);
    });

    cycleWindows();
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
      /* the breach is done, so the grids stop working and the panels go */
      clearMatrices();
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
