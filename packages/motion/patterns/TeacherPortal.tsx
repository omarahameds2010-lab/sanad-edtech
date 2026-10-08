import { forwardRef } from 'react';
import { motion, AnimatePresence, HTMLMotionProps } from 'framer-motion';

export interface TeacherPortalProps extends HTMLMotionProps<'div'> {
  /** Teacher card data */
  teacher: {
    name: string;
    subject: string;
    avatar?: string;
    motif: 'orbit' | 'grid' | 'ink' | 'wave' | 'molecular' | 'graph';
    accentColor: string;
  };
  /** Callback when portal opens */
  onEnter?: () => void;
  /** Callback when portal closes */
  onExit?: () => void;
  /** Whether portal is open */
  isOpen: boolean;
  /** Close callback */
  onClose: () => void;
}

export const TeacherPortal = forwardRef<HTMLDivElement, TeacherPortalProps>(
  ({ teacher, isOpen, onEnter, onExit, onClose, children, ...props }, ref) => {
    const motifVariants = {
      orbit: {
        initial: { scale: 0.8, rotate: -180 },
        animate: { scale: 1, rotate: 0 },
        exit: { scale: 0.8, rotate: 180 },
      },
      grid: {
        initial: { scale: 0.8, skewX: 10 },
        animate: { scale: 1, skewX: 0 },
        exit: { scale: 0.8, skewX: -10 },
      },
      ink: {
        initial: { scale: 0.8, opacity: 0, y: 20 },
        animate: { scale: 1, opacity: 1 },
        exit: { scale: 0.8, opacity: 0, y: 20 },
      },
      wave: {
        initial: { pathLength: 0, opacity: 0 },
        animate: { pathLength: 1, opacity: 1 },
        exit: { pathLength: 0, opacity: 0 },
      },
      molecular: {
        initial: { scale: 0.5, opacity: 0 },
        animate: { scale: 1, opacity: 1 },
        exit: { scale: 0.5, opacity: 0 },
      },
      graph: {
        initial: { scale: 0.8, opacity: 0 },
        animate: { scale: 1, opacity: 1 },
        exit: { scale: 0.8, opacity: 0 },
      },
    };

    const motif = teacher.motif || 'grid';
    const variants = motifVariants[motif] || motifVariants.grid;

    return (
      <AnimatePresence mode="wait">
        {isOpen && (
          <motion.div
            ref={ref}
            initial="initial"
            animate="animate"
            exit="exit"
            variants={variants}
            transition={{ duration: 0.6, ease: 'ease-in-out' }}
            onAnimationComplete={onEnter}
            onExitComplete={onExit}
          >
            <motion.div
              className="teacher-portal-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              onClick={onClose}
              style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0,0,0,0.6)',
                backdropFilter: 'blur(8px)',
                zIndex: 999,
              }}
            />
            <motion.div
              className="teacher-portal-content"
              initial="initial"
              animate="animate"
              exit="exit"
              variants={variants}
              transition={{ duration: 0.6, ease: 'ease-in-out' }}
              style={{
                position: 'fixed',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                maxWidth: '90vw',
                maxHeight: '90vh',
                width: '800px',
                maxHeight: '600px',
                background: 'var(--color-surface-primary)',
                borderRadius: 'var(--radius-xl)',
                boxShadow: 'var(--shadow-2xl)',
                zIndex: 1000,
                overflow: 'hidden',
              }}
            >
              {/* Close button */}
              <button
                onClick={onClose}
                className="teacher-portal-close"
                style={{
                  position: 'absolute',
                  top: '16px',
                  right: '16px',
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: 'var(--color-surface-secondary)',
                  border: '1px solid var(--color-border-main)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  zIndex: 10,
                }}
                aria-label="Close teacher space"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>

              {/* Teacher Header */}
              <div className="teacher-portal-header" style={{
                padding: '24px',
                borderBottom: '1px solid var(--color-border-main)',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
              }}>
                <div className="teacher-avatar" style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: `linear-gradient(135deg, ${teacher.accentColor}20, ${teacher.accentColor}40)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  overflow: 'hidden',
                }}>
                  {teacher.avatar ? (
                    <img src={teacher.avatar} alt={teacher.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div className="teacher-avatar-motif" style={{
                      fontSize: '24px',
                      color: teacher.accentColor,
                    }}>
                      {teacher.motif === 'orbit' && '⟳'}
                      {teacher.motif === 'grid' && '⊞'}
                      {teacher.motif === 'ink' && '✎'}
                      {teacher.motif === 'wave' && '∼'}
                      {teacher.motif === 'molecular' && '⚛'}
                      {teacher.motif === 'graph' && '◈'}
                    </div>
                  )}
                </div>
                <div>
                  <h2 style={{
                    margin: 0,
                    fontSize: '24px',
                    fontWeight: 700,
                    color: 'var(--color-text-primary)',
                  }}>
                    {teacher.name}
                  </h2>
                  <p style={{
                    margin: '4px 0 0',
                    fontSize: '14px',
                    color: 'var(--color-text-muted)',
                  }}>
                    {teacher.subject}
                  </p>
                </div>
              </div>

              {/* Teacher Space Content */}
              <div className="teacher-portal-body" style={{
                padding: '24px',
                overflowY: 'auto',
                maxHeight: 'calc(100% - 140px)',
              }}>
                {children}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }
);

TeacherPortal.displayName = 'TeacherPortal';

export default TeacherPortal;