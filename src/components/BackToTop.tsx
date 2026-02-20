import { useState, useEffect } from "react";
import { ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";

const BackToTop = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener("scroll", toggleVisibility);
    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <>
      {isVisible && (
        <Button
          onClick={scrollToTop}
          size="icon"
          className="fixed bottom-20 right-6 md:bottom-8 md:right-8 z-[51] rounded-full shadow-lg hover:shadow-xl transition-all animate-fade-in hover:scale-110 active:scale-95 backdrop-blur-sm"
          aria-label="Back to top"
        >
          <ArrowUp size={20} />
        </Button>
      )}
    </>
  );
};

export default BackToTop;
