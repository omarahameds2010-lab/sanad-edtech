"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  unlockReasonLabel,
  type AgendaItem,
  type BadgeState,
  type DayBucket,
  type FeedbackEntry,
  type ResumeTarget,
} from "@/app/lib/dashboard";

/* ------------------------------------------------------------------ */
/* Small shared pieces                                                 */
/* ------------------------------------------------------------------ */

/** Eased 0 → target counter; instant when hidden or reduced-motion. */
export function useCountUp(target: number, duration = 1100): number {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (
      typeof document !== "undefined" &&
      (document.hidden ||
        window.matchMedia("(prefers-reduced-motion: reduce)").matches)
    ) {
      setValue(target);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(eased * target));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return value;
}

const AR_DATE = new Intl.DateTimeFormat("ar-EG", {
  day: "numeric",
  month: "long",
});

export function formatArabicDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : AR_DATE.format(d);
}

function IconPlay() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M7.5 5.3v13.4c0 .87.96 1.4 1.7.94l10.5-6.7a1.1 1.1 0 0 0 0-1.88L9.2 4.36a1.1 1.1 0 0 0-1.7.94z" />
    </svg>
  );
}

function IconBookOpen() {
  return (
    <svg
      width="44"
      height="44"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 6.6C10.4 5.1 8.4 4.5 6 4.5c-1.1 0-2.1.15-3 .5v12.6c.9-.35 1.9-.5 3-.5 2.4 0 4.4.6 6 2.1 1.6-1.5 3.6-2.1 6-2.1 1.1 0 2.1.15 3 .5V5c-.9-.35-1.9-.5-3-.5-2.4 0-4.4.6-6 2.1z" />
      <path d="M12 6.6v12.6" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Stats strip                                                         */
/* ------------------------------------------------------------------ */

export interface StatItem {
  label: string;
  value: number;
}

export function StatStrip({ stats }: { stats: StatItem[] }) {
  return (
    <div className="cc-stats-grid" role="list">
      {stats.map((s) => (
        <StatCell key={s.label} label={s.label} value={s.value} />
      ))}
    </div>
  );
}

function StatCell({ label, value }: StatItem) {
  const shown = useCountUp(value);
  return (
    <div className="cc-stat" role="listitem">
      <div className="cc-stat-num" dir="ltr">
        {shown}
      </div>
      <div className="cc-stat-label">{label}</div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Progress orbit                                                      */
/* ------------------------------------------------------------------ */

export function ProgressOrbit({
  percent,
  note,
}: {
  percent: number;
  note: string;
}) {
  const shown = useCountUp(percent, 1200);
  const [drawn, setDrawn] = useState(false);
  useEffect(() => {
    if (typeof document !== "undefined" && document.hidden) {
      setDrawn(true);
      return;
    }
    const raf = requestAnimationFrame(() => setDrawn(true));
    return () => cancelAnimationFrame(raf);
  }, []);
  const radius = 62;
  const circumference = 2 * Math.PI * radius;
  const safe = Math.max(0, Math.min(100, percent));
  const offset = circumference * (1 - (drawn ? safe : 0) / 100);
  return (
    <div className="cc-orbit-wrap">
      <svg
        viewBox="0 0 160 160"
        className="cc-orbit-svg"
        role="img"
        aria-label={`${percent}% ${note}`}
      >
        <circle
          cx="80"
          cy="80"
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="9"
        />
        <circle
          cx="80"
          cy="80"
          r={radius}
          fill="none"
          stroke="var(--color-action)"
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={circumference.toFixed(2)}
          strokeDashoffset={offset}
          transform="rotate(-90 80 80)"
          className="cc-orbit-arc"
        />
      </svg>
      <div className="cc-orbit-center">
        <div className="cc-orbit-num" dir="ltr">
          {shown}%
        </div>
        <div className="cc-orbit-note">{note}</div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Learning signal chart                                               */
/* ------------------------------------------------------------------ */

export function SignalChart({ buckets }: { buckets: DayBucket[] }) {
  const [active, setActive] = useState<number | null>(null);
  const counts = buckets.map((b) => b.events.length);
  const total = counts.reduce((a, b) => a + b, 0);
  const n = Math.max(counts.length, 2);
  const max = Math.max(1, ...counts);
  const W = 600;
  const H = 150;
  const PAD = 14;
  const xAt = (i: number) => (i / (n - 1)) * W;
  const yAt = (v: number) => H - PAD - (v / max) * (H - 2 * PAD);
  const pts = counts.map((v, i) => ({ x: xAt(i), y: yAt(v) }));
  const line = pts
    .map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    .join(" ");
  const area = `${line} L${W},${H} L0,${H} Z`;
  const weekdayFmt = new Intl.DateTimeFormat("ar-EG", { weekday: "long" });
  const dayFmt = new Intl.DateTimeFormat("ar-EG", {
    day: "numeric",
    month: "short",
  });
  const clampPercent = (p: number) => Math.min(88, Math.max(12, p));
  const todayIndex = buckets.length - 1;
  const activeBucket = active !== null ? buckets[active] : undefined;
  const activePos =
    active !== null ? clampPercent((active / (n - 1)) * 100) : 50;

  return (
    <div className="cc-chart" dir="ltr" onMouseLeave={() => setActive(null)}>
      <div className="cc-chart-inner">
        <svg
          className="cc-chart-svg"
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="ccSignalFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(4,120,87,0.35)" />
              <stop offset="100%" stopColor="rgba(4,120,87,0)" />
            </linearGradient>
          </defs>
          {total > 0 && <path d={area} fill="url(#ccSignalFill)" />}
          {total > 0 ? (
            <path
              d={line}
              fill="none"
              stroke="var(--color-action)"
              strokeWidth="2"
              vectorEffect="non-scaling-stroke"
              strokeLinejoin="round"
              strokeLinecap="round"
              className="cc-chart-line"
            />
          ) : (
            <line
              x1="0"
              y1={yAt(0)}
              x2={W}
              y2={yAt(0)}
              stroke="rgba(255,255,255,0.12)"
              strokeWidth="1.5"
              strokeDasharray="4 6"
              vectorEffect="non-scaling-stroke"
            />
          )}
          <line
            x1="0"
            y1={H - 0.5}
            x2={W}
            y2={H - 0.5}
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
        <div className="cc-chart-dots" aria-hidden="true">
          {pts.map((p, i) =>
            (counts[i] ?? 0) > 0 ? (
              <span
                key={i}
                className={`cc-chart-dot${active === i ? " is-active" : ""}`}
                style={{
                  left: `${(p.x / W) * 100}%`,
                  top: `${(p.y / H) * 100}%`,
                }}
              />
            ) : null,
          )}
        </div>
        <div className="cc-chart-hits">
          {buckets.map((b, i) => (
            <button
              key={i}
              type="button"
              className="cc-chart-hit"
              onMouseEnter={() => setActive(i)}
              onFocus={() => setActive(i)}
              onClick={() => setActive(i)}
              aria-label={`${weekdayFmt.format(b.dayStart)} — ${b.events.length} نشاط`}
            />
          ))}
        </div>
        {activeBucket && (
          <div
            className="cc-chart-tip"
            style={{ left: `${activePos}%` }}
            dir="rtl"
          >
            <strong>
              {activeBucket.events.length === 1
                ? "نشاط واحد"
                : `${activeBucket.events.length} أنشطة`}
            </strong>
            <span className="cc-chart-tip-day">
              {dayFmt.format(activeBucket.dayStart)}
            </span>
            {activeBucket.events.length > 0 ? (
              <ul>
                {activeBucket.events.slice(0, 3).map((ev, k) => (
                  <li key={k}>
                    {ev.label.length > 34
                      ? `${ev.label.slice(0, 33)}…`
                      : ev.label}
                  </li>
                ))}
                {activeBucket.events.length > 3 && (
                  <li>+{activeBucket.events.length - 3} تاني</li>
                )}
              </ul>
            ) : (
              <span className="cc-chart-tip-empty">مفيش نشاط</span>
            )}
          </div>
        )}
      </div>
      <div className="cc-chart-axis" dir="ltr">
        {buckets.map((b, i) => (
          <span key={i} className="cc-chart-tick">
            {i === todayIndex ? "النهاردة" : weekdayFmt.format(b.dayStart)}
          </span>
        ))}
      </div>
      {total === 0 && (
        <p className="cc-muted cc-chart-empty">لسه مفيش نشاط في آخر ٧ أيام.</p>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Agenda rail                                                         */
/* ------------------------------------------------------------------ */

export function AgendaTimeline({ items }: { items: AgendaItem[] }) {
  if (items.length === 0) {
    return <p className="cc-muted">مفيش مهام مفتوحة دلوقتي.</p>;
  }
  return (
    <ul className="cc-rail">
      {items.map((it, i) => (
        <li
          key={it.id}
          className="cc-rail-item"
          style={{ animationDelay: `${i * 70}ms` }}
        >
          <span
            className={`cc-rail-dot cc-rail-dot--${it.state}`}
            aria-hidden="true"
          />
          <Link href={it.href} className="cc-rail-body">
            <span className="cc-rail-title">{it.title}</span>
            {it.courseTitle && (
              <span className="cc-rail-course">{it.courseTitle}</span>
            )}
            <span className={`cc-chip cc-chip--${it.state}`}>
              {it.statusLabel}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

/* ------------------------------------------------------------------ */
/* Badges shelf                                                        */
/* ------------------------------------------------------------------ */

function BadgeMedal({ id }: { id: string }) {
  const common = {
    width: 22,
    height: 22,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.5,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };
  switch (id) {
    case "first-submission":
      return (
        <svg {...common}>
          <path d="M5.5 21V4" />
          <path d="M5.5 4.8h11.3l-2.1 3.4 2.1 3.4H5.5" />
        </svg>
      );
    case "path-key":
      return (
        <svg {...common}>
          <circle cx="8.2" cy="15.3" r="3.6" />
          <path d="m10.8 12.7 7.9-7.9" />
          <path d="m15.6 7.9 2.4 2.4" />
          <path d="m13.2 10.3 1.8 1.8" />
        </svg>
      );
    case "exam-pass":
      return (
        <svg {...common}>
          <circle cx="12" cy="8.8" r="5.3" />
          <path d="m9 13.4-1.4 7.1 4.4-2.4 4.4 2.4-1.4-7.1" />
        </svg>
      );
    case "streak-3":
      return (
        <svg {...common}>
          <path d="M12 3.2c.9 2.9-1.1 4.4-2.5 5.9a5.8 5.8 0 0 0-1.6 4A6.05 6.05 0 0 0 12 19.2a6.05 6.05 0 0 0 4.1-6.1c0-2.4-1.2-4.1-2.9-5.9C12.9 5.9 12.9 4.6 12 3.2z" />
          <path d="M12 19.2a2.6 2.6 0 0 0 2.6-2.6c0-1.5-1-2.4-1.8-3.3-.6-.6-1.2-1.2-1.6-1.9-.5.7-1.1 1.3-1.7 1.9-.9.9-1.9 1.8-1.9 3.3A2.6 2.6 0 0 0 12 19.2z" />
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <path d="m12 3.4 8.6 4.8-8.6 4.8-8.6-4.8z" />
          <path d="m3.9 12.6 8.1 4.5 8.1-4.5" />
          <path d="m3.9 16.4 8.1 4.5 8.1-4.5" />
        </svg>
      );
  }
}

export function BadgeShelf({ badges }: { badges: BadgeState[] }) {
  return (
    <div className="cc-badge-grid">
      {badges.map((b) => (
        <div
          key={b.id}
          className={`cc-badge${b.earned ? " is-earned" : ""}${b.id === "streak-3" && b.earned ? " is-flame" : ""}`}
          title={b.desc}
        >
          <span className="cc-badge-medal" aria-hidden="true">
            <BadgeMedal id={b.id} />
          </span>
          <span className="cc-badge-title">{b.title}</span>
          <span className="cc-badge-sub">
            {b.earned
              ? b.earnedAt
                ? `اتكسبت ${formatArabicDate(b.earnedAt)}`
                : "مكسوبة"
              : b.progress
                ? `${b.progress.have}/${b.progress.need}`
                : "لسه"}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Passport course card                                                */
/* ------------------------------------------------------------------ */

export function PassportCard({
  title,
  href,
  percent,
}: {
  title: string;
  href: string;
  percent: number | null;
}) {
  const shown = useCountUp(percent ?? 0);
  return (
    <Link href={href} className="cc-passport">
      <span className="cc-passport-head">
        <span className="cc-passport-title">{title}</span>
        {percent !== null && (
          <span className="cc-passport-pct" dir="ltr">
            {shown}%
          </span>
        )}
      </span>
      {percent === null ? (
        <span className="cc-muted">جاري حساب التقدم…</span>
      ) : (
        <>
          <span className="cc-laser" aria-hidden="true">
            <span style={{ width: `${shown}%` }} />
          </span>
          <span className="cc-passport-cta">
            افتح المسار <span aria-hidden="true">←</span>
          </span>
        </>
      )}
    </Link>
  );
}

/* ------------------------------------------------------------------ */
/* Resume card                                                         */
/* ------------------------------------------------------------------ */

export function ResumeCard({ target }: { target: ResumeTarget | null }) {
  if (!target) {
    return (
      <div className="cc-resume-body">
        <span className="cc-eyebrow">أكمل من حيث توقفت</span>
        <h2 className="cc-resume-title">كل مساراتك متاحة — اختار درسك الجاي</h2>
        <p className="cc-resume-meta">
          مفتاح المسار بيتفتح تلقائيًا مع كل خطوة بتخلصها.
        </p>
        <Link href="/student/courses" className="cc-cta cc-cta--soft">
          افتح كورساتي
        </Link>
      </div>
    );
  }
  return (
    <div className="cc-resume-body">
      <span className="cc-eyebrow">أكمل من حيث توقفت</span>
      <h2 className="cc-resume-title">{target.lessonTitle}</h2>
      <p className="cc-resume-meta">
        {target.courseTitle} · {unlockReasonLabel(target.unlockType)} ·{" "}
        {formatArabicDate(target.unlockedAt)}
      </p>
      <Link
        href={`/student/lessons/${target.lessonId}`}
        className="cc-cta cc-cta--glow"
      >
        <IconPlay /> أكمل التعلم الآن
      </Link>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Teacher feedback card                                               */
/* ------------------------------------------------------------------ */

export function FeedbackCard({
  entry,
  teacherName,
  courseTitle,
}: {
  entry: FeedbackEntry;
  teacherName: string | null;
  courseTitle: string | null;
}) {
  const initial = (teacherName?.trim()?.[0] ?? "أ").toUpperCase();
  return (
    <div className="cc-feedback-body">
      <span className="cc-feedback-avatar" aria-hidden="true">
        {initial}
      </span>
      <div className="cc-feedback-main">
        <span className="cc-eyebrow">
          {teacherName ? `آخر ملاحظة من ${teacherName}` : "آخر ملاحظة من مدرسك"}
        </span>
        <p className="cc-feedback-text">«{entry.feedback}»</p>
        <span className="cc-feedback-meta">
          {entry.assignmentTitle}
          {courseTitle ? ` · ${courseTitle}` : ""} ·{" "}
          {formatArabicDate(entry.submittedAt)}
          {entry.score !== null ? ` · الدرجة ${entry.score}` : ""}
        </span>
      </div>
      <Link
        href={`/student/assignments/${entry.assignmentId}`}
        className="cc-ghost-btn"
      >
        افتح الواجب
      </Link>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Chain simulator (transparency explainer)                            */
/* ------------------------------------------------------------------ */

const CHAIN_NODES = ["واجب", "امتحان", "الدرس التالي"];

export function ChainSimulator() {
  const [stage, setStage] = useState(0);

  function advance(from: number) {
    setStage(from >= 2 ? 0 : from + 1);
  }

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 0,
          margin: "12px 0",
        }}
      >
        {CHAIN_NODES.map((label, i) => {
          const done = i < stage;
          const activeNode = i === stage;
          return (
            <div
              key={label}
              style={{ flex: 1, display: "flex", alignItems: "center" }}
            >
              <button
                type="button"
                onClick={() => advance(i)}
                title={label}
                aria-label={`${label} — ${done ? "مفتوح" : activeNode ? "الحالي" : "مقفل"}`}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: "50%",
                  border: `1px solid ${done || activeNode ? "var(--tenant-accent)" : "rgba(255,255,255,0.2)"}`,
                  background: done
                    ? "var(--tenant-accent)"
                    : activeNode
                      ? "rgba(4, 120, 87, 0.18)"
                      : "transparent",
                  color: "#F4F4F6",
                  fontSize: 18,
                  cursor: "pointer",
                  flexShrink: 0,
                  boxShadow: done
                    ? "0 0 14px 2px rgba(4, 120, 87, 0.45)"
                    : "none",
                  transition: "all 300ms ease",
                }}
              >
                {done || activeNode ? "🔓" : "🔒"}
              </button>
              <div style={{ textAlign: "center", flex: 1 }}>
                <div
                  style={{
                    fontSize: 11,
                    color: "rgba(244,244,246,0.75)",
                    fontWeight: 700,
                  }}
                >
                  {label}
                </div>
              </div>
              {i < CHAIN_NODES.length - 1 && (
                <div
                  style={{
                    flex: 1,
                    height: 2,
                    borderRadius: 2,
                    background:
                      i < stage
                        ? "var(--tenant-accent)"
                        : "rgba(255,255,255,0.12)",
                    boxShadow:
                      i < stage ? "0 0 8px 1px rgba(4,120,87,0.4)" : "none",
                    transition: "all 300ms ease",
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
      <p
        style={{
          fontSize: 12,
          lineHeight: 1.9,
          color: "rgba(244, 244, 246, 0.6)",
          margin: 0,
        }}
      >
        محاكاة توضيحية — اضغط أي عقدة: تقدمك الحقيقي يعتمد كليًا على الدخول
        والتفاعل، والسيرفر وحده يملك التوقيت. التلاعب بساعة المتصفح لا يجدي.
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Loading / empty states                                              */
/* ------------------------------------------------------------------ */

export function DashboardSkeleton() {
  return (
    <div
      className="cc-bento cc-bento--loading"
      role="status"
      aria-label="جاري تحميل لوحتك"
    >
      <div className="cc-card cc-hero cc-skel" style={{ minHeight: 240 }} />
      <div className="cc-card cc-orbit cc-skel" style={{ minHeight: 240 }} />
      <div className="cc-card cc-stats cc-skel" style={{ minHeight: 140 }} />
      <div className="cc-card cc-resume cc-skel" style={{ minHeight: 210 }} />
      <div className="cc-card cc-agenda cc-skel" style={{ minHeight: 320 }} />
      <div className="cc-card cc-chart cc-skel" style={{ minHeight: 260 }} />
      <div
        className="cc-card cc-passports cc-skel"
        style={{ minHeight: 220 }}
      />
      <div className="cc-card cc-badges cc-skel" style={{ minHeight: 220 }} />
    </div>
  );
}

export function EmptyCourses() {
  return (
    <div className="cc-empty-body">
      <span className="cc-empty-icon">
        <IconBookOpen />
      </span>
      <h2>اختر كورسك الأول وابدأ الرحلة</h2>
      <p className="cc-muted">
        لسه مش مسجل في أي كورس — أول خطوة على بعد ضغطة واحدة.
      </p>
      <Link href="/courses" className="cc-cta cc-cta--glow">
        تصفح الكورسات
      </Link>
    </div>
  );
}
