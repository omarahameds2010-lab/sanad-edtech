import { forwardRef, useState, useRef, useEffect, useId } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { ChevronDownIcon, CheckIcon, XIcon } from '../../icon/icons';
import { useId } from 'react';

export interface FormFieldProps {
  label?: string;
  helperText?: string;
  error?: string;
  required?: boolean;
  name: string;
  value?: any;
  onChange?: (value: any) => void;
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'textarea' | 'select';
  placeholder?: string;
  disabled?: boolean;
  readOnly?: boolean;
  options?: Array<{ value: string; label: string; disabled?: boolean }>;
  rows?: number;
  inputMode?: 'text' | 'email' | 'numeric' | 'tel' | 'url' | 'search';
  autoComplete?: string;
  maxLength?: number;
  min?: number;
  max?: number;
  step?: number;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
  fullWidth?: boolean;
  disableAnimation?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
  id?: string;
  value?: any;
  onChange?: (value: any) => void;
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'textarea' | 'select';
  placeholder?: string;
  disabled?: boolean;
  readOnly?: boolean;
  options?: Array<{ value: string; label: string; disabled?: boolean }>;
  rows?: number;
  inputMode?: 'text' | 'email' | 'numeric' | 'tel' | 'url' | 'search';
  autoComplete?: string;
  maxLength?: number;
  min?: number;
  max?: number;
  step?: number;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
  fullWidth?: boolean;
  disableAnimation?: boolean;
  name: string;
  onChange?: (value: any) => void;
  label?: string;
  helperText?: string;
  error?: string;
  required?: boolean;
  id?: string;
  disabled?: boolean;
  readOnly?: boolean;
  options?: Array<{ value: string; label: string; disabled?: boolean }>;
  rows?: number;
  inputMode?: 'text' | 'email' | 'numeric' | 'tel' | 'url' | 'search';
  autoComplete?: string;
  maxLength?: number;
  min?: number;
  max?: number;
  step?: number;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
  fullWidth?: boolean;
  disableAnimation?: boolean;
}

