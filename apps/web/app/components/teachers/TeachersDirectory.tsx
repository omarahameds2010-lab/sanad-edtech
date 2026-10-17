"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import { useLang } from "@/app/components/landing/i18n";
import TeacherCard from "@/app/components/TeacherCard";
import { countWord } from "@/app/lib/format";

/* «منصات المعلمين» — the platform directory: one real teacher platform so
   far, plus the “your platform next?” invitation. Bilingual (AR/EN). */

export default function TeachersDirectory() {
  const { t, lang } = useLang();
  const page = t.teachersPage;
  const teacher = t.teacherSpaces.teachers[0];
  const arrow = lang === "ar" ? "←" : "→";

  return (
    <main className="ts-page">
      <p className="lp-eyebrow">{page.eyebrow}</p>
      <h1 className="lp-h2">{page.title}</h1>
      <p className="lp-lead">{page.lead}</p>

      <div className="tp-grid">
        <TeacherCard
          slug={teacher.slug}
          subject={teacher.subject}
          teacherName={teacher.name}
          focusAreas={teacher.focus}
          tagline={teacher.tagline}
          stage={t.teacherSpace.stage}
          openLabel={page.openEnrollment}
          meta={countWord(3, lang, "course")}
          enter={page.enter}
          arrow={arrow}
        />

        <Link href="/signup" className="ts-note-dashed">
          <span
            style={{
              alignSelf: "flex-start",
              borderRadius: 999,
              padding: "5px 14px",
              fontSize: 12.5,
              fontWeight: 700,
              color: "var(--color-action-strong)",
              background: "var(--color-action-soft)",
            }}
          >
            {page.note.badge}
          </span>
          <p
            style={{
              fontWeight: 800,
              fontSize: 18,
              margin: 0,
              color: "var(--ink-700)",
            }}
          >
            {page.note.title}
          </p>
          <p
            style={{
              color: "var(--text-muted)",
              fontSize: 13.5,
              lineHeight: 1.85,
              margin: 0,
            }}
          >
            {page.note.body}
          </p>
          <span
            style={
              {
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                color: "var(--color-action-strong)",
                fontWeight: 700,
                fontSize: 14.5,
                "--tp-arrow-x": arrow === "→" ? "4px" : "-4px",
              } as CSSProperties
            }
          >
            {page.note.cta}
            <span className="tp-arrow" aria-hidden>
              {arrow}
            </span>
          </span>
        </Link>
      </div>
    </main>
  );
}
