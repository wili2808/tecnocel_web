import { Resend } from 'resend';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from './loggerService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TEMPLATES_DIR = path.join(__dirname, '..', 'templates', 'email');

// ──────────────────────────────────────────────
// Cliente Resend (HTTP API — funciona en cualquier cloud)
// ──────────────────────────────────────────────
const resend = new Resend(process.env.RESEND_API_KEY);
const EMAIL_FROM = process.env.EMAIL_FROM ?? 'TecnoCel <onboarding@resend.dev>';

// ──────────────────────────────────────────────
// Caché de plantillas HTML (evita leer disco en cada envío)
// ──────────────────────────────────────────────
const templateCache = new Map<string, string>();

function getTemplate(name: string): string {
  if (!templateCache.has(name)) {
    const filePath = path.join(TEMPLATES_DIR, `${name}.html`);
    templateCache.set(name, fs.readFileSync(filePath, 'utf-8'));
  }
  return templateCache.get(name)!;
}

// ──────────────────────────────────────────────
// Motor de plantillas
// ──────────────────────────────────────────────
function renderTemplate(templateName: string, variables: Record<string, string>): string {
  const base = getTemplate('base');
  let content = getTemplate(templateName);

  // Reemplazar variables en el contenido (modifica la copia local, no el caché)
  for (const [key, value] of Object.entries(variables)) {
    content = content.replaceAll(`{{${key}}}`, value);
  }

  // Inyectar contenido en el layout base
  return base.replace('{{content}}', content);
}

function buildItemsTable(items: ItemEmail[]): string {
  const filas = items.map(item => {
    const nombre = item.nombre_producto ?? item.nombre ?? 'Producto';
    const precioUnit = `$${item.precio_unitario.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`;
    const subtotal = `$${item.subtotal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`;
    return `
      <tr>
        <td style="padding:8px;border-bottom:1px solid #F1F5F9;color:#374151;">${nombre}</td>
        <td style="padding:8px;border-bottom:1px solid #F1F5F9;text-align:center;color:#374151;">${item.cantidad}</td>
        <td style="padding:8px;border-bottom:1px solid #F1F5F9;text-align:right;color:#374151;">${precioUnit}</td>
        <td style="padding:8px;border-bottom:1px solid #F1F5F9;text-align:right;font-weight:600;color:#0F172A;">${subtotal}</td>
      </tr>`;
  }).join('');

  return `
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-top:16px;border:1px solid #E2E8F0;border-radius:6px;overflow:hidden;">
      <thead>
        <tr style="background-color:#F8FAFC;">
          <th style="padding:10px 8px;text-align:left;font-size:13px;color:#64748B;font-weight:600;">Producto</th>
          <th style="padding:10px 8px;text-align:center;font-size:13px;color:#64748B;font-weight:600;">Cant.</th>
          <th style="padding:10px 8px;text-align:right;font-size:13px;color:#64748B;font-weight:600;">Precio unit.</th>
          <th style="padding:10px 8px;text-align:right;font-size:13px;color:#64748B;font-weight:600;">Subtotal</th>
        </tr>
      </thead>
      <tbody>${filas}</tbody>
    </table>`;
}

// ──────────────────────────────────────────────
// Interfaces
// ──────────────────────────────────────────────
export interface ItemEmail {
  nombre_producto?: string;
  nombre?: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
}

export interface VentaEmailData {
  nro_venta: string;
  total_pagado: number;
  motivo?: string | null;
  items: ItemEmail[];
}

export interface ConfirmacionEmailData {
  nro_venta: string;
  nombre_cliente: string;
  total_pagado: number;
  items: ItemEmail[];
}

export interface EstadoVentaEmailData {
  nro_venta: string;
  nombre_cliente: string;
  nuevo_estado: 'en_preparacion' | 'enviado' | 'entregado';
}

