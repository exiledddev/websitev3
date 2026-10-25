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

  /* Marks and fill have to share one scale, or the fill runs ahead of the
     dots it is supposed to be reaching. Both are expressed as a fraction of
     the rail's own height: a mark sits at the chapter's offset within the
     rail, and the fill is how far the reading line has travelled down it.
     Measuring both rects in the same frame makes the fraction independent
     of where the page happens to be scrolled. */
  function buildDocTrack() {
    if (!docBlock || !docMarks) return;

    var inner = docBlock.querySelector('.doc-block__inner');
    if (!inner) return;

    var ir = inner.getBoundingClientRect();
    if (!ir.height) return;

    var chapters = docBlock.querySelectorAll('.doc > h3');
    docMarks.innerHTML = '';
    docItems = [];

    Array.prototype.forEach.call(chapters, function (chapter) {
      var at = (chapter.getBoundingClientRect().top - ir.top) / ir.height;
      at = Math.min(1, Math.max(0, at));

      var mark = document.createElement('div');
      mark.className = 'doc-track__mark';
      mark.style.top = (at * 100).toFixed(3) + '%';
      docMarks.appendChild(mark);

      docItems.push({ el: mark, at: at });
    });
  }

  function paintDocTrack() {
    docTick = 0;
    if (!docBlock || !docTrack) return;

    var inner = docBlock.querySelector('.doc-block__inner');
    if (!inner) return;

    var ir = inner.getBoundingClientRect();
    if (!ir.height) return;

    /* the reading line, in the same fraction-of-rail units as the marks */
    var mid = window.innerHeight * 0.5;
    var p = Math.min(1, Math.max(0, (mid - ir.top) / ir.height));

    docTrack.style.setProperty('--doc-p', p.toFixed(4));

    docItems.forEach(function (item) {
      item.el.classList.toggle('is-on', p >= item.at);
    });
  }

  window.addEventListener('scroll', function () {
    if (docTick) return;
    docTick = window.requestAnimationFrame(paintDocTrack);
  }, { passive: true });

  /* ============================================================
     The gate — the contact block only exists once you agree
     ============================================================ */

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

  /* ---------- breaching the gate ---------- */

  /* The address resolves out of noise rather than simply appearing, so
     agreeing reads as unlocking something. The final value is written
     from the stored original every time, so a throttled tab can never
     leave a scrambled email on screen. */
  var GLYPHS = '0123456789ABCDEF@#$%&/\\|<>[]{}=+*.';
  var emailEl = document.getElementById('contactEmail');
  var emailText = emailEl ? emailEl.textContent : '';
  var emailRaf = 0;

  /* The same grid the intro breaches with, solved once over the reveal
     and then left on screen as the receipt for it. */
  var breach = document.getElementById('contactBreach');
  var breachGrid = document.getElementById('contactBreachGrid');
  var breachStop = null;

  var SOLVE = 1700;          // how long the grid works before it breaks through

  function runMatrix(done) {
    if (!breach || !breachGrid || !window.MEMatrix || reduced) { done(); return; }

    var n = window.innerWidth < 620 ? 6 : 7;
    breachGrid.innerHTML = window.MEMatrix.html(n, 'Code Matrix');
    breach.hidden = false;
    breach.classList.remove('is-solved');
    breach.classList.add('is-live');

    if (breachStop) breachStop();
    breachStop = window.MEMatrix.run(breachGrid.querySelector('.matrix'), n, 85);

    window.setTimeout(function () {
      if (breachStop) { breachStop(); breachStop = null; }
      /* the grid is spent - wipe it and hand the section over */
      breach.classList.add('is-solved');
      done();
      /* and then taken out of flow, or the wiped panel leaves a hole
         above the section it just opened */
      window.setTimeout(function () {
        breach.classList.remove('is-live');
        breach.hidden = true;
      }, 420);
    }, SOLVE);
  }

  function decryptEmail(after) {
    if (!emailEl) { if (after) after(); return; }
    if (reduced) { emailEl.textContent = emailText; if (after) after(); return; }

    emailEl.classList.add('is-glitching');
    window.setTimeout(function () { emailEl.classList.remove('is-glitching'); }, 1500);

    var DUR = 1100;
    var t0 = 0;
    window.cancelAnimationFrame(emailRaf);

    emailRaf = window.requestAnimationFrame(function step(now) {
      if (!t0) t0 = now;
      var p = Math.min(1, (now - t0) / DUR);
      var settled = Math.floor(emailText.length * p);
      var out = '';

      for (var i = 0; i < emailText.length; i++) {
        out += i < settled
          ? emailText.charAt(i)
          : GLYPHS.charAt((Math.random() * GLYPHS.length) | 0);
      }
      emailEl.textContent = out;

      if (p < 1) { emailRaf = window.requestAnimationFrame(step); return; }
      emailEl.textContent = emailText;
      if (after) after();
    });
  }

  if (agreeBtn && contactBlk) {
    agreeBtn.addEventListener('click', function () {
      if (agreeBtn.classList.contains('is-breaching')) return;

      agreeBtn.classList.add('is-breaching');
      agreeBtn.setAttribute('aria-expanded', 'true');

      contactBlk.hidden = false;
      contactBlk.classList.add('is-breaching');

      /* setTimeout, not requestAnimationFrame: rAF is throttled to nothing
         while the page is hidden, so a click in a background tab would
         unhide the block and then never scroll to it or run the sweep. */
      window.setTimeout(function () {
        contactBlk.scrollIntoView({
          behavior: reduced ? 'auto' : 'smooth',
          block: 'center'
        });
        buildDocTrack();

        /* The address stays hidden while the grid works. Revealing it up
           front gave the matrix nothing to be for - it has to be what
           breaks the address out. */
        runMatrix(function () {
          contactBlk.classList.add('is-open');
          decryptEmail(runSelection);
        });
      }, 0);

      window.setTimeout(function () {
        contactBlk.classList.remove('is-breaching');
      }, SOLVE + 400);
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
  }

  document.addEventListener('site:ready', boot);

  /* The button's width follows its text, so the ring has to be re-measured
     once the display face has actually loaded - built against the fallback
     it comes out a few pixels short on the right. */
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () {
        buildHint();
    });
  }

  window.addEventListener('resize', function () {
    buildHint();
    buildDocTrack();
    paintDocTrack();
  });
})();
