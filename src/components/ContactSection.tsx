import { useLanguage, translations } from "@/hooks/useLanguage";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Phone, Mail, MapPin, Clock, MessageCircle, Send, Instagram, Facebook, Twitter } from "lucide-react";
import { useState, useEffect } from "react";
import sweetAlert from "@/lib/sweetAlert";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import FacebookPagePlugin from "@/components/FacebookPagePlugin";

const ContactSection = () => {
  const { language } = useLanguage();
  const t = translations[language];

  const [businessInfo, setBusinessInfo] = useState<{
    phone_primary: string;
    phone_secondary?: string | null;
    email?: string | null;
    line_id?: string | null;
    instagram?: string | null;
    facebook?: string | null;
    twitter?: string | null;
    address_th?: string | null;
    address_en?: string | null;
    opening_hours_th?: string | null;
    opening_hours_en?: string | null;
  } | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    topic: "",
    message: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch business info from database
  useEffect(() => {
    const fetchBusinessInfo = async () => {
      try {
        const { data, error } = await supabase
          .from('business_info')
          .select('*')
          .eq('is_active', true)
          .maybeSingle();

        if (error) throw error;
        if (data) setBusinessInfo(data);
      } catch (error) {
        console.error('Error fetching business info:', error);
      }
    };

    fetchBusinessInfo();
  }, []);

  const contactSchema = z.object({
    name: z
      .string()
      .trim()
      .min(1, { message: language === "th" ? "กรุณากรอกชื่อ" : "Please enter your name" })
      .min(2, {
        message:
          language === "th"
            ? "ชื่อต้องมีอย่างน้อย 2 ตัวอักษร"
            : "Name must be at least 2 characters",
      })
      .max(100, {
        message:
          language === "th"
            ? "ชื่อต้องไม่เกิน 100 ตัวอักษร"
            : "Name must be less than 100 characters",
      })
      .regex(/^[\u0E00-\u0E7Fa-zA-Z\s]+$/, {
        message:
          language === "th"
            ? "ชื่อควรประกอบด้วยตัวอักษร (ไทย/อังกฤษ) และเว้นวรรคเท่านั้น"
            : "Name must contain only letters (Thai/English) and spaces",
      }),
    email: z
      .string()
      .trim()
      .email({
        message:
          language === "th" ? "รูปแบบอีเมลไม่ถูกต้อง" : "Invalid email address",
      })
      .max(255, {
        message:
          language === "th"
            ? "อีเมลต้องไม่เกิน 255 ตัวอักษร"
            : "Email must be less than 255 characters",
      }),
    phone: z
      .string()
      .trim()
      .regex(/^\d{10}$/, {
        message:
          language === "th"
            ? "เบอร์โทรต้องมี 10 หลักและประกอบด้วยตัวเลขเท่านั้น"
            : "Phone number must be exactly 10 digits",
      }),
    topic: z
      .string()
      .trim()
      .min(1, {
        message:
          language === "th" ? "กรุณากรอกหัวข้อ" : "Please enter a topic",
      })
      .max(200, {
        message:
          language === "th"
            ? "หัวข้อต้องไม่เกิน 200 ตัวอักษร"
            : "Topic must be less than 200 characters",
      }),
    message: z
      .string()
      .trim()
      .min(10, {
        message:
          language === "th"
            ? "ข้อความต้องมีอย่างน้อย 10 ตัวอักษร"
            : "Message must be at least 10 characters",
      })
      .max(1000, {
        message:
          language === "th"
            ? "ข้อความต้องไม่เกิน 1000 ตัวอักษร"
            : "Message must be less than 1000 characters",
      }),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Validate form data
      contactSchema.parse(formData);
      setErrors({});

      // Show confirmation dialog
      const confirmed = await sweetAlert.modal.confirm(
        language === "th" ? "ยืนยันการส่งข้อความ" : "Confirm Message",
        language === "th"
          ? `คุณต้องการส่งข้อความถึงเราใช่หรือไม่?\n\nหัวข้อ: ${formData.topic}`
          : `Do you want to send this message?\n\nTopic: ${formData.topic}`,
        language === "th" ? "ส่งข้อความ" : "Send",
        language === "th" ? "ยกเลิก" : "Cancel"
      );

      if (!confirmed) return;

      // Send to backend function (contact -> notifies LINE)
      const { error } = await supabase.functions.invoke("contact", {
        body: { ...formData, language },
      });

      if (error) {
        console.error("Error sending contact form:", error);
        sweetAlert.error(
          language === "th"
            ? "เกิดข้อผิดพลาดในการส่งข้อความ กรุณาลองใหม่อีกครั้ง"
            : "Failed to send message. Please try again."
        );
        return;
      }

      // Show success alert
      sweetAlert.success(t.messageSuccess, t.messageSent);

      // Reset form
      setFormData({
        name: "",
        email: "",
        phone: "",
        topic: "",
        message: "",
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(newErrors);
      } else {
        sweetAlert.error(
          language === "th"
            ? "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง"
            : "An error occurred. Please try again."
        );
      }
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    let processedValue = value;

    // Validate and process input based on field type
    if (name === "name") {
      // Allow only Thai and English letters and spaces
      processedValue = value.replace(/[^ก-๙a-zA-Z\s]/g, "");
    } else if (name === "phone") {
      // Allow only digits and limit to 10
      processedValue = value.replace(/[^\d]/g, "").slice(0, 10);
    }

    setFormData((prev) => ({
      ...prev,
      [name]: processedValue,
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  return (
    <section id="contact" className="py-16 sm:py-20 bg-background overflow-x-hidden">
      <div className="container mx-auto px-4 sm:px-6 max-w-full">
        {/* Google Maps */}
        {businessInfo?.address_th && (
          <div className="mb-10 sm:mb-16 animate-fade-in rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 border border-primary/20">
            <iframe 
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1369.0154984267165!2d100.58045831684991!3d13.94904317189059!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x30e28325db535c0f%3A0x2dd936aab31792a2!2sPlern%20Ping%20Hotel%20%26%20Cafe!5e0!3m2!1sth!2sth!4v1771762338979!5m2!1sth!2sth" 
              width="100%" 
              height="450" 
              style={{ border: 0 }}
              allowFullScreen 
              loading="lazy" 
              referrerPolicy="no-referrer-when-downgrade"
              className="w-full"
            />
          </div>
        )}

        <div className="text-center mb-10 sm:mb-16 animate-fade-in">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 sm:mb-4 text-foreground">
            {t.contactTitle}
          </h2>
          <p className="text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto px-2">
            {t.contactSubtitle}
          </p>
        </div>

        <div className="grid gap-6 sm:gap-8 max-w-7xl mx-auto lg:grid-cols-3 min-w-0">
          {/* Left side - Contact Information */}
          <div className="space-y-5 sm:space-y-8 animate-fade-in lg:col-span-1 min-w-0">
            {/* Address */}
            {businessInfo && (businessInfo.address_th || businessInfo.address_en) && (
              <div className="flex gap-3 sm:gap-4 items-start">
                <div className="bg-background/20 backdrop-blur-md p-2.5 sm:p-3 rounded-xl flex-shrink-0 border border-background/30 hover:border-background/50 transition-all duration-300 hover:shadow-lg hover:shadow-black/10">
                  <MapPin className="w-5 h-5 sm:w-6 sm:h-6 text-foreground/70" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-lg sm:text-xl mb-1 sm:mb-2 text-foreground">
                    {t.address}
                  </h3>
                  <p className="text-muted-foreground text-sm sm:text-base">
                    {language === 'th' ? businessInfo.address_th : businessInfo.address_en}
                  </p>
                </div>
              </div>
            )}

            {/* Phone Numbers */}
            {businessInfo && (
              <div className="flex gap-3 sm:gap-4 items-start">
                <div className="bg-background/20 backdrop-blur-md p-2.5 sm:p-3 rounded-xl flex-shrink-0 border border-background/30 hover:border-background/50 transition-all duration-300 hover:shadow-lg hover:shadow-black/10">
                  <Phone className="w-5 h-5 sm:w-6 sm:h-6 text-foreground/70" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg sm:text-xl mb-1 sm:mb-2 text-foreground">
                    {t.phone}
                  </h3>
                  <a
                    href={`tel:+66${businessInfo.phone_primary}`}
                    className="block text-muted-foreground hover:text-highlight transition-colors text-sm sm:text-base"
                  >
                    {businessInfo.phone_primary}
                  </a>
                  {businessInfo.phone_secondary && (
                    <a
                      href={`tel:+66${businessInfo.phone_secondary}`}
                      className="block text-muted-foreground hover:text-highlight transition-colors text-sm sm:text-base"
                    >
                      {businessInfo.phone_secondary}
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Email */}
            {businessInfo?.email && (
              <div className="flex gap-3 sm:gap-4 items-start">
                <div className="bg-background/20 backdrop-blur-md p-2.5 sm:p-3 rounded-xl flex-shrink-0 border border-background/30 hover:border-background/50 transition-all duration-300 hover:shadow-lg hover:shadow-black/10">
                  <Mail className="w-5 h-5 sm:w-6 sm:h-6 text-foreground/70" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-lg sm:text-xl mb-1 sm:mb-2 text-foreground">
                    {t.email}
                  </h3>
                  <a
                    href={`mailto:${businessInfo.email}`}
                    className="text-muted-foreground hover:text-highlight transition-colors text-sm sm:text-base break-all"
                  >
                    {businessInfo.email}
                  </a>
                </div>
              </div>
            )}

            {/* LINE ID */}
            {businessInfo?.line_id && (
              <div className="flex gap-3 sm:gap-4 items-start">
                <div className="bg-background/20 backdrop-blur-md p-2.5 sm:p-3 rounded-xl flex-shrink-0 border border-background/30 hover:border-background/50 transition-all duration-300 hover:shadow-lg hover:shadow-black/10">
                  <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6 text-foreground/70" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg sm:text-xl mb-1 sm:mb-2 text-foreground">
                    LINE ID
                  </h3>
                  <p className="text-muted-foreground text-sm sm:text-base">{businessInfo.line_id}</p>
                </div>
              </div>
            )}

            {/* Opening Hours */}
            {businessInfo && (businessInfo.opening_hours_th || businessInfo.opening_hours_en) && (
              <div className="flex gap-3 sm:gap-4 items-start">
                <div className="bg-background/20 backdrop-blur-md p-2.5 sm:p-3 rounded-xl flex-shrink-0 border border-background/30 hover:border-background/50 transition-all duration-300 hover:shadow-lg hover:shadow-black/10">
                  <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-foreground/70" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg sm:text-xl mb-1 sm:mb-2 text-foreground">
                    {t.openingHours}
                  </h3>
                  <p className="text-muted-foreground text-sm sm:text-base">
                    {language === 'th' ? businessInfo.opening_hours_th : businessInfo.opening_hours_en}
                  </p>
                </div>
              </div>
            )}

            {/* Social Media */}
            {(businessInfo?.instagram || businessInfo?.facebook || businessInfo?.line_id || businessInfo?.twitter) && (
              <div>
                <h3 className="font-semibold text-lg sm:text-xl mb-3 sm:mb-4 text-foreground">
                  {t.followUs}
                </h3>
                <div className="flex gap-3 sm:gap-4 flex-wrap">
                  {businessInfo.line_id && (
                    <a
                      href={`https://line.me/R/ti/p/${businessInfo.line_id.replace('@', '%40')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-muted hover:bg-highlight/20 p-2.5 sm:p-3 rounded-lg transition-colors"
                      aria-label="LINE"
                    >
                      <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6 text-foreground" />
                    </a>
                  )}
                  {businessInfo.facebook && (
                    <a
                      href={businessInfo.facebook.startsWith('http') 
                        ? businessInfo.facebook 
                        : `https://www.facebook.com/${businessInfo.facebook}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-muted hover:bg-highlight/20 p-2.5 sm:p-3 rounded-lg transition-colors"
                      aria-label="Facebook"
                    >
                      <Facebook className="w-5 h-5 sm:w-6 sm:h-6 text-foreground" />
                    </a>
                  )}
                  {businessInfo.instagram && (
                    <a
                      href={`https://www.instagram.com/${businessInfo.instagram.replace('@', '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-muted hover:bg-highlight/20 p-2.5 sm:p-3 rounded-lg transition-colors"
                      aria-label="Instagram"
                    >
                      <Instagram className="w-5 h-5 sm:w-6 sm:h-6 text-foreground" />
                    </a>
                  )}
                  {businessInfo.twitter && (
                    <a
                      href={businessInfo.twitter.startsWith('http') 
                        ? businessInfo.twitter 
                        : `https://x.com/${businessInfo.twitter.replace('@', '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-muted hover:bg-highlight/20 p-2.5 sm:p-3 rounded-lg transition-colors"
                      aria-label="X (Twitter)"
                    >
                      <Twitter className="w-5 h-5 sm:w-6 sm:h-6 text-foreground" />
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Center - Contact Form */}
          <Card className="p-4 sm:p-6 md:p-8 animate-fade-in bg-card/50 lg:col-span-1 w-full min-w-0 overflow-hidden">
            <h3 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-foreground">
              {t.sendMessageForm}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium mb-1.5 sm:mb-2 text-foreground">
                  {t.nameLabel}
                </label>
                <Input id="name" name="name" type="text" value={formData.name} onChange={handleChange} placeholder={t.namePlaceholder} className={`h-11 sm:h-10 bg-white ${errors.name ? "border-destructive" : ""}`} />
                {errors.name && <p className="text-sm text-destructive mt-1">{errors.name}</p>}
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-1.5 sm:mb-2 text-foreground">
                  {t.emailLabel}
                </label>
                <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} placeholder={t.emailPlaceholder} className={`h-11 sm:h-10 bg-white ${errors.email ? "border-destructive" : ""}`} />
                {errors.email && <p className="text-sm text-destructive mt-1">{errors.email}</p>}
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium mb-1.5 sm:mb-2 text-foreground">
                  {t.phoneLabel}
                </label>
                <Input id="phone" name="phone" type="tel" value={formData.phone} onChange={handleChange} placeholder={t.phonePlaceholder} className={`h-11 sm:h-10 bg-white ${errors.phone ? "border-destructive" : ""}`} />
                {errors.phone && <p className="text-sm text-destructive mt-1">{errors.phone}</p>}
              </div>

              <div>
                <label htmlFor="topic" className="block text-sm font-medium mb-1.5 sm:mb-2 text-foreground">
                  {t.topicLabel}
                </label>
                <Input id="topic" name="topic" type="text" value={formData.topic} onChange={handleChange} placeholder={t.topicPlaceholder} className={`h-11 sm:h-10 bg-white ${errors.topic ? "border-destructive" : ""}`} />
                {errors.topic && <p className="text-sm text-destructive mt-1">{errors.topic}</p>}
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium mb-1.5 sm:mb-2 text-foreground">
                  {t.messageLabel}
                </label>
                <Textarea id="message" name="message" value={formData.message} onChange={handleChange} placeholder={t.messagePlaceholder} rows={4} className={`bg-white ${errors.message ? "border-destructive" : ""}`} />
                {errors.message && <p className="text-sm text-destructive mt-1">{errors.message}</p>}
              </div>

              <Button type="submit" size="lg" className="w-full h-12 sm:h-11 text-base rounded-xl sm:rounded-lg bg-foreground text-background hover:bg-foreground/90 shadow-lg hover:shadow-xl transition-all">
                <Send className="mr-2 h-5 w-5" />
                {t.sendMessage}
              </Button>
            </form>
          </Card>

          {/* Right side - Facebook Page Plugin */}
          <div className="lg:col-span-1 order-3 w-full min-w-0">
            <FacebookPagePlugin />
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
