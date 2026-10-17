import { forwardRef } from "react";
import { motion, AnimatePresence, HTMLMotionProps } from "framer-motion";

export interface PageTransitionProps extends HTMLMotionProps<"div"> {
  pageKey?: string;
  type?: "fade" | "slide" | "push" | "fade-scale";
  duration?: number;
  ease?: string | number[];
}

export const PageTransition = forwardRef<HTMLDivElement, PageTransitionProps>(
  (
    {
      pageKey,
      type = "fade",
      duration = 300,
      ease = "ease-in-out",
      children,
      ...props
    },
    ref,
  ) => {
    const variants = {
      fade: {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
      },
      slide: {
        initial: { x: 30, opacity: 0 },
        animate: { x: 0, opacity: 1 },
        exit: { x: -30, opacity: 0 },
      },
      push: {
        initial: { x: 30, opacity: 0 },
        animate: { x: 0, opacity: 1 },
        exit: { x: -30, opacity: 0 },
      },
      "fade-scale": {
        initial: { scale: 0.95, opacity: 0 },
        animate: { scale: 1, opacity: 1 },
        exit: { scale: 0.95, opacity: 0 },
      },
    };

    return (
      <AnimatePresence mode="wait">
        <motion.div
          ref={ref}
          key={pageKey}
          initial={variants[type]?.initial}
          animate={variants[type]?.animate}
          exit={variants[type]?.exit}
          transition={{ duration: 0.3, ease: "ease-in-out" }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    );
  },
);

PageTransition.displayName = "PageTransition";

export default PageTransition;
