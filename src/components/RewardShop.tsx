import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { REWARD_SHOP } from "@/lib/engagementSystem";
import { Gift, Coins, ShoppingBag, Check, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { t4 } from "@/lib/i18n";

interface UserReward {
  id: string;
  rewardId: string;
  claimedAt: Date;
  status: "pending" | "processing" | "completed" | "expired";
}

interface RewardShopProps {
  language: string;
  userPoints?: number;
  userRewards?: UserReward[];
  onRedeem?: (rewardId: string) => void;
}

const RewardShop = ({
  language,
  userPoints = 2500,
  userRewards = [],
  onRedeem,
}: RewardShopProps) => {
  const [selectedTab, setSelectedTab] = useState("available");
  const [claimedRewards, setClaimedRewards] = useState<string[]>([]);
  const [redeemingReward, setRedeemingReward] = useState<string | null>(null);

  const handleRedeem = (rewardId: string) => {
    const reward = REWARD_SHOP[rewardId];
    if (!reward || userPoints < reward.cost) return;
    setRedeemingReward(rewardId);
    setTimeout(() => {
      setClaimedRewards((prev) => [...prev, rewardId]);
      setRedeemingReward(null);
      onRedeem?.(rewardId);
    }, 1500);
  };

  const availableRewards = Object.entries(REWARD_SHOP).filter(([id]) => !claimedRewards.includes(id));
  const claimedRewardsData = Object.entries(REWARD_SHOP).filter(([id]) => claimedRewards.includes(id));

  const totalSpent = useMemo(() => claimedRewards.reduce((sum, id) => sum + (REWARD_SHOP[id]?.cost || 0), 0), [claimedRewards]);

  const RewardCard = ({ reward, rewardId, isClaimed = false }: { reward: typeof REWARD_SHOP[keyof typeof REWARD_SHOP]; rewardId: string; isClaimed?: boolean }) => {
    const canAfford = userPoints >= reward.cost;
    const isRedeeming = redeemingReward === rewardId;

    return (
      <Card className={cn("overflow-hidden transition-all duration-300 hover:shadow-lg", isClaimed && "opacity-75 border-green-200 bg-green-50/30 dark:bg-green-950/20", !isClaimed && !canAfford && "opacity-60 cursor-not-allowed")}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="text-3xl">{reward.icon}</div>
            {isClaimed && (
              <Badge className="bg-green-600 text-white"><Check className="h-3 w-3 mr-1" />{t4(language, "สำเร็จ", "Redeemed", "已兑换", "交換済")}</Badge>
            )}
            {!canAfford && !isClaimed && (
              <Badge variant="destructive">{t4(language, "ไม่พอ", "Insufficient", "不足", "不足")}</Badge>
            )}
          </div>
          <h3 className="font-semibold text-sm">{language === "th" ? reward.name : reward.nameEn}</h3>
          <p className="text-xs text-muted-foreground mt-1 mb-3 line-clamp-2">{language === "th" ? reward.description : reward.descriptionEn}</p>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1">
              <Coins className="h-4 w-4 text-yellow-600" />
              <span className="font-bold text-sm">{reward.cost}</span>
              <span className="text-xs text-muted-foreground">{t4(language, "คะแนน", "pts", "分", "pt")}</span>
            </div>
            <Badge variant="outline" className="text-xs">{t4(language, "คงเหลือ:", "Stock:", "库存:", "在庫:")} {reward.stock}</Badge>
          </div>
          <Button onClick={() => handleRedeem(rewardId)} disabled={!canAfford || isClaimed || reward.stock <= 0 || isRedeeming} className="w-full" variant={isClaimed ? "outline" : "default"}>
            {isRedeeming ? (
              <><span className="animate-spin inline-block mr-2">⟳</span>{t4(language, "กำลังประมวลผล...", "Processing...", "处理中...", "処理中...")}</>
            ) : isClaimed ? (
              <><Check className="h-4 w-4 mr-2" />{t4(language, "แลกแล้ว", "Redeemed", "已兑换", "交換済")}</>
            ) : canAfford ? (
              <><Gift className="h-4 w-4 mr-2" />{t4(language, "แลกรับ", "Redeem", "兑换", "交換")}</>
            ) : (
              <><AlertCircle className="h-4 w-4 mr-2" />{t4(language, "ไม่พอคะแนน", "Not enough points", "积分不足", "ポイント不足")}</>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Card className="border-border/50 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">{t4(language, "คะแนนของคุณ", "Your Points", "你的积分", "あなたのポイント")}</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{userPoints.toLocaleString()}</p>
              </div>
              <Coins className="h-8 w-8 text-blue-500/40" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">{t4(language, "แลกแล้ว", "Redeemed", "已兑换", "交換済")}</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{claimedRewards.length}</p>
              </div>
              <Check className="h-8 w-8 text-green-500/40" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/20 dark:to-purple-900/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">{t4(language, "ใช้ไป", "Spent", "已使用", "使用済")}</p>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{totalSpent.toLocaleString()}</p>
              </div>
              <ShoppingBag className="h-8 w-8 text-purple-500/40" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/20 dark:to-amber-900/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">{t4(language, "เหลือ", "Remaining", "剩余", "残高")}</p>
                <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{(userPoints - totalSpent).toLocaleString()}</p>
              </div>
              <Gift className="h-8 w-8 text-amber-500/40" />
            </div>
          </CardContent>
        </Card>
      </div>

      {userPoints < 100 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {t4(language, "คะแนนของคุณไม่เพียงพอสำหรับรางวัลใด ๆ เพิ่มเติมคะแนนโดยการทำกิจกรรมในเวบบอร์ด", "You don't have enough points for any reward. Earn more points by engaging in the forum", "你的积分不足以兑换任何奖励。通过参与论坛赚取更多积分", "報酬に交換するためのポイントが不足しています。フォーラムで活動してポイントを獲得しましょう")}
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="available" className="w-full" onValueChange={setSelectedTab}>
        <TabsList className="w-full grid grid-cols-2">
          <TabsTrigger value="available" className="gap-1.5">
            <ShoppingBag className="h-4 w-4" />
            {t4(language, "ความพร้อม", "Available", "可用", "利用可能")}
            <Badge variant="secondary" className="ml-1">{availableRewards.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="redeemed" className="gap-1.5">
            <Check className="h-4 w-4" />
            {t4(language, "แลกแล้ว", "Redeemed", "已兑换", "交換済")}
            <Badge variant="secondary" className="ml-1">{claimedRewardsData.length}</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="available" className="mt-4">
          {availableRewards.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {availableRewards.map(([id, reward]) => (<RewardCard key={id} reward={reward} rewardId={id} />))}
            </div>
          ) : (
            <Card className="border-border/50 p-8">
              <div className="text-center space-y-3">
                <ShoppingBag className="h-12 w-12 text-muted-foreground/30 mx-auto" />
                <p className="text-muted-foreground">{t4(language, "ไม่มีรางวัลที่พร้อม", "No available rewards", "没有可用的奖励", "利用可能な報酬はありません")}</p>
              </div>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="redeemed" className="mt-4">
          {claimedRewardsData.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {claimedRewardsData.map(([id, reward]) => (<RewardCard key={id} reward={reward} rewardId={id} isClaimed />))}
            </div>
          ) : (
            <Card className="border-border/50 p-8">
              <div className="text-center space-y-3">
                <Gift className="h-12 w-12 text-muted-foreground/30 mx-auto" />
                <p className="text-muted-foreground">{t4(language, "ยังไม่มีการแลกรับรางวัล", "No redeemed rewards yet", "还没有兑换过奖励", "まだ報酬を交換していません")}</p>
                <p className="text-xs text-muted-foreground">{t4(language, "เริ่มต้นการสะสมคะแนนและแลกสินค้า", "Start earning points and redeem rewards", "开始赚取积分并兑换奖励", "ポイントを獲得して報酬を交換しましょう")}</p>
              </div>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <Card className="border-border/50 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/20 dark:to-blue-900/20">
        <CardHeader>
          <CardTitle className="text-base">💡 {t4(language, "วิธีเก็บคะแนน", "How to Earn Points", "如何赚取积分", "ポイントの獲得方法")}</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-1.5">
          <p>• {t4(language, "สร้างหัวข้อใหม่: +10 คะแนน", "Create a topic: +10 points", "创建主题：+10分", "トピック作成：+10pt")}</p>
          <p>• {t4(language, "ตอบกระทู้: +5 คะแนน", "Reply to topic: +5 points", "回复帖子：+5分", "返信：+5pt")}</p>
          <p>• {t4(language, "รีวิวร้าน: +8 คะแนน", "Write a review: +8 points", "写评论：+8分", "レビュー投稿：+8pt")}</p>
          <p>• {t4(language, "ชื่นชอบ: +15 คะแนน", "Receive like: +15 points", "获得点赞：+15分", "いいね獲得：+15pt")}</p>
          <p>• {t4(language, "คำตอบดีเยี่ยม: +50 คะแนน", "Best answer: +50 points", "最佳回答：+50分", "ベストアンサー：+50pt")}</p>
          <p>• {t4(language, "สำเร็จภารกิจ: +20 คะแนน", "Complete quest: +20 points", "完成任务：+20分", "クエスト完了：+20pt")}</p>
        </CardContent>
      </Card>

      <Card className="border-border/50 bg-amber-50/50 dark:bg-amber-950/20">
        <CardContent className="pt-4">
          <p className="text-xs text-muted-foreground">
            <strong>{t4(language, "นโยบาย:", "Policy:", "政策:", "ポリシー:")}</strong>{" "}
            {t4(language, "รางวัลจะถูกสงมอบภายใน 7 วัน ไม่สามารถยกเลิก ไม่อนุญาตให้แปลงเป็นเงินสด", "Rewards are delivered within 7 days. Cannot be cancelled or exchanged for cash.", "奖励将在7天内发放。不可取消或兑换现金。", "報酬は7日以内に届きます。キャンセルや現金への交換はできません。")}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default RewardShop;
