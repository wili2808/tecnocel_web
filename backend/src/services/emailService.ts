import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from './loggerService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TEMPLATES_DIR = path.join(__dirname, '..', 'templates', 'email');

// ──────────────────────────────────────────────
// Transporter (Brevo SMTP — solo cambiar .env)
// ──────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT),
  secure: Number(process.env.EMAIL_PORT) === 465,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ──────────────────────────────────────────────
// Motor de plantillas
// ──────────────────────────────────────────────
function renderTemplate(templateName: string, variables: Record<string, string>): string {
  const basePath = path.join(TEMPLATES_DIR, 'base.html');
  const contentPath = path.join(TEMPLATES_DIR, `${templateName}.html`);

  let base = fs.readFileSync(basePath, 'utf-8');
  let content = fs.readFileSync(contentPath, 'utf-8');

  // Reemplazar variables en el contenido
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

// ──────────────────────────────────────────────
// Funciones exportadas
// ──────────────────────────────────────────────

export async function sendVerificationEmail(email: string, nombre: string, token: string): Promise<void> {
  const verificationUrl = `${FRONTEND_URL}/verificar-email?token=${token}`;
  try {
    const html = renderTemplate('verification', { nombre, verification_url: verificationUrl });
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: email,
      subject: 'Activá tu cuenta en TecnoCel',
      html,
    });
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
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: email,
      subject: 'Restablecer contraseña — TecnoCel',
      html,
    });
    logger.info('Email de reset de contraseña enviado', { email: maskEmail(email) });
  } catch (error) {
    logger.error('Error enviando email de reset:', { error: (error as Error).message });
    throw new Error('No se pudo enviar el correo de restablecimiento');
  }
}

export async function sendWelcomeEmail(email: string, nombre: string): Promise<void> {
  try {
    const html = renderTemplate('welcome', { nombre, frontend_url: FRONTEND_URL });
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: email,
      subject: '¡Tu cuenta está activa! Bienvenido/a a TecnoCel',
      html,
    });
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
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: email,
      subject: `¡Pedido confirmado! ${venta.nro_venta} — TecnoCel`,
      html,
    });
    logger.info('Email de confirmación de compra enviado', { email: maskEmail(email), nro_venta: venta.nro_venta });
  } catch (error) {
    logger.error('Error enviando email de confirmación de compra:', { error: (error as Error).message });
    throw new Error('No se pudo enviar el correo de confirmación de compra');
  }
}

export async function sendCancellationEmail(email: string, venta: VentaEmailData): Promise<void> {
  const motivoHtml = venta.motivo
    ? `<div style="background-color:#FEF2F2;border-left:4px solid #EF4444;padding:12px 16px;border-radius:4px;margin:16px 0;">
         <p style="margin:0;color:#991B1B;font-size:13px;"><strong>Motivo de cancelación:</strong> ${venta.motivo}</p>
       </div>`
    : '';
  try {
    const html = renderTemplate('order-cancelled', {
      nro_venta: venta.nro_venta,
      motivo_html: motivoHtml,
      total_pagado: `$${venta.total_pagado.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`,
      items_table: buildItemsTable(venta.items),
    });
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: email,
      subject: `Tu pedido ${venta.nro_venta} fue cancelado — TecnoCel`,
      html,
    });
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
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: email,
      subject: `Actualización de tu pedido ${data.nro_venta} — TecnoCel`,
      html,
    });
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
      nombre_cliente: data.nombre_cliente,
      nombre_producto: data.nombre_producto,
      texto_comentario: data.texto_comentario,
      texto_respuesta: data.texto_respuesta,
      producto_url: productoUrl,
    });
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: email,
      subject: `Respondieron tu comentario en TecnoCel`,
      html,
    });
    logger.info('Email de respuesta a comentario enviado', { email: maskEmail(email) });
  } catch (error) {
    logger.error('Error enviando email de respuesta a comentario:', { error: (error as Error).message });
    throw new Error('No se pudo enviar el correo de respuesta a comentario');
  }
}
