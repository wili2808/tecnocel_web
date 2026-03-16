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
      const COL = { producto: 0, codigo: 220, cant: 310, precio: 365, subtotal: 430 };

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
         .text('SUBTOTAL',       50 + COL.subtotal, y + 4, { width: 60, align: 'right' });
      doc.fillColor('#000000');
      y += 18;

      // Filas de productos
      detalle.items.forEach((item, idx) => {
        // Verificar overflow de página
        if (y + 16 > doc.page.height - 80) {
          doc.addPage();
          y = 50;
          // Re-renderizar encabezado de tabla en la nueva página
          doc.fontSize(8).font('Helvetica-Bold').fillColor('#FFFFFF');
          doc.rect(50, y, pageWidth, 16).fill('#374151');
          doc.text('PRODUCTO',       50 + COL.producto, y + 4, { width: 160 })
             .text('CÓDIGO',         50 + COL.codigo,   y + 4, { width: 80 })
             .text('CANT.',          50 + COL.cant,     y + 4, { width: 45, align: 'right' })
             .text('PRECIO UNIT.',   50 + COL.precio,   y + 4, { width: 65, align: 'right' })
             .text('SUBTOTAL',       50 + COL.subtotal, y + 4, { width: 60, align: 'right' });
          doc.fillColor('#000000');
          y += 18;
        }

        if (idx % 2 === 0) {
          doc.rect(50, y - 2, pageWidth, 16).fill('#F9FAFB');
        }
        doc.fontSize(8).font('Helvetica').fillColor('#000000')
          .text(item.nombre_producto,            50 + COL.producto, y, { width: 160 })
          .text(item.codigo || '—',              50 + COL.codigo,   y, { width: 80 })
          .text(String(item.cantidad),           50 + COL.cant,     y, { width: 45, align: 'right' })
          .text(`$${formatMonto(item.precio_unitario)}`, 50 + COL.precio, y, { width: 65, align: 'right' })
          .text(`$${formatMonto(item.subtotal)}`, 50 + COL.subtotal, y, { width: 60, align: 'right' });
        y += 16;
      });

      // Fila total
      doc.moveTo(50, y).lineTo(545, y).strokeColor('#CCCCCC').stroke();
      y += 8;
      doc.fontSize(10).font('Helvetica-Bold')
        .text('TOTAL', 50 + COL.precio, y, { width: 65, align: 'right' })
        .text(`$${formatMonto(detalle.total_pagado)}`, 50 + COL.subtotal, y, { width: 60, align: 'right' });

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
