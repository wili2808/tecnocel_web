/**
 * Componente ProductSearch - Campo de búsqueda de productos con autocompletado
 * Proporciona funcionalidad de búsqueda con sugerencias predictivas (marcas, categorías y productos),
 * navegación por teclado (flechas ↑↓), historial de búsquedas recientes e indicadores visuales.
 * Se integra con SearchContext (estado global) y ProductContext (sugerencias).
 */
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSearch } from '../../../contexts/SearchContext';
import { useSearchHistory } from '../../../hooks/useSearchHistory';
import { useProductActions } from '../../../hooks/useProductActions';
import styles from './ProductSearch.module.css';

// ============================================================================
// TIPOS E INTERFACES
// ============================================================================

interface Suggestion {
  text: string;
  type: 'producto' | 'marca' | 'categoria';
}

interface ProductSearchProps {
  /** Texto placeholder del campo de búsqueda */
  placeholder?: string;
  /** Si se debe mostrar el botón de limpiar búsqueda */
  showClearButton?: boolean;
  /** Clases CSS adicionales para personalización */
  className?: string;
  /** Callback ejecutado cuando se realiza una búsqueda */
  onSearch?: () => void;
  /** Si se debe mostrar el historial de búsquedas */
  showHistory?: boolean;
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

const ProductSearch: React.FC<ProductSearchProps> = ({
  placeholder = 'Buscar productos, marcas y mas ...',
  showClearButton = true,
  className = '',
  onSearch,
  showHistory = false,
}) => {
  const { searchQuery, setSearchQuery, clearSearch, isSearching, navigateToProducts } = useSearch();

  const location = useLocation();
  const navigate = useNavigate();
  const { history, addToHistory } = useSearchHistory({ enabled: showHistory });
  const { products, brands, categories, selectCategory, selectBrand, clearFilters, loadBrands, loadCategories } =
    useProductActions();

  const [showHistoryDropdown, setShowHistoryDropdown] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  /** Índice de la sugerencia resaltada con teclado (-1 = ninguna). */
  const [activeIndex, setActiveIndex] = useState(-1);

  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const historyListRef = useRef<HTMLUListElement>(null);
  /** Ref de foco: evita que el useEffect de sugerencias las reabra tras una selección. */
  const isFocusedRef = useRef(false);

  // ============================================================================
  // CARGA INICIAL DE DATOS
  // ============================================================================

  /**
   * Carga marcas y categorías si no están disponibles todavía.
   * Se ejecuta una sola vez al montar el componente (el contexto cachea las peticiones).
   */
  useEffect(() => {
    if (brands.length === 0) loadBrands();
    if (categories.length === 0) loadCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ============================================================================
  // SUGERENCIAS PREDICTIVAS
  // ============================================================================

  /**
   * Computa sugerencias a partir de los datos disponibles en el contexto.
   * Prioriza coincidencias que empiezan con el query antes que las que lo contienen.
   * Límites: 3 marcas, 2 categorías, 5 productos = máx 8 sugerencias totales.
   */
  const suggestions = useMemo((): Suggestion[] => {
    if (searchQuery.length < 2) return [];
    const q = searchQuery.toLowerCase().trim();
    const results: Suggestion[] = [];

    // Marcas (prioridad más alta)
    brands
      .filter((b) => b.nombre_marca.toLowerCase().includes(q))
      .sort((a, b) => {
        const aStarts = a.nombre_marca.toLowerCase().startsWith(q) ? 0 : 1;
        const bStarts = b.nombre_marca.toLowerCase().startsWith(q) ? 0 : 1;
        return aStarts - bStarts;
      })
      .slice(0, 3)
      .forEach((b) => results.push({ text: b.nombre_marca, type: 'marca' }));

    // Categorías
    categories
      .filter((c) => c.nombre_categoria.toLowerCase().includes(q))
      .sort((a, b) => {
        const aStarts = a.nombre_categoria.toLowerCase().startsWith(q) ? 0 : 1;
        const bStarts = b.nombre_categoria.toLowerCase().startsWith(q) ? 0 : 1;
        return aStarts - bStarts;
      })
      .slice(0, 2)
      .forEach((c) => results.push({ text: c.nombre_categoria, type: 'categoria' }));

    // Nombres de productos (deduplicados, starts-with primero)
    const seen = new Set<string>();
    const productNames: string[] = [];
    products.forEach((p) => {
      if (!seen.has(p.nombre) && p.nombre.toLowerCase().startsWith(q)) {
        seen.add(p.nombre);
        productNames.push(p.nombre);
      }
    });
    products.forEach((p) => {
      if (!seen.has(p.nombre) && p.nombre.toLowerCase().includes(q)) {
        seen.add(p.nombre);
        productNames.push(p.nombre);
      }
    });
    productNames.slice(0, 5).forEach((name) => results.push({ text: name, type: 'producto' }));

    return results.slice(0, 8);
  }, [searchQuery, products, brands, categories]);

  // ============================================================================
  // EFECTOS
  // ============================================================================

  /** Mostrar u ocultar el dropdown de sugerencias según el query, datos disponibles y foco actual.
   *  Solo se muestran si el input tiene el foco, evitando que se reabran tras una selección/navegación. */
  useEffect(() => {
    if (isFocusedRef.current && searchQuery.length >= 2 && suggestions.length > 0) {
      setShowSuggestions(true);
      setShowHistoryDropdown(false);
    } else {
      setShowSuggestions(false);
    }
  }, [searchQuery, suggestions.length]);

  /** Resetear el índice activo cada vez que cambia la lista de sugerencias */
  useEffect(() => {
    setActiveIndex(-1);
  }, [suggestions]);

  /** Resetear el índice activo cuando el dropdown de historial abre o cierra */
  useEffect(() => {
    setActiveIndex(-1);
  }, [showHistoryDropdown]);

  /** Hacer scroll automático al ítem resaltado (sugerencias o historial) */
  useEffect(() => {
    if (activeIndex >= 0) {
      if (dropdownRef.current) {
        const activeEl = dropdownRef.current.children[activeIndex] as HTMLElement;
        activeEl?.scrollIntoView({ block: 'nearest' });
      }
      if (historyListRef.current) {
        const activeEl = historyListRef.current.children[activeIndex] as HTMLElement;
        activeEl?.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [activeIndex]);

  /** Cerrar dropdowns al hacer clic fuera del componente */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowHistoryDropdown(false);
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ============================================================================
  // MANEJADORES DE EVENTOS
  // ============================================================================

  const handleClear = () => {
    clearSearch();
    if (location.pathname === '/productos') {
      navigate('/productos', { replace: true });
    }
    setShowHistoryDropdown(false);
    setShowSuggestions(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Navegación con flechas — dropdown de sugerencias
    if (showSuggestions && suggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : -1));
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex((prev) => {
          if (prev <= 0) return prev === 0 ? -1 : suggestions.length - 1;
          return prev - 1;
        });
        return;
      }
    }

    // Navegación con flechas — dropdown de historial
    if (showHistoryDropdown && history.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex((prev) => (prev < history.length - 1 ? prev + 1 : -1));
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex((prev) => {
          if (prev <= 0) return prev === 0 ? -1 : history.length - 1;
          return prev - 1;
        });
        return;
      }
    }

    if (e.key === 'Escape') {
      if (showSuggestions) {
        setShowSuggestions(false);
      } else if (showHistoryDropdown) {
        setShowHistoryDropdown(false);
      } else if (searchQuery) {
        handleClear();
      }
      return;
    }

    if (e.key === 'Enter') {
      // Si hay una sugerencia resaltada, seleccionarla
      if (showSuggestions && activeIndex >= 0 && suggestions[activeIndex]) {
        handleSuggestionSelect(suggestions[activeIndex]);
        return;
      }
      // Si hay un ítem de historial resaltado, seleccionarlo
      if (showHistoryDropdown && activeIndex >= 0 && history[activeIndex]) {
        handleHistorySelect(history[activeIndex]);
        return;
      }
      // Si no, buscar el texto escrito — limpiar filtros de categoria/marca activos
      if (searchQuery) {
        clearFilters();
        setSearchQuery(searchQuery, { immediate: true });
        if (showHistory) addToHistory(searchQuery);
        navigateToProducts();
        onSearch?.();
        setShowHistoryDropdown(false);
        setShowSuggestions(false);
      }
    }
  };

  const handleFocus = () => {
    isFocusedRef.current = true;
    if (showHistory && history.length > 0 && !searchQuery) {
      setShowHistoryDropdown(true);
    }
    if (searchQuery.length >= 2 && suggestions.length > 0) {
      setShowSuggestions(true);
    }
  };

  const handleBlur = () => {
    isFocusedRef.current = false;
  };

  const handleHistorySelect = (query: string) => {
    inputRef.current?.blur();
    setSearchQuery(query, { immediate: true });
    setShowHistoryDropdown(false);
    navigateToProducts(query);
    onSearch?.();
  };

  /**
   * Seleccionar una sugerencia.
   * - Categorías y marcas: navegan con filtro por ID (no búsqueda de texto).
   * - Productos: aplican búsqueda de texto normal.
   * Usa onMouseDown con preventDefault para evitar que el blur del input
   * cierre el dropdown antes de que se registre el click.
   */
  const handleSuggestionSelect = (suggestion: Suggestion) => {
    inputRef.current?.blur();
    setShowSuggestions(false);
    onSearch?.();

    if (suggestion.type === 'categoria') {
      const category = categories.find((c) => c.nombre_categoria.toLowerCase() === suggestion.text.toLowerCase());
      if (category) {
        clearSearch(); // Elimina el texto escrito del SearchContext
        clearFilters(); // Limpia filtros activos (marca, busqueda, etc.)
        selectCategory(category);
        navigate(`/productos?categoria=${category.id_categoria}`, {
          replace: location.pathname === '/productos',
        });
        return;
      }
    }

    if (suggestion.type === 'marca') {
      const brand = brands.find((b) => b.nombre_marca.toLowerCase() === suggestion.text.toLowerCase());
      if (brand) {
        clearSearch(); // Elimina el texto escrito del SearchContext
        clearFilters(); // Limpia filtros activos (categoria, busqueda, etc.)
        selectBrand(brand);
        navigate(`/productos?marca=${brand.id_marca}`, {
          replace: location.pathname === '/productos',
        });
        return;
      }
    }

    // Producto: texto libre — limpiar filtros de categoria/marca activos
    clearFilters();
    setSearchQuery(suggestion.text, { immediate: true });
    navigateToProducts(suggestion.text);
  };

  const getSuggestionIcon = (type: Suggestion['type']) => {
    if (type === 'marca') return 'store';
    if (type === 'categoria') return 'category';
    return 'search';
  };

  const getSuggestionIconClass = (type: Suggestion['type']) => {
    if (type === 'marca') return styles.iconMarca;
    if (type === 'categoria') return styles.iconCategoria;
    return '';
  };

  const getSuggestionTagClass = (type: Suggestion['type']) => {
    if (type === 'marca') return styles.tagMarca;
    if (type === 'categoria') return styles.tagCategoria;
    return '';
  };

  // ============================================================================
  // RENDERIZADO
  // ============================================================================

  return (
    <div className={`${styles.searchContainer} ${className}`} ref={containerRef}>
      <div className={styles.searchInputGroup}>
        <input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          className={`${styles.searchInput} ${isSearching ? styles.searching : ''}`}
          aria-label="Buscar productos, marcas y mas ..."
          aria-expanded={showSuggestions}
          aria-activedescendant={activeIndex >= 0 ? `suggestion-${activeIndex}` : undefined}
          autoComplete="off"
        />

        {/* Indicador de búsqueda activa (hourglass durante debounce) */}
        {searchQuery && isSearching && (
          <div className={styles.searchIndicator}>
            <span className={`material-icons ${styles.searchIcon}`}>hourglass_empty</span>
          </div>
        )}

        {/* Botón de limpiar */}
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

      {/* Dropdown de sugerencias predictivas */}
      {showSuggestions && suggestions.length > 0 && (
        <div className={styles.suggestionsDropdown} role="listbox" ref={dropdownRef}>
          {suggestions.map((suggestion, index) => (
            <div
              key={`${suggestion.type}-${index}`}
              id={`suggestion-${index}`}
              className={`${styles.suggestionItem} ${activeIndex === index ? styles.suggestionActive : ''}`}
              onMouseDown={(e) => {
                e.preventDefault();
                handleSuggestionSelect(suggestion);
              }}
              onMouseEnter={() => setActiveIndex(index)}
              role="option"
              aria-selected={activeIndex === index}
            >
              <span className={`material-icons ${styles.suggestionIcon} ${getSuggestionIconClass(suggestion.type)}`}>
                {getSuggestionIcon(suggestion.type)}
              </span>
              <span className={styles.suggestionText}>{suggestion.text}</span>
              {suggestion.type !== 'producto' && (
                <span className={`${styles.suggestionTag} ${getSuggestionTagClass(suggestion.type)}`}>
                  {suggestion.type === 'marca' ? 'Marca' : 'Categoría'}
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Dropdown de historial de búsquedas */}
      {showHistory && showHistoryDropdown && history.length > 0 && (
        <div className={styles.historyDropdown}>
          <div className={styles.historyHeader}>
            <span className="material-icons">history</span>
            <span>Búsquedas recientes</span>
          </div>
          <ul className={styles.historyList} ref={historyListRef}>
            {history.map((item, index) => (
              <li
                key={index}
                className={`${styles.historyItem} ${activeIndex === index ? styles.historyItemActive : ''}`}
                onClick={() => handleHistorySelect(item)}
                onMouseEnter={() => setActiveIndex(index)}
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
