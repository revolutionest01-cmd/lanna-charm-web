import React, { useState, useEffect } from "react";
import { useLanguage } from "@/hooks/useLanguage";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getRankFromPoints } from "@/lib/pointSystem";
import { UserRankBadge } from "@/components/UserRankBadge";
import { Trophy, Medal, Zap, ThumbsUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

interface LeaderboardUser {
  id: string;
  name: string;
  avatar_url?: string;
  total_points: number;
  action_points: number;
  reputation_points: number;
  rank_position: number;
}

export const Leaderboard = () => {
  const { language } = useLanguage();
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<"total" | "action" | "reputation">("total");

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    try {
      setLoading(true);
      // TODO: Fetch from leaderboard view or calculated endpoint
      // For now, return empty - will be connected to backend
      setUsers([]);
    } catch (error) {
      console.error("[Leaderboard] Error loading:", error);
    } finally {
      setLoading(false);
    }
  };

  const getMedalIcon = (position: number) => {
    if (position === 1) return <Trophy className="w-6 h-6 text-yellow-500" />;
    if (position === 2) return <Medal className="w-6 h-6 text-gray-400" />;
    if (position === 3) return <Medal className="w-6 h-6 text-orange-600" />;
    return <span className="w-6 h-6 flex items-center justify-center font-bold text-gray-600">#{position}</span>;
  };

  const sortedUsers = React.useMemo(() => {
    const sorted = [...users];
    if (selectedTab === "action") {
      return sorted.sort((a, b) => b.action_points - a.action_points);
    } else if (selectedTab === "reputation") {
      return sorted.sort((a, b) => b.reputation_points - a.reputation_points);
    }
    return sorted.sort((a, b) => b.total_points - a.total_points);
  }, [users, selectedTab]);

  return (
    <Card className="border-border/50 shadow-xl">
      <CardHeader className="pb-3">
        <CardTitle className="text-2xl flex items-center gap-3">
          <Trophy className="w-6 h-6 text-yellow-500" />
          {language === "th" ? "ตารางผู้นำ" : "Leaderboard"}
        </CardTitle>
        <p className="text-sm text-muted-foreground mt-2">
          {language === "th" 
            ? "สมาชิกที่มีคะแนนสูงสุดและได้รับการยอมรับจากชุมชน"
            : "Top contributors recognized by the community"}
        </p>
      </CardHeader>
      <CardContent>
        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-border/50">
          <button
            onClick={() => setSelectedTab("total")}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              selectedTab === "total"
                ? "text-primary border-b-2 border-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {language === "th" ? "รวม" : "Total"}
          </button>
          <button
            onClick={() => setSelectedTab("action")}
            className={`px-4 py-2 text-sm font-medium flex items-center gap-1 transition-colors ${
              selectedTab === "action"
                ? "text-primary border-b-2 border-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Zap className="w-4 h-4" />
            {language === "th" ? "กิจกรรม" : "Activity"}
          </button>
          <button
            onClick={() => setSelectedTab("reputation")}
            className={`px-4 py-2 text-sm font-medium flex items-center gap-1 transition-colors ${
              selectedTab === "reputation"
                ? "text-primary border-b-2 border-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <ThumbsUp className="w-4 h-4" />
            {language === "th" ? "บารมี" : "Reputation"}
          </button>
        </div>

        {/* Loading */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">
              {language === "th" ? "ยังไม่มีข้อมูลตารางผู้นำ" : "No leaderboard data yet"}
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              {language === "th" 
                ? "กิจกรรมของสมาชิกจะปรากฏที่นี่เมื่อมีการมีส่วนร่วม"
                : "Top contributors will appear here"}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedUsers.slice(0, 100).map((user, index) => {
              const rank = getRankFromPoints(user.total_points);
              const points =
                selectedTab === "action"
                  ? user.action_points
                  : selectedTab === "reputation"
                    ? user.reputation_points
                    : user.total_points;

              return (
                <div
                  key={user.id}
                  className="flex items-center gap-4 p-4 rounded-lg border border-border/50 hover:bg-secondary/30 transition-colors"
                >
                  {/* Medal/Position */}
                  <div className="flex-shrink-0">{getMedalIcon(index + 1)}</div>

                  {/* Avatar & Name */}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <Avatar className="w-10 h-10">
                      <img src={user.avatar_url} alt={user.name} />
                      <AvatarFallback className="bg-primary/20 font-semibold">
                        {user.name?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <UserRankBadge userId={user.id} userName={user.name} size="sm" />
                    </div>
                  </div>

                  {/* Points */}
                  <div className="text-right">
                    <div className="font-bold text-lg text-primary">{points}</div>
                    <div className="text-xs text-muted-foreground">
                      {selectedTab === "total" && (
                        <>
                          <div className="flex items-center gap-1 justify-end">
                            <Zap className="w-3 h-3" /> {user.action_points}
                          </div>
                          <div className="flex items-center gap-1 justify-end">
                            <ThumbsUp className="w-3 h-3" /> {user.reputation_points}
                          </div>
                        </>
                      )}
                      {selectedTab !== "total" && (
                        <span>
                          {language === "th" ? "คะแนน" : "points"}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
