import type { Metadata } from "next";
import DemoPageClient from "./DemoPageClient";

export const metadata: Metadata = {
  title: "جرّب سند — ديمو بدون تسجيل",
  description:
    "ادخل كطالب أو كمعلم بضغطة واحدة، واستكشف المسار الكامل من الدرس إلى التصحيح في 90 ثانية.",
};

export default function DemoPage() {
  return <DemoPageClient />;
}
