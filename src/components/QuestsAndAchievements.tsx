import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DAILY_QUESTS, ACHIEVEMENTS, getTimeUntilQuestReset } from "@/lib/engagementSystem";
import { CheckCircle2, Clock, Lock, Star, Target, Trophy, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { t4 } from "@/lib/i18n";

interface QuestsSystemProps {
  language: string;
  userProgress?: Record<string, number>;
  completedQuests?: string[];
  unlockedAchievements?: string[];
}

const QuestsAndAchievements = ({
  language,
  userProgress = {},
  completedQuests = [],
  unlockedAchievements = [],
}: QuestsSystemProps) => {
  const timeUntilReset = useMemo(() => {
    const ms = getTimeUntilQuestReset();
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    return { hours, minutes };
  }, []);

  const completedDailyCount = useMemo(() => {
    return completedQuests.filter((id) => DAILY_QUESTS.some((q) => q.id === id)).length;
  }, [completedQuests]);

  const totalAchievementCount = useMemo(() => {
    return ACHIEVEMENTS.filter((a) => unlockedAchievements.includes(a.id)).length;
  }, [unlockedAchievements]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-3">
        <Card className="border-border/50 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">{t4(language, "ภารกิจวันนี้", "Today's Quests", "今日任务", "今日のクエスト")}</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{completedDailyCount}/{DAILY_QUESTS.length}</p>
              </div>
              <Target className="h-8 w-8 text-blue-500/40" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/20 dark:to-purple-900/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">{t4(language, "เกียรติยศ", "Achievements", "成就", "実績")}</p>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{totalAchievementCount}/{ACHIEVEMENTS.length}</p>
              </div>
              <Trophy className="h-8 w-8 text-purple-500/40" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/20 dark:to-amber-900/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">{t4(language, "รีเซ็ตใน", "Reset In", "重置于", "リセットまで")}</p>
                <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{timeUntilReset.hours}:{String(timeUntilReset.minutes).padStart(2, "0")}</p>
              </div>
              <Clock className="h-8 w-8 text-amber-500/40" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="daily-quests" className="w-full">
        <TabsList className="w-full grid grid-cols-2">
          <TabsTrigger value="daily-quests" className="gap-1.5">
            <Zap className="h-4 w-4" />
            {t4(language, "ภารกิจรายวัน", "Daily Quests", "每日任务", "デイリークエスト")}
          </TabsTrigger>
          <TabsTrigger value="achievements" className="gap-1.5">
            <Trophy className="h-4 w-4" />
            {t4(language, "เกียรติยศ", "Achievements", "成就", "実績")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="daily-quests" className="mt-0">
          <Card className="border-border/50 shadow-xl">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Zap className="h-5 w-5 text-amber-500" />
                {t4(language, "ภารกิจรายวัน", "Daily Quests", "每日任务", "デイリークエスト")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {DAILY_QUESTS.map((quest) => {
                const isCompleted = completedQuests.includes(quest.id);
                const progress = userProgress[quest.id] || 0;
                const progressPercent = Math.min(100, Math.round((progress / quest.requirement) * 100));

                return (
                  <div key={quest.id} className={`p-3 rounded-lg border-2 transition-all duration-300 ${isCompleted ? "border-green-400 bg-green-50/50 dark:bg-green-950/20" : "border-border/50 bg-muted/30"}`}>
                    <div className="flex items-start gap-3">
                      <div className="text-2xl mt-1">{quest.icon}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-sm">{language === "th" ? quest.name : quest.nameEn}</p>
                          {isCompleted && <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" />}
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">{language === "th" ? quest.description : quest.descriptionEn}</p>
                        <div className="space-y-1">
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-muted-foreground">{progress}/{quest.requirement}</span>
                            <Badge className="bg-amber-600 text-white text-xs px-2 py-0">+{quest.reward} {t4(language, "คะแนน", "pts", "分", "pt")}</Badge>
                          </div>
                          <Progress value={progressPercent} className="h-2" />
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        {isCompleted ? (
                          <Button size="sm" disabled className="opacity-75">✓ {t4(language, "สำเร็จ", "Done", "完成", "完了")}</Button>
                        ) : (
                          <Button size="sm" variant="outline" disabled={progress < quest.requirement} className="disabled:opacity-50">{t4(language, "อ้าง", "Claim", "领取", "受取")}</Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200/50">
                <p className="text-xs text-amber-900 dark:text-amber-200">
                  <strong>{t4(language, "หมายเหตุ:", "Note:", "注意:", "注:")}</strong>{" "}
                  {t4(language, "ภารกิจรายวันจะรีเซ็ตทุกวันเวลา 00:00 น. (เวลากรุงเทพ)", "Daily quests reset at 00:00 (Bangkok Time)", "每日任务在00:00（曼谷时间）重置", "デイリークエストは毎日00:00（バンコク時間）にリセットされます")}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="achievements" className="mt-0">
          <Card className="border-border/50 shadow-xl">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Trophy className="h-5 w-5 text-purple-500" />
                {t4(language, "เกียรติยศ", "Achievements", "成就", "実績")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {ACHIEVEMENTS.map((achievement) => {
                const isUnlocked = unlockedAchievements.includes(achievement.id);
                const progress = userProgress[achievement.id] || 0;
                const progressPercent = Math.min(100, Math.round((progress / (achievement.progress || 1)) * 100));

                return (
                  <div key={achievement.id} className={cn("p-3 rounded-lg border-2 transition-all duration-300", isUnlocked ? "border-purple-400 bg-purple-50/50 dark:bg-purple-950/20" : "border-border/50 bg-muted/30 opacity-60")}>
                    <div className="flex items-start gap-3">
                      <div className="text-3xl">{achievement.icon}</div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-sm">{language === "th" ? achievement.name : achievement.nameEn}</p>
                          {isUnlocked ? <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" /> : <Lock className="h-4 w-4 text-muted-foreground" />}
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">{language === "th" ? achievement.description : achievement.descriptionEn}</p>
                        {!isUnlocked && achievement.progress && (
                          <div className="space-y-1">
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-muted-foreground">{Math.min(progress, achievement.progress)}/{achievement.progress}</span>
                              <Badge className="bg-purple-600 text-white text-xs px-2 py-0">+{achievement.reward} {t4(language, "คะแนน", "pts", "分", "pt")}</Badge>
                            </div>
                            <Progress value={progressPercent} className="h-2" />
                          </div>
                        )}
                        {isUnlocked && (
                          <Badge className="bg-purple-600 text-white text-xs mt-2">+{achievement.reward} {t4(language, "คะแนน", "pts", "分", "pt")}</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              <div className="p-3 rounded-lg bg-gradient-to-r from-purple-100/50 to-purple-50/50 dark:from-purple-900/20 dark:to-purple-950/20 border border-purple-200/50">
                <p className="text-sm font-medium">
                  {t4(language, `ได้เกียรติยศแล้ว ${totalAchievementCount}/${ACHIEVEMENTS.length}`, `Achievements unlocked ${totalAchievementCount}/${ACHIEVEMENTS.length}`, `已解锁成就 ${totalAchievementCount}/${ACHIEVEMENTS.length}`, `実績解除 ${totalAchievementCount}/${ACHIEVEMENTS.length}`)}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card className="border-border/50 bg-blue-50/50 dark:bg-blue-950/20">
        <CardHeader>
          <CardTitle className="text-base">💡 {t4(language, "คำแนะนำ", "Tips", "提示", "ヒント")}</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>• {t4(language, "สำเร็จภารกิจรายวันเพื่อเก็บคะแนนพิเศษ", "Complete daily quests to earn bonus points", "完成每日任务以获得额外积分", "デイリークエストを完了してボーナスポイントを獲得")}</p>
          <p>• {t4(language, "ปลดล็อกเกียรติยศเพื่อได้ป้าย Badge พิเศษ", "Unlock achievements to earn special badges", "解锁成就以获得特殊徽章", "実績を解除して特別バッジを獲得")}</p>
          <p>• {t4(language, "มีเพียง 24 ชั่วโมงสำหรับสำเร็จภารกิจรายวัน", "You have 24 hours to complete daily quests each day", "每天有24小时来完成每日任务", "デイリークエストは毎日24時間で完了する必要があります")}</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default QuestsAndAchievements;
