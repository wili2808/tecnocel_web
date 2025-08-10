# 📋 Plan de Implementación: Contexto Global de Ofertas

## 🎯 Objetivo

Implementar un contexto global para el manejo de ofertas que centralice el estado, cache y optimice las consultas, siguiendo el patrón exitoso establecido con `FavoritosGlobalContext`.

---

## 📊 Análisis de la Implementación Actual

### ✅ Estado Actual de Ofertas

#### 1. **Servicio de Ofertas** (`ofertaService.ts`)

```typescript
// Funcionalidades actuales:
- getOfertasActivas(): Promise<Oferta[]>
- getProductosEnOferta(limit, offset): Promise<ProductosOfertaResponse>
```

#### 2. **Hook de Ofertas** (`useOfertas.ts`)

```typescript
// Estado local en cada componente:
- ofertas: Oferta[]
- productosEnOferta: Product[]
- loading: boolean
- error: string | null
- totalProductos: number
- paginaActual: number
- totalPaginas: number
```

#### 3. **Componentes que usan Ofertas**

- `Offers.tsx` - Página principal de ofertas
- `OffersGrid.tsx` - Grid de ofertas
- `OfferCard.tsx` - Tarjeta individual de oferta
- `OfferIndicator.tsx` - Indicador de descuento
- `ProductCard.tsx` - Muestra indicadores de oferta
- `ProductCardExtensive.tsx` - Versión extendida con ofertas

### ❌ Problemas Identificados

1. **Consultas Redundantes**: Cada componente que usa ofertas hace su propia consulta
2. **Estado Fragmentado**: No hay sincronización entre diferentes partes de la app
3. **Sin Cache**: Las ofertas se recargan en cada navegación
4. **Performance**: Múltiples llamadas al API innecesarias
5. **UX Inconsistente**: Diferentes estados de carga en diferentes componentes

---

## 🏗️ Arquitectura Propuesta

### 1. **Contexto Global de Ofertas** (`OfertasGlobalContext.tsx`)

```typescript
interface OfertasState {
  ofertas: Oferta[];
  productosEnOferta: Product[];
  ofertasActivas: Oferta[];
  ofertasExpiradas: Oferta[];
  loading: boolean;
  error: string | null;
  lastUpdated: number | null;
  cache: {
    ofertas: Map<number, Oferta>;
    productos: Map<number, Product>;
  };
}

interface OfertasContextType extends OfertasState {
  // Métodos principales
  getOfertaById: (id: number) => Oferta | undefined;
  getProductosPorOferta: (ofertaId: number) => Product[];
  isProductoEnOferta: (productId: number) => boolean;

  // Métodos de gestión
  loadOfertas: () => Promise<void>;
  refreshOfertas: () => Promise<void>;
  clearOfertas: () => void;

  // Métodos de utilidad
  getOfertasActivas: () => Oferta[];
  getOfertasExpiradas: () => Oferta[];
  getOfertasCount: () => number;

  // Métodos de cache
  isCacheValid: () => boolean;
  invalidateCache: () => void;
}
```

### 2. **Estructura de Cache**

```typescript
interface OfertasCache {
  userId?: number; // Para cache personalizado por usuario
  ofertas: Oferta[];
  productosEnOferta: Product[];
  ofertasActivas: number[]; // IDs de ofertas activas
  ofertasExpiradas: number[]; // IDs de ofertas expiradas
  timestamp: number;
  version: string; // Para invalidar cache en actualizaciones
}
```

---

## 🚀 Plan de Implementación

### **Fase 1: Creación del Contexto Global**

#### 1.1 Crear `OfertasGlobalContext.tsx`

```bash
# Ubicación: frontend/src/contexts/OfertasGlobalContext.tsx
```

**Características principales:**

- Cache en localStorage y memoria
- Invalidación automática por tiempo
- Sincronización con el servidor
- Manejo de errores robusto
- Optimización de consultas

#### 1.2 Configuración de Variables de Entorno

```bash
# Agregar a .env:
VITE_OFERTAS_CACHE_KEY=ofertas_cache
VITE_OFERTAS_CACHE_DURATION=300000  # 5 minutos
VITE_OFERTAS_REFRESH_INTERVAL=60000  # 1 minuto
```

