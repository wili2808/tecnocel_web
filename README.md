# 🛍️ TecnoCel Web - Tienda en Línea

Plataforma de comercio electrónico completa desarrollada con **React + TypeScript** en el frontend y **Node.js + Express + MySQL** en el backend.

## 🚀 Inicio Rápido

```bash
# Clonar repositorio
git clone https://github.com/wili2808/tecnocel_web.git
cd tecnocel_web

# Configurar backend
cd backend
cp env.example .env
# Editar .env con tus credenciales
npm install
npm run dev

# Configurar frontend (nueva terminal)
cd ../frontend
cp env.example .env
# Editar .env con VITE_API_URL=http://localhost:3000/api
npm install
npm run dev
```

## 📋 Funcionalidades

- 🛒 **Carrito de compras** funcional
- 🔍 **Búsqueda y filtros** por categorías y marcas
- ⭐ **Sistema de comentarios** con imágenes
- 👤 **Autenticación** JWT + Google OAuth
- 📱 **Diseño responsive** mobile-first
- 🎨 **Tema claro/oscuro** personalizable
- 📧 **Notificaciones** en tiempo real
- 🗺️ **Google Maps** integrado

## 🏗️ Arquitectura

```
tecnocel_web/
├── backend/          # API REST Node.js + Express + MySQL
├── frontend/         # React 18 + TypeScript + Vite
└── database/         # Scripts y migraciones
```

## 🛠️ Tecnologías

### Backend

- Node.js + Express + TypeScript
- MySQL + Sequelize ORM
- JWT + Google OAuth
- Multer + Sharp (imágenes)
- Winston (logging)

### Frontend

- React 18 + TypeScript
- Vite + CSS Modules
- React Router + Axios
- Context API (estado global)

## 📚 Documentación Detallada

- **[Backend](./backend/README_BACKEND.md)** - Configuración y API
- **[Frontend](./frontend/README_FRONTEND.md)** - Componentes y estructura
- **[API](./note/DOCUMENTACION_BACKEND_API.md)** - Endpoints completos

## 🔧 Requisitos

- Node.js 18+
- MySQL 8.0+
- npm o yarn

## 🚀 URLs de Desarrollo

- **Backend**: http://localhost:3000
- **Frontend**: http://localhost:5173
- **API**: http://localhost:3000/api

## 📝 Variables de Entorno

### Backend (.env)

```env
DB_NAME=tecnocel_db_v3
DB_USER=root
DB_PASSWORD=tu_password
JWT_SECRET=clave_secreta_aqui
```

### Frontend (.env)

```env
VITE_API_URL=http://localhost:3000/api
```

## 🐛 Problemas Comunes

1. **Base de datos**: Crear `tecnocel_db_v3` en MySQL
2. **CORS**: Verificar `FRONTEND_URL` en backend
3. **Imágenes**: Configurar rutas en `IMAGES_PATH`

## 📖 Más Información

- Ver `.cursorrules` para reglas de desarrollo
- Consultar `note/` para documentación técnica
- Revisar `scripts_test/` para mantenimiento de BD
