import * as React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
  gap?: string;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ children, variant = 'primary', className, disabled, style, gap, ...props }, ref) => {
    const computedClassName = "-btn -btn-" + variant + (className ? " " + className : "");
    return (
      <button
        ref={ref}
        disabled={disabled}
        className={computedClassName}
        style={{ display: 'inline-flex', alignItems: 'center', gap: gap, ...style }}
        {...props}
      >
        <React.Fragment>{children}</React.Fragment>
      </button>
    );
  }
);
Button.displayName = 'Button';
