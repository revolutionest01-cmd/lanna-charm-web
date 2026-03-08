import { useState, useEffect, useCallback, useRef } from "react";
import { useLanguage } from "@/hooks/useLanguage";
import { t4 } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  GripVertical, Loader2, Save, RotateCcw, Layout,
  Image, Sparkles, Calendar, Home, Coffee, ImageIcon, MessageSquare, Phone, Layers
} from "lucide-react";
import { toast } from "sonner";

interface SectionOrder {
  id: string;
  section_key: string;
  order_index: number;
  is_visible: boolean;
}

const BUILT_IN_SECTIONS: Record<string, { icon: any; labelTh: string; labelEn: string; color: string }> = {
  hero: { icon: Image, labelTh: "Hero Section", labelEn: "Hero Section", color: "text-blue-500" },
  features: { icon: Sparkles, labelTh: "จุดเด่น", labelEn: "Features", color: "text-amber-500" },
  events: { icon: Calendar, labelTh: "อีเว้นท์", labelEn: "Events", color: "text-purple-500" },
  rooms: { icon: Home, labelTh: "ห้องพัก", labelEn: "Rooms", color: "text-green-500" },
  menu: { icon: Coffee, labelTh: "เมนู", labelEn: "Menu", color: "text-orange-500" },
  gallery: { icon: ImageIcon, labelTh: "แกลเลอรี่", labelEn: "Gallery", color: "text-pink-500" },
  reviews: { icon: MessageSquare, labelTh: "รีวิว", labelEn: "Reviews", color: "text-rose-500" },
  contact: { icon: Phone, labelTh: "ติดต่อ", labelEn: "Contact", color: "text-teal-500" },
};

