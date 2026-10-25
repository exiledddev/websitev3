/* ============================================================
   Blackwall — promote page

   Everything here used to live inside the deck's stage machine.
   The page scrolls normally now, so the fit/scale pass is gone
   entirely — and with it the clipping it used to cause.
   ============================================================ */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ============================================================
     The hint curve: an arrow out of "engagement" and up into
     "deserves". Geometry is measured live, so it survives the
     new layout; the numbers below are the tuned originals.
     ============================================================ */

  function buildHint() {
    var title  = document.querySelector('.pyb-hero__title');
    var word   = document.querySelector('.hint-word');
    var target = document.querySelector('.hint-target');
    var fx     = document.querySelector('.hint-fx');
    var burst  = document.querySelector('.hint-burst');
    if (!title || !word || !target || !fx || !burst) return;

    var t = title.getBoundingClientRect();
    var w = word.getBoundingClientRect();
    var g = target.getBoundingClientRect();

    var curve = fx.querySelector('.hint-fx__curve');
    var head  = fx.querySelector('.hint-fx__head');

    // the burst always fires, wherever the words ended up
    var cx = g.left - t.left + g.width / 2;
    var cy = g.top  - t.top  + g.height / 2;
    burst.style.left = cx + 'px';
    burst.style.top  = cy + 'px';
    paintBurst(burst, Math.max(96, g.width * 0.5));

    fx.style.display = '';
    fx.setAttribute('width', t.width);
    fx.setAttribute('height', t.height + 190);
    fx.setAttribute('viewBox', '0 0 ' + t.width + ' ' + (t.height + 190));

    /* The path in the sketch: it leaves the left flank of "engagement",
       loops out and down through the empty margin beside the centred
       lines, sweeps back right underneath them, and rises into "deserves"
       from below-left with the head aimed up at the word. */
    var x0 = w.left - t.left - 6;
    var y0 = w.top - t.top + w.height * 0.52;

    var x3 = g.left - t.left + g.width * 0.42;
    var y3 = g.bottom - t.top + Math.max(16, g.height * 0.24);

    var outX  = x0 - Math.max(58, t.width * 0.12);
    var rise  = Math.max(88, g.height * 1.05);

    // C1 swings it out left and down for the loop; C2 sits below the end so
    // the curve arrives climbing and the head aims up into the word
    var d = 'M' + x0.toFixed(1) + ' ' + y0.toFixed(1) +
            ' C' + outX.toFixed(1) + ' ' + (y0 + rise * 0.72).toFixed(1) +
            ' '  + (x3 - rise * 0.78).toFixed(1) + ' ' + (y3 + rise).toFixed(1) +
            ' '  + x3.toFixed(1) + ' ' + y3.toFixed(1);

    curve.setAttribute('d', d);

    var len = curve.getTotalLength();
    curve.style.strokeDasharray  = len;
    curve.style.setProperty('--dash', len + 'px');
    curve.style.strokeDashoffset = len;
    headAt(curve, head);
  }

  /* the chevron sits on the curve's end, turned along its final tangent,
     so the head reads as part of the same stroke */
  function headAt(curve, head) {
    var len = curve.getTotalLength();
    if (!len) return;

    var tip  = curve.getPointAtLength(len);
    var back = curve.getPointAtLength(Math.max(0, len - 10));
    var ang  = Math.atan2(tip.y - back.y, tip.x - back.x) * 180 / Math.PI;

    head.setAttribute('d', 'M-11 -7 L0 0 L-11 7');
    head.setAttribute('transform',
      'translate(' + tip.x.toFixed(2) + ' ' + tip.y.toFixed(2) + ') rotate(' + ang.toFixed(1) + ')');
  }

  /* confetti: pills thrown out of the word that then fall */
  function paintBurst(burst, radius) {
    var COUNT = 18;
    var html = '';
    for (var i = 0; i < COUNT; i++) {
      var t     = i / COUNT;
      var side  = (t * 2 - 1);                          // -1 .. 1 across the word
      var dx    = side * radius * (1.15 + (i % 3) * 0.42);
      var lift  = -(16 + (i % 4) * 11);                 // a small pop up first
      var fall  = 240 + (i % 5) * 90;                   // keeps going, well off the word
      var len   = 9 + (i % 3) * 4;

      html += '<b style="' +
        '--dx:'   + dx.toFixed(1) + 'px;' +
        '--lift:' + lift + 'px;' +
        '--fall:' + fall + 'px;' +
        '--w:'    + (4 + (i % 2)) + 'px;' +
        '--h:'    + len + 'px;' +
        '--r0:'   + (i * 47 % 180 - 90) + 'deg;' +
        '--spin:' + (200 + i * 53) + 'deg;' +
        'animation-delay:' + (1.12 + (i % 5) * 0.045).toFixed(3) + 's;' +
        '"></b>';
    }
    burst.innerHTML = html;
  }

  var hintTimer = 0;

  function playHint() {
    if (reduced) return;
    var hero = document.querySelector('.pyb-hero');
    if (!hero) return;

    window.clearTimeout(hintTimer);
    hero.classList.remove('is-hinting');
    void hero.offsetWidth;
    buildHint();
    hero.classList.add('is-hinting');
    hintTimer = window.setTimeout(function () {
      hero.classList.remove('is-hinting');
    }, 5000);
  }

  /* ============================================================
     Service switcher — tab row on desktop, custom listbox on
     phones. Both drive the same select().
     ============================================================ */

  (function tabs() {
    var list = document.querySelector('.tabs');
    if (!list) return;

    var buttons = Array.prototype.slice.call(list.querySelectorAll('[role="tab"]'));

    function select(button, focus) {
      buttons.forEach(function (b) {
        var on = (b === button);
        b.setAttribute('aria-selected', on ? 'true' : 'false');
        b.tabIndex = on ? 0 : -1;
        document.getElementById(b.getAttribute('aria-controls')).hidden = !on;
      });
      syncPicker(button);
      if (focus) button.focus();
    }

    var picker  = document.getElementById('picker');
    var trigger = document.getElementById('pickerBtn');
    var menu    = document.getElementById('pickerMenu');
    var value   = document.getElementById('pickerValue');

    function closePicker() {
      if (!picker) return;
      picker.classList.remove('is-open');
      trigger.setAttribute('aria-expanded', 'false');
      window.setTimeout(function () {
        if (!picker.classList.contains('is-open')) menu.hidden = true;
      }, 220);
    }

    function openPicker() {
      menu.hidden = false;
      void menu.offsetWidth;
      picker.classList.add('is-open');
      trigger.setAttribute('aria-expanded', 'true');
    }

    function syncPicker(button) {
      if (!picker) return;
      value.textContent = button.textContent.trim();
      Array.prototype.forEach.call(menu.querySelectorAll('[data-tab]'), function (li) {
        li.setAttribute('aria-selected', li.getAttribute('data-tab') === button.id ? 'true' : 'false');
      });
    }

    if (picker) {
      trigger.addEventListener('click', function (e) {
        e.stopPropagation();
        if (picker.classList.contains('is-open')) closePicker();
        else openPicker();
      });

      menu.addEventListener('click', function (e) {
        var item = e.target.closest('[data-tab]');
        if (!item) return;
        var button = document.getElementById(item.getAttribute('data-tab'));
        if (button) select(button, false);
        closePicker();
      });

      document.addEventListener('click', function (e) {
        if (!picker.contains(e.target)) closePicker();
      });

      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') closePicker();
      });
    }

    list.addEventListener('click', function (e) {
      var button = e.target.closest('[role="tab"]');
      if (!button) return;
      select(button, false);
    });

    list.addEventListener('keydown', function (e) {
      var i = buttons.indexOf(document.activeElement);
      if (i === -1) return;

      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        e.preventDefault();
        select(buttons[(i + (e.key === 'ArrowRight' ? 1 : -1) + buttons.length) % buttons.length], true);
      } else if (e.key === 'Home') {
        e.preventDefault(); select(buttons[0], true);
      } else if (e.key === 'End') {
        e.preventDefault(); select(buttons[buttons.length - 1], true);
      }
    });
  })();

  /* ============================================================
     Chapter rail beside the agreement
     ============================================================ */

  var docBlock = document.getElementById('agreement-block');
  var docTrack = document.getElementById('docTrack');
  var docMarks = document.getElementById('docMarks');
  var docItems = [];
  var docTick  = 0;

  function buildDocTrack() {
    if (!docBlock || !docMarks) return;

    var chapters = docBlock.querySelectorAll('.doc > h3');
    var inner = docBlock.querySelector('.doc-block__inner');
    var h = inner ? inner.offsetHeight : docBlock.offsetHeight;
    if (!h) return;

    docMarks.innerHTML = '';
    docItems = [];

    Array.prototype.forEach.call(chapters, function (chapter) {
      var at = Math.min(1, Math.max(0, chapter.offsetTop / h));

      var mark = document.createElement('div');
      mark.className = 'doc-track__mark';
      mark.style.top = (at * 100).toFixed(2) + '%';
      docMarks.appendChild(mark);

      docItems.push({ el: mark, chapter: chapter });
    });
  }

  /* Progress is how far the agreement has travelled past the middle of
     the screen, and a chapter lights when its heading crosses that line -
     measured rather than derived, so the dots and the fill agree. */
  function paintDocTrack() {
    docTick = 0;
    if (!docBlock || !docTrack) return;

    var r = docBlock.getBoundingClientRect();
    var mid = window.innerHeight * 0.5;
    var span = r.height - mid;
    var p = span > 0 ? Math.min(1, Math.max(0, (mid - r.top) / span)) : 0;

    docTrack.style.setProperty('--doc-p', p.toFixed(4));

    docItems.forEach(function (item) {
      item.el.classList.toggle('is-on', item.chapter.getBoundingClientRect().top <= mid);
    });
  }

  window.addEventListener('scroll', function () {
    if (docTick) return;
    docTick = window.requestAnimationFrame(paintDocTrack);
  }, { passive: true });

  /* ============================================================
     The gate — the contact block only exists once you agree
     ============================================================ */

  function buildAgreeRing() {
    var svg = document.getElementById('agreeRing');
    if (!svg || !agreeBtn) return;

    var path = svg.querySelector('path');

    /* Take the svg out of flow before measuring. While it is still an
       in-flow child it pads the button out by its own width, and the ring
       gets built around a box twice the size it should be. */
    svg.style.position = 'absolute';
    svg.style.pointerEvents = 'none';
    svg.style.overflow = 'visible';

    var b = agreeBtn.getBoundingClientRect();
    if (b.width <= 0 || b.height <= 0) return;

    var gap = 5;                       // distance from the button's edge
    // no rounding: the button's box is fractional, and rounding it throws
    // the gap out by a pixel or two on the right and bottom
    var w = b.width + gap * 2;
    var h = b.height + gap * 2;
    var r = h / 2;
    var cx = w / 2;

    /* Size and place the box here rather than in CSS. An <svg> with no
       explicit box falls back to 300x150, and if the stylesheet has not
       landed yet the ring is built against that instead of the button -
       which draws an enormous pill across the page. */
    svg.setAttribute('width', w.toFixed(2));
    svg.setAttribute('height', h.toFixed(2));
    svg.setAttribute('viewBox', '0 0 ' + w.toFixed(2) + ' ' + h.toFixed(2));
    svg.setAttribute('preserveAspectRatio', 'none');
    /* left/top are measured from the offset parent's PADDING box, while the
       rect above is its border box - without subtracting the border the ring
       sits a pixel right and low, and the gap reads uneven. */
    var bw = parseFloat(getComputedStyle(agreeBtn).borderLeftWidth) || 0;
    svg.style.left = -(gap + bw) + 'px';
    svg.style.top = -(gap + bw) + 'px';
    svg.style.width = w.toFixed(2) + 'px';
    svg.style.height = h.toFixed(2) + 'px';

    // traced from the top centre, clockwise, back to the top centre
    path.setAttribute('d',
      'M' + cx.toFixed(1) + ' 0' +
      ' H' + (w - r).toFixed(1) +
      ' A' + r.toFixed(1) + ' ' + r.toFixed(1) + ' 0 0 1 ' + (w - r).toFixed(1) + ' ' + h.toFixed(1) +
      ' H' + r.toFixed(1) +
      ' A' + r.toFixed(1) + ' ' + r.toFixed(1) + ' 0 0 1 ' + r.toFixed(1) + ' 0' +
      ' H' + cx.toFixed(1));

    // px matters: stroke-dashoffset takes a length, and a bare number is
    // invalid there, so it computes to 0 and leaves the ring drawn
    var len = path.getTotalLength().toFixed(1) + 'px';

    // land it without animating, or the ring draws itself once on load
    path.style.transition = 'none';
    svg.style.setProperty('--ring-len', len);
    path.getBoundingClientRect();
    window.requestAnimationFrame(function () { path.style.transition = ''; });
  }

  var agreeBtn   = document.getElementById('agreeBtn');
  var contactBlk = document.getElementById('contact-block');
  var word       = document.querySelector('.contact__word');
  var selectIn   = 0;
  var selectOut  = 0;

  function runSelection() {
    if (!word || reduced) return;
    word.classList.remove('is-selecting', 'is-clearing');
    void word.offsetWidth;

    window.clearTimeout(selectIn);
    window.clearTimeout(selectOut);

    selectIn = window.setTimeout(function () {
      word.classList.add('is-selecting');
      selectOut = window.setTimeout(function () {
        word.classList.remove('is-selecting');
        word.classList.add('is-clearing');
        window.setTimeout(function () { word.classList.remove('is-clearing'); }, 700);
      }, 1500);
    }, 420);
  }

  if (agreeBtn && contactBlk) {
    agreeBtn.addEventListener('click', function () {
      contactBlk.hidden = false;
      agreeBtn.setAttribute('aria-expanded', 'true');

      /* setTimeout, not requestAnimationFrame: rAF is throttled to nothing
         while the page is hidden, so a click in a background tab would
         unhide the block and then never scroll to it or run the sweep. */
      window.setTimeout(function () {
        contactBlk.scrollIntoView({
          behavior: reduced ? 'auto' : 'smooth',
          block: 'center'
        });
        runSelection();
        buildDocTrack();
      }, 0);
    });
  }

  /* Outline links jump to their chapter. */
  document.addEventListener('click', function (e) {
    var link = e.target.closest ? e.target.closest('[data-jump]') : null;
    if (!link) return;
    e.preventDefault();
    var target = document.querySelector(link.getAttribute('href'));
    if (!target) return;
    target.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
  });

  /* ============================================================
     Boot
     ============================================================ */

  function boot() {
    buildHint();
    playHint();
    buildDocTrack();
    paintDocTrack();
    buildAgreeRing();
  }

  document.addEventListener('site:ready', boot);

  /* The button's width follows its text, so the ring has to be re-measured
     once the display face has actually loaded - built against the fallback
     it comes out a few pixels short on the right. */
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () {
      buildAgreeRing();
      buildHint();
    });
  }

  window.addEventListener('resize', function () {
    buildHint();
    buildDocTrack();
    paintDocTrack();
    buildAgreeRing();
  });
})();
