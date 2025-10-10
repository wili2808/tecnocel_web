# 🛍️ TecnoCel Web

> Plataforma de e-commerce moderna para productos tecnológicos con React 18, TypeScript, Node.js y MySQL.

---

## Tabla de Contenidos

- [Inicio Rápido](#inicio-rápido)
- [Características Principales](#características-principales)
- [Requisitos del Sistema](#requisitos-del-sistema)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Documentación](#documentación)
- [Contribuir](#contribuir)
- [Licencia](#licencia)

---

## Inicio Rápido

```bash
# 1. Clonar y configurar
git clone https://github.com/wili2808/tecnocel_web.git
cd tecnocel_web

# 2. Backend (Terminal 1)
cd backend && cp .env.example .env
npm install && npm run dev

# 3. Frontend (Terminal 2)
cd frontend && cp .env.example .env
npm install && npm run dev
```

**URLs:** Frontend [`localhost:5173`](http://localhost:5173) | Backend [`localhost:3000`](http://localhost:3000) | API [`localhost:3000/api`](http://localhost:3000/api)

---

## Características Principales

- 🛒 **Carrito** - Gestión completa de compras
- 🔍 **Búsqueda** - Filtros avanzados y búsqueda en tiempo real
- ⭐ **Comentarios** - Sistema de reseñas con imágenes
- 👤 **Auth** - JWT + Google OAuth 2.0
- 💝 **Favoritos** - Productos destacados por usuario
- 🏷️ **Ofertas** - Sistema de descuentos y promociones
- 🎨 **Temas** - Modo claro/oscuro
- 📱 **Responsive** - Diseño mobile-first

---

## Documentación

Para acceder a la documentación completa del proyecto:

**[📚 Ver Documentación Completa](docs/README.md)**

### Accesos Rápidos

- [Guía de Instalación](docs/guides/GETTING_STARTED.md) - Instalación paso a paso
- [Guía de desarrollo](docs/guides/DEVELOPMENT.md) - Guia para desarrolladores
- [Guía de Autenticación](docs/api/guides/AUTHENTICATION.md) - JWT y Google OAuth
- [API Endpoints](docs/api/ENDPOINTS.md) - Documentación de la API REST
- [Base de Datos](docs/database/SCHEMA.md) - Esquema y modelos
- [Stack Tecnológico](docs/project/TECNOLOGIAS.md) - Tecnologías utilizadas
- [Configuración](docs/deployment/ENVIRONMENT.md) - Variables de entorno

---

## Requisitos del Sistema

| Requisito | Versión Mínima |
| --------- | -------------- |
| Node.js   | 18.x           |
| MySQL     | 8.0            |
| npm/yarn  | 9.x/1.22.x     |

---

## Estructura del Proyecto

```
tecnocel_web/
├── backend/     # 🌐 Web Service REST API (Node.js + Express + TypeScript)
├── frontend/    # ⚛️ Aplicación Web (React 18 + TypeScript + Vite)
├── database/    # 🗄️ Esquemas SQL y backups
└── docs/        # 📚 Documentación completa del proyecto
```

---

## Contribuir

Consulta la documentación completa para conocer las convenciones y el flujo de trabajo del proyecto.

---

## Licencia

© 2025 TecnoCel Web - Todos los derechos reservados

---

**Última actualización**: 7 de Octubre, 2025
**Versión**: 1.0
**Estado**: En desarrollo
**Stack**: React 18 + TypeScript + Node.js + Express + MySQL

---

**[📚 Documentación](docs/README.md)**
