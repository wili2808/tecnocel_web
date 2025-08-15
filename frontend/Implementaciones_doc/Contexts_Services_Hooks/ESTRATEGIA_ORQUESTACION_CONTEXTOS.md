# 🎯 **ESTRATEGIA DE ORQUESTACIÓN DE CONTEXTOS - TECNOCEL WEB**

## 📋 **RESUMEN EJECUTIVO**

Este documento define la nueva estrategia implementada para la gestión de contextos en TecnoCel Web, basada en el principio de **"Páginas como Orquestadoras"** donde cada página es responsable de cargar los contextos necesarios para sus componentes hijos.

---

## 🏗️ **ARQUITECTURA IMPLEMENTADA**

### **Principio Fundamental**

> **"Las páginas cargan los contextos, los componentes los consumen"**

### **Jerarquía de Responsabilidades**

1. **App.tsx**: Providers globales (Auth, Theme, Notifications)
2. **Páginas**: Carga de datos específicos del dominio
3. **Componentes**: Consumo y actualización de contextos
4. **Hooks**: Lógica reutilizable y optimizada

---

## 🚀 **IMPLEMENTACIÓN DE LA ESTRATEGIA**

### **1. ProductCatalog.tsx - Orquestador Principal**

#### **Contextos Cargados**

```typescript
// ============================================================================
// CONTEXTO DE PRODUCTOS - CARGA PRINCIPAL
// ============================================================================
const {
  filteredProducts,
  productsLoading: loading,
  productsError: error,
  categories,
  filters,
  updateFilters,
  products: allProducts,
  brands,
  loadProducts,
  loadCategories,
  loadBrands,
} = useProductActions();

// ============================================================================
// CONTEXTO DE OFERTAS - CARGA PARA PRODUCTCARDS
// ============================================================================
const { loadOfertas, ofertas } = useOfertasGlobal();

// ============================================================================
// CONTEXTO DE FAVORITOS - CARGA PARA PRODUCTCARDS
// ============================================================================
const { loadFavoritos, getFavoritosCount } = useFavoritosGlobal();
```

#### **Carga Inteligente de Datos**

```typescript
// ============================================================================
// CARGA INTELLIGENTE DE DATOS - ORQUESTACIÓN CENTRALIZADA
// ============================================================================
useEffect(() => {
  // Solo cargar si no hay datos ya cargados
  if (allProducts.length === 0 && !loading) {
    loadProducts();
  }
  if (categories.length === 0 && !loading) {
    loadCategories();
  }
  if (brands.length === 0 && !loading) {
    loadBrands();
  }
}, [
  allProducts.length,
  categories.length,
  brands.length,
  loading,
  loadProducts,
  loadCategories,
  loadBrands,
]);

// ============================================================================
// CARGA DE CONTEXTOS COMPLEMENTARIOS
// ============================================================================
useEffect(() => {
  // Cargar ofertas solo si no están cargadas
  if (ofertas.length === 0) {
    loadOfertas();
  }
}, [ofertas.length, loadOfertas]);

useEffect(() => {
  // Cargar favoritos solo si no hay favoritos cargados
  if (getFavoritosCount() === 0) {
    loadFavoritos();
  }
}, [getFavoritosCount, loadFavoritos]);
```

### **2. Home.tsx - Orquestador de Productos Destacados**

#### **Contextos Cargados**

```typescript
// ============================================================================
// CONTEXTO DE PRODUCTOS - CARGA PRINCIPAL
// ============================================================================
const {
  featuredProducts,
  productsLoading: loading,
  productsError: error,
  loadFeaturedProducts,
} = useProductActions();

// ============================================================================
// CONTEXTO DE OFERTAS - CARGA PARA PRODUCTCARDS
// ============================================================================
const { loadOfertas, ofertas } = useOfertasGlobal();

// ============================================================================
// CONTEXTO DE FAVORITOS - CARGA PARA PRODUCTCARDS
// ============================================================================
const { loadFavoritos, getFavoritosCount } = useFavoritosGlobal();
```

#### **Carga Inteligente de Datos**

```typescript
// ============================================================================
// CARGA INTELLIGENTE DE DATOS - ORQUESTACIÓN CENTRALIZADA
// ============================================================================

// Cargar productos destacados solo si no están cargados
useEffect(() => {
  if (featuredProducts.length === 0 && !loading) {
    loadFeaturedProducts(6); // Cargar 6 productos destacados
  }
}, [featuredProducts.length, loading, loadFeaturedProducts]);

// Cargar ofertas para que ProductCard pueda mostrar precios actualizados
useEffect(() => {
  if (ofertas.length === 0) {
    loadOfertas();
  }
}, [ofertas.length, loadOfertas]);

// Cargar favoritos para que ProductCard pueda mostrar estado de favoritos
useEffect(() => {
  if (getFavoritosCount() === 0) {
    loadFavoritos();
  }
}, [getFavoritosCount, loadFavoritos]);
```

---

## 🎨 **HOOK COMÚN PARA PRODUCTCARD**

### **Objetivo**

Eliminar la duplicación de lógica entre `ProductCard.tsx` y `ProductCardExtensive.tsx`.

### **Implementación**

```typescript
// Hook común que encapsula toda la lógica
export const useProductCardLogic = ({
  id_producto,
  nombre,
  precio_venta,
  stock,
  precio_original,
  precio_oferta,
  descuento_porcentaje,
  en_oferta,
}: Pick<
  ProductCardProps,
  | "id_producto"
  | "nombre"
  | "precio_venta"
  | "stock"
  | "precio_original"
  | "precio_oferta"
  | "descuento_porcentaje"
  | "en_oferta"
>): UseProductCardLogicReturn => {
  // ... lógica común implementada
};
```

