# Sistema de Notificaciones — Diseño

**Fecha:** 2026-03-10
**Estado:** Aprobado
**Proyecto:** TecnoCel Web

---

## Contexto

El proyecto no tiene notificaciones persistentes en-app. Los clientes no saben si alguien respondió sus comentarios, si su compra fue confirmada (más allá del email), o si un comentario fue moderado. Se implementará un sistema de notificaciones in-app completo para clientes.

## Decisiones clave

- **Destinatarios:** Solo clientes (no admins/empleados por ahora)
- **Entrega:** Solo in-app — badge + panel dropdown en la Navbar
- **Sin email** para notificaciones (el emailService ya cubre órdenes)
- **Tiempo real:** Polling cada 45s para el conteo (badge), lazy load del listado

## Tipos de notificaciones

```typescript
type TipoNotificacion =
  | 'respuesta_admin'       // Admin respondió el comentario del cliente
  | 'respuesta_cliente'     // Otro cliente respondió en el hilo
  | 'comentario_moderado'   // Comentario oculto/eliminado por moderación
  | 'venta_confirmada'      // Compra procesada exitosamente
  | 'venta_cancelada'       // Venta cancelada
```

---

## Sección 1: Base de Datos

### Migración: `V4__tabla_notificaciones.sql`

```sql
CREATE TABLE tb_notificaciones (
  id_notificacion   INT AUTO_INCREMENT PRIMARY KEY,
  id_cliente        INT NOT NULL,
  tipo              ENUM(
                      'respuesta_admin',
                      'respuesta_cliente',
                      'comentario_moderado',
                      'venta_confirmada',
                      'venta_cancelada'
                    ) NOT NULL,
  titulo            VARCHAR(100) NOT NULL,
  mensaje           VARCHAR(255) NOT NULL,
  id_referencia     INT NULL,
  enlace            VARCHAR(255) NULL,
  leido             BOOLEAN DEFAULT FALSE,
  fyh_creacion      DATETIME DEFAULT CURRENT_TIMESTAMP,
  fyh_lectura       DATETIME NULL,
  FOREIGN KEY (id_cliente) REFERENCES tb_clientes(id_cliente) ON DELETE CASCADE,
  INDEX idx_cliente_leido (id_cliente, leido),
  INDEX idx_cliente_creacion (id_cliente, fyh_creacion)
);
```

### Modelo Sequelize: `Notificacion.ts`
- Campos: todos los de la tabla
- Sin timestamps automáticos (maneja `fyh_creacion` y `fyh_lectura` manualmente)
- Relación: `Notificacion.belongsTo(Cliente)` definida en `relaciones.ts`

---

## Sección 2: Backend

### Servicio: `notificationService.ts`

Singleton con las siguientes responsabilidades:

```typescript
crearNotificacion(idCliente, tipo, titulo, mensaje, idReferencia?, enlace?)
obtenerNotificaciones(idCliente, pagina, limite): Promise<{ rows, count }>
contarNoLeidas(idCliente): Promise<number>
marcarLeida(idNotificacion, idCliente): Promise<void>
marcarTodasLeidas(idCliente): Promise<void>
eliminarNotificacion(idNotificacion, idCliente): Promise<void>
```

No accede a `req`/`res`. Es llamado por controladores existentes y por el nuevo controlador.

### Controlador: `NotificacionController.ts`

Métodos estáticos, patrón MVC del proyecto:

| Método | Descripción |
|--------|-------------|
| `getNotificaciones` | Lista paginada |
| `getNoLeidas` | Solo el conteo para badge |
| `marcarLeida` | Marca una notificación |
| `marcarTodasLeidas` | Marca todas |
| `eliminarNotificacion` | Soft delete (elimina fila) |

Respuestas: `{ success: true, data: ... }` / `{ error: '...' }`.

### Rutas: `notificaciones.routes.ts`

Todas protegidas con `verificarTokenCliente`:

```
GET    /api/notificaciones              → getNotificaciones
GET    /api/notificaciones/no-leidas    → getNoLeidas
PUT    /api/notificaciones/leer-todas   → marcarTodasLeidas
PUT    /api/notificaciones/:id/leer     → marcarLeida
DELETE /api/notificaciones/:id          → eliminarNotificacion
```

### Triggers en controladores existentes

| Evento | Controlador | Acción |
|--------|-------------|--------|
| Admin responde comentario | `ComentarioController` | `crearNotificacion(idClienteDueño, 'respuesta_admin', ...)` |
| Cliente responde comentario | `ComentarioController` | `crearNotificacion(idClienteDueño, 'respuesta_cliente', ...)` |
| Comentario moderado | `ComentarioController` | `crearNotificacion(idClienteDueño, 'comentario_moderado', ...)` |
| Compra confirmada | `CarritoController` | `crearNotificacion(idCliente, 'venta_confirmada', ...)` |
| Venta cancelada | `VentaController` | `crearNotificacion(idCliente, 'venta_cancelada', ...)` |

