/**
 * Componente ProductSearch - Campo de búsqueda de productos reutilizable
 * Proporciona funcionalidad de búsqueda con indicadores visuales y navegación
 * Incluye botón de limpiar, indicador de búsqueda activa, manejo de teclas e historial
 * Se integra con el SearchContext global para estado centralizado de búsqueda
 */
import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSearch } from '../../../contexts/SearchContext';
import { useSearchHistory } from '../../../hooks/useSearchHistory';
import styles from './ProductSearch.module.css';

// ============================================================================
// TIPOS E INTERFACES
// ============================================================================

/**
 * Props del componente ProductSearch
 * Define la configuración personalizable del campo de búsqueda
 */
interface ProductSearchProps {
    /** Texto placeholder del campo de búsqueda */
    placeholder?: string;
    /** Si se debe mostrar el botón de limpiar búsqueda */
    showClearButton?: boolean;
    /** Clases CSS adicionales para personalización */
    className?: string;
    /** Callback ejecutado cuando se realiza una búsqueda */
    onSearch?: () => void;
    /** Cantidad de resultados encontrados (opcional) */
    resultCount?: number;
    /** Si se debe mostrar el contador de resultados */
    showResultCount?: boolean;
    /** Si se debe mostrar el historial de búsquedas */
    showHistory?: boolean;
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

/**
 * Componente de búsqueda de productos con funcionalidad completa
 * Maneja la entrada del usuario, navegación y limpieza de búsqueda
 * Se integra con el SearchContext global para estado centralizado
 */
const ProductSearch: React.FC<ProductSearchProps> = ({
    placeholder = "Buscar productos, marcas y mas ...",
    showClearButton = true,
    className = '',
    onSearch,
    resultCount,
    showResultCount = false,
    showHistory = false
}) => {
    // ============================================================================
    // HOOKS Y CONTEXTOS
    // ============================================================================

    /**
     * Hook del contexto global de búsqueda
     * Proporciona estado de búsqueda, funciones de actualización y navegación
     */
    const {
        searchQuery,
        setSearchQuery,
        clearSearch,
        isSearching,
        navigateToProducts
    } = useSearch();

    /**
     * Hook de React Router para obtener la ubicación actual
     * Se usa para determinar si estamos en la página de productos
     */
    const location = useLocation();

    /**
     * Hook de React Router para navegación programática
     * Permite redirigir al usuario a diferentes páginas
     */
    const navigate = useNavigate();

    /**
     * Hook de historial de búsquedas
     * Proporciona funcionalidad para guardar y recuperar búsquedas recientes
     */
    const { history, addToHistory } = useSearchHistory({
        enabled: showHistory
    });

    // ============================================================================
    // ESTADO LOCAL
    // ============================================================================

    /**
     * Estado para controlar la visualización del dropdown de historial
     */
    const [showHistoryDropdown, setShowHistoryDropdown] = useState(false);

    /**
     * Referencia al contenedor del componente para detectar clics fuera
     */
    const containerRef = useRef<HTMLDivElement>(null);

    // ============================================================================
    // EFECTOS
    // ============================================================================

    /**
     * Detectar clics fuera del componente para cerrar el dropdown
     */
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setShowHistoryDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    /**
     * Cerrar historial cuando el usuario empieza a escribir
     */
    useEffect(() => {
        if (searchQuery && showHistoryDropdown) {
            setShowHistoryDropdown(false);
        }
    }, [searchQuery, showHistoryDropdown]);

    // ============================================================================
    // MANEJADORES DE EVENTOS
    // ============================================================================

    /**
     * Manejar la limpieza de la búsqueda
     * Limpia el estado global y actualiza la URL si es necesario
     */
    const handleClear = () => {
        // Limpiar la búsqueda en el contexto global
        clearSearch();

        // Si estamos en la página de productos, actualizar la URL
        if (location.pathname === '/productos') {
            navigate('/productos', { replace: true });
        }

        // Cerrar dropdown de historial
        setShowHistoryDropdown(false);
    };

    /**
     * Manejar eventos de teclado en el campo de búsqueda
     * Permite cerrar historial y limpiar con Escape, navegar con Enter
     *
     * @param e - Evento de teclado del input
     */
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        // Escape: primero cierra el historial, luego limpia la búsqueda
        if (e.key === 'Escape') {
            if (showHistoryDropdown) {
                // Si el historial está abierto, solo cerrarlo
                setShowHistoryDropdown(false);
            } else if (searchQuery) {
                // Si no hay historial abierto, limpiar búsqueda
                handleClear();
            }
        }

        // Redireccionar con Enter
        if (e.key === 'Enter' && searchQuery) {
            // Agregar al historial si está habilitado
            if (showHistory) {
                addToHistory(searchQuery);
            }
            // Usar la función del contexto global para navegación
            navigateToProducts();
            // Llamar al callback onSearch si existe
            onSearch?.();
            // Cerrar dropdown de historial
            setShowHistoryDropdown(false);
        }
    };

    /**
     * Manejar el foco en el input
     * Muestra el dropdown de historial si hay elementos
     */
    const handleFocus = () => {
        if (showHistory && history.length > 0 && !searchQuery) {
            setShowHistoryDropdown(true);
        }
    };

    /**
     * Manejar la selección de un elemento del historial
     * Aplica la búsqueda seleccionada
     *
     * @param query - Búsqueda seleccionada del historial
     */
    const handleHistorySelect = (query: string) => {
        setSearchQuery(query);
        setShowHistoryDropdown(false);
        navigateToProducts(query);
        onSearch?.();
    };

    // ============================================================================
    // RENDERIZADO PRINCIPAL
    // ============================================================================

    return (
        <div className={`${styles.searchContainer} ${className}`} ref={containerRef}>
            <div className={styles.searchInputGroup}>
                {/* Campo de entrada principal */}
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onFocus={handleFocus}
                    placeholder={placeholder}
                    className={`${styles.searchInput} ${isSearching ? styles.searching : ''}`}
                    aria-label="Buscar productos, marcas y mas ..."
                />

                {/* Indicador de búsqueda activa o contador de resultados */}
                {searchQuery && (
                    <div className={styles.searchIndicator}>
                        {isSearching ? (
                            // Mientras busca, mostrar hourglass
                            <span className={`material-icons ${styles.searchIcon}`}>
                                hourglass_empty
                            </span>
                        ) : showResultCount && resultCount !== undefined ? (
                            // Cuando termina de buscar, mostrar contador
                            <span className={styles.resultCountBadge}>
                                {resultCount}
                            </span>
                        ) : null}
                    </div>
                )}

                {/* Botón de limpiar búsqueda */}
                {showClearButton && searchQuery && (
                    <button
                        type="button"
                        onClick={handleClear}
                        className={styles.clearButton}
                        aria-label="Limpiar búsqueda"
                        title="Limpiar búsqueda (Esc)"
                    >
                        <span className="material-icons">clear</span>
                    </button>
                )}
            </div>

            {/* Dropdown de historial de búsquedas */}
            {showHistory && showHistoryDropdown && history.length > 0 && (
                <div className={styles.historyDropdown}>
                    <div className={styles.historyHeader}>
                        <span className="material-icons">history</span>
                        <span>Búsquedas recientes</span>
                    </div>
                    <ul className={styles.historyList}>
                        {history.map((item, index) => (
                            <li
                                key={index}
                                className={styles.historyItem}
                                onClick={() => handleHistorySelect(item)}
                            >
                                <span className="material-icons">search</span>
                                <span className={styles.historyText}>{item}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default ProductSearch; 