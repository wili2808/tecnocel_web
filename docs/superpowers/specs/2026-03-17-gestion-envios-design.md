# Diseño: Módulo de Gestión de Envíos

**Fecha:** 2026-03-17
**Estado:** Aprobado
**Proyecto:** TecnoCel Web — Panel de Administración

---

## Resumen

Agregar un tab "Envíos" dentro de la sección existente "Gestión de Ventas" del panel admin. El módulo permite al administrador hacer seguimiento y gestión manual del estado de los envíos a domicilio, con notificación por email al cliente en los pasos clave.

---

## Contexto y decisiones de diseño

### Estructura elegida
Tab dentro de Gestión de Ventas (no módulo separado en el menú). Menor impacto en la navegación, todo el contexto de venta + envío en un mismo lugar.

### Integración logística
Manual por ahora. El diseño del `EnvioController` está pensado para que en el futuro se pueda agregar integración con OCA, Andreani u otros proveedores sin reestructurar.

### Notificaciones al cliente
Solo por **email**. Se disparan en dos momentos: al marcar "En camino" y al marcar "Entregado".

### Número de seguimiento
Campo opcional que el admin puede ingresar al pasar el estado a "En camino". El cliente lo puede ver en el historial de sus compras.

### Separación entre `Venta.estado` y `Envio.estado_envio`

Estos son dos campos en dos modelos distintos con propósitos distintos:

- **`Venta.estado`** (`tb_ventas`): estado administrativo de la venta con valores DB `completada | cancelada | pendiente`. El endpoint `PATCH /api/ventas/admin/:id/estado` en `AdminVentaController` también actualiza este campo en runtime. **No es responsabilidad de este módulo.**
- **`Envio.estado_envio`** (`tb_envios`): estado logístico del envío físico (`pendiente`, `en_preparacion`, `en_camino`, `entregado`, `no_aplica`). Gestionado exclusivamente por el nuevo `EnvioController`.

El nuevo módulo **no modifica ni reemplaza** `actualizarEstadoVenta()` — opera únicamente sobre `Envio.estado_envio`.

### Por qué `no_aplica` no aparece en el módulo de envíos

El estado `no_aplica` solo se asigna cuando `tipo_entrega = 'retiro_en_tienda'`. Como el tab de Envíos filtra exclusivamente por `tipo_entrega = 'envio'`, este estado queda excluido por definición. El tipo `estado_envio` en las interfaces de envíos solo incluye los 4 estados relevantes: `pendiente | en_preparacion | en_camino | entregado`.

### Renombrado de campo
`fecha_despacho` → `fyh_despacho` para seguir la convención de nombres del proyecto (`fyh_` para timestamps). Se actualiza en todos los archivos que lo referencian.

---

## Migración de base de datos

**Tabla:** `tb_envios`

```sql
-- Renombrar campo existente
ALTER TABLE tb_envios CHANGE fecha_despacho fyh_despacho DATETIME NULL;

-- Nuevo campo
ALTER TABLE tb_envios ADD COLUMN nro_seguimiento VARCHAR(100) NULL AFTER estado_envio;
```

---

## Backend

### Nuevo: `EnvioController` (`src/controllers/EnvioController.ts`)

Tres métodos estáticos:

#### `listarEnvios` — `GET /api/envios/admin`

- Solo retorna envíos con `tipo_entrega = 'envio'` (excluye retiros en tienda)
- Filtros: `estado_envio`, `fecha_inicio`, `fecha_fin`, `search` (por nro_venta o nombre cliente)
- Paginado: `limit` (default 20, max 100), `offset`
- Join con `Venta` y `Cliente`
- Acceso: ADMIN, GERENTE, VENDEDOR

#### `obtenerDetalle` — `GET /api/envios/admin/:id_envio`

- Retorna envío con datos completos de la venta, cliente e items
- Sin restricción de propietario (admin puede ver todo)

#### `actualizarEstado` — `PATCH /api/envios/admin/:id_envio/estado`

