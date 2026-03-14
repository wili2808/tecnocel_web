# Sistema de Email Completo — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrar el sistema de email a Brevo SMTP, implementar plantillas HTML mantenibles, activación de cuenta obligatoria, rate limiting en reset de contraseña, y dos nuevos triggers (estado de venta y respuesta a comentario).

**Architecture:** Se mantiene Nodemailer como cliente SMTP (solo cambia las credenciales al servidor de Brevo), se extrae un motor de plantillas HTML a archivos separados con sintaxis `{{variable}}`, y se agregan los flujos faltantes de verificación de cuenta y notificaciones de estado. No se usa ninguna librería adicional de plantillas para mantener zero-dependency.

**Tech Stack:** Node.js/Express/TypeScript (backend), React 18/TypeScript (frontend), Nodemailer, Brevo SMTP, CSS Modules, React Router.

**Spec:** `docs/plans/2026-03-12-email-system-design.md`

---

## Chunk 1: Brevo Config + Motor de Plantillas HTML

### Archivos afectados
- Modify: `backend/.env.example`
- Create: `backend/src/templates/email/base.html`
- Create: `backend/src/templates/email/welcome.html`
- Create: `backend/src/templates/email/verification.html`
- Create: `backend/src/templates/email/reset-password.html`
- Create: `backend/src/templates/email/order-confirmation.html`
- Create: `backend/src/templates/email/order-cancelled.html`
- Create: `backend/src/templates/email/order-status.html`
- Create: `backend/src/templates/email/comment-reply.html`
- Modify: `backend/src/services/emailService.ts`

---

### Task 1: Actualizar .env.example con variables de Brevo

**Files:**
- Modify: `backend/.env.example`

- [ ] **Step 1: Actualizar la sección de email en `.env.example`**

Reemplazar la sección `# CONFIGURACIÓN DE EMAIL` por:

```env
# ===========================================
# CONFIGURACIÓN DE EMAIL (Brevo SMTP)
# Crear cuenta en brevo.com → Settings → SMTP & API → SMTP
# Verificar el email remitente en Brevo antes de usar
# ===========================================
EMAIL_HOST=smtp-relay.brevo.com
EMAIL_PORT=587
EMAIL_USER=tu_email_registrado_en_brevo@gmail.com
EMAIL_PASS=xsmtpsib-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
EMAIL_FROM=TecnoCel <tu_email@gmail.com>
```

- [ ] **Step 2: Aplicar los mismos cambios en `.env.local` y `.env.aiven` (si existen)**

Buscar y reemplazar los valores de EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS, EMAIL_FROM en los archivos de entorno locales que tengas configurados. **No commitear estos archivos.**

- [ ] **Step 3: Commit**

```bash
git add backend/.env.example
git commit -m "config: actualizar variables de email para Brevo SMTP"
```

---

### Task 2: Crear template base y plantillas HTML

**Files:**
- Create: `backend/src/templates/email/base.html`
- Create: `backend/src/templates/email/welcome.html`
- Create: `backend/src/templates/email/verification.html`
- Create: `backend/src/templates/email/reset-password.html`
- Create: `backend/src/templates/email/order-confirmation.html`
- Create: `backend/src/templates/email/order-cancelled.html`
- Create: `backend/src/templates/email/order-status.html`
- Create: `backend/src/templates/email/comment-reply.html`

- [ ] **Step 1: Crear el directorio de templates**

```bash
mkdir -p backend/src/templates/email
```

- [ ] **Step 2: Crear `base.html`** — layout compartido con header sky-blue y footer

```html
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>TecnoCel</title>
</head>
<body style="margin:0;padding:0;background-color:#F8FAFC;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F8FAFC;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background-color:#0EA5E9;padding:24px 32px;">
              <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;letter-spacing:-0.5px;">TecnoCel</h1>
              <p style="margin:4px 0 0;color:#BAE6FD;font-size:13px;">Tu tienda de tecnología en Argentina</p>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding:32px;">
              {{content}}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color:#F8FAFC;padding:20px 32px;border-top:1px solid #E2E8F0;">
              <p style="margin:0;color:#94A3B8;font-size:12px;text-align:center;">
                © 2026 TecnoCel · Argentina<br/>
                Si no solicitaste este email, podés ignorarlo.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

- [ ] **Step 3: Crear `welcome.html`** — bienvenida post-verificación

```html
<h2 style="margin:0 0 16px;color:#0F172A;font-size:22px;">¡Bienvenido/a a TecnoCel, {{nombre}}!</h2>
<p style="color:#475569;line-height:1.6;">Tu cuenta ha sido verificada exitosamente. Ya podés explorar nuestro catálogo completo de productos tecnológicos.</p>
<p style="color:#475569;line-height:1.6;">Encontrá las mejores ofertas en celulares, tablets, accesorios y más.</p>
<div style="margin:28px 0;">
  <a href="{{frontend_url}}/productos"
     style="display:inline-block;background-color:#0EA5E9;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:6px;font-weight:600;font-size:15px;">
    Ver catálogo
  </a>
</div>
<p style="color:#94A3B8;font-size:13px;margin:0;">Si tenés alguna consulta, no dudes en contactarnos.<br/>— El equipo de TecnoCel</p>
```

- [ ] **Step 4: Crear `verification.html`** — activación de cuenta

```html
<h2 style="margin:0 0 8px;color:#0F172A;font-size:22px;">Verificá tu cuenta</h2>
<p style="color:#64748B;font-size:14px;margin:0 0 20px;">¡Ya casi terminás! Un paso más.</p>
<p style="color:#475569;line-height:1.6;">Hola <strong>{{nombre}}</strong>, gracias por registrarte en TecnoCel. Para activar tu cuenta hacé clic en el botón a continuación:</p>
<div style="margin:28px 0;">
  <a href="{{verification_url}}"
     style="display:inline-block;background-color:#0EA5E9;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:6px;font-weight:600;font-size:15px;">
    Activar mi cuenta
  </a>
