**[Documentación](../../README.md)** | **[Inicio](../../../README.md)**
---

# Guía del Carrito de Compras

> Guía completa para implementar el flujo de carrito de compras desde agregar productos hasta confirmar la compra en TecnoCel Web.

---

## Tabla de Contenidos

- [Visión General](#visión-general)
- [Arquitectura del Carrito](#arquitectura-del-carrito)
- [Flujo Completo de Compra](#flujo-completo-de-compra)
- [1. Obtener Carrito Activo](#1-obtener-carrito-activo)
- [2. Agregar Producto al Carrito](#2-agregar-producto-al-carrito)
- [3. Actualizar Cantidad de un Item](#3-actualizar-cantidad-de-un-item)
- [4. Eliminar Item del Carrito](#4-eliminar-item-del-carrito)
- [5. Vaciar Carrito Completo](#5-vaciar-carrito-completo)
- [6. Confirmar Compra](#6-confirmar-compra)
- [7. Consultar Historial de Carritos](#7-consultar-historial-de-carritos)
- [Cálculo de Ofertas y Descuentos](#cálculo-de-ofertas-y-descuentos)
- [Sincronización Frontend-Backend](#sincronización-frontend-backend)
- [Manejo de Errores](#manejo-de-errores)
- [Implementación Frontend Completa](#implementación-frontend-completa)
- [Buenas Prácticas](#buenas-prácticas)

---

## Visión General

El sistema de carrito de TecnoCel Web implementa un carrito de compras persistente con las siguientes características:

- **Un carrito activo por cliente**: Solo puede haber un carrito en estado "activo" simultáneamente
- **Persistencia en BD**: El carrito se guarda en la base de datos (no solo localStorage)
- **Aplicación automática de ofertas**: Los precios con descuento se calculan en tiempo real
- **Validación de stock**: Verificación automática de disponibilidad al agregar/actualizar
- **Conversión a venta**: El carrito se convierte en una venta al confirmar la compra
- **Historial**: Los carritos completados se mantienen para historial de compras

---

## Arquitectura del Carrito

### Modelos de Base de Datos

**CarritoWeb** (el carrito principal):
```typescript
{
  id_carrito: number;
  id_cliente: number;
  estado: 'activo' | 'completado' | 'abandonado';
  total_carrito: Decimal;
  fyh_creacion: Date;
  fyh_actualizacion: Date;
}
```

**CarritoWebItems** (items individuales):
```typescript
{
  id_item: number;
  id_carrito: number;
  id_producto: number;
  cantidad: number;
  precio_unitario: Decimal;  // Precio al momento de agregar (con oferta si aplica)
  subtotal: Decimal;          // cantidad * precio_unitario
  fyh_creacion: Date;
  fyh_actualizacion: Date;
}
```

### Estados del Carrito

| Estado | Descripción |
|--------|-------------|
| `activo` | Carrito actual en uso por el cliente |
| `completado` | Compra confirmada y convertida en venta |
| `abandonado` | Carrito inactivo (implementación futura) |

---

## Flujo Completo de Compra

```
1. GET /api/carrito
   └─> Cliente obtiene su carrito activo (o se crea automáticamente)

2. POST /api/carrito/items
   └─> Agregar producto al carrito
       ├─> Verifica stock disponible
       ├─> Aplica ofertas activas
       └─> Actualiza total del carrito

3. PUT /api/carrito/items/:id_item
   └─> Cambiar cantidad de un producto
       ├─> Valida stock para nueva cantidad
       └─> Recalcula subtotal y total

4. DELETE /api/carrito/items/:id_item
   └─> Eliminar un producto específico
       └─> Recalcula total del carrito

5. POST /api/carrito/confirmar-compra
   └─> Finalizar compra
       ├─> Verifica stock final de todos los productos
       ├─> Crea registro de Venta
       ├─> Descuenta stock de productos
       └─> Marca carrito como "completado"
```

---

## 1. Obtener Carrito Activo

### Endpoint

```
GET /api/carrito
```

**Autenticación**: Requerida (verificarTokenCliente)

**Headers**: `Authorization: Bearer <JWT>`

**Descripción**:
- Retorna el carrito activo del cliente autenticado
- Si no existe carrito activo, crea uno nuevo automáticamente
- Incluye todos los items con productos, imágenes y ofertas aplicadas

**Respuesta Exitosa (200)**:

```json
{
  "carrito": {
    "id_carrito": 5,
    "id_cliente": 3,
    "estado": "activo",
    "items": [
      {
        "id_item": 12,
        "id_producto": 45,
        "cantidad": 2,
        "precio_unitario": 899.99,
        "subtotal": 1799.98,
        "producto": {
          "id_producto": 45,
          "nombre": "iPhone 13 Pro",
          "descripcion": "Smartphone de última generación",
          "precio_venta": 999.99,
          "stock": 15,
          "precio_original": 999.99,
          "precio_oferta": 899.99,
          "descuento_porcentaje": 10,
          "en_oferta": true,
          "imagen_url": "http://localhost:3000/api/uploads/productos/iPhone13_1234567890.jpg",
          "ofertas": [
            {
              "id_oferta": 2,
              "nombre_oferta": "Black Friday 2025",
              "tipo_descuento": "porcentaje",
              "valor_descuento": 10
            }
          ]
        }
      }
    ],
    "total_carrito": 1799.98,
    "cantidad_items": 1,
    "cargando": false,
    "error": null
  }
}
```

**Carrito vacío (200)**:

```json
{
  "carrito": {
    "id_carrito": 5,
    "id_cliente": 3,
    "estado": "activo",
    "items": [],
    "total_carrito": 0.00,
    "cantidad_items": 0,
    "cargando": false,
    "error": null
  }
}
```

### Ejemplo con JavaScript

```javascript
async function obtenerCarrito(token) {
  try {
    const response = await fetch('http://localhost:3000/api/carrito', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }

    const data = await response.json();
    return data.carrito;
  } catch (error) {
    console.error('Error al obtener carrito:', error);
    throw error;
  }
}
```

---

## 2. Agregar Producto al Carrito

### Endpoint

```
POST /api/carrito/items
```

**Autenticación**: Requerida

**Headers**: `Authorization: Bearer <JWT>`

**Body**:

```json
{
  "id_producto": 45,
  "cantidad": 2
}
```

**Validaciones automáticas**:
- Stock disponible suficiente
- Producto existe en el catálogo
- Cantidad es un número positivo
- Aplicación de ofertas vigentes

**Comportamiento**:
- Si el producto **ya existe** en el carrito: actualiza la cantidad sumando
- Si el producto **no existe**: crea un nuevo item

**Respuesta Exitosa (200)**:

```json
{
  "mensaje": "Producto agregado al carrito",
  "item": {
    "id_item": 12,
    "id_carrito": 5,
    "id_producto": 45,
    "cantidad": 2,
    "precio_unitario": 899.99,
    "subtotal": 1799.98,
    "producto": {
      "id_producto": 45,
      "nombre": "iPhone 13 Pro",
      "precio_oferta": 899.99,
      "en_oferta": true,
      "imagen_url": "http://..."
    }
  },
  "total_carrito": 1799.98
}
```

**Error 400: Stock insuficiente**:

```json
{
  "mensaje": "Stock insuficiente",
  "stock_disponible": 5
}
```

**Error 404: Producto no encontrado**:

```json
{
  "mensaje": "Producto no encontrado"
}
```

### Ejemplo con JavaScript

```javascript
async function agregarAlCarrito(token, idProducto, cantidad) {
  try {
    const response = await fetch('http://localhost:3000/api/carrito/items', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        id_producto: idProducto,
        cantidad: cantidad
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.mensaje || 'Error al agregar producto');
    }

    const data = await response.json();
    console.log('Producto agregado:', data.mensaje);
    console.log('Total del carrito:', data.total_carrito);
    return data;
  } catch (error) {
    console.error('Error:', error.message);
    throw error;
  }
}

// Uso
await agregarAlCarrito(miToken, 45, 2);
```

---

## 3. Actualizar Cantidad de un Item

### Endpoint

```
PUT /api/carrito/items/:id_item
```

**Autenticación**: Requerida

**Params**: `id_item` - ID del item en el carrito

**Body**:

```json
{
  "cantidad": 5
}
```

**Validaciones**:
- Stock disponible para la nueva cantidad
- Cantidad debe ser mayor a 0
- El item debe pertenecer al carrito activo del cliente

**Respuesta Exitosa (200)**:

```json
{
  "mensaje": "Cantidad actualizada exitosamente",
  "item": {
    "id_item": 12,
    "cantidad": 5,
    "precio_unitario": 899.99,
    "subtotal": 4499.95,
    "producto": { ... }
  },
  "total_carrito": 4499.95
}
```

**Error 400: Stock insuficiente**:

```json
{
  "mensaje": "Stock insuficiente",
  "stock_disponible": 3
}
```

### Ejemplo con JavaScript

```javascript
async function actualizarCantidad(token, idItem, nuevaCantidad) {
  try {
    const response = await fetch(`http://localhost:3000/api/carrito/items/${idItem}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        cantidad: nuevaCantidad
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.mensaje);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error al actualizar cantidad:', error);
    throw error;
  }
}
```

---

## 4. Eliminar Item del Carrito

### Endpoint

```
DELETE /api/carrito/items/:id_item
```

**Autenticación**: Requerida

**Params**: `id_item` - ID del item a eliminar

**Respuesta Exitosa (200)**:

```json
{
  "mensaje": "Producto eliminado del carrito",
  "total_carrito": 0.00
}
```

### Ejemplo con JavaScript

```javascript
async function eliminarDelCarrito(token, idItem) {
  try {
    const response = await fetch(`http://localhost:3000/api/carrito/items/${idItem}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Error al eliminar producto');
    }

    const data = await response.json();
    console.log('Producto eliminado. Nuevo total:', data.total_carrito);
    return data;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}
```

---

## 5. Vaciar Carrito Completo

### Endpoint

```
DELETE /api/carrito
```

**Autenticación**: Requerida

**Descripción**: Elimina todos los items del carrito pero mantiene el carrito en estado "activo"

**Respuesta Exitosa (200)**:

```json
{
  "mensaje": "Carrito vaciado exitosamente",
  "total_carrito": 0.00
}
```

### Ejemplo con JavaScript

```javascript
async function vaciarCarrito(token) {
  try {
    const response = await fetch('http://localhost:3000/api/carrito', {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Error al vaciar carrito');
    }

    const data = await response.json();
    console.log(data.mensaje);
    return data;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}
```

---

## 6. Confirmar Compra

### Endpoint

```
POST /api/carrito/confirmar-compra
```

**Autenticación**: Requerida

**Body** (opcional):

```json
{
  "observaciones": "Entrega a domicilio en horario de oficina",
  "moneda": "ARS"
}
```

**Proceso ejecutado**:
1. Valida que el carrito tenga items
2. Verifica stock disponible de **todos** los productos
3. Genera número de venta consecutivo
4. Crea registro en tabla `Venta`
5. Descuenta stock de todos los productos
6. Marca carrito como "completado"
7. Retorna información de la venta

**Respuesta Exitosa (200)**:

```json
{
  "mensaje": "Compra realizada exitosamente",
  "venta": {
    "id_venta": 45,
    "nro_venta": 1001,
    "total_pagado": 1799.98,
    "fyh_creacion": "2025-10-15T14:30:25.000Z"
  },
  "carrito_id": 5
}
```

**Error 400: Carrito vacío**:

```json
{
  "mensaje": "No hay productos en el carrito"
}
```

**Error 400: Stock insuficiente**:

```json
{
  "mensaje": "Stock insuficiente para iPhone 13 Pro",
  "producto": "iPhone 13 Pro",
  "stock_disponible": 1,
  "cantidad_solicitada": 2
}
```

### Ejemplo con JavaScript

```javascript
async function confirmarCompra(token, observaciones = '') {
  try {
    const response = await fetch('http://localhost:3000/api/carrito/confirmar-compra', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        observaciones: observaciones,
        moneda: 'ARS'
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.mensaje);
    }

    const data = await response.json();
    console.log('¡Compra confirmada!');
    console.log('Número de venta:', data.venta.nro_venta);
    console.log('Total pagado:', data.venta.total_pagado);
    return data;
  } catch (error) {
    console.error('Error al confirmar compra:', error);
    throw error;
  }
}
```

---

## 7. Consultar Historial de Carritos

### Endpoint

```
GET /api/carrito/historial
```

**Autenticación**: Requerida

**Query Parameters**:

| Parámetro | Tipo | Default | Descripción |
|-----------|------|---------|-------------|
| `estado` | string | - | Filtrar por estado ("activo", "completado") |
| `limit` | number | 10 | Límite de resultados |
| `offset` | number | 0 | Offset para paginación |

**Respuesta Exitosa (200)**:

```json
{
  "carritos": [
    {
      "id_carrito": 8,
      "estado": "completado",
      "total_carrito": 1799.98,
      "fyh_creacion": "2025-10-10T10:00:00.000Z",
      "items": [
        {
          "cantidad": 2,
          "precio_unitario": 899.99,
          "producto": {
            "nombre": "iPhone 13 Pro"
          }
        }
      ],
      "venta": {
        "nro_venta": 1001,
        "fyh_creacion": "2025-10-10T10:15:00.000Z"
      }
    }
  ],
  "total": 15,
  "limit": 10,
  "offset": 0
}
```

### Ejemplo con JavaScript

```javascript
async function obtenerHistorial(token, filtros = {}) {
  const params = new URLSearchParams({
    estado: filtros.estado || '',
    limit: filtros.limit || 10,
    offset: filtros.offset || 0
  });

  try {
    const response = await fetch(`http://localhost:3000/api/carrito/historial?${params}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Error al obtener historial');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}

// Uso
const historial = await obtenerHistorial(miToken, {
  estado: 'completado',
  limit: 20
});
```

---

## Cálculo de Ofertas y Descuentos

El sistema aplica ofertas automáticamente al agregar/actualizar productos. Soporta tres tipos de descuento:

### 1. Precio Fijo en Oferta

```javascript
// Ejemplo: Producto normalmente Bs. 1000, en oferta a Bs. 750 fijo
{
  tipo_descuento: "precio_fijo",
  ProductoOferta: {
    precio_oferta: 750
  }
}
// Resultado: precio_oferta = 750
```

### 2. Descuento Porcentual

```javascript
// Ejemplo: 20% de descuento sobre el precio original
{
  tipo_descuento: "porcentaje",
  valor_descuento: 20,
  precio_original: 1000
}
// Resultado: precio_oferta = 800 (1000 * 0.80)
```

### 3. Descuento Monto Fijo

```javascript
// Ejemplo: Bs. 150 de descuento
{
  tipo_descuento: "monto_fijo",
  valor_descuento: 150,
  precio_original: 1000
}
// Resultado: precio_oferta = 850 (1000 - 150)
```

### Validación de Ofertas

Una oferta es válida si cumple:
- `activo = true`
- `fecha_inicio <= fecha_actual`
- `fecha_fin >= fecha_actual`

El backend recalcula ofertas en cada operación para asegurar precios actualizados.

---

## Sincronización Frontend-Backend

### Estrategia Recomendada

1. **Al cargar la aplicación**: Obtener carrito del backend
2. **Al agregar producto**: Llamar a API y actualizar estado local
3. **Al cambiar cantidad**: Usar debouncing para evitar múltiples llamadas
4. **Al eliminar**: Actualizar backend inmediatamente
5. **Sincronización periódica**: Refrescar carrito cada X minutos (opcional)

### Implementación con React Context

```javascript
// CarritoContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';

const CarritoContext = createContext();

export function CarritoProvider({ children }) {
  const [carrito, setCarrito] = useState(null);
  const [loading, setLoading] = useState(true);

  // Cargar carrito al montar
  useEffect(() => {
    cargarCarrito();
  }, []);

  async function cargarCarrito() {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const data = await obtenerCarrito(token);
      setCarrito(data);
    } catch (error) {
      console.error('Error al cargar carrito:', error);
    } finally {
      setLoading(false);
    }
  }

  async function agregarProducto(idProducto, cantidad) {
    try {
      const token = localStorage.getItem('token');
      await agregarAlCarrito(token, idProducto, cantidad);
      await cargarCarrito(); // Recargar carrito actualizado
    } catch (error) {
      console.error('Error:', error);
      throw error;
    }
  }

  async function actualizarCantidadItem(idItem, cantidad) {
    try {
      const token = localStorage.getItem('token');
      await actualizarCantidad(token, idItem, cantidad);
      await cargarCarrito();
    } catch (error) {
      console.error('Error:', error);
      throw error;
    }
  }

  async function eliminarItem(idItem) {
    try {
      const token = localStorage.getItem('token');
      await eliminarDelCarrito(token, idItem);
      await cargarCarrito();
    } catch (error) {
      console.error('Error:', error);
      throw error;
    }
  }

  async function vaciar() {
    try {
      const token = localStorage.getItem('token');
      await vaciarCarrito(token);
      await cargarCarrito();
    } catch (error) {
      console.error('Error:', error);
      throw error;
    }
  }

  async function confirmar(observaciones) {
    try {
      const token = localStorage.getItem('token');
      const resultado = await confirmarCompra(token, observaciones);
      await cargarCarrito(); // Cargar nuevo carrito vacío
      return resultado;
    } catch (error) {
      console.error('Error:', error);
      throw error;
    }
  }

  return (
    <CarritoContext.Provider
      value={{
        carrito,
        loading,
        agregarProducto,
        actualizarCantidadItem,
        eliminarItem,
        vaciar,
        confirmar,
        recargar: cargarCarrito
      }}
    >
      {children}
    </CarritoContext.Provider>
  );
}

export function useCarrito() {
  const context = useContext(CarritoContext);
  if (!context) {
    throw new Error('useCarrito debe usarse dentro de CarritoProvider');
  }
  return context;
}
```

---

## Manejo de Errores

### Errores de Stock

```javascript
try {
  await agregarAlCarrito(token, idProducto, cantidad);
} catch (error) {
  if (error.message.includes('Stock insuficiente')) {
    alert('Lo sentimos, no hay suficiente stock disponible');
    // Mostrar stock disponible al usuario
  }
}
```

### Errores de Autenticación

```javascript
async function manejarErrorAuth(error) {
  if (error.message.includes('401') || error.message.includes('token')) {
    // Token expirado o inválido
    localStorage.removeItem('token');
    window.location.href = '/login';
  }
}
```

### Errores de Red

```javascript
async function ejecutarConReintentos(fn, maxIntentos = 3) {
  for (let i = 0; i < maxIntentos; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxIntentos - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
}

// Uso
await ejecutarConReintentos(() => agregarAlCarrito(token, id, cantidad));
```

---

## Implementación Frontend Completa

### Componente de Carrito de Compras

```jsx
import React from 'react';
import { useCarrito } from './CarritoContext';

function CarritoCompras() {
  const { carrito, loading, actualizarCantidadItem, eliminarItem, confirmar } = useCarrito();

  if (loading) {
    return <div>Cargando carrito...</div>;
  }

  if (!carrito || carrito.items.length === 0) {
    return <div>Tu carrito está vacío</div>;
  }

  async function handleConfirmarCompra() {
    if (window.confirm('¿Confirmar compra?')) {
      try {
        const resultado = await confirmar('Entrega estándar');
        alert(`¡Compra exitosa! Número de venta: ${resultado.venta.nro_venta}`);
      } catch (error) {
        alert(`Error: ${error.message}`);
      }
    }
  }

  return (
    <div className="carrito">
      <h2>Mi Carrito</h2>

      {carrito.items.map(item => (
        <div key={item.id_item} className="carrito-item">
          <img
            src={item.producto.imagen_url}
            alt={item.producto.nombre}
            width="100"
          />

          <div className="item-info">
            <h3>{item.producto.nombre}</h3>

            {item.producto.en_oferta && (
              <div className="precio-oferta">
                <span className="precio-original">
                  Bs. {item.producto.precio_original}
                </span>
                <span className="precio-descuento">
                  Bs. {item.producto.precio_oferta}
                </span>
                <span className="descuento-badge">
                  -{item.producto.descuento_porcentaje}%
                </span>
              </div>
            )}

            <div className="cantidad-control">
              <button
                onClick={() => actualizarCantidadItem(item.id_item, item.cantidad - 1)}
                disabled={item.cantidad <= 1}
              >
                -
              </button>
              <span>{item.cantidad}</span>
              <button
                onClick={() => actualizarCantidadItem(item.id_item, item.cantidad + 1)}
              >
                +
              </button>
            </div>

            <p className="subtotal">
              Subtotal: Bs. {item.subtotal.toFixed(2)}
            </p>

            <button
              onClick={() => eliminarItem(item.id_item)}
              className="btn-eliminar"
            >
              Eliminar
            </button>
          </div>
        </div>
      ))}

      <div className="carrito-resumen">
        <h3>Total: Bs. {carrito.total_carrito.toFixed(2)}</h3>
        <p>{carrito.cantidad_items} producto(s)</p>

        <button
          onClick={handleConfirmarCompra}
          className="btn-confirmar"
        >
          Confirmar Compra
        </button>
      </div>
    </div>
  );
}

export default CarritoCompras;
```

---

## Buenas Prácticas

### 1. Optimistic UI Updates

```javascript
async function eliminarItemOptimista(idItem) {
  // Actualizar UI inmediatamente
  const itemsActualizados = carrito.items.filter(i => i.id_item !== idItem);
  setCarrito({ ...carrito, items: itemsActualizados });

  try {
    // Confirmar en el backend
    await eliminarDelCarrito(token, idItem);
  } catch (error) {
    // Revertir si falla
    await cargarCarrito();
    alert('Error al eliminar producto');
  }
}
```

### 2. Debouncing para Cambios de Cantidad

```javascript
import { useDebounce } from 'use-debounce';

function ItemCarrito({ item }) {
  const [cantidadLocal, setCantidadLocal] = useState(item.cantidad);
  const [cantidadDebounced] = useDebounce(cantidadLocal, 500);

  useEffect(() => {
    if (cantidadDebounced !== item.cantidad) {
      actualizarCantidadItem(item.id_item, cantidadDebounced);
    }
  }, [cantidadDebounced]);

  return (
    <input
      type="number"
      value={cantidadLocal}
      onChange={(e) => setCantidadLocal(parseInt(e.target.value))}
      min="1"
    />
  );
}
```

### 3. Validación de Stock en Tiempo Real

```javascript
async function verificarStockAntes DeAgregar(idProducto, cantidad) {
  const producto = await fetch(`/api/almacen/productos/${idProducto}`).then(r => r.json());

  if (producto.stock < cantidad) {
    throw new Error(`Solo hay ${producto.stock} unidades disponibles`);
  }

  return agregarAlCarrito(token, idProducto, cantidad);
}
```

### 4. Sincronización al Recuperar Foco

```javascript
useEffect(() => {
  function handleFocus() {
    cargarCarrito(); // Recargar carrito cuando el usuario vuelve a la pestaña
  }

  window.addEventListener('focus', handleFocus);
  return () => window.removeEventListener('focus', handleFocus);
}, []);
```

### 5. Persistencia de Carrito en localStorage (Backup)

```javascript
// Guardar carrito en localStorage como backup
useEffect(() => {
  if (carrito) {
    localStorage.setItem('carrito_backup', JSON.stringify(carrito));
  }
}, [carrito]);

// Restaurar si falla la carga del backend
async function cargarCarritoConFallback() {
  try {
    const data = await obtenerCarrito(token);
    setCarrito(data);
  } catch (error) {
    const backup = localStorage.getItem('carrito_backup');
    if (backup) {
      setCarrito(JSON.parse(backup));
    }
  }
}
```

---

**Última actualización**: 15 de Octubre, 2025
**Versión**: 1.0
**Estado**: Completado

**Relacionado con**:
- [API Reference](../ENDPOINTS.md)
- [Endpoints de Carrito](../endpoints/carrito.md)
- [Endpoints de Productos](../endpoints/productos.md)
- [Guía de Autenticación](./AUTHENTICATION.md)

---

**[Volver arriba](#tabla-de-contenidos)** | **[Documentación](../../README.md)** | **[Inicio](../../../README.md)**
