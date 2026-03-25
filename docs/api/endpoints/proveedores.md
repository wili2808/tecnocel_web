[← Volver al índice de ENDPOINTS](../ENDPOINTS.md)

# Proveedores API

**Base Path**: `/api/proveedores`

Gestión de proveedores para compras internas.

---

## 📋 Índice

- [Listar proveedores](#get-)
- [Obtener proveedor](#get-id) 🔒
- [Crear proveedor](#post-) 🔒
- [Actualizar proveedor](#put-id) 🔒
- [Eliminar proveedor](#delete-id) 🔒

🔒 = Requiere autenticación + rol ADMIN/GERENTE

---

## GET /

Obtener lista de proveedores con búsqueda opcional.

**Autenticación**: 🔒 Requerida (ADMIN, GERENTE, VENDEDOR)

**Query Parameters**:

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `search` | string | No | Buscar por: nombre, empresa, celular, email |

**Response 200**:

```json
{
  "success": true,
  "data": [
    {
      "id_proveedor": 1,
      "nombre_proveedor": "Tech Distributor",
      "empresa": "TechDist S.A.",
      "celular": "1234567890",
      "telefono": "0341-1234567",
      "email": "contacto@techdist.com",
      "direccion": "Av. Siempreviva 123, Rosario",
      "fyh_creacion": "2026-03-01T10:00:00Z",
      "fyh_actualizacion": "2026-03-25T14:30:00Z"
    }
  ],
  "count": 15
}
```

---

## GET /:id

Obtener detalle de un proveedor.

**Autenticación**: 🔒 Requerida (ADMIN, GERENTE, VENDEDOR)

**Path Parameters**:

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `id` | number | ID del proveedor |

**Response 200**:

```json
{
  "success": true,
  "data": {
    "id_proveedor": 1,
    "nombre_proveedor": "Tech Distributor",
    "empresa": "TechDist S.A.",
    "celular": "1234567890",
    "telefono": "0341-1234567",
    "email": "contacto@techdist.com",
    "direccion": "Av. Siempreviva 123, Rosario",
    "fyh_creacion": "2026-03-01T10:00:00Z",
    "fyh_actualizacion": "2026-03-25T14:30:00Z"
  }
}
```

---

## POST /

Crear un nuevo proveedor.

**Autenticación**: 🔒 Requerida (ADMIN, GERENTE)

**Request Body**:

```json
{
  "nombre_proveedor": "Tech Distributor",
  "empresa": "TechDist S.A.",
  "celular": "1234567890",
  "telefono": "0341-1234567",
  "email": "contacto@techdist.com",
  "direccion": "Av. Siempreviva 123, Rosario"
}
```

**Response 201**:

```json
{
  "success": true,
  "data": {
    "id_proveedor": 1,
    "nombre_proveedor": "Tech Distributor",
    "empresa": "TechDist S.A.",
    "celular": "1234567890",
    "telefono": "0341-1234567",
    "email": "contacto@techdist.com",
    "direccion": "Av. Siempreviva 123, Rosario"
  }
}
```

**Validaciones**:
- `nombre_proveedor` requerido (máx 100 caracteres)
- `empresa` requerida (máx 100 caracteres)
- `celular` requerido (máx 20 caracteres)
- `email` opcional (validar formato)
- `direccion` requerida (máx 255 caracteres)

---

## PUT /:id

Actualizar datos de un proveedor.

**Autenticación**: 🔒 Requerida (ADMIN, GERENTE)

**Path Parameters**:

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `id` | number | ID del proveedor |

**Request Body** (todos los campos opcionales):

```json
{
  "nombre_proveedor": "Tech Distributor Plus",
  "empresa": "TechDist Plus S.A.",
  "celular": "9876543210",
  "telefono": "0341-7654321",
  "email": "nuevo@techdist.com",
  "direccion": "Av. Siempreviva 456, Rosario"
}
```

**Response 200**:

```json
{
  "success": true,
  "data": {
    "id_proveedor": 1,
    "nombre_proveedor": "Tech Distributor Plus",
    "empresa": "TechDist Plus S.A.",
    "celular": "9876543210",
    "telefono": "0341-7654321",
    "email": "nuevo@techdist.com",
    "direccion": "Av. Siempreviva 456, Rosario",
    "fyh_actualizacion": "2026-03-25T15:00:00Z"
  }
}
```

---

## DELETE /:id

Eliminar un proveedor.

**Autenticación**: 🔒 Requerida (ADMIN)

**Path Parameters**:

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `id` | number | ID del proveedor |

**Response 200**:

```json
{
  "success": true,
  "message": "Proveedor eliminado"
}
```

**Validaciones**:
- Proveedor debe existir
- Se valida que no tenga compras activas asociadas

---

## 🔍 Búsqueda Inteligente

El parámetro `search` busca en:
- Nombre del proveedor
- Empresa
- Celular
- Email

**Ejemplo**:
- `GET /proveedores?search=Tech` → Retorna todos los proveedores con "Tech" en nombre
- `GET /proveedores?search=1234567890` → Retorna por celular
- `GET /proveedores?search=contacto@` → Retorna por email

---

## ⚠️ Códigos de Error

| Código | Descripción |
|--------|-------------|
| 400 | Datos inválidos o incompletos |
| 401 | No autenticado |
| 403 | Sin permisos (rol insuficiente) |
| 404 | Proveedor no encontrado |
| 500 | Error interno del servidor |

