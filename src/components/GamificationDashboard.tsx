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
                {language === "th" ? "คะแนน" : "Points"}
              </p>
              <p className="text-2xl font-bold text-blue-600">
                {userPoints.toLocaleString()}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/20 dark:to-purple-900/20 border-2 border-purple-200/50">
          <div className="flex items-center gap-3">
            <Trophy className="h-6 w-6 text-purple-500" />
            <div>
              <p className="text-xs text-muted-foreground">
                {language === "th" ? "ตำแหน่ง" : "Rank"}
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
                {language === "th" ? "ภารกิจ" : "Quests"}
              </p>
              <p className="text-2xl font-bold text-green-600">
                {completedQuests.length}/4
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/20 dark:to-orange-900/20 border-2 border-orange-200/50">
          <div className="flex items-center gap-3">
            <Gift className="h-6 w-6 text-orange-500" />
            <div>
              <p className="text-xs text-muted-foreground">
                {language === "th" ? "แจ้งเตือน" : "Alerts"}
              </p>
              <p className="text-2xl font-bold text-orange-600">
                {unreadNotifications}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Main Tabs */}
      <Card className="border-border/50 shadow-xl">
        <Tabs
          defaultValue="quests"
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full"
        >
          <TabsList className="w-full grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 rounded-none border-b">
            <TabsTrigger value="quests" className="gap-1.5 rounded-none relative">
              <Zap className="h-4 w-4" />
              <span className="hidden sm:inline">
                {language === "th" ? "ภารกิจ" : "Quests"}
              </span>
              <TabBadge count={4 - completedQuests.length} />
            </TabsTrigger>

            <TabsTrigger value="leaderboards" className="gap-1.5 rounded-none">
              <Trophy className="h-4 w-4" />
              <span className="hidden sm:inline">
                {language === "th" ? "อันดับ" : "Rankings"}
              </span>
            </TabsTrigger>

            <TabsTrigger value="notifications" className="gap-1.5 rounded-none">
              <Bell className="h-4 w-4" />
              <span className="hidden sm:inline">
                {language === "th" ? "แจ้งเตือน" : "Alerts"}
              </span>
              <TabBadge count={unreadNotifications} />
            </TabsTrigger>

            <TabsTrigger value="rewards" className="gap-1.5 rounded-none">
              <Gift className="h-4 w-4" />
              <span className="hidden sm:inline">
                {language === "th" ? "รางวัล" : "Rewards"}
              </span>
            </TabsTrigger>
          </TabsList>

          {/* Quests & Achievements */}
          <TabsContent value="quests" className="p-6">
            <QuestsAndAchievements
              language={language}
              completedQuests={completedQuests}
              unlockedAchievements={unlockedAchievements}
            />
          </TabsContent>

          {/* Leaderboards */}
          <TabsContent value="leaderboards" className="p-6">
            <Leaderboards
              language={language}
              currentUserRank={userRank}
              currentUserPoints={userPoints}
              currentUserId="current-user-id"
            />
          </TabsContent>

          {/* Notifications */}
          <TabsContent value="notifications" className="p-6">
            <NotificationCenter language={language} />
          </TabsContent>

          {/* Rewards */}
          <TabsContent value="rewards" className="p-6">
            <RewardShop
              language={language}
              userPoints={userPoints}
              userRewards={claimedRewards.map((id) => ({
                id,
                rewardId: id,
                claimedAt: new Date(),
                status: "completed",
              }))}
            />
          </TabsContent>
        </Tabs>
      </Card>

      {/* Quick Tips Section */}
      <Card className="border-border/50 bg-gradient-to-br from-indigo-50 to-indigo-100/50 dark:from-indigo-950/20 dark:to-indigo-900/20">
        <div className="p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Target className="h-5 w-5 text-indigo-600" />
            {language === "th" ? "วิธีเพิ่มรายได้" : "How to Maximize"}
          </h3>
          <div className="grid md:grid-cols-3 gap-4">
            {/* Tip 1 */}
            <div className="flex gap-3">
              <div className="text-2xl flex-shrink-0">📝</div>
              <div>
                <p className="font-semibold text-sm">
                  {language === "th" ? "สร้างหัวข้อ" : "Create Topics"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {language === "th"
                    ? "+10 คะแนนต่อหัวข้อ"
                    : "+10 pts per topic"}
                </p>
              </div>
            </div>

            {/* Tip 2 */}
            <div className="flex gap-3">
              <div className="text-2xl flex-shrink-0">💬</div>
              <div>
                <p className="font-semibold text-sm">
                  {language === "th" ? "ตอบกระทู้" : "Reply Threads"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {language === "th"
                    ? "+5 คะแนนต่อตอบ"
                    : "+5 pts per reply"}
                </p>
              </div>
            </div>

            {/* Tip 3 */}
            <div className="flex gap-3">
              <div className="text-2xl flex-shrink-0">⭐</div>
              <div>
                <p className="font-semibold text-sm">
                  {language === "th" ? "รับความชื่นชอบ" : "Get Likes"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {language === "th"
                    ? "+15 คะแนนต่อไลค์"
                    : "+15 pts per like"}
                </p>
              </div>
            </div>

            {/* Tip 4 */}
            <div className="flex gap-3">
              <div className="text-2xl flex-shrink-0">✅</div>
              <div>
                <p className="font-semibold text-sm">
                  {language === "th" ? "ภารกิจรายวัน" : "Daily Quests"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {language === "th"
                    ? "สำเร็จทุกวัน"
                    : "Complete everyday"}
                </p>
              </div>
            </div>

            {/* Tip 5 */}
            <div className="flex gap-3">
              <div className="text-2xl flex-shrink-0">🏆</div>
              <div>
                <p className="font-semibold text-sm">
                  {language === "th" ? "เหตุการณ์พิเศษ" : "Special Events"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {language === "th"
                    ? "คะแนนสองเท่า"
                    : "Double points"}
                </p>
              </div>
            </div>

            {/* Tip 6 */}
            <div className="flex gap-3">
              <div className="text-2xl flex-shrink-0">🎁</div>
              <div>
                <p className="font-semibold text-sm">
                  {language === "th" ? "แลกรางวัล" : "Redeem Rewards"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {language === "th"
                    ? "ใช้คะแนนของคุณ"
                    : "Spend your points"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* System Status */}
      <Card className="border-border/50 bg-blue-50/50 dark:bg-blue-950/20">
        <div className="p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">
              {language === "th"
                ? "✓ ระบบการมีส่วนร่วมเปิดใช้งานแล้ว"
                : "✓ Engagement system is active"}
            </p>
            <TrendingUp className="h-5 w-5 text-green-600" />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {language === "th"
              ? "ทำกิจกรรมต่างๆ เพื่อเพิ่มคะแนน ยศ และเบิกรางวัล"
              : "Engage in activities to earn points, rank up, and redeem rewards"}
          </p>
        </div>
      </Card>
    </div>
  );
};

export default GamificationDashboard;
