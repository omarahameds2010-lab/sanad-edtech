"use client";

import type { ProgressionItem } from "@/app/lib/api";
import {
  lockedNodesOf,
  openNodesOf,
  nodeTypeLabel,
} from "@/app/student/courses/lib/metrics";
import LockedNode from "./LockedNode";

/** Inline SVG check token — no icon library anywhere in this platform. */
function CheckGlyph() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      style={{ flexShrink: 0, color: "var(--tenant-accent-glow, #34d399)" }}
    >
      <path d="M4.5 12.5l5 5 10-11" />
    </svg>
  );
}

/** Sort by the server's course order; nodes without an order keep their place. */
function byOrder(a: ProgressionItem, b: ProgressionItem): number {
  return (a.orderIndex ?? 0) - (b.orderIndex ?? 0);
}

/**
 * The node ledger: what the student may open, and what is still gated.
 *
 * Order is the server's own `orderIndex`, so the ledger reflects course
 * structure rather than client-side sorting.
 */
export default function NodeLedger({
  progression,
}: {
  progression: ProgressionItem[];
}) {
  const open = openNodesOf(progression).sort(byOrder);
  const locked = lockedNodesOf(progression).sort(byOrder);

  return (
    <div style={{ marginTop: "var(--space-6)" }}>
      <ul className="sc-ledger">
        {open.map((node) => (
          <li key={node.id} className="sc-ledger-row">
            <CheckGlyph />
            <p className="sc-ledger-name">{node.title}</p>
            <span
              style={{
                fontSize: 12,
                color: "var(--sc-muted, rgba(244,244,246,.4))",
              }}
            >
              {nodeTypeLabel(node.type)}
            </span>
          </li>
        ))}
      </ul>

      {locked.length > 0 && (
        <ul className="sc-ledger" style={{ marginTop: "var(--space-4)" }}>
          {locked.map((node) => (
            <LockedNode key={node.id} node={node} />
          ))}
        </ul>
      )}
    </div>
  );
}
