import { useState, useEffect } from 'react';
import { useLanguage, translations } from '@/hooks/useLanguage';
import { useServiceAlert } from '@/hooks/useServiceAlert';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { ServiceAlert } from '@/components/admin/ServiceAlert';
import { toast } from '@/lib/toast';
import { Plus, Edit2, Trash2, Upload, Info, Clock, Flame } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Promotion {
  id: string;
  title_th: string;
  title_en: string;
  description_th: string | null;
  description_en: string | null;
  image_url: string | null;
  discount_percentage: number | null;
  start_date: string;
  end_date: string;
  is_active: boolean;
  display_order: number;
}

// Mock data for development/preview
const MOCK_PROMOTIONS: Promotion[] = [
  {
    id: '1',
    title_th: 'ส่วนลด 50% กาแฟพิเศษ',
    title_en: '50% Off Special Coffee',
    description_th: 'ลด 50% สำหรับเมนูกาแฟทั้งหมด ทุกวันจันทร์-ศุกร์',
    description_en: '50% discount on all coffee menus, Monday-Friday',
    image_url: 'https://images.unsplash.com/photo-1559056199-641a0ac8b3f7?w=500&h=400&fit=crop',
    discount_percentage: 50,
    start_date: new Date().toISOString(),
    end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    is_active: true,
    display_order: 0,
  },
  {
    id: '2',
    title_th: 'อาหารชุด Buy 1 Get 1',
    title_en: 'Meal Set Buy 1 Get 1',
    description_th: 'ซื้อชุดอาหารรับประทุน 1 ชุด ฟรี 1 ชุด',
    description_en: 'Buy 1 food set, get 1 free on all bundles',
    image_url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&h=400&fit=crop',
    discount_percentage: 100,
    start_date: new Date().toISOString(),
    end_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    is_active: true,
    display_order: 1,
  },
];

