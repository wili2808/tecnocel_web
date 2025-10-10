[← Volver al índice de ENDPOINTS](../ENDPOINTS.md)
# Marcas API

**Base Path**: `/api/marcas`

Gestión de marcas de productos.

---

## 📋 Índice

- [Obtener todas las marcas](#get-marcas)
- [Obtener marca por ID](#get-marcasid)
- [Crear marca](#post-marcas) 🔒
- [Actualizar marca](#put-marcasid) 🔒
- [Eliminar marca](#delete-marcasid) 🔒

🔒 = Requiere autenticación de administrador

---

## GET /marcas

Obtener todas las marcas activas ordenadas alfabéticamente.

**Autenticación**: ❌ No requerida

**Response 200**:
```json
{
  "success": true,
  "data": [
    {
      "id_marca": 1,
      "nombre_marca": "Apple",
      "logo_marca": "marcas/apple-logo.png",
      "descripcion_marca": "Innovación y diseño premium",
      "activo": true,
      "fyh_creacion": "2025-01-01T10:00:00Z",
      "fyh_actualizacion": "2025-01-01T10:00:00Z"
    },
    {
      "id_marca": 2,
      "nombre_marca": "Samsung",
      "logo_marca": "marcas/samsung-logo.png",
      "descripcion_marca": "Tecnología de vanguardia",
      "activo": true,
      "fyh_creacion": "2025-01-01T10:00:00Z",
      "fyh_actualizacion": "2025-01-01T10:00:00Z"
    }
  ],
  "count": 2
}
```

**Ordenamiento**:
- Por nombre de marca ASC (A-Z)

**Filtrado**:
- Solo marcas con `activo = true`

**Errores**:
- `500`: Error del servidor

**Ejemplo curl**:
```bash
curl -X GET "http://localhost:3000/api/marcas"
```

---

## GET /marcas/:id

Obtener información de una marca específica por ID.

**Autenticación**: ❌ No requerida

**URL Parameters**:

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `id` | number | ID de la marca |

**Response 200**:
```json
{
  "success": true,
  "data": {
    "id_marca": 1,
    "nombre_marca": "Apple",
    "logo_marca": "marcas/apple-logo.png",
    "descripcion_marca": "Innovación y diseño premium",
    "activo": true,
    "fyh_creacion": "2025-01-01T10:00:00Z",
    "fyh_actualizacion": "2025-01-01T10:00:00Z"
  }
}
```

**Errores**:
- `404`: Marca no encontrada o inactiva
- `500`: Error del servidor

**Ejemplo curl**:
```bash
curl -X GET "http://localhost:3000/api/marcas/1"
```

---

## POST /marcas

Crear una nueva marca (solo administradores).

**Autenticación**: ✅ Requerida (JWT Admin)

**Body**:
```json
{
  "nombre_marca": "Xiaomi",
  "logo_marca": "marcas/xiaomi-logo.png",
  "descripcion_marca": "Innovación para todos"
}
```

**Campos**:

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `nombre_marca` | string | Sí | Nombre de la marca (único) |
| `logo_marca` | string | No | Ruta del logo de la marca |
| `descripcion_marca` | string | No | Descripción breve de la marca |

**Response 201**:
```json
{
  "success": true,
  "message": "Marca creada exitosamente",
  "data": {
    "id_marca": 3,
    "nombre_marca": "Xiaomi",
    "logo_marca": "marcas/xiaomi-logo.png",
    "descripcion_marca": "Innovación para todos",
    "activo": true,
    "fyh_creacion": "2025-10-06T16:00:00Z",
    "fyh_actualizacion": "2025-10-06T16:00:00Z"
  }
}
```

**Validaciones**:
- El nombre de la marca es único (no se permiten duplicados)
- Se crea con `activo = true` por defecto

**Errores**:
- `400`: Nombre de marca requerido o duplicado
- `401`: No autorizado
- `500`: Error del servidor

**Ejemplo curl**:
```bash
curl -X POST "http://localhost:3000/api/marcas" \
  -H "Authorization: Bearer {tu_token_admin}" \
  -H "Content-Type: application/json" \
  -d '{
    "nombre_marca": "Xiaomi",
    "logo_marca": "marcas/xiaomi-logo.png",
    "descripcion_marca": "Innovación para todos"
  }'
```

---

## PUT /marcas/:id

Actualizar información de una marca existente.

**Autenticación**: ✅ Requerida (JWT Admin)

**URL Parameters**:

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `id` | number | ID de la marca |

**Body** (todos los campos opcionales):
```json
{
  "nombre_marca": "Xiaomi Corporation",
  "logo_marca": "marcas/xiaomi-new-logo.png",
  "descripcion_marca": "Mi, innovación para todos",
  "activo": true
}
```

**Campos**:

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `nombre_marca` | string | No | Nuevo nombre de la marca |
| `logo_marca` | string | No | Nueva ruta del logo |
| `descripcion_marca` | string | No | Nueva descripción |
| `activo` | boolean | No | Activar/desactivar marca |

**Response 200**:
```json
{
  "success": true,
  "message": "Marca actualizada exitosamente",
  "data": {
    "id_marca": 3,
    "nombre_marca": "Xiaomi Corporation",
    "logo_marca": "marcas/xiaomi-new-logo.png",
    "descripcion_marca": "Mi, innovación para todos",
    "activo": true,
    "fyh_creacion": "2025-10-06T16:00:00Z",
    "fyh_actualizacion": "2025-10-06T17:00:00Z"
  }
}
```

**Errores**:
- `401`: No autorizado
- `404`: Marca no encontrada
- `500`: Error del servidor

**Ejemplo curl**:
```bash
curl -X PUT "http://localhost:3000/api/marcas/3" \
  -H "Authorization: Bearer {tu_token_admin}" \
  -H "Content-Type: application/json" \
  -d '{
    "nombre_marca": "Xiaomi Corporation",
    "descripcion_marca": "Mi, innovación para todos"
  }'
```

---

## DELETE /marcas/:id

Eliminar (desactivar) una marca.

**Autenticación**: ✅ Requerida (JWT Admin)

**URL Parameters**:

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `id` | number | ID de la marca |

**Response 200**:
```json
{
  "success": true,
  "message": "Marca eliminada exitosamente"
}
```

**Comportamiento**:
- Soft delete: marca `activo = false`
- No elimina el registro de la base de datos
- La marca deja de aparecer en listados públicos
- Los productos asociados mantienen la relación pero la marca no es visible

**Errores**:
- `401`: No autorizado
- `404`: Marca no encontrada
- `500`: Error del servidor

**Ejemplo curl**:
```bash
curl -X DELETE "http://localhost:3000/api/marcas/3" \
  -H "Authorization: Bearer {tu_token_admin}"
```

---

## 📝 Notas Técnicas

### Estructura de Marca

**Campos principales**:
- `id_marca`: ID único auto-incremental
- `nombre_marca`: Nombre único de la marca (índice UNIQUE)
- `logo_marca`: Ruta relativa al logo (opcional)
- `descripcion_marca`: Descripción breve (opcional)
- `activo`: Estado de visibilidad (boolean)
- `fyh_creacion`: Fecha de creación (auto)
- `fyh_actualizacion`: Fecha de última actualización (auto)

### Validaciones

**Nombre de marca**:
- Requerido al crear
- Debe ser único en la base de datos
- Sensible a mayúsculas/minúsculas según configuración de BD

**Logo de marca**:
- Opcional
- Almacena solo la ruta relativa
- Se espera que la imagen esté en `uploads/marcas/`
- URL completa se genera en frontend: `http://localhost:3000/api/images/{logo_marca}`

### Soft Delete

Cuando se "elimina" una marca:
- Se marca `activo = false`
- No se borra de la base de datos
- Deja de aparecer en GET /marcas
- Los productos siguen teniendo la relación
- Se puede reactivar cambiando `activo = true`

### Relación con Productos

- Una marca puede tener múltiples productos (1:N)
- Un producto pertenece a una marca (N:1)
- Campo en producto: `id_marca` (FK opcional)
- Si se desactiva una marca, los productos asociados siguen existiendo
- Recomendado: No permitir desactivar marcas con productos activos

### Uso en Frontend

**Filtros de búsqueda**:
```javascript
// Mostrar selector de marcas
const marcas = await fetch('/api/marcas');
// Filtrar productos por marca
const productos = await fetch('/api/almacen?id_marca=1');
```

**Mostrar logo**:
```javascript
// URL completa del logo
const logoUrl = `http://localhost:3000/api/images/${marca.logo_marca}`;
```

### Ordenamiento

Las marcas se retornan ordenadas alfabéticamente para:
- Facilitar búsqueda visual
- Consistencia en selectores/dropdowns
- Mejor experiencia de usuario

### Estados

- **Activa** (`activo = true`): Visible en listados públicos
- **Inactiva** (`activo = false`): Oculta, solo visible para admins

---

## 🔗 Ver También

- [Productos API](./productos.md) - Para filtrar productos por marca
- [Volver al índice de API](../README.md)

---

**Última actualización**: 6 de Octubre, 2025

---

**[⬆ Volver arriba](#tabla-de-contenidos)** | **[📚 Documentación](../../../docs/README.md)** | **[🏠 Inicio](../../../README.md)**
