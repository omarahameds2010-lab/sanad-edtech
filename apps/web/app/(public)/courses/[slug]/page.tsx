"use client";

import { useEffect, useMemo, useRef, useState, type MouseEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/lib/auth";
import {
  api,
  ApiError,
  type CourseStructure,
  type StructureLesson,
} from "@/app/lib/api";

/* ------------------------------------------------------------------
   "The Editor's Stage" — public course page.
   Paper & ink, 7:5 asymmetric grid (RTL), glassmorphic sticky rail,
   ledger curriculum. Numbers shown are server data only.
   ------------------------------------------------------------------ */

const CONTENT_TYPES = new Set(["VIDEO", "PDF", "RESOURCE", "LIVE"]);

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} دقيقة`;
  const h = Math.floor(minutes / 60);
  const rem = minutes % 60;
  const hLabel =
    h === 1
      ? "ساعة"
      : h === 2
        ? "ساعتين"
        : h <= 10
          ? `${h} ساعات`
          : `${h} ساعة`;
  return rem === 0 ? hLabel : `${hLabel} و${rem} دقيقة`;
}

function lessonsLabel(n: number): string {
  if (n === 1) return "درس واحد";
  if (n === 2) return "درسان";
  if (n <= 10) return `${n} دروس`;
  return `${n} درسًا`;
}

/* --- Icons (stroke 1.5, editorial — no emoji) ---------------------- */

function IconTeacher() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="8.2" r="3.4" />
      <path d="M5.2 20c.9-3.4 3.6-5.4 6.8-5.4s5.9 2 6.8 5.4" />
    </svg>
  );
}

function IconBook() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4.5 5A2.5 2.5 0 0 1 7 2.5h12.5V17H7A2.5 2.5 0 0 0 4.5 19.5z" />
      <path d="M4.5 19.5A2.5 2.5 0 0 1 7 17h12.5v4.5H7a2.5 2.5 0 0 1-2.5-2z" />
    </svg>
  );
}

function IconClock() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </svg>
  );
}

function IconLock() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="6" y="10.5" width="12" height="8" rx="2" />
      <path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" />
    </svg>
  );
}

function TypeIcon({ type }: { type: string }) {
  switch (type) {
    case "VIDEO":
      return (
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="8.5" />
          <path d="M10.2 8.8l5 3.2-5 3.2z" />
        </svg>
      );
    case "EXAM":
    case "QUIZ":
      return (
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="5.5" y="4.5" width="13" height="15.5" rx="1.8" />
          <path d="M9 9.5h6M9 13h6M9 16.5h3.5" />
        </svg>
      );
    case "ASSIGNMENT":
      return (
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M4.5 19.5l4.3-1L20 7.3a2.05 2.05 0 0 0-2.9-2.9L5.8 15.6l-1.3 3.9z" />
          <path d="M15.6 6l2.9 2.9" />
        </svg>
      );
    case "LIVE":
      return (
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="2.2" />
          <path d="M8.3 8.3a5.2 5.2 0 0 0 0 7.4M15.7 8.3a5.2 5.2 0 0 1 0 7.4" />
        </svg>
      );
    case "RESOURCE":
      return (
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M4 7a2 2 0 0 1 2-2h3.6l2 2.5H18a2 2 0 0 1 2 2V17a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" />
        </svg>
      );
    default:
      return (
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M7 3.5h6.5L18 8v12.5H7z" />
          <path d="M13.5 3.5V8H18" />
        </svg>
      );
  }
}

/* --- Lesson row ---------------------------------------------------- */

function LessonRow({
  lesson,
  onLocked,
}: {
  lesson: StructureLesson;
  onLocked: () => void;
}) {
  const locked = lesson.lockStatus === "LOCKED";
  const hint = "أكمل الدرس السابق لفتح هذا الدرس";
  const inner = (
    <>
      <span className="stage-row-icon">
        <TypeIcon type={lesson.type} />
      </span>
      <span className="stage-row-title">{lesson.title}</span>
      {lesson.isFree && <span className="stage-badge-free">معاينة مجانية</span>}
      {locked && (
        <span className="stage-lock" data-tip={hint} aria-hidden="true">
          <IconLock />
        </span>
      )}
    </>
  );
  if (locked) {
    return (
      <button
        type="button"
        className="stage-row stage-row-locked"
        onClick={onLocked}
        aria-label={`${lesson.title} — ${hint}`}
      >
        {inner}
      </button>
    );
  }
  return <div className="stage-row">{inner}</div>;
}

/* --- Page ---------------------------------------------------------- */

export default function PublicCoursePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { token } = useAuth();
  const router = useRouter();
  const [slug, setSlug] = useState<string | null>(null);
  const [data, setData] = useState<CourseStructure | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [enrolling, setEnrolling] = useState(false);
  const [enrolled, setEnrolled] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const redirectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    params.then((p) => setSlug(p.slug));
  }, [params]);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    setError(null);
    setData(null);
    api
      .getCourseStructureBySlug(slug)
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch((e) => {
        if (!cancelled)
          setError(e instanceof ApiError ? e.message : "تعذر تحميل المحتوى");
      });
    return () => {
      cancelled = true;
    };
  }, [slug, reloadKey]);

  // Quietly reflect an existing active enrollment in the rail's success state.
  useEffect(() => {
    if (!token || !data) return;
    let cancelled = false;
    api
      .getMyEnrollments(token)
      .then((list) => {
        if (
          !cancelled &&
          Array.isArray(list) &&
          list.some(
            (e) => e.course?.id === data.course.id && e.status === "ACTIVE",
          )
        ) {
          setEnrolled(true);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [token, data]);

  useEffect(
    () => () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
      if (redirectTimer.current) clearTimeout(redirectTimer.current);
    },
    [],
  );

  function showToast(msg: string) {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2800);
  }

  const lessonCount = data
    ? data.sections.reduce((n, s) => n + s.lessons.length, 0)
    : 0;

  const contentMinutes = useMemo(() => {
    if (!data) return 0;
    let seconds = 0;
    for (const s of data.sections) {
      for (const l of s.lessons) {
        if (CONTENT_TYPES.has(l.type) && l.duration && l.duration > 0) {
          seconds += l.duration;
        }
      }
    }
    return Math.round(seconds / 60);
  }, [data]);

  async function handleEnroll() {
    if (!token) {
      router.push("/login");
      return;
    }
    if (!data || enrolled || enrolling) return;
    setEnrolling(true);
    try {
      await api.enrollCourse(token, data.course.id);
      setEnrolled(true);
      showToast("تم تسجيلك في الكورس — بالتوفيق!");
      redirectTimer.current = setTimeout(
        () => router.push("/student/courses"),
        1400,
      );
    } catch (e) {
      if (e instanceof ApiError && e.status === 409) {
        setEnrolled(true);
        showToast("أنت مسجل في الكورس بالفعل.");
      } else {
        showToast(
          e instanceof ApiError ? e.message : "تعذر التسجيل — حاول تاني",
        );
      }
    } finally {
      setEnrolling(false);
    }
  }

  function onCtaMove(e: MouseEvent<HTMLButtonElement>) {
    const el = e.currentTarget;
    if (el.disabled) return;
    const r = el.getBoundingClientRect();
    const dx = ((e.clientX - (r.left + r.width / 2)) / (r.width / 2)) * 2;
    const dy = ((e.clientY - (r.top + r.height / 2)) / (r.height / 2)) * 2;
    el.style.setProperty("--pull-x", `${dx.toFixed(1)}px`);
    el.style.setProperty("--pull-y", `${dy.toFixed(1)}px`);
  }

  function onCtaLeave(e: MouseEvent<HTMLButtonElement>) {
    const el = e.currentTarget;
    el.style.setProperty("--pull-x", "0px");
    el.style.setProperty("--pull-y", "0px");
  }

  function onRailMove(e: MouseEvent<HTMLElement>) {
    const el = e.currentTarget;
    const r = el.getBoundingClientRect();
    el.style.setProperty(
      "--mx",
      `${(((e.clientX - r.left) / r.width) * 100).toFixed(1)}%`,
    );
    el.style.setProperty(
      "--my",
      `${(((e.clientY - r.top) / r.height) * 100).toFixed(1)}%`,
    );
  }

  /* --- states ------------------------------------------------------ */

  if (error) {
    return (
      <div className="stage-root">
        <div className="stage-ghost-wrap">
          <div className="stage-ghost" aria-hidden="true">
            ع
          </div>
        </div>
        <div className="stage-shell">
          <nav className="stage-crumbs">
            <Link href="/courses">الكورسات</Link>
          </nav>
          <div className="stage-error">
            <p className="stage-error-title">تعذر تحميل المحتوى</p>
            <p className="stage-error-sub">
              حصلت مشكلة بسيطة وإحنا بنجيب بيانات الكورس.
            </p>
            <button
              type="button"
              className="stage-btn"
              onClick={() => setReloadKey((k) => k + 1)}
            >
              إعادة المحاولة
            </button>
            <div>
              <Link className="stage-btn-ghost" href="/courses">
                أو ارجع لكل الكورسات ←
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="stage-root">
        <div className="stage-ghost-wrap">
          <div className="stage-ghost" aria-hidden="true">
            ع
          </div>
        </div>
        <div className="stage-shell">
          <div className="stage-crumbs">
            <span className="stage-sk" style={{ width: 220, height: 14 }} />
          </div>
          <div className="stage-grid">
            <section className="stage-hero">
              <div
                className="stage-sk stage-sk-line"
                style={{ width: 190, height: 13 }}
              />
              <div
                className="stage-sk"
                style={{
                  height: 52,
                  width: "78%",
                  marginBottom: 18,
                  borderRadius: 14,
                }}
              />
              <div
                className="stage-sk"
                style={{
                  height: 52,
                  width: "52%",
                  marginBottom: 30,
                  borderRadius: 14,
                }}
              />
              <div
                className="stage-sk stage-sk-line"
                style={{ width: "85%" }}
              />
              <div
                className="stage-sk stage-sk-line"
                style={{ width: "68%" }}
              />
              <div
                className="stage-sk stage-sk-line"
                style={{ width: 320, marginTop: 26, height: 18 }}
              />
            </section>
            <div className="stage-rail-wrap">
              <aside className="stage-rail">
                <div
                  className="stage-sk"
                  style={{
                    height: 48,
                    width: 150,
                    marginBottom: 18,
                    borderRadius: 14,
                  }}
                />
                <div
                  className="stage-sk stage-sk-line"
                  style={{ width: 190 }}
                />
                <div
                  className="stage-sk"
                  style={{ height: 64, marginTop: 26, borderRadius: 16 }}
                />
              </aside>
            </div>
            <section className="stage-curriculum">
              <div
                className="stage-sk"
                style={{
                  height: 26,
                  width: 170,
                  marginBottom: 26,
                  borderRadius: 10,
                }}
              />
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="stage-sk"
                  style={{ height: 66, marginBottom: 12, borderRadius: 14 }}
                />
              ))}
            </section>
          </div>
        </div>
      </div>
    );
  }

  /* --- main -------------------------------------------------------- */

  const course = data.course;
  const priceNum = Number(course.price);
  const isFree = !Number.isFinite(priceNum) || priceNum <= 0;
  const hasLessons = lessonCount > 0;

  function renderPrice() {
    if (isFree) {
      return (
        <div className="stage-price">
          <span className="stage-price-free">مجاني</span>
        </div>
      );
    }
    return (
      <div className="stage-price">
        <span className="stage-price-num">{priceNum.toFixed(2)}</span>
        <span className="stage-price-cur">{course.currency}</span>
      </div>
    );
  }

  function renderCta() {
    return (
      <button
        type="button"
        className={enrolled ? "stage-cta stage-cta-done" : "stage-cta"}
        onClick={() => void handleEnroll()}
        onMouseMove={onCtaMove}
        onMouseLeave={onCtaLeave}
        disabled={enrolling || enrolled}
      >
        {enrolling ? (
          <span className="stage-spin" aria-label="جاري التسجيل" />
        ) : enrolled ? (
          "أنت مسجل بالفعل ✓"
        ) : token ? (
          "سجّل الآن"
        ) : (
          "سجل الدخول للتسجيل"
        )}
      </button>
    );
  }

  return (
    <div className="stage-root">
      <div className="stage-ghost-wrap">
        <div className="stage-ghost" aria-hidden="true">
          ع
        </div>
      </div>

      <div className="stage-shell">
        <nav className="stage-crumbs stage-rise stage-rise-1">
          <Link href="/courses">الكورسات</Link>
          <span className="sep">›</span>
          <span>{course.title}</span>
        </nav>

        <div className="stage-grid">
          <section className="stage-hero stage-rise stage-rise-1">
            <p className="stage-eyebrow">مساحة تعلّم اللغة العربية</p>
            <h1 className="stage-title">{course.title}</h1>
            {(course.shortDescription || course.description) && (
              <p className="stage-desc">
                {course.shortDescription ?? course.description}
              </p>
            )}
            <div className="stage-meta">
              {course.teacher?.name && (
                <span className="stage-meta-item">
                  <IconTeacher />
                  المدرس: {course.teacher.name}
                </span>
              )}
              <span className="stage-meta-item">
                <IconBook />
                {lessonsLabel(lessonCount)}
              </span>
              {contentMinutes > 0 && (
                <span className="stage-meta-item">
                  <IconClock />
                  {formatDuration(contentMinutes)}
                </span>
              )}
            </div>
          </section>

          <div className="stage-rail-wrap stage-rise stage-rise-3">
            <aside className="stage-rail" onMouseMove={onRailMove}>
              {renderPrice()}
              {course.teacher?.name && (
                <p className="stage-rail-teacher">
                  المدرس: {course.teacher.name}
                </p>
              )}
              {renderCta()}
              <p className="stage-trust">
                ضمان استرداد لمدة 30 يوم · دفع آمن عبر Paymob
              </p>
            </aside>
          </div>

          <section className="stage-curriculum stage-rise stage-rise-4">
            <div className="stage-sec-head">
              <h2>المحتوى</h2>
              <span className="count">{lessonsLabel(lessonCount)}</span>
            </div>
            <div className="stage-hairline" />
            {!hasLessons ? (
              <div className="stage-empty">
                <div className="stage-empty-ghost" aria-hidden="true">
                  ع
                </div>
                <p>المحتوى قيد التجهيز… سجل الآن لتكون أول من يعلم.</p>
              </div>
            ) : (
              data.sections.map((section) => (
                <section key={section.id} className="stage-unit">
                  <header className="stage-unit-head">{section.title}</header>
                  {section.lessons.map((lesson) => (
                    <LessonRow
                      key={lesson.id}
                      lesson={lesson}
                      onLocked={() =>
                        showToast("أكمل الدرس السابق لفتح هذا الدرس")
                      }
                    />
                  ))}
                </section>
              ))
            )}
          </section>
        </div>
      </div>

      <div className="stage-mobile-cta">
        {renderPrice()}
        {renderCta()}
      </div>

      <div
        className={toast ? "stage-toast stage-toast-on" : "stage-toast"}
        role="status"
        aria-live="polite"
      >
        {toast ?? ""}
      </div>
    </div>
  );
}
