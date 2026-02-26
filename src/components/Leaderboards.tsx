import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  LEADERBOARD_TYPES,
  MEMBER_OF_THE_MONTH,
  calculateLeaderboardRank,
} from "@/lib/engagementSystem";
import { Crown, Medal, Sparkles, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface LeaderboardUser {
  id: string;
  name: string;
  avatar?: string;
  points: number;
  rank?: number;
  title?: string;
  badge?: string;
}

interface LeaderboardsProps {
  language: string;
  weeklyData?: LeaderboardUser[];
  monthlyData?: LeaderboardUser[];
  allTimeData?: LeaderboardUser[];
  currentUserId?: string;
  currentUserRank?: number;
  currentUserPoints?: number;
}

const getRankIcon = (position: number) => {
  if (position === 1) return <Crown className="h-5 w-5 text-yellow-500" />;
  if (position === 2) return <Medal className="h-5 w-5 text-gray-400" />;
  if (position === 3) return <Medal className="h-5 w-5 text-orange-600" />;
  return null;
};

const getRankColor = (position: number) => {
  if (position === 1) return "bg-yellow-100 dark:bg-yellow-950/30 border-yellow-200";
  if (position === 2) return "bg-gray-100 dark:bg-gray-950/30 border-gray-200";
  if (position === 3) return "bg-orange-100 dark:bg-orange-950/30 border-orange-200";
  return "bg-muted/50";
};

const LeaderboardRow = ({
  position,
  user,
  language,
  isCurrentUser = false,
}: {
  position: number;
  user: LeaderboardUser;
  language: string;
  isCurrentUser?: boolean;
}) => {
  return (
    <div
      className={cn(
        "flex items-center justify-between p-3 rounded-lg border-2 transition-all duration-300",
        getRankColor(position),
        isCurrentUser && "ring-2 ring-blue-500 ring-offset-2"
      )}
    >
      <div className="flex items-center gap-3 flex-1">
        {/* Position */}
        <div className="w-8 flex justify-center">
          {getRankIcon(position) || (
            <span className="font-bold text-muted-foreground text-lg">{position}</span>
          )}
        </div>

        {/* User Info */}
        <div className="flex items-center gap-2 flex-1">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.avatar} alt={user.name} />
            <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p
              className={cn(
                "font-semibold text-sm truncate",
                position <= 3 && "text-lg"
              )}
            >
              {user.name}
              {isCurrentUser && (
                <span className="ml-1 text-xs text-blue-600 dark:text-blue-400">
                  ({language === "th" ? "คุณ" : "You"})
                </span>
              )}
            </p>
            {user.title && (
              <p className="text-xs text-muted-foreground truncate">{user.title}</p>
            )}
          </div>
        </div>
      </div>

      {/* Badges and Points */}
      <div className="flex items-center gap-2">
        {user.badge && <span className="text-lg">{user.badge}</span>}
        <Badge className="bg-blue-600 text-white whitespace-nowrap">
          {user.points.toLocaleString()} {language === "th" ? "คะแนน" : "pts"}
        </Badge>
      </div>
    </div>
  );
};

