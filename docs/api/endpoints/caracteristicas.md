[← Volver al índice de ENDPOINTS](../ENDPOINTS.md)
# Características API

**Base Path**: `/api/caracteristicas`

Gestión de características técnicas de productos.

---

## Índice

- [Características API](#características-api)
  - [Índice](#índice)
  - [GET /caracteristicas/tipos](#get-caracteristicastipos)
  - [GET /caracteristicas/producto/:id\_producto](#get-caracteristicasproductoid_producto)
  - [POST /caracteristicas/producto/:id\_producto](#post-caracteristicasproductoid_producto)
  - [PUT /caracteristicas/:id\_caracteristica](#put-caracteristicasid_caracteristica)
  - [DELETE /caracteristicas/:id\_caracteristica](#delete-caracteristicasid_caracteristica)
  - [POST /caracteristicas/tipos](#post-caracteristicastipos)
  - [Notas Técnicas](#notas-técnicas)
    - [Tipos de Datos Soportados](#tipos-de-datos-soportados)
    - [Estructura de Características](#estructura-de-características)
    - [Unidades de Medida Comunes](#unidades-de-medida-comunes)
    - [Validación de Duplicados](#validación-de-duplicados)
    - [Casos de Uso](#casos-de-uso)
    - [Estados y Activación](#estados-y-activación)
  - [Ver También](#ver-también)

🔒 = Requiere autenticación de administrador

---

## GET /caracteristicas/tipos

Obtener todos los tipos de características disponibles.

**Autenticación**: ❌ No requerida

**Response 200**:
```json
{
  "success": true,
  "data": [
    {
      "id_tipo": 1,
      "nombre_tipo": "Pantalla",
      "descripcion": "Tamaño de pantalla",
      "tipo_dato": "texto",
      "unidad_medida": "pulgadas",
      "opciones_seleccion": null,
      "activo": true,
      "fyh_creacion": "2025-01-01T10:00:00Z"
    },
    {
      "id_tipo": 2,
      "nombre_tipo": "RAM",
      "descripcion": "Memoria RAM",
      "tipo_dato": "texto",
      "unidad_medida": "GB",
      "opciones_seleccion": null,
      "activo": true,
      "fyh_creacion": "2025-01-01T10:00:00Z"
    },
    {
      "id_tipo": 3,
      "nombre_tipo": "Color",
      "descripcion": "Color del producto",
      "tipo_dato": "seleccion",
      "unidad_medida": null,
      "opciones_seleccion": "Negro,Blanco,Azul,Rojo,Verde",
      "activo": true,
      "fyh_creacion": "2025-01-01T10:00:00Z"
    }
  ],
  "count": 3
}
```

**Campos de tipo_caracteristica**:
- `tipo_dato`: "texto", "numero", "seleccion", "booleano"
- `unidad_medida`: Opcional (ej: "GB", "pulgadas", "MP")
- `opciones_seleccion`: Lista separada por comas para tipo "seleccion"

**Filtrado**:
- Solo muestra tipos con `activo = true`
- Ordenados alfabéticamente por nombre

**Errores**:
- `500`: Error del servidor

**Ejemplo curl**:
```bash
curl -X GET "http://localhost:3000/api/caracteristicas/tipos"
```

---

## GET /caracteristicas/producto/:id_producto

Obtener todas las características de un producto específico.

**Autenticación**: ❌ No requerida

**URL Parameters**:

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `id_producto` | number | ID del producto |

**Response 200**:
```json
{
  "success": true,
  "data": [
    {
      "id_caracteristica": 10,
      "id_producto": 1,
      "id_tipo": 1,
      "valor": "6.1",
      "fyh_creacion": "2025-10-01T10:00:00Z",
      "fyh_actualizacion": "2025-10-01T10:00:00Z",
      "tipo": {
        "id_tipo": 1,
        "nombre_tipo": "Pantalla",
        "descripcion": "Tamaño de pantalla",
        "tipo_dato": "texto",
        "unidad_medida": "pulgadas",
        "activo": true
      }
    },
    {
      "id_caracteristica": 11,
      "id_producto": 1,
      "id_tipo": 2,
      "valor": "6",
      "fyh_creacion": "2025-10-01T10:00:00Z",
      "fyh_actualizacion": "2025-10-01T10:00:00Z",
      "tipo": {
        "id_tipo": 2,
        "nombre_tipo": "RAM",
        "descripcion": "Memoria RAM",
        "tipo_dato": "texto",
        "unidad_medida": "GB",
        "activo": true
      }
    }
  ],
  "count": 2
}
```

**Ordenamiento**:
- Por fecha de creación ASC (características más antiguas primero)

**Errores**:
- `500`: Error del servidor

**Ejemplo curl**:
```bash
curl -X GET "http://localhost:3000/api/caracteristicas/producto/1"
```

---

## POST /caracteristicas/producto/:id_producto

Agregar una característica a un producto (solo administradores).

**Autenticación**: ✅ Requerida (JWT Admin)

**URL Parameters**:

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `id_producto` | number | ID del producto |

**Body**:
```json
{
  "id_tipo": 1,
  "valor": "6.1"
}
```

**Campos**:

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `id_tipo` | number | Sí | ID del tipo de característica |
| `valor` | string | Sí | Valor de la característica |

**Response 201**:
```json
{
  "success": true,
  "message": "Característica agregada exitosamente",
  "data": {
    "id_caracteristica": 12,
    "id_producto": 1,
    "id_tipo": 1,
    "valor": "6.1",
    "fyh_creacion": "2025-10-06T16:00:00Z",
    "fyh_actualizacion": "2025-10-06T16:00:00Z",
    "tipo": {
      "id_tipo": 1,
      "nombre_tipo": "Pantalla",
      "descripcion": "Tamaño de pantalla",
      "tipo_dato": "texto",
      "unidad_medida": "pulgadas",
      "activo": true
    }
  }
}
```

**Validaciones**:
- El producto debe existir
- El tipo de característica debe existir y estar activo
- No se pueden duplicar características (mismo producto + tipo)

**Errores**:
- `400`: Campos requeridos faltantes o característica duplicada
- `401`: No autorizado
- `404`: Producto o tipo de característica no encontrado
- `500`: Error del servidor

**Ejemplo curl**:
```bash
curl -X POST "http://localhost:3000/api/caracteristicas/producto/1" \
  -H "Authorization: Bearer {tu_token_admin}" \
  -H "Content-Type: application/json" \
  -d '{
    "id_tipo": 1,
    "valor": "6.1"
  }'
```

---

## PUT /caracteristicas/:id_caracteristica

Actualizar el valor de una característica.

**Autenticación**: ✅ Requerida (JWT Admin)

**URL Parameters**:

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `id_caracteristica` | number | ID de la característica |

**Body**:
```json
{
  "valor": "6.7"
}
```

**Campos**:

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `valor` | string | Sí | Nuevo valor de la característica |

**Response 200**:
```json
{
  "success": true,
  "message": "Característica actualizada exitosamente",
  "data": {
    "id_caracteristica": 12,
    "id_producto": 1,
    "id_tipo": 1,
    "valor": "6.7",
    "fyh_creacion": "2025-10-06T16:00:00Z",
    "fyh_actualizacion": "2025-10-06T17:00:00Z",
    "tipo": {
      "id_tipo": 1,
      "nombre_tipo": "Pantalla",
      "unidad_medida": "pulgadas"
    }
  }
}
```

**Errores**:
- `400`: Valor no proporcionado
- `401`: No autorizado
- `404`: Característica no encontrada
- `500`: Error del servidor

**Ejemplo curl**:
```bash
curl -X PUT "http://localhost:3000/api/caracteristicas/12" \
  -H "Authorization: Bearer {tu_token_admin}" \
  -H "Content-Type: application/json" \
  -d '{
    "valor": "6.7"
  }'
```

---

## DELETE /caracteristicas/:id_caracteristica

Eliminar una característica de un producto.

**Autenticación**: ✅ Requerida (JWT Admin)

**URL Parameters**:

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `id_caracteristica` | number | ID de la característica |

**Response 200**:
```json
{
  "success": true,
  "message": "Característica eliminada exitosamente"
}
```

**Comportamiento**:
- Eliminación permanente (hard delete)
- Se elimina el registro de la base de datos

**Errores**:
- `401`: No autorizado
- `404`: Característica no encontrada
- `500`: Error del servidor

**Ejemplo curl**:
```bash
curl -X DELETE "http://localhost:3000/api/caracteristicas/12" \
  -H "Authorization: Bearer {tu_token_admin}"
```

---

## POST /caracteristicas/tipos

Crear un nuevo tipo de característica (solo administradores).

**Autenticación**: ✅ Requerida (JWT Admin)

**Body**:
```json
{
  "nombre_tipo": "Almacenamiento",
  "descripcion": "Capacidad de almacenamiento interno",
  "tipo_dato": "texto",
  "unidad_medida": "GB",
  "opciones_seleccion": null
}
```

**Campos**:

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `nombre_tipo` | string | Sí | Nombre del tipo de característica |
| `descripcion` | string | No | Descripción del tipo |
| `tipo_dato` | string | No | "texto", "numero", "seleccion", "booleano" (default: "texto") |
| `unidad_medida` | string | No | Unidad de medida (ej: "GB", "MP") |
| `opciones_seleccion` | string | No | Opciones separadas por comas (para tipo_dato="seleccion") |

**Response 201**:
```json
{
  "success": true,
  "message": "Tipo de característica creado exitosamente",
  "data": {
    "id_tipo": 4,
    "nombre_tipo": "Almacenamiento",
    "descripcion": "Capacidad de almacenamiento interno",
    "tipo_dato": "texto",
    "unidad_medida": "GB",
    "opciones_seleccion": null,
    "activo": true,
    "fyh_creacion": "2025-10-06T16:00:00Z",
    "fyh_actualizacion": "2025-10-06T16:00:00Z"
  }
}
```

**Validaciones**:
- El nombre no debe estar duplicado
- Si `tipo_dato = "seleccion"`, debe proporcionar `opciones_seleccion`

**Errores**:
- `400`: Nombre requerido o duplicado
- `401`: No autorizado
- `500`: Error del servidor

**Ejemplo curl**:
```bash
curl -X POST "http://localhost:3000/api/caracteristicas/tipos" \
  -H "Authorization: Bearer {tu_token_admin}" \
  -H "Content-Type: application/json" \
  -d '{
    "nombre_tipo": "Almacenamiento",
    "descripcion": "Capacidad de almacenamiento interno",
    "tipo_dato": "texto",
    "unidad_medida": "GB"
  }'
```

---

## Notas Técnicas

### Tipos de Datos Soportados

**texto**:
- Valor libre de texto
- Ejemplo: "6.1", "Triple cámara"

**numero**:
- Valor numérico
- Ejemplo: "12", "256"

**seleccion**:
- Una opción de una lista predefinida
- Requiere `opciones_seleccion` en el tipo
- Ejemplo: opciones_seleccion = "Negro,Blanco,Azul"
- Valor = "Negro"

**booleano**:
- Valores: "true" o "false", "sí" o "no", "1" o "0"
- Ejemplo: "true", "sí"

### Estructura de Características

**TipoCaracteristica (Catálogo)**:
- Define QUÉ características pueden tener los productos
- Ejemplos: "Pantalla", "RAM", "Color", "Cámara"
- Se crea una vez y se reutiliza en múltiples productos

**ProductoCaracteristica (Instancia)**:
- Define el VALOR específico de una característica para un producto
- Ejemplo: Producto iPhone 13 tiene "Pantalla" = "6.1 pulgadas"
- Relación: Un producto puede tener múltiples características

### Unidades de Medida Comunes

- Pantalla: "pulgadas"
- RAM: "GB"
- Almacenamiento: "GB" o "TB"
- Cámara: "MP" (megapíxeles)
- Batería: "mAh"
- Peso: "g" o "kg"
- Procesador: "GHz"

### Validación de Duplicados

No se permite que un producto tenga dos veces la misma característica:
- Restricción única en base de datos: (id_producto, id_tipo)
- Ejemplo: Un producto no puede tener "Pantalla" = "6.1" Y "Pantalla" = "6.7"
- Solución: Actualizar en lugar de crear duplicado

### Casos de Uso

**Especificaciones Técnicas**:
```javascript
// Smartphone
- Pantalla: 6.1 pulgadas
- RAM: 6 GB
- Almacenamiento: 128 GB
- Cámara: 12 MP
- Color: Azul
```

**Filtros de Búsqueda**:
```javascript
// Los clientes pueden filtrar por:
- RAM >= 6GB
- Almacenamiento >= 128GB
- Color = "Negro"
```

**Comparación de Productos**:
```javascript
// Mostrar características lado a lado
Producto A    vs    Producto B
Pantalla: 6.1"      Pantalla: 6.7"
RAM: 6GB            RAM: 8GB
```

### Estados y Activación

**Tipos de Características**:
- `activo = true`: Visible y utilizable
- `activo = false`: Oculto (soft delete)
- Solo se muestran tipos activos en las APIs públicas

**Características de Productos**:
- No tienen campo activo
- Se eliminan permanentemente (hard delete)
- Si se desactiva un tipo, sus características siguen existiendo pero el tipo no aparece

---

## Ver También

- [Productos API](./productos.md) - Para crear y gestionar productos
- [Volver al índice de API](../README.md)

---

**Última actualización**: 6 de Octubre, 2025

[← Volver al índice de ENDPOINTS](../ENDPOINTS.md)

---

**[⬆ Volver arriba](#tabla-de-contenidos)** | **[📚 Documentación](../../../docs/README.md)** | **[🏠 Inicio](../../../README.md)**
