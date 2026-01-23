import { useMultiParallax } from '@/hooks/useParallax';

const ParallaxBackground = () => {
  const { getOffset } = useMultiParallax();

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {/* Large warm orb - moves slowly */}
      <div 
        className="absolute w-[600px] h-[600px] rounded-full bg-gradient-to-br from-[hsl(var(--highlight)/0.06)] via-[hsl(var(--highlight)/0.03)] to-transparent blur-3xl transition-transform duration-100 ease-out"
        style={{ 
          top: '10%',
          left: '5%',
          transform: `translate3d(0, ${getOffset(0.08, 'down')}px, 0)` 
        }}
      />
      
      {/* Green accent orb - medium speed */}
      <div 
        className="absolute w-[450px] h-[450px] rounded-full bg-gradient-to-tl from-[hsl(var(--lanna-leaf)/0.05)] via-[hsl(var(--lanna-leaf)/0.02)] to-transparent blur-3xl transition-transform duration-100 ease-out"
        style={{ 
          top: '40%',
          right: '0%',
          transform: `translate3d(0, ${getOffset(0.12, 'down')}px, 0)` 
        }}
      />
      
      {/* Bottom earth tone orb - faster */}
      <div 
        className="absolute w-[700px] h-[350px] rounded-full bg-gradient-to-tr from-[hsl(var(--gradient-accent)/0.08)] via-[hsl(var(--lanna-earth)/0.04)] to-transparent blur-3xl transition-transform duration-100 ease-out"
        style={{ 
          top: '70%',
          left: '15%',
          transform: `translate3d(0, ${getOffset(0.15, 'down')}px, 0)` 
        }}
      />
      
      {/* Small floating accent - fastest, opposite direction */}
      <div 
        className="absolute w-[300px] h-[300px] rounded-full bg-gradient-to-b from-[hsl(var(--highlight)/0.04)] to-transparent blur-2xl transition-transform duration-100 ease-out"
        style={{ 
          top: '25%',
          right: '20%',
          transform: `translate3d(0, ${getOffset(0.05, 'up')}px, 0)` 
        }}
      />
      
      {/* Subtle mid-page glow */}
      <div 
        className="absolute w-[500px] h-[500px] rounded-full bg-gradient-to-br from-[hsl(var(--gradient-mid)/0.1)] to-transparent blur-3xl transition-transform duration-100 ease-out"
        style={{ 
          top: '55%',
          left: '40%',
          transform: `translate3d(${getOffset(0.03, 'down')}px, ${getOffset(0.1, 'down')}px, 0)` 
        }}
      />

      {/* Deep background gradient layer */}
      <div 
        className="absolute inset-0 opacity-30 transition-transform duration-100 ease-out"
        style={{ 
          background: `radial-gradient(ellipse 100% 80% at 50% 20%, hsl(var(--gradient-start) / 0.5), transparent)`,
          transform: `translate3d(0, ${getOffset(0.02, 'down')}px, 0)` 
        }}
      />
    </div>
  );
};

export default ParallaxBackground;
