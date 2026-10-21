import Link from "next/link";
import type { ReactNode } from "react";
import {
  ArrowIcon,
  BookIcon,
  ClockIcon,
  LayersIcon,
  PencilIcon,
  PlusIcon,
  SearchIcon,
} from "./AssessmentIcons";

export type AssessmentKind = "exam" | "assignment";

export interface AssessmentCardData {
  title: string;
  statusLabel: string;
  isLive: boolean;
  description?: string | null;
  timerMinutes: number;
  lessonTitle?: string | null;
  href: string;
  editHref: string;
}

export interface AssessmentFilter {
  id: string;
  label: string;
  count?: number;
  disabled?: boolean;
}

export function AssessmentPageHeader({
  eyebrow,
  title,
  sub,
  actionHref,
  actionLabel,
  actionTitle,
}: {
  eyebrow: string;
  title: string;
  sub: string;
  actionHref?: string;
  actionLabel?: string;
  actionTitle?: string;
}) {
  return (
    <header className="tx-head">
      <div className="tx-head-copy">
        <span className="tx-eyebrow">{eyebrow}</span>
        <h1 className="tx-title">{title}</h1>
        <p className="tx-sub">{sub}</p>
      </div>
      {actionHref && actionLabel && (
        <Link
          className="tx-new"
          href={actionHref}
          title={actionTitle}
          aria-label={actionTitle ?? actionLabel}
        >
          <PlusIcon />
          {actionLabel}
        </Link>
      )}
    </header>
  );
}

export function AssessmentToolbar({
  search,
  onSearchChange,
  placeholder,
  filters,
  activeFilter,
  onFilterChange,
}: {
  search: string;
  onSearchChange: (value: string) => void;
  placeholder: string;
  filters: AssessmentFilter[];
  activeFilter: string;
  onFilterChange: (id: string) => void;
}) {
  return (
    <div className="tx-toolbar">
      <label className="tx-search">
        <span className="tx-search-icon" aria-hidden>
          <SearchIcon />
        </span>
        <input
          type="search"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder={placeholder}
          aria-label={placeholder}
        />
      </label>

      <div className="tx-filters" role="group" aria-label="تصفية القائمة">
        {filters.map((filter) => (
          <button
            key={filter.id}
            type="button"
            className="tx-pill"
            data-active={activeFilter === filter.id ? "true" : "false"}
            disabled={filter.disabled}
            title={
              filter.disabled ? "بنجهّز أعداد التصحيح…" : undefined
            }
            onClick={() => onFilterChange(filter.id)}
          >
            {filter.label}
            {typeof filter.count === "number" && (
              <span className="tx-pill-count">{filter.count}</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

export function AssessmentCard({
  item,
  kind,
  index,
}: {
  item: AssessmentCardData;
  kind: AssessmentKind;
  index: number;
}) {
  const description = item.description?.trim();

  return (
    <article
      className="tx-card"
      style={{ animationDelay: `${Math.min(index, 8) * 45}ms` }}
    >
      <div className="tx-identity">
        <h2 className="tx-card-title">
          <Link href={item.href}>{item.title}</Link>
        </h2>
        <span className="tx-status" data-live={item.isLive ? "true" : "false"}>
          <span className="tx-status-dot" aria-hidden />
          {item.statusLabel}
        </span>
      </div>

      <div className="tx-actions">
        <Link className="tx-cta" href={item.href}>
          فتح طابور التصحيح
          <ArrowIcon />
        </Link>
        <Link className="tx-cta tx-cta-outline" href={item.editHref}>
          <PencilIcon />
          {kind === "exam" ? "تعديل الاختبار" : "تعديل الواجب"}
        </Link>
      </div>

      <div className="tx-details">
        <span className="tx-meta-item">
          <ClockIcon />
          <span>{item.timerMinutes} دقيقة</span>
        </span>

        {description && (
          <>
            <span className="tx-meta-sep" aria-hidden />
            <span className="tx-meta-item">
              <LayersIcon />
              <span title={description}>{description}</span>
            </span>
          </>
        )}

        {item.lessonTitle && (
          <>
            <span className="tx-meta-sep" aria-hidden />
            <span className="tx-meta-item">
              <BookIcon />
              <span title={item.lessonTitle}>{item.lessonTitle}</span>
            </span>
          </>
        )}
      </div>
    </article>
  );
}

export function AssessmentSidebar({
  published,
  pending,
  pendingState,
  pendingCapped = false,
  total,
  labels,
}: {
  published: number;
  pending: number | null;
  pendingState: "loading" | "ready" | "failed";
  pendingCapped?: boolean;
  total: number;
  labels: {
    published: string;
    pending: string;
    total: string;
    pendingFoot: string;
    totalFoot: string;
  };
}) {
  return (
    <aside className="tx-side" aria-label="إحصائيات سريعة">
      <div className="tx-side-card">
        <span className="tx-side-label">{labels.published}</span>
        <div className="tx-side-value is-green">{published}</div>
        <span className="tx-side-foot">ظاهرة للطلاب</span>
      </div>

      <div className="tx-side-card">
        <span className="tx-side-label">{labels.pending}</span>
        {pendingState === "loading" ? (
          <span className="tx-side-skeleton" aria-label="جاري حساب العدد" />
        ) : (
          <div className="tx-side-value">
            {pendingState === "failed" ? "—" : pending}
            {pendingState === "ready" && pendingCapped ? "+" : ""}
          </div>
        )}
        <span className="tx-side-foot">
          {pendingState === "failed"
            ? "تعذر حساب العدد"
            : labels.pendingFoot}
        </span>
      </div>

      <div className="tx-side-card">
        <span className="tx-side-label">{labels.total}</span>
        <div className="tx-side-value">{total}</div>
        <span className="tx-side-foot">{labels.totalFoot}</span>
      </div>
    </aside>
  );
}

export function AssessmentEmpty({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <div className="tx-state">
      <h2 className="tx-state-title">{title}</h2>
      <p className="tx-state-body">{body}</p>
      {action}
    </div>
  );
}

export function AssessmentNoResults({ onClear }: { onClear: () => void }) {
  return (
    <div className="tx-no-results">
      <p>مفيش نتائج مطابقة للبحث أو الفلتر الحالي.</p>
      <button type="button" className="tx-cta tx-cta-outline" onClick={onClear}>
        امسح البحث والفلتر
      </button>
    </div>
  );
}

export function AssessmentSkeleton() {
  return (
    <div className="tx-layout" aria-hidden>
      <div className="tx-main">
        <div className="tx-toolbar-skeleton" />
        <div className="tx-list">
          {[0, 1, 2].map((index) => (
            <div className="tx-card-skeleton" key={index}>
              <span className="tx-skeleton-line tx-skeleton-line-title" />
              <span className="tx-skeleton-line tx-skeleton-line-meta" />
              <span className="tx-skeleton-line tx-skeleton-line-actions" />
            </div>
          ))}
        </div>
      </div>

      <aside className="tx-side">
        {[0, 1, 2].map((index) => (
          <div className="tx-side-card tx-side-card-skeleton" key={index}>
            <span className="tx-skeleton-line tx-skeleton-line-short" />
            <span className="tx-skeleton-line tx-skeleton-line-value" />
            <span className="tx-skeleton-line tx-skeleton-line-foot" />
          </div>
        ))}
      </aside>
    </div>
  );
}
