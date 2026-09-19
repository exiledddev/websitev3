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

    fx.style.display = '';
    fx.setAttribute('width', t.width);
    fx.setAttribute('height', t.height + 90);
    fx.setAttribute('viewBox', '0 0 ' + t.width + ' ' + (t.height + 90));

    var sameLine = Math.abs(w.top - g.top) < 4;
    var x0 = w.left - t.left + w.width * 0.45;
    var y0 = w.bottom - t.top + 6;
    var d;

    if (sameLine) {
      // out and back: drops below the line from "engagement", swings right,
      // and comes back up into "deserves"
      // drop well clear of the baseline before coming back up, so the
      // curve never runs through the words it passes
      var x3 = g.left - t.left + g.width * 0.42;
      var y3 = g.bottom - t.top + 9;
      var dip = Math.max(52, g.height * 1.05);

      d = 'M' + x0 + ' ' + (y0 + 4) +
          ' C' + (x0 - dip * 0.42) + ' ' + (y0 + dip * 1.15) +
          ' '  + (x3 - dip * 0.22) + ' ' + (y3 + dip * 1.35) +
          ' '  + x3 + ' ' + y3;
    } else {
      // wrapped onto separate lines: swing out to the left of the column,
      // drop past the line break, and come back in on "deserves" side-on
      // swing out to the left of the column, drop below the line break and
      // come back in under "deserves", so it never crosses the line above
      var gx = g.left - t.left;
      var gy = g.bottom - t.top + 8;
      var out = Math.max(42, g.height * 0.7);

      d = 'M' + x0 + ' ' + y0 +
          ' C' + (x0 - out * 1.1) + ' ' + (y0 + out * 0.55) +
          ' '  + (gx - out * 1.2) + ' ' + (gy + out * 0.45) +
          ' '  + (gx + g.width * 0.32) + ' ' + gy;
    }
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
        resetDeck();
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

    var sc = activeScroller();
    if (!sc) return;
    sc.scrollTo({ top: target.offsetTop - 24, behavior: reduced ? 'auto' : 'smooth' });
  });


  /* ============================================================
     Deck — the promote route is four stages on one screen.
     Each stage scrolls inside itself; hitting a boundary and
     carrying on moves you to the next one. Stage 2 -> 3 is the
     only move you cannot scroll into: it needs the agree button.
     ============================================================ */

  var STAGES = ['deckHero', 'stageOffers', 'stageDoc', 'stageContact'];
  var layers = {
    1: document.getElementById('stageOffers'),
    2: document.getElementById('stageDoc'),
    3: document.getElementById('stageContact')
  };

  var stage = 0;
  var stageLock = 0;

  /* what animates in when a stage arrives */
  var ENTERS = {
    1: '.notice, .tabs, .offer__title, .offer__text, .offer__list li, .offer__note,' +
       '.offer__price, .currency__label, .currency__lead, .currency__text, .currency__terms',
    2: '.agreement__eyebrow, .agreement__title, .agreement__lead, .toc, .doc > h3,' +
       '.doc > h4, .doc > p, .doc > ul, .agree',
    3: '.contact__label, .contact__email, .contact__note'
  };

  function tagEnters(n) {
    var layer = layers[n];
    if (!layer || !ENTERS[n]) return [];

    var els = Array.prototype.slice.call(layer.querySelectorAll(ENTERS[n]));
    els.forEach(function (el, i) {
      el.setAttribute('data-in', '');
      el.style.setProperty('--i', Math.min(i, 14));   // cap the stagger
    });
    return els;
  }

  function playEnters(n) {
    var els = tagEnters(n);
    els.forEach(function (el) { el.classList.remove('is-in'); });
    if (!els.length) return;

    void els[0].offsetWidth;                          // restart the stagger
    els.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* The hero is one line at stage 1, so the scale that makes it fit depends
     on the viewport width. Measure it, then hand the offers layer the room
     the hero actually takes rather than a guessed padding. */
  function fitHero() {
    var hero  = document.getElementById('deckHero');
    var title = hero && hero.querySelector('.pyb-hero__title');
    var offers = layers[1] && layers[1].querySelector('.deck__scroll');
    if (!hero || !title) return;

    // offsetWidth is the untransformed layout width, so it is safe to read
    // while the hero is mid-scale
    var natural = title.offsetWidth;
    var room = window.innerWidth * 0.86;
    var scale = natural > 0 ? Math.min(0.42, room / natural) : 0.34;

    hero.style.setProperty('--hero-scale', scale.toFixed(4));

    if (offers) {
      /* Work the headline's foot out from layout numbers rather than
         measuring: the hero is mid-transition when this runs, so a
         getBoundingClientRect here reads an intermediate size. The hero
         scales from its own top, so untransformed offsets scale linearly. */
      var lift = Math.min(16, Math.max(6, window.innerHeight * 0.014));
      var foot = lift + (title.offsetTop + title.offsetHeight) * scale;

      offers.style.paddingTop =
        Math.round(foot + Math.max(24, window.innerHeight * 0.04)) + 'px';
    }
  }

  /* the seal and the chapter track belong beside the text column */
  function fitDocChrome() {
    var layer = layers[2];
    var doc   = layer && layer.querySelector('.doc');
    if (!layer || !doc) return;

    var lr = layer.getBoundingClientRect();
    var dr = doc.getBoundingClientRect();

    layer.style.setProperty('--doc-left',  Math.round(dr.left - lr.left - 58) + 'px');
    layer.style.setProperty('--doc-right', Math.round(dr.right - lr.left + 34) + 'px');
  }

  function setStage(n) {
    n = Math.max(0, Math.min(3, n));
    if (n === stage) return;

    var previous = stage;
    stage = n;
    body.setAttribute('data-stage', String(stage));

    [1, 2, 3].forEach(function (i) {
      if (!layers[i]) return;
      layers[i].classList.toggle('is-live', i === stage);
      layers[i].classList.toggle('is-past', i < stage);
    });

    var scroller = layers[stage] && layers[stage].querySelector('.deck__scroll');
    if (scroller) scroller.scrollTop = previous > stage ? scroller.scrollHeight : 0;

    if (stage === 1) fitHero();
    if (stage === 2) { fitDocChrome(); buildDocTrack(); paintDocTrack(); }
    if (stage === 3 && word) {
      word.classList.remove('is-in');
      void word.offsetWidth;
      word.classList.add('is-in');
    }

    playEnters(stage);
    stageLock = Date.now() + 780;
  }

  function activeScroller() {
    return layers[stage] ? layers[stage].querySelector('.deck__scroll') : null;
  }

  /* true when the active layer still has room to scroll that way */
  function canScroll(dir) {
    var sc = activeScroller();
    if (!sc) return false;

    if (dir > 0) return sc.scrollTop + sc.clientHeight < sc.scrollHeight - 2;
    return sc.scrollTop > 1;
  }

  function nudge(dir) {
    if (route !== 'pyb') return false;
    if (canScroll(dir)) return false;                 // let the layer scroll

    if (dir > 0 && stage === 2) return true;          // the gate: button only
    var next = stage + dir;
    if (next < 0 || next > 3) return false;

    if (Date.now() < stageLock) return true;
    setStage(next);
    return true;
  }

  window.addEventListener('wheel', function (e) {
    if (reduced || route !== 'pyb') return;
    if (e.ctrlKey || Math.abs(e.deltaY) < 4) return;
    if (nudge(e.deltaY > 0 ? 1 : -1)) e.preventDefault();
  }, { passive: false });

  window.addEventListener('keydown', function (e) {
    if (route !== 'pyb') return;
    if (e.key === 'PageDown' || e.key === 'ArrowDown') {
      if (nudge(1)) e.preventDefault();
    } else if (e.key === 'PageUp' || e.key === 'ArrowUp') {
      if (nudge(-1)) e.preventDefault();
    }
  });

  /* touch: native scrolling stays, a swipe at the boundary turns the page */
  var deckTouchY = null;
  var deckTouchEdge = 0;

  document.addEventListener('touchstart', function (e) {
    if (route !== 'pyb') return;
    deckTouchY = e.touches[0].clientY;
    deckTouchEdge = (canScroll(1) ? 0 : 1) | (canScroll(-1) ? 0 : 2);
  }, { passive: true });

  document.addEventListener('touchend', function (e) {
    if (route !== 'pyb' || deckTouchY === null) return;
    var dy = deckTouchY - e.changedTouches[0].clientY;
    deckTouchY = null;
    if (Math.abs(dy) < 60) return;

    var dir = dy > 0 ? 1 : -1;
    // only if it was already against that edge when the swipe started
    if (dir > 0 && !(deckTouchEdge & 1)) return;
    if (dir < 0 && !(deckTouchEdge & 2)) return;
    nudge(dir);
  }, { passive: true });

  // the words move when the column does, so the curve is re-measured
  window.addEventListener('resize', function () {
    if (route !== 'pyb') return;
    buildHint();
    if (stage === 1) fitHero();
    if (stage === 2) { fitDocChrome(); buildDocTrack(); paintDocTrack(); }
  });

  /* ---------- the agreement's chapter track ---------- */

  var docScroll = document.getElementById('docScroll');
  var docTrack  = document.getElementById('docTrack');
  var docMarks  = document.getElementById('docMarks');
  var docItems  = [];
  var docTick   = 0;

  function buildDocTrack() {
    if (!docScroll || !docMarks) return;

    var span = docScroll.scrollHeight - docScroll.clientHeight;
    docMarks.innerHTML = '';
    docItems = [];
    if (span <= 0) return;

    var chapters = docScroll.querySelectorAll('.doc > h3');
    Array.prototype.forEach.call(chapters, function (h, i) {
      var at = Math.min(1, Math.max(0, (h.offsetTop - docScroll.clientHeight * 0.4) / span));

      var mark = document.createElement('div');
      mark.className = 'doc-track__mark';
      mark.style.setProperty('--at', at.toFixed(4));
      mark.innerHTML = '<i>' + String(i + 1).padStart(2, '0') + '</i><b></b>';
      docMarks.appendChild(mark);
      docItems.push({ el: mark, at: at });
    });
  }

  function paintDocTrack() {
    docTick = 0;
    if (!docScroll || !docTrack) return;

    var span = docScroll.scrollHeight - docScroll.clientHeight;
    var p = span > 0 ? Math.min(1, Math.max(0, docScroll.scrollTop / span)) : 0;
    docTrack.style.setProperty('--doc-p', p.toFixed(4));

    docItems.forEach(function (item) {
      item.el.classList.toggle('is-on', p >= item.at - 0.01);
    });
  }

  if (docScroll) {
    docScroll.addEventListener('scroll', function () {
      if (docTick) return;
      docTick = window.requestAnimationFrame(paintDocTrack);
    }, { passive: true });
  }

  /* ---------- "business" comes in a letter at a time ---------- */

  var word = document.querySelector('.contact__word');
  if (word) {
    var text = word.getAttribute('data-word') || word.textContent;
    word.innerHTML = text.split('').map(function (c, i) {
      return '<span style="--l:' + i + '">' + c + '</span>';
    }).join('');
  }

  /* the gate */
  var agreeBtn = document.getElementById('agreeBtn');
  if (agreeBtn) {
    agreeBtn.addEventListener('click', function () { setStage(3); });
  }

  function resetDeck() {
    stage = 0;
    body.setAttribute('data-stage', '0');
    [1, 2, 3].forEach(function (i) {
      if (layers[i]) layers[i].classList.remove('is-live', 'is-past');
    });
  }

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

    if (route === 'pyb') { resetDeck(); playHints(); }
  });

  route = routeFromHash();
  paintRoute();
  paintView();
  resetDeck();
})();
