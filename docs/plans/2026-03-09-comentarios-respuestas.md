# Sistema de Respuestas y Moderación de Comentarios — Plan de Implementación

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Agregar respuestas de clientes y admins a comentarios, y moderación (ocultar/eliminar) por admins.

**Architecture:** Nueva tabla `tb_comentario_respuestas` (ya creada por el usuario). Nueva modelo Sequelize `ComentarioRespuesta`. Endpoints separados para cliente vs admin. Tres nuevos componentes frontend: `ReplyCard`, `ReplyForm`, `ReplyList`; integrados en `CommentCard`.

**Tech Stack:** Node.js + Express + TypeScript + Sequelize (backend); React 18 + CSS Modules + Context API (frontend).

**Prerequisito:** La tabla `tb_comentario_respuestas` ya fue creada en la base de datos por el usuario.

---

## Task 1: Modelo `ComentarioRespuesta`

**Files:**
- Create: `backend/src/models/ComentarioRespuesta.ts`

**Step 1: Crear el modelo**

```typescript
import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

class ComentarioRespuesta extends Model {
  declare id_respuesta: number;
  declare id_comentario: number;
  declare id_cliente: number | null;
  declare id_usuario: number | null;
  declare tipo_autor: 'cliente' | 'admin';
  declare contenido: string;
  declare estado: 'activo' | 'oculto' | 'eliminado';
  declare fyh_creacion: Date;
  declare fyh_actualizacion: Date;
}

ComentarioRespuesta.init({
  id_respuesta: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  id_comentario: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'tb_comentarios_productos', key: 'id_comentario' }
  },
  id_cliente: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'tb_clientes', key: 'id_cliente' }
  },
  id_usuario: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'tb_usuarios', key: 'id_usuario' }
  },
  tipo_autor: {
    type: DataTypes.ENUM('cliente', 'admin'),
    allowNull: false
  },
  contenido: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: { len: [1, 1000] }
  },
  estado: {
    type: DataTypes.ENUM('activo', 'oculto', 'eliminado'),
    allowNull: false,
    defaultValue: 'activo'
  },
  fyh_creacion: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  fyh_actualizacion: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  sequelize,
  modelName: 'ComentarioRespuesta',
  tableName: 'tb_comentario_respuestas',
  timestamps: false,
  hooks: {
    beforeUpdate: (respuesta) => {
      respuesta.fyh_actualizacion = new Date();
    }
  }
});

export default ComentarioRespuesta;
```

**Step 2: Verificar compilación**

```bash
cd backend && npx tsc --noEmit
```
Esperado: sin errores.

**Step 3: Commit**

```bash
git add backend/src/models/ComentarioRespuesta.ts
git commit -m "feat(backend): agregar modelo ComentarioRespuesta"
```

---

## Task 2: Relaciones Sequelize

**Files:**
- Modify: `backend/src/models/relaciones.ts`

**Step 1: Agregar import del nuevo modelo** al inicio del archivo, después de la línea `import Direccion from './Direccion.js';`:

```typescript
import ComentarioRespuesta from './ComentarioRespuesta.js';
```

**Step 2: Agregar relaciones** al final del bloque de comentarios (después de la línea `Comentario.hasMany(ComentarioImagen, ...)`):

```typescript
// Respuestas de comentarios
Comentario.hasMany(ComentarioRespuesta, { foreignKey: 'id_comentario', as: 'respuestas' });
ComentarioRespuesta.belongsTo(Comentario, { foreignKey: 'id_comentario', as: 'comentarioPadre' });

ComentarioRespuesta.belongsTo(Cliente, { foreignKey: 'id_cliente', as: 'clienteAutor' });
Cliente.hasMany(ComentarioRespuesta, { foreignKey: 'id_cliente', as: 'respuestasCliente' });

ComentarioRespuesta.belongsTo(Usuario, { foreignKey: 'id_usuario', as: 'usuarioAutor' });
Usuario.hasMany(ComentarioRespuesta, { foreignKey: 'id_usuario', as: 'respuestasUsuario' });
```

**Step 3: Verificar compilación**

```bash
cd backend && npx tsc --noEmit
```

**Step 4: Commit**

```bash
git add backend/src/models/relaciones.ts
git commit -m "feat(backend): agregar relaciones para ComentarioRespuesta"
```

---

## Task 3: Tipos TypeScript backend

**Files:**
- Modify: `backend/src/types/comentario.types.ts`

**Step 1: Agregar nuevos tipos** al final del archivo:

```typescript
export interface CrearRespuestaClienteBody {
  contenido: string;
}

export interface CrearRespuestaAdminBody {
  contenido: string;
}

export interface ModerarComentarioBody {
  estado: 'activo' | 'oculto' | 'eliminado';
}

export interface ModerarRespuestaBody {
  estado: 'activo' | 'oculto' | 'eliminado';
}
```

**Step 2: Commit**

```bash
git add backend/src/types/comentario.types.ts
git commit -m "feat(backend): agregar tipos para respuestas y moderación"
```

---

## Task 4: Métodos del controlador

**Files:**
- Modify: `backend/src/controllers/ComentarioController.ts`

**Step 1: Agregar imports** al bloque de imports existente:

```typescript
import ComentarioRespuesta from '../models/ComentarioRespuesta.js';
import type {
  CrearRespuestaClienteBody,
  CrearRespuestaAdminBody,
  ModerarComentarioBody,
  ModerarRespuestaBody
} from '../types/comentario.types.js';
import { ROLES } from '../constants/roles.js';
```

Nota: verificar si `ROLES` ya existe en `backend/src/constants/roles.ts`. Si no existe, definir `const ROLES = { ADMIN: 1, GERENTE: 2, VENDEDOR: 3 }` inline en los métodos.

**Step 2: Agregar método `crearRespuestaCliente`** antes del cierre de la clase (`}`):

