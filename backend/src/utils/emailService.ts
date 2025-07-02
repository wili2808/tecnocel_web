import nodemailer from 'nodemailer';
import logger from './logger.js';

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
    logger.info(`Correo de verificación enviado a ${email}`);
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
      subject: 'Recupera tu contraseña en TecnoCel',
      html: `
        <h2>Recuperación de contraseña</h2>
        <p>Haz clic en el siguiente enlace para restablecer tu contraseña:</p>
        <a href="${resetUrl}">${resetUrl}</a>
      `,
    });
    logger.info(`Correo de recuperación enviado a ${email}`);
  } catch (error) {
    logger.error('Error enviando correo de recuperación:', error);
    throw new Error('No se pudo enviar el correo de recuperación');
  }
} 