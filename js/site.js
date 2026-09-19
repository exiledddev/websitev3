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

    /* The phone picker: a real listbox rather than a native select, so it
       can carry the same glass as the rest of the page. */
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

    function syncPicker(button) {
      if (!picker) return;
      value.textContent = button.textContent.trim();
      Array.prototype.forEach.call(menu.querySelectorAll('[data-tab]'), function (li) {
        li.setAttribute('aria-selected', li.getAttribute('data-tab') === button.id ? 'true' : 'false');
      });
    }

    list.addEventListener('click', function (e) {
      var button = e.target.closest('[role="tab"]');
      if (!button) return;
      select(button, false);
      if (typeof window.__fitOffers === 'function') {
        window.requestAnimationFrame(window.__fitOffers);
      }
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

  var agreeBtn = document.getElementById('agreeBtn');   /* the gate */
  var word = document.querySelector('.contact__word');

  var STAGES = ['deckHero', 'stageOffers', 'stageDoc', 'stageContact'];
  var layers = {
    1: document.getElementById('stageOffers'),
    2: document.getElementById('stageDoc'),
    3: document.getElementById('stageContact')
  };

  var stage = 0;
  var stageLock = 0;
  var selectIn = 0;
  var selectOut = 0;

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

    /* At stage 1 the title is width:max-content, so offsetWidth is the real
       one-line width of the text - not the container's width, which is what
       it used to read and why the line still overflowed. */
    var natural = title.offsetWidth;
    var room = window.innerWidth * 0.84;
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

  /* Stage 1 has to hold whichever tab is tallest, so scale the whole block
     down until it fits rather than tuning type sizes per panel. */
  function fitOffers() {
    var fit = document.getElementById('offersFit');
    var sc  = layers[1] && layers[1].querySelector('.deck__scroll');
    if (!fit || !sc) return;

    // phones read the copy at full size and scroll it instead
    if (window.matchMedia('(max-width: 620px)').matches) {
      fit.style.removeProperty('--fit');
      fit.style.height = '';
      return;
    }

    // clear the last measurement first, or the height left over from the
    // previous tab skews this one
    fit.style.setProperty('--fit', '1');
    fit.style.height = '';
    void fit.offsetHeight;

    var natural = fit.getBoundingClientRect().height;
    var cs = getComputedStyle(sc);
    // the notice and the tab row sit above the scaled block and keep their
    // own size, so only what is left under them is available
    var above = fit.getBoundingClientRect().top - sc.getBoundingClientRect().top;
    var avail = sc.clientHeight - above - parseFloat(cs.paddingBottom || 0);

    var k = (natural > 0 && avail > 0) ? Math.min(1, avail / natural) : 1;
    fit.style.setProperty('--fit', k.toFixed(4));
    fit.style.height = Math.ceil(natural * k) + 4 + 'px';
  }

  /* the seal and the chapter track sit outside the widest block on the
     page, not the narrower text column, or the heading runs under them */
  function fitDocChrome() {
    var layer = layers[2];
    var block = layer && layer.querySelector('.agreement');
    if (!layer || !block) return;

    var lr = layer.getBoundingClientRect();
    var br = block.getBoundingClientRect();

    layer.style.setProperty('--doc-left',  Math.round(br.left - lr.left - 56) + 'px');
    layer.style.setProperty('--doc-right', Math.round(br.right - lr.left + 40) + 'px');
  }

  /* Stage changes play a quick mark wipe instead of a crossfade; agreeing
     gets the longer one. Both drive the same overlay. */
  var WIPES = {
    fast: { klass: 'swipe--fast', cover: 780, hold: 120, uncover: 900 },
    seal: { klass: 'swipe--seal', cover: 620, hold: 420, uncover: 700 }
  };

  function runWipe(kind, swap) {
    var w = WIPES[kind];

    if (reduced || swiping) { swap(); return; }
    swiping = true;

    if (kind === 'seal' && agreeBtn) {
      // the circle opens from the button, so it reads as the button swelling
      var r = agreeBtn.getBoundingClientRect();
      swipe.style.setProperty('--seal-x', Math.round(r.left + r.width / 2) + 'px');
      swipe.style.setProperty('--seal-y', Math.round(r.top + r.height / 2) + 'px');
      agreeBtn.classList.add('is-morphing');
    }

    swipe.classList.add(w.klass);
    swipe.setAttribute('data-state', 'cover');

    window.setTimeout(function () {
      swap();
      swipe.setAttribute('data-state', 'uncover');

      window.setTimeout(function () {
        swipe.setAttribute('data-state', 'idle');
        swipe.classList.remove(w.klass);
        if (agreeBtn) agreeBtn.classList.remove('is-morphing');
        swiping = false;
      }, w.uncover);
    }, w.cover + w.hold);
  }

  function applyStage(n) {
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

    if (stage === 1) { fitHero(); window.requestAnimationFrame(fitOffers); }
    if (stage === 2) { fitDocChrome(); buildDocTrack(); paintDocTrack(); buildAgreeRing(); }
    if (stage === 3 && word) {
      word.classList.remove('is-selecting', 'is-clearing');
      void word.offsetWidth;

      // a beat after the page lands, run the selection across it
      window.clearTimeout(selectIn);
      window.clearTimeout(selectOut);
      if (!reduced) {
        selectIn = window.setTimeout(function () {
          word.classList.add('is-selecting');          // wipes in from the left

          selectOut = window.setTimeout(function () {
            word.classList.remove('is-selecting');
            word.classList.add('is-clearing');         // and off to the right
            window.setTimeout(function () {
              word.classList.remove('is-clearing');
            }, 680);
          }, 1050);
        }, 820);
      }
    }

    playEnters(stage);
  }

  function setStage(n, kind) {
    n = Math.max(0, Math.min(3, n));
    if (n === stage || swiping) return;

    stageLock = Date.now() + 1200;
    runWipe(kind || 'fast', function () { applyStage(n); });
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
    if (stage === 1) { fitHero(); window.requestAnimationFrame(fitOffers); }
    if (stage === 2) { fitDocChrome(); buildDocTrack(); paintDocTrack(); buildAgreeRing(); }
  });

  window.__fitOffers = fitOffers;

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

    // the seal reads at about a third of the page's pace: top of the
    // document at the start, no further than the middle at the end
    var seal = layers[2] && layers[2].querySelector('.doc-seal');
    if (seal) seal.style.setProperty('--seal-top', (14 + p * 36).toFixed(2) + '%');

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

  /* the gate */

  var STAGES = ['deckHero', 'stageOffers', 'stageDoc', 'stageContact'];
  var layers = {
    1: document.getElementById('stageOffers'),
    2: document.getElementById('stageDoc'),
    3: document.getElementById('stageContact')
  };

  var stage = 0;
  var stageLock = 0;
  var selectIn = 0;
  var selectOut = 0;

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

    /* At stage 1 the title is width:max-content, so offsetWidth is the real
       one-line width of the text - not the container's width, which is what
       it used to read and why the line still overflowed. */
    var natural = title.offsetWidth;
    var room = window.innerWidth * 0.84;
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

  /* Stage 1 has to hold whichever tab is tallest, so scale the whole block
     down until it fits rather than tuning type sizes per panel. */
  function fitOffers() {
    var fit = document.getElementById('offersFit');
    var sc  = layers[1] && layers[1].querySelector('.deck__scroll');
    if (!fit || !sc) return;

    // phones read the copy at full size and scroll it instead
    if (window.matchMedia('(max-width: 620px)').matches) {
      fit.style.removeProperty('--fit');
      fit.style.height = '';
      return;
    }

    // clear the last measurement first, or the height left over from the
    // previous tab skews this one
    fit.style.setProperty('--fit', '1');
    fit.style.height = '';
    void fit.offsetHeight;

    var natural = fit.getBoundingClientRect().height;
    var cs = getComputedStyle(sc);
    // the notice and the tab row sit above the scaled block and keep their
    // own size, so only what is left under them is available
    var above = fit.getBoundingClientRect().top - sc.getBoundingClientRect().top;
    var avail = sc.clientHeight - above - parseFloat(cs.paddingBottom || 0);

    var k = (natural > 0 && avail > 0) ? Math.min(1, avail / natural) : 1;
    fit.style.setProperty('--fit', k.toFixed(4));
    fit.style.height = Math.ceil(natural * k) + 4 + 'px';
  }

  /* the seal and the chapter track sit outside the widest block on the
     page, not the narrower text column, or the heading runs under them */
  function fitDocChrome() {
    var layer = layers[2];
    var block = layer && layer.querySelector('.agreement');
    if (!layer || !block) return;

    var lr = layer.getBoundingClientRect();
    var br = block.getBoundingClientRect();

    layer.style.setProperty('--doc-left',  Math.round(br.left - lr.left - 56) + 'px');
    layer.style.setProperty('--doc-right', Math.round(br.right - lr.left + 40) + 'px');
  }

  /* Stage changes play a quick mark wipe instead of a crossfade; agreeing
     gets the longer one. Both drive the same overlay. */
  var WIPES = {
    fast: { klass: 'swipe--fast', cover: 780, hold: 120, uncover: 900 },
    seal: { klass: 'swipe--seal', cover: 620, hold: 420, uncover: 700 }
  };

  function runWipe(kind, swap) {
    var w = WIPES[kind];

    if (reduced || swiping) { swap(); return; }
    swiping = true;

    if (kind === 'seal' && agreeBtn) {
      // the circle opens from the button, so it reads as the button swelling
      var r = agreeBtn.getBoundingClientRect();
      swipe.style.setProperty('--seal-x', Math.round(r.left + r.width / 2) + 'px');
      swipe.style.setProperty('--seal-y', Math.round(r.top + r.height / 2) + 'px');
      agreeBtn.classList.add('is-morphing');
    }

    swipe.classList.add(w.klass);
    swipe.setAttribute('data-state', 'cover');

    window.setTimeout(function () {
      swap();
      swipe.setAttribute('data-state', 'uncover');

      window.setTimeout(function () {
        swipe.setAttribute('data-state', 'idle');
        swipe.classList.remove(w.klass);
        if (agreeBtn) agreeBtn.classList.remove('is-morphing');
        swiping = false;
      }, w.uncover);
    }, w.cover + w.hold);
  }

  function applyStage(n) {
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

    if (stage === 1) { fitHero(); window.requestAnimationFrame(fitOffers); }
    if (stage === 2) { fitDocChrome(); buildDocTrack(); paintDocTrack(); buildAgreeRing(); }
    if (stage === 3 && word) {
      word.classList.remove('is-selecting', 'is-clearing');
      void word.offsetWidth;

      // a beat after the page lands, run the selection across it
      window.clearTimeout(selectIn);
      window.clearTimeout(selectOut);
      if (!reduced) {
        selectIn = window.setTimeout(function () {
          word.classList.add('is-selecting');          // wipes in from the left

          selectOut = window.setTimeout(function () {
            word.classList.remove('is-selecting');
            word.classList.add('is-clearing');         // and off to the right
            window.setTimeout(function () {
              word.classList.remove('is-clearing');
            }, 680);
          }, 1050);
        }, 820);
      }
    }

    playEnters(stage);
  }

  function setStage(n, kind) {
    n = Math.max(0, Math.min(3, n));
    if (n === stage || swiping) return;

    stageLock = Date.now() + 1200;
    runWipe(kind || 'fast', function () { applyStage(n); });
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
    if (stage === 1) { fitHero(); window.requestAnimationFrame(fitOffers); }
    if (stage === 2) { fitDocChrome(); buildDocTrack(); paintDocTrack(); buildAgreeRing(); }
  });

  window.__fitOffers = fitOffers;

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

    // the seal reads at about a third of the page's pace: top of the
    // document at the start, no further than the middle at the end
    var seal = layers[2] && layers[2].querySelector('.doc-seal');
    if (seal) seal.style.setProperty('--seal-top', (14 + p * 36).toFixed(2) + '%');

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

  if (agreeBtn) {
    agreeBtn.addEventListener('click', function () { setStage(3, 'seal'); });
  }

  /* The hover ring is a pill traced from the top centre, clockwise, back to
     the top centre - so the stroke draws away from and returns to the same
     point. Built from the measured box, since the button's width follows
     its text. */
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

  window.addEventListener('resize', buildAgreeRing);

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
  buildAgreeRing();
})();
