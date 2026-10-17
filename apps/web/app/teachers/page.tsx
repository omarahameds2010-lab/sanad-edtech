import SiteHeader from "../components/landing/SiteHeader";
import TeachersDirectory from "../components/teachers/TeachersDirectory";

export const metadata = {
  title: "منصات المعلمين — سند",
  description:
    "اختر منصتك التعليمية، وابدأ رحلة التعلم مع نخبة من المعلمين على منصة سند.",
};

export default function TeachersPage() {
  return (
    <>
      <SiteHeader />
      <TeachersDirectory />
    </>
  );
}