### **Beneficios**

- **Eliminación de duplicación**: Misma lógica en un solo lugar
- **Mantenibilidad**: Cambios en un solo archivo
- **Consistencia**: Comportamiento idéntico entre variantes
- **Testing**: Una sola función para probar

---

## 🔄 **FLUJO DE DATOS IMPLEMENTADO**

### **1. Flujo de ProductCatalog**

```
ProductCatalog se monta → Carga productos, categorías, marcas → Carga ofertas → Carga favoritos → ProductCardExtensive consume contextos
```

### **2. Flujo de Home**

```
Home se monta → Carga productos destacados → Carga ofertas → Carga favoritos → ProductCard consume contextos
```

### **3. Flujo de Componentes**

```
Componente se monta → Usa useProductCardLogic → Accede a contextos ya cargados → Renderiza UI
```

---

## ⚠️ **ANTIPATRONES EVITADOS**

### **1. Carga en Componentes** ❌

```typescript
// ❌ INCORRECTO: Componente cargando contextos
const ProductCard = () => {
  const { loadOfertas } = useOfertasGlobal();

  useEffect(() => {
    loadOfertas(); // ❌ No debe cargar aquí
  }, []);
};
```

### **2. Carga Duplicada** ❌

```typescript
// ❌ INCORRECTO: Múltiples componentes cargando lo mismo
const ProductCard1 = () => {
  loadOfertas();
};
const ProductCard2 = () => {
  loadOfertas();
}; // ❌ Duplicado
```

### **3. Carga Innecesaria** ❌

```typescript
// ❌ INCORRECTO: Cargar sin verificar si ya existe
useEffect(() => {
  loadOfertas(); // ❌ Siempre carga
}, [loadOfertas]);
```

---

## ✅ **PATRONES IMPLEMENTADOS**

### **1. Carga Condicional Inteligente** ✅

```typescript
// ✅ CORRECTO: Solo carga si es necesario
useEffect(() => {
  if (data.length === 0 && !loading) {
    loadData();
  }
}, [data.length, loading, loadData]);
```

### **2. Orquestación Centralizada** ✅

```typescript
// ✅ CORRECTO: Página orquesta la carga
const ProductCatalog = () => {
  // Carga todos los contextos necesarios
  const { loadProducts, loadOfertas, loadFavoritos } = useProductActions();

  useEffect(() => {
    // Carga inteligente y condicional
  }, []);
};
```

### **3. Consumo Pasivo** ✅

```typescript
// ✅ CORRECTO: Componente solo consume
const ProductCard = () => {
  const logic = useProductCardLogic(props);
  // Usa contextos ya cargados
};
```

---

## 🎯 **BENEFICIOS DE LA IMPLEMENTACIÓN**

### **1. Performance** 🚀

- **Sin carga duplicada**: Cada contexto se carga una sola vez
- **Carga inteligente**: Solo cuando es necesario
- **Re-renders optimizados**: Hooks optimizados para componentes específicos

### **2. Mantenibilidad** 🔧

- **Lógica centralizada**: En páginas y hooks comunes
- **Responsabilidades claras**: Cada capa tiene su rol definido
- **Fácil debugging**: Flujo de datos predecible

### **3. Escalabilidad** 📈

- **Fácil agregar contextos**: Solo modificar la página correspondiente
- **Componentes reutilizables**: Sin dependencias de carga
- **Testing simplificado**: Separación clara de responsabilidades

---

## 🔧 **IMPLEMENTACIÓN FUTURA**

### **1. Hook Común para ProductCard** ✅

- [x] **Implementar `useProductCardLogic` completamente** - COMPLETADO
- [x] **Migrar `ProductCard.tsx` al nuevo hook** - COMPLETADO
- [x] **Migrar `ProductCardExtensive.tsx` al nuevo hook** - COMPLETADO
- [ ] Testing del hook común

### **2. Optimizaciones Adicionales** ⏳

- [ ] Implementar `getMarcas()` en `productService.tsx`
- [ ] Optimizar sistema de caché en ProductContext
- [ ] Implementar lazy loading de imágenes
- [ ] Implementar virtualización para listas largas

### **3. Monitoreo y Métricas** ⏳

- [ ] Verificar que no hay bucles infinitos
- [ ] Validar que los datos se cargan correctamente
- [ ] Probar navegación entre páginas sin errores
- [ ] Medir performance de carga de contextos

---

## 📝 **CONCLUSIONES**

### **✅ Estado Actual**

- **Estrategia implementada**: Páginas como orquestadoras de contextos
- **Carga inteligente**: Condicional y sin duplicación
- **Arquitectura clara**: Responsabilidades bien definidas
- **Performance optimizada**: Sin re-renders innecesarios

### **🎯 Próximos Pasos**

1. **Completar implementación**: Hook común para ProductCard
2. **Testing exhaustivo**: Verificar funcionalidad completa
3. **Optimizaciones**: Implementar funcionalidades faltantes
4. **Monitoreo continuo**: Performance y estabilidad

### **💡 Recomendación Final**

La nueva estrategia de orquestación de contextos es **sólida y escalable**. Proporciona:

- **Control centralizado** de la carga de datos
- **Eliminación de duplicación** entre componentes
- **Performance optimizada** con carga inteligente
- **Arquitectura mantenible** y fácil de entender

---

**Estado del Documento: ✅ COMPLETO Y ACTUALIZADO**

_Esta documentación define la nueva estrategia implementada para la gestión eficiente de contextos en TecnoCel Web, asegurando una arquitectura escalable y mantenible._
