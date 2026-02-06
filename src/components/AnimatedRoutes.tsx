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
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import AppSidebar from "@/components/AppSidebar";
import Secondbar from "@/components/Secondbar";

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
        <AppSidebar />
        
        <SidebarInset className="flex-1 pt-14">
          <div className={`page-transition-content ${getAnimationClass()}`}>
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
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default AnimatedRoutes;
