/**
 * Contexto de Productos - Gestión centralizada del estado de productos del sistema
 * Proporciona funcionalidades para cargar, filtrar, buscar y gestionar productos
 * Incluye sistema de caché inteligente, sincronización con ofertas y paginación
 * Utiliza useReducer para gestión eficiente del estado y optimizaciones de performance
 */
import React, { createContext, useContext, useReducer, useEffect, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import type { Product, Category, Marca, ProductFilters } from '../types';
import productService from '../services/productService';
import { useOfertasGlobal } from './OfertasGlobalContext';

// ============================================================================
// INTERFACES Y TIPOS
// ============================================================================

/**
 * Estructura de datos del caché de productos
 * Define la información almacenada en caché para optimizar performance
 */
interface CacheData {
  products: Product[];
  categories: Category[];
  brands: Marca[];
  featuredProducts: Product[];
  timestamp: number;
  filters: ProductFilters;
  searchQuery: string;
}
// ============================================================================
// ESTADO DEL CONTEXTO
// ============================================================================

/**
 * Estado del contexto de productos
 * Define toda la estructura de datos manejada por el contexto
 */
interface ProductContextState {
  // PRODUCTOS
  products: Product[];
  featuredProducts: Product[];
  currentProduct: Product | null;
  productsLoading: boolean;
  productsError: string | null;

  // CATEGORÍAS
  categories: Category[];
  selectedCategory: Category | null;
  categoriesLoading: boolean;
  categoriesError: string | null;

  // MARCAS
  brands: Marca[];
  selectedBrand: Marca | null;
  brandsLoading: boolean;
  brandsError: string | null;

  // FILTROS Y BÚSQUEDA
  filters: ProductFilters;
  searchQuery: string;
  filteredProducts: Product[];

  // PAGINACIÓN
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };

  // CACHÉ
  cache: Map<string, { data: any; timestamp: number }>;
  imageCache: Map<string, { url: string; timestamp: number }>;
}

/**
 * Acciones del contexto
 * Define todas las operaciones posibles para modificar el estado
 */
type ProductAction =
  // PRODUCTOS
  | { type: 'SET_PRODUCTS'; payload: Product[] }
  | { type: 'SET_FEATURED_PRODUCTS'; payload: Product[] }
  | { type: 'SET_CURRENT_PRODUCT'; payload: Product | null }
  | { type: 'SET_PRODUCTS_LOADING'; payload: boolean }
  | { type: 'SET_PRODUCTS_ERROR'; payload: string | null }
  | { type: 'ADD_PRODUCTS'; payload: Product[] }

  // CATEGORÍAS
  | { type: 'SET_CATEGORIES'; payload: Category[] }
  | { type: 'SET_SELECTED_CATEGORY'; payload: Category | null }
  | { type: 'SET_CATEGORIES_LOADING'; payload: boolean }
  | { type: 'SET_CATEGORIES_ERROR'; payload: string | null }

  // MARCAS
  | { type: 'SET_BRANDS'; payload: Marca[] }
  | { type: 'SET_SELECTED_BRAND'; payload: Marca | null }
  | { type: 'SET_BRANDS_LOADING'; payload: boolean }
  | { type: 'SET_BRANDS_ERROR'; payload: string | null }

  // FILTROS Y BÚSQUEDA
  | { type: 'UPDATE_FILTERS'; payload: Partial<ProductFilters> }
  | { type: 'SET_SEARCH_QUERY'; payload: string }
  | { type: 'RESET_FILTERS' }
  | { type: 'SET_FILTERED_PRODUCTS'; payload: Product[] }

  // PAGINACIÓN
  | { type: 'UPDATE_PAGINATION'; payload: { page: number; limit: number } }
  | { type: 'SET_TOTAL_COUNT'; payload: number }
  | { type: 'SET_HAS_MORE'; payload: boolean }

  // CACHÉ
  | { type: 'SET_CACHE'; payload: { key: string; data: any; timestamp: number } }
  | { type: 'CLEAR_CACHE'; payload?: string }
  | { type: 'SET_IMAGE_CACHE'; payload: Map<string, { url: string; timestamp: number }> };

/**
 * Interfaz del contexto
 * Define la API pública del contexto para componentes consumidores
 */
interface ProductContextType {
  // ESTADO
  state: ProductContextState;

  // ACCIONES DE PRODUCTOS
  fetchProducts: (filters?: ProductFilters, page?: number) => Promise<void>;
  fetchProduct: (id: number, signal?: AbortSignal) => Promise<void>;
  fetchFeaturedProducts: (limit?: number) => Promise<void>;

