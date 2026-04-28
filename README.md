# TecnoCel Web

TecnoCel Web es una plataforma de e-commerce full-stack orientada a la venta de productos tecnológicos. Desarrollada con React 18 (TypeScript) en el frontend y Node.js/Express con MySQL en el backend, el proyecto representa una solución completa y escalable. Su arquitectura modular permite un fácil mantenimiento y facilita futuras integraciones o continuaciones de desarrollo.

---

## Tabla de Contenidos

- [Inicio Rápido](#inicio-rápido)
- [Características Principales](#características-principales)
- [Requisitos del Sistema](#requisitos-del-sistema)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Documentación](#documentación)
- [Licencia](#licencia)

---

## Inicio Rápido

```bash
# 1. Clonar el repositorio
git clone https://github.com/wili2808/tecnocel_web.git
cd tecnocel_web

# 2. Configurar y levantar el Backend (Terminal 1)
cd backend
cp .env.example .env
npm install
npm run dev

# 3. Configurar y levantar el Frontend (Terminal 2)
cd frontend
cp .env.example .env
npm install
npm run dev
```

**Accesos locales:**
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:3000/api`

---

## Características Principales

### Frontend (Plataforma de Ventas)
- **Interfaz de Usuario:** Diseño responsivo (mobile-first) enfocado en una experiencia de usuario fluida, con soporte nativo para modo claro y oscuro.
- **Catálogo y Búsqueda:** Navegación dinámica de productos con un motor de búsqueda integrado y filtros avanzados en tiempo real.
- **Gestión de Compras:** Sistema de carrito de compras interactivo y un proceso de checkout intuitivo para los clientes.
- **Interacción del Cliente:** Visualización de reseñas, calificación de productos y gestión personalizada de listas de favoritos y direcciones de envío.

### Backend (REST API)
- **Autenticación y Seguridad:** Sistema seguro de control de acceso basado en JWT (JSON Web Tokens) con soporte integrado para autenticación social mediante Google OAuth 2.0.
- **Gestión de Datos:** Modelado relacional robusto con MySQL para manejar eficientemente el inventario, usuarios, órdenes y transacciones del sistema.
- **Manejo de Archivos:** Endpoints dedicados con soporte para la carga, redimensionamiento y optimización automática de imágenes (productos y comentarios).
- **Módulo Administrativo y de Ofertas:** Rutas y lógica de negocio para gestionar el catálogo completo, reportes de ventas y la aplicación dinámica de descuentos y promociones en tiempo real.

---

## Requisitos del Sistema

| Componente | Versión Mínima |
| ---------- | -------------- |
| Node.js    | 18.x           |
| MySQL      | 8.0            |
| npm        | 9.x            |

---

## Estructura del Proyecto

```
tecnocel_web/
├── backend/     # API REST (Node.js, Express, TypeScript)
├── frontend/    # Aplicación Web SPA (React 18, Vite, TypeScript)
├── database/    # Esquemas SQL, backups y diagramas
└── docs/        # Documentación detallada del sistema
```

---

## Documentación

Para una comprensión más técnica del sistema, revisar la documentación adjunta:

- [Documentación Principal](docs/README.md)
- [Guía de Instalación](docs/guides/GETTING_STARTED.md)
- [API Endpoints](docs/api/ENDPOINTS.md)
- [Esquema de Base de Datos](docs/database/DIAGRAMS.md)

---

## Licencia

© 2026 TecnoCel Web. Todos los derechos reservados.

---

**Stack Tecnológico:** React 18, TypeScript, Node.js, Express, MySQL.
