# Comprobante de Venta PDF — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Agregar botones de "Descargar PDF" y "Enviar por email" en el modal de detalle de ventas del panel admin, generando un comprobante de venta profesional sin validez fiscal.

**Architecture:** El backend genera el PDF con `pdfkit` en un servicio dedicado (`comprobanteService`). Dos nuevos endpoints en `AdminVentaController` manejan la descarga y el envío por email (Resend con attachment). El frontend agrega dos botones al footer del modal `DetalleVentaModal`.

**Tech Stack:** pdfkit (backend PDF), Resend (email con attachment), adminApi/Axios con responseType blob (frontend download)

---

## Chunk 1: Backend — Servicio PDF y email

### Task 1: Instalar pdfkit en el backend

**Files:**
- Modify: `backend/package.json`

- [ ] **Step 1: Instalar pdfkit y sus tipos**

Ejecutar desde `backend/`:
```bash
npm install pdfkit
npm install --save-dev @types/pdfkit
```

- [ ] **Step 2: Verificar que el build compila sin errores**

```bash
cd backend && npm run build
```
Expected: compilación exitosa sin errores TypeScript.

- [ ] **Step 3: Commit**

```bash
git add backend/package.json backend/package-lock.json
git commit -m "chore(backend): instalar pdfkit para generación de comprobantes PDF"
```

---

### Task 2: Crear comprobanteService.ts

**Files:**
- Create: `backend/src/services/comprobanteService.ts`

Este servicio define su propio tipo local `DetalleParaComprobante` (refleja la forma real que retorna `obtenerDetalleAdmin`) y exporta `generarComprobantePDF`. **No usar `VentaAdminDetalle`** del archivo de tipos — ese tipo tiene `nombre_cliente`/`email_cliente` planos (del listado), no la estructura anidada del detalle.

- [ ] **Step 1: Crear el archivo con tipos y constantes**

Crear `backend/src/services/comprobanteService.ts`:

