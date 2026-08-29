/**
 * Service Worker Registration
 * Registers the service worker for offline support and performance caching
 */

export function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/service-worker.js', { scope: '/' })
        .then((registration) => {
          console.log('Service Worker registered successfully:', registration);

          // Check for updates periodically
          setInterval(() => {
            registration.update();
          }, 60000); // Check every minute

          // Listen for updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New service worker is ready
                console.log('New Service Worker available');
                
                // Optionally show update notification to user
                if (window.confirm('A new version is available! Refresh to update?')) {
                  newWorker.postMessage({ type: 'SKIP_WAITING' });
                  window.location.reload();
                }
              }
            });
          });
        })
        .catch((error) => {
          console.error('Service Worker registration failed:', error);
        });

      // Handle controller change
      let refreshing;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (refreshing) return;
        refreshing = true;
        window.location.reload();
      });
    });
  }
}

/**
 * Clear all caches
 * Useful for manual cache clearing
 */
export async function clearAllCaches() {
  if ('caches' in window) {
    const cacheNames = await caches.keys();
    return Promise.all(
      cacheNames.map(name => caches.delete(name))
    );
  }
}

/**
 * Get cache statistics
 * Returns information about cached data
 */
export async function getCacheStats() {
  if (!('caches' in window)) return null;

  const cacheNames = await caches.keys();
  const stats = {};

  for (const name of cacheNames) {
    const cache = await caches.open(name);
    const keys = await cache.keys();
    stats[name] = {
      count: keys.length,
      urls: keys.map(req => req.url)
    };
  }

  return stats;
}
