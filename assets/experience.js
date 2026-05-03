(function () {
  var entries = Array.from(document.querySelectorAll('.timeline-entry'));
  var lineTop = document.querySelector('.timeline-line-top');
  var timeline = document.querySelector('.timeline');

  if (!entries.length || !lineTop || !timeline) return;

  function update() {
    var triggerY = window.innerHeight * 0.4;
    var idx = 0;

    for (var i = 0; i < entries.length; i++) {
      if (entries[i].getBoundingClientRect().top <= triggerY) idx = i;
    }

    entries.forEach(function (entry, i) {
      entry.classList.toggle('past',    i < idx);
      entry.classList.toggle('current', i === idx);
      entry.classList.toggle('future',  i > idx);
    });

    var dot = entries[idx].querySelector('.timeline-dot');
    if (dot) {
      var tlRect = timeline.getBoundingClientRect();
      var dotRect = dot.getBoundingClientRect();
      var height = dotRect.top + dotRect.height / 2 - tlRect.top;
      lineTop.style.height = Math.max(0, height) + 'px';
    }
  }

  update();

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
