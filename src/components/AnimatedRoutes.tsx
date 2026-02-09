import { Routes, Route, useLocation } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import Index from "@/pages/Index";
import NotFound from "@/pages/NotFound";
import Auth from "@/pages/Auth";
import Forum from "@/pages/Forum";
import TopicDetail from "@/pages/TopicDetail";
import Admin from "@/pages/Admin";
import Gallery from "@/pages/Gallery";
import Reviews from "@/pages/Reviews";
import Menu from "@/pages/Menu";
import { SidebarProvider, SidebarInset, useSidebar } from "@/components/ui/sidebar";
import AppSidebar from "@/components/AppSidebar";
import Secondbar from "@/components/Secondbar";
import TabBar from "@/components/TabBar";
import BottomBar from "@/components/BottomBar";
import { cn } from "@/lib/utils";

// Wrapper component to access sidebar state
const MainContent = ({ children, animationClass }: { children: React.ReactNode; animationClass: string }) => {
  const { state, isMobile, openMobile } = useSidebar();
  const isOpen = state === "expanded" || (isMobile && openMobile);

  return (
    <SidebarInset className={cn(
      "flex-1 transition-all duration-300",
      // Mobile: top padding for Secondbar (14) + TabBar (10) = 24 = 6rem, bottom for BottomBar
      "pt-24 pb-16 sm:pb-18",
      // Tablet: slightly larger spacing
      "sm:pt-[6.5rem]",
      // Desktop: only Secondbar (16 = 4rem), no bottom bar
      "md:pt-16 md:pb-0"
    )}>
      {/* Blur overlay when sidebar is open */}
      <div 
        className={cn(
          "fixed inset-0 z-30 pointer-events-none transition-all duration-500 ease-out",
          isOpen 
            ? "backdrop-blur-md bg-black/20 opacity-100 pointer-events-auto" 
            : "backdrop-blur-none bg-transparent opacity-0"
        )}
        onClick={() => {
          // Close sidebar when clicking overlay - handled by sidebar context
        }}
      />
      <div className={cn("page-transition-content relative z-0", animationClass)}>
        {children}
      </div>
    </SidebarInset>
  );
};

const AnimatedRoutes = () => {
  const location = useLocation();
  const [displayLocation, setDisplayLocation] = useState(location);
  const [transitionStage, setTransitionStage] = useState<'enter' | 'exit' | 'idle'>('idle');
  const prevPathRef = useRef(location.pathname);

  useEffect(() => {
    // Check if this is just a hash change on the same page
    const isHashOnly = location.pathname === prevPathRef.current;
    
    if (!isHashOnly && location.pathname !== displayLocation.pathname) {
      // Different page - start exit animation
      setTransitionStage('exit');
    } else if (isHashOnly) {
      // Same page hash navigation - no animation needed
      setDisplayLocation(location);
    }
    
    prevPathRef.current = location.pathname;
  }, [location, displayLocation]);

  useEffect(() => {
    if (transitionStage === 'exit') {
      const timer = setTimeout(() => {
        setDisplayLocation(location);
        setTransitionStage('enter');
        window.scrollTo({ top: 0, behavior: 'instant' });
      }, 300);
      return () => clearTimeout(timer);
    }
    
    if (transitionStage === 'enter') {
      const timer = setTimeout(() => {
        setTransitionStage('idle');
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [transitionStage, location]);

  const getAnimationClass = () => {
    switch (transitionStage) {
      case 'exit':
        return 'page-exit';
      case 'enter':
        return 'page-enter';
      default:
        return '';
    }
  };

  return (
    <SidebarProvider defaultOpen={false}>
      <div className="min-h-screen flex w-full">
        <Secondbar />
        <TabBar />
        <AppSidebar />
        
        <MainContent animationClass={getAnimationClass()}>
          <Routes location={displayLocation}>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/forum" element={<Forum />} />
            <Route path="/forum/:id" element={<TopicDetail />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/gallery" element={<Gallery />} />
            <Route path="/reviews" element={<Reviews />} />
            <Route path="/menu" element={<Menu />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </MainContent>
        
        {/* Bottom Bar for mobile */}
        <BottomBar />
      </div>
    </SidebarProvider>
  );
};

export default AnimatedRoutes;
