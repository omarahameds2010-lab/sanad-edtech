import { forwardRef } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

export interface FadeProps extends HTMLMotionProps<'div'> {
  /** Initial opacity */
  initial?: number;
  /** Target opacity */
  animate?: number;
  /** Exit opacity */
  exit?: number;
  /** Transition duration */
  duration?: number;
  /** Easing function */
  ease?: string | number[];
}

export const Fade = forwardRef<HTMLDivElement, FadeProps>(
  ({ initial = 0, animate = 1, exit = 0, duration = 200, ease = 'ease-out', children, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        initial={{ opacity: initial }}
        animate={{ opacity: animate }}
        exit={{ opacity: exit }}
        transition={{ duration, ease: 'ease-out' }}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

Fade.displayName = 'Fade';

export default Fade;