```typescript
/**
 * @file comprobanteService.ts
 *
 * Genera comprobantes de venta en formato PDF.
 * Retorna un Buffer listo para enviarse como respuesta HTTP o adjuntarse en email.
 *
 * Nota: pdfkit trabaja con streams Node.js. El Buffer se construye
 * colectando eventos 'data' y resolviendo la Promise en 'end'.
 */

import PDFDocument from 'pdfkit';
import logger from './loggerService.js';

// ── Datos de la empresa (placeholders hasta que se definan los reales) ──────
const EMPRESA = {
  nombre:    'TecnoCel',
  telefono:  '(0000) 000-0000',
  direccion: 'A definir',
  web:       'tecnocel.com.ar',
};

// ── Tipo de entrada ──────────────────────────────────────────────────────────
// Refleja la forma real del JSON retornado por AdminVentaController.obtenerDetalleAdmin
// (NO es VentaAdminDetalle del archivo de tipos, que tiene estructura plana del listado)

interface ItemComprobante {
  nombre_producto: string;
  codigo: string | null;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
}

interface DireccionEnvioComprobante {
  calle: string | null;
  numero: string | null;
  piso: string | null;
  departamento: string | null;
  barrio: string | null;
  ciudad: string | null;
  provincia: string | null;
}

export interface DetalleParaComprobante {
  id_venta: number;
  nro_venta: string;
  fyh_creacion: string;
  total_pagado: number;
  estado: string;
  metodo_pago: string | null;
  tipo_venta: string;
  moneda: string | null;
  observaciones: string | null;
  cliente: {
    id_cliente: number;
    nombre_cliente: string;
    apellido_cliente: string;
    correo: string;
  } | null;
  vendedor: {
    id_vendedor: number;
    nombres: string;
  } | null;
  envio: {
    tipo_entrega: string;
    direccion_envio: DireccionEnvioComprobante | null;
  } | null;
  items: ItemComprobante[];
}

// ── Helpers de formato ────────────────────────────────────────────────────────

function formatFecha(iso: string): string {
  return new Date(iso).toLocaleString('es-AR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function formatMonto(n: number): string {
  return n.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatMetodoPago(metodo: string | null): string {
  const labels: Record<string, string> = {
    efectivo: 'Efectivo', tarjeta: 'Tarjeta',
    transferencia: 'Transferencia', qr: 'QR',
  };
  return metodo ? (labels[metodo] ?? metodo) : '—';
}

function formatDireccion(d: DireccionEnvioComprobante): string {
  const partes: string[] = [];
  if (d.calle)         partes.push(d.calle);
  if (d.numero)        partes.push(d.numero);
  if (d.piso)          partes.push(`Piso ${d.piso}`);
  if (d.departamento)  partes.push(`Depto ${d.departamento}`);
  if (d.barrio)        partes.push(d.barrio);
  if (d.ciudad)        partes.push(d.ciudad);
  if (d.provincia)     partes.push(d.provincia);
  return partes.join(', ') || '—';
}

// ── Generación del PDF ────────────────────────────────────────────────────────

export async function generarComprobantePDF(detalle: DetalleParaComprobante): Promise<Buffer> {
  return new Promise<Buffer>((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const pageWidth = doc.page.width - 100; // ancho útil (margen 50 c/lado)
      const COL = { producto: 0, codigo: 220, cant: 310, precio: 365, subtotal: 440 };

      // ── Encabezado ──────────────────────────────────────────────────────────
      doc
        .fontSize(20).font('Helvetica-Bold').text(EMPRESA.nombre, 50, 50)
        .fontSize(9).font('Helvetica').fillColor('#555555')
        .text(`Tel: ${EMPRESA.telefono}  |  ${EMPRESA.direccion}  |  ${EMPRESA.web}`, 50, 75)
        .fillColor('#000000');

      // Línea divisoria
      doc.moveTo(50, 95).lineTo(545, 95).strokeColor('#CCCCCC').stroke();

      // Título + número de venta
      doc
        .fontSize(14).font('Helvetica-Bold')
        .text('COMPROBANTE DE VENTA', 50, 110)
        .fontSize(11).font('Helvetica')
        .text(detalle.nro_venta, 400, 110, { align: 'right', width: 145 });

      // Fecha y estado
      doc
        .fontSize(9).font('Helvetica').fillColor('#555555')
        .text(`Fecha: ${formatFecha(detalle.fyh_creacion)}`, 50, 130)
        .text(`Estado: ${detalle.estado.charAt(0).toUpperCase() + detalle.estado.slice(1)}`, 400, 130, { align: 'right', width: 145 })
        .fillColor('#000000');

      doc.moveTo(50, 148).lineTo(545, 148).strokeColor('#EEEEEE').stroke();

      // ── Dos columnas: Cliente | Datos de la venta ────────────────────────
      const colW = (pageWidth - 20) / 2;
      let y = 160;

      // Columna izquierda — Cliente
      doc.fontSize(10).font('Helvetica-Bold').text('CLIENTE', 50, y);
      y += 16;
      if (detalle.cliente) {
        doc.fontSize(9).font('Helvetica')
          .text(`${detalle.cliente.nombre_cliente} ${detalle.cliente.apellido_cliente}`, 50, y)
          .text(detalle.cliente.correo, 50, y + 13);
      } else {
        doc.fontSize(9).font('Helvetica').fillColor('#777777')
          .text('Venta de mostrador (sin cliente registrado)', 50, y)
          .fillColor('#000000');
      }

      // Columna derecha — Datos de la venta
      const xDer = 50 + colW + 20;
      doc.fontSize(10).font('Helvetica-Bold').text('DATOS DE LA VENTA', xDer, 160);
      let yDer = 176;

      const addRow = (label: string, value: string) => {
        doc.fontSize(9).font('Helvetica-Bold').text(`${label}:`, xDer, yDer, { continued: true })
          .font('Helvetica').text(` ${value}`);
        yDer += 13;
      };

      addRow('Método de pago', formatMetodoPago(detalle.metodo_pago));
      addRow('Tipo de entrega', detalle.envio?.tipo_entrega === 'envio' ? 'Envío a domicilio' : 'Retiro en tienda');
      addRow('Moneda', detalle.moneda || 'ARS');
      if (detalle.vendedor) addRow('Vendedor', detalle.vendedor.nombres);

      // ── Dirección de envío (si aplica) ───────────────────────────────────
      y = Math.max(y + 40, yDer + 10);

      if (detalle.envio?.tipo_entrega === 'envio' && detalle.envio.direccion_envio) {
        doc.moveTo(50, y).lineTo(545, y).strokeColor('#EEEEEE').stroke();
        y += 12;
        doc.fontSize(10).font('Helvetica-Bold').text('DIRECCIÓN DE ENVÍO', 50, y);
        y += 14;
        doc.fontSize(9).font('Helvetica')
          .text(formatDireccion(detalle.envio.direccion_envio), 50, y, { width: pageWidth });
        y += 20;
      }

      // ── Observaciones (si aplica) ────────────────────────────────────────
      if (detalle.observaciones) {
        doc.moveTo(50, y).lineTo(545, y).strokeColor('#EEEEEE').stroke();
        y += 12;
        doc.fontSize(10).font('Helvetica-Bold').text('OBSERVACIONES', 50, y);
        y += 14;
        doc.fontSize(9).font('Helvetica')
          .text(detalle.observaciones, 50, y, { width: pageWidth });
        y += 20;
      }

      // ── Tabla de productos ───────────────────────────────────────────────
      doc.moveTo(50, y).lineTo(545, y).strokeColor('#CCCCCC').stroke();
      y += 10;

      // Encabezado tabla
      doc.fontSize(8).font('Helvetica-Bold').fillColor('#FFFFFF');
      doc.rect(50, y, pageWidth, 16).fill('#374151');
      doc.text('PRODUCTO',       50 + COL.producto, y + 4, { width: 160 })
         .text('CÓDIGO',         50 + COL.codigo,   y + 4, { width: 80 })
         .text('CANT.',          50 + COL.cant,     y + 4, { width: 45, align: 'right' })
         .text('PRECIO UNIT.',   50 + COL.precio,   y + 4, { width: 65, align: 'right' })
         .text('SUBTOTAL',       50 + COL.subtotal, y + 4, { width: 65, align: 'right' });
      doc.fillColor('#000000');
      y += 18;

      // Filas de productos
      detalle.items.forEach((item, idx) => {
        if (idx % 2 === 0) {
          doc.rect(50, y - 2, pageWidth, 16).fill('#F9FAFB');
        }
        doc.fontSize(8).font('Helvetica').fillColor('#000000')
          .text(item.nombre_producto,            50 + COL.producto, y, { width: 160 })
          .text(item.codigo || '—',              50 + COL.codigo,   y, { width: 80 })
          .text(String(item.cantidad),           50 + COL.cant,     y, { width: 45, align: 'right' })
          .text(`$${formatMonto(item.precio_unitario)}`, 50 + COL.precio, y, { width: 65, align: 'right' })
          .text(`$${formatMonto(item.subtotal)}`, 50 + COL.subtotal, y, { width: 65, align: 'right' });
        y += 16;
      });

      // Fila total
      doc.moveTo(50, y).lineTo(545, y).strokeColor('#CCCCCC').stroke();
      y += 8;
      doc.fontSize(10).font('Helvetica-Bold')
        .text('TOTAL', 50 + COL.precio, y, { width: 65, align: 'right' })
        .text(`$${formatMonto(detalle.total_pagado)}`, 50 + COL.subtotal, y, { width: 65, align: 'right' });

      // ── Pie de página ────────────────────────────────────────────────────
      doc
        .fontSize(8).font('Helvetica').fillColor('#888888')
        .text('Este comprobante no tiene validez fiscal.',
          50, doc.page.height - 50, { align: 'center', width: pageWidth });

      doc.end();
    } catch (err) {
      logger.error('Error generando comprobante PDF:', { error: (err as Error).message });
      reject(err);
    }
  });
}
```

