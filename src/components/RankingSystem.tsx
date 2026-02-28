import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  RANK_PERKS,
  RANK_PATH_CHANGE_COOLDOWN_DAYS,
  RANK_PATH_OPTIONS,
  RANK_PATH_UNLOCK_POINTS,
  RANK_PATH_UNLOCK_QUESTS,
  getRankById,
  getProgressToNextRank,
  getRankFromPoints,
  getRankTiersByPath,
  getUnlockedPerks,
  normalizeRankPath,
  type RankPath,
} from "@/lib/pointSystem";
import { ArrowUp, Lock, Unlock, Sparkles, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import sweetAlert from "@/lib/sweetAlert";

interface RankingSystemProps {
  points: number;
  language: string;
  userId?: string;
}

const RankingSystem = ({ points, language, userId }: RankingSystemProps) => {
  const [selectedPath, setSelectedPath] = useState<RankPath>("chicken");
  const [previewPath, setPreviewPath] = useState<RankPath>("chicken");
  const [lastChangedAt, setLastChangedAt] = useState<string | null>(null);
  const [isUpdatingPath, setIsUpdatingPath] = useState(false);
  const [selectedRankTierId, setSelectedRankTierId] = useState<number | null>(null);
  const [previewRankTierId, setPreviewRankTierId] = useState<number | null>(null);
  const [isUpdatingRankTier, setIsUpdatingRankTier] = useState(false);
  const [completedQuestCount, setCompletedQuestCount] = useState(0);

  const hasEnoughPoints = points >= RANK_PATH_UNLOCK_POINTS;
  const hasEnoughQuests = completedQuestCount >= RANK_PATH_UNLOCK_QUESTS;
  const canChoosePath = hasEnoughPoints && hasEnoughQuests;
  const effectivePath: RankPath = canChoosePath ? previewPath : "chicken";
  const isPreviewingDifferentPath = previewPath !== selectedPath;

  const getLocalPathKey = (uid: string) => `rank-path-${uid}`;
  const getLocalChangedAtKey = (uid: string) => `rank-path-changed-at-${uid}`;
  const getLocalRankTierKey = (uid: string) => `rank-tier-${uid}`;

  const getNextAllowedDate = (changedAt: string) => {
    const date = new Date(changedAt);
    date.setDate(date.getDate() + RANK_PATH_CHANGE_COOLDOWN_DAYS);
    return date;
  };

  const getRemainingCooldownDays = (changedAt: string) => {
    const now = new Date();
    const nextAllowed = getNextAllowedDate(changedAt);
    const diffMs = nextAllowed.getTime() - now.getTime();
    return diffMs > 0 ? Math.ceil(diffMs / (1000 * 60 * 60 * 24)) : 0;
  };

  useEffect(() => {
    if (!userId) return;

    const loadPath = async () => {
      const [
        profileResult,
        forumLikesResult,
        reviewLikesResult,
        forumRepliesResult,
        reviewRepliesResult,
        reviewsResult,
      ] = await Promise.all([
        supabase
          .from("profiles")
          .select("rank_path, rank_path_changed_at, rank_display_tier_id")
          .eq("id", userId)
          .maybeSingle(),
        supabase.from("forum_likes").select("id", { count: "exact", head: true }).eq("user_id", userId),
        supabase.from("review_likes").select("id", { count: "exact", head: true }).eq("user_id", userId),
        supabase.from("forum_replies").select("id", { count: "exact", head: true }).eq("user_id", userId),
        supabase.from("review_replies").select("id", { count: "exact", head: true }).eq("user_id", userId),
        supabase.from("reviews").select("id", { count: "exact", head: true }).eq("user_id", userId),
      ]);

      const likedCount = (forumLikesResult.count || 0) + (reviewLikesResult.count || 0);
      const commentCount = (forumRepliesResult.count || 0) + (reviewRepliesResult.count || 0);
      const reviewCount = reviewsResult.count || 0;
      const questsDone = Number(likedCount > 0) + Number(commentCount > 0) + Number(reviewCount > 0);
      setCompletedQuestCount(questsDone);

      const { data, error } = profileResult;

      if (!error && data) {
        const resolved = normalizeRankPath((data as any).rank_path);
        const changedAt = (data as any).rank_path_changed_at || null;
        const rankTierId = Number((data as any).rank_display_tier_id) || null;
        setSelectedPath(resolved);
        setPreviewPath(resolved);
        setLastChangedAt(changedAt);
        setSelectedRankTierId(rankTierId);
        setPreviewRankTierId(rankTierId);
        localStorage.setItem(getLocalPathKey(userId), resolved);
        if (changedAt) {
          localStorage.setItem(getLocalChangedAtKey(userId), changedAt);
        }
        if (rankTierId) {
          localStorage.setItem(getLocalRankTierKey(userId), String(rankTierId));
        }
        return;
      }

      const localPath = normalizeRankPath(localStorage.getItem(getLocalPathKey(userId)));
      const localChangedAt = localStorage.getItem(getLocalChangedAtKey(userId));
      const localRankTierRaw = localStorage.getItem(getLocalRankTierKey(userId));
      const localRankTier = localRankTierRaw ? Number(localRankTierRaw) : null;
      setSelectedPath(localPath);
      setLastChangedAt(localChangedAt || null);
      setPreviewPath(localPath);
      setSelectedRankTierId(localRankTier && Number.isFinite(localRankTier) ? localRankTier : null);
      setPreviewRankTierId(localRankTier && Number.isFinite(localRankTier) ? localRankTier : null);
    };

    loadPath();
  }, [userId]);

  useEffect(() => {
    if (canChoosePath) return;
    setPreviewPath("chicken");
    setSelectedPath("chicken");
  }, [canChoosePath]);

  const rankTiers = useMemo(() => getRankTiersByPath(effectivePath), [effectivePath]);
  const affiliatedRankTiers = useMemo(() => getRankTiersByPath(selectedPath), [selectedPath]);

  const highestRank = useMemo(() => {
    return getRankFromPoints(points, effectivePath);
  }, [points, effectivePath]);

  const affiliatedHighestRank = useMemo(() => {
    return getRankFromPoints(points, selectedPath);
  }, [points, selectedPath]);

  useEffect(() => {
    const maxUnlockedTierId = affiliatedHighestRank.id;
    const normalizeTierId = (tierId: number | null) => {
      if (!tierId || !Number.isFinite(tierId)) return maxUnlockedTierId;
      return Math.max(1, Math.min(maxUnlockedTierId, Math.floor(tierId)));
    };

    setSelectedRankTierId((prev) => normalizeTierId(prev));
    setPreviewRankTierId((prev) => normalizeTierId(prev));
  }, [affiliatedHighestRank.id]);

  const handlePreviewPath = (path: RankPath) => {
    if (isUpdatingPath) return;
    setPreviewPath(path);
  };

  const handleSavePath = async () => {
    if (isUpdatingPath || previewPath === selectedPath) return;
    if (!canChoosePath) {
      sweetAlert.warning(
        language === "th"
          ? `ต้องมีอย่างน้อย ${RANK_PATH_UNLOCK_POINTS} คะแนน และทำเควส ${RANK_PATH_UNLOCK_QUESTS} อย่าง (ไลก์/คอมเมนต์/รีวิว) เพื่อเปลี่ยนสาย`
          : `You need at least ${RANK_PATH_UNLOCK_POINTS} points and ${RANK_PATH_UNLOCK_QUESTS} quests (Like/Comment/Review) to change path`
      );
      return;
    }

    if (!userId) {
      setSelectedPath(previewPath);
      return;
    }

    if (lastChangedAt) {
      const remainingDays = getRemainingCooldownDays(lastChangedAt);
      if (remainingDays > 0) {
        const nextDate = getNextAllowedDate(lastChangedAt).toLocaleDateString(
          language === "th" ? "th-TH" : "en-US"
        );
        sweetAlert.warning(
          language === "th"
            ? `เปลี่ยนสายได้อีกครั้งในอีก ${remainingDays} วัน (ประมาณวันที่ ${nextDate})`
            : `You can change rank path again in ${remainingDays} day(s) (around ${nextDate})`
        );
        return;
      }
    }

    setIsUpdatingPath(true);
    const previousPath = selectedPath;
    const previousChangedAt = lastChangedAt;
    const changedAtNow = new Date().toISOString();
    setSelectedPath(previewPath);
    setLastChangedAt(changedAtNow);
    localStorage.setItem(getLocalPathKey(userId), previewPath);
    localStorage.setItem(getLocalChangedAtKey(userId), changedAtNow);

    const { error } = await supabase
      .from("profiles")
      .update({ rank_path: previewPath, rank_path_changed_at: changedAtNow, updated_at: changedAtNow } as any)
      .eq("id", userId);

    if (error) {
      if (error.code === "42703") {
        sweetAlert.warning(
          language === "th"
            ? "บันทึกสายยศเฉพาะเครื่องนี้ชั่วคราว (migration ยังไม่พร้อม)"
            : "Rank path saved locally only (rank_path migration is pending)"
        );
      } else if (error.code === "42501") {
        sweetAlert.warning(
          language === "th"
            ? "บันทึกเฉพาะเครื่องนี้ชั่วคราว (ยังไม่มีสิทธิ์บันทึกลงฐานข้อมูล)"
            : "No permission to save rank path in database (RLS)"
        );
      } else {
        setSelectedPath(previousPath);
        setLastChangedAt(previousChangedAt || null);
        localStorage.setItem(getLocalPathKey(userId), previousPath);
        if (previousChangedAt) {
          localStorage.setItem(getLocalChangedAtKey(userId), previousChangedAt);
        } else {
          localStorage.removeItem(getLocalChangedAtKey(userId));
        }
        sweetAlert.error(language === "th" ? "บันทึกสายยศไม่สำเร็จ" : "Failed to save rank path");
      }
      setIsUpdatingPath(false);
      return;
    }

    sweetAlert.success(language === "th" ? "เปลี่ยนสายยศสำเร็จ" : "Rank path updated");
    setIsUpdatingPath(false);
  };

  const currentRank = useMemo(() => {
    if (isPreviewingDifferentPath) {
      return getRankFromPoints(points, effectivePath);
    }
    return getRankById(previewRankTierId || affiliatedHighestRank.id, selectedPath);
  }, [isPreviewingDifferentPath, points, effectivePath, previewRankTierId, affiliatedHighestRank.id, selectedPath]);

  const nextRank = useMemo(() => {
    return rankTiers.find((tier) => tier.id === highestRank.id + 1);
  }, [highestRank.id, rankTiers]);

  const progress = useMemo(() => {
    return getProgressToNextRank(points, effectivePath);
  }, [points, effectivePath]);

  const unlockedPerks = useMemo(() => {
    return getUnlockedPerks(highestRank.id, effectivePath);
  }, [highestRank.id, effectivePath]);

  const currentPathMeta = RANK_PATH_OPTIONS.find((option) => option.id === selectedPath) || RANK_PATH_OPTIONS[0];
  const previewPathMeta = RANK_PATH_OPTIONS.find((option) => option.id === previewPath) || RANK_PATH_OPTIONS[0];
  const isTopRank = currentRank.id === rankTiers[rankTiers.length - 1]?.id;

  const handlePreviewRankTier = (tierId: number) => {
    if (isUpdatingRankTier) return;
    if (isPreviewingDifferentPath) return;
    const maxUnlockedTierId = affiliatedHighestRank.id;
    const clampedTier = Math.max(1, Math.min(maxUnlockedTierId, tierId));
    setPreviewRankTierId(clampedTier);
  };

  const handleSaveRankTier = async () => {
    if (isUpdatingRankTier) return;
    if (!previewRankTierId || previewRankTierId === selectedRankTierId) return;

    if (isPreviewingDifferentPath) {
      sweetAlert.warning(
        language === "th"
          ? "เลือกยศย่อยได้เฉพาะสายที่สังกัดอยู่ตอนนี้เท่านั้น กรุณาบันทึกการเปลี่ยนสายก่อน"
          : "Lower-rank selection is available only in your current affiliated path. Save path change first."
      );
      return;
    }

    const maxUnlockedTierId = affiliatedHighestRank.id;
    const clampedTier = Math.max(1, Math.min(maxUnlockedTierId, previewRankTierId));

    if (!userId) {
      setSelectedRankTierId(clampedTier);
      return;
    }

    setIsUpdatingRankTier(true);
    const previousTierId = selectedRankTierId || maxUnlockedTierId;
    setSelectedRankTierId(clampedTier);
    localStorage.setItem(getLocalRankTierKey(userId), String(clampedTier));

    const { error } = await supabase
      .from("profiles")
      .update({ rank_display_tier_id: clampedTier, updated_at: new Date().toISOString() } as any)
      .eq("id", userId);

    if (error) {
      if (error.code === "42703") {
        sweetAlert.warning(
          language === "th"
            ? "บันทึกยศที่ใช้งานเฉพาะเครื่องนี้ชั่วคราว (migration ยังไม่พร้อม)"
            : "Active rank saved locally only (migration is pending)"
        );
      } else if (error.code === "42501") {
        sweetAlert.warning(
          language === "th"
            ? "บันทึกยศเฉพาะเครื่องนี้ชั่วคราว (ยังไม่มีสิทธิ์บันทึกลงฐานข้อมูล)"
            : "No permission to save active rank in database (RLS)"
        );
      } else {
        setSelectedRankTierId(previousTierId);
        setPreviewRankTierId(previousTierId);
        localStorage.setItem(getLocalRankTierKey(userId), String(previousTierId));
        sweetAlert.error(language === "th" ? "บันทึกยศที่ใช้งานไม่สำเร็จ" : "Failed to save active rank");
      }
      setIsUpdatingRankTier(false);
      return;
    }

    sweetAlert.success(language === "th" ? "บันทึกยศที่ใช้งานแล้ว" : "Active rank updated");
    setIsUpdatingRankTier(false);
  };

  return (
    <div className="space-y-6">
      {/* Main Rank Card */}
      <Card className="border-0 shadow-lg overflow-hidden bg-white dark:bg-slate-900">
        {/* Blue Header */}
        <div className="h-20 bg-gradient-to-r from-blue-500 via-blue-400 to-cyan-400 relative overflow-hidden flex items-center justify-center">
          {isTopRank && <Sparkles className="h-8 w-8 text-white/60 absolute top-2 right-4 animate-pulse" />}
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
            {isTopRank && <Sparkles className="h-8 w-8 text-yellow-500 animate-pulse" />}
          </div>
        </CardHeader>

        <CardContent className="relative z-10 space-y-4 bg-white dark:bg-slate-900">
          <div className="rounded-lg border border-blue-200/70 dark:border-blue-800/60 p-3 bg-blue-50/70 dark:bg-blue-950/20 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                {language === "th" ? "สายยศปัจจุบัน" : "Current Rank Path"}
              </p>
              {!canChoosePath && (
                <Badge variant="outline" className="text-[10px]">
                  {language === "th" ? `ปลดล็อกที่ ${RANK_PATH_UNLOCK_POINTS} คะแนน + ${RANK_PATH_UNLOCK_QUESTS} เควส` : `Unlock at ${RANK_PATH_UNLOCK_POINTS} points + ${RANK_PATH_UNLOCK_QUESTS} quests`}
                </Badge>
              )}
            </div>

            <div className="flex flex-col items-center justify-center rounded-lg border border-blue-200/80 dark:border-blue-800/60 bg-white/80 dark:bg-slate-900/60 py-2">
              <div className="text-2xl leading-none">🐣</div>
              <p className="text-[11px] font-semibold text-slate-700 dark:text-slate-200 mt-1">
                {language === "th" ? "ลูกเจี๊ยบมือใหม่" : "Newbie Chick"}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {RANK_PATH_OPTIONS.map((pathOption) => {
                const isActive = pathOption.id === previewPath;
                const isCurrent = pathOption.id === selectedPath;
                const disabled = isUpdatingPath;
                return (
                  <Button
                    key={pathOption.id}
                    type="button"
                    variant={isActive ? "default" : "outline"}
                    disabled={disabled}
                    onClick={() => handlePreviewPath(pathOption.id)}
                    className="h-auto py-2 px-3 flex items-start justify-start"
                  >
                    <div className="text-left">
                      <p className="text-xs font-semibold leading-none">
                        {pathOption.icon} {language === "th" ? pathOption.labelTh : pathOption.labelEn}
                        {isCurrent && (
                          <span className="ml-1.5 text-[10px] opacity-90">
                            {language === "th" ? "(ปัจจุบัน)" : "(Current)"}
                          </span>
                        )}
                      </p>
                      <p className="text-[10px] leading-relaxed mt-1 opacity-90 whitespace-normal">
                        {language === "th" ? pathOption.teaserTh : pathOption.teaserEn}
                      </p>
                    </div>
                  </Button>
                );
              })}
            </div>
            <div className="pt-1">
              <Button
                type="button"
                onClick={handleSavePath}
                disabled={
                  isUpdatingPath ||
                  !canChoosePath ||
                  previewPath === selectedPath ||
                  !!(lastChangedAt && getRemainingCooldownDays(lastChangedAt) > 0)
                }
                className="w-full sm:w-auto"
              >
                {language === "th" ? "บันทึกการเปลี่ยนสายยศ" : "Save Rank Path"}
              </Button>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400">
              {language === "th"
                ? `แนวทางตอนนี้: ${currentPathMeta.icon} ${currentPathMeta.labelTh}`
                : `Current path: ${currentPathMeta.icon} ${currentPathMeta.labelEn}`}
            </p>
            <p className="text-[11px] text-slate-600 dark:text-slate-400">
              {language === "th"
                ? `ยศสูงสุดในสายปัจจุบัน: ${affiliatedHighestRank.icon} ${affiliatedHighestRank.name}`
                : `Highest unlocked rank in current path: ${affiliatedHighestRank.icon} ${affiliatedHighestRank.nameEn}`}
            </p>
            {!hasEnoughQuests && (
              <p className="text-[11px] text-amber-700 dark:text-amber-300">
                {language === "th"
                  ? `Quest สำหรับเลือกสายยศ: ${completedQuestCount}/${RANK_PATH_UNLOCK_QUESTS} (ไลก์/คอมเมนต์/รีวิว)`
                  : `Rank path quest progress: ${completedQuestCount}/${RANK_PATH_UNLOCK_QUESTS} (Like/Comment/Review)`}
              </p>
            )}
            {previewPath !== selectedPath && (
              <p className="text-[11px] text-blue-700 dark:text-blue-300">
                {language === "th"
                  ? `กำลังพรีวิว: ${previewPathMeta.icon} ${previewPathMeta.labelTh} (กดบันทึกเพื่อยืนยัน)`
                  : `Previewing: ${previewPathMeta.icon} ${previewPathMeta.labelEn} (press Save to confirm)`}
              </p>
            )}
            {!hasEnoughPoints && (
              <p className="text-[11px] text-slate-600 dark:text-slate-400">
                {language === "th"
                  ? `ต้องมีอย่างน้อย ${RANK_PATH_UNLOCK_POINTS} คะแนนเพื่อปลดล็อกการเลือกสาย`
                  : `You need at least ${RANK_PATH_UNLOCK_POINTS} points to unlock rank path selection`}
              </p>
            )}
            {canChoosePath && lastChangedAt && getRemainingCooldownDays(lastChangedAt) > 0 && (
              <p className="text-[11px] text-amber-700 dark:text-amber-300">
                {language === "th"
                  ? `เปลี่ยนสายได้อีกครั้งใน ${getRemainingCooldownDays(lastChangedAt)} วัน`
                  : `Path change available again in ${getRemainingCooldownDays(lastChangedAt)} day(s)`}
              </p>
            )}
          </div>

          <div className="rounded-lg border border-purple-200/70 dark:border-purple-800/60 p-3 bg-purple-50/70 dark:bg-purple-950/20 space-y-2">
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
              {language === "th" ? "ยศที่ใช้งาน (เลือกยศที่ต่ำกว่าได้)" : "Active Rank (you can choose lower tiers)"}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {affiliatedRankTiers
                .filter((tier) => tier.id <= affiliatedHighestRank.id)
                .map((tier) => {
                  const isActiveTier = tier.id === (previewRankTierId || affiliatedHighestRank.id);
                  return (
                    <Button
                      key={tier.id}
                      type="button"
                      variant={isActiveTier ? "default" : "outline"}
                      disabled={isUpdatingRankTier || isPreviewingDifferentPath}
                      onClick={() => handlePreviewRankTier(tier.id)}
                      className="h-auto py-2 px-3 flex items-start justify-start"
                    >
                      <div className="text-left">
                        <p className="text-xs font-semibold leading-none">
                          Lv.{tier.id} {tier.icon} {tier.name}
                        </p>
                      </div>
                    </Button>
                  );
                })}
            </div>
            <div className="pt-1">
              <Button
                type="button"
                onClick={handleSaveRankTier}
                disabled={
                  isUpdatingRankTier ||
                  isPreviewingDifferentPath ||
                  (previewRankTierId || affiliatedHighestRank.id) === (selectedRankTierId || affiliatedHighestRank.id)
                }
                className="w-full sm:w-auto"
              >
                {language === "th" ? "บันทึกยศที่ใช้งาน" : "Save Active Rank"}
              </Button>
            </div>
            {previewRankTierId !== selectedRankTierId && (
              <p className="text-[11px] text-purple-700 dark:text-purple-300">
                {language === "th"
                  ? `กำลังพรีวิวยศ Lv.${previewRankTierId} (กดบันทึกเพื่อยืนยัน)`
                  : `Previewing rank Lv.${previewRankTierId} (press Save to confirm)`}
              </p>
            )}
            {isPreviewingDifferentPath && (
              <p className="text-[11px] text-amber-700 dark:text-amber-300">
                {language === "th"
                  ? "เลือกยศย่อยได้เฉพาะสายที่สังกัดอยู่เท่านั้น (บันทึกเปลี่ยนสายก่อนจึงจะเลือกได้)"
                  : "Lower-rank selection is limited to your affiliated path (save path change first)."}
              </p>
            )}
          </div>

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
            {rankTiers.map((rank) => {
              const isCurrentOrPassed = rank.id <= highestRank.id;
              const isSelectedRank = rank.id === currentRank.id;
              const isHighestRank = rank.id === highestRank.id;
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
                      {isSelectedRank && (
                        <Badge variant="secondary" className="text-[10px]">
                          {language === "th" ? "ใช้งาน" : "Active"}
                        </Badge>
                      )}
                      {isHighestRank && !isSelectedRank && (
                        <Badge variant="outline" className="text-[10px]">
                          {language === "th" ? "ยศสูงสุด" : "Highest"}
                        </Badge>
                      )}
                      {isCurrentOrPassed && (
                        <Unlock className="h-4 w-4 text-green-600 dark:text-green-400" />
                      )}
                      {!isCurrentOrPassed && <Lock className="h-4 w-4 text-slate-400" />}
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                      {language === "th" ? rank.description : rank.descriptionEn}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                      {rank.minPoints} - {rank.maxPoints === Infinity ? "∞" : rank.maxPoints}{" "}
                      {language === "th" ? "คะแนน" : "points"}
                    </p>
                  </div>
                  {rank.id === currentRank.id && (
                    <Badge className="bg-blue-600 text-white animate-pulse">
                      {language === "th" ? "กำลังใช้" : "In Use"}
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
