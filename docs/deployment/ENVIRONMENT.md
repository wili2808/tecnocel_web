# ⚙️ Variables de Entorno

> Documentación completa de todas las variables de entorno para backend y frontend.

**Última actualización**: 7 de Octubre, 2025
**Versión**: 1.1.0

---

## Tabla de Contenidos

- [Resumen](#resumen)
- [Backend (.env)](#backend-env)
- [Frontend (.env)](#frontend-env)
- [Configuración por Entorno](#configuración-por-entorno)
- [Seguridad y Mejores Prácticas](#seguridad-y-mejores-prácticas)
- [Troubleshooting](#troubleshooting)
- [Recursos Adicionales](#recursos-adicionales)

---

## Resumen

### Ubicación de Archivos

```
tecnocel_web/
├── backend/
│   ├── .env          # Variables de backend (NO versionado)
│   └── .env.example  # Template de variables
└── frontend/
    ├── .env          # Variables de frontend (NO versionado)
    └── .env.example  # Template de variables
```

### Archivos de Ejemplo

Los archivos `.env.example` contienen plantillas de configuración. **Nunca** incluyen valores sensibles.

```bash
# Crear archivos .env desde ejemplos
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

---

## Backend (.env)

### Archivo Completo

```env
# =====================================================
# 🗄️ CONFIGURACIÓN DE BASE DE DATOS
# =====================================================

DB_NAME=db_tecnocel_v4
DB_USER=root
DB_PASSWORD=tu_password_mysql
DB_HOST=localhost
DB_PORT=3306

# =====================================================
# 🌐 CONFIGURACIÓN DEL SERVIDOR
# =====================================================

PORT=3000
NODE_ENV=development

# =====================================================
# 🔐 CONFIGURACIÓN JWT
# =====================================================

# IMPORTANTE: Genera una clave única y segura
# Ejemplo: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_SECRET=clave_secreta_supersegura_cambiar_en_produccion

# =====================================================
# 📝 CONFIGURACIÓN DE LOGGING
# =====================================================

# Niveles: error, warn, info, debug
LOG_LEVEL=info

# true = muestra queries SQL en consola
SEQUELIZE_DEBUG=false

# =====================================================
# 🖼️ CONFIGURACIÓN DE IMÁGENES
# =====================================================

# OPCIÓN 1: Windows con XAMPP
IMAGES_BASE_PATH=C:/xampp/htdocs/tecnocel
PRODUCT_IMAGES_PATH=C:/xampp/htdocs/tecnocel/almacen/img_productos
COMMENT_IMAGES_PATH=C:/xampp/htdocs/tecnocel/img_comments

# OPCIÓN 2: macOS/Linux
# IMAGES_BASE_PATH=/var/www/html/tecnocel
# PRODUCT_IMAGES_PATH=/var/www/html/tecnocel/almacen/img_productos
# COMMENT_IMAGES_PATH=/var/www/html/tecnocel/img_comments

# URL base para servir imágenes
BASE_URL=http://localhost
IMAGES_ENDPOINT=

# Imágenes por defecto
DEFAULT_PRODUCT_IMAGE=default-product.png
DEFAULT_COMMENT_IMAGE=default-comment.png

# =====================================================
# 📧 CONFIGURACIÓN DE EMAIL (Opcional)
# =====================================================

EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=tu_email@gmail.com
EMAIL_PASS=tu_password_de_aplicacion_google
EMAIL_FROM=tu_email@gmail.com

# =====================================================
# 🔗 CONFIGURACIÓN DEL FRONTEND
# =====================================================

# URL del frontend para CORS
FRONTEND_URL=http://localhost:5173

# =====================================================
# 🔐 GOOGLE OAUTH 2.0 (Opcional)
# =====================================================

GOOGLE_CLIENT_ID=tu_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=tu_google_client_secret
```

---

### Variables Detalladas

#### Base de Datos

| Variable      | Descripción                | Ejemplo           | Requerido |
| ------------- | -------------------------- | ----------------- | --------- |
| `DB_NAME`     | Nombre de la base de datos | `db_tecnocel_v4`  | ✅ Sí     |
| `DB_USER`     | Usuario de MySQL           | `root`            | ✅ Sí     |
| `DB_PASSWORD` | Contraseña de MySQL        | `mi_password_123` | ✅ Sí     |
| `DB_HOST`     | Host de MySQL              | `localhost`       | ✅ Sí     |
| `DB_PORT`     | Puerto de MySQL            | `3306`            | ✅ Sí     |

**Notas:**

- En producción, **NUNCA** usar `root` como usuario
- Crear usuario dedicado con permisos mínimos
- Usar contraseñas seguras (min 16 caracteres)

---

#### Servidor

| Variable   | Descripción          | Ejemplo                      | Requerido |
| ---------- | -------------------- | ---------------------------- | --------- |
| `PORT`     | Puerto del servidor  | `3000`                       | ✅ Sí     |
| `NODE_ENV` | Entorno de ejecución | `development` / `production` | ✅ Sí     |

**Valores de NODE_ENV:**

- `development` - Desarrollo local
- `production` - Producción
- `test` - Testing

---

#### JWT (JSON Web Tokens)

| Variable     | Descripción                      | Ejemplo     | Requerido |
| ------------ | -------------------------------- | ----------- | --------- |
| `JWT_SECRET` | Clave secreta para firmar tokens | (ver abajo) | ✅ Sí     |

**Generar JWT_SECRET seguro:**

```bash
# Generar clave aleatoria de 256 bits
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Output ejemplo:
# a3f8b9c2d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1
```

**⚠️ IMPORTANTE:**

- Nunca uses valores por defecto en producción
- Si cambias JWT_SECRET, todos los tokens existentes se invalidan
- Guarda el secret en un gestor de secretos (AWS Secrets Manager, etc.)

---

#### Logging

| Variable          | Descripción              | Ejemplo | Requerido |
| ----------------- | ------------------------ | ------- | --------- |
| `LOG_LEVEL`       | Nivel de detalle de logs | `info`  | ❌ No     |
| `SEQUELIZE_DEBUG` | Mostrar queries SQL      | `false` | ❌ No     |

**Niveles de LOG_LEVEL:**

- `error` - Solo errores críticos
- `warn` - Errores + advertencias
- `info` - Info general (recomendado)
- `debug` - Todo (solo desarrollo)

---

#### Imágenes

| Variable                | Descripción                       | Ejemplo                                          | Requerido |
| ----------------------- | --------------------------------- | ------------------------------------------------ | --------- |
| `IMAGES_BASE_PATH`      | Ruta base de imágenes             | `C:/xampp/htdocs/tecnocel`                       | ✅ Sí     |
| `PRODUCT_IMAGES_PATH`   | Ruta de imágenes de productos     | `C:/xampp/htdocs/tecnocel/almacen/img_productos` | ✅ Sí     |
| `COMMENT_IMAGES_PATH`   | Ruta de imágenes de comentarios   | `C:/xampp/htdocs/tecnocel/img_comments`          | ✅ Sí     |
| `BASE_URL`              | URL base del servidor             | `http://localhost`                               | ✅ Sí     |
| `IMAGES_ENDPOINT`       | Endpoint adicional para imágenes  | `` (vacío)                                       | ❌ No     |
| `DEFAULT_PRODUCT_IMAGE` | Imagen por defecto de productos   | `default-product.png`                            | ❌ No     |
| `DEFAULT_COMMENT_IMAGE` | Imagen por defecto de comentarios | `default-comment.png`                            | ❌ No     |

**Crear carpetas (Windows - XAMPP):**

```bash
mkdir C:\xampp\htdocs\tecnocel
mkdir C:\xampp\htdocs\tecnocel\almacen
mkdir C:\xampp\htdocs\tecnocel\almacen\img_productos
mkdir C:\xampp\htdocs\tecnocel\img_comments
```

**Crear carpetas (macOS/Linux):**

```bash
sudo mkdir -p /var/www/html/tecnocel/almacen/img_productos
sudo mkdir -p /var/www/html/tecnocel/img_comments
sudo chmod -R 755 /var/www/html/tecnocel
```

---

#### Email (Nodemailer)

| Variable     | Descripción              | Ejemplo               | Requerido   |
| ------------ | ------------------------ | --------------------- | ----------- |
| `EMAIL_HOST` | Host del servidor SMTP   | `smtp.gmail.com`      | ❌ Opcional |
| `EMAIL_PORT` | Puerto SMTP              | `587`                 | ❌ Opcional |
| `EMAIL_USER` | Usuario del email        | `tu_email@gmail.com`  | ❌ Opcional |
| `EMAIL_PASS` | Contraseña de aplicación | `abcd efgh ijkl mnop` | ❌ Opcional |
| `EMAIL_FROM` | Email remitente          | `tu_email@gmail.com`  | ❌ Opcional |

**Configurar Gmail:**

1. Ir a [myaccount.google.com/security](https://myaccount.google.com/security)
2. Activar **Verificación en 2 pasos**
3. Crear **Contraseña de aplicación**
4. Usar la contraseña generada en `EMAIL_PASS`

**Otros proveedores:**

- **SendGrid**: `smtp.sendgrid.net:587`
- **Mailgun**: `smtp.mailgun.org:587`
- **AWS SES**: `email-smtp.us-east-1.amazonaws.com:587`

---

#### CORS

| Variable       | Descripción      | Ejemplo                 | Requerido |
| -------------- | ---------------- | ----------------------- | --------- |
| `FRONTEND_URL` | URL del frontend | `http://localhost:5173` | ✅ Sí     |

**Múltiples orígenes (producción):**

```typescript
// En src/index.ts
const allowedOrigins = [
  process.env.FRONTEND_URL,
  "https://tecnocel.com",
  "https://www.tecnocel.com",
];
```

---

#### Google OAuth 2.0

| Variable               | Descripción               | Ejemplo                          | Requerido   |
| ---------------------- | ------------------------- | -------------------------------- | ----------- |
| `GOOGLE_CLIENT_ID`     | Client ID de Google Cloud | `xxx.apps.googleusercontent.com` | ❌ Opcional |
| `GOOGLE_CLIENT_SECRET` | Client Secret de Google   | `GOCSPX-xxx`                     | ❌ Opcional |

**Configurar Google OAuth:**

1. **Ir a Google Cloud Console:**

   - [console.cloud.google.com](https://console.cloud.google.com/)

2. **Crear proyecto:**

   - Nombre: `TecnoCel Web`

3. **Habilitar APIs:**

   - Google+ API

4. **Crear credenciales:**

   - Tipo: OAuth 2.0 Client ID
   - Tipo de aplicación: Web application
   - URIs de redirección autorizados:
     - `http://localhost:3000/api/clientes/google-login`
     - `https://tu-dominio.com/api/clientes/google-login`

5. **Copiar credenciales:**
   - Client ID → `GOOGLE_CLIENT_ID`
   - Client Secret → `GOOGLE_CLIENT_SECRET`

---

## Frontend (.env)

### Archivo Completo

```env
# =====================================================
# 🌐 CONFIGURACIÓN DE API
# =====================================================

VITE_API_URL=http://localhost:3000/api

# =====================================================
# 🔐 GOOGLE OAUTH 2.0 (Opcional)
# =====================================================

VITE_GOOGLE_CLIENT_ID=tu_google_client_id.apps.googleusercontent.com

# =====================================================
# 🗺️ GOOGLE MAPS (Opcional)
# =====================================================

VITE_GOOGLE_MAPS_API_KEY=tu_google_maps_api_key

# =====================================================
# 💾 CONFIGURACIÓN DE CACHE DE FAVORITOS
# =====================================================

# Duración del cache de favoritos en milisegundos (5 minutos por defecto)
VITE_FAVORITOS_CACHE_DURATION=300000

# Clave para almacenar el cache de favoritos en localStorage
VITE_FAVORITOS_CACHE_KEY=favoritos_cache

# =====================================================
# 🎯 CONFIGURACIÓN DE CACHE DE OFERTAS
# =====================================================

# Duración del cache de ofertas en milisegundos (5 minutos por defecto)
VITE_OFERTAS_CACHE_DURATION=300000

# Clave para almacenar el cache de ofertas en localStorage
VITE_OFERTAS_CACHE_KEY=ofertas_cache

# Intervalo de refresco automático en milisegundos (1 minuto por defecto)
VITE_OFERTAS_REFRESH_INTERVAL=60000
```

---

### Variables Detalladas

#### API Backend

| Variable       | Descripción        | Ejemplo                     | Requerido |
| -------------- | ------------------ | --------------------------- | --------- |
| `VITE_API_URL` | URL base de la API | `http://localhost:3000/api` | ✅ Sí     |

**Nota:** Vite solo expone variables que empiezan con `VITE_`

**Uso en código:**

```typescript
const API_URL = import.meta.env.VITE_API_URL;
```

---

#### Google OAuth

| Variable                | Descripción         | Ejemplo                          | Requerido   |
| ----------------------- | ------------------- | -------------------------------- | ----------- |
| `VITE_GOOGLE_CLIENT_ID` | Client ID de Google | `xxx.apps.googleusercontent.com` | ❌ Opcional |

**Configuración:**

- Mismo Client ID que el backend
- Solo el Client ID, NO el Secret

---

#### Google Maps

| Variable                   | Descripción            | Ejemplo               | Requerido   |
| -------------------------- | ---------------------- | --------------------- | ----------- |
| `VITE_GOOGLE_MAPS_API_KEY` | API Key de Google Maps | `AIzaSyXXXXXXXXXXXXX` | ❌ Opcional |

**Obtener API Key:**

1. [console.cloud.google.com](https://console.cloud.google.com/)
2. APIs & Services → Credentials
3. Create Credentials → API Key
4. Restrict Key → Maps JavaScript API

---

#### Cache de Favoritos

| Variable                        | Descripción              | Ejemplo           | Requerido   |
| ------------------------------- | ------------------------ | ----------------- | ----------- |
| `VITE_FAVORITOS_CACHE_DURATION` | Duración del cache en ms | `300000` (5 min)  | ❌ Opcional |
| `VITE_FAVORITOS_CACHE_KEY`      | Clave para localStorage  | `favoritos_cache` | ❌ Opcional |

**Configuración:**

- El cache evita llamadas innecesarias al servidor
- Se invalida automáticamente al agregar/eliminar favoritos
- Se almacena en localStorage del navegador

**Valores recomendados:**

- Desarrollo: `300000` (5 minutos)
- Producción: `600000` (10 minutos)

---

#### Cache de Ofertas

| Variable                        | Descripción                 | Ejemplo          | Requerido   |
| ------------------------------- | --------------------------- | ---------------- | ----------- |
| `VITE_OFERTAS_CACHE_DURATION`   | Duración del cache en ms    | `300000` (5 min) | ❌ Opcional |
| `VITE_OFERTAS_CACHE_KEY`        | Clave para localStorage     | `ofertas_cache`  | ❌ Opcional |
| `VITE_OFERTAS_REFRESH_INTERVAL` | Intervalo de refresco en ms | `60000` (1 min)  | ❌ Opcional |

**Configuración:**

- El cache reduce la carga en el servidor
- Se refresca automáticamente según el intervalo
- Se almacena en localStorage del navegador

**Valores recomendados:**

- Desarrollo:
  - Cache: `300000` (5 minutos)
  - Refresh: `60000` (1 minuto)
- Producción:
  - Cache: `900000` (15 minutos)
  - Refresh: `300000` (5 minutos)

---

## Configuración por Entorno

### Desarrollo Local

**Backend:**

```env
NODE_ENV=development
PORT=3000
DB_HOST=localhost
FRONTEND_URL=http://localhost:5173
LOG_LEVEL=debug
SEQUELIZE_DEBUG=true
```

**Frontend:**

```env
VITE_API_URL=http://localhost:3000/api
VITE_FAVORITOS_CACHE_DURATION=300000
VITE_OFERTAS_CACHE_DURATION=300000
VITE_OFERTAS_REFRESH_INTERVAL=60000
```

---

### Producción

**Backend:**

```env
NODE_ENV=production
PORT=3000
DB_HOST=tu-rds-endpoint.amazonaws.com
DB_PASSWORD=password_super_seguro_64_caracteres
FRONTEND_URL=https://www.tecnocel.com
LOG_LEVEL=info
SEQUELIZE_DEBUG=false
JWT_SECRET=clave_aleatoria_256_bits_generada
```

**Frontend:**

```env
VITE_API_URL=https://api.tecnocel.com/api
VITE_FAVORITOS_CACHE_DURATION=600000
VITE_OFERTAS_CACHE_DURATION=900000
VITE_OFERTAS_REFRESH_INTERVAL=300000
```

---

### Testing

**Backend:**

```env
NODE_ENV=test
DB_NAME=db_tecnocel_test
PORT=3001
LOG_LEVEL=error
```

---

## Seguridad y Mejores Prácticas

### Hacer

- ✅ Usar `.env.example` como plantilla **sin valores reales**
- ✅ Agregar `.env` a `.gitignore` (ya configurado)
- ✅ Generar JWT_SECRET aleatorio y único
- ✅ Usar contraseñas seguras (min 16 caracteres)
- ✅ Rotar secretos periódicamente en producción
- ✅ Usar gestores de secretos (AWS Secrets Manager, etc.)
- ✅ Validar variables al inicio de la aplicación

### NO Hacer

- ❌ **NUNCA** commitear archivos `.env` a Git
- ❌ **NUNCA** compartir `.env` por email/chat
- ❌ **NUNCA** usar valores por defecto en producción
- ❌ **NUNCA** hardcodear credenciales en código
- ❌ **NUNCA** exponer variables sensibles en frontend

---

### Validación de Variables (Backend)

```typescript
// src/config/config.ts
import dotenv from "dotenv";
dotenv.config();

const requiredEnvVars = [
  "DB_NAME",
  "DB_USER",
  "DB_PASSWORD",
  "JWT_SECRET",
  "FRONTEND_URL",
];

requiredEnvVars.forEach((varName) => {
  if (!process.env[varName]) {
    throw new Error(`❌ Variable de entorno ${varName} no definida`);
  }
});

export const config = {
  db: {
    name: process.env.DB_NAME!,
    user: process.env.DB_USER!,
    password: process.env.DB_PASSWORD!,
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "3306"),
  },
  jwt: {
    secret: process.env.JWT_SECRET!,
  },
  // ...
};
```

---

## Troubleshooting

### Error: "Variable XXX no definida"

**Causa:** Variable no existe en `.env`

**Solución:**

```bash
# 1. Verificar que .env existe
ls -la backend/.env

# 2. Comparar con .env.example
diff backend/.env backend/.env.example

# 3. Agregar variables faltantes
```

---

### Error: "Cannot connect to database"

**Causa:** Credenciales de BD incorrectas

**Solución:**

```bash
# Verificar credenciales
mysql -u root -p

# Si funciona, verificar .env
cat backend/.env | grep DB_
```

---

### Error: "CORS policy"

**Causa:** `FRONTEND_URL` no coincide con origen real

**Solución:**

```env
# backend/.env
FRONTEND_URL=http://localhost:5173  # Debe coincidir EXACTAMENTE

# Verificar en navegador:
# Console → Network → Headers → Origin
```

---

### Frontend no puede llamar a la API

**Causa:** `VITE_API_URL` incorrecta

**Solución:**

```bash
# 1. Verificar variable
cat frontend/.env | grep VITE_API_URL

# 2. Debe empezar con VITE_
VITE_API_URL=http://localhost:3000/api  # ✅ Correcto
API_URL=http://localhost:3000/api       # ❌ NO funciona en Vite

# 3. Reiniciar servidor Vite después de cambiar .env
```

---

## Recursos Adicionales

- [The Twelve-Factor App - Config](https://12factor.net/config)
- [dotenv Documentation](https://github.com/motdotla/dotenv)
- [Vite Env Variables](https://vitejs.dev/guide/env-and-mode.html)
- [Node.js Security Checklist](https://blog.risingstack.com/node-js-security-checklist/)

---

---

[Volver arriba](#-variables-de-entorno) | [Despliegue](README.md) | [Documentación](../README.md) | [Inicio](../../README.md)
