import { useState, useEffect, useCallback } from "react";
import { useLanguage } from "@/hooks/useLanguage";
import { t4 } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import DynamicSections from "@/components/DynamicSections";
import {
  Plus, Pencil, Trash2, Eye, EyeOff, Loader2,
  LayoutGrid, Image, Type, FileText, ArrowUp, ArrowDown, Layers, Upload, X
} from "lucide-react";
import { toast } from "sonner";
import sweetAlert from "@/lib/sweetAlert";
import { optimizeImage } from "@/lib/imageOptimization";

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
  { value: "text_image", icon: Image, labelTh: "ข้อความ + รูปภาพ", labelEn: "Text + Image", descTh: "แสดงข้อความพร้อมรูปภาพด้านซ้ายหรือขวา", descEn: "Text with image on left or right" },
  { value: "banner", icon: Type, labelTh: "แบนเนอร์โปรโมชั่น", labelEn: "Promo Banner", descTh: "รูปพื้นหลังพร้อมข้อความซ้อนทับ", descEn: "Background image with text overlay" },
  { value: "grid_cards", icon: LayoutGrid, labelTh: "การ์ดแบบ Grid", labelEn: "Grid Cards", descTh: "แสดงข้อมูลเป็นการ์ด 2-4 คอลัมน์", descEn: "Display info as 2-4 column cards" },
  { value: "rich_text", icon: FileText, labelTh: "Rich Text", labelEn: "Rich Text", descTh: "เนื้อหา HTML อิสระ", descEn: "Free-form HTML content" },
];

const DEFAULT_CONTENT: Record<string, any> = {
  text_image: { text_th: "", text_en: "", image_position: "right", cta_url: "", cta_text_th: "", cta_text_en: "" },
  banner: { overlay_color: "rgba(0,0,0,0.4)", cta_url: "", cta_text_th: "ดูเพิ่มเติม", cta_text_en: "Learn More" },
  grid_cards: { cards: [{ title_th: "", title_en: "", description_th: "", description_en: "", image_url: "" }] },
  rich_text: { html_th: "", html_en: "" },
};

const emptySection = (orderIndex: number) => ({
  section_type: "text_image",
  title_th: "",
  title_en: "",
  subtitle_th: null as string | null,
  subtitle_en: null as string | null,
  content: DEFAULT_CONTENT["text_image"],
  image_url: null as string | null,
  order_index: orderIndex,
  is_active: true,
});

/* ─── Styled label ─── */
const FieldLabel = ({ children }: { children: React.ReactNode }) => (
  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1 block">{children}</label>
);

