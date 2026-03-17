# Gestión de Envíos — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Agregar un tab "Envíos" dentro de GestionVentas del panel admin que permita gestionar el estado de envíos a domicilio con notificación por email al cliente.

**Architecture:** Nuevo `EnvioController` con 3 endpoints REST dedicados al modelo `Envio`, completamente separado de `AdminVentaController`. En el frontend, `GestionVentas` incorpora tabs y monta el nuevo componente `GestionEnvios` con su modal `GestionEnviosModal`.

**Tech Stack:** Node.js + Express + TypeScript + Sequelize (backend), React 18 + TypeScript + CSS Modules (frontend), Nodemailer/Resend (email), adminApi axios instance (frontend)

---

## Mapa de archivos

### Base de datos — nuevo
| Archivo | Responsabilidad |
|---------|----------------|
| `database/migrations/V6__gestion_envios.sql` | Renombrar `fecha_despacho` → `fyh_despacho`, agregar `nro_seguimiento` |

### Backend — nuevos
| Archivo | Responsabilidad |
|---------|----------------|
| `backend/src/types/envio.types.ts` | Interfaces TypeScript para envíos admin |
| `backend/src/controllers/EnvioController.ts` | listarEnvios, obtenerDetalle, actualizarEstado |
| `backend/src/routes/envioRoutes.ts` | GET/PATCH /api/envios/admin |

### Backend — modificados
| Archivo | Cambio |
|---------|--------|
| `backend/src/models/Envio.ts` | Renombrar `fecha_despacho` → `fyh_despacho`, agregar `nro_seguimiento` |
| `backend/src/controllers/CarritoController.ts` | `fyh_despacho` en lugar de `fecha_despacho` |
| `backend/src/controllers/AdminVentaController.ts` | `fyh_despacho` en lugar de `fecha_despacho` |
| `backend/src/controllers/VentaController.ts` | `fyh_despacho` en lugar de `fecha_despacho` |
| `backend/src/types/venta.types.ts` | `fyh_despacho` en lugar de `fecha_despacho` |
| `backend/src/services/emailService.ts` | Agregar `sendShippingInTransitEmail()` y `sendShippingDeliveredEmail()` |
| `backend/src/services/index.ts` | Re-exportar las dos nuevas funciones de email |
| `backend/src/index.ts` | Registrar `envioRoutes` bajo `/api/envios` |

### Frontend — nuevos
| Archivo | Responsabilidad |
|---------|----------------|
| `frontend/src/types/envio.ts` | Tipos frontend para envíos admin |
| `frontend/src/services/envioAdminService.ts` | Llamadas API al EnvioController |
| `frontend/src/components/admin/GestionVentas/GestionEnvios.tsx` | Contenido del tab Envíos (tabla + filtros) |
| `frontend/src/components/admin/GestionVentas/GestionEnviosModal.tsx` | Modal para gestionar estado de un envío |

### Frontend — modificados
| Archivo | Cambio |
|---------|--------|
| `frontend/src/types/venta.ts` | `fyh_despacho` en lugar de `fecha_despacho` |
| `frontend/src/types/index.ts` | `export * from './envio'` |
| `frontend/src/components/admin/GestionVentas/GestionVentas.tsx` | Agregar tabs, montar GestionEnvios |
| `frontend/src/components/admin/GestionVentas/GestionVentas.module.css` | Estilos de tabs |
| `frontend/src/components/admin/GestionVentas/DetalleVentaModal.tsx` | `fyh_despacho` en lugar de `fecha_despacho` |
| `frontend/src/components/user/MisCompras/MisCompras.tsx` | `fyh_despacho` en lugar de `fecha_despacho` |
| `frontend/src/components/user/MisCompras/FacturaPDF.tsx` | `fyh_despacho` en lugar de `fecha_despacho` |

---

## Task 1: Migración de base de datos

> ⚠️ **IMPORTANTE: La ejecución de la migración en la base de datos la realiza el desarrollador manualmente. El agente solo crea el archivo SQL — no ejecuta comandos de base de datos.**

**Files:**
- Create: `database/migrations/V6__gestion_envios.sql`
- Modify: `backend/src/models/Envio.ts`

- [ ] **Step 1: Crear el archivo de migración**

Crear `database/migrations/V6__gestion_envios.sql` siguiendo la convención del proyecto (ver `V5__add_verification_token_expires.sql` como referencia de formato):

```sql
-- V6: Gestión de envíos
-- Renombra fecha_despacho a fyh_despacho (convención fyh_ para timestamps)
-- Agrega campo nro_seguimiento para código de rastreo logístico

ALTER TABLE tb_envios CHANGE fecha_despacho fyh_despacho DATETIME NULL;
ALTER TABLE tb_envios ADD COLUMN nro_seguimiento VARCHAR(100) NULL AFTER estado_envio;
```

- [ ] **Step 2: Commit del archivo de migración**

```bash
git add database/migrations/V6__gestion_envios.sql
git commit -m "chore(db): migración V6 — fyh_despacho y nro_seguimiento en tb_envios"
```

- [ ] **Step 3: 🧑‍💻 ACCIÓN MANUAL — Ejecutar la migración**

> **El desarrollador ejecuta esto personalmente:**
> ```bash
> mysql -u root -p db_tecnocel_v4 < database/migrations/V6__gestion_envios.sql
> ```
> Verificar con: `DESCRIBE tb_envios;` — debe mostrar `fyh_despacho` y `nro_seguimiento`.
> Confirmar cuando esté listo para continuar con los pasos siguientes.

- [ ] **Step 2: Actualizar el modelo Envio.ts**

Abrir `backend/src/models/Envio.ts`. Hacer dos cambios:

**Cambio A — declaración del campo (línea ~22):**
```typescript
// ANTES:
declare fecha_despacho: Date | null;
// DESPUÉS:
declare fyh_despacho: Date | null;
declare nro_seguimiento: string | null;
```

**Cambio B — definición Sequelize (línea ~108):**
```typescript
// ANTES:
fecha_despacho: {
  type: DataTypes.DATE,
  allowNull: true
},
// DESPUÉS:
fyh_despacho: {
  type: DataTypes.DATE,
  allowNull: true
},
nro_seguimiento: {
  type: DataTypes.STRING(100),
  allowNull: true
},
```

- [ ] **Step 3: Propagar el rename a todos los archivos que referencian `fecha_despacho`**

En **`backend/src/controllers/CarritoController.ts`** — buscar `fecha_despacho` y reemplazar por `fyh_despacho`.

En **`backend/src/controllers/AdminVentaController.ts`** — buscar `fecha_despacho` y reemplazar por `fyh_despacho`. Nota: hay dos usos: uno en la respuesta del listado (línea ~274) y otro en la validación de cancelación (línea ~552).

En **`backend/src/controllers/VentaController.ts`** — buscar `fecha_despacho` y reemplazar por `fyh_despacho`.

