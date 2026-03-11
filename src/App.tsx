import { useState, useCallback, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, useLocation } from "react-router-dom";
import ErrorBoundary from "./components/ErrorBoundary";
import AnimatedRoutes from "./components/AnimatedRoutes";
import LoadingScreen from "./components/LoadingScreen";
import AppUpdateNotifier from "./components/AppUpdateNotifier";
import DataLoadError from "./components/DataLoadError";
import PrivacyConsentBanner from "./components/PrivacyConsentBanner";
import ServiceSuspendedScreen from "./components/ServiceSuspendedScreen";
import { initializeGA, useGAPageTracking } from "./lib/googleAnalytics";
import { useWebAnalyticsTracking } from "./lib/webAnalytics";
import { getPrivacyConsentState, type PrivacyConsentState } from "./lib/privacyConsent";
import { setGlobalQueryClient } from "./hooks/useContentData";
import { ModalProvider } from "./contexts/ModalContext";
import { useWebsiteTheme } from "./hooks/useWebsiteTheme";
import { useFeatureToggle } from "./hooks/useFeatureToggle";
import { useAdminStatus } from "./hooks/useAdminStatus";
import { useAuth } from "./hooks/useAuth";
import { useLanguage } from "./hooks/useLanguage";
import { ShieldAlert } from "lucide-react";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      refetchOnWindowFocus: true,
      staleTime: 2 * 60 * 1000, // Further reduced to 2 min for faster updates after admin changes
      gcTime: 10 * 60 * 1000,
    },
  },
});

// Set global QueryClient for cache invalidation from admin components
setGlobalQueryClient(queryClient);

// Component to track page views
const AppRoutes = ({ showLoading, onLoadingComplete }: { showLoading: boolean; onLoadingComplete: () => void }) => {
  const location = useLocation();
  const { language } = useLanguage();
  const { isAuthenticated } = useAuth();
  const { toggles, isLoading: featureLoading } = useFeatureToggle();
  const { isDeveloper, isChecking: roleChecking } = useAdminStatus();
  const [consentState, setConsentState] = useState<PrivacyConsentState>(() => getPrivacyConsentState());

  useEffect(() => {
    const onConsentChanged = (event: Event) => {
      const customEvent = event as CustomEvent<PrivacyConsentState>;
      setConsentState(customEvent.detail || getPrivacyConsentState());
    };
    window.addEventListener("privacy-consent-updated", onConsentChanged as EventListener);
    return () => window.removeEventListener("privacy-consent-updated", onConsentChanged as EventListener);
  }, []);

  const analyticsEnabled = !featureLoading && toggles["analytics"] === true && consentState.analyticsAllowed;
  const isServiceSuspended = !featureLoading && toggles["service_suspended"] === true;
  const isAuthPath = location.pathname.startsWith("/auth");
  const hideMenuChromeOnAuthSuspended = isServiceSuspended && isAuthPath;
  const canBypassSuspended = !roleChecking && isDeveloper;
  const allowAuthDuringSuspended = isAuthPath && !isAuthenticated;
  const shouldShowRoleLoading = isServiceSuspended && roleChecking;
  const shouldShowSuspended = isServiceSuspended && !canBypassSuspended && !allowAuthDuringSuspended && !shouldShowRoleLoading;
  const shouldShowLoadingScreen = showLoading && !featureLoading && !isServiceSuspended;

  useEffect(() => {
    if (isServiceSuspended && showLoading) {
      onLoadingComplete();
    }
  }, [isServiceSuspended, showLoading, onLoadingComplete]);

  useEffect(() => {
    initializeGA(analyticsEnabled);
  }, [analyticsEnabled]);

  useGAPageTracking();
  useWebAnalyticsTracking(analyticsEnabled);

  return (
    <>
      {featureLoading ? (
        <div className="min-h-screen w-full bg-background" />
      ) : shouldShowLoadingScreen ? (
        <LoadingScreen onLoadingComplete={onLoadingComplete} />
      ) : shouldShowRoleLoading ? (
        <div className="min-h-screen w-full bg-background flex items-center justify-center">
          <p className="text-sm text-muted-foreground">
            {language === "th" ? "กำลังตรวจสอบสิทธิ์การเข้าถึง..." : "Checking access permissions..."}
          </p>
        </div>
      ) : shouldShowSuspended ? (
        <ServiceSuspendedScreen />
      ) : (
        <>
          {isServiceSuspended && canBypassSuspended && (
            <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[120] w-[calc(100%-1.5rem)] max-w-2xl">
              <div className="rounded-xl border border-amber-500/40 bg-amber-50/95 dark:bg-amber-900/20 px-4 py-3 shadow-lg backdrop-blur-sm">
                <div className="flex items-start gap-3">
                  <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-300 mt-0.5 shrink-0" />
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-amber-900 dark:text-amber-100">
                      {language === "th" ? "Developer Notice: Service Suspended เปิดใช้งานอยู่" : "Developer Notice: Service Suspended is active"}
                    </p>
                    <p className="text-xs text-amber-800/90 dark:text-amber-200/90 leading-relaxed">
                      {language === "th"
                        ? "ผู้ใช้งานทุกบทบาทที่ต่ำกว่า Developer จะถูกจำกัดให้อยู่หน้า Service Suspended ทั้งหมด"
                        : "All roles below Developer are restricted to the Service Suspended screen."}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
          <AnimatedRoutes hideNavigationChrome={hideMenuChromeOnAuthSuspended} />
          <PrivacyConsentBanner />
          <AppUpdateNotifier />
          <DataLoadError />
        </>
      )}
    </>
  );
};

const App = () => {
  useWebsiteTheme();

  // Show loading screen only on first load, not on refresh
  const [showLoading, setShowLoading] = useState(() => {
    // Check if this is the first load in this session
    const isFirstLoad = !sessionStorage.getItem('app-initialized');
    if (isFirstLoad) {
      // Mark as initialized in this session
      sessionStorage.setItem('app-initialized', 'true');
      console.log('[App] First load - showing loading screen');
      return true;
    } else {
      console.log('[App] Refresh detected - skipping loading screen');
      return false;
    }
  });

  const handleLoadingComplete = useCallback(() => {
    setShowLoading(false);
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <ModalProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <AppRoutes showLoading={showLoading} onLoadingComplete={handleLoadingComplete} />
              {/* DataLoadError disabled - was causing false positives on refresh */}
            </BrowserRouter>
          </ModalProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
