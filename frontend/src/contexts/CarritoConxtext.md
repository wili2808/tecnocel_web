# 🛒 DOCUMENTACIÓN COMPLETA DEL CONTEXTO DE CARRITO

## 📋 **RESUMEN EJECUTIVO**

El **CarritoContext** es el núcleo del sistema de carrito de compras de TecnoCel Web. Implementa un patrón de arquitectura moderna con **useReducer** para gestión de estado, **useCallback** para optimización de rendimiento, y **separación de responsabilidades** entre contexto, hooks y servicios.

---

## 🏗️ **ARQUITECTURA DEL SISTEMA**

### **Estructura de Archivos**

```
📁 contexts/
└── CarritoContext.tsx          # Contexto principal del carrito

📁 hooks/
├── useCarrito.ts               # Lógica de negocio del carrito
├── useCarritoOperations.ts     # Operaciones coordinadas
└── useCarritoUtils.ts          # Utilidades y cálculos

📁 services/
└── carritoService.ts           # API y tipos del carrito
```

### **Flujo de Datos**

```
Componente → useCarrito() → CarritoContext → useCarritoOperations → carritoService → Backend
     ↑                                                                                ↓
     ←─────────────── Estado Actualizado ←─── Dispatch ←─── Response ←───────────────
```

---

## 🔧 **IMPLEMENTACIÓN TÉCNICA**

### **1. Patrón de Estado (useReducer)**

El contexto utiliza **useReducer** para manejar el estado complejo del carrito de manera predecible y mantenible.

#### **Estado del Carrito**

```typescript
interface EstadoCarrito {
  id_carrito: number | null; // ID único del carrito
  estado: "activo" | "completado" | "abandonado"; // Estado del carrito
  items: ItemCarrito[]; // Lista de productos
  total_carrito: number; // Total monetario
  cantidad_items: number; // Cantidad de items únicos
  cargando: boolean; // Estado de carga
  error: string | null; // Mensaje de error
}
```

#### **Acciones del Reducer**

```typescript
type AccionCarrito =
  | { type: "INICIALIZAR_CARRITO"; payload: EstadoCarrito }
  | { type: "INICIALIZAR_CARRITO_VACIO" }
  | { type: "AGREGAR_ITEM"; payload: ItemCarrito }
  | {
      type: "ACTUALIZAR_ITEM";
      payload: { id_item: number; cantidad: number; subtotal: number };
    }
  | { type: "ELIMINAR_ITEM"; payload: number }
  | { type: "VACIAR_CARRITO" }
  | { type: "ESTABLECER_CARGANDO"; payload: boolean }
  | { type: "ESTABLECER_ERROR"; payload: string | null }
  | { type: "ACTUALIZAR_TOTAL"; payload: number };
```

### **2. Optimización de Rendimiento**

#### **useCallback para Funciones**

Todas las funciones del contexto están envueltas en `useCallback` para evitar recreaciones innecesarias.

#### **useMemo para el Context Value**

El valor del contexto se memoiza para prevenir re-renders de componentes hijos.

```typescript
const contextValue = useMemo(
  () => ({
    estado,
    obtenerCarrito,
    agregarItem,
    // ... otros métodos
  }),
  [
    estado,
    obtenerCarrito,
    agregarItem,
    // ... dependencias
  ]
);
```

---

## 📚 **INTERFACES Y TIPOS**

### **ItemCarrito**

```typescript
export interface ItemCarrito {
  id_item: number; // ID único del item
  id_carrito: number; // ID del carrito al que pertenece
  id_producto: number; // ID del producto
  cantidad: number; // Cantidad del producto
  precio_unitario: number; // Precio por unidad
  subtotal: number; // Total del item (cantidad * precio)
  fyh_creacion: string; // Fecha de creación
  fyh_actualizacion: string; // Fecha de última actualización
  producto?: {
    // Información del producto (opcional)
    id_producto: number;
    nombre: string;
    descripcion: string;
    precio_venta: string;
    imagen: string;
    stock: number;
  };
}
```

### **DatosCompra**