En **`backend/src/types/venta.types.ts`** — buscar `fecha_despacho` y reemplazar por `fyh_despacho`.

- [ ] **Step 4: Propagar el rename en el frontend**

En **`frontend/src/types/venta.ts`** — buscar `fecha_despacho` y reemplazar por `fyh_despacho`.

En **`frontend/src/components/admin/GestionVentas/DetalleVentaModal.tsx`** — buscar `fecha_despacho` y reemplazar por `fyh_despacho`.

En **`frontend/src/components/user/MisCompras/MisCompras.tsx`** — buscar `fecha_despacho` y reemplazar por `fyh_despacho`.

En **`frontend/src/components/user/MisCompras/FacturaPDF.tsx`** — buscar `fecha_despacho` y reemplazar por `fyh_despacho`.

- [ ] **Step 5: Verificar que el backend compila sin errores**

```bash
cd backend && npm run build
```
Esperado: sin errores TypeScript relacionados a `fecha_despacho`.

- [ ] **Step 6: Commit**

```bash
git add backend/src/models/Envio.ts \
        backend/src/controllers/CarritoController.ts \
        backend/src/controllers/AdminVentaController.ts \
        backend/src/controllers/VentaController.ts \
        backend/src/types/venta.types.ts \
        frontend/src/types/venta.ts \
        frontend/src/components/admin/GestionVentas/DetalleVentaModal.tsx \
        frontend/src/components/user/MisCompras/MisCompras.tsx \
        frontend/src/components/user/MisCompras/FacturaPDF.tsx
git commit -m "refactor: renombrar fecha_despacho a fyh_despacho y agregar nro_seguimiento"
```

---

## Task 2: Tipos TypeScript del backend para envíos

**Files:**
- Create: `backend/src/types/envio.types.ts`

- [ ] **Step 1: Crear el archivo de tipos**

Crear `backend/src/types/envio.types.ts`:

```typescript
export interface EnvioAdminListItem {
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

export interface EnvioAdminDetalle extends EnvioAdminListItem {
  envio_nombre_direccion: string | null;
  envio_piso: string | null;
  envio_departamento: string | null;
  envio_barrio: string | null;
  envio_codigo_postal: string | null;
  envio_pais: string | null;
  envio_referencia: string | null;
  envio_telefono_contacto: string | null;
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

export interface ActualizarEstadoEnvioBody {
  estado_envio: 'en_preparacion' | 'en_camino' | 'entregado';
  nro_seguimiento?: string;
}

export interface FiltrosEnviosAdmin {
  estado_envio?: 'pendiente' | 'en_preparacion' | 'en_camino' | 'entregado';
  fecha_inicio?: string;
  fecha_fin?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

// Mapa de transiciones válidas (solo avanzar, secuencial)
export const TRANSICIONES_ENVIO: Record<string, string> = {
  pendiente: 'en_preparacion',
  en_preparacion: 'en_camino',
  en_camino: 'entregado',
};
```

- [ ] **Step 2: Verificar que compila**

```bash
cd backend && npx tsc --noEmit
```
Esperado: sin errores.

- [ ] **Step 3: Commit**

```bash
git add backend/src/types/envio.types.ts
git commit -m "feat(envios): agregar tipos TypeScript para EnvioController"
```

---

## Task 3: Templates de email para cambios de estado de envío

**Files:**
- Modify: `backend/src/services/emailService.ts`
- Modify: `backend/src/services/index.ts`

- [ ] **Step 1: Revisar la estructura de los emails existentes**

Leer `backend/src/services/emailService.ts` para entender el patrón usado (estructura HTML, firma, colores). Buscar la función `sendOrderConfirmationEmail` como referencia de formato.

- [ ] **Step 2: Agregar `sendShippingInTransitEmail` al final del archivo**

```typescript
export async function sendShippingInTransitEmail(
  email: string,
  data: {
    nombre_cliente: string;
    nro_venta: string;
    nro_seguimiento?: string | null;
    direccion_destino: string;
    items: Array<{ nombre: string; cantidad: number }>;
  }
): Promise<void> {
  const itemsHtml = data.items
    .map(i => `<li>${i.cantidad}x ${i.nombre}</li>`)
    .join('');

  const seguimientoHtml = data.nro_seguimiento
    ? `<p><strong>Número de seguimiento:</strong> <code>${data.nro_seguimiento}</code></p>`
    : '';

  const html = `
    <h2>¡Tu pedido está en camino!</h2>
    <p>Hola ${data.nombre_cliente},</p>
    <p>Tu pedido <strong>${data.nro_venta}</strong> ha sido despachado y está en camino.</p>
    ${seguimientoHtml}
    <p><strong>Dirección de entrega:</strong> ${data.direccion_destino}</p>
    <h4>Productos:</h4>
    <ul>${itemsHtml}</ul>
    <p>Te avisaremos cuando sea entregado.</p>
    <p>¡Gracias por tu compra!</p>
  `;

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to: email,
    subject: `Tu pedido ${data.nro_venta} está en camino 🚚`,
    html,
  });
}
```

Nota: usar el mismo `transporter` que el resto de las funciones del archivo. Si el archivo usa Resend u otro proveedor, adaptar al mismo patrón existente.

- [ ] **Step 3: Agregar `sendShippingDeliveredEmail` al final del archivo**

```typescript
export async function sendShippingDeliveredEmail(
  email: string,
  data: {
    nombre_cliente: string;
    nro_venta: string;
    fecha_entrega: string;
    items: Array<{ nombre: string; cantidad: number }>;
  }
): Promise<void> {
  const itemsHtml = data.items
    .map(i => `<li>${i.cantidad}x ${i.nombre}</li>`)
    .join('');

  const html = `
    <h2>¡Tu pedido fue entregado!</h2>
    <p>Hola ${data.nombre_cliente},</p>
    <p>Tu pedido <strong>${data.nro_venta}</strong> fue entregado el ${data.fecha_entrega}.</p>
    <h4>Productos entregados:</h4>
    <ul>${itemsHtml}</ul>
    <p>Esperamos que disfrutes tu compra. Si tenés algún problema, no dudes en contactarnos.</p>
    <p>¡Gracias por elegir TecnoCel!</p>
  `;

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to: email,
    subject: `Tu pedido ${data.nro_venta} fue entregado ✅`,
    html,
  });
}
```

- [ ] **Step 4: Agregar re-exports en `backend/src/services/index.ts`**

Agregar las dos nuevas funciones al bloque de exports de `emailService.js`:

```typescript
export {
  sendVerificationEmail,
  sendResetPasswordEmail,
  sendWelcomeEmail,
  sendOrderConfirmationEmail,
  sendCancellationEmail,
  sendOrderStatusEmail,
  sendCommentReplyEmail,
  sendShippingInTransitEmail,   // nueva
  sendShippingDeliveredEmail,   // nueva
} from './emailService.js';
```

- [ ] **Step 5: Verificar que compila**

```bash
cd backend && npx tsc --noEmit
```

