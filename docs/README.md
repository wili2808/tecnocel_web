**[Inicio](../README.md)**

---

# Documentación TecnoCel Web

> Documentación completa del proyecto - Plataforma de e-commerce para productos tecnológicos.

---

## Tabla de Contenidos

- [Inicio Rápido](#inicio-rápido)
- [Estructura de Documentación](#estructura-de-documentación)
- [Documentación por Módulo](#documentación-por-módulo)
- [Guías Principales](#guías-principales)
- [Contribución](#contribución)

---

## Inicio Rápido

Para comenzar a trabajar con el proyecto:

1. [Guía de Instalación](guides/GETTING_STARTED.md) - Instalación paso a paso
2. [Stack Tecnológico](project/TECNOLOGIAS.md) - Tecnologías utilizadas
3. [Estado del Proyecto](project/ESTADO_AVANCE.md) - Progreso actual
4. [Variables de Entorno](deployment/ENVIRONMENT.md) - Configuración
5. [Guía de Git](guides/GIT_GUIDE.md) - Convenciones de commits y flujo de trabajo

---

## Estructura de Documentación

### Proyecto

**[project/](project/README.md)** - Información general del proyecto

- [TECNOLOGIAS.md](project/TECNOLOGIAS.md) - Stack tecnológico
- [ESTADO_AVANCE.md](project/ESTADO_AVANCE.md) - Estado del proyecto

### API Backend

**[api/](api/README.md)** - Documentación de la API REST

- [ENDPOINTS.md](api/ENDPOINTS.md) - Documentación de endpoints
- [endpoints/](api/endpoints/) - Documentación detallada por recurso
  - [caracteristicas.md](api/endpoints/caracteristicas.md) - Características de productos
  - [carrito.md](api/endpoints/carrito.md) - Carrito de compras
  - [clientes.md](api/endpoints/clientes.md) - Gestión de clientes
  - [comentarios.md](api/endpoints/comentarios.md) - Comentarios y valoraciones
  - [direcciones.md](api/endpoints/direcciones.md) - Direcciones de envío
  - [favoritos.md](api/endpoints/favoritos.md) - Sistema de favoritos
  - [marcas.md](api/endpoints/marcas.md) - Marcas de productos
  - [ofertas.md](api/endpoints/ofertas.md) - Sistema de ofertas
  - [productos.md](api/endpoints/productos.md) - Catálogo de productos
  - [upload.md](api/endpoints/upload.md) - Subida de archivos
- [reference/](api/reference/) - Referencias técnicas
  - [IMAGES_SERVICE.md](api/reference/IMAGES_SERVICE.md) - Servicio de imágenes
  - [ROUTES_ANALYSIS.md](api/reference/ROUTES_ANALYSIS.md) - Análisis de rutas
  - [CONTROLLERS.md](api/reference/CONTROLLERS.md) - Análisis de controladores
  - [MODELS.md](api/reference/MODELS.md) - Análisis de modelos
- [guides/](api/guides/) - Guías de uso de la API
  - [AUTHENTICATION.md](api/guides/AUTHENTICATION.md) - Guía de autenticación (JWT + Google)
- [archive/](api/archive/) - Documentación histórica de la API

### Base de Datos

**[database/](database/README.md)** - Esquema y modelos de datos

- [SCHEMA.md](database/SCHEMA.md) - Esquema completo
- [DIAGRAMS.md](database/DIAGRAMS.md) - Diagramas ER
- [IMPROVEMENTS_PLAN.md](database/IMPROVEMENTS_PLAN.md) - Plan de mejoras

### Deployment

**[deployment/](deployment/README.md)** - Despliegue y configuración

- [ENVIRONMENT.md](deployment/ENVIRONMENT.md) - Variables de entorno
- [HOSTING.md](deployment/HOSTING.md) - Guía de hosting

### Frontend

**[frontend/](frontend/README.md)** - Documentación de la aplicación React

#### Componentes y UI

- [COMPONENTS.md](frontend/COMPONENTS.md) - Componentes principales
- [COMPONENTS_LEGACY.md](frontend/COMPONENTS_LEGACY.md) - Componentes legacy

#### Arquitectura y Estado

- [CONTEXTS.md](frontend/CONTEXTS.md) - Contextos globales de React
- [HOOKS.md](frontend/HOOKS.md) - Hooks personalizados
- [SERVICES.md](frontend/SERVICES.md) - Servicios de API
- [STATE_MANAGEMENT.md](frontend/STATE_MANAGEMENT.md) - Gestión de estado global

#### Diseño y Estilos

- [STYLING.md](frontend/STYLING.md) - Sistema de estilos
- [THEMING.md](frontend/THEMING.md) - Sistema de temas
- [ROUTING.md](frontend/ROUTING.md) - Configuración de rutas

### Guías

**[guides/](guides/README.md)** - Guías de desarrollo

- [GETTING_STARTED.md](guides/GETTING_STARTED.md) - Instalación y configuración
- [GIT_GUIDE.md](guides/GIT_GUIDE.md) - Convenciones de commits y flujo de trabajo
- [COMMIT_JUSTIFICATION.md](guides/COMMIT_JUSTIFICATION.md) - Justificación de commits
- [GUIA_ESTANDARIZACION_DOCUMENTACION.md](guides/GUIA_ESTANDARIZACION_DOCUMENTACION.md) - Guía de documentación

### Archivo

**[archive/](archive/)** - Documentación histórica

---

## Documentación por Módulo

### Backend

- Código fuente: [../backend/README.md](../backend/README.md)
- Scripts: [../backend/scripts/README.md](../backend/scripts/README.md)
- API REST: [api/README.md](api/README.md)

### Frontend

- Código fuente: [../frontend/README.md](../frontend/README.md)
- Componentes: [frontend/COMPONENTS.md](frontend/COMPONENTS.md)
- Contextos: [frontend/CONTEXTS.md](frontend/CONTEXTS.md)
- Hooks: [frontend/HOOKS.md](frontend/HOOKS.md)
- Servicios: [frontend/SERVICES.md](frontend/SERVICES.md)

### Base de Datos

- Esquema: [database/SCHEMA.md](database/SCHEMA.md)
- Backups: [../database/backups/](../database/backups/)

---

## Guías Principales

### Primeros Pasos

- [Guía de Instalación](guides/GETTING_STARTED.md)
- [Stack Tecnológico](project/TECNOLOGIAS.md)
- [Variables de Entorno](deployment/ENVIRONMENT.md)

### API y Backend

- [Endpoints de API](api/ENDPOINTS.md)
- [Esquema de Base de Datos](database/SCHEMA.md)

### Frontend

- [Componentes Frontend](frontend/COMPONENTS.md)
- [Contextos Globales](frontend/CONTEXTS.md)
- [Hooks Personalizados](frontend/HOOKS.md)
- [Servicios de API](frontend/SERVICES.md)
- [Gestión de Estado](frontend/STATE_MANAGEMENT.md)

### Desarrollo

- [Guía de Git](guides/GIT_GUIDE.md)
- [Justificación de Commits](guides/COMMIT_JUSTIFICATION.md)
- [Guía de Documentación](guides/GUIA_ESTANDARIZACION_DOCUMENTACION.md)

---

## Contribución

Para contribuir al proyecto:

1. Revisa la [Guía de Estandarización](guides/GUIA_ESTANDARIZACION_DOCUMENTACION.md)
2. Consulta el [Estado del Proyecto](project/ESTADO_AVANCE.md)
3. Sigue las [convenciones de Git](guides/GIT_GUIDE.md)
4. Lee la documentación específica del módulo que vas a modificar

**Última actualización**: 8 de Octubre, 2025
**Versión**: 4.0
**Estado**: En desarrollo activo

---

**[Volver arriba](#tabla-de-contenidos)** | **[Inicio](../README.md)**
