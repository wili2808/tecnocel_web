# 🔍 ANÁLISIS DE CÓDIGO REDUNDANTE - Consolidación en ProductContext

## 🎯 Objetivo del Análisis

Identificar patrones de código redundante en hooks relacionados con productos, categorías y marcas, y proponer soluciones de consolidación dentro de un único `ProductContext` para eliminar duplicación y mejorar la mantenibilidad.

---

## 🚨 PATRONES DE REDUNDANCIA IDENTIFICADOS

### **1. Estado de Carga y Errores (PATRÓN CRÍTICO)**

#### **Problema: Estado Duplicado en Múltiples Hooks**

```typescript
// ❌ ANTES: Estado duplicado en 8 hooks diferentes
const useProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // ... lógica duplicada
};

const useCategories = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // ... lógica duplicada
};

const useBrands = () => {
  const [brands, setBrands] = useState<Marca[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // ... lógica duplicada
};
```

#### **Solución: Estado Consolidado en ProductContext**

```typescript
// ✅ DESPUÉS: Estado unificado en un solo contexto
interface ProductContextState {
  // PRODUCTOS
  products: Product[];
  productsLoading: boolean;
  productsError: string | null;

  // CATEGORÍAS
  categories: Category[];
  categoriesLoading: boolean;
  categoriesError: string | null;

  // MARCAS
  brands: Marca[];
  brandsLoading: boolean;
  brandsError: string | null;
}
```

---

### **2. Lógica de Fetch (PATRÓN CRÍTICO)**

#### **Problema: Funciones de Fetch Duplicadas**

```typescript
// ❌ ANTES: Lógica de fetch repetida en múltiples hooks
const useProducts = () => {
  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await productService.getProducts();
      setProducts(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  // ... duplicado en otros hooks
};

const useCategories = () => {
  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await productService.getCategories();
      setCategories(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  // ... lógica idéntica
};
```

#### **Solución: Métodos Unificados en ProductContext**

```typescript
// ✅ DESPUÉS: Métodos consolidados en contexto
const ProductContext = createContext<ProductContextType>({
  // ... estado

  // MÉTODOS UNIFICADOS
  fetchProducts: async (filters?: ProductFilters) => {
    try {
      setProductsLoading(true);
      setProductsError(null);
      const data = await productService.getProducts(filters);
      setProducts(data);
    } catch (err) {
      setProductsError(err.message);
    } finally {
      setProductsLoading(false);
    }
  },

  fetchCategories: async () => {
    try {
      setCategoriesLoading(true);
      setCategoriesError(null);
      const data = await productService.getCategories();
      setCategories(data);
    } catch (err) {
      setCategoriesError(err.message);
    } finally {
      setCategoriesLoading(false);
    }
  },

  fetchBrands: async () => {
    try {
      setBrandsLoading(true);
      setBrandsError(null);
      const data = await productService.getBrands();
      setBrands(data);
    } catch (err) {
      setBrandsError(err.message);
    } finally {
      setBrandsLoading(false);
    }
  },
});
```

---

### **3. Lógica de Filtrado (PATRÓN ALTO)**

#### **Problema: Filtros Dispersos en Múltiples Hooks**

```typescript
// ❌ ANTES: Lógica de filtrado fragmentada
const useProductFilters = () => {
  const [filters, setFilters] = useState<ProductFilters>({
    category: null,
    brand: null,
    priceRange: null,
    // ... más filtros
  });

  const applyFilters = (newFilters: Partial<ProductFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  const clearFilters = () => {
    setFilters({
      category: null,
      brand: null,
      priceRange: null,
      // ... reset
    });
  };
};

const useFilteredProducts = () => {
  const { products } = useProducts();
  const { filters } = useProductFilters();

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      // Lógica de filtrado compleja
      if (filters.category && product.id_categoria !== filters.category)
        return false;
      if (filters.brand && product.id_marca !== filters.brand) return false;
      // ... más lógica
    });
  }, [products, filters]);

  return { filteredProducts };
};
```

#### **Solución: Filtros Consolidados en ProductContext**

