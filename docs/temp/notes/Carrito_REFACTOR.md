# 🛒 Sistema de Carrito Refactorizado - Arquitectura Separada

## 📋 **Resumen de la Refactorización**

Se ha refactorizado completamente el sistema del carrito siguiendo las **buenas prácticas de separación de responsabilidades**, implementando una arquitectura moderna y escalable que separa claramente el contexto, servicios y hooks personalizados.

---

## 🏗️ **Nueva Arquitectura Implementada**

### **Antes (Monolítico)**

```
CarritoContext.tsx
├── Interfaces y tipos
├── Lógica de negocio
├── Llamadas a API
├── Gestión de estado
└── Hooks personalizados
```

### **Después (Separado)**

```
📁 services/
└── carritoService.ts          # API + Tipos + Interfaces

📁 hooks/
├── useCarrito.ts              # Lógica de negocio pura
├── useCarritoOperations.ts    # Operaciones coordinadas
└── useCarritoUtils.ts         # Utilidades específicas

📁 contexts/
└── CarritoContext.tsx         # Solo gestión de estado React
```

---

## 🔧 **Componentes de la Nueva Arquitectura**

### 1. **`carritoService.ts` - Capa de Servicio**

- **Responsabilidad**: Comunicación con la API y definición de tipos
- **Contiene**:
  - Interfaces y tipos del carrito
  - Métodos HTTP (GET, POST, PUT, DELETE)
  - Manejo de respuestas del servidor
  - Tipos de respuesta estructurados
- **Ventajas**:
  - Reutilizable en otros contextos
  - Fácil de testear
  - Separación clara de la lógica de red
  - Tipos TypeScript bien definidos

```typescript
export class CarritoService {
  static async obtenerCarrito(): Promise<CarritoResponse>
  static async agregarItem(...): Promise<ItemResponse>
  static async actualizarCantidad(...): Promise<ItemResponse>
  static async eliminarItem(...): Promise<EliminarItemResponse>
  static async vaciarCarrito(): Promise<{ mensaje: string }>
  static async confirmarCompra(...): Promise<{ venta: VentaConfirmada }>
}
```

### 2. **`useCarrito.ts` - Hook de Lógica de Negocio**

- **Responsabilidad**: Lógica pura del carrito
- **Contiene**:
  - Validaciones de autenticación
  - Cálculos matemáticos
  - Transformaciones de datos
  - Lógica de negocio pura
- **Ventajas**:
  - Reutilizable en cualquier componente
  - Fácil de testear (lógica pura)
  - Independiente del estado de React
  - Sin dependencias externas

```typescript
export const useCarrito = () => {
  const isProductInCart = useCallback(...)
  const validateQuantity = useCallback(...)
  const calculateTotal = useCallback(...)
  const validateCarritoOperation = useCallback(...)
  const handleCarritoError = useCallback(...)
  // ... más utilidades
}
```

### 3. **`useCarritoOperations.ts` - Hook de Operaciones**

- **Responsabilidad**: Coordinación entre lógica y API
- **Contiene**:
  - Validaciones antes de operaciones
  - Manejo centralizado de errores
  - Preparación de datos
  - Llamadas al servicio
  - Orquestación de operaciones
- **Ventajas**:
  - Orquesta la lógica de negocio con la API
  - Manejo centralizado de errores
  - Validaciones consistentes
  - Separación clara de responsabilidades

```typescript
export const useCarritoOperations = () => {
  const agregarItem = useCallback(async (...) => {
    // 1. Validar operación
    // 2. Preparar datos
    // 3. Llamar servicio
    // 4. Manejar respuesta/error
  }, [])
  // ... más operaciones
}
```

### 4. **`useCarritoUtils.ts` - Hook de Utilidades**

- **Responsabilidad**: Funciones auxiliares específicas
- **Contiene**:
  - Cálculos estadísticos
  - Filtros y agrupaciones
  - Validaciones específicas
  - Transformaciones de datos
  - Funciones de análisis
