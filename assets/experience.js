(function () {
  var entries = Array.from(document.querySelectorAll('.timeline-entry'));
  var timeline = document.querySelector('.timeline');

  if (!entries.length || !timeline) return;

  // Prevent browser scroll restoration from animating (causes visible page jump on back-nav)
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

  // Cache dot positions relative to timeline top — recomputed on resize only, not per frame
  var dotOffsets = [];
  function cacheDotOffsets() {
    var tlTop = timeline.getBoundingClientRect().top + window.scrollY;
    dotOffsets = entries.map(function (entry) {
      var dot = entry.querySelector('.timeline-dot');
      var r = dot.getBoundingClientRect();
      return r.top + r.height / 2 + window.scrollY - tlTop;
    });
  }

  function update() {
    // One getBoundingClientRect() per frame (was 16)
    var tlRect = timeline.getBoundingClientRect();
    var triggerY = window.innerHeight * 0.4;
    var lineHeight = Math.max(0, triggerY - tlRect.top);

    // Find current entry using cached offsets — pure arithmetic, no layout reads
    var idx = 0;
    for (var i = 0; i < dotOffsets.length; i++) {
      if (dotOffsets[i] <= lineHeight) idx = i;
    }

    // Update gradient stop via CSS custom property — no flex reflow
    timeline.style.setProperty('--tl-progress', lineHeight + 'px');

    entries.forEach(function (entry, i) {
      entry.classList.toggle('past',    i < idx);
      entry.classList.toggle('current', i === idx);
      entry.classList.toggle('future',  i > idx);
    });
  }

  cacheDotOffsets();
  requestAnimationFrame(update);

  // Recache after fonts finish loading — @font-face swaps change entry heights and shift dot positions
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () {
      cacheDotOffsets();
      requestAnimationFrame(update);
    });
  }

  var ticking = false;
  window.addEventListener('scroll', function () {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () { update(); ticking = false; });
  }, { passive: true });

  window.addEventListener('resize', function () {
    cacheDotOffsets();
    requestAnimationFrame(update);
  }, { passive: true });
})();