const FormField = forwardRef<HTMLDivElement, FormFieldProps>(
  (
    {
      label,
      helperText,
      error,
      required = false,
      name,
      value,
      onChange,
      type = 'text',
      placeholder,
      disabled = false,
      readOnly = false,
      options,
      rows = 3,
      inputMode,
      autoComplete,
      maxLength,
      min,
      max,
      step,
      prefix,
      suffix,
      fullWidth = false,
      disableAnimation = false,
      id,
      disabled = false,
      readOnly = false,
      required = false,
      options,
      rows = 3,
      inputMode,
      autoComplete,
      maxLength,
      min,
      max,
      step,
      prefix,
      suffix,
      fullWidth = false,
      disableAnimation = false,
      name,
      onChange,
      ...props
    },
    ref
  ) => {
    const inputId = useId();
    const errorId = `${inputId}-error`;
    const helperId = `${inputId}-helper`;

    const hasError = !!error;

    const baseInputStyles = {
      width: fullWidth ? '100%' : 'auto',
      fontFamily: 'var(--font-sans)',
      fontSize: 'var(--text-md)',
      fontWeight: 400,
      lineHeight: 'var(--leading-normal)',
      color: 'var(--color-text-primary)',
      backgroundColor: 'var(--color-bg-primary)',
      border: '1px solid var(--color-border-main)',
      borderRadius: 'var(--radius-md)',
      outline: 'none',
      transition: 'all var(--motion-fast) var(--ease-standard)',
      backgroundColor: 'var(--color-bg-primary)',
      color: 'var(--color-text-primary)',
      width: fullWidth ? '100%' : 'auto',
    };

    const hasError = !!error;

    const renderInput = () => {
      const commonProps = {
        id,
        name,
        value: value ?? '',
        onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
          onChange?.(e.target.value);
        },
        disabled,
        readOnly,
        required,
        maxLength,
        min,
        max,
        step,
        inputMode,
        autoComplete,
        'aria-invalid': hasError,
        'aria-describedby': `${error ? 'error' : ''} ${helperText ? 'helper' : ''}`.trim() || undefined,
        'aria-required': required,
        disabled,
        readOnly,
      };

      if (type === 'textarea') {
        return (
          <motion.textarea
            {...commonProps}
            style={{
              ...baseStyles,
              minHeight: rows * 24,
              resize: 'vertical',
              padding: '10px 14px',
              fontSize: '14px',
              borderColor: error ? 'var(--color-error)' : 'var(--color-border-main)',
              boxShadow: error ? '0 0 0 2px var(--color-error-bg)' : 'none',
            } as React.CSSProperties}
            {...props}
          />
        );
      }

      if (type === 'select') {
        return (
          <motion.select
            {...commonProps}
            style={{
              ...baseStyles,
              paddingRight: '40px',
              appearance: 'none',
              backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%23666%22 stroke-width=%222%22%3E%3Cpath%20d=%22M6%209l6%206%206-6%22/%3E%3C/svg%3E")',
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 12px center',
              backgroundSize: '20px',
              paddingRight: '40px',
            } as React.CSSProperties)
            {...props}
          />
        );
      }

      return (
        <motion.input
          {...commonProps}
          style={{
            ...baseStyles,
            paddingLeft: prefix ? '40px' : undefined,
            paddingRight: suffix ? '40px' : undefined,
            borderColor: error ? 'var(--color-error)' : 'var(--color-border-main)',
            boxShadow: error ? '0 0 0 2px var(--color-error-bg)' : 'none',
          } as React.CSSProperties>
          {...props}
        />
      );
    };

    const commonProps = {
      id,
      name,
      value: value ?? '',
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        onChange?.(e.target.value);
      },
      disabled,
      readOnly,
      required,
      maxLength,
      min,
      max,
      step,
      inputMode,
      autoComplete,
      'aria-invalid': hasError,
      'aria-describedby': `${error ? errorId : ''} ${helperText ? helperId : ''}`.trim() || undefined,
      'aria-required': required,
      disabled,
      readOnly,
    };

    const baseStyles = {
      width: fullWidth ? '100%' : 'auto',
      fontFamily: 'var(--font-sans)',
      fontSize: 'var(--text-md)',
      fontWeight: 400,
      lineHeight: 'var(--leading-normal)',
      color: 'var(--color-text-primary)',
      backgroundColor: 'var(--color-bg-primary)',
      border: '1px solid var(--color-border-main)',
      borderRadius: 'var(--radius-md)',
      outline: 'none',
      transition: 'all var(--motion-fast) var(--ease-standard)',
      backgroundColor: 'var(--color-bg-primary)',
      color: 'var(--color-text-primary)',
      padding: '10px 14px',
      fontSize: '14px',
      height: '40px',
      boxSizing: 'border-box',
    };

    const hasError = !!error;

    const inputStyles = {
      ...baseStyles,
      borderColor: error ? 'var(--color-error)' : 'var(--color-border-main)',
      boxShadow: error ? '0 0 0 2px var(--color-error-bg)' : 'none',
    };

    const renderInput = () => {
      if (type === 'textarea') {
        return (
          <motion.textarea
            {...commonProps}
            style={{
              ...baseStyles,
              minHeight: rows * 24,
              resize: 'vertical',
              padding: '10px 14px',
              fontSize: '14px',
              borderColor: error ? 'var(--color-error)' : 'var(--color-border-main)',
              boxShadow: error ? '0 0 0 2px var(--color-error-bg)' : 'none',
            } as React.CSSProperties>
            {...props}
          />
        );
      }

      if (type === 'select') {
        return (
          <motion.select
            {...commonProps}
            style={{
              ...baseStyles,
              paddingRight: '40px',
              appearance: 'none',
              backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%23666%22 stroke-width=%222%22%3E%3Cpath%20d=%22M6%209l6%206%206-6%22/%3E%3C/svg%3E")',
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 12px center',
              backgroundSize: '20px',
              paddingRight: '40px',
            } as React.CSSProperties)
            {...props}
          />
        );
      }

      return (
        <motion.input
          {...commonProps}
          style={{
            ...baseStyles,
            paddingLeft: prefix ? '40px' : undefined,
            paddingRight: suffix ? '40px' : undefined,
            borderColor: error ? 'var(--color-error)' : 'var(--color-border-main)',
            boxShadow: error ? '0 0 0 2px var(--color-error-bg)' : 'none',
          } as React.CSSProperties>
          {...props}
        />
      );
    };

    const errorId = `${inputId}-error`;
    const helperId = `${inputId}-helper`;

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        if (!disabled && !loading) {
          // Click will be triggered automatically
        }
      }
    };

    const handleClick = (e: React.MouseEvent) => {
      if (disabled || loading) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    const inputId = useId();
    const errorId = `${inputId}-error`;
    const helperId = `${inputId}-helper`;

    const hasError = !!error;

    return (
      <div style={{ width: fullWidth ? '100%' : 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {label && (
          <label htmlFor={inputId} style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 500, color: 'var(--color-text-primary)' }}>
            {label}
            {required && <span style={{ color: 'var(--color-error)', marginLeft: '4px' }}>*</span>}
          </label>
        )}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', width: fullWidth ? '100%' : 'auto' }}>
          {prefix && (
            <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)', pointerEvents: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {prefix}
            </div>
          )}
          {renderInput()}
          {suffix && (
            <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)', pointerEvents: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {suffix}
            </div>
          )}
        </div>
        {error && (
          <motion.p
            id={errorId}
            role="alert"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, ease: 'ease-out' }}
            style={{ margin: '6px 0 0', fontSize: '12px', color: 'var(--color-error)', display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12" y2="16" />
            </svg>
            {error}
          </motion.p>
        )}
        {helperText && !error && (
          <p id={helperId} style={{ marginTop: '6px', fontSize: '12px', color: 'var(--color-text-muted)' }}>
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

FormField.displayName = 'FormField';

export { FormField };
export type { FormFieldProps };