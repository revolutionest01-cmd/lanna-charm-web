import { ReactNode, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

interface PageTransitionProps {
  children: ReactNode;
}

const PageTransition = ({ children }: PageTransitionProps) => {
  const location = useLocation();
  const [displayChildren, setDisplayChildren] = useState(children);
  const [transitionStage, setTransitionStage] = useState<'enter' | 'exit'>('enter');

  useEffect(() => {
    if (children !== displayChildren) {
      // Start exit animation
      setTransitionStage('exit');
    }
  }, [children, displayChildren]);

  const handleAnimationEnd = () => {
    if (transitionStage === 'exit') {
      setDisplayChildren(children);
      setTransitionStage('enter');
      // Scroll to top on page change
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  };

  return (
    <div
      className={`page-transition ${transitionStage === 'enter' ? 'page-enter' : 'page-exit'}`}
      onAnimationEnd={handleAnimationEnd}
    >
      {displayChildren}
    </div>
  );
};

export default PageTransition;
