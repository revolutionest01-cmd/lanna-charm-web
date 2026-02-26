import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getRankFromPoints } from "@/lib/pointSystem";

export interface UserRankData {
  points: number;
  rank: ReturnType<typeof getRankFromPoints>;
}

/**
 * Hook to fetch user's reputation_points from profiles and calculate their rank
 */
export const useUserRank = (userId: string | undefined | null) => {
  return useQuery({
    queryKey: ["user-rank", userId],
    queryFn: async (): Promise<UserRankData> => {
      if (!userId) {
        return { points: 0, rank: getRankFromPoints(0) };
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("reputation_points")
        .eq("id", userId)
        .single();

      const points = error ? 0 : (data?.reputation_points ?? 0);
      return { points, rank: getRankFromPoints(points) };
    },
    enabled: !!userId,
    staleTime: 2 * 60 * 1000,
    retry: 1,
  });
};