- [ ] **Step 2: Verificar que TypeScript compila sin errores**

```bash
cd backend && npm run build
```
Expected: sin errores. Si hay error de tipos en pdfkit, verificar que `@types/pdfkit` está instalado.

- [ ] **Step 3: Commit**

```bash
git add backend/src/services/comprobanteService.ts
git commit -m "feat(backend): crear comprobanteService con generación de PDF via pdfkit"
```

---

### Task 3: Agregar sendComprobanteEmail a emailService.ts

**Files:**
- Modify: `backend/src/services/emailService.ts`

Agregar la función al final del archivo, antes del último `}` del módulo (no hay clase — es un módulo de funciones exportadas).

- [ ] **Step 1: Agregar la función sendComprobanteEmail al final de emailService.ts**

Agregar al final del archivo (después de `sendCommentReplyEmail`):

```typescript
export async function sendComprobanteEmail(
  email: string,
  nroVenta: string,
  nombreCliente: string,
  pdfBuffer: Buffer
): Promise<void> {
  try {
    const { error } = await resend.emails.send({
      from: EMAIL_FROM,
      to: email,
      subject: `Comprobante de venta ${nroVenta} — TecnoCel`,
      html: `<p>Hola ${escapeHtml(nombreCliente)},</p>
             <p>Adjuntamos el comprobante de tu venta <strong>${nroVenta}</strong>.</p>
             <p>Gracias por tu compra en TecnoCel.</p>`,
      attachments: [
        {
          filename: `comprobante-${nroVenta}.pdf`,
          content: pdfBuffer,
        },
      ],
    });
    if (error) throw new Error(error.message);
    logger.info('Email de comprobante enviado', { email: maskEmail(email), nro_venta: nroVenta });
  } catch (error) {
    logger.error('Error enviando email de comprobante:', { error: (error as Error).message });
    throw new Error('No se pudo enviar el comprobante por email');
  }
}
```