  // ACCIONES DE CATEGORÍAS
  fetchCategories: () => Promise<void>;
  selectCategory: (category: Category | null) => void;

  // ACCIONES DE MARCAS
  fetchBrands: () => Promise<void>;
  selectBrand: (brand: Marca | null) => void;

  // ACCIONES DE FILTROS Y BÚSQUEDA
  updateFilters: (filters: Partial<ProductFilters>) => void;
  updateSearchQuery: (query: string) => void;
  resetFilters: () => void;
  applyFilters: () => void;

  // ACCIONES DE PAGINACIÓN
  updatePagination: (page: number, limit: number) => void;
  loadMore: () => Promise<void>;

  // ACCIONES DE CACHÉ
  getCachedData: (key: string) => any | null;
  setCachedData: (key: string, data: any) => void;
  clearCache: (key?: string) => void;

  // FUNCIONES DE CACHÉ INTELIGENTE
  loadImageWithCache: (imageUrl: string) => Promise<string>;
  clearImageCache: () => void;
  hasFreshData: (dataType: keyof CacheData) => boolean;
  restoreFromCache: () => boolean;
  clearProductState: (force?: boolean) => void;
  forceClearProductState: () => void;
}

// ============================================================================
// ESTADO INICIAL
// ============================================================================

/**
 * Estado inicial del contexto
 * Define valores por defecto para todos los campos del estado
 */
const initialState: ProductContextState = {
  // PRODUCTOS
  products: [],
  featuredProducts: [],
  currentProduct: null,
  productsLoading: false,
  productsError: null,

  // CATEGORÍAS
  categories: [],
  selectedCategory: null,
  categoriesLoading: false,
  categoriesError: null,

  // MARCAS
  brands: [],
  selectedBrand: null,
  brandsLoading: false,
  brandsError: null,

  // FILTROS Y BÚSQUEDA
  filters: {},
  searchQuery: '',
  filteredProducts: [],

  // PAGINACIÓN
  pagination: {
    page: 1,
    limit: 12,
    total: 0,
    hasMore: true,
  },

  // CACHÉ
  cache: new Map(),
  imageCache: new Map(),
};

// ============================================================================
// REDUCER
// ============================================================================

/**
 * Reducer que maneja las acciones del contexto de productos
 * Implementa lógica inmutable para todas las operaciones del estado
 * Mantiene consistencia en la estructura de datos y cálculos automáticos
 */
function productReducer(state: ProductContextState, action: ProductAction): ProductContextState {
  switch (action.type) {
    // PRODUCTOS
    case 'SET_PRODUCTS':
      return { ...state, products: action.payload };

    case 'SET_FEATURED_PRODUCTS':
      return { ...state, featuredProducts: action.payload };

    case 'SET_CURRENT_PRODUCT':
      return { ...state, currentProduct: action.payload };

    case 'SET_PRODUCTS_LOADING':
      return { ...state, productsLoading: action.payload };

    case 'SET_PRODUCTS_ERROR':
      return { ...state, productsError: action.payload };

    case 'ADD_PRODUCTS':
      return { ...state, products: [...state.products, ...action.payload] };

    // CATEGORÍAS
    case 'SET_CATEGORIES':
      return { ...state, categories: action.payload };

    case 'SET_SELECTED_CATEGORY':
      return { ...state, selectedCategory: action.payload };

    case 'SET_CATEGORIES_LOADING':
      return { ...state, categoriesLoading: action.payload };

    case 'SET_CATEGORIES_ERROR':
      return { ...state, categoriesError: action.payload };

    // MARCAS
    case 'SET_BRANDS':
      return { ...state, brands: action.payload };

    case 'SET_SELECTED_BRAND':
      return { ...state, selectedBrand: action.payload };

    case 'SET_BRANDS_LOADING':
      return { ...state, brandsLoading: action.payload };

    case 'SET_BRANDS_ERROR':
      return { ...state, brandsError: action.payload };

    // FILTROS Y BÚSQUEDA
    case 'UPDATE_FILTERS':
      return {
        ...state,
        filters: { ...state.filters, ...action.payload },
        // ✅ Sincronizar searchQuery cuando se actualiza filters.busqueda
        searchQuery: action.payload.busqueda !== undefined ? action.payload.busqueda : state.searchQuery,
        pagination: { ...state.pagination, page: 1 }
      };

    case 'SET_SEARCH_QUERY':
      return {
        ...state,
        searchQuery: action.payload,
        pagination: { ...state.pagination, page: 1 }
      };

    case 'RESET_FILTERS':
      return {
        ...state,
        filters: {},
        searchQuery: '',
        pagination: { ...state.pagination, page: 1 }
      };

    case 'SET_FILTERED_PRODUCTS':
      return { ...state, filteredProducts: action.payload };

    // PAGINACIÓN
    case 'UPDATE_PAGINATION':
      return {
        ...state,
        pagination: { ...state.pagination, ...action.payload }
      };

    case 'SET_TOTAL_COUNT':
      return {
        ...state,
        pagination: { ...state.pagination, total: action.payload }
      };

    case 'SET_HAS_MORE':
      return {
        ...state,
        pagination: { ...state.pagination, hasMore: action.payload }
      };

    // CACHÉ
    case 'SET_CACHE': {
      const newCache = new Map(state.cache);
      newCache.set(action.payload.key, {
        data: action.payload.data,
        timestamp: action.payload.timestamp,
      });
      return { ...state, cache: newCache };
    }

    case 'CLEAR_CACHE': {
      const newCache = new Map(state.cache);
      if (action.payload) {
        newCache.delete(action.payload);
      } else {
        newCache.clear();
      }
      return { ...state, cache: newCache };
    }

    case 'SET_IMAGE_CACHE': {
      return { ...state, imageCache: action.payload };
    }

    default:
      return state;
  }
}