- **Ventajas**:
  - Funcionalidades específicas reutilizables
  - No depende del estado del contexto
  - Útil para componentes que solo necesitan utilidades
  - Funciones matemáticas puras

```typescript
export const useCarritoUtils = () => {
  const obtenerEstadisticas = useCallback(...)
  const agruparItemsPorProducto = useCallback(...)
  const calcularDescuento = useCallback(...)
  const verificarStockDisponible = useCallback(...)
  // ... más utilidades
}
```

### 5. **`CarritoContext.tsx` - Contexto Refactorizado**

- **Responsabilidad**: Solo gestión de estado React
- **Contiene**:
  - Reducer para el estado
  - Integración con hooks de operaciones
  - Dispatch de acciones
  - Memoización del contexto
  - Efectos de sincronización
- **Ventajas**:
  - Enfoque único en el estado
  - Más fácil de mantener
  - Mejor separación de responsabilidades
  - Integración limpia con otros contextos

---

## 🎯 **Beneficios de la Refactorización**

### **1. Separación de Responsabilidades**

- **Servicio**: Solo API y tipos
- **Hooks**: Solo lógica de negocio
- **Contexto**: Solo estado de React

### **2. Reutilización**

- Los hooks pueden usarse en otros contextos
- El servicio puede usarse en otros componentes
- Las utilidades son independientes

### **3. Testabilidad**

- Lógica de negocio pura (fácil de testear)
- Servicios mockeables
- Hooks aislados

### **4. Mantenibilidad**

- Código más organizado y legible
- Cambios localizados
- Menor acoplamiento

### **5. Escalabilidad**

- Fácil agregar nuevas funcionalidades
- Estructura clara para nuevos desarrolladores
- Patrón consistente en toda la aplicación

---

## 📱 **Ejemplos de Uso**

### **Uso del Hook de Lógica**

```typescript
import { useCarrito } from "../hooks/useCarrito";

const MiComponente = () => {
  const { isProductInCart, validateQuantity } = useCarrito();

  const puedeAgregar = validateQuantity(5, stockDisponible);
  const yaEstaEnCarrito = isProductInCart(items, idProducto);

  // ... lógica del componente
};
```

### **Uso del Hook de Operaciones**

```typescript
import { useCarritoOperations } from "../hooks/useCarritoOperations";

const MiComponente = () => {
  const { agregarItem, actualizarCantidad } = useCarritoOperations();

  const handleAgregar = async () => {
    try {
      await agregarItem(idProducto, cantidad);
      // Manejar éxito
    } catch (error) {
      // Manejar error
    }
  };
};
```

### **Uso del Hook de Utilidades**

```typescript
import { useCarritoUtils } from "../hooks/useCarritoUtils";

const MiComponente = () => {
  const { obtenerEstadisticas, calcularDescuento } = useCarritoUtils();

  const stats = obtenerEstadisticas(items);
  const { total, descuento } = calcularDescuento(items, 10);

  // ... mostrar estadísticas
};
```

---

## 🔄 **Migración de Código Existente**

### **Antes**

```typescript
// En CarritoContext.tsx
const agregarItem = useCallback(async (id_producto, cantidad) => {
  // Lógica de validación
  // Llamada a API
  // Manejo de respuesta
  // Actualización de estado
}, []);
```

### **Después**

```typescript
// En useCarritoOperations.ts
const agregarItem = useCallback(
  async (id_producto, cantidad) => {
    const validation = validateCarritoOperation();
    if (!validation.isValid) throw new Error(validation.error);

    const resultado = await CarritoService.agregarItem(id_producto, cantidad);
    return resultado;
  },
  [validateCarritoOperation]
);

// En CarritoContext.tsx
const agregarItem = useCallback(
  async (id_producto, cantidad) => {
    try {
      const resultado = await agregarItemService(id_producto, cantidad);
      dispatch({ type: "AGREGAR_ITEM", payload: resultado.item });
    } catch (error) {
      dispatch({ type: "ESTABLECER_ERROR", payload: error.message });
    }
  },
  [agregarItemService]
);
```

