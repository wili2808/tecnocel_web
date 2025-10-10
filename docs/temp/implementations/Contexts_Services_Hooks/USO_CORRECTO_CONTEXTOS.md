# 🎯 **USO CORRECTO DE CONTEXTOS EN TECNOCEL WEB**

## 📋 **RESUMEN EJECUTIVO**

Este documento define la estrategia correcta para implementar y usar los contextos en TecnoCel Web, asegurando una gestión eficiente del estado global y evitando problemas de rendimiento como bucles infinitos y re-renders innecesarios.

---

## 🏗️ **ARQUITECTURA DE CONTEXTOS**

### **Jerarquía de Providers (App.tsx)**

```typescript
GoogleOAuthProvider
└── AuthProvider
    └── AutoLogoutWrapper
        └── ThemeProvider
            └── NotificationProvider
                └── FavoritosGlobalProvider
                    └── OfertasGlobalProvider
                        └── ProductProvider
                            └── Router
                                └── SearchProvider
                                    └── CarritoProvider
```

### **Orden de Dependencias**

1. **AuthProvider**: Autenticación base
2. **FavoritosGlobalProvider**: Depende de AuthContext
3. **OfertasGlobalProvider**: Independiente, se carga al inicio
4. **ProductProvider**: Depende de datos de productos
5. **CarritoProvider**: Depende de AuthContext y ProductContext

---

## 🚀 **ESTRATEGIA DE CARGA DE DATOS**

### **1. Carga Inicial de la Aplicación**

#### **OfertasGlobalProvider** ⚡ **CARGAR AL INICIO**

- **Cuándo**: Al montar la aplicación
- **Por qué**: Las ofertas afectan el precio de todos los productos
- **Implementación**: `useEffect` en el provider principal

```typescript
// En OfertasGlobalProvider
useEffect(() => {
  loadOfertas(); // Cargar todas las ofertas activas
}, []); // Solo al montar
```

#### **ProductProvider** ⚠️ **NO CARGAR AUTOMÁTICAMENTE**

- **Cuándo**: Solo cuando los componentes lo soliciten
- **Por qué**: Evitar bucles infinitos y carga innecesaria
- **Implementación**: Carga condicional en componentes

### **2. Carga Condicional por Componente**

#### **Home.tsx** - Productos Destacados

```typescript
useEffect(() => {
  if (featuredProducts.length === 0 && !loading) {
    loadFeaturedProducts(6);
  }
}, [featuredProducts.length, loading, loadFeaturedProducts]);
```

#### **ProductCatalog.tsx** - Catálogo Completo

```typescript
useEffect(() => {
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
```

#### **ProductPage.tsx** - Producto Individual

```typescript
useEffect(() => {
  if (productId > 0 && !product && !loading) {
    loadProduct(productId);
  }
}, [productId, product, loading, loadProduct]);
```

---

## 🎨 **COMPONENTES REUTILIZABLES Y CONTEXTOS**

### **ProductCard.tsx** - Componente Crítico

#### **Contextos Utilizados**

```typescript
const { agregarItem, estado } = useCarrito(); // Carrito
const { isAuthenticated } = useAuth(); // Autenticación
const { showNotification } = useNotification(); // Notificaciones
const { isFavorito, toggleFavorito } = useFavoritoProducto(id_producto); // Favoritos
const { isProductoEnOferta, getOfertaInfo } = useOfertasProducto(id_producto); // Ofertas
```

#### **Optimizaciones Implementadas**

- **Memoización**: `React.memo` para evitar re-renders innecesarios
- **useMemo**: Para cálculos de precios y ofertas
- **Hooks optimizados**: `useOfertasProducto` solo se re-renderiza cuando cambia la oferta específica

#### **Patrón de Uso Correcto**