```typescript
async crearRespuestaCliente(req: Request, res: Response): Promise<void> {
  try {
    const { id_comentario } = req.params;
    const { contenido }: CrearRespuestaClienteBody = req.body;
    const idCliente = req.usuario?.id;

    const comentarioId = parseInt(id_comentario);
    if (!comentarioId || comentarioId <= 0) {
      res.status(400).json({ mensaje: 'ID de comentario inválido' });
      return;
    }

    if (!idCliente) {
      res.status(401).json({ mensaje: 'No autenticado' });
      return;
    }

    if (!contenido || contenido.trim().length < 1 || contenido.trim().length > 1000) {
      res.status(400).json({ mensaje: 'El contenido debe tener entre 1 y 1000 caracteres' });
      return;
    }

    const comentario = await Comentario.findOne({
      where: { id_comentario: comentarioId, estado: 'activo' }
    });

    if (!comentario) {
      res.status(404).json({ mensaje: 'Comentario no encontrado' });
      return;
    }

    const respuesta = await ComentarioRespuesta.create({
      id_comentario: comentarioId,
      id_cliente: idCliente,
      id_usuario: null,
      tipo_autor: 'cliente',
      contenido: contenido.trim(),
      estado: 'activo',
      fyh_creacion: new Date(),
      fyh_actualizacion: new Date()
    });

    const respuestaCompleta = await ComentarioRespuesta.findByPk(respuesta.id_respuesta, {
      include: [
        { model: Cliente, as: 'clienteAutor', attributes: ['nombre_cliente', 'apellido_cliente'] }
      ]
    });

    logger.info('Respuesta de cliente creada', { id_respuesta: respuesta.id_respuesta, id_comentario: comentarioId });

    res.status(201).json({
      mensaje: 'Respuesta creada exitosamente',
      datos: { respuesta: respuestaCompleta?.toJSON() }
    });
  } catch (error) {
    logger.error('Error al crear respuesta de cliente:', { error: error instanceof Error ? error.message : error });
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
}
```

**Step 3: Agregar método `crearRespuestaAdmin`**:

```typescript
async crearRespuestaAdmin(req: Request, res: Response): Promise<void> {
  try {
    const { id_comentario } = req.params;
    const { contenido }: CrearRespuestaAdminBody = req.body;
    const idUsuario = req.usuario?.id;

    const comentarioId = parseInt(id_comentario);
    if (!comentarioId || comentarioId <= 0) {
      res.status(400).json({ mensaje: 'ID de comentario inválido' });
      return;
    }

    if (!idUsuario) {
      res.status(401).json({ mensaje: 'No autenticado' });
      return;
    }

    if (!contenido || contenido.trim().length < 1 || contenido.trim().length > 1000) {
      res.status(400).json({ mensaje: 'El contenido debe tener entre 1 y 1000 caracteres' });
      return;
    }

    const comentario = await Comentario.findByPk(comentarioId);
    if (!comentario) {
      res.status(404).json({ mensaje: 'Comentario no encontrado' });
      return;
    }

    const respuesta = await ComentarioRespuesta.create({
      id_comentario: comentarioId,
      id_cliente: null,
      id_usuario: idUsuario,
      tipo_autor: 'admin',
      contenido: contenido.trim(),
      estado: 'activo',
      fyh_creacion: new Date(),
      fyh_actualizacion: new Date()
    });

    const respuestaCompleta = await ComentarioRespuesta.findByPk(respuesta.id_respuesta, {
      include: [
        { model: Usuario, as: 'usuarioAutor', attributes: ['nombres'] }
      ]
    });

    logger.info('Respuesta de admin creada', { id_respuesta: respuesta.id_respuesta, id_comentario: comentarioId, id_usuario: idUsuario });

    res.status(201).json({
      mensaje: 'Respuesta oficial creada exitosamente',
      datos: { respuesta: respuestaCompleta?.toJSON() }
    });
  } catch (error) {
    logger.error('Error al crear respuesta de admin:', { error: error instanceof Error ? error.message : error });
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
}
```

**Step 4: Agregar método `eliminarRespuesta`**:

```typescript
async eliminarRespuesta(req: Request, res: Response): Promise<void> {
  try {
    const { id_respuesta } = req.params;
    const idUsuarioActual = req.usuario?.id;

    const respuestaId = parseInt(id_respuesta);
    if (!respuestaId || respuestaId <= 0) {
      res.status(400).json({ mensaje: 'ID de respuesta inválido' });
      return;
    }

    const respuesta = await ComentarioRespuesta.findByPk(respuestaId);
    if (!respuesta || respuesta.estado === 'eliminado') {
      res.status(404).json({ mensaje: 'Respuesta no encontrada' });
      return;
    }

    // Verificar que el usuario es el propietario
    const esPropietario =
      (respuesta.tipo_autor === 'cliente' && respuesta.id_cliente === idUsuarioActual) ||
      (respuesta.tipo_autor === 'admin' && respuesta.id_usuario === idUsuarioActual);

    if (!esPropietario) {
      res.status(403).json({ mensaje: 'No tienes permiso para eliminar esta respuesta' });
      return;
    }

    await respuesta.update({ estado: 'eliminado' });

    logger.info('Respuesta eliminada', { id_respuesta: respuestaId });
    res.status(200).json({ mensaje: 'Respuesta eliminada exitosamente' });
  } catch (error) {
    logger.error('Error al eliminar respuesta:', { error: error instanceof Error ? error.message : error });
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
}
```

**Step 5: Agregar método `moderarComentario`**:

