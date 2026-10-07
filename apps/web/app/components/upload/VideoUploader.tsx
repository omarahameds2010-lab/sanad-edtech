'use client';

import UploadManager from '@/app/components/upload/UploadManager';

interface VideoUploaderProps {
  lessonId: string;
  onComplete?: (file: File, response: any) => void;
  onError?: (file: File, error: Error) => void;
}

export default function VideoUploader({ lessonId, onComplete, onError }: VideoUploaderProps) {
  const config = {
    accept: 'video/mp4,video/webm,video/quicktime,video/x-msvideo',
    maxSize: 5 * 1024 * 1024 * 1024, // 5GB
    multiple: false,
    getUploadUrl: async (file: File) => {
      const res = await fetch('/api/teacher/videos/upload-url', {
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
      title="رفع فيديو للدرس"
      description="الصيغ المدعومة: MP4, WebM, MOV, AVI — الحد الأقصى 5 جيجابايت"
    />
  );
}