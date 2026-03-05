import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import QuestsAndAchievements from "./QuestsAndAchievements";
import Leaderboards from "./Leaderboards";
import NotificationCenter from "./NotificationCenter";
import RewardShop from "./RewardShop";
import {
  Zap,
  Trophy,
  Bell,
  Gift,
  Target,
  TrendingUp,
  Sparkles,
} from "lucide-react";
import { t4 } from "@/lib/i18n";

interface GamificationDashboardProps {
  language: string;
  userPoints?: number;
  userRank?: number;
  completedQuests?: string[];
  unlockedAchievements?: string[];
  unreadNotifications?: number;
  claimedRewards?: string[];
}

const GamificationDashboard = ({
  language,
  userPoints = 2500,
  userRank = 3,
  completedQuests = [],
  unlockedAchievements = [],
  unreadNotifications = 3,
  claimedRewards = [],
}: GamificationDashboardProps) => {
  const [activeTab, setActiveTab] = useState("quests");

  const TabBadge = ({ count, show = true }: { count: number; show?: boolean }) => {
    if (!show || count === 0) return null;
    return (
      <Badge className="ml-2 bg-red-500 text-white text-xs">
        {count > 9 ? "9+" : count}
      </Badge>
    );
  };

  return (
    <div className="w-full space-y-6">
      {/* Header with Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20 border-2 border-blue-200/50">
          <div className="flex items-center gap-3">
            <Sparkles className="h-6 w-6 text-blue-500" />
            <div>
              <p className="text-xs text-muted-foreground">
                {t4(language, "คะแนน", "Points", "积分", "ポイント")}
              </p>
              <p className="text-2xl font-bold text-blue-600">{userPoints.toLocaleString()}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/20 dark:to-purple-900/20 border-2 border-purple-200/50">
          <div className="flex items-center gap-3">
            <Trophy className="h-6 w-6 text-purple-500" />
            <div>
              <p className="text-xs text-muted-foreground">
                {t4(language, "ตำแหน่ง", "Rank", "排名", "ランク")}
              </p>
              <p className="text-2xl font-bold text-purple-600">#{userRank}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/20 border-2 border-green-200/50">
          <div className="flex items-center gap-3">
            <Zap className="h-6 w-6 text-green-500" />
            <div>
              <p className="text-xs text-muted-foreground">
                {t4(language, "ภารกิจ", "Quests", "任务", "クエスト")}
              </p>
              <p className="text-2xl font-bold text-green-600">{completedQuests.length}/4</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/20 dark:to-orange-900/20 border-2 border-orange-200/50">
          <div className="flex items-center gap-3">
            <Gift className="h-6 w-6 text-orange-500" />
            <div>
              <p className="text-xs text-muted-foreground">
                {t4(language, "แจ้งเตือน", "Alerts", "通知", "通知")}
              </p>
              <p className="text-2xl font-bold text-orange-600">{unreadNotifications}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Main Tabs */}
      <Card className="border-border/50 shadow-xl">
        <Tabs defaultValue="quests" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 rounded-none border-b">
            <TabsTrigger value="quests" className="gap-1.5 rounded-none relative">
              <Zap className="h-4 w-4" />
              <span className="hidden sm:inline">{t4(language, "ภารกิจ", "Quests", "任务", "クエスト")}</span>
              <TabBadge count={4 - completedQuests.length} />
            </TabsTrigger>
            <TabsTrigger value="leaderboards" className="gap-1.5 rounded-none">
              <Trophy className="h-4 w-4" />
              <span className="hidden sm:inline">{t4(language, "อันดับ", "Rankings", "排行", "ランキング")}</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-1.5 rounded-none">
              <Bell className="h-4 w-4" />
              <span className="hidden sm:inline">{t4(language, "แจ้งเตือน", "Alerts", "通知", "通知")}</span>
              <TabBadge count={unreadNotifications} />
            </TabsTrigger>
            <TabsTrigger value="rewards" className="gap-1.5 rounded-none">
              <Gift className="h-4 w-4" />
              <span className="hidden sm:inline">{t4(language, "รางวัล", "Rewards", "奖励", "報酬")}</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="quests" className="p-6">
            <QuestsAndAchievements language={language} completedQuests={completedQuests} unlockedAchievements={unlockedAchievements} />
          </TabsContent>
          <TabsContent value="leaderboards" className="p-6">
            <Leaderboards language={language} currentUserRank={userRank} currentUserPoints={userPoints} currentUserId="current-user-id" />
          </TabsContent>
          <TabsContent value="notifications" className="p-6">
            <NotificationCenter language={language} />
          </TabsContent>
          <TabsContent value="rewards" className="p-6">
            <RewardShop language={language} userPoints={userPoints} userRewards={claimedRewards.map((id) => ({ id, rewardId: id, claimedAt: new Date(), status: "completed" as const }))} />
          </TabsContent>
        </Tabs>
      </Card>

      {/* Quick Tips Section */}
      <Card className="border-border/50 bg-gradient-to-br from-indigo-50 to-indigo-100/50 dark:from-indigo-950/20 dark:to-indigo-900/20">
        <div className="p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Target className="h-5 w-5 text-indigo-600" />
            {t4(language, "วิธีเพิ่มรายได้", "How to Maximize", "如何最大化", "ポイントを増やす方法")}
          </h3>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { icon: "📝", th: "สร้างหัวข้อ", en: "Create Topics", zh: "创建主题", ja: "トピック作成", descTh: "+10 คะแนนต่อหัวข้อ", descEn: "+10 pts per topic", descZh: "+10分/主题", descJa: "+10pt/トピック" },
              { icon: "💬", th: "ตอบกระทู้", en: "Reply Threads", zh: "回复帖子", ja: "スレッドに返信", descTh: "+5 คะแนนต่อตอบ", descEn: "+5 pts per reply", descZh: "+5分/回复", descJa: "+5pt/返信" },
              { icon: "⭐", th: "รับความชื่นชอบ", en: "Get Likes", zh: "获得点赞", ja: "いいねを獲得", descTh: "+15 คะแนนต่อไลค์", descEn: "+15 pts per like", descZh: "+15分/点赞", descJa: "+15pt/いいね" },
              { icon: "✅", th: "ภารกิจรายวัน", en: "Daily Quests", zh: "每日任务", ja: "デイリークエスト", descTh: "สำเร็จทุกวัน", descEn: "Complete everyday", descZh: "每天完成", descJa: "毎日完了" },
              { icon: "🏆", th: "เหตุการณ์พิเศษ", en: "Special Events", zh: "特别活动", ja: "特別イベント", descTh: "คะแนนสองเท่า", descEn: "Double points", descZh: "双倍积分", descJa: "ポイント2倍" },
              { icon: "🎁", th: "แลกรางวัล", en: "Redeem Rewards", zh: "兑换奖励", ja: "報酬を交換", descTh: "ใช้คะแนนของคุณ", descEn: "Spend your points", descZh: "使用你的积分", descJa: "ポイントを使う" },
            ].map((tip, i) => (
              <div key={i} className="flex gap-3">
                <div className="text-2xl flex-shrink-0">{tip.icon}</div>
                <div>
                  <p className="font-semibold text-sm">{t4(language, tip.th, tip.en, tip.zh, tip.ja)}</p>
                  <p className="text-xs text-muted-foreground">{t4(language, tip.descTh, tip.descEn, tip.descZh, tip.descJa)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* System Status */}
      <Card className="border-border/50 bg-blue-50/50 dark:bg-blue-950/20">
        <div className="p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">
              {t4(language,
                "✓ ระบบการมีส่วนร่วมเปิดใช้งานแล้ว",
                "✓ Engagement system is active",
                "✓ 互动系统已启用",
                "✓ エンゲージメントシステムが有効です"
              )}
            </p>
            <TrendingUp className="h-5 w-5 text-green-600" />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {t4(language,
              "ทำกิจกรรมต่างๆ เพื่อเพิ่มคะแนน ยศ และเบิกรางวัล",
              "Engage in activities to earn points, rank up, and redeem rewards",
              "参与活动赚取积分、升级和兑换奖励",
              "アクティビティに参加してポイントを獲得し、ランクアップして報酬を交換しましょう"
            )}
          </p>
        </div>
      </Card>
    </div>
  );
};

export default GamificationDashboard;
