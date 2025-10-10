# 🚀 Plan de Refactorización de Contextos - Arquitectura Separada

## 📋 **Resumen del Plan**

Este documento establece el plan para refactorizar todos los contextos de la aplicación siguiendo el **patrón exitoso implementado en CarritoContext**, separando responsabilidades en servicios, hooks personalizados y contextos enfocados únicamente en el estado.

---

## 🎯 **Objetivos de la Refactorización**

### **1. Separación de Responsabilidades**

- **Servicios**: Solo API y tipos
- **Hooks**: Solo lógica de negocio
- **Contextos**: Solo estado de React

### **2. Consistencia Arquitectónica**

- Patrón uniforme en toda la aplicación
- Estructura predecible para desarrolladores
- Facilita onboarding de nuevos miembros

### **3. Mejora de Mantenibilidad**

- Código más organizado y legible
- Cambios localizados y controlados
- Menor acoplamiento entre componentes

### **4. Optimización de Performance**

- Memoización consistente
- Reducción de re-renders
- Hooks optimizados y reutilizables

---

## 🏗️ **Arquitectura Objetivo**

### **Estructura Estándar por Contexto**

```
📁 services/
└── [contexto]Service.ts        # API + Tipos + Interfaces

📁 hooks/
├── use[Contexto].ts            # Lógica de negocio pura
├── use[Contexto]Operations.ts  # Operaciones coordinadas
└── use[Contexto]Utils.ts       # Utilidades específicas

📁 contexts/
└── [Contexto]Context.tsx       # Solo gestión de estado React
```

---

## 📊 **Estado Actual de Contextos**

### **✅ COMPLETADO**

- **CarritoContext**: Refactorización completa implementada

### **🔄 EN PROCESO**

- **ProductContext**: Ya tiene estructura avanzada, requiere separación de hooks

### **⏳ PENDIENTE**

- **AuthContext**: Requiere refactorización completa
- **FavoritosGlobalContext**: Requiere refactorización completa
- **OfertasGlobalContext**: Requiere refactorización completa
- **ThemeContext**: Requiere refactorización completa
- **NotificationContext**: Requiere refactorización completa
- **SearchContext**: Requiere refactorización completa

---

## 🚀 **Plan de Implementación por Fases**

### **FASE 1: ProductContext (Prioridad ALTA)**

- **Estado**: Estructura avanzada, requiere separación
- **Acciones**:
  - [ ] Crear `productService.ts` (ya existe, verificar)
  - [ ] Crear `useProduct.ts` (lógica de negocio)
  - [ ] Crear `useProductOperations.ts` (operaciones)
  - [ ] Crear `useProductUtils.ts` (utilidades)
  - [ ] Refactorizar `ProductContext.tsx` (solo estado)
- **Tiempo estimado**: 2-3 días
- **Dependencias**: Ninguna

### **FASE 2: AuthContext (Prioridad ALTA)**

- **Estado**: Contexto monolítico
- **Acciones**:
  - [ ] Crear `authService.ts`
  - [ ] Crear `useAuth.ts` (lógica de autenticación)
  - [ ] Crear `useAuthOperations.ts` (operaciones)
  - [ ] Crear `useAuthUtils.ts` (utilidades)
  - [ ] Refactorizar `AuthContext.tsx` (solo estado)
- **Tiempo estimado**: 2-3 días
- **Dependencias**: Ninguna

### **FASE 3: FavoritosGlobalContext (Prioridad MEDIA)**

- **Estado**: Contexto monolítico
- **Acciones**:
  - [ ] Crear `favoritosService.ts`
  - [ ] Crear `useFavoritos.ts` (lógica de favoritos)
  - [ ] Crear `useFavoritosOperations.ts` (operaciones)
  - [ ] Crear `useFavoritosUtils.ts` (utilidades)
  - [ ] Refactorizar `FavoritosGlobalContext.tsx` (solo estado)
- **Tiempo estimado**: 2-3 días
- **Dependencias**: AuthContext refactorizado

