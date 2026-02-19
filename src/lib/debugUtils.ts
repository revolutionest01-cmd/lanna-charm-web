import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/lib/toast";

/**
 * Debug utilities to diagnose data loading issues
 */

export const debugUtils = {
  /**
   * Check Supabase connection and table data
   */
  async checkSupabaseConnection() {
    console.log("🔍 [DEBUG] Checking Supabase connection...");
    
    try {
      // Test connection by fetching hero content
      const { data, error } = await supabase
        .from("hero_content")
        .select("*")
        .limit(1);

      if (error) {
        console.error("❌ Supabase Error:", error);
        toast.error(`Supabase Error: ${error.message}`);
        return false;
      }

      console.log("✅ Supabase connection OK");
      console.log("📊 Hero content rows:", data?.length || 0);
      
      if ((data?.length || 0) === 0) {
        console.warn("⚠️  No hero_content data found - database may be empty");
        console.log("💡 Tip: Run 'npm run seed' to populate database");
      }

      return true;
    } catch (error) {
      console.error("❌ Connection check failed:", error);
      toast.error("Failed to connect to Supabase");
      return false;
    }
  },

  /**
   * Clear all service worker caches
   */
  async clearAllCaches() {
    if (!('caches' in window)) {
      console.warn("Cache API not available");
      return;
    }

    const cacheNames = await caches.keys();
    console.log(`🗑️  Clearing ${cacheNames.length} caches:`, cacheNames);

    await Promise.all(
      cacheNames.map(name => {
        console.log(`   - Deleting: ${name}`);
        return caches.delete(name);
      })
    );

    console.log("✅ All caches cleared");
    toast.success("Caches cleared - refresh page to reload");
  },

  /**
   * Unregister all service workers
   */
  async unregisterServiceWorkers() {
    if (!('serviceWorker' in navigator)) {
      console.warn("ServiceWorker not available");
      return;
    }

    const registrations = await navigator.serviceWorker.getRegistrations();
    console.log(`🛑 Unregistering ${registrations.length} service workers`);

    await Promise.all(
      registrations.map(reg => {
        console.log(`   - Unregistering: ${reg.scope}`);
        return reg.unregister();
      })
    );

    console.log("✅ All service workers unregistered");
    toast.success("Service workers cleared - refresh page");
  },

  /**
   * Full diagnostic check
   */
  async runFullDiagnostic() {
    console.log("\n🔧 ===== FULL DIAGNOSTIC =====\n");
    
    // 1. Browser info
    console.log("📱 Browser:");
    console.log(`   - User Agent: ${navigator.userAgent}`);
    console.log(`   - Online: ${navigator.onLine}`);
    
    // 2. Cache API
    console.log("\n💾 Cache API:");
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      console.log(`   - Available: Yes (${cacheNames.length} caches)`);
      cacheNames.forEach(name => console.log(`     * ${name}`));
    } else {
      console.log("   - Available: No");
    }
    
    // 3. Service Workers
    console.log("\n🛠️  Service Workers:");
    if ('serviceWorker' in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      console.log(`   - Available: Yes (${regs.length} registrations)`);
      regs.forEach(reg => console.log(`     * ${reg.scope}`));
    } else {
      console.log("   - Available: No");
    }
    
    // 4. Supabase
    console.log("\n🗄️  Supabase:");
    const connected = await this.checkSupabaseConnection();
    console.log(`   - Connected: ${connected ? "Yes" : "No"}`);
    
    // 5. Data status
    console.log("\n📊 Data Tables:");
    const tables = [
      "hero_content",
      "menu_categories",
      "menus",
      "rooms",
      "event_spaces",
      "business_info"
    ];
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table as any)
          .select("id", { count: "exact", head: true })
          .limit(0);
        
        if (error) {
          console.log(`   - ${table}: ❌ Error`);
        } else {
          const count = data?.length || 0;
          console.log(`   - ${table}: ${count} rows`);
        }
      } catch (e) {
        console.log(`   - ${table}: ❌ Failed`);
      }
    }
    
    console.log("\n✅ Diagnostic complete\n");
  },

  /**
   * Get helpful suggestions based on state
   */
  async suggest() {
    console.log("\n💡 ===== SUGGESTIONS =====\n");
    
    const connected = await this.checkSupabaseConnection();
    
    if (!connected) {
      console.log("Issues found:");
      console.log("1. ❌ Cannot connect to Supabase");
      console.log("   - Check .env file has VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY");
      console.log("   - Check internet connection");
      console.log("   - Check Supabase status at https://status.supabase.com");
      return;
    }
    
    // Check if database is empty
    const { data: heroData } = await supabase
      .from("hero_content")
      .select("*")
      .limit(1);
    
    if (!heroData || heroData.length === 0) {
      console.log("Issues found:");
      console.log("1. ⚠️  Database appears to be empty");
      console.log("   - Run: npm run seed");
      console.log("   - This will populate sample data");
      return;
    }
    
    console.log("✅ Everything looks good!");
    console.log("If still not seeing data:");
    console.log("1. Clear caches: debugUtils.clearAllCaches()");
    console.log("2. Unregister SW: debugUtils.unregisterServiceWorkers()");
    console.log("3. Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)");
  }
};

// Make available in browser console
if (typeof window !== 'undefined') {
  (window as any).debugUtils = debugUtils;
  console.log("✅ Debug utilities available: debugUtils.*");
}
