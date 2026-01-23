import { useEffect, useState, useCallback } from 'react';

interface CursorPosition {
  x: number;
  y: number;
}

const CustomCursor = () => {
  const [position, setPosition] = useState<CursorPosition>({ x: 0, y: 0 });
  const [trailPosition, setTrailPosition] = useState<CursorPosition>({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const [isClicking, setIsClicking] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Check if device is mobile/touch
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    setPosition({ x: e.clientX, y: e.clientY });
    setIsVisible(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsVisible(false);
  }, []);

  const handleMouseEnter = useCallback(() => {
    setIsVisible(true);
  }, []);

  const handleMouseDown = useCallback(() => {
    setIsClicking(true);
  }, []);

  const handleMouseUp = useCallback(() => {
    setIsClicking(false);
  }, []);

  // Smooth trail effect
  useEffect(() => {
    let animationFrame: number;
    
    const updateTrail = () => {
      setTrailPosition(prev => ({
        x: prev.x + (position.x - prev.x) * 0.15,
        y: prev.y + (position.y - prev.y) * 0.15
      }));
      animationFrame = requestAnimationFrame(updateTrail);
    };
    
    animationFrame = requestAnimationFrame(updateTrail);
    return () => cancelAnimationFrame(animationFrame);
  }, [position]);

  // Mouse event listeners
  useEffect(() => {
    if (isMobile) return;

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseenter', handleMouseEnter);
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseenter', handleMouseEnter);
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isMobile, handleMouseMove, handleMouseLeave, handleMouseEnter, handleMouseDown, handleMouseUp]);

  // Hover detection for interactive elements
  useEffect(() => {
    if (isMobile) return;

    const handleElementHover = () => {
      const interactiveElements = document.querySelectorAll(
        'a, button, [role="button"], input, textarea, select, .cursor-pointer, [data-cursor-hover]'
      );

      interactiveElements.forEach(element => {
        element.addEventListener('mouseenter', () => setIsHovering(true));
        element.addEventListener('mouseleave', () => setIsHovering(false));
      });
    };

    // Initial setup
    handleElementHover();

    // Observe DOM changes for dynamically added elements
    const observer = new MutationObserver(handleElementHover);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, [isMobile]);

  // Don't render on mobile/touch devices
  if (isMobile) return null;

  return (
    <>
      {/* Main cursor dot */}
      <div
        className="fixed pointer-events-none z-[9999] mix-blend-difference"
        style={{
          left: position.x,
          top: position.y,
          transform: 'translate(-50%, -50%)',
          opacity: isVisible ? 1 : 0,
          transition: 'opacity 0.3s ease'
        }}
      >
        <div
          className="rounded-full bg-white transition-all duration-150 ease-out"
          style={{
            width: isClicking ? '8px' : isHovering ? '6px' : '10px',
            height: isClicking ? '8px' : isHovering ? '6px' : '10px',
          }}
        />
      </div>

      {/* Trail ring */}
      <div
        className="fixed pointer-events-none z-[9998]"
        style={{
          left: trailPosition.x,
          top: trailPosition.y,
          transform: 'translate(-50%, -50%)',
          opacity: isVisible ? 1 : 0,
          transition: 'opacity 0.3s ease'
        }}
      >
        <div
          className="rounded-full border transition-all duration-300 ease-out"
          style={{
            width: isClicking ? '28px' : isHovering ? '50px' : '36px',
            height: isClicking ? '28px' : isHovering ? '50px' : '36px',
            borderColor: isHovering 
              ? 'hsl(var(--highlight) / 0.6)' 
              : 'hsl(var(--foreground) / 0.3)',
            borderWidth: isHovering ? '2px' : '1px',
            backgroundColor: isHovering 
              ? 'hsl(var(--highlight) / 0.08)' 
              : 'transparent',
          }}
        />
      </div>

      {/* Subtle glow on hover */}
      {isHovering && (
        <div
          className="fixed pointer-events-none z-[9997]"
          style={{
            left: trailPosition.x,
            top: trailPosition.y,
            transform: 'translate(-50%, -50%)',
            opacity: isVisible ? 0.4 : 0,
          }}
        >
          <div
            className="rounded-full blur-md"
            style={{
              width: '60px',
              height: '60px',
              background: 'radial-gradient(circle, hsl(var(--highlight) / 0.3) 0%, transparent 70%)',
            }}
          />
        </div>
      )}

      {/* Hide default cursor globally */}
      <style>{`
        * {
          cursor: none !important;
        }
      `}</style>
    </>
  );
};

export default CustomCursor;
