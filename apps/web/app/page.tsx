import type { Metadata } from "next";
import SiteHeader from "./components/landing/SiteHeader";
import Hero from "./components/landing/Hero";
import JourneyMap from "./components/landing/JourneyMap";
import TrustStrip from "./components/landing/TrustStrip";
import TeacherSpaces from "./components/landing/TeacherSpaces";
import Subjects from "./components/landing/Subjects";
import HowItWorks from "./components/landing/HowItWorks";
import SanadLab from "./components/landing/SanadLab";
import Integrity from "./components/landing/Integrity";
import ForTeachers from "./components/landing/ForTeachers";
import Faq from "./components/landing/Faq";
import FinalCta from "./components/landing/FinalCta";

export const metadata: Metadata = {
  title: "سند | منصتك للتعلّم المنظّم",
  description:
    "دروسك وواجباتك واختباراتك في مسار واحد لطلاب الثانوية العامة — مع تقييم SANAD المقترح الذي يراجعه معلمك قبل اعتماد الدرجة.",
};

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main>
        <Hero />
        <JourneyMap />
        <TrustStrip />
        <TeacherSpaces />
        <Subjects />
        <HowItWorks />
        <SanadLab />
        <Integrity />
        <ForTeachers />
        <Faq />
      </main>
      <FinalCta />
    </>
  );
}
