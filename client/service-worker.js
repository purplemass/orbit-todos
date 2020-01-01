const staticCacheName = 'v1.0.0';

const filesToCache = [
  '/',
  '/app.a6a4d504.js',
  '/base.f602a789.css',
  '/base.f602a789.js',
  '/bg.5e36bef1.png',
  '/dom.b63646c9.js',
  '/favicon.21b6e204.ico',
  '/index.html',
  '/main.d4190f58.css',
  '/main.d4190f58.js',
  '/service-worker.js',
];

self.addEventListener('install', event => {
  console.log('sw: install', staticCacheName);
  event.waitUntil(
    caches.open(staticCacheName).then(cache => cache.addAll(filesToCache))
  );

  self.skipWaiting();
});

self.addEventListener('activate', function(event) {
  console.log('sw: activate');
  // delete any caches that aren't in staticCacheName
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.map(key => {
        if (!staticCacheName.includes(key)) {
          return caches.delete(key);
        }
      })
    ))
  );
  // return self.clients.claim();
});

self.addEventListener('fetch', event => {
  console.log('sw: fetch', event.request.url);
  event.respondWith(
    caches.match(event.request)
    .then(response => {
      if (response) {
        // console.log('sw: found ', event.request.url, ' in cache');
        return response;
      }

      // console.log('sw: network request for ', event.request.url);
      return fetch(event.request)

    }).catch(error => {
      console.log('sw: error', error);
    })
  );
});
