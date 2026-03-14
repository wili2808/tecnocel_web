# Diseño: Sistema de Email Completo — TecnoCel Web
**Fecha:** 2026-03-12
**Estado:** Aprobado para implementación

---

## Contexto

El proyecto ya tiene un `emailService.ts` funcional con Nodemailer + Gmail SMTP. El backend corre en Render (IPs dinámicas compartidas), lo que hace que Gmail SMTP sea poco confiable en producción. El frontend está en Vercel con dominio gratuito (subdominio `.vercel.app`), sin dominio propio por ahora.

## Decisiones de Diseño

### Proveedor: Brevo (SMTP)
- **Por qué:** Compatible con Nodemailer existente (solo cambio de `.env`), 300 emails/día gratis, verifica email sin necesitar dominio propio, IPs con buena reputación para Render.
- **Descartados:** Resend (from forzado a `onboarding@resend.dev` sin dominio propio), Gmail SMTP (IPs de Render en listas de spam).

### Activación de Cuenta: Obligatoria
- Hoy `email_verified` se pone `true` automáticamente al registrar. Se cambia a flujo explícito: registrar → email con token → click → cuenta activa.
- Cuentas sin verificar pueden existir en BD pero no loguearse (el middleware `verificarTokenCliente` ya valida `email_verified`).

### Plantillas: Archivos HTML separados
- Las plantillas salen de `emailService.ts` y se mueven a `backend/src/templates/email/*.html`.
- Variables con sintaxis `{{variable}}` reemplazadas por función helper.
- Ventaja: diseño editable sin tocar lógica, fácil iterar estilos.

### Rate Limiting: En forgot-password
- Se agrega límite de 3 intentos por email cada 15 minutos usando un Map en memoria.
- Suficiente para desarrollo; en producción se puede mover a Redis.

---

## Emails del Sistema (Estado Final)

| # | Trigger | Función | Bloqueante | Estado |
|---|---------|---------|-----------|--------|
| 1 | Registro exitoso | `sendVerificationEmail()` | No | Refactorizar (ya existe pero no se usa) |
| 2 | Reenvío de verificación | `sendVerificationEmail()` | Sí | Nuevo endpoint |
| 3 | Forgot password | `sendResetPasswordEmail()` | Sí | Ya existe — mejorar template + rate limiting |
| 4 | Compra confirmada | `sendOrderConfirmationEmail()` | No | Ya existe — mejorar template |
| 5 | Venta cancelada | `sendCancellationEmail()` | No | Ya existe — mejorar template |
| 6 | Estado de venta cambia | `sendOrderStatusEmail()` | No | Nuevo |
| 7 | Admin responde comentario | `sendCommentReplyEmail()` | No | Nuevo |

---

## Arquitectura

### Estructura de archivos nueva/modificada

```
backend/src/
├── services/
│   └── emailService.ts          ← refactorizar: plantillas externas + nuevas funciones
├── templates/
│   └── email/
│       ├── base.html            ← layout base con header/footer TecnoCel
│       ├── verification.html    ← activación de cuenta
│       ├── reset-password.html  ← recuperar contraseña
│       ├── welcome.html         ← bienvenida (post-verificación)
│       ├── order-confirmation.html
│       ├── order-cancelled.html
│       ├── order-status.html    ← estado de venta cambia
│       └── comment-reply.html   ← respuesta a comentario
├── controllers/
│   └── ClienteController.ts    ← activación de cuenta + rate limiting
└── routes/
    └── clienteRoutes.ts         ← nuevo endpoint POST /verify-email/resend
```

### Flujo de activación de cuenta

```
POST /clientes/register
  → crear Cliente (email_verified: false)
  → generar verification_token (UUID)
  → sendVerificationEmail() [no bloqueante]
  → responder 201 "Revisa tu email para activar tu cuenta"

GET /clientes/verify-email?token=UUID
  → validar token existe y no expiró (24h)
  → Cliente.update({ email_verified: true, verification_token: null })
  → redirect frontend /auth/verificado ó JSON 200

POST /clientes/verify-email/resend  [protegido: requiere token JWT]
  → verificar que email_verified === false
  → regenerar token + reenviar email
  → responder 200
```

### Flujo de reset de contraseña (mejorado)

```
POST /clientes/forgot-password (email)
  → rate limiting: max 3 requests / 15 min por email
  → si supera límite → 429 "Demasiados intentos"
  → buscar cliente, generar UUID, guardar reset_token + expires (1h)
  → await sendResetPasswordEmail()
  → siempre responder 200 (no revelar si email existe)

POST /clientes/reset-password (token, nueva_contraseña)
  → validar token + expiración
  → hashear nueva contraseña
  → limpiar reset_token, reset_token_expires
  → responder 200
```

### Flujo de estado de venta

```
PATCH /ventas/admin/:id/estado (nuevo_estado)
  → AdminVentaController actualiza estado
  → si estado en ['en_preparacion', 'enviado', 'entregado']
    → sendOrderStatusEmail() [no bloqueante]
```

### Flujo de respuesta a comentario

```
POST /comentarios/:id/respuesta (texto_respuesta)
  → ComentarioController guarda respuesta
  → sendCommentReplyEmail() [no bloqueante]  ← NUEVO (hoy solo hay notificación interna)
```

---

## Template Base — Diseño

- Fondo: `#F8FAFC` (gris claro)
- Contenedor: 600px, fondo blanco, border-radius 8px
- Header: fondo `#0EA5E9` (sky blue), logo/nombre TecnoCel en blanco
- Footer: texto gris, "© 2026 TecnoCel. Argentina."
- Fuente: Arial, sans-serif (compatible email clients)
- Botón CTA: fondo `#0EA5E9`, texto blanco, border-radius 6px

---

## Variables de Entorno (cambios)

```env
# Brevo SMTP (reemplaza Gmail)
EMAIL_HOST=smtp-relay.brevo.com
EMAIL_PORT=587
EMAIL_USER=tu@gmail.com
EMAIL_PASS=xsmtpsib-xxxxxxxxxxxxxxxx   # clave SMTP de Brevo
EMAIL_FROM=TecnoCel <tu@gmail.com>

# Nuevas variables
VERIFICATION_TOKEN_EXPIRES_HOURS=24   # expiración token verificación
```

---

## Modelo Cliente — Cambios

El campo `verification_token` ya existe en el modelo. Se agrega:
- `verification_token_expires: Date | null` — expiración del token de verificación (24h)

Requiere migración SQL: `ALTER TABLE tb_clientes ADD COLUMN verification_token_expires DATETIME NULL;`

---

## Consideraciones de Seguridad

- `forgot-password` siempre responde 200 aunque el email no exista (anti-enumeración)
- Rate limiting en memoria (Map) — suficiente para desarrollo/staging
- Tokens son UUID v4 (criptográficamente aleatorios)
- Links de reset/verificación expiran (1h y 24h respectivamente)
- Emails sensibles en logs se enmascaran parcialmente (`u***@gmail.com`)

---

## Lo que NO se implementa en esta iteración

- Queue de emails con reintentos (Bull/BullMQ) — overkill para el volumen actual
- Webhooks de entrega (bounces) de Brevo — requiere endpoint público verificado
- Email de cambio de contraseña exitoso — nice-to-have, no crítico
- Plantillas editables desde panel admin — fuera de scope
- Internacionalización de plantillas — solo español (es-AR)
