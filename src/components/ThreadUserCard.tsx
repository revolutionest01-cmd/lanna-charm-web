import { useState } from "react";
import { useUserRank } from "@/hooks/useUserRank";
import { getProgressToNextRank, RANK_TIERS } from "@/lib/pointSystem";
import { getEarnedBadges, type UserStats } from "@/lib/badgesSystem";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";
import { useLanguage } from "@/hooks/useLanguage";
import { Heart, MessageCircle, Eye, Zap } from "lucide-react";

interface ThreadUserCardProps {
  userId?: string | null;
  userName: string;
  userAvatar?: string | null;
  showBadges?: boolean;
  compact?: boolean;
}

/**
 * Enhanced user card displayed in thread/post view
 * Shows rank, reputation, progress to next rank, and badges
 */
export const ThreadUserCard = ({
  userId,
  userName,
  userAvatar,
  showBadges = true,
  compact = false,
}: ThreadUserCardProps) => {
  const { language } = useLanguage();
  const { data: rankData } = useUserRank(userId);

  if (!rankData) {
    return null;
  }

  const { rank } = rankData;
  const progress = getProgressToNextRank(rankData.points);
  const nextRank = rank.id < RANK_TIERS.length ? RANK_TIERS[rank.id] : null;

  if (compact) {
    // Compact version for post headers
    return (
      <div className="flex items-center gap-2">
        <Avatar className="w-8 h-8">
          {userAvatar && <img src={userAvatar} alt={userName} />}
          <AvatarFallback className="bg-gradient-to-br from-blue-400 to-purple-400 text-white text-xs">
            {userName.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate text-foreground">{userName}</p>
          <div className="flex items-center gap-1">
            <Badge className={`${rank.bgColor} ${rank.nameColor} border ${rank.borderColor} px-2 py-0 text-xs`}>
              {rank.icon}
            </Badge>
            {rank.hasLegendAura && <span className="text-xs text-amber-500">✨</span>}
          </div>
        </div>
      </div>
    );
  }

  // Full version for profile view
  return (
    <Card className={`overflow-hidden border-2 ${rank.borderColor} bg-gradient-to-br ${rank.bgColor}`}>
      <CardContent className="p-4">
        {/* Header with Avatar and Quick Info */}
        <div className="flex gap-4 mb-4">
          <Avatar className="w-12 h-12 flex-shrink-0 border-2 border-white/20">
            {userAvatar && <img src={userAvatar} alt={userName} />}
            <AvatarFallback className={`${rank.color} text-white font-bold`}>
              {userName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <p className="font-bold text-foreground truncate">{userName}</p>
              {rank.hasLegendAura && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="text-lg">✨</span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{language === "th" ? "ตำนานของชุมชน" : "Legendary Member"}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <Badge className={`${rank.bgColor} ${rank.nameColor} border-2 ${rank.borderColor}`}>
                <span className="mr-1">{rank.icon}</span>
                {language === "th" ? rank.name : rank.nameEn}
              </Badge>
            </div>

            <p className="text-xs text-muted-foreground mt-1">
              {language === "th" ? rank.description : rank.descriptionEn}
            </p>
          </div>
        </div>

        {/* Reputation Score */}
        <div className="mb-4 p-3 rounded-lg bg-white/10 dark:bg-black/10 border border-white/20 dark:border-white/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-foreground flex items-center gap-2">
              <Zap className="w-4 h-4" />
              {language === "th" ? "คะแนนรวม" : "Total Points"}
            </span>
            <span className="font-bold text-sm text-foreground">{rankData.points}</span>
          </div>
          <div className="text-xs text-muted-foreground mb-2">
            {language === "th" 
              ? `จากการกระทำและบารมี`
              : "From activity and reputation"}
          </div>

          {/* Progress to Next Rank */}
          {nextRank && (
            <div className="space-y-2 mt-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground">
                  {language === "th" ? "ก้าวสู่" : "Towards"} {language === "th" ? nextRank.name : nextRank.nameEn}
                </span>
                <span className="font-medium text-foreground">{progress.percentage}%</span>
              </div>
              <Progress value={progress.percentage} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {progress.next - rankData.points} {language === "th" ? "คะแนนที่เหลือ" : "points to go"}
              </p>
            </div>
          )}
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="p-2 rounded bg-white/10 dark:bg-black/10 text-center">
            <div className="text-xs text-muted-foreground">{language === "th" ? "โพสต์" : "Posts"}</div>
            <div className="font-bold text-sm text-foreground">0</div>
          </div>
          <div className="p-2 rounded bg-white/10 dark:bg-black/10 text-center">
            <div className="text-xs text-muted-foreground">{language === "th" ? "ไลค์" : "Likes"}</div>
            <div className="font-bold text-sm text-foreground">0</div>
          </div>
          <div className="p-2 rounded bg-white/10 dark:bg-black/10 text-center">
            <div className="text-xs text-muted-foreground">{language === "th" ? "จากคนอื่น" : "From Others"}</div>
            <div className="font-bold text-sm text-foreground">0</div>
          </div>
        </div>

        {/* Perks Preview */}
        {rank.benefits && (
          <div className="p-3 rounded-lg bg-white/5 dark:bg-black/20 border border-white/10 dark:border-white/5">
            <p className="text-xs font-semibold text-foreground mb-1">
              {language === "th" ? "สิทธิพิเศษ" : "Perks"}
            </p>
            <p className="text-xs text-muted-foreground">
              {language === "th" ? rank.benefits : rank.benefitsEn}
            </p>
          </div>
        )}

        {/* Next Rank Benefit */}
        {rank.nextRankBenefit && rank.id < RANK_TIERS.length && (
          <div className="mt-4 p-3 rounded-lg bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20">
            <p className="text-xs font-semibold text-primary mb-1">
              {language === "th" ? "พัฒนาต่อไป" : "Level Up Next"}
            </p>
            <p className="text-xs text-foreground">
              {language === "th" ? rank.nextRankBenefit : rank.nextRankBenefitEn}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
