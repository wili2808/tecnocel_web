# 🛍️ TecnoCel Web - Tienda en Línea

Una aplicación web completa de comercio electrónico desarrollada con **React + TypeScript** en el frontend y **Node.js + Express + MySQL** en el backend.

## 📋 Descripción del Proyecto

TecnoCel Web es una plataforma de comercio electrónico moderna que permite a los usuarios:

- **🛒 Comprar productos** con un carrito de compras funcional
- **🔍 Buscar y filtrar** productos por categorías, marcas y características
- **⭐ Comentar y calificar** productos con imágenes
- **👤 Autenticación** mediante email/password o Google OAuth
- **📱 Diseño responsive** para todos los dispositivos
- **🎨 Tema claro/oscuro** personalizable
- **📧 Notificaciones** en tiempo real
- **🗺️ Ubicación** con Google Maps integrado

## 🏗️ Arquitectura del Proyecto

```
tecnocel_web/
├── backend/                 # API REST con Node.js + Express
│   ├── src/
│   │   ├── controllers/     # Controladores de la API
│   │   ├── models/          # Modelos de Sequelize
│   │   ├── routes/          # Rutas de la API
│   │   ├── middleware/      # Middlewares personalizados
│   │   ├── services/        # Servicios de negocio
│   │   └── utils/           # Utilidades y helpers
│   └── config/              # Configuración de BD y app
├── frontend/                # Aplicación React + TypeScript
│   ├── src/
│   │   ├── components/      # Componentes reutilizables
│   │   ├── pages/           # Páginas de la aplicación
│   │   ├── contexts/        # Contextos de React
│   │   ├── hooks/           # Hooks personalizados
│   │   └── services/        # Servicios de API
│   └── public/              # Archivos estáticos
└── database/                # Scripts de base de datos
```

## 🚀 Tecnologías Utilizadas

### Backend

- **Node.js** + **Express.js** - Servidor web
- **TypeScript** - Tipado estático
- **MySQL** + **Sequelize** - Base de datos y ORM
- **JWT** - Autenticación
- **Passport.js** - Autenticación con Google OAuth
- **Multer** + **Sharp** - Manejo de imágenes
- **Nodemailer** - Envío de emails
- **Winston** - Logging

### Frontend

- **React 18** + **TypeScript** - Framework de UI
- **Vite** - Build tool y dev server
- **React Router** - Navegación
- **Axios** - Cliente HTTP
- **React Icons** - Iconografía
- **React Toastify** - Notificaciones
- **CSS Modules** - Estilos modulares

## 📦 Requisitos Previos

Antes de comenzar, asegúrate de tener instalado:

- **Node.js** (versión 18 o superior)
- **npm** o **yarn**
- **MySQL** (versión 8.0 o superior)
- **Git**

## 🔧 Instalación y Configuración

### 1. Clonar el Repositorio

```bash
git clone https://github.com/wili2808/tecnocel_web.git
cd tecnocel_web
```

### 2. Configurar la Base de Datos

1. **Crear la base de datos MySQL:**

   ```sql
   CREATE DATABASE tecnocel_db_v3;
   ```

2. **Configurar el backend:**

   ```bash
   cd backend
   cp env.example .env
   ```

3. **Editar el archivo `.env` del backend:**

   ```env
   # Base de datos
   DB_NAME=tecnocel_db_v3
   DB_USER=root
   DB_PASSWORD=tu_password_aqui
   DB_HOST=localhost
   DB_PORT=3306

   # Servidor
   PORT=3000
   NODE_ENV=development

   # JWT (¡CAMBIAR EN PRODUCCIÓN!)
   JWT_SECRET=tu_clave_secreta_super_segura_aqui

   # Imágenes
   IMAGES_PATH=C:/xampp/htdocs/tecnocel
   COMMENTS_IMAGES_PATH=C:/xampp/htdocs/tecnocel/img_comments
   BASE_URL=http://localhost:3000
   DEFAULT_IMAGE=default-product.png

   # Email (opcional)
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=tu_email@gmail.com
   EMAIL_PASS=tu_password_de_aplicacion
   EMAIL_FROM=tu_email@gmail.com

   # Frontend
   FRONTEND_URL=http://localhost:5173

   # Google OAuth (opcional)
   GOOGLE_CLIENT_ID=tu_google_client_id_aqui
   ```

