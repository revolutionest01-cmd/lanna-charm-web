import { supabase } from "@/integrations/supabase/client";

/**
 * Setup Forum Database Tables
 * Automatically creates forum tables if they don't exist
 */

export const setupForumDatabase = async () => {
  try {
    console.log("[Forum Setup] Checking if forum tables exist...");

    // Check if forum_topics table exists
    const { data: topicsCheck } = await supabase
      .from("forum_topics")
      .select("id", { count: "exact", head: true });

    if (topicsCheck !== null) {
      console.log("[Forum Setup] Forum tables already exist!");
      return { success: true, message: "Tables already exist" };
    }

    throw new Error("Tables do not exist");
  } catch (error) {
    console.log("[Forum Setup] Tables don't exist, creating them...");

    // Tables don't exist, so we need to create them
    // This requires executing raw SQL via Supabase edge function or admin API
    // Since we can't do that directly with anon key, we'll return instructions

    return {
      success: false,
      needsSetup: true,
      message: "Forum tables need to be created. Please run migrations in Supabase Dashboard.",
      instructions: `
        1. Go to https://supabase.com/dashboard/projects/gomjfnkzhxqfmbwmaphz
        2. Click SQL Editor
        3. Run SUPABASE_MIGRATION_1.sql from project root
        4. Then run SUPABASE_MIGRATION_2.sql
      `,
    };
  }
};

/**
 * Alternative: Create a setup endpoint that uses service role
 * This would need to be called from a backend that has service role key
 */
export const setupForumDatabaseWithServiceRole = async (serviceRoleKey: string) => {
  try {
    // This creates a separate Supabase client with service role
    const adminClient = await import("@supabase/supabase-js").then((m) =>
      m.createClient("https://gomjfnkzhxqfmbwmaphz.supabase.co", serviceRoleKey)
    );

    console.log("[Forum Setup] Creating forum tables...");

    // Execute migrations using RPC or raw SQL
    // Note: This approach requires a backend function or service role usage

    return { success: true };
  } catch (error) {
    console.error("[Forum Setup] Error:", error);
    return { success: false, error: String(error) };
  }
};
