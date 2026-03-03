import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/hooks/useLanguage";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, Save, Type } from "lucide-react";
import { toast } from "@/lib/toast";

interface SectionHeadingEditorProps {
  sectionKey: string;
  label?: string;
}

export const SectionHeadingEditor = ({ sectionKey, label }: SectionHeadingEditorProps) => {
  const { language } = useLanguage();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [heading, setHeading] = useState({
    id: "",
    title_th: "",
    title_en: "",
    subtitle_th: "",
    subtitle_en: "",
  });

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("section_headings")
        .select("*")
        .eq("section_key", sectionKey)
        .maybeSingle();
      if (data) {
        setHeading({
          id: data.id,
          title_th: data.title_th || "",
          title_en: data.title_en || "",
          subtitle_th: data.subtitle_th || "",
          subtitle_en: data.subtitle_en || "",
        });
      }
      setLoading(false);
    };
    fetch();
  }, [sectionKey]);

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("section_headings")
      .update({
        title_th: heading.title_th,
        title_en: heading.title_en,
        subtitle_th: heading.subtitle_th || null,
        subtitle_en: heading.subtitle_en || null,
      })
      .eq("section_key", sectionKey);

    if (error) {
      toast.error(language === "th" ? "บันทึกล้มเหลว" : "Save failed");
    } else {
      toast.success(language === "th" ? "บันทึกหัวข้อสำเร็จ" : "Section heading saved");
      queryClient.invalidateQueries({ queryKey: ["section-heading", sectionKey] });
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <Card className="border-dashed border-primary/30">
        <CardContent className="flex items-center justify-center py-6">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-dashed border-primary/30 bg-primary/5">
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-sm flex items-center gap-2 text-primary">
          <Type className="w-4 h-4" />
          {label || (language === "th" ? "หัวข้อ Section" : "Section Heading")}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-2 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">{language === "th" ? "หัวข้อ (ไทย)" : "Title (Thai)"}</Label>
            <Input
              value={heading.title_th}
              onChange={(e) => setHeading((h) => ({ ...h, title_th: e.target.value }))}
              className="mt-1 h-9 text-sm"
            />
          </div>
          <div>
            <Label className="text-xs">{language === "th" ? "หัวข้อ (EN)" : "Title (EN)"}</Label>
            <Input
              value={heading.title_en}
              onChange={(e) => setHeading((h) => ({ ...h, title_en: e.target.value }))}
              className="mt-1 h-9 text-sm"
            />
          </div>
          <div>
            <Label className="text-xs">{language === "th" ? "คำอธิบาย (ไทย)" : "Subtitle (Thai)"}</Label>
            <Input
              value={heading.subtitle_th}
              onChange={(e) => setHeading((h) => ({ ...h, subtitle_th: e.target.value }))}
              className="mt-1 h-9 text-sm"
            />
          </div>
          <div>
            <Label className="text-xs">{language === "th" ? "คำอธิบาย (EN)" : "Subtitle (EN)"}</Label>
            <Input
              value={heading.subtitle_en}
              onChange={(e) => setHeading((h) => ({ ...h, subtitle_en: e.target.value }))}
              className="mt-1 h-9 text-sm"
            />
          </div>
        </div>
        <Button onClick={handleSave} disabled={saving} size="sm" className="gap-1.5">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {language === "th" ? "บันทึกหัวข้อ" : "Save Heading"}
        </Button>
      </CardContent>
    </Card>
  );
};
