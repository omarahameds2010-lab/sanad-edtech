"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/app/lib/auth";
import { api } from "@/app/lib/api";
import Panel, { Metric } from "./components/Panel";

/** A metric the platform cannot yet source from the API. */
function MissingMetric({ label, reason }: { label: string; reason: string }) {
  return (
    <Panel as="article">
      <p className="tc-kpi-label">{label}</p>
      <div
        className="tc-missing"
        style={{ marginTop: 12, padding: "10px 12px" }}
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          style={{ flexShrink: 0, marginTop: 2, color: "#fbbf24" }}
          aria-hidden
        >
          <circle cx="12" cy="12" r="9" />
          <path d="M12 8v5M12 16.5v.5" />
        </svg>
        <p>{reason}</p>
      </div>
    </Panel>
  );
}

/** The AI grading action hub — pulses to teach the teacher priority. */
function ActionRow({
  title,
  count,
  href,
}: {
  title: string;
  count: number;
  href: string;
}) {
  return (
    <div className="tc-action-row">
      <p className="tc-action-title">
        <span className="tc-pulse" aria-hidden />
        {title}
      </p>
      <Link href={href} className="tc-grade-btn">
        <span className="tc-thread" aria-hidden />
        <span>صحّح الآن</span>
        <span className="tc-arrow" aria-hidden>
          ←
        </span>
      </Link>
    </div>
  );
}

export default function TeacherDashboard() {
  const { token, userName } = useAuth();
  const [pending, setPending] = useState<number | null>(null);
  const [publishedCourses, setPublishedCourses] = useState<number | null>(null);

  // Real data: the assignments grading queue, counted from the server.
  useEffect(() => {
    if (!token) return;
    let cancelled = false;

    (async () => {
      try {
        const res = await api.listAssignments(token);
        const assignments = res.assignments ?? [];

        // Each assignment exposes its own submission queue; sum the ungraded.
        const queues = await Promise.all(
          assignments.map((a) =>
            api.getSubmissionQueue(token, a.id, "SUBMITTED").catch(() => null),
          ),
        );

        if (cancelled) return;
        setPending(
          queues.reduce((sum, q) => sum + (q?.submissions?.length ?? 0), 0),
        );
      } catch {
        if (!cancelled) setPending(null);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token]);

  // Real data: the teacher's own course list now exists server-side.
  useEffect(() => {
    if (!token) return;
    let cancelled = false;

    api
      .listTeacherCourses(token)
      .then((list) => {
        if (!cancelled)
          setPublishedCourses(
            list.filter((c) => c.status === "PUBLISHED").length,
          );
      })
      .catch(() => {
        if (!cancelled) setPublishedCourses(null);
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <>
      <header style={{ marginBottom: "var(--space-8)" }}>
        <p className="tc-hello">
          صباح الخير،
          <span className="tc-name">{userName ?? "أستاذ"}</span>
        </p>
        <p className="tc-sub">أدر مساحتك التعليمية والكورسات الخاصة بك.</p>
      </header>

      <section
        aria-label="مؤشرات الأداء"
        style={{ marginBottom: "var(--space-8)" }}
      >
        <h2 className="tc-section-title">مؤشرات الأداء</h2>
        <div className="tc-metrics">
          {/* The one metric the API can source today. */}
          <Metric
            label="واجبات بانتظار التصحيح"
            value={pending ?? 0}
            href="/teacher/assignments"
          />

          <MissingMetric
            label="طلاب نشطون"
            reason="لا يوجد endpoint لروستر طلاب المعلم بعد. تُقرأ الأرقام من المـصدر فقط، ولا تُخترق."
          />
          <Metric
            label="كورسات منشورة"
            value={publishedCourses ?? 0}
            href="/teacher/publish"
          />
          <MissingMetric
            label="نسبة الإكمال"
            reason="تحليلات الإكمال غير مُتصلـة بالخادم في هذه المرحلة."
          />
          <MissingMetric
            label="الإيرادات"
            reason="لا يمكن عرض إيرادات دون ربط سجل المدفوعات؛ الرقم غير مُستمد من تعاقد."
          />
        </div>
      </section>

      <section aria-label="مركز الإجراءات">
        <h2 className="tc-section-title">مركز الإجراءات</h2>
        <div className="tc-actions">
          {pending !== null && pending > 0 ? (
            <ActionRow
              title={`${pending} واجبات بانتظار التصحيح`}
              count={pending}
              href="/teacher/assignments"
            />
          ) : (
            <Panel as="article">
              <p
                className="tc-action-title"
                style={{ color: "var(--tc-ink-dim)" }}
              >
                <span className="tc-pulse" aria-hidden />
                {pending === null
                  ? "جارٍ قراءة طابور التصحيح من الخادم…"
                  : "لا توجد واجبات بانتظار التصحيح الآن."}
              </p>
            </Panel>
          )}

          <Panel as="article">
            <p
              className="tc-action-title"
              style={{ color: "var(--tc-ink-dim)" }}
            >
              حالت الفيديو وإعداد الكورسات وبقية الإجراءات تحتاج ربط واجهاتها
              الخاصة؛ لن تُعرض كإجراءات وهمية.
            </p>
          </Panel>
        </div>
      </section>
    </>
  );
}
