/* ============================================================
   Starting Soon — the loop

   One 9-second cycle: the terminal types its way through a
   breach, grids pop in and out on the right, the byte feed runs
   along the bottom, and the Blackwall hits twice. Then it all
   resets and goes again, seamlessly.
   ============================================================ */
(function () {
  'use strict';

  var CYCLE = 9000;

  var stage  = document.getElementById('stage');
  var term   = document.getElementById('termBody');
  var grids  = document.getElementById('ssGrids');
  var feed   = document.getElementById('ssFeed');
  var tear   = document.getElementById('ssTear');
  var halves = document.getElementById('ssHalves');
  var meter  = document.getElementById('ssMeter');

  if (!stage) return;

  var BYTES = ['1C', '55', '7A', 'BD', 'E9', 'FF', 'A3', '0D', 'B6', 'F8'];
  function pick(a) { return a[(Math.random() * a.length) | 0]; }
  function ri(lo, hi) { return lo + Math.floor(Math.random() * (hi - lo + 1)); }

  /* ---------- fit the stage ---------- */

  /* The composition is authored at exactly 1920x1080; everything else
     is a scale of it, so an OBS source, a browser window and a preview
     thumbnail all show the identical frame. */
  function fit() {
    /* innerWidth can come back 0 very early in some embedders, and a
       scale of 0 renders nothing at all - fall back and clamp. */
    var w = window.innerWidth || document.documentElement.clientWidth || 1920;
    var h = window.innerHeight || document.documentElement.clientHeight || 1080;
    var s = Math.min(w / 1920, h / 1080);
    if (!isFinite(s) || s <= 0) s = 1;
    stage.style.setProperty('--s', s.toFixed(5));
  }
  window.addEventListener('resize', fit);
  window.addEventListener('load', fit);

  /* A resize observer on the root is the only reliable signal in some
     embedders, where window.innerWidth stays 0 until well after load. */
  if (window.ResizeObserver) {
    new ResizeObserver(fit).observe(document.documentElement);
  }

  fit();
  requestAnimationFrame(fit);

  /* ---------- terminal ---------- */

  var SCRIPT = [
    { p: '> ', c: 'init blackwall.sys' },
    { o: '  ice layer 0x7A ............ ', ok: 'mounted' },
    { p: '> ', c: 'netrunner --link markedexiled' },
    { o: '  handshake ................. ', ok: 'ok' },
    { o: '  daemon uplink ............. ', ok: 'ok' },
    { p: '> ', c: 'breach --target stream' },
    { o: '  bypassing 0x55 ............ ', ok: 'ok' },
    { o: '  bypassing 0xBD ............ ', ok: 'ok' },
    { o: '  bypassing 0xE9 ............ ', ok: 'ok' },
    { p: '> ', c: 'status --signal' },
    { o: '  signal .................... ', ok: 'live' },
    { o: '  stream .................... ', warn: 'pending' },
    { p: '> ', c: 'await host' }
  ];

  var line = 0, chars = 0, typing = null;

  function resetTerm() {
    term.innerHTML = '';
    line = 0; chars = 0;
  }

  function stepTerm() {
    if (line >= SCRIPT.length) return;
    var item = SCRIPT[line];

    var el = term.children[line];
    if (!el) {
      el = document.createElement('div');
      el.className = 'term__line';
      term.appendChild(el);
    }

    if (item.c) {
      /* commands type out a character at a time */
      chars++;
      el.innerHTML = item.p + '<b>' + item.c.slice(0, chars) + '</b>' +
                     (chars < item.c.length ? '<span class="term__cursor"></span>' : '');
      if (chars >= item.c.length) { line++; chars = 0; }
      return 34;
    }

    /* output lands whole, the way a real one does */
    el.innerHTML = item.o + '<i>' + (item.ok || item.warn) + '</i>';
    line++;
    return 190;
  }

  /* ---------- breach grids ---------- */

  /* the right-hand column only, so nothing lands under the card */
  var SPOTS = [
    [1418, 150, 200], [1652, 212, 205],
    [1428, 418, 215], [1660, 496, 196],
    [1438, 700, 205], [1664, 756, 200]
  ];
  var gridTimers = [];

  function buildGrids() {
    gridTimers.forEach(clearTimeout);
    gridTimers = [];
    if (!window.MEMatrix) return;

    var html = '';
    for (var i = 0; i < SPOTS.length; i++) {
      var s = SPOTS[i];
      html += '<div class="ss-grid" data-n="6" style="left:' + s[0] + 'px;top:' + s[1] + 'px;width:' + s[2] + 'px">' +
              window.MEMatrix.html(6, 'Code Matrix') + '</div>';
    }
    grids.innerHTML = html;

    Array.prototype.forEach.call(grids.children, function (el, i) {
      var m = el.querySelector('.matrix');
      if (m) window.MEMatrix.run(m, 6, 80 + (i % 3) * 20);

      /* each pops on its own clock so the right side never settles */
      function open() {
        el.classList.add('is-open');
        gridTimers.push(setTimeout(close, ri(900, 2200)));
      }
      function close() {
        el.classList.remove('is-open');
        gridTimers.push(setTimeout(open, ri(250, 900)));
      }
      gridTimers.push(setTimeout(open, i * 150 + ri(0, 500)));
    });
  }

  /* ---------- byte feed ---------- */

  function buildFeed() {
    var cols = 9, html = '';
    for (var c = 0; c < cols; c++) {
      var rows = '';
      for (var r = 0; r < 5; r++) {
        var row = '';
        for (var k = 0; k < 4; k++) row += pick(BYTES) + ' ';
        rows += '<span' + (Math.random() > 0.78 ? ' class="is-hot"' : '') + '>' + row.trim() + '</span>';
      }
      html += '<div class="ss-feed__col">' + rows + '</div>';
    }
    feed.innerHTML = html;
  }

  /* the feed churns constantly, a few cells at a time */
  setInterval(function () {
    var cells = feed.querySelectorAll('span');
    if (!cells.length) return;
    for (var i = 0; i < 6; i++) {
      var el = cells[(Math.random() * cells.length) | 0];
      var row = '';
      for (var k = 0; k < 4; k++) row += pick(BYTES) + ' ';
      el.textContent = row.trim();
      el.classList.toggle('is-hot', Math.random() > 0.82);
    }
  }, 110);

  /* ---------- the blackwall hit ---------- */

  function hit() {
    var n = ri(26, 44), html = '';
    for (var i = 0; i < n; i++) {
      html += '<span class="ss-tear__half' + (Math.random() > 0.85 ? ' is-hot' : '') + '" style="' +
              'top:' + (Math.random() * 100).toFixed(2) + '%;' +
              'left:' + (Math.random() * 70).toFixed(2) + '%;' +
              'width:' + (8 + Math.random() * 55).toFixed(1) + '%;' +
              'height:' + (2 + Math.random() * 9).toFixed(1) + 'px;' +
              '--dx:' + ((Math.random() - 0.5) * 200).toFixed(0) + 'px;' +
              '--d:' + (Math.random() * 180).toFixed(0) + 'ms"></span>';
    }
    halves.innerHTML = html;

    tear.classList.add('is-on');
    stage.classList.add('is-hit');
    setTimeout(function () {
      tear.classList.remove('is-on');
      stage.classList.remove('is-hit');
      halves.innerHTML = '';
    }, 440);
  }

  /* ---------- the cycle ---------- */

  function runCycle() {
    resetTerm();
    buildFeed();
    buildGrids();

    if (meter) {
      meter.style.transition = 'none';
      meter.style.width = '0%';
      requestAnimationFrame(function () {
        meter.style.transition = 'width ' + (CYCLE - 700) + 'ms linear';
        meter.style.width = '100%';
      });
    }

    /* type the script out across the first two thirds of the cycle */
    clearTimeout(typing);
    (function tick() {
      var wait = stepTerm();
      if (wait) typing = setTimeout(tick, wait);
    })();

    /* two hits per cycle, off the beat so it never feels metronomic */
    setTimeout(hit, 2400);
    setTimeout(hit, 6650);
  }

  runCycle();
  setInterval(runCycle, CYCLE);
})();
