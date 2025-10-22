# Documentación TecnoCel Web - Índice Maestro

---

## Inicio Rápido

### ¿Primera vez aquí?

1. **[Instalación y Configuración](guides/GETTING_STARTED.md)** - Guía paso a paso para configurar el proyecto
2. **[Stack Tecnológico](project/TECNOLOGIAS.md)** - Tecnologías utilizadas y por qué
3. **[Estado del Proyecto](project/ESTADO_AVANCE.md)** - Progreso actual y funcionalidades implementadas
4. **[Variables de Entorno](deployment/ENVIRONMENT.md)** - Configuración de .env para backend y frontend

### Acceso Rápido

| Necesitas... | Ve a... |
|-------------|---------|
| **Ver endpoints de la API** | [Catálogo de Endpoints](#api-backend) |
| **Documentación del frontend** | [Frontend React](#frontend-react) |
| **Esquema de base de datos** | [Base de Datos](#base-de-datos) |
| **Desplegar el proyecto** | [Deployment y Hosting](#deployment-y-hosting) |
| **Contribuir al proyecto** | [Guías de Desarrollo](#guías-de-desarrollo) |

---

## Tabla de Contenidos

- [Arquitectura del Proyecto](#arquitectura-del-proyecto)
- [API Backend (64 Endpoints)](#api-backend)
- [Frontend React](#frontend-react)
- [Base de Datos](#base-de-datos)
- [Deployment y Hosting](#deployment-y-hosting)
- [Guías de Desarrollo](#guías-de-desarrollo)
- [Información del Proyecto](#información-del-proyecto)
- [Búsqueda por Tema](#búsqueda-por-tema)
- [Recursos Adicionales](#recursos-adicionales)

---

## Arquitectura del Proyecto

### Visión General

```
┌─────────────────────────────────────────────────────────────┐
│                    TECNOCEL WEB                             │
│          Plataforma E-commerce Full Stack                   │
└─────────────────────────────────────────────────────────────┘
                           │
          ┌────────────────┼────────────────┐
          ↓                ↓                ↓
    ┌──────────┐    ┌──────────┐    ┌──────────┐
    │ Frontend │───→│   API    │───→│ Database │
    │  React   │    │ Express  │    │  MySQL   │
    └──────────┘    └──────────┘    └──────────┘
         │               │                │
    - React 18      - Node.js        - MariaDB
    - TypeScript    - TypeScript     - 26 tablas
    - Vite          - Express        - Sequelize
    - Context API   - JWT Auth       - Relaciones
    - CSS Modules   - 64 endpoints   - Migraciones
```

### Estructura del Repositorio

```
tecnocel_web/
├── backend/          # API REST con Node.js + Express + TypeScript
│   ├── src/
│   │   ├── controllers/    # 11 controladores
│   │   ├── models/         # 26 modelos Sequelize
│   │   ├── routes/         # 10 módulos de rutas
│   │   ├── middleware/     # Auth, validación, imágenes
│   │   └── services/       # Email, logging, imágenes
│   ├── uploads/            # Imágenes de productos y comentarios
│   └── scripts/            # Scripts de utilidad
│
├── frontend/         # SPA con React 18 + TypeScript + Vite
│   └── src/
│       ├── components/     # 39 componentes
│       ├── pages/          # 9 páginas
│       ├── contexts/       # 8 contextos globales
│       ├── hooks/          # 14 hooks personalizados
│       ├── services/       # 9 servicios de API
│       ├── types/          # Tipos TypeScript
│       └── styles/         # Sistema de estilos CSS
│
├── database/         # Esquemas SQL y backups
│   ├── backups/           # Backups de la BD (no en Git)
│   └── migrations/        # Migraciones SQL
│
└── docs/            # Esta documentación
    ├── api/               # Documentación de API
    ├── frontend/          # Documentación de Frontend
    ├── database/          # Documentación de BD
    ├── deployment/        # Guías de despliegue
    ├── guides/            # Guías de desarrollo
    └── project/           # Info del proyecto
```

### Tecnologías Principales

| Capa | Tecnologías |
|------|-------------|
| **Frontend** | React 18, TypeScript, Vite, CSS Modules, React Router v6, Axios |
| **Backend** | Node.js, Express, TypeScript, JWT, Passport.js (Google OAuth), Multer, Sharp |
| **Base de Datos** | MariaDB 10.4 / MySQL 8.0, Sequelize ORM |
| **Herramientas** | Winston (logging), Nodemon, ESLint, Git |

[Ver stack tecnológico completo →](project/TECNOLOGIAS.md)

---

## API Backend

### Catálogo Completo de Endpoints

**[Ver documentación completa de todos los endpoints →](api/ENDPOINTS.md)**

La API REST cuenta con **64 endpoints** organizados en **10 módulos**:

#### Endpoints por Módulo

| Módulo | Endpoints | Descripción | Documentación |
|--------|:---------:|-------------|---------------|
| **Productos** | 11 | Catálogo, búsqueda, filtros, destacados | [Ver →](api/endpoints/productos.md) |
| **Carrito** | 7 | Carrito de compras, items, checkout | [Ver →](api/endpoints/carrito.md) |
| **Clientes** | 7 | Autenticación, registro, perfil, Google OAuth | [Ver →](api/endpoints/clientes.md) |
| **Comentarios** | 6 | Reseñas, calificaciones, imágenes | [Ver →](api/endpoints/comentarios.md) |
| **Ofertas** | 6 | Ofertas activas, descuentos, productos en oferta | [Ver →](api/endpoints/ofertas.md) |
| **Favoritos** | 6 | Agregar/quitar favoritos, listar | [Ver →](api/endpoints/favoritos.md) |
| **Características** | 6 | Especificaciones técnicas de productos | [Ver →](api/endpoints/caracteristicas.md) |
| **Upload** | 3 | Carga de imágenes (productos, comentarios) | [Ver →](api/endpoints/upload.md) |
| **Marcas** | 5 | Gestión de marcas de productos | [Ver →](api/endpoints/marcas.md) |
| **Direcciones** | 7 | Direcciones de envío de clientes | [Ver →](api/endpoints/direcciones.md) |
| **TOTAL** | **64** | - | [Ver índice →](api/ENDPOINTS.md) |

### Guías de Integración de la API

Guías paso a paso para implementar funcionalidades usando la API:

#### Guías Disponibles

| Guía | Contenido | Link |
|------|-----------|------|
| **Autenticación** | JWT + Google OAuth, login, registro, tokens | [Ver →](api/guides/AUTHENTICATION.md) |
| **Carrito de Compras** | Flujo completo del carrito, ofertas, checkout | [Ver →](api/guides/SHOPPING_CART.md) |
| **Búsqueda de Productos** | Filtros, búsqueda, ofertas, paginación | [Ver →](api/guides/PRODUCT_SEARCH.md) |
| **Reseñas y Calificaciones** | Comentarios, ratings, imágenes, estadísticas | [Ver →](api/guides/REVIEWS_AND_RATINGS.md) |
| **Carga de Imágenes** | Subir imágenes, validación, Sharp, formatos | [Ver →](api/guides/IMAGE_UPLOAD.md) |
| **Manejo de Errores** | Códigos HTTP, formato de errores, interceptores | [Ver →](api/guides/ERROR_HANDLING.md) |

### Referencia Técnica de la API

Documentación técnica interna para desarrolladores:

| Documento | Descripción | Link |
|-----------|-------------|------|
| **Servicio de Imágenes** | Middleware estático, caché, transformaciones Sharp | [Ver →](api/reference/IMAGES_SERVICE.md) |
| **Análisis de Rutas** | Arquitectura, patrones, optimizaciones | [Ver →](api/reference/ROUTES_ANALYSIS.md) |
| **Controladores** | 11 controladores documentados, lógica de negocio | [Ver →](api/reference/CONTROLLERS.md) |
| **Modelos** | 26 modelos Sequelize, relaciones, validaciones | [Ver →](api/reference/MODELS.md) |

### Información General de la API

| Característica | Valor |
|----------------|-------|
| **Base URL** | `http://localhost:3000/api` |
| **Autenticación** | JWT (Bearer Token) + Google OAuth 2.0 |
| **Formato** | JSON |
| **CORS** | Configurado para `http://localhost:5173` |
| **Rate Limiting** | Configurado para endpoints sensibles |
| **Versión** | v1 |

### Ejemplo Rápido

```bash
# Listar productos
curl http://localhost:3000/api/almacen/productos

# Buscar productos
curl "http://localhost:3000/api/almacen/productos/buscar?termino=iphone"

# Obtener marcas
curl http://localhost:3000/api/marcas

# Endpoint autenticado (requiere token)
curl -H "Authorization: Bearer {token}" \
  http://localhost:3000/api/carrito
```

---

## Frontend React

### Documentación del Frontend

La aplicación frontend está desarrollada con **React 18 + TypeScript** usando **Vite** como bundler.

#### Componentes (39 Componentes)

**[Catálogo completo de componentes →](frontend/COMPONENTS.md)**

Componentes organizados por categoría:

| Categoría | Cantidad | Componentes Principales | Documentación |
|-----------|:--------:|-------------------------|---------------|
| **Common** | 6 | Button, IconButton, LoadingSpinner, Notification, CTASection | [Ver →](frontend/COMPONENTS.md#componentes-comunes-6) |
| **Product** | 14 | ProductCard, ProductGrid, ProductImage, ProductInfo, ProductFilters, FeaturedProducts, OfferCard | [Ver →](frontend/COMPONENTS.md#componentes-de-productos-14) |
| **Cart** | 3 | CartIndicator, CartItemCard, CartSummary | [Ver →](frontend/COMPONENTS.md#componentes-de-carrito-3) |
| **Layout** | 4 | Layout, Navbar, Footer, HeroSection | [Ver →](frontend/COMPONENTS.md#componentes-de-layout-4) |
| **User** | 2 | AuthForm, RegisterForm | [Ver →](frontend/COMPONENTS.md#componentes-de-usuario-2) |
| **Location** | 4 | Location, LocationSection, GoogleMap, HistorySection | [Ver →](frontend/COMPONENTS.md#componentes-de-ubicación-4) |
| **Otros** | 6 | ProductComments, ProductSearch, ProductActions, etc. | [Ver →](frontend/COMPONENTS.md) |
| **TOTAL** | **39** | - | [Catálogo completo →](frontend/COMPONENTS.md) |

#### Contextos Globales (8 Contextos)

**[Documentación completa de contextos →](frontend/CONTEXTS.md)**

Sistema de gestión de estado global usando Context API:

| Contexto | Descripción | Documentación |
|----------|-------------|---------------|
| **AuthContext** | Autenticación JWT + Google OAuth, sesión de usuario | [Ver →](frontend/CONTEXTS.md#1-authcontext) |
| **CarritoContext** | Carrito de compras, items, ofertas, localStorage | [Ver →](frontend/CONTEXTS.md#2-carritocontext) |
| **FavoritosGlobalContext** | Sistema de favoritos con caché multi-nivel | [Ver →](frontend/CONTEXTS.md#3-favoritosglobalcontext) |
| **OfertasGlobalContext** | Ofertas activas, productos en oferta, caché | [Ver →](frontend/CONTEXTS.md#4-ofertasglobalcontext) |
| **ProductContext** | Catálogo de productos, filtros, paginación | [Ver →](frontend/CONTEXTS.md#5-productcontext) |
| **SearchContext** | Búsqueda global con debounce | [Ver →](frontend/CONTEXTS.md#6-searchcontext) |
| **ThemeContext** | Tema claro/oscuro con persistencia | [Ver →](frontend/CONTEXTS.md#7-themecontext) |
| **NotificationContext** | Sistema de notificaciones toast (react-toastify) | [Ver →](frontend/CONTEXTS.md#8-notificationcontext) |

#### Hooks Personalizados (14 Hooks)

**[Documentación completa de hooks →](frontend/HOOKS.md)**

Hooks organizados por categoría:

| Categoría | Hooks | Documentación |
|-----------|:-----:|---------------|
| **Autenticación** | useAutoLogout, useAuthActions, useAuthForm | [Ver →](frontend/HOOKS.md#hooks-de-autenticación) |
| **Carrito** | useCarrito, useCarritoOperations, useCarritoUtils | [Ver →](frontend/HOOKS.md#hooks-de-carrito) |
| **Favoritos** | useFavoritos, useFavoritosProductos | [Ver →](frontend/HOOKS.md#hooks-de-favoritos) |
| **Ofertas** | useOfertas, useOfertasGlobal, useOfertasPagination | [Ver →](frontend/HOOKS.md#hooks-de-ofertas) |
| **Productos** | useProductActions | [Ver →](frontend/HOOKS.md#hooks-de-productos) |
| **Otros** | useDirecciones, useEscapeKey | [Ver →](frontend/HOOKS.md#otros-hooks) |

#### Servicios de API (9 Servicios)

**[Documentación completa de servicios →](frontend/SERVICES.md)**

Capa de comunicación con el backend usando Axios:

| Servicio | Descripción | Documentación |
|----------|-------------|---------------|
| **authService** | Login, registro, JWT, Google OAuth | [Ver →](frontend/SERVICES.md#1-authservice) |
| **carritoService** | CRUD del carrito, items, checkout | [Ver →](frontend/SERVICES.md#2-carritoservice) |
| **commentService** | Comentarios, calificaciones, imágenes | [Ver →](frontend/SERVICES.md#3-commentservice) |
| **direccionService** | CRUD de direcciones de envío | [Ver →](frontend/SERVICES.md#4-direccionservice) |
| **favoritoService** | CRUD de favoritos con paginación | [Ver →](frontend/SERVICES.md#5-favoritoservice) |
| **marcaService** | Consulta de marcas de productos | [Ver →](frontend/SERVICES.md#6-marcaservice) |
| **ofertaService** | Ofertas activas, caché, reintentos | [Ver →](frontend/SERVICES.md#7-ofertaservice) |
| **productService** | Productos, categorías, búsqueda, imágenes | [Ver →](frontend/SERVICES.md#8-productservice) |
| **uploadService** | Subida de imágenes de comentarios | [Ver →](frontend/SERVICES.md#9-uploadservice) |

#### Sistema de Estilos y Temas

**[Guía completa de estilos y temas →](frontend/STYLING_AND_THEMING.md)**

Sistema de estilos CSS Modules + Variables CSS + Temas:

| Tema | Descripción | Documentación |
|------|-------------|---------------|
| **CSS Modules** | Estilos con alcance de componente | [Ver →](frontend/STYLING_AND_THEMING.md#css-modules) |
| **Variables CSS** | Colores, tipografía, espaciado, breakpoints | [Ver →](frontend/STYLING_AND_THEMING.md#variables-css) |
| **Sistema de Temas** | Tema claro/oscuro con ThemeContext | [Ver →](frontend/STYLING_AND_THEMING.md#sistema-de-temas) |
| **Responsive Design** | Mobile-first, breakpoints | [Ver →](frontend/STYLING_AND_THEMING.md#responsive-design) |

#### Routing y Navegación

**[Documentación completa de routing →](frontend/ROUTING.md)**

Sistema de navegación con React Router v6:

- 9 rutas principales con lazy loading
- Layouts anidados con configuración condicional
- Rutas protegidas mediante autenticación
- Parámetros dinámicos y query params

#### Gestión de Estado

**[Guía completa de gestión de estado →](frontend/STATE_MANAGEMENT.md)**

Arquitectura de estado con Context API:

- Contextos globales vs estado local
- Hooks personalizados para lógica reutilizable
- Patrones de estado (useReducer, optimista, síncrono)
- Optimización de rendimiento (memoización, selectores)

#### Estructura Detallada

**[Estructura completa del frontend →](frontend/ESTRUCTURA.md)**

Organización de archivos y carpetas del proyecto frontend.

---

## Base de Datos

### Esquema de Base de Datos

**Base de datos**: `db_tecnocel_v4`
**Motor**: MariaDB 10.4.27 / MySQL 8.0+
**ORM**: Sequelize
**Total de tablas**: 26

### Documentación de la Base de Datos

| Documento | Descripción | Link |
|-----------|-------------|------|
| **Esquema Completo** | 26 tablas con columnas, tipos, constraints, relaciones | [Ver →](database/SCHEMA.md) |
| **Diagramas ER** | 5 diagramas Entity-Relationship en formato Mermaid | [Ver →](database/DIAGRAMS.md) |
| **Plan de Mejoras** | Historial de mejoras, optimizaciones, nuevas tablas | [Ver →](database/IMPROVEMENTS_PLAN.md) |
| **Migraciones** | Historial y guía de migraciones SQL | [Ver →](database/MIGRATIONS.md) |

### Tablas por Sistema

| Sistema | Tablas | Descripción |
|---------|:------:|-------------|
| **Productos y Catálogo** | 6 | `tb_almacen`, `tb_categorias`, `tb_marcas`, `tb_producto_imagenes`, `tb_producto_caracteristicas`, `tb_tipo_caracteristica` |
| **Clientes y Carrito** | 6 | `tb_clientes`, `tb_carritosweb`, `tb_carritoweb_items`, `tb_favoritos`, `tb_direcciones`, `tb_comentarios_productos` |
| **Ofertas y Descuentos** | 3 | `tb_ofertas`, `tb_productos_ofertas`, `tb_comentario_imagenes` |
| **Compras y Ventas** | 6 | `tb_ventas`, `tb_detalle_ventas`, `tb_proveedores`, `tb_compras`, `tb_detalle_compras`, `tb_presupuestos` |
| **Usuarios Admin** | 2 | `tb_usuarios`, `tb_roles` |
| **Legacy (POS)** | 1 | `tb_carrito` (deprecated) |
| **Otros** | 2 | `tb_parametros`, `tb_devoluciones` |

### Diagramas Disponibles

**[Ver todos los diagramas →](database/DIAGRAMS.md)**

1. **Diagrama ER General** - Vista completa de 26 tablas
2. **Sistema de Productos** - Catálogo, imágenes, características, ofertas
3. **Sistema de Clientes y Carrito** - Clientes, carritos, favoritos, comentarios
4. **Sistema de Compras y Ventas** - Proveedores, ventas, presupuestos
5. **Sistema de Usuarios Admin** - Administradores, roles, permisos

### Relaciones Principales

**Tabla Central: `tb_almacen` (Productos)**

- → `tb_categorias` (categoría)
- → `tb_marcas` (marca)
- ← `tb_producto_imagenes` (imágenes)
- ← `tb_producto_caracteristicas` (especificaciones)
- ← `tb_productos_ofertas` (ofertas)
- ← `tb_carritoweb_items` (en carritos)
- ← `tb_comentarios_productos` (comentarios)
- ← `tb_favoritos` (favoritos)

**Tabla Central: `tb_clientes`**

- ← `tb_carritosweb` (carritos)
- ← `tb_direcciones` (direcciones de envío)
- ← `tb_favoritos` (productos favoritos)
- ← `tb_comentarios_productos` (comentarios escritos)
- ← `tb_ventas` (compras realizadas)

### Configuración Inicial

```bash
# 1. Crear base de datos
mysql -u root -p -e "CREATE DATABASE db_tecnocel_v4 CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;"

# 2. Importar esquema
mysql -u root -p db_tecnocel_v4 < database/backups/db_tecnocel_v4.sql

# 3. Configurar .env en backend/
DB_NAME=db_tecnocel_v4
DB_USER=root
DB_PASSWORD=tu_password
DB_HOST=localhost
```

### Backups

Los backups están en `database/backups/` (no se commitean a Git):

```bash
# Crear backup
mysqldump -u root -p db_tecnocel_v4 > database/backups/backup_$(date +%Y%m%d).sql

# Restaurar backup
mysql -u root -p db_tecnocel_v4 < database/backups/backup_20251016.sql
```

---

## Deployment y Hosting

### Variables de Entorno

**[Guía completa de variables de entorno →](deployment/ENVIRONMENT.md)**

#### Backend (28 variables)

```env
# Base de datos
DB_NAME=db_tecnocel_v4
DB_USER=root
DB_PASSWORD=***
DB_HOST=localhost

# Servidor
PORT=3000
NODE_ENV=production
FRONTEND_URL=https://tuapp.com

# JWT
JWT_SECRET=***

# Google OAuth
GOOGLE_CLIENT_ID=***
GOOGLE_CLIENT_SECRET=***

# Email (opcional)
EMAIL_HOST=smtp.gmail.com
EMAIL_USER=***
EMAIL_PASSWORD=***
```

[Ver todas las variables del backend →](deployment/ENVIRONMENT.md#variables-de-backend)

#### Frontend (9 variables)

```env
# API
VITE_API_URL=https://api.tuapp.com/api

# Google OAuth
VITE_GOOGLE_CLIENT_ID=***

# Google Maps
VITE_GOOGLE_MAPS_API_KEY=***

# Cache
VITE_FAVORITOS_CACHE_DURATION=300000
VITE_OFERTAS_CACHE_DURATION=600000
```

[Ver todas las variables del frontend →](deployment/ENVIRONMENT.md#variables-de-frontend)

### Opciones de Hosting

**[Guía completa de hosting →](deployment/HOSTING.md)**

#### Backend (Node.js + Express)

| Plataforma | Tier Gratuito | Características | Recomendación |
|------------|---------------|-----------------|---------------|
| **Railway** | $5 crédito/mes | Fácil deploy, auto-scaling | Recomendado |
| **Render** | 750h/mes | Deploy automático desde Git | Recomendado |
| **Fly.io** | Limitado | Global edge network | Avanzado |
| **Heroku** | Limitado | Clásico, fácil | Opción |

#### Frontend (React SPA)

| Plataforma | Tier Gratuito | Características | Recomendación |
|------------|---------------|-----------------|---------------|
| **Vercel** | Ilimitado | Deploy automático, CDN global | Mejor opción |
| **Netlify** | 100GB/mes | Deploy automático, funciones | Recomendado |
| **GitHub Pages** | Ilimitado | Gratis, simple | Básico |

#### Base de Datos (MySQL)

| Plataforma | Tier Gratuito | Características | Recomendación |
|------------|---------------|-----------------|---------------|
| **PlanetScale** | 5GB | Serverless MySQL, branch database | Mejor opción |
| **Railway** | Incluido | MySQL en contenedor | Recomendado |
| **Clever Cloud** | Limitado | MySQL dedicado | Opción |

### Checklist de Deployment

- [ ] Variables de entorno configuradas para producción
- [ ] JWT_SECRET cambiado
- [ ] Build de producción testeado
- [ ] Base de datos migrada
- [ ] Backups configurados
- [ ] SSL/HTTPS configurado
- [ ] CORS configurado para dominio de producción
- [ ] Logging de producción habilitado
- [ ] Rate limiting configurado

---

## Guías de Desarrollo

### Guías para Desarrolladores

| Guía | Descripción | Link |
|------|-------------|------|
| **Getting Started** | Instalación paso a paso, configuración inicial | [Ver →](guides/GETTING_STARTED.md) |
| **Desarrollo** | Flujo de desarrollo, estructura, comandos útiles | [Ver →](guides/DEVELOPMENT.md) |
| **Git y Commits** | Convenciones de Git, branching, commits semánticos | [Ver →](guides/GIT_GUIDE.md) |
| **Justificación de Commits** | Guía para escribir buenos mensajes de commit | [Ver →](guides/COMMIT_JUSTIFICATION.md) |
| **Estandarización de Documentación** | Guía para escribir y mantener documentación | [Ver →](guides/GUIA_ESTANDARIZACION_DOCUMENTACION.md) |

### Comandos de Desarrollo Comunes

#### Backend

```bash
cd backend/

# Desarrollo
npm run dev          # Modo desarrollo con nodemon y TypeScript watch
npm run build        # Compilar TypeScript a dist/
npm start            # Ejecutar build de producción

# Utilidades
npm run test:images  # Probar endpoints de subida de imágenes
npm run init:logs    # Inicializar directorios de logs
```

#### Frontend

```bash
cd frontend/

# Desarrollo
npm run dev      # Iniciar servidor Vite (http://localhost:5173)
npm run build    # Build de producción (TypeScript + Vite)
npm run preview  # Vista previa del build
npm run lint     # Ejecutar ESLint
```

### Convenciones de Código

#### Nomenclatura

- **Archivos**: PascalCase para componentes, camelCase para utilidades
- **Componentes**: PascalCase (`ProductCard`, `AuthForm`)
- **Variables**: camelCase (`userData`, `productList`)
- **Constantes**: UPPER_SNAKE_CASE (`TOKEN_KEY`, `API_URL`)
- **Clases CSS**: kebab-case en CSS Modules
- **Modelos**: PascalCase en español (`Almacen`, `Cliente`)

#### TypeScript

- Type checking estricto habilitado
- Definir interfaces para props y estructuras complejas
- Usar JSDoc para funciones complejas
- Evitar `any`, preferir `unknown` o tipos apropiados

---

## Información del Proyecto

### Estado del Proyecto

**[Ver estado completo del proyecto →](project/ESTADO_AVANCE.md)**

| Aspecto | Progreso | Estado |
|---------|:--------:|--------|
| **Backend** | 85% | Funcional |
| **Frontend** | 80% | Funcional |
| **Base de Datos** | 90% | Completa |
| **Documentación** | 89% | En progreso |
| **Testing** | 30% | Pendiente |
| **Deployment** | 60% | En progreso |
| **GLOBAL** | **75-80%** | **En desarrollo activo** |

### Funcionalidades Implementadas

#### Completado

- Carrito de compras con persistencia
- Búsqueda y filtrado de productos
- Sistema de comentarios/reseñas con imágenes
- Autenticación JWT + Google OAuth 2.0
- Diseño responsive mobile-first
- Sistema de tema claro/oscuro
- Sistema de notificaciones en tiempo real
- Integración con Google Maps
- Sistema de favoritos
- Sistema de ofertas y descuentos
- Optimización de imágenes con Sharp
- Logging estructurado con Winston

#### En Progreso

- Panel de administración (estructura lista, funcionalidades pendientes)
- Integración de pasarela de pagos (planeado)
- Capacidades PWA (preparado para implementación)

### Stack Tecnológico

**[Ver stack completo con justificaciones →](project/TECNOLOGIAS.md)**

#### Backend

- **Runtime**: Node.js 18+
- **Framework**: Express 4.18
- **Lenguaje**: TypeScript 5.2
- **ORM**: Sequelize 6.35
- **Autenticación**: JWT + Passport.js (Google OAuth)
- **Validación**: Express-validator
- **Logging**: Winston
- **Imágenes**: Multer + Sharp

#### Frontend

- **Framework**: React 18.2
- **Lenguaje**: TypeScript 5.2
- **Build Tool**: Vite 5.0
- **Routing**: React Router 6.20
- **HTTP Client**: Axios 1.6
- **Estilos**: CSS Modules + Variables CSS
- **Notificaciones**: React-Toastify
- **Mapas**: Google Maps API

#### Base de Datos

- **Motor**: MariaDB 10.4 / MySQL 8.0
- **ORM**: Sequelize
- **Charset**: utf8mb4

---

## Búsqueda por Tema

### Índice Alfabético

#### A
- **API** → [API Backend](#api-backend-64-endpoints)
- **Arquitectura** → [Arquitectura del Proyecto](#arquitectura-del-proyecto)
- **Autenticación** → [Guía de Autenticación](api/guides/AUTHENTICATION.md)

#### B
- **Base de Datos** → [Base de Datos](#base-de-datos)
- **Backups** → [Base de Datos - Backups](#backups)

#### C
- **Carrito** → [Endpoints de Carrito](api/endpoints/carrito.md) | [Guía de Carrito](api/guides/SHOPPING_CART.md)
- **Componentes** → [Componentes del Frontend](#componentes-39-componentes)
- **Contextos** → [Contextos Globales](#contextos-globales-8-contextos)
- **Controladores** → [Documentación de Controladores](api/reference/CONTROLLERS.md)

#### D
- **Deployment** → [Deployment y Hosting](#deployment-y-hosting)
- **Diagramas** → [Diagramas ER](database/DIAGRAMS.md)
- **Direcciones** → [Endpoints de Direcciones](api/endpoints/direcciones.md)

#### E
- **Endpoints** → [Catálogo de Endpoints](api/ENDPOINTS.md)
- **Errores** → [Guía de Manejo de Errores](api/guides/ERROR_HANDLING.md)
- **Esquema** → [Esquema de Base de Datos](database/SCHEMA.md)
- **Estilos** → [Sistema de Estilos](frontend/STYLING_AND_THEMING.md)

#### F
- **Favoritos** → [Endpoints de Favoritos](api/endpoints/favoritos.md)

#### G
- **Google OAuth** → [Guía de Autenticación](api/guides/AUTHENTICATION.md)
- **Guías** → [Guías de Desarrollo](#guías-de-desarrollo)

#### H
- **Hooks** → [Hooks Personalizados](#hooks-personalizados-14-hooks)
- **Hosting** → [Guía de Hosting](deployment/HOSTING.md)

#### I
- **Imágenes** → [Guía de Carga de Imágenes](api/guides/IMAGE_UPLOAD.md) | [Servicio de Imágenes](api/reference/IMAGES_SERVICE.md)
- **Instalación** → [Getting Started](guides/GETTING_STARTED.md)

#### J
- **JWT** → [Guía de Autenticación](api/guides/AUTHENTICATION.md)

#### M
- **Marcas** → [Endpoints de Marcas](api/endpoints/marcas.md)
- **Migraciones** → [Migraciones de BD](database/MIGRATIONS.md)
- **Modelos** → [Modelos Sequelize](api/reference/MODELS.md)

#### O
- **Ofertas** → [Endpoints de Ofertas](api/endpoints/ofertas.md)

#### P
- **Productos** → [Endpoints de Productos](api/endpoints/productos.md) | [Guía de Búsqueda](api/guides/PRODUCT_SEARCH.md)

#### R
- **React** → [Frontend React](#frontend-react)
- **Reseñas** → [Guía de Reseñas](api/guides/REVIEWS_AND_RATINGS.md)
- **Routing** → [Routing y Navegación](frontend/ROUTING.md)

#### S
- **Servicios (Frontend)** → [Servicios de API](#servicios-de-api-9-servicios)

#### T
- **Tecnologías** → [Stack Tecnológico](project/TECNOLOGIAS.md)
- **Temas** → [Sistema de Temas](frontend/STYLING_AND_THEMING.md)

#### V
- **Variables de Entorno** → [Variables de Entorno](deployment/ENVIRONMENT.md)

---

## Recursos Adicionales

### Documentación de Código

- **[Backend README](../backend/README.md)** - Documentación del código backend
- **[Frontend README](../frontend/README.md)** - Documentación del código frontend
- **[Scripts README](../backend/scripts/README.md)** - Scripts de utilidad

### Documentación Externa

#### Tecnologías Principales

- [Node.js Documentation](https://nodejs.org/docs/)
- [Express Documentation](https://expressjs.com/)
- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Vite Documentation](https://vitejs.dev/)
- [Sequelize Documentation](https://sequelize.org/docs/v6/)

#### Bibliotecas

- [React Router](https://reactrouter.com/)
- [Axios Documentation](https://axios-http.com/)
- [Winston Logger](https://github.com/winstonjs/winston)
- [Sharp Image Processing](https://sharp.pixelplumbing.com/)
- [Multer File Upload](https://github.com/expressjs/multer)
- [JWT Documentation](https://jwt.io/)

### Archivo Histórico

Documentación histórica de implementaciones y notas de desarrollo:

- **[Implementaciones](archive/implementations/README.md)** - Historial de implementaciones (AuthContext, Contexts, Favoritos, Ofertas, Cache)
- **[Notas de Desarrollo](archive/notes/README.md)** - Notas históricas de desarrollo

### Archivos de Configuración del Proyecto

- **[CLAUDE.md](../CLAUDE.md)** - Instrucciones para Claude Code (IA)
- **[.cursor/rules/](../.cursor/rules/)** - Reglas para Cursor IDE
- **[.gitignore](../.gitignore)** - Archivos ignorados por Git

---

## Soporte y Contribución

### ¿Necesitas Ayuda?

1. **Revisa la documentación** relevante en las secciones anteriores
2. **Busca en los archivos** usando Ctrl+F en este documento
3. **Consulta el estado del proyecto** en [ESTADO_AVANCE.md](project/ESTADO_AVANCE.md)
4. **Revisa los commits recientes** para ver cambios recientes

### Contribuir al Proyecto

1. Lee la [Guía de Desarrollo](guides/DEVELOPMENT.md)
2. Sigue las [Convenciones de Git](guides/GIT_GUIDE.md)
3. Consulta la [Guía de Estandarización de Documentación](guides/GUIA_ESTANDARIZACION_DOCUMENTACION.md)
4. Mantén actualizada la documentación cuando hagas cambios

---

## Resumen Ejecutivo

**TecnoCel Web** es una plataforma de e-commerce full-stack moderna y escalable para productos tecnológicos.

### Números del Proyecto

| Métrica | Valor |
|---------|:-----:|
| **Progreso General** | 75-80% |
| **Backend: Endpoints** | 64 |
| **Backend: Controladores** | 11 |
| **Frontend: Componentes** | 39 |
| **Frontend: Contextos** | 8 |
| **Frontend: Hooks** | 14 |
| **Frontend: Servicios** | 9 |
| **Base de Datos: Tablas** | 26 |
| **Documentos técnicos** | 55 |
| **Líneas de código** | ~50,000+ |

### Características Principales

- **E-commerce Completo**: Productos, carrito, favoritos, ofertas, checkout
- **Autenticación Robusta**: JWT + Google OAuth 2.0
- **Responsive Design**: Mobile-first, funciona en todos los dispositivos
- **Tema Claro/Oscuro**: Personalización de la experiencia
- **Sistema de Reseñas**: Comentarios con imágenes y calificaciones
- **Optimización de Imágenes**: Procesamiento automático con Sharp
- **Sistema de Ofertas**: Descuentos y ofertas especiales
- **Integración con Maps**: Ubicación y direcciones con Google Maps

---

**Última actualización**: 16 de Octubre, 2025
**Versión del Proyecto**: 4.0
**Estado**: En desarrollo activo - 89% completado
**Próximo hito**: Panel de administración completo

---

**[Volver arriba](#documentación-tecnocel-web---índice-maestro)** | **[Inicio del Proyecto](../README.md)**