```typescript
async moderarComentario(req: Request, res: Response): Promise<void> {
  try {
    const { id_comentario } = req.params;
    const { estado }: ModerarComentarioBody = req.body;

    const comentarioId = parseInt(id_comentario);
    if (!comentarioId || comentarioId <= 0) {
      res.status(400).json({ mensaje: 'ID de comentario inválido' });
      return;
    }

    if (!['activo', 'oculto', 'eliminado'].includes(estado)) {
      res.status(400).json({ mensaje: 'Estado inválido. Valores permitidos: activo, oculto, eliminado' });
      return;
    }

    const comentario = await Comentario.findByPk(comentarioId);
    if (!comentario) {
      res.status(404).json({ mensaje: 'Comentario no encontrado' });
      return;
    }

    await comentario.update({ estado, fyh_actualizacion: new Date() });

    logger.info('Comentario moderado', { id_comentario: comentarioId, nuevo_estado: estado, moderador: req.usuario?.id });
    res.status(200).json({
      mensaje: `Comentario ${estado === 'oculto' ? 'ocultado' : estado === 'eliminado' ? 'eliminado' : 'restaurado'} exitosamente`,
      datos: { id_comentario: comentarioId, estado }
    });
  } catch (error) {
    logger.error('Error al moderar comentario:', { error: error instanceof Error ? error.message : error });
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
}
```

**Step 6: Agregar método `moderarRespuesta`**:

```typescript
async moderarRespuesta(req: Request, res: Response): Promise<void> {
  try {
    const { id_respuesta } = req.params;
    const { estado }: ModerarRespuestaBody = req.body;

    const respuestaId = parseInt(id_respuesta);
    if (!respuestaId || respuestaId <= 0) {
      res.status(400).json({ mensaje: 'ID de respuesta inválido' });
      return;
    }

    if (!['activo', 'oculto', 'eliminado'].includes(estado)) {
      res.status(400).json({ mensaje: 'Estado inválido' });
      return;
    }

    const respuesta = await ComentarioRespuesta.findByPk(respuestaId);
    if (!respuesta) {
      res.status(404).json({ mensaje: 'Respuesta no encontrada' });
      return;
    }

    await respuesta.update({ estado });

    logger.info('Respuesta moderada', { id_respuesta: respuestaId, nuevo_estado: estado, moderador: req.usuario?.id });
    res.status(200).json({
      mensaje: 'Respuesta moderada exitosamente',
      datos: { id_respuesta: respuestaId, estado }
    });
  } catch (error) {
    logger.error('Error al moderar respuesta:', { error: error instanceof Error ? error.message : error });
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
}
```

**Step 7: Actualizar `obtenerComentariosProducto`** para incluir respuestas en el `include` de la consulta existente. Agregar después del include de `adminRespuesta`:

```typescript
{
  model: ComentarioRespuesta,
  as: 'respuestas',
  where: { estado: 'activo' },
  required: false,
  include: [
    { model: Cliente, as: 'clienteAutor', attributes: ['nombre_cliente', 'apellido_cliente'] },
    { model: Usuario, as: 'usuarioAutor', attributes: ['nombres'] }
  ]
}
```

**Step 8: Verificar compilación**

```bash
cd backend && npx tsc --noEmit
```

**Step 9: Commit**

```bash
git add backend/src/controllers/ComentarioController.ts
git commit -m "feat(backend): agregar métodos de respuestas y moderación al ComentarioController"
```

---

## Task 5: Rutas del backend

**Files:**
- Modify: `backend/src/routes/comentarioRoutes.ts`

**Step 1: Agregar imports** al inicio del archivo (agregar `verificarToken` y `verificarRol`):

```typescript
import { verificarTokenCliente, verificarToken, verificarRol } from '../middleware/authMiddleware.js';
```

Verificar si `verificarRol` existe en `authMiddleware.ts`. Si no, los endpoints de moderación solo usan `verificarToken`.

**Step 2: Agregar validaciones** para respuestas y moderación, después de `validateProductIdParam`:

```typescript
const validateCrearRespuesta = [
  param('id_comentario')
    .isInt({ min: 1 })
    .withMessage('ID de comentario inválido'),
  body('contenido')
    .isLength({ min: 1, max: 1000 })
    .withMessage('El contenido debe tener entre 1 y 1000 caracteres')
    .trim(),
  handleValidationErrors
];

const validateRespuestaIdParam = [
  param('id_respuesta')
    .isInt({ min: 1 })
    .withMessage('ID de respuesta inválido'),
  handleValidationErrors
];

const validateModerarEstado = [
  param('id_comentario')
    .isInt({ min: 1 })
    .withMessage('ID de comentario inválido'),
  body('estado')
    .isIn(['activo', 'oculto', 'eliminado'])
    .withMessage('Estado inválido'),
  handleValidationErrors
];

const validateModerarRespuesta = [
  param('id_respuesta')
    .isInt({ min: 1 })
    .withMessage('ID de respuesta inválido'),
  body('estado')
    .isIn(['activo', 'oculto', 'eliminado'])
    .withMessage('Estado inválido'),
  handleValidationErrors
];
```

**Step 3: Reemplazar los comentarios de rutas futuras** al final del archivo con implementaciones reales:

Reemplazar el bloque comentado de "RUTAS ADICIONALES PARA FUTURAS IMPLEMENTACIONES" con:

```typescript
// RESPUESTAS A COMENTARIOS

// Cliente responde un comentario
router.post(
  '/:id_comentario/respuestas/cliente',
  verificarTokenCliente,
  validateCrearRespuesta,
  (req: Request, res: Response) => comentarioController.crearRespuestaCliente(req, res)
);

// Admin/empleado responde con respuesta oficial
router.post(
  '/:id_comentario/respuestas/admin',
  verificarToken,
  validateCrearRespuesta,
  (req: Request, res: Response) => comentarioController.crearRespuestaAdmin(req, res)
);

// Eliminar propia respuesta (cliente o admin)
router.delete(
  '/respuestas/:id_respuesta',
  verificarTokenCliente,
  validateRespuestaIdParam,
  (req: Request, res: Response) => comentarioController.eliminarRespuesta(req, res)
);

// MODERACIÓN (solo admins/empleados del sistema)

// Ocultar o restaurar un comentario
router.patch(
  '/:id_comentario/moderar',
  verificarToken,
  validateModerarEstado,
  (req: Request, res: Response) => comentarioController.moderarComentario(req, res)
);

// Moderar una respuesta
router.patch(
  '/respuestas/:id_respuesta/moderar',
  verificarToken,
  validateModerarRespuesta,
  (req: Request, res: Response) => comentarioController.moderarRespuesta(req, res)
);
```

