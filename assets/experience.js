(function () {
  var entries = Array.from(document.querySelectorAll('.timeline-entry'));
  var timeline = document.querySelector('.timeline');

  if (!entries.length || !timeline) return;

  // Prevent browser scroll restoration from animating (causes visible page jump on back-nav)
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

  // Cache dot positions relative to timeline top — recomputed on resize only, not per frame
  var dotOffsets = [];
  var firstDotOffset = 0;
  var lastDotOffset = 0;
  var triggerY = 0;
  var maxScroll = 0;
  var scrollAtFirst = 0;
  var scrollAtLast = 0;
  var shortDoc = false;
  function cacheDotOffsets() {
    var tlTop = timeline.getBoundingClientRect().top + window.scrollY;
    dotOffsets = entries.map(function (entry) {
      var dot = entry.querySelector('.timeline-dot');
      var r = dot.getBoundingClientRect();
      return r.top + r.height / 2 + window.scrollY - tlTop;
    });
    firstDotOffset = dotOffsets[0];
    lastDotOffset = dotOffsets[dotOffsets.length - 1];
    triggerY = window.innerHeight * 0.4;
    maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    scrollAtFirst = Math.max(0, (tlTop + firstDotOffset) - triggerY);
    scrollAtLast = Math.min(maxScroll, (tlTop + lastDotOffset) - triggerY);
    shortDoc = scrollAtLast <= scrollAtFirst;
    // Clip gradient to [firstDot, lastDot]
    timeline.style.setProperty('--tl-line-start', firstDotOffset + 'px');
    timeline.style.setProperty('--tl-line-end', lastDotOffset + 'px');
  }

  function update() {
    var scrollY = window.scrollY;
    var progress;
    if (shortDoc) {
      // Fallback: doc too short for normal trigger mapping
      progress = maxScroll > 0 ? scrollY / maxScroll : 0;
    } else {
      progress = (scrollY - scrollAtFirst) / (scrollAtLast - scrollAtFirst);
      if (progress < 0) progress = 0;
      else if (progress > 1) progress = 1;
    }
    var lineHeight = firstDotOffset + progress * (lastDotOffset - firstDotOffset);

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
