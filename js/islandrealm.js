/* ============================================================
   Island Realm — placing the character art

   The art cannot live inside its panel: a panel clips its own
   children to give it the chamfer, so a figure in there can
   never cross the divider into the next column. It sits in a
   layer over the panels instead, and each box is measured onto
   its own column here.

   Measuring beats a CSS grid copy because the layout changes
   shape - three columns on a desktop, stacked rows on a phone -
   and the rows are content-sized, so an overlay grid could not
   line up with them.
   ============================================================ */
(function () {
  'use strict';

  var layer = document.getElementById('artLayer');
  if (!layer) return;

  var cast = document.querySelector('.cast');
  var panels = Array.prototype.slice.call(document.querySelectorAll('.cast__panel'));
  var arts = Array.prototype.slice.call(layer.querySelectorAll('.cast__art'));
  if (!cast || panels.length !== arts.length) return;

  var names = Array.prototype.slice.call(document.querySelectorAll('.cast__name'));

  var GAP = 14;        // breathing room under the socials

  /* The names hold one line each (see .cast__name). "EpicClutch" is twice
     the length of "Cuski", so at the shared size it runs past its column -
     it is stepped down to fit rather than being allowed to wrap, because a
     wrapped name drops its own header and figure below the other two.
     Measured rather than computed from the text so it follows the webfont
     and the panel width instead of guessing at either. */
  function fitNames() {
    names.forEach(function (name) {
      name.style.fontSize = '';
      var room = name.clientWidth;
      if (!room) return;

      var needed = name.scrollWidth;
      if (needed <= room) return;

      var size = parseFloat(getComputedStyle(name).fontSize);
      name.style.fontSize = (size * (room / needed) * 0.99).toFixed(2) + 'px';
    });
  }

  function place() {
    fitNames();

    var base = cast.getBoundingClientRect();

    /* Columns standing side by side share one start line, taken from
       whichever header reaches lowest. Letting each figure start under
       its own socials looks right until two headers come out different
       heights, and then the heads stop lining up. Panels are grouped by
       their own top edge so the stacked phone layout - where each panel
       is its own row - still measures a line per panel. */
    var lines = panels.map(function (panel) {
      var socials = panel.querySelector('.cast__socials');
      if (!socials) return null;
      return {
        top: Math.round(panel.getBoundingClientRect().top - base.top),
        line: (socials.getBoundingClientRect().bottom - base.top) + GAP
      };
    });

    panels.forEach(function (panel, i) {
      var art = arts[i];
      if (!art || !lines[i]) return;

      var pr = panel.getBoundingClientRect();

      var top = lines.reduce(function (low, l) {
        if (!l || Math.abs(l.top - lines[i].top) > 2) return low;
        return Math.max(low, l.line);
      }, 0);
      var bottom = pr.bottom - base.top;

      art.style.left = (pr.left - base.left) + 'px';
      art.style.width = pr.width + 'px';
      art.style.top = top + 'px';
      art.style.height = Math.max(0, bottom - top) + 'px';
    });
  }

  if (window.ResizeObserver) {
    var ro = new ResizeObserver(place);
    ro.observe(cast);
    panels.forEach(function (p) { ro.observe(p); });
  }
  window.addEventListener('resize', place);
  window.addEventListener('load', place);

  /* the titles are webfont-set, so the socials move once the face lands */
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(place);

  place();
  requestAnimationFrame(place);
})();
