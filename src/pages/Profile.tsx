import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage, translations } from "@/hooks/useLanguage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Camera, Loader2, LogOut, User, Mail, Trash2, Sparkles, Globe } from "lucide-react";
import sweetAlert from "@/lib/sweetAlert";
import AvatarCropDialog from "@/components/AvatarCropDialog";

import UserEngagementStats from "@/components/UserEngagementStats";
import { format } from "date-fns";
import { useFeatureToggle, showFeatureDisabledAlert } from "@/hooks/useFeatureToggle";
import { useUserPerks, AVATAR_FRAMES } from "@/hooks/useUserPerks";

const Profile = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const t = translations[language];
  const { user, isAuthenticated, isLoading: authLoading, logout } = useAuth();
  const { isFeatureEnabled, isLoading: featureLoading } = useFeatureToggle();
  const { data: perksData } = useUserPerks(user?.id);

  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      const { data } = await supabase
        .from("profiles")
        .select("display_name, avatar_url")
        .eq("id", user.id)
        .maybeSingle();
      if (data) {
        setDisplayName(data.display_name || "");
        setAvatarUrl(data.avatar_url || null);
      } else {
        setDisplayName(user.name || "");
        setAvatarUrl(user.avatar || null);
      }
      setProfileLoaded(true);
    };
    loadProfile();
  }, [user?.id]);

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
      const { error } = await supabase
        .from("profiles")
        .update({ display_name: displayName.trim() })
        .eq("id", user.id);

      if (error) throw error;

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
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 p-4 pt-20 sm:pt-28">
      <div className="w-full max-w-6xl mx-auto">
        {/* Main Profile Section */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Profile Card - Left Side */}
          <div className="lg:col-span-1">
            <Card className="border-0 shadow-lg overflow-hidden bg-white dark:bg-slate-900">
              {/* Blue Header */}
              <div className="h-24 bg-gradient-to-r from-blue-500 via-blue-400 to-cyan-400 relative overflow-hidden flex items-center justify-center">
                <Sparkles className="h-8 w-8 text-white/60 absolute top-2 right-4 animate-pulse" />
              </div>

              <div className="px-4 pt-1 pb-4 text-center -mt-12 relative z-10">
                {/* Avatar Section */}
                <div className="flex flex-col items-center gap-4 mb-4">
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-cyan-300 rounded-full blur opacity-30 group-hover:opacity-50 transition-opacity duration-300" />
                    <Avatar className={`h-28 w-28 relative border-4 border-white shadow-xl ${perksData?.avatar_frame && perksData.active_perks?.includes("custom-avatar-frame") ? AVATAR_FRAMES[perksData.avatar_frame]?.className || "" : ""}`}>
                      <AvatarImage src={avatarUrl || undefined} alt={displayName} />
                      <AvatarFallback className="text-3xl font-bold bg-gradient-to-br from-blue-500 to-cyan-400 text-white">
                        {getInitials(displayName || "U")}
                      </AvatarFallback>
                    </Avatar>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      className="absolute bottom-0 right-0 bg-blue-600 text-white rounded-full p-2.5 shadow-lg hover:bg-blue-700 transition-all duration-200 active:scale-95 disabled:opacity-50"
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
                {perksData?.active_perks?.includes("custom-title") && perksData.custom_title && (
                  <p className="text-xs text-blue-600 dark:text-blue-400 font-medium mb-1">
                    「{perksData.custom_title}」
                  </p>
                )}
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                  {language === "th" ? "จัดการโปรไฟล์ของคุณ" : "Manage your profile"}
                </p>

                {/* Display Name */}
                <div className="space-y-2 mb-4 border-t border-slate-200 dark:border-slate-700 pt-4">
                  <Label htmlFor="displayName" className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                    <User className="h-4 w-4 text-blue-600" />
                    {language === "th" ? "ชื่อที่แสดง" : "Display Name"}
                  </Label>
                  <Input
                    id="displayName"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder={language === "th" ? "กรอกชื่อที่แสดง" : "Enter display name"}
                    className="border-slate-300 focus-visible:ring-blue-500 dark:bg-slate-800 dark:border-slate-600 dark:text-white"
                  />
                </div>

                {/* Email (read-only) */}
                <div className="space-y-2 mb-4">
                  <Label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                    <Mail className="h-4 w-4 text-blue-600" />
                    {language === "th" ? "อีเมล" : "Email"}
                  </Label>
                  <Input value={user?.email || ""} disabled className="bg-slate-100 dark:bg-slate-800 text-xs border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400" />
                </div>

                {/* Save Button */}
                <Button
                  onClick={handleSaveProfile}
                  disabled={isSaving || !displayName.trim()}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-md mb-2"
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

                {/* Go to Website Button */}
                <Button
                  onClick={() => navigate("/")}
                  className="w-full gap-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold shadow-md dark:bg-slate-950 dark:hover:bg-slate-900"
                >
                  <Globe className="h-4 w-4" />
                  {language === "th" ? "เข้าสู่เว็บไซด์" : "Go to Website"}
                </Button>
              </div>
            </Card>
          </div>

          {/* Stats Section - Right Side */}
          <div className="lg:col-span-3 space-y-6">
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
