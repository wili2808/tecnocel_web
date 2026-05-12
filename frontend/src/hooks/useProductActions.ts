import { useProductContext } from '../contexts/ProductContext';
import type { ProductFilters, Category, Marca } from '../types';

/**
 * Hook personalizado que proporciona una API limpia para interactuar con el ProductContext
 * Consolida todas las acciones relacionadas con productos, categorías y marcas
 * 
 * NOTA: Las funciones retornadas (loadProducts, updateFilters, etc.) pueden cambiar
 * de referencia entre renders debido a dependencias en el contexto subyacente.
 * Los consumidores que las usen en useEffect DEBEN usar refs para evitar loops.
 */
export const useProductActions = () => {
  const context = useProductContext();
  
  const {
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
    updatePagination,
    loadMore,
    getCachedData,
    setCachedData,
    clearCache,
  } = context;

  return {
    // ============================================================================
    // ESTADO DEL CONTEXTO
    // ============================================================================
    
    // Estado de productos
    products: state.products,
    featuredProducts: state.featuredProducts,
    currentProduct: state.currentProduct,
    productsLoading: state.productsLoading,
    productsError: state.productsError,
    
    // Estado de categorías
    categories: state.categories,
    selectedCategory: state.selectedCategory,
    categoriesLoading: state.categoriesLoading,
    categoriesError: state.categoriesError,
    
    // Estado de marcas
    brands: state.brands,
    selectedBrand: state.selectedBrand,
    brandsLoading: state.brandsLoading,
    brandsError: state.brandsError,
    
    // Estado de filtros y búsqueda
    filters: state.filters,
    searchQuery: state.searchQuery,
    filteredProducts: state.filteredProducts,
    
    // Estado de paginación
    pagination: state.pagination,
    
    // ============================================================================
    // ACCIONES DE PRODUCTOS
    // ============================================================================
    
    /**
     * Cargar lista de productos con filtros opcionales
     */
    loadProducts: (filters?: ProductFilters, page?: number) => 
      fetchProducts(filters, page),
    
    /**
     * Cargar un producto específico por ID
     * @param id - ID del producto a cargar
     * @param signal - AbortSignal para cancelar la request (opcional)
     */
    loadProduct: (id: number, signal?: AbortSignal) => fetchProduct(id, signal),
    
    /**
     * Cargar productos destacados
     */
    loadFeaturedProducts: (limit?: number) => fetchFeaturedProducts(limit),
    
    // ============================================================================
    // ACCIONES DE CATEGORÍAS
    // ============================================================================
    
    /**
     * Cargar todas las categorías
     */
    loadCategories: () => fetchCategories(),
    
    /**
     * Seleccionar una categoría (actualiza filtros automáticamente)
     */
    selectCategory: (category: Category | null) => selectCategory(category),
    
    /**
     * Obtener categoría por ID
     */
    getCategoryById: (id: number) => 
      state.categories.find(cat => cat.id_categoria === id),
    
    /**
     * Obtener categoría por nombre
     */
    getCategoryByName: (name: string) => 
      state.categories.find(cat => cat.nombre_categoria.toLowerCase() === name.toLowerCase()),
    
    // ============================================================================
    // ACCIONES DE MARCAS
    // ============================================================================
    
    /**
     * Cargar todas las marcas
     */
    loadBrands: () => fetchBrands(),
    
    /**
     * Seleccionar una marca (actualiza filtros automáticamente)
     */
    selectBrand: (brand: Marca | null) => selectBrand(brand),
    
    /**
     * Obtener marca por ID
     */
    getBrandById: (id: number) => 
      state.brands.find(brand => brand.id_marca === id),
    
    /**
     * Obtener marca por nombre
     */
    getBrandByName: (name: string) => 
      state.brands.find(brand => brand.nombre_marca.toLowerCase() === name.toLowerCase()),
    
    // ============================================================================
    // ACCIONES DE FILTROS Y BÚSQUEDA
    // ============================================================================
    
    /**
     * Actualizar filtros parciales
     */
    updateFilters: (filters: Partial<ProductFilters>) => updateFilters(filters),
    
    /**
     * Aplicar filtros parciales (mantiene filtros existentes)
     */
    applyFilters: () => context.applyFilters(),
    
    /**
     * Limpiar todos los filtros
     */
    clearFilters: () => resetFilters(),
    
    /**
     * Actualizar filtro de categoría
     */
    setCategoryFilter: (categoryId?: number) => 
      updateFilters({ categoria: categoryId }),
    
    /**
     * Actualizar filtro de marca
     */
    setBrandFilter: (brandId?: number) => 
      updateFilters({ marca: brandId }),
    
    /**
     * Actualizar filtro de precio mínimo
     */
    setMinPriceFilter: (price?: number) => 
      updateFilters({ precio_min: price }),
    
    /**
     * Actualizar filtro de precio máximo
     */
    setMaxPriceFilter: (price?: number) => 
      updateFilters({ precio_max: price }),
    
    /**
     * Actualizar filtro de stock
     */
    setStockFilter: (onlyInStock: boolean) => 
      updateFilters({ solo_con_stock: onlyInStock }),
    
    /**
     * Actualizar filtro de ofertas
     */
    setOffersFilter: (onlyOffers: boolean) => 
      updateFilters({ solo_ofertas: onlyOffers }),
    
    /**
     * Actualizar filtro de destacados
     */
    setFeaturedFilter: (onlyFeatured: boolean) => 
      updateFilters({ es_destacado: onlyFeatured }),
    
    // ============================================================================
    // ACCIONES DE BÚSQUEDA
    // ============================================================================
    
    /**
     * Actualizar consulta de búsqueda
     */
    updateSearch: (query: string) => updateSearchQuery(query),
    
    /**
     * Limpiar búsqueda
     */
    clearSearch: () => updateSearchQuery(''),
    
    /**
     * Realizar búsqueda con filtros actuales
     */
    search: (query: string) => {
      updateSearchQuery(query);
      // Los filtros se aplican automáticamente en el contexto
    },
    
    // ============================================================================
    // ACCIONES DE PAGINACIÓN
    // ============================================================================
    
    /**
     * Ir a una página específica
     */
    goToPage: (page: number) => 
      updatePagination(page, state.pagination.limit),
    
    /**
     * Cambiar límite de productos por página
     */
    setPageLimit: (limit: number) => 
      updatePagination(1, limit), // Reset a página 1
    
    /**
     * Cargar más productos (paginación infinita)
     */
    loadMore: () => loadMore(),
    
    /**
     * Ir a la primera página
     */
    goToFirstPage: () => updatePagination(1, state.pagination.limit),
    
    /**
     * Ir a la página anterior
     */
    goToPreviousPage: () => {
      if (state.pagination.page > 1) {
        updatePagination(state.pagination.page - 1, state.pagination.limit);
      }
    },
    
    /**
     * Ir a la página siguiente
     */
    goToNextPage: () => {
      if (state.pagination.hasMore) {
        updatePagination(state.pagination.page + 1, state.pagination.limit);
      }
    },
    
    // ============================================================================
    // ACCIONES DE CACHÉ
    // ============================================================================
    
    /**
     * Obtener datos del caché
     */
    getCachedData: (key: string) => getCachedData(key),
    
    /**
     * Guardar datos en caché
     */
    setCachedData: (key: string, data: any) => setCachedData(key, data),
    
    /**
     * Limpiar caché específico o todo
     */
    clearCache: (key?: string) => clearCache(key),
    
    /**
     * Limpieza completa del estado del producto
     */
    clearProductState: () => context.clearProductState(),
    
    /**
     * Limpieza forzada para navegación
     */
    forceClearProductState: () => context.forceClearProductState(),
    
    // ============================================================================
    // UTILIDADES
    // ============================================================================
    
    /**
     * Verificar si hay productos cargando
     */
    isLoading: () => 
      state.productsLoading || state.categoriesLoading || state.brandsLoading,
    
    /**
     * Verificar si hay errores
     */
    hasErrors: () => 
      !!(state.productsError || state.categoriesError || state.brandsError),
    
    /**
     * Obtener todos los errores
     */
    getErrors: () => ({
      products: state.productsError,
      categories: state.categoriesError,
      brands: state.brandsError,
    }),
    
    /**
     * Obtener productos filtrados por categoría
     */
    getProductsByCategory: (categoryId: number) => 
      state.products.filter(product => product.id_categoria === categoryId),
    
    /**
     * Obtener productos filtrados por marca
     */
    getProductsByBrand: (brandId: number) => 
      state.products.filter(product => product.id_marca === brandId),
    
    /**
     * Obtener productos en oferta
     */
    getProductsOnSale: () => 
      state.products.filter(product => product.en_oferta),
    
    /**
     * Obtener productos destacados
     */
    getFeaturedProducts: () => 
      state.products.filter(product => product.es_destacado),
    
    /**
     * Obtener productos con stock
     */
    getProductsInStock: () => 
      state.products.filter(product => product.stock > 0),
    
    /**
     * Obtener productos por rango de precio
     */
    getProductsByPriceRange: (minPrice: number, maxPrice: number) => 
      state.products.filter(product => {
        const price = parseFloat(product.precio_venta);
        return price >= minPrice && price <= maxPrice;
      }),
    
    /**
     * Obtener estadísticas básicas
     */
    getStats: () => ({
      totalProducts: state.products.length,
      totalCategories: state.categories.length,
      totalBrands: state.brands.length,
      productsOnSale: state.products.filter(p => p.en_oferta).length,
      featuredProducts: state.products.filter(p => p.es_destacado).length,
      productsInStock: state.products.filter(p => p.stock > 0).length,
    }),
  };
};

export default useProductActions;
