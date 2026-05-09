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
  placeholder = 'Buscar productos, marcas y más...',
  showClearButton = true,
  className = '',
  onSearch,
  showHistory = true,
}) => {
  const { searchQuery, setSearchQuery, clearSearch, isSearching, navigateToProducts } = useSearch();

  const location = useLocation();
  const navigate = useNavigate();
  const { history, addToHistory, clearHistory } = useSearchHistory({ enabled: showHistory });
  const { 
    products, 
    brands, 
    categories, 
    selectCategory, 
    selectBrand, 
    clearFilters, 
    loadBrands, 
    loadCategories,
    loadProducts 
  } = useProductActions();

  const [showDropdown, setShowDropdown] = useState(false);
  /** Índice de la sugerencia resaltada con teclado (-1 = ninguna). */
  const [activeIndex, setActiveIndex] = useState(-1);

  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  /** Ref de foco: evita que el useEffect de sugerencias las reabra tras una selección. */
  const isFocusedRef = useRef(false);

  // ============================================================================
  // CARGA INICIAL DE DATOS
  // ============================================================================

  useEffect(() => {
    if (brands.length === 0) loadBrands();
    if (categories.length === 0) loadCategories();
    if (products.length === 0) loadProducts();
  }, []);

  // ============================================================================
  // ATAJOS DE TECLADO (PROFESIONALIZACIÓN)
  // ============================================================================

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Ctrl+K o '/' para enfocar el buscador (si no se está escribiendo en otro input)
      if ((e.ctrlKey && e.key === 'k') || (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA')) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  // ============================================================================
  // SUGERENCIAS PREDICTIVAS
  // ============================================================================

  /**
   * Computa sugerencias a partir de los datos disponibles en el contexto.
   */
  const suggestions = useMemo((): Suggestion[] => {
    if (searchQuery.length < 2) return [];
    const q = searchQuery.toLowerCase().trim();
    const results: Suggestion[] = [];

    // Marcas
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

    // Nombres de productos
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

  // Categorías recomendadas para cuando el buscador está vacío
  const recommendedCategories = useMemo(() => {
    return categories.slice(0, 4);
  }, [categories]);

  // ============================================================================
  // EFECTOS
  // ============================================================================

  useEffect(() => {
    if (isFocusedRef.current) {
      setShowDropdown(true);
    } else {
      setShowDropdown(false);
    }
  }, [searchQuery, suggestions.length, history.length]);

  useEffect(() => {
    setActiveIndex(-1);
  }, [showDropdown, suggestions, history]);

  useEffect(() => {
    if (activeIndex >= 0 && dropdownRef.current) {
      const activeEl = dropdownRef.current.children[activeIndex] as HTMLElement;
      activeEl?.scrollIntoView({ block: 'nearest' });
    }
  }, [activeIndex]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
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
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const totalItems = searchQuery.length >= 2 ? suggestions.length : history.length;

    if (showDropdown && totalItems > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex((prev) => (prev < totalItems - 1 ? prev + 1 : -1));
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex((prev) => {
          if (prev <= 0) return prev === 0 ? -1 : totalItems - 1;
          return prev - 1;
        });
        return;
      }
    }

    if (e.key === 'Escape') {
      if (showDropdown) {
        setShowDropdown(false);
      } else if (searchQuery) {
        handleClear();
      }
      inputRef.current?.blur();
      return;
    }

    if (e.key === 'Enter') {
      // Si hay una sugerencia resaltada
      if (showDropdown && activeIndex >= 0) {
        if (searchQuery.length >= 2 && suggestions[activeIndex]) {
          handleSuggestionSelect(suggestions[activeIndex]);
          return;
        } else if (history[activeIndex]) {
          handleHistorySelect(history[activeIndex]);
          return;
        }
      }

      // Búsqueda normal
      if (searchQuery.trim()) {
        const query = searchQuery.trim();
        clearFilters();
        setSearchQuery(query, { immediate: true });
        if (showHistory) addToHistory(query);
        navigateToProducts(query);
        onSearch?.();
        setShowDropdown(false);
        inputRef.current?.blur();
      }
    }
  };

  const handleFocus = () => {
    isFocusedRef.current = true;
    setShowDropdown(true);
  };

  const handleBlur = () => {
    isFocusedRef.current = false;
    // Delay pequeño para permitir clics en el dropdown
    setTimeout(() => {
      if (!isFocusedRef.current) setShowDropdown(false);
    }, 200);
  };

  const handleHistorySelect = (query: string) => {
    setSearchQuery(query, { immediate: true });
    setShowDropdown(false);
    navigateToProducts(query);
    onSearch?.();
  };

  const handleSuggestionSelect = (suggestion: Suggestion) => {
    setShowDropdown(false);
    onSearch?.();

    if (suggestion.type === 'categoria') {
      const category = categories.find((c) => c.nombre_categoria.toLowerCase() === suggestion.text.toLowerCase());
      if (category) {
        clearSearch();
        clearFilters();
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
        clearSearch();
        clearFilters();
        selectBrand(brand);
        navigate(`/productos?marca=${brand.id_marca}`, {
          replace: location.pathname === '/productos',
        });
        return;
      }
    }

    clearFilters();
    setSearchQuery(suggestion.text, { immediate: true });
    if (showHistory) addToHistory(suggestion.text);
    navigateToProducts(suggestion.text);
  };

  const getSuggestionIcon = (type: Suggestion['type']) => {
    if (type === 'marca') return 'store';
    if (type === 'categoria') return 'category';
    return 'search';
  };

  return (
    <div className={`${styles.searchContainer} ${className}`} ref={containerRef}>
      <div className={styles.searchInputGroup}>
        <div className={styles.searchIconLeading}>
          <span className="material-icons">search</span>
        </div>
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
          aria-label="Buscador de productos"
          autoComplete="off"
        />

        {/* Indicador de shortcut (Solo desktop) */}
        {!searchQuery && !isSearching && (
          <div className={styles.shortcutIndicator}>
            <kbd>/</kbd>
          </div>
        )}

        {/* Indicador de carga */}
        {searchQuery && isSearching && (
          <div className={styles.loaderContainer}>
            <div className={styles.loader}></div>
          </div>
        )}

        {/* Botón de limpiar */}
        {showClearButton && searchQuery && (
          <button
            type="button"
            onClick={handleClear}
            className={styles.clearButton}
            title="Limpiar búsqueda (Esc)"
          >
            <span className="material-icons">close</span>
          </button>
        )}
      </div>

      {/* DROPDOWN UNIFICADO Y PROFESIONAL */}
      {showDropdown && (
        <div className={styles.resultsDropdown} ref={dropdownRef}>
          {/* Caso 1: Sugerencias Predictivas */}
          {searchQuery.length >= 2 && suggestions.length > 0 ? (
            <div className={styles.dropdownSection}>
              <div className={styles.sectionTitle}>Sugerencias</div>
              {suggestions.map((suggestion, index) => (
                <div
                  key={`${suggestion.type}-${index}`}
                  className={`${styles.resultItem} ${activeIndex === index ? styles.itemActive : ''}`}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleSuggestionSelect(suggestion);
                  }}
                  onMouseEnter={() => setActiveIndex(index)}
                >
                  <span className={`${styles.itemIcon} ${styles[suggestion.type]}`}>
                    <span className="material-icons">{getSuggestionIcon(suggestion.type)}</span>
                  </span>
                  <span className={styles.itemText}>{suggestion.text}</span>
                  <span className={styles.itemTag}>{suggestion.type}</span>
                </div>
              ))}
            </div>
          ) : searchQuery.length >= 2 && !isSearching ? (
             <div className={styles.noResults}>
                <span className="material-icons">search_off</span>
                <p>No hay sugerencias para "{searchQuery}"</p>
             </div>
          ) : null}

          {/* Caso 2: Historial y Recomendaciones (cuando el query es corto o vacío) */}
          {searchQuery.length < 2 && (
            <>
              {history.length > 0 && (
                <div className={styles.dropdownSection}>
                  <div className={styles.sectionHeader}>
                    <span className={styles.sectionTitle}>Búsquedas recientes</span>
                    <button className={styles.clearHistoryBtn} onMouseDown={(e) => { e.preventDefault(); clearHistory(); }}>
                      Limpiar
                    </button>
                  </div>
                  {history.map((item, index) => (
                    <div
                      key={`history-${index}`}
                      className={`${styles.resultItem} ${activeIndex === index ? styles.itemActive : ''}`}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleHistorySelect(item);
                      }}
                      onMouseEnter={() => setActiveIndex(index)}
                    >
                      <span className={styles.itemIcon}>
                        <span className="material-icons">history</span>
                      </span>
                      <span className={styles.itemText}>{item}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className={styles.dropdownSection}>
                <div className={styles.sectionTitle}>Categorías populares</div>
                <div className={styles.tagsContainer}>
                  {recommendedCategories.map((cat) => (
                    <button
                      key={cat.id_categoria}
                      className={styles.tagItem}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleSuggestionSelect({ text: cat.nombre_categoria, type: 'categoria' });
                      }}
                    >
                      {cat.nombre_categoria}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default ProductSearch;
