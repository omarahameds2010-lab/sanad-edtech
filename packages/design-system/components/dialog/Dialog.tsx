import { forwardRef } from 'react';
import { motion, AnimatePresence, HTMLMotionProps } from 'framer-motion';
import { XIcon } from '../icon/icons';

export interface DialogProps extends HTMLMotionProps<'div'> {
  /** Whether the dialog is open */
  open: boolean;
  /** Callback when dialog should close */
  onClose: () => void;
  /** Dialog title */
  title?: string;
  /** Dialog description */
  description?: string;
  /** Dialog size */
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  /** Show close button */
  showClose?: boolean;
  /** Close on overlay click */
  closeOnOverlayClick?: boolean;
  /** Close on Escape key */
  closeOnEscape?: boolean;
  /** Dialog content */
  children: React.ReactNode;
  /** Footer actions */
  footer?: React.ReactNode;
}

const sizeStyles = {
  sm: { maxWidth: '360px' },
  md: { maxWidth: '480px' },
  lg: { maxWidth: '640px' },
  xl: { maxWidth: '800px' },
  full: { maxWidth: '100%', width: '100%', height: '100%', borderRadius: 0 },
} as const;

const Dialog = forwardRef<HTMLDivElement, DialogProps>(
  ({
    open,
    onClose,
    title,
    description,
    size = 'md',
    showClose = true,
    closeOnOverlayClick = true,
    closeOnEscape = true,
    children,
    footer,
    ...props
  }, ref) => {
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
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
          }}
          onClick={handleOverlayClick}
          role="dialog"
          aria-modal="true"
          aria-labelledby={title ? 'dialog-title' : undefined}
          aria-describedby={description ? 'dialog-description' : undefined}
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
            onClick={closeOnOverlayClick ? onClose : undefined}
          />
          <motion.div
            ref={ref}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2, ease: 'ease-out' }}
            style={{
              width: '100%',
              maxWidth: sizeStyles[size].maxWidth,
              maxHeight: 'calc(100vh - 48px)',
              background: 'var(--color-surface-primary)',
              borderRadius: 'var(--radius-xl)',
              boxShadow: 'var(--shadow-2xl)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              maxHeight: 'calc(100vh - 48px)',
            }}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? 'dialog-title' : undefined}
            aria-describedby={description ? 'dialog-description' : undefined}
          >
            {(title || showClose) && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  padding: '20px 24px',
                  borderBottom: '1px solid var(--color-border-main)',
                  flexShrink: 0,
                }}
              >
                <div style={{ flex: 1 }}>
                  {title && (
                    <h2 id="dialog-title" style={{
                      margin: 0,
                      fontSize: '18px',
                      fontWeight: 600,
                      color: 'var(--color-text-primary)',
                      lineHeight: 1.3,
                    }}>
                      {title}
                    </h2>
                  )}
                  {description && (
                    <p id="dialog-description" style={{
                      margin: '4px 0 0',
                      fontSize: '14px',
                      color: 'var(--color-text-secondary)',
                      lineHeight: 1.5,
                    }}>
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
                    aria-label="Close dialog"
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
              <div
                style={{
                  padding: '16px 24px',
                  borderTop: '1px solid var(--color-border-main)',
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '12px',
                  flexShrink: 0,
                }}
              >
                {footer}
              </div>
            )}
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  }
);

Dialog.displayName = 'Dialog';

export { Dialog };
export type { DialogProps };