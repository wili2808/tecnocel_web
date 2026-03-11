# Sistema de Notificaciones In-App — Plan de Implementación

> **Para workers agénticos:** REQUERIDO: Usar `superpowers:subagent-driven-development` (si hay subagentes disponibles) o `superpowers:executing-plans` para implementar este plan. Los pasos usan sintaxis checkbox (`- [ ]`) para seguimiento.

**Goal:** Implementar un sistema completo de notificaciones persistentes in-app para clientes de TecnoCel, con badge en Navbar, panel dropdown y polling cada 45 segundos.

**Architecture:** Tabla `tb_notificaciones` en MySQL → `notificationService.ts` singleton → API REST protegida con `verificarTokenCliente` → `NotificacionesContext` con polling → `NotificationBell` + `NotificationPanel` en Navbar.

**Tech Stack:** Node.js/Express + Sequelize + MySQL (backend), React 18 + TypeScript + CSS Modules + Context API (frontend). Sin dependencias nuevas.

**Spec:** `docs/superpowers/specs/2026-03-10-sistema-notificaciones-design.md`

---

## Chunk 1: Backend — Migración, Modelo, Servicio, Controlador y Rutas

### Task 1: Migración SQL

**Files:**
- Create: `database/migrations/V4__tabla_notificaciones.sql`

- [ ] **Step 1: Crear archivo de migración**

```sql
-- Migración V4: Crear tabla de notificaciones in-app para clientes
-- Almacena notificaciones persistentes: respuestas a comentarios, moderación, estados de venta

CREATE TABLE `tb_notificaciones` (
  `id_notificacion`  INT            NOT NULL AUTO_INCREMENT,
  `id_cliente`       INT            NOT NULL,
  `tipo`             ENUM(
                       'respuesta_admin',
                       'respuesta_cliente',
                       'comentario_moderado',
                       'venta_confirmada',
                       'venta_cancelada'
                     ) NOT NULL,
  `titulo`           VARCHAR(100)   NOT NULL,
  `mensaje`          VARCHAR(255)   NOT NULL,
  `id_referencia`    INT            NULL,
  `enlace`           VARCHAR(255)   NULL,
  `leido`            TINYINT(1)     NOT NULL DEFAULT 0,
  `fyh_creacion`     DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `fyh_lectura`      DATETIME       NULL,

  PRIMARY KEY (`id_notificacion`),

  CONSTRAINT `fk_notificacion_cliente`
    FOREIGN KEY (`id_cliente`)
    REFERENCES `tb_clientes` (`id_cliente`)
    ON DELETE CASCADE,

  INDEX `idx_notif_cliente_leido`    (`id_cliente`, `leido`),
  INDEX `idx_notif_cliente_creacion` (`id_cliente`, `fyh_creacion`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

- [ ] **Step 2: Aplicar migración a la BD**

```bash
# Desde el directorio raíz del proyecto
mysql -u root -p db_tecnocel_v4 < database/migrations/V4__tabla_notificaciones.sql
```

Verificar que la tabla fue creada:
```bash
mysql -u root -p db_tecnocel_v4 -e "DESCRIBE tb_notificaciones;"
```

---

### Task 2: Modelo Sequelize

**Files:**
- Create: `backend/src/models/Notificacion.ts`
- Modify: `backend/src/models/relaciones.ts`

- [ ] **Step 1: Crear modelo**

Archivo: `backend/src/models/Notificacion.ts`
```typescript
import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

export type TipoNotificacion =
  | 'respuesta_admin'
  | 'respuesta_cliente'
  | 'comentario_moderado'
  | 'venta_confirmada'
  | 'venta_cancelada';

class Notificacion extends Model {
  declare id_notificacion: number;
  declare id_cliente: number;
  declare tipo: TipoNotificacion;
  declare titulo: string;
  declare mensaje: string;
  declare id_referencia: number | null;
  declare enlace: string | null;
  declare leido: boolean;
  declare fyh_creacion: Date;
  declare fyh_lectura: Date | null;
}

Notificacion.init({
  id_notificacion: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  id_cliente: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  tipo: {
    type: DataTypes.ENUM(
      'respuesta_admin',
      'respuesta_cliente',
      'comentario_moderado',
      'venta_confirmada',
      'venta_cancelada'
    ),
    allowNull: false
  },
  titulo: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  mensaje: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  id_referencia: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  enlace: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  leido: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  fyh_creacion: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  fyh_lectura: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  sequelize,
  modelName: 'Notificacion',
  tableName: 'tb_notificaciones',
  timestamps: false,
  indexes: [
    { fields: ['id_cliente', 'leido'] },
    { fields: ['id_cliente', 'fyh_creacion'] }
  ]
});

export default Notificacion;
```

- [ ] **Step 2: Agregar relación en `relaciones.ts`**

Al final de `backend/src/models/relaciones.ts`, antes del bloque `export {}`:

```typescript
// Importar arriba del archivo (junto a los otros imports):
import Notificacion from './Notificacion.js';

