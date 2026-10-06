'use client';

import { useState } from 'react';
import Link from 'next/link';

const course = {
  id: 'c2',
  title: 'الرياضيات - جبر وهندسة',
  slug: 'math-algebra-geometry',
  status: 'DRAFT',
  sections: [
    {
      id: 's1',
      title: 'الوحدة 1: أساسيات الجبر',
      orderIndex: 1,
      lessons: [
        { id: 'l1', title: 'مقدمة في المتغيرات', type: 'VIDEO', orderIndex: 1, status: 'PROCESSING', duration: 720 },
        { id: 'l2', title: 'المعادلات الخطية', type: 'VIDEO', orderIndex: 2, status: 'READY', duration: 900 },
        { id: 'l3', title: 'ورقة عمل: المتغيرات', type: 'RESOURCE', orderIndex: 3, status: 'READY' },
        { id: 'l4', title: 'واجب: حل المعادلات', type: 'ASSIGNMENT', orderIndex: 4, status: 'READY' },
      ],
    },
    {
      id: 's2',
      title: 'الوحدة 2: الدوال والتركيب',
      orderIndex: 2,
      lessons: [
        { id: 'l5', title: 'مفهوم الدالة', type: 'VIDEO', orderIndex: 1, status: 'READY', duration: 1020 },
        { id: 'l6', title: 'الدوال الخطية', type: 'VIDEO', orderIndex: 2, status: 'READY', duration: 840 },
        { id: 'l7', title: 'تمارين: الدوال', type: 'ASSIGNMENT', orderIndex: 3, status: 'READY' },
      ],
    },
    {
      id: 's3',
      title: 'الوحدة 3: الهندسة التحليلية',
      orderIndex: 3,
      lessons: [
        { id: 'l8', title: 'الإحداثيات والمستقيمات', type: 'VIDEO', orderIndex: 1, status: 'READY', duration: 960 },
        { id: 'l9', title: 'المسافات ومنتصف القطعة', type: 'VIDEO', orderIndex: 2, status: 'READY', duration: 780 },
        { id: 'l10', title: 'اختبار: الهندسة التحليلية', type: 'EXAM', orderIndex: 3, status: 'DRAFT' },
      ],
    },
  ],
};

const typeLabels: Record<string, string> = {
  VIDEO: 'فيديو',
  TEXT: 'نص',
  RESOURCE: 'مورد',
  ASSIGNMENT: 'واجب',
  EXAM: 'اختبار',
};

const typeColors: Record<string, string> = {
  VIDEO: '#3b82f6',
  TEXT: '#6b7280',
  RESOURCE: '#10b981',
  ASSIGNMENT: '#f59e0b',
  EXAM: '#ef4444',
};

const statusLabels: Record<string, string> = {
  READY: 'جاهز',
  PROCESSING: 'قيد المعالجة',
  DRAFT: 'مسودة',
  PUBLISHED: 'منشور',
};

