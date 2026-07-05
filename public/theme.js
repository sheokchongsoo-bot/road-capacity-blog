// 테마 토글: 현재 테마를 뒤집고 localStorage에 저장한다.
// (초기 테마 적용은 FOUC 방지를 위해 <head> 인라인 스크립트에서 이미 처리)
(function () {
  var root = document.documentElement;
  var button = document.getElementById('theme-toggle');
  if (!button) return;

  button.addEventListener('click', function () {
    var current = root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
    var next = current === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    try {
      localStorage.setItem('theme', next);
    } catch (e) {}
  });
})();
