"use client";

import { useEffect, useState } from "react";
import SiteHeader from "@/app/components/landing/SiteHeader";
import SiteFooter from "@/app/components/landing/SiteFooter";
import { useLang } from "@/app/components/landing/i18n";
import {
  EditorialCourseCard,
  EditorialCourseCardSkeleton,
} from "@/app/components/editorial/EditorialCourseCard";
import { useAuth } from "@/app/lib/auth";
import {
  api,
  ApiError,
  type EnrollmentItem,
  type PublicCourseCard,
} from "@/app/lib/api";
import {
  countWord,
  coverNumeral,
  durationLabel,
  priceLabel,
} from "@/app/lib/format";

/* ------------------------------------------------------------------
   The Catalog — editorial “book cover” cards over real data.
   Course list (public) + per-course structure (lessons/exams/time)
   + the signed-in student's enrollments & unlock progress.
   Bento 60/40 for full lists, skeletons while loading, bilingual.
   ------------------------------------------------------------------ */

const CONTENT_TYPES = new Set(["VIDEO", "PDF", "RESOURCE", "LIVE"]);

interface CourseMeta {
  lessons: number;
  exams: number;
  seconds: number;
}

export default function CoursesPage() {
  const { t, lang } = useLang();
  const { token } = useAuth();

  const [courses, setCourses] = useState<PublicCourseCard[] | null>(null);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);

  const [metas, setMetas] = useState<Record<string, CourseMeta>>({});
  const [enrolled, setEnrolled] = useState<Map<string, EnrollmentItem>>(
    new Map(),
  );
  const [progress, setProgress] = useState<Record<string, number>>({});

  /* --- public list (debounced search) ------------------------------- */
  useEffect(() => {
    let cancelled = false;
    const tmr = setTimeout(
      () => {
        api
          .listPublicCourses(search.trim() === "" ? undefined : search.trim())
          .then((r) => {
            if (!cancelled) {
              setCourses(r);
              setError(null);
            }
          })
          .catch((e) => {
            if (!cancelled)
              setError(e instanceof ApiError ? e.message : t.catalog.error);
          });
      },
      search === "" ? 0 : 400,
    );
    return () => {
      cancelled = true;
      clearTimeout(tmr);
    };
  }, [search, t.catalog.error]);

  /* --- real numbers per visible course (cached) --------------------- */
  useEffect(() => {
    if (!courses) return;
    const missing = courses.filter((c) => !metas[c.slug]);
    if (missing.length === 0) return;
    let cancelled = false;
    (async () => {
      const results = await Promise.allSettled(
        missing.map((c) => api.getCourseStructureBySlug(c.slug)),
      );
      if (cancelled) return;
      setMetas((prev) => {
        const next = { ...prev };
        results.forEach((r) => {
          if (r.status !== "fulfilled") return;
          const lessons = r.value.sections.flatMap((s) => s.lessons);
          const content = lessons.filter((l) => CONTENT_TYPES.has(l.type));
          next[r.value.course.slug] = {
            lessons: content.length,
            exams: lessons.filter((l) => l.type === "EXAM" || l.type === "QUIZ")
              .length,
            seconds: content.reduce((a, l) => a + (l.duration ?? 0), 0),
          };
        });
        return next;
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [courses, metas]);

  /* --- my enrollments (signed in only) ------------------------------ */
  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    api
      .getMyEnrollments(token)
      .then((list) => {
        if (cancelled) return;
        setEnrolled(
          new Map(
            list
              .filter((e) => e.status === "ACTIVE")
              .map((e) => [e.course.id, e]),
          ),
        );
      })
      .catch(() => {
        /* catalog still works without enrollment state */
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  /* --- unlock progress per enrolled course -------------------------- */
  useEffect(() => {
    if (!token || enrolled.size === 0) return;
    let cancelled = false;
    const ids = [...enrolled.keys()];
    (async () => {
      const results = await Promise.allSettled(
        ids.map((id) => api.getStudentProgression(token, id)),
      );
      if (cancelled) return;
      const next: Record<string, number> = {};
      results.forEach((r, i) => {
        if (r.status !== "fulfilled") return;
        const items = r.value.progression ?? [];
        const total = items.length;
        const unlocked = items.filter((it) => it.isUnlocked).length;
        next[ids[i]] = total > 0 ? Math.round((unlocked / total) * 100) : 0;
      });
      setProgress(next);
    })();
    return () => {
      cancelled = true;
    };
  }, [token, enrolled]);

  const arrow = lang === "ar" ? "←" : "→";
  const showBento = courses !== null && courses.length >= 3;

  return (
    <>
      <SiteHeader />
      <main className="ts-page">
        <p className="lp-eyebrow">{t.catalog.eyebrow}</p>
        <h1 className="lp-h2">{t.catalog.title}</h1>
        <p className="lp-lead">{t.catalog.lead}</p>

        <div className="cat-search">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t.catalog.searchPlaceholder}
            aria-label={t.catalog.searchPlaceholder}
          />
        </div>

        {error && (
          <div className="card" style={{ marginTop: 24 }}>
            <p style={{ margin: 0 }}>{error}</p>
          </div>
        )}

        {courses === null && !error && (
          <div className="ed-bento" style={{ marginTop: 32 }}>
            <EditorialCourseCardSkeleton />
            <EditorialCourseCardSkeleton />
            <EditorialCourseCardSkeleton />
          </div>
        )}

        {courses !== null && courses.length === 0 && (
          <div className="card" style={{ marginTop: 24 }}>
            <p style={{ margin: 0 }}>{t.catalog.empty}</p>
          </div>
        )}

        {courses !== null && courses.length > 0 && (
          <div
            className={showBento ? "ed-bento" : "ed-grid-sm"}
            style={{ marginTop: 32 }}
          >
            {courses.map((course) => {
              const isMine = enrolled.has(course.id);
              const meta = metas[course.slug];
              const pl = priceLabel(course.price, course.currency, lang);
              return (
                <EditorialCourseCard
                  key={course.id}
                  href={
                    isMine
                      ? `/student/courses/${course.id}`
                      : `/courses/${course.slug}`
                  }
                  numeral={coverNumeral(course.title)}
                  lang={lang}
                  badges={[
                    ...(course.level
                      ? [{ label: course.level, kind: "glass" as const }]
                      : []),
                    ...(isMine
                      ? [
                          {
                            label: t.catalog.enrolledBadge,
                            kind: "solid" as const,
                          },
                        ]
                      : []),
                  ]}
                  caption={course.teacher.name}
                  title={course.title}
                  desc={course.shortDescription ?? t.catalog.fallbackDesc}
                  meta={
                    meta
                      ? [
                          ...(meta.seconds > 0
                            ? [
                                {
                                  icon: "clock" as const,
                                  text: durationLabel(meta.seconds, lang),
                                },
                              ]
                            : []),
                          ...(meta.lessons > 0
                            ? [
                                {
                                  icon: "lesson" as const,
                                  text: countWord(meta.lessons, lang, "lesson"),
                                },
                              ]
                            : []),
                          ...(meta.exams > 0
                            ? [
                                {
                                  icon: "exam" as const,
                                  text: countWord(meta.exams, lang, "exam"),
                                },
                              ]
                            : []),
                        ]
                      : undefined
                  }
                  price={isMine ? null : (pl ?? t.catalog.free)}
                  priceFree={pl === null}
                  cta={t.catalog.view}
                  arrow={arrow}
                  enrolled={
                    isMine
                      ? {
                          pct: progress[course.id] ?? 0,
                          label: t.catalog.complete,
                        }
                      : null
                  }
                />
              );
            })}
          </div>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