Body:
```typescript
{
  estado_envio: 'en_preparacion' | 'en_camino' | 'entregado';
  nro_seguimiento?: string; // solo relevante al pasar a 'en_camino'
}
```

Lógica:
1. Validar transición de estado — tabla de transiciones permitidas (solo secuencial, nunca retroceder):
   - `pendiente` → `en_preparacion`
   - `en_preparacion` → `en_camino`
   - `en_camino` → `entregado`
   - Cualquier otra combinación retorna 400
2. Si `estado_envio = 'en_camino'`: guardar `nro_seguimiento` (si viene) y poblar `fyh_despacho = NOW()`
3. Si `estado_envio = 'en_camino'` o `'entregado'`: disparar email al cliente (fire-and-forget)
4. Actualizar `fyh_actualizacion`

Acceso: ADMIN, GERENTE, VENDEDOR

### Nuevo: `envioRoutes` (`src/routes/envioRoutes.ts`)

```
GET    /api/envios/admin              → listarEnvios
GET    /api/envios/admin/:id_envio    → obtenerDetalle
PATCH  /api/envios/admin/:id_envio/estado → actualizarEstado
```

Todas protegidas con `verificarToken` + `verificarRol([ROLES.ADMIN, ROLES.GERENTE, ROLES.VENDEDOR])`.

### Nuevo: `envio.types.ts` (`src/types/envio.types.ts`)

```typescript
interface EnvioAdminListItem {
  id_envio: number;
  id_venta: number;
  nro_venta: number;
  nombre_cliente: string | null;
  email_cliente: string | null;
  envio_calle: string | null;
  envio_numero: string | null;
  envio_ciudad: string | null;
  envio_provincia: string | null;
  estado_envio: 'pendiente' | 'en_preparacion' | 'en_camino' | 'entregado';
  nro_seguimiento: string | null;
  fyh_despacho: string | null;
  fyh_creacion: string;
  fyh_actualizacion: string;
}

interface EnvioAdminDetalle extends EnvioAdminListItem {
  // datos completos de dirección snapshot
  envio_nombre_direccion: string | null;
  envio_piso: string | null;
  envio_departamento: string | null;
  envio_barrio: string | null;
  envio_codigo_postal: string | null;
  envio_pais: string | null;
  envio_referencia: string | null;
  envio_telefono_contacto: string | null;
  // venta
  total_pagado: number;
  moneda: string;
  metodo_pago: string;
  fyh_venta: string;
  items: Array<{
    nombre_producto: string;
    cantidad: number;
    precio_unitario: number;
  }>;
}

interface ActualizarEstadoEnvioBody {
  estado_envio: 'en_preparacion' | 'en_camino' | 'entregado';
  nro_seguimiento?: string;
}

interface FiltrosEnviosAdmin {
  estado_envio?: 'pendiente' | 'en_preparacion' | 'en_camino' | 'entregado';
  fecha_inicio?: string;   // ISO date string YYYY-MM-DD
  fecha_fin?: string;      // ISO date string YYYY-MM-DD
  search?: string;         // busca por nro_venta (número) o nombre_cliente
  limit?: number;          // default 20, max 100
  offset?: number;         // default 0
}
```

### Modificados

| Archivo | Cambio |
|---------|--------|
| `src/models/Envio.ts` | Renombrar `fecha_despacho` → `fyh_despacho`, agregar `nro_seguimiento` |
| `src/controllers/CarritoController.ts` | `fyh_despacho` en lugar de `fecha_despacho` |
| `src/controllers/AdminVentaController.ts` | `fyh_despacho` en lugar de `fecha_despacho` |
| `src/controllers/VentaController.ts` | `fyh_despacho` en lugar de `fecha_despacho` |
| `src/types/venta.types.ts` | `fyh_despacho` en lugar de `fecha_despacho` |
| `src/services/emailService.ts` | Agregar `sendShippingInTransitEmail()` y `sendShippingDeliveredEmail()` |
| `src/services/index.ts` | Re-exportar las dos nuevas funciones de email |
| `src/index.ts` | Registrar `envioRoutes` bajo `/api/envios` |

