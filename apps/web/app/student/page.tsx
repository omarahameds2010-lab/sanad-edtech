"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/app/lib/auth";
import {
  api,
  ApiError,
  type AssignmentListItem,
  type EnrollmentItem,
  type ExamListItem,
} from "@/app/lib/api";
import { computeCourseProgress, firstNameOf } from "@/app/lib/dashboard";

function useAnimatedNumber(target: number): number {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      setValue(target);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const duration = 1200;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(eased * target));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target]);
  return value;
}

function PassportCard({
  title,
  href,
  percent,
}: {
  title: string;
  href: string;
  percent: number | null;
}) {
  const shown = useAnimatedNumber(percent ?? 0);
  return (
    <Link
      href={href}
      style={{
        display: "block",
        borderRadius: 20,
        padding: "16px 18px",
        background: "rgba(255, 255, 255, 0.04)",
        border: "1px solid rgba(255, 255, 255, 0.07)",
        color: "#F4F4F6",
        textDecoration: "none",
      }}
    >
      <div style={{ fontWeight: 700, marginBottom: 10 }}>{title}</div>
      {percent === null ? (
        <div style={{ fontSize: 12, color: "rgba(244, 244, 246, 0.55)" }}>
          جاري حساب التقدم…
        </div>
      ) : (
        <>
          <div
            style={{
              height: 4,
              borderRadius: 4,
              background: "rgba(255, 255, 255, 0.1)",
              overflow: "hidden",
              marginBottom: 6,
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${shown}%`,
                background: "var(--tenant-accent)",
                borderRadius: 4,
              }}
            />
          </div>
          <div
            dir="ltr"
            style={{
              fontSize: 12,
              color: "rgba(244, 244, 246, 0.7)",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {shown}%
          </div>
        </>
      )}
    </Link>
  );
}

const CHAIN_NODES = ["واجب", "امتحان", "الدرس التالي"];

function ChainSimulator() {
  const [stage, setStage] = useState(0);

  function advance(from: number) {
    setStage(from >= 2 ? 0 : from + 1);
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 0, margin: "12px 0" }}>
        {CHAIN_NODES.map((label, i) => {
          const done = i < stage;
          const active = i === stage;
          return (
            <div key={label} style={{ flex: 1, display: "flex", alignItems: "center" }}>
              <button
                type="button"
                onClick={() => advance(i)}
                title={label}
                aria-label={`${label} — ${done ? "مفتوح" : active ? "الحالي" : "مقفل"}`}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: "50%",
                  border: `1px solid ${done || active ? "var(--tenant-accent)" : "rgba(255,255,255,0.2)"}`,
                  background: done
                    ? "var(--tenant-accent)"
                    : active
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
                {done || active ? "🔓" : "🔒"}
              </button>
              <div style={{ textAlign: "center", flex: 1 }}>
                <div style={{ fontSize: 11, color: "rgba(244,244,246,0.75)", fontWeight: 700 }}>
                  {label}
                </div>
              </div>
              {i < CHAIN_NODES.length - 1 && (
                <div
                  style={{
                    flex: 1,
                    height: 2,
                    borderRadius: 2,
                    background: i < stage ? "var(--tenant-accent)" : "rgba(255,255,255,0.12)",
                    boxShadow: i < stage ? "0 0 8px 1px rgba(4,120,87,0.4)" : "none",
                    transition: "all 300ms ease",
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
      <p style={{ fontSize: 12, lineHeight: 1.9, color: "rgba(244, 244, 246, 0.6)", margin: 0 }}>
        محاكاة توضيحية — اضغط أي عقدة: تقدمك الحقيقي يعتمد كليًا على الدخول
        والتفاعل، والسيرفر وحده يملك التوقيت. التلاعب بساعة المتصفح لا يجدي.
      </p>
    </div>
  );
}

interface CourseProgressRow {
  courseId: string;
  title: string;
  percent: number | null;
}

export default function StudentDashboard() {
  const { token, userName } = useAuth();
  const [enrollments, setEnrollments] = useState<EnrollmentItem[] | null>(null);
  const [progress, setProgress] = useState<Record<string, number | null>>({});
  const [assignments, setAssignments] = useState<AssignmentListItem[]>([]);
  const [exams, setExams] = useState<ExamListItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    (async () => {
      try {
        const [enr, asg, exm] = await Promise.all([
          api.getMyEnrollments(token),
          api.listAssignments(token).then((r) => r.assignments),
          api.listExams(token).then((r) => r.exams),
        ]);
        if (cancelled) return;
        setEnrollments(enr);
        setAssignments(asg);
        setExams(exm);

        const settled = await Promise.allSettled(
          enr.map((e) => api.getStudentProgression(token, e.course.id)),
        );
        if (cancelled) return;
        const next: Record<string, number | null> = {};
        settled.forEach((s, i) => {
          next[enr[i].course.id] =
            s.status === "fulfilled"
              ? computeCourseProgress(s.value.progression).percent
              : null;
        });
        setProgress(next);
      } catch (e) {
        if (!cancelled)
          setError(e instanceof ApiError ? e.message : "تعذر تحميل اللوحة");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  if (!token) {
    return (
      <div className="card">
        <p>
          سجّل الدخول أولًا. <Link href="/login">تسجيل الدخول</Link>
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card">
        <p style={{ color: "#ef4444" }}>{error}</p>
      </div>
    );
  }

  if (enrollments === null) {
    return (
      <div className="card">
        <p>جاري تحميل لوحتك…</p>
      </div>
    );
  }

  const rows: CourseProgressRow[] = enrollments.map((e) => ({
    courseId: e.course.id,
    title: e.course.title,
    percent: progress[e.course.id] ?? null,
  }));

  return (
    <div className="lp-dash-bento">
      {/* mesh orbs */}
      <div
        aria-hidden
        style={{
          position: "fixed",
          top: -120,
          insetInlineEnd: -120,
          width: 420,
          height: 420,
          borderRadius: "50%",
          background: "rgba(4, 120, 87, 0.05)",
          filter: "blur(140px)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />
      <div
        aria-hidden
        style={{
          position: "fixed",
          bottom: -140,
          insetInlineStart: -140,
          width: 460,
          height: 460,
          borderRadius: "50%",
          background: "rgba(79, 70, 229, 0.04)",
          filter: "blur(140px)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      {/* 01 — welcome */}
      <section className="lp-dash-panel lp-dash-wide" style={{ padding: 28 }}>
        <p style={{ margin: 0, fontSize: 13, color: "rgba(244,244,246,0.6)" }}>
          مسارك منظم — وكل خطوة محسوبة
        </p>
        <h1 style={{ margin: "6px 0 8px", fontSize: 30, color: "#F4F4F6" }}>
          أهلاً {firstNameOf(userName)}، جاهز لخطوتك التالية اليوم؟
        </h1>
        <p style={{ margin: 0, fontSize: 14, color: "rgba(244,244,246,0.65)" }}>
          {enrollments.length === 0
            ? "اختر كورسك الأول وابدأ الرحلة."
            : `مسجل في ${enrollments.length} ${enrollments.length === 1 ? "كورس" : "كورسات"} — أكمل من حيث توقفت.`}
        </p>
        <div style={{ marginTop: 16 }}>
          <Link
            href="/student/courses"
            style={{
              display: "inline-block",
              background: "var(--tenant-accent)",
              color: "#ffffff",
              borderRadius: 999,
              padding: "12px 28px",
              fontWeight: 800,
              textDecoration: "none",
            }}
          >
            {enrollments.length === 0 ? "تصفح الكورسات" : "أكمل التعلم"}
          </Link>
        </div>
      </section>

      {/* 03 — integrity clock & tasks (tall) */}
      <aside className="lp-dash-panel lp-dash-tall" style={{ padding: 24 }}>
        <h2 style={{ fontSize: 15, margin: "0 0 4px", color: "#F4F4F6" }}>
          المهمات والمواعيد
        </h2>
        <p style={{ fontSize: 12, color: "rgba(244,244,246,0.55)", margin: "0 0 12px" }}>
          الواجبات: {assignments.length} · الاختبارات: {exams.length}
        </p>
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          <Link
            href="/student/assignments"
            style={{ flex: 1, textAlign: "center", fontSize: 13, fontWeight: 700, color: "#fff", background: "rgba(255,255,255,0.08)", borderRadius: 12, padding: "10px", textDecoration: "none" }}
          >
            واجباتي
          </Link>
          <Link
            href="/student/exams"
            style={{ flex: 1, textAlign: "center", fontSize: 13, fontWeight: 700, color: "#fff", background: "rgba(255,255,255,0.08)", borderRadius: 12, padding: "10px", textDecoration: "none" }}
          >
            اختباراتي
          </Link>
        </div>
        <ChainSimulator />
      </aside>

      {/* 02 — passports */}
      <section className="lp-dash-panel lp-dash-wide" style={{ padding: 24 }}>
        <h2 style={{ fontSize: 15, margin: "0 0 12px", color: "#F4F4F6" }}>
          جوازاتك الدراسية
        </h2>
        {rows.length === 0 ? (
          <p style={{ fontSize: 13, color: "rgba(244,244,246,0.6)" }}>
            لست مسجلًا في أي كورس بعد — <Link href="/courses">تصفح الكورسات</Link>.
          </p>
        ) : (
          <div style={{ display: "grid", gap: 12 }}>
            {rows.map((r) => (
              <PassportCard
                key={r.courseId}
                title={r.title}
                href={`/student/courses/${r.courseId}`}
                percent={r.percent}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
