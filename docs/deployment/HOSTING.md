# 🌐 Guía de Hosting Gratuito

> Opciones de hosting gratuito para TecnoCel Web (Backend + Base de Datos + Imágenes).

**Última actualización**: Enero 2025
**Versión**: 1.0.0

---

## Tabla de Contenidos

- [Resumen de Requisitos](#resumen-de-requisitos)
- [Opciones Recomendadas](#opciones-recomendadas)
- [Plataformas para API Backend](#plataformas-para-api-backend)
- [Plataformas para Base de Datos MySQL](#plataformas-para-base-de-datos-mysql)
- [Almacenamiento de Imágenes](#almacenamiento-de-imágenes)
- [Configuraciones Necesarias](#configuraciones-necesarias)
- [Comparativa de Plataformas](#comparativa-de-plataformas)
- [Proceso de Despliegue](#proceso-de-despliegue)
- [Costos Estimados](#costos-estimados)
- [Consejos Finales](#consejos-finales)
- [Recursos Adicionales](#recursos-adicionales)

## Resumen de Requisitos

### Stack Tecnológico
- **Runtime**: Node.js 18+
- **Framework**: Express.js con TypeScript
- **Base de Datos**: MySQL 8.0+
- **Almacenamiento**: Imágenes (productos y comentarios)
- **Variables de Entorno**: JWT_SECRET, credenciales de BD, rutas de imágenes

### Recursos Necesarios
- **CPU/RAM**: Moderado (Node.js con TypeScript compilado)
- **Almacenamiento**: ~500MB para código + varios GB para imágenes
- **Tráfico**: Depende del uso, pero moderado para empezar
- **Base de Datos**: MySQL con ~15 tablas y relaciones complejas

## Opciones Recomendadas

### Opción 1: Render + PlanetScale + Cloudinary (Recomendado)

**Ventajas:**
- Totalmente gratuito para proyectos pequeños
- Fácil configuración
- Buen rendimiento
- Escalable

**Stack:**
- **API**: Render (Free Tier)
- **Base de Datos**: PlanetScale (Free Tier)
- **Imágenes**: Cloudinary (Free Tier)

### Opción 2: Railway + Railway MySQL + Cloudinary

**Ventajas:**
- Todo en una plataforma
- $5 de crédito mensual gratis
- Muy fácil de usar
- Deploy automático desde GitHub

**Stack:**
- **API + BD**: Railway (Free Tier)
- **Imágenes**: Cloudinary (Free Tier)

### Opción 3: Vercel + PlanetScale + Cloudinary

**Ventajas:**
- Deploy instantáneo
- Excelente rendimiento
- Integración perfecta con GitHub

**Limitaciones:**
- Mejor para APIs sin estado
- Timeout de 10 segundos en funciones

## Plataformas para API Backend

### 1. Render

**Plan Gratuito:**
- 750 horas/mes
- 512 MB RAM
- Auto-sleep después de 15 min de inactividad
- Build automático desde GitHub

**Configuración:**
```yaml
# render.yaml
services:
  - type: web
    name: tecnocel-api
    env: node
    buildCommand: npm install && npm run build
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 3000
```

**Pros:**
- ✅ Deploy automático desde GitHub
- ✅ SSL gratuito
- ✅ Logs en tiempo real
- ✅ Variables de entorno seguras

**Contras:**
- ❌ Se duerme después de inactividad (primer request lento)
- ❌ 512 MB RAM puede ser limitado

**URL:** https://render.com

---

### 2. Railway

**Plan Gratuito:**
- $5 de crédito mensual
- ~500 horas de servidor
- 512 MB RAM por defecto
- Deploy desde GitHub/GitLab

**Configuración:**
```toml
# railway.toml
[build]
builder = "NIXPACKS"
buildCommand = "npm install && npm run build"

[deploy]
startCommand = "npm start"
restartPolicyType = "ON_FAILURE"
```

**Pros:**
- ✅ Base de datos MySQL incluida
- ✅ No se duerme
- ✅ Métricas incluidas
- ✅ Muy fácil de usar

**Contras:**
- ❌ Crédito limitado ($5/mes)
- ❌ Después de gastar el crédito, se detiene

**URL:** https://railway.app

---

### 3. Vercel

**Plan Gratuito:**
- 100 GB bandwidth/mes
- Funciones serverless
- Deploy automático

**Configuración:**
```json
// vercel.json
{
  "version": 2,
  "builds": [
    {
      "src": "dist/index.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "dist/index.js"
    }
  ]
}
```

**Pros:**
- ✅ Deploy super rápido
- ✅ CDN global
- ✅ Excelente para APIs pequeñas

**Contras:**
- ❌ Timeout de 10 segundos
- ❌ Serverless (no ideal para WebSockets)
- ❌ Limitaciones con archivos estáticos grandes

**URL:** https://vercel.com

---

### 4. Fly.io

**Plan Gratuito:**
- 3 máquinas virtuales compartidas
- 160 GB tráfico/mes
- Persistencia de datos

**Pros:**
- ✅ Muy flexible
- ✅ Soporte para Docker
- ✅ No se duerme

**Contras:**
- ❌ Configuración más compleja
- ❌ Requiere tarjeta de crédito

**URL:** https://fly.io

---

### 5. Cyclic.sh

**Plan Gratuito:**
- Deploy ilimitado
- Serverless
- 10,000 requests/mes

**Pros:**
- ✅ Muy fácil de usar
- ✅ Deploy desde GitHub
- ✅ No requiere tarjeta

**Contras:**
- ❌ Límite de requests
- ❌ Serverless (limitaciones)

**URL:** https://cyclic.sh

## Plataformas para Base de Datos MySQL

### 1. PlanetScale (⭐ Recomendado)

**Plan Gratuito:**
- 5 GB almacenamiento
- 1 billón de lecturas/mes
- 10 millones de escrituras/mes
- Branching (como Git para BD)

**Características:**
- Compatible con MySQL
- Escalado automático
- Backups automáticos
- SSL por defecto

**Conexión:**
```javascript
// Usar SSL y connection string
const connection = mysql.createConnection(process.env.DATABASE_URL);
```

**Pros:**
- ✅ Generoso plan gratuito
- ✅ Excelente rendimiento
- ✅ Branching para desarrollo
- ✅ No requiere tarjeta

**Contras:**
- ❌ Límite de 1 base de datos gratuita

**URL:** https://planetscale.com

---

### 2. Railway MySQL

**Plan Gratuito:**
- Incluido en el crédito de $5/mes
- ~500 MB almacenamiento
- Integración perfecta con Railway API

**Pros:**
- ✅ Todo en una plataforma
- ✅ Configuración automática
- ✅ Variables de entorno auto-inyectadas

**Contras:**
- ❌ Usa el crédito mensual
- ❌ Menos almacenamiento

**URL:** https://railway.app

---

### 3. Aiven for MySQL

**Plan Gratuito:**
- 1 servicio gratuito por 30 días (trial)
- Luego requiere pago

**Pros:**
- ✅ Muy confiable
- ✅ Backups automáticos

**Contras:**
- ❌ Solo trial gratuito
- ❌ Requiere tarjeta

**URL:** https://aiven.io

---

### 4. FreeSQLDatabase

**Plan Gratuito:**
- MySQL 8.0
- 5 MB almacenamiento (muy limitado)

**Pros:**
- ✅ No requiere tarjeta
- ✅ MySQL nativo

**Contras:**
- ❌ Solo 5 MB (insuficiente)
- ❌ No recomendado para producción

**URL:** https://www.freesqldatabase.com

---

### 5. CleverCloud MySQL

**Plan Gratuito:**
- 256 MB almacenamiento
- Shared CPU

**Pros:**
- ✅ MySQL nativo
- ✅ Backups

**Contras:**
- ❌ Muy limitado en recursos

**URL:** https://www.clever-cloud.com

## Almacenamiento de Imágenes

### 1. Cloudinary (⭐ Recomendado)

**Plan Gratuito:**
- 25 créditos/mes
- 25 GB almacenamiento
- 25 GB bandwidth
- Transformaciones automáticas

**Características:**
- API completa para Node.js
- Optimización automática
- CDN global
- Resize, crop, filtros

**Implementación:**
```javascript
// Subir imagen
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Upload
const result = await cloudinary.uploader.upload(file.path, {
  folder: 'tecnocel/productos',
  public_id: `producto_${productId}_${Date.now()}`
});

// URL con transformaciones
const url = cloudinary.url(result.public_id, {
  width: 1200,
  height: 1200,
  crop: 'limit',
  quality: 'auto',
  fetch_format: 'auto'
});
```

**Pros:**
- ✅ Muy generoso plan gratuito
- ✅ CDN incluido
- ✅ Optimización automática
- ✅ Transformaciones on-the-fly

**URL:** https://cloudinary.com

---

### 2. ImageKit

**Plan Gratuito:**
- 20 GB bandwidth/mes
- 20 GB almacenamiento
- Transformaciones ilimitadas

**Pros:**
- ✅ Similar a Cloudinary
- ✅ CDN global
- ✅ Optimización automática

**URL:** https://imagekit.io

---

### 3. Uploadcare

**Plan Gratuito:**
- 3,000 uploads/mes
- 3 GB tráfico/mes
- CDN

**Pros:**
- ✅ Fácil integración
- ✅ Widget de upload

**Contras:**
- ❌ Menos generoso que Cloudinary

**URL:** https://uploadcare.com

---

### 4. ImgBB (Solo para desarrollo)

**Plan Gratuito:**
- API gratuita
- Sin límites claros

**Contras:**
- ❌ No recomendado para producción
- ❌ Puede borrar imágenes

**URL:** https://imgbb.com

## Configuraciones Necesarias

### 1. Modificar ImageService para Cloudinary

```typescript
// src/services/imageService.ts
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

class ImageService {
  async uploadProductImage(file: Express.Multer.File, productId: number) {
    const result = await cloudinary.uploader.upload(file.path, {
      folder: 'tecnocel/productos',
      public_id: `producto_${productId}_${Date.now()}`,
      transformation: [
        { width: 1200, height: 1200, crop: 'limit' },
        { quality: 'auto' },
        { fetch_format: 'auto' }
      ]
    });

    return {
      url: result.secure_url,
      public_id: result.public_id
    };
  }

  async deleteImage(publicId: string) {
    await cloudinary.uploader.destroy(publicId);
  }
}
```

### 2. Variables de Entorno para Producción

```env
# Render/Railway/Vercel
NODE_ENV=production
PORT=3000

# Base de Datos (PlanetScale)
DATABASE_URL=mysql://user:pass@host:port/database?ssl={"rejectUnauthorized":true}

# JWT
JWT_SECRET=tu_clave_secreta_muy_segura_aqui

# Cloudinary
CLOUDINARY_CLOUD_NAME=tu_cloud_name
CLOUDINARY_API_KEY=tu_api_key
CLOUDINARY_API_SECRET=tu_api_secret

# Frontend URL
FRONTEND_URL=https://tu-frontend.vercel.app

# Google OAuth
GOOGLE_CLIENT_ID=tu_google_client_id

# Email (SendGrid o similar)
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USER=apikey
EMAIL_PASS=tu_sendgrid_api_key
EMAIL_FROM=noreply@tecnocel.com

# Logging
LOG_LEVEL=info
```

### 3. Modificar config.ts para Producción

```typescript
// src/config/config.ts
export const config = {
  database: {
    // Usar DATABASE_URL para PlanetScale
    url: process.env.DATABASE_URL || '',
    // O configuración tradicional
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    name: process.env.DB_NAME || 'tecnocel_db_v2',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    ssl: process.env.NODE_ENV === 'production' ? {
      rejectUnauthorized: true
    } : undefined
  },
  server: {
    port: parseInt(process.env.PORT || '3000'),
    env: process.env.NODE_ENV || 'development',
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173'
  },
  images: {
    // Cloudinary reemplaza las rutas locales
    useCloudinary: process.env.NODE_ENV === 'production',
    cloudinary: {
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY,
      apiSecret: process.env.CLOUDINARY_API_SECRET
    }
  }
};
```

### 4. Actualizar database.ts para SSL

```typescript
// src/config/database.ts
import { Sequelize } from 'sequelize';
import { config } from './config';

const sequelize = new Sequelize(
  config.database.url || {
    database: config.database.name,
    username: config.database.user,
    password: config.database.password,
    host: config.database.host,
    port: config.database.port,
    dialect: 'mysql',
    dialectOptions: {
      ssl: config.database.ssl
    },
    logging: config.server.env === 'development' ? console.log : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

export default sequelize;
```

## Comparativa de Plataformas

### Para API Backend

| Plataforma | RAM | Sleep | Deploy | Precio | Recomendación |
|------------|-----|-------|--------|--------|---------------|
| Render | 512MB | Sí (15min) | GitHub | Gratis | ⭐⭐⭐⭐ |
| Railway | 512MB+ | No | GitHub | $5/mes | ⭐⭐⭐⭐⭐ |
| Vercel | Serverless | No | GitHub | Gratis | ⭐⭐⭐ |
| Fly.io | Flexible | No | Docker | Gratis | ⭐⭐⭐⭐ |
| Cyclic | Serverless | No | GitHub | Gratis | ⭐⭐⭐ |

### Para Base de Datos

| Plataforma | Almacenamiento | Conexiones | SSL | Precio | Recomendación |
|------------|----------------|------------|-----|--------|---------------|
| PlanetScale | 5GB | 1000 | Sí | Gratis | ⭐⭐⭐⭐⭐ |
| Railway MySQL | ~500MB | 100 | Sí | $5/mes | ⭐⭐⭐⭐ |
| Aiven | 1GB | Ilimitado | Sí | Trial | ⭐⭐⭐ |
| FreeSQLDB | 5MB | Limitado | No | Gratis | ⭐ |

### Para Imágenes

| Plataforma | Almacenamiento | Bandwidth | Transformaciones | Precio | Recomendación |
|------------|----------------|-----------|------------------|--------|---------------|
| Cloudinary | 25GB | 25GB/mes | Sí | Gratis | ⭐⭐⭐⭐⭐ |
| ImageKit | 20GB | 20GB/mes | Sí | Gratis | ⭐⭐⭐⭐ |
| Uploadcare | 3GB | 3GB/mes | Sí | Gratis | ⭐⭐⭐ |

## Proceso de Despliegue

### Opción Recomendada: Render + PlanetScale + Cloudinary

#### Paso 1: Preparar Base de Datos (PlanetScale)

1. **Crear cuenta en PlanetScale**
   - Ir a https://planetscale.com
   - Registrarse (no requiere tarjeta)

2. **Crear base de datos**
   ```bash
   # Nombre: tecnocel-db
   # Región: Elegir la más cercana
   ```

3. **Crear rama de desarrollo**
   ```bash
   # Branch: main (producción)
   # Branch: dev (desarrollo)
   ```

4. **Importar esquema**
   ```bash
   # Instalar CLI
   brew install planetscale/tap/pscale

   # Login
   pscale auth login

   # Conectar
   pscale connect tecnocel-db main --port 3309

   # Importar
   mysql -h 127.0.0.1 -P 3309 < database/backups/db_tecnocel_v4.sql
   ```

5. **Obtener connection string**
   - Dashboard > tecnocel-db > Connect
   - Copiar `DATABASE_URL`

#### Paso 2: Configurar Cloudinary

1. **Crear cuenta en Cloudinary**
   - Ir a https://cloudinary.com
   - Registrarse

2. **Obtener credenciales**
   - Dashboard > Settings > Access Keys
   - Copiar: Cloud Name, API Key, API Secret

3. **Crear carpetas**
   ```bash
   # En Dashboard > Media Library
   # Crear: tecnocel/productos
   # Crear: tecnocel/comentarios
   ```

#### Paso 3: Preparar Código

1. **Instalar dependencias de Cloudinary**
   ```bash
   cd backend
   npm install cloudinary
   ```

2. **Actualizar ImageService** (ver sección Configuraciones)

3. **Actualizar config.ts** (ver sección Configuraciones)

4. **Commit cambios**
   ```bash
   git add .
   git commit -m "Configure for production deployment"
   git push origin main
   ```

#### Paso 4: Deploy en Render

1. **Crear cuenta en Render**
   - Ir a https://render.com
   - Registrarse con GitHub

2. **Crear Web Service**
   - Dashboard > New > Web Service
   - Connect Repository: tecnocel_web
   - Name: tecnocel-api
   - Root Directory: backend
   - Environment: Node
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`

3. **Configurar variables de entorno**
   ```env
   NODE_ENV=production
   PORT=3000
   DATABASE_URL=[tu_planetscale_url]
   JWT_SECRET=[genera_una_clave_segura]
   CLOUDINARY_CLOUD_NAME=[tu_cloud_name]
   CLOUDINARY_API_KEY=[tu_api_key]
   CLOUDINARY_API_SECRET=[tu_api_secret]
   FRONTEND_URL=https://tu-frontend.vercel.app
   GOOGLE_CLIENT_ID=[tu_google_client_id]
   LOG_LEVEL=info
   ```

4. **Deploy**
   - Click en "Create Web Service"
   - Esperar deploy (5-10 minutos)
   - Obtener URL: `https://tecnocel-api.onrender.com`

#### Paso 5: Verificar Deployment

1. **Health check**
   ```bash
   curl https://tecnocel-api.onrender.com/
   ```

2. **Test endpoint**
   ```bash
   curl https://tecnocel-api.onrender.com/api/almacen/productos
   ```

3. **Verificar logs**
   - Render Dashboard > tecnocel-api > Logs

#### Paso 6: Actualizar Frontend

```typescript
// frontend/.env.production
VITE_API_URL=https://tecnocel-api.onrender.com
```

### Alternativa: Railway (Todo en Uno)

#### Paso 1: Deploy en Railway

1. **Crear cuenta**
   - Ir a https://railway.app
   - Login con GitHub

2. **Nuevo proyecto**
   - New Project > Deploy from GitHub repo
   - Seleccionar tecnocel_web

3. **Agregar MySQL**
   - Add Service > Database > MySQL

4. **Configurar backend**
   - Settings > Root Directory: `/backend`
   - Settings > Build Command: `npm install && npm run build`
   - Settings > Start Command: `npm start`

5. **Variables de entorno**
   - Railway auto-configura `DATABASE_URL`
   - Agregar las demás variables manualmente

6. **Deploy**
   - Automático al hacer push a GitHub

### Monitoreo Post-Deployment

#### Métricas a Vigilar

1. **Render Dashboard**
   - CPU/RAM usage
   - Response times
   - Error rate

2. **PlanetScale Dashboard**
   - Query insights
   - Storage usage
   - Connection count

3. **Cloudinary Dashboard**
   - Storage used
   - Bandwidth used
   - Transformations count

#### Logs

```bash
# Ver logs en tiempo real (Render)
# Dashboard > Logs > Events

# Ver logs de base de datos (PlanetScale)
# Dashboard > Insights > Query
```

## Costos Estimados

### Tier Gratuito (Inicial)
- **API (Render)**: $0
- **BD (PlanetScale)**: $0
- **Imágenes (Cloudinary)**: $0
- **Total**: **$0/mes**

**Limitaciones:**
- API se duerme después de inactividad
- 5GB BD
- 25GB imágenes

### Cuando Crecer (Estimado)

**Opción 1: Render Pro**
- API: $7/mes (sin sleep)
- BD: PlanetScale Scaler $29/mes
- Imágenes: Cloudinary Plus $99/mes
- **Total**: ~$135/mes

**Opción 2: Railway**
- Todo incluido: ~$20-30/mes
- **Total**: ~$20-30/mes (más económico)

## Consejos Finales

### Hacer

1. **Usar CDN** para imágenes (Cloudinary)
2. **Habilitar CORS** correctamente
3. **Usar HTTPS** siempre
4. **Logs estructurados** para debugging
5. **Variables de entorno** nunca en código
6. **Backups regulares** de BD
7. **Monitorear métricas** constantemente

### Evitar

1. **No commitear** archivos `.env`
2. **No hardcodear** URLs o credenciales
3. **No usar** almacenamiento local de archivos
4. **No ignorar** límites de plan gratuito
5. **No exponer** endpoints sin autenticación
6. **No olvidar** rate limiting

## Recursos Adicionales

- **Render Docs**: https://render.com/docs
- **PlanetScale Docs**: https://docs.planetscale.com
- **Cloudinary Docs**: https://cloudinary.com/documentation
- **Railway Docs**: https://docs.railway.app
- **Vercel Docs**: https://vercel.com/docs

---

---

[Volver arriba](#-guía-de-hosting-gratuito) | [Despliegue](README.md) | [Documentación](../README.md) | [Inicio](../../README.md)
