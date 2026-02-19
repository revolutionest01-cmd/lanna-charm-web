/**
 * Cache Cleanup on App Startup
 * Prevents stale cache issues when user revisits in normal mode
 */

export const initializeCacheCleanup = () => {
  // Clear all old caches on app load
  if ('caches' in window) {
    caches.keys().then((cacheNames) => {
      // Delete old cache versions (keep current)
      cacheNames.forEach((name) => {
        if (name.startsWith('lanna-charm-cache')) {
          console.log('[Cache Cleanup] Deleted old cache:', name);
          caches.delete(name);
        }
      });
    });
  }

  // Clear old localStorage keys that might cause issues
  const keysToCheck = [
    'language-storage',
    'app-cache-metadata',
    'last-update-check'
  ];

  keysToCheck.forEach((key) => {
    // Don't clear language preference
    if (key !== 'language-storage') {
      const item = localStorage.getItem(key);
      if (item) {
        console.log('[Cache Cleanup] Cleared localStorage:', key);
        localStorage.removeItem(key);
      }
    }
  });

  // Unregister all service workers to force fresh load
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      registrations.forEach((registration) => {
        console.log('[Cache Cleanup] Unregistering SW:', registration.scope);
        registration.unregister();
      });
    });
  }

  // Set a flag to indicate fresh load
  sessionStorage.setItem('app-fresh-load', 'true');
  console.log('[Cache Cleanup] App started with fresh cache');
};

/**
 * Check if this is a fresh load (for debugging)
 */
export const isFreshLoad = (): boolean => {
  return sessionStorage.getItem('app-fresh-load') === 'true';
};
