import { useEffect, useState } from "react";

interface Leaf {
  id: number;
  left: number;
  duration: number;
  delay: number;
  size: number;
  color: 'green' | 'yellow';
  rotation: number;
  swayAmount: number;
}

const FallingLeaves = () => {
  const [leaves, setLeaves] = useState<Leaf[]>([]);

  useEffect(() => {
    // Generate random leaves with green and yellow colors
    const generatedLeaves: Leaf[] = Array.from({ length: 25 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      duration: 12 + Math.random() * 8, // 12-20 seconds
      delay: Math.random() * 8,
      size: 15 + Math.random() * 20, // 15-35px
      color: Math.random() > 0.4 ? 'green' : 'yellow', // 60% green, 40% yellow
      rotation: Math.random() * 360,
      swayAmount: 30 + Math.random() * 40, // 30-70px sway
    }));
    
    setLeaves(generatedLeaves);
  }, []);

  const LeafSVG = ({ color }: { color: 'green' | 'yellow' }) => {
    const fillColor = color === 'green' 
      ? 'rgb(34, 197, 94)' // green-500
      : 'rgb(234, 179, 8)'; // yellow-500
    
    const strokeColor = color === 'green'
      ? 'rgb(22, 163, 74)' // green-600
      : 'rgb(202, 138, 4)'; // yellow-600

    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ width: '100%', height: '100%' }}
      >
        {/* Leaf shape */}
        <path
          d="M12 2C12 2 6 8 6 14C6 17.314 8.686 20 12 20C15.314 20 18 17.314 18 14C18 8 12 2 12 2Z"
          fill={fillColor}
          stroke={strokeColor}
          strokeWidth="0.5"
          opacity="0.85"
        />
        {/* Leaf vein */}
        <path
          d="M12 4V18"
          stroke={strokeColor}
          strokeWidth="0.8"
          strokeLinecap="round"
          opacity="0.6"
        />
        {/* Side veins */}
        <path
          d="M12 8C10 9 8 10 8 12M12 8C14 9 16 10 16 12"
          stroke={strokeColor}
          strokeWidth="0.6"
          strokeLinecap="round"
          opacity="0.4"
        />
      </svg>
    );
  };

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {leaves.map((leaf) => (
        <div
          key={leaf.id}
          className="falling-leaf"
          style={{
            left: `${leaf.left}%`,
            width: `${leaf.size}px`,
            height: `${leaf.size}px`,
            animationDuration: `${leaf.duration}s, ${leaf.duration * 0.6}s, ${leaf.duration * 0.8}s`,
            animationDelay: `${leaf.delay}s`,
            '--sway-amount': `${leaf.swayAmount}px`,
            '--initial-rotation': `${leaf.rotation}deg`,
          } as React.CSSProperties}
        >
          <LeafSVG color={leaf.color} />
        </div>
      ))}
    </div>
  );
};

export default FallingLeaves;