Nota: El endpoint de eliminar respuesta usa `verificarTokenCliente` para clientes. Para que admins también puedan eliminar respuestas via admin API, se puede agregar una ruta adicional con `verificarToken`. Agregar al final:

```typescript
// Admin elimina cualquier respuesta
router.delete(
  '/respuestas/:id_respuesta/admin',
  verificarToken,
  validateRespuestaIdParam,
  (req: Request, res: Response) => comentarioController.moderarRespuesta(req, res)
);
```

**Step 4: Verificar compilación**

```bash
cd backend && npx tsc --noEmit
```

**Step 5: Commit**

```bash
git add backend/src/routes/comentarioRoutes.ts
git commit -m "feat(backend): agregar rutas para respuestas y moderación de comentarios"
```

---

## Task 6: Tipos y servicio cliente frontend

**Files:**
- Modify: `frontend/src/services/commentService.ts`

**Step 1: Agregar interfaz `Respuesta`** después de la interfaz `AdminRespuesta`:

```typescript
export interface Respuesta {
  id_respuesta: number;
  id_comentario: number;
  tipo_autor: 'cliente' | 'admin';
  contenido: string;
  estado: 'activo' | 'oculto' | 'eliminado';
  fyh_creacion: string;
  fyh_actualizacion: string;
  clienteAutor?: { nombre_cliente: string; apellido_cliente: string };
  usuarioAutor?: { nombres: string };
}
```

**Step 2: Agregar campo `respuestas` a la interfaz `Comentario`** existente:

```typescript
respuestas?: Respuesta[];
```

**Step 3: Agregar métodos de respuesta** al objeto `commentService`, después de `eliminarImagenComentario`:

```typescript
crearRespuestaCliente: async (idComentario: number, contenido: string): Promise<Respuesta> => {
  try {
    const response = await axiosInstance.post(`/comentarios/${idComentario}/respuestas/cliente`, { contenido });
    return response.data.datos.respuesta;
  } catch (error) {
    console.error('Error creating client reply:', error);
    throw error;
  }
},

eliminarRespuesta: async (idRespuesta: number): Promise<void> => {
  try {
    await axiosInstance.delete(`/comentarios/respuestas/${idRespuesta}`);
  } catch (error) {
    console.error('Error deleting reply:', error);
    throw error;
  }
},
```

**Step 4: Verificar compilación**

```bash
cd frontend && npx tsc --noEmit
```

**Step 5: Commit**

```bash
git add frontend/src/services/commentService.ts
git commit -m "feat(frontend): agregar tipo Respuesta y métodos de respuesta cliente en commentService"
```

---

## Task 7: Servicio admin frontend

**Files:**
- Create: `frontend/src/services/adminCommentService.ts`

**Step 1: Crear el servicio**

```typescript
import adminApi from '../api/axiosAdminConfig';
import type { Respuesta } from './commentService';

const adminCommentService = {
  crearRespuestaAdmin: async (idComentario: number, contenido: string): Promise<Respuesta> => {
    try {
      const response = await adminApi.post(`/comentarios/${idComentario}/respuestas/admin`, { contenido });
      return response.data.datos.respuesta;
    } catch (error) {
      console.error('Error creating admin reply:', error);
      throw error;
    }
  },

  moderarComentario: async (idComentario: number, estado: 'activo' | 'oculto' | 'eliminado'): Promise<void> => {
    try {
      await adminApi.patch(`/comentarios/${idComentario}/moderar`, { estado });
    } catch (error) {
      console.error('Error moderating comment:', error);
      throw error;
    }
  },

  moderarRespuesta: async (idRespuesta: number, estado: 'activo' | 'oculto' | 'eliminado'): Promise<void> => {
    try {
      await adminApi.patch(`/comentarios/respuestas/${idRespuesta}/moderar`, { estado });
    } catch (error) {
      console.error('Error moderating reply:', error);
      throw error;
    }
  },

  eliminarRespuestaAdmin: async (idRespuesta: number): Promise<void> => {
    try {
      await adminApi.delete(`/comentarios/respuestas/${idRespuesta}/admin`);
    } catch (error) {
      console.error('Error deleting reply as admin:', error);
      throw error;
    }
  }
};

export default adminCommentService;
```

**Step 2: Verificar que `adminApi` se exporta** desde `frontend/src/api/axiosAdminConfig.ts`. Si es exportación nombrada usar `import { adminApi }`, si es default usar `import adminApi`.

**Step 3: Verificar compilación**

```bash
cd frontend && npx tsc --noEmit
```

**Step 4: Commit**

```bash
git add frontend/src/services/adminCommentService.ts
git commit -m "feat(frontend): crear adminCommentService para moderación y respuestas admin"
```

---

## Task 8: Componente `ReplyCard`

**Files:**
- Create: `frontend/src/components/product/ProductComments/ReplyCard.tsx`
- Create: `frontend/src/components/product/ProductComments/ReplyCard.module.css`

**Step 1: Crear `ReplyCard.tsx`**

