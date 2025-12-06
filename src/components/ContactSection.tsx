import { useLanguage, translations } from "@/hooks/useLanguage";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Phone, Mail, MapPin, Clock, MessageCircle, Send, Instagram, Facebook } from "lucide-react";
import { useState, useEffect } from "react";
import sweetAlert from "@/lib/sweetAlert";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

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
      .max(100, {
        message:
          language === "th"
            ? "ชื่อต้องไม่เกิน 100 ตัวอักษร"
            : "Name must be less than 100 characters",
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
      .min(1, {
        message:
          language === "th"
            ? "กรุณากรอกเบอร์โทร"
            : "Please enter your phone number",
      })
      .max(20, {
        message:
          language === "th"
            ? "เบอร์โทรต้องไม่เกิน 20 ตัวอักษร"
            : "Phone must be less than 20 characters",
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
      .min(1, {
        message:
          language === "th"
            ? "กรุณากรอกข้อความ"
            : "Please enter your message",
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
    setFormData((prev) => ({
      ...prev,
      [name]: value,
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
    <section id="contact" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
            {t.contactTitle}
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            {t.contactSubtitle}
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-12 max-w-6xl mx-auto">
          {/* Left side - Contact Information */}
          <div className="space-y-8 animate-fade-in">
            {/* Address */}
            {businessInfo && (businessInfo.address_th || businessInfo.address_en) && (
              <div className="flex gap-4 items-start">
                <div className="bg-muted p-3 rounded-lg">
                  <MapPin className="w-6 h-6 text-highlight" />
                </div>
                <div>
                  <h3 className="font-semibold text-xl mb-2 text-foreground">
                    {t.address}
                  </h3>
                  <p className="text-muted-foreground">
                    {language === 'th' ? businessInfo.address_th : businessInfo.address_en}
                  </p>
                </div>
              </div>
            )}

            {/* Phone Numbers */}
            {businessInfo && (
              <div className="flex gap-4 items-start">
                <div className="bg-muted p-3 rounded-lg">
                  <Phone className="w-6 h-6 text-highlight" />
                </div>
                <div>
                  <h3 className="font-semibold text-xl mb-2 text-foreground">
                    {t.phone}
                  </h3>
                  <a
                    href={`tel:+66${businessInfo.phone_primary}`}
                    className="block text-muted-foreground hover:text-highlight transition-colors"
                  >
                    {businessInfo.phone_primary}
                  </a>
                  {businessInfo.phone_secondary && (
                    <a
                      href={`tel:+66${businessInfo.phone_secondary}`}
                      className="block text-muted-foreground hover:text-highlight transition-colors"
                    >
                      {businessInfo.phone_secondary}
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Email */}
            {businessInfo?.email && (
              <div className="flex gap-4 items-start">
                <div className="bg-muted p-3 rounded-lg">
                  <Mail className="w-6 h-6 text-highlight" />
                </div>
                <div>
                  <h3 className="font-semibold text-xl mb-2 text-foreground">
                    {t.email}
                  </h3>
                  <a
                    href={`mailto:${businessInfo.email}`}
                    className="text-muted-foreground hover:text-highlight transition-colors"
                  >
                    {businessInfo.email}
                  </a>
                </div>
              </div>
            )}

            {/* LINE ID */}
            {businessInfo?.line_id && (
              <div className="flex gap-4 items-start">
                <div className="bg-muted p-3 rounded-lg">
                  <MessageCircle className="w-6 h-6 text-highlight" />
                </div>
                <div>
                  <h3 className="font-semibold text-xl mb-2 text-foreground">
                    LINE ID
                  </h3>
                  <p className="text-muted-foreground">{businessInfo.line_id}</p>
                </div>
              </div>
            )}

            {/* Opening Hours */}
            {businessInfo && (businessInfo.opening_hours_th || businessInfo.opening_hours_en) && (
              <div className="flex gap-4 items-start">
                <div className="bg-muted p-3 rounded-lg">
                  <Clock className="w-6 h-6 text-highlight" />
                </div>
                <div>
                  <h3 className="font-semibold text-xl mb-2 text-foreground">
                    {t.openingHours}
                  </h3>
                  <p className="text-muted-foreground">
                    {language === 'th' ? businessInfo.opening_hours_th : businessInfo.opening_hours_en}
                  </p>
                </div>
              </div>
            )}

            {/* Social Media */}
            {(businessInfo?.instagram || businessInfo?.facebook) && (
              <div>
                <h3 className="font-semibold text-xl mb-4 text-foreground">
                  {t.followUs}
                </h3>
                <div className="flex gap-4">
                  {businessInfo.instagram && (
                    <a
                      href={`https://www.instagram.com/${businessInfo.instagram.replace('@', '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-muted hover:bg-highlight/20 p-3 rounded-lg transition-colors"
                      aria-label="Instagram"
                    >
                      <Instagram className="w-6 h-6 text-foreground" />
                    </a>
                  )}
                  {businessInfo.facebook && (
                    <a
                      href={businessInfo.facebook.startsWith('http') 
                        ? businessInfo.facebook 
                        : `https://www.facebook.com/${businessInfo.facebook}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-muted hover:bg-highlight/20 p-3 rounded-lg transition-colors"
                      aria-label="Facebook"
                    >
                      <Facebook className="w-6 h-6 text-foreground" />
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right side - Contact Form */}
          <Card className="p-8 animate-fade-in bg-card/50">
            <h3 className="text-2xl font-bold mb-6 text-foreground">
              {t.sendMessageForm}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium mb-2 text-foreground"
                >
                  {t.nameLabel}
                </label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder={t.namePlaceholder}
                  className={errors.name ? "border-destructive" : ""}
                />
                {errors.name && (
                  <p className="text-sm text-destructive mt-1">{errors.name}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium mb-2 text-foreground"
                >
                  {t.emailLabel}
                </label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder={t.emailPlaceholder}
                  className={errors.email ? "border-destructive" : ""}
                />
                {errors.email && (
                  <p className="text-sm text-destructive mt-1">{errors.email}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="phone"
                  className="block text-sm font-medium mb-2 text-foreground"
                >
                  {t.phoneLabel}
                </label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder={t.phonePlaceholder}
                  className={errors.phone ? "border-destructive" : ""}
                />
                {errors.phone && (
                  <p className="text-sm text-destructive mt-1">{errors.phone}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="topic"
                  className="block text-sm font-medium mb-2 text-foreground"
                >
                  {t.topicLabel}
                </label>
                <Input
                  id="topic"
                  name="topic"
                  type="text"
                  value={formData.topic}
                  onChange={handleChange}
                  placeholder={t.topicPlaceholder}
                  className={errors.topic ? "border-destructive" : ""}
                />
                {errors.topic && (
                  <p className="text-sm text-destructive mt-1">{errors.topic}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="message"
                  className="block text-sm font-medium mb-2 text-foreground"
                >
                  {t.messageLabel}
                </label>
                <Textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder={t.messagePlaceholder}
                  rows={4}
                  className={errors.message ? "border-destructive" : ""}
                />
                {errors.message && (
                  <p className="text-sm text-destructive mt-1">
                    {errors.message}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                variant="highlight"
                size="lg"
                className="w-full"
              >
                <Send className="mr-2 h-5 w-5" />
                {t.sendMessage}
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
