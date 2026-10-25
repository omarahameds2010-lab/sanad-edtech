import type { TaskIconKind } from "@/app/student/courses/lib/curriculum";

export type TaskGlyphName =
  | TaskIconKind
  | "lock"
  | "check"
  | "clock"
  | "refresh"
  | "arrow"
  | "back"
  | "chevron";

interface TaskGlyphProps {
  name: TaskGlyphName;
  size?: number;
  strokeWidth?: number;
  className?: string;
}

/**
 * Thin line glyphs for the curriculum rail, task rows and status capsules.
 * All strokes share the same 1.5-ish weight and rounded joins so the
 * iconography reads as a single drawing instrument.
 */
export function TaskGlyph({
  name,
  size = 18,
  strokeWidth = 1.5,
  className,
}: TaskGlyphProps) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className,
    "aria-hidden": true,
    focusable: false,
  };

  switch (name) {
    case "play":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8.4" />
          <path d="M10.2 8.9v6.2l5.1-3.1z" fill="currentColor" stroke="none" />
        </svg>
      );
    case "exam":
      return (
        <svg {...common}>
          <rect x="5.2" y="4.3" width="13.6" height="15.4" rx="2.4" />
          <path d="M8.8 9h6.4M8.8 12.5h4.2" />
          <path d="m14.1 16.4 1.2 1.2 2.1-2.5" />
        </svg>
      );
    case "assignment":
      return (
        <svg {...common}>
          <path d="M14.2 3.4H7.6A2.3 2.3 0 0 0 5.3 5.7v12.6a2.3 2.3 0 0 0 2.3 2.3h8.8a2.3 2.3 0 0 0 2.3-2.3V8.1z" />
          <path d="M14.1 3.5v4.7h4.7" />
          <path d="M8.8 13.1h4.7M8.8 16.4h3.1" />
        </svg>
      );
    case "file":
      return (
        <svg {...common}>
          <path d="M14.1 3.4H7.6A2.3 2.3 0 0 0 5.3 5.7v12.6a2.3 2.3 0 0 0 2.3 2.3h8.8a2.3 2.3 0 0 0 2.3-2.3V8.1z" />
          <path d="M14.1 3.5v4.7h4.7" />
          <path d="M12 10.8v5.1M9.7 13.7 12 16l2.3-2.3" />
        </svg>
      );
    case "live":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="2.2" />
          <path d="M8.2 8.2a5.4 5.4 0 0 0 0 7.6M15.8 15.8a5.4 5.4 0 0 0 0-7.6" />
          <path d="M5.7 5.7a8.9 8.9 0 0 0 0 12.6M18.3 18.3a8.9 8.9 0 0 0 0-12.6" />
        </svg>
      );
    case "book":
      return (
        <svg {...common}>
          <path d="M4 5.6A2.6 2.6 0 0 1 6.6 3H20v15.2H6.6A2.6 2.6 0 0 0 4 20.8z" />
          <path d="M4 18.2a2.6 2.6 0 0 1 2.6-2.6H20" />
        </svg>
      );
    case "lock":
      return (
        <svg {...common}>
          <rect x="5.4" y="10.2" width="13.2" height="9.4" rx="2.2" />
          <path d="M8.3 10.2V7.7a3.7 3.7 0 0 1 7.4 0v2.5" />
          <circle cx="12" cy="14.9" r="1.1" fill="currentColor" stroke="none" />
        </svg>
      );
    case "check":
      return (
        <svg {...common}>
          <path d="m5.5 12.4 4.1 4.1 8.9-9.1" />
        </svg>
      );
    case "clock":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8.4" />
          <path d="M12 7.5v4.8l3.1 1.9" />
        </svg>
      );
    case "refresh":
      return (
        <svg {...common}>
          <path d="M19.1 9.1A7.6 7.6 0 1 0 19.3 14" />
          <path d="M19.1 4.8v4.3h-4.3" />
        </svg>
      );
    case "arrow":
      return (
        <svg {...common}>
          <path d="M19 12H5M11.2 5.8 5 12l6.2 6.2" />
        </svg>
      );
    case "back":
      return (
        <svg {...common}>
          <path d="M5 12h14M12.8 5.8 19 12l-6.2 6.2" />
        </svg>
      );
    case "chevron":
      return (
        <svg {...common}>
          <path d="m14.6 6.4-5.2 5.6 5.2 5.6" />
        </svg>
      );
    default:
      return null;
  }
}