// Agregar al final, antes del export:
// Relaciones para Notificaciones
Cliente.hasMany(Notificacion, { foreignKey: 'id_cliente', as: 'notificaciones' });
Notificacion.belongsTo(Cliente, { foreignKey: 'id_cliente', as: 'cliente' });
```

También agregar `Notificacion` al bloque de `export { ... }` al final del archivo.

- [ ] **Step 3: Registrar modelo en el índice**

Verificar si existe `backend/src/models/index.ts`. Si existe, agregar import de `Notificacion`. Si el proyecto importa modelos directamente desde `relaciones.ts` (que actúa como índice), solo asegurarse de que el import de `Notificacion` esté en `relaciones.ts` (ya hecho en Step 2).

---

### Task 3: Servicio de Notificaciones

**Files:**
- Create: `backend/src/services/notificationService.ts`

- [ ] **Step 1: Crear servicio**

```typescript
import Notificacion, { TipoNotificacion } from '../models/Notificacion.js';
import { Op } from 'sequelize';
import logger from './loggerService.js';

const NOTIFICACIONES_POR_PAGINA = 20;
const MAX_NOTIFICACIONES_CLIENTE = 100; // límite de retención

const notificationService = {
  /**
   * Crea una notificación para un cliente.
   * Fire-and-forget: no lanza errores (los loguea internamente).
   */
  async crearNotificacion(
    idCliente: number,
    tipo: TipoNotificacion,
    titulo: string,
    mensaje: string,
    idReferencia?: number,
    enlace?: string
  ): Promise<void> {
    try {
      await Notificacion.create({
        id_cliente: idCliente,
        tipo,
        titulo,
        mensaje,
        id_referencia: idReferencia ?? null,
        enlace: enlace ?? null,
        leido: false,
        fyh_creacion: new Date(),
        fyh_lectura: null
      });
    } catch (error) {
      logger.error('Error al crear notificación:', {
        error: error instanceof Error ? error.message : 'Error desconocido',
        idCliente,
        tipo
      });
    }
  },

  /**
   * Cuenta las notificaciones no leídas de un cliente.
   */
  async contarNoLeidas(idCliente: number): Promise<number> {
    return Notificacion.count({
      where: { id_cliente: idCliente, leido: false }
    });
  },

  /**
   * Obtiene notificaciones paginadas de un cliente, ordenadas de más reciente a más antigua.
   */
  async obtenerNotificaciones(
    idCliente: number,
    pagina = 1,
    limite = NOTIFICACIONES_POR_PAGINA
  ): Promise<{ rows: Notificacion[]; count: number }> {
    const offset = (pagina - 1) * limite;
    return Notificacion.findAndCountAll({
      where: { id_cliente: idCliente },
      order: [['fyh_creacion', 'DESC']],
      limit: limite,
      offset
    });
  },

  /**
   * Marca una notificación como leída. Verifica que pertenezca al cliente.
   */
  async marcarLeida(idNotificacion: number, idCliente: number): Promise<boolean> {
    const [affected] = await Notificacion.update(
      { leido: true, fyh_lectura: new Date() },
      { where: { id_notificacion: idNotificacion, id_cliente: idCliente, leido: false } }
    );
    return affected > 0;
  },

  /**
   * Marca todas las notificaciones no leídas de un cliente como leídas.
   */
  async marcarTodasLeidas(idCliente: number): Promise<number> {
    const [affected] = await Notificacion.update(
      { leido: true, fyh_lectura: new Date() },
      { where: { id_cliente: idCliente, leido: false } }
    );
    return affected;
  },

  /**
   * Elimina una notificación. Verifica que pertenezca al cliente.
   */
  async eliminarNotificacion(idNotificacion: number, idCliente: number): Promise<boolean> {
    const affected = await Notificacion.destroy({
      where: { id_notificacion: idNotificacion, id_cliente: idCliente }
    });
    return affected > 0;
  }
};

export default notificationService;
```

---

### Task 4: Controlador de Notificaciones

**Files:**
- Create: `backend/src/controllers/NotificacionController.ts`

- [ ] **Step 1: Crear controlador**

```typescript
import { Request, Response } from 'express';
import type { ClienteSession } from '../types/express.js';
import notificationService from '../services/notificationService.js';
import logger from '../services/loggerService.js';

