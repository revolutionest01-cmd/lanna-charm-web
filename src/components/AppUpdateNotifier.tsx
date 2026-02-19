import { useEffect, useState } from 'react';
import { AppVersion, versionManager } from '@/lib/versionManager';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';

/**
 * Component that notifies users when a new version is available
 * and provides an option to update
 */
export const AppUpdateNotifier = () => {
  const { language } = useLanguage();
  const [newVersion, setNewVersion] = useState<AppVersion | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Subscribe to update notifications
    const unsubscribe = versionManager.onUpdateAvailable((version) => {
      setNewVersion(version);
    });

    // Start periodic version checks
    versionManager.startPeriodicCheck();

    // Cleanup
    return () => {
      unsubscribe();
    };
  }, []);

  if (!newVersion) {
    return null;
  }

  const handleUpdate = async () => {
    setIsLoading(true);
    
    // Unregister service workers to clear cache
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map(r => r.unregister()));
    }

    // Reload page after a short delay
    setTimeout(() => {
      versionManager.reloadPage();
    }, 500);
  };

  const handleDismiss = () => {
    setNewVersion(null);
  };

  return (
    <div className="fixed bottom-20 sm:bottom-24 left-4 right-4 max-w-md mx-auto z-40 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="bg-gradient-to-r from-primary to-accent rounded-lg shadow-2xl border border-primary/30 overflow-hidden">
        {/* Header */}
        <div className="bg-primary/10 backdrop-blur-sm px-4 py-3 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-primary flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground">
              {language === 'th' ? '🎉 เวอร์ชั่นใหม่พร้อมแล้ว' : '🎉 New version available'}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              {language === 'th' 
                ? 'เพิ่มเติมข้อมูล ปรับปรุง และแก้ไขบัคต่างๆ'
                : 'New features, updates and bug fixes'
              }
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="px-4 py-3 flex gap-2">
          <Button
            onClick={handleUpdate}
            disabled={isLoading}
            size="sm"
            className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            {language === 'th' ? 'อัพเดทเลย' : 'Update now'}
          </Button>
          <Button
            onClick={handleDismiss}
            disabled={isLoading}
            variant="outline"
            size="sm"
            className="flex-1"
          >
            {language === 'th' ? 'ปิด' : 'Dismiss'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AppUpdateNotifier;