### **FASE 4: OfertasGlobalContext (Prioridad MEDIA)**

- **Estado**: Contexto monolítico
- **Acciones**:
  - [ ] Crear `ofertasService.ts`
  - [ ] Crear `useOfertas.ts` (lógica de ofertas)
  - [ ] Crear `useOfertasOperations.ts` (operaciones)
  - [ ] Crear `useOfertasUtils.ts` (utilidades)
  - [ ] Refactorizar `OfertasGlobalContext.tsx` (solo estado)
- **Tiempo estimado**: 2-3 días
- **Dependencias**: ProductContext refactorizado

### **FASE 5: Contextos Menores (Prioridad BAJA)**

- **ThemeContext**: Gestión de tema
- **NotificationContext**: Sistema de notificaciones
- **SearchContext**: Búsqueda y filtros
- **Tiempo estimado**: 1-2 días por contexto
- **Dependencias**: Contextos principales refactorizados

---

## 🔧 **Patrón de Implementación Estándar**

### **1. Crear Servicio**

```typescript
// services/[contexto]Service.ts
export class [Contexto]Service {
  static async [operacion](): Promise<[TipoRespuesta]> {
    const response = await axiosInstance.[metodo]('/[endpoint]');
    return response.data;
  }
}
```

### **2. Crear Hook de Lógica**

```typescript
// hooks/use[Contexto].ts
export const use[Contexto] = () => {
  const { isAuthenticated } = useAuth();

  const [funcion] = useCallback(([parametros]) => {
    // Lógica pura de negocio
  }, [dependencias]);

  return { [funcion] };
};
```

### **3. Crear Hook de Operaciones**

```typescript
// hooks/use[Contexto]Operations.ts
export const use[Contexto]Operations = () => {
  const { [funcion] } = use[Contexto]();

  const [operacion] = useCallback(async ([parametros]) => {
    // Validación
    // Llamada al servicio
    // Manejo de respuesta/error
  }, [dependencias]);

  return { [operacion] };
};
```

### **4. Crear Hook de Utilidades**

```typescript
// hooks/use[Contexto]Utils.ts
export const use[Contexto]Utils = () => {
  const [utilidad] = useCallback(([parametros]) => {
    // Funciones auxiliares específicas
  }, [dependencias]);

  return { [utilidad] };
};
```

### **5. Refactorizar Contexto**

```typescript
// contexts/[Contexto]Context.tsx
export const [Contexto]Provider = ({ children }) => {
  const [state, dispatch] = useReducer([reducer], [estadoInicial]);

  // Usar hooks de operaciones
  const { [operacion] } = use[Contexto]Operations();

  // Solo lógica de estado y dispatch
  const [funcion] = useCallback(async ([parametros]) => {
    try {
      const resultado = await [operacion]([parametros]);
      dispatch({ type: '[ACCION]', payload: resultado });
    } catch (error) {
      dispatch({ type: 'ESTABLECER_ERROR', payload: error.message });
    }
  }, [dependencias]);

  return (
    <[Contexto]Context.Provider value={contextValue}>
      {children}
    </[Contexto]Context.Provider>
  );
};
```

---

## 📋 **Checklist de Verificación por Contexto**

### **✅ CarritoContext (COMPLETADO)**

- [x] Servicio separado
- [x] Hooks personalizados
- [x] Contexto refactorizado
- [x] Errores de linter corregidos
- [x] Estilo de comentarios actualizado
- [x] Documentación completa

### **⏳ ProductContext (EN PROCESO)**

- [ ] Servicio separado
- [ ] Hooks personalizados
- [ ] Contexto refactorizado
- [ ] Errores de linter corregidos
- [ ] Estilo de comentarios actualizado
- [ ] Documentación actualizada

### **⏳ AuthContext (PENDIENTE)**

- [ ] Servicio separado
- [ ] Hooks personalizados
- [ ] Contexto refactorizado
- [ ] Errores de linter corregidos
- [ ] Estilo de comentarios actualizado
- [ ] Documentación creada

### **⏳ FavoritosGlobalContext (PENDIENTE)**

