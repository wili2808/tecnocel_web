# MAC WIL - Creaciones e Impresiones

## Descripción del Proyecto

Este proyecto es un sitio web profesional desarrollado para MAC WIL, una empresa especializada en la confección, sublimación y bordado de ropa y uniformes. La aplicación sigue una arquitectura cliente-servidor, donde el **frontend**, desarrollado con React.js y TypeScript, proporciona la interfaz de usuario interactiva. El **backend**, construido con Node.js y Express, maneja la lógica de negocio, la autenticación, la interacción con la base de datos PostgreSQL y expone una API para ser consumida por el frontend. Juntos, frontend y backend, permiten gestionar productos, usuarios, pedidos y ofrecer servicios de personalización.

## Estructura del Proyecto

```
macwil_web/
├── frontend/                 # Aplicación del cliente
│   ├── src/
│   │   ├── assets/          # Recursos estáticos (imágenes, fuentes)
│   │   ├── components/      # Componentes reutilizables
│   │   ├── pages/           # Páginas principales
│   │   ├── services/        # Servicios de API
│   │   └── styles/          # Estilos globales
│   └── public/              # Archivos públicos
├── backend/                  # Servidor y API
│   ├── src/
│   │   ├── controllers/     # Controladores de la API
│   │   ├── models/          # Modelos de datos
│   │   ├── routes/          # Rutas de la API
│   │   └── services/        # Lógica de negocio
│   └── config/              # Configuraciones
└── database/                # Esquemas y migraciones

```

## Características Principales

- Catálogo de productos
- Sistema de roles de usuario
- Gestión de pedidos
- Servicios de personalización
- Ubicación y contacto

## Tecnologías

- Frontend: React.js con TypeScript
- Backend: Node.js con Express
- Base de datos: PostgreSQL
- Autenticación: JWT

## Roles de Usuario

- Administrador
- Cliente
- Vendedor
- Diseñador

## Módulos Principales

1. Gestión de Productos

   - Uniformes escolares
   - Uniformes deportivos
   - Trabajos de sublimación
   - Bordados personalizados

2. Sistema de Ventas

   - Carrito de compras
   - Proceso de pago
   - Seguimiento de pedidos

3. Gestión de Usuarios

   - Registro y autenticación
   - Perfiles de usuario
   - Control de acceso basado en roles

4. Servicios Personalizados
   - Solicitud de cotizaciones
   - Diseños personalizados
   - Seguimiento de trabajos
