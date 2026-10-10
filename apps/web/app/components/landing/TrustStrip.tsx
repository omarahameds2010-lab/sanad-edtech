"use client";

import { Reveal } from "./interactive";
import { useLang } from "./i18n";

export default function TrustStrip() {
  const { t } = useLang();
  return (
    <section aria-label="Value proposition">
      <div className="lp-container" style={{ paddingBottom: 8 }}>
        <Reveal>
          <h2 className="lp-h2">{t.values.title}</h2>
        </Reveal>
        <div className="lp-grid-3" style={{ marginTop: 24 }}>
          {t.values.cards.map((v, i) => (
            <Reveal key={v.title} delay={i * 80}>
              <article
                className="card lp-lift"
                style={{ padding: 24, height: "100%" }}
              >
                <h3 style={{ margin: "0 0 8px", fontSize: 18, color: "var(--ink-950)" }}>
                  {v.title}
                </h3>
                <p style={{ margin: 0, color: "var(--text-muted)", lineHeight: 1.9, fontSize: 15 }}>
                  {v.body}
                </p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
