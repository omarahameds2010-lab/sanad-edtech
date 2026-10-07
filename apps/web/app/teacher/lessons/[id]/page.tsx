'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useAutosave } from '@/app/hooks/useAutosave';
import {
  LessonEditorShell,
  VideoLessonEditor,
  TextLessonEditor,
  ResourceLessonEditor,
  AssignmentLessonEditor,
  ExamLessonEditor,
} from '@/app/components/editor';

// Mock lesson data keyed by ID (mirrors the builder tree)
const lessons: Record<string, { title: string; type: string; course: string; section: string; data: any }> = {
  l1: { title: 'مقدمة في المتغيرات', type: 'VIDEO', course: 'الرياضيات - جبر وهندسة', section: 'الوحدة 1: أساسيات الجبر', data: { title: 'مقدمة في المتغيرات', duration: 720 } },
  l2: { title: 'المعادلات الخطية', type: 'VIDEO', course: 'الرياضيات - جبر وهندسة', section: 'الوحدة 1: أساسيات الجبر', data: { title: 'المعادلات الخطية', duration: 900 } },
  l3: { title: 'ورقة عمل: المتغيرات', type: 'RESOURCE', course: 'الرياضيات - جبر وهندسة', section: 'الوحدة 1: أساسيات الجبر', data: { title: 'ورقة عمل: المتغيرات', resources: [] } },
  l4: { title: 'واجب: حل المعادلات', type: 'ASSIGNMENT', course: 'الرياضيات - جبر وهندسة', section: 'الوحدة 1: أساسيات الجبر', data: { title: 'واجب: حل المعادلات', timerMinutes: 300 } },
  l5: { title: 'مفهوم الدالة', type: 'VIDEO', course: 'الرياضيات - جبر وهندسة', section: 'الوحدة 2: الدوال والتركيب', data: { title: 'مفهوم الدالة', duration: 1020 } },
  l6: { title: 'الدوال الخطية', type: 'VIDEO', course: 'الرياضيات - جبر وهندسة', section: 'الوحدة 2: الدوال والتركيب', data: { title: 'الدوال الخطية', duration: 840 } },
  l7: { title: 'تمارين: الدوال', type: 'ASSIGNMENT', course: 'الرياضيات - جبر وهندسة', section: 'الوحدة 2: الدوال والتركيب', data: { title: 'تمارين: الدوال', timerMinutes: 300 } },
  l8: { title: 'الإحداثيات والمستقيمات', type: 'VIDEO', course: 'الرياضيات - جبر وهندسة', section: 'الوحدة 3: الهندسة التحليلية', data: { title: 'الإحداثيات والمستقيمات', duration: 960 } },
  l9: { title: 'المسافات ومنتصف القطعة', type: 'VIDEO', course: 'الرياضيات - جبر وهندسة', section: 'الوحدة 3: الهندسة التحليلية', data: { title: 'المسافات ومنتصف القطعة', duration: 780 } },
  l10: { title: 'اختبار: الهندسة التحليلية', type: 'EXAM', course: 'الرياضيات - جبر وهندسة', section: 'الوحدة 3: الهندسة التحليلية', data: { title: 'اختبار: الهندسة التحليلية', timerMinutes: 70, questions: [] } },
};

const saveLesson = async (lessonId: string, payload: any): Promise<void> => {
  // Simulate API call — replace with real fetch to /api/teacher/lessons/:id
  await new Promise((resolve) => setTimeout(resolve, 300));
  console.log('Autosave lesson', lessonId, payload);
};

export default function LessonEditorPage() {
  const params = useParams<{ id: string }>();
  const lessonId = params?.id || 'l1';
  const lesson = lessons[lessonId] || lessons['l1'];

  const [data, setData] = useState<any>(lesson.data);

  const { status, lastSavedAt, error, saveNow } = useAutosave({
    data,
    save: (d) => saveLesson(lessonId, d),
    delay: 1500,
  });

  const renderEditor = () => {
    switch (lesson.type) {
      case 'VIDEO':
        return <VideoLessonEditor lessonId={lessonId} initialData={data} />;
      case 'TEXT':
        return <TextLessonEditor initialData={data} />;
      case 'RESOURCE':
        return <ResourceLessonEditor lessonId={lessonId} initialData={data} />;
      case 'ASSIGNMENT':
        return <AssignmentLessonEditor lessonId={lessonId} initialData={data} />;
      case 'EXAM':
        return <ExamLessonEditor lessonId={lessonId} initialData={data} />;
      default:
        return <p style={{ color: 'var(--text-muted)' }}>نوع درس غير معروف: {lesson.type}</p>;
    }
  };

  return (
    <LessonEditorShell
      breadcrumb={{ course: lesson.course, section: lesson.section, lesson: lesson.title }}
      lessonType={lesson.type}
      saveStatus={status}
      lastSavedAt={lastSavedAt}
      saveError={error}
      onSave={saveNow}
      onPreview={() => alert('Preview mode')}
      onPublish={() => alert('Publish flow')}
    >
      {renderEditor()}
    </LessonEditorShell>
  );
}