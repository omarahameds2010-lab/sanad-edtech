import StudentCommandRegistrar from "./StudentCommandRegistrar";
import StudentDock from "./components/StudentDock";

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="student-shell">
      <StudentCommandRegistrar />
      <StudentDock />
      <main
        className="lp-container student-main"
        style={{ paddingTop: 24, paddingBottom: 64 }}
      >
        {children as any}
      </main>
    </div>
  );
}
