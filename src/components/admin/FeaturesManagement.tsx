import { useState, useEffect, useCallback } from "react";
import { useLanguage } from "@/hooks/useLanguage";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { invalidateContentCache } from "@/hooks/useContentData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Loader2, Upload, Save, Trash2, Image as ImageIcon, GripVertical, Plus, X, Sparkles } from "lucide-react";
import sweetAlert from "@/lib/sweetAlert";
import { SectionHeadingEditor } from "./SectionHeadingEditor";

interface FeaturePanel {
  id: string;
  title_th: string;
  title_en: string;
  subtitle_th: string | null;
  subtitle_en: string | null;
  image_url: string | null;
  logo_url: string | null;
  sort_order: number;
  is_active: boolean;
}

export const FeaturesManagement = () => {
  const { language } = useLanguage();
  const queryClient = useQueryClient();
  const [panels, setPanels] = useState<FeaturePanel[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [uploading, setUploading] = useState<string | null>(null);

  const fetchPanels = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("feature_panels")
      .select("*")
      .order("sort_order");
    if (!error && data) setPanels(data as FeaturePanel[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetchPanels(); }, [fetchPanels]);

  const handleFieldUpdate = (id: string, field: string, value: string | boolean) => {
    setPanels((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    );
  };

  const handleSave = async (panel: FeaturePanel) => {
    setSaving(panel.id);
    const { error } = await supabase
      .from("feature_panels")
      .update({
        title_th: panel.title_th,
        title_en: panel.title_en,
        subtitle_th: panel.subtitle_th,
        subtitle_en: panel.subtitle_en,
        is_active: panel.is_active,
        sort_order: panel.sort_order,
      })
      .eq("id", panel.id);

    if (error) {
      sweetAlert.error(language === "th" ? "เกิดข้อผิดพลาด" : "Error saving");
    } else {
      sweetAlert.success(language === "th" ? "บันทึกสำเร็จ" : "Saved successfully");
      invalidateContentCache();
      queryClient.invalidateQueries({ queryKey: ["feature-panels"] });
    }
    setSaving(null);
  };

  const handleImageUpload = async (panelId: string, file: File, type: "image" | "logo") => {
    setUploading(`${panelId}-${type}`);
    const ext = file.name.split(".").pop();
    const path = `${type}/${panelId}-${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("features")
      .upload(path, file, { upsert: true });

    if (uploadError) {
      sweetAlert.error(language === "th" ? "อัปโหลดล้มเหลว" : "Upload failed");
      setUploading(null);
      return;
    }

    const { data: urlData } = supabase.storage.from("features").getPublicUrl(path);
    const field = type === "image" ? "image_url" : "logo_url";

    const { error: updateError } = await supabase
      .from("feature_panels")
      .update({ [field]: urlData.publicUrl })
      .eq("id", panelId);

    if (updateError) {
      sweetAlert.error(language === "th" ? "อัปเดตล้มเหลว" : "Update failed");
    } else {
      setPanels((prev) =>
        prev.map((p) => (p.id === panelId ? { ...p, [field]: urlData.publicUrl } : p))
      );
      sweetAlert.success(language === "th" ? "อัปโหลดสำเร็จ" : "Uploaded successfully");
      invalidateContentCache();
      queryClient.invalidateQueries({ queryKey: ["feature-panels"] });
    }
    setUploading(null);
  };

  const handleRemoveImage = async (panelId: string, type: "image" | "logo") => {
    const field = type === "image" ? "image_url" : "logo_url";
    const { error } = await supabase
      .from("feature_panels")
      .update({ [field]: null })
      .eq("id", panelId);

    if (!error) {
      setPanels((prev) =>
        prev.map((p) => (p.id === panelId ? { ...p, [field]: null } : p))
      );
      invalidateContentCache();
      queryClient.invalidateQueries({ queryKey: ["feature-panels"] });
    }
  };

  const handleDelete = async (panelId: string) => {
    const confirmed = await sweetAlert.modal.confirm(
      language === "th" ? "ลบรายการนี้?" : "Delete this panel?",
      language === "th" ? "การลบจะไม่สามารถกู้คืนได้" : "This action cannot be undone"
    );
    if (!confirmed) return;

    const { error } = await supabase.from("feature_panels").delete().eq("id", panelId);
    if (!error) {
      setPanels((prev) => prev.filter((p) => p.id !== panelId));
      sweetAlert.success(language === "th" ? "ลบสำเร็จ" : "Deleted successfully");
      invalidateContentCache();
      queryClient.invalidateQueries({ queryKey: ["feature-panels"] });
    }
  };

  const handleAdd = async () => {
    const newOrder = panels.length > 0 ? Math.max(...panels.map((p) => p.sort_order)) + 1 : 1;
    const { data, error } = await supabase
      .from("feature_panels")
      .insert({
        title_th: "รายการใหม่",
        title_en: "New Panel",
        sort_order: newOrder,
      })
      .select()
      .single();

    if (!error && data) {
      setPanels((prev) => [...prev, data as FeaturePanel]);
      sweetAlert.success(language === "th" ? "เพิ่มสำเร็จ" : "Added successfully");
    }
  };

  const handleToggleActive = async (panelId: string, isActive: boolean) => {
    const { error } = await supabase
      .from("feature_panels")
      .update({ is_active: !isActive })
      .eq("id", panelId);

    if (!error) {
      setPanels((prev) =>
        prev.map((p) => (p.id === panelId ? { ...p, is_active: !isActive } : p))
      );
      invalidateContentCache();
      queryClient.invalidateQueries({ queryKey: ["feature-panels"] });
    }
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
      <SectionHeadingEditor sectionKey="features" label={language === "th" ? "หัวข้อ Section Features" : "Features Section Heading"} />
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            {language === "th" ? "จัดการ Feature Panels" : "Feature Panels Management"}
          </h2>
          <p className="text-muted-foreground text-xs sm:text-sm mt-1">
            {language === "th"
              ? "จัดการรูปภาพและข้อมูล Horizontal Accordion บนหน้าแรก (แนะนำ 4 รายการ)"
              : "Manage Horizontal Accordion panels on homepage (recommended: 4 panels)"}
          </p>
        </div>
        <Button onClick={handleAdd} size="sm" className="gap-1.5" disabled={panels.length >= 6}>
          <Plus className="w-4 h-4" />
          {language === "th" ? "เพิ่ม" : "Add"}
        </Button>
      </div>

      <div className="space-y-4">
        {panels.map((panel, index) => (
          <Card key={panel.id} className={!panel.is_active ? "opacity-60" : ""}>
            <CardHeader className="p-4 sm:p-5 pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <GripVertical className="w-4 h-4 text-muted-foreground" />
                  <CardTitle className="text-sm sm:text-base">
                    #{panel.sort_order} — {language === "th" ? panel.title_th : panel.title_en}
                  </CardTitle>
                  <Badge variant={panel.is_active ? "default" : "secondary"} className="text-[10px]">
                    {panel.is_active ? "ON" : "OFF"}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={panel.is_active}
                    onCheckedChange={() => handleToggleActive(panel.id, panel.is_active)}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => handleDelete(panel.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-5 pt-0 space-y-4">
              {/* Images row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Main Image */}
                <div>
                  <Label className="text-xs mb-1.5 block">
                    {language === "th" ? "รูปพื้นหลัง" : "Background Image"}
                  </Label>
                  {panel.image_url ? (
                    <div className="relative rounded-lg overflow-hidden h-36">
                      <img src={panel.image_url} alt="" className="w-full h-full object-cover" />
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 h-7 w-7"
                        onClick={() => handleRemoveImage(panel.id, "image")}
                      >
                        <X className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center h-36 rounded-lg border-2 border-dashed border-border hover:border-primary/50 cursor-pointer transition-colors bg-muted/30">
                      {uploading === `${panel.id}-image` ? (
                        <Loader2 className="w-6 h-6 animate-spin text-primary" />
                      ) : (
                        <>
                          <Upload className="w-6 h-6 text-muted-foreground mb-1" />
                          <span className="text-xs text-muted-foreground">
                            {language === "th" ? "อัปโหลดรูปพื้นหลัง" : "Upload Background"}
                          </span>
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleImageUpload(panel.id, file, "image");
                        }}
                      />
                    </label>
                  )}
                </div>

                {/* Logo */}
                <div>
                  <Label className="text-xs mb-1.5 block">
                    {language === "th" ? "โลโก้ (ไม่บังคับ)" : "Logo (Optional)"}
                  </Label>
                  {panel.logo_url ? (
                    <div className="relative rounded-lg overflow-hidden h-36 bg-muted/30 flex items-center justify-center">
                      <img src={panel.logo_url} alt="" className="max-h-24 max-w-full object-contain" />
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 h-7 w-7"
                        onClick={() => handleRemoveImage(panel.id, "logo")}
                      >
                        <X className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center h-36 rounded-lg border-2 border-dashed border-border hover:border-primary/50 cursor-pointer transition-colors bg-muted/30">
                      {uploading === `${panel.id}-logo` ? (
                        <Loader2 className="w-6 h-6 animate-spin text-primary" />
                      ) : (
                        <>
                          <ImageIcon className="w-6 h-6 text-muted-foreground mb-1" />
                          <span className="text-xs text-muted-foreground">
                            {language === "th" ? "อัปโหลดโลโก้" : "Upload Logo"}
                          </span>
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleImageUpload(panel.id, file, "logo");
                        }}
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* Text fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">{language === "th" ? "ชื่อ (ไทย)" : "Title (Thai)"}</Label>
                  <Input
                    value={panel.title_th}
                    onChange={(e) => handleFieldUpdate(panel.id, "title_th", e.target.value)}
                    className="mt-1 h-9 text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs">{language === "th" ? "ชื่อ (EN)" : "Title (EN)"}</Label>
                  <Input
                    value={panel.title_en}
                    onChange={(e) => handleFieldUpdate(panel.id, "title_en", e.target.value)}
                    className="mt-1 h-9 text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs">{language === "th" ? "คำอธิบาย (ไทย)" : "Subtitle (Thai)"}</Label>
                  <Input
                    value={panel.subtitle_th || ""}
                    onChange={(e) => handleFieldUpdate(panel.id, "subtitle_th", e.target.value)}
                    className="mt-1 h-9 text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs">{language === "th" ? "คำอธิบาย (EN)" : "Subtitle (EN)"}</Label>
                  <Input
                    value={panel.subtitle_en || ""}
                    onChange={(e) => handleFieldUpdate(panel.id, "subtitle_en", e.target.value)}
                    className="mt-1 h-9 text-sm"
                  />
                </div>
              </div>

              {/* Sort order + Save */}
              <div className="flex items-center gap-3">
                <div className="w-20">
                  <Label className="text-xs">{language === "th" ? "ลำดับ" : "Order"}</Label>
                  <Input
                    type="number"
                    value={panel.sort_order}
                    onChange={(e) => handleFieldUpdate(panel.id, "sort_order", e.target.value)}
                    className="mt-1 h-9 text-sm"
                  />
                </div>
                <Button
                  onClick={() => handleSave(panel)}
                  disabled={saving === panel.id}
                  size="sm"
                  className="mt-5 gap-1.5"
                >
                  {saving === panel.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {language === "th" ? "บันทึก" : "Save"}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