- [ ] **Step 6: Commit**

```bash
git add backend/src/services/emailService.ts backend/src/services/index.ts
git commit -m "feat(envios): agregar templates de email para estado en_camino y entregado"
```

---

## Task 4: EnvioController

**Files:**
- Create: `backend/src/controllers/EnvioController.ts`

- [ ] **Step 1: Crear el controlador**

Crear `backend/src/controllers/EnvioController.ts`:

```typescript
import type { Request, Response } from 'express';
import { Op } from 'sequelize';
import Envio from '../models/Envio.js';
import Venta from '../models/Venta.js';
import VentaItem from '../models/VentaItem.js';
import Cliente from '../models/Cliente.js';
import Almacen from '../models/Almacen.js';
import logger from '../services/loggerService.js';
import { sendShippingInTransitEmail, sendShippingDeliveredEmail } from '../services/emailService.js';
import type {
  EnvioAdminListItem,
  EnvioAdminDetalle,
  ActualizarEstadoEnvioBody,
  FiltrosEnviosAdmin,
} from '../types/envio.types.js';
import { TRANSICIONES_ENVIO as TRANS } from '../types/envio.types.js';

export class EnvioController {

  // GET /api/envios/admin
  static async listarEnvios(req: Request, res: Response) {
    try {
      const {
        estado_envio,
        fecha_inicio,
        fecha_fin,
        search,
        limit = 20,
        offset = 0,
      } = req.query as unknown as FiltrosEnviosAdmin;

      const limitNum = Math.min(Number(limit), 100);
      const offsetNum = Number(offset);

      // Construir WHERE para Envio
      const whereEnvio: Record<string, unknown> = {
        tipo_entrega: 'envio',
      };
      if (estado_envio) whereEnvio['estado_envio'] = estado_envio;

      // Construir WHERE para Venta (por fecha)
      const whereVenta: Record<string, unknown> = {};
      if (fecha_inicio || fecha_fin) {
        const rango: Record<string, unknown> = {};
        if (fecha_inicio) rango[Op.gte as unknown as string] = new Date(fecha_inicio);
        if (fecha_fin)    rango[Op.lte as unknown as string] = new Date(fecha_fin + 'T23:59:59');
        whereVenta['fyh_creacion'] = rango;
      }

      // Construir WHERE para Cliente (por nombre) o Venta (por nro_venta)
      const includeCliente: Record<string, unknown> = {
        model: Cliente,
        attributes: ['nombre_cliente', 'apellido_cliente', 'email_cliente'],
        required: false,
      };
      if (search) {
        const nroNum = parseInt(search as string);
        if (!isNaN(nroNum)) {
          whereVenta['nro_venta'] = nroNum;
        } else {
          includeCliente['where'] = {
            [Op.or]: [
              { nombre_cliente: { [Op.like]: `%${search}%` } },
              { apellido_cliente: { [Op.like]: `%${search}%` } },
            ],
          };
          includeCliente['required'] = true;
        }
      }

      const { count, rows } = await Envio.findAndCountAll({
        where: whereEnvio,
        include: [
          {
            model: Venta,
            attributes: ['nro_venta', 'fyh_creacion'],
            where: Object.keys(whereVenta).length ? whereVenta : undefined,
            required: true,
            include: [includeCliente as never],
          },
        ],
        limit: limitNum,
        offset: offsetNum,
        order: [['fyh_creacion', 'DESC']],
      });

      const items: EnvioAdminListItem[] = rows.map(envio => {
        const e = envio.toJSON() as Record<string, unknown>;
        const venta = e['Venta'] as Record<string, unknown>;
        const cliente = venta?.['Cliente'] as Record<string, unknown> | undefined;
        const nombre = cliente
          ? `${cliente['nombre_cliente'] ?? ''} ${cliente['apellido_cliente'] ?? ''}`.trim()
          : null;
        return {
          id_envio: e['id_envio'] as number,
          id_venta: e['id_venta'] as number,
          nro_venta: venta?.['nro_venta'] as number,
          nombre_cliente: nombre || null,
          email_cliente: cliente?.['email_cliente'] as string ?? null,
          envio_calle: e['envio_calle'] as string | null,
          envio_numero: e['envio_numero'] as string | null,
          envio_ciudad: e['envio_ciudad'] as string | null,
          envio_provincia: e['envio_provincia'] as string | null,
          estado_envio: e['estado_envio'] as EnvioAdminListItem['estado_envio'],
          nro_seguimiento: e['nro_seguimiento'] as string | null,
          fyh_despacho: e['fyh_despacho'] ? String(e['fyh_despacho']) : null,
          fyh_creacion: String(e['fyh_creacion']),
          fyh_actualizacion: String(e['fyh_actualizacion']),
        };
      });

      return res.status(200).json({ success: true, data: items, total: count, limit: limitNum, offset: offsetNum });
    } catch (error) {
      logger.error('Error en listarEnvios:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // GET /api/envios/admin/:id_envio
  static async obtenerDetalle(req: Request, res: Response) {
    try {
      const idEnvio = parseInt(req.params['id_envio']);
      if (isNaN(idEnvio)) return res.status(400).json({ error: 'ID inválido' });

      const envio = await Envio.findByPk(idEnvio, {
        include: [
          {
            model: Venta,
            attributes: ['nro_venta', 'total_pagado', 'moneda', 'metodo_pago', 'fyh_creacion'],
            include: [
              {
                model: Cliente,
                attributes: ['nombre_cliente', 'apellido_cliente', 'email_cliente'],
                required: false,
              },
              {
                model: VentaItem,
                include: [{ model: Almacen, attributes: ['nombre_producto'] }],
              },
            ],
          },
        ],
      });

      if (!envio) return res.status(404).json({ error: 'Envío no encontrado' });

      const e = envio.toJSON() as Record<string, unknown>;
      const venta = e['Venta'] as Record<string, unknown>;
      const cliente = venta?.['Cliente'] as Record<string, unknown> | undefined;
      const ventaItems = (venta?.['VentaItems'] ?? []) as Array<Record<string, unknown>>;
      const nombre = cliente
        ? `${cliente['nombre_cliente'] ?? ''} ${cliente['apellido_cliente'] ?? ''}`.trim()
        : null;

      const detalle: EnvioAdminDetalle = {
        id_envio: e['id_envio'] as number,
        id_venta: e['id_venta'] as number,
        nro_venta: venta?.['nro_venta'] as number,
        nombre_cliente: nombre || null,
        email_cliente: cliente?.['email_cliente'] as string ?? null,
        envio_calle: e['envio_calle'] as string | null,
        envio_numero: e['envio_numero'] as string | null,
        envio_ciudad: e['envio_ciudad'] as string | null,
        envio_provincia: e['envio_provincia'] as string | null,
        estado_envio: e['estado_envio'] as EnvioAdminDetalle['estado_envio'],
        nro_seguimiento: e['nro_seguimiento'] as string | null,
        fyh_despacho: e['fyh_despacho'] ? String(e['fyh_despacho']) : null,
        fyh_creacion: String(e['fyh_creacion']),
        fyh_actualizacion: String(e['fyh_actualizacion']),
        envio_nombre_direccion: e['envio_nombre_direccion'] as string | null,
        envio_piso: e['envio_piso'] as string | null,
        envio_departamento: e['envio_departamento'] as string | null,
        envio_barrio: e['envio_barrio'] as string | null,
        envio_codigo_postal: e['envio_codigo_postal'] as string | null,
        envio_pais: e['envio_pais'] as string | null,
        envio_referencia: e['envio_referencia'] as string | null,
        envio_telefono_contacto: e['envio_telefono_contacto'] as string | null,
        total_pagado: venta?.['total_pagado'] as number,
        moneda: venta?.['moneda'] as string,
        metodo_pago: venta?.['metodo_pago'] as string,
        fyh_venta: String(venta?.['fyh_creacion']),
        items: ventaItems.map(item => {
          const almacen = item['Almacen'] as Record<string, unknown> | undefined;
          return {
            nombre_producto: almacen?.['nombre_producto'] as string ?? 'Producto',
            cantidad: item['cantidad'] as number,
            precio_unitario: item['precio_unitario'] as number,
          };
        }),
      };

      return res.status(200).json({ success: true, data: detalle });
    } catch (error) {
      logger.error('Error en obtenerDetalle (envio):', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // PATCH /api/envios/admin/:id_envio/estado
  static async actualizarEstado(req: Request, res: Response) {
    try {
      const idEnvio = parseInt(req.params['id_envio']);
      if (isNaN(idEnvio)) return res.status(400).json({ error: 'ID inválido' });

      const { estado_envio, nro_seguimiento } = req.body as ActualizarEstadoEnvioBody;

      const estadosValidos = ['en_preparacion', 'en_camino', 'entregado'] as const;
      if (!estadosValidos.includes(estado_envio)) {
        return res.status(400).json({ error: `Estado inválido. Valores permitidos: ${estadosValidos.join(', ')}` });
      }

      const envio = await Envio.findByPk(idEnvio, {
        include: [
          {
            model: Venta,
            attributes: ['nro_venta', 'fyh_creacion'],
            include: [
              { model: Cliente, attributes: ['nombre_cliente', 'apellido_cliente', 'email_cliente'], required: false },
              { model: VentaItem, include: [{ model: Almacen, attributes: ['nombre_producto'] }] },
            ],
          },
        ],
      });

      if (!envio) return res.status(404).json({ error: 'Envío no encontrado' });

      // Validar transición secuencial
      const transicionEsperada = TRANS[envio.estado_envio];
      if (transicionEsperada !== estado_envio) {
        return res.status(400).json({
          error: `Transición inválida: de '${envio.estado_envio}' solo se puede pasar a '${transicionEsperada}'`,
        });
      }

      // Preparar campos a actualizar
      const campos: Record<string, unknown> = {
        estado_envio,
        fyh_actualizacion: new Date(),
      };
      if (estado_envio === 'en_camino') {
        campos['fyh_despacho'] = new Date();
        if (nro_seguimiento) campos['nro_seguimiento'] = nro_seguimiento.trim();
      }

      await envio.update(campos);

      logger.info('Estado de envío actualizado', { id_envio: idEnvio, estado_envio, id_usuario: req.usuario?.id });

      // Enviar email (fire-and-forget) si aplica
      if (estado_envio === 'en_camino' || estado_envio === 'entregado') {
        const e = envio.toJSON() as Record<string, unknown>;
        const venta = e['Venta'] as Record<string, unknown>;
        const cliente = venta?.['Cliente'] as Record<string, unknown> | undefined;
        const ventaItems = (venta?.['VentaItems'] ?? []) as Array<Record<string, unknown>>;

        if (cliente?.['email_cliente']) {
          const emailCliente = String(cliente['email_cliente']);
          const nombreCliente = `${cliente['nombre_cliente'] ?? ''} ${cliente['apellido_cliente'] ?? ''}`.trim();
          const nroVenta = `V-${String(venta?.['nro_venta']).padStart(5, '0')}`;
          const items = ventaItems.map(item => {
            const almacen = (item['Almacen'] ?? {}) as Record<string, unknown>;
            return { nombre: String(almacen['nombre_producto'] ?? 'Producto'), cantidad: item['cantidad'] as number };
          });

          if (estado_envio === 'en_camino') {
            const direccion = [e['envio_calle'], e['envio_numero'], e['envio_ciudad'], e['envio_provincia']]
              .filter(Boolean).join(', ');
            sendShippingInTransitEmail(emailCliente, {
              nombre_cliente: nombreCliente,
              nro_venta: nroVenta,
              nro_seguimiento: nro_seguimiento ?? null,
              direccion_destino: direccion,
              items,
            }).catch(err => logger.error('Error enviando email en_camino:', { error: err.message }));
          } else {
            const fechaEntrega = new Date().toLocaleString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
            sendShippingDeliveredEmail(emailCliente, {
              nombre_cliente: nombreCliente,
              nro_venta: nroVenta,
              fecha_entrega: fechaEntrega,
              items,
            }).catch(err => logger.error('Error enviando email entregado:', { error: err.message }));
          }
        }
      }

      return res.status(200).json({ success: true, mensaje: `Estado actualizado a: ${estado_envio}` });
    } catch (error) {
      logger.error('Error en actualizarEstado (envio):', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
}
```

