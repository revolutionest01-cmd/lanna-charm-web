import { useRef, useState, useCallback, ReactNode } from 'react';

interface MagneticButtonProps {
  children: ReactNode;
  className?: string;
  strength?: number;
  radius?: number;
}

const MagneticButton = ({ 
  children, 
  className = '',
  strength = 0.3,
  radius = 150 
}: MagneticButtonProps) => {
  const buttonRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!buttonRef.current) return;

    const rect = buttonRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const distanceX = e.clientX - centerX;
    const distanceY = e.clientY - centerY;
    const distance = Math.sqrt(distanceX ** 2 + distanceY ** 2);

    if (distance < radius) {
      const magnetStrength = (1 - distance / radius) * strength;
      setPosition({
        x: distanceX * magnetStrength,
        y: distanceY * magnetStrength
      });
    }
  }, [strength, radius]);

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    setPosition({ x: 0, y: 0 });
  }, []);

  return (
    <div
      ref={buttonRef}
      className={`magnetic-wrapper ${className}`}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        display: 'inline-block',
        transform: `translate(${position.x}px, ${position.y}px)`,
        transition: isHovered 
          ? 'transform 0.15s cubic-bezier(0.33, 1, 0.68, 1)' 
          : 'transform 0.5s cubic-bezier(0.33, 1, 0.68, 1)',
      }}
    >
      {children}
    </div>
  );
};

export default MagneticButton;
