import "./system-pages.css";

export default function Loading() {
  return (
    <main className="system-shell" aria-busy="true">
      <div className="system-card system-loading-card" role="status">
        <span className="system-spinner" aria-hidden />
        <p className="system-text">جارٍ تحميل الصفحة…</p>
      </div>
    </main>
  );
}
