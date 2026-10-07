'use client';

import UploadManager from '@/app/components/upload/UploadManager';

interface ResourceUploaderProps {
  lessonId: string;
  onComplete?: (file: File, response: any) => void;
  onError?: (file: File, error: Error) => void;
}

export default function ResourceUploader({ lessonId, onComplete, onError }: ResourceUploaderProps) {
  const config = {
    accept: '.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.zip',
    maxSize: 100 * 1024 * 1024, // 100MB
    multiple: true,
    getUploadUrl: async (file: File) => {
      const res = await fetch('/api/teacher/resources/upload-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lessonId,
          fileName: file.name,
          mimeType: file.type,
          fileSize: file.size,
        }),
      });
      if (!res.ok) throw new Error('فشل في الحصول على رابط الرفع');
      return res.json();
    },
    onComplete,
    onError,
  };

  return (
    <UploadManager
      config={config}
      title="رفع موارد للدرس"
      description="PDF, مستندات, عروض تقديمية، جداول بيانات، ملفات نصية — الحد الأقصى 100 ميجابايت للملف"
    />
  );
}