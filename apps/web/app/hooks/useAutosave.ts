'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export type SaveStatus = 'idle' | 'dirty' | 'saving' | 'saved' | 'error';

interface UseAutosaveOptions<T> {
  data: T;
  save: (data: T) => Promise<void>;
  delay?: number; // ms before autosave triggers
  enabled?: boolean;
}

export function useAutosave<T>({ data, save, delay = 1500, enabled = true }: UseAutosaveOptions<T>) {
  const [status, setStatus] = useState<SaveStatus>('idle');
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const initialData = useRef(data);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isDirtyRef = useRef(false);

  const markDirty = useCallback(() => {
    isDirtyRef.current = true;
    setStatus('dirty');
  }, []);

  // Debounced autosave
  useEffect(() => {
    if (!enabled) return;
    if (!isDirtyRef.current) return;
    if (JSON.stringify(data) === JSON.stringify(initialData.current)) return;

    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(async () => {
      setStatus('saving');
      setError(null);
      try {
        await save(data);
        initialData.current = data;
        isDirtyRef.current = false;
        setStatus('saved');
        setLastSavedAt(new Date());
      } catch (err) {
        setError(err instanceof Error ? err.message : 'فشل الحفظ التلقائي');
        setStatus('error');
      }
    }, delay);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [data, delay, enabled, save]);

  const saveNow = useCallback(async () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setStatus('saving');
    setError(null);
    try {
      await save(data);
      initialData.current = data;
      isDirtyRef.current = false;
      setStatus('saved');
      setLastSavedAt(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل الحفظ');
      setStatus('error');
    }
  }, [data, save]);

  // Unsaved changes protection
  useEffect(() => {
    if (!enabled) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirtyRef.current || status === 'saving') {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [enabled, status]);

  return { status, lastSavedAt, error, markDirty, saveNow };
}