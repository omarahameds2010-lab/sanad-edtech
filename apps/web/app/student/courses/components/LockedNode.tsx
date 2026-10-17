"use client";

import type { ProgressionItem } from "@/app/lib/api";
import {
  lockExplanationOf,
  nodeTypeLabel,
} from "@/app/student/courses/lib/metrics";
import { useParallax } from "@/app/student/courses/lib/motion";

/** The lock glyph, as an inline SVG token (no icon library). */
function LockGlyph() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      style={{ flexShrink: 0, color: "#f59e0b" }}
    >
      <rect x="4" y="10.5" width="16" height="10.5" rx="2.5" />
      <path d="M8 10.5V7a4 4 0 0 1 8 0v3.5" />
    </svg>
  );
}

/**
 * A single progression node that the server reports as locked.
 *
 * The lock is presented as a *constraint to explain*, not a wall: the frosted
 * surface only appears on hover/focus, and the amber ripple is a gentle warning
 * rather than a block.
 */
export default function LockedNode({ node }: { node: ProgressionItem }) {
  const { ref, state, style } = useParallax<HTMLLIElement>(6);
  const explanation = lockExplanationOf(node);

  return (
    <li
      ref={ref}
      className="sc-ledger-row sc-locked"
      style={style}
      data-active={state.active ? "true" : undefined}
      tabIndex={0}
      aria-label={`${node.title} — مقفل`}
    >
      <span className="sc-lock-name sc-ledger-name">{node.title}</span>
      <span style={{ fontSize: 12, color: "rgba(244,244,246,.4)" }}>
        {nodeTypeLabel(node.type)}
      </span>

      <span className="sc-lock-surface">
        <span className="sc-ripple" aria-hidden />
        <LockGlyph />
        <span style={{ fontSize: 12, fontWeight: 700, color: "#fbbf24" }}>
          متصل بالخادم
        </span>
      </span>

      <p className="sc-lock-note">
        <span aria-hidden style={{ marginInlineEnd: 6 }}>
          🛈
        </span>
        {explanation}
      </p>
    </li>
  );
}
