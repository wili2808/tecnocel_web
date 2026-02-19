import nodemailer from 'nodemailer';
import logger from './loggerService.js';

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT),
  secure: Number(process.env.EMAIL_PORT) === 465, // true para 465, false para otros
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export async function sendVerificationEmail(email: string, token: string) {
  const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verificar-email?token=${token}`;
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: email,
      subject: 'Verifica tu cuenta en TecnoCel',
      html: `
        <h2>¡Bienvenido a TecnoCel!</h2>
        <p>Haz clic en el siguiente enlace para verificar tu cuenta:</p>
        <a href="${verificationUrl}">${verificationUrl}</a>
      `,
    });
    logger.info('Correo de verificación enviado', { email: email });
  } catch (error) {
    logger.error('Error enviando correo de verificación:', error);
    throw new Error('No se pudo enviar el correo de verificación');
  }
}

export async function sendResetPasswordEmail(email: string, token: string) {
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${token}`;
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: email,
      subject: 'Restablecer tu contraseña en TecnoCel',
      html: `
        <h2>Restablecer Contraseña</h2>
        <p>Haz clic en el siguiente enlace para restablecer tu contraseña:</p>
        <a href="${resetUrl}">${resetUrl}</a>
        <p>Este enlace expirará en 1 hora.</p>
      `,
    });
    logger.info('Correo de restablecimiento enviado', { email: email });
  } catch (error) {
    logger.error('Error enviando correo de restablecimiento:', error);
    throw new Error('No se pudo enviar el correo de restablecimiento');
  }
}

export async function sendWelcomeEmail(email: string, nombre: string) {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: email,
      subject: '¡Bienvenido/a a TecnoCel!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #0EA5E9;">¡Bienvenido/a a TecnoCel, ${nombre}!</h2>
          <p>Tu cuenta ha sido creada exitosamente. Ya podés explorar nuestro catálogo de productos tecnológicos.</p>
          <p>Si tenés alguna consulta, no dudes en contactarnos.</p>
          <p style="color: #666; font-size: 14px;">— El equipo de TecnoCel</p>
        </div>
      `,
    });
    logger.info('Correo de bienvenida enviado', { email });
  } catch (error) {
    logger.error('Error enviando correo de bienvenida:', error);
    throw new Error('No se pudo enviar el correo de bienvenida');
  }
}

interface ItemEmail {
  nombre_producto?: string;
  nombre?: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
}

interface VentaEmailData {
  nro_venta: string;
  total_pagado: number;
  motivo?: string | null;
  items: ItemEmail[];
}

interface ConfirmacionEmailData {
  nro_venta: string;
  nombre_cliente: string;
  total_pagado: number;
  items: ItemEmail[];
}

function buildItemsTable(items: ItemEmail[]): string {
  const filas = items.map(item => {
    const nombre = item.nombre_producto || item.nombre || 'Producto';
    return `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #eee;">${nombre}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.cantidad}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">$${item.precio_unitario.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">$${item.subtotal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</td>
      </tr>
    `;
  }).join('');
  return `
    <table style="width: 100%; border-collapse: collapse; margin-top: 16px;">
      <thead>
        <tr style="background: #f3f4f6;">
          <th style="padding: 8px; text-align: left;">Producto</th>
          <th style="padding: 8px; text-align: center;">Cant.</th>
          <th style="padding: 8px; text-align: right;">Precio unit.</th>
          <th style="padding: 8px; text-align: right;">Subtotal</th>
        </tr>
      </thead>
      <tbody>${filas}</tbody>
    </table>
  `;
}

export async function sendCancellationEmail(email: string, venta: VentaEmailData) {
  try {
    const motivoHtml = venta.motivo
      ? `<p><strong>Motivo de cancelación:</strong> ${venta.motivo}</p>`
      : '';
    const totalFormateado = `$${venta.total_pagado.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`;

    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: email,
      subject: `Tu venta ${venta.nro_venta} ha sido cancelada — TecnoCel`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #EF4444;">Venta cancelada: ${venta.nro_venta}</h2>
          <p>Te informamos que tu venta <strong>${venta.nro_venta}</strong> ha sido cancelada.</p>
          ${motivoHtml}
          <p><strong>Total de la venta:</strong> ${totalFormateado}</p>
          ${buildItemsTable(venta.items)}
          <p style="margin-top: 24px;">Si tenés alguna consulta sobre este proceso, no dudes en contactarnos.</p>
          <p style="color: #666; font-size: 14px;">— El equipo de TecnoCel</p>
        </div>
      `,
    });
    logger.info('Correo de cancelación enviado', { email, nro_venta: venta.nro_venta });
  } catch (error) {
    logger.error('Error enviando correo de cancelación:', error);
    throw new Error('No se pudo enviar el correo de cancelación');
  }
}

export async function sendOrderConfirmationEmail(email: string, venta: ConfirmacionEmailData) {
  try {
    const totalFormateado = `$${venta.total_pagado.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`;

    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: email,
      subject: `¡Pedido confirmado! ${venta.nro_venta} — TecnoCel`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #0EA5E9;">¡Gracias por tu compra, ${venta.nombre_cliente}!</h2>
          <p>Tu pedido <strong>${venta.nro_venta}</strong> ha sido confirmado exitosamente.</p>
          ${buildItemsTable(venta.items)}
          <p style="margin-top: 16px;"><strong>Total:</strong> ${totalFormateado}</p>
          <p>Nos pondremos en contacto para coordinar la entrega o el retiro en tienda.</p>
          <p style="color: #666; font-size: 14px;">— El equipo de TecnoCel</p>
        </div>
      `,
    });
    logger.info('Correo de confirmación de compra enviado', { email, nro_venta: venta.nro_venta });
  } catch (error) {
    logger.error('Error enviando correo de confirmación de compra:', error);
    throw new Error('No se pudo enviar el correo de confirmación de compra');
  }
}
