// sw.js — 간단 오프라인 캐시
const CACHE_NAME = "mahara-app-v1";
const ASSETS = [
  "./",
  "./index.html",
  "./style.css",
  "./data.js",
  "./manifest.webmanifest",
  // 아이콘(있다면)
  "./icons/icon-192.png",
  "./icons/icon-512.png"
];

// 설치: 핵심 파일 프리캐시
self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)));
  self.skipWaiting();
});

// 활성화: 오래된 캐시 정리
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((k) => (k !== CACHE_NAME ? caches.delete(k) : null)))
    )
  );
  self.clients.claim();
});

// 요청 가로채기: 캐시 우선, 없으면 네트워크
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return; // POST 등은 건드리지 않음
  e.respondWith(
    caches.match(req).then((cached) => {
      const fetchPromise = fetch(req)
        .then((res) => {
          // 성공한 GET 요청은 캐시에 백그라운드 업데이트
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
          return res;
        })
        .catch(() => cached); // 네트워크 실패 시 캐시 반환
      return cached || fetchPromise;
    })
  );
});