export class NotificacionController {
  static async getNoLeidas(req: Request, res: Response): Promise<void> {
    try {
      const session = req.usuario as ClienteSession;
      const count = await notificationService.contarNoLeidas(session.id);
      res.status(200).json({ success: true, data: { count } });
    } catch (error) {
      logger.error('Error en getNoLeidas:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  static async getNotificaciones(req: Request, res: Response): Promise<void> {
    try {
      const session = req.usuario as ClienteSession;
      const pagina = Math.max(1, parseInt(req.query.pagina as string) || 1);
      const limite = Math.min(50, Math.max(1, parseInt(req.query.limite as string) || 20));

      const { rows, count } = await notificationService.obtenerNotificaciones(
        session.id,
        pagina,
        limite
      );

      res.status(200).json({
        success: true,
        data: {
          notificaciones: rows,
          total: count,
          pagina,
          limite,
          totalPaginas: Math.ceil(count / limite)
        }
      });
    } catch (error) {
      logger.error('Error en getNotificaciones:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  static async marcarLeida(req: Request, res: Response): Promise<void> {
    try {
      const session = req.usuario as ClienteSession;
      const idNotificacion = parseInt(req.params.id);

      if (!idNotificacion || idNotificacion <= 0) {
        res.status(400).json({ error: 'ID de notificación inválido' });
        return;
      }

      const actualizado = await notificationService.marcarLeida(idNotificacion, session.id);

      if (!actualizado) {
        res.status(404).json({ error: 'Notificación no encontrada' });
        return;
      }

      res.status(200).json({ success: true });
    } catch (error) {
      logger.error('Error en marcarLeida:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  static async marcarTodasLeidas(req: Request, res: Response): Promise<void> {
    try {
      const session = req.usuario as ClienteSession;
      const count = await notificationService.marcarTodasLeidas(session.id);
      res.status(200).json({ success: true, data: { actualizadas: count } });
    } catch (error) {
      logger.error('Error en marcarTodasLeidas:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  static async eliminarNotificacion(req: Request, res: Response): Promise<void> {
    try {
      const session = req.usuario as ClienteSession;
      const idNotificacion = parseInt(req.params.id);

      if (!idNotificacion || idNotificacion <= 0) {
        res.status(400).json({ error: 'ID de notificación inválido' });
        return;
      }

      const eliminado = await notificationService.eliminarNotificacion(idNotificacion, session.id);

      if (!eliminado) {
        res.status(404).json({ error: 'Notificación no encontrada' });
        return;
      }

      res.status(200).json({ success: true });
    } catch (error) {
      logger.error('Error en eliminarNotificacion:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
}
```

---

### Task 5: Rutas y Registro

**Files:**
- Create: `backend/src/routes/notificacionRoutes.ts`
- Modify: `backend/src/index.ts`

- [ ] **Step 1: Crear archivo de rutas**

```typescript
import { Router } from 'express';
import { NotificacionController } from '../controllers/NotificacionController.js';
import { verificarTokenCliente } from '../middleware/authMiddleware.js';

const router = Router();

// Todas las rutas requieren autenticación del cliente
router.use(verificarTokenCliente);

router.get('/', NotificacionController.getNotificaciones);
router.get('/no-leidas', NotificacionController.getNoLeidas);
router.put('/leer-todas', NotificacionController.marcarTodasLeidas);
router.put('/:id/leer', NotificacionController.marcarLeida);
router.delete('/:id', NotificacionController.eliminarNotificacion);

export default router;
```

- [ ] **Step 2: Registrar en `backend/src/index.ts`**

Agregar el import junto a los otros imports de rutas:
```typescript
import notificacionRoutes from './routes/notificacionRoutes.js';
```

Agregar el uso de la ruta junto a las otras:
```typescript
app.use('/api/notificaciones', notificacionRoutes);
```

- [ ] **Step 3: Verificar endpoints con curl**

```bash
# Con token de cliente válido:
curl -H "Authorization: Bearer <token>" http://localhost:3000/api/notificaciones/no-leidas
# Esperado: { success: true, data: { count: 0 } }

curl -H "Authorization: Bearer <token>" http://localhost:3000/api/notificaciones
# Esperado: { success: true, data: { notificaciones: [], total: 0, ... } }
```

- [ ] **Step 4: Commit del backend**

```bash
git add database/migrations/V4__tabla_notificaciones.sql \
        backend/src/models/Notificacion.ts \
        backend/src/models/relaciones.ts \
        backend/src/services/notificationService.ts \
        backend/src/controllers/NotificacionController.ts \
        backend/src/routes/notificacionRoutes.ts \
        backend/src/index.ts
git commit -m "feat(backend): agregar sistema de notificaciones — modelo, servicio, controlador y rutas"
```

---

## Chunk 2: Frontend — Tipos, Servicio y Contexto

### Task 6: Tipos TypeScript

**Files:**
- Create: `frontend/src/types/notificacion.ts`
- Modify: `frontend/src/types/index.ts`

- [ ] **Step 1: Crear archivo de tipos**

```typescript
export type TipoNotificacion =
  | 'respuesta_admin'
  | 'respuesta_cliente'
  | 'comentario_moderado'
  | 'venta_confirmada'
  | 'venta_cancelada';

export interface Notificacion {
  id_notificacion: number;
  id_cliente: number;
  tipo: TipoNotificacion;
  titulo: string;
  mensaje: string;
  id_referencia: number | null;
  enlace: string | null;
  leido: boolean;
  fyh_creacion: string;
  fyh_lectura: string | null;
}

export interface NotificacionesData {
  notificaciones: Notificacion[];
  total: number;
  pagina: number;
  limite: number;
  totalPaginas: number;
}

export interface NotificacionesResponse {
  success: boolean;
  data: NotificacionesData;
}

export interface NoLeidasResponse {
  success: boolean;
  data: { count: number };
}
```

- [ ] **Step 2: Exportar desde el índice**

En `frontend/src/types/index.ts`, agregar al final:
```typescript
// Exportar tipos de notificaciones
export * from './notificacion';
```

---

### Task 7: Servicio de Notificaciones (Frontend)

**Files:**
- Create: `frontend/src/services/notificacionService.ts`

- [ ] **Step 1: Crear servicio**

```typescript
import axiosInstance from '../api/axiosConfig';
import type { NotificacionesResponse, NoLeidasResponse } from '../types/notificacion';

export const notificacionService = {
  async getNotificaciones(pagina = 1, limite = 20): Promise<NotificacionesResponse> {
    const { data } = await axiosInstance.get<NotificacionesResponse>(
      `/notificaciones?pagina=${pagina}&limite=${limite}`
    );
    return data;
  },

  async getNoLeidas(): Promise<NoLeidasResponse> {
    const { data } = await axiosInstance.get<NoLeidasResponse>('/notificaciones/no-leidas');
    return data;
  },

  async marcarLeida(id: number): Promise<void> {
    await axiosInstance.put(`/notificaciones/${id}/leer`);
  },

  async marcarTodasLeidas(): Promise<void> {
    await axiosInstance.put('/notificaciones/leer-todas');
  },

  async eliminarNotificacion(id: number): Promise<void> {
    await axiosInstance.delete(`/notificaciones/${id}`);
  }
};
```

---

### Task 8: Contexto de Notificaciones

**Files:**
- Create: `frontend/src/contexts/NotificacionesContext.tsx`
- Modify: `frontend/src/App.tsx`

- [ ] **Step 1: Crear contexto**

```tsx
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef
} from 'react';
import { useAuth } from './AuthContext';
import { notificacionService } from '../services/notificacionService';
import type { Notificacion } from '../types/notificacion';

const POLLING_INTERVAL_MS = 45_000;

interface NotificacionesContextType {
  noLeidas: number;
  notificaciones: Notificacion[];
  cargando: boolean;
  panelAbierto: boolean;
  abrirPanel: () => void;
  cerrarPanel: () => void;
  marcarLeida: (id: number) => Promise<void>;
  marcarTodasLeidas: () => Promise<void>;
  eliminarNotificacion: (id: number) => Promise<void>;
}

const NotificacionesContext = createContext<NotificacionesContextType | undefined>(undefined);

export const useNotificaciones = (): NotificacionesContextType => {
  const ctx = useContext(NotificacionesContext);
  if (!ctx) throw new Error('useNotificaciones debe usarse dentro de NotificacionesProvider');
  return ctx;
};

export const NotificacionesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isCliente } = useAuth();
  const [noLeidas, setNoLeidas] = useState(0);
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [cargando, setCargando] = useState(false);
  const [panelAbierto, setPanelAbierto] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchNoLeidas = useCallback(async () => {
    if (!isCliente) return;
    try {
      const res = await notificacionService.getNoLeidas();
      setNoLeidas(res.data.count);
    } catch {
      // Silencioso: el polling no debe interrumpir la UI
    }
  }, [isCliente]);

  const cargarNotificaciones = useCallback(async () => {
    if (!isCliente) return;
    setCargando(true);
    try {
      const res = await notificacionService.getNotificaciones(1, 20);
      setNotificaciones(res.data.notificaciones);
      // Sincronizar el conteo con los datos reales
      setNoLeidas(res.data.notificaciones.filter(n => !n.leido).length);
    } catch {
      // Silencioso
    } finally {
      setCargando(false);
    }
  }, [isCliente]);

  // Polling de no-leidas cada 45 segundos
  useEffect(() => {
    if (!isCliente) {
      setNoLeidas(0);
      setNotificaciones([]);
      return;
    }

    fetchNoLeidas();

    intervalRef.current = setInterval(fetchNoLeidas, POLLING_INTERVAL_MS);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isCliente, fetchNoLeidas]);

  const abrirPanel = useCallback(() => {
    setPanelAbierto(true);
    cargarNotificaciones();
  }, [cargarNotificaciones]);

  const cerrarPanel = useCallback(() => {
    setPanelAbierto(false);
  }, []);

  const marcarLeida = useCallback(async (id: number) => {
    await notificacionService.marcarLeida(id);
    setNotificaciones(prev =>
      prev.map(n => n.id_notificacion === id ? { ...n, leido: true } : n)
    );
    setNoLeidas(prev => Math.max(0, prev - 1));
  }, []);

  const marcarTodasLeidas = useCallback(async () => {
    await notificacionService.marcarTodasLeidas();
    setNotificaciones(prev => prev.map(n => ({ ...n, leido: true })));
    setNoLeidas(0);
  }, []);

  const eliminarNotificacion = useCallback(async (id: number) => {
    const notif = notificaciones.find(n => n.id_notificacion === id);
    await notificacionService.eliminarNotificacion(id);
    setNotificaciones(prev => prev.filter(n => n.id_notificacion !== id));
    if (notif && !notif.leido) {
      setNoLeidas(prev => Math.max(0, prev - 1));
    }
  }, [notificaciones]);

  const value = useMemo<NotificacionesContextType>(() => ({
    noLeidas,
    notificaciones,
    cargando,
    panelAbierto,
    abrirPanel,
    cerrarPanel,
    marcarLeida,
    marcarTodasLeidas,
    eliminarNotificacion
  }), [noLeidas, notificaciones, cargando, panelAbierto, abrirPanel, cerrarPanel,
       marcarLeida, marcarTodasLeidas, eliminarNotificacion]);

  return (
    <NotificacionesContext.Provider value={value}>
      {children}
    </NotificacionesContext.Provider>
  );
};
```

- [ ] **Step 2: Agregar `NotificacionesProvider` en `App.tsx`**

En `frontend/src/App.tsx`:

1. Agregar el import:
```tsx
import { NotificacionesProvider } from './contexts/NotificacionesContext';
```

2. Envolver el árbol existente con el provider. Colocarlo dentro de `AuthProvider` y `NotificationProvider` (usa ambos), pero fuera de `Router` (no necesita routing):

```tsx
// Antes (fragmento del árbol de providers):
<NotificationProvider>
  <FavoritosGlobalProvider>

// Después:
<NotificationProvider>
  <NotificacionesProvider>
    <FavoritosGlobalProvider>
```

Y cerrar el tag correspondiente al final:
```tsx
    </FavoritosGlobalProvider>
  </NotificacionesProvider>
</NotificationProvider>
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/types/notificacion.ts \
        frontend/src/types/index.ts \
        frontend/src/services/notificacionService.ts \
        frontend/src/contexts/NotificacionesContext.tsx \
        frontend/src/App.tsx
git commit -m "feat(frontend): agregar tipos, servicio y contexto de notificaciones"
```

---

## Chunk 3: Frontend UI — Componentes y Navbar

### Task 9: NotificationItem

**Files:**
- Create: `frontend/src/components/notifications/NotificationItem.tsx`
- Create: `frontend/src/components/notifications/NotificationItem.module.css`

- [ ] **Step 1: Crear componente**

```tsx
import React, { memo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotificaciones } from '../../contexts/NotificacionesContext';
import type { Notificacion, TipoNotificacion } from '../../types/notificacion';
import styles from './NotificationItem.module.css';

const ICONOS: Record<TipoNotificacion, string> = {
  respuesta_admin: 'support_agent',
  respuesta_cliente: 'chat_bubble',
  comentario_moderado: 'visibility_off',
  venta_confirmada: 'check_circle',
  venta_cancelada: 'cancel'
};

function tiempoRelativo(fechaStr: string): string {
  const diff = Date.now() - new Date(fechaStr).getTime();
  const minutos = Math.floor(diff / 60_000);
  if (minutos < 1) return 'Ahora';
  if (minutos < 60) return `Hace ${minutos}m`;
  const horas = Math.floor(minutos / 60);
  if (horas < 24) return `Hace ${horas}h`;
  const dias = Math.floor(horas / 24);
  return `Hace ${dias}d`;
}

interface Props {
  notificacion: Notificacion;
}

const NotificationItem: React.FC<Props> = memo(({ notificacion }) => {
  const navigate = useNavigate();
  const { marcarLeida, eliminarNotificacion } = useNotificaciones();

  const handleClick = useCallback(async () => {
    if (!notificacion.leido) {
      await marcarLeida(notificacion.id_notificacion);
    }
    if (notificacion.enlace) {
      navigate(notificacion.enlace);
    }
  }, [notificacion, marcarLeida, navigate]);

  const handleEliminar = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    await eliminarNotificacion(notificacion.id_notificacion);
  }, [notificacion.id_notificacion, eliminarNotificacion]);

  return (
    <div
      className={`${styles.item} ${!notificacion.leido ? styles.noLeido : ''}`}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && handleClick()}
      aria-label={notificacion.titulo}
    >
      <span className={`material-icons ${styles.icono}`}>
        {ICONOS[notificacion.tipo]}
      </span>

      <div className={styles.contenido}>
        <p className={styles.titulo}>{notificacion.titulo}</p>
        <p className={styles.mensaje}>{notificacion.mensaje}</p>
        <span className={styles.tiempo}>{tiempoRelativo(notificacion.fyh_creacion)}</span>
      </div>

      <button
        className={styles.btnEliminar}
        onClick={handleEliminar}
        aria-label="Eliminar notificación"
        title="Eliminar"
      >
        <span className="material-icons">close</span>
      </button>
    </div>
  );
});

NotificationItem.displayName = 'NotificationItem';
export default NotificationItem;
```

- [ ] **Step 2: Crear estilos**

```css
/* NotificationItem.module.css */
.item {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  border-bottom: 1px solid var(--color-border);
  cursor: pointer;
  transition: background-color 0.15s ease;
  position: relative;
}

.item:last-child {
  border-bottom: none;
}

.item:hover {
  background-color: var(--color-surface-hover);
}

.item:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: -2px;
}

.no-leido {
  background-color: var(--color-primary-subtle);
}

.no-leido:hover {
  background-color: var(--color-primary-subtle-hover);
}

.icono {
  font-size: 1.25rem;
  color: var(--color-primary);
  flex-shrink: 0;
  margin-top: 2px;
}

.contenido {
  flex: 1;
  min-width: 0;
}

.titulo {
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--color-text);
  margin: 0 0 2px;
  line-height: 1.3;
}

.mensaje {
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
  margin: 0 0 4px;
  line-height: 1.4;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.tiempo {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

.btn-eliminar {
  background: none;
  border: none;
  cursor: pointer;
  padding: 2px;
  color: var(--color-text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-sm);
  opacity: 0;
  transition: opacity 0.15s ease, color 0.15s ease;
  flex-shrink: 0;
}

.btn-eliminar .material-icons {
  font-size: 1rem;
}

.item:hover .btn-eliminar {
  opacity: 1;
}

.btn-eliminar:hover {
  color: var(--color-error);
}

@media (prefers-reduced-motion: reduce) {
  .item,
  .btn-eliminar {
    transition: none;
  }
}
```

---

### Task 10: NotificationPanel

**Files:**
- Create: `frontend/src/components/notifications/NotificationPanel.tsx`
- Create: `frontend/src/components/notifications/NotificationPanel.module.css`

- [ ] **Step 1: Crear componente**

```tsx
import React, { memo, useEffect, useRef } from 'react';
import { useNotificaciones } from '../../contexts/NotificacionesContext';
import NotificationItem from './NotificationItem';
import styles from './NotificationPanel.module.css';

interface Props {
  onClose: () => void;
}

const NotificationPanel: React.FC<Props> = memo(({ onClose }) => {
  const { notificaciones, noLeidas, cargando, marcarTodasLeidas } = useNotificaciones();
  const panelRef = useRef<HTMLDivElement>(null);

  // Cerrar al hacer click fuera
  useEffect(() => {
    const handleClickFuera = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickFuera);
    return () => document.removeEventListener('mousedown', handleClickFuera);
  }, [onClose]);

  // Cerrar con Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return (
    <div ref={panelRef} className={styles.panel} role="dialog" aria-label="Notificaciones">
      <div className={styles.header}>
        <h3 className={styles.titulo}>Notificaciones</h3>
        {noLeidas > 0 && (
          <button
            className={styles.btnMarcarTodas}
            onClick={marcarTodasLeidas}
          >
            Marcar todas como leídas
          </button>
        )}
      </div>

      <div className={styles.lista}>
        {cargando && (
          <div className={styles.estado}>
            <div className={styles.spinner} aria-label="Cargando" />
          </div>
        )}

        {!cargando && notificaciones.length === 0 && (
          <div className={styles.estado}>
            <span className={`material-icons ${styles.estadoIcono}`}>notifications_none</span>
            <p className={styles.estadoTexto}>Sin notificaciones</p>
          </div>
        )}

        {!cargando && notificaciones.map(n => (
          <NotificationItem key={n.id_notificacion} notificacion={n} />
        ))}
      </div>
    </div>
  );
});

NotificationPanel.displayName = 'NotificationPanel';
export default NotificationPanel;
```

- [ ] **Step 2: Crear estilos**

```css
/* NotificationPanel.module.css */
.panel {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  width: 360px;
  max-height: 480px;
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  z-index: 1000;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: slideDown 0.15s ease;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-sm) var(--spacing-md);
  border-bottom: 1px solid var(--color-border);
  flex-shrink: 0;
}

.titulo {
  font-size: var(--font-size-sm);
  font-weight: 700;
  color: var(--color-text);
  margin: 0;
}

.btn-marcar-todas {
  background: none;
  border: none;
  cursor: pointer;
  font-size: var(--font-size-xs);
  color: var(--color-primary);
  padding: 0;
  transition: color 0.15s ease;
}

.btn-marcar-todas:hover {
  color: var(--color-primary-dark);
  text-decoration: underline;
}

.lista {
  overflow-y: auto;
  flex: 1;
}

.estado {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-xl);
  gap: var(--spacing-sm);
}

.estado-icono {
  font-size: 2.5rem;
  color: var(--color-text-muted);
}

.estado-texto {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  margin: 0;
}

.spinner {
  width: 28px;
  height: 28px;
  border: 3px solid var(--color-border);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@media (max-width: 480px) {
  .panel {
    width: calc(100vw - 32px);
    right: -16px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .panel,
  .spinner {
    animation: none;
  }
}
```

---

### Task 11: NotificationBell

**Files:**
- Create: `frontend/src/components/notifications/NotificationBell.tsx`
- Create: `frontend/src/components/notifications/NotificationBell.module.css`

- [ ] **Step 1: Crear componente**

```tsx
import React, { memo, useCallback } from 'react';
import { useNotificaciones } from '../../contexts/NotificacionesContext';
import NotificationPanel from './NotificationPanel';
import styles from './NotificationBell.module.css';

const NotificationBell: React.FC = memo(() => {
  const { noLeidas, panelAbierto, abrirPanel, cerrarPanel } = useNotificaciones();

  const handleClick = useCallback(() => {
    if (panelAbierto) {
      cerrarPanel();
    } else {
      abrirPanel();
    }
  }, [panelAbierto, abrirPanel, cerrarPanel]);

  return (
    <div className={styles.wrapper}>
      <button
        className={`${styles.bell} ${panelAbierto ? styles.activo : ''}`}
        onClick={handleClick}
        aria-label={`Notificaciones${noLeidas > 0 ? ` (${noLeidas} no leídas)` : ''}`}
        aria-expanded={panelAbierto}
        aria-haspopup="dialog"
      >
        <span className="material-icons">
          {noLeidas > 0 ? 'notifications_active' : 'notifications'}
        </span>

        {noLeidas > 0 && (
          <span className={styles.badge} aria-hidden="true">
            {noLeidas > 99 ? '99+' : noLeidas}
          </span>
        )}
      </button>

      {panelAbierto && <NotificationPanel onClose={cerrarPanel} />}
    </div>
  );
});

NotificationBell.displayName = 'NotificationBell';
export default NotificationBell;
```

- [ ] **Step 2: Crear estilos**

```css
/* NotificationBell.module.css */
.wrapper {
  position: relative;
}

.bell {
  background: none;
  border: none;
  cursor: pointer;
  padding: var(--spacing-xs);
  border-radius: var(--radius-md);
  color: var(--color-text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.15s ease, background-color 0.15s ease;
  position: relative;
}

.bell .material-icons {
  font-size: 1.375rem;
}

.bell:hover,
.activo {
  color: var(--color-primary);
  background-color: var(--color-primary-subtle);
}

.bell:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

.badge {
  position: absolute;
  top: 2px;
  right: 2px;
  min-width: 16px;
  height: 16px;
  padding: 0 3px;
  background-color: var(--color-error);
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  line-height: 16px;
  text-align: center;
  border-radius: 8px;
  pointer-events: none;
}

@media (prefers-reduced-motion: reduce) {
  .bell {
    transition: none;
  }
}
```

---

### Task 12: Integrar NotificationBell en Navbar

**Files:**
- Modify: `frontend/src/components/layout/Navbar/Navbar.tsx`

- [ ] **Step 1: Agregar import**

En `frontend/src/components/layout/Navbar/Navbar.tsx`, agregar el import:
```tsx
import NotificationBell from '../../notifications/NotificationBell';
```

- [ ] **Step 2: Agregar campana en `ControlButtons`**

Dentro del componente `ControlButtons`, entre el botón de tema y el botón del carrito, agregar `NotificationBell` solo para clientes:

```tsx
function ControlButtons() {
  return (
    <div className={navbarStyle.controlsGroup}>
      {/* Botón de cambio de tema */}
      <IconButton ... />

      {/* Notificaciones — solo para clientes */}
      {isCliente && <NotificationBell />}

      {/* Botón del carrito */}
      <IconButton ... />
    </div>
  );
}
```

- [ ] **Step 3: Verificar en el browser**

1. Iniciar frontend: `npm run dev` desde `frontend/`
2. Login como cliente
3. Verificar que aparece la campana en el navbar
4. Verificar que el panel abre y cierra correctamente
5. Verificar que no aparece para usuarios no autenticados ni para admins

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/notifications/ \
        frontend/src/components/layout/Navbar/Navbar.tsx
git commit -m "feat(frontend): agregar componentes NotificationBell y NotificationPanel"
```

---

## Chunk 4: Triggers — Disparadores en Controladores Existentes

### Task 13: Triggers en ComentarioController

**Files:**
- Modify: `backend/src/controllers/ComentarioController.ts`

El objetivo es agregar llamadas a `notificationService.crearNotificacion()` después de las operaciones exitosas en `crearRespuestaAdmin`, `crearRespuestaCliente` y `moderarComentario`.

**Patrón para todos los triggers (fire-and-forget):**
```typescript
// No usar await — no bloquear la respuesta al cliente
notificationService.crearNotificacion(...).catch(() => {});
```

- [ ] **Step 1: Agregar import del servicio**

Al inicio de `ComentarioController.ts`, agregar:
```typescript
import notificationService from '../services/notificationService.js';
```

- [ ] **Step 2: Trigger en `crearRespuestaAdmin`**

Buscar el método `crearRespuestaAdmin`. Después de que la respuesta se crea exitosamente y **antes** de `res.status(201).json(...)`, agregar:

```typescript
// Notificar al dueño del comentario (fire-and-forget)
// comentarioExistente.id_cliente es el cliente que escribió el comentario
notificationService.crearNotificacion(
  comentarioExistente.id_cliente,
  'respuesta_admin',
  'El equipo respondió tu comentario',
  'TecnoCel respondió a tu reseña de producto.',
  comentarioExistente.id_comentario,
  `/productos/${comentarioExistente.id_producto}`
).catch(() => {});
```

- [ ] **Step 3: Trigger en `crearRespuestaCliente`**

Buscar el método `crearRespuestaCliente`. Después de que la respuesta se crea y **antes** de `res.status(201).json(...)`, agregar:

```typescript
// Notificar al dueño del comentario solo si es distinto al que responde
const idClienteQueResponde = (req.usuario as any).id;
if (comentarioExistente.id_cliente !== idClienteQueResponde) {
  notificationService.crearNotificacion(
    comentarioExistente.id_cliente,
    'respuesta_cliente',
    'Alguien respondió tu comentario',
    'Un cliente respondió a tu reseña de producto.',
    comentarioExistente.id_comentario,
    `/productos/${comentarioExistente.id_producto}`
  ).catch(() => {});
}
```

- [ ] **Step 4: Trigger en `moderarComentario`**

Buscar el método `moderarComentario`. Cuando el nuevo estado es `'oculto'` o `'eliminado'`, después de actualizar el estado y **antes** de `res.status(200).json(...)`, agregar:

```typescript
// Notificar al cliente si su comentario fue moderado
if (estado === 'oculto' || estado === 'eliminado') {
  notificationService.crearNotificacion(
    comentarioExistente.id_cliente,
    'comentario_moderado',
    'Tu comentario fue moderado',
    'Tu reseña fue revisada por el equipo de TecnoCel.',
    comentarioExistente.id_comentario,
    `/productos/${comentarioExistente.id_producto}`
  ).catch(() => {});
}
```

---

### Task 14: Trigger en CarritoController (venta_confirmada)

**Files:**
- Modify: `backend/src/controllers/CarritoController.ts`

- [ ] **Step 1: Agregar import**

```typescript
import notificationService from '../services/notificationService.js';
```

- [ ] **Step 2: Agregar trigger**

Buscar el método de confirmación de compra (probablemente `confirmarCompra` o similar). Después de que la venta se crea exitosamente y **antes** de `res.status(200).json(...)`, agregar:

```typescript
// Notificar al cliente que su compra fue confirmada (fire-and-forget)
notificationService.crearNotificacion(
  idCliente,           // ID del cliente de la sesión
  'venta_confirmada',
  '¡Compra confirmada!',
  `Tu pedido fue procesado exitosamente.`,
  ventaCreada.id_venta,    // ID de la venta creada
  '/panel'             // Redirigir al panel de usuario
).catch(() => {});
```

**Nota:** Los nombres de variables exactos (`idCliente`, `ventaCreada`) dependen de la implementación actual del método. Ajustar según el contexto del código.

---

### Task 15: Trigger en VentaController (venta_cancelada)

**Files:**
- Modify: `backend/src/controllers/VentaController.ts` (o `AdminVentaController.ts` — verificar cuál contiene el método de cancelación)

- [ ] **Step 1: Identificar el método de cancelación**

```bash
# Buscar el método de cancelación
grep -n "cancelar\|Cancelar\|cancelacion\|estado.*cancelad" backend/src/controllers/VentaController.ts
```

Si no está ahí, buscar en otros archivos del directorio controllers.

- [ ] **Step 2: Agregar import y trigger**

```typescript
import notificationService from '../services/notificationService.js';
```

Después de que la cancelación se procesa exitosamente, agregar:

```typescript
// Notificar al cliente (fire-and-forget)
notificationService.crearNotificacion(
  idClienteDeLaVenta,   // ID del cliente dueño de la venta
  'venta_cancelada',
  'Venta cancelada',
  `Tu pedido fue cancelado.`,
  idVenta,
  '/panel'
).catch(() => {});
```

---

### Task 16: Verificación Final

- [ ] **Step 1: Probar flujo completo de comentario**

1. Login como cliente A
2. Crear un comentario en un producto
3. Login como admin
4. Responder el comentario
5. Volver a login como cliente A
6. Verificar que el badge de la campana muestre "1"
7. Abrir el panel y verificar que aparece la notificación
8. Hacer click en la notificación — debe navegar al producto y marcarse como leída

- [ ] **Step 2: Probar flujo de compra**

1. Login como cliente
2. Completar una compra
3. Verificar notificación "¡Compra confirmada!" en el panel

- [ ] **Step 3: Probar polling**

1. Login como cliente en una pestaña
2. En otra pestaña, hacer login como admin y responder un comentario del cliente
3. Sin recargar la página del cliente, esperar hasta 45 segundos
4. Verificar que el badge aparece automáticamente

- [ ] **Step 4: Verificar que no aparece para admins**

1. Login como admin
2. Verificar que NO hay campana de notificaciones en el navbar

- [ ] **Step 5: Commit final**

```bash
git add backend/src/controllers/ComentarioController.ts \
        backend/src/controllers/CarritoController.ts \
        backend/src/controllers/VentaController.ts
git commit -m "feat(backend): agregar triggers de notificaciones en controladores"
```

---

## Resumen de Archivos

### Nuevos
| Archivo | Responsabilidad |
|---------|----------------|
| `database/migrations/V4__tabla_notificaciones.sql` | Esquema BD |
| `backend/src/models/Notificacion.ts` | Modelo Sequelize |
| `backend/src/services/notificationService.ts` | Lógica de negocio |
| `backend/src/controllers/NotificacionController.ts` | Endpoints REST |
| `backend/src/routes/notificacionRoutes.ts` | Definición de rutas |
| `frontend/src/types/notificacion.ts` | Tipos TypeScript |
| `frontend/src/services/notificacionService.ts` | Cliente API |
| `frontend/src/contexts/NotificacionesContext.tsx` | Estado global + polling |
| `frontend/src/components/notifications/NotificationBell.tsx` | Campana + badge |
| `frontend/src/components/notifications/NotificationBell.module.css` | Estilos campana |
| `frontend/src/components/notifications/NotificationPanel.tsx` | Panel dropdown |
| `frontend/src/components/notifications/NotificationPanel.module.css` | Estilos panel |
| `frontend/src/components/notifications/NotificationItem.tsx` | Item individual |
| `frontend/src/components/notifications/NotificationItem.module.css` | Estilos item |

### Modificados
| Archivo | Cambio |
|---------|--------|
| `backend/src/models/relaciones.ts` | Relación Notificacion-Cliente |
| `backend/src/index.ts` | Registro de ruta `/api/notificaciones` |
| `backend/src/controllers/ComentarioController.ts` | 3 triggers |
| `backend/src/controllers/CarritoController.ts` | 1 trigger |
| `backend/src/controllers/VentaController.ts` | 1 trigger |
| `frontend/src/types/index.ts` | Re-export de notificacion |
| `frontend/src/App.tsx` | NotificacionesProvider |
| `frontend/src/components/layout/Navbar/Navbar.tsx` | NotificationBell |
