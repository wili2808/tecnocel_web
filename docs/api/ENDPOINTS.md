**[Documentación](../README.md#-api-backend)** | **[Inicio](../../README.md)**

---

# Endpoints de la API - TecnoCel Web

> Documentación completa de todos los endpoints de la API REST.

**Versión**: v1
**Base URL Desarrollo**: `http://localhost:3000/api`
**Base URL Producción**: `https://tu-dominio.com/api`

---

## Tabla de Contenidos

- [Módulos de la API](#módulos-de-la-api)
- [Resumen de la API](#resumen-de-la-api)
- [Autenticación](#autenticación)
- [Formato de Respuesta Estándar](#formato-de-respuesta-estándar)
- [Códigos de Estado HTTP](#códigos-de-estado-http)
- [CORS](#cors)
- [Convenciones de la API](#convenciones-de-la-api)
- [Búsqueda y Filtros](#búsqueda-y-filtros)
- [Gestión de Imágenes](#gestión-de-imágenes)
- [Herramientas Recomendadas](#herramientas-recomendadas)
- [Recursos Adicionales](#recursos-adicionales)

---

## Módulos de la API

La documentación de endpoints está organizada por módulos. Cada módulo tiene su propia página detallada:

### 1. [Productos (Almacén)](./endpoints/productos.md)

Gestión del catálogo de productos.

**11 endpoints** | Autenticación: Mixta

- `GET /almacen/productos` - Listar productos con filtros
- `GET /almacen/productos/:id` - Detalle de producto
- `GET /almacen/productos/destacados` - Productos destacados
- `GET /almacen/productos/buscar` - Búsqueda full-text
- `POST /almacen/productos` - Crear producto 🔒
- `PUT /almacen/productos/:id` - Actualizar producto 🔒
- Y más...

[Ver documentación completa →](./endpoints/productos.md)

---

### 2. [Carrito](./endpoints/carrito.md)

Gestión del carrito de compras.

**7 endpoints** | Autenticación: Requerida 🔒

- `GET /carrito` - Obtener carrito activo
- `POST /carrito/items` - Agregar producto
- `PUT /carrito/items/:id_item` - Actualizar cantidad
- `DELETE /carrito/items/:id_item` - Eliminar item
- `POST /carrito/confirmar-compra` - Confirmar compra
- Y más...

[Ver documentación completa →](./endpoints/carrito.md)

---

### 3. [Clientes / Autenticación](./endpoints/clientes.md)

Sistema de autenticación y gestión de cuentas.

**7 endpoints** | Autenticación: Mixta

- `POST /clientes/register` - Registro de cliente
- `POST /clientes/login` - Iniciar sesión
- `POST /clientes/google-login` - Login con Google OAuth
- `GET /clientes/verify-token` - Verificar token 🔒
- `POST /clientes/forgot-password` - Recuperar contraseña
- Y más...

[Ver documentación completa →](./endpoints/clientes.md)

---

### 4. [Comentarios](./endpoints/comentarios.md)

Sistema de comentarios y calificaciones de productos.

**6 endpoints** | Autenticación: Mixta

- `GET /comentarios/producto/:id_producto` - Obtener comentarios
- `POST /comentarios` - Crear comentario 🔒
- `PUT /comentarios/:id_comentario` - Actualizar comentario 🔒
- `DELETE /comentarios/:id_comentario` - Eliminar comentario 🔒
- `GET /comentarios/producto/:id_producto/estadisticas` - Estadísticas
- Y más...

[Ver documentación completa →](./endpoints/comentarios.md)

---

### 5. [Ofertas](./endpoints/ofertas.md)

Gestión de ofertas y descuentos.

**6 endpoints** | Autenticación: Mixta

- `GET /ofertas` - Ofertas activas
- `GET /ofertas/productos` - Productos en oferta
- `POST /ofertas` - Crear oferta 🔒
- `POST /ofertas/:id_oferta/productos` - Asignar productos 🔒
- `PUT /ofertas/:id` - Actualizar oferta 🔒
- `DELETE /ofertas/:id` - Eliminar oferta 🔒

[Ver documentación completa →](./endpoints/ofertas.md)

---

### 6. [Favoritos](./endpoints/favoritos.md)

Gestión de productos favoritos.

**6 endpoints** | Autenticación: Requerida 🔒

- `GET /favoritos/cliente/:id_cliente` - Listar favoritos
- `GET /favoritos/cliente/:id_cliente/producto/:id_producto` - Verificar favorito
- `POST /favoritos/cliente/:id_cliente` - Agregar favorito
- `DELETE /favoritos/cliente/:id_cliente/producto/:id_producto` - Eliminar favorito
- `PUT /favoritos/cliente/:id_cliente/producto/:id_producto/toggle` - Toggle favorito
- `GET /favoritos/cliente/:id_cliente/estadisticas` - Estadísticas

[Ver documentación completa →](./endpoints/favoritos.md)

---

### 7. [Características](./endpoints/caracteristicas.md)

Gestión de características técnicas de productos.

**6 endpoints** | Autenticación: Mixta

- `GET /caracteristicas/tipos` - Tipos de características
- `GET /caracteristicas/producto/:id_producto` - Características de producto
- `POST /caracteristicas/producto/:id_producto` - Agregar característica 🔒
- `PUT /caracteristicas/:id_caracteristica` - Actualizar característica 🔒
- `DELETE /caracteristicas/:id_caracteristica` - Eliminar característica 🔒
- `POST /caracteristicas/tipos` - Crear tipo 🔒

[Ver documentación completa →](./endpoints/caracteristicas.md)

---

### 8. [Upload](./endpoints/upload.md)

Carga y procesamiento de imágenes.

**3 endpoints** | Autenticación: Requerida 🔒

- `POST /upload/producto` - Subir imágenes de producto
- `POST /upload/comentario` - Subir imágenes de comentario
- `GET /upload/info` - Información de directorios

[Ver documentación completa →](./endpoints/upload.md)

---

### 9. [Marcas](./endpoints/marcas.md)

Gestión de marcas de productos.

**5 endpoints** | Autenticación: Mixta

- `GET /marcas` - Listar marcas activas
- `GET /marcas/:id` - Obtener marca por ID
- `POST /marcas` - Crear marca 🔒
- `PUT /marcas/:id` - Actualizar marca 🔒
- `DELETE /marcas/:id` - Eliminar marca 🔒

[Ver documentación completa →](./endpoints/marcas.md)

---

### 10. [Direcciones](./endpoints/direcciones.md)

Gestión de direcciones de envío.

**7 endpoints** | Autenticación: Requerida 🔒

- `GET /direcciones/cliente/:id_cliente` - Listar direcciones
- `GET /direcciones/:id` - Obtener dirección por ID
- `GET /direcciones/cliente/:id_cliente/predeterminada` - Dirección predeterminada
- `POST /direcciones/cliente/:id_cliente` - Crear dirección
- `PUT /direcciones/:id` - Actualizar dirección
- `PATCH /direcciones/:id/predeterminada` - Establecer predeterminada
- `DELETE /direcciones/:id` - Eliminar dirección

[Ver documentación completa →](./endpoints/direcciones.md)

---

### 11. [Notificaciones](./endpoints/notificaciones.md)

Sistema de notificaciones in-app para clientes.

**5 endpoints** | Autenticación: Requerida 🔒

- `GET /notificaciones` - Listar todas las notificaciones
- `GET /notificaciones/no-leidas` - Notificaciones no leídas
- `PUT /notificaciones/leer-todas` - Marcar todas como leídas
- `PUT /notificaciones/:id/leer` - Marcar notificación como leída
- `DELETE /notificaciones/:id` - Eliminar notificación

[Ver documentación completa →](./endpoints/notificaciones.md)

---

### 12. [Envíos (Admin)](./endpoints/envios.md)

Gestión administrativa de envíos y rastreo.

**3 endpoints** | Autenticación: Admin 🔒

- `GET /envios/admin` - Listar todos los envíos
- `GET /envios/admin/:id` - Obtener detalle de envío
- `PATCH /envios/admin/:id/estado` - Actualizar estado del envío

[Ver documentación completa →](./endpoints/envios.md)

---

## Resumen de la API

| Módulo          | Endpoints | Auth Requerida | Documentación                           |
| --------------- | --------- | -------------- | --------------------------------------- |
| Productos       | 11        | Mixta          | [Ver →](./endpoints/productos.md)       |
| Carrito         | 7         | Sí 🔒          | [Ver →](./endpoints/carrito.md)         |
| Clientes        | 7         | Mixta          | [Ver →](./endpoints/clientes.md)        |
| Comentarios     | 6         | Mixta          | [Ver →](./endpoints/comentarios.md)     |
| Ofertas         | 6         | Mixta          | [Ver →](./endpoints/ofertas.md)         |
| Favoritos       | 6         | Sí 🔒          | [Ver →](./endpoints/favoritos.md)       |
| Características | 6         | Mixta          | [Ver →](./endpoints/caracteristicas.md) |
| Upload          | 3         | Sí 🔒          | [Ver →](./endpoints/upload.md)          |
| Marcas          | 5         | Mixta          | [Ver →](./endpoints/marcas.md)          |
| Direcciones     | 7         | Sí 🔒          | [Ver →](./endpoints/direcciones.md)     |
| Notificaciones  | 5         | Sí 🔒          | [Ver →](./endpoints/notificaciones.md)  |
| Envíos (Admin)  | 3         | Admin 🔒       | [Ver →](./endpoints/envios.md)          |
| **TOTAL**       | **76**    | -              | -                                       |

---

## Autenticación

La API utiliza **JWT (JSON Web Tokens)** para autenticación.

### Tipos de Autenticación

1. **JWT Cliente**: Para endpoints de clientes (carrito, favoritos, comentarios propios, etc.)
2. **JWT Admin**: Para endpoints administrativos (crear productos, gestionar ofertas, etc.)

### Obtener Token

**Para Clientes**:

```bash
# Registro (retorna token automáticamente)
POST /api/clientes/register

# Login
POST /api/clientes/login

# Login con Google
POST /api/clientes/google-login
```

[Ver documentación de autenticación completa →](./endpoints/clientes.md)

### Usar Token en Requests

Incluir el token en el header `Authorization`:

```bash
Authorization: Bearer {tu_token_jwt}
```

**Ejemplo**:

```bash
curl -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  http://localhost:3000/api/carrito
```

### Tokens

- **Expiración**: 7 días
- **Algoritmo**: HS256
- **Renovación**: Hacer login nuevamente

---

## Formato de Respuesta Estándar

### Respuesta Exitosa

```json
{
  "success": true,
  "data": {
    /* datos solicitados */
  },
  "message": "Mensaje opcional de éxito"
}
```

### Respuesta con Paginación

```json
{
  "success": true,
  "data": [
    /* array de resultados */
  ],
  "pagination": {
    "total": 150,
    "page": 1,
    "pages": 15,
    "limit": 10
  }
}
```

### Respuesta de Error

```json
{
  "success": false,
  "message": "Descripción del error",
  "error": "Detalle técnico del error"
}
```

---

## Códigos de Estado HTTP

| Código | Significado  | Uso Común                          |
| ------ | ------------ | ---------------------------------- |
| `200`  | OK           | Solicitud exitosa                  |
| `201`  | Created      | Recurso creado exitosamente        |
| `400`  | Bad Request  | Datos inválidos o campos faltantes |
| `401`  | Unauthorized | Token inválido o expirado          |
| `403`  | Forbidden    | Sin permisos para la acción        |
| `404`  | Not Found    | Recurso no encontrado              |
| `409`  | Conflict     | Conflicto (ej: email duplicado)    |
| `500`  | Server Error | Error interno del servidor         |

---

## CORS

El backend está configurado para aceptar requests desde:

- **Desarrollo**: `http://localhost:5173`
- **Producción**: Configurar en variable de entorno `FRONTEND_URL`

---

## Convenciones de la API

### Nomenclatura

- **Endpoints**: kebab-case (`/productos/destacados`)
- **Query params**: camelCase (`?precioMin=100`)
- **JSON fields**: snake_case (`nombre_producto`)

### IDs

- Todos los IDs son numéricos auto-incrementales
- Formato en URLs: `/productos/:id`
- Formato en JSON: `"id_producto": 123`

### Fechas

- Formato: ISO 8601 (`2025-10-06T15:30:00Z`)
- Timezone: UTC
- Campo de creación: `fyh_creacion`
- Campo de actualización: `fyh_actualizacion`

### Booleanos

- En JSON: `true` / `false`
- En base de datos: `1` / `0` (TINYINT)
- Ejemplos: `activo`, `destacado`, `es_predeterminada`

### Paginación

- **Query params estándar**:
  - `page`: Número de página (default: 1)
  - `limit`: Items por página (default: 20, max: 100)
  - `offset`: Items a saltar (alternativa a page)

**Ejemplo**:

```bash
GET /api/almacen/productos?page=2&limit=20
```

---

## Búsqueda y Filtros

### Búsqueda Full-Text

Disponible en productos:

```bash
GET /api/almacen/productos/buscar?termino=iphone
```

### Filtros Comunes

**Productos**:

- `categoria`: Filtrar por categoría
- `marca`: Filtrar por marca
- `precioMin` / `precioMax`: Rango de precios
- `destacado`: Solo productos destacados
- `enOferta`: Solo productos en oferta

**Comentarios**:

- `orden`: `recientes`, `antiguos`, `mejor_calificacion`, `peor_calificacion`
- `limite` / `offset`: Paginación

---

## Gestión de Imágenes

### URL de Imágenes

Las imágenes se sirven a través de:

```
http://localhost:3000/api/images/{tipo}/{nombre_archivo}
```

**Tipos**:

- `productos/` - Imágenes de productos
- `comentarios/` - Imágenes de comentarios
- `marcas/` - Logos de marcas

### Subir Imágenes

Ver [Upload API](./endpoints/upload.md) para detalles de carga y procesamiento.

---

## Herramientas Recomendadas

### Para Pruebas

- **Postman**: Cliente REST con colecciones exportables
- **Insomnia**: Alternativa ligera a Postman
- **curl**: Línea de comandos
- **Thunder Client**: Extensión de VS Code

### Para Documentación Interactiva

- **Swagger UI**: Documentación interactiva (próximamente)
- **Postman Collections**: Compartir colecciones de endpoints

---

## Recursos Adicionales

- [Guía de Inicio Rápido](../guides/GETTING_STARTED.md) - Configuración inicial
- [Esquema de Base de Datos](../database/SCHEMA.md) - Estructura de datos
- [Guía de Autenticación](./guides/AUTHENTICATION.md) - Detalles de autenticación
- [Volver al índice de documentación](../README.md)

**Última actualización**: 7 de Octubre, 2025
**Versión**: 1.1
**Total endpoints**: 64 en 10 módulos

---

**[Volver arriba](#tabla-de-contenidos)** | **[Documentación](../README.md)** | **[Inicio](../../README.md)**