- [ ] **Step 2: Verificar que compila**

```bash
cd backend && npx tsc --noEmit
```
Esperado: sin errores.

- [ ] **Step 3: Commit**

```bash
git add backend/src/controllers/EnvioController.ts
git commit -m "feat(envios): agregar EnvioController con listarEnvios, obtenerDetalle y actualizarEstado"
```

---

## Task 5: Rutas del backend y registro en index.ts

**Files:**
- Create: `backend/src/routes/envioRoutes.ts`
- Modify: `backend/src/index.ts`

- [ ] **Step 1: Crear `envioRoutes.ts`**

Primero, leer `backend/src/routes/ventaRoutes.ts` para ver el patrón exacto de importaciones y estructura.

Luego crear `backend/src/routes/envioRoutes.ts`:

```typescript
import { Router } from 'express';
import { EnvioController } from '../controllers/EnvioController.js';
import { verificarToken, verificarRol } from '../middleware/authMiddleware.js';
import { ROLES } from '../constants/roles.js';

const router = Router();

// Todas las rutas requieren autenticación de usuario del sistema
router.use(verificarToken);
router.use(verificarRol([ROLES.ADMIN, ROLES.GERENTE, ROLES.VENDEDOR]));

router.get('/admin', EnvioController.listarEnvios.bind(EnvioController));
router.get('/admin/:id_envio', EnvioController.obtenerDetalle.bind(EnvioController));
router.patch('/admin/:id_envio/estado', EnvioController.actualizarEstado.bind(EnvioController));

export default router;
```

