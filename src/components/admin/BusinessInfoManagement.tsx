import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";

const businessInfoSchema = z.object({
  business_name_th: z.string().min(1, "กรุณากรอกชื่อธุรกิจภาษาไทย").max(200),
  business_name_en: z.string().min(1, "Please enter business name in English").max(200),
  phone_primary: z.string().min(9, "กรุณากรอกเบอร์โทรศัพท์หลัก").max(20),
  phone_secondary: z.string().max(20).optional().nullable(),
  email: z.string().email("กรุณากรอกอีเมลที่ถูกต้อง").max(255).optional().nullable(),
  line_id: z.string().max(100).optional().nullable(),
  instagram: z.string().max(100).optional().nullable(),
  facebook: z.string().max(100).optional().nullable(),
  address_th: z.string().max(500).optional().nullable(),
  address_en: z.string().max(500).optional().nullable(),
  google_maps_url: z.string().url("กรุณากรอก URL ที่ถูกต้อง").max(500).optional().nullable(),
  opening_hours_th: z.string().max(200).optional().nullable(),
  opening_hours_en: z.string().max(200).optional().nullable(),
});

type BusinessInfoFormData = z.infer<typeof businessInfoSchema>;

const BusinessInfoManagement = () => {
  const { language } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [businessId, setBusinessId] = useState<string | null>(null);

  const form = useForm<BusinessInfoFormData>({
    resolver: zodResolver(businessInfoSchema),
    defaultValues: {
      business_name_th: "",
      business_name_en: "",
      phone_primary: "",
      phone_secondary: "",
      email: "",
      line_id: "",
      instagram: "",
      facebook: "",
      address_th: "",
      address_en: "",
      google_maps_url: "",
      opening_hours_th: "",
      opening_hours_en: "",
    },
  });

  useEffect(() => {
    fetchBusinessInfo();
  }, []);

  const fetchBusinessInfo = async () => {
    try {
      setFetching(true);
      const { data, error } = await supabase
        .from('business_info')
        .select('*')
        .eq('is_active', true)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setBusinessId(data.id);
        form.reset({
          business_name_th: data.business_name_th || "",
          business_name_en: data.business_name_en || "",
          phone_primary: data.phone_primary || "",
          phone_secondary: data.phone_secondary || "",
        email: data.email || "",
        line_id: data.line_id || "",
        instagram: data.instagram || "",
        facebook: data.facebook || "",
        address_th: data.address_th || "",
          address_en: data.address_en || "",
          google_maps_url: data.google_maps_url || "",
          opening_hours_th: data.opening_hours_th || "",
          opening_hours_en: data.opening_hours_en || "",
        });
      }
    } catch (error) {
      console.error('Error fetching business info:', error);
      toast.error(language === 'th' ? 'ไม่สามารถโหลดข้อมูลได้' : 'Failed to load business information');
    } finally {
      setFetching(false);
    }
  };

  const onSubmit = async (values: BusinessInfoFormData) => {
    try {
      setLoading(true);

      // Convert empty strings to null for optional fields only
      const dataToSave = {
        business_name_th: values.business_name_th,
        business_name_en: values.business_name_en,
        phone_primary: values.phone_primary,
        phone_secondary: values.phone_secondary || null,
        email: values.email || null,
        line_id: values.line_id || null,
        instagram: values.instagram || null,
        facebook: values.facebook || null,
        address_th: values.address_th || null,
        address_en: values.address_en || null,
        google_maps_url: values.google_maps_url || null,
        opening_hours_th: values.opening_hours_th || null,
        opening_hours_en: values.opening_hours_en || null,
      };

      if (businessId) {
        // Update existing record
        const { error } = await supabase
          .from('business_info')
          .update(dataToSave)
          .eq('id', businessId);

        if (error) throw error;
      } else {
        // Insert new record
        const { data, error } = await supabase
          .from('business_info')
          .insert([{ ...dataToSave, is_active: true }])
          .select()
          .single();

        if (error) throw error;
        if (data) setBusinessId(data.id);
      }

      toast.success(language === 'th' ? 'บันทึกข้อมูลสำเร็จ' : 'Business information saved successfully');
    } catch (error) {
      console.error('Error saving business info:', error);
      toast.error(language === 'th' ? 'ไม่สามารถบันทึกข้อมูลได้' : 'Failed to save business information');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {language === 'th' ? 'จัดการข้อมูลธุรกิจ' : 'Business Information Management'}
        </CardTitle>
        <CardDescription>
          {language === 'th' 
            ? 'แก้ไขข้อมูลติดต่อและรายละเอียดธุรกิจที่แสดงในหน้าเว็บไซต์'
            : 'Edit contact information and business details displayed on the website'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Business Name */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="business_name_th"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{language === 'th' ? 'ชื่อธุรกิจ (ไทย)' : 'Business Name (Thai)'} *</FormLabel>
                    <FormControl>
                      <Input placeholder="เปลิน-พิง คาเฟ่" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="business_name_en"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{language === 'th' ? 'ชื่อธุรกิจ (อังกฤษ)' : 'Business Name (English)'} *</FormLabel>
                    <FormControl>
                      <Input placeholder="Plern Ping Cafe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Phone Numbers */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="phone_primary"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{language === 'th' ? 'เบอร์โทรหลัก' : 'Primary Phone'} *</FormLabel>
                    <FormControl>
                      <Input placeholder="0818469098" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone_secondary"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{language === 'th' ? 'เบอร์โทรสำรอง' : 'Secondary Phone'}</FormLabel>
                    <FormControl>
                      <Input placeholder="0817100611" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Contact Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{language === 'th' ? 'อีเมล' : 'Email'}</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="plernping5445@gmail.com" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="line_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>LINE ID</FormLabel>
                    <FormControl>
                      <Input placeholder="@plernpingcafe" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Social Media */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="instagram"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Instagram</FormLabel>
                    <FormControl>
                      <Input placeholder="@plernpingcafe" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="facebook"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Facebook</FormLabel>
                    <FormControl>
                      <Input placeholder="PlernPingCafe หรือ URL เต็ม" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Opening Hours */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="opening_hours_th"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{language === 'th' ? 'เวลาทำการ (ไทย)' : 'Opening Hours (Thai)'}</FormLabel>
                    <FormControl>
                      <Input placeholder="เปิดทุกวัน 08:00 - 20:00 น." {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="opening_hours_en"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{language === 'th' ? 'เวลาทำการ (อังกฤษ)' : 'Opening Hours (English)'}</FormLabel>
                    <FormControl>
                      <Input placeholder="Open daily 08:00 AM - 08:00 PM" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Address */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="address_th"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{language === 'th' ? 'ที่อยู่ (ไทย)' : 'Address (Thai)'}</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="เชียงใหม่, ประเทศไทย" 
                        className="min-h-[80px]"
                        {...field} 
                        value={field.value || ""} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="address_en"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{language === 'th' ? 'ที่อยู่ (อังกฤษ)' : 'Address (English)'}</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Chiang Mai, Thailand" 
                        className="min-h-[80px]"
                        {...field} 
                        value={field.value || ""} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Google Maps URL */}
            <FormField
              control={form.control}
              name="google_maps_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Google Maps URL</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="https://maps.google.com/?q=Plern+Ping+Cafe" 
                      {...field} 
                      value={field.value || ""} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Submit Button */}
            <div className="flex justify-end">
              <Button type="submit" disabled={loading} className="gap-2">
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {language === 'th' ? 'กำลังบันทึก...' : 'Saving...'}
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    {language === 'th' ? 'บันทึกข้อมูล' : 'Save Information'}
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default BusinessInfoManagement;