### **Fase 2: Optimización del Servicio**

#### 2.1 Mejorar `ofertaService.ts`

```typescript
// Nuevas funcionalidades:
- getOfertaById(id: number): Promise<Oferta>
- getProductosPorOferta(ofertaId: number): Promise<Product[]>
- getOfertasResumen(): Promise<OfertasResumen>
- refreshOfertas(): Promise<void>
```

#### 2.2 Crear Tipos Mejorados

```typescript
// En types/product.ts:
interface OfertasResumen {
  total: number;
  activas: number;
  expiradas: number;
  productosEnOferta: number;
}

interface OfertaConProductos extends Oferta {
  productos: Product[];
  productosCount: number;
}
```

### **Fase 3: Migración de Componentes**

#### 3.1 Actualizar `App.tsx`

```typescript
// Agregar OfertasGlobalProvider al árbol de contextos
<OfertasGlobalProvider>{/* Resto de providers */}</OfertasGlobalProvider>
```

#### 3.2 Migrar `Offers.tsx`

```typescript
// Reemplazar useOfertas por useOfertasGlobal
const { ofertas, productosEnOferta, loading, error, refreshOfertas } =
  useOfertasGlobal();
```

#### 3.3 Actualizar Componentes de Productos

```typescript
// En ProductCard y ProductCardExtensive:
const { isProductoEnOferta, getOfertaById } = useOfertasGlobal();
```

### **Fase 4: Optimizaciones Avanzadas**

#### 4.1 Sistema de Notificaciones de Ofertas

```typescript
// Notificaciones automáticas para:
- Nuevas ofertas
- Ofertas por expirar
- Ofertas expiradas
```

#### 4.2 Cache Inteligente

```typescript
// Estrategias de cache:
- Cache por usuario (si está autenticado)
- Cache por categoría de producto
- Cache por ubicación geográfica
- Invalidación selectiva
```

#### 4.3 Métricas y Analytics

```typescript
// Tracking de:
- Ofertas más vistas
- Conversiones por oferta
- Tiempo de permanencia en ofertas
- Productos más populares en ofertas
```

---

## 📁 Estructura de Archivos

```
frontend/src/
├── contexts/
│   ├── OfertasGlobalContext.tsx          # 🆕 Contexto global
│   └── ...
├── services/
│   ├── ofertaService.ts                  # 🔄 Mejorado
│   └── ...
├── hooks/
│   ├── useOfertas.ts                     # 🔄 Migrado a contexto
│   ├── useOfertasGlobal.ts               # 🆕 Hook del contexto
│   └── ...
├── types/
│   ├── product.ts                        # 🔄 Tipos mejorados
│   └── ...
└── utils/
    ├── ofertasCache.ts                   # 🆕 Utilidades de cache
    └── ...
```

---

## 🔧 Configuración Técnica

### **Variables de Entorno**

```env
# Cache de ofertas
VITE_OFERTAS_CACHE_KEY=ofertas_cache
VITE_OFERTAS_CACHE_DURATION=300000
VITE_OFERTAS_REFRESH_INTERVAL=60000
VITE_OFERTAS_MAX_CACHE_SIZE=50

# Notificaciones
VITE_OFERTAS_NOTIFICATIONS_ENABLED=true
VITE_OFERTAS_EXPIRY_WARNING_HOURS=24

# Analytics
VITE_OFERTAS_ANALYTICS_ENABLED=true
```

### **Configuración de Cache**

```typescript
const CACHE_CONFIG = {
  key: import.meta.env.VITE_OFERTAS_CACHE_KEY || "ofertas_cache",
  duration: parseInt(import.meta.env.VITE_OFERTAS_CACHE_DURATION || "300000"),
  refreshInterval: parseInt(
    import.meta.env.VITE_OFERTAS_REFRESH_INTERVAL || "60000"
  ),
  maxSize: parseInt(import.meta.env.VITE_OFERTAS_MAX_CACHE_SIZE || "50"),
};
```

---

## 📈 Beneficios Esperados

### **Performance**

- ✅ Reducción del 80% en llamadas al API
- ✅ Tiempo de carga 60% más rápido
- ✅ Cache inteligente con invalidación automática
- ✅ Consultas optimizadas y agrupadas

### **UX/UI**

