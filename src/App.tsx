import { useState, useCallback } from "react";
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

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
    },
  },
});

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
  const [showLoading, setShowLoading] = useState(true);

  const handleLoadingComplete = useCallback(() => {
    setShowLoading(false);
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AppRoutes showLoading={showLoading} onLoadingComplete={handleLoadingComplete} />
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
