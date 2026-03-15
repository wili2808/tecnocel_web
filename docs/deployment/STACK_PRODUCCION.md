# Stack de Producción — TecnoCel Web

> Estado actual del deployment. Este archivo refleja la infraestructura real en uso.

**Última actualización**: Marzo 2025

---

## Infraestructura Actual

| Capa | Servicio | Plan | Notas |
|------|----------|------|-------|
| **Frontend** | Vercel | Free | Deploy automático desde `main` |
| **Backend (API)** | Render | Free | Auto-sleep tras 15 min de inactividad |
| **Base de Datos** | Aiven (MySQL) | Free trial → pago | SSL obligatorio en conexión |
| **Imágenes** | Cloudinary | Free (25 GB) | CDN incluido, transformaciones on-the-fly |

---

## URLs de Producción

```
Frontend:  https://tecnocel-web.vercel.app/
Backend:   https://tecnocel-api.onrender.com
```

> Completar con las URLs reales cuando estén disponibles.

---

## Variables de Entorno en Producción

### Backend (configuradas en Render Dashboard)

```env
NODE_ENV=production
PORT=3000

# Aiven — obtener desde: Aiven Console > Service > Overview > Connection info
DB_HOST=<host>.aivencloud.com
DB_PORT=<puerto>
DB_NAME=db_tecnocel_v4
DB_USER=<usuario>
DB_PASSWORD=<contraseña>
DB_SSL=true

# JWT
JWT_SECRET=<clave aleatoria de 64 bytes>

# CORS — URL exacta del frontend en Vercel
FRONTEND_URL=https://tecnocel-web.vercel.app/

# Cloudinary — obtener desde: Cloudinary Console > Dashboard
CLOUDINARY_CLOUD_NAME=<cloud_name>
CLOUDINARY_API_KEY=<api_key>
CLOUDINARY_API_SECRET=<api_secret>

# Google OAuth
GOOGLE_CLIENT_ID=<client_id>.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=<client_secret>

# Email (Resend)
RESEND_API_KEY=<api_key>
EMAIL_FROM=noreply@<dominio>

# Logging
LOG_LEVEL=info
```

### Frontend (configuradas en Vercel Dashboard → Settings → Environment Variables)

```env
VITE_API_URL=https://<servicio>.onrender.com/api
VITE_GOOGLE_CLIENT_ID=<client_id>.apps.googleusercontent.com
```

---

## Consideraciones por Servicio

### Vercel (Frontend)
- HTTPS automático — no requiere configuración
- Redeploy automático en cada push a `main`
- Build command: `npm run build` desde `frontend/`
- Output directory: `frontend/dist`

### Render (Backend)
- **Sleep en plan Free**: el primer request tras inactividad tarda ~30 segundos en despertar
- Build command: `npm install && npm run build` desde `backend/`
- Start command: `npm start`
- Root directory: `backend`
- Health check path: `/` o `/api/almacen/productos`

### Aiven (MySQL)
- Conexión **siempre con SSL** — Aiven lo requiere obligatoriamente
- La cadena de conexión incluye certificado CA — verificar configuración en `database.ts`
- Descargar el CA certificate desde: Aiven Console > Service > Overview

### Cloudinary
- Carpetas usadas: `tecnocel/productos/` , `tecnocel/comentarios/` y `tecnocel/marcas/`
- El backend sube imágenes procesadas con Sharp antes de enviarlas a Cloudinary
- URLs devueltas son HTTPS permanentes — no requieren servidor propio

---

## Checklist de Deploy

Antes de hacer push a `main` verificar:

- [ ] Variables de entorno actualizadas en Render y Vercel
- [ ] `FRONTEND_URL` en Render apunta a la URL correcta de Vercel
- [ ] `VITE_API_URL` en Vercel apunta a la URL correcta de Render
- [ ] Google OAuth tiene las URLs de producción en Authorized Origins y Redirect URIs
- [ ] Conexión a Aiven con SSL habilitado en `database.ts`
- [ ] Build local del backend sin errores: `npm run build`
- [ ] Build local del frontend sin errores: `npm run build`

---

## HTTPS

Todos los servicios proveen HTTPS automático:
- Vercel: certificado gestionado automáticamente
- Render: certificado gestionado automáticamente
- Aiven: TLS en la conexión de BD por defecto
- Cloudinary: todas las URLs son `https://res.cloudinary.com/...`

No se requiere ninguna configuración manual de certificados SSL.
