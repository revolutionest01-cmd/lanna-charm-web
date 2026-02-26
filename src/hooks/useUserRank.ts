import { useQuery } from "@tanstack/react-query";
import { getRankFromPoints } from "@/lib/pointSystem";

export interface UserRankData {
  points: number;
  rank: ReturnType<typeof getRankFromPoints>;
}

/**
 * Hook to fetch user's points and calculate their rank
 * Note: Currently returns beginner rank (0 points) as user_points table is being set up
 */
export const useUserRank = (userId: string | undefined | null) => {
  return useQuery({
    queryKey: ["user-rank", userId],
    queryFn: async (): Promise<UserRankData> => {
      if (!userId) {
        return {
          points: 0,
          rank: getRankFromPoints(0),
        };
      }

      try {
        // Temporary: all users start at rank 0 (beginner)
        // TODO: Implement actual point calculation from user activity
        const points = 0;
        return {
          points,
          rank: getRankFromPoints(points),
        };
      } catch (error) {
        console.warn("[useUserRank] Error:", error);
        return {
          points: 0,
          rank: getRankFromPoints(0),
        };
      }
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });
};


