import React, { createContext, useContext, useReducer, useCallback, useMemo, useRef } from 'react';
import type { ReactNode } from 'react';
import type { Product, Category, Marca, ProductFilters } from '../types';
import productService from '../services/productService';
import { useOfertasGlobal } from './OfertasGlobalContext';

// --- INTERFACES Y TIPOS ---


// --- ESTADO DEL CONTEXTO ---

interface ProductContextState {
  products: Product[];
  featuredProducts: Product[];
  currentProduct: Product | null;
  productsLoading: boolean;
  productsError: string | null;
  categories: Category[];
  selectedCategory: Category | null;
  categoriesLoading: boolean;
  categoriesError: string | null;
  brands: Marca[];
  selectedBrand: Marca | null;
  brandsLoading: boolean;
  brandsError: string | null;
  filters: ProductFilters;
  searchQuery: string;
  filteredProducts: Product[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

type ProductAction =
  | { type: 'SET_PRODUCTS'; payload: Product[] }
  | { type: 'SET_FEATURED_PRODUCTS'; payload: Product[] }
  | { type: 'SET_CURRENT_PRODUCT'; payload: Product | null }
  | { type: 'SET_PRODUCTS_LOADING'; payload: boolean }
  | { type: 'SET_PRODUCTS_ERROR'; payload: string | null }
  | { type: 'ADD_PRODUCTS'; payload: Product[] }
  | { type: 'SET_CATEGORIES'; payload: Category[] }
  | { type: 'SET_SELECTED_CATEGORY'; payload: Category | null }
  | { type: 'SET_CATEGORIES_LOADING'; payload: boolean }
  | { type: 'SET_CATEGORIES_ERROR'; payload: string | null }
  | { type: 'SET_BRANDS'; payload: Marca[] }
  | { type: 'SET_SELECTED_BRAND'; payload: Marca | null }
  | { type: 'SET_BRANDS_LOADING'; payload: boolean }
  | { type: 'SET_BRANDS_ERROR'; payload: string | null }
  | { type: 'UPDATE_FILTERS'; payload: Partial<ProductFilters> }
  | { type: 'SET_SEARCH_QUERY'; payload: string }
  | { type: 'RESET_FILTERS' }
  | { type: 'SET_FILTERED_PRODUCTS'; payload: Product[] }
  | { type: 'UPDATE_PAGINATION'; payload: { page: number; limit: number } }
  | { type: 'SET_TOTAL_COUNT'; payload: number }
  | { type: 'SET_HAS_MORE'; payload: boolean };

interface ProductContextType {
  state: ProductContextState;
  fetchProducts: (filters?: ProductFilters, page?: number) => Promise<void>;
  fetchProduct: (id: number, signal?: AbortSignal) => Promise<void>;
  fetchFeaturedProducts: (limit?: number) => Promise<void>;
  fetchCategories: () => Promise<void>;
  selectCategory: (category: Category | null) => void;
  fetchBrands: () => Promise<void>;
  selectBrand: (brand: Marca | null) => void;
  updateFilters: (filters: Partial<ProductFilters>) => void;
  updateSearchQuery: (query: string) => void;
  resetFilters: () => void;
  applyFilters: () => void;
  updatePagination: (page: number, limit: number) => void;
  loadMore: () => Promise<void>;
  clearProductState: (force?: boolean) => void;
  forceClearProductState: () => void;
  getCachedData: (key: string) => any;
  setCachedData: (key: string, data: any) => void;
  clearCache: (key?: string) => void;
}

const initialState: ProductContextState = {
  products: [],
  featuredProducts: [],
  currentProduct: null,
  productsLoading: false,
  productsError: null,
  categories: [],
  selectedCategory: null,
  categoriesLoading: false,
  categoriesError: null,
  brands: [],
  selectedBrand: null,
  brandsLoading: false,
  brandsError: null,
  filters: {},
  searchQuery: '',
  filteredProducts: [],
  pagination: {
    page: 1,
    limit: 12,
    total: 0,
    hasMore: true,
  },
};

function productReducer(state: ProductContextState, action: ProductAction): ProductContextState {
  switch (action.type) {
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
    case 'SET_CATEGORIES':
      return { ...state, categories: action.payload };
    case 'SET_SELECTED_CATEGORY':
      return { ...state, selectedCategory: action.payload };
    case 'SET_CATEGORIES_LOADING':
      return { ...state, categoriesLoading: action.payload };
    case 'SET_CATEGORIES_ERROR':
      return { ...state, categoriesError: action.payload };
    case 'SET_BRANDS':
      return { ...state, brands: action.payload };
    case 'SET_SELECTED_BRAND':
      return { ...state, selectedBrand: action.payload };
    case 'SET_BRANDS_LOADING':
      return { ...state, brandsLoading: action.payload };
    case 'SET_BRANDS_ERROR':
      return { ...state, brandsError: action.payload };
    case 'UPDATE_FILTERS':
      return {
        ...state,
        filters: { ...state.filters, ...action.payload },
        searchQuery: action.payload.busqueda !== undefined ? action.payload.busqueda : state.searchQuery,
        pagination: { ...state.pagination, page: 1 },
      };
    case 'SET_SEARCH_QUERY':
      return {
        ...state,
        searchQuery: action.payload,
        pagination: { ...state.pagination, page: 1 },
      };
    case 'RESET_FILTERS':
      return {
        ...state,
        filters: {},
        searchQuery: '',
        pagination: { ...state.pagination, page: 1 },
      };
    case 'SET_FILTERED_PRODUCTS':
      return { ...state, filteredProducts: action.payload };
    case 'UPDATE_PAGINATION':
      return {
        ...state,
        pagination: { ...state.pagination, ...action.payload },
      };
    case 'SET_TOTAL_COUNT':
      return {
        ...state,
        pagination: { ...state.pagination, total: action.payload },
      };
    case 'SET_HAS_MORE':
      return {
        ...state,
        pagination: { ...state.pagination, hasMore: action.payload },
      };
    default:
      return state;
  }
}

const ProductContext = createContext<ProductContextType | undefined>(undefined);

export const ProductProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(productReducer, initialState);
  const ofertasContext = useOfertasGlobal();
  const cache = useRef<Map<string, any>>(new Map());



  const syncProductsWithOffers = useCallback(
    (products: Product[]) => {
      if (!ofertasContext?.productosEnOferta?.length) return products;

      const ofertasMap = new Map(ofertasContext.productosEnOferta.map((oferta) => [oferta.id_producto, oferta]));

      return products.map((product) => {
        const productoEnOferta = ofertasMap.get(product.id_producto);
        if (productoEnOferta) {
          return {
            ...product,
            en_oferta: productoEnOferta.en_oferta,
            precio_oferta: productoEnOferta.precio_oferta,
            precio_original: Number(productoEnOferta.precio_original || product.precio_venta),
          };
        }
        return product;
      });
    },
    [ofertasContext],
  );


  const fetchProducts = useCallback(
    async (filters?: ProductFilters, page?: number) => {
      try {
        dispatch({ type: 'SET_PRODUCTS_LOADING', payload: true });
        
        // Si no se especifica página, cargar sin límite para que el filtrado local funcione
        const productsResult = page !== undefined
          ? await productService.getProducts({ page, limit: state.pagination.limit, filters })
          : await productService.getProducts({ filters });

        const products = productsResult.productos;
        const productsWithOffers = syncProductsWithOffers(products);
        
        dispatch({ type: 'SET_PRODUCTS', payload: productsWithOffers });
        dispatch({ type: 'SET_FILTERED_PRODUCTS', payload: productsWithOffers });

        if (productsResult.pagination) {
          dispatch({ type: 'SET_TOTAL_COUNT', payload: productsResult.pagination.total });
          dispatch({ type: 'SET_HAS_MORE', payload: productsResult.pagination.page < productsResult.pagination.pages });
        }
      } catch (error) {
        dispatch({ type: 'SET_PRODUCTS_ERROR', payload: 'Error al cargar productos' });
      } finally {
        dispatch({ type: 'SET_PRODUCTS_LOADING', payload: false });
      }
    },
    [state.pagination.limit, syncProductsWithOffers],
  );

  const fetchProduct = useCallback(
    async (id: number, signal?: AbortSignal) => {
      try {
        dispatch({ type: 'SET_PRODUCTS_LOADING', payload: true });
        const product = await productService.getProductById(id, signal);
        const productWithOffers = syncProductsWithOffers([product])[0];
        dispatch({ type: 'SET_CURRENT_PRODUCT', payload: productWithOffers });
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') return;
        dispatch({ type: 'SET_PRODUCTS_ERROR', payload: 'Error al cargar el producto' });
      } finally {
        dispatch({ type: 'SET_PRODUCTS_LOADING', payload: false });
      }
    },
    [syncProductsWithOffers],
  );

  const fetchFeaturedProducts = useCallback(async (limit?: number) => {
    try {
      dispatch({ type: 'SET_PRODUCTS_LOADING', payload: true });
      const featured = await productService.getFeaturedProducts(limit);
      const productsWithOffers = syncProductsWithOffers(featured);
      dispatch({ type: 'SET_FEATURED_PRODUCTS', payload: productsWithOffers });
    } catch (error) {
      dispatch({ type: 'SET_PRODUCTS_ERROR', payload: 'Error al cargar destacados' });
    } finally {
      dispatch({ type: 'SET_PRODUCTS_LOADING', payload: false });
    }
  }, [syncProductsWithOffers]);

  const fetchCategories = useCallback(async () => {
    try {
      dispatch({ type: 'SET_CATEGORIES_LOADING', payload: true });
      const categories = await productService.getCategorias();
      dispatch({ type: 'SET_CATEGORIES', payload: categories });
    } catch (e) { dispatch({ type: 'SET_CATEGORIES_ERROR', payload: 'Error' }); }
    finally { dispatch({ type: 'SET_CATEGORIES_LOADING', payload: false }); }
  }, []);

  const selectCategory = useCallback((category: Category | null) => {
    dispatch({ type: 'SET_SELECTED_CATEGORY', payload: category });
    dispatch({ type: 'UPDATE_FILTERS', payload: { categoria: category?.id_categoria } });
  }, []);

  const fetchBrands = useCallback(async () => {
    try {
      dispatch({ type: 'SET_BRANDS_LOADING', payload: true });
      const brands = await productService.getMarcas();
      dispatch({ type: 'SET_BRANDS', payload: brands });
    } catch (e) { dispatch({ type: 'SET_BRANDS_ERROR', payload: 'Error' }); }
    finally { dispatch({ type: 'SET_BRANDS_LOADING', payload: false }); }
  }, []);

  const selectBrand = useCallback((brand: Marca | null) => {
    dispatch({ type: 'SET_SELECTED_BRAND', payload: brand });
    dispatch({ type: 'UPDATE_FILTERS', payload: { marca: brand?.id_marca } });
  }, []);

  const updateFilters = useCallback((filters: Partial<ProductFilters>) => {
    dispatch({ type: 'UPDATE_FILTERS', payload: filters });
  }, []);

  const updateSearchQuery = useCallback((query: string) => {
    dispatch({ type: 'SET_SEARCH_QUERY', payload: query });
  }, []);

  const resetFilters = useCallback(() => {
    dispatch({ type: 'RESET_FILTERS' });
  }, []);

  const applyFilters = useCallback(() => {
    // Lógica simplificada de filtrado local si fuera necesaria
    dispatch({ type: 'SET_FILTERED_PRODUCTS', payload: state.products });
  }, [state.products]);

  const updatePagination = useCallback((page: number, limit: number) => {
    dispatch({ type: 'UPDATE_PAGINATION', payload: { page, limit } });
  }, []);

  const loadMore = useCallback(async () => {
    if (!state.pagination.hasMore) return;
    await fetchProducts(state.filters, state.pagination.page + 1);
  }, [state.pagination.hasMore, state.pagination.page, state.filters, fetchProducts]);

  const clearProductState = useCallback(() => {
    dispatch({ type: 'SET_CURRENT_PRODUCT', payload: null });
    dispatch({ type: 'SET_FILTERED_PRODUCTS', payload: [] });
  }, []);

  const forceClearProductState = useCallback(() => clearProductState(), [clearProductState]);

  const getCachedData = useCallback((key: string) => {
    return cache.current.get(key);
  }, []);

  const setCachedData = useCallback((key: string, data: any) => {
    cache.current.set(key, data);
  }, []);

  const clearCache = useCallback((key?: string) => {
    if (key) {
      cache.current.delete(key);
    } else {
      cache.current.clear();
    }
  }, []);

  const contextValue = useMemo(() => ({
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
    clearProductState,
    forceClearProductState,
    getCachedData,
    setCachedData,
    clearCache,
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
    clearProductState,
    forceClearProductState,
    getCachedData,
    setCachedData,
    clearCache
  ]);

  return <ProductContext.Provider value={contextValue}>{children}</ProductContext.Provider>;
};

export const useProductContext = () => {
  const context = useContext(ProductContext);
  if (!context) throw new Error('useProductContext must be inside ProductProvider');
  return context;
};

export default ProductContext;
