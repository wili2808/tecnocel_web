# TECNOCEL WEB

## Descripción General del Proyecto

TECNOCEL WEB es una plataforma profesional para la venta de artículos tecnológicos (smartphones, notebooks, accesorios, etc.), desarrollada con una arquitectura cliente-servidor robusta y escalable. El sistema integra un frontend moderno en React.js/TypeScript y un backend en Node.js/Express con TypeScript, gestionando la lógica de negocio, autenticación, y persistencia de datos en MySQL mediante Sequelize ORM. La base de datos parte de un modelo existente, refinado para soportar la web de ventas y nuevas funcionalidades como autenticación de clientes y gestión de compras online.

---

## Arquitectura y Estructura del Proyecto

```
tecnocel_web/
├── frontend/                 # Aplicación cliente (Vite + React + TS)
│   ├── src/
│   │   ├── api/             # Configuración de Axios
│   │   ├── assets/          # Recursos estáticos (imágenes, fuentes, videos)
│   │   ├── components/      # Componentes reutilizables por feature
│   │   ├── contexts/        # Contextos globales (auth, carrito, tema)
│   │   ├── hooks/           # Hooks personalizados
│   │   ├── pages/           # Páginas principales (Home, Catálogo, Auth)
│   │   ├── services/        # Lógica de comunicación con la API
│   │   ├── styles/          # Estilos globales y temas (Emotion)
│   │   ├── types/           # Tipos TypeScript
│   │   └── utils/           # Utilidades de UI y lógica de negocio
│   └── public/              # Archivos públicos
├── backend/                  # Servidor y API (Node.js + Express + TS)
│   ├── src/
│   │   ├── config/          # Configuración de BD y variables de entorno
│   │   ├── controllers/     # Lógica de rutas y negocio (REST)
│   │   ├── database/        # Scripts SQL y definición de la BD
│   │   ├── middleware/      # Middlewares (auth, validación, imágenes)
│   │   ├── models/          # Modelos Sequelize (entidades y relaciones)
│   │   ├── routes/          # Definición de rutas de la API
│   │   └── utils/           # Logger, email, utilidades
│   └── dist/                # Archivos transpilados de TypeScript
├── database/                 # Scripts y backups de la base de datos
│   └── backups/             # Respaldos SQL
└── README.md
```

---

## Tecnologías Principales

### Frontend

- **Framework:** React.js + TypeScript
- **Bundler:** Vite
- **Enrutamiento:** React Router DOM
- **Estilos:** Emotion (CSS-in-JS)
- **Cliente HTTP:** Axios
- **Gestión de Estado:** Context API (auth, carrito, tema)

### Backend

- **Framework:** Node.js + Express + TypeScript
- **ORM:** Sequelize
- **Base de Datos:** MySQL
- **Autenticación:** JSON Web Tokens (JWT)
- **Hashing de Contraseñas:** Bcrypt.js
- **Logger:** Personalizado (integrado con Sequelize)

---

## Flujos y Funcionalidades Clave

### Backend

- **Inicialización automática:**
  - El archivo `src/config/database.ts` gestiona la conexión a MySQL usando variables de entorno.
  - Sincroniza modelos Sequelize y crea datos de ejemplo si la base está vacía (categorías y productos base).
  - Logging avanzado para desarrollo y producción.
- **API RESTful:**
  - Endpoints para gestión de inventario, ventas, compras, devoluciones, presupuestos, clientes, usuarios y roles.
  - Middlewares para autenticación JWT, validación de datos y manejo de imágenes.
- **Seguridad:**
  - Uso de variables de entorno para credenciales sensibles.
  - Hashing de contraseñas con Bcrypt.
  - Control de acceso basado en roles (Administrador, Cliente, Vendedor, Diseñador).

### Frontend

- **Catálogo de productos:**
  - Visualización dinámica, filtros por categoría, búsqueda y ordenamiento.
- **Carrito de compras:**
  - Añadir, eliminar y modificar productos, integración con el flujo de compra.
- **Autenticación y gestión de usuario:**
  - Registro, login, logout y gestión de perfil de cliente.
- **Experiencia de usuario:**
  - UI moderna, responsiva y accesible.
  - Contextos globales para autenticación, carrito y tema.

### Base de Datos

- **Modelo relacional robusto:**
  - Entidades: Cliente, Usuario, Almacén, Producto, Venta, Compra, Devolución, Presupuesto, Proveedor, Rol, Categoría.
  - Relaciones bien definidas para soportar operaciones de ventas, compras, devoluciones y presupuestos.
- **Scripts SQL y backups:**
  - Scripts para creación, refinamiento y respaldo de la base de datos.

---

## Roles de Usuario

- **Administrador:** Control total del sistema.
- **Cliente:** Acceso al catálogo, carrito y sus pedidos.
- **Vendedor:** Gestión de ventas y clientes.
- **Diseñador:** Acceso a módulos de personalización.

---

## Módulos Principales

1. **Gestión de Inventario (Almacén):** Control de stock, categorías y proveedores.
2. **Gestión de Transacciones:**
   - Ventas: Flujo completo desde carrito hasta finalización.
   - Compras: Registro de compras a proveedores.
   - Devoluciones: Manejo de devoluciones de clientes.
   - Presupuestos: Cotizaciones y seguimiento de trabajos personalizados.
3. **Gestión de Entidades:**
   - Usuarios: Registro, autenticación y perfiles.
   - Roles: Control de acceso.
   - Clientes y Proveedores: Administración de información y transacciones.
4. **Servicios Personalizados:**
   - Solicitud y seguimiento de trabajos de sublimación y bordado.

---

## Buenas Prácticas y Recomendaciones

- **Variables de entorno:** Usar `.env` para credenciales y configuración sensible.
- **Estructura modular:** Separar lógica de negocio, modelos, rutas y utilidades.
- **Tipado estricto:** Aprovechar TypeScript en frontend y backend para robustez.
- **Logger centralizado:** Facilita el debugging y monitoreo.
- **Onboarding:**
  1. Clonar el repositorio y ejecutar `npm install` en `/backend` y `/frontend`.
  2. Configurar archivos `.env` en ambos entornos.
  3. Levantar la base de datos MySQL y ejecutar los scripts de `/backend/src/database/` si es necesario.
  4. Iniciar el backend (`npm run dev` o `npm start`) y el frontend (`npm run dev`).

---

## Contacto y Soporte

Para dudas, sugerencias o soporte, contactar al equipo de desarrollo de TECNOCEL.
