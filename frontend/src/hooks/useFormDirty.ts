import { useRef, useCallback } from 'react';

export function useFormDirty<T extends object>() {
  const initialRef = useRef<T | null>(null);
  const extraRef = useRef<Record<string, string> | null>(null);

  const setInitialValues = useCallback((values: T, extra?: Record<string, unknown>) => {
    initialRef.current = { ...values };
    extraRef.current = null;
    if (extra) {
      const serialized: Record<string, string> = {};
      for (const [key, val] of Object.entries(extra)) {
        serialized[key] = JSON.stringify(val);
      }
      extraRef.current = serialized;
    }
  }, []);

  const isDirty = useCallback((currentValues: T, extra?: Record<string, unknown>): boolean => {
    if (!initialRef.current) return false;

    const hasMainDiff = (Object.keys(initialRef.current) as Array<keyof T>).some(
      (key) => initialRef.current![key] !== currentValues[key]
    );
    if (hasMainDiff) return true;

    if (!extraRef.current || !extra) return false;

    for (const [key, val] of Object.entries(extra)) {
      const serialized = extraRef.current[key];
      if (serialized === undefined) continue;
      if (JSON.stringify(val) !== serialized) return true;
    }

    return false;
  }, []);

  return { setInitialValues, isDirty };
}