- [ ] **Step 2: Compilar**

```bash
cd backend && npm run build
```
Expected: sin errores.

- [ ] **Step 3: Commit**

```bash
git add backend/src/services/emailService.ts
git commit -m "feat(backend): agregar sendComprobanteEmail con adjunto PDF via Resend"
```

---

## Chunk 2: Backend — Endpoints y rutas

### Task 4: Agregar métodos a AdminVentaController

**Files:**
- Modify: `backend/src/controllers/AdminVentaController.ts`

Agregar dos métodos estáticos al final de la clase `AdminVentaController`, antes del cierre `}` de la clase.

- [ ] **Step 1: Agregar imports al tope del archivo**

En la sección de imports de `AdminVentaController.ts`, agregar:

```typescript
import { generarComprobantePDF } from '../services/comprobanteService.js';
import type { DetalleParaComprobante } from '../services/comprobanteService.js';
import { sendComprobanteEmail } from '../services/emailService.js';
```

- [ ] **Step 2: Agregar método descargarComprobante al final de la clase**

Agregar antes del cierre `}` de la clase:

```typescript
  /**
   * Genera y descarga el comprobante de una venta en PDF
   * GET /api/ventas/admin/:id_venta/comprobante
   * Roles: admin (1), gerente (2), vendedor (3)
   */
  static async descargarComprobante(req: Request, res: Response) {
    try {
      const { id_venta } = req.params;

      const venta = await Venta.findOne({
        where: { id_venta },
        include: [
          {
            model: Cliente,
            attributes: ['id_cliente', 'nombre_cliente', 'apellido_cliente', 'email_cliente'],
            required: false,
          },
          {
            model: Usuario,
            as: 'vendedor',
            attributes: ['id_usuario', 'nombres'],
            required: false,
          },
          {
            model: VentaItem,
            as: 'items',
            include: [
              {
                model: Almacen,
                as: 'producto',
                attributes: ['id_producto', 'nombre', 'codigo'],
              },
            ],
          },
          {
            model: Envio,
            as: 'envio',
            required: false,
            include: [
              {
                model: Direccion,
                as: 'direccion_envio',
                required: false,
                attributes: ['calle', 'numero', 'piso', 'departamento', 'barrio', 'ciudad', 'provincia'],
              },
            ],
          },
        ],
      });

      if (!venta) {
        return res.status(404).json({ error: 'Venta no encontrada' });
      }

      const v = venta.toJSON() as Record<string, any>;
      const nroVenta = `V-${v.nro_venta.toString().padStart(5, '0')}`;

      const detalle: DetalleParaComprobante = {
        id_venta:     v.id_venta,
        nro_venta:    nroVenta,
        fyh_creacion: v.fyh_creacion,
        total_pagado: parseFloat(v.total_pagado),
        estado:       v.estado,
        metodo_pago:  v.metodo_pago,
        tipo_venta:   v.tipo_venta,
        moneda:       v.moneda,
        observaciones: v.observaciones,
        cliente: v.Cliente ? {
          id_cliente:      v.Cliente.id_cliente,
          nombre_cliente:  v.Cliente.nombre_cliente,
          apellido_cliente: v.Cliente.apellido_cliente,
          correo:          v.Cliente.email_cliente,
        } : null,
        vendedor: v.vendedor ? {
          id_vendedor: v.vendedor.id_usuario,
          nombres:     v.vendedor.nombres,
        } : null,
        envio: v.envio ? {
          tipo_entrega: v.envio.tipo_entrega,
          direccion_envio: (v.envio.envio_calle || v.envio.direccion_envio) ? {
            calle:       v.envio.envio_calle       || v.envio.direccion_envio?.calle       || null,
            numero:      v.envio.envio_numero      || v.envio.direccion_envio?.numero      || null,
            piso:        v.envio.envio_piso        || v.envio.direccion_envio?.piso        || null,
            departamento: v.envio.envio_departamento || v.envio.direccion_envio?.departamento || null,
            barrio:      v.envio.envio_barrio      || v.envio.direccion_envio?.barrio      || null,
            ciudad:      v.envio.envio_ciudad      || v.envio.direccion_envio?.ciudad      || null,
            provincia:   v.envio.envio_provincia   || v.envio.direccion_envio?.provincia   || null,
          } : null,
        } : null,
        items: (v.items || []).map((item: any) => ({
          nombre_producto: item.producto?.nombre || 'Producto no disponible',
          codigo:          item.producto?.codigo || null,
          cantidad:        item.cantidad,
          precio_unitario: parseFloat(item.precio_unitario),
          subtotal:        parseFloat(item.subtotal),
        })),
      };

      const pdfBuffer = await generarComprobantePDF(detalle);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="comprobante-${nroVenta}.pdf"`);
      res.setHeader('Content-Length', pdfBuffer.length);
      return res.end(pdfBuffer);
    } catch (error) {
      logger.error('Error generando comprobante PDF:', {
        error: error instanceof Error ? error.message : 'Error desconocido',
        id_venta: req.params.id_venta,
      });
      return res.status(500).json({ error: 'Error al generar el comprobante' });
    }
  }

  /**
   * Envía el comprobante de una venta por email al cliente
   * POST /api/ventas/admin/:id_venta/enviar-comprobante
   * Roles: admin (1), gerente (2), vendedor (3)
   * Requiere que la venta tenga cliente con correo registrado
   */
  static async enviarComprobante(req: Request, res: Response) {
    try {
      const { id_venta } = req.params;

      const venta = await Venta.findOne({
        where: { id_venta },
        include: [
          {
            model: Cliente,
            attributes: ['id_cliente', 'nombre_cliente', 'apellido_cliente', 'email_cliente'],
            required: false,
          },
          {
            model: Usuario,
            as: 'vendedor',
            attributes: ['id_usuario', 'nombres'],
            required: false,
          },
          {
            model: VentaItem,
            as: 'items',
            include: [
              {
                model: Almacen,
                as: 'producto',
                attributes: ['id_producto', 'nombre', 'codigo'],
              },
            ],
          },
          {
            model: Envio,
            as: 'envio',
            required: false,
            include: [
              {
                model: Direccion,
                as: 'direccion_envio',
                required: false,
                attributes: ['calle', 'numero', 'piso', 'departamento', 'barrio', 'ciudad', 'provincia'],
              },
            ],
          },
        ],
      });

      if (!venta) {
        return res.status(404).json({ error: 'Venta no encontrada' });
      }

      const v = venta.toJSON() as Record<string, any>;

      if (!v.Cliente?.email_cliente) {
        return res.status(400).json({ error: 'Esta venta no tiene cliente con correo registrado' });
      }

      const nroVenta = `V-${v.nro_venta.toString().padStart(5, '0')}`;

      const detalle: DetalleParaComprobante = {
        id_venta:     v.id_venta,
        nro_venta:    nroVenta,
        fyh_creacion: v.fyh_creacion,
        total_pagado: parseFloat(v.total_pagado),
        estado:       v.estado,
        metodo_pago:  v.metodo_pago,
        tipo_venta:   v.tipo_venta,
        moneda:       v.moneda,
        observaciones: v.observaciones,
        cliente: {
          id_cliente:      v.Cliente.id_cliente,
          nombre_cliente:  v.Cliente.nombre_cliente,
          apellido_cliente: v.Cliente.apellido_cliente,
          correo:          v.Cliente.email_cliente,
        },
        vendedor: v.vendedor ? {
          id_vendedor: v.vendedor.id_usuario,
          nombres:     v.vendedor.nombres,
        } : null,
        envio: v.envio ? {
          tipo_entrega: v.envio.tipo_entrega,
          direccion_envio: (v.envio.envio_calle || v.envio.direccion_envio) ? {
            calle:       v.envio.envio_calle       || v.envio.direccion_envio?.calle       || null,
            numero:      v.envio.envio_numero      || v.envio.direccion_envio?.numero      || null,
            piso:        v.envio.envio_piso        || v.envio.direccion_envio?.piso        || null,
            departamento: v.envio.envio_departamento || v.envio.direccion_envio?.departamento || null,
            barrio:      v.envio.envio_barrio      || v.envio.direccion_envio?.barrio      || null,
            ciudad:      v.envio.envio_ciudad      || v.envio.direccion_envio?.ciudad      || null,
            provincia:   v.envio.envio_provincia   || v.envio.direccion_envio?.provincia   || null,
          } : null,
        } : null,
        items: (v.items || []).map((item: any) => ({
          nombre_producto: item.producto?.nombre || 'Producto no disponible',
          codigo:          item.producto?.codigo || null,
          cantidad:        item.cantidad,
          precio_unitario: parseFloat(item.precio_unitario),
          subtotal:        parseFloat(item.subtotal),
        })),
      };

      const pdfBuffer = await generarComprobantePDF(detalle);
      const nombreCliente = `${v.Cliente.nombre_cliente} ${v.Cliente.apellido_cliente}`;
      await sendComprobanteEmail(v.Cliente.email_cliente, nroVenta, nombreCliente, pdfBuffer);

      return res.json({ mensaje: `Comprobante enviado a ${v.Cliente.email_cliente}` });
    } catch (error) {
      logger.error('Error enviando comprobante por email:', {
        error: error instanceof Error ? error.message : 'Error desconocido',
        id_venta: req.params.id_venta,
      });
      return res.status(500).json({ error: 'Error al enviar el comprobante por email' });
    }
  }
