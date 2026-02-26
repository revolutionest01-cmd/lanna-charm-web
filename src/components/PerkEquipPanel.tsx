import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Sparkles, Lock, Check, Loader2, Crown } from "lucide-react";
import { useUserPerks, AVATAR_FRAMES } from "@/hooks/useUserPerks";
import { useUserRank } from "@/hooks/useUserRank";
import { RANK_PERKS, getUnlockedPerks } from "@/lib/pointSystem";
import sweetAlert from "@/lib/sweetAlert";

interface PerkEquipPanelProps {
  userId: string;
  language: string;
}

const PerkEquipPanel = ({ userId, language }: PerkEquipPanelProps) => {
  const { data: perksData, togglePerk, updatePerks, isUpdating, MAX_ACTIVE_PERKS } = useUserPerks(userId);
  const { data: rankData } = useUserRank(userId);
  const [customTitle, setCustomTitle] = useState("");
  const [titleLoaded, setTitleLoaded] = useState(false);

  // Load custom title from perksData once
  if (perksData && !titleLoaded) {
    setCustomTitle(perksData.custom_title || "");
    setTitleLoaded(true);
  }

  if (!rankData || !perksData) return null;

  const unlockedPerkKeys = getUnlockedPerks(rankData.rank.id);
  const activePerks = perksData.active_perks || [];

  const allPerkEntries = Object.entries(RANK_PERKS);

  const handleTogglePerk = async (perkKey: string) => {
    const isActive = activePerks.includes(perkKey);
    if (!isActive && activePerks.length >= MAX_ACTIVE_PERKS) {
      const confirmed = await sweetAlert.modal.confirm(
        language === "th"
          ? `คุณเปิดใช้ได้สูงสุด ${MAX_ACTIVE_PERKS} อย่าง`
          : `You can equip up to ${MAX_ACTIVE_PERKS} perks`,
        language === "th"
          ? `"${RANK_PERKS[activePerks[0] as keyof typeof RANK_PERKS]?.name || activePerks[0]}" จะถูกปิดแทน`
          : `"${RANK_PERKS[activePerks[0] as keyof typeof RANK_PERKS]?.nameEn || activePerks[0]}" will be replaced`
      );
      if (!confirmed) return;
    }
    await togglePerk(perkKey);
  };

  const handleSaveTitle = async () => {
    try {
      await updatePerks({ custom_title: customTitle.trim() || null });
      sweetAlert.success(language === "th" ? "บันทึกฉายาสำเร็จ" : "Custom title saved");
    } catch {
      sweetAlert.error(language === "th" ? "เกิดข้อผิดพลาด" : "Error saving title");
    }
  };

  const handleSelectFrame = async (frameKey: string | null) => {
    try {
      await updatePerks({ avatar_frame: frameKey });
      sweetAlert.success(language === "th" ? "เปลี่ยนกรอบสำเร็จ" : "Frame updated");
    } catch {
      sweetAlert.error(language === "th" ? "เกิดข้อผิดพลาด" : "Error updating frame");
    }
  };

  return (
    <div className="space-y-6">
      {/* Equip Perks */}
      <Card className="border-0 shadow-lg overflow-hidden bg-white dark:bg-slate-900">
        <div className="h-12 bg-gradient-to-r from-blue-500 via-blue-400 to-cyan-400" />
        <CardHeader className="pb-3 -mt-8 relative z-10 bg-white dark:bg-slate-900">
          <CardTitle className="text-lg flex items-center gap-2 text-slate-800 dark:text-white">
            <Sparkles className="h-5 w-5 text-blue-600" />
            {language === "th" ? "สิทธิพิเศษ" : "Perks"}
            <Badge variant="secondary" className="ml-auto text-xs">
              {activePerks.length}/{MAX_ACTIVE_PERKS} {language === "th" ? "เปิดใช้" : "equipped"}
            </Badge>
          </CardTitle>
          <CardDescription className="text-xs">
            {language === "th"
              ? `เลือกเปิดใช้สิทธิพิเศษได้สูงสุด ${MAX_ACTIVE_PERKS} อย่าง`
              : `Equip up to ${MAX_ACTIVE_PERKS} perks at a time`}
          </CardDescription>
        </CardHeader>
        <CardContent className="bg-white dark:bg-slate-900 space-y-2">
          {allPerkEntries.map(([key, perk]) => {
            const isUnlocked = unlockedPerkKeys.includes(key);
            const isActive = activePerks.includes(key);

            return (
              <div
                key={key}
                className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                  isActive
                    ? "bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800"
                    : isUnlocked
                    ? "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-blue-300"
                    : "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 opacity-50"
                }`}
              >
                <span className="text-xl">{perk.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium text-sm text-slate-800 dark:text-white">
                      {language === "th" ? perk.name : perk.nameEn}
                    </span>
                    {!isUnlocked && <Lock className="h-3.5 w-3.5 text-slate-400" />}
                    {isActive && <Check className="h-3.5 w-3.5 text-blue-600" />}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                    {language === "th" ? perk.description : perk.descriptionEn}
                  </p>
                  {!isUnlocked && (
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {language === "th" ? `ต้องการยศระดับ ${perk.minRank}+` : `Requires rank level ${perk.minRank}+`}
                    </p>
                  )}
                </div>
                <Switch
                  checked={isActive}
                  onCheckedChange={() => handleTogglePerk(key)}
                  disabled={!isUnlocked || isUpdating}
                />
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Custom Title (if unlocked) */}
      {unlockedPerkKeys.includes("custom-title") && (
        <Card className="border-0 shadow-lg overflow-hidden bg-white dark:bg-slate-900">
          <div className="h-12 bg-gradient-to-r from-amber-400 via-yellow-400 to-orange-400" />
          <CardHeader className="pb-3 -mt-8 relative z-10 bg-white dark:bg-slate-900">
            <CardTitle className="text-lg flex items-center gap-2 text-slate-800 dark:text-white">
              📜 {language === "th" ? "ตั้งฉายาสุดคูล" : "Set Custom Title"}
            </CardTitle>
          </CardHeader>
          <CardContent className="bg-white dark:bg-slate-900 space-y-3">
            <div className="space-y-2">
              <Label className="text-sm text-slate-600 dark:text-slate-300">
                {language === "th" ? "ฉายาของคุณ (สูงสุด 20 ตัวอักษร)" : "Your title (max 20 chars)"}
              </Label>
              <div className="flex gap-2">
                <Input
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value.slice(0, 20))}
                  placeholder={language === "th" ? "เช่น จอมวิชาการ" : "e.g. The Scholar"}
                  className="flex-1 border-slate-300 dark:bg-slate-800 dark:border-slate-600"
                />
                <Button
                  onClick={handleSaveTitle}
                  disabled={isUpdating}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : language === "th" ? "บันทึก" : "Save"}
                </Button>
              </div>
              {perksData.custom_title && (
                <p className="text-xs text-slate-500">
                  {language === "th" ? "ฉายาปัจจุบัน: " : "Current: "}
                  <span className="font-medium text-blue-600">「{perksData.custom_title}」</span>
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Avatar Frame (if unlocked) */}
      {unlockedPerkKeys.includes("custom-avatar-frame") && (
        <Card className="border-0 shadow-lg overflow-hidden bg-white dark:bg-slate-900">
          <div className="h-12 bg-gradient-to-r from-purple-500 via-pink-400 to-rose-400" />
          <CardHeader className="pb-3 -mt-8 relative z-10 bg-white dark:bg-slate-900">
            <CardTitle className="text-lg flex items-center gap-2 text-slate-800 dark:text-white">
              ✨ {language === "th" ? "เลือกกรอบรูปโปรไฟล์" : "Choose Avatar Frame"}
            </CardTitle>
          </CardHeader>
          <CardContent className="bg-white dark:bg-slate-900">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* No frame option */}
              <button
                onClick={() => handleSelectFrame(null)}
                disabled={isUpdating}
                className={`p-3 rounded-lg border-2 text-center transition-all ${
                  !perksData.avatar_frame
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-950/20"
                    : "border-slate-200 dark:border-slate-700 hover:border-blue-300"
                }`}
              >
                <div className="w-12 h-12 mx-auto rounded-full bg-slate-200 dark:bg-slate-700 mb-2" />
                <p className="text-xs font-medium text-slate-600 dark:text-slate-300">
                  {language === "th" ? "ไม่มีกรอบ" : "No Frame"}
                </p>
                {!perksData.avatar_frame && (
                  <Check className="h-3.5 w-3.5 text-blue-600 mx-auto mt-1" />
                )}
              </button>

              {Object.entries(AVATAR_FRAMES).map(([key, frame]) => (
                <button
                  key={key}
                  onClick={() => handleSelectFrame(key)}
                  disabled={isUpdating}
                  className={`p-3 rounded-lg border-2 text-center transition-all ${
                    perksData.avatar_frame === key
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-950/20"
                      : "border-slate-200 dark:border-slate-700 hover:border-blue-300"
                  }`}
                >
                  <div className={`w-12 h-12 mx-auto rounded-full bg-slate-200 dark:bg-slate-700 mb-2 ${frame.className}`} />
                  <p className="text-xs font-medium text-slate-600 dark:text-slate-300">
                    {language === "th" ? frame.name : frame.nameEn}
                  </p>
                  {perksData.avatar_frame === key && (
                    <Check className="h-3.5 w-3.5 text-blue-600 mx-auto mt-1" />
                  )}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PerkEquipPanel;
