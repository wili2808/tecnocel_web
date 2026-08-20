import { useState, useEffect } from 'react';

/**
 * Hook que debouncea un valor durante un tiempo especificado.
 * Útil para búsquedas, filtros y otras operaciones que no deben dispararse
 * en cada keystroke sino después de que el usuario deje de escribir.
 *
 * @param value - El valor al que se aplica el debounce
 * @param delay - Tiempo en milisegundos antes de actualizar (default 500ms)
 * @returns El valor actualizado tras el debounce
 */
export function useDebounce<T>(value: T, delay: number = 500): T {
  const [debounced, setDebounced] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebounced(value);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
