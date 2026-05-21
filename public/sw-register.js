if ('serviceWorker' in navigator) {
  var CURRENT_SW_VERSION = 'v4-20260410';

  if (localStorage.getItem('sw-version') !== CURRENT_SW_VERSION) {
    // One-time nuclear cleanup on version bump: unregister old SW, clear caches, re-register
    navigator.serviceWorker.getRegistrations()
      .then(function (regs) {
        return Promise.all(regs.map(function (r) { return r.unregister(); }));
      })
      .then(function () { return caches.keys(); })
      .then(function (names) {
        return Promise.all(names.map(function (n) { return caches.delete(n); }));
      })
      .then(function () {
        localStorage.setItem('sw-version', CURRENT_SW_VERSION);
        window.location.reload();
      });
  } else {
    navigator.serviceWorker.register('/sw.js')
      .then(function (reg) {
        console.log('SW registrat', reg.scope);
        reg.update();
        // Check for updates every 5 minutes instead of every minute
        setInterval(function () { reg.update(); }, 5 * 60 * 1000);

        reg.addEventListener('updatefound', function () {
          var newWorker = reg.installing;
          if (!newWorker) return;
          newWorker.addEventListener('statechange', function () {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              newWorker.postMessage('SKIP_WAITING');
            }
          });
        });

        var refreshing = false;
        navigator.serviceWorker.addEventListener('controllerchange', function () {
          if (!refreshing) {
            refreshing = true;
            window.location.reload();
          }
        });
      })
      .catch(function (err) { console.warn('SW error', err); });
  }
}
