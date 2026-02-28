import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useUserStatusMessage = (
  userId: string | undefined | null,
  initialStatusMessage?: string | null
) => {
  return useQuery({
    queryKey: ["user-status-message", userId],
    queryFn: async (): Promise<string | null> => {
      if (!userId) return initialStatusMessage?.trim() || null;

      const { data, error } = await supabase
        .from("profiles")
        .select("status_message")
        .eq("id", userId)
        .maybeSingle();

      const errorCode = String(error?.code || "");
      const errorMessage = String(error?.message || "").toLowerCase();
      if (errorCode === "42703" || errorCode === "PGRST204" || errorMessage.includes("status_message")) {
        return initialStatusMessage?.trim() || null;
      }

      if (error) {
        return initialStatusMessage?.trim() || null;
      }

      return ((data as any)?.status_message || initialStatusMessage || "").trim() || null;
    },
    enabled: !!userId || !!initialStatusMessage,
    staleTime: 2 * 60 * 1000,
    retry: 1,
  });
};
