'use client';

import { useState, useMemo } from 'react';

const students = [
  { id: 's1', name: 'عمر مصطفى', phone: '01XXXXX1200', status: 'ACTIVE', enrollmentDate: '2026-08-15', progress: 68, lastActivity: '2026-10-05 18:30' },
  { id: 's2', name: 'سارة علي', phone: '01XXXXX1201', status: 'ACTIVE', enrollmentDate: '2026-09-01', progress: 82, lastActivity: '2026-10-06 14:15' },
  { id: 's3', name: 'يوسف أحمد', phone: '01XXXXX1202', status: 'EXPIRED', enrollmentDate: '2026-06-20', progress: 45, lastActivity: '2026-09-28 09:00' },
  { id: 's4', name: 'مريم حسن', phone: '01XXXXX1203', status: 'ACTIVE', enrollmentDate: '2026-10-01', progress: 12, lastActivity: '2026-10-04 16:45' },
  { id: 's5', name: 'خالد إبراهيم', phone: '01XXXXX1204', status: 'CANCELLED', enrollmentDate: '2026-05-10', progress: 95, lastActivity: '2026-08-20 11:00' },
  { id: 's6', name: 'نور الدين', phone: '01XXXXX1205', status: 'ACTIVE', enrollmentDate: '2026-07-12', progress: 30, lastActivity: '2026-10-03 20:10' },
];

const statusColors: Record<string, string> = {
  ACTIVE: '#10b981',
  EXPIRED: '#f59e0b',
  CANCELLED: '#ef4444',
};

const statusLabels: Record<string, string> = {
  ACTIVE: 'نشط',
  EXPIRED: 'منتهي',
  CANCELLED: 'ملغي',
};

export default function TeacherStudentsPage() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'ACTIVE' | 'EXPIRED' | 'CANCELLED'>('all');

  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      const matchesSearch = student.name.includes(search) || student.phone.includes(search);
      const matchesFilter = filter === 'all' || student.status === filter;
      return matchesSearch && matchesFilter;
    });
  }, [search, filter]);

  const stats = useMemo(() => ({
    total: students.length,
    active: students.filter((s) => s.status === 'ACTIVE').length,
    expired: students.filter((s) => s.status === 'EXPIRED').length,
    cancelled: students.filter((s) => s.status === 'CANCELLED').length,
  }), []);

  return (
    <>
      <h1>الطلاب</h1>

      {/* Quick Stats */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: 'var(--space-sm)',
          marginBottom: 'var(--space-lg)',
        }}
      >
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 28, fontWeight: 700 }}>{stats.total}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>الإجمالي</div>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#10b981' }}>{stats.active}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>نشط</div>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#f59e0b' }}>{stats.expired}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>منتهي</div>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#ef4444' }}>{stats.cancelled}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>ملغي</div>
        </div>
      </div>

      {/* Filters */}
      <div
        style={{
          display: 'flex',
          gap: 'var(--space-md)',
          marginBottom: 'var(--space-md)',
          flexWrap: 'wrap',
        }}
      >
        <input
          type="text"
          placeholder="ابحث بالاسم أو رقم الهاتف..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            flex: 1,
            maxWidth: 400,
            padding: '10px 14px',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-control)',
            color: 'var(--text-primary)',
            fontSize: 14,
          }}
        />
        <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
          {(['all', 'ACTIVE', 'EXPIRED', 'CANCELLED'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              style={{
                background: filter === status ? 'var(--color-action)' : 'var(--bg-surface)',
                color: filter === status ? 'var(--bg-base)' : 'var(--text-secondary)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              {status === 'all' ? 'الكل' : statusLabels[status]}
            </button>
          ))}
        </div>
      </div>

      {/* Students Table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'right', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-surface)' }}>
              <th style={{ padding: 'var(--space-md)' }}>الطالب</th>
              <th style={{ padding: 'var(--space-md)' }}>الحالة</th>
              <th style={{ padding: 'var(--space-md)' }}>تاريخ التسجيل</th>
              <th style={{ padding: 'var(--space-md)' }}>التقدم</th>
              <th style={{ padding: 'var(--space-md)' }}>آخر نشاط</th>
              <th style={{ padding: 'var(--space-md)' }}>إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.map((student) => (
              <tr key={student.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <td style={{ padding: 'var(--space-md)' }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{student.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{student.phone}</div>
                  </div>
                </td>
                <td style={{ padding: 'var(--space-md)' }}>
                  <span
                    style={{
                      display: 'inline-block',
                      padding: '2px 10px',
                      borderRadius: '999px',
                      fontSize: 12,
                      fontWeight: 600,
                      background: `${statusColors[student.status]}20`,
                      color: statusColors[student.status],
                    }}
                  >
                    {statusLabels[student.status]}
                  </span>
                </td>
                <td style={{ padding: 'var(--space-md)', color: 'var(--text-muted)' }}>{student.enrollmentDate}</td>
                <td style={{ padding: 'var(--space-md)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                    <div
                      style={{
                        width: 80,
                        height: 8,
                        background: 'var(--bg-surface)',
                        borderRadius: '999px',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          width: `${student.progress}%`,
                          height: '100%',
                          background: 'var(--color-action)',
                          borderRadius: '999px',
                        }}
                      />
                    </div>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{student.progress}%</span>
                  </div>
                </td>
                <td style={{ padding: 'var(--space-md)', color: 'var(--text-muted)' }}>{student.lastActivity}</td>
                <td style={{ padding: 'var(--space-md)' }}>
                  <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                    <button style={{ padding: '4px 12px', fontSize: 12 }}>عرض</button>
                    <button
                      style={{
                        padding: '4px 12px',
                        fontSize: 12,
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--border-subtle)',
                      }}
                    >
                      إيقاف
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredStudents.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: 'var(--space-2xl)', marginTop: 'var(--space-md)' }}>
          <div style={{ fontSize: 48, marginBottom: 'var(--space-md)' }}>👥</div>
          <h3>لا يوجد طلاب</h3>
          <p style={{ color: 'var(--text-muted)' }}>لم يتم العثور على طلاب بالبحث الحالي.</p>
        </div>
      )}
    </>
  );
}