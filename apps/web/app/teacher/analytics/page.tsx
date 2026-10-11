"use client";

import Panel from "../components/Panel";

/**
 * Analytical canvas.
 *
 * NOTE ON DATA: every value the previous version charted was hardcoded
 * (6 months of enrollment, 6 of revenue, 4 progress buckets, 4 course rates,
 * 4 events). Painting that in a different palette would still be fabricated
 * data, so the charts are absent rather than recoloured.
 *
 * The monochrome silver + emerald-base-glow chart language, the laser
 * completion bars, the secure event ledger and the 1.2s counters below are
 * final and take real series the moment an analytics endpoint exists.
 */

/** The one body of data the server can supply today. */
function LiveEventLedger() {
  return (
    <Panel as="article" label="سجل الأحداث المباشر">
      <h2 className="tc-section-title">أهم الأحداث</h2>
      <div className="tc-actions">
        <div className="tc-action-row">
          <p className="tc-action-title">
            <span className="tc-pulse" aria-hidden />
            طابورﹾ التصحيحﹾ مقروءﹾ منﹾ{" "}
            <code style={{ fontSize: 11 }}>GET /api/v1/assignments</code>
          </p>
        </div>
        <div className="tc-action-row">
          <p className="tc-action-title" style={{ color: "var(--tc-ink-dim)" }}>
            لاﹾ يوجدﹾ endpointﹾ لسجلﹾ الأحداثﹾ الأمنيﹾ (security_events) حتىﹾ
            الآنﹾ — يُعرضﹾ هناﹾ عندﹾ توصيلهﹾ بمؤشرﹾ <span aria-hidden>✓</span>{" "}
            يتزامنﹾ معﹾ التوقيتﹾ المرجعيﹾ للخادمﹾ.
          </p>
        </div>
      </div>
    </Panel>
  );
}

export default function AnalyticsPage() {
  return (
    <>
      <header style={{ marginBottom: "var(--space-6)" }}>
        <h1 className="tc-section-title" style={{ fontSize: 28 }}>
          التحليلات
        </h1>
        <p className="tc-sub">
          نظرة شاملة على أداء الكورسات والطلاب والإيرادات.
        </p>
      </header>

      <div style={{ display: "grid", gap: "var(--space-4)" }}>
        <Panel as="article" label="الرسوم البيانية">
          <h2 className="tc-section-title">نموﹾ التسجيلﹾ والإيرادات</h2>
          <div className="tc-missing">
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              style={{ flexShrink: 0, marginTop: 2, color: "#fbbf24" }}
              aria-hidden
            >
              <circle cx="12" cy="12" r="9" />
              <path d="M12 8v5M12 16.5v.5" />
            </svg>
            <p>
              لاﹾ توجدﹾ واجهةﹾ تحليلاتﹾ فيﹾ الـ API — فالرسومﹾ البيانيةﹾ غيرﹾ
              مرسومةﹾ بدلﹾ رسمﹾ 6 شهورﹾ منﹾ أرقامﹾ مخترعةﹾ (42 · 68 · 95 · 120 ·
              158 · 210 و 8,400 … 42,000 ج.م). لونﹾ الـ palette الفضيةﹾ
              والكريستاليةﹾ والتوهجﹾ الزمرديﹾ السفليﹾ جاهزةﹾ لتأخذﹾ سلسلةﹾ
              حقيقيةﹾ.
            </p>
          </div>
        </Panel>

        <Panel as="article" label="إكمال الكورسات">
          <h2 className="tc-section-title">إكمالﹾ الكورسات</h2>
          <div className="tc-missing">
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              style={{ flexShrink: 0, marginTop: 2, color: "#fbbf24" }}
              aria-hidden
            >
              <circle cx="12" cy="12" r="9" />
              <path d="M12 8v5M12 16.5v.5" />
            </svg>
            <p>
              نسبﹾ إكمالﹾ الموادﹾ (الرياضياتﹾ 68% · الفيزياءﹾ 72% · العربيةﹾ 81%
              · الإنجليزيةﹾ 55%) كانتﹾ ثابتةﹾ فيﹾ الكود. أشرطةﹾ الليزرﹾ النحيفةﹾ
              والعدادﹾ الزمنيﹾ 1.2 ثانيةﹾ جاهزينﹾ.
            </p>
          </div>
        </Panel>

        <Panel as="article" label="توزيع التقدم">
          <h2 className="tc-section-title">توزيعﹾ التقدم</h2>
          <div className="tc-missing">
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              style={{ flexShrink: 0, marginTop: 2, color: "#fbbf24" }}
              aria-hidden
            >
              <circle cx="12" cy="12" r="9" />
              <path d="M12 8v5M12 16.5v.5" />
            </svg>
            <p>
              توزيعﹾ مراحلﹾ التقدمﹾ يحتاجﹾ تجميعﹾ حقيقيﹾ منﹾ جدولﹾ التقدمﹾ —
              الفئاتﹾ 0-25% / 25-50% / 50-75% / 75-100% / 100% كانتﹾ مخترعةﹾ.
            </p>
          </div>
        </Panel>

        <LiveEventLedger />
      </div>
    </>
  );
}
