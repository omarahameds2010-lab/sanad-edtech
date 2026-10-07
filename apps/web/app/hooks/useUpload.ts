import { useState, useCallback, useRef } from 'react';

export type UploadType = 'video' | 'pdf' | 'image' | 'document';

export interface UploadConfig {
  accept: string;
  maxSize: number; // bytes
  multiple?: boolean;
  getUploadUrl: (file: File) => Promise<{ uploadUrl: string; expiresAt: string }>;
  onComplete?: (file: File, response: any) => void;
  onError?: (file: File, error: Error) => void;
}

export type UploadStatus = 'idle' | 'selected' | 'validating' | 'uploading' | 'processing' | 'success' | 'error' | 'cancelled';

export interface UploadFile {
  id: string;
  file: File;
  status: UploadStatus;
  progress: number;
  error?: string;
  preview?: string;
  response?: any;
}

export function useUpload(config: UploadConfig) {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const abortControllersRef = useRef<Map<string, AbortController>>(new Map());

  const validateFile = useCallback((file: File): string | null => {
    if (!config.accept.split(',').some((type) => {
      if (type.startsWith('.')) return file.name.endsWith(type);
      return file.type.match(type.replace('*', '.*'));
    })) {
      return 'نوع الملف غير مدعوم';
    }
    if (file.size > config.maxSize) {
      return `حجم الملف يتجاوز الحد الأقصى (${formatBytes(config.maxSize)})`;
    }
    return null;
  }, [config.accept, config.maxSize]);

  const uploadFile = useCallback(async (uploadFile: UploadFile) => {
    const abortController = new AbortController();
    abortControllersRef.current.set(uploadFile.id, abortController);

    try {
      setFiles((prev) => prev.map((f) => f.id === uploadFile.id ? { ...f, status: 'validating' } : f));

      const error = validateFile(uploadFile.file);
      if (error) throw new Error(error);

      setFiles((prev) => prev.map((f) => f.id === uploadFile.id ? { ...f, status: 'uploading', progress: 0 } : f));

      const { uploadUrl } = await config.getUploadUrl(uploadFile.file);

      const response = await fetch(uploadUrl, {
        method: 'PUT',
        body: uploadFile.file,
        headers: { 'Content-Type': uploadFile.file.type },
        signal: abortController.signal,
      });

      if (!response.ok) throw new Error('فشل الرفع');

      setFiles((prev) => prev.map((f) => f.id === uploadFile.id ? { ...f, status: 'processing', progress: 100 } : f));

      const result = await response.json();

      setFiles((prev) => prev.map((f) => f.id === uploadFile.id ? { ...f, status: 'success', progress: 100, response: result } : f));

      config.onComplete?.(uploadFile.file, result);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        setFiles((prev) => prev.map((f) => f.id === uploadFile.id ? { ...f, status: 'cancelled' } : f));
      } else {
        const message = err instanceof Error ? err.message : 'حدث خطأ غير متوقع';
        setFiles((prev) => prev.map((f) => f.id === uploadFile.id ? { ...f, status: 'error', error: message } : f));
        config.onError?.(uploadFile.file, err instanceof Error ? err : new Error(message));
      }
    } finally {
      abortControllersRef.current.delete(uploadFile.id);
    }
  }, [config, validateFile]);

  const addFiles = useCallback((newFiles: FileList | File[]) => {
    const fileArray = Array.from(newFiles);
    if (!config.multiple && fileArray.length > 1) {
      fileArray.splice(1);
    }

    const newUploadFiles: UploadFile[] = fileArray.map((file) => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      file,
      status: 'selected',
      progress: 0,
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
    }));

    setFiles((prev) => [...prev, ...newUploadFiles]);

    newUploadFiles.forEach((f) => uploadFile(f));
  }, [config.multiple, uploadFile]);

  const removeFile = useCallback((id: string) => {
    const controller = abortControllersRef.current.get(id);
    if (controller) {
      controller.abort();
      abortControllersRef.current.delete(id);
    }
    const file = files.find((f) => f.id === id);
    if (file?.preview) URL.revokeObjectURL(file.preview);
    setFiles((prev) => prev.filter((f) => f.id !== id));
  }, [files]);

  const cancelFile = useCallback((id: string) => {
    const controller = abortControllersRef.current.get(id);
    if (controller) controller.abort();
  }, []);

  const retryFile = useCallback((id: string) => {
    const file = files.find((f) => f.id === id);
    if (file && (file.status === 'error' || file.status === 'cancelled')) {
      setFiles((prev) => prev.map((f) => f.id === id ? { ...f, status: 'selected', progress: 0, error: undefined } : f));
      uploadFile({ ...file, status: 'selected', progress: 0, error: undefined });
    }
  }, [files, uploadFile]);

  const clearCompleted = useCallback(() => {
    setFiles((prev) => prev.filter((f) => f.status !== 'success'));
  }, []);

  return {
    files,
    addFiles,
    removeFile,
    cancelFile,
    retryFile,
    clearCompleted,
    isUploading: files.some((f) => f.status === 'uploading' || f.status === 'validating' || f.status === 'processing'),
  };
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}