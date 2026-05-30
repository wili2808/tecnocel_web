import { useRef, useCallback } from 'react';

export function useFormDirty<T extends Record<string, unknown>>() {
  const initialRef = useRef<T | null>(null);

  const setInitialValues = useCallback((values: T) => {
    initialRef.current = { ...values };
  }, []);

  const isDirty = useCallback((currentValues: T): boolean => {
    if (!initialRef.current) return false;
    return (Object.keys(initialRef.current) as Array<keyof T>).some(
      (key) => initialRef.current![key] !== currentValues[key]
    );
  }, []);

  return { setInitialValues, isDirty };
}
