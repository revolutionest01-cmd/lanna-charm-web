import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { RANK_TIERS, RANK_PERKS, getProgressToNextRank, getUnlockedPerks } from "@/lib/pointSystem";
import { ArrowUp, Lock, Unlock, Sparkles, Zap } from "lucide-react";

interface RankingSystemProps {
  points: number;
  language: string;
}

const RankingSystem = ({ points, language }: RankingSystemProps) => {
  const currentRank = useMemo(() => {
    return RANK_TIERS.find((tier) => points >= tier.minPoints && points <= tier.maxPoints) || RANK_TIERS[0];
  }, [points]);

  const nextRank = useMemo(() => {
    return RANK_TIERS.find((tier) => tier.id === currentRank.id + 1);
  }, [currentRank]);

  const progress = useMemo(() => {
    return getProgressToNextRank(points);
  }, [points]);

  const unlockedPerks = useMemo(() => {
    return getUnlockedPerks(currentRank.id);
  }, [currentRank.id]);

  return (
    <div className="space-y-6">
      {/* Main Rank Card */}
      <Card className="border-0 shadow-lg overflow-hidden bg-white dark:bg-slate-900">
        {/* Blue Header */}
        <div className="h-20 bg-gradient-to-r from-blue-500 via-blue-400 to-cyan-400 relative overflow-hidden flex items-center justify-center">
          {currentRank.id === 6 && <Sparkles className="h-8 w-8 text-white/60 absolute top-2 right-4 animate-pulse" />}
        </div>

        <CardHeader className="relative z-10 pb-4 -mt-12 bg-white dark:bg-slate-900">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="text-6xl animate-bounce" style={{ animationDelay: "0.1s" }}>
                {currentRank.icon}
              </div>
              <div>
                <CardTitle className="text-3xl font-serif text-slate-800 dark:text-white">
                  {currentRank.name}
                </CardTitle>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{currentRank.nameEn}</p>
                <p className="text-sm text-slate-600 dark:text-slate-300 mt-2">
                  {language === "th" ? currentRank.description : currentRank.descriptionEn}
                </p>
              </div>
            </div>
            {currentRank.id === 6 && <Sparkles className="h-8 w-8 text-yellow-500 animate-pulse" />}
          </div>
        </CardHeader>

        <CardContent className="relative z-10 space-y-4 bg-white dark:bg-slate-900">
          <div className="flex items-baseline justify-between">
            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
              {language === "th" ? "คะแนนรวม" : "Total Points"}
            </span>
            <span className="text-3xl font-bold text-slate-800 dark:text-white">{points}</span>
          </div>

          {/* Progress Bar */}
          {nextRank && (
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  {language === "th" ? "ไปยังยศถัดไป" : "Progress to Next Rank"}
                </span>
                <span className="text-xs text-slate-600 dark:text-slate-400">
                  {progress.percentage}%
                </span>
              </div>
              <Progress value={progress.percentage} className="h-3" />
              <p className="text-xs text-slate-600 dark:text-slate-400">
                {nextRank.minPoints - points} {language === "th" ? "คะแนนไปยัง" : "points to"}{" "}
                <span className="font-semibold text-slate-700 dark:text-slate-300">{nextRank.icon} {nextRank.name}</span>
              </p>
            </div>
          )}

          {/* Point Range */}
          <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 border-t border-slate-200 dark:border-slate-700 pt-3">
            <span>
              {language === "th" ? "พิสัยคะแนน" : "Point Range"}
            </span>
            <span>
              {currentRank.minPoints} - {currentRank.maxPoints === Infinity ? "∞" : currentRank.maxPoints}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Rank Progression Timeline */}
      <Card className="border-0 shadow-lg overflow-hidden bg-white dark:bg-slate-900">
        <div className="h-12 bg-gradient-to-r from-blue-500 via-blue-400 to-cyan-400"></div>
        <CardHeader className="pb-3 -mt-8 relative z-10 bg-white dark:bg-slate-900">
          <CardTitle className="text-lg flex items-center gap-2 text-slate-800 dark:text-white">
            <ArrowUp className="h-5 w-5 text-blue-600" />
            {language === "th" ? "รายการสำหรับยศ" : "Rank Progression"}
          </CardTitle>
        </CardHeader>
        <CardContent className="bg-white dark:bg-slate-900">
          <div className="space-y-3">
            {RANK_TIERS.map((rank, index) => {
              const isCurrentOrPassed = rank.id <= currentRank.id;
              return (
                <div
                  key={rank.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border transition-all duration-300 ${
                    isCurrentOrPassed
                      ? "bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800"
                      : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 opacity-50"
                  }`}
                >
                  <div className="text-2xl">{rank.icon}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-800 dark:text-white">{rank.name}</span>
                      {isCurrentOrPassed && (
                        <Unlock className="h-4 w-4 text-green-600 dark:text-green-400" />
                      )}
                      {!isCurrentOrPassed && <Lock className="h-4 w-4 text-slate-400" />}
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      {rank.minPoints} - {rank.maxPoints === Infinity ? "∞" : rank.maxPoints}{" "}
                      {language === "th" ? "คะแนน" : "points"}
                    </p>
                  </div>
                  {rank.id === currentRank.id && (
                    <Badge className="bg-blue-600 text-white animate-pulse">
                      {language === "th" ? "ปัจจุบัน" : "Current"}
                    </Badge>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Unlocked Perks */}
      <Card className="border-0 shadow-lg overflow-hidden bg-white dark:bg-slate-900">
        <div className="h-12 bg-gradient-to-r from-blue-500 via-blue-400 to-cyan-400"></div>
        <CardHeader className="pb-3 -mt-8 relative z-10 bg-white dark:bg-slate-900">
          <CardTitle className="text-lg flex items-center gap-2 text-slate-800 dark:text-white">
            <Sparkles className="h-5 w-5 text-blue-600" />
            {language === "th" ? "สิทธิพิเศษที่ปลดล็อก" : "Unlocked Perks"}
          </CardTitle>
        </CardHeader>
        <CardContent className="bg-white dark:bg-slate-900">
          {unlockedPerks.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {unlockedPerks.map((permissionKey) => {
                const perk = RANK_PERKS[permissionKey as keyof typeof RANK_PERKS];
                if (!perk) return null;

                return (
                  <TooltipProvider key={permissionKey}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-950/40 transition-colors cursor-help">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{perk.icon}</span>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-slate-800 dark:text-white">{perk.name}</p>
                              <p className="text-xs text-slate-600 dark:text-slate-400">{perk.nameEn}</p>
                            </div>
                          </div>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-sm max-w-xs">
                          {language === "th" ? perk.description : perk.descriptionEn}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-slate-600 dark:text-slate-400 text-center py-6">
              {language === "th"
                ? "ยังไม่มีสิทธิพิเศษที่ปลดล็อก เก็บคะแนนต่อไป!"
                : "No perks unlocked yet. Keep earning points!"}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Coming Soon Perks */}
      {nextRank && (
        <Card className="border-0 shadow-lg overflow-hidden bg-white dark:bg-slate-900 opacity-75">
          <div className="h-12 bg-gradient-to-r from-amber-400 via-yellow-400 to-orange-400"></div>
          <CardHeader className="pb-3 -mt-8 relative z-10 bg-white dark:bg-slate-900">
            <CardTitle className="text-lg flex items-center gap-2 text-slate-800 dark:text-white">
              <Zap className="h-5 w-5 text-amber-600" />
              {language === "th" ? "สิทธิพิเศษถัดไป" : "Next Rank Perks"}
            </CardTitle>
          </CardHeader>
          <CardContent className="bg-white dark:bg-slate-900">
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-4">
              {language === "th"
                ? `ปลดล็อกเมื่อถึงยศ ${nextRank.name}`
                : `Unlock when reaching ${nextRank.name}`}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {nextRank.unlock?.split(",").map((permissionKey) => {
                const perk = RANK_PERKS[permissionKey as keyof typeof RANK_PERKS];
                if (!perk) return null;

                return (
                  <div
                    key={permissionKey}
                    className="p-3 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 opacity-60"
                  >
                    <div className="flex items-center gap-2">
                      <Lock className="h-4 w-4 text-slate-500" />
                      <span className="text-xl">{perk.icon}</span>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{perk.name}</p>
                        <p className="text-xs text-slate-600 dark:text-slate-400">{perk.nameEn}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default RankingSystem;
