import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { REWARD_SHOP } from "@/lib/engagementSystem";
import { Gift, Coins, ShoppingBag, Check, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

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

  const availableRewards = Object.entries(REWARD_SHOP).filter(
    ([id]) => !claimedRewards.includes(id)
  );

  const claimedRewardsData = Object.entries(REWARD_SHOP).filter(([id]) =>
    claimedRewards.includes(id)
  );

  const totalSpent = useMemo(() => {
    return claimedRewards.reduce(
      (sum, id) => sum + (REWARD_SHOP[id]?.cost || 0),
      0
    );
  }, [claimedRewards]);

  const RewardCard = ({
    reward,
    rewardId,
    isClaimed = false,
  }: {
    reward: typeof REWARD_SHOP[keyof typeof REWARD_SHOP];
    rewardId: string;
    isClaimed?: boolean;
  }) => {
    const canAfford = userPoints >= reward.cost;
    const isRedeeming = redeemingReward === rewardId;

    return (
      <Card
        className={cn(
          "overflow-hidden transition-all duration-300 hover:shadow-lg",
          isClaimed && "opacity-75 border-green-200 bg-green-50/30 dark:bg-green-950/20",
          !isClaimed && !canAfford && "opacity-60 cursor-not-allowed"
        )}
      >
        <CardContent className="p-4">
          {/* Header with Badge */}
          <div className="flex items-start justify-between mb-3">
            <div className="text-3xl">{reward.icon}</div>
            {isClaimed && (
              <Badge className="bg-green-600 text-white">
                <Check className="h-3 w-3 mr-1" />
                {language === "th" ? "สำเร็จ" : "Redeemed"}
              </Badge>
            )}
            {!canAfford && !isClaimed && (
              <Badge variant="destructive">
                {language === "th" ? "ไม่พอ" : "Insufficient"}
              </Badge>
            )}
          </div>

          {/* Title */}
          <h3 className="font-semibold text-sm">
            {language === "th" ? reward.name : reward.nameEn}
          </h3>

          {/* Description */}
          <p className="text-xs text-muted-foreground mt-1 mb-3 line-clamp-2">
            {language === "th" ? reward.description : reward.descriptionEn}
          </p>

          {/* Cost and Stock */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1">
              <Coins className="h-4 w-4 text-yellow-600" />
              <span className="font-bold text-sm">{reward.cost}</span>
              <span className="text-xs text-muted-foreground">
                {language === "th" ? "คะแนน" : "pts"}
              </span>
            </div>
            <Badge variant="outline" className="text-xs">
              {language === "th" ? "คงเหลือ:" : "Stock:"} {reward.stock}
            </Badge>
          </div>

          {/* Redeem Button */}
          <Button
            onClick={() => handleRedeem(rewardId)}
            disabled={!canAfford || isClaimed || reward.stock <= 0 || isRedeeming}
            className="w-full"
            variant={isClaimed ? "outline" : "default"}
          >
            {isRedeeming ? (
              <>
                <span className="animate-spin inline-block mr-2">⟳</span>
                {language === "th" ? "กำลังประมวลผล..." : "Processing..."}
              </>
            ) : isClaimed ? (
              <>
                <Check className="h-4 w-4 mr-2" />
                {language === "th" ? "แลกแล้ว" : "Redeemed"}
              </>
            ) : canAfford ? (
              <>
                <Gift className="h-4 w-4 mr-2" />
                {language === "th" ? "แลกรับ" : "Redeem"}
              </>
            ) : (
              <>
                <AlertCircle className="h-4 w-4 mr-2" />
                {language === "th" ? "ไม่พอคะแนน" : "Not enough points"}
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Card className="border-border/50 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">
                  {language === "th" ? "คะแนนของคุณ" : "Your Points"}
                </p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {userPoints.toLocaleString()}
                </p>
              </div>
              <Coins className="h-8 w-8 text-blue-500/40" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">
                  {language === "th" ? "แลกแล้ว" : "Redeemed"}
                </p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {claimedRewards.length}
                </p>
              </div>
              <Check className="h-8 w-8 text-green-500/40" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/20 dark:to-purple-900/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">
                  {language === "th" ? "ใช้ไป" : "Spent"}
                </p>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {totalSpent.toLocaleString()}
                </p>
              </div>
              <ShoppingBag className="h-8 w-8 text-purple-500/40" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/20 dark:to-amber-900/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">
                  {language === "th" ? "เหลือ" : "Remaining"}
                </p>
                <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                  {(userPoints - totalSpent).toLocaleString()}
                </p>
              </div>
              <Gift className="h-8 w-8 text-amber-500/40" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alert for Insufficient Points */}
      {userPoints < 100 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {language === "th"
              ? "คะแนนของคุณไม่เพียงพอสำหรับรางวัลใด ๆ เพิ่มเติมคะแนนโดยการทำกิจกรรมในเวบบอร์ด"
              : "You don't have enough points for any reward. Earn more points by engaging in the forum"}
          </AlertDescription>
        </Alert>
      )}

      {/* Tabs */}
      <Tabs defaultValue="available" className="w-full" onValueChange={setSelectedTab}>
        <TabsList className="w-full grid grid-cols-2">
          <TabsTrigger value="available" className="gap-1.5">
            <ShoppingBag className="h-4 w-4" />
            {language === "th" ? "ความพร้อม" : "Available"}
            <Badge variant="secondary" className="ml-1">
              {availableRewards.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="redeemed" className="gap-1.5">
            <Check className="h-4 w-4" />
            {language === "th" ? "แลกแล้ว" : "Redeemed"}
            <Badge variant="secondary" className="ml-1">
              {claimedRewardsData.length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        {/* Available Rewards */}
        <TabsContent value="available" className="mt-4">
          {availableRewards.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {availableRewards.map(([id, reward]) => (
                <RewardCard key={id} reward={reward} rewardId={id} />
              ))}
            </div>
          ) : (
            <Card className="border-border/50 p-8">
              <div className="text-center space-y-3">
                <ShoppingBag className="h-12 w-12 text-muted-foreground/30 mx-auto" />
                <p className="text-muted-foreground">
                  {language === "th" ? "ไม่มีรางวัลที่พร้อม" : "No available rewards"}
                </p>
              </div>
            </Card>
          )}
        </TabsContent>

        {/* Redeemed Rewards */}
        <TabsContent value="redeemed" className="mt-4">
          {claimedRewardsData.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {claimedRewardsData.map(([id, reward]) => (
                <RewardCard key={id} reward={reward} rewardId={id} isClaimed />
              ))}
            </div>
          ) : (
            <Card className="border-border/50 p-8">
              <div className="text-center space-y-3">
                <Gift className="h-12 w-12 text-muted-foreground/30 mx-auto" />
                <p className="text-muted-foreground">
                  {language === "th" ? "ยังไม่มีการแลกรับรางวัล" : "No redeemed rewards yet"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {language === "th"
                    ? "เริ่มต้นการสะสมคะแนนและแลกสินค้า"
                    : "Start earning points and redeem rewards"}
                </p>
              </div>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* How to Earn Points */}
      <Card className="border-border/50 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/20 dark:to-blue-900/20">
        <CardHeader>
          <CardTitle className="text-base">
            💡 {language === "th" ? "วิธีเก็บคะแนน" : "How to Earn Points"}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-1.5">
          <p>• {language === "th" ? "สร้างหัวข้อใหม่: +10 คะแนน" : "Create a topic: +10 points"}</p>
          <p>• {language === "th" ? "ตอบกระทู้: +5 คะแนน" : "Reply to topic: +5 points"}</p>
          <p>• {language === "th" ? "รีวิวร้าน: +8 คะแนน" : "Write a review: +8 points"}</p>
          <p>• {language === "th" ? "ชื่นชอบ: +15 คะแนน" : "Receive like: +15 points"}</p>
          <p>• {language === "th" ? "คำตอบดีเยี่ยม: +50 คะแนน" : "Best answer: +50 points"}</p>
          <p>• {language === "th" ? "สำเร็จภารกิจ: +20 คะแนน" : "Complete quest: +20 points"}</p>
        </CardContent>
      </Card>

      {/* Redemption Policy */}
      <Card className="border-border/50 bg-amber-50/50 dark:bg-amber-950/20">
        <CardContent className="pt-4">
          <p className="text-xs text-muted-foreground">
            <strong>{language === "th" ? "นโยบาย:" : "Policy:"}</strong>{" "}
            {language === "th"
              ? "รางวัลจะถูกสงมอบภายใน 7 วัน ไม่สามารถยกเลิก ไม่อนุญาตให้แปลงเป็นเงินสด"
              : "Rewards are delivered within 7 days. Cannot be cancelled or exchanged for cash."}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default RewardShop;