Nota: el path `../constants/roles.js` es el correcto — confirmado con otras rutas del proyecto.

- [ ] **Step 2: Registrar las rutas en `backend/src/index.ts`**

Leer `backend/src/index.ts` para ver dónde se registran las rutas (buscar `app.use('/api/ventas'` como referencia). Agregar:

```typescript
import envioRoutes from './routes/envioRoutes.js';
// ...
app.use('/api/envios', envioRoutes);
```

- [ ] **Step 3: Verificar que el backend levanta sin errores**

```bash
cd backend && npm run dev
```
Esperado: servidor levanta en puerto 3000 sin errores.

- [ ] **Step 4: Probar el endpoint manualmente**

Con el backend corriendo, probar con curl o REST Client:

```bash
# Debe retornar lista de envíos (array vacío si no hay datos)
curl -H "Authorization: Bearer <admin_token>" http://localhost:3000/api/envios/admin
```
Esperado: `{ success: true, data: [...], total: N }`

- [ ] **Step 5: Commit**

```bash
git add backend/src/routes/envioRoutes.ts backend/src/index.ts
git commit -m "feat(envios): registrar EnvioController en rutas /api/envios"
```

---

## Task 6: Tipos y servicio frontend

**Files:**
- Create: `frontend/src/types/envio.ts`
- Modify: `frontend/src/types/index.ts`
- Create: `frontend/src/services/envioAdminService.ts`

- [ ] **Step 1: Crear `frontend/src/types/envio.ts`**

```typescript
export type EstadoEnvio = 'pendiente' | 'en_preparacion' | 'en_camino' | 'entregado';

export interface EnvioAdminListItem {
  id_envio: number;
  id_venta: number;
  nro_venta: number;
  nombre_cliente: string | null;
  email_cliente: string | null;
  envio_calle: string | null;
  envio_numero: string | null;
  envio_ciudad: string | null;
  envio_provincia: string | null;
  estado_envio: EstadoEnvio;
  nro_seguimiento: string | null;
  fyh_despacho: string | null;
  fyh_creacion: string;
  fyh_actualizacion: string;
}

export interface EnvioAdminDetalle extends EnvioAdminListItem {
  envio_nombre_direccion: string | null;
  envio_piso: string | null;
  envio_departamento: string | null;
  envio_barrio: string | null;
  envio_codigo_postal: string | null;
  envio_pais: string | null;
  envio_referencia: string | null;
  envio_telefono_contacto: string | null;
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

export interface ActualizarEstadoEnvioBody {
  estado_envio: 'en_preparacion' | 'en_camino' | 'entregado';
  nro_seguimiento?: string;
}

export interface FiltrosEnviosAdmin {
  estado_envio?: EstadoEnvio;
  fecha_inicio?: string;
  fecha_fin?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface ListarEnviosResponse {
  success: boolean;
  data: EnvioAdminListItem[];
  total: number;
  limit: number;
  offset: number;
}

// Etiquetas de display para estados
export const ESTADO_ENVIO_LABELS: Record<EstadoEnvio, string> = {
  pendiente: 'Pendiente',
  en_preparacion: 'En preparación',
  en_camino: 'En camino',
  entregado: 'Entregado',
};

// Siguiente estado para el stepper
export const SIGUIENTE_ESTADO: Partial<Record<EstadoEnvio, Exclude<EstadoEnvio, 'pendiente'>>> = {
  pendiente: 'en_preparacion',
  en_preparacion: 'en_camino',
  en_camino: 'entregado',
};
```

- [ ] **Step 2: Agregar re-export en `frontend/src/types/index.ts`**

Agregar al final del archivo:
```typescript
// Exportar tipos de envíos (admin)
export * from './envio';
```

- [ ] **Step 3: Crear `frontend/src/services/envioAdminService.ts`**

Leer `frontend/src/services/ventaAdminService.ts` para ver el patrón exacto. Luego:

```typescript
import adminApi from '../api/axiosAdminConfig';
import type {
  ListarEnviosResponse,
  EnvioAdminDetalle,
  FiltrosEnviosAdmin,
  ActualizarEstadoEnvioBody,
} from '../types/envio';

export const envioAdminService = {
  listarEnvios: async (filtros: FiltrosEnviosAdmin = {}): Promise<ListarEnviosResponse> => {
    const { data } = await adminApi.get('/envios/admin', { params: filtros });
    return data;
  },

  obtenerDetalle: async (id: number): Promise<EnvioAdminDetalle> => {
    const { data } = await adminApi.get(`/envios/admin/${id}`);
    return data.data;
  },

  actualizarEstado: async (id: number, body: ActualizarEstadoEnvioBody): Promise<void> => {
    await adminApi.patch(`/envios/admin/${id}/estado`, body);
  },
};
```

- [ ] **Step 4: Verificar que el frontend compila**

```bash
cd frontend && npm run build
```
Esperado: sin errores TypeScript.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/types/envio.ts \
        frontend/src/types/index.ts \
        frontend/src/services/envioAdminService.ts
git commit -m "feat(envios): agregar tipos y servicio frontend para gestión de envíos"
```

---

## Task 7: Componente GestionEnvios (tabla + filtros)

**Files:**
- Create: `frontend/src/components/admin/GestionVentas/GestionEnvios.tsx`

- [ ] **Step 1: Leer GestionVentas.tsx para entender el patrón de componentes existente**

Leer `frontend/src/components/admin/GestionVentas/GestionVentas.tsx` completo para entender la estructura, cómo se manejan los estados de carga, error, paginación y filtros. Seguir el mismo estilo.

- [ ] **Step 2: Crear `GestionEnvios.tsx`**

```typescript
import React, { useState, useCallback, useEffect, useRef, memo } from 'react';
import styles from './GestionVentas.module.css';
import { useNotification } from '../../../contexts/NotificationContext';
import { envioAdminService } from '../../../services/envioAdminService';
import type { EnvioAdminListItem, FiltrosEnviosAdmin, EstadoEnvio } from '../../../types/envio';
import { ESTADO_ENVIO_LABELS } from '../../../types/envio';
import GestionEnviosModal from './GestionEnviosModal';

const LIMIT = 20;