export interface CommentReplyEmailData {
  nombre_cliente: string;
  nombre_producto: string;
  id_producto: number;
  texto_comentario: string;
  texto_respuesta: string;
}

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────
const FRONTEND_URL = process.env.FRONTEND_URL ?? 'http://localhost:5173';

const ESTADO_LABELS: Record<string, { label: string; descripcion: string }> = {
  en_preparacion: {
    label: '🔧 En preparación',
    descripcion: 'Estamos preparando tu pedido. Pronto estará listo.',
  },
  enviado: {
    label: '🚚 En camino',
    descripcion: 'Tu pedido ya fue despachado y está en camino.',
  },
  entregado: {
    label: '✅ Entregado',
    descripcion: 'Tu pedido fue entregado. ¡Esperamos que lo disfrutes!',
  },
};

function maskEmail(email: string): string {
  const [user, domain] = email.split('@');
  return `${user.slice(0, 2)}***@${domain}`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

// ──────────────────────────────────────────────
// Funciones exportadas
// ──────────────────────────────────────────────

export async function sendVerificationEmail(email: string, nombre: string, token: string): Promise<void> {
  const verificationUrl = `${FRONTEND_URL}/verificar-email?token=${token}`;
  try {
    const html = renderTemplate('verification', { nombre, verification_url: verificationUrl });
    const { error } = await resend.emails.send({ from: EMAIL_FROM, to: email, subject: 'Activá tu cuenta en TecnoCel', html });
    if (error) throw new Error(error.message);
    logger.info('Email de verificación enviado', { email: maskEmail(email) });
  } catch (error) {
    logger.error('Error enviando email de verificación:', { error: (error as Error).message });
    throw new Error('No se pudo enviar el correo de verificación');
  }
}

export async function sendResetPasswordEmail(email: string, token: string): Promise<void> {
  const resetUrl = `${FRONTEND_URL}/reset-password?token=${token}`;
  try {
    const html = renderTemplate('reset-password', { reset_url: resetUrl });
    const { error } = await resend.emails.send({ from: EMAIL_FROM, to: email, subject: 'Restablecer contraseña — TecnoCel', html });
    if (error) throw new Error(error.message);
    logger.info('Email de reset de contraseña enviado', { email: maskEmail(email) });
  } catch (error) {
    logger.error('Error enviando email de reset:', { error: (error as Error).message });
    throw new Error('No se pudo enviar el correo de restablecimiento');
  }
}

export async function sendWelcomeEmail(email: string, nombre: string): Promise<void> {
  try {
    const html = renderTemplate('welcome', { nombre, frontend_url: FRONTEND_URL });
    const { error } = await resend.emails.send({ from: EMAIL_FROM, to: email, subject: '¡Tu cuenta está activa! Bienvenido/a a TecnoCel', html });
    if (error) throw new Error(error.message);
    logger.info('Email de bienvenida enviado', { email: maskEmail(email) });
  } catch (error) {
    logger.error('Error enviando email de bienvenida:', { error: (error as Error).message });
    throw new Error('No se pudo enviar el correo de bienvenida');
  }
}

export async function sendOrderConfirmationEmail(email: string, venta: ConfirmacionEmailData): Promise<void> {
  try {
    const html = renderTemplate('order-confirmation', {
      nro_venta: venta.nro_venta,
      nombre_cliente: venta.nombre_cliente,
      total_pagado: `$${venta.total_pagado.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`,
      items_table: buildItemsTable(venta.items),
    });
    const { error } = await resend.emails.send({ from: EMAIL_FROM, to: email, subject: `¡Pedido confirmado! ${venta.nro_venta} — TecnoCel`, html });
    if (error) throw new Error(error.message);
    logger.info('Email de confirmación de compra enviado', { email: maskEmail(email), nro_venta: venta.nro_venta });
  } catch (error) {
    logger.error('Error enviando email de confirmación de compra:', { error: (error as Error).message });
    throw new Error('No se pudo enviar el correo de confirmación de compra');
  }
}

export async function sendCancellationEmail(email: string, venta: VentaEmailData): Promise<void> {
  const motivoHtml = venta.motivo
    ? `<div style="background-color:#FEF2F2;border-left:4px solid #EF4444;padding:12px 16px;border-radius:4px;margin:16px 0;">
         <p style="margin:0;color:#991B1B;font-size:13px;"><strong>Motivo de cancelación:</strong> ${escapeHtml(venta.motivo)}</p>
       </div>`
    : '';
  try {
    const html = renderTemplate('order-cancelled', {
      nro_venta: venta.nro_venta,
      motivo_html: motivoHtml,
      total_pagado: `$${venta.total_pagado.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`,
      items_table: buildItemsTable(venta.items),
    });
    const { error } = await resend.emails.send({ from: EMAIL_FROM, to: email, subject: `Tu pedido ${venta.nro_venta} fue cancelado — TecnoCel`, html });
    if (error) throw new Error(error.message);
    logger.info('Email de cancelación enviado', { email: maskEmail(email), nro_venta: venta.nro_venta });
  } catch (error) {
    logger.error('Error enviando email de cancelación:', { error: (error as Error).message });
    throw new Error('No se pudo enviar el correo de cancelación');
  }
}

export async function sendOrderStatusEmail(email: string, data: EstadoVentaEmailData): Promise<void> {
  const estadoInfo = ESTADO_LABELS[data.nuevo_estado];
  if (!estadoInfo) return;
  try {
    const html = renderTemplate('order-status', {
      nro_venta: data.nro_venta,
      nombre_cliente: data.nombre_cliente,
      estado_label: estadoInfo.label,
      estado_descripcion: estadoInfo.descripcion,
    });
    const { error } = await resend.emails.send({ from: EMAIL_FROM, to: email, subject: `Actualización de tu pedido ${data.nro_venta} — TecnoCel`, html });
    if (error) throw new Error(error.message);
    logger.info('Email de estado de venta enviado', { email: maskEmail(email), nro_venta: data.nro_venta, estado: data.nuevo_estado });
  } catch (error) {
    logger.error('Error enviando email de estado de venta:', { error: (error as Error).message });
    throw new Error('No se pudo enviar el correo de estado de venta');
  }
}

export async function sendCommentReplyEmail(email: string, data: CommentReplyEmailData): Promise<void> {
  const productoUrl = `${FRONTEND_URL}/productos/${data.id_producto}`;
  try {
    const html = renderTemplate('comment-reply', {
      nombre_cliente: escapeHtml(data.nombre_cliente),
      nombre_producto: escapeHtml(data.nombre_producto),
      texto_comentario: escapeHtml(data.texto_comentario),
      texto_respuesta: escapeHtml(data.texto_respuesta),
      producto_url: productoUrl,
    });
    const { error } = await resend.emails.send({ from: EMAIL_FROM, to: email, subject: 'Respondieron tu comentario en TecnoCel', html });
    if (error) throw new Error(error.message);
    logger.info('Email de respuesta a comentario enviado', { email: maskEmail(email) });
  } catch (error) {
    logger.error('Error enviando email de respuesta a comentario:', { error: (error as Error).message });
    throw new Error('No se pudo enviar el correo de respuesta a comentario');
  }
}

export interface ShippingEmailItem {
  nombre: string;
  cantidad: number;
}

export async function sendShippingInTransitEmail(
  email: string,
  data: {
    nombre_cliente: string;
    nro_venta: string;
    nro_seguimiento?: string | null;
    direccion_destino: string;
    items: ShippingEmailItem[];
  }
): Promise<void> {
  const itemsHtml = data.items
    .map(i => `<li style="padding:4px 0;color:#374151;">${i.cantidad}x ${escapeHtml(i.nombre)}</li>`)
    .join('');

  const seguimientoHtml = data.nro_seguimiento
    ? `<div style="background-color:#EFF6FF;border-left:4px solid #3B82F6;padding:12px 16px;border-radius:4px;margin:16px 0;">
         <p style="margin:0;color:#1E40AF;font-size:13px;"><strong>Número de seguimiento:</strong> <code>${escapeHtml(data.nro_seguimiento)}</code></p>
       </div>`
    : '';

  try {
    const html = `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
        <h2 style="color:#0EA5E9;">🚚 Tu pedido está en camino</h2>
        <p>Hola <strong>${escapeHtml(data.nombre_cliente)}</strong>,</p>
        <p>Tu pedido <strong>${data.nro_venta}</strong> ha sido despachado y está en camino.</p>
        ${seguimientoHtml}
        <p><strong>Dirección de entrega:</strong> ${escapeHtml(data.direccion_destino)}</p>
        <p><strong>Productos enviados:</strong></p>
        <ul style="margin:8px 0;padding-left:20px;">${itemsHtml}</ul>
        <p style="color:#64748B;font-size:13px;">Te avisaremos cuando sea entregado.</p>
        <p>¡Gracias por tu compra en TecnoCel!</p>
      </div>`;
    const { error } = await resend.emails.send({
      from: EMAIL_FROM,
      to: email,
      subject: `Tu pedido ${data.nro_venta} está en camino 🚚`,
      html,
    });
    if (error) throw new Error(error.message);
    logger.info('Email de envío en camino enviado', { email: maskEmail(email), nro_venta: data.nro_venta });
  } catch (error) {
    logger.error('Error enviando email en camino:', { error: (error as Error).message });
    throw new Error('No se pudo enviar el correo de envío en camino');
  }
}

export async function sendShippingDeliveredEmail(
  email: string,
  data: {
    nombre_cliente: string;
    nro_venta: string;
    fecha_entrega: string;
    items: ShippingEmailItem[];
  }
): Promise<void> {
  const itemsHtml = data.items
    .map(i => `<li style="padding:4px 0;color:#374151;">${i.cantidad}x ${escapeHtml(i.nombre)}</li>`)
    .join('');

  try {
    const html = `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
        <h2 style="color:#22C55E;">✅ Tu pedido fue entregado</h2>
        <p>Hola <strong>${escapeHtml(data.nombre_cliente)}</strong>,</p>
        <p>Tu pedido <strong>${data.nro_venta}</strong> fue entregado el ${escapeHtml(data.fecha_entrega)}.</p>
        <p><strong>Productos entregados:</strong></p>
        <ul style="margin:8px 0;padding-left:20px;">${itemsHtml}</ul>
        <p>Esperamos que disfrutes tu compra. Si tenés algún problema, no dudes en contactarnos.</p>
        <p>¡Gracias por elegir TecnoCel!</p>
      </div>`;
    const { error } = await resend.emails.send({
      from: EMAIL_FROM,
      to: email,
      subject: `Tu pedido ${data.nro_venta} fue entregado ✅`,
      html,
    });
    if (error) throw new Error(error.message);
    logger.info('Email de entrega enviado', { email: maskEmail(email), nro_venta: data.nro_venta });
  } catch (error) {
    logger.error('Error enviando email entregado:', { error: (error as Error).message });
    throw new Error('No se pudo enviar el correo de entrega');
  }
}

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

export async function sendAccountCreatedByAdminEmail(email: string, nombre: string, token: string): Promise<void> {
  const activationUrl = `${FRONTEND_URL}/activar-cuenta?token=${token}`;
  try {
    const html = renderTemplate('account-created-by-admin', { nombre, activation_url: activationUrl });
    const { error } = await resend.emails.send({ from: EMAIL_FROM, to: email, subject: 'Activá tu cuenta en TecnoCel', html });
    if (error) throw new Error(error.message);
    logger.info('Email de activación por admin enviado', { email: maskEmail(email) });
  } catch (error) {
    logger.error('Error enviando email de activación por admin:', { error: (error as Error).message });
    throw new Error('No se pudo enviar el correo de activación');
  }
}
