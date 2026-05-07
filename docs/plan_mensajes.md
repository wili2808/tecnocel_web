# Plan de Implementación: Módulo de Mensajes

## Descripción
Implementación de un sistema de gestión de mensajes recibidos desde el formulario de contacto de la web. Permite a los clientes enviar consultas y a los administradores gestionar estas comunicaciones desde el Panel de Control.

## Estructura de Datos (Tabla: `tb_mensajes_contacto`)
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id_mensaje` | INT (PK) | Identificador único autoincremental |
| `nombre` | VARCHAR(100) | Nombre del remitente |
| `email` | VARCHAR(100) | Correo electrónico de contacto |
| `telefono` | VARCHAR(20) | Teléfono de contacto (opcional) |
| `asunto` | VARCHAR(100) | Motivo del mensaje |
| `mensaje` | TEXT | Contenido del mensaje |
| `leido` | BOOLEAN | Estado de lectura (default: false) |
| `fyh_creacion` | DATETIME | Fecha y hora de recepción |
| `fyh_actualizacion` | DATETIME | Fecha y hora de última modificación |

## Fases de Implementación

### Fase 1: Persistencia (Base de Datos)
1.  **Migración SQL**: Crear `database/migrations/V12__tabla_mensajes_contacto.sql`.
2.  **Modelo Sequelize**: Crear `backend/src/models/MensajeContacto.ts`.
3.  **Relaciones**: Registrar el modelo en `backend/src/models/relaciones.ts`.

### Fase 2: Backend (API REST)
1.  **Controlador**: `MensajeController.ts` con métodos `create`, `getAll`, `getById`, `updateStatus` y `delete`.
2.  **Rutas**: `mensajeRoutes.ts` con protección por permisos.
3.  **Configuración**: Registrar rutas en el servidor principal.
4.  **Permisos**: Asegurar que existan los permisos `ver_mensajes` y `gestionar_mensajes`.

### Fase 3: Frontend (Servicios y Tipos)
1.  **Tipos**: Definir interfaces en `frontend/src/types/mensaje.ts`.
2.  **Servicio**: Crear `frontend/src/services/mensajeService.ts`.
3.  **Constantes**: Agregar el módulo a `frontend/src/constants/menuPermisos.ts`.

### Fase 4: Frontend (UI/UX - Admin Panel)
1.  **Componente**: Crear `frontend/src/components/admin/GestionMensajes/GestionMensajes.tsx`.
2.  **Vista**: Implementar tabla con `AdminDataTable`.
3.  **Interacción**: Modal para lectura de mensajes y acciones de cambio de estado/eliminación.
4.  **Integración**: Actualizar `AdminPanel.tsx` para incluir el nuevo módulo.

### Fase 5: Conexión del Formulario de Contacto
1.  **Integración**: Actualizar `frontend/src/components/contact/ContactForm/ContactForm.tsx` para enviar los datos reales a la API.
2.  **Feedback**: Mejorar el manejo de éxito/error tras el envío.

## Consideraciones de Seguridad
- Validación de datos en backend con `express-validator`.
- Sanitización de contenido TEXT para evitar XSS.
- Rate limiting en el endpoint público de creación.