### 3. Instalar Dependencias del Backend

```bash
cd backend
npm install
```

### 4. Configurar el Frontend

```bash
cd ../frontend
cp env.example .env
```

**Editar el archivo `.env` del frontend:**

```env
VITE_API_URL=http://localhost:3000/api
VITE_GOOGLE_CLIENT_ID=tu-google-client-id-aqui
```

### 5. Instalar Dependencias del Frontend

```bash
npm install
```

## 🏃‍♂️ Ejecutar el Proyecto

### Desarrollo

1. **Iniciar el backend:**

   ```bash
   cd backend
   npm run dev
   ```

   El servidor estará disponible en: `http://localhost:3000`

2. **Iniciar el frontend (en otra terminal):**
   ```bash
   cd frontend
   npm run dev
   ```
   La aplicación estará disponible en: `http://localhost:5173`

### Producción

1. **Construir el frontend:**

   ```bash
   cd frontend
   npm run build
   ```

2. **Construir el backend:**

   ```bash
   cd backend
   npm run build
   ```

3. **Iniciar el servidor de producción:**
   ```bash
   cd backend
   npm start
   ```

## 🔐 Configuración de Google OAuth (Opcional)

Para habilitar el login con Google:

1. Ve a [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Crea un proyecto o selecciona uno existente
3. Habilita la API de Google+
4. Crea credenciales OAuth 2.0
5. Configura las URLs autorizadas:
   - `http://localhost:5173` (desarrollo)
   - `https://tu-dominio.com` (producción)
6. Copia el Client ID y configúralo en ambos archivos `.env`

## 📁 Estructura de Directorios Importantes

### Backend

- `src/controllers/` - Lógica de negocio
- `src/models/` - Modelos de base de datos
- `src/routes/` - Definición de rutas API
- `src/middleware/` - Middlewares personalizados
- `src/services/` - Servicios de negocio

### Frontend

- `src/components/` - Componentes reutilizables
- `src/pages/` - Páginas de la aplicación
- `src/contexts/` - Estado global de React
- `src/hooks/` - Hooks personalizados
- `src/services/` - Servicios de API

## 🛠️ Scripts Disponibles

### Backend

- `npm run dev` - Ejecutar en modo desarrollo
- `npm run build` - Construir para producción
- `npm start` - Ejecutar en modo producción

### Frontend

- `npm run dev` - Servidor de desarrollo
- `npm run build` - Construir para producción
- `npm run preview` - Vista previa de producción
- `npm run lint` - Verificar código

## 🔍 Endpoints de la API

### Autenticación

- `POST /api/auth/register` - Registro de usuario
- `POST /api/auth/login` - Login de usuario
- `GET /api/auth/google` - Login con Google

### Productos

- `GET /api/products` - Listar productos
- `GET /api/products/:id` - Obtener producto
- `GET /api/categories` - Listar categorías

### Carrito

- `GET /api/cart` - Obtener carrito
- `POST /api/cart/add` - Agregar al carrito
- `PUT /api/cart/update` - Actualizar carrito
- `DELETE /api/cart/remove/:id` - Remover del carrito

### Comentarios

- `GET /api/comments/:productId` - Comentarios de producto
- `POST /api/comments` - Crear comentario
- `PUT /api/comments/:id` - Actualizar comentario

## 🐛 Solución de Problemas

### Error de Conexión a Base de Datos

- Verifica que MySQL esté ejecutándose
- Confirma las credenciales en el archivo `.env`
- Asegúrate de que la base de datos existe

### Error de CORS

- Verifica que `FRONTEND_URL` esté configurado correctamente
- Asegúrate de que el frontend esté ejecutándose en el puerto correcto

### Error de Imágenes

- Verifica que las rutas de imágenes existan
- Asegúrate de que los permisos de escritura estén configurados

### Error de Google OAuth

- Verifica que el Client ID esté configurado correctamente
- Confirma que las URLs autorizadas incluyan tu dominio

## 📝 Notas Importantes

1. **Seguridad**: Cambia todas las claves secretas en producción
2. **Base de Datos**: Crea la base de datos antes de ejecutar el proyecto
3. **Imágenes**: Configura las rutas de imágenes según tu entorno
4. **Email**: Configura las credenciales de email para funcionalidad completa
5. **Google OAuth**: Opcional, pero recomendado para mejor UX
