"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/app/lib/auth";
import { api, ApiError, type ExamListItem } from "@/app/lib/api";

const STATUS_LABELS: Record<string, string> = {
  PUBLISHED: "منشور",
  DRAFT: "مسودة",
  ARCHIVED: "مؤرشف",
};

function ExamIcon() {
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
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
      <path d="M8 13h8" />
      <path d="M8 17h5" />
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

function ExamCard({ exam, index }: { exam: ExamListItem; index: number }) {
  const status = STATUS_LABELS[exam.status] ?? exam.status;
  const isPublished = exam.status === "PUBLISHED";
  const description = exam.description?.trim();

  return (
    <article
      className="tx-card"
      style={{ animationDelay: `${Math.min(index, 8) * 55}ms` }}
    >
      <div className="tx-card-head">
        <div className="tx-card-heading">
          <span className="tx-icon" aria-hidden>
            <ExamIcon />
          </span>
          <div className="tx-card-heading-copy">
            <span className="tx-kicker">اختبار</span>
            <h2 className="tx-card-title">
              <Link href={`/teacher/exams/${exam.id}`}>{exam.title}</Link>
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

      {description && <p className="tx-card-desc">{description}</p>}

      <div className="tx-meta">
        <span className="tx-meta-item">
          <ClockIcon />
          <span>
            المدة: <strong>{exam.timerMinutes} دقيقة</strong>
          </span>
        </span>
        {exam.lesson && (
          <span className="tx-meta-item">
            <BookIcon />
            <span title={exam.lesson.title}>{exam.lesson.title}</span>
          </span>
        )}
      </div>

      <div className="tx-actions">
        <Link className="tx-cta" href={`/teacher/exams/${exam.id}`}>
          فتح طابور التصحيح
          <ArrowIcon />
        </Link>
        <span className="tx-actions-hint">الإجابات والدرجات في نفس المكان</span>
      </div>
    </article>
  );
}

function ExamState({
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
        <ExamIcon />
      </span>
      <h2 className="tx-state-title">{title}</h2>
      <p className="tx-state-body">{body}</p>
      {action}
    </div>
  );
}

export default function TeacherExamsPage() {
  const { token } = useAuth();
  const [exams, setExams] = useState<ExamListItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    if (!token) return;
    setError(null);
    setExams(null);
    api
      .listExams(token)
      .then((r) => setExams(r.exams))
      .catch((e) =>
        setError(e instanceof ApiError ? e.message : "تعذر تحميل الاختبارات"),
      );
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  if (!token) {
    return (
      <section className="tx-shell">
        <ExamState
          title="سجّل الدخول أولًا"
          body="عشان تشوف الاختبارات وطابور التصحيح، محتاج تكون مسجل دخول بحساب مدرس."
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
        <ExamState
          title="تعذر تحميل الاختبارات"
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

  if (exams === null) {
    return (
      <section className="tx-shell" aria-busy="true" aria-live="polite">
        <header className="tx-head">
          <div>
            <span className="tx-eyebrow">
              <span className="tx-eyebrow-dot" aria-hidden />
              مركز التقييم
            </span>
            <h1 className="tx-title">الاختبارات والتصحيح</h1>
            <p className="tx-sub">
              بنجهّز الاختبارات وطوابير التصحيح…
            </p>
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
          <h1 className="tx-title">الاختبارات والتصحيح</h1>
          <p className="tx-sub">
            افتح طابور التصحيح، راجع إجابات الطلاب، وسلّم الدرجات من مكان واحد.
          </p>
        </div>
        {exams.length > 0 && (
          <span className="tx-count">
            <strong>{exams.length}</strong>
            {exams.length === 1 ? " اختبار منشور" : " اختبارات منشورة"}
          </span>
        )}
      </header>

      {exams.length === 0 ? (
        <ExamState
          title="لا توجد اختبارات منشورة بعد"
          body="أنشئ اختبارًا من داخل درس في الكورس، وبعد النشر هيظهر هنا جاهز للتصحيح."
          action={
            <Link className="tx-cta tx-cta-outline" href="/teacher/courses">
              روح للكورسات
            </Link>
          }
        />
      ) : (
        <div
          className={`tx-grid${exams.length === 1 ? " tx-grid-single" : ""}`}
        >
          {exams.map((exam, index) => (
            <ExamCard key={exam.id} exam={exam} index={index} />
          ))}
        </div>
      )}
    </section>
  );
}
