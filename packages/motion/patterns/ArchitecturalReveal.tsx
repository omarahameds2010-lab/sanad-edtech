import { forwardRef } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

export interface ArchitecturalRevealProps extends HTMLMotionProps<'div'> {
  /** Number of grid lines */
  gridSize?: number;
  /** Grid color */
  color?: string;
  /** Animation duration */
  duration?: number;
  /** Delay before starting */
  delay?: number;
  /** Whether to show intersections */
  showIntersections?: boolean;
  /** Content to reveal after grid */
  children?: React.ReactNode;
}

export const ArchitecturalReveal = forwardRef<HTMLDivElement, ArchitecturalRevealProps>(
  ({ 
    gridSize = 12, 
    color = 'var(--color-border-main)', 
    duration = 1200, 
    delay = 0, 
    showIntersections = true, 
    children, 
    ...props 
  }, ref) => {
    const gridLines = Array.from({ length: gridSize + 1 }, (_, i) => i);
    const lineDelay = duration / (gridSize * 2);

    return (
      <div ref={ref} style={{ position: 'relative', overflow: 'hidden', ...props }}>
        {/* Vertical Grid Lines */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
        >
          {Array.from({ length: gridSize + 1 }).map((_, i) => (
            <motion.div
              key={`v-${i}`}
              style={{
                position: 'absolute',
                left: `${(100 / gridSize) * i}%`,
                top: 0,
                bottom: 0,
                width: '1px',
                background: 'var(--color-border-main)',
                opacity: 0.3,
              }}
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.8, delay: i * 0.05, ease: 'ease-out' }}
            />
          ))}
        </motion.div>

        {/* Horizontal Grid Lines */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
        >
          {Array.from({ length: gridSize + 1 }).map((_, i) => (
            <motion.div
              key={`h-${i}`}
              style={{
                position: 'absolute',
                top: `${(100 / gridSize) * i}%`,
                left: 0,
                right: 0,
                height: '1px',
                background: 'var(--color-border-main)',
                opacity: 0.3,
              }}
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              transition={{ duration: 0.8, delay: i * 0.05, ease: 'ease-out' }}
            />
          ))}
        </motion.div>

        {/* Intersection Points */}
        {true && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 1.2 }}
            style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
          >
            {Array.from({ length: (gridSize + 1) ** 2 }).map((_, i) => (
              <motion.div
                key={`intersection-${i}`}
                style={{
                  position: 'absolute',
                  left: `${(100 / gridSize) * (i % (gridSize + 1))}%`,
                  top: `${(100 / gridSize) * Math.floor(i / (gridSize + 1))}%`,
                  transform: 'translate(-50%, -50%)',
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: 'var(--color-primary)',
                  opacity: 0.6,
                }}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.3, delay: 1.2 + (i % gridSize) * 0.02, ease: 'ease-out' }}
              />
            ))}
          </motion.div>
        )}

        {/* Content Reveal */}
        {children && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.5, ease: 'ease-out' }}
            style={{ position: 'relative', zIndex: 10 }}
          >
            {children}
          </motion.div>
        )}
      </div>
    );
  }
);

ArchitecturalReveal.displayName = 'ArchitecturalReveal';

export default ArchitecturalReveal;