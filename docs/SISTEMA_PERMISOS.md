# Sistema de Permisos - TecnoCel

## Overview

Sistema de permisos granulares basado en roles que permite controlar el acceso a diferentes funcionalidades del panel de administración. Cada rol (ADMIN, GERENTE, VENDEDOR) puede tener múltiples permisos asignados.

## Estructura de Datos

### Tablas en Base de Datos

```sql
-- tb_permisos: Catálogo de permisos disponibles
- id_permiso (PK)
- nombre_permiso (unique) - ej: 'crear_producto'
- descripcion - ej: 'Crear nuevos productos'
- modulo - ej: 'productos', 'ventas', 'comentarios'
- tipo - ej: 'ver', 'crear', 'editar', 'eliminar', 'responder', 'moderar'

-- tb_roles_permisos: Relación muchos a muchos entre roles y permisos
- id_rol (FK)
- id_permiso (FK)
```

### Permisos por Módulo

| Módulo | Permisos |
|--------|----------|
| **Productos** | ver_productos, crear_producto, editar_producto, eliminar_producto |
| **Categorías** | ver_categorias, crear_categoria, editar_categoria, eliminar_categoria |
| **Marcas** | ver_marcas, crear_marca, editar_marca, eliminar_marca |
| **Características** | ver_caracteristicas, crear_caracteristica, editar_caracteristica, eliminar_caracteristica |
| **Ventas** | ver_ventas, crear_venta, editar_ventas |
| **Envíos** | ver_envios, gestionar_envios |
| **Compras** | ver_compras, crear_compra, editar_compra |
| **Proveedores** | ver_proveedores, crear_proveedor, editar_proveedor, eliminar_proveedor |
| **Ofertas** | ver_ofertas, crear_oferta, editar_oferta, eliminar_oferta |
| **Comentarios** | responder_comentarios, moderar_comentarios, eliminar_comentarios |
| **Configuración** | ver_configuracion, editar_configuracion |
| **Usuarios** | ver_usuarios, crear_usuario, editar_usuario, eliminar_usuario |
| **Clientes** | ver_clientes, crear_cliente, editar_cliente |
| **Reportes** | ver_reportes |

## Backend

### Middleware de Verificación

```typescript
// src/middleware/authMiddleware.ts
export const verificarPermiso = (nombrePermiso: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const tieneElPermiso = req.usuario?.permisos?.includes(nombrePermiso);
    if (!tieneElPermiso) {
      return res.status(403).json({ mensaje: 'Sin permiso' });
    }
    next();
  };
};
```

### Uso en Rutas

```typescript
// Ejemplo: Ruta con permisos separados para vista y gestión
router.get('/productos', verificarToken, verificarPermiso('ver_productos'), controller.getAll);
router.post('/productos', verificarToken, verificarPermiso('crear_producto'), controller.create);
router.put('/:id', verificarToken, verificarPermiso('editar_producto'), controller.update);
router.delete('/:id', verificarToken, verificarPermiso('eliminar_producto'), controller.delete);
```

### Endpoints de Gestión de Permisos

```
GET    /api/permisos              - Listar todos los permisos
GET    /api/permisos/rol/:id_rol  - Obtener permisos de un rol específico
PUT    /api/permisos/rol/:id_rol  - Actualizar permisos de un rol
```

## Frontend

### Contexto de Autenticación

```typescript
// src/contexts/AuthContext.tsx
const tienePermiso = useCallback((nombrePermiso: string): boolean => {
  if (!state.user || !isAdminUser(state.user)) return false;
  const userAny = state.user as any;
  // Admin siempre tiene todos los permisos
  if (userAny?.idRol === ROLES.ADMIN) return true;
  return userAny?.permisos?.includes(nombrePermiso) ?? false;
}, [state.user]);
```

### Uso en Componentes

```tsx
// Ejemplo en un componente
const { tienePermiso } = useAuth();

const puedeCrear = tienePermiso('crear_producto');
const puedeEliminar = tienePermiso('eliminar_producto');

return (
  <div>
    {puedeCrear && <button>Crear Producto</button>}
    {puedeEliminar && <button>Eliminar</button>}
  </div>
);
```

### Menú de Permisos

Archivo `menuPermisos.ts` que mapea cada tab del admin a sus permisos requeridos:

```typescript
export const MENU_PERMISOS: Record<string, string[]> = {
  'Productos': ['ver_productos'],
  'Categorías': ['ver_categorias'],
  // ...
};
```

### Componente de Gestión

El componente `GestionPermisos` permite a los administradores asignar/quitar permisos a cada rol desde la interfaz.

## Flujo de Trabajo

### 1. Agregar Nuevo Permiso

**Base de datos:**
```sql
INSERT INTO tb_permisos (nombre_permiso, descripcion, modulo, tipo)
VALUES ('mi_permiso', 'Descripción del permiso', 'mi_modulo', 'accion');
```

**Asignar a rol:**
```sql
INSERT INTO tb_roles_permisos (id_rol, id_permiso)
SELECT 1, id_permiso FROM tb_permisos WHERE nombre_permiso = 'mi_permiso';
```

### 2. Usar en Backend

```typescript
// En routes
router.post('/recurso', verificarToken, verificarPermiso('mi_permiso'), controller.create);
```

### 3. Usar en Frontend

```tsx
const puedeUsar = tienePermiso('mi_permiso');
```

## Escalabilidad

### Cómo Escalar el Sistema

1. **Nuevos permisos**: Agregar en la migración V9 y asignar a roles según necesidad

2. **Nuevos módulos**: Crear permisos en la base de datos y agregar al menú

3. **Jerarquía de permisos**: El sistema permite crear permisos genéricos o específicos

### Patrones Recomendados

- **Ver vs Gestionar**: Separar permisos de solo lectura de los de escritura
  - `ver_productos` - solo ver lista
  - `editar_producto` - modificar

- **Permisos de ownership**: Para contenido del usuario actual (comentarios, respuestas), permitir sin permiso adicional

- **Admin siempre tiene todo**: El rol ADMIN ignoran la verificación de permisos

### Limitaciones Actuales

- Los permisos se cargan en el login y no se actualizan en tiempo real
- No hay permisos a nivel de recurso específico (ej: solo este producto)
- No hay permisos por cliente (solo aplica a usuarios del sistema)

## Ejemplo: Permisos de Comentarios

```
- responder_comentarios: Permite responder a comentarios
- moderar_comentarios: Permite ocultar/mostrar comentarios  
- eliminar_comentarios: Permite eliminar cualquier comentario
```

**Lógica especial:**
- Clientes pueden siempre editar/eliminar sus propios comentarios
- System users pueden eliminar sus propias respuestas sin permiso
- System users necesitan permiso para eliminar contenido de otros
- Todos pueden ocultar (moderar) si tienen el permiso

## Comandos Útiles

```sql
-- Ver todos los permisos de un rol
SELECT p.nombre_permiso, p.descripcion, p.modulo
FROM tb_permisos p
JOIN tb_roles_permisos rp ON p.id_permiso = rp.id_permiso
WHERE rp.id_rol = 2;

-- Ver permisos no usados (no asignados a ningún rol)
SELECT * FROM tb_permisos 
WHERE id_permiso NOT IN (SELECT id_permiso FROM tb_roles_permisos);
```