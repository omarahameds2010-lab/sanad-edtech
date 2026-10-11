import StudentCommandRegistrar from "./StudentCommandRegistrar";
import StudentDock from "./components/StudentDock";

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-reading)" }}>
      <StudentCommandRegistrar />
      <StudentDock />
      <main
        className="lp-container"
        style={{ paddingTop: 24, paddingBottom: 64, maxWidth: 1020 }}
      >
        {children}
      </main>
    </div>
  );
}
