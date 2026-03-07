import { useState, useEffect, useCallback } from "react";
import { useLanguage } from "@/hooks/useLanguage";
import { t4 } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Plus, GripVertical, Pencil, Trash2, Eye, EyeOff, Loader2,
  LayoutGrid, Image, Type, FileText, ArrowUp, ArrowDown, Layers
} from "lucide-react";
import { toast } from "sonner";
import sweetAlert from "@/lib/sweetAlert";

interface CustomSection {
  id: string;
  section_type: string;
  title_th: string;
  title_en: string;
  subtitle_th: string | null;
  subtitle_en: string | null;
  content: any;
  image_url: string | null;
  order_index: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const SECTION_TYPES = [
  { value: "text_image", icon: Image, labelTh: "ข้อความ + รูปภาพ", labelEn: "Text + Image" },
  { value: "banner", icon: Type, labelTh: "แบนเนอร์โปรโมชั่น", labelEn: "Promo Banner" },
  { value: "grid_cards", icon: LayoutGrid, labelTh: "การ์ดแบบ Grid", labelEn: "Grid Cards" },
  { value: "rich_text", icon: FileText, labelTh: "Rich Text อิสระ", labelEn: "Rich Text" },
];

const DEFAULT_CONTENT: Record<string, any> = {
  text_image: { text_th: "", text_en: "", image_position: "right", cta_url: "", cta_text_th: "", cta_text_en: "" },
  banner: { overlay_color: "rgba(0,0,0,0.4)", cta_url: "", cta_text_th: "ดูเพิ่มเติม", cta_text_en: "Learn More" },
  grid_cards: { cards: [{ title_th: "", title_en: "", description_th: "", description_en: "", image_url: "" }] },
  rich_text: { html_th: "", html_en: "" },
};

const emptySection = (orderIndex: number): Omit<CustomSection, "id" | "created_at" | "updated_at"> => ({
  section_type: "text_image",
  title_th: "",
  title_en: "",
  subtitle_th: null,
  subtitle_en: null,
  content: DEFAULT_CONTENT["text_image"],
  image_url: null,
  order_index: orderIndex,
  is_active: true,
});

export const CustomSectionsManagement = () => {
  const { language } = useLanguage();
  const [sections, setSections] = useState<CustomSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<CustomSection | null>(null);
  const [formData, setFormData] = useState<any>(emptySection(0));

  const fetchSections = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("custom_sections")
      .select("*")
      .order("order_index", { ascending: true });
    if (!error && data) setSections(data as unknown as CustomSection[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetchSections(); }, [fetchSections]);

  const openCreate = () => {
    setEditingSection(null);
    setFormData(emptySection(sections.length));
    setDialogOpen(true);
  };

  const openEdit = (section: CustomSection) => {
    setEditingSection(section);
    setFormData({ ...section });
    setDialogOpen(true);
  };

  const handleTypeChange = (type: string) => {
    setFormData((prev: any) => ({
      ...prev,
      section_type: type,
      content: DEFAULT_CONTENT[type] || {},
    }));
  };

  const handleSave = async () => {
    if (!formData.title_th && !formData.title_en) {
      toast.error(t4(language, "กรุณากรอกชื่อ Section", "Please enter section title", "请输入标题", "タイトルを入力してください"));
      return;
    }
    setSaving(true);
    try {
      const payload = {
        section_type: formData.section_type,
        title_th: formData.title_th || "",
        title_en: formData.title_en || "",
        subtitle_th: formData.subtitle_th || null,
        subtitle_en: formData.subtitle_en || null,
        content: formData.content,
        image_url: formData.image_url || null,
        order_index: formData.order_index,
        is_active: formData.is_active,
      };

      if (editingSection) {
        const { error } = await supabase.from("custom_sections").update(payload as any).eq("id", editingSection.id);
        if (error) throw error;
        toast.success(t4(language, "อัปเดตสำเร็จ", "Updated successfully", "更新成功", "更新しました"));
      } else {
        const { error } = await supabase.from("custom_sections").insert(payload as any);
        if (error) throw error;
        toast.success(t4(language, "สร้างสำเร็จ", "Created successfully", "创建成功", "作成しました"));
      }
      setDialogOpen(false);
      fetchSections();
    } catch (err: any) {
      toast.error(err.message);
    }
    setSaving(false);
  };

  const handleDelete = async (section: CustomSection) => {
    const confirmed = await sweetAlert.modal.confirmDelete(
      t4(language, "ยืนยันการลบ", "Confirm Delete", "确认删除", "削除確認"),
      t4(language, `ลบ "${section.title_th || section.title_en}"?`, `Delete "${section.title_en || section.title_th}"?`, `删除 "${section.title_en}"?`, `"${section.title_en}"を削除しますか?`)
    );
    if (!confirmed) return;
    const { error } = await supabase.from("custom_sections").delete().eq("id", section.id);
    if (error) { toast.error(error.message); return; }
    toast.success(t4(language, "ลบสำเร็จ", "Deleted", "已删除", "削除しました"));
    fetchSections();
  };

  const handleToggle = async (section: CustomSection) => {
    const { error } = await supabase
      .from("custom_sections")
      .update({ is_active: !section.is_active } as any)
      .eq("id", section.id);
    if (!error) fetchSections();
  };

  const moveSection = async (index: number, direction: "up" | "down") => {
    const newSections = [...sections];
    const swapIndex = direction === "up" ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= newSections.length) return;

    const tempOrder = newSections[index].order_index;
    newSections[index].order_index = newSections[swapIndex].order_index;
    newSections[swapIndex].order_index = tempOrder;

    await Promise.all([
      supabase.from("custom_sections").update({ order_index: newSections[index].order_index } as any).eq("id", newSections[index].id),
      supabase.from("custom_sections").update({ order_index: newSections[swapIndex].order_index } as any).eq("id", newSections[swapIndex].id),
    ]);
    fetchSections();
  };

