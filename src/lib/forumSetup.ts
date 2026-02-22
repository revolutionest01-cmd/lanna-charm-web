import { supabase } from "@/integrations/supabase/client";

/**
 * Setup Forum Database Tables
 * Checks if forum tables exist
 */
export const setupForumDatabase = async () => {
  try {
    console.log("[Forum Setup] Checking if forum tables exist...");

    const { data: topicsCheck } = await (supabase as any)
      .from("forum_topics")
      .select("id", { count: "exact", head: true });

    if (topicsCheck !== null) {
      console.log("[Forum Setup] Forum tables already exist!");
      return { success: true, message: "Tables already exist" };
    }

    throw new Error("Tables do not exist");
  } catch (error) {
    console.log("[Forum Setup] Tables don't exist, creating them...");

    return {
      success: false,
      needsSetup: true,
      message: "Forum tables need to be created. Please run migrations.",
    };
  }
};
