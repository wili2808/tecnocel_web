[← Volver al índice de ENDPOINTS](../ENDPOINTS.md)

# Compras a Proveedores API

**Base Path**: `/api/compras`

Gestión de compras internas a proveedores con control de stock y auditoría.

---

## Índice

- [Listar compras](#get-adminlistar)
- [Obtener detalle](#get-adminid)
- [Registrar compra](#post-adminregistrar)
- [Anular compra](#patch-adminidanular)
- [Estadísticas](#get-adminestadisticas)

 = Requiere autenticación + rol ADMIN/GERENTE

---

## GET /admin/listar

Obtener lista de compras con paginación y filtros.

**Autenticación**: Requerida (ADMIN, GERENTE, VENDEDOR)

**Query Parameters**:

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `limit` | number | No | Items por página (default: 20, max: 100) |
| `offset` | number | No | Desplazamiento (default: 0) |
| `fecha_inicio` | string | No | Fecha inicio (YYYY-MM-DD) |
| `fecha_fin` | string | No | Fecha fin (YYYY-MM-DD) |
| `id_proveedor` | number | No | Filtrar por proveedor |
| `estado` | string | No | Filtrar por estado (activa\|anulada) |
| `search` | string | No | Buscar por: C-00001, 1, nombre proveedor |

**Response 200**:

```json
{
  "success": true,
  "data": [
    {
      "id_compra": 1,
      "nro_compra": "C-00001",
      "fecha_compra": "2026-03-25T10:30:00Z",
      "comprobante": "FACT-001",
      "estado": "activa",
      "precio_total": "15000.00",
      "id_proveedor": 1,
      "nombre_proveedor": "Tech Distributor",
      "empresa_proveedor": "TechDist S.A.",
      "id_usuario": 1,
      "nombre_usuario": "Admin",
      "cantidad_items": 5,
      "fyh_creacion": "2026-03-25T10:30:00Z"
    }
  ],
  "total": 50,
  "limit": 20,
  "offset": 0
}
```

---

## GET /admin/:id

Obtener detalle completo de una compra.

**Autenticación**: Requerida (ADMIN, GERENTE, VENDEDOR)

**Path Parameters**:

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `id` | number | ID de la compra |

**Response 200**:

```json
{
  "success": true,
  "data": {
    "id_compra": 1,
    "nro_compra": "C-00001",
    "fecha_compra": "2026-03-25",
    "comprobante": "FACT-001",
    "estado": "activa",
    "precio_total": "15000.00",
    "observaciones": "Compra inicial",
    "motivo_anulacion": null,
    "nombre_proveedor": "Tech Distributor",
    "empresa_proveedor": "TechDist S.A.",
    "celular_proveedor": "1234567890",
    "email_proveedor": "contacto@techdist.com",
    "nombre_usuario": "Admin",
    "items": [
      {
        "id_detalle_compra": 1,
        "id_producto": 100,
        "nombre_producto": "iPhone 14",
        "codigo_producto": "IPH14",
        "cantidad": 5,
        "precio_unitario": 3000,
        "subtotal": 15000
      }
    ]
  }
}
```

---

## POST /admin/registrar

Registrar una nueva compra a proveedor.

**Autenticación**: Requerida (ADMIN, GERENTE)

**Request Body**:

```json
{
  "id_proveedor": 1,
  "fecha_compra": "2026-03-25",
  "comprobante": "FACT-001",
  "observaciones": "Compra mensual",
  "items": [
    {
      "id_producto": 100,
      "cantidad": 5,
      "precio_unitario": 3000
    },
    {
      "es_nuevo": true,
      "nuevo_codigo": "NEW001",
      "nuevo_nombre": "Nuevo Producto",
      "nuevo_precio_venta": 5000,
      "nuevo_id_categoria": 5,
      "nuevo_id_marca": 2,
      "cantidad": 10,
      "precio_unitario": 2000
    }
  ]
}
```

**Response 201**:

```json
{
  "success": true,
  "data": {
    "id_compra": 1,
    "nro_compra": "C-00001",
    "precio_total": "35000.00",
    "estado": "activa",
    "fyh_creacion": "2026-03-25T10:30:00Z"
  }
}
```

**Validaciones**:
- `id_proveedor` requerido
- `items` no puede estar vacío (mín 1)
- Productos nuevos: código, nombre, precio_venta, categoría requeridos
- Stock se incrementa automáticamente

---

## PATCH /admin/:id/anular

Anular una compra activa con reversión de stock.

**Autenticación**: Requerida (ADMIN, GERENTE)

**Path Parameters**:

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `id` | number | ID de la compra |

**Request Body**:

```json
{
  "motivo": "Error en cantidad"
}
```

**Response 200**:

```json
{
  "success": true,
  "data": {
    "id_compra": 1,
    "nro_compra": "C-00001",
    "estado": "anulada"
  }
}
```

**Validaciones**:
- Compra debe estar en estado "activa"
- Stock se revierte automáticamente
- Motivo se guarda para auditoría

---

## GET /admin/estadisticas

Obtener estadísticas de compras.

**Autenticación**: Requerida (ADMIN, GERENTE)

**Response 200**:

```json
{
  "success": true,
  "data": {
    "compras_hoy": 5,
    "compras_semana": 25,
    "compras_mes": 100,
    "gasto_mes": "150000.00"
  }
}
```

---

## Búsqueda Inteligente

El parámetro `search` acepta múltiples formatos:

**Ejemplos válidos**:
- `C-00001` - Número formateado
- `C-1` - Número corto
- `1` - Solo número
- `Tech Distributor` - Nombre proveedor
- `contacto@techdist.com` - Email proveedor
- `1234567890` - Celular proveedor

---

## Códigos de Error

| Código | Descripción |
|--------|-------------|
| 400 | Datos inválidos o incompletos |
| 401 | No autenticado |
| 403 | Sin permisos (rol insuficiente) |
| 404 | Compra no encontrada |
| 500 | Error interno del servidor |