  const getTypeInfo = (type: string) => SECTION_TYPES.find((t) => t.value === type) || SECTION_TYPES[0];

  const updateContent = (key: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      content: { ...prev.content, [key]: value },
    }));
  };

  const renderContentEditor = () => {
    const type = formData.section_type;

    if (type === "text_image") {
      return (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">เนื้อหา (TH)</label>
              <Textarea value={formData.content?.text_th || ""} onChange={(e) => updateContent("text_th", e.target.value)} rows={3} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Content (EN)</label>
              <Textarea value={formData.content?.text_en || ""} onChange={(e) => updateContent("text_en", e.target.value)} rows={3} />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">{t4(language, "ตำแหน่งรูปภาพ", "Image Position", "图片位置", "画像位置")}</label>
            <Select value={formData.content?.image_position || "right"} onValueChange={(v) => updateContent("image_position", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="left">{t4(language, "ซ้าย", "Left", "左", "左")}</SelectItem>
                <SelectItem value="right">{t4(language, "ขวา", "Right", "右", "右")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input placeholder="CTA Text (TH)" value={formData.content?.cta_text_th || ""} onChange={(e) => updateContent("cta_text_th", e.target.value)} />
            <Input placeholder="CTA Text (EN)" value={formData.content?.cta_text_en || ""} onChange={(e) => updateContent("cta_text_en", e.target.value)} />
          </div>
          <Input placeholder="CTA URL" value={formData.content?.cta_url || ""} onChange={(e) => updateContent("cta_url", e.target.value)} />
        </div>
      );
    }

    if (type === "banner") {
      return (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Input placeholder="CTA Text (TH)" value={formData.content?.cta_text_th || ""} onChange={(e) => updateContent("cta_text_th", e.target.value)} />
            <Input placeholder="CTA Text (EN)" value={formData.content?.cta_text_en || ""} onChange={(e) => updateContent("cta_text_en", e.target.value)} />
          </div>
          <Input placeholder="CTA URL" value={formData.content?.cta_url || ""} onChange={(e) => updateContent("cta_url", e.target.value)} />
          <Input placeholder="Overlay Color (e.g. rgba(0,0,0,0.4))" value={formData.content?.overlay_color || ""} onChange={(e) => updateContent("overlay_color", e.target.value)} />
        </div>
      );
    }

    if (type === "grid_cards") {
      const cards = formData.content?.cards || [];
      return (
        <div className="space-y-3">
          {cards.map((card: any, i: number) => (
            <Card key={i} className="p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-muted-foreground">Card {i + 1}</span>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => {
                  const newCards = cards.filter((_: any, idx: number) => idx !== i);
                  updateContent("cards", newCards);
                }}><Trash2 className="w-3 h-3" /></Button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Input placeholder="Title (TH)" value={card.title_th || ""} onChange={(e) => {
                  const newCards = [...cards]; newCards[i] = { ...newCards[i], title_th: e.target.value }; updateContent("cards", newCards);
                }} />
                <Input placeholder="Title (EN)" value={card.title_en || ""} onChange={(e) => {
                  const newCards = [...cards]; newCards[i] = { ...newCards[i], title_en: e.target.value }; updateContent("cards", newCards);
                }} />
                <Input placeholder="Description (TH)" value={card.description_th || ""} onChange={(e) => {
                  const newCards = [...cards]; newCards[i] = { ...newCards[i], description_th: e.target.value }; updateContent("cards", newCards);
                }} />
                <Input placeholder="Description (EN)" value={card.description_en || ""} onChange={(e) => {
                  const newCards = [...cards]; newCards[i] = { ...newCards[i], description_en: e.target.value }; updateContent("cards", newCards);
                }} />
              </div>
              <Input className="mt-2" placeholder="Image URL" value={card.image_url || ""} onChange={(e) => {
                const newCards = [...cards]; newCards[i] = { ...newCards[i], image_url: e.target.value }; updateContent("cards", newCards);
              }} />
            </Card>
          ))}
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => {
            updateContent("cards", [...cards, { title_th: "", title_en: "", description_th: "", description_en: "", image_url: "" }]);
          }}>
            <Plus className="w-3.5 h-3.5" /> {t4(language, "เพิ่มการ์ด", "Add Card", "添加卡片", "カード追加")}
          </Button>
        </div>
      );
    }

    if (type === "rich_text") {
      return (
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground">HTML (TH)</label>
            <Textarea value={formData.content?.html_th || ""} onChange={(e) => updateContent("html_th", e.target.value)} rows={5} className="font-mono text-xs" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">HTML (EN)</label>
            <Textarea value={formData.content?.html_en || ""} onChange={(e) => updateContent("html_en", e.target.value)} rows={5} className="font-mono text-xs" />
          </div>
        </div>
      );
    }

    return null;
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
            <Layers className="w-5 h-5 text-primary" />
            {t4(language, "จัดการ Section แบบ Dynamic", "Dynamic Sections", "动态内容区", "ダイナミックセクション")}
          </h3>
          <p className="text-sm text-muted-foreground mt-0.5">
            {t4(language, "สร้างและจัดเรียง Section เพิ่มเติมบนหน้าแรก", "Create and arrange custom sections on homepage", "创建和排列首页自定义区块", "ホームページにカスタムセクションを作成・配置")}
          </p>
        </div>
        <Button onClick={openCreate} className="gap-1.5">
          <Plus className="w-4 h-4" />
          {t4(language, "สร้าง Section", "New Section", "新建", "新規作成")}
        </Button>
      </div>

      {sections.length === 0 ? (
        <Card className="p-8 text-center">
          <Layers className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
          <p className="text-muted-foreground">
            {t4(language, "ยังไม่มี Section — กดปุ่มด้านบนเพื่อเริ่มสร้าง", "No sections yet — click above to create one", "暂无区块 — 点击上方创建", "セクションがありません — 上のボタンで作成")}
          </p>
        </Card>
      ) : (
        <div className="space-y-2">
          {sections.map((section, index) => {
            const typeInfo = getTypeInfo(section.section_type);
            const TypeIcon = typeInfo.icon;
            return (
              <Card key={section.id} className={`transition-opacity ${!section.is_active ? "opacity-50" : ""}`}>
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col gap-0.5">
                      <Button variant="ghost" size="icon" className="h-6 w-6" disabled={index === 0} onClick={() => moveSection(index, "up")}>
                        <ArrowUp className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-6 w-6" disabled={index === sections.length - 1} onClick={() => moveSection(index, "down")}>
                        <ArrowDown className="w-3.5 h-3.5" />
                      </Button>
                    </div>

                    <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                      <TypeIcon className="w-5 h-5 text-primary" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm text-foreground truncate">
                          {language === "th" ? (section.title_th || section.title_en) : (section.title_en || section.title_th)}
                        </p>
                        <Badge variant="secondary" className="text-[10px] shrink-0">
                          {language === "th" ? typeInfo.labelTh : typeInfo.labelEn}
                        </Badge>
                      </div>
                      {(section.subtitle_th || section.subtitle_en) && (
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                          {language === "th" ? section.subtitle_th : section.subtitle_en}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleToggle(section)}>
                        {section.is_active ? <Eye className="w-4 h-4 text-primary" /> : <EyeOff className="w-4 h-4 text-muted-foreground" />}
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(section)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(section)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>
              {editingSection
                ? t4(language, "แก้ไข Section", "Edit Section", "编辑区块", "セクション編集")
                : t4(language, "สร้าง Section ใหม่", "Create New Section", "新建区块", "新規セクション")}
            </DialogTitle>
          </DialogHeader>

          <ScrollArea className="max-h-[60vh] pr-4">
            <div className="space-y-4 py-2">
              {/* Type */}
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">
                  {t4(language, "ประเภท Section", "Section Type", "区块类型", "セクションタイプ")}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {SECTION_TYPES.map((t) => {
                    const Icon = t.icon;
                    const isSelected = formData.section_type === t.value;
                    return (
                      <button
                        key={t.value}
                        onClick={() => handleTypeChange(t.value)}
                        className={`flex items-center gap-2 p-3 rounded-lg border-2 text-left transition-all text-sm
                          ${isSelected ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"}`}
                      >
                        <Icon className={`w-4 h-4 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                        <span className={isSelected ? "font-medium text-foreground" : "text-muted-foreground"}>
                          {language === "th" ? t.labelTh : t.labelEn}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Titles */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">ชื่อ Section (TH) *</label>
                  <Input value={formData.title_th || ""} onChange={(e) => setFormData((p: any) => ({ ...p, title_th: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Section Title (EN) *</label>
                  <Input value={formData.title_en || ""} onChange={(e) => setFormData((p: any) => ({ ...p, title_en: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">คำอธิบาย (TH)</label>
                  <Input value={formData.subtitle_th || ""} onChange={(e) => setFormData((p: any) => ({ ...p, subtitle_th: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Subtitle (EN)</label>
                  <Input value={formData.subtitle_en || ""} onChange={(e) => setFormData((p: any) => ({ ...p, subtitle_en: e.target.value }))} />
                </div>
              </div>

              {/* Image URL */}
              <div>
                <label className="text-xs font-medium text-muted-foreground">{t4(language, "URL รูปภาพหลัก", "Main Image URL", "主图URL", "メイン画像URL")}</label>
                <Input value={formData.image_url || ""} onChange={(e) => setFormData((p: any) => ({ ...p, image_url: e.target.value }))} placeholder="https://..." />
                {formData.image_url && (
                  <img src={formData.image_url} alt="Preview" className="mt-2 rounded-lg max-h-32 object-cover w-full" />
                )}
              </div>

              {/* Active toggle */}
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-foreground">
                  {t4(language, "เปิดใช้งาน", "Active", "启用", "有効")}
                </label>
                <Switch checked={formData.is_active} onCheckedChange={(v) => setFormData((p: any) => ({ ...p, is_active: v }))} />
              </div>

              {/* Content Editor */}
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  {t4(language, "เนื้อหา Section", "Section Content", "区块内容", "セクション内容")}
                </label>
                {renderContentEditor()}
              </div>
            </div>
          </ScrollArea>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              {t4(language, "ยกเลิก", "Cancel", "取消", "キャンセル")}
            </Button>
            <Button onClick={handleSave} disabled={saving} className="gap-1.5">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {editingSection
                ? t4(language, "บันทึก", "Save", "保存", "保存")
                : t4(language, "สร้าง", "Create", "创建", "作成")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
