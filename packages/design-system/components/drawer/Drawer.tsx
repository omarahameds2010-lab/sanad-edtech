import { forwardRef } from 'react';
import { motion, AnimatePresence, HTMLMotionProps } from 'framer-motion';
import { XIcon } from '../icon/icons';

export interface DrawerProps extends HTMLMotionProps<'div'> {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  position?: 'left' | 'right' | 'top' | 'bottom';
  showClose?: boolean;
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

const positionStyles = {
  left: { left: 0, right: 'auto', transform: 'translateX(-100%)' },
  right: { right: 0, left: 'auto', transform: 'translateX(100%)' },
  top: { top: 0, bottom: 'auto', transform: 'translateY(-100%)' },
  bottom: { bottom: 0, top: 'auto', transform: 'translateY(100%)' },
} as const;

const sizeStyles = {
  sm: { width: '320px', maxWidth: '100%' },
  md: { width: '480px', maxWidth: '100%' },
  lg: { width: '640px', maxWidth: '100%' },
  xl: { width: '800px', maxWidth: '100%' },
  full: { width: '100%', height: '100%', maxWidth: '100%', maxHeight: '100%' },
} as const;

const Drawer = forwardRef<HTMLDivElement, DrawerProps>(
  ({ open, onClose, title, description, size = 'md', position = 'right', showClose = true, closeOnOverlayClick = true, closeOnEscape = true, children, footer, ...props }, ref) => {
    if (!open) return null;

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Escape' && closeOnEscape) {
        onClose();
      }
    };

    const handleOverlayClick = (e: React.MouseEvent) => {
      if (e.target === e.currentTarget && closeOnOverlayClick) {
        onClose();
      }
    };

    const positionStyle = positionStyles[position];
    const sizeStyle = sizeStyles[size];

    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            alignItems: position === 'left' || position === 'right' ? 'stretch' : 'center',
            justifyContent: position === 'left' ? 'flex-start' : position === 'right' ? 'flex-end' : 'center',
            padding: '24px',
          }}
          onClick={handleOverlayClick}
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.5)',
              backdropFilter: 'blur(4px)',
            }}
            onClick={handleOverlayClick}
          />
          <motion.div
            ref={ref}
            initial={{ opacity: 0, ...positionStyle }}
            animate={{ opacity: 1, transform: 'translate(0, 0)' }}
            exit={{ opacity: 0, ...positionStyle }}
            transition={{ duration: 0.3, ease: 'ease-out' }}
            style={{
              width: sizeStyle.width,
              maxWidth: sizeStyle.maxWidth,
              height: sizeStyle.height || (position === 'top' || position === 'bottom' ? 'auto' : '100%'),
              maxHeight: position === 'top' || position === 'bottom' ? '100%' : '100%',
              background: 'var(--color-surface-primary)',
              borderRadius: position === 'left' || position === 'right' ? '0 var(--radius-xl) var(--radius-xl) 0' : 'var(--radius-xl) var(--radius-xl) 0 0',
              boxShadow: 'var(--shadow-2xl)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              maxHeight: '100vh',
            }}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? 'drawer-title' : undefined}
            aria-describedby={description ? 'drawer-description' : undefined}
          >
            {(title || showClose) && (
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid var(--color-border-main)', flexShrink: 0 }}>
                <div>
                  {title && (
                    <h2 id="drawer-title" style={{ margin: 0, fontSize: 18, fontWeight: 600, color: 'var(--color-text-primary)', lineHeight: 1.3 }}>
                      {title}
                    </h2>
                  )}
                  {description && (
                    <p style={{ marginTop: 4, fontSize: 14, color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                      {description}
                    </p>
                  )}
                </div>
                {showClose && (
                  <button
                    onClick={onClose}
                    style={{
                      padding: '8px',
                      border: 'none',
                      background: 'transparent',
                      color: 'var(--color-text-muted)',
                      cursor: 'pointer',
                      borderRadius: 'var(--radius-md)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '32px',
                      height: '32px',
                      flexShrink: 0,
                    }}
                    aria-label="Close drawer"
                  >
                    <XIcon size={20} />
                  </button>
                )}
              </div>
            )}
            <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
              {children}
            </div>
            {footer && (
              <div style={{ padding: '16px 24px', borderTop: '1px solid var(--color-border-main)', display: 'flex', justifyContent: 'flex-end', gap: '12px', flexShrink: 0 }}>
                {footer}
              </div>
            )}
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  }
);

Drawer.displayName = 'Drawer';

export { Drawer };
export type { DrawerProps };