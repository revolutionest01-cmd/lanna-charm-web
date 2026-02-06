import { Menu, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

interface SidebarTriggerButtonProps {
  className?: string;
}

const SidebarTriggerButton = ({ className }: SidebarTriggerButtonProps) => {
  const { toggleSidebar, state, isMobile } = useSidebar();
  const isCollapsed = state === "collapsed";

  if (isMobile) {
    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleSidebar}
        className={cn(
          "fixed top-4 left-4 z-50 h-11 w-11 rounded-xl",
          "bg-background/60 backdrop-blur-xl border border-border/30",
          "shadow-lg hover:shadow-xl transition-all duration-300",
          "hover:bg-background/80 hover:scale-105",
          className
        )}
        aria-label="Toggle menu"
      >
        <Menu className="h-5 w-5 text-foreground" />
      </Button>
    );
  }

  // Desktop collapsed state - show expand button
  if (isCollapsed) {
    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleSidebar}
        className={cn(
          "fixed top-4 left-16 z-50 h-8 w-8 rounded-lg",
          "bg-background/60 backdrop-blur-xl border border-border/30",
          "shadow-md hover:shadow-lg transition-all duration-300",
          "hover:bg-background/80 hover:scale-105",
          className
        )}
        aria-label="Expand sidebar"
      >
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </Button>
    );
  }

  return null;
};

export default SidebarTriggerButton;
