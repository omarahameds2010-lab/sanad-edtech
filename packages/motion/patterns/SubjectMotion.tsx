import { forwardRef } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

export interface SubjectMotionProps extends HTMLMotionProps<'div'> {
  /** Subject type */
  subject: 'math' | 'physics' | 'arabic' | 'english' | 'chemistry' | 'computer-science';
  /** Element to animate */
  children: React.ReactNode;
  /** Whether to animate on mount */
  animateOnMount?: boolean;
  /** Custom duration override */
  duration?: number;
}

const subjectConfigs = {
  math: {
    duration: 300,
    ease: 'cubic-bezier(0.2, 0, 0, 1)',
    enter: { x: 0, y: 0, rotate: 0, scale: 1 },
    exit: { x: 0, y: 0, rotate: 0, scale: 1 },
    hover: { rotate: 2, scale: 1.02 },
    tap: { scale: 0.98 },
    path: {
      initial: { pathLength: 0, opacity: 0 },
      animate: { pathLength: 1, opacity: 1 },
      exit: { pathLength: 0, opacity: 0 },
    },
  },
  physics: {
    duration: 400,
    ease: 'cubic-bezier(0.25, 0.8, 0.25, 1)',
    enter: { x: 0, y: 0, scale: 1 },
    exit: { x: 0, y: 0, scale: 1 },
    hover: { y: -4, scale: 1.02 },
    tap: { scale: 0.98 },
    path: {
      initial: { pathLength: 0, opacity: 0.5 },
      animate: { pathLength: 1, opacity: 1 },
      exit: { pathLength: 0, opacity: 0 },
    },
    wave: {
      initial: { y: 0 },
      animate: { y: [0, -8, 8, -4, 0] },
      transition: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
    },
  },
  arabic: {
    duration: 350,
    ease: 'cubic-bezier(0.4, 0, 0.2, 1)',
    enter: { x: 0, y: 0, opacity: 1 },
    exit: { opacity: 0 },
    hover: { x: 2, y: -2 },
    tap: { scale: 0.98 },
    text: {
      initial: { x: -20, opacity: 0 },
      animate: { x: 0, opacity: 1 },
      exit: { x: 20, opacity: 0 },
    },
  },
  english: {
    duration: 300,
    ease: 'cubic-bezier(0.2, 0, 0, 1)',
    enter: { opacity: 0, y: 20 },
    exit: { opacity: 0, y: -20 },
    hover: { y: -4 },
    tap: { scale: 0.98 },
  },
  chemistry: {
    duration: 400,
    ease: 'cubic-bezier(0.25, 0.8, 0.25, 1)',
    enter: { scale: 0.8, opacity: 0 },
    exit: { scale: 0.8, opacity: 0 },
    hover: { scale: 1.05 },
    tap: { scale: 0.95 },
    bond: {
      initial: { pathLength: 0, opacity: 0 },
      animate: { pathLength: 1, opacity: 1 },
      exit: { pathLength: 0, opacity: 0 },
    },
  },
  'computer-science': {
    duration: 300,
    ease: 'cubic-bezier(0.2, 0, 0, 1)',
    enter: { opacity: 0, scale: 0.9 },
    exit: { opacity: 0, scale: 1.1 },
    hover: { scale: 1.02 },
    tap: { scale: 0.98 },
    node: {
      initial: { scale: 0, opacity: 0 },
      animate: { scale: 1, opacity: 1 },
      exit: { scale: 0, opacity: 0 },
    },
    edge: {
      initial: { pathLength: 0, opacity: 0 },
      animate: { pathLength: 1, opacity: 1 },
      exit: { pathLength: 0, opacity: 0 },
    },
  },
} as const;

export interface SubjectMotionProps extends HTMLMotionProps<'div'> {
  subject: 'math' | 'physics' | 'arabic' | 'english' | 'chemistry' | 'computer-science';
  children: React.ReactNode;
  animateOnMount?: boolean;
  duration?: number;
}

export const SubjectMotion = forwardRef<HTMLDivElement, SubjectMotionProps>(
  ({ subject, children, animateOnMount = true, duration, ...props }, ref) => {
    const config = subjectConfigs[subject];

    const baseTransition = {
      duration: config.duration || 300,
      ease: config.ease,
    };

    return (
      <motion.div
        ref={ref}
        initial={animateOnMount ? config.enter : false}
        animate={config.enter}
        exit={config.exit}
        transition={baseTransition}
        whileHover={config.hover}
        whileTap={config.tap}
      >
        {children}
      </motion.div>
    );
  }
);

SubjectMotion.displayName = 'SubjectMotion';

export default SubjectMotion;