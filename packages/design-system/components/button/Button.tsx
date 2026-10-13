import * as React from "react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ children, variant = "primary", ...props }, ref) => {
    return (
      <button ref={ref} className={"-btn -btn-" + variant} {...props}>
        <React.Fragment>{children}</React.Fragment>
      </button>
    );
  },
);
Button.displayName = "Button";
