import { forwardRef, SVGProps } from 'react';

export interface IconProps extends SVGProps<SVGSVGElement> {
  size?: number | string;
  color?: string;
  'aria-hidden'?: boolean;
}

const defaultSize = 24;

export const XIcon = forwardRef<SVGSVGElement, IconProps>(
  ({ size = defaultSize, color = 'currentColor', 'aria-hidden': ariaHidden = true, ...props }, ref) => (
    <svg
      ref={ref}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={ariaHidden}
      {...props}
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
);
XIcon.displayName = 'XIcon';

export const ChevronLeftIcon = forwardRef<SVGSVGElement, IconProps>(
  ({ size = defaultSize, color = 'currentColor', 'aria-hidden': ariaHidden = true, ...props }, ref) => (
    <svg
      ref={ref}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={ariaHidden}
      {...props}
    >
      <polyline points="15 18 9 12 15 6" />
    </svg>
  )
);
ChevronLeftIcon.displayName = 'ChevronLeftIcon';

export const ChevronRightIcon = forwardRef<SVGSVGElement, IconProps>(
  ({ size = defaultSize, color = 'currentColor', 'aria-hidden': ariaHidden = true, ...props }, ref) => (
    <svg
      ref={ref}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={ariaHidden}
      {...props}
    >
      <polyline points="9 18 15 12 9 6" />
    </svg>
  )
);
ChevronRightIcon.displayName = 'ChevronRightIcon';

export const ChevronDownIcon = forwardRef<SVGSVGElement, IconProps>(
  ({ size = defaultSize, color = 'currentColor', 'aria-hidden': ariaHidden = true, ...props }, ref) => (
    <svg
      ref={ref}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={ariaHidden}
      {...props}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )
);
ChevronDownIcon.displayName = 'ChevronDownIcon';

export const ChevronUpIcon = forwardRef<SVGSVGElement, IconProps>(
  ({ size = defaultSize, color = 'currentColor', 'aria-hidden': ariaHidden = true, ...props }, ref) => (
    <svg
      ref={ref}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={ariaHidden}
      {...props}
    >
      <polyline points="18 15 12 9 6 15" />
    </svg>
  )
);
ChevronUpIcon.displayName = 'ChevronUpIcon';

export const CheckIcon = forwardRef<SVGSVGElement, IconProps>(
  ({ size = defaultSize, color = 'currentColor', 'aria-hidden': ariaHidden = true, ...props }, ref) => (
    <svg
      ref={ref}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={ariaHidden}
      {...props}
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
);
CheckIcon.displayName = 'CheckIcon';

export const MenuIcon = forwardRef<SVGSVGElement, IconProps>(
  ({ size = defaultSize, color = 'currentColor', 'aria-hidden': ariaHidden = true, ...props }, ref) => (
    <svg
      ref={ref}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={ariaHidden}
      {...props}
    >
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  )
);
MenuIcon.displayName = 'MenuIcon';

export const ArrowLeftIcon = forwardRef<SVGSVGElement, IconProps>(
  ({ size = defaultSize, color = 'currentColor', 'aria-hidden': ariaHidden = true, ...props }, ref) => (
    <svg
      ref={ref}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={ariaHidden}
      {...props}
    >
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  )
);
ArrowLeftIcon.displayName = 'ArrowLeftIcon';

export const ArrowRightIcon = forwardRef<SVGSVGElement, IconProps>(
  ({ size = defaultSize, color = 'currentColor', 'aria-hidden': ariaHidden = true, ...props }, ref) => (
    <svg
      ref={ref}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={ariaHidden}
      {...props}
    >
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  )
);
ArrowRightIcon.displayName = 'ArrowRightIcon';