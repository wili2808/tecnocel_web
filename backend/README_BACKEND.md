# 🚀 TecnoCel Web - Backend

## Descripción

Backend de TecnoCel Web, API REST completa desarrollada con Node.js, Express, TypeScript y MySQL. Proporciona endpoints para autenticación, productos, carrito, comentarios y gestión de imágenes.

## 🛠️ Stack Tecnológico

- **Node.js** con TypeScript 5.3.3
- **Express.js 4.18.2** - Framework web
- **MySQL 8.0+** con Sequelize 6.35.2 ORM
- **JWT** con bcryptjs 2.4.3 para autenticación
- **Passport.js** con Google OAuth 2.0
- **Multer 2.0.2** + **Sharp 0.34.3** para manejo de imágenes
- **Express-validator 7.2.1** para validación
- **Winston 3.17.0** para logging estructurado
- **Nodemailer 7.0.5** para envío de emails

## 🚀 Instalación y Ejecución

```bash
# Instalar dependencias
npm install

# Ejecutar en modo desarrollo
npm run dev

# Build de producción
npm run build

# Ejecutar en producción
npm start

# Linting
npm run lint
```

## 🏗️ Estructura del Proyecto

```
src/
├── config/                # Configuraciones centralizadas
│   ├── config.ts          # Configuración principal del sistema
│   └── database.ts        # Configuración de base de datos
├── controllers/           # Controladores de la API REST
│   ├── AuthController.ts  # Autenticación y autorización
│   ├── ProductController.ts # Gestión de productos
│   ├── CarritoController.ts # Gestión del carrito
│   ├── CommentController.ts # Sistema de comentarios
│   ├── UploadController.ts # Subida de imágenes
│   ├── OfferController.ts # Gestión de ofertas
│   ├── FavoriteController.ts # Gestión de favoritos
│   ├── AlmacenController.ts # Gestión de almacén
│   └── CaracteristicaController.ts # Características de productos
├── middleware/            # Middleware personalizado
│   ├── authMiddleware.ts  # Verificación de JWT
│   ├── staticImageMiddleware.ts # Servir imágenes estáticas
│   ├── validateCarrito.ts # Validación de carrito
│   └── uploadMiddleware.ts # Middleware de subida
├── models/                # Modelos de Sequelize con relaciones
│   ├── User.ts            # Modelo de usuario
│   ├── Product.ts         # Modelo de producto
│   ├── Carrito.ts         # Modelo de carrito
│   ├── Comment.ts         # Modelo de comentario
│   ├── Image.ts           # Modelo de imagen
│   ├── Offer.ts           # Modelo de oferta
│   ├── Favorite.ts        # Modelo de favorito
│   ├── Brand.ts           # Modelo de marca
│   ├── Category.ts        # Modelo de categoría
│   ├── Almacen.ts         # Modelo de almacén
│   └── Caracteristica.ts  # Modelo de característica
├── routes/                # Definición de rutas de la API
│   ├── authRoutes.ts      # Rutas de autenticación
│   ├── productRoutes.ts   # Rutas de productos
│   ├── carritoRoutes.ts   # Rutas del carrito
│   ├── commentRoutes.ts   # Rutas de comentarios
│   ├── uploadRoutes.ts    # Rutas de subida
│   ├── offerRoutes.ts     # Rutas de ofertas
│   ├── favoriteRoutes.ts  # Rutas de favoritos
│   ├── almacenRoutes.ts   # Rutas de almacén
│   └── caracteristicaRoutes.ts # Rutas de características
├── services/              # Servicios de negocio
│   └── imageService.ts    # Procesamiento de imágenes
├── utils/                 # Utilidades y helpers
│   ├── emailService.ts    # Servicio de email
│   └── logger.ts          # Sistema de logging
└── index.ts               # Punto de entrada de la aplicación
```

## 🔧 Configuración

### Variables de Entorno Requeridas

```env
# Base de Datos
DB_NAME=tecnocel_db_v3
DB_USER=root
DB_PASSWORD=tu_password_aqui
DB_HOST=localhost
DB_PORT=3306

# Servidor
PORT=3000
NODE_ENV=development

# JWT (¡OBLIGATORIO cambiar en producción!)
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

# Logging
LOG_LEVEL=info
SEQUELIZE_DEBUG=false
```

### Configuración de Base de Datos

