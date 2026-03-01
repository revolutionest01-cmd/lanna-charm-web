import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage, translations } from "@/hooks/useLanguage";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Camera, Loader2, LogOut, User, Mail, Trash2, Sparkles, Globe, Gift, Save, CalendarDays, Trophy, Heart, Link2 } from "lucide-react";
import sweetAlert from "@/lib/sweetAlert";
import AvatarCropDialog from "@/components/AvatarCropDialog";
import { UserStatusAvatar } from "@/components/UserStatusAvatar";

import UserEngagementStats from "@/components/UserEngagementStats";
import { format } from "date-fns";
import { useFeatureToggle, showFeatureDisabledAlert } from "@/hooks/useFeatureToggle";
import { useUserPerks, AVATAR_FRAMES } from "@/hooks/useUserPerks";
import { useUserRank } from "@/hooks/useUserRank";
import { getUnlockedPerks, RANK_PERKS } from "@/lib/pointSystem";

type ProfileTheme = "ocean" | "sunset" | "forest" | "royal" | "mono";

const PROFILE_THEME_OPTIONS: Array<{
  id: ProfileTheme;
  labelTh: string;
  labelEn: string;
  pageBg: string;
  cardBg: string;
  cardBorder: string;
  headerGradient: string;
  primaryButton: string;
  accentIcon: string;
  preview: string;
}> = [
  {
    id: "ocean",
    labelTh: "Ocean Blue",
    labelEn: "Ocean Blue",
    pageBg: "bg-gradient-to-br from-sky-100 via-cyan-50 to-blue-100",
    cardBg: "bg-white/95",
    cardBorder: "border-sky-200/80",
    headerGradient: "from-blue-500 via-cyan-400 to-sky-400",
    primaryButton: "bg-blue-600 hover:bg-blue-700",
    accentIcon: "text-blue-600",
    preview: "from-blue-500 via-cyan-400 to-sky-400",
  },
  {
    id: "sunset",
    labelTh: "Sunset Gold",
    labelEn: "Sunset Gold",
    pageBg: "bg-gradient-to-br from-amber-100 via-orange-50 to-rose-100",
    cardBg: "bg-white/95",
    cardBorder: "border-orange-200/80",
    headerGradient: "from-orange-500 via-amber-400 to-rose-400",
    primaryButton: "bg-orange-600 hover:bg-orange-700",
    accentIcon: "text-orange-600",
    preview: "from-orange-500 via-amber-400 to-rose-400",
  },
  {
    id: "forest",
    labelTh: "Forest Mint",
    labelEn: "Forest Mint",
    pageBg: "bg-gradient-to-br from-emerald-100 via-green-50 to-teal-100",
    cardBg: "bg-white/95",
    cardBorder: "border-emerald-200/80",
    headerGradient: "from-emerald-600 via-green-500 to-teal-400",
    primaryButton: "bg-emerald-600 hover:bg-emerald-700",
    accentIcon: "text-emerald-600",
    preview: "from-emerald-600 via-green-500 to-teal-400",
  },
  {
    id: "royal",
    labelTh: "Royal Purple",
    labelEn: "Royal Purple",
    pageBg: "bg-gradient-to-br from-violet-100 via-fuchsia-50 to-indigo-100",
    cardBg: "bg-white/95",
    cardBorder: "border-violet-200/80",
    headerGradient: "from-violet-600 via-purple-500 to-indigo-500",
    primaryButton: "bg-violet-600 hover:bg-violet-700",
    accentIcon: "text-violet-600",
    preview: "from-violet-600 via-purple-500 to-indigo-500",
  },
  {
    id: "mono",
    labelTh: "Mono Graphite",
    labelEn: "Mono Graphite",
    pageBg: "bg-gradient-to-br from-slate-200 via-zinc-100 to-gray-200",
    cardBg: "bg-white/95",
    cardBorder: "border-slate-300/80",
    headerGradient: "from-slate-700 via-zinc-600 to-gray-600",
    primaryButton: "bg-slate-700 hover:bg-slate-800",
    accentIcon: "text-slate-700",
    preview: "from-slate-700 via-zinc-600 to-gray-600",
  },
];

const isProfileTheme = (value: string | null | undefined): value is ProfileTheme => {
  return PROFILE_THEME_OPTIONS.some((theme) => theme.id === value);
};

const getThemeStorageKey = (userId: string) => `profile-theme-${userId}`;
const getProfileExtraStorageKey = (userId: string) => `profile-extra-${userId}`;

const getStoredProfileTheme = (userId: string): ProfileTheme => {
  const stored = localStorage.getItem(getThemeStorageKey(userId));
  return isProfileTheme(stored) ? stored : "ocean";
};

const setStoredProfileTheme = (userId: string, theme: ProfileTheme) => {
  localStorage.setItem(getThemeStorageKey(userId), theme);
};

const getStoredProfileExtras = (userId: string) => {
  try {
    const raw = localStorage.getItem(getProfileExtraStorageKey(userId));
    if (!raw) {
      return {
        statusMessage: "",
        bioShort: "",
        socialFacebook: "",
        socialInstagram: "",
        socialTiktok: "",
      };
    }
    const parsed = JSON.parse(raw);
    return {
      statusMessage: typeof parsed.statusMessage === "string" ? parsed.statusMessage : "",
      bioShort: typeof parsed.bioShort === "string" ? parsed.bioShort : "",
      socialFacebook: typeof parsed.socialFacebook === "string" ? parsed.socialFacebook : "",
      socialInstagram: typeof parsed.socialInstagram === "string" ? parsed.socialInstagram : "",
      socialTiktok: typeof parsed.socialTiktok === "string" ? parsed.socialTiktok : "",
    };
  } catch {
    return {
      statusMessage: "",
      bioShort: "",
      socialFacebook: "",
      socialInstagram: "",
      socialTiktok: "",
    };
  }
};

