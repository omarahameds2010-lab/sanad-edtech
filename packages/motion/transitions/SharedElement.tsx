import { forwardRef } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

export interface SharedElementProps extends HTMLMotionProps<'div'> {
  /** Unique ID for matching shared elements */
  sharedId: string;
  /** Transition duration */
  duration?: number;
  /** Easing function */
  ease?: string | number[];
}

export const SharedElement = forwardRef<HTMLDivElement, SharedElementProps>(
  ({ sharedId, duration = 400, ease = 'ease-in-out', children, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        layoutId={sharedId}
        transition={{ duration: 0.4, ease: 'ease-in-out' }}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

SharedElement.displayName = 'SharedElement';

export default SharedElement;