1. **Crear base de datos:**

   ```sql
   CREATE DATABASE tecnocel_db_v3;
   ```

2. **Configurar conexión:**
   - Editar `src/config/database.ts`
   - Verificar credenciales en `.env`

## 🔍 API Endpoints

### Autenticación (`/api/auth`)

- `POST /register` - Registro de usuario
- `POST /login` - Login con email/password
- `GET /google` - Login con Google OAuth
- `POST /logout` - Cerrar sesión
- `GET /profile` - Obtener perfil del usuario

### Productos (`/api/products`)

- `GET /` - Listar productos con filtros
- `GET /:id` - Obtener producto por ID
- `GET /search` - Búsqueda de productos
- `GET /featured` - Productos destacados
- `GET /categories` - Listar categorías
- `GET /brands` - Listar marcas

### Carrito (`/api/cart`)

- `GET /` - Obtener carrito del usuario
- `POST /add` - Agregar producto al carrito
- `PUT /update` - Actualizar cantidad
- `DELETE /remove/:id` - Remover producto
- `DELETE /clear` - Vaciar carrito

### Comentarios (`/api/comments`)

- `GET /:productId` - Comentarios de un producto
- `POST /` - Crear comentario
- `PUT /:id` - Actualizar comentario
- `DELETE /:id` - Eliminar comentario

### Ofertas (`/api/offers`)

- `GET /` - Listar ofertas activas
- `GET /:id` - Obtener oferta por ID
- `POST /` - Crear oferta (admin)
- `PUT /:id` - Actualizar oferta
- `DELETE /:id` - Eliminar oferta

### Favoritos (`/api/favorites`)

- `GET /` - Listar favoritos del usuario
- `POST /` - Agregar a favoritos
- `DELETE /:id` - Remover de favoritos

### Imágenes (`/api/upload`)

- `POST /product` - Subir imagen de producto
- `POST /comment` - Subir imagen de comentario
- `GET /:filename` - Obtener imagen

## 🗄️ Modelos de Base de Datos

### Relaciones Principales

- **User** ↔ **Product** (favoritos)
- **User** ↔ **Carrito** (carrito de compras)
- **Product** ↔ **Comment** (comentarios)
- **Product** ↔ **Image** (imágenes)
- **Product** ↔ **Offer** (ofertas)
- **Product** ↔ **Brand** (marcas)
- **Product** ↔ **Category** (categorías)

### Esquemas Principales

```sql
-- Usuarios
tb_users (id, email, password, name, role, created_at)

-- Productos
tb_productos (id, nombre, descripcion, precio, stock, marca_id, categoria_id)

-- Carrito
tb_carrito (id, user_id, producto_id, cantidad, created_at)

-- Comentarios
tb_comentarios (id, user_id, producto_id, texto, rating, created_at)

-- Imágenes
tb_imagenes (id, producto_id, url, tipo, created_at)

-- Ofertas
tb_ofertas (id, producto_id, descuento, fecha_inicio, fecha_fin, activa)
```

## 🔐 Autenticación y Autorización

### JWT Implementation

- **Secret Key**: Configurable via `JWT_SECRET`
- **Expiration**: Configurable (default: 24h)
- **Refresh**: Implementado para renovación automática

### Google OAuth 2.0

- **Client ID**: Configurable via `GOOGLE_CLIENT_ID`
- **Scopes**: email, profile
- **Callback**: `/api/auth/google/callback`

### Middleware de Autenticación

```typescript
// Proteger rutas
app.use("/api/protected", authMiddleware);

// Verificar roles (futuro)
app.use("/api/admin", adminMiddleware);
```

## 🖼️ Manejo de Imágenes

### Configuración

- **Productos**: `IMAGES_PATH` (ej: `C:/xampp/htdocs/tecnocel`)
- **Comentarios**: `COMMENTS_IMAGES_PATH`
- **Tipos permitidos**: jpg, jpeg, png, webp
- **Tamaño máximo**: 5MB por archivo

### Procesamiento con Sharp

- **Redimensionamiento**: Automático según tipo
- **Optimización**: Compresión y conversión de formato
- **Thumbnails**: Generación automática

### Middleware de Imágenes

```typescript
// Subida de productos
upload.single("image");

// Subida de comentarios
upload.single("commentImage");

// Validación de tipos
fileFilter: (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Solo se permiten imágenes"));
  }
};
```