```typescript
// ✅ CORRECTO: Hook optimizado para ofertas
const { isProductoEnOferta, getOfertaInfo } = useOfertasProducto(id_producto);

// ✅ CORRECTO: Memoización de cálculos costosos
const priceInfo = useMemo(() => {
  const isInOffer = isProductoEnOferta();
  const offerInfo = getOfertaInfo();
  // ... lógica de precios
}, [
  isProductoEnOferta,
  getOfertaInfo,
  en_oferta,
  precio_oferta,
  precio_original,
  precio_venta,
]);
```

### **ProductCardExtensive.tsx** - Variante Extendida

#### **Diferencias con ProductCard**

- **Mismo patrón de contextos**
- **Más información visual**
- **Botones de acción más prominentes**

---

## 🔄 **FLUJO DE DATOS Y ESTADOS**

### **1. Flujo de Autenticación**

```
Usuario se logea → AuthContext actualiza → FavoritosGlobalProvider carga favoritos → CarritoProvider carga carrito
```

### **2. Flujo de Productos**

```
Componente solicita producto → ProductContext verifica caché → Si no existe, llama a API → Actualiza estado → Componente se re-renderiza
```

### **3. Flujo de Ofertas**

```
App se monta → OfertasGlobalProvider carga ofertas → ProductCard consulta ofertas → Muestra precios actualizados
```

### **4. Flujo de Favoritos**

```
Usuario hace click en favorito → FavoritosGlobalContext actualiza → ProductCard se re-renderiza → UI se actualiza
```

---

## ⚠️ **ANTIPATRONES A EVITAR**

### **1. Carga Automática en ProductProvider**

```typescript
// ❌ INCORRECTO: Causa bucles infinitos
useEffect(() => {
  fetchCategories();
  fetchBrands();
  fetchFeaturedProducts();
}, [fetchCategories, fetchBrands, fetchFeaturedProducts]);
```

### **2. Dependencias Incorrectas en useEffect**

```typescript
// ❌ INCORRECTO: loadProduct se recrea en cada render
useEffect(() => {
  loadProduct(productId);
}, [productId, loadProduct]);

// ✅ CORRECTO: Condición inteligente
useEffect(() => {
  if (productId > 0 && !product && !loading) {
    loadProduct(productId);
  }
}, [productId, product, loading, loadProduct]);
```

### **3. Contextos Anidados Incorrectamente**

```typescript
// ❌ INCORRECTO: Orden incorrecto
<ProductProvider>
    <OfertasGlobalProvider>
        {/* Ofertas no estarán disponibles para ProductProvider */}
    </OfertasGlobalProvider>
</ProductProvider>

// ✅ CORRECTO: Orden correcto
<OfertasGlobalProvider>
    <ProductProvider>
        {/* ProductProvider puede acceder a ofertas */}
    </ProductProvider>
</OfertasGlobalProvider>
```

---

## 🎯 **IMPLEMENTACIÓN RECOMENDADA**

### **1. Carga de Datos Iniciales**

#### **En App.tsx o Layout Principal**

```typescript
// Cargar ofertas al inicio de la aplicación
const { loadOfertas } = useOfertasGlobal();

useEffect(() => {
  loadOfertas();
}, [loadOfertas]);
```

#### **En Componentes de Página**

```typescript
// Cargar datos específicos solo cuando sea necesario
const { loadFeaturedProducts, featuredProducts, productsLoading } =
  useProductActions();

useEffect(() => {
  if (featuredProducts.length === 0 && !productsLoading) {
    loadFeaturedProducts(6);
  }
}, [featuredProducts.length, productsLoading, loadFeaturedProducts]);
```

### **2. Gestión de Estados de Carga**

#### **Estados Múltiples**

```typescript
const {
  productsLoading, // Carga de productos
  categoriesLoading, // Carga de categorías
  brandsLoading, // Carga de marcas
  productsError, // Errores de productos
  categoriesError, // Errores de categorías
  brandsError, // Errores de marcas
} = useProductActions();
```

#### **Estados Consolidados**

```typescript
// Para componentes que necesitan saber si algo está cargando
const isLoading = productsLoading || categoriesLoading || brandsLoading;
const hasError = productsError || categoriesError || brandsError;
```

### **3. Optimización de Re-renders**

