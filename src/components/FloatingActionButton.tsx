import { Phone, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import BookingDialog from "./BookingDialog";
import { useLanguage } from "@/hooks/useLanguage";
import { t4 } from "@/lib/i18n";

const FloatingActionButton = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { language } = useLanguage();

  return (
    <div className="fixed bottom-20 sm:bottom-24 right-4 sm:right-8 z-40 flex flex-col gap-2 sm:gap-3 items-end">
      {isExpanded && (
        <div className="flex flex-col gap-2 animate-fade-in">
          <Button
            size="lg"
            className="rounded-full shadow-lg hover:shadow-xl transition-all gap-2 h-11 sm:h-10 px-4 sm:px-6 bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={() => window.open('tel:+66812345678')}
          >
            <Phone size={18} />
            <span className="hidden sm:inline">{t4(language, 'โทรเลย', 'Call Now', '立即拨打', '今すぐ電話')}</span>
          </Button>

          <BookingDialog>
            <Button
              size="lg"
              className="rounded-full shadow-lg hover:shadow-xl transition-all gap-2 h-11 sm:h-10 px-4 sm:px-6 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <MessageCircle size={18} />
              <span className="hidden sm:inline">{t4(language, 'จองเลย', 'Book Now', '立即预订', '今すぐ予約')}</span>
            </Button>
          </BookingDialog>
        </div>
      )}

      <Button
        size="icon"
        onClick={() => setIsExpanded(!isExpanded)}
        className="h-12 w-12 sm:h-14 sm:w-14 rounded-full shadow-lg hover:shadow-xl transition-all bg-primary text-primary-foreground hover:bg-primary/90"
      >
        <MessageCircle size={22} className={isExpanded ? "rotate-90 transition-transform" : "transition-transform"} />
      </Button>
    </div>
  );
};

export default FloatingActionButton;