- [ ] Servicio separado
- [ ] Hooks personalizados
- [ ] Contexto refactorizado
- [ ] Errores de linter corregidos
- [ ] Estilo de comentarios actualizado
- [ ] Documentación creada

### **⏳ OfertasGlobalContext (PENDIENTE)**

- [ ] Servicio separado
- [ ] Hooks personalizados
- [ ] Contexto refactorizado
- [ ] Errores de linter corregidos
- [ ] Estilo de comentarios actualizado
- [ ] Documentación creada

---

## 🧪 **Testing y Calidad**

### **Estrategia de Testing**

- **Servicios**: Mock de axios para testing de API
- **Hooks**: Testing de lógica pura con renderHook
- **Contextos**: Testing de estado y dispatch
- **Integración**: Testing de flujos completos

### **Métricas de Calidad**

- **Coverage**: Mínimo 80% de cobertura
- **Linting**: 0 errores de ESLint
- **TypeScript**: 0 errores de tipos
- **Performance**: Sin re-renders innecesarios

---

## 📚 **Documentación y Estándares**

### **Archivos de Documentación**

- `README_[CONTEXTO]_REFACTOR.md` para cada contexto
- `PLAN_REFACTORIZACION_CONTEXTOS.md` (este documento)
- `ESTANDARES_IMPLEMENTACION.md` (patrones y convenciones)

### **Estándares de Código**

- Separadores de sección consistentes (`// ============================================================================`)
- Comentarios JSDoc para funciones públicas
- Nomenclatura consistente en todos los archivos
- Estructura de imports organizada

---

## 🚨 **Riesgos y Mitigaciones**

### **Riesgos Identificados**

1. **Breaking Changes**: Cambios que rompan funcionalidad existente
2. **Dependencias Circulares**: Hooks que dependan entre sí
3. **Performance**: Degradación por over-engineering
4. **Testing**: Dificultad para testear nueva arquitectura

### **Estrategias de Mitigación**

1. **Implementación Gradual**: Refactorizar un contexto a la vez
2. **Testing Exhaustivo**: Verificar funcionalidad antes y después
3. **Rollback Plan**: Capacidad de revertir cambios rápidamente
4. **Documentación**: Guías claras para desarrolladores

---

## 📅 **Cronograma Estimado**

### **Semana 1-2**

- ProductContext refactorización
- AuthContext refactorización

### **Semana 3-4**

- FavoritosGlobalContext refactorización
- OfertasGlobalContext refactorización

### **Semana 5-6**

- Contextos menores
- Testing y documentación final

### **Total Estimado**: 6-8 semanas

---

## 🎯 **Criterios de Éxito**

### **Técnicos**

- [ ] Todos los contextos refactorizados
- [ ] 0 errores de linter
- [ ] 0 errores de TypeScript
- [ ] Performance mantenida o mejorada
- [ ] Tests pasando al 100%

### **Funcionales**

- [ ] Funcionalidad existente preservada
- [ ] No breaking changes para usuarios
- [ ] Mejor experiencia de desarrollo
- [ ] Código más mantenible

### **Organizacionales**

- [ ] Patrón establecido para futuros contextos
- [ ] Documentación completa y actualizada
- [ ] Equipo capacitado en nueva arquitectura
- [ ] Proceso de refactorización documentado

---

## 🔄 **Próximos Pasos Inmediatos**

1. **Verificar ProductContext**: Analizar qué hooks ya existen
2. **Planificar AuthContext**: Identificar dependencias y complejidad
3. **Crear Templates**: Establecer plantillas para nuevos hooks
4. **Documentar Patrones**: Crear guías de implementación

---

Este plan establece la hoja de ruta para transformar completamente la arquitectura de contextos de la aplicación, siguiendo el patrón exitoso implementado en CarritoContext y estableciendo estándares consistentes para el desarrollo futuro.

---

**[⬆ Volver arriba](#tabla-de-contenidos)** | **[📚 Documentación](../../../docs/README.md)** | **[🏠 Inicio](../../../README.md)**
