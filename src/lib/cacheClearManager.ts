/**
 * Cache Clear Manager
 * Provides multiple levels of cache clearing for troubleshooting
 */

export const cacheClearManager = {
  /**
   * Level 1: Soft Clear - Just localStorage and sessionStorage
   */
  async softClear(): Promise<void> {
    console.log('🧹 [CACHE] Soft clear: localStorage + sessionStorage');
    
    try {
      const language = localStorage.getItem('language-storage');
      localStorage.clear();
      sessionStorage.clear();
      if (language) {
        localStorage.setItem('language-storage', language);
        console.log('✅ [CACHE] Soft clear complete - language preserved');
      }
    } catch (error) {
      console.error('❌ [CACHE] Soft clear failed:', error);
      throw error;
    }
  },

  /**
   * Level 2: Medium Clear - Storage + Browser Caches + Reload
   */
  async mediumClear(): Promise<void> {
    console.log('🧹 [CACHE] Medium clear: storage + browser caches');
    
    try {
      // 1. Clear storage (preserve language)
      const language = localStorage.getItem('language-storage');
      localStorage.clear();
      sessionStorage.clear();
      if (language) {
        localStorage.setItem('language-storage', language);
      }
      
      // 2. Clear all caches
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        console.log(`  Deleting ${cacheNames.length} caches`);
        await Promise.all(cacheNames.map(name => {
          console.log(`  → ${name}`);
          return caches.delete(name);
        }));
      }
      
      // 3. Unregister service workers
      if ('serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        console.log(`  Unregistering ${regs.length} service workers`);
        await Promise.all(regs.map(reg => {
          console.log(`  → ${reg.scope}`);
          return reg.unregister();
        }));
      }
      
      console.log('✅ [CACHE] Medium clear complete');
    } catch (error) {
      console.error('❌ [CACHE] Medium clear failed:', error);
      throw error;
    }
  },

  /**
   * Level 3: Hard Clear - Everything + Reload Page
   */
  async hardClear(): Promise<void> {
    console.log('💣 [CACHE] Hard clear: EVERYTHING + reload');
    
    try {
      // Run medium clear first
      await this.mediumClear();
      
      // Then force hard reload
      console.log('🔄 [CACHE] Hard reloading page...');
      setTimeout(() => {
        const url = new URL(window.location.href);
        url.searchParams.set('clearcache', Date.now().toString());
        window.location.href = url.toString();
      }, 500);
    } catch (error) {
      console.error('❌ [CACHE] Hard clear failed:', error);
      throw error;
    }
  },

  /**
   * Nuclear Option: Complete reset + IndexedDB clear + Reload
   */
  async nuclearReset(): Promise<void> {
    console.log('☢️  [CACHE] NUCLEAR RESET: Complete system reset');
    
    try {
      // 1. Clear all storage
      const language = localStorage.getItem('language-storage');
      localStorage.clear();
      sessionStorage.clear();
      if (language) {
        localStorage.setItem('language-storage', language);
      }
      console.log('  ✓ Storage cleared');
      
      // 2. Clear all caches
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
        console.log(`  ✓ ${cacheNames.length} caches deleted`);
      }
      
      // 3. Unregister all service workers
      if ('serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map(reg => reg.unregister()));
        console.log(`  ✓ ${regs.length} service workers unregistered`);
      }
      
      // 4. Clear IndexedDB (used by React Query)
      if ('indexedDB' in window) {
        try {
          const dbs = await indexedDB.databases?.() || [];
          for (const db of dbs) {
            console.log(`  → Deleting IndexedDB: ${db.name}`);
            indexedDB.deleteDatabase(db.name);
          }
        } catch (e) {
          console.warn('  ⚠️  IndexedDB clear skipped:', e);
        }
      }
      
      console.log('\n✅ [CACHE] Nuclear reset complete - page reloading...\n');
      
      // 5. Hard reload
      setTimeout(() => {
        const url = new URL(window.location.href);
        url.searchParams.set('reset', Date.now().toString());
        // Bypass cache with pragma headers
        window.location.href = url.toString();
      }, 1000);
    } catch (error) {
      console.error('❌ [CACHE] Nuclear reset failed:', error);
      throw error;
    }
  },

  /**
   * Show status and instructions
   */
  status(): void {
    console.log(`
╔════════════════════════════════════════════╗
║     CACHE CLEAR MANAGER - STATUS           ║
╠════════════════════════════════════════════╣
║ Available Methods:                         ║
║ 1. cacheClearManager.softClear()           ║
║    → Clears localStorage/sessionStorage    ║
║    → Preserves language preference         ║
║                                            ║
║ 2. cacheClearManager.mediumClear()         ║
║    → Soft clear +                          ║
║    → Browser caches + Service Workers      ║
║                                            ║
║ 3. cacheClearManager.hardClear()           ║
║    → Medium clear +                        ║
║    → Hard reload page                      ║
║                                            ║
║ 4. cacheClearManager.nuclearReset()        ║
║    → Everything (including IndexedDB)      ║
║    → Full system restart                   ║
╚════════════════════════════════════════════╝

📌 RECOMMENDED: Start with hardClear() first
☢️  Only use nuclearReset() if hardClear() doesn't work
    `);
  },
};

// Make available in window/console
declare global {
  interface Window {
    cacheClearManager: typeof cacheClearManager;
  }
}

if (typeof window !== 'undefined') {
  window.cacheClearManager = cacheClearManager;
  console.log('✅ Cache Clear Manager available: cacheClearManager.*');
  console.log('   Run: cacheClearManager.status() for help');
}
