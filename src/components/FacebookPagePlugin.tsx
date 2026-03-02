import { useEffect, useRef } from "react";
import { useLanguage, translations } from "@/hooks/useLanguage";
import { Card } from "@/components/ui/card";
import { Facebook } from "lucide-react";

declare global {
  interface Window {
    FB?: {
      XFBML: {
        parse: (element?: HTMLElement) => void;
      };
    };
  }
}

const FacebookPagePlugin = () => {
  const { language } = useLanguage();
  const t = translations[language];
  const containerRef = useRef<HTMLDivElement>(null);
  const sdkLoaded = useRef(false);

  useEffect(() => {
    // Load Facebook SDK only once
    if (!sdkLoaded.current) {
      const script = document.createElement("script");
      script.src = "https://connect.facebook.net/th_TH/sdk.js#xfbml=1&version=v24.0";
      script.async = true;
      script.defer = true;
      script.crossOrigin = "anonymous";
      script.onload = () => {
        sdkLoaded.current = true;
        if (window.FB && containerRef.current) {
          window.FB.XFBML.parse(containerRef.current);
        }
      };
      document.body.appendChild(script);
    } else if (window.FB && containerRef.current) {
      // Re-parse if SDK is already loaded
      window.FB.XFBML.parse(containerRef.current);
    }
  }, []);

  return (
    <Card className="p-4 sm:p-6 bg-card/50 border-border/50 animate-fade-in h-fit w-full min-w-0 overflow-hidden">
      <div className="flex items-center gap-3 mb-4">
        <div className="bg-[#1877F2] p-2 rounded-lg">
          <Facebook className="w-5 h-5 text-white" />
        </div>
        <h3 className="text-lg sm:text-xl font-semibold text-foreground break-words">
          {language === "th" ? "ติดตามเราบน Facebook" : "Follow Us on Facebook"}
        </h3>
      </div>
      
      <div 
        ref={containerRef}
        className="w-full max-w-full flex justify-center overflow-hidden rounded-lg"
      >
        <div 
          id="fb-root"
          className="hidden"
        />
        <div 
          className="fb-page w-full max-w-full" 
          data-href="https://www.facebook.com/profile.php?id=100075885228455" 
          data-tabs="timeline" 
          data-width="300" 
          data-height="400" 
          data-small-header="true" 
          data-adapt-container-width="true" 
          data-hide-cover="false" 
          data-show-facepile="true"
          style={{ width: "100%" }}
        >
          <blockquote 
            cite="https://www.facebook.com/profile.php?id=100075885228455" 
            className="fb-xfbml-parse-ignore"
          >
            <a 
              href="https://www.facebook.com/profile.php?id=100075885228455"
              className="text-highlight hover:underline"
            >
              Plern Ping Cafe
            </a>
          </blockquote>
        </div>
      </div>

      <p className="text-sm text-muted-foreground mt-4 text-center">
        {language === "th" 
          ? "กดไลค์เพจเพื่อติดตามข่าวสารและโปรโมชั่นล่าสุด" 
          : "Like our page for the latest news and promotions"}
      </p>
    </Card>
  );
};

export default FacebookPagePlugin;
