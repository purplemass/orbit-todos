const staticCacheName = '0.0.2';
const serverPrefix = '/todos/'

let filesToCache = [
  // common
  '/',
  'deleteDB.html',
  'index.html',
  // 'service-worker.js',
  // 'service-worker.js.map',

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
      if (file !== '/') {
        file = `${serverPrefix}${file}`;
      }
      return file;
    });
    filesToCache.push(serverPrefix);
  }

  event.waitUntil(
    caches.open(staticCacheName)
      .then(cache => cache.addAll(filesToCache))
      // .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', function(event) {
  log('activate');

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
  // log(`fetch ${event.request.url}`);

  sendVersion(event);

  // handle caching
  event.respondWith(
    caches.match(event.request)
      .then(response => {

        if (response) {
          // log(`found ${event.request.url} in cache'`);
          return response;
        }

        // log(`network request for ${event.request.url}`);
        return fetch(event.request)

      }).catch(error => {
        log(`error: ${error}`);
      })
  );
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
