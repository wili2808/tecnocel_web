/**
 * Componente QuickSearch - Búsquedas rápidas predefinidas
 * Muestra botones de búsqueda rápida con contadores de productos por categoría
 * Incluye funcionalidades para selección de búsqueda y visualización de conteos
 * Utiliza QUICK_SEARCHES para opciones de búsqueda predefinidas del sistema
 */
import React from 'react';
import styles from './QuickSearch.module.css';
import { QUICK_SEARCHES } from '../../../utils/quickSearches';

interface QuickSearchProps {
    // Búsqueda rápida seleccionada
    selectedQuickSearch: string | null;
    onQuickSearchChange: (searchKey: string | null) => void;

    // Contadores de productos por búsqueda rápida (opcional)
    quickSearchCounts?: Record<string, number>;
}

const QuickSearch: React.FC<QuickSearchProps> = ({
    selectedQuickSearch,
    onQuickSearchChange,
    quickSearchCounts = {}
}) => {
    // ============================================================================
    // RENDERIZADO
    // ============================================================================

    return (
        <div className={styles.quickSearch}>
            <div className={styles.quickSearchButtons}>
                {/* Botón para mostrar todos los productos */}
                <button
                    type="button"
                    className={`${styles.searchButton} ${selectedQuickSearch === null ? styles.searchButtonActive : ''}`}
                    onClick={() => onQuickSearchChange(null)}
                >
                    <span className={styles.searchButtonText}>Todas</span>
                </button>

                {/* Botones de búsquedas rápidas predefinidas */}
                {QUICK_SEARCHES.map(quickSearch => {
                    const count = quickSearchCounts[quickSearch.key] || 0;
                    const isActive = selectedQuickSearch === quickSearch.key;

                    return (
                        <button
                            key={quickSearch.key}
                            type="button"
                            className={`${styles.searchButton} ${isActive ? styles.searchButtonActive : ''} ${count === 0 ? styles.searchButtonDisabled : ''}`}
                            onClick={() => onQuickSearchChange(quickSearch.key)}
                            disabled={count === 0}
                            title={`Buscar: ${quickSearch.label} (${count} productos)`}
                        >
                            <span className={styles.searchButtonText}>{quickSearch.label}</span>
                            {/* Mostrar contador solo si hay productos disponibles */}
                            {count > 0 && <span className={styles.searchCount}>({count})</span>}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

QuickSearch.displayName = 'QuickSearch';

export default QuickSearch; 