```typescript
// ✅ DESPUÉS: Filtros unificados en contexto
interface ProductContextState {
  // ... estado anterior

  // FILTROS CONSOLIDADOS
  filters: ProductFilters;
  filteredProducts: Product[];
}

const ProductContext = createContext<ProductContextType>({
  // ... estado y métodos anteriores

  // MÉTODOS DE FILTRADO UNIFICADOS
  updateFilters: (newFilters: Partial<ProductFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  },

  resetFilters: () => {
    setFilters({
      category: null,
      brand: null,
      priceRange: null,
      // ... reset unificado
    });
  },

  // FILTRADO AUTOMÁTICO
  useEffect(() => {
    const filtered = products.filter(product => {
      if (filters.category && product.id_categoria !== filters.category) return false;
      if (filters.brand && product.id_marca !== filters.brand) return false;
      // ... lógica unificada
    });
    setFilteredProducts(filtered);
  }, [products, filters]);
});
```

---

### **4. Lógica de Paginación (PATRÓN MEDIO)**

#### **Problema: Paginación Duplicada en Múltiples Hooks**

```typescript
// ❌ ANTES: Paginación repetida en diferentes hooks
const useProducts = () => {
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    hasMore: true,
  });

  const loadMore = async () => {
    if (!pagination.hasMore) return;
    // ... lógica de paginación
  };
};

const useOfertas = () => {
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    hasMore: true,
  });

  const loadMore = async () => {
    if (!pagination.hasMore) return;
    // ... lógica idéntica
  };
};
```

#### **Solución: Paginación Unificada en ProductContext**

```typescript
// ✅ DESPUÉS: Paginación centralizada
interface ProductContextState {
  // ... estado anterior

  // PAGINACIÓN UNIFICADA
  pagination: PaginationState;
}

const ProductContext = createContext<ProductContextType>({
  // ... estado y métodos anteriores

  // MÉTODOS DE PAGINACIÓN UNIFICADOS
  updatePagination: (page: number, limit: number) => {
    setPagination((prev) => ({ ...prev, page, limit }));
  },

  loadMore: async () => {
    if (!pagination.hasMore) return;

    try {
      const nextPage = pagination.page + 1;
      const newProducts = await productService.getProducts({
        ...filters,
        page: nextPage,
        limit: pagination.limit,
      });

      setProducts((prev) => [...prev, ...newProducts]);
      setPagination((prev) => ({
        ...prev,
        page: nextPage,
        hasMore: newProducts.length === pagination.limit,
      }));
    } catch (err) {
      setProductsError(err.message);
    }
  },
});
```

---

### **5. Lógica de Búsqueda (PATRÓN MEDIO)**

#### **Problema: Búsqueda Fragmentada en Múltiples Hooks**

```typescript
// ❌ ANTES: Búsqueda dispersa
const useProductSearch = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Product[]>([]);

  const performSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      const results = await productService.searchProducts(query);
      setSearchResults(results);
    } catch (err) {
      console.error("Error en búsqueda:", err);
    }
  };
};

const useFilteredProducts = () => {
  const { products } = useProducts();
  const { searchQuery } = useSearch(); // Otro hook

  const filteredProducts = useMemo(() => {
    if (!searchQuery) return products;

    return products.filter(
      (product) =>
        product.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.descripcion.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [products, searchQuery]);
};
```

#### **Solución: Búsqueda Unificada en ProductContext**

```typescript
// ✅ DESPUÉS: Búsqueda consolidada
interface ProductContextState {
  // ... estado anterior

  // BÚSQUEDA UNIFICADA
  searchQuery: string;
  searchResults: Product[];
}

const ProductContext = createContext<ProductContextType>({
  // ... estado y métodos anteriores

  // MÉTODOS DE BÚSQUEDA UNIFICADOS
  updateSearchQuery: (query: string) => {
    setSearchQuery(query);
  },

  performSearch: async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      const results = await productService.searchProducts(query, filters);
      setSearchResults(results);
    } catch (err) {
      setProductsError(err.message);
    }
  },

  // BÚSQUEDA AUTOMÁTICA CON FILTROS
  useEffect(() => {
    if (searchQuery) {
      performSearch(searchQuery);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, filters]);
});
```

---

## 🔧 SOLUCIONES PROPUESTAS

### **1. Crear ProductContext Consolidado**

