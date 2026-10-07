'use client';

import { useState } from 'react';
import UploadManager from '@/app/components/upload/UploadManager';

interface ThumbnailUploaderProps {
  lessonId?: string;
  courseId?: string;
  onComplete?: (file: File, response: any) => void;
  onError?: (file: File, error: Error) => void;
  currentThumbnail?: string;
}

export default function ThumbnailUploader({ lessonId, courseId, onComplete, onError, currentThumbnail }: ThumbnailUploaderProps) {
  const [preview, setPreview] = useState<string | null>(currentThumbnail || null);

  const config = {
    accept: 'image/jpeg,image/png,image/webp',
    maxSize: 5 * 1024 * 1024, // 5MB
    multiple: false,
    getUploadUrl: async (file: File) => {
      const res = await fetch('/api/teacher/thumbnail/upload-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lessonId,
          courseId,
          fileName: file.name,
          mimeType: file.type,
          fileSize: file.size,
        }),
      });
      if (!res.ok) throw new Error('فشل في الحصول على رابط الرفع');
      return res.json();
    },
    onComplete: (file: File, response: any) => {
      setPreview(response.thumbnailUrl || URL.createObjectURL(file));
      onComplete?.(file, response);
    },
    onError,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)', maxWidth: 400 }}>
      {preview && (
        <div style={{ position: 'relative', aspectRatio: '16/9', borderRadius: 'var(--radius-card)', overflow: 'hidden', border: '1px solid var(--border-subtle)' }}>
          <img src={preview} alt="Thumbnail preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      )}

      <UploadManager
        config={{
          accept: 'image/jpeg,image/png,image/webp',
          maxSize: 5 * 1024 * 1024,
          multiple: false,
          getUploadUrl: config.getUploadUrl,
          onComplete: config.onComplete,
          onError: config.onError,
        }}
        title="رفع صورة مصغرة"
        description="JPG, PNG, WebP — النسبة المفضلة 16:9، الحد الأقصى 5 ميجابايت"
        showPreview={false}
      />
    </div>
  );
}