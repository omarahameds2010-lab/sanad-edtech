"use client";

import { Reveal } from "./interactive";
import { useLang } from "./i18n";

export default function Integrity() {
  const { t, lang } = useLang();
  const examNum = lang === "ar" ? "٧٠" : "70";
  const assignNum = lang === "ar" ? "٣٠٠" : "300";
  return (
    <section aria-label="Exam integrity">
      <div className="lp-container lp-section">
        <Reveal>
          <p className="lp-eyebrow">{t.integrity.eyebrow}</p>
          <h2 className="lp-h2">{t.integrity.title}</h2>
          <p className="lp-lead">{t.integrity.lead}</p>
        </Reveal>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 16,
            marginTop: 32,
          }}
        >
          <Reveal>
            <div
              className="lp-lift"
              style={{
                textAlign: "center",
                border: "1px solid var(--paper-200)",
                borderRadius: "var(--radius-lg)",
                background: "#ffffff",
                padding: "24px 16px",
                height: "100%",
              }}
            >
              <div
                style={{
                  fontSize: 36,
                  fontWeight: 800,
                  color: "var(--color-action-strong)",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {examNum}{" "}
                <span style={{ fontSize: 16, fontWeight: 600, color: "var(--text-muted)" }}>
                  {t.integrity.examUnit}
                </span>
              </div>
              <p style={{ margin: "8px 0 0", fontSize: 14, color: "var(--text-muted)" }}>{t.integrity.examDefault}</p>
            </div>
          </Reveal>
          <Reveal delay={80}>
            <div
              className="lp-lift"
              style={{
                textAlign: "center",
                border: "1px solid var(--paper-200)",
                borderRadius: "var(--radius-lg)",
                background: "#ffffff",
                padding: "24px 16px",
                height: "100%",
              }}
            >
              <div
                style={{
                  fontSize: 36,
                  fontWeight: 800,
                  color: "var(--color-action-strong)",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {assignNum}{" "}
                <span style={{ fontSize: 16, fontWeight: 600, color: "var(--text-muted)" }}>
                  {t.integrity.assignUnit}
                </span>
              </div>
              <p style={{ margin: "8px 0 0", fontSize: 14, color: "var(--text-muted)" }}>{t.integrity.assignDefault}</p>
            </div>
          </Reveal>
          <Reveal delay={160}>
            <div
              className="lp-lift"
              style={{
                border: "1px solid var(--paper-200)",
                borderRadius: "var(--radius-lg)",
                background: "#ffffff",
                padding: "24px 20px",
                height: "100%",
              }}
            >
              <h3 style={{ margin: "0 0 8px", fontSize: 17, color: "var(--ink-950)" }}>{t.integrity.reviewTitle}</h3>
              <p style={{ margin: 0, fontSize: 14, color: "var(--text-muted)", lineHeight: 1.8 }}>
                {t.integrity.reviewBody}
              </p>
            </div>
          </Reveal>
          <Reveal delay={240}>
            <div
              className="lp-lift"
              style={{
                border: "1px solid var(--paper-200)",
                borderRadius: "var(--radius-lg)",
                background: "#ffffff",
                padding: "24px 20px",
                height: "100%",
              }}
            >
              <h3 style={{ margin: "0 0 8px", fontSize: 17, color: "var(--ink-950)" }}>{t.integrity.recordTitle}</h3>
              <p style={{ margin: 0, fontSize: 14, color: "var(--text-muted)", lineHeight: 1.8 }}>
                {t.integrity.recordBody}
              </p>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