export const CustomSectionsManagement = () => {
  const { language } = useLanguage();
  const isTh = language === "th";
  const [sections, setSections] = useState<CustomSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<CustomSection | null>(null);
  const [formData, setFormData] = useState<any>(emptySection(0));
  const [uploading, setUploading] = useState(false);

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
    setFormData((prev: any) => ({ ...prev, section_type: type, content: DEFAULT_CONTENT[type] || {} }));
  };

  const handleSave = async () => {
    if (!formData.title_th && !formData.title_en) {
      toast.error(isTh ? "กรุณากรอกชื่อ Section" : "Please enter section title");
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
        toast.success(isTh ? "อัปเดตสำเร็จ" : "Updated successfully");
      } else {
        const { error } = await supabase.from("custom_sections").insert(payload as any);
        if (error) throw error;
        toast.success(isTh ? "สร้างสำเร็จ" : "Created successfully");
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
      isTh ? "ยืนยันการลบ" : "Confirm Delete",
      isTh ? `ลบ "${section.title_th || section.title_en}"?` : `Delete "${section.title_en || section.title_th}"?`
    );
    if (!confirmed) return;
    const { error } = await supabase.from("custom_sections").delete().eq("id", section.id);
    if (error) { toast.error(error.message); return; }
    toast.success(isTh ? "ลบสำเร็จ" : "Deleted");
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
    setFormData((prev: any) => ({ ...prev, content: { ...prev.content, [key]: value } }));
  };

  const uploadImage = async (file: File, path?: string): Promise<string | null> => {
    try {
      setUploading(true);
      const optimized = await optimizeImage(file, { maxWidth: 1920, quality: 0.85 });
      const fileName = path || `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, "")}`;
      const { error } = await supabase.storage.from("custom-sections").upload(fileName, optimized, { upsert: true });
      if (error) throw error;
      const { data: urlData } = supabase.storage.from("custom-sections").getPublicUrl(fileName);
      return urlData.publicUrl;
    } catch (err: any) {
      toast.error(err.message);
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleMainImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await uploadImage(file, `main_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, "")}`);
    if (url) setFormData((p: any) => ({ ...p, image_url: url }));
  };

  const handleCardImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, cardIndex: number) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await uploadImage(file, `card_${cardIndex}_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, "")}`);
    if (url) {
      const cards = [...(formData.content?.cards || [])];
      cards[cardIndex] = { ...cards[cardIndex], image_url: url };
      updateContent("cards", cards);
    }
  };

  /* ─── Content editors per type ─── */
  const renderContentEditor = () => {
    const type = formData.section_type;

    if (type === "text_image") {
      return (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <FieldLabel>{isTh ? "เนื้อหา (ไทย)" : "Content (TH)"}</FieldLabel>
              <Textarea className="bg-white dark:bg-background" value={formData.content?.text_th || ""} onChange={(e) => updateContent("text_th", e.target.value)} rows={3} placeholder={isTh ? "พิมพ์เนื้อหาภาษาไทย..." : "Thai content..."} />
            </div>
            <div>
              <FieldLabel>{isTh ? "เนื้อหา (อังกฤษ)" : "Content (EN)"}</FieldLabel>
              <Textarea className="bg-white dark:bg-background" value={formData.content?.text_en || ""} onChange={(e) => updateContent("text_en", e.target.value)} rows={3} placeholder={isTh ? "พิมพ์เนื้อหาภาษาอังกฤษ..." : "English content..."} />
            </div>
          </div>
          <div>
            <FieldLabel>{isTh ? "ตำแหน่งรูปภาพ" : "Image Position"}</FieldLabel>
            <Select value={formData.content?.image_position || "right"} onValueChange={(v) => updateContent("image_position", v)}>
              <SelectTrigger className="bg-white dark:bg-background"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="left">{isTh ? "ซ้าย" : "Left"}</SelectItem>
                <SelectItem value="right">{isTh ? "ขวา" : "Right"}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Separator />
          <div>
            <FieldLabel>{isTh ? "ปุ่ม CTA (ไม่บังคับ)" : "CTA Button (Optional)"}</FieldLabel>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1">
              <Input className="bg-white dark:bg-background" placeholder={isTh ? "ข้อความปุ่ม (TH)" : "Button Text (TH)"} value={formData.content?.cta_text_th || ""} onChange={(e) => updateContent("cta_text_th", e.target.value)} />
              <Input className="bg-white dark:bg-background" placeholder={isTh ? "ข้อความปุ่ม (EN)" : "Button Text (EN)"} value={formData.content?.cta_text_en || ""} onChange={(e) => updateContent("cta_text_en", e.target.value)} />
            </div>
            <Input className="bg-white dark:bg-background mt-2" placeholder={isTh ? "ลิงก์ URL ที่ปุ่มจะไป" : "Button URL"} value={formData.content?.cta_url || ""} onChange={(e) => updateContent("cta_url", e.target.value)} />
          </div>
        </div>
      );
    }

    if (type === "banner") {
      return (
        <div className="space-y-4">
          <div>
            <FieldLabel>{isTh ? "ปุ่ม CTA (ไม่บังคับ)" : "CTA Button (Optional)"}</FieldLabel>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1">
              <Input className="bg-white dark:bg-background" placeholder={isTh ? "ข้อความปุ่ม (TH)" : "Button Text (TH)"} value={formData.content?.cta_text_th || ""} onChange={(e) => updateContent("cta_text_th", e.target.value)} />
              <Input className="bg-white dark:bg-background" placeholder={isTh ? "ข้อความปุ่ม (EN)" : "Button Text (EN)"} value={formData.content?.cta_text_en || ""} onChange={(e) => updateContent("cta_text_en", e.target.value)} />
            </div>
            <Input className="bg-white dark:bg-background mt-2" placeholder={isTh ? "ลิงก์ URL ที่ปุ่มจะไป" : "Button URL"} value={formData.content?.cta_url || ""} onChange={(e) => updateContent("cta_url", e.target.value)} />
          </div>
          <div>
            <FieldLabel>{isTh ? "สี Overlay พื้นหลัง" : "Background Overlay Color"}</FieldLabel>
            <Input className="bg-white dark:bg-background" placeholder="rgba(0,0,0,0.4)" value={formData.content?.overlay_color || ""} onChange={(e) => updateContent("overlay_color", e.target.value)} />
            <p className="text-[11px] text-muted-foreground mt-1">{isTh ? "ใช้รูปแบบ rgba เช่น rgba(0,0,0,0.5)" : "Use rgba format e.g. rgba(0,0,0,0.5)"}</p>
          </div>
        </div>
      );
    }

    if (type === "grid_cards") {
      const cards = formData.content?.cards || [];
      return (
        <div className="space-y-3">
          {cards.map((card: any, i: number) => (
            <Card key={i} className="border-border/60">
              <CardContent className="p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground">{isTh ? `การ์ดที่ ${i + 1}` : `Card ${i + 1}`}</span>
                  {cards.length > 1 && (
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:text-destructive" onClick={() => {
                      updateContent("cards", cards.filter((_: any, idx: number) => idx !== i));
                    }}><Trash2 className="w-3 h-3" /></Button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Input className="bg-white dark:bg-background" placeholder={isTh ? "ชื่อ (TH)" : "Title (TH)"} value={card.title_th || ""} onChange={(e) => {
                    const c = [...cards]; c[i] = { ...c[i], title_th: e.target.value }; updateContent("cards", c);
                  }} />
                  <Input className="bg-white dark:bg-background" placeholder={isTh ? "ชื่อ (EN)" : "Title (EN)"} value={card.title_en || ""} onChange={(e) => {
                    const c = [...cards]; c[i] = { ...c[i], title_en: e.target.value }; updateContent("cards", c);
                  }} />
                  <Input className="bg-white dark:bg-background" placeholder={isTh ? "คำอธิบาย (TH)" : "Description (TH)"} value={card.description_th || ""} onChange={(e) => {
                    const c = [...cards]; c[i] = { ...c[i], description_th: e.target.value }; updateContent("cards", c);
                  }} />
                  <Input className="bg-white dark:bg-background" placeholder={isTh ? "คำอธิบาย (EN)" : "Description (EN)"} value={card.description_en || ""} onChange={(e) => {
                    const c = [...cards]; c[i] = { ...c[i], description_en: e.target.value }; updateContent("cards", c);
                  }} />
                </div>
                {card.image_url && (
                  <div className="relative group">
                    <img src={card.image_url} alt="" className="rounded h-20 w-full object-cover" />
                    <Button type="button" variant="destructive" size="icon" className="absolute top-1 right-1 h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => {
                      const c = [...cards]; c[i] = { ...c[i], image_url: "" }; updateContent("cards", c);
                    }}><X className="h-2.5 w-2.5" /></Button>
                  </div>
                )}
                <label className="flex items-center gap-1.5 px-3 py-2 border border-dashed rounded cursor-pointer text-xs text-muted-foreground hover:border-primary hover:bg-primary/5 transition-all">
                  <Upload className="w-3 h-3" />
                  {isTh ? "อัพโหลดรูปการ์ด" : "Upload Card Image"}
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handleCardImageUpload(e, i)} />
                </label>
              </CardContent>
            </Card>
          ))}
          <Button variant="outline" size="sm" className="gap-1.5 w-full" onClick={() => {
            updateContent("cards", [...cards, { title_th: "", title_en: "", description_th: "", description_en: "", image_url: "" }]);
          }}>
            <Plus className="w-3.5 h-3.5" /> {isTh ? "เพิ่มการ์ด" : "Add Card"}
          </Button>
        </div>
      );
    }

    if (type === "rich_text") {
      return (
        <div className="space-y-4">
          <div>
            <FieldLabel>HTML (TH)</FieldLabel>
            <Textarea className="bg-white dark:bg-background font-mono text-xs" value={formData.content?.html_th || ""} onChange={(e) => updateContent("html_th", e.target.value)} rows={5} placeholder="<h3>หัวข้อ</h3><p>เนื้อหา...</p>" />
          </div>
          <div>
            <FieldLabel>HTML (EN)</FieldLabel>
            <Textarea className="bg-white dark:bg-background font-mono text-xs" value={formData.content?.html_en || ""} onChange={(e) => updateContent("html_en", e.target.value)} rows={5} placeholder="<h3>Title</h3><p>Content...</p>" />
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Layers className="w-5 h-5 text-primary" />
            {isTh ? "จัดการ Section แบบ Dynamic" : "Dynamic Sections"}
          </h3>
          <p className="text-sm text-muted-foreground mt-0.5">
            {isTh ? "สร้างและจัดเรียง Section เพิ่มเติมบนหน้าแรก" : "Create and arrange custom sections on homepage"}
          </p>
        </div>
        <Button onClick={openCreate} className="gap-1.5">
          <Plus className="w-4 h-4" />
          {isTh ? "สร้าง Section" : "New Section"}
        </Button>
      </div>

      {/* Section List */}
      {sections.length === 0 ? (
        <Card className="p-8 text-center">
          <Layers className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
          <p className="text-muted-foreground">
            {isTh ? "ยังไม่มี Section — กดปุ่มด้านบนเพื่อเริ่มสร้าง" : "No sections yet — click above to create one"}
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
                          {isTh ? (section.title_th || section.title_en) : (section.title_en || section.title_th)}
                        </p>
                        <Badge variant="secondary" className="text-[10px] shrink-0">
                          {isTh ? typeInfo.labelTh : typeInfo.labelEn}
                        </Badge>
                      </div>
                      {(section.subtitle_th || section.subtitle_en) && (
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                          {isTh ? section.subtitle_th : section.subtitle_en}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleToggle(section)} title={section.is_active ? (isTh ? "ซ่อน" : "Hide") : (isTh ? "แสดง" : "Show")}>
                        {section.is_active ? <Eye className="w-4 h-4 text-primary" /> : <EyeOff className="w-4 h-4 text-muted-foreground" />}
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(section)} title={isTh ? "แก้ไข" : "Edit"}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(section)} title={isTh ? "ลบ" : "Delete"}>
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
        <DialogContent className="max-w-4xl !max-h-[90vh] !flex !flex-col overflow-hidden p-0">
          <DialogHeader className="px-6 pt-6 pb-0 shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-primary" />
              {editingSection
                ? (isTh ? "แก้ไข Section" : "Edit Section")
                : (isTh ? "สร้าง Section ใหม่" : "Create New Section")}
            </DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="edit" className="w-full flex-1 min-h-0 flex flex-col px-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="edit" className="gap-1.5">
                <Pencil className="w-3.5 h-3.5" />
                {isTh ? "แก้ไข" : "Edit"}
              </TabsTrigger>
              <TabsTrigger value="preview" className="gap-1.5">
                <Eye className="w-3.5 h-3.5" />
                {isTh ? "ตัวอย่าง" : "Preview"}
              </TabsTrigger>
            </TabsList>

            {/* ─── Edit Tab ─── */}
            <TabsContent value="edit" className="flex-1 min-h-0 mt-0 overflow-hidden">
              <div className="overflow-y-auto h-full max-h-[calc(90vh-220px)] pr-2">
                <div className="space-y-5 py-2">
                  {/* Step 1: Section Type */}
                  <div>
                    <FieldLabel>{isTh ? "① เลือกประเภท Section" : "① Choose Section Type"}</FieldLabel>
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      {SECTION_TYPES.map((t) => {
                        const Icon = t.icon;
                        const isSelected = formData.section_type === t.value;
                        return (
                          <button
                            key={t.value}
                            type="button"
                            onClick={() => handleTypeChange(t.value)}
                            className={`flex items-start gap-2.5 p-3 rounded-lg border-2 text-left transition-all
                              ${isSelected ? "border-primary bg-primary/5 shadow-sm" : "border-border hover:border-primary/30"}`}
                          >
                            <Icon className={`w-5 h-5 mt-0.5 shrink-0 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                            <div>
                              <span className={`text-sm block ${isSelected ? "font-semibold text-foreground" : "text-muted-foreground"}`}>
                                {isTh ? t.labelTh : t.labelEn}
                              </span>
                              <span className="text-[11px] text-muted-foreground leading-tight">
                                {isTh ? t.descTh : t.descEn}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <Separator />

                  {/* Step 2: Title & Subtitle */}
                  <div>
                    <FieldLabel>{isTh ? "② ชื่อและคำอธิบาย" : "② Title & Subtitle"}</FieldLabel>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1">
                      <div>
                        <span className="text-[11px] text-muted-foreground">{isTh ? "ชื่อ (ไทย) *" : "Title (TH) *"}</span>
                        <Input className="bg-white dark:bg-background mt-0.5" value={formData.title_th || ""} onChange={(e) => setFormData((p: any) => ({ ...p, title_th: e.target.value }))} placeholder={isTh ? "เช่น โปรโมชั่นพิเศษ" : "e.g. Special Promotion"} />
                      </div>
                      <div>
                        <span className="text-[11px] text-muted-foreground">{isTh ? "ชื่อ (อังกฤษ) *" : "Title (EN) *"}</span>
                        <Input className="bg-white dark:bg-background mt-0.5" value={formData.title_en || ""} onChange={(e) => setFormData((p: any) => ({ ...p, title_en: e.target.value }))} placeholder="e.g. Special Promotion" />
                      </div>
                      <div>
                        <span className="text-[11px] text-muted-foreground">{isTh ? "คำอธิบายย่อ (ไทย)" : "Subtitle (TH)"}</span>
                        <Input className="bg-white dark:bg-background mt-0.5" value={formData.subtitle_th || ""} onChange={(e) => setFormData((p: any) => ({ ...p, subtitle_th: e.target.value }))} />
                      </div>
                      <div>
                        <span className="text-[11px] text-muted-foreground">{isTh ? "คำอธิบายย่อ (อังกฤษ)" : "Subtitle (EN)"}</span>
                        <Input className="bg-white dark:bg-background mt-0.5" value={formData.subtitle_en || ""} onChange={(e) => setFormData((p: any) => ({ ...p, subtitle_en: e.target.value }))} />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Step 3: Main Image */}
                  <div>
                    <FieldLabel>{isTh ? "③ รูปภาพหลัก" : "③ Main Image"}</FieldLabel>
                    <div className="mt-1 space-y-2">
                      {formData.image_url && (
                        <div className="relative group">
                          <img src={formData.image_url} alt="Preview" className="rounded-lg max-h-32 object-cover w-full" />
                          <Button
                            type="button" variant="destructive" size="icon"
                            className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => setFormData((p: any) => ({ ...p, image_url: null }))}
                          ><X className="h-3 w-3" /></Button>
                        </div>
                      )}
                      <label className={`flex items-center justify-center gap-2 px-4 py-4 border-2 border-dashed rounded-lg cursor-pointer transition-all hover:border-primary hover:bg-primary/5 ${uploading ? "opacity-50 pointer-events-none" : "border-border"}`}>
                        {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4 text-muted-foreground" />}
                        <span className="text-sm text-muted-foreground">
                          {uploading
                            ? (isTh ? "กำลังอัพโหลด..." : "Uploading...")
                            : (isTh ? "คลิกเพื่ออัพโหลดรูปภาพ" : "Click to upload image")}
                        </span>
                        <input type="file" accept="image/*" className="hidden" onChange={handleMainImageUpload} disabled={uploading} />
                      </label>
                    </div>
                  </div>

                  <Separator />

                  {/* Step 4: Content */}
                  <div>
                    <FieldLabel>{isTh ? "④ เนื้อหา Section" : "④ Section Content"}</FieldLabel>
                    <div className="mt-1">
                      {renderContentEditor()}
                    </div>
                  </div>

                  <Separator />

                  {/* Step 5: Active */}
                  <div className="flex items-center justify-between rounded-lg border border-border p-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">{isTh ? "เปิดใช้งาน" : "Active"}</p>
                      <p className="text-xs text-muted-foreground">{isTh ? "แสดง Section นี้บนหน้าแรก" : "Show this section on homepage"}</p>
                    </div>
                    <Switch checked={formData.is_active} onCheckedChange={(v) => setFormData((p: any) => ({ ...p, is_active: v }))} />
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* ─── Preview Tab ─── */}
            <TabsContent value="preview" className="flex-1 min-h-0 mt-0 overflow-hidden">
              <div className="overflow-y-auto h-full max-h-[calc(90vh-220px)]">
                <div className="border border-border rounded-lg overflow-hidden bg-background">
                  <div className="bg-muted/30 px-3 py-1.5 border-b border-border flex items-center gap-2">
                    <div className="flex gap-1">
                      <div className="w-2.5 h-2.5 rounded-full bg-destructive/60" />
                      <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
                      <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
                    </div>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      {isTh ? "ตัวอย่างการแสดงผล" : "Live Preview"}
                    </span>
                  </div>
                  <div className="min-h-[200px]">
                    {(formData.title_th || formData.title_en) ? (
                      <DynamicSections
                        sections={[{
                          id: editingSection?.id || "preview",
                          section_type: formData.section_type,
                          title_th: formData.title_th || "",
                          title_en: formData.title_en || "",
                          subtitle_th: formData.subtitle_th || null,
                          subtitle_en: formData.subtitle_en || null,
                          content: formData.content || {},
                          image_url: formData.image_url || null,
                          order_index: 0,
                          is_active: true,
                        }]}
                        startIndex={0}
                      />
                    ) : (
                      <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">
                        {isTh ? "กรอกชื่อ Section เพื่อดูตัวอย่าง" : "Enter a section title to see preview"}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              {isTh ? "ยกเลิก" : "Cancel"}
            </Button>
            <Button onClick={handleSave} disabled={saving} className="gap-1.5">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {editingSection ? (isTh ? "บันทึก" : "Save") : (isTh ? "สร้าง" : "Create")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
