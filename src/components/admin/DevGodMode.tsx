import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/hooks/useLanguage";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Zap, Crown, User, ToggleRight, Users, Trash2, Trophy, Minus, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import sweetAlert from "@/lib/sweetAlert";
import { DEVELOPER_ID } from "@/hooks/useAdminStatus";
import { clearFeatureToggleCache } from "@/hooks/useFeatureToggle";
import { RANK_TIERS, getRankFromPoints } from "@/lib/pointSystem";
import {
  applySiteThemeClass,
  getSiteThemeFeatureKey,
  resolveSiteThemeFromRows,
  setLocalSiteTheme,
  SITE_THEME_FEATURE_KEYS,
  SITE_THEME_OPTIONS,
  SITE_THEME_SELECT_OPTIONS,
  type SiteThemeId,
} from "@/lib/siteTheme";

interface FeatureToggle {
  id: string;
  feature_key: string;
  feature_name_th: string;
  feature_name_en: string;
  is_enabled: boolean;
  description_th: string | null;
  description_en: string | null;
}

interface UserRole {
  id: string;
  user_id: string;
  role: string;
  created_at: string;
  display_name: string;
  avatar_url: string | null;
}

const REQUIRED_FEATURE_TOGGLES: Array<{
  feature_key: string;
  feature_name_th: string;
  feature_name_en: string;
  description_th: string;
  description_en: string;
  is_enabled: boolean;
}> = [
  {
    feature_key: "falling_leaves",
    feature_name_th: "เอฟเฟกต์ใบไม้หน้าแรก",
    feature_name_en: "Homepage Falling Leaves",
    description_th: "เอฟเฟกต์ใบไม้ร่วงในหน้าแรกของเว็บไซต์",
    description_en: "Falling leaves visual effect on the homepage",
    is_enabled: true,
  },
  {
    feature_key: "site_theme_ocean",
    feature_name_th: "ธีมเว็บไซต์: Ocean Blue",
    feature_name_en: "Website Theme: Ocean Blue",
    description_th: "ธีมหลักสีฟ้า Ocean สำหรับทั้งเว็บไซต์",
    description_en: "Ocean Blue global website theme",
    is_enabled: true,
  },
  {
    feature_key: "site_theme_sunset",
    feature_name_th: "ธีมเว็บไซต์: Sunset Gold",
    feature_name_en: "Website Theme: Sunset Gold",
    description_th: "ธีมสีทองส้ม Sunset สำหรับทั้งเว็บไซต์",
    description_en: "Sunset Gold global website theme",
    is_enabled: false,
  },
  {
    feature_key: "site_theme_forest",
    feature_name_th: "ธีมเว็บไซต์: Forest Mint",
    feature_name_en: "Website Theme: Forest Mint",
    description_th: "ธีมสีเขียว Forest สำหรับทั้งเว็บไซต์",
    description_en: "Forest Mint global website theme",
    is_enabled: false,
  },
  {
    feature_key: "site_theme_royal",
    feature_name_th: "ธีมเว็บไซต์: Royal Purple",
    feature_name_en: "Website Theme: Royal Purple",
    description_th: "ธีมสีม่วง Royal สำหรับทั้งเว็บไซต์",
    description_en: "Royal Purple global website theme",
    is_enabled: false,
  },
  {
    feature_key: "site_theme_mono",
    feature_name_th: "ธีมเว็บไซต์: Mono Graphite",
    feature_name_en: "Website Theme: Mono Graphite",
    description_th: "ธีมโมโนโทน Mono สำหรับทั้งเว็บไซต์",
    description_en: "Mono Graphite global website theme",
    is_enabled: false,
  },
];

const roleConfig = {
  developer: { icon: Zap, color: "text-yellow-500", badge: "outline" as const, label: "Developer" },
  admin: { icon: Crown, color: "text-red-500", badge: "destructive" as const, label: "Admin" },
  user: { icon: User, color: "text-foreground/70", badge: "secondary" as const, label: "User" },
};

