# Sistema de Email — TecnoCel

## Situación actual

El sistema de emails **funciona en producción solo para el email registrado en Resend** (la cuenta con la que te diste de alta en resend.com).

Esto se debe a que se usa el remitente `onboarding@resend.dev`, que es el dominio de prueba de Resend. Con ese remitente, Resend solo permite enviar a la dirección verificada de tu cuenta — cualquier otro destinatario es bloqueado silenciosamente.

**Para enviar emails a cualquier usuario** se necesita verificar un dominio propio en Resend (ver sección "Pasos para producción real" más abajo).

---

## Por qué dejó de funcionar en Render (historial)

### Configuración original — Gmail SMTP

El sistema usaba **nodemailer con Gmail SMTP** (puerto 587):

```
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=wili280892@gmail.com
EMAIL_PASS=<app password de Google>
```

Funcionaba perfectamente en desarrollo local porque la conexión TCP al puerto 587 de Gmail no tiene restricciones en una red doméstica.

### Por qué falló en Render

**Render bloquea los puertos SMTP salientes (25, 465, 587) en el plan gratuito.**

Es una medida anti-spam estándar de los proveedores cloud (AWS, GCP, Azure y Render hacen lo mismo). Cuando el backend intentaba conectarse a `smtp.gmail.com:587`, la conexión simplemente hacía timeout:

```json
{ "error": "Connection timeout", "message": "Error enviando email de respuesta a comentario:" }
```

El error no rompía el flujo principal (el código usaba fire-and-forget en algunas partes), por eso la app seguía funcionando pero los emails nunca llegaban.

### La solución — Resend HTTP API

Se reemplazó nodemailer por **Resend**, que funciona vía HTTP API (puerto 443 — nunca bloqueado):

```
Tu servidor → POST https://api.resend.com/emails → Resend envía el email
```

En lugar de abrir una conexión TCP directa a un servidor de correo, se hace una llamada REST normal. Resend maneja la entrega por su cuenta desde sus propios servidores con buena reputación.

**Dependencia instalada:** `resend` (reemplaza a `nodemailer`)

**Variables de entorno reemplazadas:**

| Antes (SMTP) | Ahora (Resend) |
|---|---|
| `EMAIL_HOST` | — (eliminada) |
| `EMAIL_PORT` | — (eliminada) |
| `EMAIL_USER` | — (eliminada) |
| `EMAIL_PASS` | — (eliminada) |
| `EMAIL_FROM` | `EMAIL_FROM` (se mantiene) |
| — | `RESEND_API_KEY` (nueva) |

---

## Pasos para habilitar emails a cualquier usuario (producción real)

Requiere tener un dominio propio (ej: `tecnocel.com.ar`).

1. Entrar a [resend.com](https://resend.com) → **Domains** → **Add Domain**
2. Ingresar el dominio y copiar los registros DNS que Resend provee (TXT y MX)
3. Agregar esos registros en el panel de tu proveedor de dominio (NIC Argentina, Namecheap, etc.)
4. Esperar verificación (puede tardar unos minutos)
5. Actualizar la variable de entorno en Render:
   ```
   EMAIL_FROM=TecnoCel <noreply@tudominio.com.ar>
   ```

Con eso los emails llegan a cualquier destinatario.

---

## Configuración actual en producción (Render)

```
RESEND_API_KEY=re_...        ← API key de resend.com
EMAIL_FROM=TecnoCel <onboarding@resend.dev>
FRONTEND_URL=https://tu-app.vercel.app   ← importante para los links en los emails
```

## Emails que envía el sistema

| Función | Trigger | Template |
|---|---|---|
| `sendVerificationEmail` | Registro de nuevo cliente | `verification.html` |
| `sendWelcomeEmail` | Verificación de email completada | `welcome.html` |
| `sendResetPasswordEmail` | Solicitud de recuperación de contraseña | `reset-password.html` |
| `sendOrderConfirmationEmail` | Compra confirmada | `order-confirmation.html` |
| `sendCancellationEmail` | Venta cancelada por admin | `order-cancelled.html` |
| `sendOrderStatusEmail` | Cambio de estado de envío | `order-status.html` |
| `sendCommentReplyEmail` | Admin responde un comentario | `comment-reply.html` |

Las plantillas HTML están en `backend/src/templates/email/`.
