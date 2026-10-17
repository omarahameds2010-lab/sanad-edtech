"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  useCommandPalette,
  type CommandAction,
} from "@/app/hooks/useCommandPalette";

/**
 * Student palette commands. Navigation must go through the SPA router —
 * window.location.assign would trigger a full reload and drop the
 * in-memory session.
 */
export default function StudentCommandRegistrar() {
  const { registerAction, unregisterAction } = useCommandPalette();
  const router = useRouter();

  useEffect(() => {
    const actions: CommandAction[] = [
      {
        id: "go-dashboard",
        title: "افتح لوحتي",
        category: "تنقل",
        keywords: ["لوحة", "dashboard"],
        perform: () => router.push("/student"),
      },
      {
        id: "go-courses",
        title: "افتح كورساتي",
        category: "تنقل",
        keywords: ["كورسات", "courses"],
        perform: () => router.push("/student/courses"),
      },
      {
        id: "go-assignments",
        title: "افتح واجباتي",
        category: "تنقل",
        keywords: ["واجبات", "assignments"],
        perform: () => router.push("/student/assignments"),
      },
      {
        id: "go-exams",
        title: "افتح اختباراتي",
        category: "تنقل",
        keywords: ["اختبارات", "exams"],
        perform: () => router.push("/student/exams"),
      },
      {
        id: "browse-courses",
        title: "تصفح كتالوج الكورسات",
        category: "استكشاف",
        keywords: ["كتالوج", "تصفح", "browse"],
        perform: () => router.push("/courses"),
      },
    ];
    actions.forEach(registerAction);
    return () => actions.forEach((action) => unregisterAction(action.id));
  }, [registerAction, unregisterAction, router]);

  return null;
}
