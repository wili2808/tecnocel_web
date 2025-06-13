# TECNOCEL WEB

## Descripción del Proyecto

Este proyecto es un sitio web profesional desarrollado para TECNOCEL, una empresa enfocada en la venta de articulos tecnologicos como Smartphones y Noteboocks. La aplicación sigue una arquitectura cliente-servidor, donde el **frontend**, desarrollado con React.js y TypeScript, proporciona la interfaz de usuario interactiva. El **backend**, construido con Node.js y Express, maneja la lógica de negocio, la autenticación, la interacción con la base de datos MySQL y expone una API REST para ser consumida por el frontend.
La base de datos a utilizar sera una ya existente y en funcionamiento por otra app destinada a la gestion de los productos, ventas, clientes y usuarios.
Una parte preliminar al desarrollo del proyecto será el refinamiento de esta base de datos para adaptarla a las necesidades para la construccion de la API necesario para que la web de ventas "TECNOCEL WEB" pueda brindar las funcionalidades necesarios a los clientes. Entre otros aspectos importantes a implementar sera la autenticacion de usuarios clientes y manejo de su informacion y compras en la web, temas que no son contemplados en el diseño actual de la base de datos.

## Estructura del Proyecto

```
tennocel_web/
├── frontend/                 # Aplicación del cliente (Vite + React)
│   ├── src/
│   │   ├── api/             # Configuraciones de Axios
│   │   ├── assets/          # Recursos estáticos (imágenes, fuentes)
│   │   ├── components/      # Componentes reutilizables (por feature)
│   │   ├── contexts/        # Contextos de React
│   │   ├── hooks/           # Hooks personalizados
│   │   ├── pages/           # Páginas principales (Home, Catálogo)
│   │   ├── services/        # Lógica de comunicación con la API
│   │   └── styles/          # Estilos globales y temas (Emotion)
│   └── public/              # Archivos públicos
├── backend/                  # Servidor y API (Node.js + Express)
│   ├── src/
│   │   ├── config/          # Configuraciones (ej. variables de entorno)
│   │   ├── controllers/     # Controladores de la API (lógica de rutas)
│   │   ├── database/        # Configuración de la conexión a la BD (Sequelize)
│   │   ├── middleware/      # Middlewares de Express
│   │   ├── models/          # Modelos de datos de Sequelize
│   │   ├── routes/          # Rutas de la API
│   │   └── utils/           # Funciones de utilidad
│   └── dist/                 # Archivos transpilados de TypeScript
```

## Características Principales de la web de ventas.

- Catálogo de productos dinámico.
- Sistema de autenticación y gestión de usuarios clientes.
- Gestión completa de informacion de cliente.
- Módulos para compras, carrito, devoluciones.
- Carrito de compras funcional.
- Servicios de personalización y cotizaciones.

## Tecnologías

### Frontend

- **Framework**: React.js con TypeScript
- **Entorno de Desarrollo**: Vite
- **Enrutamiento**: React Router DOM
- **Estilos**: Emotion (CSS-in-JS)
- **Cliente HTTP**: Axios

### Backend

- **Framework**: Node.js con Express y TypeScript
- **ORM**: Sequelize
- **Base de Datos**: MySQL
- **Autenticación**: JSON Web Tokens (JWT)
- **Hashing de Contraseñas**: Bcrypt.js

## Roles de Usuario

- **Administrador**: Control total del sistema.
- **Cliente**: Acceso al catálogo, carrito y sus pedidos.
- **Vendedor**: Gestión de ventas y clientes.
- **Diseñador**: Acceso a los módulos de personalización.

## Módulos Principales

1.  **Gestión de Inventario (Almacén)**

    - Control de stock de productos y categorías.
    - Asociación con proveedores.

2.  **Gestión de Transacciones**

    - **Ventas**: Proceso de venta, desde el carrito hasta la finalización.
    - **Compras**: Registro de compras a proveedores.
    - **Devoluciones**: Manejo de devoluciones de clientes.
    - **Presupuestos**: Creación y seguimiento de cotizaciones para trabajos personalizados.

3.  **Gestión de Entidades**

    - **Usuarios**: Registro, autenticación y perfiles.
    - **Roles**: Control de acceso basado en roles.
    - **Clientes y Proveedores**: Administración de la información de contacto y transacciones.

4.  **Servicios Personalizados**
    - Flujo para solicitar cotizaciones de trabajos de sublimación y bordado.
    - Seguimiento del estado de los trabajos personalizados.
