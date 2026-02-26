import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { POINT_CONFIG } from "@/lib/pointSystem";
import { AlertCircle, CheckCircle2, AlertTriangle, TrendingUp } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface PointSystemVisualProps {
  language: string;
}

const PointSystemVisualization = ({ language }: PointSystemVisualProps) => {
  // Function to get Thai labels for actions
  const getActionLabel = (key: string): string => {
    if (language === "th") {
      const thaiLabels: Record<string, string> = {
        createTopic: "ตั้งกระทู้ใหม่",
        replyTopic: "ตอบกระทู้",
        dailyLoginStreak: "เข้าต่อเนื่องทุกวัน",
        createReview: "เขียนรีวิว",
      };
      return thaiLabels[key] || key;
    }
    return key.replace(/([A-Z])/g, " $1").trim();
  };

  // Function to get Thai labels for reputation
  const getReputationLabel = (key: string): string => {
    if (language === "th") {
      const thaiLabels: Record<string, string> = {
        receiveLike: "ได้ถูกถูกใจ",
        pinnedPost: "โพสต์ถูกปักหมุด",
        bestAnswer: "Best Answer",
        helpfulReview: "รีวิวมีประโยชน์",
      };
      return thaiLabels[key] || key;
    }
    return key.replace(/([A-Z])/g, " $1").trim();
  };

  // Prepare data for Action Points
  const actionPointsData = Object.entries(POINT_CONFIG.actions).map(([key, value]) => ({
    name: getActionLabel(key),
    points: value,
    icon: getActionIcon(key),
  }));

  const qualityPointsData = Object.entries(POINT_CONFIG.reputation).map(([key, value]) => ({
    name: getReputationLabel(key),
    points: value,
    icon: getQualityIcon(key),
  }));

  const chartData = [
    ...actionPointsData.map((item) => ({ ...item, category: "Action" })),
    ...qualityPointsData.map((item) => ({ ...item, category: "Quality" })),
  ];

  const COLORS = {
    Action: "#3b82f6",
    Quality: "#10b981",
    Penalty: "#ef4444",
  };

  function getActionIcon(key: string): string {
    const icons: Record<string, string> = {
      createTopic: "📝",
      replyTopic: "💬",
      dailyLoginStreak: "📅",
      createReview: "⭐",
    };
    return icons[key] || "💎";
  }

  function getQualityIcon(key: string): string {
    const icons: Record<string, string> = {
      receiveLike: "👍",
      pinnedPost: "📌",
      bestAnswer: "🏆",
      helpfulReview: "❤️",
    };
    return icons[key] || "💎";
  }

  return (
    <div className="space-y-6">
      {/* Daily Point Limits Alert */}
      <Alert className="border-amber-300 bg-amber-50 dark:bg-amber-950/20">
        <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
        <AlertDescription className="text-amber-800 dark:text-amber-200">
          {language === "th" ? (
            <>
              <strong>จำกัดเพื่อป้องกัน Spam:</strong> ได้สูงสุด{" "}
              {POINT_CONFIG.dailyLimits.maxReplyPoints} คะแนนจากการตอบต่อวัน และ{" "}
              {POINT_CONFIG.dailyLimits.maxDailyPoints} คะแนนต่อวันทั้งหมด
            </>
          ) : (
            <>
              <strong>Spam Prevention:</strong> Maximum{" "}
              {POINT_CONFIG.dailyLimits.maxReplyPoints} points from replies and{" "}
              {POINT_CONFIG.dailyLimits.maxDailyPoints} total points per day
            </>
          )}
        </AlertDescription>
      </Alert>

      {/* Point System Tables */}
      <Tabs defaultValue="action" className="w-full">
        <TabsList className="w-full grid grid-cols-3 bg-slate-200 dark:bg-slate-700 mb-4">
          <TabsTrigger value="action" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
            {language === "th" ? "การกระทำ" : "Actions"}
          </TabsTrigger>
          <TabsTrigger value="quality" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
            {language === "th" ? "คุณภาพ" : "Quality"}
          </TabsTrigger>
          <TabsTrigger value="penalties" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
            {language === "th" ? "โทษ" : "Penalties"}
          </TabsTrigger>
        </TabsList>

        {/* Actions Tab */}
        <TabsContent value="action" className="mt-0">
          <Card className="border-0 shadow-lg bg-white dark:bg-slate-900 overflow-hidden">
            <div className="h-12 bg-gradient-to-r from-green-500 via-green-400 to-emerald-400"></div>
            <CardHeader className="pb-3 -mt-8 relative z-10 bg-white dark:bg-slate-900">
              <CardTitle className="text-lg flex items-center gap-2 text-slate-800 dark:text-white">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                {language === "th" ? "ได้คะแนนจากการกระทำ" : "Action Points"}
              </CardTitle>
              <CardDescription className="text-slate-600 dark:text-slate-400">
                {language === "th"
                  ? "คะแนนที่ได้จากการกระทำของตัวเอง"
                  : "Points earned from your own actions"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 bg-white dark:bg-slate-900">
              <div className="space-y-2">
                {Object.entries(POINT_CONFIG.actions).map(([key, value]) => (
                  <div
                    key={key}
                    className="flex items-center justify-between p-3 rounded-lg border border-green-200/50 bg-green-50/30 dark:bg-green-950/20"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{getActionIcon(key)}</span>
                      <div>
                        <p className="font-medium text-sm capitalize text-slate-800 dark:text-white">
                          {key === "createTopic"
                            ? language === "th"
                              ? "ตั้งกระทู้ใหม่"
                              : "Create New Topic"
                            : key === "replyTopic"
                              ? language === "th"
                                ? "ตอบกระทู้"
                                : "Reply to Topic"
                              : key === "dailyLoginStreak"
                                ? language === "th"
                                  ? "เข้าต่อเนื่องทุกวัน"
                                  : "Daily Login Streak"
                                : key === "createReview"
                                  ? language === "th"
                                    ? "เขียนรีวิว"
                                    : "Write Review"
                                  : key}
                        </p>
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                          {key === "createTopic"
                            ? language === "th"
                              ? "เมื่อสร้างกระทู้ใหม่"
                              : "When creating a new topic"
                            : key === "replyTopic"
                              ? language === "th"
                                ? "ทุกครั้งที่ตอบกระทู้"
                                : "Each time you reply"
                              : key === "dailyLoginStreak"
                                ? language === "th"
                                  ? "ทุกวันที่เข้ามาต่อเนื่อง"
                                  : "Each consecutive day"
                                : key === "createReview"
                                  ? language === "th"
                                    ? "เมื่อเขียนรีวิวใหม่"
                                    : "When writing a new review"
                                  : ""}
                        </p>
                      </div>
                    </div>
                    <Badge className="bg-green-600 text-white font-semibold text-lg px-3 py-1">
                      +{value}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Quality Tab */}
        <TabsContent value="quality" className="mt-0">
          <Card className="border-0 shadow-lg bg-white dark:bg-slate-900 overflow-hidden">
            <div className="h-12 bg-gradient-to-r from-blue-500 via-blue-400 to-cyan-400"></div>
            <CardHeader className="pb-3 -mt-8 relative z-10 bg-white dark:bg-slate-900">
              <CardTitle className="text-lg flex items-center gap-2 text-slate-800 dark:text-white">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                {language === "th" ? "คะแนนคุณภาพ" : "Quality Points"}
              </CardTitle>
              <CardDescription className="text-slate-600 dark:text-slate-400">
                {language === "th"
                  ? "คะแนนที่อื่นมอบให้สำหรับคุณภาพการตอบ"
                  : "Points others give for quality contributions"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 bg-white dark:bg-slate-900">
              <div className="space-y-2">
                {Object.entries(POINT_CONFIG.reputation).map(([key, value]) => (
                  <div
                    key={key}
                    className="flex items-center justify-between p-3 rounded-lg border border-blue-200/50 bg-blue-50/30 dark:bg-blue-950/20"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{getQualityIcon(key)}</span>
                      <div>
                        <p className="font-medium text-sm capitalize text-slate-800 dark:text-white">
                          {key === "receiveLike"
                            ? language === "th"
                              ? "ได้รับไลค์/ถูกใจ"
                              : "Receive Like"
                            : key === "pinnedPost"
                              ? language === "th"
                                ? "ถูกปักหมุด"
                                : "Post Pinned"
                              : key === "bestAnswer"
                                ? language === "th"
                                  ? "เลือกเป็น Best Answer"
                                  : "Best Answer Selected"
                                : key === "helpfulReview"
                                  ? language === "th"
                                    ? "รีวิวถูก Flag helpful"
                                    : "Review Marked Helpful"
                                  : key}
                        </p>
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                          {key === "receiveLike"
                            ? language === "th"
                              ? "เมื่อมีคนถูกใจความเห็นของคุณ"
                              : "When someone likes your comment"
                            : key === "pinnedPost"
                              ? language === "th"
                                ? "เมื่อผู้ดูแลปักหมุดกระทู้ของคุณ"
                                : "When moderator pins your post"
                              : key === "bestAnswer"
                                ? language === "th"
                                  ? "เมื่อโพสต์ของคุณเลือกเป็น Best Answer"
                                  : "When your answer is selected"
                                : key === "helpfulReview"
                                  ? language === "th"
                                    ? "เมื่อคนหลายคนกดประโยชน์"
                                    : "When marked helpful by users"
                                  : ""}
                        </p>
                      </div>
                    </div>
                    <Badge className="bg-blue-600 text-white font-semibold text-lg px-3 py-1">
                      +{value}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Penalties Tab */}
        <TabsContent value="penalties" className="mt-0">
          <Card className="border-0 shadow-lg bg-white dark:bg-slate-900 overflow-hidden">
            <div className="h-12 bg-gradient-to-r from-red-500 via-red-400 to-pink-400"></div>
            <CardHeader className="pb-3 -mt-8 relative z-10 bg-white dark:bg-slate-900">
              <CardTitle className="text-lg flex items-center gap-2 text-slate-800 dark:text-white">
                <AlertCircle className="h-5 w-5 text-red-600" />
                {language === "th" ? "ระบบลงโทษ" : "Penalties"}
              </CardTitle>
              <CardDescription className="text-slate-600 dark:text-slate-400">
                {language === "th"
                  ? "ลบคะแนนเมื่อฝ่าฝืนกฎ"
                  : "Points deducted for rule violations"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 bg-white dark:bg-slate-900">
              <div className="space-y-2">
                {Object.entries(POINT_CONFIG.penalties).map(([key, value]) => (
                  <div
                    key={key}
                    className="flex items-center justify-between p-3 rounded-lg border border-red-200/50 bg-red-50/30 dark:bg-red-950/20"
                  >
                    <div>
                      <p className="font-medium text-sm capitalize text-slate-800 dark:text-white">
                        {key === "spamDetected"
                          ? language === "th"
                            ? "ตรวจพบ Spam"
                            : "Spam Detected"
                          : key === "postRemoved"
                            ? language === "th"
                              ? "กระทู้ถูกลบ"
                              : "Post Removed"
                            : key === "reported"
                              ? language === "th"
                                ? "ถูก Report"
                                : "Reported"
                              : key}
                      </p>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        {key === "spamDetected"
                          ? language === "th"
                            ? "เมื่อพิมพ์สั้นเกินไป หรือซ้ำๆ"
                            : "For short or repetitive messages"
                          : key === "postRemoved"
                            ? language === "th"
                              ? "เมื่อแอดมินลบกระทู้ของคุณ"
                              : "When admin removes your post"
                            : key === "reported"
                              ? language === "th"
                                ? "เมื่อผู้อื่น Report กระทู้ของคุณและแอดมินยืนยัน"
                                : "When reported and confirmed"
                              : ""}
                      </p>
                    </div>
                    <Badge className="bg-red-600 text-white font-semibold text-lg px-3 py-1">
                      {value}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Spam Detection Rules */}
      <Card className="border-0 shadow-lg bg-white dark:bg-slate-900 overflow-hidden">
        <div className="h-12 bg-gradient-to-r from-orange-500 via-orange-400 to-yellow-400"></div>
        <CardHeader className="pb-3 -mt-8 relative z-10 bg-white dark:bg-slate-900">
          <CardTitle className="text-lg flex items-center gap-2 text-slate-800 dark:text-white">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            {language === "th" ? "กฎป้องกัน Spam" : "Spam Prevention Rules"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 bg-white dark:bg-slate-900">
          <div className="space-y-2">
            <div className="p-3 rounded-lg bg-orange-50/50 dark:bg-orange-950/20 border border-orange-200/50">
              <p className="text-sm font-medium text-orange-900 dark:text-orange-200">
                {language === "th" ? "ต้องพิมพ์อย่างน้อย" : "Minimum"}:{" "}
                <span className="font-bold">
                  {POINT_CONFIG.spamDetection.minCharacters} {language === "th" ? "ตัวอักษร" : "characters"}
                </span>
              </p>
            </div>
            <div className="p-3 rounded-lg bg-orange-50/50 dark:bg-orange-950/20 border border-orange-200/50">
              <p className="text-sm font-medium text-orange-900 dark:text-orange-200">
                {language === "th" ? "ต้องมีอย่างน้อย" : "Minimum"}:{" "}
                <span className="font-bold">
                  {POINT_CONFIG.spamDetection.minWords} {language === "th" ? "คำ" : "words"}
                </span>
              </p>
            </div>
            <div className="p-3 rounded-lg bg-orange-50/50 dark:bg-orange-950/20 border border-orange-200/50">
              <p className="text-sm font-medium text-orange-900 dark:text-orange-200 mb-2">
                {language === "th" ? "คำที่ถูกแบน:" : "Banned keywords:"}
              </p>
              <div className="flex flex-wrap gap-2">
                {POINT_CONFIG.spamDetection.bannedKeywords.map((keyword) => (
                  <Badge key={keyword} variant="destructive" className="text-xs">
                    {keyword}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Point Chart */}
      <Card className="border-0 shadow-lg bg-white dark:bg-slate-900 overflow-hidden">
        <div className="h-12 bg-gradient-to-r from-purple-500 via-purple-400 to-pink-400"></div>
        <CardHeader className="pb-3 -mt-8 relative z-10 bg-white dark:bg-slate-900">
          <CardTitle className="text-lg text-slate-800 dark:text-white">
            {language === "th" ? "การเปรียบเทียบคะแนน" : "Point Comparison"}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 bg-white dark:bg-slate-900">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis
                dataKey="name"
                stroke="var(--muted-foreground)"
                style={{ fontSize: "0.75rem" }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis stroke="var(--muted-foreground)" style={{ fontSize: "0.75rem" }} />
              <RechartsTooltip
                contentStyle={{
                  backgroundColor: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: "0.5rem",
                }}
              />
              <Legend />
              <Bar dataKey="points" name={language === "th" ? "คะแนน" : "Points"} radius={[8, 8, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[entry.category as keyof typeof COLORS]}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default PointSystemVisualization;
