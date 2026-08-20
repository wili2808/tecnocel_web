# Documentación TecnoCel Web

> Plataforma de e-commerce para productos tecnológicos. Frontend React 18 + TypeScript | Backend Node.js/Express + MySQL.

---

## Inicio Rápido

1. **[Instalación](guides/GETTING_STARTED.md)** — Configuración paso a paso
2. **[Stack Tecnológico](project/TECNOLOGIAS.md)** — Tecnologías y decisiones
3. **[Estado del Proyecto](project/ESTADO_AVANCE.md)** — Progreso y funcionalidades
4. **[Variables de Entorno](deployment/ENVIRONMENT.md)** — Configuración .env

---

## Índice por Sección

### API REST Backend

- **[Endpoints Completos](api/ENDPOINTS.md)** — Documentación de todos los endpoints
- **Recursos Detallados:**
  - [Productos](api/endpoints/productos.md)
  - [Carrito](api/endpoints/carrito.md)
  - [Clientes](api/endpoints/clientes.md)
  - [Comentarios](api/endpoints/comentarios.md)
  - [Ofertas](api/endpoints/ofertas.md)
  - [Notificaciones](api/endpoints/notificaciones.md)
  - [Envíos](api/endpoints/envios.md)
  - [Compras a Proveedores](api/endpoints/compras.md)
  - [Proveedores](api/endpoints/proveedores.md)
- **Guías de Integración:**
  - [Autenticación](api/guides/AUTHENTICATION.md) — JWT + Google OAuth
  - [Carrito de Compras](api/guides/SHOPPING_CART.md)
  - [Subida de Imágenes](api/guides/IMAGE_UPLOAD.md)
  - [Manejo de Errores](api/guides/ERROR_HANDLING.md)

### Frontend React

- **[Componentes](frontend/COMPONENTS.md)** — 101+ componentes organizados por dominio
- **[Contextos Globales](frontend/CONTEXTS.md)** — 10 contextos de estado
- **[Hooks Personalizados](frontend/HOOKS.md)** — 18+ hooks reutilizables
- **[Servicios API](frontend/SERVICES.md)** — 19 servicios cliente
- **[Gestión de Estado](frontend/STATE_MANAGEMENT.md)** — Patrones y arquitectura
- **[Estilos y Temas](frontend/STYLING_AND_THEMING.md)** — CSS Modules + Variables CSS
- **[Enrutamiento](frontend/ROUTING.md)** — Rutas y protección

### Base de Datos

- **[Diagramas y Esquema](database/DIAGRAMS.md)** — Estructura completa con relaciones
- **[Modelos de Referencia](api/reference/MODELS.md)** — Documentación de modelos Sequelize

### Deployment

- **[Stack de Producción](deployment/STACK_PRODUCCION.md)** — Vercel | Render | Aiven
- **[Email y Notificaciones](deployment/EMAIL.md)** — Configuración de email
- **[Variables de Entorno](deployment/ENVIRONMENT.md)** — Setup para dev/prod

### Guías de Desarrollo

- **[Desarrollo Local](guides/DEVELOPMENT.md)** — Setup para desarrolladores
- **[Imágenes y Optimización](api/MANEJO_IMAGENES.md)** — Sharp + ImageService

### Referencias

- **[Controladores Backend](api/reference/CONTROLLERS.md)** — Detalles técnicos
- **[Servicio de Imágenes](api/reference/IMAGES_SERVICE.md)** — Optimización y caché

---

## Métricas del Proyecto

| Área | Cantidad |
|------|----------|
| **Controladores backend** | 20 |
| **Componentes React** | 101+ |
| **Contextos globales** | 10 |
| **Hooks personalizados** | 18+ |
| **Servicios API frontend** | 19 |
| **Modelos Sequelize** | 32 |
| **Rutas API** | 17+ |
| **Endpoints** | 86+ |

---

## Características Principales

- Catálogo completo: búsqueda, filtros y paginación
- Carrito con validación de stock y precios
- Checkout con dirección, envío y confirmación
- Autenticación dual JWT (cliente/admin) + Google OAuth
- Panel de usuario: compras, favoritos, direcciones y soporte
- Panel de administración: dashboard, CRUD y reportes con exportación CSV
- Comentarios y reseñas con imágenes y moderación
- Sistema de ofertas y promociones
- Notificaciones in-app
- Gestión de envíos con seguimiento de estados
- Tema claro/oscuro persistente
- Diseño responsive (mobile-first)

---

## Stack Tecnológico

**Frontend:** React 18 | TypeScript | Vite | CSS Modules | Context API
**Backend:** Node.js | Express | TypeScript | Sequelize ORM
**Base de Datos:** MySQL 8.0+ (Aiven en producción)
**Imágenes:** Cloudinary (producción) | Sharp (local)
**Email:** Resend (producción)
**Hosting:** Vercel (frontend) | Render (backend) | Aiven (BD)

---

**Última actualización:** 20 de Agosto, 2026
**Versión:** 1.0