"use client";

import type {
  GrowthSummary,
  ScoreBlueprint,
} from "../lib/progress";

function pathFromValues(values: number[], max: number): string {
  if (values.length === 0) return "";
  const width = 100;
  const height = 34;
  const step = values.length === 1 ? width : width / (values.length - 1);
  return values
    .map((value, index) => {
      const x = values.length === 1 ? width / 2 : index * step;
      const y = height - 4 - (value / max) * (height - 8);
      return `${index === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");
}

export function GrowthBridge({ summary }: { summary: GrowthSummary }) {
  const max = Math.max(
    1,
    ...summary.points.map((point) => point.cumulative),
  );
  const values = summary.points.map((point) => point.cumulative);
  const line = pathFromValues(values, max);
  const last = summary.points.at(-1);
  const lastX = summary.points.length > 1 ? 100 : 50;
  const lastY =
    last === undefined ? 30 : 34 - 4 - (last.cumulative / max) * (34 - 8);

  return (
    <div className="sw-growth">
      <div className="sw-growth-head">
        <span>مؤشر النمو الأكاديمي</span>
        <span className="sw-growth-streak">
          {summary.streak > 1
            ? `${summary.streak.toLocaleString("en-US")} أيام متصلة`
            : summary.total > 0
              ? "استمرارية هادئة"
              : "لسه البداية"}
        </span>
      </div>
      <div className="sw-growth-chart" dir="ltr">
        <svg
          viewBox="0 0 100 34"
          preserveAspectRatio="none"
          role="img"
          aria-label={`جسر المعرفة: ${summary.total} تسليم، ${summary.activeDays} أيام نشاط في آخر 14 يوم`}
        >
          <path
            className="sw-growth-area"
            d={`${line} L100,34 L0,34 Z`}
            aria-hidden
          />
          <path className="sw-growth-line" d={line} aria-hidden />
          <circle
            className="sw-growth-dot"
            cx={lastX}
            cy={lastY}
            r="1.8"
            aria-hidden
          />
        </svg>
      </div>
      <div className="sw-growth-foot">
        <span>آخر 14 يوم</span>
        <span>
          {summary.total.toLocaleString("en-US")}{" "}
          {summary.total === 1 ? "تسليم" : "تسليمات"}
        </span>
      </div>
    </div>
  );
}

function ScoreSparkline({ blueprint }: { blueprint: ScoreBlueprint }) {
  const values = blueprint.points.map((point) => point.score);
  const line = pathFromValues(values, 100);
  return (
    <div className="sw-spark" dir="ltr" aria-hidden>
      <svg viewBox="0 0 100 34" preserveAspectRatio="none">
        <path className="sw-spark-line" d={line} />
        <circle
          className="sw-spark-dot"
          cx={values.length > 1 ? 100 : 50}
          cy={34 - 4 - (blueprint.latest / 100) * (34 - 8)}
          r="1.7"
        />
      </svg>
    </div>
  );
}

export function BlueprintSummary({ blueprint }: { blueprint: ScoreBlueprint }) {
  const enoughForTrend = blueprint.points.length > 1;
  return (
    <div className="sw-blueprint-summary">
      <div className="sw-blueprint-numbers">
        <div>
          <span>أول قياس</span>
          <strong>{blueprint.first}%</strong>
        </div>
        <span className="sw-blueprint-arrow" aria-hidden>
          ←
        </span>
        <div>
          <span>آخر قياس</span>
          <strong>{blueprint.latest}%</strong>
        </div>
        <div
          className="sw-blueprint-delta"
          data-positive={blueprint.delta >= 0 ? "true" : "false"}
        >
          {enoughForTrend
            ? `${blueprint.delta >= 0 ? "+" : ""}${blueprint.delta}`
            : "أول نقطة"}
        </div>
      </div>
      <ScoreSparkline blueprint={blueprint} />
      <p>
        {enoughForTrend
          ? "الخط من درجاتك المعتمدة فقط. المسافة بين أول قياس وآخره هي حركتك الفعلية."
          : "أول نقطة قياس معتمدة. الخط هيكتمل بعد التصحيح اللي بعده."}
      </p>
    </div>
  );
}

export function AcademicBlueprint({
  blueprint,
}: {
  blueprint: ScoreBlueprint;
}) {
  const enoughForTrend = blueprint.points.length > 1;
  return (
    <section className="sw-blueprint-panel" aria-label="مخطط النضوج الأكاديمي">
      <header className="sw-blueprint-head">
        <div>
          <span className="sw-eyebrow">مخطط النضوج الأكاديمي</span>
          <h2>
            {enoughForTrend
              ? "المسافة اللي قطعتها في التصحيح"
              : "أول نقطة في خريطتك"}
          </h2>
        </div>
        <span className="sw-chip">درجات معتمدة فقط</span>
      </header>
      <div className="sw-blueprint-body">
        <div className="sw-blueprint-score">
          <strong>
            {enoughForTrend
              ? `${blueprint.delta >= 0 ? "+" : ""}${blueprint.delta}`
              : `${blueprint.latest}%`}
          </strong>
          <span>
            {enoughForTrend
              ? "نقطة فرق بين أول وآخر تصحيح"
              : "أول قياس معتمد"}
          </span>
        </div>
        <div className="sw-blueprint-chart">
          <ScoreSparkline blueprint={blueprint} />
          <div className="sw-blueprint-axis" aria-hidden>
            <span>البداية</span>
            <span>آخر تصحيح</span>
          </div>
        </div>
      </div>
      <p className="sw-blueprint-note">
        المحاور اللغوية واستخراج الأدلة النصية هتتضاف لما محرك سند يرجّع
        تحليلًا معتمدًا لكل محاولة. الأرقام الحالية من تصحيح المعلم فقط.
      </p>
    </section>
  );
}
