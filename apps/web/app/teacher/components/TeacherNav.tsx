"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ComponentType } from "react";
import {
  AnalyticsIcon,
  AssignmentsIcon,
  CloseIcon,
  CoursesIcon,
  ExamsIcon,
  MoreIcon,
  OverviewIcon,
  PaymentsIcon,
  PlusIcon,
  PublishIcon,
  SettingsIcon,
  StudentsIcon,
} from "./TeacherIcons";

type IconProps = {
  size?: number;
  className?: string;
  strokeWidth?: number;
};

type NavItem = {
  href: string;
  label: string;
  Icon: ComponentType<IconProps>;
  mobile?: boolean;
};

export const teacherNavItems: NavItem[] = [
  { href: "/teacher", label: "نظرة عامة", Icon: OverviewIcon, mobile: true },
  { href: "/teacher/publish", label: "النشر", Icon: PublishIcon },
  { href: "/teacher/courses", label: "الكورسات", Icon: CoursesIcon, mobile: true },
  { href: "/teacher/students", label: "الطلاب", Icon: StudentsIcon, mobile: true },
  { href: "/teacher/assignments", label: "الواجبات", Icon: AssignmentsIcon },
  { href: "/teacher/exams", label: "الاختبارات", Icon: ExamsIcon, mobile: true },
  { href: "/teacher/payments", label: "المدفوعات", Icon: PaymentsIcon },
  { href: "/teacher/analytics", label: "التحليلات", Icon: AnalyticsIcon },
];

export function isTeacherNavActive(pathname: string, href: string): boolean {
  if (href === "/teacher") return pathname === "/teacher";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function RailLink({ item, pathname }: { item: NavItem; pathname: string }) {
  const active = isTeacherNavActive(pathname, item.href);
  const Icon = item.Icon;

  return (
    <Link
      href={item.href}
      className="tn-link"
      data-active={active ? "true" : "false"}
      aria-current={active ? "page" : undefined}
      title={item.label}
    >
      <span className="tn-link-icon" aria-hidden>
        <Icon size={18} />
      </span>
      <span className="tn-link-label">{item.label}</span>
    </Link>
  );
}

export function TeacherSidebar({ pathname }: { pathname: string }) {
  const settingsActive = isTeacherNavActive(pathname, "/teacher/settings");

  return (
    <aside className="tn-rail" aria-label="تنقل المعلم">
      <Link href="/teacher" className="tn-brand" aria-label="سند — لوحة المعلم">
        <span className="tn-brand-row">
          <span className="tn-brand-word">سند</span>
          <span className="tc-pulse" aria-hidden />
        </span>
        <span className="tn-brand-sub">لوحة المعلم</span>
      </Link>

      <nav className="tn-nav" aria-label="أقسام لوحة المعلم">
        {teacherNavItems.map((item) => (
          <RailLink item={item} pathname={pathname} key={item.href} />
        ))}
      </nav>

      <div className="tn-rail-foot">
        <Link
          href="/teacher/courses/new"
          className="tn-create"
          title="كورس جديد"
          aria-label="كورس جديد"
        >
          <PlusIcon size={16} />
          <span className="tn-create-label">كورس جديد</span>
        </Link>

        <Link
          href="/teacher/settings"
          className="tn-link tn-settings-link"
          data-active={settingsActive ? "true" : "false"}
          aria-current={settingsActive ? "page" : undefined}
          title="الإعدادات"
        >
          <span className="tn-link-icon" aria-hidden>
            <SettingsIcon size={18} />
          </span>
          <span className="tn-link-label">الإعدادات</span>
        </Link>
      </div>
    </aside>
  );
}

export function TeacherMobileNav({ pathname }: { pathname: string }) {
  const [open, setOpen] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);

  const mobileItems = teacherNavItems.filter((item) => item.mobile);
  const moreActive =
    teacherNavItems.some(
      (item) => !item.mobile && isTeacherNavActive(pathname, item.href),
    ) || isTeacherNavActive(pathname, "/teacher/settings");

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    window.addEventListener("keydown", onKeyDown);
    const frame = window.requestAnimationFrame(() => {
      sheetRef.current
        ?.querySelector<HTMLElement>("a, button")
        ?.focus({ preventScroll: true });
    });

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
      window.cancelAnimationFrame(frame);
    };
  }, [open]);

  return (
    <>
      <nav className="tn-mobile" aria-label="تنقل المعلم السريع">
        {mobileItems.map((item) => {
          const active = isTeacherNavActive(pathname, item.href);
          const Icon = item.Icon;
          return (
            <Link
              href={item.href}
              className="tn-mobile-link"
              data-active={active ? "true" : "false"}
              aria-current={active ? "page" : undefined}
              key={item.href}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </Link>
          );
        })}

        <button
          type="button"
          className="tn-mobile-link tn-more-btn"
          data-active={moreActive ? "true" : "false"}
          aria-expanded={open}
          aria-controls="teacher-more-sheet"
          onClick={() => setOpen(true)}
        >
          <MoreIcon size={20} />
          <span>المزيد</span>
        </button>
      </nav>

      {open ? (
        <div
          className="tn-sheet-layer"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setOpen(false);
          }}
        >
          <div
            ref={sheetRef}
            id="teacher-more-sheet"
            className="tn-sheet"
            role="dialog"
            aria-modal="true"
            aria-labelledby="teacher-more-title"
          >
            <div className="tn-sheet-head">
              <p className="tn-sheet-title" id="teacher-more-title">
                كل الأقسام
              </p>
              <button
                type="button"
                className="tn-sheet-close"
                aria-label="إغلاق القائمة"
                onClick={() => setOpen(false)}
              >
                <CloseIcon size={16} />
              </button>
            </div>

            <div className="tn-sheet-grid">
              {teacherNavItems.map((item) => {
                const active = isTeacherNavActive(pathname, item.href);
                const Icon = item.Icon;
                return (
                  <Link
                    href={item.href}
                    className="tn-sheet-link"
                    data-active={active ? "true" : "false"}
                    aria-current={active ? "page" : undefined}
                    key={item.href}
                  >
                    <Icon size={17} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}

              <Link
                href="/teacher/settings"
                className="tn-sheet-link"
                data-active={
                  isTeacherNavActive(pathname, "/teacher/settings")
                    ? "true"
                    : "false"
                }
                aria-current={
                  isTeacherNavActive(pathname, "/teacher/settings")
                    ? "page"
                    : undefined
                }
              >
                <SettingsIcon size={17} />
                <span>الإعدادات</span>
              </Link>
            </div>

            <Link href="/teacher/courses/new" className="tn-sheet-create">
              <PlusIcon size={16} />
              <span>كورس جديد</span>
              <span className="tn-sheet-create-arrow" aria-hidden>
                ←
              </span>
            </Link>
          </div>
        </div>
      ) : null}
    </>
  );
}