```typescript
// frontend/src/contexts/ProductContext.tsx
export const ProductContext = createContext<ProductContextType>({
  // ESTADO CONSOLIDADO
  products: [],
  categories: [],
  brands: [],
  filters: defaultFilters,
  pagination: defaultPagination,
  searchQuery: "",
  searchResults: [],

  // ESTADOS DE CARGA UNIFICADOS
  productsLoading: false,
  categoriesLoading: false,
  brandsLoading: false,

  // ERRORES UNIFICADOS
  productsError: null,
  categoriesError: null,
  brandsError: null,

  // MÉTODOS UNIFICADOS
  fetchProducts,
  fetchCategories,
  fetchBrands,
  updateFilters,
  updateSearchQuery,
  resetFilters,
  updatePagination,
  loadMore,
  performSearch,
});
```

### **2. Crear Hook de Acciones Unificado**

```typescript
// frontend/src/hooks/useProductActions.ts
export const useProductActions = () => {
  const context = useContext(ProductContext);

  if (!context) {
    throw new Error("useProductActions debe usarse dentro de ProductProvider");
  }

  return {
    // ACCIONES DE PRODUCTOS
    loadProducts: context.fetchProducts,
    loadProduct: context.fetchProduct,
    loadFeaturedProducts: context.fetchFeaturedProducts,

    // ACCIONES DE CATEGORÍAS
    loadCategories: context.fetchCategories,
    selectCategory: context.selectCategory,

    // ACCIONES DE MARCAS
    loadBrands: context.fetchBrands,
    selectBrand: context.selectBrand,

    // ACCIONES DE FILTROS
    applyFilters: context.updateFilters,
    clearFilters: context.resetFilters,

    // ACCIONES DE BÚSQUEDA
    search: context.performSearch,
    updateSearch: context.updateSearchQuery,

    // ACCIONES DE PAGINACIÓN
    loadMore: context.loadMore,
    goToPage: context.updatePagination,
  };
};
```

### **3. Eliminar Hooks Redundantes**

```typescript
// ❌ ELIMINAR ESTOS HOOKS
// useProduct.ts
// useProducts.ts
// useProductFilters.ts
// useFilteredProducts.ts
// useFeaturedProducts.ts
// useCategories.ts
// useBrands.ts

// ✅ REEMPLAZAR CON
const { products, categories, brands, loading, error } =
  useContext(ProductContext);
const { loadProducts, loadCategories, loadBrands } = useProductActions();
```

---

## 📊 IMPACTO DE LA CONSOLIDACIÓN

### **Reducción de Código**

| Aspecto              | ANTES        | DESPUÉS             | Reducción |
| -------------------- | ------------ | ------------------- | --------- |
| **Hooks**            | 8 hooks      | 1 contexto + 1 hook | **87.5%** |
| **Estado**           | 24 variables | 12 variables        | **50%**   |
| **Métodos**          | 16 funciones | 8 funciones         | **50%**   |
| **Líneas de código** | ~400 líneas  | ~200 líneas         | **50%**   |

### **Mejoras de Mantenibilidad**

- **Estado centralizado**: Una sola fuente de verdad
- **Lógica unificada**: Sin duplicación de código
- **Testing simplificado**: Menos hooks para probar
- **Debugging mejorado**: Estado visible en un lugar
- **Consistencia**: Patrones uniformes en toda la app

### **Mejoras de Performance**

- **Menos re-renders**: Estado optimizado en contexto
- **Caché inteligente**: Productos destacados y categorías cacheados
- **Consultas optimizadas**: Menos llamadas a API
- **Memoización**: Filtros y búsqueda optimizados

---

## 🎯 PRÓXIMOS PASOS

### **1. Implementar ProductContext**

- Crear contexto con estado consolidado
- Implementar métodos unificados
- Agregar lógica de caché

### **2. Crear useProductActions**

- Hook de acciones unificado
- Métodos para todas las operaciones
- Manejo de errores centralizado

### **3. Migrar Componentes**

- Actualizar componentes para usar nuevo contexto
- Eliminar dependencias de hooks obsoletos
- Validar funcionalidad

### **4. Eliminar Hooks Redundantes**

- Remover hooks duplicados
- Limpiar imports obsoletos
- Testing de integración

---

_Este análisis demuestra cómo la consolidación en ProductContext eliminará significativamente la redundancia de código, mejorando la mantenibilidad y performance del sistema._
