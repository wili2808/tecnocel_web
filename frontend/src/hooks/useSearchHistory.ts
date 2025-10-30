/**
 * Hook para gestionar el historial de búsquedas
 * Proporciona funcionalidad para guardar, recuperar y limpiar búsquedas recientes
 * Persiste el historial en localStorage con límite de 5 elementos
 */
import { useState, useCallback, useEffect } from 'react';

// ============================================================================
// CONSTANTES
// ============================================================================

const SEARCH_HISTORY_KEY = 'tecnocel_search_history';
const MAX_HISTORY_ITEMS = 5;

// ============================================================================
// INTERFACES
// ============================================================================

/**
 * Opciones de configuración para el hook
 */
interface UseSearchHistoryOptions {
    /** Número máximo de elementos en el historial */
    maxItems?: number;
    /** Clave de localStorage a usar */
    storageKey?: string;
    /** Si el historial está habilitado */
    enabled?: boolean;
}

/**
 * Valor de retorno del hook
 */
interface UseSearchHistoryReturn {
    /** Historial de búsquedas ordenado por más reciente */
    history: string[];
    /** Agregar una búsqueda al historial */
    addToHistory: (query: string) => void;
    /** Limpiar todo el historial */
    clearHistory: () => void;
    /** Eliminar una búsqueda específica del historial */
    removeFromHistory: (query: string) => void;
    /** Verificar si una búsqueda está en el historial */
    isInHistory: (query: string) => boolean;
}

// ============================================================================
// FUNCIONES AUXILIARES
// ============================================================================

/**
 * Cargar historial desde localStorage
 * Maneja errores de parsing y retorna array vacío si hay problemas
 *
 * @param storageKey - Clave de localStorage
 * @returns Array de búsquedas o array vacío
 */
const loadHistoryFromStorage = (storageKey: string): string[] => {
    try {
        const stored = localStorage.getItem(storageKey);
        if (!stored) return [];

        const parsed = JSON.parse(stored);
        return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
        console.error('Error loading search history:', error);
        return [];
    }
};

/**
 * Guardar historial en localStorage
 * Maneja errores de stringify y escritura
 *
 * @param storageKey - Clave de localStorage
 * @param history - Array de búsquedas a guardar
 */
const saveHistoryToStorage = (storageKey: string, history: string[]): void => {
    try {
        localStorage.setItem(storageKey, JSON.stringify(history));
    } catch (error) {
        console.error('Error saving search history:', error);
    }
};

// ============================================================================
// HOOK PRINCIPAL
// ============================================================================

/**
 * Hook personalizado para gestionar el historial de búsquedas
 * Proporciona funcionalidad completa de historial con persistencia
 *
 * @param options - Opciones de configuración
 * @returns Objeto con historial y funciones de gestión
 */
export const useSearchHistory = ({
    maxItems = MAX_HISTORY_ITEMS,
    storageKey = SEARCH_HISTORY_KEY,
    enabled = true
}: UseSearchHistoryOptions = {}): UseSearchHistoryReturn => {
    // ============================================================================
    // ESTADO
    // ============================================================================

    /**
     * Estado del historial de búsquedas
     * Se inicializa con datos de localStorage si están disponibles
     */
    const [history, setHistory] = useState<string[]>(() => {
        if (!enabled) return [];
        return loadHistoryFromStorage(storageKey);
    });

    // ============================================================================
    // EFECTOS
    // ============================================================================

    /**
     * Sincronizar cambios del historial con localStorage
     * Se ejecuta cada vez que el historial cambia
     */
    useEffect(() => {
        if (!enabled) return;
        saveHistoryToStorage(storageKey, history);
    }, [history, storageKey, enabled]);

    // ============================================================================
    // FUNCIONES PÚBLICAS
    // ============================================================================

    /**
     * Agregar una búsqueda al historial
     * Elimina duplicados y mantiene las más recientes al inicio
     * Limita el tamaño del historial al máximo configurado
     *
     * @param query - Consulta de búsqueda a agregar
     */
    const addToHistory = useCallback((query: string) => {
        if (!enabled) return;

        const trimmedQuery = query.trim();

        // Validar que no esté vacío
        if (!trimmedQuery) return;

        setHistory(prevHistory => {
            // Filtrar duplicados (case insensitive)
            const filtered = prevHistory.filter(
                item => item.toLowerCase() !== trimmedQuery.toLowerCase()
            );

            // Agregar al inicio y limitar tamaño
            return [trimmedQuery, ...filtered].slice(0, maxItems);
        });
    }, [enabled, maxItems]);

    /**
     * Limpiar completamente el historial
     * Elimina todos los elementos del estado y localStorage
     */
    const clearHistory = useCallback(() => {
        if (!enabled) return;

        setHistory([]);
        try {
            localStorage.removeItem(storageKey);
        } catch (error) {
            console.error('Error clearing search history:', error);
        }
    }, [enabled, storageKey]);

    /**
     * Eliminar una búsqueda específica del historial
     *
     * @param query - Consulta a eliminar
     */
    const removeFromHistory = useCallback((query: string) => {
        if (!enabled) return;

        setHistory(prevHistory =>
            prevHistory.filter(item => item !== query)
        );
    }, [enabled]);

    /**
     * Verificar si una búsqueda está en el historial
     * Comparación case insensitive
     *
     * @param query - Consulta a verificar
     * @returns true si está en el historial
     */
    const isInHistory = useCallback((query: string): boolean => {
        if (!enabled) return false;

        const trimmedQuery = query.trim().toLowerCase();
        return history.some(item => item.toLowerCase() === trimmedQuery);
    }, [enabled, history]);

    // ============================================================================
    // RETORNO
    // ============================================================================

    return {
        history,
        addToHistory,
        clearHistory,
        removeFromHistory,
        isInHistory
    };
};
