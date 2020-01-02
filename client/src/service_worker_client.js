
(() => {

  'use strict';

  loadServiceWorker();

  function loadServiceWorker() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/service-worker.js')
      .then((reg) => {
        console.log(`service worker registered [${reg.scope}]`);
      }).catch((error) => {
        console.log('Could not register service worker', error);
      });

      navigator.serviceWorker.addEventListener('message', event => {
        const version = document.getElementById('version');
        version.innerHTML = event.data.msg;
      });
    }
  }

})();
