import { useState, useCallback, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import ErrorBoundary from "./components/ErrorBoundary";
import AnimatedRoutes from "./components/AnimatedRoutes";
import LoadingScreen from "./components/LoadingScreen";
import AppUpdateNotifier from "./components/AppUpdateNotifier";
import DataLoadError from "./components/DataLoadError";
import { useGAPageTracking } from "./lib/googleAnalytics";
import { setGlobalQueryClient } from "./hooks/useContentData";
import { ModalProvider } from "./contexts/ModalContext";

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
  useGAPageTracking();

  return (
    <>
      {showLoading && <LoadingScreen onLoadingComplete={onLoadingComplete} />}
      <AnimatedRoutes />
      <AppUpdateNotifier />
      <DataLoadError />
    </>
  );
};

const App = () => {
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
