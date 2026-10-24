"use client";

import Link from "next/link";
import type { CourseEntry } from "@/app/student/courses/lib/metrics";
import { useTickingMetric } from "@/app/student/courses/lib/motion";
import NodeLedger from "./NodeLedger";

/**
 * The featured course — the dominant double-width node of the bento.
 *
 * Its mesh is drawn from the subject accent family only (emerald for this
 * tenant); there is no blue anywhere, and the accent is the sole chromatic
 * element so the identity survives a full grayscale test.
 */
export default function FeaturedCourseCard({ entry }: { entry: CourseEntry }) {
  const { ref, state, style } = useTickingCard();
  const shown = useTickingMetric(entry.metrics.percent);
  const rounded = Math.round(shown);

  return (
    <article
      ref={ref}
      className="sc-panel sc-node-wide"
      style={style}
      data-active={state.active ? "true" : undefined}
      aria-label={`${entry.title} — ${entry.metrics.percent}٪ مكتمل`}
    >
      <div className="sc-gleam" aria-hidden />

      {/* Subject mesh: two soft emerald bodies, blurred well past legibility. */}
      <div className="sc-mesh" aria-hidden>
        <div
          className="sc-mesh-blob"
          style={{
            width: 420,
            height: 420,
            top: -160,
            insetInlineStart: -120,
            background: "rgba(4, 120, 87, 0.55)",
          }}
        />
        <div
          className="sc-mesh-blob"
          style={{
            width: 340,
            height: 340,
            bottom: -140,
            insetInlineEnd: -80,
            background: "rgba(52, 211, 153, 0.22)",
          }}
        />
      </div>

      <div className="sc-body sc-layer-title">
        <p className="sc-eyebrow">المسار الأساسي</p>
        <h2 className="sc-title">{entry.title}</h2>
        <p className="sc-meta">
          {entry.metrics.open} من {entry.metrics.total} عناصر مفتوحة
        </p>

        {/* The ticking metric: text and track read from the same value. */}
        <div style={{ marginTop: "var(--space-8)" }}>
          <div
            className="sc-metric sc-metric-value"
            aria-hidden
            style={{
              ["--sc-mx" as string]: `${state.mx}%`,
              ["--sc-my" as string]: `${state.my}%`,
            }}
          >
            {rounded}
            <span className="sc-metric-sign">٪</span>
          </div>
          <div
            className="sc-track sc-layer-track"
            style={{ marginTop: "var(--space-4)" }}
            role="progressbar"
            aria-valuenow={entry.metrics.percent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="نسبة إكمال الكورس"
          >
            <div
              className="sc-track-fill"
              style={{ width: `${entry.metrics.percent}%` }}
            />
          </div>
        </div>

        <NodeLedger progression={entry.raw.progression} />

        <Link
          href={`/student/courses/${entry.courseId}`}
          className="lp-cta"
          style={{
            marginTop: "var(--space-8)",
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            fontWeight: 700,
            color: "var(--sc-cta-color, #ffffff)",
          }}
        >
          متابعة المسار
          <span className="lp-arrow" aria-hidden>
            ←
          </span>
        </Link>
      </div>
    </article>
  );
}

/** Localised so the parallax bound stays a card-level decision. */
import { useParallax } from "@/app/student/courses/lib/motion";
function useTickingCard() {
  return useParallax(10);
}