</div>
<p style="color:#94A3B8;font-size:13px;">Este enlace expira en <strong>24 horas</strong>.<br/>Si no te registraste en TecnoCel, ignorá este mensaje.</p>
<p style="color:#CBD5E1;font-size:12px;word-break:break-all;">O copiá este enlace en tu navegador:<br/>{{verification_url}}</p>
```

- [ ] **Step 5: Crear `reset-password.html`** — recuperar contraseña

```html
<h2 style="margin:0 0 8px;color:#0F172A;font-size:22px;">Restablecer contraseña</h2>
<p style="color:#64748B;font-size:14px;margin:0 0 20px;">Recibiste esta solicitud porque pediste cambiar tu contraseña.</p>
<p style="color:#475569;line-height:1.6;">Hacé clic en el botón para crear una nueva contraseña:</p>
<div style="margin:28px 0;">
  <a href="{{reset_url}}"
     style="display:inline-block;background-color:#0EA5E9;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:6px;font-weight:600;font-size:15px;">
    Restablecer contraseña
  </a>
</div>
<div style="background-color:#FEF3C7;border-left:4px solid #F59E0B;padding:12px 16px;border-radius:4px;margin:20px 0;">
  <p style="margin:0;color:#92400E;font-size:13px;">⚠️ Este enlace expira en <strong>1 hora</strong>. Si no lo usás a tiempo, deberás solicitar uno nuevo.</p>
</div>
<p style="color:#94A3B8;font-size:13px;margin:0;">Si no solicitaste restablecer tu contraseña, ignorá este mensaje y tu contraseña no cambiará.</p>
<p style="color:#CBD5E1;font-size:12px;word-break:break-all;">O copiá este enlace en tu navegador:<br/>{{reset_url}}</p>
```

- [ ] **Step 6: Crear `order-confirmation.html`** — confirmación de compra

```html
<h2 style="margin:0 0 8px;color:#0F172A;font-size:22px;">¡Gracias por tu compra!</h2>
<p style="color:#64748B;font-size:14px;margin:0 0 20px;">Pedido <strong>{{nro_venta}}</strong> confirmado</p>
<p style="color:#475569;line-height:1.6;">Hola <strong>{{nombre_cliente}}</strong>, tu pedido fue recibido y está siendo procesado.</p>
{{items_table}}
<table width="100%" cellpadding="0" cellspacing="0" style="margin-top:16px;">
  <tr>
    <td style="text-align:right;padding:12px 0;border-top:2px solid #E2E8F0;">
      <strong style="color:#0F172A;font-size:18px;">Total: {{total_pagado}}</strong>
    </td>
  </tr>
</table>
<div style="background-color:#F0FDF4;border-left:4px solid #22C55E;padding:12px 16px;border-radius:4px;margin:20px 0;">
  <p style="margin:0;color:#166534;font-size:13px;">✓ Nos pondremos en contacto para coordinar la entrega o el retiro en tienda.</p>
</div>
<p style="color:#94A3B8;font-size:13px;margin:0;">— El equipo de TecnoCel</p>
```

- [ ] **Step 7: Crear `order-cancelled.html`** — cancelación de venta

```html
<h2 style="margin:0 0 8px;color:#EF4444;font-size:22px;">Venta cancelada</h2>
<p style="color:#64748B;font-size:14px;margin:0 0 20px;">Pedido <strong>{{nro_venta}}</strong></p>
<p style="color:#475569;line-height:1.6;">Te informamos que tu venta <strong>{{nro_venta}}</strong> fue cancelada.</p>
{{motivo_html}}
{{items_table}}
<table width="100%" cellpadding="0" cellspacing="0" style="margin-top:16px;">
  <tr>
    <td style="text-align:right;padding:12px 0;border-top:2px solid #E2E8F0;">
      <strong style="color:#0F172A;font-size:16px;">Total de la venta: {{total_pagado}}</strong>
    </td>
  </tr>
</table>
<p style="color:#475569;margin-top:20px;">Si tenés alguna consulta, no dudes en contactarnos.</p>
<p style="color:#94A3B8;font-size:13px;margin:0;">— El equipo de TecnoCel</p>
```

- [ ] **Step 8: Crear `order-status.html`** — cambio de estado de venta

```html
<h2 style="margin:0 0 8px;color:#0F172A;font-size:22px;">Actualización de tu pedido</h2>
<p style="color:#64748B;font-size:14px;margin:0 0 20px;">Pedido <strong>{{nro_venta}}</strong></p>
<p style="color:#475569;line-height:1.6;">Hola <strong>{{nombre_cliente}}</strong>, tu pedido <strong>{{nro_venta}}</strong> tiene una novedad:</p>
<div style="background-color:#EFF6FF;border-left:4px solid #3B82F6;padding:16px;border-radius:4px;margin:20px 0;">
  <p style="margin:0;color:#1E40AF;font-size:16px;font-weight:600;">{{estado_label}}</p>
  <p style="margin:6px 0 0;color:#3B82F6;font-size:13px;">{{estado_descripcion}}</p>
</div>
<p style="color:#94A3B8;font-size:13px;margin:0;">Si tenés alguna consulta, respondé este mensaje o contactanos.<br/>— El equipo de TecnoCel</p>
```

- [ ] **Step 9: Crear `comment-reply.html`** — respuesta del admin a comentario

```html
<h2 style="margin:0 0 8px;color:#0F172A;font-size:22px;">Respondieron tu comentario</h2>
<p style="color:#64748B;font-size:14px;margin:0 0 20px;">En el producto: <strong>{{nombre_producto}}</strong></p>
<p style="color:#475569;line-height:1.6;">Hola <strong>{{nombre_cliente}}</strong>, el equipo de TecnoCel respondió tu comentario:</p>
<div style="background-color:#F8FAFC;border:1px solid #E2E8F0;border-radius:6px;padding:16px;margin:20px 0;">
  <p style="margin:0 0 8px;color:#94A3B8;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">Tu comentario</p>
  <p style="margin:0;color:#64748B;font-size:14px;font-style:italic;">"{{texto_comentario}}"</p>
