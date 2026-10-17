"use client";

import Link from "next/link";
import { useState } from "react";
import { Reveal } from "./interactive";
import TeacherUniverseCard from "./TeacherUniverseCard";
import { useLang } from "./i18n";

export default function TeacherSpaces() {
  const { t, lang } = useLang();
  const teachers = t.teacherSpaces.teachers;
  const [activeSlug, setActiveSlug] = useState(teachers[0].slug);
  const active = teachers.find((tt) => tt.slug === activeSlug) ?? teachers[0];

  return (
    <section
      id="teachers"
      aria-label="Teacher spaces"
      style={{ scrollMarginTop: 80 }}
    >
      <div className="lp-container lp-section">
        <Reveal>
          <p className="lp-eyebrow">{t.teacherSpaces.eyebrow}</p>
          <h2 className="lp-h2">{t.teacherSpaces.title}</h2>
          <p className="lp-lead">{t.teacherSpaces.lead}</p>
        </Reveal>
        {teachers.length > 1 && (
          <div
            role="tablist"
            aria-label="Teacher selector"
            style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 24 }}
          >
            {teachers.map((teacher) => {
              const selected = teacher.slug === activeSlug;
              return (
                <button
                  key={teacher.slug}
                  role="tab"
                  aria-selected={selected}
                  onClick={() => setActiveSlug(teacher.slug)}
                  style={{
                    borderRadius: 999,
                    padding: "10px 22px",
                    fontWeight: 700,
                    fontSize: 15,
                    cursor: "pointer",
                    border: selected
                      ? `2px solid ${teacher.accent}`
                      : "1px solid var(--paper-200)",
                    background: selected ? teacher.accentSoft : "#ffffff",
                    color: selected ? teacher.accent : "var(--ink-700)",
                    transition: "all 200ms ease",
                  }}
                >
                  {teacher.name}
                </button>
              );
            })}
          </div>
        )}
        <Reveal key={active.slug + lang}>
          <div
            role="tabpanel"
            aria-label={active.name}
            style={{
              marginTop: 20,
              background:
                "linear-gradient(160deg, rgba(20, 23, 28, 0.96) 0%, rgba(11, 13, 16, 0.98) 60%, rgba(4, 60, 46, 0.22) 130%)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: 32,
              padding: "clamp(24px, 5vw, 56px)",
            }}
          >
            <TeacherUniverseCard
              teacher={active}
              enterLabel={t.teacherSpaces.enter}
              backLabel={lang === "ar" ? "←" : "→"}
            />
            <div style={{ marginTop: 20, textAlign: "center" }}>
              <Link
                href="/teachers"
                style={{ color: "#A7ADBA", fontWeight: 600, fontSize: 14 }}
              >
                {t.teacherSpaces.all} {lang === "ar" ? "←" : "→"}
              </Link>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
