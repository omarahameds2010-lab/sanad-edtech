"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/app/lib/auth";
import { api, ApiError, type TeacherStudent } from "@/app/lib/api";

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: "نشط",
  SUSPENDED: "موقوف",
  PENDING: "قيد التفعيل",
  DELETED: "محذوف",
};

function statusLabel(status: string): string {
  return STATUS_LABELS[status] ?? status;
}

function UsersIcon({ size = 20 }: { size?: number }) {
  return (
    <svg
      aria-hidden
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function PulseIcon() {
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
      <path d="M3 12h4l2.5-7 5 14 2.5-7h4" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg
      aria-hidden
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.2-3.2" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg
      aria-hidden
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 4.2 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}

function BookIcon() {
  return (
    <svg
      aria-hidden
      width="14"
      height="14"
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
      width="15"
      height="15"
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

function StudentCourses({ student }: { student: TeacherStudent }) {
  if (student.enrollments.length === 0) {
    return <span className="st-muted">بدون كورسات</span>;
  }

  return (
    <span className="st-courses">
      {student.enrollments.map((enrollment) => (
        <span className="st-course" key={enrollment.course.id}>
          {enrollment.course.title}
        </span>
      ))}
    </span>
  );
}

function StudentCard({
  student,
  index,
}: {
  student: TeacherStudent;
  index: number;
}) {
  const active = student.status === "ACTIVE";
  const status = statusLabel(student.status);

  return (
    <article
      className="st-card"
      style={{ animationDelay: `${Math.min(index, 8) * 45}ms` }}
    >
      <div className="st-card-top">
        <div className="st-card-identity">
          <div className="st-card-name-row">
            <h3 className="st-card-name">{student.name}</h3>
            <span className={`st-card-status${active ? "" : " is-off"}`}>
              <span className="st-dot" aria-hidden />
              {status}
            </span>
          </div>
          {student.grade && (
            <span className="st-card-grade">{student.grade}</span>
          )}
        </div>
      </div>

      <div className="st-card-lines">
        <div className="st-card-line">
          <PhoneIcon />
          <span className="st-phone" dir="ltr">
            {student.phone ?? "—"}
          </span>
        </div>
        <div className="st-card-line st-card-line-courses">
          <BookIcon />
          <StudentCourses student={student} />
        </div>
      </div>

      <Link className="st-card-cta" href={`/teacher/students/${student.id}`}>
        فتح الملف
        <ArrowIcon />
      </Link>
    </article>
  );
}

function StudentState({
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
        <UsersIcon size={24} />
      </span>
      <h2 className="tx-state-title">{title}</h2>
      <p className="tx-state-body">{body}</p>
      {action}
    </div>
  );
}

export default function TeacherStudentsPage() {
  const { token } = useAuth();
  const [students, setStudents] = useState<TeacherStudent[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const load = useCallback(() => {
    if (!token) return;
    setError(null);
    setStudents(null);
    api
      .listStudents(token)
      .then(setStudents)
      .catch((e) =>
        setError(e instanceof ApiError ? e.message : "تعذر تحميل الطلاب"),
      );
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    if (!students) return [];
    const q = search.trim().toLowerCase();
    if (q === "") return students;
    return students.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.phone ?? "").includes(q) ||
        s.enrollments.some((e) => e.course.title.toLowerCase().includes(q)),
    );
  }, [students, search]);

  if (!token) {
    return (
      <section className="tx-shell">
        <StudentState
          title="سجّل الدخول أولًا"
          body="عشان تشوف سجل الطلاب وملفاتهم، محتاج تكون مسجل دخول بحساب مدرس."
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
        <StudentState
          title="تعذر تحميل الطلاب"
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

  if (students === null) {
    return (
      <section className="tx-shell" aria-busy="true" aria-live="polite">
        <header className="tx-head">
          <div>
            <span className="tx-eyebrow">
              <span className="tx-eyebrow-dot" aria-hidden />
              سجل الطلاب
            </span>
            <h1 className="tx-title">الطلاب</h1>
            <p className="tx-sub">بنجهّز سجل الطلاب وبيانات الكورسات…</p>
          </div>
        </header>

        <div className="st-stats" aria-hidden>
          {[0, 1].map((i) => (
            <div className="st-stat st-stat-skeleton" key={i}>
              <span className="tx-skeleton-line tx-skeleton-line-short" />
              <span className="tx-skeleton-line st-skeleton-value" />
              <span className="tx-skeleton-line" />
            </div>
          ))}
        </div>

        <div className="st-loading" aria-hidden>
          {[0, 1, 2, 3].map((i) => (
            <div className="st-loading-row" key={i}>
              <span className="tx-skeleton-line" />
              <span className="tx-skeleton-line st-loading-line-sm" />
              <span className="tx-skeleton-line st-loading-line-wide" />
              <span className="tx-skeleton-line st-loading-line-cta" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  const activeCount = students.filter((s) => s.status === "ACTIVE").length;
  const searching = search.trim() !== "";

  return (
    <section className="tx-shell">
      <header className="tx-head">
        <div className="tx-head-copy">
          <span className="tx-eyebrow">
            <span className="tx-eyebrow-dot" aria-hidden />
            سجل الطلاب
          </span>
          <h1 className="tx-title">الطلاب</h1>
          <p className="tx-sub">
            شوف طلابك وكورساتهم وحالة كل حساب، وافتح ملف الطالب لمراجعة تقدمه
            ونتائجه.
          </p>
        </div>
      </header>

      <div className="st-stats" aria-label="ملخص الطلاب">
        <div className="st-stat">
          <div className="st-stat-top">
            <span className="st-stat-label">إجمالي الطلاب</span>
            <span className="st-stat-icon" aria-hidden>
              <UsersIcon />
            </span>
          </div>
          <div className="st-stat-value">{students.length}</div>
          <div className="st-stat-foot">مسجلون في كورساتك</div>
        </div>

        <div className="st-stat st-stat-live">
          <div className="st-stat-top">
            <span className="st-stat-label">حسابات نشطة</span>
            <span className="st-stat-icon" aria-hidden>
              <PulseIcon />
            </span>
          </div>
          <div className="st-stat-value">{activeCount}</div>
          <div className="st-stat-foot">من إجمالي الطلاب</div>
        </div>
      </div>

      <div className="st-toolbar">
        <label className="st-search">
          <span className="st-search-icon" aria-hidden>
            <SearchIcon />
          </span>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث بالاسم أو الموبايل أو الكورس…"
            aria-label="ابحث عن طالب"
          />
        </label>
        {searching && (
          <span className="st-results" role="status">
            {filtered.length} من {students.length}
          </span>
        )}
      </div>

      {students.length === 0 ? (
        <StudentState
          title="لا يوجد طلاب في كورساتك بعد"
          body="أول ما يشترك طالب في كورس من كورساتك، هتلاقي ملفه وبياناته هنا."
          action={
            <Link className="tx-cta tx-cta-outline" href="/teacher/courses">
              روح للكورسات
            </Link>
          }
        />
      ) : filtered.length === 0 ? (
        <div className="st-no-results">
          <p>مفيش طالب مطابق لبحثك.</p>
          <button
            type="button"
            className="tx-cta tx-cta-outline"
            onClick={() => setSearch("")}
          >
            امسح البحث
          </button>
        </div>
      ) : (
        <>
          <div className="st-table-card">
            <table className="st-table">
              <thead>
                <tr>
                  <th scope="col">الطالب</th>
                  <th scope="col">الموبايل</th>
                  <th scope="col">الكورسات</th>
                  <th scope="col">
                    <span className="st-sr-only">ملف الطالب</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((student) => {
                  const active = student.status === "ACTIVE";
                  return (
                    <tr className="st-row" key={student.id}>
                      <td className="st-cell">
                        <span className="st-name-line">
                          <span
                            className={`st-dot${active ? "" : " is-off"}`}
                            role="img"
                            aria-label={`حالة الحساب: ${statusLabel(student.status)}`}
                          />
                          <span className="st-name">{student.name}</span>
                        </span>
                        {student.grade && (
                          <span className="st-grade">{student.grade}</span>
                        )}
                      </td>
                      <td className="st-cell">
                        <span className="st-phone" dir="ltr">
                          {student.phone ?? "—"}
                        </span>
                      </td>
                      <td className="st-cell">
                        <StudentCourses student={student} />
                      </td>
                      <td className="st-cell st-cell-action">
                        <Link
                          className="st-open"
                          href={`/teacher/students/${student.id}`}
                        >
                          فتح الملف
                          <ArrowIcon />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="st-cards">
            {filtered.map((student, index) => (
              <StudentCard
                student={student}
                index={index}
                key={student.id}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
