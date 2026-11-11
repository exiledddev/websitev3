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

  var GAP = 14;        // breathing room under the socials

  function place() {
    var base = cast.getBoundingClientRect();

    panels.forEach(function (panel, i) {
      var art = arts[i];
      var socials = panel.querySelector('.cast__socials');
      if (!art || !socials) return;

      var pr = panel.getBoundingClientRect();
      var sr = socials.getBoundingClientRect();

      /* the figure starts below this panel's own socials - EpicClutch's
         name wraps to two lines, so his start lower than the others */
      var top = (sr.bottom - base.top) + GAP;
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
