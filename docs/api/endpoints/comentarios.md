[← Volver al índice de ENDPOINTS](../ENDPOINTS.md)
# Comentarios API

**Base Path**: `/api/comentarios`

Gestión de comentarios y calificaciones de productos.

---

## Índice

- [Comentarios API](#comentarios-api)
  - [Índice](#índice)
  - [GET /comentarios/producto/:id\_producto](#get-comentariosproductoid_producto)
  - [POST /comentarios](#post-comentarios)
  - [PUT /comentarios/:id\_comentario](#put-comentariosid_comentario)
  - [DELETE /comentarios/:id\_comentario](#delete-comentariosid_comentario)
  - [DELETE /comentarios/:id\_comentario/imagenes/:id\_imagen](#delete-comentariosid_comentarioimagenesid_imagen)
  - [GET /comentarios/producto/:id\_producto/estadisticas](#get-comentariosproductoid_productoestadisticas)
  - [Notas Técnicas](#notas-técnicas)
    - [Validaciones](#validaciones)
    - [Estados de Comentario](#estados-de-comentario)
    - [Ordenamiento Disponible](#ordenamiento-disponible)
    - [Paginación](#paginación)
    - [Gestión de Imágenes](#gestión-de-imágenes)
    - [Permisos y Seguridad](#permisos-y-seguridad)
    - [Cálculo de Estadísticas](#cálculo-de-estadísticas)
    - [Respuestas de Admin](#respuestas-de-admin)
  - [Ver También](#ver-también)

 = Requiere autenticación

---

## GET /comentarios/producto/:id_producto

Obtener todos los comentarios de un producto con paginación y ordenamiento.

**Autenticación**: No requerida

**URL Parameters**:

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `id_producto` | number | ID del producto |

**Query Parameters**:

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `limite` | number | No | Comentarios por página (default: 10) |
| `offset` | number | No | Comentarios a saltar (default: 0) |
| `orden` | string | No | Ordenamiento: "recientes", "antiguos", "mejor_calificacion", "peor_calificacion" (default: "recientes") |

**Response 200**:
```json
{
  "mensaje": "Comentarios obtenidos exitosamente",
  "datos": {
    "comentarios": [
      {
        "id_comentario": 5,
        "id_producto": 1,
        "id_cliente": 10,
        "comentario": "Excelente producto, llegó en perfectas condiciones y funciona perfecto.",
        "calificacion": 5,
        "es_verificado": true,
        "estado": "activo",
        "fyh_creacion": "2025-10-01T14:30:00Z",
        "fyh_actualizacion": "2025-10-01T14:30:00Z",
        "cliente": {
          "nombre_cliente": "Juan",
          "apellido_cliente": "Pérez"
        },
        "imagenes": [
          {
            "id_imagen": 8,
            "url_imagen": "http://localhost:3000/api/uploads/comentarios/imagen1.jpg",
            "alt_text": "Foto del producto"
          }
        ],
        "adminRespuesta": null
      }
    ],
    "paginacion": {
      "total": 45,
      "limite": 10,
      "offset": 0,
      "paginas": 5
    },
    "estadisticas": {
      "total_comentarios": 45,
      "total_calificaciones": 42,
      "calificacion_promedio": 4.5,
      "distribucion_calificaciones": {
        "1": 2,
        "2": 3,
        "3": 8,
        "4": 15,
        "5": 14
      },
      "total_imagenes": 28
    }
  }
}
```

**Errores**:
- `400`: ID de producto inválido
- `500`: Error del servidor

**Ejemplo curl**:
```bash
# Obtener comentarios recientes
curl -X GET "http://localhost:3000/api/comentarios/producto/1?limite=10&offset=0&orden=recientes"

# Obtener mejor calificados
curl -X GET "http://localhost:3000/api/comentarios/producto/1?orden=mejor_calificacion"
```

---

## POST /comentarios

Crear un nuevo comentario en un producto.

**Autenticación**: Requerida (JWT Cliente)

**Body**:
```json
{
  "id_producto": 1,
  "id_cliente": 10,
  "comentario": "Excelente producto, muy recomendado. La calidad es superior a lo esperado.",
  "calificacion": 5,
  "imagenes": [
    {
      "url_imagen": "comentarios/imagen1.jpg",
      "alt_text": "Foto del producto en uso"
    }
  ]
}
```

**Campos**:

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `id_producto` | number | Sí | ID del producto a comentar |
| `id_cliente` | number | Sí | ID del cliente (debe coincidir con el autenticado) |
| `comentario` | string | Sí | Texto del comentario (10-2000 caracteres) |
| `calificacion` | number | No | Calificación del 1 al 5 |
| `imagenes` | array | No | Arreglo de imágenes (máximo 5) |

**Validaciones**:
- Comentario: entre 10 y 2000 caracteres
- Calificación: entre 1 y 5 (si se proporciona)
- Imágenes: máximo 5 por comentario
- Producto y cliente deben existir

**Response 201**:
```json
{
  "mensaje": "Comentario creado exitosamente",
  "datos": {
    "comentario": {
      "id_comentario": 46,
      "id_producto": 1,
      "id_cliente": 10,
      "comentario": "Excelente producto, muy recomendado...",
      "calificacion": 5,
      "es_verificado": false,
      "estado": "activo",
      "fyh_creacion": "2025-10-06T16:00:00Z",
      "cliente": {
        "nombre_cliente": "Juan",
        "apellido_cliente": "Pérez"
      },
      "imagenes": [
        {
          "id_imagen": 29,
          "url_imagen": "http://localhost:3000/api/uploads/comentarios/imagen1.jpg",
          "alt_text": "Foto del producto en uso"
        }
      ]
    }
  }
}
```

**Errores**:
- `400`: Datos incompletos, comentario inválido, calificación inválida, o demasiadas imágenes
- `404`: Producto o cliente no encontrado
- `500`: Error del servidor

**Ejemplo curl**:
```bash
curl -X POST "http://localhost:3000/api/comentarios" \
  -H "Authorization: Bearer {tu_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "id_producto": 1,
    "id_cliente": 10,
    "comentario": "Excelente producto, muy recomendado. La calidad es superior.",
    "calificacion": 5
  }'
```

---

## PUT /comentarios/:id_comentario

Actualizar un comentario existente.

**Autenticación**: Requerida (JWT Cliente - propietario del comentario)

**URL Parameters**:

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `id_comentario` | number | ID del comentario a actualizar |

**Body** (todos los campos opcionales):
```json
{
  "comentario": "Actualicé mi opinión: es un buen producto pero tiene algunos detalles.",
  "calificacion": 4,
  "imagenes_a_eliminar": [8, 9],
  "imagenes": [
    {
      "nombre_archivo": "nueva-imagen.jpg",
      "ruta_imagen": "comentarios/nueva-imagen.jpg",
      "tipo_archivo": "image/jpeg",
      "tamaño_archivo": 245680,
      "alt_text": "Nueva foto del producto"
    }
  ]
}
```

**Campos**:

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `comentario` | string | No | Nuevo texto (10-2000 caracteres) |
| `calificacion` | number | No | Nueva calificación (1-5) |
| `imagenes_a_eliminar` | array | No | IDs de imágenes a eliminar |
| `imagenes` | array | No | Nuevas imágenes a agregar |

**Response 200**:
```json
{
  "mensaje": "Comentario actualizado exitosamente",
  "datos": {
    "comentario": {
      "id_comentario": 46,
      "comentario": "Actualicé mi opinión: es un buen producto...",
      "calificacion": 4,
      "fyh_actualizacion": "2025-10-06T17:00:00Z",
      "cliente": {
        "nombre_cliente": "Juan",
        "apellido_cliente": "Pérez"
      },
      "imagenes": [
        {
          "id_imagen": 30,
          "url_imagen": "http://localhost:3000/api/uploads/comentarios/nueva-imagen.jpg",
          "alt_text": "Nueva foto del producto"
        }
      ]
    }
  }
}
```

**Errores**:
- `400`: ID inválido, comentario o calificación inválidos
- `404`: Comentario no encontrado
- `500`: Error del servidor

**Ejemplo curl**:
```bash
curl -X PUT "http://localhost:3000/api/comentarios/46" \
  -H "Authorization: Bearer {tu_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "comentario": "Actualicé mi opinión sobre el producto",
    "calificacion": 4
  }'
```

---

## DELETE /comentarios/:id_comentario

Eliminar un comentario (soft delete).

**Autenticación**: Requerida (JWT Cliente - propietario del comentario)

**URL Parameters**:

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `id_comentario` | number | ID del comentario a eliminar |

**Response 200**:
```json
{
  "mensaje": "Comentario eliminado exitosamente",
  "datos": {
    "imagenes_eliminadas": 2,
    "archivos_eliminados": 2
  }
}
```

**Comportamiento**:
- Marca el comentario como `estado = 'eliminado'` (soft delete)
- Elimina todos los registros de imágenes asociadas de la BD
- Intenta eliminar los archivos físicos de las imágenes del servidor
- Reporta cuántas imágenes y archivos fueron eliminados

**Errores**:
- `400`: ID de comentario inválido
- `404`: Comentario no encontrado
- `500`: Error del servidor

**Ejemplo curl**:
```bash
curl -X DELETE "http://localhost:3000/api/comentarios/46" \
  -H "Authorization: Bearer {tu_token}"
```

---

## DELETE /comentarios/:id_comentario/imagenes/:id_imagen

Eliminar una imagen específica de un comentario.

**Autenticación**: Requerida (JWT Cliente - propietario del comentario)

**URL Parameters**:

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `id_comentario` | number | ID del comentario |
| `id_imagen` | number | ID de la imagen a eliminar |

**Response 200**:
```json
{
  "mensaje": "Imagen eliminada exitosamente",
  "datos": {
    "id_imagen": 30,
    "archivo_eliminado": true
  }
}
```

**Validaciones**:
- El usuario debe ser el propietario del comentario
- La imagen debe pertenecer al comentario especificado
- Se elimina tanto el registro de BD como el archivo físico

**Errores**:
- `400`: ID de comentario o imagen inválido
- `401`: Usuario no autenticado
- `403`: Acceso denegado (no es el propietario)
- `404`: Comentario o imagen no encontrados
- `500`: Error del servidor

**Ejemplo curl**:
```bash
curl -X DELETE "http://localhost:3000/api/comentarios/46/imagenes/30" \
  -H "Authorization: Bearer {tu_token}"
```

---

## GET /comentarios/producto/:id_producto/estadisticas

Obtener estadísticas de comentarios y calificaciones de un producto.

**Autenticación**: No requerida

**URL Parameters**:

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `id_producto` | number | ID del producto |

**Response 200**:
```json
{
  "mensaje": "Estadísticas obtenidas exitosamente",
  "datos": {
    "total_comentarios": 45,
    "total_calificaciones": 42,
    "calificacion_promedio": 4.5,
    "distribucion_calificaciones": {
      "1": 2,
      "2": 3,
      "3": 8,
      "4": 15,
      "5": 14
    },
    "total_imagenes": 28
  }
}
```

**Campos de respuesta**:
- `total_comentarios`: Total de comentarios activos
- `total_calificaciones`: Comentarios con calificación (algunos pueden no tener)
- `calificacion_promedio`: Promedio redondeado a 1 decimal
- `distribucion_calificaciones`: Cantidad de cada calificación (1-5)
- `total_imagenes`: Total de imágenes en todos los comentarios

**Errores**:
- `400`: ID de producto inválido
- `500`: Error del servidor

**Ejemplo curl**:
```bash
curl -X GET "http://localhost:3000/api/comentarios/producto/1/estadisticas"
```

---

## Notas Técnicas

### Validaciones

**Comentario de texto**:
- Mínimo: 10 caracteres
- Máximo: 2000 caracteres
- Requerido al crear

**Calificación**:
- Rango: 1 a 5 (entero)
- Opcional (puede ser null)

**Imágenes**:
- Máximo 5 imágenes por comentario
- Formatos soportados: JPG, PNG, WEBP
- Tamaño máximo por imagen: configurado en upload middleware

### Estados de Comentario
- **activo**: Comentario visible públicamente
- **eliminado**: Soft delete, no se muestra pero se conserva en BD
- **es_verificado**: Marca si es de un comprador verificado (pendiente implementar)

### Ordenamiento Disponible
- `recientes`: Más nuevos primero (default)
- `antiguos`: Más antiguos primero
- `mejor_calificacion`: Mayor calificación primero, luego por fecha
- `peor_calificacion`: Menor calificación primero, luego por fecha

### Paginación
- Default `limite`: 10 comentarios
- Default `offset`: 0
- Se retorna información completa de paginación con total de páginas

### Gestión de Imágenes
- Las URLs de imágenes se generan automáticamente con el servicio de imágenes
- Formato: `http://localhost:3000/api/uploads/comentarios/{nombre_archivo}`
- Al eliminar comentario, se eliminan archivos físicos y registros de BD
- Soporta eliminación individual de imágenes

### Permisos y Seguridad
- Solo el propietario del comentario puede actualizarlo o eliminarlo
- Se valida que `id_cliente` del JWT coincida con `id_cliente` del comentario
- Los comentarios de otros usuarios son de solo lectura

### Cálculo de Estadísticas
- Solo cuenta comentarios con `estado = 'activo'`
- La calificación promedio se redondea a 1 decimal
- La distribución muestra cantidad exacta por cada estrella (1-5)
- Se incluyen comentarios sin calificación en el total, pero no en el promedio

### Respuestas de Admin
- Los comentarios pueden tener respuesta de un administrador
- Campo `adminRespuesta` contiene datos del admin que respondió (si existe)
- Pendiente implementar endpoint para crear respuestas de admin

---

## Ver También

- [Productos API](./productos.md) - Para consultar productos
- [Upload API](./upload.md) - Para subir imágenes de comentarios
- [Clientes API](./clientes.md) - Para autenticación
- [Volver al índice de API](../ENDPOINTS.md)

---

**Última actualización**: 6 de Octubre, 2025

---

[Volver arriba](#tabla-de-contenidos) | [Documentación](../../../docs/README.md) | [Inicio](../../../README.md)