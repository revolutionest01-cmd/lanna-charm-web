import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Users, User, Mail, Phone, Sparkles } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useLanguage, translations } from "@/hooks/useLanguage";
import { useIsMobile } from "@/hooks/use-mobile";
import sweetAlert from "@/lib/sweetAlert";
import { supabase } from "@/integrations/supabase/client";

interface BookingDialogProps {
  children: React.ReactNode;
}

const BookingDialog = ({ children }: BookingDialogProps) => {
  const { language } = useLanguage();
  const t = translations[language];
  const isMobile = useIsMobile();
  const [checkIn, setCheckIn] = useState<Date>();
  const [checkOut, setCheckOut] = useState<Date>();
  const [guests, setGuests] = useState("2");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [open, setOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!checkIn || !checkOut || !name || !email || !phone) {
      sweetAlert.error(language === 'th' ? 'กรุณากรอกข้อมูลให้ครบถ้วน' : language === 'zh' ? '请填写所有字段' : 'Please fill in all fields');
      return;
    }

    const confirmed = await sweetAlert.modal.confirm(
      language === 'th' ? 'ยืนยันการจอง' : language === 'zh' ? '确认预订' : 'Confirm Booking',
      language === 'th' 
        ? `คุณต้องการยืนยันการจองห้องพักใช่หรือไม่?\n\nวันเช็คอิน: ${format(checkIn, "PPP")}\nวันเช็คเอาท์: ${format(checkOut, "PPP")}\nจำนวนผู้เข้าพัก: ${guests} คน`
        : language === 'zh'
        ? `您确定要预订吗？\n\n入住: ${format(checkIn, "PPP")}\n退房: ${format(checkOut, "PPP")}\n人数: ${guests}`
        : `Do you want to confirm your booking?\n\nCheck-in: ${format(checkIn, "PPP")}\nCheck-out: ${format(checkOut, "PPP")}\nGuests: ${guests}`,
      language === 'th' ? 'ยืนยัน' : language === 'zh' ? '确认' : 'Confirm',
      language === 'th' ? 'ยกเลิก' : language === 'zh' ? '取消' : 'Cancel'
    );

    if (!confirmed) return;

    try {
      const { data, error } = await supabase.functions.invoke('booking', {
        body: {
          name,
          email,
          phone,
          checkIn: format(checkIn, "yyyy-MM-dd"),
          checkOut: format(checkOut, "yyyy-MM-dd"),
          guests: parseInt(guests),
        },
      });

      if (error) throw error;

      sweetAlert.success(
        language === 'th' 
          ? `ขอบคุณคุณ${name}! เราได้รับการจองของคุณแล้ว` 
          : language === 'zh'
          ? `谢谢${name}！我们已收到您的预订。`
          : `Thank you ${name}! We've received your booking.`
      );
      
      setOpen(false);
      setCheckIn(undefined);
      setCheckOut(undefined);
      setGuests("2");
      setName("");
      setEmail("");
      setPhone("");
    } catch (error) {
      console.error('Booking submission error:', error);
      sweetAlert.error(language === 'th' ? 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง' : language === 'zh' ? '发生错误，请重试' : 'An error occurred. Please try again.');
    }
  };

  const bookingForm = (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Date pickers */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="checkIn" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {language === 'th' ? 'เช็คอิน' : language === 'zh' ? '入住' : 'Check-in'}
          </Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal h-11 rounded-xl border-border",
                  !checkIn && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4 text-[hsl(var(--highlight))]" />
                {checkIn ? format(checkIn, "dd MMM") : <span className="text-xs">{language === 'th' ? 'เลือกวัน' : language === 'zh' ? '选择日期' : 'Pick date'}</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 z-[60]" align="start">
              <Calendar mode="single" selected={checkIn} onSelect={setCheckIn} initialFocus />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="checkOut" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {language === 'th' ? 'เช็คเอาท์' : language === 'zh' ? '退房' : 'Check-out'}
          </Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal h-11 rounded-xl border-border",
                  !checkOut && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4 text-[hsl(var(--highlight))]" />
                {checkOut ? format(checkOut, "dd MMM") : <span className="text-xs">{language === 'th' ? 'เลือกวัน' : language === 'zh' ? '选择日期' : 'Pick date'}</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 z-[60]" align="start">
              <Calendar mode="single" selected={checkOut} onSelect={setCheckOut} initialFocus />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Guests */}
      <div className="space-y-1.5">
        <Label htmlFor="guests" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {language === 'th' ? 'จำนวนผู้เข้าพัก' : language === 'zh' ? '人数' : 'Guests'}
        </Label>
        <div className="relative">
          <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="guests"
            type="number"
            min="1"
            max="10"
            value={guests}
            onChange={(e) => setGuests(e.target.value)}
            className="pl-10 h-11 rounded-xl"
          />
        </div>
      </div>

      {/* Name */}
      <div className="space-y-1.5">
        <Label htmlFor="name" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {language === 'th' ? 'ชื่อ-นามสกุล' : language === 'zh' ? '姓名' : 'Full Name'}
        </Label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="name"
            placeholder={language === 'th' ? 'กรอกชื่อของคุณ' : language === 'zh' ? '请输入您的姓名' : 'Enter your name'}
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="pl-10 h-11 rounded-xl"
          />
        </div>
      </div>

      {/* Email */}
      <div className="space-y-1.5">
        <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {language === 'th' ? 'อีเมล' : language === 'zh' ? '电子邮件' : 'Email'}
        </Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="email"
            type="email"
            placeholder="example@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="pl-10 h-11 rounded-xl"
          />
        </div>
      </div>

      {/* Phone */}
      <div className="space-y-1.5">
        <Label htmlFor="phone" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {language === 'th' ? 'เบอร์โทรศัพท์' : language === 'zh' ? '电话号码' : 'Phone'}
        </Label>
        <div className="relative">
          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="phone"
            type="tel"
            placeholder="081-234-5678"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
            className="pl-10 h-11 rounded-xl"
          />
        </div>
      </div>

      {/* Submit */}
      <Button type="submit" variant="highlight" className="w-full h-12 rounded-xl text-base font-bold tracking-wide" size="lg">
        <Sparkles className="h-4 w-4 mr-1" />
        {language === 'th' ? 'ยืนยันการจอง' : language === 'zh' ? '确认预订' : 'Confirm Booking'}
      </Button>
    </form>
  );

  const headerContent = (
    <>
      <div className="text-xl sm:text-2xl font-bold font-serif">
        {language === 'th' ? 'จองที่พักของคุณ' : language === 'zh' ? '预订您的住宿' : 'Book Your Stay'}
      </div>
      <p className="text-sm text-muted-foreground mt-1">
        {language === 'th'
          ? 'กรอกข้อมูลเพื่อจองห้องพักที่ Plern Ping'
          : language === 'zh'
          ? '填写详细信息以预订房间'
          : 'Fill in the details to reserve your room'}
      </p>
    </>
  );

  // Mobile: use Drawer (bottom sheet)
  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger asChild>
          {children}
        </DrawerTrigger>
        <DrawerContent className="max-h-[92dvh]">
          <DrawerHeader className="text-left pb-2">
            <DrawerTitle className="text-xl font-bold font-serif">
              {language === 'th' ? 'จองที่พักของคุณ' : language === 'zh' ? '预订您的住宿' : 'Book Your Stay'}
            </DrawerTitle>
            <DrawerDescription className="text-sm text-muted-foreground">
              {language === 'th'
                ? 'กรอกข้อมูลเพื่อจองห้องพักที่ Plern Ping'
                : language === 'zh'
                ? '填写详细信息以预订房间'
                : 'Fill in the details to reserve your room'}
            </DrawerDescription>
          </DrawerHeader>
          <div className="px-4 pb-6 overflow-y-auto">
            {bookingForm}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  // Desktop: use Dialog
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px] rounded-2xl p-6">
        <DialogHeader>
          <DialogTitle className="text-2xl font-serif">
            {language === 'th' ? 'จองที่พักของคุณ' : language === 'zh' ? '预订您的住宿' : 'Book Your Stay'}
          </DialogTitle>
          <DialogDescription>
            {language === 'th'
              ? 'กรอกข้อมูลเพื่อจองห้องพักที่ Plern Ping'
              : language === 'zh'
              ? '填写详细信息以预订房间'
              : 'Fill in the details to reserve your room'}
          </DialogDescription>
        </DialogHeader>
        <div className="mt-2">
          {bookingForm}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BookingDialog;
