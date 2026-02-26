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
import { ArrowLeft, Camera, Loader2, LogOut, User, Mail, Trash2 } from "lucide-react";
import sweetAlert from "@/lib/sweetAlert";
import AvatarCropDialog from "@/components/AvatarCropDialog";
import { format } from "date-fns";

const Profile = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const t = translations[language];
  const { user, isAuthenticated, isLoading: authLoading, logout } = useAuth();

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
  }, [isAuthenticated, authLoading, navigate]);

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
    navigate("/");
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
    <div className="min-h-screen bg-gradient-to-b from-background via-secondary/10 to-primary/5 p-4 pt-12 sm:pt-[3.5rem]">
      <div className="w-full max-w-lg mx-auto">
        {/* Back button */}
        <Button
          onClick={() => navigate("/")}
          className="mb-4 gap-2 font-semibold text-sm px-4 py-2.5 rounded-lg bg-foreground text-background hover:bg-foreground/90 transition-all duration-200 active:scale-95 shadow-md hover:shadow-lg"
        >
          <ArrowLeft className="h-4 w-4" />
          {language === "th" ? "กลับหน้าแรก" : "Back to Home"}
        </Button>

        {/* Profile Card */}
        <Card className="animate-fade-in border-border/50 shadow-xl">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-xl sm:text-2xl font-serif">
              {language === "th" ? "โปรไฟล์ของฉัน" : "My Profile"}
            </CardTitle>
            <CardDescription>
              {language === "th"
                ? "จัดการข้อมูลส่วนตัวของคุณ"
                : "Manage your personal information"}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Avatar Section */}
            <div className="flex flex-col items-center gap-3">
              <div className="relative group">
                <Avatar className="h-24 w-24 sm:h-28 sm:w-28 border-4 border-border shadow-lg">
                  <AvatarImage src={avatarUrl || undefined} alt={displayName} />
                  <AvatarFallback className="text-2xl font-bold bg-primary text-primary-foreground">
                    {getInitials(displayName || "U")}
                  </AvatarFallback>
                </Avatar>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-2 shadow-md hover:bg-primary/90 transition-all duration-200 active:scale-95 disabled:opacity-50"
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
                    className="absolute bottom-0 left-0 bg-destructive text-destructive-foreground rounded-full p-2 shadow-md hover:bg-destructive/90 transition-all duration-200 active:scale-95 disabled:opacity-50"
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
              <p className="text-xs text-muted-foreground">
                {language === "th"
                  ? "คลิกไอคอนกล้องเพื่อเปลี่ยนรูป หรือไอคอนถังขยะเพื่อลบ"
                  : "Click camera to change or trash to delete"}
              </p>
            </div>

            {/* Display Name */}
            <div className="space-y-2">
              <Label htmlFor="displayName" className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                {language === "th" ? "ชื่อที่แสดง" : "Display Name"}
              </Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder={language === "th" ? "กรอกชื่อที่แสดง" : "Enter display name"}
              />
            </div>

            {/* Email (read-only) */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                {language === "th" ? "อีเมล" : "Email"}
              </Label>
              <Input value={user?.email || ""} disabled className="bg-muted/50" />
            </div>

            {/* Save Button */}
            <Button
              onClick={handleSaveProfile}
              disabled={isSaving || !displayName.trim()}
              className="w-full"
            >
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {language === "th" ? "บันทึกโปรไฟล์" : "Save Profile"}
            </Button>

            {/* Divider */}
            <div className="border-t border-border" />

            {/* Logout */}
            <Button
              onClick={handleLogout}
              variant="outline"
              className="w-full gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <LogOut className="h-4 w-4" />
              {language === "th" ? "ออกจากระบบ" : "Log Out"}
            </Button>
          </CardContent>
        </Card>
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