---

## 🧪 **Testing de la Nueva Arquitectura**

### **Testing del Servicio**

```typescript
describe("CarritoService", () => {
  it("debe obtener el carrito correctamente", async () => {
    const mockResponse = { carrito: mockCarrito };
    axiosInstance.get.mockResolvedValue({ data: mockResponse });

    const resultado = await CarritoService.obtenerCarrito();
    expect(resultado).toEqual(mockResponse);
  });
});
```

### **Testing del Hook de Lógica**

```typescript
describe("useCarrito", () => {
  it("debe validar cantidad correctamente", () => {
    const { validateQuantity } = renderHook(() => useCarrito()).result.current;

    const resultado = validateQuantity(5, 10);
    expect(resultado.isValid).toBe(true);

    const resultadoInvalido = validateQuantity(15, 10);
    expect(resultadoInvalido.isValid).toBe(false);
  });
});
```

### **Testing del Hook de Operaciones**

```typescript
describe("useCarritoOperations", () => {
  it("debe agregar item correctamente", async () => {
    const { agregarItem } = renderHook(() => useCarritoOperations()).result
      .current;

    const resultado = await agregarItem(1, 2);
    expect(resultado.item.id_producto).toBe(1);
    expect(resultado.item.cantidad).toBe(2);
  });
});
```

---

## 🚀 **Próximos Pasos**

### **1. Implementación Gradual**

- [x] Crear servicios separados
- [x] Crear hooks personalizados
- [x] Refactorizar contexto
- [x] Corregir errores de linter
- [x] Actualizar estilo de comentarios
- [ ] Migrar componentes existentes
- [ ] Agregar tests unitarios

### **2. Mejoras Futuras**

- [ ] Cache de operaciones del carrito
- [ ] Optimización de re-renders
- [ ] Manejo offline del carrito
- [ ] Sincronización en tiempo real

### **3. Aplicar Patrón a Otros Contextos**

- [x] CarritoContext (COMPLETADO)
- [ ] AuthContext
- [ ] ProductContext
- [ ] FavoritosContext
- [ ] OfertasContext

---

## 📚 **Referencias y Patrones Utilizados**

- **Single Responsibility Principle**: Cada archivo tiene una responsabilidad única
- **Dependency Inversion**: Los hooks dependen de abstracciones, no de implementaciones
- **Composition over Inheritance**: Uso de composición de hooks
- **Separation of Concerns**: Separación clara entre capas
- **React Best Practices**: Uso correcto de useCallback, useMemo y useReducer
- **TypeScript Best Practices**: Uso de tipos estrictos y importaciones de tipo

---

## 🔍 **Verificación de Funcionamiento**

### **Integración con Otros Contextos**

- ✅ **AuthContext**: Verificación de autenticación
- ✅ **ProductContext**: Sincronización de productos
- ✅ **OfertasContext**: Integración con ofertas
- ✅ **FavoritosContext**: Compatibilidad con favoritos

### **Manejo de Errores**

- ✅ Validación de autenticación
- ✅ Manejo de errores de API
- ✅ Sincronización automática en caso de error
- ✅ Mensajes de error descriptivos

### **Performance**

- ✅ Memoización de valores del contexto
- ✅ useCallback para funciones
- ✅ useMemo para cálculos costosos
- ✅ Reducción de re-renders innecesarios

---

Esta refactorización establece un **patrón sólido y escalable** para el desarrollo futuro de la aplicación, siguiendo las mejores prácticas de React, TypeScript y arquitectura de software. El sistema está listo para ser aplicado a otros contextos siguiendo la misma estructura.

---

**[⬆ Volver arriba](#tabla-de-contenidos)** | **[📚 Documentación](../../../docs/README.md)** | **[🏠 Inicio](../../../README.md)**
