"use client";

import Link from "next/link";
import { Magnetic, Reveal } from "./interactive";
import { useLang } from "./i18n";
import { useAuth } from "@/app/lib/auth";

export default function Hero() {
  const { t } = useLang();
  const { token } = useAuth();
  return (
    <section style={{ position: "relative", overflow: "hidden" }}>
      <div
        aria-hidden
        style={{
          position: "absolute",
          insetInlineStart: -60,
          top: -40,
          fontSize: 340,
          lineHeight: 1,
          fontWeight: 800,
          color: "var(--ink-950)",
          opacity: 0.05,
          pointerEvents: "none",
          userSelect: "none",
        }}
      >
        ع
      </div>
      <div className="lp-container" style={{ paddingTop: 72, paddingBottom: 40, position: "relative" }}>
        <Reveal>
          <p className="lp-eyebrow">{t.hero.eyebrow}</p>
          <h1
            className="text-display"
            style={{ color: "var(--ink-950)", margin: "0 0 16px", maxWidth: 780 }}
          >
            {t.hero.titleA}
            <br />
            <span style={{ color: "var(--color-action-strong)" }}>{t.hero.titleB}</span>
          </h1>
        </Reveal>
        <Reveal delay={120}>
          <p className="lp-lead">{t.hero.lead}</p>
        </Reveal>
        <Reveal delay={220}>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 32 }}>
            <Magnetic>
              <Link
                href={token ? "/courses" : "/signup"}
                className="lp-btn lp-btn-primary"
              >
                {t.hero.ctaCourses}
              </Link>
            </Magnetic>
            <Magnetic>
              <Link href="/teachers" className="lp-btn lp-btn-secondary">
                {t.hero.ctaTeachers}
              </Link>
            </Magnetic>
          </div>
        </Reveal>
        <Reveal delay={300}>
          <p style={{ marginTop: 24, fontSize: 14, color: "var(--text-muted)" }}>
            {t.hero.footnote}
          </p>
        </Reveal>
      </div>
    </section>
  );
}
