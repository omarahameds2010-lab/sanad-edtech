import { forwardRef } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

export interface RevealProps extends HTMLMotionProps<'div'> {
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
  initial?: number;
  animate?: number;
  stagger?: number;
  duration?: number;
  ease?: string | number[];
}

export const Reveal = forwardRef<HTMLDivElement, RevealProps>(
  ({ 
    direction = 'up', 
    initial = 0, 
    animate = 1, 
    stagger = 0.1, 
    duration = 400, 
    ease = 'ease-out', 
    children, 
    ...props 
  }, ref) => {
    const getInitial = () => {
      switch (direction) {
        case 'up': return { y: 30, opacity: 0 };
        case 'down': return { y: -30, opacity: 0 };
        case 'left': return { x: 30, opacity: 0 };
        case 'right': return { x: -30, opacity: 0 };
        default: return { opacity: 0 };
      }
    };

    return (
      motion.div
        ref={ref}
        initial={getInitial()}
        animate={{ opacity: 1, x: 0, y: 0 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.4, ease: 'ease-out' }}
      >
        {children}
      </motion.div>
    );
  }
);

Reveal.displayName = 'Reveal';

export default Reveal;