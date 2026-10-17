"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Magnetic,
  Parallax,
  Reveal,
} from "../../components/landing/interactive";
import { useLang } from "../../components/landing/i18n";
import {
  EditorialCourseCard,
  EditorialCourseCardSkeleton,
} from "@/app/components/editorial/EditorialCourseCard";
import { api } from "@/app/lib/api";
import { countWord, durationLabel, priceLabel } from "@/app/lib/format";

/* ------------------------------------------------------------------
   The Teacher Space — content layer (client).
   Copy comes from the bilingual dict; every number on the course
   cards is fetched from the server (public structure endpoint):
   lessons · exams · total duration · price. Skeletons while loading,
   graceful static fallback if the API is unreachable.
   ------------------------------------------------------------------ */

const CONTENT_TYPES = new Set(["VIDEO", "PDF", "RESOURCE", "LIVE"]);

const SPACE_COURSES = [
  { slug: "arabic-1-prep", numeral: "١", full: true },
  { slug: "arabic-2-prep", numeral: "٢", full: false },
  { slug: "arabic-3-prep", numeral: "٣", full: false },
] as const;

interface CourseMeta {
  title: string;
  price: number | string;
  currency: string;
  lessons: number;
  exams: number;
  seconds: number;
}

function FeatureIcon({ name }: { name: string }) {
  switch (name) {
    case "unlock":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <rect x="4.5" y="10.5" width="15" height="9.5" rx="2.2" />
          <path d="M8.5 10.5V8a3.8 3.8 0 0 1 7.4-1.1" />
          <path d="M12 14.2v2.2" />
        </svg>
      );
    case "clock":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="8.5" />
          <path d="M12 7.5V12l3 2" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M11.7 4.6C10.6 3.3 8.7 3 7.3 4c-1.1.8-1.6 2.2-1.3 3.5-1.2.6-2 1.9-2 3.3 0 1.3.7 2.5 1.7 3.1-.1.4-.2.9-.2 1.3 0 2 1.6 3.6 3.6 3.6 1 0 1.9-.4 2.6-1" />
          <path d="M12.3 4.6c1.1-1.3 3-1.6 4.4-.6 1.1.8 1.6 2.2 1.3 3.5 1.2.6 2 1.9 2 3.3 0 1.3-.7 2.5-1.7 3.1.1.4.2.9.2 1.3 0 2-1.6 3.6-3.6 3.6-1 0-1.9-.4-2.6-1" />
          <path d="M12 4.4v15.2" />
        </svg>
      );
  }
}

