'use client';

import { useEffect } from 'react';
import { useCommandPalette, CommandAction } from '@/app/hooks/useCommandPalette';

const studentActions: CommandAction[] = [
  { id: 'go-dashboard', title: 'افتح لوحة الطالب', category: 'تنقل', keywords: ['go', 'dashboard'], perform: () => window.location.assign('/student') },
  { id: 'go-courses', title: 'افتح كورساتي', category: 'تنقل', keywords: ['go', 'courses'], perform: () => window.location.assign('/student/courses') },
  { id: 'go-assignments', title: 'افتح واجباتي', category: 'تنقل', keywords: ['go', 'assignments'], perform: () => window.location.assign('/student/assignments') },
  { id: 'go-exams', title: 'افتح اختباراتي', category: 'تنقل', keywords: ['go', 'exams', 'attempts'], perform: () => window.location.assign('/student/exams') },
  { id: 'continue-learning', title: 'أكمل التعلم', category: 'إجراء', keywords: ['continue', 'resume'], perform: () => window.location.assign('/student/lessons/l1') },
];

export default function StudentCommandRegistrar() {
  const { registerAction } = useCommandPalette();

  useEffect(() => {
    studentActions.forEach(registerAction);
  }, [registerAction]);

  return null;
}