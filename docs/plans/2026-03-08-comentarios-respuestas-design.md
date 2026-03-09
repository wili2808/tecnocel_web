# Diseño: Sistema de Respuestas y Moderación de Comentarios

**Fecha:** 2026-03-08
**Estado:** Aprobado
**Proyecto:** TecnoCel Web

---

## Resumen

Expandir el sistema de comentarios de productos para soportar:
1. Respuestas de clientes a comentarios (solo texto)
2. Respuestas oficiales de admins/empleados del sistema (destacadas visualmente)
3. Moderación de comentarios y respuestas por admins (ocultar / eliminar)

---

## Decisiones de Diseño

| Decisión | Elección | Razón |
|----------|----------|-------|
| Nivel de anidamiento | 2 niveles (comentario → respuestas) | Estándar e-commerce, simple y mantenible |
| Capacidades de respuesta cliente | Solo texto (1-1000 chars) | Conversacional, no documental |
| Capacidades admin | Moderar + respuesta oficial destacada | Estándar profesional |
| Almacenamiento | Nueva tabla dedicada | Diseño limpio, queries simples |

---

## 1. Base de Datos

### Nueva tabla: `tb_comentario_respuestas`

```sql
CREATE TABLE tb_comentario_respuestas (
  id_respuesta        INT AUTO_INCREMENT PRIMARY KEY,
  id_comentario       INT NOT NULL,
  id_cliente          INT NULL,
  id_usuario          INT NULL,
  tipo_autor          ENUM('cliente', 'admin') NOT NULL,
  contenido           TEXT NOT NULL,
  estado              ENUM('activo','oculto','eliminado') NOT NULL DEFAULT 'activo',
  fyh_creacion        DATETIME NOT NULL DEFAULT NOW(),
  fyh_actualizacion   DATETIME NOT NULL DEFAULT NOW(),
  INDEX idx_comentario (id_comentario),
  INDEX idx_estado (estado),
  FOREIGN KEY (id_comentario) REFERENCES tb_comentarios_productos(id_comentario),
  FOREIGN KEY (id_cliente) REFERENCES tb_clientes(id_cliente),
  FOREIGN KEY (id_usuario) REFERENCES tb_usuarios(id_usuario)
);
```

### Sin cambios en `tb_comentarios_productos`
Los campos `respuesta_admin`, `fecha_respuesta_admin`, `id_admin_respuesta` quedan como legado.
Las nuevas respuestas de admin van a `tb_comentario_respuestas` con `tipo_autor = 'admin'`.

---

## 2. Backend

### Nuevo modelo: `ComentarioRespuesta`

Archivo: `backend/src/models/ComentarioRespuesta.ts`

Campos declarados: `id_respuesta`, `id_comentario`, `id_cliente`, `id_usuario`, `tipo_autor`, `contenido`, `estado`, `fyh_creacion`, `fyh_actualizacion`.

Hook `beforeUpdate`: actualiza `fyh_actualizacion`.

### Relaciones (en `relaciones.ts`)

```typescript
ComentarioRespuesta.belongsTo(Comentario, { foreignKey: 'id_comentario', as: 'comentarioPadre' });
Comentario.hasMany(ComentarioRespuesta, { foreignKey: 'id_comentario', as: 'respuestas' });

ComentarioRespuesta.belongsTo(Cliente, { foreignKey: 'id_cliente', as: 'clienteAutor' });
ComentarioRespuesta.belongsTo(Usuario, { foreignKey: 'id_usuario', as: 'usuarioAutor' });
```

### Nuevos endpoints

**Respuestas:**

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| `GET` | `/api/comentarios/:id/respuestas` | Pública | Lista respuestas activas |
| `POST` | `/api/comentarios/:id/respuestas/cliente` | `verificarTokenCliente` | Cliente crea respuesta |
| `POST` | `/api/comentarios/:id/respuestas/admin` | `verificarToken` + rol | Admin/empleado crea respuesta oficial |
| `DELETE` | `/api/comentarios/respuestas/:id_respuesta` | Token propio | Eliminar propia respuesta (soft delete) |

**Moderación admin (activar endpoints comentados):**

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| `PATCH` | `/api/comentarios/:id/moderar` | `verificarToken` + rol | Cambia estado comentario |
| `DELETE` | `/api/comentarios/:id/admin` | `verificarToken` + `ROLES.ADMIN` | Elimina comentario (soft delete) |
| `PATCH` | `/api/comentarios/respuestas/:id/moderar` | `verificarToken` + rol | Modera una respuesta |

**Roles con acceso a moderación:** `ROLES.ADMIN`, `ROLES.GERENTE`

### Carga de respuestas

Las respuestas activas se incluyen al cargar comentarios via Sequelize `include`:

```typescript
include: [
  { model: ComentarioRespuesta, as: 'respuestas',
    where: { estado: 'activo' }, required: false,
    include: [
      { model: Cliente, as: 'clienteAutor', attributes: ['nombre_cliente', 'apellido_cliente'] },
      { model: Usuario, as: 'usuarioAutor', attributes: ['nombres'] }
    ]
  }
]
```

### Nuevos tipos TypeScript (backend)

Archivo: `backend/src/types/comentario.types.ts` (ampliación)

```typescript
export interface CrearRespuestaClienteBody {
  contenido: string; // 1-1000 chars
}

export interface ModerarComentarioBody {
  estado: 'activo' | 'oculto' | 'eliminado';
  motivo?: string;
}
```

---

## 3. Frontend

### Nuevos componentes

| Componente | Archivo | Responsabilidad |
|------------|---------|-----------------|
| `ReplyList` | `ProductComments/ReplyList.tsx` | Lista colapsable de respuestas bajo comentario |
| `ReplyForm` | `ProductComments/ReplyForm.tsx` | Formulario inline de texto para responder |
| `ReplyCard` | `ProductComments/ReplyCard.tsx` | Tarjeta de respuesta individual |

**`ReplyList.tsx`:**
- Muestra respuestas colapsadas por defecto si hay más de 2
- Botón "Ver X respuestas" / "Ocultar respuestas"
- Botón "Responder" visible solo para usuarios autenticados
- Renderiza `ReplyCard` por cada respuesta

**`ReplyForm.tsx`:**
- Textarea simple, 1-1000 caracteres con contador
- Botones "Publicar" / "Cancelar"
- Estado de carga durante submit

**`ReplyCard.tsx`:**
- Nombre del autor
- Badge "Respuesta oficial del equipo" si `tipo_autor === 'admin'` (borde izquierdo color primario)
- Fecha formateada relativa
- Botón eliminar para el propietario
- Botón "Ocultar" para admins en todas las respuestas

### Cambios en componentes existentes

**`CommentCard.tsx`:**
- Integra `ReplyList` al final del cuerpo del comentario
- Agrega botones de moderación admin: "Ocultar" / "Eliminar" visibles si `isSystemUser`
- Badge visual `[OCULTO]` visible en panel admin

### Nuevos tipos frontend

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

// Comentario extendido
export interface Comentario {
  // ...campos existentes...
  respuestas?: Respuesta[];
}
```

### Ampliación de `commentService.ts`

```typescript
// Respuestas - clientes
crearRespuestaCliente(idComentario: number, contenido: string): Promise<Respuesta>
eliminarRespuesta(idRespuesta: number): Promise<void>

// Respuestas - admin (usa adminApi)
crearRespuestaAdmin(idComentario: number, contenido: string): Promise<Respuesta>

// Moderación - admin (usa adminApi)
moderarComentario(idComentario: number, estado: string): Promise<void>
moderarRespuesta(idRespuesta: number, estado: string): Promise<void>
eliminarComentarioAdmin(idComentario: number): Promise<void>
```

### UX

- Respuestas cargadas junto con comentarios (sin request extra, evita N+1)
- Formulario inline bajo cada comentario, no modal
- Respuestas admin con borde izquierdo color primario + ícono de escudo/verificado
- Confirmación antes de cualquier acción de moderación
- Admins ven comentarios ocultos en panel de administración (con badge diferenciador)

---

## 4. Archivos a Crear / Modificar

### Backend
- **CREAR** `backend/src/models/ComentarioRespuesta.ts`
- **MODIFICAR** `backend/src/models/relaciones.ts` — agregar relaciones del nuevo modelo
- **MODIFICAR** `backend/src/controllers/ComentarioController.ts` — nuevos métodos
- **MODIFICAR** `backend/src/routes/comentarioRoutes.ts` — nuevas rutas + activar moderación
- **MODIFICAR** `backend/src/types/comentario.types.ts` — nuevos tipos
- **MODIFICAR** `database/` — script SQL de migración

### Frontend
- **CREAR** `frontend/src/components/product/ProductComments/ReplyList.tsx`
- **CREAR** `frontend/src/components/product/ProductComments/ReplyList.module.css`
- **CREAR** `frontend/src/components/product/ProductComments/ReplyForm.tsx`
- **CREAR** `frontend/src/components/product/ProductComments/ReplyForm.module.css`
- **CREAR** `frontend/src/components/product/ProductComments/ReplyCard.tsx`
- **CREAR** `frontend/src/components/product/ProductComments/ReplyCard.module.css`
- **MODIFICAR** `frontend/src/components/product/ProductComments/CommentCard.tsx`
- **MODIFICAR** `frontend/src/services/commentService.ts`
- **MODIFICAR** `frontend/src/types/` — tipo `Respuesta` y extensión de `Comentario`
