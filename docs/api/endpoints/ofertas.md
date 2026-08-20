[← Volver al índice de ENDPOINTS](../ENDPOINTS.md)
# Ofertas API

**Base Path**: `/api/ofertas`

Gestión de ofertas y descuentos en productos.

---

## Índice

- [Obtener ofertas activas](#get-ofertas)
- [Obtener productos en oferta](#get-ofertasproductos)
- [Crear oferta](#post-ofertas)
- [Asignar productos a oferta](#post-ofertasid_ofertaproductos)
- [Actualizar oferta](#put-ofertasid)
- [Eliminar oferta](#delete-ofertasid)

 = Requiere autenticación de administrador

---

## GET /ofertas

Obtener todas las ofertas activas vigentes.

**Autenticación**: No requerida

**Response 200**:
```json
{
  "success": true,
  "data": [
    {
      "id_oferta": 5,
      "nombre_oferta": "Black Friday 2025",
      "descripcion": "Descuentos especiales de Black Friday",
      "tipo_descuento": "porcentaje",
      "valor_descuento": 15.00,
      "fecha_inicio": "2025-11-20T00:00:00Z",
      "fecha_fin": "2025-11-30T23:59:59Z",
      "precio_minimo": null,
      "precio_maximo": null,
      "limite_uso": null,
      "uso_actual": 45,
      "activo": true,
      "fyh_creacion": "2025-11-01T10:00:00Z"
    }
  ],
  "count": 1
}
```

**Campos de la oferta**:
- `tipo_descuento`: "porcentaje" o "monto_fijo"
- `valor_descuento`: Porcentaje (0-100) o monto fijo
- `fecha_inicio` / `fecha_fin`: Rango de validez de la oferta
- `precio_minimo` / `precio_maximo`: Filtros de precio (opcional)
- `limite_uso`: Máximo de usos permitidos (opcional)
- `uso_actual`: Contador de usos actuales

**Filtrado automático**:
- Solo ofertas con `activo = true`
- Solo ofertas donde la fecha actual esté entre `fecha_inicio` y `fecha_fin`

**Ejemplo curl**:
```bash
curl -X GET "http://localhost:3000/api/ofertas"
```

---

## GET /ofertas/productos

Obtener productos que tienen ofertas activas con paginación.

**Autenticación**: No requerida

**Query Parameters**:

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `limit` | number | No | Productos por página (default: 20) |
| `offset` | number | No | Productos a saltar (default: 0) |

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
      "precio_venta": 999.99,
      "stock": 50,
      "precio_original": 999.99,
      "precio_oferta": 849.99,
      "descuento_porcentaje": "15.0",
      "en_oferta": true,
      "categoria": {
        "nombre_categoria": "Smartphones"
      },
      "marca": {
        "nombre_marca": "Apple"
      },
      "imagenes": [
        {
          "url_imagen": "http://localhost:3000/api/uploads/productos/iphone13-1.jpg",
          "alt_text": "iPhone 13 Pro frontal",
          "es_principal": true,
          "orden": 1
        }
      ],
      "ofertas": [
        {
          "id_oferta": 5,
          "nombre_oferta": "Black Friday 2025",
          "tipo_descuento": "porcentaje",
          "valor_descuento": 15.00,
          "fecha_inicio": "2025-11-20T00:00:00Z",
          "fecha_fin": "2025-11-30T23:59:59Z",
          "ProductoOferta": {
            "precio_oferta": 849.99
          }
        }
      ]
    }
  ],
  "pagination": {
    "total": 25,
    "limit": 20,
    "offset": 0,
    "pages": 2
  }
}
```

**Cálculo de precios**:
1. Si existe `ProductoOferta.precio_oferta`, se usa ese valor
2. Si no, se calcula según:
   - **Porcentaje**: `precio_original * (1 - valor_descuento / 100)`
   - **Monto fijo**: `precio_original - valor_descuento`
3. El resultado nunca es menor a 0

**Ejemplo curl**:
```bash
# Obtener primeros 20 productos en oferta
curl -X GET "http://localhost:3000/api/ofertas/productos?limit=20&offset=0"

# Segunda página
curl -X GET "http://localhost:3000/api/ofertas/productos?limit=20&offset=20"
```

---

## POST /ofertas

Crear una nueva oferta (solo administradores).

**Autenticación**: Requerida (JWT Admin)

**Body**:
```json
{
  "nombre_oferta": "Cyber Monday 2025",
  "descripcion": "Descuentos especiales de Cyber Monday",
  "tipo_descuento": "porcentaje",
  "valor_descuento": 20,
  "fecha_inicio": "2025-12-01T00:00:00Z",
  "fecha_fin": "2025-12-03T23:59:59Z",
  "precio_minimo": 100,
  "precio_maximo": 5000,
  "limite_uso": 500
}
```

**Campos**:

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `nombre_oferta` | string | Sí | Nombre de la oferta |
| `descripcion` | string | No | Descripción detallada |
| `tipo_descuento` | string | Sí | "porcentaje" o "monto_fijo" |
| `valor_descuento` | number | Sí | Valor del descuento (% o monto) |
| `fecha_inicio` | datetime | Sí | Inicio de vigencia |
| `fecha_fin` | datetime | Sí | Fin de vigencia |
| `precio_minimo` | number | No | Precio mínimo para aplicar |
| `precio_maximo` | number | No | Precio máximo para aplicar |
| `limite_uso` | number | No | Máximo de usos permitidos |

**Response 201**:
```json
{
  "success": true,
  "message": "Oferta creada exitosamente",
  "data": {
    "id_oferta": 6,
    "nombre_oferta": "Cyber Monday 2025",
    "tipo_descuento": "porcentaje",
    "valor_descuento": 20.00,
    "fecha_inicio": "2025-12-01T00:00:00Z",
    "fecha_fin": "2025-12-03T23:59:59Z",
    "precio_minimo": 100.00,
    "precio_maximo": 5000.00,
    "limite_uso": 500,
    "activo": true,
    "uso_actual": 0,
    "fyh_creacion": "2025-10-06T16:00:00Z"
  }
}
```

**Validaciones**:
- `fecha_fin` debe ser posterior a `fecha_inicio`
- `tipo_descuento` solo acepta "porcentaje" o "monto_fijo"
- Si es porcentaje, `valor_descuento` debe estar entre 0 y 100

**Errores**:
- `400`: Campos requeridos faltantes
- `401`: No autorizado
- `500`: Error del servidor

**Ejemplo curl**:
```bash
curl -X POST "http://localhost:3000/api/ofertas" \
  -H "Authorization: Bearer {tu_token_admin}" \
  -H "Content-Type: application/json" \
  -d '{
    "nombre_oferta": "Cyber Monday 2025",
    "tipo_descuento": "porcentaje",
    "valor_descuento": 20,
    "fecha_inicio": "2025-12-01T00:00:00Z",
    "fecha_fin": "2025-12-03T23:59:59Z"
  }'
```

---

## POST /ofertas/:id_oferta/productos

Asignar productos a una oferta existente.

**Autenticación**: Requerida (JWT Admin)

**URL Parameters**:

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `id_oferta` | number | ID de la oferta |

**Body**:
```json
{
  "productos": [
    {
      "id_producto": 1,
      "precio_oferta": 849.99
    },
    {
      "id_producto": 2
    },
    {
      "id_producto": 5,
      "precio_oferta": 299.99
    }
  ]
}
```

**Campos del array productos**:

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `id_producto` | number | Sí | ID del producto a incluir |
| `precio_oferta` | number | No | Precio específico de oferta (opcional) |

**Comportamiento**:
- Si se especifica `precio_oferta`, se usa ese valor exacto
- Si no se especifica, se calcula automáticamente según la configuración de la oferta:
  - **Porcentaje**: `precio_venta * (1 - valor_descuento / 100)`
  - **Monto fijo**: `precio_venta - valor_descuento`
- Si un producto ya está en la oferta, se omite (no se duplica)
- Los productos inexistentes se omiten con un warning en logs

**Response 200**:
```json
{
  "success": true,
  "message": "3 productos asignados a la oferta",
  "data": [
    {
      "id_producto": 1,
      "id_oferta": 6,
      "precio_oferta": 849.99,
      "fyh_creacion": "2025-10-06T16:30:00Z"
    },
    {
      "id_producto": 2,
      "id_oferta": 6,
      "precio_oferta": 799.99,
      "fyh_creacion": "2025-10-06T16:30:00Z"
    },
    {
      "id_producto": 5,
      "id_oferta": 6,
      "precio_oferta": 299.99,
      "fyh_creacion": "2025-10-06T16:30:00Z"
    }
  ]
}
```

**Errores**:
- `400`: Array de productos vacío o inválido
- `401`: No autorizado
- `404`: Oferta no encontrada
- `500`: Error del servidor

**Ejemplo curl**:
```bash
curl -X POST "http://localhost:3000/api/ofertas/6/productos" \
  -H "Authorization: Bearer {tu_token_admin}" \
  -H "Content-Type: application/json" \
  -d '{
    "productos": [
      {"id_producto": 1, "precio_oferta": 849.99},
      {"id_producto": 2},
      {"id_producto": 5, "precio_oferta": 299.99}
    ]
  }'
```

---

## PUT /ofertas/:id

Actualizar una oferta existente.

**Autenticación**: Requerida (JWT Admin)

**URL Parameters**:

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `id` | number | ID de la oferta |

**Body** (todos los campos opcionales):
```json
{
  "nombre_oferta": "Black Friday Extended",
  "descripcion": "Oferta extendida hasta diciembre",
  "valor_descuento": 25,
  "fecha_fin": "2025-12-05T23:59:59Z",
  "activo": true
}
```

**Response 200**:
```json
{
  "success": true,
  "message": "Oferta actualizada exitosamente",
  "data": {
    "id_oferta": 5,
    "nombre_oferta": "Black Friday Extended",
    "descripcion": "Oferta extendida hasta diciembre",
    "tipo_descuento": "porcentaje",
    "valor_descuento": 25.00,
    "fecha_inicio": "2025-11-20T00:00:00Z",
    "fecha_fin": "2025-12-05T23:59:59Z",
    "activo": true,
    "fyh_actualizacion": "2025-10-06T17:00:00Z"
  }
}
```

**Errores**:
- `401`: No autorizado
- `404`: Oferta no encontrada
- `500`: Error del servidor

**Ejemplo curl**:
```bash
curl -X PUT "http://localhost:3000/api/ofertas/5" \
  -H "Authorization: Bearer {tu_token_admin}" \
  -H "Content-Type: application/json" \
  -d '{
    "valor_descuento": 25,
    "fecha_fin": "2025-12-05T23:59:59Z"
  }'
