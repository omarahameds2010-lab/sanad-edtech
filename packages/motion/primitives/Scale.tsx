import { forwardRef } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

export interface ScaleProps extends HTMLMotionProps<'div'> {
  /** Initial scale */
  initial?: number;
  /** Target scale */
  animate?: number;
  /** Exit scale */
  exit?: number;
  /** Transition duration */
  duration?: number;
  /** Easing function */
  ease?: string | number[];
  /** Transform origin */
  origin?: string;
}

export const Scale = forwardRef<HTMLDivElement, ScaleProps>(
  ({ initial = 0.95, animate = 1, exit = 0.95, duration = 150, ease = 'ease-out', origin = 'center', children, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        initial={{ scale: initial, opacity: 0 }}
        animate={{ scale: animate, opacity: 1 }}
        exit={{ scale: exit, opacity: 0 }}
        transition={{ duration: 150, ease: 'ease-out' }}
        style={{ transformOrigin: origin }}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

Scale.displayName = 'Scale';

export default Scale;