// ============================================================================
// CONTEXTO
// ============================================================================

// Creación del contexto de productos
const ProductContext = createContext<ProductContextType | undefined>(undefined);

// ============================================================================
// PROVIDER
// ============================================================================

interface ProductProviderProps {
  children: ReactNode;
}

/**
 * Proveedor del contexto de productos
 * Maneja toda la lógica de estado, caché y sincronización con ofertas
 * Incluye optimizaciones para evitar re-renders innecesarios
 */
export const ProductProvider: React.FC<ProductProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(productReducer, initialState);

  // ============================================================================
  // SINCRONIZACIÓN CON CONTEXTO DE OFERTAS
  // ============================================================================

  const ofertasContext = useOfertasGlobal();

  // ============================================================================
  // CONSTANTES CONSOLIDADAS
  // ============================================================================

  // Configuración de cache desde variables de entorno
  const CACHE_EXPIRY_TIME = parseInt(import.meta.env.VITE_PRODUCTS_CACHE_DURATION || '180000'); // 3 minutos por defecto
  const IMAGE_CACHE_EXPIRY = parseInt(import.meta.env.VITE_IMAGES_CACHE_DURATION || '1800000'); // 30 minutos por defecto
  const PRODUCT_CACHE_KEY = import.meta.env.VITE_PRODUCT_CACHE_KEY || 'tecnocel_product_cache';
  const IMAGE_CACHE_KEY = import.meta.env.VITE_IMAGE_CACHE_KEY || 'tecnocel_image_cache';

  // ============================================================================
  // FUNCIONES UTILITARIAS CONSOLIDADAS
  // ============================================================================

  /**
   * Verificar si el caché está fresco
   * Compara timestamp actual con tiempo de expiración configurado
   */
  const isCacheFresh = useCallback((timestamp: number, expiryTime: number): boolean => {
    return Date.now() - timestamp < expiryTime;
  }, []);

  /**
   * Función unificada para sincronizar productos con ofertas
   * Aplica información de ofertas a productos del catálogo
   */
  const syncProductsWithOffers = useCallback((products: Product[]) => {
    if (!ofertasContext?.productosEnOferta?.length) {
      return products;
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('🔄 Sincronizando productos con ofertas:', {
        totalProductos: products.length,
        totalOfertas: ofertasContext.productosEnOferta.length
      });
    }

    const ofertasMap = new Map(
      ofertasContext.productosEnOferta.map(oferta => [oferta.id_producto, oferta])
    );

    return products.map(product => {
      const productoEnOferta = ofertasMap.get(product.id_producto);

      if (productoEnOferta) {
        return {
          ...product,
          en_oferta: productoEnOferta.en_oferta,
          precio_oferta: productoEnOferta.precio_oferta,
          precio_original: Number(productoEnOferta.precio_original || product.precio_venta)
        };
      }

      return product;
    });
  }, [ofertasContext]);

  // ============================================================================
  // SISTEMA DE CACHÉ UNIFICADO
  // ============================================================================

  /**
   * Cargar datos del caché desde localStorage
   * Verifica expiración y maneja errores de parsing
   */
  const loadFromCache = useCallback((): CacheData | null => {
    try {
      const cached = localStorage.getItem(PRODUCT_CACHE_KEY);
      if (!cached) return null;

      const cacheData: CacheData = JSON.parse(cached);

      if (!isCacheFresh(cacheData.timestamp, CACHE_EXPIRY_TIME)) {
        localStorage.removeItem(PRODUCT_CACHE_KEY);
        return null;
      }

      return cacheData;
    } catch (error) {
      console.warn('Error al cargar caché:', error);
      localStorage.removeItem(PRODUCT_CACHE_KEY);
      return null;
    }
  }, [isCacheFresh]);

  /**
   * Guardar datos en caché en localStorage
   * Preserva datos existentes y actualiza timestamp
   */
  const saveToCache = useCallback((data: Partial<CacheData>) => {
    try {
      const existingCache = loadFromCache() || {
        products: [],
        categories: [],
        brands: [],
        featuredProducts: [],
        filters: {},
        searchQuery: '',
        timestamp: Date.now()
      };

      const updatedCache: CacheData = {
        ...existingCache,
        ...data,
        timestamp: Date.now()
      };

      localStorage.setItem(PRODUCT_CACHE_KEY, JSON.stringify(updatedCache));
    } catch (error) {
      console.warn('Error al guardar caché:', error);
    }
  }, [loadFromCache]);

  /**
   * Verificar si los datos están en caché y son frescos
   * Valida existencia y expiración de datos específicos
   */
  const hasFreshData = useCallback((dataType: keyof CacheData): boolean => {
    const cache = loadFromCache();
    if (!cache) return false;

    const data = cache[dataType];
    if (!data || !Array.isArray(data) || data.length === 0) return false;

    return isCacheFresh(cache.timestamp, CACHE_EXPIRY_TIME);
  }, [loadFromCache, isCacheFresh]);

  /**
   * Cargar datos del caché al estado
   * Restaura todos los datos almacenados en caché
   */
  const restoreFromCache = useCallback(() => {
    const cache = loadFromCache();
    if (!cache) return false;

    dispatch({ type: 'SET_PRODUCTS', payload: cache.products });
    dispatch({ type: 'SET_CATEGORIES', payload: cache.categories });
    dispatch({ type: 'SET_BRANDS', payload: cache.brands });
    dispatch({ type: 'SET_FEATURED_PRODUCTS', payload: cache.featuredProducts });
    dispatch({ type: 'UPDATE_FILTERS', payload: cache.filters });
    dispatch({ type: 'SET_SEARCH_QUERY', payload: cache.searchQuery });
    dispatch({ type: 'SET_FILTERED_PRODUCTS', payload: cache.products });

    return true;
  }, [loadFromCache]);

  // ============================================================================
  // FUNCIONES DE CACHÉ DE MEMORIA
  // ============================================================================

  /**
   * Obtener datos del caché en memoria
   * Verifica expiración y limpia entradas obsoletas
   */
  const getCachedData = useCallback((key: string): any | null => {
    const entry = state.cache.get(key);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > CACHE_EXPIRY_TIME) {
      dispatch({ type: 'CLEAR_CACHE', payload: key });
      return null;
    }

    return entry.data;
  }, [state.cache, CACHE_EXPIRY_TIME]);

  /**
   * Establecer datos en caché de memoria
   * Almacena datos con timestamp para control de expiración
   */
  const setCachedData = useCallback((key: string, data: any) => {
    dispatch({
      type: 'SET_CACHE',
      payload: { key, data, timestamp: Date.now() }
    });
  }, []);

  /**
   * Limpiar caché de memoria
   * Permite limpieza selectiva o completa del caché
   */
  const clearCache = useCallback((key?: string) => {
    dispatch({ type: 'CLEAR_CACHE', payload: key });
  }, []);

  // ============================================================================
  // SISTEMA DE CACHÉ DE IMÁGENES OPTIMIZADO
  // ============================================================================

  /**
   * Cargar imagen con sistema de caché optimizado
   * Usa caché en memoria + aprovecha caché HTTP del navegador (backend sirve con Cache-Control 24h)
   * NOTA: Se eliminó el cache de blob URLs en localStorage porque no persisten entre sesiones
   */
  const loadImageWithCache = useCallback(async (imageUrl: string): Promise<string> => {
    try {
      // Verificar caché en memoria primero
      if (state.imageCache.has(imageUrl)) {
        const cachedData = state.imageCache.get(imageUrl)!;
        if (isCacheFresh(cachedData.timestamp, IMAGE_CACHE_EXPIRY)) {
          return cachedData.url;
        } else {
          // Limpiar entrada expirada
          const newCache = new Map(state.imageCache);
          newCache.delete(imageUrl);
          dispatch({ type: 'SET_IMAGE_CACHE', payload: newCache });
        }
      }

      // Descargar imagen (el navegador usará su caché HTTP si está disponible)
      // El backend sirve imágenes con Cache-Control: max-age=86400 (24 horas)
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);

      // Guardar SOLO en cache de memoria (no localStorage)
      const newImageCache = new Map(state.imageCache);
      newImageCache.set(imageUrl, {
        url: objectUrl,
        timestamp: Date.now()
      });
      dispatch({ type: 'SET_IMAGE_CACHE', payload: newImageCache });

      return objectUrl;
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('Error al cargar imagen con caché:', error);
      }
      return imageUrl; // Fallback a URL original
    }
  }, [state.imageCache, isCacheFresh, IMAGE_CACHE_EXPIRY]);

  /**
   * Limpiar caché de imágenes en memoria
   * Revoca URLs de objetos blob para liberar memoria del navegador
   */
  const clearImageCache = useCallback(() => {
    try {
      // Revocar todas las blob URLs en memoria para liberar recursos
      state.imageCache.forEach((imageData) => {
        if (imageData.url.startsWith('blob:')) {
          URL.revokeObjectURL(imageData.url);
        }
      });

      // Limpiar el cache en memoria
      dispatch({ type: 'SET_IMAGE_CACHE', payload: new Map() });

      // Limpiar cualquier cache legacy de localStorage (migración)
      if (localStorage.getItem(IMAGE_CACHE_KEY)) {
        localStorage.removeItem(IMAGE_CACHE_KEY);
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('Error al limpiar caché de imágenes:', error);
      }
    }
  }, [state.imageCache]);

  // ============================================================================
  // FUNCIÓN UNIFICADA DE LIMPIEZA
  // ============================================================================

  /**
   * Limpiar estado de productos de forma controlada
   * Permite limpieza selectiva o completa según parámetros
   */
  const clearProductState = useCallback((force: boolean = false) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(force ? '🚨 LIMPIEZA FORZADA' : '🧹 Limpieza completa', 'del estado del producto');
    }

    // Limpiar estados relacionados con productos
    dispatch({ type: 'SET_CURRENT_PRODUCT', payload: null });
    dispatch({ type: 'SET_PRODUCTS_LOADING', payload: false });
    dispatch({ type: 'SET_PRODUCTS_ERROR', payload: null });
    dispatch({ type: 'SET_FILTERED_PRODUCTS', payload: [] });

    // Limpiar cache de productos
    clearCache();

    // Si es limpieza forzada, también limpiar cache de imágenes
    if (force) {
      clearImageCache();
    }
  }, [clearCache, clearImageCache]);

  /**
   * ✅ FUNCIÓN COMPATIBILIDAD: Limpieza forzada para navegación
   * Permite limpieza completa del estado incluyendo caché de imágenes
   */
  const forceClearProductState = useCallback(() => {
    clearProductState(true);
  }, [clearProductState]);

  // ============================================================================
  // FUNCIONES PRINCIPALES OPTIMIZADAS
  // ============================================================================

  /**
   * Cargar productos con caché inteligente
   * Verifica caché antes de hacer llamadas a la API
   */
  const fetchProducts = useCallback(async (filters?: ProductFilters, page?: number) => {
    // Verificar caché si no hay filtros
    if (hasFreshData('products') && !filters) {
      if (process.env.NODE_ENV === 'development') {
        console.log('🚀 Usando productos del caché (frescos)');
      }
      restoreFromCache();
      return;
    }

    try {
      dispatch({ type: 'SET_PRODUCTS_LOADING', payload: true });
      dispatch({ type: 'SET_PRODUCTS_ERROR', payload: null });

      const products = await productService.getProducts({ page, limit: state.pagination.limit, filters });
      const productsWithOffers = syncProductsWithOffers(products);

      // Guardar en caché solo si no hay filtros
      if (!filters) {
        saveToCache({ products: productsWithOffers });
      }

      dispatch({ type: 'SET_PRODUCTS', payload: productsWithOffers });
      dispatch({ type: 'SET_FILTERED_PRODUCTS', payload: productsWithOffers });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al cargar productos';
      dispatch({ type: 'SET_PRODUCTS_ERROR', payload: errorMessage });
    } finally {
      dispatch({ type: 'SET_PRODUCTS_LOADING', payload: false });
    }
  }, [state.pagination.limit, syncProductsWithOffers, hasFreshData, restoreFromCache, saveToCache]);

  /**
   * Cargar un producto específico por ID
   * Incluye limpieza del estado y sincronización con ofertas
   * @param id - ID del producto a cargar
   * @param signal - AbortSignal para cancelar la request (opcional)
   */
  const fetchProduct = useCallback(async (id: number, signal?: AbortSignal) => {
    try {
      // Limpieza previa y transición explícita de loading para evitar estados intermedios inconsistentes
      clearProductState();
      dispatch({ type: 'SET_PRODUCTS_LOADING', payload: true });
      dispatch({ type: 'SET_PRODUCTS_ERROR', payload: null });

      const product = await productService.getProductById(id, signal);
      const productWithOffers = syncProductsWithOffers([product])[0];

      dispatch({ type: 'SET_CURRENT_PRODUCT', payload: productWithOffers });

    } catch (error) {
      // No mostrar error si la request fue cancelada
      if (error instanceof Error && error.name === 'AbortError') {
        if (process.env.NODE_ENV === 'development') {
          console.debug(`Request del producto ${id} fue cancelada`);
        }
        return;
      }

      const errorMessage = error instanceof Error ? error.message : 'Error al cargar el producto';
      dispatch({ type: 'SET_PRODUCTS_ERROR', payload: errorMessage });
    } finally {
      dispatch({ type: 'SET_PRODUCTS_LOADING', payload: false });
    }
  }, [syncProductsWithOffers, clearProductState]);

  /**
   * Cargar productos destacados con caché inteligente
   * Verifica caché antes de hacer llamadas a la API
   */
  const fetchFeaturedProducts = useCallback(async (limit?: number) => {
    if (hasFreshData('featuredProducts')) {
      if (process.env.NODE_ENV === 'development') {
        console.log('🚀 Usando productos destacados del caché (frescos)');
      }
      restoreFromCache();
      return;
    }

    try {
      dispatch({ type: 'SET_PRODUCTS_LOADING', payload: true });
      dispatch({ type: 'SET_PRODUCTS_ERROR', payload: null });

      const featuredProducts = await productService.getFeaturedProducts(limit);
      const productsWithOffers = syncProductsWithOffers(featuredProducts);

      saveToCache({ featuredProducts: productsWithOffers });
      dispatch({ type: 'SET_FEATURED_PRODUCTS', payload: productsWithOffers });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al cargar productos destacados';
      dispatch({ type: 'SET_PRODUCTS_ERROR', payload: errorMessage });
    } finally {
      dispatch({ type: 'SET_PRODUCTS_LOADING', payload: false });
    }
  }, [syncProductsWithOffers, hasFreshData, restoreFromCache, saveToCache]);

  /**
   * Cargar categorías con caché inteligente
   * Verifica caché antes de hacer llamadas a la API
   */
  const fetchCategories = useCallback(async () => {
    if (hasFreshData('categories')) {
      if (process.env.NODE_ENV === 'development') {
        console.log('🚀 Usando categorías del caché (frescas)');
      }
      restoreFromCache();
      return;
    }

    try {
      dispatch({ type: 'SET_CATEGORIES_LOADING', payload: true });
      dispatch({ type: 'SET_CATEGORIES_ERROR', payload: null });

      const categories = await productService.getCategorias();
      dispatch({ type: 'SET_CATEGORIES', payload: categories });
      saveToCache({ categories });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al cargar categorías';
      dispatch({ type: 'SET_CATEGORIES_ERROR', payload: errorMessage });
    } finally {
      dispatch({ type: 'SET_CATEGORIES_LOADING', payload: false });
    }
  }, [hasFreshData, restoreFromCache, saveToCache]);

  /**
   * Seleccionar categoría y actualizar filtros
   * Sincroniza selección con sistema de filtros
   */
  const selectCategory = useCallback((category: Category | null) => {
    dispatch({ type: 'SET_SELECTED_CATEGORY', payload: category });

    if (category) {
      dispatch({ type: 'UPDATE_FILTERS', payload: { categoria: category.id_categoria } });
    } else {
      dispatch({ type: 'UPDATE_FILTERS', payload: { categoria: undefined } });
    }
  }, []);

  /**
   * Cargar marcas con caché inteligente
   * Verifica caché antes de hacer llamadas a la API
   */
  const fetchBrands = useCallback(async () => {
    if (hasFreshData('brands')) {
      if (process.env.NODE_ENV === 'development') {
        console.log('🚀 Usando marcas del caché (frescas)');
      }
      restoreFromCache();
      return;
    }

    try {
      dispatch({ type: 'SET_BRANDS_LOADING', payload: true });
      dispatch({ type: 'SET_BRANDS_ERROR', payload: null });

      const brands = await productService.getMarcas();
      dispatch({ type: 'SET_BRANDS', payload: brands });
      saveToCache({ brands });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al cargar marcas';
      dispatch({ type: 'SET_BRANDS_ERROR', payload: errorMessage });
    } finally {
      dispatch({ type: 'SET_BRANDS_LOADING', payload: false });
    }
  }, [hasFreshData, restoreFromCache, saveToCache]);

  /**
   * Seleccionar marca y actualizar filtros
   * Sincroniza selección con sistema de filtros
   */
  const selectBrand = useCallback((brand: Marca | null) => {
    dispatch({ type: 'SET_SELECTED_BRAND', payload: brand });

    if (brand) {
      dispatch({ type: 'UPDATE_FILTERS', payload: { marca: brand.id_marca } });
    } else {
      dispatch({ type: 'UPDATE_FILTERS', payload: { marca: undefined } });
    }
  }, []);

  // ============================================================================
  // ACCIONES DE FILTROS Y BÚSQUEDA
  // ============================================================================

  /**
   * Actualizar filtros de productos
   * Sincroniza cambios con sistema de paginación
   */
  const updateFilters = useCallback((filters: Partial<ProductFilters>) => {
    dispatch({ type: 'UPDATE_FILTERS', payload: filters });
  }, []);

  /**
   * Actualizar query de búsqueda
   * Sincroniza con sistema de paginación
   */
  const updateSearchQuery = useCallback((query: string) => {
    dispatch({ type: 'SET_SEARCH_QUERY', payload: query });
  }, []);

  /**
   * Resetear todos los filtros
   * Restaura estado inicial de filtros y búsqueda
   */
  const resetFilters = useCallback(() => {
    dispatch({ type: 'RESET_FILTERS' });
  }, []);

  /**
   * Aplicar filtros a productos
   * Implementa lógica de filtrado completa con múltiples criterios
   */
  const applyFilters = useCallback(() => {
    let filtered = state.products;

    // Aplicar filtros
    if (state.filters.categoria) {
      filtered = filtered.filter(product => product.id_categoria === state.filters.categoria);
    }

    if (state.filters.marca) {
      filtered = filtered.filter(product => product.id_marca === state.filters.marca);
    }

    if (state.filters.precio_min !== undefined) {
      filtered = filtered.filter(product => parseFloat(product.precio_venta) >= state.filters.precio_min!);
    }

    if (state.filters.precio_max !== undefined) {
      filtered = filtered.filter(product => parseFloat(product.precio_venta) <= state.filters.precio_max!);
    }

    if (state.filters.solo_con_stock) {
      filtered = filtered.filter(product => product.stock > 0);
    }

    if (state.filters.solo_ofertas) {
      filtered = filtered.filter(product => product.en_oferta);
    }

    if (state.filters.es_destacado) {
      filtered = filtered.filter(product => product.es_destacado);
    }

    // Búsqueda por texto
    if (state.searchQuery) {
      const query = state.searchQuery.toLowerCase();
      filtered = filtered.filter(product =>
        product.nombre.toLowerCase().includes(query) ||
        (product.descripcion && product.descripcion.toLowerCase().includes(query)) ||
        (product.modelo && product.modelo.toLowerCase().includes(query))
      );
    }

    dispatch({ type: 'SET_FILTERED_PRODUCTS', payload: filtered });
  }, [state.products, state.filters, state.searchQuery]);

  // ============================================================================
  // ACCIONES DE PAGINACIÓN
  // ============================================================================

  /**
   * Actualizar configuración de paginación
   * Modifica página y límite de productos por página
   */
  const updatePagination = useCallback((page: number, limit: number) => {
    dispatch({ type: 'UPDATE_PAGINATION', payload: { page, limit } });
  }, []);

  /**
   * Cargar más productos
   * Implementa paginación infinita para mejor UX
   */
  const loadMore = useCallback(async () => {
    if (!state.pagination.hasMore || state.pagination.page === 1) return;

    const nextPage = state.pagination.page + 1;
    await fetchProducts(state.filters, nextPage);
  }, [state.pagination.hasMore, state.pagination.page, state.filters, fetchProducts]);

  // ============================================================================
  // EFECTOS OPTIMIZADOS
  // ============================================================================

  // Aplicar filtros automáticamente
  useEffect(() => {
    if (state.products.length > 0 && !state.productsLoading) {
      const hasActiveFilters = Object.keys(state.filters).length > 0 || state.searchQuery.trim().length > 0;

      if (hasActiveFilters) {
        applyFilters();
      } else {
        dispatch({ type: 'SET_FILTERED_PRODUCTS', payload: state.products });
      }
    }
  }, [state.products, state.filters, state.searchQuery, state.productsLoading, applyFilters]);

  // Sincronizar productos con ofertas - OPTIMIZADO
  useEffect(() => {
    if (state.products.length > 0 && ofertasContext?.productosEnOferta) {
      const needsSync = state.products.some(product =>
        !product.en_oferta && !product.precio_oferta
      );

      if (needsSync) {
        const productsWithOffers = syncProductsWithOffers(state.products);

        // Solo actualizar si hay cambios reales
        const hasChanges = productsWithOffers.some((product, index) => {
          const currentProduct = state.products[index];
          return currentProduct && (
            product.en_oferta !== currentProduct.en_oferta ||
            product.precio_oferta !== currentProduct.precio_oferta ||
            product.precio_original !== currentProduct.precio_original
          );
        });

        if (hasChanges) {
          dispatch({ type: 'SET_PRODUCTS', payload: productsWithOffers });
          dispatch({ type: 'SET_FILTERED_PRODUCTS', payload: productsWithOffers });
        }
      }
    }
  }, [ofertasContext?.productosEnOferta, state.products, syncProductsWithOffers]);

  // Sincronizar productos destacados con ofertas - OPTIMIZADO
  useEffect(() => {
    if (state.featuredProducts.length > 0 && ofertasContext?.productosEnOferta) {
      const needsSync = state.featuredProducts.some(product =>
        !product.en_oferta && !product.precio_oferta
      );

      if (needsSync) {
        const featuredProductsWithOffers = syncProductsWithOffers(state.featuredProducts);

        // Solo actualizar si hay cambios reales
        const hasChanges = featuredProductsWithOffers.some((product, index) => {
          const currentProduct = state.featuredProducts[index];
          return currentProduct && (
            product.en_oferta !== currentProduct.en_oferta ||
            product.precio_oferta !== currentProduct.precio_oferta ||
            product.precio_original !== currentProduct.precio_original
          );
        });

        if (hasChanges) {
          dispatch({ type: 'SET_FEATURED_PRODUCTS', payload: featuredProductsWithOffers });
        }
      }
    }
  }, [ofertasContext?.productosEnOferta, state.featuredProducts, syncProductsWithOffers]);

  // ============================================================================
  // VALOR DEL CONTEXTO OPTIMIZADO
  // ============================================================================

  /**
   * Valor del contexto memoizado para evitar re-renders innecesarios
   * Solo se recrea cuando cambian las dependencias reales
   */
  const contextValue: ProductContextType = useMemo(() => ({
    state,
    fetchProducts,
    fetchProduct,
    fetchFeaturedProducts,
    fetchCategories,
    selectCategory,
    fetchBrands,
    selectBrand,
    updateFilters,
    updateSearchQuery,
    resetFilters,
    applyFilters,
    updatePagination,
    loadMore,
    getCachedData,
    setCachedData,
    clearCache,
    loadImageWithCache,
    clearImageCache,
    hasFreshData,
    restoreFromCache,
    clearProductState,
    forceClearProductState,
  }), [
    state,
    fetchProducts,
    fetchProduct,
    fetchFeaturedProducts,
    fetchCategories,
    selectCategory,
    fetchBrands,
    selectBrand,
    updateFilters,
    updateSearchQuery,
    resetFilters,
    applyFilters,
    updatePagination,
    loadMore,
    getCachedData,
    setCachedData,
    clearCache,
    loadImageWithCache,
    clearImageCache,
    hasFreshData,
    restoreFromCache,
    clearProductState,
    forceClearProductState,
  ]);

  return (
    <ProductContext.Provider value={contextValue}>
      {children}
    </ProductContext.Provider>
  );
};

// ============================================================================
// HOOK PERSONALIZADO
// ============================================================================

/**
 * Hook personalizado para usar el contexto de productos
 * Proporciona acceso seguro al contexto con validación de uso
 */
export const useProductContext = (): ProductContextType => {
  const context = useContext(ProductContext);
  if (context === undefined) {
    throw new Error('useProductContext debe usarse dentro de ProductProvider');
  }
  return context;
};

export default ProductContext;

