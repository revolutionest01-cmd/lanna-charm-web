import { useEffect, useState } from "react";

interface Leaf {
  id: number;
  left: number;
  duration: number;
  delay: number;
  size: number;
}

const FallingLeaves = () => {
  const [leaves, setLeaves] = useState<Leaf[]>([]);

  useEffect(() => {
    // Generate random leaves
    const generatedLeaves: Leaf[] = Array.from({ length: 15 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      duration: 15 + Math.random() * 10,
      delay: Math.random() * 5,
      size: 20 + Math.random() * 15,
    }));
    
    setLeaves(generatedLeaves);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {leaves.map((leaf) => (
        <div
          key={leaf.id}
          className="leaf"
          style={{
            left: `${leaf.left}%`,
            width: `${leaf.size}px`,
            height: `${leaf.size}px`,
            animationDuration: `${leaf.duration}s, ${leaf.duration / 2}s`,
            animationDelay: `${leaf.delay}s`,
          }}
        />
      ))}
    </div>
  );
};

export default FallingLeaves;
