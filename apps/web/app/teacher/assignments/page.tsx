"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/app/lib/auth";
import { api, ApiError, type AssignmentListItem } from "@/app/lib/api";
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
  assignments: AssignmentListItem[],
): Promise<PendingSummary> {
  let failed = false;
  let capped = false;

  // The submission queue is the only honest source for ungraded work until an
  // aggregate endpoint exists. Fetch in parallel and fail soft: the list must
  // still render even if one queue cannot be read.
  const entries = await Promise.all(
    assignments.map(async (assignment) => {
      try {
        const queue = await api.getSubmissionQueue(
          token,
          assignment.id,
          undefined,
          100,
        );
        if (queue.nextCursor) capped = true;
        const count = queue.submissions.filter(
          (submission) =>
            submission.status === "SUBMITTED" || submission.status === "LATE",
        ).length;
        return [assignment.id, count] as const;
      } catch {
        failed = true;
        return [assignment.id, 0] as const;
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

export default function TeacherAssignmentsPage() {
  const { token } = useAuth();
  const [items, setItems] = useState<AssignmentListItem[] | null>(null);
  const [pending, setPending] = useState<PendingSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const requestSeq = useRef(0);

  const load = useCallback(() => {
    if (!token) return;
    const seq = ++requestSeq.current;

    setError(null);
    setItems(null);
    setPending(null);

    api
      .listAssignments(token)
      .then(async (result) => {
        if (seq !== requestSeq.current) return;
        setItems(result.assignments);

        if (result.assignments.length === 0) {
          setPending({ byId: {}, total: 0, capped: false, failed: false });
          return;
        }

        const summary = await fetchPendingSummary(token, result.assignments);
        if (seq !== requestSeq.current) return;
        setPending(summary);
      })
      .catch((e) => {
        if (seq !== requestSeq.current) return;
        setError(e instanceof ApiError ? e.message : "تعذر تحميل الواجبات");
      });
  }, [token]);

  useEffect(() => {
    load();
    return () => {
      requestSeq.current += 1;
    };
  }, [load]);

  const publishedCount =
    items?.filter((item) => item.status === "PUBLISHED").length ?? 0;
  const draftCount =
    items?.filter((item) => item.status === "DRAFT").length ?? 0;

  const pendingCount =
    pending && !pending.failed && items
      ? items.filter((item) => (pending.byId[item.id] ?? 0) > 0).length
      : undefined;

  const filters = FILTERS.map((item) => {
    if (item.id === "all") return { ...item, count: items?.length };
    if (item.id === "published") return { ...item, count: publishedCount };
    if (item.id === "draft") return { ...item, count: draftCount };
    return {
      ...item,
      count: pendingCount,
      disabled: !pending || pending.failed,
    };
  });

  const visible = useMemo(() => {
    if (!items) return [];
    const query = search.trim().toLowerCase();

    return items.filter((item) => {
      if (filter === "published" && item.status !== "PUBLISHED") return false;
      if (filter === "draft" && item.status !== "DRAFT") return false;
      if (filter === "pending" && !((pending?.byId[item.id] ?? 0) > 0)) {
        return false;
      }
      if (query === "") return true;

      return [
        item.title,
        item.description ?? "",
        item.lesson?.title ?? "",
      ].some((value) => value.toLowerCase().includes(query));
    });
  }, [filter, items, pending, search]);

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
        <AssessmentEmpty
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
        <AssessmentPageHeader
          eyebrow="مركز التقييم"
          title="الواجبات والتصحيح"
          sub="بنجهّز الواجبات وطوابير التصحيح…"
        />
        <AssessmentSkeleton />
      </section>
    );
  }

  return (
    <section className="tx-shell">
      <AssessmentPageHeader
        eyebrow="مركز التقييم"
        title="الواجبات والتصحيح"
        sub="راجع تسليمات الطلاب، صحح الواجبات، وسلّم الدرجات من طابور واحد."
        actionHref="/teacher/courses"
        actionLabel="واجب جديد"
        actionTitle="اختار كورس ودرس لإضافة واجب"
      />

      <div className="tx-layout">
        <div className="tx-main">
          {items.length > 0 && (
            <AssessmentToolbar
              search={search}
              onSearchChange={setSearch}
              placeholder="ابحث في الواجبات بالاسم أو الدرس…"
              filters={filters}
              activeFilter={filter}
              onFilterChange={setFilter}
            />
          )}

          {items.length === 0 ? (
            <AssessmentEmpty
              title="لا توجد واجبات بعد"
              body="أنشئ واجبًا من داخل درس في الكورس، وبعد النشر هيظهر هنا جاهز للتصحيح."
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
              {visible.map((item, index) => (
                <AssessmentCard
                  key={item.id}
                  kind="assignment"
                  index={index}
                  item={{
                    title: item.title,
                    statusLabel: STATUS_LABELS[item.status] ?? item.status,
                    isLive: item.status === "PUBLISHED",
                    description: item.description,
                    timerMinutes: item.timerMinutes,
                    lessonTitle: item.lesson?.title,
                    href: `/teacher/assignments/${item.id}`,
                    editHref: `/teacher/lessons/${item.lessonId}`,
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
          total={items.length}
          labels={{
            published: "واجبات منشورة",
            pending: "بانتظار التصحيح",
            total: "إجمالي الواجبات",
            pendingFoot: "تسليمات بانتظار التصحيح",
            totalFoot: "كل الحالات",
          }}
        />
      </div>
    </section>
  );
}
