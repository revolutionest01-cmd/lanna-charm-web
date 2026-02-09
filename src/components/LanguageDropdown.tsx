import { ChevronDown, Globe } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLanguage, Language } from "@/hooks/useLanguage";

interface LanguageOption {
  code: Language;
  flag: string;
  name: string;
  nativeName: string;
}

const languages: LanguageOption[] = [
  { code: 'th', flag: '🇹🇭', name: 'Thai', nativeName: 'ไทย' },
  { code: 'zh', flag: '🇨🇳', name: 'Chinese', nativeName: '中文' },
  { code: 'en', flag: '🇬🇧', name: 'English', nativeName: 'English' },
];

interface LanguageDropdownProps {
  variant?: 'light' | 'dark';
  className?: string;
}

const LanguageDropdown = ({ variant = 'dark', className = '' }: LanguageDropdownProps) => {
  const { language, setLanguage } = useLanguage();
  
  const currentLanguage = languages.find(l => l.code === language) || languages[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={`
            inline-flex items-center gap-2 px-3 py-2 rounded-xl
            border transition-colors duration-300
            focus:outline-none focus:ring-2 focus:ring-highlight/50
            ${variant === 'light' 
              ? 'bg-white/20 border-white/20 text-white hover:bg-white/30' 
              : 'bg-card border-border/50 text-foreground hover:bg-muted hover:border-highlight/30'
            }
            ${className}
          `}
        >
          <Globe size={16} className="opacity-70" />
          <span className="text-xl">{currentLanguage.flag}</span>
          <span className="font-medium text-sm hidden sm:inline">{currentLanguage.nativeName}</span>
          <ChevronDown size={14} className="opacity-60" />
        </button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="
          min-w-[180px] p-2 
          bg-card 
          border border-border/50 
          rounded-xl shadow-2xl
          animate-in fade-in-0 zoom-in-95
          z-[100]
        "
      >
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => setLanguage(lang.code)}
            className={`
              flex items-center gap-3 px-3 py-3 rounded-lg cursor-pointer
              transition-all duration-200
              ${language === lang.code 
                ? 'bg-highlight/15 text-highlight' 
                : 'hover:bg-muted text-foreground'
              }
            `}
          >
            <span className="text-2xl">{lang.flag}</span>
            <div className="flex flex-col">
              <span className={`font-semibold text-sm ${language === lang.code ? 'text-highlight' : ''}`}>
                {lang.nativeName}
              </span>
              <span className="text-xs text-muted-foreground">
                {lang.name}
              </span>
            </div>
            {language === lang.code && (
              <div className="ml-auto w-2 h-2 rounded-full bg-highlight animate-pulse" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LanguageDropdown;
