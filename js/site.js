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
    paintBurst(burst, Math.max(74, g.height * 1.2));

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

    // arrowhead sits on the end, turned along the curve's final tangent
    var back = curve.getPointAtLength(Math.max(0, len - 8));
    var ang  = Math.atan2(y3 - back.y, x3 - back.x) * 180 / Math.PI;
    head.setAttribute('d', 'M0 0 L-13 -6.5 L-13 6.5 Z');
    head.setAttribute('transform', 'translate(' + x3 + ' ' + y3 + ') rotate(' + ang + ')');
  }

  /* confetti: a ring of chips thrown out from the middle of the word */
  function paintBurst(burst, radius) {
    var COUNT = 14;
    var html = '';
    for (var i = 0; i < COUNT; i++) {
      var a    = (i / COUNT) * Math.PI * 2 + (i % 2 ? 0.22 : 0);
      var dist = radius * (0.75 + (i % 3) * 0.22);
      var size = 6 + (i % 3) * 3;
      html += '<b style="' +
        '--dx:' + (Math.cos(a) * dist).toFixed(1) + 'px;' +
        '--dy:' + (Math.sin(a) * dist * 0.82).toFixed(1) + 'px;' +
        '--size:' + size + 'px;' +
        '--radius:' + (i % 2 ? '50%' : '2px') + ';' +
        '--spin:' + (120 + i * 37) + 'deg;' +
        'animation-delay:' + (1.12 + (i % 4) * 0.035).toFixed(3) + 's;' +
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
      if (route === 'home') setView(0);
      else playHints();
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
    if (target) target.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
  });

  /* ============================================================
     Handover from the intro
     ============================================================ */

  document.addEventListener('intro:reveal', function () {
    body.setAttribute('data-page', 'in');
  });

  document.addEventListener('intro:done', function () {
    body.setAttribute('data-intro', 'done');
    armed = true;
    // landed straight on /promote: the hints wait for the intro to clear
    if (route === 'pyb') playHints();
  });

  route = routeFromHash();
  paintRoute();
  paintView();
})();
