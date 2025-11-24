import { useLanguage, translations } from "@/hooks/useLanguage";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Phone, Mail, MapPin, Clock, MessageCircle, Send } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

const ContactSection = () => {
  const { language } = useLanguage();
  const t = translations[language];

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    topic: "",
    message: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

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

      // Show success toast
      toast.success(t.messageSent, {
        description: t.messageSuccess,
      });

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
            <div className="flex gap-4 items-start">
              <div className="bg-muted p-3 rounded-lg">
                <MapPin className="w-6 h-6 text-highlight" />
              </div>
              <div>
                <h3 className="font-semibold text-xl mb-2 text-foreground">
                  {t.address}
                </h3>
                <p className="text-muted-foreground">
                  54 ซ.เทพราชสันติ์ 7 ถ.เทพราชสันติ์ ซ.สักกิ้ม ตอนเหนือ กรุงเทพฯ 10210
                </p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="bg-muted p-3 rounded-lg">
                <Phone className="w-6 h-6 text-highlight" />
              </div>
              <div>
                <h3 className="font-semibold text-xl mb-2 text-foreground">
                  {t.phone}
                </h3>
                <a
                  href="tel:+66818469098"
                  className="block text-muted-foreground hover:text-highlight transition-colors"
                >
                  (66) 0818469098
                </a>
                <a
                  href="tel:+66817100611"
                  className="block text-muted-foreground hover:text-highlight transition-colors"
                >
                  (66) 0817100611
                </a>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="bg-muted p-3 rounded-lg">
                <Mail className="w-6 h-6 text-highlight" />
              </div>
              <div>
                <h3 className="font-semibold text-xl mb-2 text-foreground">
                  {t.email}
                </h3>
                <a
                  href="mailto:plernping5445@gmail.com"
                  className="text-muted-foreground hover:text-highlight transition-colors"
                >
                  plernping5445@gmail.com
                </a>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="bg-muted p-3 rounded-lg">
                <MessageCircle className="w-6 h-6 text-highlight" />
              </div>
              <div>
                <h3 className="font-semibold text-xl mb-2 text-foreground">
                  Line ID
                </h3>
                <p className="text-muted-foreground">0818469098</p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="bg-muted p-3 rounded-lg">
                <Clock className="w-6 h-6 text-highlight" />
              </div>
              <div>
                <h3 className="font-semibold text-xl mb-2 text-foreground">
                  {t.openingHours}
                </h3>
                <p className="text-muted-foreground">{t.dailyOpen}</p>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-xl mb-4 text-foreground">
                {t.followUs}
              </h3>
              <div className="flex gap-4">
                <a
                  href="https://www.facebook.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-muted hover:bg-highlight/20 p-3 rounded-lg transition-colors"
                >
                  <svg
                    className="w-6 h-6 text-foreground"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                </a>
                <a
                  href="https://www.instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-muted hover:bg-highlight/20 p-3 rounded-lg transition-colors"
                >
                  <svg
                    className="w-6 h-6 text-foreground"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                  </svg>
                </a>
              </div>
            </div>
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
