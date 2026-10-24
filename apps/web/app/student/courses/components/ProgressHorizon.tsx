"use client";

import type { CourseEntry } from "@/app/student/courses/lib/metrics";
import { useTickingMetric } from "@/app/student/courses/lib/motion";

/**
 * The Global Progress Horizon — an audit tracker of learning velocity.
 *
 * The gauge is a native SVG arc token (no chart library). Its stroke is driven
 * by `strokeDashoffset`, so the sweep and the counting number are guaranteed
 * to describe the same value.
 */
export default function ProgressHorizon({
  entries,
}: {
  entries: CourseEntry[];
}) {
  const featured = entries[0];
  const percent = featured ? featured.metrics.percent : 0;
  const shown = useTickingMetric(percent);
  const rounded = Math.round(shown);

  // A 270° arc leaves a natural gap at the bottom.
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const sweep = 0.75;
  const arc = circumference * sweep;
  const offset = arc * (1 - shown / 100);

  const totalNodes = entries.reduce((sum, e) => sum + e.metrics.total, 0);
  const openNodes = entries.reduce((sum, e) => sum + e.metrics.open, 0);
  const lockedNodes = totalNodes - openNodes;

  return (
    <article className="sc-panel" aria-label="أفق التقدم العام">
      <div className="sc-body">
        <p className="sc-eyebrow">أفق التقدم</p>

        <div style={{ position: "relative", width: 148, margin: "0 auto" }}>
          <svg
            width="148"
            height="148"
            viewBox="0 0 148 148"
            aria-hidden
            style={{ display: "block", transform: "rotate(135deg)" }}
          >
            <circle
              cx="74"
              cy="74"
              r={radius}
              fill="none"
              stroke="var(--sc-hairline, rgba(255,255,255,.08))"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={`${arc} ${circumference}`}
            />
            <circle
              cx="74"
              cy="74"
              r={radius}
              fill="none"
              stroke="var(--tenant-accent-glow, #34d399)"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={`${arc} ${circumference}`}
              strokeDashoffset={offset}
              style={{
                filter: "drop-shadow(0 0 8px rgba(4,120,87,.55))",
                transition: "none",
              }}
            />
          </svg>

          <div
            className="sc-metric sc-metric-value"
            aria-hidden
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 40,
            }}
          >
            {rounded}
            <span className="sc-metric-sign">٪</span>
          </div>
        </div>

        <dl
          style={{
            margin: "var(--space-6) 0 0",
            display: "grid",
            gap: "var(--space-3)",
          }}
        >
          {[
            { label: "كورسات مسجلة", value: entries.length },
            { label: "عناصر مفتوحة", value: openNodes },
            { label: "عناصر مقفلة", value: lockedNodes },
          ].map((row) => (
            <div
              key={row.label}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
                borderBottom: "1px solid var(--sc-hairline, rgba(255,255,255,.05))",
                paddingBottom: "var(--space-2)",
              }}
            >
              <dt
                style={{
                  fontSize: 13,
                  color: "var(--sc-muted, rgba(244,244,246,.6))",
                  margin: 0,
                }}
              >
                {row.label}
              </dt>
              <dd
                className="sc-metric"
                style={{ margin: 0, fontSize: 18, fontWeight: 800 }}
              >
                {row.value}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </article>
  );
}
