"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/app/lib/auth";
import { api, ApiError, type ExamListItem } from "@/app/lib/api";
import {
  AssessmentCard,
  AssessmentEmpty,
  AssessmentNoResults,
  AssessmentPageHeader,
  AssessmentSidebar,
  AssessmentSkeleton,
  AssessmentToolbar,
  type AssessmentFilter,
} from "../components/AssessmentIndex";

const STATUS_LABELS: Record<string, string> = {
  PUBLISHED: "منشور",
  DRAFT: "مسودة",
  ARCHIVED: "مؤرشف",
};

const FILTERS: AssessmentFilter[] = [
  { id: "all", label: "الكل" },
  { id: "published", label: "منشور" },
  { id: "draft", label: "مسودة" },
  { id: "pending", label: "بحاجة لتصحيح" },
];

interface PendingSummary {
  byId: Record<string, number>;
  total: number;
  capped: boolean;
  failed: boolean;
}

async function fetchPendingSummary(
  token: string,
  exams: ExamListItem[],
): Promise<PendingSummary> {
  let failed = false;
  let capped = false;

  // There is no aggregate endpoint yet; each exam's grading queue is the only
  // honest source for ungraded work. Fetch in parallel and fail soft so the
  // list itself still renders if one queue is unavailable.
  const entries = await Promise.all(
    exams.map(async (exam) => {
      try {
        const queue = await api.getGradingQueue(token, exam.id, undefined, 100);
        if (queue.nextCursor) capped = true;
        const count = queue.attempts.filter(
          (attempt) =>
            attempt.status === "SUBMITTED" || attempt.status === "TIMED_OUT",
        ).length;
        return [exam.id, count] as const;
      } catch {
        failed = true;
        return [exam.id, 0] as const;
      }
    }),
  );

  return {
    byId: Object.fromEntries(entries),
    total: entries.reduce((sum, [, count]) => sum + count, 0),
    capped,
    failed,
  };
}

export default function TeacherExamsPage() {
  const { token } = useAuth();
  const [exams, setExams] = useState<ExamListItem[] | null>(null);
  const [pending, setPending] = useState<PendingSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const requestSeq = useRef(0);

  const load = useCallback(() => {
    if (!token) return;
    const seq = ++requestSeq.current;

    setError(null);
    setExams(null);
    setPending(null);

    api
      .listTeacherExams(token)
      .then(async (result) => {
        if (seq !== requestSeq.current) return;
        setExams(result.exams);

        if (result.exams.length === 0) {
          setPending({ byId: {}, total: 0, capped: false, failed: false });
          return;
        }

        const summary = await fetchPendingSummary(token, result.exams);
        if (seq !== requestSeq.current) return;
        setPending(summary);
      })
      .catch((e) => {
        if (seq !== requestSeq.current) return;
        setError(e instanceof ApiError ? e.message : "تعذر تحميل الاختبارات");
      });
  }, [token]);

  useEffect(() => {
    load();
    return () => {
      requestSeq.current += 1;
    };
  }, [load]);

  const publishedCount =
    exams?.filter((exam) => exam.status === "PUBLISHED").length ?? 0;
  const draftCount =
    exams?.filter((exam) => exam.status === "DRAFT").length ?? 0;

  const pendingCount =
    pending && !pending.failed && exams
      ? exams.filter((exam) => (pending.byId[exam.id] ?? 0) > 0).length
      : undefined;

  const filters = FILTERS.map((item) => {
    if (item.id === "all") return { ...item, count: exams?.length };
    if (item.id === "published") return { ...item, count: publishedCount };
    if (item.id === "draft") return { ...item, count: draftCount };
    return {
      ...item,
      count: pendingCount,
      disabled: !pending || pending.failed,
    };
  });

  const visible = useMemo(() => {
    if (!exams) return [];
    const query = search.trim().toLowerCase();

    return exams.filter((exam) => {
      if (filter === "published" && exam.status !== "PUBLISHED") return false;
      if (filter === "draft" && exam.status !== "DRAFT") return false;
      if (filter === "pending" && !((pending?.byId[exam.id] ?? 0) > 0)) {
        return false;
      }
      if (query === "") return true;

      return [exam.title, exam.description ?? "", exam.lesson?.title ?? ""].some(
        (value) => value.toLowerCase().includes(query),
      );
    });
  }, [exams, filter, pending, search]);

  const clearFilters = () => {
    setSearch("");
    setFilter("all");
  };

  const pendingState: "loading" | "ready" | "failed" = !pending
    ? "loading"
    : pending.failed
      ? "failed"
      : "ready";

  if (!token) {
    return (
      <section className="tx-shell">
        <AssessmentEmpty
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
        <AssessmentEmpty
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
        <AssessmentPageHeader
          eyebrow="مركز التقييم"
          title="الاختبارات والتصحيح"
          sub="بنجهّز الاختبارات وطوابير التصحيح…"
        />
        <AssessmentSkeleton />
      </section>
    );
  }

  return (
    <section className="tx-shell">
      <AssessmentPageHeader
        eyebrow="مركز التقييم"
        title="الاختبارات والتصحيح"
        sub="افتح طابور التصحيح، راجع إجابات الطلاب، وسلّم الدرجات من مكان واحد."
        actionHref="/teacher/courses"
        actionLabel="اختبار جديد"
        actionTitle="اختار كورس ودرس لإضافة اختبار"
      />

      <div className="tx-layout">
        <div className="tx-main">
          {exams.length > 0 && (
            <AssessmentToolbar
              search={search}
              onSearchChange={setSearch}
              placeholder="ابحث في الاختبارات بالاسم أو الدرس…"
              filters={filters}
              activeFilter={filter}
              onFilterChange={setFilter}
            />
          )}

          {exams.length === 0 ? (
            <AssessmentEmpty
              title="لا توجد اختبارات بعد"
              body="أنشئ اختبارًا من داخل درس في الكورس، وبعد النشر هيظهر هنا جاهز للتصحيح."
              action={
                <Link className="tx-cta tx-cta-outline" href="/teacher/courses">
                  روح للكورسات
                </Link>
              }
            />
          ) : visible.length === 0 ? (
            <AssessmentNoResults onClear={clearFilters} />
          ) : (
            <div className="tx-list">
              {visible.map((exam, index) => (
                <AssessmentCard
                  key={exam.id}
                  kind="exam"
                  index={index}
                  item={{
                    title: exam.title,
                    statusLabel: STATUS_LABELS[exam.status] ?? exam.status,
                    isLive: exam.status === "PUBLISHED",
                    description: exam.description,
                    timerMinutes: exam.timerMinutes,
                    lessonTitle: exam.lesson?.title,
                    href: `/teacher/exams/${exam.id}`,
                    editHref: `/teacher/lessons/${exam.lessonId}`,
                  }}
                />
              ))}
            </div>
          )}
        </div>

        <AssessmentSidebar
          published={publishedCount}
          pending={pending?.failed ? null : (pending?.total ?? null)}
          pendingState={pendingState}
          pendingCapped={pending?.capped}
          total={exams.length}
          labels={{
            published: "اختبارات منشورة",
            pending: "بانتظار التصحيح",
            total: "إجمالي الاختبارات",
            pendingFoot: "محاولات مُسلّمة",
            totalFoot: "كل الحالات",
          }}
        />
      </div>
    </section>
  );
}