```typescript
export interface DatosCompra {
  observaciones?: string; // Observaciones de la compra
  moneda?: "BOB" | "USD" | "EUR"; // Moneda de pago
  metodo_pago?: "efectivo" | "tarjeta" | "transferencia" | "qr";
}
```

### **VentaConfirmada**

```typescript
export interface VentaConfirmada {
  id_venta: number; // ID único de la venta
  nro_venta: number; // Número de venta
  total_pagado: number; // Total pagado
  fyh_creacion: string; // Fecha de creación de la venta
}
```

---

## 🚀 **FUNCIONALIDADES PRINCIPALES**

### **1. Gestión del Carrito**

#### **obtenerCarrito()**

- **Propósito**: Obtiene el carrito activo del usuario autenticado
- **Comportamiento**:
  - Verifica autenticación
  - Llama al servicio backend
  - Actualiza el estado local
  - Maneja errores y sincronización
- **Uso**: Llamado automáticamente al autenticarse

```typescript
const { obtenerCarrito } = useCarrito();
await obtenerCarrito();
```

#### **agregarItem(id_producto, cantidad)**

- **Propósito**: Agrega un producto al carrito
- **Parámetros**:
  - `id_producto`: ID del producto a agregar
  - `cantidad`: Cantidad del producto
- **Comportamiento**:
  - Verifica autenticación
  - Si el producto ya existe, actualiza la cantidad
  - Si es nuevo, lo agrega al carrito
  - Recalcula totales automáticamente
  - Sincroniza con el backend

```typescript
const { agregarItem } = useCarrito();
await agregarItem(123, 2); // Agregar 2 unidades del producto 123
```

#### **actualizarCantidad(id_item, cantidad)**

- **Propósito**: Modifica la cantidad de un item existente
- **Parámetros**:
  - `id_item`: ID del item en el carrito
  - `cantidad`: Nueva cantidad
- **Comportamiento**:
  - Actualiza la cantidad localmente
  - Sincroniza con el backend
  - Recalcula totales

```typescript
const { actualizarCantidad } = useCarrito();
await actualizarCantidad(456, 5); // Cambiar cantidad del item 456 a 5
```

#### **eliminarItem(id_item)**

- **Propósito**: Elimina un producto del carrito
- **Parámetros**:
  - `id_item`: ID del item a eliminar
- **Comportamiento**:
  - Elimina el item del estado local
  - Sincroniza con el backend
  - Recalcula totales

```typescript
const { eliminarItem } = useCarrito();
await eliminarItem(456); // Eliminar el item 456
```

#### **vaciarCarrito()**

- **Propósito**: Elimina todos los productos del carrito
- **Comportamiento**:
  - Limpia el carrito localmente
  - Sincroniza con el backend
  - Resetea totales y contadores

```typescript
const { vaciarCarrito } = useCarrito();
await vaciarCarrito(); // Vaciar todo el carrito
```

### **2. Proceso de Compra**

#### **confirmarCompra(datosCompra)**

- **Propósito**: Finaliza la compra y convierte el carrito en venta
- **Parámetros**:
  - `datosCompra`: Información de la compra (observaciones, moneda, método de pago)
- **Comportamiento**:
  - Valida autenticación
  - Envía datos al backend
  - Crea la venta
  - Limpia el carrito automáticamente
  - Retorna información de la venta confirmada

```typescript
const { confirmarCompra } = useCarrito();
const venta = await confirmarCompra({
  observaciones: "Envío a domicilio",
  moneda: "BOB",
  metodo_pago: "tarjeta",
});
```

### **3. Utilidades y Consultas**

#### **isProductInCart(id_producto)**

- **Propósito**: Verifica si un producto está en el carrito
- **Retorna**: `boolean`
- **Uso**: Para mostrar indicadores visuales o botones

```typescript
const { isProductInCart } = useCarrito();
const enCarrito = isProductInCart(123);
// Muestra: "En Carrito" si true, "Agregar al Carrito" si false
```

#### **getProductQuantityInCart(id_producto)**

- **Propósito**: Obtiene la cantidad actual de un producto en el carrito
- **Retorna**: `number` (0 si no está en el carrito)
- **Uso**: Para mostrar cantidades o validar límites