```

- [ ] **Step 3: Compilar**

```bash
cd backend && npm run build
```
Expected: sin errores TypeScript.

- [ ] **Step 4: Commit**

```bash
git add backend/src/controllers/AdminVentaController.ts
git commit -m "feat(backend): agregar endpoints descargarComprobante y enviarComprobante"
```

---

### Task 5: Registrar rutas en ventaRoutes.ts

**Files:**
- Modify: `backend/src/routes/ventaRoutes.ts`

Las nuevas rutas deben registrarse **antes** de `router.get('/admin/:id_venta', ...)` (línea 131) para respetar la convención de rutas más específicas primero. También deben ir antes de `router.use(verificarTokenCliente)` (línea 143).

- [ ] **Step 1: Actualizar el comentario del archivo (bloque JSDoc superior)**

En el bloque de rutas admin del JSDoc (líneas 6-11), agregar:
```
 * - GET  /api/ventas/admin/:id_venta/comprobante       - Descargar PDF del comprobante
 * - POST /api/ventas/admin/:id_venta/enviar-comprobante - Enviar comprobante por email
```

- [ ] **Step 2: Insertar las dos nuevas rutas antes de `router.get('/admin/:id_venta', ...)`**

Insertar antes del bloque que empieza en línea 126 (`/** GET /api/ventas/admin/:id_venta`):

```typescript
/**
 * GET /api/ventas/admin/:id_venta/comprobante
 * Genera y descarga el comprobante de una venta en PDF
 * Roles: admin (1), gerente (2), vendedor (3)
 */
