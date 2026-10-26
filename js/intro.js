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

  function rnd(lo, hi) { return lo + Math.random() * (hi - lo); }
  function ri(lo, hi)  { return Math.floor(rnd(lo, hi + 1)); }

  /* A wall of readouts rather than five copies of one widget: besides the
     Breach grids there are trace logs, level meters and raw byte streams,
     the way a netrunner's overlay is a pile of different instruments. */

  function readout() {
    var rows = '';
    var LABELS = ['Trace', 'Subnet', 'Daemon', 'ICE', 'Node', 'Uplink', 'Shard', 'Ping'];
    for (var i = 0; i < ri(3, 5); i++) {
      rows += '<span><i>' + LABELS[ri(0, LABELS.length - 1)] + '</i>' +
              '<b>' + pick(BYTES) + ' ' + pick(BYTES) + '</b></span>';
    }
    return '<div class="ro">' +
             '<div class="ro__bar"><b>' + pick(['Trace Log', 'Subnet', 'Daemon']) + '</b><b>0x' + pick(BYTES) + '</b></div>' +
             '<div class="ro__rows">' + rows + '</div>' +
           '</div>';
  }

  function meter() {
    var bars = '';
    for (var i = 0; i < ri(9, 16); i++) {
      bars += '<i style="--h:' + ri(18, 100) + '%;--d:' + ri(0, 900) + 'ms"></i>';
    }
    return '<div class="mt">' +
             '<div class="mt__bar"><b>Signal</b><b>' + ri(10, 99) + '%</b></div>' +
             '<div class="mt__bars">' + bars + '</div>' +
           '</div>';
  }

  function stream() {
    var lines = '';
    for (var i = 0; i < ri(5, 9); i++) {
      var row = '';
      for (var k = 0; k < ri(3, 5); k++) row += pick(BYTES) + ' ';
      lines += '<span style="--d:' + ri(0, 1200) + 'ms">' + row.trim() + '</span>';
    }
    return '<div class="st"><div class="st__lines">' + lines + '</div></div>';
  }

  /* Placed anywhere on screen, centre included. Keeping them off the
     middle made the wall look like a frame around nothing. */
  function place(wPct, hPct) {
    return {
      left: rnd(1, 99 - wPct).toFixed(2),
      top:  rnd(1, 97 - hPct).toFixed(2),
      w:    wPct.toFixed(2)
    };
  }

  var stops = [];   // one stop() per running matrix

  function clearMatrices() {
    stops.forEach(function (fn) { fn(); });
    stops = [];
    clearCycles();
  }

  function buildWindows() {
    clearMatrices();

    var narrow = window.innerWidth < 720;
    var count = narrow ? 7 : 13;
    var M = window.MEMatrix;

    var html = '';
    for (var i = 0; i < count; i++) {
      /* roughly one in three is a Breach grid; the rest are instruments */
      var kind = i % 3 === 0 ? 'matrix' : pick(['readout', 'meter', 'stream']);
      var size = narrow ? 6 : (Math.random() > 0.5 ? 7 : 6);

      var wPct = kind === 'matrix' ? rnd(narrow ? 24 : 15, narrow ? 34 : 23)
                                   : rnd(narrow ? 20 : 12, narrow ? 30 : 19);
      var hGuess = kind === 'matrix' ? wPct * 1.6 : 16;
      var pos = place(wPct, Math.min(hGuess, 34));

      var body = kind === 'matrix' ? (M ? M.html(size, 'Code Matrix') : '')
               : kind === 'readout' ? readout()
               : kind === 'meter'   ? meter()
               : stream();

      html += '<div class="intro__win" data-kind="' + kind + '" data-n="' + size + '" ' +
              'style="left:' + pos.left + '%;top:' + pos.top + '%;width:' + pos.w + '%;' +
              '--wd:' + (i * 85) + 'ms">' + body + '</div>';
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

    Array.prototype.forEach.call(wins.querySelectorAll('.intro__win[data-kind="matrix"]'), function (win, i) {
      var root = win.querySelector('.matrix');
      if (!root) return;
      var n = parseInt(win.getAttribute('data-n'), 10) || 5;
      window.setTimeout(function () {
        stops.push(window.MEMatrix.run(root, n, 95 + (i % 3) * 24));
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
