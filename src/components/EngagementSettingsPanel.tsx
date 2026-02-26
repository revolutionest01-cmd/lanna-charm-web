import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ENGAGEMENT_SETTINGS } from "@/lib/engagementSystem";
import {
  Settings,
  Zap,
  Target,
  TrendingUp,
  Bell,
  Gift,
  AlertCircle,
  CheckCircle2,
  ToggleRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface EngagementSettingValue {
  enabled: boolean;
  lastModified?: Date;
  modifiedBy?: string;
}

interface EngagementSettingsProps {
  language: string;
  currentSettings?: Record<string, EngagementSettingValue>;
  onSettingChange?: (category: string, key: string, enabled: boolean) => void;
  isAdmin?: boolean;
}

const EngagementSettingsPanel = ({
  language,
  currentSettings = {},
  onSettingChange,
  isAdmin = true,
}: EngagementSettingsProps) => {
  const [settings, setSettings] = useState(currentSettings);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  const handleToggle = (category: string, key: string, enabled: boolean) => {
    setSettings((prev) => ({
      ...prev,
      [`${category}_${key}`]: {
        enabled,
        lastModified: new Date(),
        modifiedBy: "Admin",
      },
    }));

    onSettingChange?.(category, key, enabled);
    setSavedMessage(`${key} ${enabled ? "enabled" : "disabled"}`);
    setTimeout(() => setSavedMessage(null), 3000);
  };

  const SettingToggle = ({
    category,
    key,
    label,
    description,
    isEnabled,
  }: {
    category: string;
    key: string;
    label: string;
    description: string;
    isEnabled: boolean;
  }) => (
    <div className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-muted/20 hover:bg-muted/30 transition-colors">
      <div className="flex-1">
        <p className="font-medium text-sm">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <div className="flex items-center gap-3 ml-4">
        {isEnabled && (
          <CheckCircle2 className="h-4 w-4 text-green-600" />
        )}
        <Switch
          checked={isEnabled}
          onCheckedChange={(checked) =>
            handleToggle(category, key, checked)
          }
          disabled={!isAdmin}
        />
      </div>
    </div>
  );

  // Check if settings exist
  const questsEnabled = settings[`quests_enabled`]
    ? settings[`quests_enabled`].enabled
    : ENGAGEMENT_SETTINGS.quests?.enabled ?? true;

  const eventsEnabled = settings[`events_enabled`]
    ? settings[`events_enabled`].enabled
    : ENGAGEMENT_SETTINGS.events?.enabled ?? true;

  const leaderboardsEnabled = settings[`leaderboards_enabled`]
    ? settings[`leaderboards_enabled`].enabled
    : ENGAGEMENT_SETTINGS.leaderboards?.enabled ?? true;

  const notificationsEnabled = settings[`notifications_enabled`]
    ? settings[`notifications_enabled`].enabled
    : ENGAGEMENT_SETTINGS.notifications?.enabled ?? true;

  const rewardsEnabled = settings[`rewards_enabled`]
    ? settings[`rewards_enabled`].enabled
    : ENGAGEMENT_SETTINGS.rewards?.enabled ?? true;

  return (
    <div className="space-y-6">
      {/* Admin Warning */}
      {!isAdmin && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {language === "th"
              ? "คุณไม่มีสิทธิ์ในการปรับเปลี่ยนการตั้งค่าเหล่านี้"
              : "You don't have permission to modify these settings"}
          </AlertDescription>
        </Alert>
      )}

      {/* Saved Message */}
      {savedMessage && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-4 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4" />
          {language === "th" ? "บันทึกแล้ว: " : "Saved: "}
          {savedMessage}
        </div>
      )}

      {/* Header */}
      <Card className="border-border/50 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/20 dark:to-blue-900/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Settings className="h-6 w-6 text-blue-600" />
              <div>
                <CardTitle>
                  {language === "th" ? "การตั้งค่าการมีส่วนร่วม" : "Engagement Settings"}
                </CardTitle>
                <CardDescription>
                  {language === "th"
                    ? "ควบคุมการตั้งค่าระบบเพื่อเพิ่มความพร้อมใจของสมาชิก"
                    : "Configure engagement system features to boost member participation"}
                </CardDescription>
              </div>
            </div>
            {isAdmin && (
              <Badge className="bg-green-600 text-white">
                {language === "th" ? "แอดมิน" : "Admin"}
              </Badge>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Settings Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="w-full grid grid-cols-3 lg:grid-cols-5">
          <TabsTrigger value="overview">
            {language === "th" ? "ภาพรวม" : "Overview"}
          </TabsTrigger>
          <TabsTrigger value="quests">
            <Zap className="h-4 w-4 mr-1" />
            {language === "th" ? "ภารกิจ" : "Quests"}
          </TabsTrigger>
          <TabsTrigger value="events">
            <Target className="h-4 w-4 mr-1" />
            {language === "th" ? "เหตุการณ์" : "Events"}
          </TabsTrigger>
          <TabsTrigger value="leaderboards">
            <TrendingUp className="h-4 w-4 mr-1" />
            {language === "th" ? "อันดับ" : "Ranks"}
          </TabsTrigger>
          <TabsTrigger value="rewards">
            <Gift className="h-4 w-4 mr-1" />
            {language === "th" ? "รางวัล" : "Rewards"}
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="mt-4 space-y-4">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-base">
                {language === "th" ? "สถานะระบบ" : "System Status"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200/50">
                  <p className="text-xs text-muted-foreground mb-1">
                    {language === "th" ? "ภารกิจ" : "Quests"}
                  </p>
                  <Badge variant={questsEnabled ? "default" : "secondary"}>
                    {questsEnabled
                      ? language === "th"
                        ? "เปิดใช้"
                        : "Enabled"
                      : language === "th"
                      ? "ปิดใช้"
                      : "Disabled"}
                  </Badge>
                </div>

                <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-950/20 border border-purple-200/50">
                  <p className="text-xs text-muted-foreground mb-1">
                    {language === "th" ? "เหตุการณ์" : "Events"}
                  </p>
                  <Badge variant={eventsEnabled ? "default" : "secondary"}>
                    {eventsEnabled
                      ? language === "th"
                        ? "เปิดใช้"
                        : "Enabled"
                      : language === "th"
                      ? "ปิดใช้"
                      : "Disabled"}
                  </Badge>
                </div>

                <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200/50">
                  <p className="text-xs text-muted-foreground mb-1">
                    {language === "th" ? "อันดับคะแนน" : "Leaderboards"}
                  </p>
                  <Badge variant={leaderboardsEnabled ? "default" : "secondary"}>
                    {leaderboardsEnabled
                      ? language === "th"
                        ? "เปิดใช้"
                        : "Enabled"
                      : language === "th"
                      ? "ปิดใช้"
                      : "Disabled"}
                  </Badge>
                </div>

                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200/50">
                  <p className="text-xs text-muted-foreground mb-1">
                    {language === "th" ? "การแจ้งเตือน" : "Notifications"}
                  </p>
                  <Badge variant={notificationsEnabled ? "default" : "secondary"}>
                    {notificationsEnabled
                      ? language === "th"
                        ? "เปิดใช้"
                        : "Enabled"
                      : language === "th"
                      ? "ปิดใช้"
                      : "Disabled"}
                  </Badge>
                </div>

                <div className="p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200/50">
                  <p className="text-xs text-muted-foreground mb-1">
                    {language === "th" ? "รางวัล" : "Rewards"}
                  </p>
                  <Badge variant={rewardsEnabled ? "default" : "secondary"}>
                    {rewardsEnabled
                      ? language === "th"
                        ? "เปิดใช้"
                        : "Enabled"
                      : language === "th"
                      ? "ปิดใช้"
                      : "Disabled"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Tips */}
          <Card className="border-yellow-200/50 bg-yellow-50/50 dark:bg-yellow-950/20">
            <CardContent className="pt-4">
              <p className="text-sm font-semibold mb-2">
                💡 {language === "th" ? "เคล็ดลับ" : "Tips"}
              </p>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>
                  • {language === "th"
                    ? "ปิดใช้ภารกิจหากต้องการทำการบำรุงรักษา"
                    : "Disable quests during maintenance"}
                </li>
                <li>
                  • {language === "th"
                    ? "เปิดใช้เหตุการณ์พิเศษเพื่อเพิ่มการมีส่วนร่วม"
                    : "Enable special events to boost engagement"}
                </li>
                <li>
                  • {language === "th"
                    ? "ตรวจสอบการแจ้งเตือนก่อนปิดใช้"
                    : "Check notifications before disabling"}
                </li>
              </ul>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Quests Tab */}
        <TabsContent value="quests" className="mt-4 space-y-3">
          <SettingToggle
            category="quests"
            key="daily_quests"
            label={language === "th" ? "ภารกิจรายวัน" : "Daily Quests"}
            description={language === "th"
              ? "อนุญาตให้ผู้ใช้ทำภารกิจรายวันและรับรางวัล"
              : "Allow users to complete daily quests"}
            isEnabled={questsEnabled}
          />

          <SettingToggle
            category="quests"
            key="quest_rewards"
            label={language === "th" ? "รางวัลภารกิจ" : "Quest Rewards"}
            description={language === "th"
              ? "ให้คะแนนพิเศษสำหรับการสำเร็จภารกิจ"
              : "Give bonus points for quest completion"}
            isEnabled={questsEnabled}
          />

          <SettingToggle
            category="quests"
            key="daily_resets"
            label={language === "th" ? "รีเซ็ตรายวัน" : "Daily Resets"}
            description={language === "th"
              ? "รีเซ็ตความคืบหน้าภารกิจทุกวันเวลา 00:00"
              : "Reset quest progress daily at 00:00"}
            isEnabled={questsEnabled}
          />
        </TabsContent>

        {/* Events Tab */}
        <TabsContent value="events" className="mt-4 space-y-3">
          <SettingToggle
            category="events"
            key="special_events"
            label={language === "th" ? "เหตุการณ์พิเศษ" : "Special Events"}
            description={language === "th"
              ? "เปิดใช้เหตุการณ์เวลาจำกัด (Halloween เทศกาล ฯลฯ)"
              : "Enable time-limited special events"}
            isEnabled={eventsEnabled}
          />

          <SettingToggle
            category="events"
            key="double_points"
            label={language === "th" ? "คะแนนสองเท่า" : "Double Points"}
            description={language === "th"
              ? "เปิดใช้วัคเอนด์คะแนนสองเท่า"
              : "Enable weekend double points event"}
            isEnabled={eventsEnabled}
          />

          <SettingToggle
            category="events"
            key="fomo_mechanics"
            label={language === "th" ? "เมคานิตี้ FOMO" : "FOMO Mechanics"}
            description={language === "th"
              ? "แจ้งให้ผู้ใช้เกี่ยวกับเหตุการณ์ที่กำลังจะหมดอายุ"
              : "Notify users about expiring events"}
            isEnabled={eventsEnabled}
          />
        </TabsContent>

        {/* Leaderboards Tab */}
        <TabsContent value="leaderboards" className="mt-4 space-y-3">
          <SettingToggle
            category="leaderboards"
            key="weekly_leaderboard"
            label={language === "th" ? "อันดับรายสัปดาห์" : "Weekly Ranking"}
            description={language === "th"
              ? "แสดงอันดับคะแนนรายสัปดาห์"
              : "Display weekly top performers"}
            isEnabled={leaderboardsEnabled}
          />

          <SettingToggle
            category="leaderboards"
            key="monthly_leaderboard"
            label={language === "th" ? "อันดับรายเดือน" : "Monthly Ranking"}
            description={language === "th"
              ? "แสดงอันดับคะแนนรายเดือน"
              : "Display monthly top performers"}
            isEnabled={leaderboardsEnabled}
          />

          <SettingToggle
            category="leaderboards"
            key="all_time_leaderboard"
            label={language === "th" ? "อันดับทั้งหมด" : "All-Time Ranking"}
            description={language === "th"
              ? "แสดงอันดับคะแนนทั้งหมดตลอดเวลา"
              : "Display all-time hall of fame"}
            isEnabled={leaderboardsEnabled}
          />

          <SettingToggle
            category="leaderboards"
            key="member_of_month"
            label={language === "th" ? "สมาชิกประจำเดือน" : "Member of Month"}
            description={language === "th"
              ? "เลือกและตอบแทนสมาชิกประจำเดือน"
              : "Select and reward member of the month"}
            isEnabled={leaderboardsEnabled}
          />
        </TabsContent>

        {/* Rewards Tab */}
        <TabsContent value="rewards" className="mt-4 space-y-3">
          <SettingToggle
            category="rewards"
            key="reward_shop"
            label={language === "th" ? "ร้านค้ารางวัล" : "Reward Shop"}
            description={language === "th"
              ? "อนุญาตให้ผู้ใช้แลกรางวัลด้วยคะแนน"
              : "Allow users to redeem rewards"}
            isEnabled={rewardsEnabled}
          />

          <SettingToggle
            category="rewards"
            key="redemption_tracking"
            label={language === "th" ? "ติดตามการแลก" : "Redemption Tracking"}
            description={language === "th"
              ? "บันทึกการแลกรางวัลทั้งหมด"
              : "Track all reward redemptions"}
            isEnabled={rewardsEnabled}
          />

          <SettingToggle
            category="rewards"
            key="limited_stock"
            label={language === "th" ? "สต็อกจำกัด" : "Limited Stock"}
            description={language === "th"
              ? "จำกัดจำนวนรางวัลที่มีให้แลก"
              : "Limit available reward quantity"}
            isEnabled={rewardsEnabled}
          />
        </TabsContent>
      </Tabs>

      {/* Danger Zone */}
      {isAdmin && (
        <Card className="border-2 border-red-200/50 bg-red-50/50 dark:bg-red-950/20">
          <CardHeader>
            <CardTitle className="text-base text-red-700 dark:text-red-300">
              ⚠️ {language === "th" ? "โซนอันตราย" : "Danger Zone"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {language === "th"
                ? "ปิดใช้งานทั้งระบบการมีส่วนร่วม"
                : "Disable entire engagement system"}
            </p>
            <Button
              variant="destructive"
              disabled={!isAdmin}
            >
              {language === "th" ? "ปิดใช้ทั้งหมด" : "Disable All"}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EngagementSettingsPanel;
