[Documentación](../README.md#estructura-de-documentación) | [Inicio](../../README.md)

---

# Documentación de Despliegue

> Guías de despliegue, hosting y configuración de entornos para TecnoCel Web.

**Última actualización**: 7 de Octubre, 2025

---

## Tabla de Contenidos

- [Documentos Disponibles](#documentos-disponibles)
- [Documentos Planificados](#documentos-planificados)
- [Checklist de Deployment](#checklist-de-deployment)
- [Deployment Rápido](#deployment-rápido)
- [Recursos Adicionales](#recursos-adicionales)

---

## Documentos Disponibles

### HOSTING.md

**[HOSTING.md](HOSTING.md)** - Guía completa de opciones de hosting gratuito

**Contenido**:
- Opciones de hosting para backend (Node.js)
- Opciones de hosting para frontend (React)
- Opciones de base de datos MySQL
- Configuración de cada plataforma
- Pros y contras de cada opción
- Recomendaciones

**Plataformas cubiertas**:
- Railway
- Render
- Fly.io
- Vercel (frontend)
- Netlify (frontend)
- PlanetScale (database)
- Clever Cloud
- AWS Free Tier

---

### ENVIRONMENT.md

**[ENVIRONMENT.md](ENVIRONMENT.md)** - Guía completa de variables de entorno

**Contenido**:
- Configuración detallada de variables de entorno
- Backend: Base de datos, servidor, JWT, logging, imágenes, email, OAuth
- Frontend: API URL, Google OAuth, Google Maps, cache de favoritos y ofertas
- Valores por defecto y ejemplos completos
- Configuración por entorno (desarrollo, producción, testing)
- Mejores prácticas de seguridad
- Troubleshooting y resolución de problemas comunes

**Variables incluidas**:

**Backend (28 variables)**:
- 🗄️ Base de datos: `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT`
- 🌐 Servidor: `PORT`, `NODE_ENV`, `FRONTEND_URL`
- 🔐 JWT: `JWT_SECRET`
- 📝 Logging: `LOG_LEVEL`, `SEQUELIZE_DEBUG`
- 🖼️ Imágenes: `IMAGES_BASE_PATH`, `PRODUCT_IMAGES_PATH`, `COMMENT_IMAGES_PATH`, etc.
- 📧 Email: `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASS`, `EMAIL_FROM`
- 🔑 Google OAuth: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`

**Frontend (9 variables)**:
- 🌐 API: `VITE_API_URL`
- 🔐 OAuth: `VITE_GOOGLE_CLIENT_ID`
- 🗺️ Maps: `VITE_GOOGLE_MAPS_API_KEY`
- 💾 Cache Favoritos: `VITE_FAVORITOS_CACHE_DURATION`, `VITE_FAVORITOS_CACHE_KEY`
- 🎯 Cache Ofertas: `VITE_OFERTAS_CACHE_DURATION`, `VITE_OFERTAS_CACHE_KEY`, `VITE_OFERTAS_REFRESH_INTERVAL`

---

## Documentos Planificados

### DOCKER.md

_(próximamente)_ - Dockerización del proyecto.

**Contenido planificado**:
- Dockerfile para backend
- Dockerfile para frontend
- docker-compose.yml completo
- Configuración de volúmenes
- Networking entre contenedores
- Scripts de deployment con Docker

**Ejemplo docker-compose.yml**:
```yaml
version: '3.8'
services:
  backend:
    build: ./backend
    ports:
      - "3000:3000"
    environment:
      - DB_HOST=mysql
    depends_on:
      - mysql

  frontend:
    build: ./frontend
    ports:
      - "5173:5173"
    depends_on:
      - backend

  mysql:
    image: mysql:8.0
    environment:
      MYSQL_DATABASE: db_tecnocel_v4
      MYSQL_ROOT_PASSWORD: ***
    volumes:
      - mysql_data:/var/lib/mysql

volumes:
  mysql_data:
```

---

### CI_CD.md

_(próximamente)_ - Pipeline de CI/CD (Integración y Despliegue Continuo).

**Contenido planificado**:

#### GitHub Actions
- Workflow para testing automático
- Workflow para build
- Workflow para deployment
- Integración con plataformas de hosting

#### Pipelines
- **Pre-commit**: Linting, formatting
- **CI**: Tests, build
- **CD**: Deploy automático a staging/producción

**Ejemplo workflow**:
```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Install dependencies
        run: npm install
      - name: Run tests
        run: npm test

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Build backend
        run: cd backend && npm run build
      - name: Build frontend
        run: cd frontend && npm run build

  deploy:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - name: Deploy to production
        run: |
          # Deployment script
```

---

### SSL_HTTPS.md

_(próximamente)_ - Configuración de SSL/TLS y HTTPS.

**Contenido planificado**:
- Certificados SSL gratuitos (Let's Encrypt)
- Configuración en diferentes plataformas
- Renovación automática
- Forzar HTTPS
- Headers de seguridad

---

### MONITORING.md

_(próximamente)_ - Monitoreo y logging en producción.

**Contenido planificado**:
- Herramientas de monitoreo (PM2, New Relic, etc.)
- Logging en producción
- Alertas y notificaciones
- Métricas de performance
- Error tracking (Sentry)

---

## Checklist de Deployment

### Pre-Producción
- [ ] Testing completo (unitario, integración, E2E)
- [ ] Optimización de imágenes
- [ ] Configuración de variables de entorno de producción
- [ ] SSL/TLS configurado
- [ ] Base de datos de producción configurada
- [ ] Backups automáticos configurados
- [ ] Logging de producción configurado
- [ ] Monitoring configurado
- [ ] Rate limiting implementado
- [ ] CORS configurado para producción

### Seguridad
- [ ] JWT_SECRET cambiado en producción
- [ ] Secretos de Google OAuth actualizados
- [ ] Variables sensibles en `.env` (no en código)
- [ ] HTTPS forzado
- [ ] Headers de seguridad configurados
- [ ] Validación de inputs reforzada
- [ ] Rate limiting en endpoints críticos
- [ ] Backups encriptados

### Performance
- [ ] Build de producción optimizado
- [ ] CDN configurado para assets estáticos
- [ ] Caché configurado
- [ ] Compresión Gzip/Brotli habilitada
- [ ] Lazy loading implementado
- [ ] Imágenes optimizadas
- [ ] Database indexing verificado

---

## Deployment Rápido

### Backend (Railway/Render)
```bash
# Conectar repositorio
# Configurar variables de entorno
# Desplegar automáticamente en push a main
```

### Frontend (Vercel/Netlify)
```bash
# Conectar repositorio
# Configurar build command: npm run build
# Configurar output directory: dist
# Configurar variables de entorno
# Desplegar automáticamente
```

### Base de Datos (PlanetScale)
```bash
# Crear database
# Obtener connection string
# Configurar en backend .env
# Migrar datos
```

---

## Recursos Adicionales

- [Configuración del backend](../../backend/README.md)
- [Configuración del frontend](../../frontend/README.md)
- [Documentación de base de datos](../database/README.md)
- [Volver al índice de documentación](../README.md)

---

[Volver arriba](#tabla-de-contenidos) | [Documentación](../README.md) | [Inicio](../../README.md)
