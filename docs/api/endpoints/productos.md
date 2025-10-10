[← Volver al índice de ENDPOINTS](../ENDPOINTS.md)

# Productos API

**Base Path**: `/api/almacen`

Gestión del catálogo de productos de la tienda.

---

## 📋 Índice

- [Listar productos](#get-productos)
- [Obtener producto por ID](#get-productosid)
- [Productos destacados](#get-productosdestacados)
- [Buscar productos](#get-productosbuscar)
- [Productos por categoría](#get-productoscategoriacategoriaid)
- [Listar categorías](#get-categorias)
- [Crear producto](#post-productos) 🔒
- [Actualizar producto](#put-productosid) 🔒
- [Eliminar producto](#delete-productosid) 🔒
- [Actualizar stock](#patch-productosidstock) 🔒
- [Diagnóstico](#get-diagnostico)

🔒 = Requiere autenticación

---

## GET /productos

Obtener lista de todos los productos con filtros opcionales.

**Autenticación**: ❌ No requerida

**Query Parameters**:

| Parámetro   | Tipo    | Requerido | Descripción                              |
| ----------- | ------- | --------- | ---------------------------------------- |
| `page`      | number  | No        | Número de página (default: 1)            |
| `limit`     | number  | No        | Items por página (default: 20, max: 100) |
| `categoria` | number  | No        | Filtrar por ID de categoría              |
| `marca`     | number  | No        | Filtrar por ID de marca                  |
| `precioMin` | number  | No        | Precio mínimo                            |
| `precioMax` | number  | No        | Precio máximo                            |
| `destacado` | boolean | No        | Solo productos destacados                |

**Response 200**:

```json
{
  "success": true,
  "data": [
    {
      "id_producto": 1,
      "codigo": "PROD-001",
      "nombre_producto": "iPhone 13 Pro",
      "descripcion": "Smartphone Apple con cámara triple",
      "precio_producto": 999.99,
      "stock": 50,
      "imagen": "http://localhost:3000/api/uploads/productos/iphone13.jpg",
      "destacado": 1,
      "activo": 1,
      "categoria": {
        "nombre_categoria": "Smartphones"
      },
      "marca": {
        "nombre_marca": "Apple",
        "logo_marca": "apple-logo.png"
      },
      "ofertas": [
        {
          "nombre_oferta": "Black Friday",
          "porcentaje_descuento": 15,
          "precio_oferta": 849.99
        }
      ],
      "caracteristicas": [
        {
          "nombre_tipo": "Memoria RAM",
          "valor": "8",
          "unidad_medida": "GB"
        }
      ]
    }
  ],
  "pagination": {
    "total": 100,
    "page": 1,
    "pages": 5,
    "limit": 20
  }
}
```

**Errores**:

- `500`: Error del servidor

**Ejemplo curl**:

```bash
# Obtener todos los productos
curl -X GET "http://localhost:3000/api/almacen/productos"

# Filtrar por categoría y precio
curl -X GET "http://localhost:3000/api/almacen/productos?categoria=1&precioMax=500"

# Obtener productos destacados
curl -X GET "http://localhost:3000/api/almacen/productos?destacado=true"
```

---

## GET /productos/:id

Obtener un producto específico por ID con toda su información detallada.

**Autenticación**: ❌ No requerida

**URL Parameters**:

| Parámetro | Tipo   | Descripción     |
| --------- | ------ | --------------- |
| `id`      | number | ID del producto |

**Response 200**:

```json
{
  "success": true,
  "data": {
    "id_producto": 1,
    "codigo": "PROD-001",
    "nombre_producto": "iPhone 13 Pro",
    "descripcion": "Smartphone Apple con cámara triple de 12MP",
    "precio_producto": 999.99,
    "stock": 50,
    "imagen": "http://localhost:3000/api/uploads/productos/iphone13.jpg",
    "imagenes": [
      {
        "url_imagen": "http://localhost:3000/api/uploads/productos/iphone13-1.jpg",
        "es_principal": 1
      },
      {
        "url_imagen": "http://localhost:3000/api/uploads/productos/iphone13-2.jpg",
        "es_principal": 0
      }
    ],
    "destacado": 1,
    "activo": 1,
    "categoria": {
      "nombre_categoria": "Smartphones"
    },
    "marca": {
      "nombre_marca": "Apple",
      "logo_marca": "apple-logo.png"
    },
    "ofertas": [
      {
        "id_oferta": 5,
        "nombre_oferta": "Black Friday",
        "porcentaje_descuento": 15,
        "precio_oferta": 849.99,
        "fecha_inicio": "2025-11-20",
        "fecha_fin": "2025-11-30"
      }
    ],
    "caracteristicas": [
      {
        "nombre_tipo": "Memoria RAM",
        "valor": "8",
        "tipo_dato": "numero",
        "unidad_medida": "GB"
      },
      {
        "nombre_tipo": "Almacenamiento",
        "valor": "256",
        "tipo_dato": "numero",
        "unidad_medida": "GB"
      },
      {
        "nombre_tipo": "Pantalla",
        "valor": "6.1",
        "tipo_dato": "numero",
        "unidad_medida": "pulgadas"
      }
    ]
  }
}
```

**Errores**:

- `404`: Producto no encontrado
- `500`: Error del servidor

**Ejemplo curl**:

```bash
curl -X GET "http://localhost:3000/api/almacen/productos/1"
```

---

## GET /productos/destacados

Obtener productos marcados como destacados.

**Autenticación**: ❌ No requerida

**Query Parameters**:

| Parámetro | Tipo   | Requerido | Descripción                         |
| --------- | ------ | --------- | ----------------------------------- |
| `limit`   | number | No        | Cantidad de productos (default: 10) |

**Response 200**:

```json
{
  "success": true,
  "data": [
    {
      "id_producto": 1,
      "nombre_producto": "iPhone 13 Pro",
      "precio_producto": 999.99,
      "imagen": "http://localhost:3000/api/uploads/productos/iphone13.jpg",
      "destacado": 1,
      "marca": {
        "nombre_marca": "Apple"
      },
      "ofertas": [
        {
          "porcentaje_descuento": 15,
          "precio_oferta": 849.99
        }
      ]
    }
  ]
}
```

**Ejemplo curl**:

```bash
# Obtener 10 productos destacados
curl -X GET "http://localhost:3000/api/almacen/productos/destacados"

# Obtener 5 productos destacados
curl -X GET "http://localhost:3000/api/almacen/productos/destacados?limit=5"
```

---

## GET /productos/buscar

Buscar productos por nombre o descripción (búsqueda full-text).

**Autenticación**: ❌ No requerida

**Query Parameters**:

| Parámetro | Tipo   | Requerido | Descripción         |
| --------- | ------ | --------- | ------------------- |
| `q`       | string | Sí        | Término de búsqueda |
| `page`    | number | No        | Número de página    |
| `limit`   | number | No        | Items por página    |

**Response 200**:

```json
{
  "success": true,
  "data": [
    {
      "id_producto": 1,
      "nombre_producto": "iPhone 13 Pro",
      "descripcion": "Smartphone Apple...",
      "precio_producto": 999.99,
      "imagen": "http://localhost:3000/api/uploads/productos/iphone13.jpg"
    }
  ],
  "pagination": {
    "total": 5,
    "page": 1,
    "pages": 1,
    "limit": 20
  }
}
```

**Errores**:

- `400`: Parámetro 'q' requerido
- `500`: Error del servidor

**Ejemplo curl**:

```bash
# Buscar "iPhone"
curl -X GET "http://localhost:3000/api/almacen/productos/buscar?termino=iPhone"

# Buscar con paginación
curl -X GET "http://localhost:3000/api/almacen/productos/buscar?termino=samsung&page=2&limit=10"
```

---

## GET /productos/categoria/:categoriaId

Obtener todos los productos de una categoría específica.

**Autenticación**: ❌ No requerida

**URL Parameters**:

| Parámetro     | Tipo   | Descripción        |
| ------------- | ------ | ------------------ |
| `categoriaId` | number | ID de la categoría |

**Response 200**:

```json
{
  "success": true,
  "data": [
    {
      "id_producto": 1,
      "nombre_producto": "iPhone 13 Pro",
      "precio_producto": 999.99,
      "categoria": {
        "nombre_categoria": "Smartphones"
      }
    }
  ]
}
```

**Errores**:

- `404`: Categoría no encontrada
- `500`: Error del servidor

**Ejemplo curl**:

```bash
curl -X GET "http://localhost:3000/api/almacen/productos/categoria/1"
```

---

## GET /categorias

Obtener todas las categorías disponibles en la tienda.

**Autenticación**: ❌ No requerida

**Response 200**:

```json
{
  "success": true,
  "data": [
    {
      "id_categoria": 1,
      "nombre_categoria": "Smartphones",
      "descripcion": "Teléfonos inteligentes",
      "activo": 1
    },
    {
      "id_categoria": 2,
      "nombre_categoria": "Laptops",
      "descripcion": "Computadoras portátiles",
      "activo": 1
    }
  ]
}
```

**Ejemplo curl**:

```bash
curl -X GET "http://localhost:3000/api/almacen/categorias"
```

---

## POST /productos

Crear un nuevo producto en el catálogo.

**Autenticación**: ✅ Requerida (JWT Admin)

**Body**:

```json
{
  "codigo": "PROD-002",
  "nombre_producto": "Samsung Galaxy S21",
  "descripcion": "Smartphone Samsung con pantalla AMOLED",
  "precio_producto": 799.99,
  "stock": 30,
  "id_categoria": 1,
  "id_marca": 2,
  "destacado": 0,
  "activo": 1,
  "caracteristicas": [
    {
      "id_tipo": 1,
      "valor": "8"
    },
    {
      "id_tipo": 2,
      "valor": "128"
    }
  ]
}
```

**Response 201**:

```json
{
  "success": true,
  "data": {
    "id_producto": 101,
    "codigo": "PROD-002",
    "nombre_producto": "Samsung Galaxy S21",
    "precio_producto": 799.99,
    "stock": 30
  },
  "message": "Producto creado exitosamente"
}
```

**Errores**:

- `400`: Datos inválidos
- `401`: No autorizado
- `409`: Código de producto ya existe
- `500`: Error del servidor

**Ejemplo curl**:

```bash
curl -X POST "http://localhost:3000/api/almacen/productos" \
  -H "Authorization: Bearer {tu_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "codigo": "PROD-002",
    "nombre_producto": "Samsung Galaxy S21",
    "precio_producto": 799.99,
    "stock": 30,
    "id_categoria": 1,
    "id_marca": 2
  }'
```

---

## PUT /productos/:id

Actualizar un producto existente.

**Autenticación**: ✅ Requerida (JWT Admin)

**URL Parameters**:

| Parámetro | Tipo   | Descripción     |
| --------- | ------ | --------------- |
| `id`      | number | ID del producto |

**Body** (todos los campos opcionales):

```json
{
  "nombre_producto": "Samsung Galaxy S21 Ultra",
  "precio_producto": 899.99,
  "stock": 25,
  "destacado": 1
}
```

**Response 200**:

```json
{
  "success": true,
  "data": {
    "id_producto": 101,
    "nombre_producto": "Samsung Galaxy S21 Ultra",
    "precio_producto": 899.99
  },
  "message": "Producto actualizado exitosamente"
}
```

**Errores**:

- `400`: Datos inválidos
- `401`: No autorizado
- `404`: Producto no encontrado
- `500`: Error del servidor

**Ejemplo curl**:

```bash
curl -X PUT "http://localhost:3000/api/almacen/productos/101" \
  -H "Authorization: Bearer {tu_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "precio_producto": 899.99,
    "destacado": 1
  }'
```

---

## DELETE /productos/:id

Eliminar un producto (soft delete - marca como inactivo).

**Autenticación**: ✅ Requerida (JWT Admin)

**URL Parameters**:

| Parámetro | Tipo   | Descripción     |
| --------- | ------ | --------------- |
| `id`      | number | ID del producto |

**Response 200**:

```json
{
  "success": true,
  "message": "Producto eliminado exitosamente"
}
```

**Errores**:

- `401`: No autorizado
- `404`: Producto no encontrado
- `500`: Error del servidor

**Ejemplo curl**:

```bash
curl -X DELETE "http://localhost:3000/api/almacen/productos/101" \
  -H "Authorization: Bearer {tu_token}"
```

---

## PATCH /productos/:id/stock

Actualizar solo el stock de un producto.

**Autenticación**: ✅ Requerida (JWT Admin)

**URL Parameters**:

| Parámetro | Tipo   | Descripción     |
| --------- | ------ | --------------- |
| `id`      | number | ID del producto |

**Body**:

```json
{
  "stock": 50,
  "operacion": "agregar" // o "establecer" o "restar"
}
```

**Operaciones disponibles**:

- `agregar`: Suma la cantidad al stock actual
- `restar`: Resta la cantidad del stock actual
- `establecer`: Establece el stock en la cantidad indicada

**Response 200**:

```json
{
  "success": true,
  "data": {
    "id_producto": 1,
    "stock": 50
  },
  "message": "Stock actualizado exitosamente"
}
```

**Errores**:

- `400`: Stock inválido o negativo
- `401`: No autorizado
- `404`: Producto no encontrado
- `500`: Error del servidor

**Ejemplo curl**:

```bash
# Agregar 10 unidades al stock
curl -X PATCH "http://localhost:3000/api/almacen/productos/1/stock" \
  -H "Authorization: Bearer {tu_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "stock": 10,
    "operacion": "agregar"
  }'
```

---

## GET /diagnostico

Endpoint de diagnóstico para verificar el estado de la API de productos.

**Autenticación**: ❌ No requerida

**Response 200**:

```json
{
  "success": true,
  "data": {
    "totalProductos": 100,
    "productosActivos": 95,
    "productosDestacados": 10,
    "categorias": 8,
    "marcas": 15
  },
  "message": "Diagnóstico completado"
}
```

**Ejemplo curl**:

```bash
curl -X GET "http://localhost:3000/api/almacen/diagnostico"
```

---

## 📝 Notas Técnicas

### Imágenes de Productos

- Las URLs de imágenes son generadas automáticamente
- Formato: `http://localhost:3000/api/uploads/productos/{nombre_archivo}`
- Se sirven desde el directorio configurado en `IMAGES_PATH`
- Si no hay imagen, se usa una imagen por defecto
- Soporta múltiples imágenes por producto

### Ofertas Activas

Los productos incluyen automáticamente las ofertas activas:

- Filtradas por `activo = true`
- Fecha actual entre `fecha_inicio` y `fecha_fin`
- El precio de oferta se calcula automáticamente

### Paginación

- **Default page**: 1
- **Default limit**: 20
- **Max limit**: 100

### Búsqueda Full-Text

El endpoint de búsqueda utiliza índices FULLTEXT de MySQL:

- Busca en `nombre_producto` y `descripcion`
- Soporta búsquedas parciales
- Case-insensitive

---

## 🔗 Ver También

- [Ofertas API](./ofertas.md) - Para gestionar descuentos en productos
- [Marcas API](./marcas.md) - Para gestionar marcas
- [Upload API](./upload.md) - Para subir imágenes de productos
- [Volver al índice de API](../README.md)

---

**Última actualización**: 6 de Octubre, 2025

---

**[⬆ Volver arriba](#tabla-de-contenidos)** | **[📚 Documentación](../../../docs/README.md)** | **[🏠 Inicio](../../../README.md)**
