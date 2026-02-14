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
  const { state, isMobile, openMobile, setOpen, setOpenMobile } = useSidebar();
  const isOpen = state === "expanded" || (isMobile && openMobile);

  const handleOverlayClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    } else {
      setOpen(false);
    }
  };

  return (
    <SidebarInset className={cn(
      "flex-1 overflow-x-hidden",
      // Mobile: Secondbar (12) + TabBar (10) = 22 = ~5.5rem, bottom for BottomBar (14)
      "pt-[5.5rem] pb-16",
      // Tablet (sm): Secondbar (14) + TabBar (11) = 25 = ~6.25rem
      "sm:pt-[6.25rem] sm:pb-18",
      // Desktop: only Secondbar (16 = 4rem), no bottom bar
      "md:pt-16 md:pb-0"
    )}>
      {/* Overlay when sidebar is open - GPU-accelerated */}
      <div 
        className={cn(
          "fixed inset-0 z-30 will-change-[opacity] transition-opacity duration-300 ease-out",
          isOpen 
            ? "bg-black/30 opacity-100 pointer-events-auto" 
            : "bg-black/30 opacity-0 pointer-events-none"
        )}
        onClick={handleOverlayClick}
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
