"use client";

import { useEffect } from "react";
import {
  useCommandPalette,
  CommandAction,
} from "@/app/hooks/useCommandPalette";

const teacherActions: CommandAction[] = [
  {
    id: "new-course",
    title: "أنشئ كورس جديد",
    category: "إنشاء",
    keywords: ["course", "create", "new"],
    perform: () => window.location.assign("/teacher/courses/new"),
  },
  {
    id: "go-publish",
    title: "افتح مساحة النشر",
    category: "تنقل",
    keywords: ["go", "publish", "release"],
    perform: () => window.location.assign("/teacher/publish"),
  },
  {
    id: "go-courses",
    title: "افتح الكورسات",
    category: "تنقل",
    keywords: ["go", "navigate", "courses"],
    perform: () => window.location.assign("/teacher/courses"),
  },
  {
    id: "go-students",
    title: "افتح الطلاب",
    category: "تنقل",
    keywords: ["go", "students"],
    perform: () => window.location.assign("/teacher/students"),
  },
  {
    id: "go-assignments",
    title: "افتح الواجبات",
    category: "تنقل",
    keywords: ["go", "assignments", "grading"],
    perform: () => window.location.assign("/teacher/assignments"),
  },
  {
    id: "go-exams",
    title: "افتح الاختبارات",
    category: "تنقل",
    keywords: ["go", "exams", "attempts"],
    perform: () => window.location.assign("/teacher/exams"),
  },
  {
    id: "go-payments",
    title: "افتح المدفوعات",
    category: "تنقل",
    keywords: ["go", "payments", "orders"],
    perform: () => window.location.assign("/teacher/payments"),
  },
  {
    id: "go-dashboard",
    title: "افتح لوحة التحكم",
    category: "تنقل",
    keywords: ["go", "dashboard", "home"],
    perform: () => window.location.assign("/teacher"),
  },
];

export default function TeacherCommandRegistrar() {
  const { registerAction } = useCommandPalette();

  useEffect(() => {
    teacherActions.forEach(registerAction);
    return () => {
      teacherActions.forEach((a) => {
        // no-op: actions are idempotent by id
      });
    };
  }, [registerAction]);

  return null;
}
