"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/app/lib/auth";
import { api, ApiError, type AssignmentListItem } from "@/app/lib/api";

const STATUS_LABELS: Record<string, string> = {
  PUBLISHED: "منشور",
  DRAFT: "مسودة",
  ARCHIVED: "مؤرشف",
};

function AssignmentIcon() {
  return (
    <svg
      aria-hidden
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 3h6a1 1 0 0 1 1 1v1H8V4a1 1 0 0 1 1-1z" />
      <path d="M16 5h2a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2" />
      <path d="M9 12h6" />
      <path d="M9 16h4" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg
      aria-hidden
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

function BookIcon() {
  return (
    <svg
      aria-hidden
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg
      aria-hidden
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M19 12H5" />
      <path d="m12 19-7-7 7-7" />
    </svg>
  );
}

function PencilIcon() {
  return (
    <svg
      aria-hidden
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}

function AssignmentCard({
  assignment,
  index,
}: {
  assignment: AssignmentListItem;
  index: number;
}) {
  const status = STATUS_LABELS[assignment.status] ?? assignment.status;
  const isPublished = assignment.status === "PUBLISHED";

  return (
    <article
      className="tx-card"
      style={{ animationDelay: `${Math.min(index, 8) * 55}ms` }}
    >
      <div className="tx-card-head">
        <div className="tx-card-heading">
          <span className="tx-icon" aria-hidden>
            <AssignmentIcon />
          </span>
          <div className="tx-card-heading-copy">
            <span className="tx-kicker">واجب</span>
            <h2 className="tx-card-title">
              <Link href={`/teacher/assignments/${assignment.id}`}>
                {assignment.title}
              </Link>
            </h2>
          </div>
        </div>
        <span
          className={`tx-badge ${isPublished ? "tx-badge-live" : "tx-badge-muted"}`}
        >
          <span className="tx-badge-dot" aria-hidden />
          {status}
        </span>
      </div>

      <div className="tx-meta">
        <span className="tx-meta-item">
          <ClockIcon />
          <span>
            المدة: <strong>{assignment.timerMinutes} دقيقة</strong>
          </span>
        </span>
        {assignment.lesson && (
          <span className="tx-meta-item">
            <BookIcon />
            <span title={assignment.lesson.title}>
              الدرس: {assignment.lesson.title}
            </span>
          </span>
        )}
      </div>

      <div className="tx-actions">
        <Link className="tx-cta" href={`/teacher/assignments/${assignment.id}`}>
          فتح طابور التصحيح
          <ArrowIcon />
        </Link>
        <Link
          className="tx-cta tx-cta-outline"
          href={`/teacher/lessons/${assignment.lessonId}`}
        >
          <PencilIcon />
          تعديل الواجب
        </Link>
      </div>
    </article>
  );
}

function AssignmentState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="tx-state">
      <span className="tx-state-icon" aria-hidden>
        <AssignmentIcon />
      </span>
      <h2 className="tx-state-title">{title}</h2>
      <p className="tx-state-body">{body}</p>
      {action}
    </div>
  );
}

export default function TeacherAssignmentsPage() {
  const { token } = useAuth();
  const [items, setItems] = useState<AssignmentListItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    if (!token) return;
    setError(null);
    setItems(null);
    api
      .listAssignments(token)
      .then((r) => setItems(r.assignments))
      .catch((e) =>
        setError(e instanceof ApiError ? e.message : "تعذر تحميل الواجبات"),
      );
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  if (!token) {
    return (
      <section className="tx-shell">
        <AssignmentState
          title="سجّل الدخول أولًا"
          body="عشان تشوف الواجبات وطوابير التصحيح، محتاج تكون مسجل دخول بحساب مدرس."
          action={
            <Link className="tx-cta tx-cta-outline" href="/login">
              تسجيل الدخول
            </Link>
          }
        />
      </section>
    );
  }

  if (error) {
    return (
      <section className="tx-shell">
        <AssignmentState
          title="تعذر تحميل الواجبات"
          body={error}
          action={
            <button type="button" className="tx-cta" onClick={load}>
              حاول تاني
            </button>
          }
        />
      </section>
    );
  }

  if (items === null) {
    return (
      <section className="tx-shell" aria-busy="true" aria-live="polite">
        <header className="tx-head">
          <div>
            <span className="tx-eyebrow">
              <span className="tx-eyebrow-dot" aria-hidden />
              مركز التقييم
            </span>
            <h1 className="tx-title">الواجبات والتصحيح</h1>
            <p className="tx-sub">بنجهّز الواجبات وطوابير التصحيح…</p>
          </div>
        </header>
        <div className="tx-grid" aria-hidden>
          {[0, 1, 2].map((i) => (
            <div className="tx-skeleton" key={i}>
              <span className="tx-skeleton-line tx-skeleton-line-short" />
              <span className="tx-skeleton-line tx-skeleton-line-title" />
              <span className="tx-skeleton-line" />
              <span className="tx-skeleton-line tx-skeleton-line-cta" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="tx-shell">
      <header className="tx-head">
        <div className="tx-head-copy">
          <span className="tx-eyebrow">
            <span className="tx-eyebrow-dot" aria-hidden />
            مركز التقييم
          </span>
          <h1 className="tx-title">الواجبات والتصحيح</h1>
          <p className="tx-sub">
            راجع تسليمات الطلاب، صحح الواجبات، وسلّم الدرجات من طابور واحد.
          </p>
        </div>
        {items.length > 0 && (
          <span className="tx-count">
            <strong>{items.length}</strong>
            {items.length === 1 ? " واجب" : " واجبات"}
          </span>
        )}
      </header>

      {items.length === 0 ? (
        <AssignmentState
          title="لا توجد واجبات بعد"
          body="أنشئ واجبًا من داخل درس في الكورس، وبعد النشر هيظهر هنا جاهز للتصحيح."
          action={
            <Link className="tx-cta tx-cta-outline" href="/teacher/courses">
              روح للكورسات
            </Link>
          }
        />
      ) : (
        <div
          className={`tx-grid${items.length === 1 ? " tx-grid-single" : ""}`}
        >
          {items.map((assignment, index) => (
            <AssignmentCard
              key={assignment.id}
              assignment={assignment}
              index={index}
            />
          ))}
        </div>
      )}
    </section>
  );
}
