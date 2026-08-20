# Guía de Instalación - TecnoCel Web

Guía paso a paso para configurar el entorno de desarrollo completo.

---

## Tabla de Contenidos

- [Prerrequisitos](#prerrequisitos)
- [Instalación de Dependencias](#instalación-de-dependencias)
- [Configuración de Base de Datos](#configuración-de-base-de-datos)
- [Configuración de Variables de Entorno](#configuración-de-variables-de-entorno)
- [Ejecución del Proyecto](#ejecución-del-proyecto)
- [Verificación](#verificación)
- [Troubleshooting](#troubleshooting)

---

## Prerrequisitos

### Software Requerido

| Software | Versión Mínima | Instalación |
|----------|----------------|-------------|
| **Node.js** | 18.x o superior | [nodejs.org](https://nodejs.org/) |
| **npm** | 9.x o superior | Incluido con Node.js |
| **MySQL** | 8.0 o superior | [mysql.com](https://dev.mysql.com/downloads/) |
| **Git** | 2.x | [git-scm.com](https://git-scm.com/) |

### Opcional pero Recomendado

- **Visual Studio Code** - Editor recomendado
- **MySQL Workbench** - GUI para MySQL
- **Postman** - Testing de API

### Verificar Instalaciones

```bash
# Verificar Node.js
node --version  # Debe ser >= 18.x

# Verificar npm
npm --version   # Debe ser >= 9.x

# Verificar MySQL
mysql --version # Debe ser >= 8.0

# Verificar Git
git --version   # Debe ser >= 2.x
```

---

## Instalación de Dependencias

### 1. Clonar el Repositorio

```bash
# Clonar desde GitHub
git clone https://github.com/wili2808/tecnocel_web.git

# Navegar al directorio
cd tecnocel_web
```

### 2. Instalar Dependencias del Backend

```bash
# Ir al directorio backend
cd backend

# Instalar dependencias
npm install

# Esto instalará:
# - Express, TypeScript, Sequelize
# - JWT, bcrypt, Google OAuth
# - Multer, Sharp para imágenes
# - Y todas las dependencias en package.json

# Volver al directorio raíz
cd ..
```

### 3. Instalar Dependencias del Frontend

```bash
# Ir al directorio frontend
cd frontend

# Instalar dependencias
npm install

# Esto instalará:
# - React 18, TypeScript
# - Vite, React Router
# - Axios, React Icons
# - Y todas las dependencias en package.json

# Volver al directorio raíz
cd ..
```

---

## Configuración de Base de Datos

### 1. Iniciar MySQL

**Windows (XAMPP):**
```bash
# Iniciar MySQL desde el panel de control de XAMPP
# O desde línea de comandos:
C:\xampp\mysql\bin\mysql.exe -u root -p
```

**macOS/Linux:**
```bash
# Iniciar servicio MySQL
sudo systemctl start mysql    # Linux
sudo mysql.server start        # macOS

# O desde línea de comandos:
mysql -u root -p
```

### 2. Crear Base de Datos

```sql
-- Conectar a MySQL
mysql -u root -p

-- Crear base de datos
CREATE DATABASE db_tecnocel_v4 CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Verificar creación
SHOW DATABASES;

-- Salir
EXIT;
```

### 3. Aplicar Migraciones

```bash
# Desde la raíz del proyecto
mysql -u root -p < database/migrations/V1__scheme_inicial.sql
```

**Nota:** Las migraciones se aplican en orden secuencial (`V1` a `V16`) y crean la estructura completa de tablas con sus relaciones.

---

## Configuración de Variables de Entorno

### Resumen Rápido

El proyecto requiere variables de entorno tanto para backend como frontend. Consulta la [documentación completa de variables de entorno](../deployment/ENVIRONMENT.md) para detalles sobre cada variable.

### Backend (.env)

```bash
# Ir al directorio backend
cd backend

# Copiar archivo de ejemplo
cp .env.example .env

# Editar el archivo .env con tus valores
```

**Variables esenciales:**
- `DB_NAME`, `DB_USER`, `DB_PASSWORD` - Credenciales de MySQL
- `JWT_SECRET` - Clave secreta para tokens (generar una única y segura)
- `FRONTEND_URL` - URL del frontend para CORS
- `IMAGES_BASE_PATH`, `PRODUCT_IMAGES_PATH`, `COMMENT_IMAGES_PATH` - Rutas de imágenes

> **Ver configuración completa:** [ENVIRONMENT.md](../deployment/ENVIRONMENT.md#backend-env)

### Frontend (.env)

```bash
# Ir al directorio frontend
cd ../frontend

# Copiar archivo de ejemplo
cp .env.example .env

# Editar el archivo .env con tus valores
```

**Variables esenciales:**
- `VITE_API_URL` - URL de la API del backend

> *Ver configuración completa:** [ENVIRONMENT.md](../deployment/ENVIRONMENT.md#frontend-env)

### Crear Carpetas de Imágenes (Importante)

Las rutas de imágenes se configuran en `backend/.env`. Por defecto el backend usa `backend/uploads`:

```bash
# El backend crea automáticamente las subcarpetas al iniciar
# backend/uploads/productos
# backend/uploads/comentarios
# backend/uploads/marcas

# Si es necesario, crearlas manualmente:
mkdir -p backend/uploads/productos
mkdir -p backend/uploads/comentarios
mkdir -p backend/uploads/marcas
```

> **Tip:** Para generar un JWT_SECRET seguro: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`

---

## Ejecución del Proyecto

### Opción 1: Terminales Separadas (Recomendado)

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Output esperado:**
```
[nodemon] starting `ts-node src/index.ts`
 Servidor corriendo en puerto 3000
 Base de datos conectada
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

**Output esperado:**
```
VITE v5.0.12  ready in 423 ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

### Opción 2: Script Único (Requiere concurrently)

```bash
# Desde la raíz del proyecto
npm install -g concurrently

# Ejecutar ambos servicios
concurrently "cd backend && npm run dev" "cd frontend && npm run dev"
```

---

## Verificación

### 1. Verificar Backend

**Probar endpoint de health:**
```bash
curl http://localhost:3000/api/almacen
```

**O abrir en navegador:**
- http://localhost:3000/api/almacen (debería devolver lista de productos)

### 2. Verificar Frontend

**Abrir en navegador:**
- http://localhost:5173

**Deberías ver:**
- Página principal de TecnoCel Web
- Navbar con logo y navegación
- Productos cargados desde la API

### 3. Verificar Base de Datos

```bash
# Conectar a MySQL
mysql -u root -p

# Usar la base de datos
USE db_tecnocel_v4;

# Verificar tablas
SHOW TABLES;

# Verificar productos de ejemplo
SELECT id, nombre, precio FROM tb_almacen LIMIT 5;
```

### 4. Checklist Completo

- [ ] Backend corriendo en http://localhost:3000
- [ ] Frontend corriendo en http://localhost:5173
- [ ] Base de datos creada y conectada
- [ ] API responde correctamente
- [ ] Productos visibles en el frontend
- [ ] Sin errores en consolas (backend/frontend)

---

## Troubleshooting

### Error: "Cannot connect to MySQL"

**Problema:** El backend no puede conectarse a MySQL

**Soluciones:**
```bash
# 1. Verificar que MySQL está corriendo
mysql -u root -p

# 2. Verificar credenciales en backend/.env
DB_USER=root
DB_PASSWORD=tu_password_correcto

# 3. Verificar que la base de datos existe
mysql -u root -p -e "SHOW DATABASES;"
```

> **Más soluciones:** [ENVIRONMENT.md - Troubleshooting](../deployment/ENVIRONMENT.md#troubleshooting)

### Error: "CORS policy"

**Problema:** El frontend no puede hacer peticiones al backend

**Soluciones:**
```env
# backend/.env
FRONTEND_URL=http://localhost:5173

# frontend/.env
VITE_API_URL=http://localhost:3000/api
```

> **Más soluciones:** [ENVIRONMENT.md - CORS](../deployment/ENVIRONMENT.md#error-cors-policy)

### Error: "Port 3000 already in use"

**Problema:** El puerto 3000 ya está en uso

**Soluciones:**
```bash
# Cambiar puerto en backend/.env
PORT=3001

# Y actualizar frontend/.env
VITE_API_URL=http://localhost:3001/api
```

### Error: "Module not found"

**Problema:** Dependencias no instaladas correctamente

**Soluciones:**
```bash
# Reinstalar dependencias del backend
cd backend
rm -rf node_modules package-lock.json
npm install

# Reinstalar dependencias del frontend
cd ../frontend
rm -rf node_modules package-lock.json
npm install
```

### Error: "ENOENT: no such file or directory" (Imágenes)

**Problema:** Carpetas de imágenes no existen

**Soluciones:**
```bash
# Crear carpetas
mkdir -p backend/uploads/productos
mkdir -p backend/uploads/comentarios
mkdir -p backend/uploads/marcas

# Verificar rutas en backend/.env
IMAGES_BASE_PATH=backend/uploads
PRODUCT_IMAGES_PATH=backend/uploads/productos
COMMENT_IMAGES_PATH=backend/uploads/comentarios
```

> *Problemas con variables de entorno:** [ENVIRONMENT.md - Troubleshooting completo](../deployment/ENVIRONMENT.md#troubleshooting)

---

## Próximos Pasos

Después de completar la instalación:

1. **Explora la aplicación:**
   - Navega por el catálogo de productos
   - Prueba el carrito de compras
   - Registra un usuario de prueba

2. **Lee la documentación:**
   - [Guía de Desarrollo](DEVELOPMENT.md)
   - [API Endpoints](../api/ENDPOINTS.md)
   - [Base de Datos](../database/DIAGRAMS.md)

3. **Configura opcionales:**
   - Google OAuth 2.0
   - Servicio de email (SMTP)
   - Variables de producción

---

## Recursos Adicionales

- [Configuración de Environment Variables](../deployment/ENVIRONMENT.md)
- [Guía de Desarrollo](DEVELOPMENT.md)
- [Documentación de la API](../api/ENDPOINTS.md)
- [Stack de Producción](../deployment/STACK_PRODUCCION.md)

---

**¿Necesitas ayuda?** Consulta la [Guía de Desarrollo](DEVELOPMENT.md) o revisa los [Issues en GitHub](https://github.com/wili2808/tecnocel_web/issues)

---

[Volver arriba](#guía-de-instalación---tecnocel-web) | [Documentación](../README.md) | [Inicio](../../README.md)