</div>
<div style="background-color:#F0F9FF;border:1px solid #BAE6FD;border-radius:6px;padding:16px;margin:20px 0;">
  <p style="margin:0 0 8px;color:#0284C7;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">Respuesta de TecnoCel</p>
  <p style="margin:0;color:#0F172A;font-size:15px;">{{texto_respuesta}}</p>
</div>
<div style="margin:28px 0;">
  <a href="{{producto_url}}"
     style="display:inline-block;background-color:#0EA5E9;color:#ffffff;text-decoration:none;padding:10px 24px;border-radius:6px;font-weight:600;font-size:14px;">
    Ver producto
  </a>
</div>
<p style="color:#94A3B8;font-size:13px;margin:0;">— El equipo de TecnoCel</p>
```

- [ ] **Step 10: Commit de templates**

```bash
git add backend/src/templates/
git commit -m "feat(email): agregar plantillas HTML para todos los emails del sistema"
```

---

### Task 3: Refactorizar emailService.ts con motor de plantillas

**Files:**
- Modify: `backend/src/services/emailService.ts`

- [ ] **Step 1: Reemplazar el contenido completo de `emailService.ts`**

```typescript
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
```

- [ ] **Step 2: Actualizar `backend/src/services/index.ts`** para re-exportar las nuevas funciones

```typescript
export {
  sendVerificationEmail,
  sendResetPasswordEmail,
  sendWelcomeEmail,
  sendOrderConfirmationEmail,
  sendCancellationEmail,
  sendOrderStatusEmail,
  sendCommentReplyEmail,
} from './emailService.js';
```

- [ ] **Step 3: Verificar que el backend compila sin errores**

```bash
cd backend && npm run build
```
Esperado: sin errores de TypeScript.

- [ ] **Step 4: Commit**

```bash
git add backend/src/services/emailService.ts backend/src/services/index.ts
git commit -m "feat(email): refactorizar emailService con motor de plantillas HTML y nuevas funciones"
```

---

## Chunk 2: Activación de Cuenta Obligatoria

### Archivos afectados
- Modify: `backend/src/models/Cliente.ts`
- Create: `database/migrations/add_verification_token_expires.sql`
- Modify: `backend/src/controllers/ClienteController.ts`
- Modify: `backend/src/routes/clienteRoutes.ts`
- Create: `frontend/src/pages/Auth/VerificarEmail/VerificarEmail.tsx`
- Create: `frontend/src/pages/Auth/VerificarEmail/VerificarEmail.module.css`
- Modify: `frontend/src/App.tsx`
- Modify: `frontend/src/components/user/RegisterForm.tsx` (o donde se maneje el post-registro)

---

### Task 4: Agregar campo verification_token_expires al modelo y BD

**Files:**
- Modify: `backend/src/models/Cliente.ts`
- Create: `database/migrations/add_verification_token_expires.sql`

- [ ] **Step 1: Agregar campo al modelo Cliente** — después de `verification_token`

```typescript
// En la clase Cliente (bloque declare)
declare verification_token_expires: Date | null;
```

```typescript
// En Cliente.init() — después del campo verification_token
verification_token_expires: {
  type: DataTypes.DATE,
  allowNull: true,
},
```

- [ ] **Step 2: Crear script de migración SQL**

Crear `database/migrations/add_verification_token_expires.sql`:

```sql
-- Migración: agregar expiración al token de verificación de email
-- Ejecutar: mysql -u root -p db_tecnocel_v4 < database/migrations/add_verification_token_expires.sql

ALTER TABLE tb_clientes
  ADD COLUMN verification_token_expires DATETIME NULL
  AFTER verification_token;
```

- [ ] **Step 3: Ejecutar la migración en la base de datos local**

```bash
mysql -u root -p db_tecnocel_v4 < database/migrations/add_verification_token_expires.sql
```
Verificar: `DESCRIBE tb_clientes;` debe mostrar el nuevo campo.

- [ ] **Step 4: Commit**

```bash
git add backend/src/models/Cliente.ts database/migrations/
git commit -m "feat(auth): agregar campo verification_token_expires al modelo Cliente"
```

---

### Task 5: Actualizar flujo de registro en ClienteController

**Files:**
- Modify: `backend/src/controllers/ClienteController.ts`

- [ ] **Step 1: Actualizar el import de emailService en la línea 8**

```typescript
import { sendVerificationEmail, sendResetPasswordEmail, sendWelcomeEmail } from '../services/emailService.js';
```

- [ ] **Step 2: Actualizar el método `register()`**

Localizar el bloque donde se llama `Cliente.create()` y la llamada a `sendWelcomeEmail`. Reemplazar la lógica post-creación:

**Antes:**
```typescript
// email_verified: true  (auto-verifica)
// sendWelcomeEmail(email, nombre)...
```

**Después — en el `Cliente.create()`, cambiar estos campos:**
```typescript
// Dentro del objeto pasado a Cliente.create():
email_verified: false,
is_web_enabled: false,
verification_token: uuidv4(),
verification_token_expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 horas
```

**Reemplazar la llamada a sendWelcomeEmail por sendVerificationEmail (no bloqueante):**
```typescript
const nombre = `${nuevoCliente.nombre_cliente}`;
sendVerificationEmail(nuevoCliente.email_cliente, nombre, nuevoCliente.verification_token!)
  .catch(err => logger.error('Error enviando email de verificación:', { error: err.message }));
