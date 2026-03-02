import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getRankById, getRankFromPoints, normalizeRankPath, RANK_PATH_UNLOCK_POINTS, type RankPath } from "@/lib/pointSystem";

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
        .select("reputation_points, rank_path, rank_display_tier_id, rank_path_changed_at, rank_path_start_points")
        .eq("id", userId)
        .single();

      if (error?.code === "42703") {
        const { data: legacyData, error: legacyError } = await supabase
          .from("profiles")
          .select("reputation_points, rank_path, rank_display_tier_id, rank_path_changed_at")
          .eq("id", userId)
          .single();

        const legacyProfile = legacyData as any;
        const legacyPoints = legacyError ? 0 : (legacyProfile?.reputation_points ?? 0);
        const legacySavedPath = normalizeRankPath(legacyProfile?.rank_path);
        const legacyChangedAt = legacyProfile?.rank_path_changed_at || null;
        const isPathInitialized = !!legacyChangedAt;
        const rankPath = !isPathInitialized && legacyPoints < RANK_PATH_UNLOCK_POINTS ? "chicken" : legacySavedPath;
        const highestRank = getRankFromPoints(legacyPoints, rankPath);
        const rawDisplayTier = Number(legacyProfile?.rank_display_tier_id);
        const displayTierId = Number.isFinite(rawDisplayTier) && rawDisplayTier >= 1
          ? Math.min(Math.floor(rawDisplayTier), highestRank.id)
          : highestRank.id;
        return { points: legacyPoints, rankPath, rank: getRankById(displayTierId, rankPath) };
      }

      const profileData = data as any;
      const rawPoints = error ? 0 : (profileData?.reputation_points ?? 0);
      const points = rawPoints;
      const savedPath = normalizeRankPath(error ? null : profileData?.rank_path);
      const changedAt = profileData?.rank_path_changed_at || null;
      const isPathInitialized = !!changedAt;
      const rankPath = !isPathInitialized && points < RANK_PATH_UNLOCK_POINTS ? "chicken" : savedPath;
      const highestRank = getRankFromPoints(points, rankPath);
      const rawDisplayTier = Number(profileData?.rank_display_tier_id);
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