router.get('/admin/:id_venta/comprobante',
  verificarToken,
  verificarRol([ROLES.ADMIN, ROLES.GERENTE, ROLES.VENDEDOR]),
  AdminVentaController.descargarComprobante.bind(AdminVentaController)
);

/**
 * POST /api/ventas/admin/:id_venta/enviar-comprobante
 * Envía el comprobante por email al cliente registrado en la venta
 * Roles: admin (1), gerente (2), vendedor (3)
 */
router.post('/admin/:id_venta/enviar-comprobante',
  verificarToken,
  verificarRol([ROLES.ADMIN, ROLES.GERENTE, ROLES.VENDEDOR]),
  AdminVentaController.enviarComprobante.bind(AdminVentaController)
);
```

- [ ] **Step 3: Compilar y probar el endpoint manualmente**

```bash
cd backend && npm run build && npm run dev
```

Probar con curl (reemplazar TOKEN con un admin_token válido):
```bash
# Descarga del PDF
curl -H "Authorization: Bearer TOKEN" \
     http://localhost:3000/api/ventas/admin/1/comprobante \
     --output comprobante-test.pdf

# Verificar que el archivo se creó y tiene contenido
ls -la comprobante-test.pdf
```
Expected: archivo PDF de varios KB.

```bash
# Envío por email
curl -X POST \
     -H "Authorization: Bearer TOKEN" \
     http://localhost:3000/api/ventas/admin/1/enviar-comprobante
