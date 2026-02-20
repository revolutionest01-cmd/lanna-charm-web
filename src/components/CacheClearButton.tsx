import { useState } from 'react';
import { AlertCircle, RotateCw, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useLanguage } from '@/hooks/useLanguage';
import { cacheClearManager } from '@/lib/cacheClearManager';
import { toast } from '@/lib/toast';

/**
 * Cache Clear Button - Minimal Version
 * Compact icon button with minimal styling
 */
export const CacheClearButton = () => {
  const { language } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState<'hard' | 'nuclear'>('hard');

  const handleClear = async () => {
    setIsClearing(true);
    try {
      if (selectedLevel === 'hard') {
        toast.success(
          language === 'th'
            ? 'กำลังล้าง cache และ reload...'
            : 'Clearing cache and reloading...'
        );
        await cacheClearManager.hardClear();
      } else {
        toast.success(
          language === 'th'
            ? 'กำลังรีเซ็ตระบบอย่างสมบูรณ์...'
            : 'Performing complete system reset...'
        );
        await cacheClearManager.nuclearReset();
      }
    } catch (error) {
      console.error('Cache clear failed:', error);
      toast.error(
        language === 'th'
          ? 'ล้าง cache ไม่สำเร็จ'
          : 'Cache clear failed'
      );
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-lg text-background/60 hover:text-background hover:bg-background/10 transition-all"
          title={
            language === 'th'
              ? 'ล้าง cache'
              : 'Clear cache'
          }
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            {language === 'th' ? 'ล้าง Cache' : 'Clear Cache'}
          </DialogTitle>
          <DialogDescription>
            {language === 'th'
              ? 'เลือกระดับการล้าง'
              : 'Select clear level'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4">
          {/* Hard Clear Option */}
          <div
            className={`border rounded p-3 cursor-pointer transition-colors ${
              selectedLevel === 'hard'
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50'
            }`}
            onClick={() => setSelectedLevel('hard')}
          >
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="radio"
                name="level"
                value="hard"
                checked={selectedLevel === 'hard'}
                onChange={() => setSelectedLevel('hard')}
                className="mt-0.5"
              />
              <div className="flex-1">
                <h4 className="font-semibold text-sm">
                  {language === 'th' ? 'ล้างด่วน' : 'Quick Clear'}
                </h4>
                <p className="text-xs text-muted-foreground">
                  {language === 'th'
                    ? 'Cache + reload'
                    : 'Clear cache + reload'}
                </p>
              </div>
            </label>
          </div>

          {/* Nuclear Reset Option */}
          <div
            className={`border rounded p-3 cursor-pointer transition-colors ${
              selectedLevel === 'nuclear'
                ? 'border-destructive bg-destructive/5'
                : 'border-border hover:border-destructive/50'
            }`}
            onClick={() => setSelectedLevel('nuclear')}
          >
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="radio"
                name="level"
                value="nuclear"
                checked={selectedLevel === 'nuclear'}
                onChange={() => setSelectedLevel('nuclear')}
                className="mt-0.5"
              />
              <div className="flex-1">
                <h4 className="font-semibold text-sm text-destructive">
                  {language === 'th' ? 'รีเซ็ต' : 'Full Reset'}
                </h4>
                <p className="text-xs text-muted-foreground">
                  {language === 'th'
                    ? 'ล้างทั้งหมด'
                    : 'Complete reset'}
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsOpen(false)}
            disabled={isClearing}
          >
            {language === 'th' ? 'ยกเลิก' : 'Cancel'}
          </Button>
          <Button
            size="sm"
            onClick={handleClear}
            disabled={isClearing}
            variant={selectedLevel === 'nuclear' ? 'destructive' : 'default'}
            className="flex-1 gap-1.5"
          >
            <RotateCw className={`h-3 w-3 ${isClearing ? 'animate-spin' : ''}`} />
            {isClearing
              ? language === 'th'
                ? 'ล้าง...'
                : 'Clearing...'
              : language === 'th'
              ? 'ล้าง'
              : 'Clear'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CacheClearButton;
