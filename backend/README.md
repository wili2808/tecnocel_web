# TecnoCel Web - Backend

> Web Service REST API desarrollado con Node.js, Express y TypeScript para el e-commerce.

---

## Tabla de Contenidos

- [Descripción](#descripción)
- [Stack Principal](#stack-principal)
- [Inicio Rápido](#inicio-rápido)
- [Scripts Disponibles](#scripts-disponibles)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [API Endpoints](#api-endpoints)
- [Configuración](#configuración)
- [Base de Datos](#base-de-datos)
- [Autenticación](#autenticación)
- [Gestión de Imágenes](#gestión-de-imágenes)
- [Logging](#logging)
- [Troubleshooting](#troubleshooting)
- [Documentación](#documentación)
- [Deployment](#deployment)

---

## Descripción

Backend de TecnoCel Web, una **API REST** robusta y escalable que proporciona servicios web para el e-commerce completo: gestión de productos, autenticación, carrito de compras, comentarios, ofertas y más.

### Arquitectura de Web Service

```
┌─────────────────┐    HTTP/JSON    ┌─────────────────┐
│   Frontend      │ ◄──────────────► │   Backend       │
│   (Cliente)     │    REST API      │   (Web Service) │
└─────────────────┘                  └─────────────────┘
                                              │
                                              ▼
                                     ┌─────────────────┐
                                     │   MySQL         │
                                     └─────────────────┘
```

---

## Stack Principal

| Tecnología     | Versión | Uso                       |
| -------------- | ------- | ------------------------- |
| **Node.js**    | 18+     | Runtime                   |
| **TypeScript** | 5.3.3   | Lenguaje                  |
| **Express**    | 4.18.2  | Framework web             |
| **MySQL**      | 8.0+    | Base de datos             |
| **Sequelize**  | 6.35.2  | ORM                       |
| **JWT**        | 9.0.2   | Autenticación             |
| **Multer**     | 2.0.2   | Upload de archivos        |
| **Sharp**      | 0.34.3  | Procesamiento de imágenes |

Ver stack completo → [docs/project/TECNOLOGIAS.md](../docs/project/TECNOLOGIAS.md)

---

## Inicio Rápido

```bash
# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus configuraciones

# Crear base de datos
mysql -u root -p -e "CREATE DATABASE db_tecnocel_v4;"

# Iniciar servidor de desarrollo
npm run dev
```

**URLs:**

- API: http://localhost:3000/api
- Health: http://localhost:3000/health

---

## Scripts Disponibles

```bash
npm run dev        # Desarrollo (watch mode con nodemon)
npm run build      # Build de producción
npm start          # Ejecutar producción
npm run test:images # Testing de imágenes
npm run init:logs  # Inicializar estructura de logs
```

---

## Estructura del Proyecto

```
backend/
├── src/
│   ├── config/          # Configuración (DB, variables)
│   ├── controllers/     # Controladores de API REST
│   ├── middleware/      # Middleware (auth, validación)
│   ├── models/          # Modelos Sequelize + relaciones
│   ├── routes/          # Definición de rutas
│   ├── services/        # Servicios (email, logging, imágenes)
│   └── index.ts         # Punto de entrada
├── scripts/             # Scripts de utilidad
├── dist/                # Build compilado
└── .env                 # Variables de entorno
```

Ver estructura completa → [docs/api/README.md](../docs/api/README.md)

---

## API Endpoints

### Principales Recursos

| Recurso         | Base Path          | Auth    | Descripción                 |
| --------------- | ------------------ | ------- | --------------------------- |
| **Productos**   | `/api/almacen`     | Parcial | Catálogo, búsqueda, filtros |
| **Carrito**     | `/api/carrito`     | Sí      | Gestión del carrito         |
| **Comentarios** | `/api/comentarios` | Parcial | Reseñas con imágenes        |
| **Clientes**    | `/api/clientes`    | Parcial | Registro, login, perfil     |
| **Ofertas**     | `/api/ofertas`     | Parcial | Sistema de descuentos       |
| **Favoritos**   | `/api/favoritos`   | Sí      | Productos favoritos         |
| **Marcas**      | `/api/marcas`      | No      | Marcas de productos         |
| **Direcciones** | `/api/direcciones` | Sí      | Direcciones de envío        |
| **Upload**      | `/api/upload`      | Sí      | Subida de imágenes          |

Ver documentación completa de endpoints → [docs/api/ENDPOINTS.md](../docs/api/ENDPOINTS.md)

---

## Configuración

### Variables de Entorno Mínimas

```env
# Base de datos
DB_NAME=db_tecnocel_v4
DB_USER=root
DB_PASSWORD=tu_password
DB_HOST=localhost

# Servidor
PORT=3000
NODE_ENV=development

# Seguridad
JWT_SECRET=clave_secreta_supersegura

# Frontend
FRONTEND_URL=http://localhost:5173
```

Ver todas las variables → [docs/deployment/ENVIRONMENT.md](../docs/deployment/ENVIRONMENT.md)

---

## Base de Datos

### Relaciones Principales

```
Usuario 1:1 Cliente
    │
Cliente ──┬─ 1:N CarritoWeb
          ├─ 1:N Favorito
          ├─ 1:N Direccion
          └─ 1:N Comentario

Almacen ──┬─ 1:N ProductoImagen
(Producto)├─ N:M Oferta
          ├─ N:M Caracteristica
          ├─ N:1 Marca
          └─ N:1 Categoria
```

Ver esquema completo → [docs/database/SCHEMA.md](../docs/database/SCHEMA.md)

---

## Autenticación

- **JWT**: Token-based authentication
- **Google OAuth 2.0**: Autenticación social
- **Middlewares**: `verificarToken`, `verificarTokenCliente`, `verificarRol`

```typescript
// Ejemplos: Proteger rutas
import {
  verificarToken,
  verificarTokenCliente,
  verificarRol,
} from "./src/middleware/authMiddleware";

router.get("/cliente/perfil", verificarTokenCliente, handler);
router.post(
  "/admin/productos",
  verificarToken,
  verificarRol([1]),
  crearProductoHandler
);
```

Ver guía de autenticación → [docs/api/guides/AUTHENTICATION.md](../docs/api/guides/AUTHENTICATION.md)

---

## Gestión de Imágenes

- **Upload**: Multer con validación de tipo y tamaño (máx 5MB)
- **Procesamiento**: Sharp para redimensionar (800x800) y optimizar
- **Almacenamiento**: Sistema de archivos local
- **Tipos**: Productos y comentarios

Ver referencia del servicio de imágenes → [docs/api/reference/IMAGES_SERVICE.md](../docs/api/reference/IMAGES_SERVICE.md)

---

## Logging

Sistema de logging estructurado con Winston:

```typescript
import { logger } from "./services/loggerService";

logger.error("Error crítico");
logger.warn("Advertencia");
logger.info("Información general");
logger.debug("Debug detallado");
```

Archivos de log:

- `logs/error.log` - Solo errores
- `logs/combined.log` - Todos los niveles

---

## Troubleshooting

### Problemas Comunes

| Error                  | Causa                         | Solución                           |
| ---------------------- | ----------------------------- | ---------------------------------- |
| `ECONNREFUSED :3306`   | MySQL no está ejecutándose    | Iniciar MySQL                      |
| `CORS policy`          | Frontend URL incorrecta       | Verificar `FRONTEND_URL` en `.env` |
| `ENOENT: no such file` | Carpeta de imágenes no existe | Crear carpetas de imágenes         |
| `invalid token`        | JWT expirado o inválido       | Renovar token                      |

Ver guía completa → [docs/guides/DEVELOPMENT.md](../docs/guides/DEVELOPMENT.md)

---

## Documentación

### API

- [Endpoints completos](../docs/api/ENDPOINTS.md)
- [Guía de uso](../docs/api/guides/USO_API.md)
- [Ejemplos](../docs/api/guides/EJEMPLOS.md)

### Desarrollo

- [Configuración del entorno](../docs/deployment/ENVIRONMENT.md)
- [Guía de desarrollo](../docs/guides/DEVELOPMENT.md)
- [Scripts de utilidad](scripts/README.md)

### Base de Datos

- [Esquema completo](../docs/database/SCHEMA.md)
- [Modelos y relaciones](../docs/database/MODELS.md)
- [Migraciones](../docs/database/MIGRATIONS.md)

---

## Deployment

```bash
# Build para producción
npm run build

# Iniciar en producción
NODE_ENV=production npm start
```

Ver guía de deployment → [docs/deployment/HOSTING.md](../docs/deployment/HOSTING.md)

**Última actualización**: 7 de Octubre, 2025
**Versión**: 1.0.0
**Puerto**: 3000
**Stack**: Node.js + Express + TypeScript + MySQL

---

**[Volver arriba](#tabla-de-contenidos)** | **[Inicio](../README.md)**
