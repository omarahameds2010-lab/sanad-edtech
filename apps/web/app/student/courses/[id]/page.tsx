"use client";

import { use } from "react";
import Link from "next/link";
import { useAuth } from "@/app/lib/auth";
import { useCurriculum } from "@/app/student/courses/lib/use-curriculum";
import { CurriculumBoard } from "./components/CurriculumBoard";

function StateShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="sc-canvas lc-page">
      <div className="lp-container" style={{ maxWidth: 1180 }}>
        {children}
      </div>
    </div>
  );
}

export default function StudentCourseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: courseId } = use(params);
  const { token, ready } = useAuth();

  const { structure, tasks, loading, enriching, error } = useCurriculum(
    token,
    courseId,
  );

  if (!ready) {
    return (
      <StateShell>
        <div className="lc-state-card">
          <span className="lc-spinner" aria-hidden="true" />
          <p>جارٍ استعادة الجلسة…</p>
        </div>
      </StateShell>
    );
  }

  if (!token) {
    return (
      <StateShell>
        <div className="lc-state-card">
          <p className="lc-eyebrow">فهرس الكورس</p>
          <h1 className="lc-state-title">سجّل الدخول لعرض المسار</h1>
          <p>فهرس الكورس وحالات المهام مرتبطة بحسابك.</p>
          <Link href="/login" className="lc-outline-btn">
            تسجيل الدخول
          </Link>
        </div>
      </StateShell>
    );
  }

  if (loading) {
    return (
      <StateShell>
        <div className="lc-state-card">
          <span className="lc-spinner" aria-hidden="true" />
          <p>جارٍ تحميل فهرس الكورس…</p>
        </div>
      </StateShell>
    );
  }

  if (error || !structure) {
    return (
      <StateShell>
        <div className="lc-state-card">
          <p className="lc-eyebrow">تعذر فتح المسار</p>
          <h1 className="lc-state-title">{error ?? "لم نجد هذا الكورس"}</h1>
          <p>ارجع إلى قائمة كورساتك واختر المسار مرة أخرى.</p>
          <Link href="/student/courses" className="lc-outline-btn">
            العودة إلى كورساتي
          </Link>
        </div>
      </StateShell>
    );
  }

  return (
    <div className="sc-canvas lc-page">
      <div className="lp-container" style={{ maxWidth: 1180 }}>
        <CurriculumBoard
          courseId={structure.course.id}
          structure={structure}
          tasks={tasks}
          enriching={enriching}
        />
      </div>
    </div>
  );
}
