(function () {
  var entries = Array.from(document.querySelectorAll('.timeline-entry'));
  var lineTop = document.querySelector('.timeline-line-top');
  var timeline = document.querySelector('.timeline');

  if (!entries.length || !lineTop || !timeline) return;

  // Suppress smooth-scroll during initial load so browser scroll restoration
  // doesn't animate and appear as a page jump
  document.documentElement.style.scrollBehavior = 'auto';
  requestAnimationFrame(function () {
    requestAnimationFrame(function () {
      document.documentElement.style.scrollBehavior = '';
    });
  });

  function update() {
    var triggerY = window.innerHeight * 0.4;
    var tlRect = timeline.getBoundingClientRect();

    // Batch all reads before any writes
    var dotMids = entries.map(function (entry) {
      var dot = entry.querySelector('.timeline-dot');
      var r = dot.getBoundingClientRect();
      return r.top + r.height / 2;
    });

    // Current entry = last dot whose midpoint has reached the trigger
    var idx = 0;
    for (var i = 0; i < dotMids.length; i++) {
      if (dotMids[i] <= triggerY) idx = i;
    }

    // Write: line height continuously tracks viewport position (not dot position)
    lineTop.style.height = Math.max(0, triggerY - tlRect.top) + 'px';

    entries.forEach(function (entry, i) {
      entry.classList.toggle('past',    i < idx);
      entry.classList.toggle('current', i === idx);
      entry.classList.toggle('future',  i > idx);
    });
  }

  requestAnimationFrame(update);

  var ticking = false;
  window.addEventListener('scroll', function () {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      update();
      ticking = false;
    });
  }, { passive: true });
})();
