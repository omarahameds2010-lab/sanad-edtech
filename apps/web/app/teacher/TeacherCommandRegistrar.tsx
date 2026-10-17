"use client";

import { useEffect } from "react";
import {
  useCommandPalette,
  CommandAction,
} from "@/app/hooks/useCommandPalette";
import { useRouter } from "next/navigation";

const teacherActions: CommandAction[] = [
  {
    id: "new-course",
    title: "أنشئ كورس جديد",
    category: "إنشاء",
    keywords: ["course", "create", "new"],
    perform: () => window.location.assign("/teacher/courses/new"),
  },
  {
    id: "new-lesson",
    title: "أنشئ درس جديد",
    category: "إنشاء",
    keywords: ["lesson", "create"],
    perform: () => window.location.assign("/teacher/lessons/new"),
  },
  {
    id: "new-assignment",
    title: "أنشئ واجب جديد",
    category: "إنشاء",
    keywords: ["assignment", "create"],
    perform: () => window.location.assign("/teacher/assignments/new"),
  },
  {
    id: "new-exam",
    title: "أنشئ اختبار جديد",
    category: "إنشاء",
    keywords: ["exam", "create"],
    perform: () => window.location.assign("/teacher/exams/new"),
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
    id: "go-analytics",
    title: "افتح التحليلات",
    category: "تنقل",
    keywords: ["go", "analytics", "stats"],
    perform: () => window.location.assign("/teacher/analytics"),
  },
  {
    id: "go-dashboard",
    title: " افتح لوحة التحكم",
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
