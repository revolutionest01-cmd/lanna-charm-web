import { useState, useEffect } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CalendarIcon, Users, User, Mail, Phone, Sparkles, AlertCircle, Bed } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useLanguage, translations } from "@/hooks/useLanguage";
import { useIsMobile } from "@/hooks/use-mobile";
import { useRooms } from "@/hooks/useContentData";
import sweetAlert from "@/lib/sweetAlert";
import { supabase } from "@/integrations/supabase/client";
import { useModalState } from "@/contexts/ModalContext";
import {
  sanitizeGuests,
  sanitizeName,
  sanitizePhone,
  validateBookingForm,
  getErrorMessage,
} from "@/lib/bookingValidation";

interface BookingDialogProps {
  children: React.ReactNode;
  roomId?: string;
}

const BookingDialog = ({ children, roomId }: BookingDialogProps) => {
  const { language } = useLanguage();
  const t = translations[language];
  const isMobile = useIsMobile();
  const { setIsModalOpen } = useModalState();
  const { data: rooms = [] } = useRooms();
  
  const [checkIn, setCheckIn] = useState<Date>();
  const [checkOut, setCheckOut] = useState<Date>();
  const [selectedRoom, setSelectedRoom] = useState<string>(roomId || "");
  const [guests, setGuests] = useState("2");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [open, setOpen] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Update selectedRoom when roomId prop changes
  useEffect(() => {
    if (roomId) {
      console.log('BookingDialog: roomId prop changed to:', roomId);
      setSelectedRoom(roomId);
    }
  }, [roomId]);

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    setIsModalOpen(newOpen);
    if (!newOpen) {
      // Reset form when closing
      setCheckIn(undefined);
      setCheckOut(undefined);
      setSelectedRoom("");
      setGuests("2");
      setName("");
      setEmail("");
      setPhone("");
      setErrors({});
    }
  };

  // Input handlers with sanitization
  const handleGuestsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const sanitized = sanitizeGuests(e.target.value);
    setGuests(sanitized);
    if (errors.guests) {
      const newErrors = { ...errors };
      delete newErrors.guests;
      setErrors(newErrors);
    }
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const sanitized = sanitizeName(e.target.value);
    setName(sanitized);
    if (errors.name) {
      const newErrors = { ...errors };
      delete newErrors.name;
      setErrors(newErrors);
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    if (errors.email) {
      const newErrors = { ...errors };
      delete newErrors.email;
      setErrors(newErrors);
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const sanitized = sanitizePhone(e.target.value);
    setPhone(sanitized);
    if (errors.phone) {
      const newErrors = { ...errors };
      delete newErrors.phone;
      setErrors(newErrors);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    const validation = validateBookingForm(
      checkIn,
      checkOut,
      guests,
      name,
      email,
      phone
    );

    if (!validation.valid && validation.error) {
      const errorMessage = getErrorMessage(validation.error, language as 'th' | 'en' | 'zh');
      sweetAlert.error(errorMessage);
      return;
    }

    const confirmed = await sweetAlert.modal.confirm(
      language === 'th' ? 'ยืนยันการจอง' : language === 'zh' ? '确认预订' : 'Confirm Booking',
      language === 'th' 
        ? `<div style="text-align: left; line-height: 1.8;">
            <div style="margin-bottom: 8px;"><strong>วันเช็คอิน:</strong> ${format(checkIn, "PPPP")}</div>
            <div style="margin-bottom: 8px;"><strong>วันเช็คเอาท์:</strong> ${format(checkOut, "PPPP")}</div>
            <div style="margin-bottom: 8px;"><strong>จำนวนผู้เข้าพัก:</strong> ${guests} คน</div>
            <hr style="margin: 12px 0; border: none; border-top: 1px solid #ccc;">
            <div style="font-size: 0.9em; color: #666;">คุณต้องการยืนยันการจองห้องพักใช่หรือไม่?</div>
          </div>`
        : language === 'zh'
        ? `<div style="text-align: left; line-height: 1.8;">
            <div style="margin-bottom: 8px;"><strong>入住:</strong> ${format(checkIn, "PPPP")}</div>
            <div style="margin-bottom: 8px;"><strong>退房:</strong> ${format(checkOut, "PPPP")}</div>
            <div style="margin-bottom: 8px;"><strong>人数:</strong> ${guests}</div>
            <hr style="margin: 12px 0; border: none; border-top: 1px solid #ccc;">
            <div style="font-size: 0.9em; color: #666;">您确定要预订吗？</div>
          </div>`
        : `<div style="text-align: left; line-height: 1.8;">
            <div style="margin-bottom: 8px;"><strong>Check-in:</strong> ${format(checkIn, "PPPP")}</div>
            <div style="margin-bottom: 8px;"><strong>Check-out:</strong> ${format(checkOut, "PPPP")}</div>
            <div style="margin-bottom: 8px;"><strong>Guests:</strong> ${guests}</div>
            <hr style="margin: 12px 0; border: none; border-top: 1px solid #ccc;">
            <div style="font-size: 0.9em; color: #666;">Do you want to confirm your booking?</div>
          </div>`,
      language === 'th' ? 'ยืนยัน' : language === 'zh' ? '确认' : 'Confirm',
      language === 'th' ? 'ยกเลิก' : language === 'zh' ? '取消' : 'Cancel',
      true // useHtml = true
    );

    if (!confirmed) return;

    try {
      console.log('Submitting booking with roomId:', selectedRoom);
      
      const { data, error } = await supabase.functions.invoke('booking', {
        body: {
          name,
          email,
          phone,
          roomId: selectedRoom || null,
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
      
      setCheckIn(undefined);
      setCheckOut(undefined);
      setSelectedRoom("");
      setGuests("2");
      setName("");
      setEmail("");
      setPhone("");
      setErrors({});
    } catch (error) {
      console.error('Booking submission error:', error);
      sweetAlert.error(language === 'th' ? 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง' : language === 'zh' ? '发生错误，请重试' : 'An error occurred. Please try again.');
    }
  };

  // Dynamic room types from admin rooms management
  // Display room names in English, with Thai names as fallback
  const roomTypes = rooms.filter(room => room.is_active).map(room => ({
    id: room.id,
    name: language === 'th' ? room.name_th : room.name_en,
    name_th: room.name_th,
    name_en: room.name_en,
  }));

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
                  "w-full justify-start text-left font-normal h-11 rounded-xl border-border text-foreground font-semibold bg-white border-2",
                  !checkIn && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4 text-[hsl(var(--highlight))]" />
                {checkIn ? format(checkIn, "dd MMM") : <span className="text-xs">{language === 'th' ? 'เลือกวัน' : language === 'zh' ? '选择日期' : 'Pick date'}</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 z-[60] bg-foreground text-background" align="start">
              <Calendar 
                mode="single" 
                selected={checkIn} 
                onSelect={setCheckIn} 
                initialFocus
                disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                className="[&_.rdp-head_cell]:text-background [&_.rdp-cell]:text-background [&_.rdp-button]:text-background hover:[&_.rdp-button]:text-background [&_.rdp-button_selected]:bg-background [&_.rdp-button_selected]:text-foreground [&_.rdp-button_today]:text-background"
              />
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
                  "w-full justify-start text-left font-normal h-11 rounded-xl border-border text-foreground font-semibold bg-white border-2",
                  !checkOut && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4 text-[hsl(var(--highlight))]" />
                {checkOut ? format(checkOut, "dd MMM") : <span className="text-xs">{language === 'th' ? 'เลือกวัน' : language === 'zh' ? '选择日期' : 'Pick date'}</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 z-[60] bg-foreground text-background" align="start">
              <Calendar 
                mode="single" 
                selected={checkOut} 
                onSelect={setCheckOut} 
                initialFocus
                disabled={(date) => !checkIn || date <= checkIn}
                className="[&_.rdp-head_cell]:text-background [&_.rdp-cell]:text-background [&_.rdp-button]:text-background hover:[&_.rdp-button]:text-background [&_.rdp-button_selected]:bg-background [&_.rdp-button_selected]:text-foreground [&_.rdp-button_today]:text-background"
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Room Type Selection */}
      <div className="space-y-1.5">
        <Label htmlFor="room" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {language === 'th' ? 'ประเภทห้องพัก' : language === 'zh' ? '房间类型' : 'Room Type'}
        </Label>
        <Select value={selectedRoom} onValueChange={setSelectedRoom}>
          <SelectTrigger className="h-11 rounded-xl border-2 bg-white text-foreground font-semibold">
            <div className="flex items-center gap-2">
              <Bed className="h-4 w-4 text-muted-foreground" />
              <SelectValue 
                placeholder={language === 'th' ? 'เลือกประเภทห้องพัก' : language === 'zh' ? '选择房间类型' : 'Select room type'} 
              />
            </div>
          </SelectTrigger>
          <SelectContent>
            {roomTypes.map((room) => (
              <SelectItem key={room.id} value={room.id}>
                {room.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
            type="text"
            placeholder="2"
            value={guests}
            onChange={handleGuestsChange}
            maxLength={2}
            className={cn("pl-10 h-11 rounded-xl", errors.guests && "border-destructive focus-visible:ring-destructive")}
          />
        </div>
        {errors.guests && (
          <div className="flex items-center gap-1.5 text-xs text-destructive">
            <AlertCircle className="h-3.5 w-3.5" />
            <span>{errors.guests}</span>
          </div>
        )}
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
            type="text"
            placeholder={language === 'th' ? 'กรอกชื่อของคุณ' : language === 'zh' ? '请输入您的姓名' : 'Enter your name'}
            value={name}
            onChange={handleNameChange}
            className={cn("pl-10 h-11 rounded-xl", errors.name && "border-destructive focus-visible:ring-destructive")}
          />
        </div>
        {errors.name && (
          <div className="flex items-center gap-1.5 text-xs text-destructive">
            <AlertCircle className="h-3.5 w-3.5" />
            <span>{errors.name}</span>
          </div>
        )}
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
            type="text"
            placeholder="example@email.com"
            value={email}
            onChange={handleEmailChange}
            className={cn("pl-10 h-11 rounded-xl", errors.email && "border-destructive focus-visible:ring-destructive")}
          />
        </div>
        {errors.email && (
          <div className="flex items-center gap-1.5 text-xs text-destructive">
            <AlertCircle className="h-3.5 w-3.5" />
            <span>{errors.email}</span>
          </div>
        )}
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
            type="text"
            placeholder="0812345678"
            value={phone}
            onChange={handlePhoneChange}
            maxLength={10}
            className={cn("pl-10 h-11 rounded-xl", errors.phone && "border-destructive focus-visible:ring-destructive")}
          />
        </div>
        {errors.phone && (
          <div className="flex items-center gap-1.5 text-xs text-destructive">
            <AlertCircle className="h-3.5 w-3.5" />
            <span>{errors.phone}</span>
          </div>
        )}
      </div>

      {/* Submit */}
      <Button type="submit" className="w-full h-12 rounded-xl text-base font-bold tracking-wide bg-[#c65539] text-white hover:bg-[#c65539]/90 shadow-lg hover:shadow-xl transition-all" size="lg">
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
      <Drawer open={open} onOpenChange={handleOpenChange}>
        <DrawerTrigger asChild>
          {children}
        </DrawerTrigger>
        <DrawerContent className="max-h-[92dvh]">
          <DrawerHeader className="text-center pb-4 px-3">
            <div className="text-xl sm:text-2xl font-bold font-serif tracking-tight text-foreground mb-2">
              {language === 'th' ? 'จองห้องพักสำหรับคุณได้ที่นี่' : language === 'zh' ? '在这里为您预订房间' : 'Book Your Room Here'}
            </div>
            <DrawerTitle className="text-sm sm:text-base font-semibold font-serif tracking-tight text-foreground/70 leading-relaxed">
              {language === 'th' ? 'กรอกข้อมูลเพื่อจองห้องพักที่ Plern Ping' : language === 'zh' ? '填写详细信息以预订房间' : 'Fill in the details to book your room'}
            </DrawerTitle>
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
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] rounded-2xl p-6 md:p-8">
        <DialogHeader className="text-center mb-1">
          <div className="text-2xl md:text-3xl font-bold font-serif tracking-tight text-foreground mb-3 leading-tight">
            {language === 'th' ? 'จองห้องพักสำหรับคุณได้ที่นี่' : language === 'zh' ? '在这里为您预订房间' : 'Book Your Room Here'}
          </div>
          <DialogTitle className="text-sm md:text-base font-semibold font-serif tracking-tight text-foreground/70 leading-relaxed px-2">
            {language === 'th'
              ? 'กรอกข้อมูลเพื่อจองห้องพักที่ Plern Ping'
              : language === 'zh'
              ? '填写详细信息以预订房间'
              : 'Fill in the details to book your room'}
          </DialogTitle>
        </DialogHeader>
        <div className="mt-2">
          {bookingForm}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BookingDialog;
