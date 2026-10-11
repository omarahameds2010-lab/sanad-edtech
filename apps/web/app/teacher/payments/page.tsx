"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/app/lib/auth";
import { api, ApiError, type OrderListItem } from "@/app/lib/api";

const orderStatusLabels: Record<string, string> = {
  PENDING: "بانتظار الدفع",
  CONFIRMED: "مؤكد",
  EXPIRED: "منتهي",
  CANCELLED: "ملغي",
  REFUNDED: "مسترد",
};

function formatMinor(value: number | string, currency: string): string {
  const major = Number(value) / 100;
  return `${major.toFixed(2)} ${currency}`;
}

export default function TeacherPaymentsPage() {
  const { token } = useAuth();
  const [orders, setOrders] = useState<OrderListItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    api
      .listOrders(token)
      .then((r) => setOrders(r.orders))
      .catch((e) =>
        setError(e instanceof ApiError ? e.message : "تعذر تحميل المدفوعات"),
      );
  }, [token]);

  if (!token) {
    return (
      <div className="card">
        <p>
          سجّل الدخول أولًا. <Link href="/login">تسجيل الدخول</Link>
        </p>
      </div>
    );
  }

  if (error)
    return (
      <div className="card">
        <p>{error}</p>
      </div>
    );
  if (orders === null)
    return (
      <div className="card">
        <p>جاري التحميل…</p>
      </div>
    );

  const confirmedTotal = orders
    .filter((o) => o.status === "CONFIRMED")
    .reduce((sum, o) => sum + Number(o.totalMinor), 0);

  return (
    <div>
      <h1 style={{ marginBottom: "var(--space-lg)" }}>المدفوعات</h1>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
          gap: "var(--space-sm)",
          marginBottom: "var(--space-lg)",
        }}
      >
        <div className="card" style={{ textAlign: "center" }}>
          <div style={{ fontSize: 28, fontWeight: 700 }}>{orders.length}</div>
          <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
            إجمالي الطلبات
          </div>
        </div>
        <div className="card" style={{ textAlign: "center" }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: "#10b981" }}>
            {formatMinor(confirmedTotal, orders[0]?.currency ?? "EGP")}
          </div>
          <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
            إجمالي المؤكد
          </div>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="card">
          <p>لا توجد طلبات دفع بعد.</p>
        </div>
      ) : (
        <div className="card" style={{ overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr
                style={{
                  textAlign: "right",
                  borderBottom: "1px solid var(--border-subtle)",
                  background: "var(--bg-surface)",
                }}
              >
                <th style={{ padding: "var(--space-md)" }}>رقم الطلب</th>
                <th style={{ padding: "var(--space-md)" }}>المنتجات</th>
                <th style={{ padding: "var(--space-md)" }}>الإجمالي</th>
                <th style={{ padding: "var(--space-md)" }}>الحالة</th>
                <th style={{ padding: "var(--space-md)" }}>التاريخ</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr
                  key={order.id}
                  style={{ borderBottom: "1px solid var(--border-subtle)" }}
                >
                  <td
                    style={{ padding: "var(--space-md)", fontWeight: 600 }}
                    dir="ltr"
                  >
                    {order.number}
                  </td>
                  <td style={{ padding: "var(--space-md)", fontSize: 13 }}>
                    {order.items.map((i) => i.name).join("، ") || "—"}
                  </td>
                  <td style={{ padding: "var(--space-md)", fontWeight: 600 }}>
                    {formatMinor(order.totalMinor, order.currency)}
                  </td>
                  <td style={{ padding: "var(--space-md)", fontSize: 13 }}>
                    {orderStatusLabels[order.status] ?? order.status}
                  </td>
                  <td
                    style={{
                      padding: "var(--space-md)",
                      fontSize: 12,
                      color: "var(--text-muted)",
                    }}
                  >
                    {new Date(order.createdAt).toLocaleDateString("ar-EG")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
