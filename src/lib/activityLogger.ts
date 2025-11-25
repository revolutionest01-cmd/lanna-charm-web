import { supabase } from "@/integrations/supabase/client";

export type ActivityAction =
  | "hero_update"
  | "event_space_create"
  | "event_space_update"
  | "event_space_delete"
  | "room_create"
  | "room_update"
  | "room_delete"
  | "menu_create"
  | "menu_update"
  | "menu_delete"
  | "gallery_upload"
  | "gallery_delete"
  | "review_create"
  | "review_update"
  | "review_delete"
  | "review_toggle_active";

export interface ActivityLog {
  id?: string;
  user_id: string;
  user_email: string;
  action: ActivityAction;
  entity_type: string;
  entity_id?: string;
  details?: Record<string, any>;
  created_at?: string;
}

/**
 * Log admin activity to database
 * Tracks all CRUD operations for audit trail
 */
export const logActivity = async (
  action: ActivityAction,
  entityType: string,
  entityId?: string,
  details?: Record<string, any>
): Promise<void> => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      console.warn("Activity logging skipped: No user session");
      return;
    }

    const logEntry: ActivityLog = {
      user_id: user.id,
      user_email: user.email || "unknown",
      action,
      entity_type: entityType,
      entity_id: entityId,
      details: details || {},
    };

    // Log to console for debugging
    console.log("[Activity Log]", logEntry);

    // Save to database
    const { error } = await supabase.from("activity_logs").insert(logEntry);
    if (error) {
      console.error("Failed to log activity:", error);
    }
  } catch (error) {
    console.error("Activity logging error:", error);
  }
};

/**
 * Fetch activity logs with pagination and filtering
 */
export const getActivityLogs = async (
  limit = 50,
  offset = 0,
  filterUserId?: string
): Promise<ActivityLog[]> => {
  try {
    let query = supabase
      .from("activity_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (filterUserId) {
      query = query.eq("user_id", filterUserId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data || []) as ActivityLog[];
  } catch (error) {
    console.error("Failed to fetch activity logs:", error);
    return [];
  }
};