export const DevGodMode = () => {
  const { language } = useLanguage();
  const { user: currentUser } = useAuth();
  const [features, setFeatures] = useState<FeatureToggle[]>([]);
  const [users, setUsers] = useState<UserRole[]>([]);
  const [userProfiles, setUserProfiles] = useState<Map<string, { reputation_points: number }>>(new Map());
  const [pointInputs, setPointInputs] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [activeSiteTheme, setActiveSiteTheme] = useState<SiteThemeId>("original");
  const nonThemeFeatures = features.filter((feature) => !SITE_THEME_FEATURE_KEYS.includes(feature.feature_key));

  const fetchData = async () => {
    setLoading(true);

    await Promise.all(
      REQUIRED_FEATURE_TOGGLES.map((feature) =>
        supabase
          .from("feature_toggles")
          .upsert(feature, { onConflict: "feature_key" })
      )
    );

    const [featuresRes, rolesRes] = await Promise.all([
      supabase.from("feature_toggles").select("*").order("feature_key"),
      supabase.from("user_roles").select("id, user_id, role, created_at").order("created_at"),
    ]);

    if (featuresRes.data) setFeatures(featuresRes.data as FeatureToggle[]);

    if (rolesRes.data) {
      const userIds = rolesRes.data.map((u) => u.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, display_name, avatar_url, reputation_points")
        .in("id", userIds);
      const profileMap = new Map(profiles?.map((p) => [p.id, p]) || []);
      setUserProfiles(new Map(profiles?.map((p) => [p.id, { reputation_points: p.reputation_points ?? 0 }]) || []));
      setUsers(
        rolesRes.data.map((ur) => {
          const profile = profileMap.get(ur.user_id);
          return {
            ...ur,
            display_name: profile?.display_name || "Unknown",
            avatar_url: profile?.avatar_url || null,
          };
        })
      );
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    const themeRows = features
      .filter((feature) => SITE_THEME_FEATURE_KEYS.includes(feature.feature_key))
      .map((feature) => ({
        feature_key: feature.feature_key,
        is_enabled: feature.is_enabled,
      }));

    setActiveSiteTheme(resolveSiteThemeFromRows(themeRows));
  }, [features]);

  const handlePointsChange = async (userId: string, newPoints: number) => {
    setUpdating(`pts-${userId}`);
    const { error } = await supabase
      .from("profiles")
      .update({ reputation_points: newPoints })
      .eq("id", userId);

    if (error) {
      sweetAlert.error(language === "th" ? "เกิดข้อผิดพลาด" : "Error updating points");
    } else {
      setUserProfiles((prev) => {
        const next = new Map(prev);
        next.set(userId, { reputation_points: newPoints });
        return next;
      });
      setPointInputs((prev) => {
        const next = { ...prev };
        delete next[userId];
        return next;
      });
      const rank = getRankFromPoints(newPoints);
      sweetAlert.success(
        language === "th"
          ? `อัปเดตเป็น ${newPoints} คะแนน (${rank.icon} ${rank.name})`
          : `Updated to ${newPoints} points (${rank.icon} ${rank.nameEn})`
      );
    }
    setUpdating(null);
  };

  const handleToggleFeature = async (id: string, currentValue: boolean) => {
    setUpdating(id);
    const { error } = await supabase
      .from("feature_toggles")
      .update({ is_enabled: !currentValue })
      .eq("id", id);

    if (error) {
      sweetAlert.error(language === "th" ? "เกิดข้อผิดพลาด" : "Error updating feature");
    } else {
      setFeatures((prev) => prev.map((f) => (f.id === id ? { ...f, is_enabled: !currentValue } : f)));
      clearFeatureToggleCache();
    }
    setUpdating(null);
  };

  const handleWebsiteThemeChange = async (themeId: SiteThemeId) => {
    if (updating === "site-theme" || themeId === activeSiteTheme) return;

    setActiveSiteTheme(themeId);
    applySiteThemeClass(themeId);
    setLocalSiteTheme(themeId);
    setUpdating("site-theme");

    const updates = await Promise.all(
      SITE_THEME_OPTIONS.map((theme) =>
        supabase
          .from("feature_toggles")
          .update({ is_enabled: theme.id === themeId })
          .eq("feature_key", getSiteThemeFeatureKey(theme.id))
      )
    );

    const hasError = updates.some((result) => result.error);

    if (hasError) {
      sweetAlert.warning(
        language === "th"
          ? "เปลี่ยนธีมเฉพาะเครื่องนี้ได้แล้ว แต่ยังอัปเดตทั้งระบบไม่ได้ (รอ DB migration/Policy)"
          : "Theme applied locally, but global update failed (DB migration/policy pending)."
      );
      setUpdating(null);
      return;
    }

    const selectedFeatureKey = themeId === "original" ? null : getSiteThemeFeatureKey(themeId);

    setFeatures((prev) =>
      prev.map((feature) => {
        if (!SITE_THEME_FEATURE_KEYS.includes(feature.feature_key)) return feature;
        return {
          ...feature,
          is_enabled: selectedFeatureKey === feature.feature_key,
        };
      })
    );

    clearFeatureToggleCache();
    sweetAlert.success(language === "th" ? "อัปเดตธีมเว็บไซต์สำเร็จ" : "Website theme updated");
    setUpdating(null);
  };

  const handleRoleChange = async (userRoleId: string, userId: string, newRole: string) => {
    const confirmed = await sweetAlert.modal.confirm(
      language === "th" ? `เปลี่ยนบทบาทเป็น "${newRole}"?` : `Change role to "${newRole}"?`,
      language === "th" ? "การเปลี่ยนบทบาทจะมีผลทันที" : "This change takes effect immediately"
    );
    if (!confirmed) return;

    setUpdating(userRoleId);
    const { error } = await supabase.from("user_roles").update({ role: newRole as any }).eq("id", userRoleId);
    if (error) {
      sweetAlert.error(language === "th" ? "เกิดข้อผิดพลาด" : "Error updating role");
    } else {
      sweetAlert.success(language === "th" ? "อัปเดตสำเร็จ" : "Updated successfully");
      fetchData();
    }
    setUpdating(null);
  };

  const handleDeleteUser = async (userId: string, displayName: string) => {
    if (userId === DEVELOPER_ID) {
      sweetAlert.error(language === "th" ? "ไม่สามารถลบ Developer ได้" : "Cannot delete Developer");
      return;
    }

    const confirmed = await sweetAlert.modal.confirm(
      language === "th" ? `ลบผู้ใช้ "${displayName}"?` : `Delete user "${displayName}"?`,
      language === "th" ? "การลบจะไม่สามารถกู้คืนได้" : "This action cannot be undone"
    );
    if (!confirmed) return;

    setUpdating(userId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-user`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({ user_id: userId }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      sweetAlert.success(language === "th" ? "ลบผู้ใช้สำเร็จ" : "User deleted successfully");
      fetchData();
    } catch (err: any) {
      sweetAlert.error(err.message || (language === "th" ? "เกิดข้อผิดพลาด" : "Error deleting user"));
    }
    setUpdating(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-2">
          <Zap className="w-6 h-6 text-yellow-500" />
          Dev God Mode
        </h2>
        <p className="text-muted-foreground text-sm mt-1">
          {language === "th" ? "ควบคุมทุกอย่างในระบบ — เฉพาะ Developer เท่านั้น" : "Full system control — Developer only"}
        </p>
      </div>

      {/* Feature Toggles */}
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Zap className="w-5 h-5 text-yellow-500" />
            {language === "th" ? "ธีมเว็บไซต์ (ทดสอบโดย Dev)" : "Website Theme (Dev Testing)"}
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            {language === "th"
              ? "ย้ายมาจากหน้า Dashboard เพื่อป้องกัน Admin กดเล่นระหว่างรอ DB พร้อมใช้งาน"
              : "Moved from Dashboard to prevent Admin testing before DB is fully ready"}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2.5">
            {SITE_THEME_SELECT_OPTIONS.map((theme) => {
              const isActive = activeSiteTheme === theme.id;
              return (
                <Button
                  key={theme.id}
                  type="button"
                  variant={isActive ? "default" : "outline"}
                  disabled={updating === "site-theme"}
                  onClick={() => handleWebsiteThemeChange(theme.id)}
                  className="h-auto py-2.5 px-3 flex flex-col items-start gap-2"
                >
                  <span className={`w-full h-2.5 rounded-full bg-gradient-to-r ${theme.preview}`} />
                  <span className="text-xs font-semibold leading-none">
                    {language === "th" ? theme.labelTh : theme.labelEn}
                  </span>
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <ToggleRight className="w-5 h-5 text-primary" />
            {language === "th" ? "เปิด/ปิด ฟีเจอร์" : "Feature Toggles"}
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            {language === "th" ? "ควบคุมการเปิด/ปิดฟังก์ชันต่างๆ ของเว็บไซต์" : "Control which features are enabled on the website"}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
          <div className="space-y-3">
            {nonThemeFeatures.map((f) => (
              <div key={f.id} className="flex items-center justify-between p-3 rounded-lg border border-border">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">
                    {language === "th" ? f.feature_name_th : f.feature_name_en}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {language === "th" ? f.description_th : f.description_en}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  <Badge variant={f.is_enabled ? "default" : "secondary"} className="text-[10px]">
                    {f.is_enabled ? "ON" : "OFF"}
                  </Badge>
                  <Switch
                    checked={f.is_enabled}
                    onCheckedChange={() => handleToggleFeature(f.id, f.is_enabled)}
                    disabled={updating === f.id}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* User Role Management */}
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Users className="w-5 h-5 text-primary" />
            {language === "th" ? "จัดการบทบาทผู้ใช้ทั้งหมด" : "All User Roles"}
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            {language === "th"
              ? `${users.length} ผู้ใช้ — Developer ลบไม่ได้ / Admin จัดการบทบาทผู้ใช้`
              : `${users.length} users — Developer is protected / Admin manages user roles`}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
          {/* Mobile */}
          <div className="sm:hidden space-y-3">
            {users.map((u) => {
              const config = roleConfig[u.role as keyof typeof roleConfig] || roleConfig.user;
              const RoleIcon = config.icon;
              const isDev = u.user_id === DEVELOPER_ID;

              return (
                <div key={u.id} className="flex items-center gap-3 p-3 rounded-lg border border-border">
                  {u.avatar_url && /^[\p{Emoji}]$/u.test(u.avatar_url) ? (
                    <div className="h-9 w-9 rounded-lg bg-primary/15 flex items-center justify-center text-sm font-semibold shrink-0">
                      {u.avatar_url}
                    </div>
                  ) : (
                    <Avatar className="h-9 w-9 shrink-0">
                      <AvatarImage src={u.avatar_url || undefined} />
                      <AvatarFallback>{u.display_name.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">
                      {u.display_name}
                      {isDev && <span className="text-xs text-yellow-500 ml-1">🔒</span>}
                    </p>
                    <Badge variant={config.badge} className="gap-0.5 text-[10px] h-5 mt-1">
                      <RoleIcon className="w-2.5 h-2.5" />
                      {config.label}
                    </Badge>
                  </div>
                  <div className="shrink-0 flex items-center gap-1.5">
                    <Select
                      value={u.role}
                      onValueChange={(val) => handleRoleChange(u.id, u.user_id, val)}
                      disabled={updating === u.id || updating === u.user_id}
                    >
                      <SelectTrigger className="w-24 h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="developer">Developer</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="user">User</SelectItem>
                      </SelectContent>
                    </Select>
                    {!isDev && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleDeleteUser(u.user_id, u.display_name)}
                        disabled={updating === u.user_id}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop */}
          <div className="hidden sm:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{language === "th" ? "ผู้ใช้" : "User"}</TableHead>
                  <TableHead>{language === "th" ? "บทบาท" : "Role"}</TableHead>
                  <TableHead>{language === "th" ? "วันที่เข้าร่วม" : "Joined"}</TableHead>
                  <TableHead className="text-right">{language === "th" ? "จัดการ" : "Actions"}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => {
                  const config = roleConfig[u.role as keyof typeof roleConfig] || roleConfig.user;
                  const RoleIcon = config.icon;
                  const isDev = u.user_id === DEVELOPER_ID;

                  return (
                    <TableRow key={u.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {u.avatar_url && /^[\p{Emoji}]$/u.test(u.avatar_url) ? (
                            <div className="h-9 w-9 rounded-lg bg-primary/15 flex items-center justify-center text-sm font-semibold">
                              {u.avatar_url}
                            </div>
                          ) : (
                            <Avatar className="h-9 w-9">
                              <AvatarImage src={u.avatar_url || undefined} />
                              <AvatarFallback>{u.display_name.charAt(0).toUpperCase()}</AvatarFallback>
                            </Avatar>
                          )}
                          <p className="font-medium text-sm">
                            {u.display_name}
                            {isDev && <span className="text-xs text-yellow-500 ml-1">🔒 Developer</span>}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={config.badge} className="gap-1">
                          <RoleIcon className="w-3 h-3" />
                          {config.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(u.created_at).toLocaleDateString(language === "th" ? "th-TH" : "en-US")}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Select
                            value={u.role}
                            onValueChange={(val) => handleRoleChange(u.id, u.user_id, val)}
                            disabled={updating === u.id || updating === u.user_id}
                          >
                            <SelectTrigger className="w-28 h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="developer">Developer</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                              <SelectItem value="user">User</SelectItem>
                            </SelectContent>
                          </Select>
                          {!isDev && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => handleDeleteUser(u.user_id, u.display_name)}
                              disabled={updating === u.user_id}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      {/* Rank / Points Management */}
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Trophy className="w-5 h-5 text-primary" />
            {language === "th" ? "จัดการคะแนน & ยศผู้ใช้" : "User Points & Rank Management"}
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            {language === "th"
              ? "ปรับ reputation_points ของผู้ใช้เพื่อเปลี่ยนยศที่แสดงทั่วเว็บไซต์"
              : "Adjust user reputation points to change their displayed rank site-wide"}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
          <div className="space-y-3">
            {users.map((u) => {
              const profile = userProfiles.get(u.user_id);
              const pts = profile?.reputation_points ?? 0;
              const rank = getRankFromPoints(pts);
              const isDev = u.user_id === DEVELOPER_ID;

              return (
                <div key={`rank-${u.id}`} className="flex items-center gap-3 p-3 rounded-lg border border-border">
                  <div className="text-2xl">{rank.icon}</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">
                      {u.display_name}
                      {isDev && <span className="text-xs text-yellow-500 ml-1">⚡</span>}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {rank.name} ({rank.nameEn}) — {pts} {language === "th" ? "คะแนน" : "pts"}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      disabled={updating === `pts-${u.user_id}`}
                      onClick={() => handlePointsChange(u.user_id, Math.max(0, pts - 50))}
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </Button>
                    <Input
                      type="number"
                      min={0}
                      className="w-20 h-8 text-xs text-center"
                      value={pointInputs[u.user_id] ?? pts}
                      onChange={(e) => setPointInputs(prev => ({ ...prev, [u.user_id]: Number(e.target.value) }))}
                      onBlur={() => {
                        const val = pointInputs[u.user_id];
                        if (val !== undefined && val !== pts) handlePointsChange(u.user_id, Math.max(0, val));
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const val = pointInputs[u.user_id];
                          if (val !== undefined && val !== pts) handlePointsChange(u.user_id, Math.max(0, val));
                        }
                      }}
                      disabled={updating === `pts-${u.user_id}`}
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      disabled={updating === `pts-${u.user_id}`}
                      onClick={() => handlePointsChange(u.user_id, pts + 50)}
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Rank Tier Reference */}
          <div className="mt-4 p-3 rounded-lg bg-muted/50 border border-border">
            <p className="text-xs font-medium text-muted-foreground mb-2">
              {language === "th" ? "ตารางยศอ้างอิง" : "Rank Tier Reference"}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {RANK_TIERS.map((tier) => (
                <div key={tier.id} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span>{tier.icon}</span>
                  <span className="font-medium">{tier.name}</span>
                  <span className="opacity-70">
                    {tier.minPoints}-{tier.maxPoints === Infinity ? "∞" : tier.maxPoints}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