function formatDuration(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function CourseBuilderPage() {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['s1', 's2', 's3']));
  const [draggedItem, setDraggedItem] = useState<{ type: 'section' | 'lesson'; id: string } | null>(null);

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) next.delete(sectionId);
      else next.add(sectionId);
      return next;
    });
  };

  const handleDragStart = (type: 'section' | 'lesson', id: string) => {
    setDraggedItem({ type, id });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (targetType: 'section' | 'lesson', targetId: string) => {
    if (!draggedItem || draggedItem.type !== targetType) return;
    if (draggedItem.id === targetId) return;
    // In real implementation, call API to reorder
    console.log(`Move ${draggedItem.type} ${draggedItem.id} before ${targetId}`);
    setDraggedItem(null);
  };

  return (
    <>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 'var(--space-lg)',
          gap: 'var(--space-md)',
          flexWrap: 'wrap',
        }}
      >
        <div>
          <h1>{course.title}</h1>
          <p style={{ color: 'var(--text-muted)' }}>
            {course.sections.length} أقسام · {course.sections.reduce((sum, s) => sum + s.lessons.length, 0)} دروس
          </p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
          <a href="/teacher/courses/c2">
            <button style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
              العودة
            </button>
          </a>
          <a href="/teacher/courses/c2/preview">
            <button style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
              معاينة
            </button>
          </a>
          <button>نشر الكورس</button>
        </div>
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ display: 'flex', gap: 'var(--space-lg)' }}>
          {/* Structure Tree */}
          <aside
            style={{
              width: 320,
              borderInlineEnd: '1px solid var(--border-subtle)',
              padding: 'var(--space-md)',
              overflowY: 'auto',
              maxHeight: 'calc(100vh - 200px)',
            }}
          >
            <h3 style={{ marginBottom: 'var(--space-md)' }}>هيكل الكورس</h3>
            {course.sections.map((section) => (
              <div
                key={section.id}
                draggable
                onDragStart={() => handleDragStart('section', section.id)}
                onDragOver={handleDragOver}
                onDrop={() => handleDrop('section', section.id)}
                style={{
                  marginBottom: 'var(--space-sm)',
                  opacity: draggedItem?.type === 'section' && draggedItem.id === section.id ? 0.5 : 1,
                }}
              >
                <button
                  onClick={() => toggleSection(section.id)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: 'var(--space-sm)',
                    borderRadius: 'var(--radius-control)',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'right',
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                    <span>{expandedSections.has(section.id) ? '▼' : '▶'}</span>
                    <strong>{section.title}</strong>
                  </span>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {section.lessons.length} دروس
                  </span>
                </button>

                {expandedSections.has(section.id) && (
                  <div style={{ marginInlineStart: 'var(--space-md)', marginTop: 'var(--space-xs)', borderInlineStart: '2px solid var(--border-subtle)', paddingInlineStart: 'var(--space-sm)' }}>
                    {section.lessons.map((lesson) => (
                      <div
                        key={lesson.id}
                        draggable
                        onDragStart={() => handleDragStart('lesson', lesson.id)}
                        onDragOver={handleDragOver}
                        onDrop={() => handleDrop('lesson', lesson.id)}
                        style={{
                          marginBottom: 'var(--space-xs)',
                          opacity: draggedItem?.type === 'lesson' && draggedItem.id === lesson.id ? 0.5 : 1,
                        }}
                      >
                        <Link
                          href={`/teacher/lessons/${lesson.id}`}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 'var(--space-sm)',
                            padding: '6px 8px',
                            borderRadius: 'var(--radius-control)',
                            textDecoration: 'none',
                            color: 'var(--text-primary)',
                          }}
                        >
                          <span
                            style={{
                              width: 8,
                              height: 8,
                              borderRadius: '50%',
                              background: typeColors[lesson.type],
                              flexShrink: 0,
                            }}
                          />
                          <span style={{ flex: 1, fontSize: 13 }}>{lesson.title}</span>
                          <span
                            style={{
                              fontSize: 10,
                              padding: '1px 6px',
                              borderRadius: '999px',
                              background: `${typeColors[lesson.type]}20`,
                              color: typeColors[lesson.type],
                              fontWeight: 600,
                            }}
                          >
                            {typeLabels[lesson.type]}
                          </span>
                          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                            {statusLabels[lesson.status]}
                          </span>
                          {lesson.duration && (
                            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                              {formatDuration(lesson.duration)}
                            </span>
                          )}
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </aside>

          {/* Editor / Preview Panel */}
          <main style={{ flex: 1, padding: 'var(--space-lg)', maxWidth: 720 }}>
            <div className="card" style={{ minHeight: 400 }}>
              <h2 style={{ marginBottom: 'var(--space-md)' }}>اختر درسًا للتحرير</h2>
              <p style={{ color: 'var(--text-muted)' }}>
                اضغط على أي درس في الشجرة الجانبية لفتح المحرر الخاص به.
              </p>
              <div style={{ marginTop: 'var(--space-lg)', padding: 'var(--space-md)', background: 'var(--bg-surface)', borderRadius: 'var(--radius-control)' }}>
                <h3>أنواع الدروس المدعومة</h3>
                <ul style={{ marginTop: 'var(--space-sm)', display: 'grid', gap: 'var(--space-xs)' }}>
                  <li><strong>VIDEO</strong> — فيديو مع رفع مباشر، معالجة، ترجمات</li>
                  <li><strong>TEXT</strong> — محرر نص غني مع صور وروابط</li>
                  <li><strong>RESOURCE</strong> — PDF، مستندات، روابط خارجية</li>
                  <li><strong>ASSIGNMENT</strong> — تعليمات، وقت محدد، أنواع تسليم</li>
                  <li><strong>EXAM</strong> — أسئلة متعددة، وقت، درجات، عشوائية</li>
                </ul>
              </div>
            </div>
          </main>
        </div>
      </div>
    </>
  );
}