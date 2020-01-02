
(() => {

  'use strict';

  loadServiceWorker();

  let newWorker;
  let refreshing;

  const notification = document.getElementById('notification');

  // The click event on the notification
  document.getElementById('reloadPage').addEventListener('click', () => {
    notification.classList.add('hide');
    newWorker.postMessage({ action: 'skipWaiting' });
  });

  function loadServiceWorker() {
    if ('serviceWorker' in navigator) {

      navigator.serviceWorker.register('/service-worker.js')
      .then((reg) => {
        console.log(`service worker registered [${reg.scope}]`);

        reg.addEventListener('updatefound', () => {
          // An updated service worker has appeared in reg.installing!
          newWorker = reg.installing;
          newWorker.addEventListener('statechange', () => {
            console.log(newWorker.state);

            // Has service worker state changed?
            switch (newWorker.state) {

              case 'installed':
                // There is a new service worker available, show the notification
                if (navigator.serviceWorker.controller) {
                  notification.classList.remove('hide');
                }
                break;

              case 'activated':
                // If there no version it means this is the first time
                // our service worker is activated - reload to load cache
                const version = document.getElementById('version');
                if (version.innerHTML === '') {
                  window.location.reload();
                }
                break;

            }
          });

        });

      }).catch((error) => {
        console.log('Could not register service worker', error);
      });

      // The event listener that is fired when the service worker updates
      // Here we reload the page
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (refreshing === true) return;

        window.location.reload();
        refreshing = true;
      });

      navigator.serviceWorker.addEventListener('message', event => {
        const version = document.getElementById('version');
        version.innerHTML = event.data.msg;
      });

    }
  }

})();
