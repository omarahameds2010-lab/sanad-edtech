"use client";

import { useState } from "react";
import Panel from "../components/Panel";

/**
 * Student ledger — the immersive academic record.
 *
 * NOTE ON DATA: the platform has no teacher-side student endpoint yet, so this
 * screen deliberately renders zero rows rather than the previous six invented
 * students. The chrome (glass rows, muted badges, laser progress horizon,
 * liquid counters) is final; it fills itself the moment an endpoint exists.
 */

const statusLabels: Record<string, string> = {
  ACTIVE: "نشط",
  EXPIRED: "منتهي",
  CANCELLED: "ملغي",
};

const badgeClass: Record<string, string> = {
  ACTIVE: "tc-badge tc-badge-active",
  EXPIRED: "tc-badge tc-badge-expired",
  CANCELLED: "tc-badge tc-badge-cancelled",
};

function LaserBar({ percent }: { percent: number }) {
  return (
    <div
      style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}
    >
      <div
        className="tc-laser"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div className="tc-laser-fill" style={{ width: `${percent}%` }} />
      </div>
      <span
        className="tc-metric"
        style={{
          fontSize: 12,
          fontWeight: 700,
          minWidth: 34,
          textAlign: "start",
        }}
      >
        {percent}%
      </span>
    </div>
  );
}

export default function TeacherStudentsPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<
    "all" | "ACTIVE" | "EXPIRED" | "CANCELLED"
  >("all");

  // No fabricated rows. The filter UI is retained because it will operate on
  // real data, but there is nothing to filter yet.
  const rows: Array<{
    id: string;
    name: string;
    phone: string;
    status: keyof typeof statusLabels;
    enrolledAt: string;
    lastActivity: string;
    progress: number;
  }> = [];

  const filtered = rows.filter((r) => {
    const matchesSearch = r.name.includes(search) || r.phone.includes(search);
    const matchesFilter = filter === "all" || r.status === filter;
    return matchesSearch && matchesFilter;
  });

  return (
    <>
      <header style={{ marginBottom: "var(--space-6)" }}>
        <h1 className="tc-section-title" style={{ fontSize: 28 }}>
          الطلاب
        </h1>
        <p className="tc-sub">سجل الطلاب والتقدم الأكاديمي لكل طالب.</p>
      </header>

      {/* Filters */}
      <div
        style={{
          display: "flex",
          gap: "var(--space-3)",
          marginBottom: "var(--space-5)",
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <input
          type="text"
          placeholder="ابحث بالاسم أو رقم الهاتف..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="بحث في الطلاب"
          style={{
            flex: 1,
            minWidth: 220,
            maxWidth: 380,
            padding: "10px 16px",
            borderRadius: 999,
            border: "1px solid var(--tc-hairline)",
            background: "rgba(255,255,255,0.02)",
            color: "var(--tc-ink)",
            fontSize: 13,
            outline: "none",
          }}
        />
        <div style={{ display: "flex", gap: "var(--space-2)" }}>
          {(["all", "ACTIVE", "EXPIRED", "CANCELLED"] as const).map(
            (status) => (
              <button
                key={status}
                type="button"
                onClick={() => setFilter(status)}
                aria-pressed={filter === status}
                style={{
                  padding: "7px 14px",
                  borderRadius: 999,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  border: `1px solid ${
                    filter === status
                      ? "var(--tc-hairline-on)"
                      : "var(--tc-hairline)"
                  }`,
                  background:
                    filter === status
                      ? "rgba(255,255,255,0.07)"
                      : "transparent",
                  color:
                    filter === status ? "var(--tc-ink)" : "var(--tc-ink-dim)",
                  transition: "background 300ms ease, color 300ms ease",
                }}
              >
                {status === "all" ? "الكل" : statusLabels[status]}
              </button>
            ),
          )}
        </div>
      </div>

      {filtered.length === 0 ? (
        <Panel as="article">
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
              لا يوجدﹾ endpointﹾ لروسترﹾ طلابﹾ المعلمﹾ حتىﹾ الآنﹾ — الشاشةﹾ
              فراغﹾ مقصودﹾ بدلﹾ ستةﹾ طلابﹾ مخترعينﹾ. الجدولﹾ الزجاجيﹾ والشاراتﹾ
              وأشرطةﹾ الليزرﹾ جاهزةﹾ وتتشبعﹾ بياناتﹾ منﹾ اللحظةﹾ الليﹾ تُوصّلﹾ
              فيهاﹾ واجهةﹾ الطلابﹾ.
            </p>
          </div>
        </Panel>
      ) : (
        <div className="tc-ledger">
          <div className="tc-row tc-row-head" aria-hidden>
            <span>الطالب</span>
            <span>الحالة</span>
            <span>تاريخ التسجيل</span>
            <span>التقدم</span>
            <span>آخر نشاط</span>
          </div>

          {filtered.map((student) => (
            <div className="tc-row" key={student.id}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>
                  {student.name}
                </div>
                <div style={{ fontSize: 11, color: "var(--tc-ink-faint)" }}>
                  {student.phone}
                </div>
              </div>
              <span className={badgeClass[student.status]}>
                {statusLabels[student.status]}
              </span>
              <span style={{ fontSize: 12, color: "var(--tc-ink-dim)" }}>
                {student.enrolledAt}
              </span>
              <LaserBar percent={student.progress} />
              <span style={{ fontSize: 12, color: "var(--tc-ink-dim)" }}>
                {student.lastActivity}
              </span>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
