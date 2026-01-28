import { ReactNode, Children, cloneElement, isValidElement } from 'react';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { cn } from '@/lib/utils';

type AnimationType = 'fade-up' | 'fade-down' | 'fade-left' | 'fade-right' | 'zoom-in';

interface StaggerRevealProps {
  children: ReactNode;
  className?: string;
  animation?: AnimationType;
  staggerDelay?: number;
  duration?: number;
  threshold?: number;
}

const StaggerReveal = ({
  children,
  className = '',
  animation = 'fade-up',
  staggerDelay = 100,
  duration = 500,
  threshold = 0.1,
}: StaggerRevealProps) => {
  const { ref, isVisible } = useScrollAnimation({ threshold });

  const animationStyles: Record<AnimationType, { initial: string; animate: string }> = {
    'fade-up': {
      initial: 'opacity-0 translate-y-6',
      animate: 'opacity-100 translate-y-0',
    },
    'fade-down': {
      initial: 'opacity-0 -translate-y-6',
      animate: 'opacity-100 translate-y-0',
    },
    'fade-left': {
      initial: 'opacity-0 translate-x-6',
      animate: 'opacity-100 translate-x-0',
    },
    'fade-right': {
      initial: 'opacity-0 -translate-x-6',
      animate: 'opacity-100 translate-x-0',
    },
    'zoom-in': {
      initial: 'opacity-0 scale-90',
      animate: 'opacity-100 scale-100',
    },
  };

  const { initial, animate } = animationStyles[animation];

  const childArray = Children.toArray(children);

  return (
    <div ref={ref} className={className}>
      {childArray.map((child, index) => {
        if (isValidElement(child)) {
          return cloneElement(child as React.ReactElement<{ className?: string; style?: React.CSSProperties }>, {
            className: cn(
              (child.props as { className?: string }).className,
              'transition-all ease-out',
              isVisible ? animate : initial
            ),
            style: {
              ...(child.props as { style?: React.CSSProperties }).style,
              transitionDuration: `${duration}ms`,
              transitionDelay: `${index * staggerDelay}ms`,
            },
          });
        }
        return child;
      })}
    </div>
  );
};

export default StaggerReveal;