Los triggers son fire-and-forget (no bloquean la respuesta principal). Si falla la notificación, se loguea pero no se devuelve error al cliente.

---

## Sección 3: Frontend

### Servicio: `notificacionService.ts`

Objeto literal usando `axiosInstance` (auth de cliente):

```typescript
export const notificacionService = {
  getNotificaciones(pagina, limite),
  getNoLeidas(),
  marcarLeida(id),
  marcarTodasLeidas(),
  eliminarNotificacion(id),
}
```

### Tipos: `frontend/src/types/notificacion.ts`

```typescript
export type TipoNotificacion =
  'respuesta_admin' | 'respuesta_cliente' |
  'comentario_moderado' | 'venta_confirmada' | 'venta_cancelada';

export interface Notificacion {
  id_notificacion: number;
  tipo: TipoNotificacion;
  titulo: string;
  mensaje: string;
  enlace: string | null;
  leido: boolean;
  fyh_creacion: string;
}

export interface NotificacionesResponse {
  notificaciones: Notificacion[];
  total: number;
  noLeidas: number;
}
```

### Contexto: `NotificacionesContext.tsx`

- Polling con `setInterval` cada 45s llamando `getNoLeidas()` — solo cuando `isCliente`
- El listado completo (`notificaciones[]`) se carga lazy al abrir el panel
- Limpia el intervalo en cleanup de `useEffect`
- Exporta hook `useNotificaciones()`

### Componentes nuevos

```
frontend/src/components/notifications/
├── NotificationBell.tsx        → icono + badge
├── NotificationBell.module.css
├── NotificationPanel.tsx       → dropdown con lista
├── NotificationPanel.module.css
└── NotificationItem.tsx        → item individual
    NotificationItem.module.css
```

**NotificationBell:** Botón con ícono de campana. Badge rojo con `noLeidas` si > 0. Click llama `cargarNotificaciones()` y togglea el panel.

**NotificationPanel:** Dropdown posicionado bajo la campana. Header con título + "Marcar todas leídas". Lista scrolleable. Estado vacío si no hay notificaciones. Click fuera cierra el panel.

**NotificationItem:** Fondo diferenciado (variable CSS `--color-surface-raised`) para no leídas. Ícono según tipo. Título + mensaje + tiempo relativo. Click navega a `enlace` y marca como leída.

### Integración en Navbar

`NotificationBell` se agrega en la sección de acciones de la Navbar, visible solo cuando `isCliente`.

---

## Estilos

- Variables CSS del proyecto: `--color-primary`, `--color-surface`, `--color-surface-raised`, `--color-text`, `--color-text-secondary`, `--color-error`
- CSS Modules en todos los componentes
- Responsive: el panel se adapta a móvil (full-width en < 480px)
- `prefers-reduced-motion` en animaciones del panel

---

## Archivos a crear/modificar

### Nuevos
- `database/migrations/V4__tabla_notificaciones.sql`
- `backend/src/models/Notificacion.ts`
- `backend/src/services/notificationService.ts`
- `backend/src/controllers/NotificacionController.ts`
- `backend/src/routes/notificaciones.routes.ts`
- `frontend/src/types/notificacion.ts`
- `frontend/src/services/notificacionService.ts`
- `frontend/src/contexts/NotificacionesContext.tsx`
- `frontend/src/components/notifications/NotificationBell.tsx`
- `frontend/src/components/notifications/NotificationBell.module.css`
- `frontend/src/components/notifications/NotificationPanel.tsx`
- `frontend/src/components/notifications/NotificationPanel.module.css`
- `frontend/src/components/notifications/NotificationItem.tsx`
- `frontend/src/components/notifications/NotificationItem.module.css`

### Modificados
- `backend/src/models/relaciones.ts` — agregar relación Notificacion-Cliente
- `backend/src/routes/index.ts` — registrar ruta notificaciones
- `backend/src/controllers/ComentarioController.ts` — triggers
- `backend/src/controllers/CarritoController.ts` — trigger venta_confirmada
- `backend/src/controllers/VentaController.ts` — trigger venta_cancelada (o AdminVentaController)
- `frontend/src/types/index.ts` — re-exportar tipos notificacion
- `frontend/src/contexts/` — agregar NotificacionesProvider al árbol
- `frontend/src/components/layout/Navbar.tsx` — agregar NotificationBell
