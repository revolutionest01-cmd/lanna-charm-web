import { useState } from "react";
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
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Users } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useLanguage, translations } from "@/hooks/useLanguage";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface BookingDialogProps {
  children: React.ReactNode;
}

const BookingDialog = ({ children }: BookingDialogProps) => {
  const { language } = useLanguage();
  const t = translations[language];
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
      toast.error(language === 'th' ? 'กรุณากรอกข้อมูลให้ครบถ้วน' : 'Please fill in all fields');
      return;
    }

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

      toast.success(
        language === 'th' 
          ? `ขอบคุณคุณ${name}! เราได้รับการจองของคุณแล้ว` 
          : `Thank you ${name}! We've received your booking.`
      );
      
      setOpen(false);
      // Reset form
      setCheckIn(undefined);
      setCheckOut(undefined);
      setGuests("2");
      setName("");
      setEmail("");
      setPhone("");
    } catch (error) {
      console.error('Booking submission error:', error);
      toast.error(language === 'th' ? 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง' : 'An error occurred. Please try again.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            {language === 'th' ? 'จองที่พักของคุณ' : 'Book Your Stay'}
          </DialogTitle>
          <DialogDescription>
            {language === 'th' 
              ? 'กรอกข้อมูลเพื่อจองห้องพักที่ Plern Ping Cafe & Resort' 
              : 'Fill in the details to reserve your room at Plern Ping Cafe & Resort'}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="checkIn">
                {language === 'th' ? 'วันเช็คอิน' : 'Check-in'}
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !checkIn && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {checkIn ? format(checkIn, "PPP") : <span>{language === 'th' ? 'เลือกวัน' : 'Pick a date'}</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={checkIn}
                    onSelect={setCheckIn}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="checkOut">
                {language === 'th' ? 'วันเช็คเอาท์' : 'Check-out'}
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !checkOut && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {checkOut ? format(checkOut, "PPP") : <span>{language === 'th' ? 'เลือกวัน' : 'Pick a date'}</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={checkOut}
                    onSelect={setCheckOut}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="guests">
              {language === 'th' ? 'จำนวนผู้เข้าพัก' : 'Number of Guests'}
            </Label>
            <div className="relative">
              <Users className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="guests"
                type="number"
                min="1"
                max="10"
                value={guests}
                onChange={(e) => setGuests(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">
              {language === 'th' ? 'ชื่อ-นามสกุล' : 'Full Name'}
            </Label>
            <Input
              id="name"
              placeholder={language === 'th' ? 'กรอกชื่อของคุณ' : 'Enter your name'}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">
              {language === 'th' ? 'อีเมล' : 'Email'}
            </Label>
            <Input
              id="email"
              type="email"
              placeholder={language === 'th' ? 'example@email.com' : 'example@email.com'}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">
              {language === 'th' ? 'เบอร์โทรศัพท์' : 'Phone Number'}
            </Label>
            <Input
              id="phone"
              type="tel"
              placeholder={language === 'th' ? '0812345678' : '0812345678'}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </div>

          <Button type="submit" variant="highlight" className="w-full" size="lg">
            {language === 'th' ? 'ยืนยันการจอง' : 'Confirm Booking'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default BookingDialog;
