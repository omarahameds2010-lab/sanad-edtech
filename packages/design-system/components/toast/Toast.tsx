import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XIcon } from '../icon/icons';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info' | 'default';
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
  dismissible?: boolean;
}

interface ToastContextValue {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => string;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast = { ...toast, id };
    setToasts(prev => [...prev, newToast]);
    return id;
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

interface ToastContainerProps {
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
  gap?: number;
  maxToasts?: number;
}

const positionStyles = {
  'top-right': { top: '20px', right: '20px', left: 'auto', bottom: 'auto' },
  'top-left': { top: '20px', left: '20px', right: 'auto', bottom: 'auto' },
  'bottom-right': { bottom: '20px', right: '20px', top: 'auto', left: 'auto' },
  'bottom-left': { bottom: '20px', left: '20px', top: 'auto', right: 'auto' },
  'top-center': { top: '20px', left: '50%', transform: 'translateX(-50%)', right: 'auto', bottom: 'auto' },
  'bottom-center': { bottom: '20px', left: '50%', transform: 'translateX(-50%)', top: 'auto', right: 'auto' },
};

const ToastContainer = ({ position = 'top-right', gap = 8, maxToasts = 5 }: ToastContainerProps) => {
  const { toasts } = useContext(ToastContext);
  const visibleToasts = toasts.slice(-maxToasts);

  return (
    <div
      style={{
        position: 'fixed',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        pointerEvents: 'none',
        ...positionStyles[position],
        padding: '16px',
      } as React.CSSProperties}
      aria-live="polite"
      aria-atomic="true"
    >
      <AnimatePresence>
        {visibleToasts.map(toast => (
          <Toast key={toast.id} toast={toast} />
        ))}
      </AnimatePresence>
    </div>
  );
}

const typeStyles = {
  success: { bg: 'var(--color-success-bg)', border: 'var(--color-success-border)', iconColor: 'var(--color-success)', icon: '✓' },
  error: { bg: 'var(--color-error-bg)', border: 'var(--color-error-border)', iconColor: 'var(--color-error)', icon: '✕' },
  warning: { bg: 'var(--color-warning-bg)', border: 'var(--color-warning-border)', iconColor: 'var(--color-warning)', icon: '⚠' },
  info: { bg: 'var(--color-info-bg)', border: 'var(--color-info-border)', iconColor: 'var(--color-info)', icon: 'ℹ' },
  default: { bg: 'var(--color-surface-primary)', border: 'var(--color-border-main)', iconColor: 'var(--color-text-primary)', icon: 'ℹ' },
};

const Toast = ({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) => {
  const style = typeStyles[toast.type] || typeStyles.default;
  const duration = toast.duration ?? 5000;

  return (
    <motion.div
      initial={{ opacity: 0, x: 300, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 300, scale: 0.95 }}
      transition={{ duration: 0.3, ease: 'ease-out' }}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px',
        padding: '16px',
        background: style.bg,
        border: '1px solid ' + style.border,
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-lg)',
        minWidth: '300px',
        maxWidth: '420px',
        width: '100%',
      }
      onMouseEnter={() => clearTimeout(timeoutRef.current)}
      onMouseLeave={() => {
        if (duration > 0) {
          timeoutRef.current = setTimeout(() => onRemove(toast.id), duration);
        }
      }}
      onAnimationComplete={() => {
        if (duration > 0) {
          timeoutRef.current = setTimeout(() => onRemove(toast.id), duration);
        }
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '24px', height: '24px', borderRadius: '50%', background: 'rgba(0,0,0,0.1)', color: style.iconColor, fontSize: '16px', fontWeight: 'bold', flexShrink: 0 }}>
        {style.icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontWeight: 600, fontSize: '14px', color: 'var(--color-text-primary)' }}>
          {toast.title}
        </p>
        {toast.message && (
          <p style={{ marginTop: '4px', marginBottom: 0, fontSize: '13px', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
            {toast.message}
          </p>
        )}
      </div>
      {toast.dismissible !== false && (
        <button
          onClick={() => onRemove(toast.id)}
          style={{
            padding: '4px',
            border: 'none',
            background: 'transparent',
            color: 'var(--color-text-muted)',
            cursor: 'pointer',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '24px',
            height: '24px',
            flexShrink: 0,
          }}
          aria-label="Dismiss"
        >
          <XIcon size={16} />
        </button>
      )}
      {toast.action && (
        <button
          onClick={() => {
            toast.action.onClick();
            if (!toast.dismissible) removeToast(toast.id);
          }}
          style={{
            marginTop: '8px',
            padding: '6px 12px',
            fontSize: '12px',
            fontWeight: 500,
            color: 'var(--color-primary)',
            background: 'transparent',
            border: '1px solid var(--color-primary)',
            borderRadius: 'var(--radius-sm)',
            cursor: 'pointer',
          }}
        >
          {toast.action.label}
        </button>
      )}
    </motion.div>
  );