export const PromotionManagement = () => {
  const { language } = useLanguage();
  const t = translations[language];
  const { alerts, removeAlert, removeAllAlerts, error, warning, success, info } = useServiceAlert();
  const [promotions, setPromotions] = useState<Promotion[]>(MOCK_PROMOTIONS);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedPromotion, setSelectedPromotion] = useState<Promotion | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [uploading, setUploading] = useState(false);

  const [formData, setFormData] = useState({
    title_th: '',
    title_en: '',
    description_th: '',
    description_en: '',
    discount_percentage: '',
    start_date: '',
    end_date: '',
    is_active: true,
    display_order: '0',
  });

  // Fetch promotions
  const fetchPromotions = async () => {
    setLoading(true);
    try {
      const { data, error: fetchError } = await (supabase
        .from('promotions' as any)
        .select('*')
        .order('display_order', { ascending: true }) as any);

      if (data && data.length > 0) {
        setPromotions(data as Promotion[]);
        info(
          language === 'th' ? '✅ โหลดโปรโมชั่นสำเร็จ' : '✅ Promotions Loaded',
          language === 'th' ? `พบโปรโมชั่น ${data.length} รายการ` : `Found ${data.length} promotions`
        );
      } else {
        // Use mock data as fallback if no data in database
        setPromotions(MOCK_PROMOTIONS);
      }
    } catch (errorObj) {
      console.error('Error fetching promotions:', errorObj);
      // Silent error - just use mock data without notifying user
      setPromotions(MOCK_PROMOTIONS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPromotions();
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      error(
        language === 'th' ? '❌ ประเภทไฟล์ไม่ถูกต้อง' : '❌ Invalid File Type',
        language === 'th' ? 'กรุณาเลือกไฟล์รูปภาพ (JPG, PNG, etc.)' : 'Please select an image file (JPG, PNG, etc.)',
        `ไฟล์ที่เลือก: ${file.type}`
      );
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      error(
        language === 'th' ? '❌ ไฟล์ใหญ่เกินไป' : '❌ File Too Large',
        language === 'th' ? 'ไฟล์ต้องมีขนาดไม่เกิน 5MB' : 'File size must not exceed 5MB',
        language === 'th' ? `ขนาดไฟล์: ${(file.size / 1024 / 1024).toFixed(2)} MB` : `File size: ${(file.size / 1024 / 1024).toFixed(2)} MB`
      );
      return;
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    success(
      language === 'th' ? '✅ เลือกไฟล์สำเร็จ' : '✅ File Selected',
      language === 'th' ? `ไฟล์: ${file.name}` : `File: ${file.name}`
    );
  };

  const uploadImage = async (): Promise<string | null> => {
    // ถ้าไม่มี imageFile ใหม่ ให้ใช้ image URL เดิม
    if (!imageFile) return selectedPromotion?.image_url || null;

    try {
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `promo-${Date.now()}.${fileExt}`;

      // Delete old image if exists
      if (selectedPromotion?.image_url) {
        const oldFileName = selectedPromotion.image_url.split('/').pop();
        if (oldFileName) {
          const { error: deleteError } = await supabase.storage.from('promotions').remove([oldFileName]);
          if (deleteError) {
            warning(
              language === 'th' ? '⚠️ ไม่สามารถลบรูปภาพเก่า' : '⚠️ Failed to Delete Old Image',
              language === 'th' ? 'อาจจะเกิดจากการอนุญาต' : 'May be due to permissions',
              deleteError.message
            );
          }
        }
      }

      const { error: uploadError } = await supabase.storage
        .from('promotions')
        .upload(fileName, imageFile, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        throw new Error(`Storage Error: ${uploadError.message}`);
      }

      const { data: { publicUrl } } = supabase.storage
        .from('promotions')
        .getPublicUrl(fileName);

      success(
        language === 'th' ? '✅ อัพโหลดรูปสำเร็จ' : '✅ Image Uploaded',
        language === 'th' ? 'รูปภาพเตรียมพร้อมแล้ว' : 'Image is ready'
      );

      return publicUrl;
    } catch (uploadError) {
      console.error('Error uploading image:', uploadError);
      const errorMessage = uploadError instanceof Error ? uploadError.message : 'Unknown error';
      
      warning(
        language === 'th' ? '⚠️ ไม่สามารถอัพโหลดรูปภาพ' : '⚠️ Failed to Upload Image',
        language === 'th' ? 'จะบันทึกโปรโมชั่นโดยไม่มีรูปสำหรับตอนนี้' : 'Will save promotion without image for now',
        errorMessage
      );
      // Return null ให้บันทึกได้ แต่ไม่มีรูป (ไม่ break flow)
      return null;
    }
  };

  const handleSubmit = async () => {
    try {
      if (!formData.title_th || !formData.title_en || !formData.start_date || !formData.end_date) {
        error(
          language === 'th' ? '❌ ข้อมูลไม่ครบ' : '❌ Incomplete Data',
          language === 'th' ? 'กรุณากรอกข้อมูลที่จำเป็นทั้งหมด' : 'Please fill in all required fields',
          language === 'th' 
            ? `ชื่อไทย: ${formData.title_th ? '✓' : '✗'}\nชื่ออังกฤษ: ${formData.title_en ? '✓' : '✗'}\nวันเริ่มต้น: ${formData.start_date ? '✓' : '✗'}\nวันสิ้นสุด: ${formData.end_date ? '✓' : '✗'}`
            : `Thai Title: ${formData.title_th ? '✓' : '✗'}\nEnglish Title: ${formData.title_en ? '✓' : '✗'}\nStart Date: ${formData.start_date ? '✓' : '✗'}\nEnd Date: ${formData.end_date ? '✓' : '✗'}`
        );
        return;
      }

      // Validate date range
      const startDate = new Date(formData.start_date);
      const endDate = new Date(formData.end_date);
      if (startDate >= endDate) {
        error(
          language === 'th' ? '❌ วันที่ไม่ถูกต้อง' : '❌ Invalid Date Range',
          language === 'th' ? 'วันสิ้นสุดต้องหลังวันเริ่มต้น' : 'End date must be after start date',
          language === 'th' 
            ? `วันเริ่มต้น: ${startDate.toLocaleString('th-TH')}\nวันสิ้นสุด: ${endDate.toLocaleString('th-TH')}`
            : `Start: ${startDate.toLocaleString()}\nEnd: ${endDate.toLocaleString()}`
        );
        return;
      }

      setUploading(true);
      const imageUrl = await uploadImage();

      const promotionData = {
        title_th: formData.title_th,
        title_en: formData.title_en,
        description_th: formData.description_th || null,
        description_en: formData.description_en || null,
        image_url: imageUrl,
        discount_percentage: formData.discount_percentage ? parseInt(formData.discount_percentage) : null,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        is_active: formData.is_active,
        display_order: parseInt(formData.display_order),
      };

      if (selectedPromotion) {
        // Update
        const { error: updateError } = await (supabase
          .from('promotions' as any)
          .update(promotionData)
          .eq('id', selectedPromotion.id) as any);

        if (updateError) throw updateError;
        success(
          language === 'th' ? '✅ อัพเดทสำเร็จ' : '✅ Updated Successfully',
          language === 'th' ? `${formData.title_th} ได้รับการอัพเดท` : `${formData.title_en} updated`
        );
      } else {
        // Create
        const { error: insertError } = await (supabase
          .from('promotions' as any)
          .insert([promotionData]) as any);

        if (insertError) throw insertError;
        success(
          language === 'th' ? '✅ เพิ่มสำเร็จ' : '✅ Added Successfully',
          language === 'th' ? `${formData.title_th} ได้ถูกเพิ่มเข้าระบบ` : `${formData.title_en} added to system`
        );
      }

      await fetchPromotions();
      resetForm();
      setIsDialogOpen(false);
      setUploading(false);
    } catch (submitError) {
      console.error('Error saving promotion:', submitError);
      const errorMessage = submitError instanceof Error ? submitError.message : 'Unknown error';
      const errorStack = submitError instanceof Error ? submitError.stack : JSON.stringify(submitError);
      
      error(
        language === 'th' ? '❌ ไม่สามารถบันทึกข้อมูล' : '❌ Failed to Save',
        language === 'th' ? 'ตรวจสอบการเชื่อมต่อและการอนุญาต' : 'Check connection and permissions',
        `${errorMessage}\n\n${errorStack}`
      );
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedPromotion) return;

    try {
      // Delete image
      if (selectedPromotion.image_url) {
        const fileName = selectedPromotion.image_url.split('/').pop();
        if (fileName) {
          const { error: deleteImageError } = await supabase.storage.from('promotions').remove([fileName]);
          if (deleteImageError) {
            warning(
              language === 'th' ? '⚠️ ไม่สามารถลบรูปภาพ' : '⚠️ Failed to Delete Image',
              language === 'th' ? 'จะดำเนินการลบข้อมูลโปรโมชั่นต่อ' : 'Will continue deleting promotion record',
              deleteImageError.message
            );
          }
        }
      }

      // Delete promotion
      const { error: deleteError } = await (supabase
        .from('promotions' as any)
        .delete()
        .eq('id', selectedPromotion.id) as any);

      if (deleteError) throw deleteError;

      success(
        language === 'th' ? '✅ ลบสำเร็จ' : '✅ Deleted Successfully',
        language === 'th' ? `${selectedPromotion.title_th} ได้ถูกลบออกจากระบบ` : `${selectedPromotion.title_en} removed from system`
      );

      await fetchPromotions();
      setIsDeleteOpen(false);
      setSelectedPromotion(null);
      setIsDialogOpen(false);
    } catch (deleteError) {
      console.error('Error deleting promotion:', deleteError);
      const errorMessage = deleteError instanceof Error ? deleteError.message : 'Unknown error';
      const errorStack = deleteError instanceof Error ? deleteError.stack : JSON.stringify(deleteError);
      
      error(
        language === 'th' ? '❌ ไม่สามารถลบข้อมูล' : '❌ Failed to Delete',
        language === 'th' ? 'ตรวจสอบการเชื่อมต่อและการอนุญาต' : 'Check connection and permissions',
        `${errorMessage}\n\n${errorStack}`
      );
    }
  };

  const resetForm = () => {
    setFormData({
      title_th: '',
      title_en: '',
      description_th: '',
      description_en: '',
      discount_percentage: '',
      start_date: '',
      end_date: '',
      is_active: true,
      display_order: '0',
    });
    setImageFile(null);
    setImagePreview('');
    setSelectedPromotion(null);
  };

  const handleEdit = (promotion: Promotion) => {
    setSelectedPromotion(promotion);
    setFormData({
      title_th: promotion.title_th,
      title_en: promotion.title_en,
      description_th: promotion.description_th || '',
      description_en: promotion.description_en || '',
      discount_percentage: promotion.discount_percentage?.toString() || '',
      start_date: new Date(promotion.start_date).toISOString().slice(0, 16),
      end_date: new Date(promotion.end_date).toISOString().slice(0, 16),
      is_active: promotion.is_active,
      display_order: promotion.display_order.toString(),
    });
    // Always set the image preview from the promotion
    if (promotion.image_url) {
      setImagePreview(promotion.image_url);
      setImageFile(null);
    } else {
      setImagePreview('');
      setImageFile(null);
    }
    setIsDialogOpen(true);
  };

  const handleAddNew = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>
            {language === 'th' ? 'จัดการโปรโมชั่น' : 'Promotion Management'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            {language === 'th' ? 'กำลังโหลด...' : 'Loading...'}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <ServiceAlert
        alerts={alerts}
        onDismiss={removeAlert}
        onDismissAll={removeAllAlerts}
      />

      {/* Quick Guide Card */}
      <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <CardTitle className="text-lg text-blue-900 dark:text-blue-100">
              {language === 'th' ? 'คำแนะนำการใส่โปรโมชั่น' : 'How to Create Promotions'}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="text-sm space-y-2 text-blue-900 dark:text-blue-100">
          <p><strong>1. {language === 'th' ? 'ชื่อและรายละเอียด' : 'Title & Description'}:</strong> {language === 'th' ? 'ใส่ชื่อโปรโมชั่นในภาษาไทยและอังกฤษ พร้อมรายละเอียด' : 'Enter the promotion name in Thai & English with clear descriptions'}</p>
          <p><strong>2. {language === 'th' ? 'ส่วนลด' : 'Discount'}:</strong> {language === 'th' ? 'ใส่เปอร์เซ็นต์ส่วนลด เช่น 50 (สำหรับ 50%)' : 'Enter discount percentage, e.g., 50 for 50% off'}</p>
          <p><strong>3. {language === 'th' ? 'วันที่' : 'Dates'}:</strong> {language === 'th' ? 'กำหนดวันเริ่มต้นและสิ้นสุด โปรโมชั่นจะแสดงเมื่อวันนี้อยู่ในช่วงนี้' : 'Set start & end dates. Promotions show only within this period'}</p>
          <p><strong>4. {language === 'th' ? 'รูปภาพ' : 'Image'}:</strong> {language === 'th' ? 'อัพโหลดรูปอาหารเพื่อให้สวยงาม (ตัวเลือก)' : 'Upload food image for better appearance (optional)'}</p>
          <p><strong>5. {language === 'th' ? 'เปิดใช้งาน' : 'Active'}:</strong> {language === 'th' ? 'ต้องเปิดใช้งานเพื่อให้แสดงบนหน้าเว็บ' : 'Must be enabled to display on the website'}</p>
        </CardContent>
      </Card>

      {/* Main Card */}
      <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>
            {language === 'th' ? 'จัดการโปรโมชั่น' : 'Promotion Management'}
          </CardTitle>
          <CardDescription>
            {language === 'th' 
              ? `ทั้งหมด ${promotions.length} โปรโมชั่น`
              : `${promotions.length} total promotions`}
          </CardDescription>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleAddNew} className="gap-2">
              <Plus className="h-4 w-4" />
              {language === 'th' ? 'เพิ่มโปรโมชั่น' : 'Add Promotion'}
            </Button>
          </DialogTrigger>

          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {selectedPromotion
                  ? (language === 'th' ? 'แก้ไขโปรโมชั่น' : 'Edit Promotion')
                  : (language === 'th' ? 'เพิ่มโปรโมชั่นใหม่' : 'Add New Promotion')}
              </DialogTitle>
              <DialogDescription>
                {language === 'th' 
                  ? 'กรอกข้อมูลโปรโมชั่นให้สมบูรณ์ สามารถแก้ไขได้ทุกเวลา'
                  : 'Fill in all promotion details. You can edit anytime'}
              </DialogDescription>
            </DialogHeader>

            <Tabs defaultValue="details" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="details">{language === 'th' ? 'รายละเอียด' : 'Details'}</TabsTrigger>
                <TabsTrigger value="preview">{language === 'th' ? 'ตัวอย่าง' : 'Preview'}</TabsTrigger>
              </TabsList>

              {/* Details Tab */}
              <TabsContent value="details" className="space-y-6">
                {/* Title Section */}
                <div className="space-y-4 bg-slate-100 dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                  <h3 className="font-semibold text-sm flex items-center gap-2 text-slate-900 dark:text-slate-100">
                    <span className="bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">1</span>
                    {language === 'th' ? 'ชื่อและรายละเอียด' : 'Title & Description'}
                  </h3>
                  
                  <div>
                    <label className="text-sm font-semibold block mb-1 text-slate-900 dark:text-slate-100">
                      {language === 'th' ? '📝 ชื่อโปรโมชั่น (ไทย)' : '📝 Title (Thai)'}
                    </label>
                    <Input
                      value={formData.title_th}
                      onChange={(e) => setFormData({ ...formData, title_th: e.target.value })}
                      placeholder={language === 'th' ? 'เช่น ส่วนลด 50% กาแฟพิเศษ' : 'e.g., 50% Off Special Coffee'}
                      className="mb-2 bg-white dark:bg-slate-800 text-foreground placeholder:text-muted-foreground"
                    />
                    <p className="text-xs text-slate-600 dark:text-slate-300">{language === 'th' ? 'ชื่อที่จะแสดงให้ผู้ใช้ที่พูดภาษาไทย' : 'Title shown to Thai users'}</p>
                  </div>

                  <div>
                    <label className="text-sm font-semibold block mb-1 text-slate-900 dark:text-slate-100">
                      {language === 'th' ? '🌍 ชื่อโปรโมชั่น (อังกฤษ)' : '🌍 Title (English)'}
                    </label>
                    <Input
                      value={formData.title_en}
                      onChange={(e) => setFormData({ ...formData, title_en: e.target.value })}
                      placeholder="e.g., 50% Off Special Coffee"
                      className="mb-2 bg-white dark:bg-slate-800 text-foreground placeholder:text-muted-foreground"
                    />
                    <p className="text-xs text-slate-600 dark:text-slate-300">{language === 'th' ? 'ชื่อเนื่อง English น' : 'Title shown to English users'}</p>
                  </div>

                  <div>
                    <label className="text-sm font-semibold block mb-1 text-slate-900 dark:text-slate-100">
                      {language === 'th' ? '💬 รายละเอียด (ไทย)' : '💬 Description (Thai)'}
                    </label>
                    <Textarea
                      value={formData.description_th}
                      onChange={(e) => setFormData({ ...formData, description_th: e.target.value })}
                      placeholder={language === 'th' ? 'เช่น ลด 50% สำหรับเมนูกาแฟทั้งหมด ทุกวันจันทร์-ศุกร์' : 'e.g., 50% discount on all coffee menus, Monday-Friday'}
                      rows={2}
                      className="mb-2 bg-white dark:bg-slate-800 text-foreground placeholder:text-muted-foreground"
                    />
                    <p className="text-xs text-slate-600 dark:text-slate-300">{language === 'th' ? 'อธิบายเพิ่มเติมเกี่ยวกับโปรโมชั่น (บรรยายสั้น ๆ)' : 'Additional details about the promotion'}</p>
                  </div>

                  <div>
                    <label className="text-sm font-semibold block mb-1 text-slate-900 dark:text-slate-100">
                      {language === 'th' ? '💬 รายละเอียด (อังกฤษ)' : '💬 Description (English)'}
                    </label>
                    <Textarea
                      value={formData.description_en}
                      onChange={(e) => setFormData({ ...formData, description_en: e.target.value })}
                      placeholder="e.g., 50% discount on all coffee menus, Monday-Friday"
                      rows={2}
                      className="mb-2 bg-white dark:bg-slate-800 text-foreground placeholder:text-muted-foreground"
                    />
                    <p className="text-xs text-slate-600 dark:text-slate-300">{language === 'th' ? 'คำอธิบายเดียวกันในภาษาอังกฤษ' : 'Same description in English'}</p>
                  </div>
                </div>

                {/* Discount Section */}
                <div className="space-y-4 bg-slate-100 dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                  <h3 className="font-semibold text-sm flex items-center gap-2 text-slate-900 dark:text-slate-100">
                    <span className="bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">2</span>
                    {language === 'th' ? 'ส่วนลดและลำดับ' : 'Discount & Order'}
                  </h3>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-semibold block mb-1 text-slate-900 dark:text-slate-100">
                        {language === 'th' ? '🔥 ร้อยละส่วนลด' : '🔥 Discount %'}
                      </label>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={formData.discount_percentage}
                        onChange={(e) => setFormData({ ...formData, discount_percentage: e.target.value })}
                        placeholder="50"
                        className="mb-2 bg-white dark:bg-slate-800 text-foreground placeholder:text-muted-foreground"
                      />
                      <p className="text-xs text-slate-600 dark:text-slate-300">{language === 'th' ? 'ตัวเลข 0-100 เท่านั้น' : 'Number from 0-100'}</p>
                    </div>

                    <div>
                      <label className="text-sm font-semibold block mb-1 text-slate-900 dark:text-slate-100">
                        {language === 'th' ? '📊 ลำดับแสดงผล' : '📊 Display Order'}
                      </label>
                      <Input
                        type="number"
                        min="0"
                        value={formData.display_order}
                        onChange={(e) => setFormData({ ...formData, display_order: e.target.value })}
                        placeholder="0"
                        className="mb-2 bg-white dark:bg-slate-800 text-foreground placeholder:text-muted-foreground"
                      />
                      <p className="text-xs text-slate-600 dark:text-slate-300">{language === 'th' ? '0 = แสดงก่อน, 1 = ที่สอง' : '0=first, 1=second'}</p>
                    </div>
                  </div>
                </div>

                {/* Dates Section */}
                <div className="space-y-4 bg-slate-100 dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                  <h3 className="font-semibold text-sm flex items-center gap-2 text-slate-900 dark:text-slate-100">
                    <Clock className="w-4 h-4" />
                    <span className="bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">3</span>
                    {language === 'th' ? 'วันที่และเวลา' : 'Dates & Times'}
                  </h3>

                  <div className="bg-amber-50 dark:bg-amber-950/20 p-3 rounded border border-amber-200 dark:border-amber-800">
                    <p className="text-xs text-amber-900 dark:text-amber-100">
                      {language === 'th' 
                        ? '⏰ โปรโมชั่นจะแสดงเมื่อวันและเวลานี้อยู่ในช่วงนี้เท่านั้น'
                        : '⏰ Promotions show only when current date/time is within this range'}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-semibold block mb-1 text-slate-900 dark:text-slate-100">
                        {language === 'th' ? '🟢 วันเริ่มต้น' : '🟢 Start Date'}
                      </label>
                      <Input
                        type="datetime-local"
                        value={formData.start_date}
                        onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                        className="bg-white dark:bg-slate-800 text-foreground"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-semibold block mb-1 text-slate-900 dark:text-slate-100">
                        {language === 'th' ? '🔴 วันสิ้นสุด' : '🔴 End Date'}
                      </label>
                      <Input
                        type="datetime-local"
                        value={formData.end_date}
                        onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                        className="bg-white dark:bg-slate-800 text-foreground"
                      />
                    </div>
                  </div>
                </div>

                {/* Image Upload Section */}
                <div className="space-y-4 bg-orange-50 dark:bg-orange-950/20 p-4 rounded-lg border border-orange-200 dark:border-orange-800">
                  <h3 className="font-semibold text-sm flex items-center gap-2 text-orange-900 dark:text-orange-100">
                    <span className="bg-orange-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">4</span>
                    {language === 'th' ? '📸 รูปภาพ' : '📸 Image'} {language === 'th' ? '(ตัวเลือก)' : '(Optional)'}
                  </h3>

                  <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-6 text-center hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    {imagePreview ? (
                      <div className="space-y-3">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="w-full h-48 object-cover rounded-lg"
                        />
                        <div className="flex gap-2 justify-center">
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              setImageFile(null);
                              setImagePreview('');
                            }}
                          >
                            {language === 'th' ? '🗑️ ลบรูป' : '🗑️ Remove'}
                          </Button>
                          <label>
                            <Button className="bg-blue-600 hover:bg-blue-700 text-white" size="sm" asChild>
                              <span>{language === 'th' ? '✏️ เปลี่ยนรูป' : '✏️ Change'}</span>
                            </Button>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleImageChange}
                              className="hidden"
                            />
                          </label>
                        </div>
                      </div>
                    ) : (
                      <label className="cursor-pointer">
                        <div className="flex flex-col items-center gap-3">
                          <Upload className="h-10 w-10 text-blue-500" />
                          <div>
                            <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{language === 'th' ? '📸 คลิกหรือลากรูปมาที่นี่' : '📸 Click or drag image here'}</div>
                            <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">{language === 'th' ? '📁 สนับสนุน: JPG, PNG (สูงสุด 5MB)' : '📁 JPG, PNG up to 5MB'}</div>
                          </div>
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                </div>

                {/* Active Status Section */}
                <div className="space-y-4 bg-green-100 dark:bg-green-900/30 p-4 rounded-lg border border-green-300 dark:border-green-700">
                  <h3 className="font-semibold text-sm flex items-center gap-2 text-green-900 dark:text-green-100">
                    <span className="bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">5</span>
                    {language === 'th' ? 'สถานะ' : 'Status'}
                  </h3>

                  <div className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 rounded border border-green-300 dark:border-green-600">
                    <input
                      type="checkbox"
                      id="is_active"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="w-4 h-4 rounded"
                    />
                    <label htmlFor="is_active" className="text-sm font-semibold cursor-pointer flex-1 text-slate-900 dark:text-slate-100">
                      {language === 'th' ? '✅ เปิดใช้งาน (แสดงบนเว็บ)' : '✅ Active (Display on website)'}
                    </label>
                    <span className={cn(
                      "px-3 py-1 rounded-full text-xs font-semibold",
                      formData.is_active 
                        ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300" 
                        : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                    )}>
                      {formData.is_active ? (language === 'th' ? 'เปิดใช้งาน' : 'Active') : (language === 'th' ? 'ปิด' : 'Inactive')}
                    </span>
                  </div>
                </div>
              </TabsContent>

              {/* Preview Tab */}
              <TabsContent value="preview" className="space-y-4">
                <div className="bg-amber-50 dark:bg-amber-950/20 p-4 rounded border border-amber-200 dark:border-amber-900">
                  <p className="text-xs text-amber-900 dark:text-amber-100">
                    {language === 'th' ? '📱 นี่คือวิธีการแสดงโปรโมชั่นบนหน้าเว็บของคุณ' : '📱 This is how your promotion will look on the website'}
                  </p>
                </div>

                <div className="border-2 border-red-500 rounded-2xl p-4 bg-gradient-to-br from-white to-orange-50/20 dark:from-slate-900 dark:to-orange-950/20 max-w-sm">
                  {imagePreview && (
                    <div className="mb-4 rounded-xl overflow-hidden h-40 border-4 border-red-500">
                      <img src={imagePreview} alt="preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                  
                  <div className="flex items-start gap-2 mb-3">
                    <Flame className="w-5 h-5 text-orange-500 fill-orange-500 animate-pulse mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <h4 className="font-bold text-lg">{formData.title_th || (language === 'th' ? 'ชื่อโปรโมชั่น' : 'Promotion Title')}</h4>
                      {formData.description_th && (
                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{formData.description_th}</p>
                      )}
                    </div>
                    {formData.discount_percentage && (
                      <div className="flex-shrink-0 bg-red-500 text-white px-2.5 py-1.5 rounded-lg font-bold text-sm">
                        -{formData.discount_percentage}%
                      </div>
                    )}
                  </div>

                  {formData.start_date && formData.end_date && (
                    <div className="bg-orange-100 dark:bg-orange-900/30 rounded-lg p-3 text-xs">
                      <div className="flex items-center gap-2 text-orange-900 dark:text-orange-200 font-semibold mb-2">
                        <Clock className="w-4 h-4" />
                        เหลือเวลา
                      </div>
                      <div className="grid grid-cols-4 gap-2">
                        <div className="bg-white dark:bg-slate-800 rounded p-1.5 text-center text-sm font-bold text-orange-600 dark:text-orange-400">
                          99
                          <div className="text-[9px] text-gray-500">วัน</div>
                        </div>
                        <div className="bg-white dark:bg-slate-800 rounded p-1.5 text-center text-sm font-bold text-orange-600 dark:text-orange-400">
                          23
                          <div className="text-[9px] text-gray-500">ชม</div>
                        </div>
                        <div className="bg-white dark:bg-slate-800 rounded p-1.5 text-center text-sm font-bold text-orange-600 dark:text-orange-400">
                          59
                          <div className="text-[9px] text-gray-500">นาที</div>
                        </div>
                        <div className="bg-white dark:bg-slate-800 rounded p-1.5 text-center text-sm font-bold text-red-600 dark:text-red-400">
                          45
                          <div className="text-[9px] text-gray-500">วิ</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                {language === 'th' ? 'ยกเลิก' : 'Cancel'}
              </Button>
              {selectedPromotion && (
                <Button
                  variant="destructive"
                  onClick={() => {
                    setIsDeleteOpen(true);
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {language === 'th' ? 'ลบโปรโมชั่น' : 'Delete'}
                </Button>
              )}
              <Button onClick={handleSubmit} disabled={uploading}>
                {uploading
                  ? (language === 'th' ? 'กำลังบันทึก...' : 'Saving...')
                  : (language === 'th' ? '💾 บันทึก' : '💾 Save')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>

      <CardContent>
        {promotions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {language === 'th' ? 'ยังไม่มีโปรโมชั่น' : 'No promotions yet'}
          </div>
        ) : (
          <div className="space-y-3 max-h-[500px] overflow-y-auto">
            {promotions.map((promo) => (
              <div
                key={promo.id}
                className="flex items-center gap-4 p-4 border rounded-lg hover:bg-accent"
              >
                {promo.image_url && (
                  <img
                    src={promo.image_url}
                    alt={promo.title_th}
                    className="h-16 w-16 object-cover rounded"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold truncate">
                    {language === 'th' ? promo.title_th : promo.title_en}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {promo.discount_percentage && `${promo.discount_percentage}% off`}
                    {promo.discount_percentage && promo.is_active && ' • '}
                    {promo.is_active && (
                      <span className="text-green-600 font-semibold">
                        {language === 'th' ? 'เปิดใช้งาน' : 'Active'}
                      </span>
                    )}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleEdit(promo)}
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {language === 'th' ? 'ลบโปรโมชั่น' : 'Delete Promotion'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {language === 'th'
                ? 'คุณแน่ใจว่าต้องการลบโปรโมชั่นนี้ใหม่?'
                : 'Are you sure you want to delete this promotion?'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{language === 'th' ? 'ยกเลิก' : 'Cancel'}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {language === 'th' ? 'ลบ' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
    </div>
  );
};

export default PromotionManagement;
