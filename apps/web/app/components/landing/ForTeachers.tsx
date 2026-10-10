"use client";

import Link from "next/link";
import { Magnetic, Reveal } from "./interactive";
import { useLang } from "./i18n";

export default function ForTeachers() {
  const { t } = useLang();
  return (
    <section aria-label="For teachers">
      <div className="lp-container lp-section">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 32,
            alignItems: "center",
          }}
        >
          <Reveal>
            <div>
              <p className="lp-eyebrow">{t.forTeachers.eyebrow}</p>
              <h2 className="lp-h2">{t.forTeachers.title}</h2>
              <ul style={{ listStyle: "none", margin: "24px 0 0", padding: 0, display: "grid", gap: 12 }}>
                {t.forTeachers.points.map((p) => (
                  <li
                    key={p}
                    style={{
                      display: "flex",
                      gap: 10,
                      color: "var(--ink-700)",
                      lineHeight: 1.9,
                    }}
                  >
                    <span aria-hidden style={{ color: "var(--color-action-strong)", fontWeight: 800 }}>
                      ✓
                    </span>
                    {p}
                  </li>
                ))}
              </ul>
              <div style={{ marginTop: 28 }}>
                <Magnetic>
                  <Link href="/teachers" className="lp-btn lp-btn-primary">
                    {t.forTeachers.cta}
                  </Link>
                </Magnetic>
              </div>
            </div>
          </Reveal>
          <Reveal delay={120}>
            <div
              aria-hidden
              style={{
                background: "var(--ink-950)",
                borderRadius: "var(--radius-xl)",
                padding: 40,
                color: "#F4F4F6",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 96, fontWeight: 800, opacity: 0.9 }}>ع</div>
              <p style={{ color: "#A7ADBA", margin: "16px 0 0", lineHeight: 1.9 }}>
                {t.forTeachers.panelA}
                <br />
                {t.forTeachers.panelB}
              </p>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