```typescript
import React, { useState, memo } from 'react';
import type { Respuesta } from '../../../services/commentService';
import commentService from '../../../services/commentService';
import styles from './ReplyCard.module.css';

interface ReplyCardProps {
  respuesta: Respuesta;
  currentUserId?: number;
  isSystemUser?: boolean;
  onDelete: (id: number) => Promise<void>;
  onModerate?: (id: number, estado: 'activo' | 'oculto' | 'eliminado') => Promise<void>;
}

const ReplyCard: React.FC<ReplyCardProps> = memo(({
  respuesta,
  currentUserId,
  isSystemUser = false,
  onDelete,
  onModerate
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const isOwner =
    (respuesta.tipo_autor === 'cliente' && respuesta.id_cliente === currentUserId) ||
    (respuesta.tipo_autor === 'admin' && respuesta.id_usuario === currentUserId);

  const autorNombre = respuesta.tipo_autor === 'admin'
    ? (respuesta.usuarioAutor?.nombres || 'Equipo TecnoCel')
    : respuesta.clienteAutor
      ? `${respuesta.clienteAutor.nombre_cliente} ${respuesta.clienteAutor.apellido_cliente}`
      : 'Usuario';

  const fechaFormateada = commentService.formatearFechaComentario(respuesta.fyh_creacion);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete(respuesta.id_respuesta);
    } catch (error) {
      console.error('Error deleting reply:', error);
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleModerate = async (estado: 'activo' | 'oculto' | 'eliminado') => {
    if (!onModerate) return;
    try {
      await onModerate(respuesta.id_respuesta, estado);
    } catch (error) {
      console.error('Error moderating reply:', error);
    }
  };

  return (
    <div className={`${styles.replyCard} ${respuesta.tipo_autor === 'admin' ? styles.adminReply : ''}`}>
      <div className={styles.replyHeader}>
        <div className={styles.authorInfo}>
          <span className={`material-icons ${styles.avatarIcon}`}>
            {respuesta.tipo_autor === 'admin' ? 'shield' : 'account_circle'}
          </span>
          <span className={styles.authorName}>{autorNombre}</span>
          {respuesta.tipo_autor === 'admin' && (
            <span className={styles.adminBadge}>Equipo oficial</span>
          )}
        </div>
        <span className={styles.date}>{fechaFormateada}</span>
      </div>

      <p className={styles.content}>{respuesta.contenido}</p>

      <div className={styles.actions}>
        {(isOwner || isSystemUser) && !showDeleteConfirm && (
          <button
            className={styles.deleteBtn}
            onClick={() => setShowDeleteConfirm(true)}
            disabled={isDeleting}
          >
            <span className="material-icons">delete_outline</span>
            Eliminar
          </button>
        )}

        {isSystemUser && !isOwner && onModerate && respuesta.estado === 'activo' && (
          <button
            className={styles.moderateBtn}
            onClick={() => handleModerate('oculto')}
          >
            <span className="material-icons">visibility_off</span>
            Ocultar
          </button>
        )}

        {isSystemUser && respuesta.estado === 'oculto' && onModerate && (
          <button
            className={styles.restoreBtn}
            onClick={() => handleModerate('activo')}
          >
            <span className="material-icons">visibility</span>
            Restaurar
          </button>
        )}

        {showDeleteConfirm && (
          <div className={styles.deleteConfirm}>
            <span>¿Eliminar respuesta?</span>
            <button
              className={styles.confirmYes}
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? 'Eliminando...' : 'Sí, eliminar'}
            </button>
            <button
              className={styles.confirmNo}
              onClick={() => setShowDeleteConfirm(false)}
              disabled={isDeleting}
            >
              Cancelar
            </button>
          </div>
        )}
      </div>
    </div>
  );
});

export default ReplyCard;
```

**Step 2: Crear `ReplyCard.module.css`**

```css
.replyCard {
  padding: var(--space-3) var(--space-4);
  border-left: 3px solid var(--border-color);
  margin-left: var(--space-6);
  margin-top: var(--space-2);
  background-color: var(--bg-secondary);
  border-radius: 0 var(--radius-md) var(--radius-md) 0;
}

.adminReply {
  border-left-color: var(--color-primary);
  background-color: var(--color-primary-alpha, rgba(14, 165, 233, 0.05));
}

.replyHeader {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-2);
  flex-wrap: wrap;
  gap: var(--space-1);
}

.authorInfo {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.avatarIcon {
  font-size: 18px;
  color: var(--text-secondary);
}

.adminReply .avatarIcon {
  color: var(--color-primary);
}

.authorName {
  font-weight: 600;
  font-size: var(--font-size-sm);
  color: var(--text-primary);
}

.adminBadge {
  font-size: var(--font-size-xs);
  background-color: var(--color-primary);
  color: white;
  padding: 2px 8px;
  border-radius: var(--radius-full);
  font-weight: 500;
}

.date {
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
}

.content {
  font-size: var(--font-size-sm);
  color: var(--text-primary);
  line-height: 1.5;
  margin: 0 0 var(--space-2) 0;
  white-space: pre-wrap;
  word-break: break-word;
}

.actions {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex-wrap: wrap;
}

.deleteBtn,
.moderateBtn,
.restoreBtn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border: none;
  border-radius: var(--radius-sm);
  font-size: var(--font-size-xs);
  cursor: pointer;
  transition: opacity 0.15s;
}

.deleteBtn {
  background: transparent;
  color: var(--color-error, #ef4444);
}

.moderateBtn {
  background: transparent;
  color: var(--text-secondary);
}

.restoreBtn {
  background: transparent;
  color: var(--color-success, #22c55e);
}

.deleteBtn:hover,
.moderateBtn:hover,
.restoreBtn:hover {
  opacity: 0.7;
}

.deleteBtn .material-icons,
.moderateBtn .material-icons,
.restoreBtn .material-icons {
  font-size: 14px;
}

.deleteConfirm {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex-wrap: wrap;
}

.deleteConfirm span {
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
}

.confirmYes {
  padding: 4px 12px;
  border: none;
  border-radius: var(--radius-sm);
  font-size: var(--font-size-xs);
  cursor: pointer;
  background-color: var(--color-error, #ef4444);
  color: white;
}

.confirmNo {
  padding: 4px 12px;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  font-size: var(--font-size-xs);
  cursor: pointer;
  background: transparent;
  color: var(--text-primary);
}

.confirmYes:disabled,
.confirmNo:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (prefers-reduced-motion: reduce) {
  * { animation: none !important; transition: none !important; }
}
```

**Step 3: Verificar compilación**

