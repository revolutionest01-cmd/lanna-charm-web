import { useState } from "react";
import { RotateCcw, Zap, Bug, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/hooks/useLanguage";
import CacheClearButton from "./CacheClearButton";
import { cacheClearManager } from "@/lib/cacheClearManager";
import { cn } from "@/lib/utils";

export default function UtilityTools() {
  const { toast } = useToast();
  const { language: lang } = useLanguage();
  const [showDebugInfo, setShowDebugInfo] = useState(false);
  const [showResetWarning, setShowResetWarning] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>(null);

  const t = {
    th: {
      tools: "เครื่องมือ",
      hardRefresh: "รีเฟรชแรง",
      hardRefreshDesc: "บังคับรีโหลดหน้าและล้างแคช",
      fullReset: "รีเซ็ตทั้งหมด",
      fullResetDesc: "ล้างข้อมูลทั้งหมด เก็บข้อมูล และแคช",
      debug: "โหมดดีบัก",
      debugDesc: "แสดงข้อมูลระบบและแคช",
      resetConfirm: "ยืนยันการรีเซ็ต",
      resetWarning: "สิ่งนี้จะลบข้อมูลทั้งหมด รวมถึงช่องข้อมูลเก็บและแคช",
      close: "ปิด",
      confirm: "ยืนยัน",
      cancel: "ยกเลิก",
      debugInfo: "ข้อมูลดีบัก",
      cacheSize: "ขนาดแคช",
      storageUsage: "การใช้ที่เก็บข้อมูล",
      swStatus: "สถานะ Service Worker",
      swEnabled: "เปิดใช้งาน",
      swDisabled: "ปิดใช้งาน",
      refreshSuccess: "รีเฟรชหน้าสำเร็จ",
      resetSuccess: "รีเซ็ตทั้งหมดเสร็จสิ้น",
    },
    zh: {
      tools: "工具",
      hardRefresh: "硬刷新",
      hardRefreshDesc: "强制加载页面并清除缓存",
      fullReset: "完全重置",
      fullResetDesc: "清除所有数据、存储和缓存",
      debug: "调试模式",
      debugDesc: "显示系统和缓存信息",
      resetConfirm: "确认重置",
      resetWarning: "这将删除所有数据，包括存储和缓存",
      close: "关闭",
      confirm: "确认",
      cancel: "取消",
      debugInfo: "调试信息",
      cacheSize: "缓存大小",
      storageUsage: "存储使用情况",
      swStatus: "Service Worker 状态",
      swEnabled: "已启用",
      swDisabled: "已禁用",
      refreshSuccess: "页面刷新成功",
      resetSuccess: "完全重置完成",
    },
    en: {
      tools: "Tools",
      hardRefresh: "Hard Refresh",
      hardRefreshDesc: "Force reload page and clear cache",
      fullReset: "Full Reset",
      fullResetDesc: "Clear all data, storage and cache",
      debug: "Debug Mode",
      debugDesc: "Show system and cache information",
      resetConfirm: "Confirm Reset",
      resetWarning: "This will delete all data including storage and cache",
      close: "Close",
      confirm: "Confirm",
      cancel: "Cancel",
      debugInfo: "Debug Info",
      cacheSize: "Cache Size",
      storageUsage: "Storage Usage",
      swStatus: "Service Worker Status",
      swEnabled: "Enabled",
      swDisabled: "Disabled",
      refreshSuccess: "Page refreshed successfully",
      resetSuccess: "Full reset completed",
    },
  };

  const texts = t[lang as keyof typeof t] || t.en;

  const handleHardRefresh = () => {
    toast({
      title: texts.refreshSuccess,
      duration: 1000,
    });
    setTimeout(() => {
      window.location.href = window.location.href;
    }, 500);
  };

  const handleFullReset = async () => {
    try {
      await cacheClearManager.nuclearReset();
      toast({
        title: texts.resetSuccess,
        duration: 1000,
      });
      setShowResetWarning(false);
      setTimeout(() => {
        window.location.href = '/';
      }, 1000);
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to reset",
        variant: "destructive",
      });
    }
  };

  const handleDebugToggle = async () => {
    if (!showDebugInfo) {
      const info = await getDebugInfo();
      setDebugInfo(info);
    }
    setShowDebugInfo(!showDebugInfo);
  };

  const getDebugInfo = async () => {
    let swStatus = "Not Available";
    try {
      if (navigator.serviceWorker) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        swStatus = registrations.length > 0 ? texts.swEnabled : texts.swDisabled;
      }
    } catch (e) {
      swStatus = "Error";
    }

    let storageUsage = "Unknown";
    try {
      if (navigator.storage && navigator.storage.estimate) {
        const estimate = await navigator.storage.estimate();
        storageUsage = `${(estimate.usage / 1024 / 1024).toFixed(2)} MB / ${(estimate.quota / 1024 / 1024).toFixed(2)} MB`;
      }
    } catch (e) {
      storageUsage = "Error";
    }

    return {
      timestamp: new Date().toLocaleString(lang === 'th' ? 'th-TH' : lang === 'zh' ? 'zh-CN' : 'en-US'),
      userAgent: navigator.userAgent.substring(0, 50) + "...",
      swStatus,
      storageUsage,
      urlPath: window.location.pathname,
      theme: document.documentElement.className,
    };
  };

  return (
    <div className="w-full">
      {/* Minimal Icon Buttons Row */}
      <div className="flex items-center justify-center gap-2 flex-wrap">
        {/* Clear Cache Button */}
        <CacheClearButton />

        {/* Hard Refresh Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={handleHardRefresh}
          className="h-8 w-8 rounded-lg text-background/60 hover:text-background hover:bg-background/10 transition-all"
          title={texts.hardRefresh}
          aria-label={texts.hardRefresh}
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </Button>

        {/* Debug Mode Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={handleDebugToggle}
          className="h-8 w-8 rounded-lg text-background/60 hover:text-background hover:bg-background/10 transition-all"
          title={texts.debug}
          aria-label={texts.debug}
        >
          <Bug className="h-3.5 w-3.5" />
        </Button>

        {/* Full Reset Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowResetWarning(true)}
          className="h-8 w-8 rounded-lg text-background/60 hover:text-background hover:bg-background/10 transition-all"
          title={texts.fullReset}
          aria-label={texts.fullReset}
        >
          <Zap className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Debug Info Dialog */}
      <Dialog open={showDebugInfo} onOpenChange={setShowDebugInfo}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bug className="h-4 w-4" />
              {texts.debugInfo}
            </DialogTitle>
            <DialogDescription>
              {texts.debugDesc}
            </DialogDescription>
          </DialogHeader>

          {debugInfo && (
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              <div className="space-y-1 text-sm">
                <p className="font-semibold text-xs uppercase text-muted-foreground">
                  {texts.swStatus}
                </p>
                <p className="text-sm break-words">{debugInfo.swStatus}</p>
              </div>

              <div className="space-y-1 text-sm">
                <p className="font-semibold text-xs uppercase text-muted-foreground">
                  {texts.storageUsage}
                </p>
                <p className="text-sm break-words">{debugInfo.storageUsage}</p>
              </div>

              <div className="space-y-1 text-sm">
                <p className="font-semibold text-xs uppercase text-muted-foreground">
                  URL Path
                </p>
                <p className="text-sm break-words font-mono">{debugInfo.urlPath}</p>
              </div>

              <div className="space-y-1 text-sm">
                <p className="font-semibold text-xs uppercase text-muted-foreground">
                  Theme
                </p>
                <p className="text-sm break-words font-mono">{debugInfo.theme}</p>
              </div>

              <div className="space-y-1 text-sm">
                <p className="font-semibold text-xs uppercase text-muted-foreground">
                  Timestamp
                </p>
                <p className="text-sm break-words font-mono text-xs">{debugInfo.timestamp}</p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDebugInfo(false)}>
              {texts.close}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Confirmation Dialog */}
      <AlertDialog open={showResetWarning} onOpenChange={setShowResetWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              {texts.resetConfirm}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {texts.resetWarning}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{texts.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleFullReset}
              className="bg-red-600 hover:bg-red-700"
            >
              {texts.confirm}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