### Templates de email

**`sendShippingInTransitEmail()`** — "Tu pedido está en camino"
- Incluye: nro_venta, lista de productos, dirección destino, nro_seguimiento (si existe)

**`sendShippingDeliveredEmail()`** — "Tu pedido fue entregado"
- Incluye: nro_venta, lista de productos, fecha de entrega

---

## Frontend

### Nuevo: `envioAdminService` (`src/services/envioAdminService.ts`)

```typescript
export const envioAdminService = {
  listarEnvios: (filtros: FiltrosEnviosAdmin) => adminApi.get('/envios/admin', { params: filtros }),
  obtenerDetalle: (id: number) => adminApi.get(`/envios/admin/${id}`),
  actualizarEstado: (id: number, body: ActualizarEstadoEnvioBody) =>
    adminApi.patch(`/envios/admin/${id}/estado`, body),
};
```

### Nuevo: `src/types/envio.ts`

Tipos frontend equivalentes a los del backend: `EnvioAdminListItem`, `EnvioAdminDetalle`, `ActualizarEstadoEnvioBody`, `FiltrosEnviosAdmin`.

### Nuevo: `GestionEnvios.tsx`

Componente del contenido del tab "Envíos":
- Filtros: select de `estado_envio`, input de búsqueda, date pickers inicio/fin
- Tabla con columnas: Nro. Venta, Cliente, Dirección destino, Fecha venta, Estado envío, Nro. seguimiento, Acciones
- Badge en el tab con cantidad de envíos en estado `pendiente`
- Solo muestra `tipo_entrega = 'envio'`
- Paginación (20 por página)
- Colores de estado: amarillo (pendiente), azul (en_preparacion), rosa/violeta (en_camino), verde (entregado)

### Nuevo: `GestionEnviosModal.tsx`

Modal "Gestionar envío":
- Muestra datos del cliente y dirección destino
- Historial visual de estados (stepper con checks)
- Botón de acción para avanzar al siguiente estado
- Campo `nro_seguimiento` (opcional) visible solo al pasar a `en_camino`
- Aviso de email en los pasos que lo disparan
- Los envíos ya entregados son solo lectura

### Modificados

| Archivo | Cambio |
|---------|--------|
| `GestionVentas.tsx` | Agregar estado `activeTab`, renderizar tabs y montar `GestionEnvios` |
| `GestionVentas.module.css` | Estilos para `.tabs`, `.tab`, `.tab-active`, `.tab-badge` |
| `src/types/venta.ts` | `fyh_despacho` en lugar de `fecha_despacho` en `EnvioResumen` / `EnvioDireccionResumen` |
| `src/components/admin/GestionVentas/DetalleVentaModal.tsx` | `fyh_despacho` en lugar de `fecha_despacho` |
| `src/components/user/MisCompras/MisCompras.tsx` | `fyh_despacho` en lugar de `fecha_despacho` |
| `src/components/user/MisCompras/FacturaPDF.tsx` | `fyh_despacho` en lugar de `fecha_despacho` |
| `src/types/index.ts` | Agregar `export * from './envio'` |

---

## Flujo completo

```
Admin abre Gestión de Ventas
  → Clickea tab "Envíos"
    → Ve tabla de envíos a domicilio filtrada/paginada
      → Clickea "Gestionar" en un envío
        → Modal muestra stepper de estados
          → Admin avanza estado (+ nro_seguimiento si aplica)
            → PATCH /api/envios/admin/:id/estado
              → Backend actualiza estado_envio
              → Si en_camino o entregado: emailService.send*() (fire-and-forget)
            → Modal se cierra, tabla se refresca
```

---

## Lo que NO incluye este diseño (YAGNI)

- Cálculo dinámico de costo de envío por zona
- Integración API con OCA / Andreani / Correo Argentino
- Generación de etiquetas de envío
- Tracking externo en tiempo real
- Notificaciones push o SMS
- Posibilidad de retroceder estados de envío
- Gestión de devoluciones (existe el modelo `Devolucion` pero es alcance separado)
