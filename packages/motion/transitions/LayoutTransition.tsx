import { forwardRef } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

export interface LayoutTransitionProps extends HTMLMotionProps<'div'> {
  /** Transition duration */
  duration?: number;
  /** Easing function */
  ease?: string | number[];
  /** Layout dependency */
  layoutDependency?: unknown;
}

export const LayoutTransition = forwardRef<HTMLDivElement, LayoutTransitionProps>(
  ({ duration = 300, ease = 'ease-in-out', layoutDependency, children, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        layout
        layoutDependency={layoutDependency}
        transition={{ duration: 0.3, ease: 'ease-in-out' }}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

LayoutTransition.displayName = 'LayoutTransition';

export default LayoutTransition;