const Leaderboards = ({
  language,
  weeklyData = [],
  monthlyData = [],
  allTimeData = [],
  currentUserId,
  currentUserRank,
  currentUserPoints,
}: LeaderboardsProps) => {
  // Mock data if not provided
  const mockWeekly: LeaderboardUser[] =
    weeklyData.length > 0
      ? weeklyData
      : [
          {
            id: "1",
            name: "สมปอง",
            points: 1250,
            title: "วิทยากร",
            badge: "🏆",
          },
          {
            id: "2",
            name: "เชิดชา",
            points: 1180,
            title: "ผู้เชี่ยวชาญ",
            badge: "⭐",
          },
          {
            id: "3",
            name: "ธีรพล",
            points: 1050,
            badge: "🎖️",
          },
          {
            id: "4",
            name: "นวลน้อย",
            points: 950,
          },
          {
            id: "5",
            name: "สุรศักดิ์",
            points: 850,
          },
        ];

  const mockMonthly: LeaderboardUser[] =
    monthlyData.length > 0
      ? monthlyData
      : [
          {
            id: "2",
            name: "เชิดชา",
            points: 5420,
            title: "ผู้เชี่ยวชาญ",
            badge: "🏆",
          },
          {
            id: "1",
            name: "สมปอง",
            points: 5180,
            badge: "⭐",
          },
          {
            id: "3",
            name: "ธีรพล",
            points: 4950,
            badge: "🎖️",
          },
          {
            id: "5",
            name: "สุรศักดิ์",
            points: 3850,
          },
          {
            id: "4",
            name: "นวลน้อย",
            points: 3750,
          },
        ];

  const mockAllTime: LeaderboardUser[] =
    allTimeData.length > 0
      ? allTimeData
      : [
          {
            id: "1",
            name: "สมปอง",
            rank: 5,
            points: 25680,
            title: MEMBER_OF_THE_MONTH.name,
            badge: "👑",
          },
          {
            id: "2",
            name: "เชิดชา",
            rank: 4,
            points: 22450,
            badge: "🏅",
          },
          {
            id: "3",
            name: "ธีรพล",
            rank: 3,
            points: 19800,
            badge: "🥈",
          },
          {
            id: "4",
            name: "นวลน้อย",
            rank: 2,
            points: 18500,
            badge: "🥉",
          },
          {
            id: "5",
            name: "สุรศักดิ์",
            rank: 1,
            points: 16750,
          },
        ];

  const [selectedTab, setSelectedTab] = useState("weekly");

  const currentData = useMemo(() => {
    switch (selectedTab) {
      case "monthly":
        return mockMonthly;
      case "all-time":
        return mockAllTime;
      default:
        return mockWeekly;
    }
  }, [selectedTab]);

  const memberOfMonth = mockAllTime[0];

  return (
    <div className="space-y-6">
      {/* Member of the Month */}
      <Card className="border-2 border-amber-300 bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30 overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-200/10 rounded-full blur-3xl -mr-16 -mt-16" />
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-600" />
            <CardTitle className="text-lg">
              {language === "th" ? "สมาชิกประจำเดือน" : "Member of the Month"}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 border-4 border-amber-300">
              <AvatarImage src={memberOfMonth.avatar} alt={memberOfMonth.name} />
              <AvatarFallback className="text-xl">
                {memberOfMonth.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="text-lg font-bold">{memberOfMonth.name}</p>
              <p className="text-sm text-amber-700 dark:text-amber-200">
                ★ {language === "th" ? "ยอดเยี่ยม" : "Outstanding"} ★
              </p>
              <div className="flex gap-2 mt-2">
                <Badge className="bg-amber-700 text-white">
                  {memberOfMonth.points.toLocaleString()}{" "}
                  {language === "th" ? "คะแนน" : "pts"}
                </Badge>
              </div>
            </div>
            <div className="text-4xl">👑</div>
          </div>
        </CardContent>
      </Card>

      {/* Leaderboards */}
      <Card className="border-border/50 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-500" />
            {language === "th" ? "อันดับคะแนน" : "Leaderboards"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="weekly" className="w-full" onValueChange={setSelectedTab}>
            <TabsList className="w-full grid grid-cols-3">
              <TabsTrigger value="weekly">
                {language === "th" ? "สัปดาห์" : "Weekly"}
              </TabsTrigger>
              <TabsTrigger value="monthly">
                {language === "th" ? "เดือน" : "Monthly"}
              </TabsTrigger>
              <TabsTrigger value="all-time">
                {language === "th" ? "ทั้งหมด" : "All Time"}
              </TabsTrigger>
            </TabsList>

            {/* Weekly */}
            <TabsContent value="weekly" className="mt-4 space-y-2">
              <div className="space-y-2">
                {mockWeekly.map((user, index) => (
                  <LeaderboardRow
                    key={user.id}
                    position={index + 1}
                    user={user}
                    language={language}
                    isCurrentUser={currentUserId === user.id}
                  />
                ))}
              </div>

              {/* Your Rank */}
              {currentUserId &&
                !mockWeekly.some((u) => u.id === currentUserId) &&
                currentUserRank && (
                  <div className="border-t pt-2 mt-4">
                    <p className="text-xs text-muted-foreground mb-2">
                      {language === "th" ? "อันดับของคุณ" : "Your Ranking"}
                    </p>
                    <LeaderboardRow
                      position={currentUserRank}
                      user={{
                        id: currentUserId,
                        name: language === "th" ? "คุณ" : "You",
                        points: currentUserPoints || 0,
                      }}
                      language={language}
                      isCurrentUser
                    />
                  </div>
                )}
            </TabsContent>

            {/* Monthly */}
            <TabsContent value="monthly" className="mt-4 space-y-2">
              <div className="space-y-2">
                {mockMonthly.map((user, index) => (
                  <LeaderboardRow
                    key={user.id}
                    position={index + 1}
                    user={user}
                    language={language}
                    isCurrentUser={currentUserId === user.id}
                  />
                ))}
              </div>

              {currentUserId &&
                !mockMonthly.some((u) => u.id === currentUserId) &&
                currentUserRank && (
                  <div className="border-t pt-2 mt-4">
                    <p className="text-xs text-muted-foreground mb-2">
                      {language === "th" ? "อันดับของคุณ" : "Your Ranking"}
                    </p>
                    <LeaderboardRow
                      position={currentUserRank}
                      user={{
                        id: currentUserId,
                        name: language === "th" ? "คุณ" : "You",
                        points: currentUserPoints || 0,
                      }}
                      language={language}
                      isCurrentUser
                    />
                  </div>
                )}
            </TabsContent>

            {/* All Time */}
            <TabsContent value="all-time" className="mt-4 space-y-2">
              <div className="space-y-2">
                {mockAllTime.map((user, index) => (
                  <LeaderboardRow
                    key={user.id}
                    position={index + 1}
                    user={user}
                    language={language}
                    isCurrentUser={currentUserId === user.id}
                  />
                ))}
              </div>

              {currentUserId &&
                !mockAllTime.some((u) => u.id === currentUserId) &&
                currentUserRank && (
                  <div className="border-t pt-2 mt-4">
                    <p className="text-xs text-muted-foreground mb-2">
                      {language === "th" ? "อันดับของคุณ" : "Your Ranking"}
                    </p>
                    <LeaderboardRow
                      position={currentUserRank}
                      user={{
                        id: currentUserId,
                        name: language === "th" ? "คุณ" : "You",
                        points: currentUserPoints || 0,
                      }}
                      language={language}
                      isCurrentUser
                    />
                  </div>
                )}
            </TabsContent>
          </Tabs>

          {/* Tips */}
          <div className="mt-6 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200/50">
            <p className="text-xs text-blue-900 dark:text-blue-200">
              <strong>{language === "th" ? "เคล็ดลับ:" : "Tips:"}</strong>
              {language === "th"
                ? " อันดับจะอัปเดตของที่ 00:00 น. (เวลากรุงเทพ)"
                : " Rankings update at 00:00 (Bangkok Time)"}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Leaderboards;