#### **ProductCard Optimizado**

```typescript
// ✅ CORRECTO: Solo se re-renderiza cuando cambia la oferta del producto
const { isProductoEnOferta, getOfertaInfo } = useOfertasProducto(id_producto);

// ✅ CORRECTO: Memoización de cálculos
const priceInfo = useMemo(() => {
  // ... lógica de precios
}, [isProductoEnOferta, getOfertaInfo, precio_venta]);
```

---

## 🔧 **MANTENIMIENTO Y MONITOREO**

### **1. Verificación de Re-renders**

```typescript
// En ProductCard.tsx
console.log(
  `🔄 ProductCard renderizado - ID: ${id_producto}, Nombre: ${nombre}`
);

// En ProductContext.tsx
console.log("🔄 ProductContext re-renderizado");
```

### **2. Verificación de Carga de Datos**

```typescript
// En ProductContext.tsx
console.log("📊 Productos cargados:", products.length);
console.log("📊 Categorías cargadas:", categories.length);
console.log("📊 Marcas cargadas:", brands.length);
```

### **3. Verificación de Caché**

```typescript
// En ProductContext.tsx
console.log("💾 Caché actual:", Array.from(cache.keys()));
```

---

## 📊 **MÉTRICAS DE PERFORMANCE**

### **1. Indicadores Clave**

- **Re-renders por componente**: Máximo 2-3 por acción del usuario
- **Tiempo de carga inicial**: < 2 segundos
- **Tiempo de respuesta a acciones**: < 500ms
- **Uso de memoria**: < 50MB para datos en caché

### **2. Monitoreo Continuo**

- **Console logs**: Para desarrollo y debugging
- **React DevTools**: Para análisis de re-renders
- **Network tab**: Para verificación de llamadas a API
- **Performance tab**: Para análisis de rendimiento

---

## 🚀 **PRÓXIMOS PASOS**

### **1. Implementación Inmediata**

- [ ] Verificar que todos los componentes usen el patrón de carga condicional
- [ ] Implementar `getMarcas()` en `productService.tsx`
- [ ] Optimizar sistema de caché en ProductContext

### **2. Optimizaciones Futuras**

- [ ] Implementar lazy loading para imágenes
- [ ] Agregar virtualización para listas largas de productos
- [ ] Implementar service worker para caché offline

### **3. Testing y Validación**

- [ ] Verificar que no hay bucles infinitos
- [ ] Validar que los datos se cargan correctamente
- [ ] Probar navegación entre páginas sin errores

---

## 📝 **CONCLUSIONES**

### **✅ Beneficios de la Implementación Actual**

- **Arquitectura consolidada**: Contextos bien organizados y dependencias claras
- **Performance optimizada**: Evita re-renders innecesarios y bucles infinitos
- **Código mantenible**: Patrones consistentes y fáciles de entender
- **Escalabilidad**: Fácil agregar nuevos contextos y funcionalidades

### **⚠️ Consideraciones Importantes**

- **Carga condicional**: Siempre usar condiciones inteligentes en useEffect
- **Orden de providers**: Mantener la jerarquía correcta en App.tsx
- **Memoización**: Usar React.memo y useMemo para componentes costosos
- **Hooks optimizados**: Usar hooks específicos como `useOfertasProducto`

### **🎯 Recomendación Final**

La arquitectura actual es sólida y bien pensada. El enfoque debe estar en:

1. **Mantener la consistencia** en el uso de contextos
2. **Optimizar la carga condicional** en todos los componentes
3. **Implementar el método `getMarcas()`** para completar la funcionalidad
4. **Monitorear el rendimiento** continuamente

---

**Estado del Documento: ✅ COMPLETO Y ACTUALIZADO**

_Esta documentación proporciona la guía completa para el uso correcto de contextos en TecnoCel Web, asegurando una implementación consistente y eficiente._

---

**[⬆ Volver arriba](#tabla-de-contenidos)** | **[📚 Documentación](../../../../docs/README.md)** | **[🏠 Inicio](../../../../README.md)**
