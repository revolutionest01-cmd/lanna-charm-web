import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getRankById, getRankFromPoints, normalizeRankPath, type RankPath } from "@/lib/pointSystem";

export interface UserRankData {
  points: number;
  rankPath: RankPath;
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
        return { points: 0, rankPath: "chicken", rank: getRankFromPoints(0) };
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("reputation_points, rank_path, rank_display_tier_id")
        .eq("id", userId)
        .single();

      if (error?.code === "42703") {
        const { data: legacyData, error: legacyError } = await supabase
          .from("profiles")
          .select("reputation_points")
          .eq("id", userId)
          .single();

        const legacyPoints = legacyError ? 0 : (legacyData?.reputation_points ?? 0);
        return { points: legacyPoints, rankPath: "chicken", rank: getRankFromPoints(legacyPoints, "chicken") };
      }

      const points = error ? 0 : (data?.reputation_points ?? 0);
      const rankPath = normalizeRankPath(error ? null : (data as any)?.rank_path);
      const highestRank = getRankFromPoints(points, rankPath);
      const rawDisplayTier = Number((data as any)?.rank_display_tier_id);
      const displayTierId = Number.isFinite(rawDisplayTier) && rawDisplayTier >= 1
        ? Math.min(Math.floor(rawDisplayTier), highestRank.id)
        : highestRank.id;
      return { points, rankPath, rank: getRankById(displayTierId, rankPath) };
    },
    enabled: !!userId,
    staleTime: 2 * 60 * 1000,
    retry: 1,
  });
};
