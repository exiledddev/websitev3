/* ============================================================
   MarkedExiled — main page

   Two routes in one document:
     home — one fixed screen, two panels swapped by scrolling
     pyb  — Promote Your Business, an ordinary scrolling page

   Switching routes runs a transition: the mark floods the screen
   from below, the pages swap behind it, and it lifts away upward.
   ============================================================ */

(function () {
  'use strict';

  var body    = document.body;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ============================================================
     Route transition
     ============================================================ */

  var swipe = document.getElementById('swipe');

  var SWIPE = reduced
    ? { cover: 0,   hold: 0,   uncover: 0 }
    : { cover: 480, hold: 140, uncover: 620 };

  var swiping = false;

  function runSwipe(swap) {
    if (swiping) return;
    swiping = true;

    swipe.setAttribute('data-state', 'cover');
    body.setAttribute('data-swipe', 'cover');

    window.setTimeout(function () {
      swap();
      swipe.setAttribute('data-state', 'uncover');
      body.setAttribute('data-swipe', 'uncover');

      // let the incoming page start settling a beat before the mask clears
      window.setTimeout(function () { body.removeAttribute('data-swipe'); }, 40);

      window.setTimeout(function () {
        swipe.setAttribute('data-state', 'idle');
        swiping = false;
      }, SWIPE.uncover);
    }, SWIPE.cover + SWIPE.hold);
  }

  /* ============================================================
     Routing
     ============================================================ */

  var ROUTES = {
    home: { el: document.getElementById('route-home'), hash: '#/',        cta: 'Promote Your Business' },
    pyb:  { el: document.getElementById('route-pyb'),  hash: '#/promote', cta: 'Home' }
  };

  var navCta = document.getElementById('navCta');
  var route  = 'home';
  var hintTimer = 0;

  /* The hint curve runs from "engagement" out and back onto "deserves".
     Both words move with the text wrap, so the geometry is measured here
     and handed to the SVG; the stylesheet only owns the timing. */
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

    // a curve across two different lines would slash through the type
    if (Math.abs(w.top - g.top) > 4) {
      fx.style.display = 'none';
      return;
    }
    fx.style.display = '';

    fx.setAttribute('width', t.width);
    fx.setAttribute('height', t.height + 90);
    fx.setAttribute('viewBox', '0 0 ' + t.width + ' ' + (t.height + 90));

    // out and back: drops below the line from "engagement", swings right,
    // and comes back up into "deserves"
    var x0 = w.left - t.left + w.width * 0.45;
    var y0 = w.bottom - t.top + 6;
    var x3 = g.left - t.left + g.width * 0.42;
    var y3 = g.bottom - t.top + 7;
    var dip = Math.max(24, g.height * 0.46);

    var d = 'M' + x0 + ' ' + y0 +
            ' C' + (x0 - dip * 0.55) + ' ' + (y0 + dip * 0.95) +
            ' '  + (x3 - dip * 0.30) + ' ' + (y3 + dip * 1.15) +
            ' '  + x3 + ' ' + y3;
    curve.setAttribute('d', d);

    var len = curve.getTotalLength();
    curve.style.strokeDasharray  = len;
    curve.style.setProperty('--dash', len + 'px');
    curve.style.strokeDashoffset = len;

    // a chevron on the end, turned along the curve's final tangent, so the
    // head reads as part of the same stroke rather than a pasted-on triangle
    var back = curve.getPointAtLength(Math.max(0, len - 10));
    var ang  = Math.atan2(y3 - back.y, x3 - back.x) * 180 / Math.PI;
    head.setAttribute('d', 'M-11 -7 L0 0 L-11 7');
    head.setAttribute('transform', 'translate(' + x3 + ' ' + y3 + ') rotate(' + ang + ')');
  }

  /* confetti: pills thrown out of the word that then fall */
  function paintBurst(burst, radius) {
    var COUNT = 18;
    var html = '';
    for (var i = 0; i < COUNT; i++) {
      var t     = i / COUNT;
      var side  = (t * 2 - 1);                          // -1 .. 1 across the word
      var dx    = side * radius * (1.15 + (i % 3) * 0.42);
      var lift  = -(18 + (i % 4) * 13);                 // a small pop up first
      var fall  = 90 + (i % 5) * 34;                    // then down, well past it
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

  /* ============================================================
     Routing
     ============================================================ */

  var ROUTES = {
    home: { el: document.getElementById('route-home'), hash: '#/',        cta: 'Promote Your Business' },
    pyb:  { el: document.getElementById('route-pyb'),  hash: '#/promote', cta: 'Home' }
  };

  var navCta = document.getElementById('navCta');
  var route  = 'home';
  var hintTimer = 0;

  /* The hint arrow runs from "engagement" to "deserves", and those words
     move with the text wrap, so measure them and hand the geometry to CSS. */
  function measureArrow() {
    var title  = document.querySelector('.pyb-hero__title');
    var word   = document.querySelector('.hint-word');
    var target = document.querySelector('.hint-target');
    if (!title || !word || !target) return false;

    var t = title.getBoundingClientRect();
    var w = word.getBoundingClientRect();
    var g = target.getBoundingClientRect();

    // if a narrow screen has wrapped them onto different lines, the arrow
    // would cut across the type — underline the target instead
    var sameLine = Math.abs(w.top - g.top) < 4;

    var left  = (sameLine ? w.left : g.left) - t.left;
    var right = sameLine ? g.left - t.left : g.right - t.left;

    title.style.setProperty('--arrow-left',  left + 'px');
    title.style.setProperty('--arrow-width', Math.max(0, right - left) + 'px');
    title.style.setProperty('--arrow-top',   (g.bottom - t.top + 6) + 'px');
    return true;
  }

  /* Glowing pointers when the promote page opens, gone after ~5s. */
  function playHints() {
    if (reduced) return;
    var el = ROUTES.pyb.el;
    window.clearTimeout(hintTimer);
    el.classList.remove('is-hinting');
    void el.offsetWidth;                 // restart the animations
    buildHint();
    el.classList.add('is-hinting');
    hintTimer = window.setTimeout(function () {
      el.classList.remove('is-hinting');
    }, 5000);
  }

  function routeFromHash() {
    return /promote/.test(window.location.hash) ? 'pyb' : 'home';
  }

  function paintRoute() {
    Object.keys(ROUTES).forEach(function (name) {
      ROUTES[name].el.hidden = (name !== route);
    });
    body.setAttribute('data-route', route);
    navCta.querySelector('.nav__cta-text').textContent = ROUTES[route].cta;
    window.scrollTo(0, 0);
  }

  function goTo(name, push) {
    if (name === route || swiping) return;

    runSwipe(function () {
      route = name;
      paintRoute();
      // the home route re-enters on its headline
      if (route === 'home') {
        setView(0);
      } else {
        buildRail();
        paintRail();
        buildSteps();
        playHints();
      }
    });

    if (push !== false && window.location.hash !== ROUTES[name].hash) {
      window.history.pushState({ route: name }, '', ROUTES[name].hash);
    }
  }

  navCta.addEventListener('click', function () {
    goTo(route === 'home' ? 'pyb' : 'home');
  });

  document.addEventListener('click', function (e) {
    var target = e.target.closest ? e.target.closest('[data-goto]') : null;
    if (!target) return;
    e.preventDefault();
    goTo(target.getAttribute('data-goto'));
  });

  window.addEventListener('popstate', function () {
    goTo(routeFromHash(), false);
  });

  /* ============================================================
     Home: two panels, swapped by scroll gesture
     ============================================================ */

  var VIEWS = ['hero', 'cards'];

  var panels = {
    hero:  document.querySelector('.hero'),
    cards: document.querySelector('.work')
  };

  var view   = 0;
  var armed  = false;   // gestures do nothing until the intro is out of the way
  var locked = false;
  var lockTimer = 0;

  function paintView() {
    body.setAttribute('data-view', VIEWS[view]);

    // The panel that isn't showing must not be clickable, tabbable or
    // announced — it is still sitting right there on the stage.
    VIEWS.forEach(function (name, i) {
      if (i === view) panels[name].removeAttribute('inert');
      else panels[name].setAttribute('inert', '');
    });
  }

  function setView(next) {
    next = Math.max(0, Math.min(VIEWS.length - 1, next));
    if (next === view) return;
    view = next;
    paintView();
  }

  function lock(ms) {
    locked = true;
    window.clearTimeout(lockTimer);
    lockTimer = window.setTimeout(function () { locked = false; }, ms);
  }

  function step(dir) {
    if (!armed || locked || swiping) return;
    if (route !== 'home') return;      // the promote route scrolls normally
    setView(view + dir);
    lock(820);
  }

  window.addEventListener('wheel', function (e) {
    if (!armed || route !== 'home') return;

    // Trackpad inertia keeps firing long after the flick; hold the gate shut
    // until the events actually stop, or one flick counts twice.
    if (locked) { lock(240); return; }
    if (Math.abs(e.deltaY) < 12) return;

    step(e.deltaY > 0 ? 1 : -1);
  }, { passive: true });

  var touchY = null;

  window.addEventListener('touchstart', function (e) {
    touchY = e.touches[0].clientY;
  }, { passive: true });

  window.addEventListener('touchend', function (e) {
    if (touchY === null || route !== 'home') { touchY = null; return; }
    var dy = touchY - e.changedTouches[0].clientY;
    touchY = null;
    if (Math.abs(dy) < 44) return;
    step(dy > 0 ? 1 : -1);
  }, { passive: true });

  window.addEventListener('keydown', function (e) {
    if (route !== 'home') return;
    switch (e.key) {
      case 'ArrowDown': case 'PageDown': case 'End':  step(1);  break;
      case 'ArrowUp':   case 'PageUp':   case 'Home': step(-1); break;
    }
  });

  /* ============================================================
     Promote: tabbed offers
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
      if (focus) button.focus();
    }

    list.addEventListener('click', function (e) {
      var button = e.target.closest('[role="tab"]');
      if (button) select(button, false);
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

  /* Agreement outline: scroll to the chapter without touching the hash,
     which the router owns. */
  document.addEventListener('click', function (e) {
    var link = e.target.closest ? e.target.closest('[data-jump]') : null;
    if (!link) return;
    e.preventDefault();
    var target = document.querySelector(link.getAttribute('href'));
    if (!target) return;

    var y = window.scrollY + target.getBoundingClientRect().top - 96;
    if (reduced) window.scrollTo(0, y);
    else tripTo(y);
  });


  /* ============================================================
     Scroll entry — sections animate in as they arrive and back out
     as they leave, in both directions.
     ============================================================ */

  function armScrollAnim() {
    var items = document.querySelectorAll('[data-anim]');

    if (reduced || !('IntersectionObserver' in window)) {
      Array.prototype.forEach.call(items, function (el) { el.classList.add('is-in'); });
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        // no unobserve: scrolling back up runs the same move in reverse
        entry.target.classList.toggle('is-in', entry.isIntersecting);
      });
    }, { rootMargin: '-10% 0px -12% 0px', threshold: 0 });

    Array.prototype.forEach.call(items, function (el) { io.observe(el); });
  }

  /* ============================================================
     Scroll rail — extends with scroll progress and lights up each
     section as the head reaches it. Runs backwards on the way up.
     ============================================================ */

  var rail      = document.getElementById('rail');
  var railSvg   = document.getElementById('railSvg');
  var railLine  = document.getElementById('railLine');
  var railHead  = document.getElementById('railHead');
  var railMarks = document.getElementById('railMarks');
  var railItems = [];
  var railLen   = 0;
  var railTick  = 0;

  /* A freehand squiggle down the rail: segment lengths and amplitudes both
     wander, it occasionally drifts back near the middle instead of turning,
     and the points are smoothed through with Catmull-Rom so it reads as
     drawn rather than plotted. Seeded once per load, so a resize rebuilds
     the same line instead of reshuffling it. */
  var railSeed = Math.floor(Math.random() * 1e9);

  function rng(seed) {
    var a = seed >>> 0;
    return function () {
      a += 0x6D2B79F5;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /* Three octaves of wander summed together. A sum of sinusoids is smooth
     everywhere by construction, so the line never corners - the randomness
     lives in the frequencies and phases rather than in the turns. */
  function freehand(w, h) {
    var rand = rng(railSeed);
    var cx   = w / 2;
    var maxA = (w / 2) - 3;
    var base = Math.PI * 2 / Math.max(300, h * 0.62);   // longest wave

    var waves = [
      { a: 0.62, f: base * (0.85 + rand() * 0.45), p: rand() * Math.PI * 2 },
      { a: 0.27, f: base * (1.70 + rand() * 0.80), p: rand() * Math.PI * 2 },
      { a: 0.11, f: base * (3.10 + rand() * 1.30), p: rand() * Math.PI * 2 }
    ];

    var d = '';
    for (var y = 0; y <= h; y += 5) {
      var o = 0;
      for (var i = 0; i < waves.length; i++) {
        o += waves[i].a * Math.sin(y * waves[i].f + waves[i].p);
      }
      d += (y === 0 ? 'M' : 'L') + (cx + maxA * o).toFixed(2) + ' ' + y.toFixed(2) + ' ';
    }
    return d.trim();
  }

  function buildRail() {
    if (!rail || !railSvg || !railLine) return;

    var box = rail.getBoundingClientRect();
    if (box.height <= 0) return;

    var d = freehand(box.width, box.height);
    railSvg.setAttribute('viewBox', '0 0 ' + box.width + ' ' + box.height);
    railSvg.querySelector('.rail__track').setAttribute('d', d);
    railLine.setAttribute('d', d);

    railLen = railLine.getTotalLength();
    railLine.style.strokeDasharray = railLen;
    railLine.style.strokeDashoffset = railLen;

    railMarks.innerHTML = '';
    railItems = [];

    var sections = document.querySelectorAll('#route-pyb [data-rail]');
    var span = document.documentElement.scrollHeight - window.innerHeight;
    if (span <= 0) return;

    Array.prototype.forEach.call(sections, function (section) {
      // where this section sits on the same 0-1 scale as scroll progress
      var at = Math.min(1, Math.max(0,
        (section.offsetTop - window.innerHeight * 0.45) / span));

      var mark = document.createElement('div');
      mark.className = 'rail__mark';
      mark.style.setProperty('--at', at.toFixed(4));
      // sit the dot on the line wherever it happens to be at that height
      var onLine = railLine.getPointAtLength(railLine.getTotalLength() * at);
      mark.style.setProperty('--x', onLine.x.toFixed(2) + 'px');
      mark.innerHTML = '<i></i>';
      railMarks.appendChild(mark);
      railItems.push({ el: mark, at: at });
    });
  }

  function paintRail() {
    railTick = 0;
    if (!rail || route !== 'pyb' || !railLen) return;

    var span = document.documentElement.scrollHeight - window.innerHeight;
    var p = span > 0 ? Math.min(1, Math.max(0, window.scrollY / span)) : 0;

    railLine.style.strokeDashoffset = (railLen * (1 - p)).toFixed(2);

    // chevron rides the drawn end, turned along the local tangent
    if (p > 0.004) {
      var at   = railLen * p;
      var tip  = railLine.getPointAtLength(at);
      var back = railLine.getPointAtLength(Math.max(0, at - 9));
      var ang  = Math.atan2(tip.y - back.y, tip.x - back.x) * 180 / Math.PI;
      railHead.setAttribute('d', 'M-7 -5 L0 0 L-7 5');
      railHead.setAttribute('transform',
        'translate(' + tip.x.toFixed(2) + ' ' + tip.y.toFixed(2) + ') rotate(' + ang.toFixed(1) + ')');
      railHead.style.opacity = 1;
    } else {
      railHead.style.opacity = 0;
    }

    railItems.forEach(function (item) {
      item.el.classList.toggle('is-on', p >= item.at - 0.01);
    });
  }

  window.addEventListener('scroll', function () {
    if (railTick) return;
    railTick = window.requestAnimationFrame(paintRail);
  }, { passive: true });

  window.addEventListener('resize', function () {
    buildRail();
    paintRail();
    buildSteps();
  });

  /* ============================================================
     Scrolling — a wheel gesture carries you to the next section
     rather than nudging the page by the raw delta.
     ============================================================ */

  var steps = [];
  var trip  = { from: 0, to: 0, t0: 0, dur: 0, raf: 0, running: false };
  var tripCooldown = 0;

  function maxScroll() {
    return Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
  }

  var freeFrom = Infinity;             // past the last stop, scrolling is normal

  function buildSteps() {
    var els = document.querySelectorAll('#route-pyb [data-step]');
    var top = maxScroll();

    steps = [0];
    Array.prototype.forEach.call(els, function (el) {
      steps.push(Math.min(top, Math.max(0, el.offsetTop - 96)));
    });
    steps.sort(function (a, b) { return a - b; });
    steps = steps.filter(function (y, i) { return i === 0 || y - steps[i - 1] > 40; });

    // the agreement is the last stop: once you are reading it, and all the
    // way down through the contact block, the wheel behaves normally again
    freeFrom = steps.length ? steps[steps.length - 1] : Infinity;
  }

  function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  function tripStep(now) {
    if (!trip.t0) trip.t0 = now;

    var p = Math.min(1, (now - trip.t0) / trip.dur);
    window.scrollTo(0, trip.from + (trip.to - trip.from) * easeInOutCubic(p));

    if (p < 1) {
      trip.raf = window.requestAnimationFrame(tripStep);
    } else {
      trip.running = false;
      trip.raf = 0;
      tripCooldown = Date.now() + 90;
    }
  }

  function tripTo(y) {
    y = Math.min(maxScroll(), Math.max(0, y));
    var from = window.scrollY;
    if (Math.abs(y - from) < 2) return;

    trip.from = from;
    trip.to = y;
    trip.t0 = 0;
    // longer hops take a little longer, but never drag
    trip.dur = Math.min(1150, Math.max(520, Math.abs(y - from) * 0.55));
    trip.running = true;
    trip.raf = window.requestAnimationFrame(tripStep);
  }

  /* true while the wheel should still be hopping between sections */
  function stepping(dir) {
    if (!steps.length) buildSteps();
    var y = window.scrollY;

    // heading down: stop stepping once the last stop is reached
    if (dir > 0) return y < freeFrom - 12;
    // heading up: free until back at the last stop, then step again
    return y <= freeFrom + 12;
  }

  function travel(dir) {
    var y = window.scrollY;
    var next;

    if (dir > 0) {
      next = steps.find(function (s) { return s > y + 12; });
      if (next === undefined) return;
    } else {
      for (var i = steps.length - 1; i >= 0; i--) {
        if (steps[i] < y - 12) { next = steps[i]; break; }
      }
      if (next === undefined) next = 0;
    }
    tripTo(next);
  }

  window.addEventListener('wheel', function (e) {
    if (reduced || route !== 'pyb') return;
    if (e.ctrlKey) return;                          // pinch zoom
    if (Math.abs(e.deltaY) < 4) return;

    var dir = e.deltaY > 0 ? 1 : -1;
    if (!stepping(dir)) return;                     // let the page scroll itself

    e.preventDefault();
    if (trip.running || Date.now() < tripCooldown) return;

    travel(dir);
  }, { passive: false });

  window.addEventListener('keydown', function (e) {
    if (reduced || route !== 'pyb') return;
    if (e.key === 'PageDown' || e.key === 'PageUp') {
      var dir = e.key === 'PageDown' ? 1 : -1;
      if (!stepping(dir)) return;
      e.preventDefault();
      travel(dir);
    }
  });

  /* ============================================================
     Reach counter on the home hero
     ============================================================ */

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

  /* ============================================================
     Handover from the intro
     ============================================================ */

  document.addEventListener('intro:reveal', function () {
    body.setAttribute('data-page', 'in');
  });

  document.addEventListener('intro:done', function () {
    body.setAttribute('data-intro', 'done');
    armed = true;

    var counter = document.querySelector('[data-count-to]');
    if (counter) countUp(counter);

    if (route === 'pyb') { buildRail(); paintRail(); buildSteps(); playHints(); }
  });

  route = routeFromHash();
  paintRoute();
  paintView();
  armScrollAnim();
})();