```typescript
const { getProductQuantityInCart } = useCarrito();
const cantidad = getProductQuantityInCart(123);
// Muestra: "Cantidad: 3" o similar
```

#### **canAddMoreOfProduct(id_producto, stock)**

- **Propósito**: Verifica si se puede agregar más cantidad de un producto
- **Parámetros**:
  - `id_producto`: ID del producto
  - `stock`: Stock disponible del producto
- **Retorna**: `boolean`
- **Uso**: Para habilitar/deshabilitar botones de agregar

```typescript
const { canAddMoreOfProduct } = useCarrito();
const puedeAgregar = canAddMoreOfProduct(123, 10);
// Habilita botón si true, deshabilita si false
```

#### **sincronizarCarrito()**

- **Propósito**: Fuerza la sincronización del carrito con el servidor
- **Uso**: Para resolver inconsistencias o después de errores

```typescript
const { sincronizarCarrito } = useCarrito();
await sincronizarCarrito(); // Sincronizar manualmente
```

---

## 🔄 **ESTADOS Y FLUJOS**

### **Estados del Carrito**

1. **activo**: Carrito en uso, se pueden agregar/modificar productos
2. **completado**: Carrito convertido en venta
3. **abandonado**: Carrito descartado o expirado

### **Estados de UI**

- **cargando**: `true` durante operaciones asíncronas
- **error**: Mensaje de error si algo falla
- **items**: Array de productos en el carrito
- **total_carrito**: Suma total de todos los items

### **Flujo de Agregar Producto**

```
1. Usuario hace clic en "Agregar al Carrito"
2. Se valida autenticación
3. Se establece estado de carga
4. Se envía petición al backend
5. Se actualiza el estado local
6. Se recalcula total
7. Se limpia estado de carga
8. Se muestra confirmación o error
```

### **Flujo de Confirmar Compra**

```
1. Usuario hace clic en "Confirmar Compra"
2. Se valida autenticación
3. Se establece estado de carga
4. Se envían datos de compra al backend
5. Se crea la venta
6. Se limpia el carrito
7. Se redirige a confirmación
8. Se limpia estado de carga
```

---

## 🛡️ **MANEJO DE ERRORES**

### **Tipos de Errores**

1. **Errores de Autenticación**: Usuario no autenticado
2. **Errores de Validación**: Datos inválidos
3. **Errores de Stock**: Producto sin stock suficiente
4. **Errores de Red**: Problemas de conexión
5. **Errores del Servidor**: Problemas en el backend

### **Estrategia de Recuperación**

- **Sincronización Automática**: En caso de error, se sincroniza el carrito
- **Mensajes Informativos**: Errores claros para el usuario
- **Estado Consistente**: El estado local se mantiene sincronizado
- **Fallback**: Si la sincronización falla, se resetea el carrito

---

## 🔒 **SEGURIDAD Y VALIDACIONES**

### **Validaciones de Autenticación**

- Todas las operaciones requieren usuario autenticado
- Verificación automática de tokens
- Redirección a login si no está autenticado

### **Validaciones de Datos**

- Cantidades positivas
- Stock disponible
- Productos válidos
- Límites de carrito

### **Rate Limiting**

- Protección contra spam de operaciones
- Límites por usuario y por operación
- Cooldown entre operaciones repetidas

---

## 📱 **INTEGRACIÓN CON COMPONENTES**

### **Componentes que Usan el Carrito**

1. **Cart.tsx**: Página principal del carrito
2. **CartItem.tsx**: Item individual del carrito
3. **CartSummary.tsx**: Resumen de compra
4. **ProductCard.tsx**: Botones de agregar al carrito
5. **CartIndicator.tsx**: Indicador visual en productos

### **Ejemplo de Uso Básico**

