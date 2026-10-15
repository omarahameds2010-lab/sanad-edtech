"use client";

import type { ReactNode } from "react";
import { useLiquidCounter, useMagnetic } from "../lib/motion";

interface PanelProps {
  children: ReactNode;
  /** Rendered as the panel's element. */
  as?: "div" | "section" | "article";
  className?: string;
  label?: string;
  style?: React.CSSProperties;
  /** Pull distance in px toward the pointer. 0 disables magnetism. */
  pull?: number;
}

/**
 * Aero-glass panel with the pearl-gleam edge.
 *
 * The panel body never scales, lifts or moves; only the 1px border carries a
 * travelling radial mask, so hovering feels like light touching glass rather
 * than a layout shift.
 */
export default function Panel({
  children,
  as = "div",
  className = "",
  label,
  style,
  pull = 0,
}: PanelProps) {
  const { ref, state } = useMagnetic<HTMLDivElement>(pull);
  const Tag = as as any;

  return (
    <Tag
      ref={ref}
      className={`tc-panel ${className}`}
      aria-label={label}
      style={{
        ...(pull > 0
          ? {
              transform: `translate3d(${(state.nx * pull).toFixed(2)}px, ${(
                state.ny * pull
              ).toFixed(2)}px, 0)`,
              transition: state.active
                ? "none"
                : "transform 520ms cubic-bezier(.2,0,0,1)",
            }
          : {}),
        ...style,
      }}
    >
      <span
        className="tc-gleam"
        aria-hidden
        style={
          {
            "--tc-mx": `${state.mx}%`,
            "--tc-my": `${state.my}%`,
          } as React.CSSProperties
        }
      />
      {children as any}
    </Tag>
  );
}

/** A metric readout whose number counts up from zero on mount. */
export function Metric({
  label,
  value,
  sign,
  href,
}: {
  label: string;
  value: number;
  sign?: string;
  href?: string;
}) {
  const shown = useLiquidCounter(value);
  const rounded = Math.round(shown);

  const body = (
    <>
      <p className="tc-kpi-label">{label}</p>
      <div className="tc-metric tc-metric-value" style={{ marginTop: 10 }}>
        {rounded.toLocaleString("ar-EG")}
        {sign ? <span className="tc-metric-sign">{sign}</span> : null}
      </div>
    </>
  );

  if (href) {
    return (
      <Panel as="article">
        <a
          href={href}
          style={{ color: "inherit", textDecoration: "none", display: "block" }}
        >
          {body}
        </a>
      </Panel>
    );
  }

  return <Panel as="article">{body}</Panel>;
}
