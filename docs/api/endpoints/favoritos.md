[← Volver al índice de ENDPOINTS](../ENDPOINTS.md)
# Favoritos API

**Base Path**: `/api/favoritos`

Gestión de productos favoritos de clientes.

---

## Índice

- [Favoritos API](#favoritos-api)
  - [Índice](#índice)
  - [GET /favoritos/cliente/:id\_cliente](#get-favoritosclienteid_cliente)
  - [GET /favoritos/cliente/:id\_cliente/producto/:id\_producto](#get-favoritosclienteid_clienteproductoid_producto)
  - [POST /favoritos/cliente/:id\_cliente](#post-favoritosclienteid_cliente)
  - [DELETE /favoritos/cliente/:id\_cliente/producto/:id\_producto](#delete-favoritosclienteid_clienteproductoid_producto)
  - [PUT /favoritos/cliente/:id\_cliente/producto/:id\_producto/toggle](#put-favoritosclienteid_clienteproductoid_productotoggle)
  - [GET /favoritos/cliente/:id\_cliente/estadisticas](#get-favoritosclienteid_clienteestadisticas)
  - [Notas Técnicas](#notas-técnicas)
    - [Estructura de Favoritos](#estructura-de-favoritos)
    - [Ordenamiento](#ordenamiento)
    - [Datos del Producto](#datos-del-producto)
    - [Generación de imagen\_url](#generación-de-imagen_url)
    - [Estructura de Imágenes](#estructura-de-imágenes)
    - [Sincronización con Productos](#sincronización-con-productos)
    - [Paginación](#paginación)
    - [Casos de Uso Comunes](#casos-de-uso-comunes)
  - [Ver También](#ver-también)

🔒 Todos los endpoints requieren autenticación

---

## GET /favoritos/cliente/:id_cliente

Obtener todos los productos favoritos de un cliente con paginación.

**Autenticación**: ✅ Requerida (JWT Cliente)

**URL Parameters**:

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `id_cliente` | number | ID del cliente |

**Query Parameters**:

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `limit` | number | No | Favoritos por página (default: 20) |
| `offset` | number | No | Favoritos a saltar (default: 0) |

**Response 200**:
```json
{
  "success": true,
  "data": [
    {
      "id_favorito": 5,
      "id_cliente": 10,
      "id_producto": 1,
      "fyh_creacion": "2025-10-05T14:30:00Z",
      "producto": {
        "id_producto": 1,
        "codigo": "PROD-001",
        "nombre_producto": "iPhone 13 Pro",
        "descripcion": "Smartphone Apple con cámara triple",
        "precio_venta": 999.99,
        "stock": 50,
        "imagen_url": "http://localhost:3000/api/images/productos/iphone13-1.jpg",
        "categoria": {
          "nombre_categoria": "Smartphones"
        },
        "marca": {
          "nombre_marca": "Apple"
        },
        "imagenes": [
          {
            "id_imagen": 1,
            "url_imagen": "productos/iphone13-1.jpg",
            "url": "productos/iphone13-1.jpg",
            "alt_text": "iPhone 13 Pro frontal",
            "es_principal": true,
            "orden": 1
          }
        ]
      }
    }
  ],
  "pagination": {
    "total": 15,
    "limit": 20,
    "offset": 0,
    "pages": 1
  }
}
```

**Validaciones**:
- El cliente debe existir
- Solo el cliente autenticado puede ver sus propios favoritos

**Errores**:
- `401`: No autorizado
- `404`: Cliente no encontrado
- `500`: Error del servidor

**Ejemplo curl**:
```bash
curl -X GET "http://localhost:3000/api/favoritos/cliente/10?limit=20&offset=0" \
  -H "Authorization: Bearer {tu_token}"
```

---

## GET /favoritos/cliente/:id_cliente/producto/:id_producto

Verificar si un producto está en favoritos del cliente.

**Autenticación**: ✅ Requerida (JWT Cliente)

**URL Parameters**:

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `id_cliente` | number | ID del cliente |
| `id_producto` | number | ID del producto |

**Response 200**:
```json
{
  "success": true,
  "esFavorito": true,
  "data": {
    "id_favorito": 5,
    "id_cliente": 10,
    "id_producto": 1,
    "fyh_creacion": "2025-10-05T14:30:00Z"
  }
}
```

**Cuando NO es favorito**:
```json
{
  "success": true,
  "esFavorito": false,
  "data": null
}
```

**Errores**:
- `401`: No autorizado
- `500`: Error del servidor

**Ejemplo curl**:
```bash
curl -X GET "http://localhost:3000/api/favoritos/cliente/10/producto/1" \
  -H "Authorization: Bearer {tu_token}"
```

---

## POST /favoritos/cliente/:id_cliente

Agregar un producto a favoritos.

**Autenticación**: ✅ Requerida (JWT Cliente)

**URL Parameters**:

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `id_cliente` | number | ID del cliente |

**Body**:
```json
{
  "id_producto": 1
}
```

**Campos**:

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `id_producto` | number | Sí | ID del producto a agregar |

**Response 201**:
```json
{
  "success": true,
  "message": "Producto agregado a favoritos",
  "data": {
    "id_favorito": 16,
    "id_cliente": 10,
    "id_producto": 1,
    "fyh_creacion": "2025-10-06T16:00:00Z",
    "producto": {
      "id_producto": 1,
      "nombre_producto": "iPhone 13 Pro",
      "precio_venta": 999.99,
      "stock": 50,
      "categoria": {
        "nombre_categoria": "Smartphones"
      },
      "marca": {
        "nombre_marca": "Apple"
      }
    }
  }
}
```

**Validaciones**:
- El cliente debe existir
- El producto debe existir
- El producto no debe estar ya en favoritos

**Errores**:
- `400`: ID de producto no proporcionado
- `401`: No autorizado
- `404`: Cliente o producto no encontrado
- `409`: El producto ya está en favoritos
- `500`: Error del servidor

**Ejemplo curl**:
```bash
curl -X POST "http://localhost:3000/api/favoritos/cliente/10" \
  -H "Authorization: Bearer {tu_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "id_producto": 1
  }'
```

---

## DELETE /favoritos/cliente/:id_cliente/producto/:id_producto

Eliminar un producto de favoritos.

**Autenticación**: ✅ Requerida (JWT Cliente)

**URL Parameters**:

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `id_cliente` | number | ID del cliente |
| `id_producto` | number | ID del producto |

**Response 200**:
```json
{
  "success": true,
  "message": "Producto removido de favoritos"
}
```

**Errores**:
- `401`: No autorizado
- `404`: El producto no está en favoritos
- `500`: Error del servidor

**Ejemplo curl**:
```bash
curl -X DELETE "http://localhost:3000/api/favoritos/cliente/10/producto/1" \
  -H "Authorization: Bearer {tu_token}"
```

---

## PUT /favoritos/cliente/:id_cliente/producto/:id_producto/toggle

Alternar estado de favorito (agregar si no existe, eliminar si existe).

**Autenticación**: ✅ Requerida (JWT Cliente)

**URL Parameters**:

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `id_cliente` | number | ID del cliente |
| `id_producto` | number | ID del producto |

**Response 200 (cuando se agrega)**:
```json
{
  "success": true,
  "message": "Producto agregado a favoritos",
  "action": "added",
  "esFavorito": true,
  "data": {
    "id_favorito": 17,
    "id_cliente": 10,
    "id_producto": 2,
    "fyh_creacion": "2025-10-06T16:30:00Z"
  }
}
```

**Response 200 (cuando se elimina)**:
```json
{
  "success": true,
  "message": "Producto removido de favoritos",
  "action": "removed",
  "esFavorito": false
}
```

**Comportamiento**:
- Si el producto ya es favorito: lo elimina
- Si el producto no es favorito: lo agrega
- Útil para botones de "toggle" en interfaces

**Errores**:
- `401`: No autorizado
- `404`: Cliente o producto no encontrado
- `500`: Error del servidor

**Ejemplo curl**:
```bash
curl -X PUT "http://localhost:3000/api/favoritos/cliente/10/producto/2/toggle" \
  -H "Authorization: Bearer {tu_token}"
```

---

## GET /favoritos/cliente/:id_cliente/estadisticas

Obtener estadísticas de favoritos del cliente.

**Autenticación**: ✅ Requerida (JWT Cliente)

**URL Parameters**:

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `id_cliente` | number | ID del cliente |

**Response 200**:
```json
{
  "success": true,
  "data": {
    "total": 15,
    "porCategoria": {
      "Smartphones": 8,
      "Tablets": 4,
      "Accesorios": 3
    }
  }
}
```

**Información retornada**:
- `total`: Total de productos en favoritos
- `porCategoria`: Distribución de favoritos por categoría

**Errores**:
- `401`: No autorizado
- `500`: Error del servidor

**Ejemplo curl**:
```bash
curl -X GET "http://localhost:3000/api/favoritos/cliente/10/estadisticas" \
  -H "Authorization: Bearer {tu_token}"
```

---

## Notas Técnicas

### Estructura de Favoritos

**Tabla favorito**:
- `id_favorito`: ID único del favorito
- `id_cliente`: Referencia al cliente
- `id_producto`: Referencia al producto
- `fyh_creacion`: Fecha y hora de creación

**Relaciones**:
- Un cliente puede tener múltiples favoritos
- Un producto puede ser favorito de múltiples clientes
- Restricción única: (id_cliente, id_producto) - no se permiten duplicados

### Ordenamiento

Los favoritos se ordenan por:
- Default: Fecha de creación DESC (más recientes primero)
- Esto permite ver qué productos agregó recientemente

### Datos del Producto

Cuando se obtienen favoritos, se incluyen datos completos del producto:
- Información básica (nombre, precio, stock)
- Categoría
- Marca
- Imágenes del producto
- URL de imagen principal generada automáticamente

### Generación de imagen_url

```javascript
// Se genera automáticamente para cada producto
imagen_url = "http://localhost:3000/api/images/{url_imagen}"

// Se usa la imagen principal si existe, sino la primera disponible
const imagenPrincipal = imagenes.find(img => img.es_principal);
const imagenDefault = imagenPrincipal || imagenes[0];
```

### Estructura de Imágenes

Cada producto en favoritos incluye:
- `imagen_url`: URL completa de la imagen principal
- `imagenes`: Array completo de todas las imágenes con:
  - `url_imagen`: Ruta relativa original
  - `url`: Alias de url_imagen (para compatibilidad frontend)
  - `alt_text`: Texto alternativo
  - `es_principal`: Boolean indicando si es la principal
  - `orden`: Orden de visualización

### Sincronización con Productos

- Si un producto se elimina, los favoritos asociados deben eliminarse (configurado en base de datos)
- Los cambios de precio/stock del producto se reflejan inmediatamente en favoritos
- Las imágenes se actualizan en tiempo real

### Paginación

- Default: 20 favoritos por página
- Se puede ajustar con `limit` y `offset`
- Se retorna información completa de paginación

### Casos de Uso Comunes

**Toggle Favorito (UI)**:
```javascript
// Frontend puede usar el endpoint toggle para simplificar
PUT /favoritos/cliente/10/producto/1/toggle
// Responde con action: "added" o "removed"
```

**Verificar Estado Inicial**:
```javascript
// Al cargar un producto, verificar si es favorito
GET /favoritos/cliente/10/producto/1
// Responde con esFavorito: true/false
```

**Lista de Favoritos**:
```javascript
// Mostrar todos los favoritos con paginación
GET /favoritos/cliente/10?limit=20&offset=0
```

---

## Ver También

- [Productos API](./productos.md) - Para obtener detalles de productos
- [Clientes API](./clientes.md) - Para autenticación
- [Carrito API](./carrito.md) - Para agregar favoritos al carrito
- [Volver al índice de API](../README.md)

---

**Última actualización**: 6 de Octubre, 2025

---

**[⬆ Volver arriba](#tabla-de-contenidos)** | **[📚 Documentación](../../../docs/README.md)** | **[🏠 Inicio](../../../README.md)**