```typescript
import React from "react";
import { useCarrito } from "../contexts/CarritoContext";

const ProductoComponent: React.FC<{ producto: any }> = ({ producto }) => {
  const { agregarItem, isProductInCart, canAddMoreOfProduct } = useCarrito();

  const handleAgregarAlCarrito = async () => {
    try {
      await agregarItem(producto.id_producto, 1);
      // Mostrar notificación de éxito
    } catch (error) {
      // Manejar error
    }
  };

  const enCarrito = isProductInCart(producto.id_producto);
  const puedeAgregar = canAddMoreOfProduct(
    producto.id_producto,
    producto.stock
  );

  return (
    <div>
      <h3>{producto.nombre}</h3>
      <p>Stock: {producto.stock}</p>

      {enCarrito ? (
        <span>✅ En Carrito</span>
      ) : (
        <button onClick={handleAgregarAlCarrito} disabled={!puedeAgregar}>
          {puedeAgregar ? "Agregar al Carrito" : "Sin Stock"}
        </button>
      )}
    </div>
  );
};
```

---

## 🧪 **TESTING Y DEBUGGING**

### **Logs y Debugging**

- Console logs en todas las operaciones
- Información detallada de errores
- Estado del carrito visible en React DevTools

### **Casos de Prueba**

1. **Agregar producto nuevo**
2. **Actualizar cantidad existente**
3. **Eliminar producto**
4. **Vaciar carrito completo**
5. **Confirmar compra**
6. **Manejo de errores**
7. **Sincronización automática**

---

## 🚀 **OPTIMIZACIONES IMPLEMENTADAS**

### **1. Memoización**

- **useCallback**: Para todas las funciones
- **useMemo**: Para el valor del contexto
- **React.memo**: Para componentes que usan el carrito

### **2. Reducción de Re-renders**

- Estado optimizado con useReducer
- Context value memoizado
- Dependencias mínimas en useCallback

### **3. Lazy Loading**

- Carga del carrito solo cuando es necesario
- Sincronización bajo demanda
- Operaciones asíncronas optimizadas

---

## 🔮 **FUTURAS MEJORAS**

### **Funcionalidades Planificadas**

1. **Persistencia Local**: Guardar carrito en localStorage
2. **Sincronización Offline**: Operaciones sin conexión
3. **Carritos Múltiples**: Listas de deseos, carritos guardados
4. **Notificaciones Push**: Alertas de stock o precios
5. **Analytics**: Seguimiento de comportamiento de compra

### **Optimizaciones Técnicas**

1. **Service Worker**: Cache de productos
2. **WebSockets**: Sincronización en tiempo real
3. **IndexedDB**: Almacenamiento local avanzado
4. **PWA**: Funcionalidad offline completa

---

## 📚 **REFERENCIAS Y RECURSOS**

### **Documentación Relacionada**

- [README_CARRITO_REFACTOR.md](../hooks/README_CARRITO_REFACTOR.md)
- [DOCUMENTACION_BACKEND_API.md](../../../backend/Implementacion_doc/DOCUMENTACION_BACKEND_API.md)
- [MEJORAS_IMPLEMENTADAS.md](../../components/cart/CartIndicator/MEJORAS_IMPLEMENTADAS.md)

### **Tecnologías Utilizadas**

- **React 18.2.0**: Hooks y Context API
- **TypeScript 5.3.3**: Tipado estático
- **useReducer**: Gestión de estado complejo
- **useCallback/useMemo**: Optimización de rendimiento
- **Axios**: Cliente HTTP para API

---

## 🎯 **CONCLUSIÓN**

El **CarritoContext** representa una implementación robusta y escalable del sistema de carrito de compras. Su arquitectura modular, manejo optimizado del estado, y separación clara de responsabilidades lo convierten en una base sólida para futuras funcionalidades.

**Características Destacadas:**

- ✅ **Arquitectura Moderna**: Patrón Context + useReducer
- ✅ **Optimización de Rendimiento**: Memoización completa
- ✅ **Manejo de Errores**: Recuperación automática y sincronización
- ✅ **TypeScript**: Tipado completo y seguro
- ✅ **Separación de Responsabilidades**: Contexto, hooks y servicios
- ✅ **Escalabilidad**: Fácil de extender y mantener

**Este contexto está listo para producción y puede manejar cargas de trabajo significativas mientras mantiene un rendimiento óptimo y una experiencia de usuario fluida.**