export const HomepageLayoutManagement = () => {
  const { language } = useLanguage();
  const [sections, setSections] = useState<SectionOrder[]>([]);
  const [customSections, setCustomSections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [orderRes, customRes] = await Promise.all([
      supabase.from("homepage_section_order").select("*").order("order_index", { ascending: true }),
      supabase.from("custom_sections").select("id, title_th, title_en, section_type, is_active").order("order_index", { ascending: true }),
    ]);

    let orderData = (orderRes.data || []) as unknown as SectionOrder[];
    const customs = customRes.data || [];
    setCustomSections(customs);

    // Add any custom sections not yet in order table
    const existingKeys = new Set(orderData.map((s) => s.section_key));
    const newCustoms = customs.filter((c: any) => !existingKeys.has(`custom_${c.id}`));
    if (newCustoms.length > 0) {
      const maxOrder = orderData.length > 0 ? Math.max(...orderData.map((s) => s.order_index)) : -1;
      const inserts = newCustoms.map((c: any, i: number) => ({
        section_key: `custom_${c.id}`,
        order_index: maxOrder + 1 + i,
        is_visible: c.is_active,
      }));
      await supabase.from("homepage_section_order").insert(inserts as any);
      const { data: refreshed } = await supabase.from("homepage_section_order").select("*").order("order_index", { ascending: true });
      orderData = (refreshed || []) as unknown as SectionOrder[];
    }

    setSections(orderData);
    setLoading(false);
    setHasChanges(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleDragStart = (index: number) => {
    dragItem.current = index;
  };

  const handleDragEnter = (index: number) => {
    dragOverItem.current = index;
  };

  const handleDragEnd = () => {
    if (dragItem.current === null || dragOverItem.current === null) return;
    const newSections = [...sections];
    const draggedItem = newSections.splice(dragItem.current, 1)[0];
    newSections.splice(dragOverItem.current, 0, draggedItem);
    // Reassign order indices
    const reordered = newSections.map((s, i) => ({ ...s, order_index: i }));
    setSections(reordered);
    setHasChanges(true);
    dragItem.current = null;
    dragOverItem.current = null;
  };

  const toggleVisibility = (index: number) => {
    const newSections = [...sections];
    newSections[index] = { ...newSections[index], is_visible: !newSections[index].is_visible };
    setSections(newSections);
    setHasChanges(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updates = sections.map((s) =>
        supabase.from("homepage_section_order")
          .update({ order_index: s.order_index, is_visible: s.is_visible } as any)
          .eq("id", s.id)
      );
      await Promise.all(updates);
      setHasChanges(false);
      toast.success(t4(language, "บันทึกลำดับสำเร็จ", "Layout saved", "布局已保存", "レイアウト保存完了"));
    } catch (err: any) {
      toast.error(err.message);
    }
    setSaving(false);
  };

  const getSectionInfo = (key: string) => {
    if (BUILT_IN_SECTIONS[key]) {
      const info = BUILT_IN_SECTIONS[key];
      return {
        icon: info.icon,
        label: language === "th" ? info.labelTh : info.labelEn,
        color: info.color,
        isCustom: false,
      };
    }
    // Custom section
    const customId = key.replace("custom_", "");
    const custom = customSections.find((c) => c.id === customId);
    return {
      icon: Layers,
      label: custom
        ? (language === "th" ? (custom.title_th || custom.title_en) : (custom.title_en || custom.title_th)) || "Custom Section"
        : key,
      color: "text-primary",
      isCustom: true,
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Layout className="w-5 h-5 text-primary" />
            {t4(language, "จัดเรียง Section หน้าแรก", "Homepage Layout", "首页布局", "ホームページレイアウト")}
          </h3>
          <p className="text-sm text-muted-foreground mt-0.5">
            {t4(language, "ลากเพื่อจัดเรียงลำดับ Section ทั้งหมดบนหน้าแรก", "Drag to reorder all homepage sections", "拖拽排序首页所有区块", "ドラッグで全セクションを並べ替え")}
          </p>
        </div>
        <div className="flex gap-2">
          {hasChanges && (
            <Button variant="outline" size="sm" onClick={fetchData} className="gap-1.5">
              <RotateCcw className="w-3.5 h-3.5" />
              {t4(language, "รีเซ็ต", "Reset", "重置", "リセット")}
            </Button>
          )}
          <Button size="sm" onClick={handleSave} disabled={!hasChanges || saving} className="gap-1.5">
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            {t4(language, "บันทึก", "Save", "保存", "保存")}
          </Button>
        </div>
      </div>

      <div className="space-y-1.5">
        {sections.map((section, index) => {
          const info = getSectionInfo(section.section_key);
          const Icon = info.icon;
          return (
            <Card
              key={section.id}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragEnter={() => handleDragEnter(index)}
              onDragEnd={handleDragEnd}
              onDragOver={(e) => e.preventDefault()}
              className={`cursor-grab active:cursor-grabbing transition-all hover:shadow-md ${
                !section.is_visible ? "opacity-50" : ""
              }`}
            >
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center gap-3">
                  <GripVertical className="w-5 h-5 text-muted-foreground/50 shrink-0" />

                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div className={`p-1.5 rounded-lg bg-muted/50 shrink-0`}>
                      <Icon className={`w-4 h-4 ${info.color}`} />
                    </div>
                    <span className="font-medium text-sm text-foreground truncate">{info.label}</span>
                    {info.isCustom && (
                      <Badge variant="outline" className="text-[10px] shrink-0">
                        {t4(language, "กำหนดเอง", "Custom", "自定义", "カスタム")}
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-muted-foreground hidden sm:inline">
                      {section.is_visible
                        ? t4(language, "แสดง", "Visible", "显示", "表示")
                        : t4(language, "ซ่อน", "Hidden", "隐藏", "非表示")}
                    </span>
                    <Switch
                      checked={section.is_visible}
                      onCheckedChange={() => toggleVisibility(index)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {hasChanges && (
        <div className="flex items-center gap-2 p-3 bg-primary/5 border border-primary/20 rounded-lg">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <p className="text-sm text-primary font-medium">
            {t4(language, "มีการเปลี่ยนแปลง — กดบันทึกเพื่อใช้งาน", "Changes detected — save to apply", "有更改 — 保存以应用", "変更あり — 保存して適用")}
          </p>
        </div>
      )}
    </div>
  );
};