```

**Cambiar la respuesta del register de 201 a:**
```typescript
return res.status(201).json({
  success: true,
  mensaje: 'Registro exitoso. Revisá tu email para activar tu cuenta.',
  requiresVerification: true,
});
```
> **Nota:** NO retornar token JWT en el registro. El cliente debe verificar el email antes de poder loguearse.

- [ ] **Step 3: Actualizar el método `verifyEmail()`**

Localizar el método `verifyEmail` en ClienteController. Reemplazar su implementación:

```typescript
static async verifyEmail(req: Request, res: Response) {
  try {
    const { token } = req.query as { token: string };

    if (!token) {
      return res.status(400).json({ error: 'Token de verificación requerido' });
    }

    const cliente = await Cliente.findOne({
      where: { verification_token: token },
    });

    if (!cliente) {
      return res.status(400).json({ error: 'Token de verificación inválido' });
    }

    if (cliente.verification_token_expires && cliente.verification_token_expires < new Date()) {
      return res.status(400).json({ error: 'El token de verificación expiró. Solicitá un nuevo email de verificación.' });
    }

    await cliente.update({
      email_verified: true,
      is_web_enabled: true,
      verification_token: null,
      verification_token_expires: null,
    });

    // Enviar email de bienvenida (no bloqueante)
    sendWelcomeEmail(cliente.email_cliente, cliente.nombre_cliente)
      .catch(err => logger.error('Error enviando email de bienvenida:', { error: err.message }));

    logger.info('Email verificado exitosamente', { id_cliente: cliente.id_cliente });
    return res.status(200).json({ success: true, mensaje: 'Cuenta verificada exitosamente. Ya podés iniciar sesión.' });
  } catch (error) {
    logger.error('Error en verifyEmail:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
```

- [ ] **Step 4: Agregar método `resendVerificationEmail()`** al final de la clase

```typescript
static async resendVerificationEmail(req: Request, res: Response) {
  try {
    const session = req.usuario;
    // Este endpoint es público — se identifica por email en el body
    const { email } = req.body as { email: string };

    if (!email) {
      return res.status(400).json({ error: 'Email requerido' });
    }

    const cliente = await Cliente.findOne({ where: { email_cliente: email } });

    // Respuesta genérica para no revelar si el email existe
    if (!cliente || cliente.email_verified) {
      return res.status(200).json({ success: true, mensaje: 'Si tu cuenta existe y no está verificada, recibirás un email.' });
    }

    // Regenerar token con nueva expiración de 24h
    const nuevoToken = uuidv4();
    await cliente.update({
      verification_token: nuevoToken,
      verification_token_expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    sendVerificationEmail(cliente.email_cliente, cliente.nombre_cliente, nuevoToken)
      .catch(err => logger.error('Error reenviando email de verificación:', { error: err.message }));

    return res.status(200).json({ success: true, mensaje: 'Si tu cuenta existe y no está verificada, recibirás un email.' });
  } catch (error) {
    logger.error('Error en resendVerificationEmail:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
```

- [ ] **Step 5: Verificar que `uuidv4` está importado** en ClienteController (ya debería estarlo si forgotPassword lo usa)

```typescript
import { v4 as uuidv4 } from 'uuid';
```

- [ ] **Step 6: Commit**

```bash
git add backend/src/controllers/ClienteController.ts
git commit -m "feat(auth): implementar activación de cuenta obligatoria por email"
```

---

### Task 6: Agregar ruta resend en clienteRoutes.ts

**Files:**
- Modify: `backend/src/routes/clienteRoutes.ts`

- [ ] **Step 1: Agregar la ruta pública de reenvío**

En la sección de rutas públicas (antes del `router.use(verificarTokenCliente)`), agregar:

```typescript
router.post('/verify-email/resend', ClienteController.resendVerificationEmail);
```

- [ ] **Step 2: Verificar que la ruta GET `/verify-email` ya existe** (debería existir por la implementación anterior). Si no existe, agregarla:

```typescript
router.get('/verify-email', ClienteController.verifyEmail);
```

- [ ] **Step 3: Compilar y verificar**

```bash
cd backend && npm run build
```

- [ ] **Step 4: Commit**

```bash
git add backend/src/routes/clienteRoutes.ts
git commit -m "feat(auth): agregar ruta POST /verify-email/resend"
```

---

### Task 7: Página frontend de verificación de email

**Files:**
- Create: `frontend/src/pages/Auth/VerificarEmail/VerificarEmail.tsx`
- Create: `frontend/src/pages/Auth/VerificarEmail/VerificarEmail.module.css`
- Modify: `frontend/src/App.tsx`

- [ ] **Step 1: Crear `VerificarEmail.tsx`**

Esta página maneja dos estados:
1. **Sin token en URL** → muestra "Revisá tu email" (post-registro)
2. **Con `?token=xxx` en URL** → llama al backend y muestra resultado

```typescript
import React, { useEffect, useState, memo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import axiosInstance from '../../../api/axiosConfig';
import styles from './VerificarEmail.module.css';

type Estado = 'pendiente' | 'verificando' | 'exito' | 'error' | 'expirado';

const VerificarEmail: React.FC = memo(() => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [estado, setEstado] = useState<Estado>(token ? 'verificando' : 'pendiente');
  const [mensaje, setMensaje] = useState('');
  const [email, setEmail] = useState('');
  const [reenviando, setReenviando] = useState(false);
  const [reenvioOk, setReenvioOk] = useState(false);

  useEffect(() => {
    if (!token) return;

    const verificar = async () => {
      try {
        await axiosInstance.get(`/clientes/verify-email?token=${token}`);
        setEstado('exito');
      } catch (err: unknown) {
        const error = err as { response?: { data?: { error?: string } } };
        const msg = error.response?.data?.error ?? '';
        if (msg.toLowerCase().includes('expir')) {
          setEstado('expirado');
        } else {
          setEstado('error');
          setMensaje(msg || 'Token inválido o ya utilizado.');
        }
      }
    };

    verificar();
  }, [token]);

  const handleReenvio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setReenviando(true);
    try {
      await axiosInstance.post('/clientes/verify-email/resend', { email });
      setReenvioOk(true);
    } catch {
      setReenvioOk(true); // Respuesta genérica — siempre mostrar ok
    } finally {
      setReenviando(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        {estado === 'pendiente' && (
          <>
            <div className={styles.icon}>📧</div>
            <h1 className={styles.title}>Revisá tu email</h1>
            <p className={styles.text}>
              Te enviamos un enlace de activación. Hacé clic en él para activar tu cuenta.
            </p>
            <p className={styles.hint}>¿No llegó? Revisá tu carpeta de spam.</p>
            {!reenvioOk ? (
              <form className={styles.form} onSubmit={handleReenvio}>
                <p className={styles.formLabel}>¿Querés que te reenviemos el email?</p>
                <input
                  className={styles.input}
                  type="email"
                  placeholder="Tu email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
                <button className={styles.btn} type="submit" disabled={reenviando}>
                  {reenviando ? 'Enviando...' : 'Reenviar email'}
                </button>
              </form>
            ) : (
              <p className={styles.success}>✓ Si tu cuenta existe, recibirás el email en minutos.</p>
            )}
          </>
        )}

        {estado === 'verificando' && (
          <>
            <div className={styles.spinner} />
            <p className={styles.text}>Verificando tu cuenta...</p>
          </>
        )}

        {estado === 'exito' && (
          <>
            <div className={styles.icon}>✅</div>
            <h1 className={styles.title}>¡Cuenta activada!</h1>
            <p className={styles.text}>Tu cuenta está lista. Ya podés iniciar sesión.</p>
            <Link to="/login" className={styles.btn}>Iniciar sesión</Link>
          </>
        )}

        {estado === 'expirado' && (
          <>
            <div className={styles.icon}>⏱️</div>
            <h1 className={styles.title}>Enlace expirado</h1>
            <p className={styles.text}>El enlace de verificación expiró (válido 24 horas).</p>
            {!reenvioOk ? (
              <form className={styles.form} onSubmit={handleReenvio}>
                <input
                  className={styles.input}
                  type="email"
                  placeholder="Tu email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
                <button className={styles.btn} type="submit" disabled={reenviando}>
                  {reenviando ? 'Enviando...' : 'Enviar nuevo enlace'}
                </button>
              </form>
            ) : (
              <p className={styles.success}>✓ Revisá tu email.</p>
            )}
          </>
        )}

        {estado === 'error' && (
          <>
            <div className={styles.icon}>❌</div>
            <h1 className={styles.title}>Error de verificación</h1>
            <p className={styles.text}>{mensaje}</p>
            <Link to="/register" className={styles.btn}>Volver al registro</Link>
          </>
        )}
      </div>
    </div>
  );
});

export default VerificarEmail;
```

- [ ] **Step 2: Crear `VerificarEmail.module.css`**

```css
.container {
  min-height: 80vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px 16px;
  background-color: var(--bg-secondary);
}

.card {
  background: var(--bg-primary);
  border-radius: 12px;
  padding: 48px 40px;
  max-width: 440px;
  width: 100%;
  text-align: center;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
}

.icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--border-color);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto 24px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.title {
  font-size: var(--font-size-2xl);
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 12px;
}

.text {
  color: var(--text-secondary);
  font-size: var(--font-size-base);
  line-height: 1.6;
  margin: 0 0 8px;
}

.hint {
  color: var(--text-tertiary);
  font-size: var(--font-size-sm);
  margin: 0 0 24px;
}

.form {
  margin-top: 24px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  text-align: left;
}

.formLabel {
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
  margin: 0;
}

.input {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  font-size: var(--font-size-base);
  background: var(--bg-primary);
  color: var(--text-primary);
  box-sizing: border-box;
}

.input:focus {
  outline: none;
  border-color: var(--color-primary);
}

.btn {
  display: inline-block;
  background-color: var(--color-primary);
  color: #fff;
  border: none;
  border-radius: 6px;
  padding: 12px 24px;
  font-size: var(--font-size-base);
  font-weight: 600;
  cursor: pointer;
  text-decoration: none;
  transition: background-color 0.2s;
  text-align: center;
}

.btn:hover:not(:disabled) {
  background-color: var(--color-primary-dark);
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.success {
  color: var(--color-success);
  font-size: var(--font-size-sm);
  margin-top: 12px;
}

@media (max-width: 480px) {
  .card {
    padding: 32px 24px;
  }
}

@media (prefers-reduced-motion: reduce) {
  * { animation: none !important; transition: none !important; }
}
```

- [ ] **Step 3: Agregar la ruta en `App.tsx`**

Agregar import lazy:
```typescript
const VerificarEmail = lazy(() => import('./pages/Auth/VerificarEmail/VerificarEmail'));
```

Agregar route dentro del bloque `<Route element={<Layout />}>` junto a las otras rutas públicas (después de `/register`):
```tsx
<Route path="/verificar-email" element={<VerificarEmail />} />
```

- [ ] **Step 4: Actualizar RegisterForm para redirigir a la página de verificación**

En `frontend/src/components/user/RegisterForm.tsx`, después de un registro exitoso (en lugar de redirigir a login o mostrar éxito inline), usar:

```typescript
import { useNavigate } from 'react-router-dom';
// ...
const navigate = useNavigate();
// En el handler de éxito:
navigate('/verificar-email');
```

- [ ] **Step 5: Compilar frontend**

```bash
cd frontend && npm run build
```
Esperado: sin errores TypeScript ni de lint.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/pages/Auth/VerificarEmail/ frontend/src/App.tsx frontend/src/components/user/RegisterForm.tsx
git commit -m "feat(auth): agregar página de verificación de email con reenvío"
```

---

## Chunk 3: Rate Limiting en Reset de Contraseña + Página Frontend

### Archivos afectados
- Modify: `backend/src/controllers/ClienteController.ts`
- Create: `frontend/src/pages/Auth/ResetPassword/ResetPassword.tsx`
- Create: `frontend/src/pages/Auth/ResetPassword/ResetPassword.module.css`
- Modify: `frontend/src/App.tsx`

---

### Task 8: Rate limiting en forgot-password

**Files:**
- Modify: `backend/src/controllers/ClienteController.ts`

- [ ] **Step 1: Agregar el Map de rate limiting al inicio de la clase** (fuera de los métodos estáticos, a nivel módulo):

```typescript
// Rate limiting para forgot-password (en memoria, suficiente para desarrollo)
// En producción escalar a Redis si se necesita persistencia entre instancias
const forgotPasswordAttempts = new Map<string, { count: number; resetAt: number }>();

const RATE_LIMIT_MAX_ATTEMPTS = 3;
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutos
```

- [ ] **Step 2: Agregar el chequeo de rate limiting al inicio del método `forgotPassword()`**

Al inicio del método, antes de buscar el cliente en la BD:

```typescript
// Normalizar email para el rate limit
const emailKey = (req.body.email as string ?? '').toLowerCase().trim();

const now = Date.now();
const attempt = forgotPasswordAttempts.get(emailKey);

if (attempt) {
  if (now < attempt.resetAt) {
    if (attempt.count >= RATE_LIMIT_MAX_ATTEMPTS) {
      const minutosRestantes = Math.ceil((attempt.resetAt - now) / 60000);
      return res.status(429).json({
        error: `Demasiados intentos. Esperá ${minutosRestantes} minuto${minutosRestantes !== 1 ? 's' : ''} antes de volver a intentar.`
      });
    }
    forgotPasswordAttempts.set(emailKey, { count: attempt.count + 1, resetAt: attempt.resetAt });
  } else {
    // Ventana expirada — resetear
    forgotPasswordAttempts.set(emailKey, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
  }
} else {
  forgotPasswordAttempts.set(emailKey, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
}
```

- [ ] **Step 3: Limpiar entradas viejas del Map cada hora** (agregar al final del módulo, fuera de la clase):

```typescript
// Cleanup periódico para evitar memory leak
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of forgotPasswordAttempts.entries()) {
    if (now >= value.resetAt) forgotPasswordAttempts.delete(key);
  }
}, 60 * 60 * 1000); // cada hora
```

- [ ] **Step 4: Compilar y verificar**

```bash
cd backend && npm run build
```

- [ ] **Step 5: Commit**

```bash
git add backend/src/controllers/ClienteController.ts
git commit -m "feat(auth): agregar rate limiting (3 intentos/15min) en forgot-password"
```

---

### Task 9: Página frontend de reset de contraseña

**Files:**
- Create: `frontend/src/pages/Auth/ResetPassword/ResetPassword.tsx`
- Create: `frontend/src/pages/Auth/ResetPassword/ResetPassword.module.css`
- Modify: `frontend/src/App.tsx`

- [ ] **Step 1: Crear `ResetPassword.tsx`**

```typescript
import React, { useState, memo } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import axiosInstance from '../../../api/axiosConfig';
import styles from './ResetPassword.module.css';

const ResetPassword: React.FC = memo(() => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [form, setForm] = useState({ password: '', confirm: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [exito, setExito] = useState(false);

  if (!token) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.icon}>⚠️</div>
          <h1 className={styles.title}>Enlace inválido</h1>
          <p className={styles.text}>Este enlace no es válido. Solicitá un nuevo restablecimiento de contraseña.</p>
          <Link to="/login" className={styles.btn}>Ir al inicio de sesión</Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (form.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (form.password !== form.confirm) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setLoading(true);
    try {
      await axiosInstance.post('/clientes/reset-password', {
        token,
        nueva_contrasena: form.password,
      });
      setExito(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      setError(error.response?.data?.error ?? 'El enlace expiró o es inválido. Solicitá uno nuevo.');
    } finally {
      setLoading(false);
    }
  };

  if (exito) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.icon}>✅</div>
          <h1 className={styles.title}>Contraseña actualizada</h1>
          <p className={styles.text}>Tu contraseña fue cambiada exitosamente. Redirigiendo al inicio de sesión...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>Nueva contraseña</h1>
        <p className={styles.text}>Ingresá tu nueva contraseña para TecnoCel.</p>
        <form className={styles.form} onSubmit={handleSubmit}>
          <label className={styles.label}>
            Nueva contraseña
            <input
              className={styles.input}
              type="password"
              placeholder="Mínimo 6 caracteres"
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              required
              minLength={6}
            />
          </label>
          <label className={styles.label}>
            Confirmar contraseña
            <input
              className={styles.input}
              type="password"
              placeholder="Repetí la contraseña"
              value={form.confirm}
              onChange={e => setForm(f => ({ ...f, confirm: e.target.value }))}
              required
            />
          </label>
          {error && <p className={styles.error}>{error}</p>}
          <button className={styles.btn} type="submit" disabled={loading}>
            {loading ? 'Guardando...' : 'Guardar nueva contraseña'}
          </button>
        </form>
        <Link to="/login" className={styles.link}>Volver al inicio de sesión</Link>
      </div>
    </div>
  );
});

export default ResetPassword;
```

- [ ] **Step 2: Crear `ResetPassword.module.css`**

```css
.container {
  min-height: 80vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px 16px;
  background-color: var(--bg-secondary);
}

.card {
  background: var(--bg-primary);
  border-radius: 12px;
  padding: 48px 40px;
  max-width: 420px;
  width: 100%;
  text-align: center;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
}

.icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.title {
  font-size: var(--font-size-2xl);
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 8px;
}

.text {
  color: var(--text-secondary);
  font-size: var(--font-size-base);
  line-height: 1.6;
  margin: 0 0 24px;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 16px;
  text-align: left;
}

.label {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: var(--font-size-sm);
  font-weight: 500;
  color: var(--text-primary);
}

.input {
  padding: 10px 14px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  font-size: var(--font-size-base);
  background: var(--bg-primary);
  color: var(--text-primary);
}

.input:focus {
  outline: none;
  border-color: var(--color-primary);
}

.error {
  color: var(--color-error);
  font-size: var(--font-size-sm);
  margin: 0;
  text-align: left;
}

.btn {
  background-color: var(--color-primary);
  color: #fff;
  border: none;
  border-radius: 6px;
  padding: 12px;
  font-size: var(--font-size-base);
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn:hover:not(:disabled) {
  background-color: var(--color-primary-dark);
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.link {
  display: inline-block;
  margin-top: 20px;
  color: var(--color-primary);
  font-size: var(--font-size-sm);
  text-decoration: none;
}

.link:hover {
  text-decoration: underline;
}

@media (max-width: 480px) {
  .card { padding: 32px 24px; }
}

@media (prefers-reduced-motion: reduce) {
  * { animation: none !important; transition: none !important; }
}
```

- [ ] **Step 3: Agregar ruta en `App.tsx`**

Agregar import lazy:
```typescript
const ResetPassword = lazy(() => import('./pages/Auth/ResetPassword/ResetPassword'));
```

Agregar route en el bloque `<Route element={<Layout />}>` junto a las rutas públicas:
```tsx
<Route path="/reset-password" element={<ResetPassword />} />
```

- [ ] **Step 4: Agregar enlace "¿Olvidaste tu contraseña?" en la página de Login si no existe**

En `frontend/src/components/user/AuthForm.tsx` (o donde se maneje el form de login), verificar si hay un link a `/forgot-password` o similar. Si no existe, agregar:
```tsx
<Link to="/forgot-password" className={styles.forgotLink}>¿Olvidaste tu contraseña?</Link>
```

> Nota: Si el endpoint de forgot-password tiene página frontend propia, verificar que apunte al endpoint `POST /api/clientes/forgot-password`.

- [ ] **Step 5: Build y verificar**

```bash
cd frontend && npm run build
```

- [ ] **Step 6: Commit**

```bash
git add frontend/src/pages/Auth/ResetPassword/ frontend/src/App.tsx
git commit -m "feat(auth): agregar página de reset de contraseña con validación frontend"
```

---

## Chunk 4: Nuevos Triggers de Email

### Archivos afectados
- Modify: `backend/src/controllers/AdminVentaController.ts`
- Modify: `backend/src/routes/ventaRoutes.ts`
- Modify: `backend/src/controllers/ComentarioController.ts`

---

### Task 10: Email de estado de venta + nuevo endpoint

**Files:**
- Modify: `backend/src/controllers/AdminVentaController.ts`
- Modify: `backend/src/routes/ventaRoutes.ts`

- [ ] **Step 1: Agregar import de `sendOrderStatusEmail` en AdminVentaController**

En la línea de imports de emailService:
```typescript
import { sendCancellationEmail, sendOrderStatusEmail } from '../services/emailService.js';
```

- [ ] **Step 2: Agregar el método `actualizarEstadoVenta()` en AdminVentaController**

```typescript
static async actualizarEstadoVenta(req: Request, res: Response) {
  try {
    const { id_venta } = req.params;
    const { estado } = req.body as { estado: string };

    const estadosValidos = ['en_preparacion', 'enviado', 'entregado'] as const;
    type EstadoVenta = typeof estadosValidos[number];

    if (!estadosValidos.includes(estado as EstadoVenta)) {
      return res.status(400).json({ error: `Estado inválido. Valores permitidos: ${estadosValidos.join(', ')}` });
    }

    const venta = await Venta.findByPk(parseInt(id_venta), {
      include: [{ model: Cliente, as: 'cliente', attributes: ['email_cliente', 'nombre_cliente'] }]
    });

    if (!venta) {
      return res.status(404).json({ error: 'Venta no encontrada' });
    }

    if (venta.estado === 'cancelada') {
      return res.status(400).json({ error: 'No se puede actualizar el estado de una venta cancelada' });
    }

    await venta.update({ estado });

    logger.info('Estado de venta actualizado', { id_venta, estado, id_usuario: req.usuario?.id });

    // Enviar email al cliente (no bloqueante)
    const cliente = (venta as unknown as { cliente?: { email_cliente: string; nombre_cliente: string } }).cliente;
    if (cliente?.email_cliente) {
      const nroVenta = `V-${venta.nro_venta.toString().padStart(5, '0')}`;
      sendOrderStatusEmail(cliente.email_cliente, {
        nro_venta: nroVenta,
        nombre_cliente: cliente.nombre_cliente,
        nuevo_estado: estado as EstadoVenta,
      }).catch(err => logger.error('Error enviando email de estado de venta:', { error: err.message }));
    }

    return res.status(200).json({ success: true, mensaje: `Estado de venta actualizado a: ${estado}` });
  } catch (error) {
    logger.error('Error en actualizarEstadoVenta:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
```

> **Nota:** Verificar que `Venta` tenga asociación `belongsTo` con `Cliente` en `relaciones.ts` con el alias `'cliente'`. Si el alias es distinto, ajustarlo.

- [ ] **Step 3: Agregar la ruta en `ventaRoutes.ts`**

En la sección de rutas admin protegidas (dentro del bloque con `verificarToken`), después de la ruta de cancelar:

```typescript
router.patch(
  '/admin/:id_venta/estado',
  verificarRol([ROLES.ADMIN, ROLES.GERENTE, ROLES.VENDEDOR]),
  AdminVentaController.actualizarEstadoVenta.bind(AdminVentaController)
);
```

- [ ] **Step 4: Compilar y verificar**

```bash
cd backend && npm run build
```

- [ ] **Step 5: Commit**

```bash
git add backend/src/controllers/AdminVentaController.ts backend/src/routes/ventaRoutes.ts
git commit -m "feat(ventas): agregar endpoint PATCH /admin/:id_venta/estado con email de notificación"
```

---

### Task 11: Email al cliente cuando admin responde un comentario

**Files:**
- Modify: `backend/src/controllers/ComentarioController.ts`

- [ ] **Step 1: Agregar import de `sendCommentReplyEmail` en ComentarioController**

```typescript
import { sendCommentReplyEmail } from '../services/emailService.js';
```

- [ ] **Step 2: Localizar el método `crearRespuestaAdmin()`** (alrededor de la línea 1004 según el análisis)

Después de que se crea la respuesta exitosamente y se loguea, agregar el envío de email (antes del `return res.status(201)`):

```typescript
// Enviar email al autor del comentario original (no bloqueante)
try {
  // Obtener datos del comentario original con el cliente y el producto
  const comentarioConDatos = await Comentario.findByPk(comentarioId, {
    include: [
      { model: Cliente, as: 'cliente', attributes: ['email_cliente', 'nombre_cliente'] },
      { model: Almacen, as: 'producto', attributes: ['nombre'] },
    ],
  });

  const clienteComentario = (comentarioConDatos as unknown as {
    cliente?: { email_cliente: string; nombre_cliente: string };
    producto?: { nombre: string };
  });

  if (clienteComentario.cliente?.email_cliente) {
    sendCommentReplyEmail(clienteComentario.cliente.email_cliente, {
      nombre_cliente: clienteComentario.cliente.nombre_cliente,
      nombre_producto: clienteComentario.producto?.nombre ?? 'producto',
      id_producto: comentarioConDatos?.get('id_almacen') as number,
      texto_comentario: (comentarioConDatos?.get('comentario') as string ?? '').substring(0, 200),
      texto_respuesta: contenido,
    }).catch(err => logger.error('Error enviando email de respuesta a comentario:', { error: err.message }));
  }
} catch (err) {
  logger.error('Error obteniendo datos para email de respuesta:', { error: (err as Error).message });
}
```

> **Nota:** Verificar los aliases de las asociaciones en `relaciones.ts` para `Comentario → Cliente` y `Comentario → Almacen`. Ajustar si son distintos.

- [ ] **Step 3: Compilar y verificar**

```bash
cd backend && npm run build
```

- [ ] **Step 4: Commit**

```bash
git add backend/src/controllers/ComentarioController.ts
git commit -m "feat(comentarios): enviar email al cliente cuando admin responde su comentario"
```

---

## Chunk 5: Verificación Manual y Configuración Brevo

### Task 12: Setup Brevo y prueba end-to-end

- [ ] **Step 1: Crear cuenta en Brevo**

1. Ir a https://brevo.com → crear cuenta gratuita con el email del proyecto
2. Verificar el email de confirmación de Brevo
3. Ir a **Settings → Senders & IPs → Senders** → agregar y verificar el email remitente
4. Ir a **Settings → SMTP & API → SMTP** → copiar:
   - Login (email)
   - Master password / SMTP key (formato `xsmtpsib-...`)

- [ ] **Step 2: Configurar variables en el entorno local**

En `backend/.env` (local, no commitear):
```env
EMAIL_HOST=smtp-relay.brevo.com
EMAIL_PORT=587
EMAIL_USER=tu_email@gmail.com
EMAIL_PASS=xsmtpsib-xxxxx
EMAIL_FROM=TecnoCel <tu_email@gmail.com>
```

- [ ] **Step 3: Probar el flujo de registro**

```bash
# Con el servidor de backend corriendo (npm run dev)
curl -X POST http://localhost:3000/api/clientes/register \
  -H "Content-Type: application/json" \
  -d '{"nombre_cliente":"Test","apellido_cliente":"User","email_cliente":"tu_email_real@gmail.com","password":"test1234"}'
```
Esperado:
- Response `201` con `requiresVerification: true`
- Email de verificación recibido en tu bandeja (no spam)
- Cliente en BD con `email_verified: false`

- [ ] **Step 4: Probar el flujo de verificación**

1. Copiar el token del email (o de la BD: `SELECT verification_token FROM tb_clientes WHERE email_cliente='...'`)
2. Abrir: `http://localhost:5173/verificar-email?token=EL_TOKEN`
3. Verificar que la página muestra "¡Cuenta activada!" y el email de bienvenida llega

- [ ] **Step 5: Probar el flujo de reset de contraseña**

```bash
curl -X POST http://localhost:3000/api/clientes/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"tu_email_real@gmail.com"}'
```
Esperado: email con enlace de reset. Abrir el enlace → completar formulario → verificar que contraseña cambia.

- [ ] **Step 6: Probar rate limiting**

Enviar 4 requests seguidos a `forgot-password` con el mismo email.
Esperado: las primeras 3 retornan `200`, la 4ta retorna `429` con mensaje de tiempo de espera.

- [ ] **Step 7: Configurar variables en Render**

En el dashboard de Render → backend service → Environment → agregar:
```
EMAIL_HOST=smtp-relay.brevo.com
EMAIL_PORT=587
EMAIL_USER=...
EMAIL_PASS=...
EMAIL_FROM=...
```

- [ ] **Step 8: Commit final**

```bash
git add .
git commit -m "docs: verificación completa del sistema de email con Brevo"
```

---

## Resumen de Archivos del Sistema

| Archivo | Acción | Chunk |
|---|---|---|
| `backend/.env.example` | Modify | 1 |
| `backend/src/templates/email/*.html` (8 archivos) | Create | 1 |
| `backend/src/services/emailService.ts` | Modify (rewrite) | 1 |
| `backend/src/services/index.ts` | Modify | 1 |
| `backend/src/models/Cliente.ts` | Modify | 2 |
| `database/migrations/add_verification_token_expires.sql` | Create | 2 |
| `backend/src/controllers/ClienteController.ts` | Modify | 2, 3 |
| `backend/src/routes/clienteRoutes.ts` | Modify | 2 |
| `frontend/src/pages/Auth/VerificarEmail/VerificarEmail.tsx` | Create | 2 |
| `frontend/src/pages/Auth/VerificarEmail/VerificarEmail.module.css` | Create | 2 |
| `frontend/src/pages/Auth/ResetPassword/ResetPassword.tsx` | Create | 3 |
| `frontend/src/pages/Auth/ResetPassword/ResetPassword.module.css` | Create | 3 |
| `frontend/src/App.tsx` | Modify | 2, 3 |
| `frontend/src/components/user/RegisterForm.tsx` | Modify | 2 |
| `backend/src/controllers/AdminVentaController.ts` | Modify | 4 |
| `backend/src/routes/ventaRoutes.ts` | Modify | 4 |
| `backend/src/controllers/ComentarioController.ts` | Modify | 4 |