export default function TeacherSpaceContent() {
  const { t, lang } = useLang();
  const space = t.teacherSpace;
  const teacher = t.teacherSpaces.teachers[0];
  const arrow = lang === "ar" ? "←" : "→";

  const [metas, setMetas] = useState<Record<string, CourseMeta> | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const structures = await Promise.all(
          SPACE_COURSES.map((c) => api.getCourseStructureBySlug(c.slug)),
        );
        if (cancelled) return;
        const map: Record<string, CourseMeta> = {};
        for (const st of structures) {
          const lessons = st.sections.flatMap((s) => s.lessons);
          const content = lessons.filter((l) => CONTENT_TYPES.has(l.type));
          map[st.course.slug] = {
            title: st.course.title,
            price: st.course.price,
            currency: st.course.currency,
            lessons: content.length,
            exams: lessons.filter((l) => l.type === "EXAM" || l.type === "QUIZ")
              .length,
            seconds: content.reduce((a, l) => a + (l.duration ?? 0), 0),
          };
        }
        setMetas(map);
      } catch {
        if (!cancelled) setFailed(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const greeting = lang === "ar" ? `مساحة ${teacher.name}` : teacher.name;

  return (
    <main className="ts-page">
      <Reveal>
        <section className="ts-hero" aria-label={greeting}>
          <Parallax className="ts-hero-aurora" speed={0.1} />
          <div className="ts-hero-grain" aria-hidden />
          <svg
            className="ts-hero-motif"
            viewBox="0 0 520 300"
            fill="none"
            aria-hidden
          >
            <path
              d="M28 236 C 120 118, 208 268, 300 148 S 468 38, 512 148"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <path
              d="M60 278 C 150 188, 240 300, 330 208 S 468 150, 508 214"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              opacity="0.7"
            />
            <path
              d="M120 96 C 180 38, 262 38, 302 92"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              opacity="0.8"
            />
            <circle cx="318" cy="106" r="4" fill="currentColor" />
            <circle cx="341" cy="122" r="3" fill="currentColor" opacity="0.7" />
            <circle
              cx="150"
              cy="148"
              r="3.5"
              fill="currentColor"
              opacity="0.8"
            />
          </svg>

          <div className="ts-hero-id">
            <div className="ts-avatar" aria-hidden>
              ع
            </div>
            <div className="ts-hero-name">
              <div className="ts-chips">
                <span className="ts-chip">{teacher.subject}</span>
                <span className="ts-chip">{space.stage}</span>
                <span className="ts-chip">{space.coursesCount}</span>
              </div>
              <h1 className="ts-name">{teacher.name}</h1>
              <p className="ts-tagline">
                {lang === "ar" ? `«${space.tagline}»` : `“${space.tagline}”`}
              </p>
            </div>
          </div>

          <p className="ts-bio">{space.bio}</p>

          <div className="ts-tags">
            {space.focus.map((tag) => (
              <span key={tag} className="ts-chip">
                {tag}
              </span>
            ))}
          </div>

          <div className="ts-hero-ctas">
            <Magnetic maxPx={2}>
              <Link
                href="/courses/arabic-1-prep"
                className="ts-btn ts-btn-primary"
              >
                {space.ctaPrimary}
              </Link>
            </Magnetic>
            <a href="#courses" className="ts-btn ts-btn-secondary">
              {space.ctaSecondary}
            </a>
          </div>
        </section>
      </Reveal>

      <section
        id="courses"
        className="ts-courses"
        aria-label={space.coursesSection.eyebrow}
      >
        <Reveal>
          <p className="lp-eyebrow">{space.coursesSection.eyebrow}</p>
          <h2 className="lp-h2" style={{ fontSize: 28 }}>
            {space.coursesSection.title}
          </h2>
          <p className="lp-lead">{space.coursesSection.lead}</p>
        </Reveal>

        <div className="ed-bento" style={{ marginTop: 36 }}>
          {metas === null && !failed
            ? SPACE_COURSES.map((c) => (
                <EditorialCourseCardSkeleton key={c.slug} />
              ))
            : SPACE_COURSES.map((c, index) => {
                const courseCopy = space.courses.find((x) => x.slug === c.slug);
                const meta = metas?.[c.slug];
                const price = meta
                  ? priceLabel(meta.price, meta.currency, lang)
                  : null;
                return (
                  <Reveal key={c.slug} delay={index * 100}>
                    <EditorialCourseCard
                      href={`/courses/${c.slug}`}
                      numeral={c.numeral}
                      lang={lang}
                      badges={[
                        {
                          label: courseCopy?.grade ?? c.slug,
                          kind: "glass",
                        },
                        { label: space.coursesSection.open, kind: "solid" },
                      ]}
                      caption={teacher.name}
                      title={meta?.title ?? courseCopy?.grade ?? c.slug}
                      desc={courseCopy?.desc ?? null}
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
                                      text: countWord(
                                        meta.lessons,
                                        lang,
                                        "lesson",
                                      ),
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
                      tags={[...space.focus]}
                      accentNote={c.full ? space.coursesSection.full : null}
                      price={meta ? (price ?? t.catalog.free) : null}
                      priceFree={!price}
                      cta={space.coursesSection.view}
                      arrow={arrow}
                    />
                  </Reveal>
                );
              })}
        </div>
      </section>

      <Reveal>
        <section className="ts-triad">
          {space.triad.map((feature) => (
            <div key={feature.title} className="ts-triad-item">
              <FeatureIcon name={feature.icon} />
              <h3>{feature.title}</h3>
              <p>{feature.body}</p>
            </div>
          ))}
        </section>
      </Reveal>

      <Reveal>
        <section className="ts-final">
          <h2>{space.final.title}</h2>
          <p>{space.final.body}</p>
          <div className="ts-final-ctas">
            <Magnetic maxPx={2}>
              <Link href="/login" className="ts-btn ts-btn-primary">
                {space.final.login}
              </Link>
            </Magnetic>
            <Link href="/courses" className="ts-btn ts-btn-secondary">
              {space.final.browse}
            </Link>
          </div>
        </section>
      </Reveal>

      <p className="ts-footer-note">{space.footerNote}</p>

      <div className="ts-mobile-cta">
        <Link href="/login" className="ts-btn ts-btn-primary">
          {space.mobileCta}
        </Link>
      </div>
    </main>
  );
}