## 📧 Servicio de Email

### Configuración SMTP

- **Host**: Configurable via `EMAIL_HOST`
- **Puerto**: Configurable via `EMAIL_PORT`
- **Autenticación**: Usuario y contraseña

### Templates Disponibles

- **Registro**: Confirmación de cuenta
- **Recuperación**: Reset de contraseña
- **Pedidos**: Confirmación de compra

## 📊 Logging y Monitoreo

### Winston Configuration

```typescript
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: "logs/error.log", level: "error" }),
    new winston.transports.File({ filename: "logs/combined.log" }),
  ],
});
```

### Niveles de Log

- **Error**: Errores críticos del sistema
- **Warn**: Advertencias y problemas menores
- **Info**: Información general de operaciones
- **Debug**: Información detallada para desarrollo

## 🧪 Testing y Desarrollo

### Scripts de Prueba

```bash
# Verificar conexión a BD
npm run test:db

# Ejecutar tests unitarios
npm run test:unit

# Ejecutar tests de integración
npm run test:integration
```

### Scripts de Mantenimiento

- **Activar ofertas**: `scripts_test/activate-offers-now.js`
- **Verificar comentarios**: `scripts_test/check-comments-data.js`
- **Agregar ofertas de prueba**: `scripts_test/add-sample-offers.js`

## 🚀 Performance y Optimización

### Base de Datos

- **Índices**: Optimizados para consultas frecuentes
- **Queries**: Eager loading con Sequelize
- **Connection Pool**: Configuración optimizada

### Caché

- **Redis**: Implementación futura para sesiones
- **Memory**: Caché en memoria para datos estáticos

### Compresión

- **Gzip**: Habilitado para respuestas HTTP
- **Images**: Optimización automática con Sharp

## 🔒 Seguridad

### CORS Configuration

```typescript
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  })
);
```

### Rate Limiting

- **API endpoints**: 100 requests por minuto
- **Upload endpoints**: 10 requests por minuto
- **Auth endpoints**: 5 requests por minuto

### Validación de Entrada

- **Express-validator**: Validación de todos los inputs
- **Sanitización**: Limpieza de datos de entrada
- **SQL Injection**: Prevenido con Sequelize ORM

## 🐛 Solución de Problemas

### Errores Comunes

1. **Conexión a BD fallida**

   - Verificar que MySQL esté ejecutándose
   - Confirmar credenciales en `.env`
   - Verificar que la BD existe

2. **Error de CORS**

   - Verificar `FRONTEND_URL` en `.env`
   - Confirmar que el frontend esté en el puerto correcto

3. **Error de subida de imágenes**

   - Verificar permisos de escritura en rutas de imágenes
   - Confirmar que las carpetas existan
   - Verificar configuración de Multer

4. **Error de JWT**
   - Verificar que `JWT_SECRET` esté configurado
   - Confirmar que el token no haya expirado

### Logs de Debug

```bash
# Habilitar debug de Sequelize
SEQUELIZE_DEBUG=true

# Nivel de log detallado
LOG_LEVEL=debug
```

## 📚 Documentación Adicional

- **[API Completa](../note/DOCUMENTACION_BACKEND_API.md)** - Todos los endpoints
- **[Implementación de Comentarios](../note/IMPLEMENTACION_COMENTARIOS.md)** - Sistema de comentarios
- **[Google OAuth](../note/GOOGLE_OAUTH_IMPLEMENTATION.md)** - Configuración OAuth
- **[Migraciones de Imágenes](../note/MIGRACION_IMAGENES_COMENTARIOS.md)** - Sistema de imágenes

## 🔄 Deployment

### Producción

```bash
# Build del proyecto
npm run build

# Variables de entorno de producción
NODE_ENV=production
PORT=3000
JWT_SECRET=clave_super_segura_produccion

# Iniciar servidor
npm start
```

### Docker (Futuro)

- Dockerfile para containerización
- docker-compose para desarrollo local
- Variables de entorno para diferentes entornos

## 📈 Monitoreo y Métricas

### Health Checks

- `/health` - Estado del servidor
- `/health/db` - Estado de la base de datos
- `/health/storage` - Estado del almacenamiento

### Métricas (Futuro)

- **Prometheus**: Métricas del sistema
- **Grafana**: Dashboards de monitoreo
- **Alerting**: Notificaciones automáticas