- ✅ Estado consistente en toda la aplicación
- ✅ Carga instantánea en navegaciones
- ✅ Notificaciones inteligentes de ofertas
- ✅ Indicadores de oferta en tiempo real

### **Mantenibilidad**

- ✅ Código centralizado y reutilizable
- ✅ Fácil testing y debugging
- ✅ Escalabilidad para nuevas funcionalidades
- ✅ Documentación completa

### **Analytics**

- ✅ Métricas detalladas de ofertas
- ✅ Tracking de conversiones
- ✅ Insights de comportamiento del usuario
- ✅ Optimización basada en datos

---

## 🧪 Testing Strategy

### **Unit Tests**

```typescript
// Tests para:
- OfertasGlobalContext
- ofertaService mejorado
- Utilidades de cache
- Hooks personalizados
```

### **Integration Tests**

```typescript
// Tests para:
- Flujo completo de ofertas
- Cache y sincronización
- Migración de componentes
- Performance benchmarks
```

### **E2E Tests**

```typescript
// Tests para:
- Página de ofertas completa
- Interacciones de usuario
- Estados de carga y error
- Responsive design
```

---

## 📅 Cronograma de Implementación

### **Semana 1: Fundación**

- [ ] Crear `OfertasGlobalContext.tsx`
- [ ] Configurar variables de entorno
- [ ] Implementar sistema de cache básico
- [ ] Tests unitarios del contexto

### **Semana 2: Servicios y Tipos**

- [ ] Mejorar `ofertaService.ts`
- [ ] Actualizar tipos en `product.ts`
- [ ] Crear utilidades de cache
- [ ] Tests de integración

### **Semana 3: Migración de Componentes**

- [ ] Actualizar `App.tsx`
- [ ] Migrar `Offers.tsx`
- [ ] Actualizar componentes de productos
- [ ] Tests de componentes

### **Semana 4: Optimizaciones**

- [ ] Sistema de notificaciones
- [ ] Cache inteligente
- [ ] Analytics básicos
- [ ] Tests E2E

### **Semana 5: Refinamiento**

- [ ] Optimizaciones de performance
- [ ] Documentación completa
- [ ] Code review y refactoring
- [ ] Deploy y monitoreo

---

## 🎯 Métricas de Éxito

### **Performance**

- [ ] Reducción del 80% en llamadas al API de ofertas
- [ ] Tiempo de carga < 200ms para ofertas cacheadas
- [ ] Cache hit rate > 90%

### **UX**

- [ ] Tiempo de interacción < 100ms
- [ ] Tasa de conversión de ofertas +15%
- [ ] Satisfacción del usuario > 4.5/5

### **Técnico**

- [ ] Cobertura de tests > 90%
- [ ] Zero breaking changes
- [ ] Documentación 100% completa

---

## 🔄 Migración Gradual

### **Estrategia de Rollout**

1. **Fase Beta**: Implementar en rama separada
2. **Fase Alpha**: Deploy en staging con usuarios internos
3. **Fase Beta Público**: Deploy con feature flag
4. **Fase Producción**: Rollout completo

### **Rollback Plan**

- Mantener implementación anterior como fallback
- Feature flags para activar/desactivar
- Monitoreo continuo de métricas
- Plan de rollback automático si hay errores

---

## 📚 Documentación Adicional

### **Archivos de Referencia**

- `PLAN_IMPLEMENTACION_CACHE_COMPLETO.md` - Patrón de cache
- `SISTEMA_CACHE_FAVORITOS.md` - Implementación de favoritos
- `FavoritosGlobalContext.tsx` - Contexto de referencia

### **Buenas Prácticas**

- Seguir el patrón establecido con favoritos
- Mantener consistencia en nomenclatura
- Documentar todas las funciones públicas
- Implementar error boundaries apropiados

---

## 🚀 Próximos Pasos

1. **Revisión del Plan**: Validar con el equipo
2. **Setup del Entorno**: Configurar variables y dependencias
3. **Implementación Fase 1**: Crear el contexto base
4. **Testing Continuo**: Validar cada fase
5. **Deploy Gradual**: Rollout controlado

---

_Este plan sigue las mejores prácticas establecidas en el proyecto y garantiza una implementación robusta, escalable y mantenible del contexto global de ofertas._
