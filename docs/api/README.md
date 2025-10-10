**[Documentación](../README.md#estructura-de-documentación)** | **[Inicio](../../README.md)**

---

# Documentación de la API Backend

> Documentación completa de la API REST del backend de TecnoCel Web.

---

## Tabla de Contenidos

- [Inicio Rápido](#inicio-rápido)
- [Organización de la Documentación](#organización-de-la-documentación)
- [Resumen de la API](#resumen-de-la-api)
- [Autenticación](#autenticación)
- [Formato de Respuestas](#formato-de-respuestas)
- [Códigos HTTP](#códigos-http)
- [Herramientas Recomendadas](#herramientas-recomendadas)
- [CORS](#cors)
- [Convenciones](#convenciones)
- [Gestión de Imágenes](#gestión-de-imágenes)
- [Recursos Adicionales](#recursos-adicionales)

## Inicio Rápido

### Ver Endpoints Disponibles

[ENDPOINTS.md](ENDPOINTS.md) - Índice completo de 64 endpoints en 10 módulos

### Probar la API

```bash
# Iniciar el servidor
cd backend
npm run dev

# API disponible en:
http://localhost:3000/api
```

### Ejemplos Rápidos

```bash
# Listar productos
curl http://localhost:3000/api/almacen/productos

# Buscar productos
curl "http://localhost:3000/api/almacen/productos/buscar?termino=iphone"

# Obtener marcas
curl http://localhost:3000/api/marcas
```

---

## Organización de la Documentación

### Endpoints - Documentación de Uso

**[endpoints/](./endpoints/)** - Documentación detallada de cada módulo (64 endpoints)

| Módulo                                            | Endpoints | Descripción                  |
| ------------------------------------------------- | --------- | ---------------------------- |
| [Productos](./endpoints/productos.md)             | 11        | Catálogo de productos        |
| [Carrito](./endpoints/carrito.md)                 | 7         | Carrito de compras           |
| [Clientes](./endpoints/clientes.md)               | 7         | Autenticación y usuarios     |
| [Comentarios](./endpoints/comentarios.md)         | 6         | Comentarios y calificaciones |
| [Ofertas](./endpoints/ofertas.md)                 | 6         | Ofertas y descuentos         |
| [Favoritos](./endpoints/favoritos.md)             | 6         | Productos favoritos          |
| [Características](./endpoints/caracteristicas.md) | 6         | Especificaciones técnicas    |
| [Upload](./endpoints/upload.md)                   | 3         | Carga de imágenes            |
| [Marcas](./endpoints/marcas.md)                   | 5         | Gestión de marcas            |
| [Direcciones](./endpoints/direcciones.md)         | 7         | Direcciones de envío         |

[Ver índice completo de endpoints →](ENDPOINTS.md)

---

### Guías - Tutoriales Prácticos

**[guides/](./guides/)** - Guías paso a paso para integrar la API

- [AUTHENTICATION.md](./guides/AUTHENTICATION.md) - Guía de autenticación JWT y Google OAuth

Disponibles próximamente:

- TESTING.md - Cómo probar la API
- PAGINATION.md - Uso de paginación y filtros
- IMAGE_UPLOAD.md - Carga de imágenes
- SHOPPING_CART.md - Flujo completo del carrito

[Ver guías →](./guides/README.md)

---

### Referencia Técnica - Documentación Interna

**[reference/](./reference/)** - Documentación técnica para desarrolladores

Documentos:

- [IMAGES_SERVICE.md](./reference/IMAGES_SERVICE.md) - Sistema de imágenes estáticas
- [ROUTES_ANALYSIS.md](./reference/ROUTES_ANALYSIS.md) - Análisis de rutas y arquitectura
- [CONTROLLERS.md](./reference/CONTROLLERS.md) - Análisis y referencia técnica de controladores
- [MODELS.md](./reference/MODELS.md) - Análisis y referencia técnica de modelos

[Ver documentación técnica →](./reference/)

---

### Archivo - Documentación Histórica

**[archive/](./archive/)** - Versiones anteriores mantenidas como referencia

Documentos archivados:

- [ENDPOINTS_LEGACY.md](./archive/ENDPOINTS_LEGACY.md) - Versión anterior de endpoints

[Ver archivo →](./archive/)

---

## Resumen de la API

| Métrica                    | Valor                       |
| -------------------------- | --------------------------- |
| **Total de endpoints**     | 64                          |
| **Módulos**                | 10                          |
| **Endpoints públicos**     | ~25                         |
| **Endpoints autenticados** | ~39                         |
| **Versión de API**         | v1                          |
| **Base URL**               | `http://localhost:3000/api` |

---

## Autenticación

La API usa **JWT (JSON Web Tokens)** para autenticación.

### Obtener Token

```bash
# Registro (retorna token automáticamente)
POST /api/clientes/register

# Login
POST /api/clientes/login

# Login con Google OAuth
POST /api/clientes/google-login
```

### Usar Token

```bash
# Incluir en header Authorization
curl -H "Authorization: Bearer {tu_token}" \
  http://localhost:3000/api/carrito
```

[Ver guía completa de autenticación →](./guides/AUTHENTICATION.md)

---

## Formato de Respuestas

### Respuesta Exitosa

```json
{
  "success": true,
  "data": {
    /* datos */
  }
}
```

### Respuesta con Paginación

```json
{
  "success": true,
  "data": [
    /* resultados */
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
  "error": "Detalle técnico"
}
```

---

## Códigos HTTP

| Código | Significado        |
| ------ | ------------------ |
| `200`  | OK                 |
| `201`  | Creado             |
| `400`  | Datos inválidos    |
| `401`  | No autorizado      |
| `403`  | Sin permisos       |
| `404`  | No encontrado      |
| `409`  | Conflicto          |
| `500`  | Error del servidor |

---

## Herramientas Recomendadas

- **Postman** - Cliente REST completo
- **Insomnia** - Alternativa ligera
- **Thunder Client** - Extensión de VS Code
- **curl** - Línea de comandos

---

## CORS

- **Desarrollo**: `http://localhost:5173`
- **Producción**: Configurar en `FRONTEND_URL`

---

## Convenciones

- **Endpoints**: kebab-case (`/productos/destacados`)
- **Query params**: camelCase (`?precioMin=100`)
- **JSON fields**: snake_case (`nombre_producto`)
- **IDs**: Numéricos auto-incrementales
- **Fechas**: ISO 8601 (`2025-10-06T15:30:00Z`)
- **Booleanos**: `true`/`false`

---

## Gestión de Imágenes

Las imágenes se sirven desde:

```
http://localhost:3000/api/images/{tipo}/{archivo}
```

Tipos:

- `productos/` - Imágenes de productos
- `comentarios/` - Imágenes de comentarios
- `marcas/` - Logos de marcas

[Ver guía de carga de imágenes →](./endpoints/upload.md)

---

## Recursos Adicionales

- Backend: [backend/README.md](../../backend/README.md)
- Scripts: [backend/scripts/README.md](../../backend/scripts/README.md)
- Base de datos: [docs/database/README.md](../database/README.md)
- Frontend: [frontend/README.md](../../frontend/README.md)
- Proyecto: [docs/README.md](../README.md)

**Última actualización**: 7 de Octubre, 2025
**Versión**: 1.0
**Total endpoints**: 64 en 10 módulos

---

**[Volver arriba](#tabla-de-contenidos)** | **[Documentación](../README.md)** | **[Inicio](../../README.md)**
