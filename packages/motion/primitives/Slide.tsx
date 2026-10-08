import { forwardRef } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

export interface SlideProps extends HTMLMotionProps<'div'> {
  /** Slide direction */
  direction?: 'up' | 'down' | 'left' | 'right';
  /** Initial offset */
  initial?: number;
  /** Target offset */
  animate?: number;
  /** Exit offset */
  exit?: number;
  /** Transition duration */
  duration?: number;
  /** Easing function */
  ease?: string | number[];
}

export const Slide = forwardRef<HTMLDivElement, SlideProps>(
  ({ 
    direction = 'up', 
    initial = 20, 
    animate = 0, 
    exit = -20, 
    duration = 300, 
    ease = 'ease-out', 
    children, 
    ...props 
  }, ref) => {
    const getInitial = () => {
      switch (direction) {
        case 'up': return { y: initial, opacity: 0 };
        case 'down': return { y: -initial, opacity: 0 };
        case 'left': return { x: initial, opacity: 0 };
        case 'right': return { x: -initial, opacity: 0 };
      }
    };

    const getAnimate = () => ({
      opacity: 1,
      x: 0,
      y: 0,
    });

    const getExit = () => {
      switch (direction) {
        case 'up': return { y: -initial, opacity: 0 };
        case 'down': return { y: initial, opacity: 0 };
        case 'left': return { x: -initial, opacity: 0 };
        case 'right': return { x: initial, opacity: 0 };
      }
    };

    return (
      <motion.div
        initial={getInitial()}
        animate={getAnimate()}
        exit={getExit()}
        transition={{ duration: 0.3, ease: 'ease-out' }}
      >
        {children}
      </motion.div>
    );
  }
);

Slide.displayName = 'Slide';

export default Slide;