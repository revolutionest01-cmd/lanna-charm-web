/**
 * Hard Reset Utilities for Production Troubleshooting
 * Call these functions from browser DevTools Console (F12)
 */

export const hardReset = {
  /**
   * NUCLEAR OPTION: Complete app reset
   * - Clears ALL data
   * - Kills all service workers
   * - Clears all caches
   * - Reloads page fresh
   */
  async RESET_ALL() {
    console.log("🔴 NUCLEAR RESET - Clearing everything...\n");

    // 1. Unregister all service workers
    if ('serviceWorker' in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      console.log(`📵 Unregistering ${regs.length} service workers...`);
      for (const reg of regs) {
        console.log(`   - ${reg.scope}`);
        await reg.unregister();
      }
    }

    // 2. Clear all caches
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      console.log(`🗑️  Clearing ${cacheNames.length} caches...`);
      for (const name of cacheNames) {
        console.log(`   - ${name}`);
        await caches.delete(name);
      }
    }

    // 3. Clear all storage (except language preference)
    const language = localStorage.getItem('language-storage');
    console.log("📤 Clearing localStorage...");
    localStorage.clear();
    if (language) {
      localStorage.setItem('language-storage', language);
      console.log("✅ Preserved language preference");
    }

    console.log("🧹 Clearing sessionStorage...");
    sessionStorage.clear();

    // 4. Delete IndexedDB (used by React Query and others)
    console.log("🗄️  Checking IndexedDB databases...");
    if ('indexedDB' in window) {
      const dbs = await indexedDB.databases?.() || [];
      for (const db of dbs) {
        console.log(`   - Deleting: ${db.name}`);
        indexedDB.deleteDatabase(db.name);
      }
    }

    console.log("\n✅ RESET COMPLETE - Reloading page...\n");

    // 5. Hard reload
    setTimeout(() => {
      // Add timestamp to bypass any remaining cache
      const url = new URL(window.location.href);
      url.searchParams.set('reset', Date.now().toString());
      window.location.href = url.toString();
    }, 500);
  },

  /**
   * SOFT RESET: Just clear browser caches
   */
  async RESET_CACHE() {
    console.log("🧹 Clearing browser caches...");

    if ('caches' in window) {
      const names = await caches.keys();
      await Promise.all(names.map(name => caches.delete(name)));
      console.log(`✅ Cleared ${names.length} caches`);
    }

    console.log("🔄 Reloading page...");
    location.reload();
  },

  /**
   * UNREGISTER SERVICE WORKERS ONLY
   */
  async RESET_SERVICE_WORKERS() {
    console.log("🛑 Unregistering service workers...");

    if ('serviceWorker' in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      console.log(`Found ${regs.length} registrations`);
      await Promise.all(regs.map(r => r.unregister()));
      console.log("✅ All service workers unregistered");
    }

    console.log("🔄 Reloading page...");
    location.reload();
  },

  /**
   * Print diagnostic info
   */
  async DIAGNOSE() {
    console.log("\n📋 ===== DIAGNOSIS =====\n");

    // Caches
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      console.log(`Caches (${cacheNames.length}):`);
      cacheNames.forEach(n => console.log(`  • ${n}`));
    }

    // Service Workers
    if ('serviceWorker' in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      console.log(`\nService Workers (${regs.length}):`);
      regs.forEach(r => console.log(`  • ${r.scope}`));
    }

    // Storage
    console.log(`\nLocalStorage (${localStorage.length} items):`);
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) console.log(`  • ${key}`);
    }

    console.log(`\nSessionStorage (${sessionStorage.length} items):`);
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key) console.log(`  • ${key}`);
    }

    console.log("\n✅ Diagnosis complete\n");
  },

  /**
   * Show help menu
   */
  HELP() {
    console.log(`
╔════════════════════════════════════════════════════════════════╗
║          BROWSER CACHE TROUBLESHOOTING - HARD RESET             ║
╚════════════════════════════════════════════════════════════════╝

If the app isn't showing data in normal browser mode, try these:

1️⃣  SOFT RESET (just caches):
   hardReset.RESET_CACHE()

2️⃣  SERVICE WORKER RESET:
   hardReset.RESET_SERVICE_WORKERS()

3️⃣  NUCLEAR RESET (everything):
   hardReset.RESET_ALL()

4️⃣  DIAGNOSE (see what's cached):
   hardReset.DIAGNOSE()

After reset, the page will reload automatically.
If still not working, try opening in Incognito Mode.

    `);
  }
};

// Make available in browser console
if (typeof window !== 'undefined') {
  (window as any).hardReset = hardReset;
  console.log("✅ Hard reset utilities available: hardReset.*");
  console.log("💡 Type: hardReset.HELP() for options");
}
