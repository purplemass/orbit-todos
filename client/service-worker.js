const staticCacheName = 'B 0.0.5';
const serverPrefix = '/todos/'

let filesToCache = [
  // common
  '/',
  'deleteDB.html',
  'index.html',
  'service_worker_client.6231035a.js',
  'service_worker_client.6231035a.js.map',

  // dev
  'base.f602a789.js',
  'base.f602a789.js.map',

  // build-prod
  'app.a6a4d504.js',
  'app.a6a4d504.js.map',
  'base.f602a789.css',
  'base.f602a789.css.map',
  'bg.5e36bef1.png',
  'dom.b63646c9.js',
  'dom.b63646c9.js.map',
  'favicon.21b6e204.ico',
  'main.d4190f58.css',
  'main.d4190f58.css.map',
  'main.d4190f58.js',
  'main.d4190f58.js.map',
];

self.addEventListener('install', event => {
  log('install');

  // add serverPrefix to paths when on server (https)
  if (event.target.registration.scope.indexOf('https') > -1) {
    filesToCache = filesToCache.map(file => {
      file = `${serverPrefix}${file}`;
      file = file.replace('//', '/');
      return file;
    });
  }

  event.waitUntil(
    caches.open(staticCacheName)
      .then(cache => cache.addAll(filesToCache))
  );
});

self.addEventListener('activate', event => {
  log('activate');

  // delete any caches that aren't in staticCacheName
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.map(key => {
        if (key.startsWith('B') && !staticCacheName.includes(key)) {
          return caches.delete(key);
        }
      })
    ))
  );

  // return self.clients.claim();
});

self.addEventListener('fetch', event => {
  // log(`fetch ${event.request.url}`);

  sendVersion(event);

  // handle caching
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        return response || fetch(event.request);
      }).catch(error => {
        log(`error: ${error} [${event.request.url}]`);
        log(`Redirect to [${filesToCache[0]}]`);
        return caches.match(filesToCache[0]);
      })
  );
});

self.addEventListener('message', event => {
  if (event.data.action === 'skipWaiting') {
    self.skipWaiting();
  }
});

// Functions

const log = (message) => {
  console.log(`[${staticCacheName}] ${message}`);
};

const sendVersion = (event) => {
  event.waitUntil(async function() {
    if (event.clientId) {
      const client = await clients.get(event.clientId);
      if (client) {
        client.postMessage({
          msg: staticCacheName,
          url: event.request.url,
        });
      }
    }
  }());
};