```bash
cd frontend && npx tsc --noEmit
```

**Step 4: Commit**

```bash
git add frontend/src/components/product/ProductComments/ReplyCard.tsx
git add frontend/src/components/product/ProductComments/ReplyCard.module.css
git commit -m "feat(frontend): crear componente ReplyCard para respuestas individuales"
```

---

## Task 9: Componente `ReplyForm`

**Files:**
- Create: `frontend/src/components/product/ProductComments/ReplyForm.tsx`
- Create: `frontend/src/components/product/ProductComments/ReplyForm.module.css`

**Step 1: Crear `ReplyForm.tsx`**

```typescript
import React, { useState, memo } from 'react';
import styles from './ReplyForm.module.css';

interface ReplyFormProps {
  onSubmit: (contenido: string) => Promise<void>;
  onCancel: () => void;
  isAdmin?: boolean;
}

const ReplyForm: React.FC<ReplyFormProps> = memo(({ onSubmit, onCancel, isAdmin = false }) => {
  const [contenido, setContenido] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const maxChars = 1000;
  const isValid = contenido.trim().length >= 1 && contenido.trim().length <= maxChars;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);
    try {
      await onSubmit(contenido.trim());
      setContenido('');
    } catch {
      setError('Error al publicar la respuesta. Intenta nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className={styles.replyForm} onSubmit={handleSubmit}>
      {isAdmin && (
        <div className={styles.adminIndicator}>
          <span className="material-icons">shield</span>
          Respondiendo como equipo oficial
        </div>
      )}
      <div className={styles.inputWrapper}>
        <textarea
          className={styles.textarea}
          value={contenido}
          onChange={(e) => setContenido(e.target.value)}
          placeholder="Escribe tu respuesta..."
          maxLength={maxChars}
          rows={3}
          disabled={isSubmitting}
          autoFocus
        />
        <span className={`${styles.charCount} ${contenido.length > maxChars * 0.9 ? styles.charCountWarn : ''}`}>
          {contenido.length}/{maxChars}
        </span>
      </div>
      {error && <p className={styles.errorMsg}>{error}</p>}
      <div className={styles.formActions}>
        <button
          type="button"
          className={styles.cancelBtn}
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancelar
        </button>
        <button
          type="submit"
          className={styles.submitBtn}
          disabled={!isValid || isSubmitting}
        >
          {isSubmitting ? 'Publicando...' : 'Publicar respuesta'}
        </button>
      </div>
    </form>
  );
});

export default ReplyForm;
```

**Step 2: Crear `ReplyForm.module.css`**

```css
.replyForm {
  margin-top: var(--space-3);
  margin-left: var(--space-6);
  padding: var(--space-3);
  background-color: var(--bg-secondary);
  border-radius: var(--radius-md);
  border: 1px solid var(--border-color);
}

.adminIndicator {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--font-size-sm);
  color: var(--color-primary);
  font-weight: 500;
  margin-bottom: var(--space-2);
}

.adminIndicator .material-icons {
  font-size: 16px;
}

.inputWrapper {
  position: relative;
  margin-bottom: var(--space-2);
}

.textarea {
  width: 100%;
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  font-size: var(--font-size-sm);
  font-family: var(--font-primary);
  color: var(--text-primary);
  background-color: var(--bg-primary);
  resize: vertical;
  min-height: 80px;
  box-sizing: border-box;
  transition: border-color 0.15s;
}

.textarea:focus {
  outline: none;
  border-color: var(--color-primary);
}

.textarea:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.charCount {
  position: absolute;
  bottom: var(--space-2);
  right: var(--space-3);
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
  pointer-events: none;
}

.charCountWarn {
  color: var(--color-warning, #f59e0b);
}

.errorMsg {
  font-size: var(--font-size-xs);
  color: var(--color-error, #ef4444);
  margin: 0 0 var(--space-2) 0;
}

.formActions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-2);
}

.cancelBtn {
  padding: var(--space-1) var(--space-3);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  font-size: var(--font-size-sm);
  cursor: pointer;
  background: transparent;
  color: var(--text-secondary);
  transition: background-color 0.15s;
}

.cancelBtn:hover:not(:disabled) {
  background-color: var(--bg-secondary);
}

.submitBtn {
  padding: var(--space-1) var(--space-4);
  border: none;
  border-radius: var(--radius-sm);
  font-size: var(--font-size-sm);
  font-weight: 500;
  cursor: pointer;
  background-color: var(--color-primary);
  color: white;
  transition: opacity 0.15s;
}

.submitBtn:hover:not(:disabled) {
  opacity: 0.85;
}

.submitBtn:disabled,
.cancelBtn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (prefers-reduced-motion: reduce) {
  * { animation: none !important; transition: none !important; }
}
```

**Step 3: Verificar compilación**

```bash
cd frontend && npx tsc --noEmit
```

**Step 4: Commit**

```bash
git add frontend/src/components/product/ProductComments/ReplyForm.tsx
git add frontend/src/components/product/ProductComments/ReplyForm.module.css
git commit -m "feat(frontend): crear componente ReplyForm para formulario de respuesta"
```

---

## Task 10: Componente `ReplyList`

**Files:**
- Create: `frontend/src/components/product/ProductComments/ReplyList.tsx`
- Create: `frontend/src/components/product/ProductComments/ReplyList.module.css`

**Step 1: Crear `ReplyList.tsx`**