const setStoredProfileExtras = (
  userId: string,
  extras: {
    statusMessage: string;
    bioShort: string;
    socialFacebook: string;
    socialInstagram: string;
    socialTiktok: string;
  }
) => {
  localStorage.setItem(getProfileExtraStorageKey(userId), JSON.stringify(extras));
};

const isMissingStatusMessageColumnError = (error: any) => {
  if (!error) return false;
  const code = String(error.code || "");
  const message = String(error.message || "").toLowerCase();
  const details = String(error.details || "").toLowerCase();
  const hint = String(error.hint || "").toLowerCase();
  return (
    code === "42703" ||
    code === "PGRST204" ||
    message.includes("status_message") ||
    details.includes("status_message") ||
    hint.includes("status_message")
  );
};

const getUnlockedProfileThemes = (rankId: number): ProfileTheme[] => {
  const unlocked: ProfileTheme[] = ["ocean", "sunset"];
  if (rankId >= 3) unlocked.push("forest");
  if (rankId >= 4) unlocked.push("royal");
  if (rankId >= 5) unlocked.push("mono");
  return unlocked;
};

const Profile = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const t = translations[language];
  const { user, isAuthenticated, isLoading: authLoading, logout } = useAuth();
  const { isFeatureEnabled, isLoading: featureLoading } = useFeatureToggle();
  const { data: perksData } = useUserPerks(user?.id);
  const { data: rankData } = useUserRank(user?.id);

  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [profileTheme, setProfileTheme] = useState<ProfileTheme>("ocean");
  const [gachaResult, setGachaResult] = useState<{ rewardType: string; rewardValue: number; rewardMeta?: any } | null>(null);
  const [isGachaOpening, setIsGachaOpening] = useState(false);
  const [hasClaimedToday, setHasClaimedToday] = useState(false);
  const [signatureText, setSignatureText] = useState("");
  const [signatureImageUrl, setSignatureImageUrl] = useState("");
  const [signatureEnabled, setSignatureEnabled] = useState(true);
  const [isSavingSignature, setIsSavingSignature] = useState(false);
  const [profileCreatedAt, setProfileCreatedAt] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState("");
  const [bioShort, setBioShort] = useState("");
  const [socialFacebook, setSocialFacebook] = useState("");
  const [socialInstagram, setSocialInstagram] = useState("");
  const [socialTiktok, setSocialTiktok] = useState("");
  const [likesReceived, setLikesReceived] = useState(0);
  const [isOnline, setIsOnline] = useState<boolean>(typeof window !== "undefined" ? window.navigator.onLine : true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const activeTheme = PROFILE_THEME_OPTIONS.find((theme) => theme.id === profileTheme) || PROFILE_THEME_OPTIONS[0];
  const canUseSignature = (rankData?.rank?.id || 0) >= 2;
  const currentRankId = rankData?.rank?.id || 1;
  const unlockedThemes = getUnlockedProfileThemes(currentRankId);
  const unlockedPerkKeys = getUnlockedPerks(currentRankId);
  const showcasePerks = unlockedPerkKeys
    .slice(-3)
    .reverse()
    .map((perkKey) => ({
      key: perkKey,
      perk: RANK_PERKS[perkKey as keyof typeof RANK_PERKS],
    }))
    .filter((item) => item.perk);
  const joinedDateLabel = profileCreatedAt
    ? new Date(profileCreatedAt).toLocaleDateString(language === "th" ? "th-TH" : "en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "-";

  const profileExtrasPayload = {
    statusMessage: statusMessage.trim(),
    bioShort: bioShort.trim(),
    socialFacebook: socialFacebook.trim(),
    socialInstagram: socialInstagram.trim(),
    socialTiktok: socialTiktok.trim(),
  };

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/auth");
    }
    if (!authLoading && isAuthenticated && !featureLoading && !isFeatureEnabled("user_profile")) {
      showFeatureDisabledAlert(language);
      navigate("/");
    }
  }, [isAuthenticated, authLoading, navigate, featureLoading]);

  // Load profile data
  useEffect(() => {
    if (!user?.id) return;
    const loadProfile = async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("display_name, avatar_url, profile_theme, created_at, bio_short, social_facebook, social_instagram, social_tiktok")
        .eq("id", user.id)
        .maybeSingle();

      // Also fetch status_message from the new column
      const { data: extData } = await supabase
        .from("profiles")
        .select("status_message" as any)
        .eq("id", user.id)
        .maybeSingle() as any;

      if (error) {
        console.error("Load profile error:", error);
      }

      if (data) {
        setDisplayName(data.display_name || "");
        setAvatarUrl(data.avatar_url || null);
        setProfileCreatedAt(data.created_at || null);
        setStatusMessage(extData?.status_message || "");
        setBioShort(data.bio_short || "");
        setSocialFacebook(data.social_facebook || "");
        setSocialInstagram(data.social_instagram || "");
        setSocialTiktok(data.social_tiktok || "");
        const resolvedTheme = isProfileTheme(data.profile_theme)
          ? data.profile_theme
          : getStoredProfileTheme(user.id);
        setProfileTheme(resolvedTheme);
        setStoredProfileTheme(user.id, resolvedTheme);
        setStoredProfileExtras(user.id, {
          statusMessage: extData?.status_message || "",
          bioShort: data.bio_short || "",
          socialFacebook: data.social_facebook || "",
          socialInstagram: data.social_instagram || "",
          socialTiktok: data.social_tiktok || "",
        });
      } else {
        const storedExtras = getStoredProfileExtras(user.id);
        setDisplayName(user.name || "");
        setAvatarUrl(user.avatar || null);
        setProfileTheme(getStoredProfileTheme(user.id));
        setProfileCreatedAt(null);
        setStatusMessage(storedExtras.statusMessage);
        setBioShort(storedExtras.bioShort);
        setSocialFacebook(storedExtras.socialFacebook);
        setSocialInstagram(storedExtras.socialInstagram);
        setSocialTiktok(storedExtras.socialTiktok);
      }
      setProfileLoaded(true);
    };
    loadProfile();
  }, [user?.id, user?.name, user?.avatar]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);

    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);

    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  useEffect(() => {
    if (!user?.id) return;

    const loadLikesReceived = async () => {
      const getLikeCountFromIds = async (tableName: string, idColumn: string, ids: string[]) => {
        if (!ids.length) return 0;

        const { count, error } = await (supabase as any)
          .from(tableName)
          .select("*", { count: "exact", head: true })
          .in(idColumn, ids);

        if (error) {
          if (error.code === "42P01") return 0;
          throw error;
        }

        return count || 0;
      };

      try {
        const [{ data: topicRows }, { data: replyRows }, { data: reviewRows }] = await Promise.all([
          (supabase as any).from("forum_topics").select("id").eq("user_id", user.id),
          (supabase as any).from("forum_replies").select("id").eq("user_id", user.id),
          supabase.from("reviews").select("id").eq("user_id", user.id),
        ]);

        const topicIds = (topicRows || []).map((row: any) => row.id);
        const replyIds = (replyRows || []).map((row: any) => row.id);
        const reviewIds = (reviewRows || []).map((row: any) => row.id);

        const [topicLikes, replyLikes, reviewLikes] = await Promise.all([
          getLikeCountFromIds("forum_likes", "topic_id", topicIds),
          getLikeCountFromIds("forum_reply_likes", "reply_id", replyIds),
          getLikeCountFromIds("review_likes", "review_id", reviewIds),
        ]);

        setLikesReceived(topicLikes + replyLikes + reviewLikes);
      } catch (error) {
        console.warn("Load likes received error:", error);
        setLikesReceived(0);
      }
    };

    loadLikesReceived();
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;

    const loadDailyGachaStatus = async () => {
      const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok" });
      const { data, error } = await (supabase as any)
        .from("daily_gacha_claims")
        .select("reward_type, reward_value, reward_meta")
        .eq("user_id", user.id)
        .eq("claim_date", today)
        .maybeSingle();

      if (error) {
        // table may not exist yet in some environments
        setHasClaimedToday(false);
        setGachaResult(null);
        return;
      }

      if (data) {
        setHasClaimedToday(true);
        setGachaResult({
          rewardType: data.reward_type,
          rewardValue: data.reward_value,
          rewardMeta: data.reward_meta,
        });
      }
    };

    loadDailyGachaStatus();
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;

    const loadSignatureSettings = async () => {
      const { data, error } = await (supabase as any)
        .from("user_signature_settings")
        .select("signature_text, signature_image_url, is_enabled")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error || !data) {
        setSignatureText("");
        setSignatureImageUrl("");
        setSignatureEnabled(true);
        return;
      }

      setSignatureText(data.signature_text || "");
      setSignatureImageUrl(data.signature_image_url || "");
      setSignatureEnabled(data.is_enabled ?? true);
    };

    loadSignatureSettings();
  }, [user?.id]);

  const formatGachaReward = (rewardType: string, rewardValue: number, rewardMeta?: any) => {
    if (rewardType === "rank_points") {
      return language === "th" ? `+${rewardValue} แต้มยศ` : `+${rewardValue} rank points`;
    }
    if (rewardType === "temporary_title") {
      const title = rewardMeta?.title;
      return language === "th"
        ? `ฉายาชั่วคราว: ${title || "ของรางวัลพิเศษ"}`
        : `Temporary title: ${title || "special reward"}`;
    }
    return language === "th" ? "บัตรข้ามคูลดาวน์ 1 ใบ" : "1 cooldown bypass ticket";
  };

  const handleOpenDailyGacha = async () => {
    if (!user?.id) {
      sweetAlert.warning(language === "th" ? "กรุณาเข้าสู่ระบบก่อน" : "Please sign in first");
      return;
    }

    if (isGachaOpening) {
      sweetAlert.warning(language === "th" ? "กำลังเปิดกล่อง กรุณารอสักครู่" : "Opening in progress, please wait");
      return;
    }

    if (hasClaimedToday) {
      sweetAlert.warning(
        language === "th"
          ? "วันนี้คุณเปิดกล่องสุ่มไปแล้ว กลับมาใหม่พรุ่งนี้นะ"
          : "You already opened today's mystery box. Come back tomorrow."
      );
      return;
    }

    setIsGachaOpening(true);
    try {
      const { data, error } = await (supabase as any).rpc("claim_daily_gacha");

      if (error) throw error;

      if (!data || data.status !== "success") {
        if (data?.status === "already_claimed") {
          sweetAlert.warning(language === "th" ? "วันนี้คุณเปิดกล่องแล้ว" : "You already opened today's box");
          setHasClaimedToday(true);
          return;
        }

        if (data?.status === "not_eligible" || data?.status === "quest_incomplete") {
          sweetAlert.warning(
            language === "th"
              ? "ต้องมีกิจกรรมอย่างน้อย 1 อย่างก่อน (โพสต์กระทู้, ตอบกระทู้, หรือเขียนรีวิว)"
              : "Complete at least one quest first (post a topic, reply, or write a review)"
          );
          return;
        }

        if (data?.status === "cooldown") {
          sweetAlert.warning(
            language === "th"
              ? "ยังอยู่ในช่วงคูลดาวน์ของกล่องสุ่ม กรุณาลองใหม่ภายหลัง"
              : "Mystery box is in cooldown. Please try again later."
          );
          return;
        }

        if (data?.status === "no_inventory_slot") {
          sweetAlert.warning(
            language === "th"
              ? "ช่องเก็บรางวัลเต็ม กรุณาเคลียร์ช่องเก็บก่อน"
              : "Reward inventory is full. Please free up space first."
          );
          return;
        }

        const backendReason = data?.reason || data?.message;
        if (backendReason) {
          sweetAlert.warning(
            language === "th"
              ? `ยังเปิดกล่องไม่ได้: ${backendReason}`
              : `Cannot open mystery box yet: ${backendReason}`
          );
          return;
        }

        sweetAlert.error(language === "th" ? "ยังไม่สามารถเปิดกล่องได้" : "Cannot open mystery box now");
        return;
      }

      const nextResult = {
        rewardType: data.reward_type,
        rewardValue: data.reward_value,
        rewardMeta: data,
      };

      setGachaResult(nextResult);
      setHasClaimedToday(true);

      sweetAlert.success(
        language === "th"
          ? `เปิดกล่องสำเร็จ! ได้รับ ${formatGachaReward(nextResult.rewardType, nextResult.rewardValue, nextResult.rewardMeta)}`
          : `Mystery box opened! You got ${formatGachaReward(nextResult.rewardType, nextResult.rewardValue, nextResult.rewardMeta)}`
      );
    } catch (error: any) {
      const errCode = error?.code as string | undefined;
      const errMessage = (error?.message || "") as string;
      const errDetails = (error?.details || "") as string;
      const errHint = (error?.hint || "") as string;
      const combinedErrorText = `${errMessage} ${errDetails} ${errHint}`.toLowerCase();

      if (
        errCode === "42P01" ||
        errCode === "42883" ||
        combinedErrorText.includes("daily_gacha_claims") ||
        combinedErrorText.includes("claim_daily_gacha")
      ) {
        sweetAlert.error(
          language === "th"
            ? "ระบบกล่องสุ่มยังไม่พร้อม (ยังไม่ได้รัน migration/function)"
            : "Daily gacha is not ready yet (migration/function pending)"
        );
      } else if (errCode === "42501" || combinedErrorText.includes("permission denied")) {
        sweetAlert.error(
          language === "th"
            ? "ไม่มีสิทธิ์เปิดกล่องสุ่มในขณะนี้ (สิทธิ์ฐานข้อมูล/RLS)"
            : "Not allowed to open mystery box right now (database/RLS permission)."
        );
      } else if (combinedErrorText.includes("already claimed") || combinedErrorText.includes("already_opened")) {
        setHasClaimedToday(true);
        sweetAlert.warning(
          language === "th"
            ? "วันนี้คุณเปิดกล่องไปแล้ว"
            : "You already opened today's mystery box."
        );
      } else if (combinedErrorText.includes("not eligible") || combinedErrorText.includes("activity")) {
        sweetAlert.warning(
          language === "th"
            ? "ยังไม่ผ่านเงื่อนไขการเปิด (ต้องมีกิจกรรมก่อน เช่น Like/Comment)"
            : "Not eligible yet (do at least one activity first, e.g. like/comment)."
        );
      } else {
        const readableReason = errDetails || errHint || errMessage;
        if (readableReason) {
          sweetAlert.error(
            language === "th"
              ? `เปิดกล่องไม่สำเร็จ: ${readableReason}`
              : `Failed to open mystery box: ${readableReason}`
          );
        } else {
          sweetAlert.error(language === "th" ? "เปิดกล่องไม่สำเร็จ (ไม่ทราบสาเหตุ)" : "Failed to open mystery box (unknown reason)");
        }
      }
    } finally {
      setIsGachaOpening(false);
    }
  };

  const handleSaveSignature = async () => {
    if (!user?.id || !canUseSignature) return;

    setIsSavingSignature(true);
    try {
      const payload = {
        user_id: user.id,
        signature_text: signatureText.trim() || null,
        signature_image_url: signatureImageUrl.trim() || null,
        is_enabled: signatureEnabled,
        updated_at: new Date().toISOString(),
      };

      const { error } = await (supabase as any)
        .from("user_signature_settings")
        .upsert(payload, { onConflict: "user_id" });

      if (error) throw error;

      sweetAlert.success(language === "th" ? "บันทึก Signature สำเร็จ" : "Signature saved");
    } catch (error: any) {
      if (error?.code === "42P01" || error?.message?.includes("user_signature_settings")) {
        sweetAlert.error(
          language === "th"
            ? "ระบบ Signature ยังไม่พร้อม (ยังไม่ได้รัน migration)"
            : "Signature system is not ready yet (migration pending)"
        );
      } else {
        sweetAlert.error(language === "th" ? "บันทึก Signature ไม่สำเร็จ" : "Failed to save signature");
      }
    } finally {
      setIsSavingSignature(false);
    }
  };

  const handleThemeSelect = async (themeId: ProfileTheme) => {
    if (!user?.id || profileTheme === themeId) return;

    const previousTheme = profileTheme;
    setProfileTheme(themeId);
    setStoredProfileTheme(user.id, themeId);

    try {
      const { error } = await supabase
        .from("profiles")
        .update({ profile_theme: themeId })
        .eq("id", user.id);

      if (error) {
        if (error.code === "42703") {
          sweetAlert.warning(
            language === "th"
              ? "บันทึกธีมเฉพาะเครื่องนี้ชั่วคราว (ฐานข้อมูลยังไม่อัปเดตคอลัมน์ profile_theme)"
              : "Theme saved locally only (database migration for profile_theme is pending)"
          );
          return;
        }
        throw error;
      }
    } catch (error) {
      console.error("Save profile theme error:", error);
      setProfileTheme(previousTheme);
      setStoredProfileTheme(user.id, previousTheme);
      sweetAlert.error(language === "th" ? "ไม่สามารถบันทึกธีมโปรไฟล์ได้" : "Failed to save profile theme");
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      sweetAlert.error(language === "th" ? "กรุณาเลือกไฟล์รูปภาพ" : "Please select an image file");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      sweetAlert.error(language === "th" ? "ขนาดไฟล์ต้องไม่เกิน 10MB" : "File size must not exceed 10MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => setCropImageSrc(reader.result as string);
    reader.readAsDataURL(file);

    // Reset input so same file can be re-selected
    e.target.value = "";
  };

  const handleCroppedUpload = async (blob: Blob) => {
    if (!user?.id) return;
    setCropImageSrc(null);
    setIsUploading(true);
    try {
      const filePath = `${user.id}/avatar.webp`;

      const { error: uploadError } = await supabase.storage
        .from("reviews")
        .upload(filePath, blob, { upsert: true, contentType: "image/webp" });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("reviews")
        .getPublicUrl(filePath);

      const newAvatarUrl = `${urlData.publicUrl}?t=${Date.now()}`;
      setAvatarUrl(newAvatarUrl);

      await supabase
        .from("profiles")
        .update({ avatar_url: newAvatarUrl })
        .eq("id", user.id);

      sweetAlert.success(language === "th" ? "อัพเดทรูปโปรไฟล์สำเร็จ" : "Profile picture updated");
    } catch (error: unknown) {
      console.error("Avatar upload error:", error);
      sweetAlert.error(language === "th" ? "ไม่สามารถอัพโหลดรูปได้" : "Failed to upload image");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteAvatar = async () => {
    if (!user?.id || !avatarUrl) return;

    const confirmed = await sweetAlert.modal.confirm(
      language === "th" ? "ต้องการลบรูปโปรไฟล์?" : "Delete profile picture?",
      language === "th" ? "รูปโปรไฟล์จะถูกลบออก" : "Your profile picture will be removed"
    );
    if (!confirmed) return;

    setIsUploading(true);
    try {
      // List and delete all files in user's folder
      const { data: files } = await supabase.storage
        .from("reviews")
        .list(user.id);

      if (files && files.length > 0) {
        const filePaths = files.map(f => `${user.id}/${f.name}`);
        await supabase.storage.from("reviews").remove(filePaths);
      }

      // Clear avatar in DB
      await supabase
        .from("profiles")
        .update({ avatar_url: null })
        .eq("id", user.id);

      setAvatarUrl(null);
      sweetAlert.success(language === "th" ? "ลบรูปโปรไฟล์สำเร็จ" : "Profile picture deleted");
    } catch (error) {
      console.error("Delete avatar error:", error);
      sweetAlert.error(language === "th" ? "ไม่สามารถลบรูปได้" : "Failed to delete image");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user?.id || !displayName.trim()) return;

    setIsSaving(true);
    try {
      // Save core profile fields
      const { error } = await supabase
        .from("profiles")
        .upsert({
          id: user.id,
          display_name: displayName.trim(),
          avatar_url: avatarUrl || null,
          bio_short: profileExtrasPayload.bioShort || null,
          social_facebook: profileExtrasPayload.socialFacebook || null,
          social_instagram: profileExtrasPayload.socialInstagram || null,
          social_tiktok: profileExtrasPayload.socialTiktok || null,
          updated_at: new Date().toISOString(),
        })
        .select("id")
        .single();

      if (error) throw error;

      // Save status_message (new column, cast needed until types regenerate)
      await supabase
        .from("profiles")
        .update({ status_message: profileExtrasPayload.statusMessage || null } as any)
        .eq("id", user.id);

      setStoredProfileExtras(user.id, profileExtrasPayload);

      sweetAlert.success(language === "th" ? "บันทึกโปรไฟล์สำเร็จ" : "Profile saved successfully");
    } catch (error) {
      console.error("Save profile error:", error);
      sweetAlert.error(language === "th" ? "ไม่สามารถบันทึกโปรไฟล์ได้" : "Failed to save profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    
    sweetAlert.fire({
      title: language === "th" ? "ออกจากระบบสำเร็จ" : "Logged Out",
      html: `<div style="font-size: 1.1rem; line-height: 1.6;">
        <p style="color: #666;">${language === "th" ? "คุณได้ออกจากระบบเรียบร้อย แล้วพบกันใหม่นะคะ" : "You have successfully logged out. See you again!"}</p>
      </div>`,
      icon: 'success',
      confirmButtonText: language === "th" ? "กลับหน้าแรก" : "Back to Home",
      confirmButtonColor: '#d97706',
      allowOutsideClick: false,
      didClose: () => {
        navigate("/");
      }
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (authLoading || !profileLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className={cn("min-h-screen p-4 pt-20 sm:pt-28 transition-colors duration-300", activeTheme.pageBg)}>
      <div className="w-full max-w-6xl mx-auto">
        {/* Main Profile Section */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Profile Card - Left Side */}
          <div className="lg:col-span-1">
            <Card className={cn("shadow-lg overflow-hidden border", activeTheme.cardBg, activeTheme.cardBorder)}>
              {/* Blue Header */}
              <div className={cn("h-24 bg-gradient-to-r relative overflow-hidden flex items-center justify-center", activeTheme.headerGradient)}>
                <Sparkles className="h-8 w-8 text-white/60 absolute top-2 right-4 animate-pulse" />
              </div>

              <div className="px-4 pt-1 pb-4 text-center -mt-12 relative z-10">
                {/* Avatar Section */}
                <div className="flex flex-col items-center gap-4 mb-4">
                  <div className="relative group">
                    <div className={cn("absolute inset-0 bg-gradient-to-br rounded-full blur opacity-30 group-hover:opacity-50 transition-opacity duration-300", activeTheme.preview)} />
                    <UserStatusAvatar
                      userId={user?.id}
                      userName={displayName || "User"}
                      avatarUrl={avatarUrl || undefined}
                      statusMessage={statusMessage}
                      size="xl"
                      avatarClassName={`relative border-4 border-white shadow-xl ${perksData?.avatar_frame && perksData.active_perks?.includes("custom-avatar-frame") ? AVATAR_FRAMES[perksData.avatar_frame]?.className || "" : ""}`}
                      fallbackClassName={cn("text-3xl font-bold bg-gradient-to-br text-white", activeTheme.preview)}
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      className={cn("absolute bottom-0 right-0 text-white rounded-full p-2.5 shadow-lg transition-all duration-200 active:scale-95 disabled:opacity-50", activeTheme.primaryButton)}
                    >
                      {isUploading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Camera className="h-4 w-4" />
                      )}
                    </button>
                    {avatarUrl && (
                      <button
                        onClick={handleDeleteAvatar}
                        disabled={isUploading}
                        className="absolute bottom-0 left-0 bg-red-600 text-white rounded-full p-2.5 shadow-lg hover:bg-red-700 transition-all duration-200 active:scale-95 disabled:opacity-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </div>
                </div>
                <h2 className={`text-2xl font-bold mb-1 ${
                  perksData?.active_perks?.includes("aura-effect")
                    ? "bg-gradient-to-r from-yellow-600 via-amber-500 to-yellow-600 bg-clip-text text-transparent drop-shadow-[0_0_8px_rgba(234,179,8,0.5)]"
                    : "text-slate-800 dark:text-white"
                }`}>
                  {perksData?.active_perks?.includes("premium-badge") && "⭐ "}
                  {displayName || "User"}
                </h2>
                <p className="text-xs text-blue-700 dark:text-blue-300 font-medium mb-1">
                  {language === "th" ? "ฉายา: " : "Title: "}
                  {perksData?.custom_title?.trim()
                    ? `「${perksData.custom_title}」`
                    : language === "th"
                      ? "ยังไม่ได้ตั้ง"
                      : "Not set"}
                </p>
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Badge className={cn("text-[10px] px-2 py-0.5", isOnline ? "bg-emerald-600 text-white" : "bg-slate-500 text-white")}>
                    {isOnline
                      ? (language === "th" ? "Online" : "Online")
                      : (language === "th" ? "Offline" : "Offline")}
                  </Badge>
                  <span className="text-[11px] text-slate-500 inline-flex items-center gap-1">
                    <CalendarDays className="h-3 w-3" />
                    {language === "th" ? "เข้าร่วม: " : "Joined: "}
                    {joinedDateLabel}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mb-4">
                  {language === "th" ? "จัดการโปรไฟล์ของคุณ" : "Manage your profile"}
                </p>

                {/* Go to Website Button */}
                <Button
                  onClick={() => navigate("/")}
                  className="w-full gap-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold shadow-md dark:bg-slate-950 dark:hover:bg-slate-900 mb-4"
                >
                  <Globe className="h-4 w-4" />
                  {language === "th" ? "เข้าสู่เว็บไซด์" : "Go to Website"}
                </Button>

                <div className="space-y-2 mb-4 border-t border-slate-200 pt-4">
                  <Label className="text-sm font-medium text-slate-700">
                    {language === "th" ? "ธีมหน้าโปรไฟล์ของฉัน" : "My Profile Theme"}
                  </Label>
                  <div className="grid grid-cols-1 gap-2">
                    {PROFILE_THEME_OPTIONS.map((theme) => {
                      const selected = theme.id === profileTheme;
                      return (
                        <button
                          key={theme.id}
                          type="button"
                          onClick={() => handleThemeSelect(theme.id)}
                          className={cn(
                            "w-full rounded-lg border px-3 py-2.5 text-left transition-all duration-200",
                            selected
                              ? "border-primary bg-primary/10 ring-1 ring-primary/30"
                              : "border-slate-200 bg-white hover:border-slate-300"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <span className={cn("h-4 w-4 rounded-full bg-gradient-to-r", theme.preview)} />
                            <span className="text-sm font-medium text-slate-700">
                              {language === "th" ? theme.labelTh : theme.labelEn}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Display Name */}
                <div className="space-y-2 mb-4 border-t border-slate-200 dark:border-slate-700 pt-4">
                  <Label htmlFor="displayName" className="flex items-center gap-2 text-sm font-medium text-slate-700">
                    <User className={cn("h-4 w-4", activeTheme.accentIcon)} />
                    {language === "th" ? "ชื่อที่แสดง" : "Display Name"}
                  </Label>
                  <Input
                    id="displayName"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder={language === "th" ? "กรอกชื่อที่แสดง" : "Enter display name"}
                    className="border-slate-300 focus-visible:ring-primary bg-white"
                  />
                </div>

                <div className="space-y-2 mb-4 border-t border-slate-200 dark:border-slate-700 pt-4">
                  <Label className="text-sm font-medium text-slate-700">
                    {language === "th" ? "ความรู้สึกตอนนี้ (กล่องคำพูด)" : "Current Mood (speech bubble)"}
                  </Label>
                  <Input
                    value={statusMessage}
                    onChange={(e) => setStatusMessage(e.target.value)}
                    maxLength={80}
                    placeholder={language === "th" ? "เช่น วันนี้อารมณ์ดีมาก ☕" : "e.g. Feeling great today ☕"}
                    className="border-slate-300 focus-visible:ring-primary bg-white"
                  />
                </div>

                <div className="space-y-2 mb-4 border-t border-slate-200 dark:border-slate-700 pt-4">
                  <Label className="text-sm font-medium text-slate-700">
                    {language === "th" ? "Bio สั้นๆ" : "Short Bio"}
                  </Label>
                  <Input
                    value={bioShort}
                    onChange={(e) => setBioShort(e.target.value)}
                    maxLength={140}
                    placeholder={language === "th" ? "แนะนำตัวสั้นๆ" : "Tell people about yourself"}
                    className="border-slate-300 focus-visible:ring-primary bg-white"
                  />
                </div>

                <div className="space-y-2 mb-4 border-t border-slate-200 dark:border-slate-700 pt-4 text-left">
                  <Label className="text-sm font-medium text-slate-700">
                    {language === "th" ? "ลิงก์โซเชียล" : "Social Links"}
                  </Label>
                  <Input
                    value={socialFacebook}
                    onChange={(e) => setSocialFacebook(e.target.value)}
                    placeholder="Facebook URL"
                    className="border-slate-300 focus-visible:ring-primary bg-white"
                  />
                  <Input
                    value={socialInstagram}
                    onChange={(e) => setSocialInstagram(e.target.value)}
                    placeholder="Instagram URL"
                    className="border-slate-300 focus-visible:ring-primary bg-white"
                  />
                  <Input
                    value={socialTiktok}
                    onChange={(e) => setSocialTiktok(e.target.value)}
                    placeholder="TikTok URL"
                    className="border-slate-300 focus-visible:ring-primary bg-white"
                  />
                </div>

                {/* Email (read-only) */}
                <div className="space-y-2 mb-4">
                  <Label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                    <Mail className={cn("h-4 w-4", activeTheme.accentIcon)} />
                    {language === "th" ? "อีเมล" : "Email"}
                  </Label>
                  <Input value={user?.email || ""} disabled className="bg-slate-100 text-xs border-slate-300 text-slate-600" />
                </div>

                {/* Save Button */}
                <Button
                  onClick={handleSaveProfile}
                  disabled={isSaving || !displayName.trim()}
                  className={cn("w-full text-white font-semibold shadow-md mb-2", activeTheme.primaryButton)}
                >
                  {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {language === "th" ? "บันทึกโปรไฟล์" : "Save Profile"}
                </Button>

                {/* Logout */}
                <Button
                  onClick={handleLogout}
                  variant="outline"
                  className="w-full gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20 border-slate-300 dark:border-slate-600 mb-3"
                >
                  <LogOut className="h-4 w-4" />
                  {language === "th" ? "ออกจากระบบ" : "Log Out"}
                </Button>

              </div>
            </Card>
          </div>

          {/* Stats Section - Right Side */}
          <div className="lg:col-span-3 space-y-6">
            <Tabs defaultValue="identity" className="w-full">
              <TabsList
                className={cn(
                  "w-full h-auto p-0 bg-transparent rounded-none justify-start gap-1 overflow-x-auto",
                  "overflow-y-hidden border-b border-slate-300/80 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
                )}
              >
                <TabsTrigger
                  value="identity"
                  className="rounded-t-[12px] rounded-b-none border border-slate-300 border-b-0 bg-white/70 px-4 py-2.5 text-sm font-semibold text-slate-600 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm data-[state=active]:-mb-px"
                >
                  {language === "th" ? "Identity" : "Identity"}
                </TabsTrigger>
                <TabsTrigger
                  value="achievement"
                  className="rounded-t-[12px] rounded-b-none border border-slate-300 border-b-0 bg-white/70 px-4 py-2.5 text-sm font-semibold text-slate-600 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm data-[state=active]:-mb-px"
                >
                  {language === "th" ? "Achievement" : "Achievement"}
                </TabsTrigger>
                <TabsTrigger
                  value="privilege"
                  className="rounded-t-[12px] rounded-b-none border border-slate-300 border-b-0 bg-white/70 px-4 py-2.5 text-sm font-semibold text-slate-600 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm data-[state=active]:-mb-px"
                >
                  {language === "th" ? "Privilege" : "Privilege"}
                </TabsTrigger>
                <TabsTrigger
                  value="gacha"
                  className="rounded-t-[12px] rounded-b-none border border-slate-300 border-b-0 bg-white/70 px-4 py-2.5 text-sm font-semibold text-slate-600 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm data-[state=active]:-mb-px"
                >
                  {language === "th" ? "Lucky Box" : "Lucky Box"}
                </TabsTrigger>
                <TabsTrigger
                  value="signature"
                  className="rounded-t-[12px] rounded-b-none border border-slate-300 border-b-0 bg-white/70 px-4 py-2.5 text-sm font-semibold text-slate-600 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm data-[state=active]:-mb-px"
                >
                  {language === "th" ? "Signature" : "Signature"}
                </TabsTrigger>
              </TabsList>

              <div className={cn("rounded-b-xl rounded-tr-xl border border-slate-300 border-t-0 bg-white p-5 shadow-md", activeTheme.cardBg, activeTheme.cardBorder)}>
                <TabsContent value="identity" className="mt-0 space-y-3 text-sm text-slate-700">
                  <div>
                    <span className="font-semibold">{language === "th" ? "ความรู้สึก: " : "Mood: "}</span>
                    {statusMessage || (language === "th" ? "ยังไม่ได้เพิ่ม" : "Not set")}
                  </div>
                  <div>
                    <span className="font-semibold">{language === "th" ? "Bio: " : "Bio: "}</span>
                    {bioShort || (language === "th" ? "ยังไม่ได้เพิ่ม" : "Not set")}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    {[
                      { label: "Facebook", value: socialFacebook },
                      { label: "Instagram", value: socialInstagram },
                      { label: "TikTok", value: socialTiktok },
                    ].map((link) => (
                      <div key={link.label} className="rounded-lg border border-slate-200 bg-white p-2.5">
                        <p className="text-xs text-slate-500 mb-1">{link.label}</p>
                        {link.value ? (
                          <a
                            href={link.value}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700"
                          >
                            <Link2 className="h-3.5 w-3.5" />
                            {language === "th" ? "เปิดลิงก์" : "Open link"}
                          </a>
                        ) : (
                          <span className="text-xs text-slate-400">{language === "th" ? "ยังไม่ได้เพิ่ม" : "Not set"}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="achievement" className="mt-0 space-y-4">
                  <div>
                    <p className="text-sm font-medium text-slate-700 mb-2">
                      {language === "th" ? "Badge Showcase" : "Badge Showcase"}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {showcasePerks.length > 0 ? (
                        showcasePerks.map(({ key, perk }) => (
                          <Badge key={key} variant="outline" className="bg-white border-slate-300 text-slate-700">
                            {perk.icon} {language === "th" ? perk.name : perk.nameEn}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-sm text-slate-500">
                          {language === "th" ? "ยังไม่มี Badge ที่ปลดล็อก" : "No unlocked badges yet"}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5 inline-flex items-center gap-2">
                    <Heart className="h-4 w-4 text-rose-600" />
                    <span className="text-sm font-semibold text-rose-700">
                      {language === "th" ? "Like ที่ได้รับรวม: " : "Total Likes Received: "}
                      {likesReceived.toLocaleString()}
                    </span>
                  </div>
                </TabsContent>

                <TabsContent value="privilege" className="mt-0">
                  <div className="flex flex-wrap gap-2">
                    {unlockedThemes.map((themeId) => {
                      const theme = PROFILE_THEME_OPTIONS.find((item) => item.id === themeId);
                      if (!theme) return null;

                      return (
                        <Badge key={theme.id} variant="outline" className="bg-white border-slate-300 text-slate-700">
                          <span className={cn("inline-block h-2.5 w-2.5 rounded-full bg-gradient-to-r mr-1.5", theme.preview)} />
                          {language === "th" ? theme.labelTh : theme.labelEn}
                        </Badge>
                      );
                    })}
                  </div>
                </TabsContent>

                <TabsContent value="gacha" className="mt-0 space-y-3">
                  <Button
                    onClick={handleOpenDailyGacha}
                    disabled={isGachaOpening}
                    className={cn("text-white", activeTheme.primaryButton)}
                  >
                    {isGachaOpening && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {hasClaimedToday
                      ? (language === "th" ? "วันนี้เปิดแล้ว" : "Opened today")
                      : (language === "th" ? "เปิดกล่องสุ่ม" : "Open Mystery Box")}
                  </Button>

                  {gachaResult && (
                    <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm text-slate-700">
                      <span className="font-semibold">
                        {language === "th" ? "ของรางวัลล่าสุด: " : "Latest reward: "}
                      </span>
                      {formatGachaReward(gachaResult.rewardType, gachaResult.rewardValue, gachaResult.rewardMeta)}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="signature" className="mt-0 space-y-3">
                  {!canUseSignature ? (
                    <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-700">
                      {language === "th"
                        ? "ยังไม่ถึงระดับที่ปลดล็อก Signature (ต้องยศไก่ยอดฝีมือ)"
                        : "Signature is locked. Requires Skilled Chick rank."}
                    </div>
                  ) : (
                    <>
                      <div className="space-y-2">
                        <Label>{language === "th" ? "คำคม/ข้อความปิดท้าย" : "Signature text"}</Label>
                        <Input
                          value={signatureText}
                          onChange={(e) => setSignatureText(e.target.value)}
                          placeholder={language === "th" ? "เช่น ฝึกทุกวัน ชนะทุกวัน" : "e.g. Learn daily, win daily"}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>{language === "th" ? "ลิงก์รูปภาพ Signature (ไม่บังคับ)" : "Signature image URL (optional)"}</Label>
                        <Input
                          value={signatureImageUrl}
                          onChange={(e) => setSignatureImageUrl(e.target.value)}
                          placeholder="https://..."
                        />
                      </div>
                      <label className="flex items-center gap-2 text-sm text-slate-700">
                        <input
                          type="checkbox"
                          checked={signatureEnabled}
                          onChange={(e) => setSignatureEnabled(e.target.checked)}
                        />
                        {language === "th" ? "เปิดใช้งาน Signature" : "Enable signature"}
                      </label>
                      <Button
                        onClick={handleSaveSignature}
                        disabled={isSavingSignature}
                        className={cn("text-white", activeTheme.primaryButton)}
                      >
                        {isSavingSignature ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        {language === "th" ? "บันทึก Signature" : "Save Signature"}
                      </Button>
                    </>
                  )}
                </TabsContent>
              </div>
            </Tabs>

            {/* User Engagement Stats */}
            {user?.id && <UserEngagementStats userId={user.id} language={language} />}
          </div>
        </div>

      </div>

      {/* Crop Dialog */}
      {cropImageSrc && (
        <AvatarCropDialog
          open={!!cropImageSrc}
          imageSrc={cropImageSrc}
          onClose={() => setCropImageSrc(null)}
          onCropComplete={handleCroppedUpload}
          language={language}
        />
      )}
    </div>
  );
};

export default Profile;
