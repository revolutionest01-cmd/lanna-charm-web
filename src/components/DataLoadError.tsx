import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RotateCw } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';

/**
 * Error Recovery Component
 * Shows when data fails to load and provides recovery options
 * 
 * DISABLED: This component was causing false positives by checking /index.html
 * instead of actual data loading status. Re-enable only with proper error detection.
 */
export const DataLoadError = () => {
  const { language } = useLanguage();
  const [error, setError] = useState<string | null>(null);
  const [isRecovering, setIsRecovering] = useState(false);

  // DISABLED: Don't check /index.html periodically - it causes false positives
  // useEffect(() => {
  //   const checkInterval = setInterval(async () => { ... }, 5000);
  //   return () => clearInterval(checkInterval);
  // }, []);

  // Always return null - component disabled due to false positives
  return null;

  // Original error UI disabled:
  if (!error) {
    return null;
  }

  const handleRecover = async () => {
    setIsRecovering(true);

    try {
      // 1. Clear all caches
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
      }

      // 2. Unregister service workers
      if ('serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map(r => r.unregister()));
      }

      // 3. Clear problematic storage
      sessionStorage.clear();
      localStorage.removeItem('app-cache-metadata');

      // 4. Hard reload
      setTimeout(() => {
        window.location.href = window.location.href;
      }, 500);
    } catch (e) {
      console.error('Recovery failed:', e);
      setIsRecovering(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-background rounded-lg shadow-2xl border border-destructive/30 p-6 max-w-md w-full mx-4 animate-in fade-in zoom-in">
        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div className="rounded-full bg-destructive/10 p-4">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
        </div>

        {/* Title */}
        <h2 className="text-xl font-bold text-foreground text-center mb-2">
          {language === 'th' ? 'เกิดข้อผิดพลาด' : 'Error Loading Data'}
        </h2>

        {/* Message */}
        <p className="text-muted-foreground text-center mb-6">
          {language === 'th'
            ? 'เว็บไม่สามารถโหลดข้อมูลได้ อาจเป็นปัญหา cache หรือการเชื่อมต่อ'
            : 'Unable to load data. This might be a cache or connection issue.'
          }
        </p>

        {/* Suggestions */}
        <div className="bg-muted/50 rounded-lg p-4 mb-6 text-sm text-muted-foreground">
          <p className="font-semibold mb-2">
            {language === 'th' ? 'ลองแก้โดย:' : 'Try:'}
          </p>
          <ul className="list-disc list-inside space-y-1">
            <li>{language === 'th' ? '1. ลบ cache ของเบราว์เซอร์' : '1. Clear browser cache'}</li>
            <li>{language === 'th' ? '2. Hard refresh (Ctrl+Shift+R)' : '2. Hard refresh (Ctrl+Shift+R)'}</li>
            <li>{language === 'th' ? '3. เปิดด้วย Incognito mode' : '3. Use Incognito mode'}</li>
          </ul>
        </div>

        {/* Recover Button */}
        <Button
          onClick={handleRecover}
          disabled={isRecovering}
          className="w-full bg-primary hover:bg-primary/90"
          size="lg"
        >
          <RotateCw className={`mr-2 h-4 w-4 ${isRecovering ? 'animate-spin' : ''}`} />
          {language === 'th'
            ? isRecovering ? 'กำลังแก้ไข...' : 'รีเซ็ต & รีโหลด'
            : isRecovering ? 'Recovering...' : 'Reset & Reload'
          }
        </Button>

        {/* Manual Recovery */}
        <p className="text-xs text-muted-foreground text-center mt-4">
          {language === 'th'
            ? 'หรือลองเปิด Incognito mode และดูว่าสามารถโหลดได้ไหม'
            : 'Or try opening in Incognito mode to check'
          }
        </p>
      </div>
    </div>
  );
};

export default DataLoadError;