```typescript
import React, { useState, memo } from 'react';
import type { Respuesta } from '../../../services/commentService';
import commentService from '../../../services/commentService';
import adminCommentService from '../../../services/adminCommentService';
import ReplyCard from './ReplyCard';
import ReplyForm from './ReplyForm';
import styles from './ReplyList.module.css';

interface ReplyListProps {
  idComentario: number;
  respuestas: Respuesta[];
  currentUserId?: number;
  isAuthenticated?: boolean;
  isSystemUser?: boolean;
  onRepliesChange: (idComentario: number, respuestas: Respuesta[]) => void;
}

const INITIAL_VISIBLE = 2;

const ReplyList: React.FC<ReplyListProps> = memo(({
  idComentario,
  respuestas,
  currentUserId,
  isAuthenticated = false,
  isSystemUser = false,
  onRepliesChange
}) => {
  const [showForm, setShowForm] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const activeReplies = isSystemUser
    ? respuestas
    : respuestas.filter(r => r.estado === 'activo');

  const visibleReplies = showAll ? activeReplies : activeReplies.slice(0, INITIAL_VISIBLE);
  const hiddenCount = activeReplies.length - INITIAL_VISIBLE;

  const handleCreateReply = async (contenido: string) => {
    let nuevaRespuesta: Respuesta;
    if (isSystemUser) {
      nuevaRespuesta = await adminCommentService.crearRespuestaAdmin(idComentario, contenido);
    } else {
      nuevaRespuesta = await commentService.crearRespuestaCliente(idComentario, contenido);
    }
    onRepliesChange(idComentario, [...respuestas, nuevaRespuesta]);
    setShowForm(false);
    setShowAll(true);
  };

  const handleDeleteReply = async (idRespuesta: number) => {
    if (isSystemUser) {
      await adminCommentService.eliminarRespuestaAdmin(idRespuesta);
    } else {
      await commentService.eliminarRespuesta(idRespuesta);
    }
    onRepliesChange(idComentario, respuestas.filter(r => r.id_respuesta !== idRespuesta));
  };

  const handleModerateReply = async (idRespuesta: number, estado: 'activo' | 'oculto' | 'eliminado') => {
    await adminCommentService.moderarRespuesta(idRespuesta, estado);
    onRepliesChange(
      idComentario,
      respuestas.map(r => r.id_respuesta === idRespuesta ? { ...r, estado } : r)
    );
  };

  return (
    <div className={styles.replyList}>
      {activeReplies.length > 0 && (
        <div className={styles.replies}>
          {visibleReplies.map(respuesta => (
            <ReplyCard
              key={respuesta.id_respuesta}
              respuesta={respuesta}
              currentUserId={currentUserId}
              isSystemUser={isSystemUser}
              onDelete={handleDeleteReply}
              onModerate={isSystemUser ? handleModerateReply : undefined}
            />
          ))}

          {hiddenCount > 0 && !showAll && (
            <button
              className={styles.toggleBtn}
              onClick={() => setShowAll(true)}
            >
              Ver {hiddenCount} respuesta{hiddenCount > 1 ? 's' : ''} más
            </button>
          )}

          {showAll && activeReplies.length > INITIAL_VISIBLE && (
            <button
              className={styles.toggleBtn}
              onClick={() => setShowAll(false)}
            >
              Ocultar respuestas
            </button>
          )}
        </div>
      )}

      {isAuthenticated && !showForm && (
        <button
          className={styles.replyBtn}
          onClick={() => setShowForm(true)}
        >
          <span className="material-icons">reply</span>
          Responder
        </button>
      )}

      {showForm && (
        <ReplyForm
          onSubmit={handleCreateReply}
          onCancel={() => setShowForm(false)}
          isAdmin={isSystemUser}
        />
      )}
    </div>
  );
});

export default ReplyList;
```

**Step 2: Crear `ReplyList.module.css`**

```css
.replyList {
  margin-top: var(--space-3);
}

.replies {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.toggleBtn {
  margin-left: var(--space-6);
  margin-top: var(--space-2);
  background: none;
  border: none;
  font-size: var(--font-size-sm);
  color: var(--color-primary);
  cursor: pointer;
  padding: 0;
  font-weight: 500;
}

.toggleBtn:hover {
  text-decoration: underline;
}

.replyBtn {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  margin-top: var(--space-2);
  background: none;
  border: none;
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  cursor: pointer;
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-sm);
  transition: color 0.15s, background-color 0.15s;
}

.replyBtn:hover {
  color: var(--color-primary);
  background-color: var(--bg-secondary);
}

.replyBtn .material-icons {
  font-size: 16px;
}

@media (max-width: 480px) {
  .toggleBtn {
    margin-left: var(--space-4);
  }
}

@media (prefers-reduced-motion: reduce) {
  * { animation: none !important; transition: none !important; }
}
```

**Step 3: Verificar compilación**

```bash
cd frontend && npx tsc --noEmit
```

**Step 4: Commit**

```bash
git add frontend/src/components/product/ProductComments/ReplyList.tsx
git add frontend/src/components/product/ProductComments/ReplyList.module.css
git commit -m "feat(frontend): crear componente ReplyList con lógica de respuestas"
```

---

## Task 11: Actualizar `CommentCard` y `ProductComments`

**Files:**
- Modify: `frontend/src/components/product/ProductComments/CommentCard.tsx`
- Modify: `frontend/src/components/product/ProductComments/ProductComments.tsx`

### CommentCard.tsx

**Step 1: Agregar imports** al inicio del archivo:

```typescript
import type { Respuesta } from '../../../services/commentService';
import adminCommentService from '../../../services/adminCommentService';
import ReplyList from './ReplyList';
```

**Step 2: Agregar props a la interfaz `CommentCardProps`**:

```typescript
isSystemUser?: boolean;
onRepliesChange?: (idComentario: number, respuestas: Respuesta[]) => void;
isAuthenticated?: boolean;
```

**Step 3: Agregar destructuring de las nuevas props** en la firma del componente:

```typescript
isSystemUser = false,
onRepliesChange,
isAuthenticated = false,
```

**Step 4: Agregar botones de moderación admin** en el `renderHeader` del comentario. Buscar el bloque donde se renderizan los botones de editar/eliminar del propietario y agregar DESPUÉS de él:

```typescript
{isSystemUser && (
  <div className={styles.moderationActions}>
    {comentario.estado === 'activo' && (
      <button
        className={styles.moderateBtn}
        onClick={() => handleModerate('oculto')}
        title="Ocultar comentario"
      >
        <span className="material-icons">visibility_off</span>
      </button>
    )}
    {comentario.estado === 'oculto' && (
      <button
        className={styles.restoreBtn}
        onClick={() => handleModerate('activo')}
        title="Restaurar comentario"
      >
        <span className="material-icons">visibility</span>
      </button>
    )}
    <button
      className={styles.adminDeleteBtn}
      onClick={() => setShowDeleteConfirm(true)}
      title="Eliminar comentario (admin)"
    >
      <span className="material-icons">delete_forever</span>
    </button>
  </div>
)}
```

**Step 5: Agregar badge de estado oculto** visible para admins. Dentro del `commentHeader`, después del `userInfo`:

```typescript
{isSystemUser && comentario.estado === 'oculto' && (
  <span className={styles.hiddenBadge}>OCULTO</span>
)}
```

**Step 6: Agregar handler `handleModerate`** junto a los otros handlers:

```typescript
const handleModerate = async (estado: 'activo' | 'oculto' | 'eliminado') => {
  try {
    await adminCommentService.moderarComentario(comentario.id_comentario, estado);
    // Notificar al padre para recargar si hay un callback disponible
  } catch (error) {
    console.error('Error moderating comment:', error);
  }
};
```

Nota: Para que la moderación refleje en la UI sin recargar todo, `ProductComments` deberá recargar los comentarios después. Agregar un prop `onModerate?: () => void` a `CommentCardProps` y llamarlo después de moderar si está definido. Alternativamente, simplemente recargar todo desde `ProductComments`.

La forma más simple: agregar `onModerate?: () => void` a `CommentCardProps`, y en `handleModerate` llamar `onModerate?.()` después de la operación exitosa.

**Step 7: Agregar `ReplyList` al final del cuerpo del comentario** (antes del cierre del `div.commentCard`), justo antes del cierre `</div>`:

```typescript
{onRepliesChange && (
  <ReplyList
    idComentario={comentario.id_comentario}
    respuestas={comentario.respuestas || []}
    currentUserId={currentUserId}
    isAuthenticated={isAuthenticated}
    isSystemUser={isSystemUser}
    onRepliesChange={onRepliesChange}
  />
)}
```

**Step 8: Agregar estilos de moderación** a `CommentCard.module.css`. Agregar al final:

```css
.moderationActions {
  display: flex;
  gap: var(--space-1);
  margin-left: auto;
}

.moderateBtn,
.restoreBtn,
.adminDeleteBtn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  border-radius: var(--radius-sm);
  color: var(--text-secondary);
  transition: color 0.15s;
}

.moderateBtn:hover {
  color: var(--color-warning, #f59e0b);
}

.restoreBtn:hover {
  color: var(--color-success, #22c55e);
}

.adminDeleteBtn:hover {
  color: var(--color-error, #ef4444);
}

.moderateBtn .material-icons,
.restoreBtn .material-icons,
.adminDeleteBtn .material-icons {
  font-size: 18px;
}

.hiddenBadge {
  font-size: var(--font-size-xs);
  background-color: var(--color-warning, #f59e0b);
  color: white;
  padding: 2px 8px;
  border-radius: var(--radius-full);
  font-weight: 600;
  letter-spacing: 0.5px;
}
```

---

### ProductComments.tsx

**Step 9: Actualizar `useAuth` destructuring** para incluir `isSystemUser` e `isAuthenticated`:

```typescript
const { user, isAuthenticated, isSystemUser } = useAuth();
```

**Step 10: Agregar handler `handleRepliesChange`**:

```typescript
const handleRepliesChange = (idComentario: number, nuevasRespuestas: Respuesta[]) => {
  setComentarios(prev =>
    prev.map(c =>
      c.id_comentario === idComentario ? { ...c, respuestas: nuevasRespuestas } : c
    )
  );
};
```

**Step 11: Agregar import del tipo `Respuesta`** al import de commentService:

```typescript
import type { Comentario, EstadisticasComentarios, Respuesta } from '../../../services/commentService';
```

**Step 12: Pasar nuevas props a `CommentCard`** en el render:

```typescript
<CommentCard
  key={comentario.id_comentario}
  comentario={comentario}
  currentUserId={user?.id}
  isSystemUser={isSystemUser}
  isAuthenticated={isAuthenticated}
  onRepliesChange={handleRepliesChange}
  onModerate={() => cargarComentarios(currentPage)}
  // ...props existentes...
/>
```

**Step 13: Verificar compilación**

```bash
cd frontend && npx tsc --noEmit
```

**Step 14: Commit**

```bash
git add frontend/src/components/product/ProductComments/CommentCard.tsx
git add frontend/src/components/product/ProductComments/CommentCard.module.css
git add frontend/src/components/product/ProductComments/ProductComments.tsx
git commit -m "feat(frontend): integrar ReplyList y moderación admin en CommentCard y ProductComments"
```

---

## Task 12: Verificación final

**Step 1: Verificar compilación backend completa**

```bash
cd backend && npm run build
```
Esperado: `Build successful` sin errores TypeScript.

**Step 2: Verificar compilación frontend completa**

```bash
cd frontend && npm run build
```
Esperado: sin errores TypeScript ni de Vite.

**Step 3: Verificación manual del backend** — Iniciar servidor y probar endpoints:

```bash
cd backend && npm run dev
```

Verificar con REST Client o curl:
- `POST /api/comentarios/:id/respuestas/cliente` con token de cliente → 201
- `POST /api/comentarios/:id/respuestas/admin` con token admin → 201
- `GET /api/comentarios/producto/:id` → los comentarios incluyen campo `respuestas: []`
- `PATCH /api/comentarios/:id/moderar` con token admin, body `{estado: "oculto"}` → 200

**Step 4: Commit final**

```bash
git add -A
git commit -m "feat: sistema completo de respuestas y moderación de comentarios"
```
