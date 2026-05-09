# Plan de Implementación: Módulo de Configuración Administrativa - TecnoCel

## Introducción
Este documento detalla la estrategia para la implementación de un nuevo módulo de **Configuración** dentro del panel de administración de TecnoCel. Como expertos en desarrollo full-stack, buscamos una solución escalable, modular y orientada a la experiencia de usuario (UX) de alto nivel.

## Objetivos
1.  **Centralización:** Unificar todos los parámetros ajustables de la plataforma en un solo lugar.
2.  **Flexibilidad:** Utilizar una estructura de datos flexible (Clave-Valor) para permitir el crecimiento del sistema sin cambios constantes en el esquema de la base de datos.
3.  **Control de Marca:** Permitir ajustes visuales y comerciales dinámicos sin intervención técnica directa.

## Arquitectura del Módulo

### 1. Interfaz de Usuario (Frontend)
El módulo se ubicará en el sidebar del panel administrativo, con acceso prioritario cerca de las acciones de sesión.
-   **Layout:** Navegación interna por pestañas o categorías (General, Tienda, SEO, Notificaciones).
-   **Componente Base:** `GestionConfiguracion.tsx`.
-   **Estilos:** Uso de CSS Modules para asegurar la encapsulación y soporte de temas.

### 2. Persistencia (Backend)
-   **Modelo:** `Configuracion` (ya existente).
-   **Estructura:** Tabla `tb_configuracion` con columnas `clave`, `valor` y `fyh_actualizacion`.
-   **API:** Endpoints para obtener configuraciones públicas (ej. SEO) y privadas (ej. API Keys).

## Roadmap de Funcionalidades

### Fase 1: Estructura y Temas (Completada)
- [x] Integración en el sidebar del Admin Panel.
- [x] Implementación de selector de Tema (Claro/Oscuro).
- [x] Solución de transiciones armónicas mediante pseudo-elementos.

### Fase 2: Configuración Comercial y SEO (Completada)
- [x] Backend: Controlador y rutas de `Configuracion`.
- [x] Frontend: Servicio `configuracionService`.
- [x] Gestión de metadatos (Título, Descripción).
- [x] Configuración de WhatsApp e Instagram.

### Fase 3: CMS y Moderación
-   [ ] Moderación de comentarios y reseñas de clientes.
-   [ ] Gestión de banners y carruseles de la Home.
-   [ ] Toggle de "Modo Mantenimiento".

### Fase 4: Seguridad y Logs
-   [ ] Historial de acciones administrativas (Auditoría).
-   [ ] Configuración de seguridad (Tiempo de sesión, etc).

## Consideraciones Técnicas
-   **Rendimiento:** Las configuraciones se cargarán al inicio de la sesión administrativa y se cachearán donde sea posible.
-   **Seguridad:** Las claves sensibles (como API Keys) nunca deben enviarse al cliente si no es estrictamente necesario, y deben estar protegidas por permisos de ADMIN.
-   **Escalabilidad:** El diseño del backend permite añadir nuevas claves de configuración simplemente insertando filas en la base de datos.
