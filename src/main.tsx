import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initializeGA } from "./lib/googleAnalytics";
import { debugUtils } from "./lib/debugUtils";
import { hardReset } from "./lib/hardReset";
import { initializeCacheCleanup } from "./lib/cacheCleanup";
import { cacheClearManager } from "./lib/cacheClearManager";

// 1. FIRST: Clean up old caches and service workers (prevents stale data issues)
initializeCacheCleanup();

// 2. Initialize Google Analytics
initializeGA();

// 3. Make utilities available in console
console.log("🚀 App starting...");
console.log("💡 Debug utilities available:");
console.log("   - cacheClearManager.hardClear() - Quick cache clear + reload");
console.log("   - cacheClearManager.nuclearReset() - Complete reset");
console.log("   - cacheClearManager.status() - See all options");
console.log("   - debugUtils.suggest() - Auto diagnostic");
console.log("   - hardReset.RESET_ALL() - Hard reset (legacy)");
console.log("   - hardReset.HELP() - See reset options");

// Auto-run diagnostic in development
if (process.env.NODE_ENV === 'development') {
  setTimeout(() => {
    debugUtils.suggest();
  }, 2000);
}

// Register Service Worker - but skip for now to debug
if ('serviceWorker' in navigator && false) { // Temporarily disabled - set to true after fixing
  window.addEventListener('load', () => {
    // Get all existing registrations and unregister
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      registrations.forEach((registration) => {
        registration.unregister();
      });
    });
    
    // Register the new service worker
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('[SW] Registered successfully');
        setInterval(() => registration.update(), 60000);
      })
      .catch((error) => {
        console.warn('[SW] Registration failed:', error);
      });
  });
} else if (process.env.NODE_ENV === 'development') {
  console.log('[SW] Skipped (development mode)');
}

createRoot(document.getElementById("root")!).render(<App />);
