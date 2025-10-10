[← Volver al índice de ENDPOINTS](../ENDPOINTS.md)
# Carrito API

**Base Path**: `/api/carrito`

Gestión del carrito de compras del cliente.

---

## Índice

- [Carrito API](#carrito-api)
  - [Índice](#índice)
  - [GET /carrito](#get-carrito)
  - [POST /carrito/items](#post-carritoitems)
  - [PUT /carrito/items/:id\_item](#put-carritoitemsid_item)
  - [DELETE /carrito/items/:id\_item](#delete-carritoitemsid_item)
  - [DELETE /carrito](#delete-carrito)
  - [POST /carrito/confirmar-compra](#post-carritoconfirmar-compra)
  - [GET /carrito/historial](#get-carritohistorial)
  - [Notas sobre el Carrito](#notas-sobre-el-carrito)
    - [Estados del Carrito](#estados-del-carrito)
    - [Límites y Restricciones](#límites-y-restricciones)
    - [Cálculo de Precios](#cálculo-de-precios)
    - [Sincronización](#sincronización)
  - [Ver También](#ver-también)

🔒 Todos los endpoints requieren autenticación

---

## GET /carrito

Obtener el carrito activo del cliente autenticado.

**Autenticación**: ✅ Requerida (JWT Cliente)

**Response 200**:
```json
{
  "carrito": {
    "id_carrito": 1,
    "id_cliente": 5,
    "estado": "activo",
    "total_carrito": 1849.98,
    "cantidad_items": 2,
    "items": [
      {
        "id_item": 10,
        "id_producto": 1,
        "cantidad": 1,
        "precio_unitario": 999.99,
        "subtotal": 849.99,
        "producto": {
          "id_producto": 1,
          "nombre_producto": "iPhone 13 Pro",
          "imagen": "http://localhost:3000/api/uploads/productos/iphone13.jpg",
          "stock": 50,
          "precio_actual": 999.99,
          "tiene_oferta": true,
          "precio_oferta": 849.99,
          "porcentaje_descuento": 15,
          "marca": {
            "nombre_marca": "Apple"
          }
        }
      },
      {
        "id_item": 11,
        "id_producto": 2,
        "cantidad": 1,
        "precio_unitario": 999.99,
        "subtotal": 999.99,
        "producto": {
          "id_producto": 2,
          "nombre_producto": "Samsung Galaxy S21",
          "imagen": "http://localhost:3000/api/uploads/productos/samsung-s21.jpg",
          "stock": 30,
          "precio_actual": 999.99,
          "tiene_oferta": false
        }
      }
    ],
    "cargando": false,
    "error": null
  }
}
```

**Notas**:
- Si no existe un carrito activo, se crea automáticamente uno nuevo
- Si el carrito está vacío, retorna `items: []` con `total_carrito: 0.00`
- Los precios se actualizan automáticamente con las ofertas vigentes

**Errores**:
- `401`: No autorizado (token inválido o expirado)
- `500`: Error del servidor

**Ejemplo curl**:
```bash
curl -X GET "http://localhost:3000/api/carrito" \
  -H "Authorization: Bearer {tu_token_cliente}"
```

---

## POST /carrito/items

Agregar un producto al carrito.

**Autenticación**: ✅ Requerida (JWT Cliente)

**Body**:
```json
{
  "id_producto": 1,
  "cantidad": 2
}
```

**Validaciones**:
- `id_producto`: Requerido, debe existir y estar activo
- `cantidad`: Requerido, mínimo 1, máximo según stock disponible
- El producto debe tener stock suficiente
- No exceder el límite máximo de items en carrito (configurado en middleware)

**Response 200**:
```json
{
  "success": true,
  "mensaje": "Producto agregado al carrito exitosamente",
  "carrito": {
    "id_carrito": 1,
    "total_carrito": 1699.98,
    "cantidad_items": 2,
    "item_agregado": {
      "id_item": 12,
      "id_producto": 1,
      "cantidad": 2,
      "precio_unitario": 849.99,
      "subtotal": 1699.98
    }
  }
}
```

**Comportamiento**:
- Si el producto ya existe en el carrito, incrementa la cantidad
- Si es un producto nuevo, lo agrega como nuevo item
- Calcula automáticamente el precio con ofertas vigentes
- Recalcula el total del carrito

**Errores**:
- `400`: Datos inválidos (campos requeridos faltantes)
- `401`: No autorizado
- `404`: Producto no encontrado o inactivo
- `409`: Stock insuficiente
- `429`: Límite de items del carrito excedido
- `500`: Error del servidor

**Ejemplo curl**:
```bash
curl -X POST "http://localhost:3000/api/carrito/items" \
  -H "Authorization: Bearer {tu_token_cliente}" \
  -H "Content-Type: application/json" \
  -d '{
    "id_producto": 1,
    "cantidad": 2
  }'
```

---

## PUT /carrito/items/:id_item

Actualizar la cantidad de un item del carrito.

**Autenticación**: ✅ Requerida (JWT Cliente)

**URL Parameters**:

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `id_item` | number | ID del item en el carrito |

**Body**:
```json
{
  "cantidad": 3
}
```

**Validaciones**:
- `cantidad`: Requerido, mínimo 1, máximo según stock
- El item debe pertenecer al carrito del cliente autenticado
- Debe haber stock suficiente

**Response 200**:
```json
{
  "success": true,
  "mensaje": "Cantidad actualizada exitosamente",
  "carrito": {
    "id_carrito": 1,
    "total_carrito": 2549.97,
    "cantidad_items": 3,
    "item_actualizado": {
      "id_item": 12,
      "id_producto": 1,
      "cantidad": 3,
      "precio_unitario": 849.99,
      "subtotal": 2549.97
    }
  }
}
```

**Errores**:
- `400`: Cantidad inválida
- `401`: No autorizado
- `404`: Item no encontrado
- `409`: Stock insuficiente
- `500`: Error del servidor

**Ejemplo curl**:
```bash
curl -X PUT "http://localhost:3000/api/carrito/items/12" \
  -H "Authorization: Bearer {tu_token_cliente}" \
  -H "Content-Type: application/json" \
  -d '{
    "cantidad": 3
  }'
```

---

## DELETE /carrito/items/:id_item

Eliminar un item del carrito.

**Autenticación**: ✅ Requerida (JWT Cliente)

**URL Parameters**:

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `id_item` | number | ID del item a eliminar |

**Response 200**:
```json
{
  "success": true,
  "mensaje": "Item eliminado del carrito exitosamente",
  "carrito": {
    "id_carrito": 1,
    "total_carrito": 999.99,
    "cantidad_items": 1,
    "items_restantes": 1
  }
}
```

**Errores**:
- `401`: No autorizado
- `404`: Item no encontrado
- `500`: Error del servidor

**Ejemplo curl**:
```bash
curl -X DELETE "http://localhost:3000/api/carrito/items/12" \
  -H "Authorization: Bearer {tu_token_cliente}"
```

---

## DELETE /carrito

Vaciar el carrito completo (eliminar todos los items).

**Autenticación**: ✅ Requerida (JWT Cliente)

**Response 200**:
```json
{
  "success": true,
  "mensaje": "Carrito vaciado exitosamente",
  "carrito": {
    "id_carrito": 1,
    "estado": "activo",
    "total_carrito": 0.00,
    "cantidad_items": 0,
    "items": []
  }
}
```

**Notas**:
- El carrito permanece activo pero sin items
- No se elimina el carrito, solo se vacía

**Errores**:
- `401`: No autorizado
- `404`: Carrito no encontrado
- `500`: Error del servidor

**Ejemplo curl**:
```bash
curl -X DELETE "http://localhost:3000/api/carrito" \
  -H "Authorization: Bearer {tu_token_cliente}"
```

---

## POST /carrito/confirmar-compra

Confirmar la compra (convertir el carrito en una venta).

**Autenticación**: ✅ Requerida (JWT Cliente)

**Body**:
```json
{
  "metodo_pago": "tarjeta",
  "id_direccion": 5,
  "notas": "Entregar en horario de oficina"
}
```

**Campos**:

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `metodo_pago` | string | Sí | Método de pago: "tarjeta", "efectivo", "transferencia" |
| `id_direccion` | number | Sí | ID de dirección de envío |
| `notas` | string | No | Notas adicionales para el pedido |

**Response 200**:
```json
{
  "success": true,
  "mensaje": "Compra confirmada exitosamente",
  "venta": {
    "id_venta": 45,
    "numero_pedido": "ORD-2025-00045",
    "total": 1849.98,
    "estado": "pendiente",
    "metodo_pago": "tarjeta",
    "fecha": "2025-10-06T15:30:00Z",
    "items": [
      {
        "id_producto": 1,
        "nombre_producto": "iPhone 13 Pro",
        "cantidad": 2,
        "precio_unitario": 849.99,
        "subtotal": 1699.98
      }
    ],
    "direccion_envio": {
      "direccion": "Av. Principal 123",
      "ciudad": "Lima",
      "codigo_postal": "15001"
    }
  }
}
```

**Proceso**:
1. Valida que el carrito tenga items
2. Verifica stock de todos los productos
3. Crea el registro de venta
4. Descuenta el stock de los productos
5. Marca el carrito como "completado"
6. Envía email de confirmación (si está configurado)

**Errores**:
- `400`: Carrito vacío o datos inválidos
- `401`: No autorizado
- `404`: Carrito o dirección no encontrados
- `409`: Stock insuficiente en algún producto
- `500`: Error del servidor

**Ejemplo curl**:
```bash
curl -X POST "http://localhost:3000/api/carrito/confirmar-compra" \
  -H "Authorization: Bearer {tu_token_cliente}" \
  -H "Content-Type: application/json" \
  -d '{
    "metodo_pago": "tarjeta",
    "id_direccion": 5,
    "notas": "Entregar en horario de oficina"
  }'
```

---

## GET /carrito/historial

Obtener el historial de carritos completados del cliente.

**Autenticación**: ✅ Requerida (JWT Cliente)

**Query Parameters**:

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `page` | number | No | Número de página (default: 1) |
| `limit` | number | No | Items por página (default: 10) |
| `estado` | string | No | Filtrar por estado: "completado", "cancelado" |

**Response 200**:
```json
{
  "success": true,
  "data": [
    {
      "id_carrito": 45,
      "estado": "completado",
      "total_carrito": 1849.98,
      "cantidad_items": 2,
      "fecha_creacion": "2025-10-01T10:00:00Z",
      "fecha_completado": "2025-10-01T10:30:00Z",
      "items": [
        {
          "id_producto": 1,
          "nombre_producto": "iPhone 13 Pro",
          "cantidad": 2,
          "precio_unitario": 849.99
        }
      ]
    },
    {
      "id_carrito": 42,
      "estado": "completado",
      "total_carrito": 599.99,
      "cantidad_items": 1,
      "fecha_creacion": "2025-09-28T14:00:00Z",
      "fecha_completado": "2025-09-28T14:15:00Z"
    }
  ],
  "pagination": {
    "total": 15,
    "page": 1,
    "pages": 2,
    "limit": 10
  }
}
```

**Errores**:
- `401`: No autorizado
- `500`: Error del servidor

**Ejemplo curl**:
```bash
# Obtener historial
curl -X GET "http://localhost:3000/api/carrito/historial" \
  -H "Authorization: Bearer {tu_token_cliente}"

# Filtrar solo completados
curl -X GET "http://localhost:3000/api/carrito/historial?estado=completado&page=1&limit=5" \
  -H "Authorization: Bearer {tu_token_cliente}"
```

---

## Notas sobre el Carrito

### Estados del Carrito
- **activo**: Carrito en uso actual
- **completado**: Carrito convertido en venta exitosa
- **cancelado**: Carrito cancelado por el usuario o por timeout
- **abandonado**: Carrito inactivo por más de 7 días

### Límites y Restricciones
- **Máximo de items por carrito**: Configurado en middleware (default: 50)
- **Máxima cantidad por producto**: Limitado por stock disponible
- **Rate limiting**: Diferentes límites por operación (configurado en middleware)

### Cálculo de Precios
- Los precios se calculan en tiempo real con las ofertas vigentes
- Si una oferta expira, el precio se actualiza automáticamente al consultarlo
- El subtotal se calcula: `cantidad * precio_unitario` (con oferta si aplica)
- El total del carrito es la suma de todos los subtotales

### Sincronización
- El carrito se sincroniza automáticamente con el stock disponible
- Si un producto queda sin stock, no se puede agregar más cantidad
- Las ofertas se actualizan en tiempo real al consultar el carrito

---

## Ver También

- [Productos API](./productos.md) - Para consultar productos disponibles
- [Clientes API](./clientes.md) - Para autenticación y gestión de clientes
- [Direcciones API](./direcciones.md) - Para gestionar direcciones de envío
- [Volver al índice de API](../README.md)

---

**Última actualización**: 6 de Octubre, 2025

---

**[⬆ Volver arriba](#tabla-de-contenidos)** | **[📚 Documentación](../../../docs/README.md)** | **[🏠 Inicio](../../../README.md)**
