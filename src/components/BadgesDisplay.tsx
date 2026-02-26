import { Badge as BadgeIcon, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";
import { useLanguage } from "@/hooks/useLanguage";
import { BADGES, getEarnedBadges, getNextBadge, getBadgeProgress, type UserStats } from "@/lib/badgesSystem";

interface BadgesDisplayProps {
  userStats: UserStats;
  isOwn?: boolean;
}

export const BadgesDisplay = ({ userStats, isOwn = false }: BadgesDisplayProps) => {
  const { language } = useLanguage();
  const earnedBadges = getEarnedBadges(userStats);
  const nextBadge = getNextBadge(userStats);

  const rarityColors = {
    common: "border-gray-400 bg-gray-100 dark:bg-gray-900",
    rare: "border-blue-400 bg-blue-100 dark:bg-blue-900",
    epic: "border-purple-400 bg-purple-100 dark:bg-purple-900",
    legendary: "border-yellow-400 bg-yellow-100 dark:bg-yellow-900",
  };

  const rarityTextColors = {
    common: "text-gray-700 dark:text-gray-300",
    rare: "text-blue-700 dark:text-blue-300",
    epic: "text-purple-700 dark:text-purple-300",
    legendary: "text-yellow-700 dark:text-yellow-300",
  };

  return (
    <Card className="border-border/50 shadow-xl">
      {/* Earned Badges */}
      {earnedBadges.length > 0 && (
        <>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BadgeIcon className="w-5 h-5 text-primary" />
              {language === "th" ? "เข็มกลัดที่ได้รับ" : "Unlocked Badges"}
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {earnedBadges.length} / {Object.keys(BADGES).length}
            </p>
          </CardHeader>
          <CardContent className="pb-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {earnedBadges.map((badge) => (
                <TooltipProvider key={badge.id}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div
                        className={`p-4 rounded-lg border-2 cursor-help transition-all hover:scale-105 ${rarityColors[badge.rarity]}`}
                      >
                        <div className="text-4xl text-center mb-2">{badge.icon}</div>
                        <p className={`font-semibold text-xs text-center ${rarityTextColors[badge.rarity]}`}>
                          {language === "th" ? badge.name : badge.nameEn}
                        </p>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs">
                      <div className="space-y-1">
                        <p className="font-semibold">
                          {language === "th" ? badge.name : badge.nameEn}
                        </p>
                        <p className="text-xs">
                          {language === "th" ? badge.description : badge.descriptionEn}
                        </p>
                        <div className="text-xs opacity-75 pt-1">
                          {badge.rarity.toUpperCase()}
                        </div>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ))}
            </div>
          </CardContent>
        </>
      )}

      {/* Next Badge Progress */}
      {nextBadge && isOwn && (
        <CardContent className={earnedBadges.length > 0 ? "border-t border-border/50 pt-6" : ""}>
          <div className="pt-6">
            <h3 className="font-semibold flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-primary" />
              {language === "th" ? "เข็มกลัดถัดไป" : "Next Badge"}
            </h3>

            <div className="p-4 rounded-lg border border-primary/20 bg-primary/5 space-y-3">
              <div className="flex items-start gap-3">
                <div className="text-3xl">{nextBadge.icon}</div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">
                    {language === "th" ? nextBadge.name : nextBadge.nameEn}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {language === "th" ? nextBadge.description : nextBadge.descriptionEn}
                  </p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground">
                    {language === "th" ? "ความคืบหน้า" : "Progress"}
                  </span>
                  <span className="font-medium">
                    {Math.round(getBadgeProgress(nextBadge, userStats))}%
                  </span>
                </div>
                <Progress value={getBadgeProgress(nextBadge, userStats)} className="h-2" />
              </div>

              {/* Rarity */}
              <div className="text-xs">
                <Badge className={`${rarityColors[nextBadge.rarity]} ${rarityTextColors[nextBadge.rarity]}`}>
                  {nextBadge.rarity.toUpperCase()}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      )}

      {/* Empty State */}
      {earnedBadges.length === 0 && (
        <CardContent className="pt-12 pb-12 text-center">
          <BadgeIcon className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground">
            {language === "th" ? "ยังไม่มีเข็มกลัด" : "No badges yet"}
          </p>
          <p className="text-sm text-muted-foreground/70 mt-2">
            {language === "th" 
              ? "ทำงานหนักเพื่อปลดล็อกเข็มกลัดพิเศษ"
              : "Unlock special badges by contributing"}
          </p>
        </CardContent>
      )}
    </Card>
  );
};
