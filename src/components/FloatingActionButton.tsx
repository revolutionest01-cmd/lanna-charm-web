import { Phone, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import BookingDialog from "./BookingDialog";
import { useLanguage, translations } from "@/hooks/useLanguage";

const FloatingActionButton = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { language } = useLanguage();
  const t = translations[language];

  return (
    <div className="fixed bottom-24 right-8 z-40 flex flex-col gap-3 items-end">
      {isExpanded && (
        <div className="flex flex-col gap-2 animate-fade-in">
          <Button
            size="lg"
            className="rounded-full shadow-lg hover:shadow-xl transition-all gap-2"
            onClick={() => window.open('tel:+66812345678')}
          >
            <Phone size={20} />
            <span className="hidden sm:inline">{language === 'th' ? 'โทรเลย' : 'Call Now'}</span>
          </Button>
          
          <BookingDialog>
            <Button
              size="lg"
              variant="secondary"
              className="rounded-full shadow-lg hover:shadow-xl transition-all gap-2"
            >
              <MessageCircle size={20} />
              <span className="hidden sm:inline">{language === 'th' ? 'จองเลย' : 'Book Now'}</span>
            </Button>
          </BookingDialog>
        </div>
      )}

      <Button
        size="icon"
        className="h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <MessageCircle size={24} className={isExpanded ? "rotate-90 transition-transform" : "transition-transform"} />
      </Button>
    </div>
  );
};

export default FloatingActionButton;