```

---

## DELETE /ofertas/:id

Eliminar (desactivar) una oferta.

**Autenticación**: Requerida (JWT Admin)

**URL Parameters**:

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `id` | number | ID de la oferta |

**Response 200**:
```json
{
  "success": true,
  "message": "Oferta eliminada exitosamente"
}
```

**Comportamiento**:
- Soft delete: marca `activo = false`
- No elimina los registros de la base de datos
- La oferta deja de aparecer en ofertas activas
- Los productos pierden el descuento inmediatamente

**Errores**:
- `401`: No autorizado
- `404`: Oferta no encontrada
- `500`: Error del servidor

**Ejemplo curl**:
```bash
curl -X DELETE "http://localhost:3000/api/ofertas/5" \
  -H "Authorization: Bearer {tu_token_admin}"
```

---

## Notas Técnicas

### Tipos de Descuento

**Porcentaje**:
- `tipo_descuento = "porcentaje"`
- `valor_descuento`: número entre 0 y 100
- Fórmula: `precio_final = precio_original * (1 - valor_descuento / 100)`
- Ejemplo: 15% de descuento en producto de $1000 = $850

**Monto Fijo**:
- `tipo_descuento = "monto_fijo"`
- `valor_descuento`: monto a descontar
- Fórmula: `precio_final = precio_original - valor_descuento`
- Ejemplo: $200 de descuento en producto de $1000 = $800

### Vigencia de Ofertas

Las ofertas se consideran activas cuando:
1. `activo = true`
2. `fecha_actual >= fecha_inicio`
3. `fecha_actual <= fecha_fin`

### Límites y Restricciones

**Precio Mínimo / Máximo** (opcional):
- `precio_minimo`: Solo aplica a productos con precio >= este valor
- `precio_maximo`: Solo aplica a productos con precio <= este valor
- Si no se especifican, la oferta aplica a todos los precios

**Límite de Uso** (opcional):
- `limite_uso`: Máximo de veces que se puede usar la oferta
- `uso_actual`: Contador que se incrementa en cada uso
- Cuando `uso_actual >= limite_uso`, la oferta ya no se aplica
- Si `limite_uso = null`, no hay límite

### Asignación de Productos

**Relación ProductoOferta**:
- Tabla intermedia entre Producto y Oferta
- Permite precio personalizado por producto
- Si no hay precio personalizado, se calcula automáticamente

**Cálculo Automático**:
```javascript
// Si no se especifica precio_oferta:
if (tipo_descuento === 'porcentaje') {
  precio_oferta = precio_venta * (1 - valor_descuento / 100);
} else {
  precio_oferta = precio_venta - valor_descuento;
}
precio_oferta = Math.max(0, precio_oferta); // Nunca negativo
```

### Estados y Ciclo de Vida

1. **Creación**: `activo = true`, `uso_actual = 0`
2. **Activa**: Dentro del rango de fechas y con `activo = true`
3. **Expirada**: Fuera del rango de fechas (automático)
4. **Desactivada**: `activo = false` (manual)
5. **Límite alcanzado**: `uso_actual >= limite_uso`

### Imágenes en Productos de Oferta

- Se incluyen todas las imágenes del producto
- URLs transformadas automáticamente por el servicio de imágenes
- Ordenadas por `es_principal` y `orden`
- Incluye `alt_text` para accesibilidad

---

## Ver También

- [Productos API](./productos.md) - Para consultar productos disponibles
- [Carrito API](./carrito.md) - Los precios de oferta se aplican en el carrito
- [Volver al índice de API](../ENDPOINTS.md)

---

**Última actualización**: 6 de Octubre, 2025

---

[Volver arriba](#tabla-de-contenidos) | [Documentación](../../../docs/README.md) | [Inicio](../../../README.md)