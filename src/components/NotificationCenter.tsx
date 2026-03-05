import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { NOTIFICATION_TRIGGERS } from "@/lib/engagementSystem";
import { Bell, Heart, MessageCircle, Flame, Award, Zap, X, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { t4 } from "@/lib/i18n";

interface Notification {
  id: string;
  triggerId: string;
  title: string;
  titleEn?: string;
  titleZh?: string;
  titleJa?: string;
  description: string;
  descriptionEn?: string;
  descriptionZh?: string;
  descriptionJa?: string;
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
  icon?: string;
}

interface NotificationCenterProps {
  language: string;
  notifications?: Notification[];
  onMarkAsRead?: (id: string) => void;
  onDismiss?: (id: string) => void;
  onAction?: (notification: Notification) => void;
}

const getNotificationColor = (triggerId: string) => {
  const trigger = NOTIFICATION_TRIGGERS[triggerId];
  if (!trigger) return "bg-gray-50 dark:bg-gray-950/20 border-gray-200";
  switch (trigger.color) {
    case "red": return "bg-red-50 dark:bg-red-950/20 border-red-200";
    case "pink": return "bg-pink-50 dark:bg-pink-950/20 border-pink-200";
    case "orange": return "bg-orange-50 dark:bg-orange-950/20 border-orange-200";
    case "blue": return "bg-blue-50 dark:bg-blue-950/20 border-blue-200";
    case "purple": return "bg-purple-50 dark:bg-purple-950/20 border-purple-200";
    case "yellow": return "bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200";
    default: return "bg-gray-50 dark:bg-gray-950/20 border-gray-200";
  }
};

const getNotificationIcon = (triggerId: string) => {
  switch (triggerId) {
    case "like": return <Heart className="h-5 w-5 text-red-500" />;
    case "mention": return <MessageCircle className="h-5 w-5 text-blue-500" />;
    case "trending": return <Flame className="h-5 w-5 text-orange-500" />;
    case "bestanswer": return <Award className="h-5 w-5 text-purple-500" />;
    case "questcomplete": return <Zap className="h-5 w-5 text-yellow-500" />;
    case "eventupdate": return <Bell className="h-5 w-5 text-blue-600" />;
    default: return <Bell className="h-5 w-5" />;
  }
};

const formatTime = (date: Date, language: string): string => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return t4(language, "เพิ่งเดือด", "Just now", "刚刚", "たった今");
  if (diffMins < 60) return t4(language, `${diffMins} นาทีที่แล้ว`, `${diffMins}m ago`, `${diffMins}分钟前`, `${diffMins}分前`);
  if (diffHours < 24) return t4(language, `${diffHours} ชั่วโมงที่แล้ว`, `${diffHours}h ago`, `${diffHours}小时前`, `${diffHours}時間前`);
  if (diffDays < 7) return t4(language, `${diffDays} วันที่แล้ว`, `${diffDays}d ago`, `${diffDays}天前`, `${diffDays}日前`);

  return date.toLocaleDateString(
    language === "th" ? "th-TH" : language === "zh" ? "zh-CN" : language === "ja" ? "ja-JP" : "en-US"
  );
};

