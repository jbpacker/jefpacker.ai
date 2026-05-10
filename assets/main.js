var navToggle = document.getElementById('nav-toggle');
var nav = document.getElementById('nav');

if (navToggle && nav) {
  navToggle.addEventListener('click', function () {
    var isOpen = nav.classList.toggle('is-open');
    navToggle.setAttribute('aria-expanded', String(isOpen));
    navToggle.textContent = isOpen ? '✕' : '☰';
  });
}

document.querySelectorAll('.patent-row-collapse').forEach(function (btn) {
  btn.addEventListener('click', function () {
    btn.closest('details').removeAttribute('open');
  });
});
