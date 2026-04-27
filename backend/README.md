# TecnoCel Web - Backend

API REST que da soporte a la plataforma de e-commerce TecnoCel Web. Desarrollada en Node.js utilizando el framework Express y tipada de manera estricta con TypeScript. Gestiona de manera eficiente el acceso a la base de datos MySQL, procesamiento de archivos e integración de autenticación.

---

## Tabla de Contenidos

- [Tecnologías Utilizadas](#tecnologías-utilizadas)
- [Inicio Rápido](#inicio-rápido)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Módulos Principales](#módulos-principales)
- [Scripts y Entorno](#scripts-y-entorno)

---

## Tecnologías Utilizadas

- **Core:** Node.js (v18+), TypeScript 5.3.3, Express 4.18.2
- **Base de Datos:** MySQL (v8.0+), Sequelize 6.35.2 (ORM)
- **Autenticación:** JSON Web Tokens (JWT)
- **Manejo de Archivos:** Multer, Sharp (para procesamiento y optimización de imágenes)

---

## Inicio Rápido

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar variables
cp .env.example .env
# Actualizar .env con credenciales de DB, JWT secret, etc.

# 3. Preparar la Base de Datos
mysql -u root -p -e "CREATE DATABASE db_tecnocel_v4;"

# 4. Iniciar la API
npm run dev
```

La API estará disponible en `http://localhost:3000/api` y el estado general en `http://localhost:3000/health`.

---

## Estructura del Proyecto

El código está estructurado bajo `src/` aplicando el patrón de controladores y servicios:

- `config/`: Archivos de configuración de la conexión a DB y variables globales.
- `controllers/`: Lógica de cada endpoint y validación de peticiones.
- `models/`: Definiciones de modelos Sequelize para el mapeo objeto-relacional.
- `routes/`: Enrutadores que agrupan los endpoints.
- `middleware/`: Filtros intermedios (autenticación, verificación de roles, carga de archivos).
- `services/`: Lógica de negocio reutilizable (procesamiento de imágenes, envío de emails, logs).

---

## Módulos Principales

La API atiende a las siguientes entidades clave:

- **Almacén:** Gestión del catálogo, búsqueda, stock y filtrado de productos.
- **Usuarios y Autenticación:** Registro, login, control de acceso basado en roles (Admin, Cliente) usando JWT.
- **Ventas y Carrito:** Transacciones de compra, registro de órdenes y validación del carrito web.
- **Interacción Social:** Comentarios en productos y listas de favoritos.
- **Manejo de Imágenes:** Subida de imágenes de productos y comentarios con validación y redimensionamiento automático.

---

## Scripts y Entorno

- `npm run dev`: Levanta el servidor en entorno de desarrollo con recarga automática.
- `npm run build`: Compila el código TypeScript al directorio `dist/`.
- `npm start`: Ejecuta la versión transpilada en modo producción.
- `npm run init:logs`: Crea la estructura necesaria para los registros (logs) del sistema.

Para más detalle sobre las variables de entorno necesarias, consultar el archivo `.env.example` o la documentación general del proyecto.

---

## Documentación de Referencia

Para una inmersión más profunda en el funcionamiento interno y la base de datos, revisa la siguiente documentación:

- **API y Endpoints:** [Documentación de Endpoints](../docs/api/ENDPOINTS.md) y [Guía de Uso](../docs/api/guides/USO_API.md)
- **Autenticación:** [Guía de Autenticación](../docs/api/guides/AUTHENTICATION.md)
- **Base de Datos:** [Esquema Completo](../docs/database/SCHEMA.md), [Modelos](../docs/database/MODELS.md) y [Migraciones](../docs/database/MIGRATIONS.md)
- **Servicios Internos:** [Servicio de Imágenes](../docs/api/reference/IMAGES_SERVICE.md)
- **Guías de Desarrollo:** [Entorno y Deployment](../docs/deployment/ENVIRONMENT.md) y [Guía General](../docs/guides/DEVELOPMENT.md)

---

[Volver al Inicio](../README.md)