const NotificationCenter = ({
  language,
  notifications = [],
  onMarkAsRead,
  onDismiss,
  onAction,
}: NotificationCenterProps) => {
  const mockNotifications: Notification[] =
    notifications.length > 0
      ? notifications
      : [
          { id: "1", triggerId: "like", title: "คนใจดีชอบหัวข้อของคุณ", titleEn: "Someone liked your topic", titleZh: "有人喜欢了你的主题", titleJa: "あなたのトピックにいいねがつきました", description: "สมปอง ชอบหัวข้อ 'ร้านกาแฟดีๆ ที่เชียงใหม่'", descriptionEn: "Sompong liked your topic 'Best cafes in Chiang Mai'", timestamp: new Date(Date.now() - 5 * 60000), read: false, actionUrl: "/forum/topic/123", icon: "❤️" },
          { id: "2", triggerId: "mention", title: "มีคนหยิบยกชื่อคุณ", titleEn: "You were mentioned", titleZh: "有人提到了你", titleJa: "あなたがメンションされました", description: "เชิดชา ได้พูดอ้างถึงคุณในการตอบกลับ", descriptionEn: "Cherdcha mentioned you in a reply", timestamp: new Date(Date.now() - 25 * 60000), read: false, actionUrl: "/forum/reply/456", icon: "💬" },
          { id: "3", triggerId: "bestanswer", title: "คำตอบของคุณได้รับการยอมรับ", titleEn: "Your answer was marked best", titleZh: "你的回答被标为最佳", titleJa: "あなたの回答がベストアンサーに選ばれました", description: "คำตอบของคุณต่อ 'วิธีปลูกกุหลาบ' ได้รับการยอมรับจากผู้ถาม", descriptionEn: "Your answer to 'How to grow roses' was marked as best answer", timestamp: new Date(Date.now() - 2 * 60 * 60000), read: false, actionUrl: "/forum/reply/789", icon: "✅" },
          { id: "4", triggerId: "trending", title: "หัวข้อ Trending", titleEn: "Trending topic", titleZh: "热门主题", titleJa: "トレンドトピック", description: "หัวข้อ 'ปลูกผักที่บ้าน' กำลังเทรนด์", descriptionEn: "Topic 'Home vegetable gardening' is trending", timestamp: new Date(Date.now() - 4 * 60 * 60000), read: true, actionUrl: "/forum/topic/999", icon: "🔥" },
          { id: "5", triggerId: "questcomplete", title: "ภารกิจสำเร็จ!", titleEn: "Quest completed!", titleZh: "任务完成！", titleJa: "クエスト完了！", description: "คุณสำเร็จภารกิจ 'ตอบกระทู้ 5 ครั้ง' +25 คะแนน", descriptionEn: "You completed quest '5 replies' +25 points", timestamp: new Date(Date.now() - 6 * 60 * 60000), read: true, icon: "⚡" },
          { id: "6", triggerId: "eventupdate", title: "อัปเดตเหตุการณ์", titleEn: "Event update", titleZh: "活动更新", titleJa: "イベント更新", description: "เหตุการณ์ 'สัปดาห์คะแนนสองเท่า' เริ่มต้นแล้ว", descriptionEn: "Event 'Double Points Weekend' has started", timestamp: new Date(Date.now() - 24 * 60 * 60000), read: true, icon: "🎉" },
        ];

  const [displayedNotifications, setDisplayedNotifications] = useState(mockNotifications);

  const unreadCount = useMemo(() => displayedNotifications.filter((n) => !n.read).length, [displayedNotifications]);

  const handleMarkAsRead = (id: string) => {
    setDisplayedNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    onMarkAsRead?.(id);
  };

  const handleDismiss = (id: string) => {
    setDisplayedNotifications((prev) => prev.filter((n) => n.id !== id));
    onDismiss?.(id);
  };

  const handleAction = (notification: Notification) => {
    handleMarkAsRead(notification.id);
    onAction?.(notification);
  };

  const handleMarkAllAsRead = () => {
    setDisplayedNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const getTitle = (n: Notification) => {
    if (language === "zh" && n.titleZh) return n.titleZh;
    if (language === "ja" && n.titleJa) return n.titleJa;
    if (language !== "th" && n.titleEn) return n.titleEn;
    return n.title;
  };

  const getDesc = (n: Notification) => {
    if (language === "zh" && n.descriptionZh) return n.descriptionZh;
    if (language === "ja" && n.descriptionJa) return n.descriptionJa;
    if (language !== "th" && n.descriptionEn) return n.descriptionEn;
    return n.description;
  };

  return (
    <div className="space-y-4">
      <Card className="border-border/50 shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Bell className="h-6 w-6 text-blue-500" />
                {unreadCount > 0 && (
                  <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center bg-red-500 text-xs">{unreadCount > 9 ? "9+" : unreadCount}</Badge>
                )}
              </div>
              <div>
                <CardTitle>{t4(language, "การแจ้งเตือน", "Notifications", "通知", "通知")}</CardTitle>
                <p className="text-xs text-muted-foreground">
                  {unreadCount > 0
                    ? t4(language, `${unreadCount} ข้อความใหม่`, `${unreadCount} new`, `${unreadCount} 条新消息`, `${unreadCount} 件の新着`)
                    : t4(language, "ทั้งหมดอ่านแล้ว", "All caught up", "全部已读", "すべて既読")}
                </p>
              </div>
            </div>
            {unreadCount > 0 && (
              <Button variant="outline" size="sm" onClick={handleMarkAllAsRead}>
                {t4(language, "อ่านทั้งหมด", "Mark all read", "全部已读", "すべて既読にする")}
              </Button>
            )}
          </div>
        </CardHeader>
      </Card>

      {displayedNotifications.length > 0 ? (
        <ScrollArea className="h-[600px] rounded-lg border border-border/50 p-0">
          <div className="space-y-2 p-4">
            {displayedNotifications.map((notification) => (
              <div key={notification.id} className={cn("p-4 rounded-lg border-2 transition-all duration-300 group", getNotificationColor(notification.triggerId), !notification.read && "ring-1 ring-offset-2 ring-blue-400 bg-opacity-70")}>
                <div className="flex items-start gap-3">
                  <div className="mt-1 flex-shrink-0">{getNotificationIcon(notification.triggerId)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-sm">{getTitle(notification)}</p>
                        {!notification.read && <span className="inline-block mt-1 h-2 w-2 rounded-full bg-blue-500/70" />}
                      </div>
                      <Badge variant="outline" className="text-xs flex-shrink-0">{formatTime(notification.timestamp, language)}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{getDesc(notification)}</p>
                    <div className="flex gap-2 mt-3">
                      {notification.actionUrl && (
                        <Button size="sm" variant="default" onClick={() => handleAction(notification)} className="text-xs">
                          {t4(language, "ดู", "View", "查看", "表示")}
                        </Button>
                      )}
                      {!notification.read && (
                        <Button size="sm" variant="ghost" onClick={() => handleMarkAsRead(notification.id)} className="text-xs">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          {t4(language, "อ่าน", "Mark read", "已读", "既読")}
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" onClick={() => handleDismiss(notification.id)} className="text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  {!notification.read && <div className="h-2 w-2 rounded-full bg-blue-500 flex-shrink-0 mt-2" />}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      ) : (
        <Card className="border-border/50 p-8">
          <div className="text-center space-y-3">
            <div className="flex justify-center"><Bell className="h-12 w-12 text-muted-foreground/30" /></div>
            <p className="text-muted-foreground">{t4(language, "ไม่มีการแจ้งเตือน", "No notifications", "没有通知", "通知はありません")}</p>
            <p className="text-xs text-muted-foreground">{t4(language, "กิจกรรมใหม่จะปรากฏที่นี่", "New activities will appear here", "新活动将在此显示", "新しいアクティビティがここに表示されます")}</p>
          </div>
        </Card>
      )}

      <Card className="border-border/50 bg-blue-50/50 dark:bg-blue-950/20">
        <CardContent className="pt-4">
          <p className="text-xs text-muted-foreground">
            <strong>{t4(language, "หมายเหตุ:", "Note:", "注意:", "注:")}</strong>{" "}
            {t4(language, "คุณสามารถปรับแต่งการตั้งค่าการแจ้งเตือนในหน้าการตั้งค่า", "You can customize notification settings in Settings page", "你可以在设置页面自定义通知设置", "設定ページで通知設定をカスタマイズできます")}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotificationCenter;
