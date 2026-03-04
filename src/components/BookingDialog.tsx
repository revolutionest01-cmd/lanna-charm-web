import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { useRooms } from "@/hooks/useContentData";
import sweetAlert from "@/lib/sweetAlert";
import { supabase } from "@/integrations/supabase/client";
import { useModalState } from "@/contexts/ModalContext";
import { useFeatureToggle, showFeatureDisabledAlert } from "@/hooks/useFeatureToggle";
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

interface RoomAvailabilityState {
  [roomId: string]: boolean;
}

const BookingDialog = ({ children, roomId }: BookingDialogProps) => {
  const { language } = useLanguage();
  const t = translations[language];
  const { setIsModalOpen } = useModalState();
  const { data: rooms = [] } = useRooms();
  const { isFeatureEnabled } = useFeatureToggle();
  
  const [checkIn, setCheckIn] = useState<Date>();
  const [checkOut, setCheckOut] = useState<Date>();
  const [selectedRoom, setSelectedRoom] = useState<string>(roomId || "");
  const [guests, setGuests] = useState("2");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [additionalDetails, setAdditionalDetails] = useState("");
  const [open, setOpen] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [liveRoomAvailability, setLiveRoomAvailability] = useState<RoomAvailabilityState>({});

  const getAvailabilityDateRange = (checkInDate: Date, checkOutDate: Date) => {
    const start = format(checkInDate, "yyyy-MM-dd");
    const end = format(new Date(checkOutDate.getTime() - 24 * 60 * 60 * 1000), "yyyy-MM-dd");
    return { start, end };
  };

  const checkRoomAvailability = async (roomIdToCheck: string, checkInDate: Date, checkOutDate: Date) => {
    const { start, end } = getAvailabilityDateRange(checkInDate, checkOutDate);

    const { data: roomData, error: roomError } = await supabase
      .from("rooms")
      .select("id, is_available")
      .eq("id", roomIdToCheck)
      .maybeSingle();

    if (roomError) {
      throw roomError;
    }

    if (!roomData || roomData.is_available === false) {
      return {
        available: false,
        blockedDates: [] as string[],
      };
    }

    const { data: blockedDates, error: availabilityError } = await supabase
      .from("room_availability")
      .select("availability_date")
      .eq("room_id", roomIdToCheck)
      .eq("is_available", false)
      .gte("availability_date", start)
      .lte("availability_date", end)
      .order("availability_date", { ascending: true });

    if (availabilityError) {
      throw availabilityError;
    }

    return {
      available: !blockedDates || blockedDates.length === 0,
      blockedDates: (blockedDates || []).map((item: { availability_date: string }) => item.availability_date),
    };
  };

  const fetchLiveRoomAvailability = useCallback(async () => {
    const activeRooms = rooms.filter((room) => room.is_active);
    if (activeRooms.length === 0) {
      setLiveRoomAvailability({});
      return;
    }

    const roomIds = activeRooms.map((room) => room.id);
    const baseStatus: RoomAvailabilityState = {};
    activeRooms.forEach((room) => {
      baseStatus[room.id] = true;
    });

    let startDate = format(new Date(), "yyyy-MM-dd");
    let endDate = startDate;

    if (checkIn && checkOut) {
      const range = getAvailabilityDateRange(checkIn, checkOut);
      startDate = range.start;
      endDate = range.end;
    } else if (checkIn) {
      startDate = format(checkIn, "yyyy-MM-dd");
      endDate = startDate;
    }

    try {
      const { data, error } = await supabase
        .from("room_availability")
        .select("room_id, is_available")
        .in("room_id", roomIds)
        .eq("is_available", false)
        .gte("availability_date", startDate)
        .lte("availability_date", endDate);

      if (error) throw error;

      const nextStatus: RoomAvailabilityState = { ...baseStatus };
      (data || []).forEach((record: { room_id: string; is_available: boolean }) => {
        if (record.is_available === false) {
          nextStatus[record.room_id] = false;
        }
      });

      setLiveRoomAvailability(nextStatus);

      if (selectedRoom && nextStatus[selectedRoom] === false) {
        setSelectedRoom("");
      }
    } catch (error) {
      console.error("Failed to refresh live room availability:", error);
      setLiveRoomAvailability(baseStatus);
    }
  }, [rooms, checkIn, checkOut, selectedRoom]);

  // Update selectedRoom when roomId prop changes
  useEffect(() => {
    if (roomId) {
      console.log('BookingDialog: roomId prop changed to:', roomId);
      setSelectedRoom(roomId);
    }
  }, [roomId]);

  useEffect(() => {
    if (!open) return;

    void fetchLiveRoomAvailability();

    const channel = supabase
      .channel("booking-dialog-room-availability")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "room_availability" },
        () => {
          void fetchLiveRoomAvailability();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "rooms" },
        () => {
          void fetchLiveRoomAvailability();
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [open, fetchLiveRoomAvailability]);

  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen && !isFeatureEnabled("booking")) {
      showFeatureDisabledAlert(language);
      return;
    }
    setOpen(newOpen);
    setIsModalOpen(newOpen);
    
    // Prevent body scroll when modal is open on mobile
    if (newOpen) {
      if (roomId) {
        setSelectedRoom(roomId);
      }
      document.body.style.overflow = "hidden";
      document.body.style.position = "fixed";
      document.body.style.width = "100%";
    } else {
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.width = "";
      // Reset form when closing
      setCheckIn(undefined);
      setCheckOut(undefined);
      setSelectedRoom(roomId || "");
      setGuests("2");
      setName("");
      setEmail("");
      setPhone("");
      setAdditionalDetails("");
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

    if (!selectedRoom) {
      sweetAlert.error(
        language === 'th'
          ? 'กรุณาเลือกประเภทห้องพัก'
          : language === 'zh'
          ? '请选择房型'
          : 'Please select a room type'
      );
      return;
    }

    try {
      const availabilityCheck = await checkRoomAvailability(selectedRoom, checkIn!, checkOut!);

      if (!availabilityCheck.available) {
        const blockedPreview = availabilityCheck.blockedDates.slice(0, 3).join(', ');
        const hasMore = availabilityCheck.blockedDates.length > 3;

        sweetAlert.error(
          language === 'th'
            ? availabilityCheck.blockedDates.length > 0
              ? `ห้องไม่ว่างในช่วงวันที่เลือก (${blockedPreview}${hasMore ? ' ...' : ''})`
              : 'ห้องนี้ไม่พร้อมให้จองในขณะนี้'
            : language === 'zh'
            ? availabilityCheck.blockedDates.length > 0
              ? `该房间在所选日期不可用 (${blockedPreview}${hasMore ? ' ...' : ''})`
              : '该房间当前不可预订'
            : availabilityCheck.blockedDates.length > 0
            ? `Room is unavailable for selected dates (${blockedPreview}${hasMore ? ' ...' : ''})`
            : 'This room is currently unavailable'
        );
        return;
      }
    } catch (availabilityError) {
      console.error('Availability check error:', availabilityError);
      sweetAlert.error(
        language === 'th'
          ? 'ไม่สามารถตรวจสอบห้องว่างได้ กรุณาลองอีกครั้ง'
          : language === 'zh'
          ? '无法检查房间可用性，请重试'
          : 'Failed to check room availability. Please try again.'
      );
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
          additionalDetails,
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
      setAdditionalDetails("");
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
    isAvailable: liveRoomAvailability[room.id] ?? true,
  }));

  const bookingForm = (
    <form onSubmit={handleSubmit} className="space-y-2 sm:space-y-3">
      {/* Date pickers */}
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-0.5">
          <Label htmlFor="checkIn" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {language === 'th' ? 'เช็คอิน' : language === 'zh' ? '入住' : 'Check-in'}
          </Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal h-10 sm:h-11 rounded-xl border-border text-foreground font-semibold bg-white border-2 text-sm",
                  !checkIn && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-[hsl(var(--highlight))]" />
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

        <div className="space-y-0.5">
          <Label htmlFor="checkOut" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {language === 'th' ? 'เช็คเอาท์' : language === 'zh' ? '退房' : 'Check-out'}
          </Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal h-10 sm:h-11 rounded-xl border-border text-foreground font-semibold bg-white border-2 text-sm",
                  !checkOut && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-[hsl(var(--highlight))]" />
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
      <div className="space-y-0.5">
        <Label htmlFor="room" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {language === 'th' ? 'ประเภทห้องพัก' : language === 'zh' ? '房间类型' : 'Room Type'}
        </Label>
        <Select value={selectedRoom} onValueChange={setSelectedRoom}>
          <SelectTrigger className="h-10 sm:h-11 rounded-xl border-2 bg-white text-foreground font-semibold text-sm">
            <div className="flex items-center gap-2">
              <Bed className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
              <SelectValue 
                placeholder={language === 'th' ? 'เลือกประเภทห้องพัก' : language === 'zh' ? '选择房间类型' : 'Select room type'} 
              />
            </div>
          </SelectTrigger>
          <SelectContent>
            {roomTypes.map((room) => (
              <SelectItem key={room.id} value={room.id} disabled={!room.isAvailable}>
                {room.name}{!room.isAvailable ? ` (${language === 'th' ? 'ไม่ว่าง' : language === 'zh' ? '不可用' : 'Unavailable'})` : ''}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Guests */}
      <div className="space-y-0.5">
        <Label htmlFor="guests" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {language === 'th' ? 'จำนวนผู้เข้าพัก' : language === 'zh' ? '人数' : 'Guests'}
        </Label>
        <div className="relative">
          <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
          <Input
            id="guests"
            type="text"
            inputMode="numeric"
            placeholder="2"
            value={guests}
            onChange={handleGuestsChange}
            maxLength={2}
            className={cn("pl-10 h-10 sm:h-11 rounded-xl text-sm placeholder:text-muted-foreground/50", errors.guests && "border-destructive focus-visible:ring-destructive")}
            style={{ fontSize: "16px" }}
          />
        </div>
        {errors.guests && (
          <div className="flex items-center gap-1.5 text-xs text-destructive">
            <AlertCircle className="h-3 w-3" />
            <span>{errors.guests}</span>
          </div>
        )}
      </div>

      {/* Name */}
      <div className="space-y-0.5">
        <Label htmlFor="name" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {language === 'th' ? 'ชื่อ-นามสกุล' : language === 'zh' ? '姓名' : 'Full Name'}
        </Label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
          <Input
            id="name"
            type="text"
            placeholder={language === 'th' ? 'กรอกชื่อของคุณ' : language === 'zh' ? '请输入您的姓名' : 'Enter your name'}
            value={name}
            onChange={handleNameChange}
            className={cn("pl-10 h-10 sm:h-11 rounded-xl text-sm placeholder:text-muted-foreground/50", errors.name && "border-destructive focus-visible:ring-destructive")}
            style={{ fontSize: "16px" }}
          />
        </div>
        {errors.name && (
          <div className="flex items-center gap-1.5 text-xs text-destructive">
            <AlertCircle className="h-3 w-3" />
            <span>{errors.name}</span>
          </div>
        )}
      </div>

      {/* Email */}
      <div className="space-y-0.5">
        <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {language === 'th' ? 'อีเมล' : language === 'zh' ? '电子邮件' : 'Email'}
        </Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
          <Input
            id="email"
            type="text"
            placeholder="example@email.com"
            value={email}
            onChange={handleEmailChange}
            className={cn("pl-10 h-10 sm:h-11 rounded-xl text-sm placeholder:text-muted-foreground/50", errors.email && "border-destructive focus-visible:ring-destructive")}
            style={{ fontSize: "16px" }}
          />
        </div>
        {errors.email && (
          <div className="flex items-center gap-1.5 text-xs text-destructive">
            <AlertCircle className="h-3 w-3" />
            <span>{errors.email}</span>
          </div>
        )}
      </div>

      {/* Phone */}
      <div className="space-y-0.5">
        <Label htmlFor="phone" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {language === 'th' ? 'เบอร์โทรศัพท์' : language === 'zh' ? '电话号码' : 'Phone'}
        </Label>
        <div className="relative">
          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
          <Input
            id="phone"
            type="text"
            placeholder="0812345678"
            value={phone}
            onChange={handlePhoneChange}
            maxLength={10}
            className={cn("pl-10 h-10 sm:h-11 rounded-xl text-sm placeholder:text-muted-foreground/50", errors.phone && "border-destructive focus-visible:ring-destructive")}
            style={{ fontSize: "16px" }}
          />
        </div>
        {errors.phone && (
          <div className="flex items-center gap-1.5 text-xs text-destructive">
            <AlertCircle className="h-3 w-3" />
            <span>{errors.phone}</span>
          </div>
        )}
      </div>

      {/* Additional Details */}
      <div className="space-y-0.5">
        <Label htmlFor="additionalDetails" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {language === 'th' ? 'คำอธิบาย / เพิ่มเติม' : language === 'zh' ? '附加说明' : 'Additional Details'}
        </Label>
        <Textarea
          id="additionalDetails"
          placeholder={
            language === 'th'
              ? 'แจ้งรายละเอียดเพิ่มเติม เช่น ขอเตียงเสริม, เวลาเช็คอินโดยประมาณ, หรือข้อมูลสำคัญอื่นๆ'
              : language === 'zh'
              ? '可填写补充信息，例如加床需求、预计入住时间或其他重要说明'
              : 'Add any important notes such as extra bed request, expected check-in time, or special requirements'
          }
          value={additionalDetails}
          onChange={(e) => setAdditionalDetails(e.target.value.slice(0, 500))}
          className="min-h-[84px] rounded-xl text-sm bg-white placeholder:text-muted-foreground/50"
          style={{ fontSize: "16px" }}
        />
      </div>

      {/* Submit */}
      <Button type="submit" className="w-full h-10 sm:h-12 rounded-xl text-sm sm:text-base font-bold tracking-wide bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all" size="lg">
        <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1" />
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

  // Dialog: Centered on all devices (Mobile, Tablet, Desktop)
  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="w-[95vw] sm:w-[90vw] md:w-[85vw] lg:w-[70vw] xl:w-[60vw] xl:max-w-[550px] rounded-2xl p-3 sm:p-4 md:p-6 max-h-[90vh] flex flex-col gap-0 overflow-hidden">
        <DialogHeader className="text-center mb-3 sm:mb-4 flex-shrink-0">
          <div className="text-lg sm:text-xl md:text-2xl font-bold font-serif tracking-tight text-foreground mb-1.5 sm:mb-2 leading-tight">
            {language === 'th' ? 'จองห้องพักสำหรับคุณได้ที่นี่' : language === 'zh' ? '在这里为您预订房间' : 'Book Your Room Here'}
          </div>
          <DialogTitle className="text-xs sm:text-sm font-semibold font-serif tracking-tight text-foreground leading-snug px-1">
            {language === 'th'
              ? 'กรอกข้อมูลเพื่อจองห้องพักที่ Plern Ping'
              : language === 'zh'
              ? '填写详细信息以预订房间'
              : 'Fill in details to book your room'}
          </DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto scroll-smooth pb-4 [&::-webkit-scrollbar]:hidden sm:[&::-webkit-scrollbar]:w-2 sm:[&::-webkit-scrollbar-track]:bg-transparent sm:[&::-webkit-scrollbar-thumb]:bg-primary/30 sm:[&::-webkit-scrollbar-thumb]:rounded-full sm:[&::-webkit-scrollbar-thumb]:hover:bg-primary/60 px-0.5">
          {bookingForm}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BookingDialog;
