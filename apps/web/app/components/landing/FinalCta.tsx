"use client";

import Link from "next/link";
import { Magnetic, Reveal } from "./interactive";
import { useLang } from "./i18n";
import Logo from "./Logo";

export default function FinalCta() {
  const { t } = useLang();
  return (
    <>
      <section aria-label="Get started" style={{ background: "var(--ink-950)", color: "#F4F4F6" }}>
        <div
          className="lp-container lp-section"
          style={{ textAlign: "center", maxWidth: 720 }}
        >
          <Reveal>
            <h2 className="text-display" style={{ color: "#F4F4F6", margin: "0 0 16px" }}>
              {t.cta.title}
            </h2>
            <p style={{ color: "#A7ADBA", lineHeight: 1.9, margin: "0 0 32px" }}>
              {t.cta.body}
            </p>
            <Magnetic>
              <Link
                href="/courses"
                className="lp-btn lp-btn-primary"
                style={{ background: "#34D399", color: "#0B0D10" }}
              >
                {t.cta.courses}
              </Link>
            </Magnetic>
          </Reveal>
        </div>
      </section>
      <footer
        style={{
          borderTop: "1px solid var(--paper-200)",
          background: "var(--paper-50)",
        }}
      >
        <div
          className="lp-container"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 16,
            flexWrap: "wrap",
            paddingTop: 24,
            paddingBottom: 24,
          }}
        >
          <Logo />
          <nav aria-label="Footer" style={{ display: "flex", gap: 16, fontSize: 14 }}>
            <Link href="/courses" style={{ color: "var(--ink-700)" }}>
              {t.footer.courses}
            </Link>
            <Link href="/teachers" style={{ color: "var(--ink-700)" }}>
              {t.footer.teachers}
            </Link>
            <Link href="/login" style={{ color: "var(--ink-700)" }}>
              {t.footer.login}
            </Link>
          </nav>
          <p style={{ margin: 0, fontSize: 13, color: "var(--text-muted)" }}>
            {t.footer.tagline}
          </p>
        </div>
      </footer>
    </>
  );
}