```
Expected: `{"mensaje":"Comprobante enviado a ..."}` o 400 si la venta no tiene cliente.

- [ ] **Step 4: Commit**

```bash
git add backend/src/routes/ventaRoutes.ts
git commit -m "feat(backend): registrar rutas de comprobante PDF en ventaRoutes"
```

---

## Chunk 3: Frontend — Servicio y UI

### Task 6: Agregar métodos a ventaAdminService

**Files:**
- Modify: `frontend/src/services/ventaAdminService.ts`

Estos métodos usan `adminApi` (no `axiosInstance`), igual que todos los demás métodos del servicio.

- [ ] **Step 1: Agregar descargarComprobante y enviarComprobante al objeto ventaAdminService**

Agregar antes de `// ── Helpers de formato ────────────────────────────────────────────────────`:

```typescript
  /**
   * Descarga el comprobante de una venta como archivo PDF
   * Usa responseType: 'blob' para recibir el binario y disparar la descarga en el navegador
   */
  async descargarComprobante(id_venta: number, nroVenta: string): Promise<void> {
    try {
      const response = await adminApi.get(`/ventas/admin/${id_venta}/comprobante`, {
        responseType: 'blob',
      });
      const url = URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = `comprobante-${nroVenta}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Error al descargar el comprobante');
    }
  },

  /**
   * Envía el comprobante de una venta por email al cliente registrado
   */
  async enviarComprobante(id_venta: number): Promise<{ mensaje: string }> {
    try {
      const response = await adminApi.post(`/ventas/admin/${id_venta}/enviar-comprobante`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Error al enviar el comprobante');
    }
  },
```

- [ ] **Step 2: Verificar que el build del frontend no tiene errores**

```bash
cd frontend && npm run build
```
Expected: sin errores TypeScript.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/services/ventaAdminService.ts
git commit -m "feat(frontend): agregar descargarComprobante y enviarComprobante a ventaAdminService"
```

---

### Task 7: Actualizar DetalleVentaModal con botones de comprobante

**Files:**
- Modify: `frontend/src/components/admin/GestionVentas/DetalleVentaModal.tsx`
- Modify: `frontend/src/components/admin/GestionVentas/GestionVentas.module.css`

- [ ] **Step 1: Agregar estado y handlers en DetalleVentaModal.tsx**

Después de `const [mostrarCancelacionModal, setMostrarCancelacionModal] = useState(false);` (línea 32), agregar:

```typescript
  const [descargando, setDescargando] = useState(false);
  const [enviando, setEnviando] = useState(false);
```

Agregar los handlers después del bloque `// ── Cerrar con Escape ──` (después de línea 66):

```typescript
  // ── Acciones de comprobante ────────────────────────────────────────────────

  const handleDescargar = async () => {
    if (!detalle) return;
    setDescargando(true);
    try {
      await ventaAdminService.descargarComprobante(detalle.id_venta, detalle.nro_venta);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al descargar el comprobante';
      showNotification(message, 'error');
    } finally {
      setDescargando(false);
    }
  };

  const handleEnviarEmail = async () => {
    if (!detalle) return;
    setEnviando(true);
    try {
      const result = await ventaAdminService.enviarComprobante(detalle.id_venta);
      showNotification(result.mensaje, 'success');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al enviar el comprobante';
      showNotification(message, 'error');
    } finally {
      setEnviando(false);
    }
  };
```

- [ ] **Step 2: Actualizar el footer del modal**

Reemplazar el bloque del footer (líneas 289-299):

```tsx
{/* Pie */}
<div className={`${styles.modalFooter} ${puedeCancelar ? styles.modalFooterLeft : ''}`}>
  {puedeCancelar && (
    <button className={styles.dangerButton} onClick={() => setMostrarCancelacionModal(true)}>
      <span className="material-icons">cancel</span>
      Cancelar Venta
    </button>
  )}
  <div className={styles.modalFooterActions}>
    {detalle && !cargando && (
      <>
        <button
          className={styles.comprobanteButton}
          onClick={handleDescargar}
          disabled={descargando}
          title="Descargar comprobante en PDF"
        >
          <span className="material-icons">
            {descargando ? 'hourglass_empty' : 'download'}
          </span>
          {descargando ? 'Descargando...' : 'Descargar PDF'}
        </button>
        {detalle.cliente?.correo && (
          <button
            className={styles.comprobanteButton}
            onClick={handleEnviarEmail}
            disabled={enviando}
            title={`Enviar comprobante a ${detalle.cliente.correo}`}
          >
            <span className="material-icons">
              {enviando ? 'hourglass_empty' : 'email'}
            </span>
            {enviando ? 'Enviando...' : 'Enviar email'}
          </button>
        )}
      </>
    )}
    <button className={styles.cancelButton} onClick={onClose}>
      Cerrar
    </button>
  </div>
</div>
```

- [ ] **Step 3: Agregar estilos en GestionVentas.module.css**

Al final del archivo, agregar:

```css
/* ── Botones de comprobante en el footer del modal ── */
.comprobanteButton {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  background: none;
  border: 1px solid var(--color-primary);
  color: var(--color-primary);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  font-family: var(--font-primary);
  cursor: pointer;
  transition: background var(--transition-fast) var(--transition-curve),
              opacity var(--transition-fast) var(--transition-curve);
  white-space: nowrap;
}

.comprobanteButton:hover:not(:disabled) {
  background: var(--color-primary-100);
}

.comprobanteButton:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.comprobanteButton .material-icons {
  font-size: 16px;
}

.modalFooterActions {
  display: flex;
  align-items: center;
  gap: 8px;
}
```

- [ ] **Step 4: Compilar frontend**

```bash
cd frontend && npm run build
```
Expected: sin errores TypeScript ni ESLint.

- [ ] **Step 5: Prueba manual en el navegador**

1. Iniciar backend: `cd backend && npm run dev`
2. Iniciar frontend: `cd frontend && npm run dev`
3. Abrir `http://localhost:5173/admin/panel` → Gestión de Ventas
4. Abrir el detalle de cualquier venta
5. Verificar que aparecen los botones "Descargar PDF" y "Enviar email" (este último solo si la venta tiene cliente con correo)
6. Click en "Descargar PDF" → debe descargarse un archivo `comprobante-V-XXXXX.pdf`
7. Abrir el PDF y verificar que muestra los datos correctos
8. Si hay venta con cliente: click en "Enviar email" → debe aparecer notificación de éxito y el cliente debe recibir el email con el PDF adjunto
9. Verificar estados de carga (botones deshabilitados mientras procesan)
10. Verificar que botón "Enviar email" NO aparece en ventas de mostrador (sin cliente)

- [ ] **Step 6: Commit final**

```bash
git add frontend/src/components/admin/GestionVentas/DetalleVentaModal.tsx \
        frontend/src/components/admin/GestionVentas/GestionVentas.module.css
git commit -m "feat(frontend): agregar botones Descargar PDF y Enviar email en DetalleVentaModal"
```
