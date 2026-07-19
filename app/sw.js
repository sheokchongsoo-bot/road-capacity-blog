/* 서비스워커 — 프로토타입용 간단 오프라인 캐시.
   실제 배포 시 캐시 전략/버전 관리를 재검토할 것. */
var CACHE = "ii-market-v2";
var ASSETS = [
  "./",
  "./index.html",
  "./css/styles.css",
  "./js/store.js",
  "./js/app.js",
  "./manifest.webmanifest",
  "./icons/icon.svg"
];

self.addEventListener("install", function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (c) { return c.addAll(ASSETS); })
      .then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) {
        if (k !== CACHE) return caches.delete(k);
      }));
    }).then(function () { return self.clients.claim(); })
  );
});

// 캐시 우선, 실패 시 네트워크 (프로토타입 수준)
self.addEventListener("fetch", function (e) {
  if (e.request.method !== "GET") return;
  e.respondWith(
    caches.match(e.request).then(function (hit) {
      return hit || fetch(e.request).then(function (res) {
        return res;
      }).catch(function () {
        return caches.match("./index.html");
      });
    })
  );
});