const formatFecha = (iso: string) =>
  new Date(iso).toLocaleString('es-AR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

const ESTADO_COLORS: Record<EstadoEnvio, string> = {
  pendiente: styles.estadoPendiente,
  en_preparacion: styles.estadoEnPreparacion,
  en_camino: styles.estadoEnCamino,
  entregado: styles.estadoEntregado,
};

interface GestionEnviosProps {
  /** Callback para refrescar el badge de pendientes en el tab */
  onPendientesChange?: (count: number) => void;
}

const GestionEnvios: React.FC<GestionEnviosProps> = memo(({ onPendientesChange }) => {
  const { showNotification } = useNotification();

  const [envios, setEnvios] = useState<EnvioAdminListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);

  const [filtrosTmp, setFiltrosTmp] = useState<FiltrosEnviosAdmin>({});
  const [filtros, setFiltros] = useState<FiltrosEnviosAdmin>({});

  const [envioSeleccionado, setEnvioSeleccionado] = useState<EnvioAdminListItem | null>(null);

  const cargandoRef = useRef(false);

  const cargarEnvios = useCallback(async (f: FiltrosEnviosAdmin, off: number) => {
    if (cargandoRef.current) return;
    cargandoRef.current = true;
    setCargando(true);
    setError(null);
    try {
      const result = await envioAdminService.listarEnvios({ ...f, limit: LIMIT, offset: off });
      setEnvios(result.data);
      setTotal(result.total);

      // Calcular total de pendientes para el badge del tab (consulta separada para obtener el total real)
      if (!f.estado_envio) {
        envioAdminService.listarEnvios({ estado_envio: 'pendiente', limit: 1, offset: 0 })
          .then(r => onPendientesChange?.(r.total))
          .catch(() => {/* no crítico */});
      }
    } catch {
      setError('Error al cargar los envíos');
    } finally {
      setCargando(false);
      cargandoRef.current = false;
    }
  }, [onPendientesChange]);

  useEffect(() => {
    cargarEnvios(filtros, offset);
  }, [filtros, offset, cargarEnvios]);

  const aplicarFiltros = () => {
    setOffset(0);
    setFiltros(filtrosTmp);
  };

  const limpiarFiltros = () => {
    setFiltrosTmp({});
    setOffset(0);
    setFiltros({});
  };

  const handleEstadoActualizado = () => {
    setEnvioSeleccionado(null);
    cargarEnvios(filtros, offset);
  };

  const totalPages = Math.ceil(total / LIMIT);
  const currentPage = Math.floor(offset / LIMIT) + 1;

  if (error) {
    return <div className={styles.errorMsg}>{error}</div>;
  }

  return (
    <div>
      {/* Filtros */}
      <div className={styles.filtrosBar}>
        <select
          value={filtrosTmp.estado_envio ?? ''}
          onChange={e => setFiltrosTmp(prev => ({ ...prev, estado_envio: (e.target.value as EstadoEnvio) || undefined }))}
          className={styles.filtroSelect}
        >
          <option value="">Todos los estados</option>
          {(Object.keys(ESTADO_ENVIO_LABELS) as EstadoEnvio[]).map(est => (
            <option key={est} value={est}>{ESTADO_ENVIO_LABELS[est]}</option>
          ))}
        </select>

        <input
          type="text"
          placeholder="Buscar por nro. venta o cliente..."
          value={filtrosTmp.search ?? ''}
          onChange={e => setFiltrosTmp(prev => ({ ...prev, search: e.target.value || undefined }))}
          className={styles.filtroInput}
        />

        <input
          type="date"
          value={filtrosTmp.fecha_inicio ?? ''}
          onChange={e => setFiltrosTmp(prev => ({ ...prev, fecha_inicio: e.target.value || undefined }))}
          className={styles.filtroFecha}
        />
        <input
          type="date"
          value={filtrosTmp.fecha_fin ?? ''}
          onChange={e => setFiltrosTmp(prev => ({ ...prev, fecha_fin: e.target.value || undefined }))}
          className={styles.filtroFecha}
        />

        <button onClick={aplicarFiltros} className={styles.btnFiltrar}>Filtrar</button>
        <button onClick={limpiarFiltros} className={styles.btnLimpiar}>Limpiar</button>
      </div>

      {/* Tabla */}
      {cargando ? (
        <div className={styles.loadingMsg}>Cargando envíos...</div>
      ) : envios.length === 0 ? (
        <div className={styles.emptyMsg}>No se encontraron envíos.</div>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.tabla}>
            <thead>
              <tr>
                <th>Nro. Venta</th>
                <th>Cliente</th>
                <th>Dirección destino</th>
                <th>Fecha venta</th>
                <th>Estado envío</th>
                <th>Nro. seguimiento</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {envios.map(envio => (
                <tr key={envio.id_envio}>
                  <td><strong>#{envio.nro_venta}</strong></td>
                  <td>{envio.nombre_cliente ?? <em className={styles.sinDatos}>Sin cliente</em>}</td>
                  <td className={styles.direccion}>
                    {[envio.envio_calle, envio.envio_numero, envio.envio_ciudad, envio.envio_provincia]
                      .filter(Boolean).join(', ') || '—'}
                  </td>
                  <td>{formatFecha(envio.fyh_creacion)}</td>
                  <td>
                    <span className={`${styles.estadoBadge} ${ESTADO_COLORS[envio.estado_envio]}`}>
                      {ESTADO_ENVIO_LABELS[envio.estado_envio]}
                    </span>
                  </td>
                  <td className={styles.nroSeguimiento}>
                    {envio.nro_seguimiento ?? <em className={styles.sinDatos}>—</em>}
                  </td>
                  <td>
                    <button
                      className={envio.estado_envio === 'entregado' ? styles.btnSecundario : styles.btnPrimario}
                      onClick={() => setEnvioSeleccionado(envio)}
                    >
                      {envio.estado_envio === 'entregado' ? 'Ver detalle' : 'Gestionar'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Paginación */}
      {total > LIMIT && (
        <div className={styles.paginacion}>
          <span>Página {currentPage} de {totalPages} ({total} envíos)</span>
          <div className={styles.paginacionBtns}>
            <button
              disabled={offset === 0}
              onClick={() => setOffset(Math.max(0, offset - LIMIT))}
              className={styles.btnPag}
            >← Anterior</button>
            <button
              disabled={offset + LIMIT >= total}
              onClick={() => setOffset(offset + LIMIT)}
              className={styles.btnPag}
            >Siguiente →</button>
          </div>
        </div>
      )}

      {/* Modal */}
      {envioSeleccionado && (
        <GestionEnviosModal
          envio={envioSeleccionado}
          onClose={() => setEnvioSeleccionado(null)}
          onActualizado={handleEstadoActualizado}
        />
      )}
    </div>
  );
});

export default GestionEnvios;
```

- [ ] **Step 3: Verificar que el frontend compila**

```bash
cd frontend && npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/admin/GestionVentas/GestionEnvios.tsx
git commit -m "feat(envios): agregar componente GestionEnvios con tabla y filtros"
```

---

## Task 8: Modal GestionEnviosModal

**Files:**
- Create: `frontend/src/components/admin/GestionVentas/GestionEnviosModal.tsx`

- [ ] **Step 1: Crear `GestionEnviosModal.tsx`**

```typescript
import React, { useState, useEffect, memo } from 'react';
import styles from './GestionVentas.module.css';
import { useNotification } from '../../../contexts/NotificationContext';
import { envioAdminService } from '../../../services/envioAdminService';
import type { EnvioAdminListItem, EnvioAdminDetalle, EstadoEnvio } from '../../../types/envio';
import { ESTADO_ENVIO_LABELS, SIGUIENTE_ESTADO } from '../../../types/envio';

const PASOS: EstadoEnvio[] = ['pendiente', 'en_preparacion', 'en_camino', 'entregado'];

const ESTADOS_CON_EMAIL: EstadoEnvio[] = ['en_camino', 'entregado'];

interface GestionEnviosModalProps {
  envio: EnvioAdminListItem;
  onClose: () => void;
  onActualizado: () => void;
}

const GestionEnviosModal: React.FC<GestionEnviosModalProps> = memo(({ envio, onClose, onActualizado }) => {
  const { showNotification } = useNotification();
  const [detalle, setDetalle] = useState<EnvioAdminDetalle | null>(null);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [nroSeguimiento, setNroSeguimiento] = useState('');

  const siguienteEstado = SIGUIENTE_ESTADO[envio.estado_envio];

  useEffect(() => {
    envioAdminService.obtenerDetalle(envio.id_envio)
      .then(data => setDetalle(data))
      .catch(() => showNotification('Error al cargar detalle del envío', 'error'))
      .finally(() => setCargando(false));
  }, [envio.id_envio, showNotification]);

  const handleAvanzar = async () => {
    if (!siguienteEstado) return;
    setGuardando(true);
    try {
      await envioAdminService.actualizarEstado(envio.id_envio, {
        estado_envio: siguienteEstado,
        nro_seguimiento: nroSeguimiento.trim() || undefined,
      });
      showNotification(`Estado actualizado a: ${ESTADO_ENVIO_LABELS[siguienteEstado]}`, 'success');
      onActualizado();
    } catch {
      showNotification('Error al actualizar el estado del envío', 'error');
    } finally {
      setGuardando(false);
    }
  };

  const pasoActualIndex = PASOS.indexOf(envio.estado_envio);
  const enviaEmail = siguienteEstado && ESTADOS_CON_EMAIL.includes(siguienteEstado);

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3>Gestionar Envío — Venta #{envio.nro_venta}</h3>
          <button onClick={onClose} className={styles.btnCerrar}>✕</button>
        </div>

        {cargando ? (
          <div className={styles.loadingMsg}>Cargando...</div>
        ) : detalle ? (
          <div className={styles.modalBody}>
            {/* Datos del envío */}
            <div className={styles.infoBlock}>
              <div className={styles.infoLabel}>DATOS DEL ENVÍO</div>
              <div className={styles.infoContent}>
                <div><strong>Cliente:</strong> {detalle.nombre_cliente ?? 'Sin cliente'}</div>
                <div><strong>Dirección:</strong> {[detalle.envio_calle, detalle.envio_numero, detalle.envio_ciudad, detalle.envio_provincia].filter(Boolean).join(', ') || '—'}</div>
                {detalle.envio_piso && <div><strong>Piso/Depto:</strong> {detalle.envio_piso} {detalle.envio_departamento}</div>}
                {detalle.envio_referencia && <div><strong>Referencia:</strong> {detalle.envio_referencia}</div>}
                {detalle.envio_telefono_contacto && <div><strong>Tel. contacto:</strong> {detalle.envio_telefono_contacto}</div>}
                <div><strong>Fecha venta:</strong> {new Date(detalle.fyh_venta).toLocaleString('es-AR')}</div>
              </div>
            </div>

            {/* Stepper de estados */}
            <div className={styles.infoBlock}>
              <div className={styles.infoLabel}>HISTORIAL</div>
              <div className={styles.stepper}>
                {PASOS.map((paso, i) => {
                  const completado = i <= pasoActualIndex;
                  const esActual = i === pasoActualIndex;
                  return (
                    <div key={paso} className={`${styles.stepperItem} ${completado ? styles.stepperCompleto : styles.stepperPendiente}`}>
                      <div className={`${styles.stepperCirculo} ${esActual ? styles.stepperActual : ''}`}>
                        {completado ? '✓' : i + 1}
                      </div>
                      <span>{ESTADO_ENVIO_LABELS[paso]}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Campo nro seguimiento (solo al avanzar a en_camino) */}
            {siguienteEstado === 'en_camino' && (
              <div className={styles.infoBlock}>
                <label className={styles.fieldLabel}>
                  Número de seguimiento <span className={styles.opcional}>(opcional)</span>
                </label>
                <input
                  type="text"
                  className={styles.inputField}
                  placeholder="Ej: OCA-2984710, AND-9023841..."
                  value={nroSeguimiento}
                  onChange={e => setNroSeguimiento(e.target.value)}
                />
                <div className={styles.fieldHint}>El cliente podrá ver este código en el historial de sus compras.</div>
              </div>
            )}

            {/* Aviso de email */}
            {enviaEmail && siguienteEstado && (
              <div className={styles.avisoEmail}>
                📧 Se enviará un email automático a <strong>{detalle.nombre_cliente}</strong> notificando que su pedido {siguienteEstado === 'en_camino' ? 'está en camino' : 'fue entregado'}.
              </div>
            )}

            {/* Botón de acción */}
            {siguienteEstado ? (
              <button
                className={styles.btnPrimario}
                onClick={handleAvanzar}
                disabled={guardando}
                style={{ width: '100%', marginTop: 8 }}
              >
                {guardando ? 'Guardando...' : `Marcar como "${ESTADO_ENVIO_LABELS[siguienteEstado]}"${enviaEmail ? ' y enviar email' : ''}`}
              </button>
            ) : (
              <div className={styles.avisoEntregado}>✅ Este envío ya fue entregado.</div>
            )}
          </div>
        ) : (
          <div className={styles.errorMsg}>No se pudo cargar el detalle.</div>
        )}
      </div>
    </div>
  );
});

export default GestionEnviosModal;
```

- [ ] **Step 2: Verificar que compila**

```bash
cd frontend && npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/admin/GestionVentas/GestionEnviosModal.tsx
git commit -m "feat(envios): agregar GestionEnviosModal con stepper de estados y campo de seguimiento"
```

---

## Task 9: Integrar tabs en GestionVentas y agregar estilos

**Files:**
- Modify: `frontend/src/components/admin/GestionVentas/GestionVentas.tsx`
- Modify: `frontend/src/components/admin/GestionVentas/GestionVentas.module.css`

- [ ] **Step 1: Leer el archivo completo de GestionVentas.tsx**

Leer `frontend/src/components/admin/GestionVentas/GestionVentas.tsx` completo para identificar:
- Dónde empieza el JSX `return (`
- El primer elemento raíz del componente
- Si ya hay alguna estructura de tabs

- [ ] **Step 2: Agregar estado de tab activo y import de GestionEnvios**

Al inicio del componente, agregar el import:
```typescript
import GestionEnvios from './GestionEnvios';
```

Dentro del componente, agregar el estado:
```typescript
const [tabActivo, setTabActivo] = useState<'ventas' | 'envios'>('ventas');
const [enviosPendientes, setEnviosPendientes] = useState(0);
```

- [ ] **Step 3: Envolver el contenido existente con la estructura de tabs**

En el JSX del return, envolver todo el contenido actual de la siguiente manera:

```tsx
return (
  <div className={styles.container}>
    {/* Stats bar existente — NO mover, sigue igual */}
    ...stats bar...

    {/* TABS — agregar después de la stats bar */}
    <div className={styles.tabs}>
      <button
        className={`${styles.tab} ${tabActivo === 'ventas' ? styles.tabActivo : ''}`}
        onClick={() => setTabActivo('ventas')}
      >
        🧾 Ventas
      </button>
      <button
        className={`${styles.tab} ${tabActivo === 'envios' ? styles.tabActivo : ''}`}
        onClick={() => setTabActivo('envios')}
      >
        📦 Envíos
        {enviosPendientes > 0 && (
          <span className={styles.tabBadge}>{enviosPendientes}</span>
        )}
      </button>
    </div>

    {/* Contenido condicional por tab */}
    {tabActivo === 'ventas' && (
      <div>
        {/* Todo el contenido actual de filtros, tabla, modales — sin cambios */}
        ...contenido existente...
      </div>
    )}

    {tabActivo === 'envios' && (
      <GestionEnvios onPendientesChange={setEnviosPendientes} />
    )}
  </div>
);
```

- [ ] **Step 4: Agregar estilos para los tabs en GestionVentas.module.css**

Leer `frontend/src/components/admin/GestionVentas/GestionVentas.module.css` para ver los colores y estilos existentes. Agregar al final del archivo:

```css
/* ── Tabs ─────────────────────────────────────────────────────── */
.tabs {
  display: flex;
  border-bottom: 2px solid var(--border-color, #e2e8f0);
  margin-bottom: 20px;
  gap: 0;
}

.tab {
  padding: 10px 20px;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-secondary, #64748b);
  cursor: pointer;
  border: none;
  background: transparent;
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
  border-radius: 6px 6px 0 0;
  transition: color 0.15s, background 0.15s;
  display: flex;
  align-items: center;
  gap: 6px;
}

.tab:hover {
  color: var(--color-primary, #0ea5e9);
  background: var(--bg-hover, #f8fafc);
}

.tabActivo {
  color: var(--color-primary, #0ea5e9);
  font-weight: 600;
  border-bottom-color: var(--color-primary, #0ea5e9);
  background: var(--bg-active, #f0f9ff);
}

.tabBadge {
  background: #f59e0b;
  color: white;
  font-size: 10px;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 10px;
  line-height: 1.4;
}

/* ── Estados de envío ──────────────────────────────────────────── */
.estadoBadge {
  display: inline-block;
  padding: 3px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.estadoPendiente {
  background: #fef3c7;
  color: #92400e;
}

.estadoEnPreparacion {
  background: #dbeafe;
  color: #1e40af;
}

.estadoEnCamino {
  background: #fce7f3;
  color: #9d174d;
}

.estadoEntregado {
  background: #dcfce7;
  color: #166534;
}

/* ── Helpers usados en GestionEnvios ──────────────────────────── */
.sinDatos {
  color: var(--text-muted, #94a3b8);
  font-style: italic;
}

.direccion {
  font-size: 13px;
  color: var(--text-secondary, #64748b);
  max-width: 200px;
}

.nroSeguimiento {
  font-family: monospace;
  font-size: 13px;
}

/* ── Stepper ──────────────────────────────────────────────────── */
.stepper {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.stepperItem {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
}

.stepperCompleto {
  color: var(--text-primary, #1e293b);
}

.stepperPendiente {
  opacity: 0.4;
}

.stepperCirculo {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #e2e8f0;
  color: #94a3b8;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 700;
  flex-shrink: 0;
}

.stepperActual > .stepperCirculo,
.stepperCompleto > .stepperCirculo {
  background: var(--color-primary, #0ea5e9);
  color: white;
}

/* ── Info blocks del modal ────────────────────────────────────── */
.infoBlock {
  margin-bottom: 16px;
}

.infoLabel {
  font-size: 11px;
  font-weight: 700;
  color: var(--text-secondary, #64748b);
  letter-spacing: 0.5px;
  margin-bottom: 6px;
  text-transform: uppercase;
}

.infoContent {
  background: var(--bg-secondary, #f8fafc);
  border-radius: 6px;
  padding: 10px;
  font-size: 13px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.fieldLabel {
  display: block;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-primary, #374151);
  margin-bottom: 4px;
}

.opcional {
  font-weight: 400;
  color: var(--text-muted, #94a3b8);
}

.inputField {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid var(--color-primary, #0ea5e9);
  border-radius: 6px;
  font-size: 13px;
  box-sizing: border-box;
}

.fieldHint {
  font-size: 11px;
  color: var(--text-secondary, #64748b);
  margin-top: 3px;
}

.avisoEmail {
  background: #ecfdf5;
  border: 1px solid #a7f3d0;
  border-radius: 6px;
  padding: 10px;
  font-size: 13px;
  margin-bottom: 8px;
}

.avisoEntregado {
  text-align: center;
  color: #166534;
  font-weight: 600;
  padding: 12px;
  background: #dcfce7;
  border-radius: 6px;
}

@media (prefers-reduced-motion: reduce) {
  .tab { transition: none !important; }
}
```

- [ ] **Step 5: Verificar que el frontend levanta sin errores**

```bash
cd frontend && npm run dev
```

Abrir http://localhost:5173, navegar al panel admin → Gestión de Ventas. Verificar:
- Aparecen los dos tabs (Ventas y Envíos)
- El tab Ventas muestra el contenido original sin cambios
- El tab Envíos muestra la tabla de envíos (puede estar vacía)
- El badge de pendientes aparece si hay envíos en estado `pendiente`

- [ ] **Step 6: Probar el flujo completo del modal**

Con datos en la BD:
1. Click en tab "Envíos"
2. Click en "Gestionar" sobre un envío en estado `pendiente`
3. Verificar que el modal muestra los datos del envío
4. Verificar que el stepper muestra "Pendiente" como paso actual
5. Click en "Marcar como En preparación"
6. Verificar que la tabla se actualiza

- [ ] **Step 7: Commit final**

```bash
git add frontend/src/components/admin/GestionVentas/GestionVentas.tsx \
        frontend/src/components/admin/GestionVentas/GestionVentas.module.css
git commit -m "feat(envios): integrar tab Envíos en GestionVentas con badge de pendientes"
```

---

## Verificación final

- [ ] **Build limpio del backend**

```bash
cd backend && npm run build
```
Esperado: 0 errores.

- [ ] **Build limpio del frontend**

```bash
cd frontend && npm run build
```
Esperado: 0 errores TypeScript, bundle generado.

- [ ] **Commit de cierre**

```bash
git add .
git commit -m "feat(envios): módulo gestión de envíos completo — tab, controller, emails"
```
