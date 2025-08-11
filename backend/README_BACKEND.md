# 🚀 TecnoCel Web - Backend

## Descripción

Backend de TecnoCel Web, API REST completa desarrollada con Node.js, Express, TypeScript y MySQL. Proporciona endpoints para autenticación, productos, carrito, comentarios, gestión de almacén y sistema completo de e-commerce.

## 🛠️ Stack Tecnológico

- **Node.js** con TypeScript 5.3.3
- **Express.js 4.18.2** - Framework web
- **MySQL 8.0+** con Sequelize 6.35.2 ORM
- **JWT** con bcryptjs 2.4.3 para autenticación
- **Google OAuth 2.0** con google-auth-library 10.2.0
- **Multer 2.0.2** + **Sharp 0.34.3** para manejo de imágenes
- **Express-validator 7.2.1** para validación
- **Winston 3.17.0** para logging estructurado
- **Nodemailer 7.0.5** para envío de emails
- **UUID 11.1.0** para identificadores únicos

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

# Testing de imágenes
npm run test:images

# Inicializar estructura de logs
npm run init:logs
```

## 🏗️ Estructura del Proyecto

```
src/
├── config/                # Configuraciones centralizadas
│   ├── config.ts          # Configuración principal del sistema
│   └── database.ts        # Configuración de base de datos
├── controllers/           # Controladores de la API REST
│   ├── AlmacenController.ts # Gestión completa de almacén y productos
│   ├── CaracteristicaController.ts # Características de productos
│   ├── CarritoController.ts # Gestión del carrito de compras
│   ├── ClienteController.ts # Gestión de clientes y usuarios
│   ├── ComentarioController.ts # Sistema de comentarios con imágenes
│   ├── DireccionController.ts # Gestión de direcciones de envío
│   ├── FavoritoController.ts # Sistema de favoritos
│   ├── GoogleAuthController.ts # Autenticación Google OAuth
│   ├── MarcaController.ts # Gestión de marcas de productos
│   ├── OfertaController.ts # Sistema de ofertas y descuentos
│   └── UploadController.ts # Subida y procesamiento de imágenes
├── middleware/            # Middleware personalizado
│   ├── authMiddleware.ts  # Verificación de JWT
│   ├── staticImageMiddleware.ts # Servir imágenes estáticas
│   ├── validateCarrito.ts # Validación completa del carrito
│   └── validateRegistration.ts # Validación de registro de usuarios
├── models/                # Modelos de Sequelize con relaciones
│   ├── index.ts           # Configuración de modelos y relaciones
│   ├── relaciones.ts      # Definición de todas las relaciones
│   ├── Usuario.ts         # Modelo de usuario del sistema
│   ├── Cliente.ts         # Modelo de cliente
│   ├── Producto.ts        # Modelo de producto (referenciado)
│   ├── Carrito.ts         # Modelo de carrito básico
│   ├── CarritoWeb.ts      # Modelo de carrito web
│   ├── CarritoWebItems.ts # Items del carrito web
│   ├── Comentario.ts      # Modelo de comentario
│   ├── ComentarioImagen.ts # Imágenes de comentarios
│   ├── ProductoImagen.ts  # Imágenes de productos
│   ├── Oferta.ts          # Modelo de oferta
│   ├── ProductoOferta.ts  # Relación producto-oferta
│   ├── Favorito.ts        # Modelo de favorito
│   ├── Marca.ts           # Modelo de marca
│   ├── Categoria.ts       # Modelo de categoría
│   ├── Almacen.ts         # Modelo de almacén
│   ├── Caracteristica.ts  # Modelo de característica
│   ├── ProductoCaracteristica.ts # Relación producto-característica
│   ├── TipoCaracteristica.ts # Tipos de características
│   ├── Proveedor.ts       # Modelo de proveedor
│   ├── Venta.ts           # Modelo de venta
│   ├── Compra.ts          # Modelo de compra
│   ├── DetalleCompra.ts   # Detalles de compra
│   ├── Devolucion.ts      # Modelo de devolución
│   ├── DetalleDevolucion.ts # Detalles de devolución
│   ├── Presupuesto.ts     # Modelo de presupuesto
│   ├── PresupuestoDetalle.ts # Detalles de presupuesto
│   └── Rol.ts             # Modelo de roles de usuario
├── routes/                # Definición de rutas de la API
│   ├── almacenRoutes.ts   # Rutas de almacén y productos
│   ├── caracteristicaRoutes.ts # Rutas de características
│   ├── carritoRoutes.ts   # Rutas del carrito
│   ├── clienteRoutes.ts   # Rutas de clientes
│   ├── comentarioRoutes.ts # Rutas de comentarios
│   ├── direccionRoutes.ts # Rutas de direcciones
│   ├── favoritoRoutes.ts  # Rutas de favoritos
│   ├── marcaRoutes.ts     # Rutas de marcas
│   ├── ofertaRoutes.ts    # Rutas de ofertas
│   └── uploadRoutes.ts    # Rutas de subida de imágenes
├── services/              # Servicios de negocio
│   └── imageService.ts    # Procesamiento y gestión de imágenes
├── services/              # Servicios de negocio (imágenes, email, logger)
│   ├── imageService.ts    # Procesamiento y gestión de imágenes
│   ├── emailService.ts    # Servicio de email
│   ├── loggerService.ts   # Sistema de logging con Winston
│   └── index.ts           # Exportaciones centralizadas
└── index.ts               # Punto de entrada de la aplicación
```

## 🔧 Configuración

### Variables de Entorno Requeridas

```env
# ===========================================
# CONFIGURACIÓN DE BASE DE DATOS
# ===========================================
DB_NAME=db_tecnocel_v4
DB_USER=root
DB_PASSWORD=tu_password_aqui
DB_HOST=localhost
DB_PORT=3306

# ===========================================
# CONFIGURACIÓN DEL SERVIDOR
# ===========================================
PORT=3000
NODE_ENV=development

# ===========================================
# CONFIGURACIÓN JWT
# ===========================================
JWT_SECRET=clave_secreta_supersegura_de_tecnocel

# ===========================================
# CONFIGURACIÓN DE LOGGING
# ===========================================
LOG_LEVEL=info
SEQUELIZE_DEBUG=false

# ===========================================
# CONFIGURACIÓN DE IMÁGENES
# ===========================================
IMAGES_BASE_PATH=C:/xampp/htdocs/tecnocel
PRODUCT_IMAGES_PATH=C:/xampp/htdocs/tecnocel/almacen/img_productos
COMMENT_IMAGES_PATH=C:/xampp/htdocs/tecnocel/img_comments
BASE_URL=http://localhost
IMAGES_ENDPOINT=
DEFAULT_PRODUCT_IMAGE=default-product.png
DEFAULT_COMMENT_IMAGE=default-comment.png

# ===========================================
# CONFIGURACIÓN DE EMAIL
# ===========================================
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=tu_email@gmail.com
EMAIL_PASS=tu_password_de_aplicacion
EMAIL_FROM=tu_email@gmail.com

# ===========================================
# CONFIGURACIÓN DEL FRONTEND
# ===========================================
FRONTEND_URL=http://localhost:5173

# ===========================================
# CONFIGURACIÓN DE GOOGLE
# ===========================================
GOOGLE_CLIENT_ID=tu_google_client_id_aqui
GOOGLE_CLIENT_SECRET=tu_google_client_secret_aqui
```

### Configuración de Base de Datos

1. **Crear base de datos:**

   ```sql
   CREATE DATABASE db_tecnocel_v4;
   ```

2. **Configurar conexión:**
   - Editar `src/config/database.ts`
   - Verificar credenciales en `.env`

## 🔍 API Endpoints

### Almacén y Productos (`/api/almacen`)

- `GET /` - Listar productos con filtros avanzados
- `GET /:id` - Obtener producto por ID con detalles completos
- `POST /` - Crear nuevo producto
- `PUT /:id` - Actualizar producto
- `DELETE /:id` - Eliminar producto
- `GET /search` - Búsqueda avanzada de productos
- `GET /featured` - Productos destacados
- `GET /categories` - Listar categorías
- `GET /brands` - Listar marcas

### Carrito (`/api/carrito`)

- `GET /` - Obtener carrito del usuario
- `POST /add` - Agregar producto al carrito
- `PUT /update` - Actualizar cantidad
- `DELETE /remove/:id` - Remover producto
- `DELETE /clear` - Vaciar carrito
- `POST /checkout` - Procesar compra

### Comentarios (`/api/comentarios`)

- `GET /:productId` - Comentarios de un producto
- `POST /` - Crear comentario con imágenes
- `PUT /:id` - Actualizar comentario
- `DELETE /:id` - Eliminar comentario
- `GET /user/:userId` - Comentarios de un usuario

### Clientes (`/api/clientes`)

- `GET /profile` - Obtener perfil del cliente
- `PUT /profile` - Actualizar perfil
- `POST /register` - Registro de cliente
- `POST /login` - Login de cliente
- `POST /logout` - Cerrar sesión

### Ofertas (`/api/ofertas`)

- `GET /` - Listar ofertas activas
- `GET /:id` - Obtener oferta por ID
- `POST /` - Crear oferta
- `PUT /:id` - Actualizar oferta
- `DELETE /:id` - Eliminar oferta
- `GET /product/:productId` - Ofertas de un producto

### Favoritos (`/api/favoritos`)

- `GET /` - Listar favoritos del usuario
- `POST /` - Agregar a favoritos
- `DELETE /:id` - Remover de favoritos
- `GET /check/:productId` - Verificar si está en favoritos

### Marcas (`/api/marcas`)

- `GET /` - Listar todas las marcas
- `GET /:id` - Obtener marca por ID
- `POST /` - Crear nueva marca
- `PUT /:id` - Actualizar marca
- `DELETE /:id` - Eliminar marca

### Características (`/api/caracteristicas`)

- `GET /` - Listar características
- `GET /:id` - Obtener característica por ID
- `POST /` - Crear característica
- `PUT /:id` - Actualizar característica
- `DELETE /:id` - Eliminar característica
- `GET /types` - Listar tipos de características

### Direcciones (`/api/direcciones`)

- `GET /` - Listar direcciones del usuario
- `POST /` - Crear nueva dirección
- `PUT /:id` - Actualizar dirección
- `DELETE /:id` - Eliminar dirección
- `GET /:id` - Obtener dirección por ID

### Imágenes (`/api/upload`)

- `POST /product` - Subir imagen de producto
- `POST /comment` - Subir imagen de comentario
- `GET /:filename` - Obtener imagen
- `DELETE /:filename` - Eliminar imagen

## 🗄️ Modelos de Base de Datos

### Relaciones Principales

- **Usuario** ↔ **Cliente** (relación 1:1)
- **Cliente** ↔ **CarritoWeb** (carrito de compras)
- **Cliente** ↔ **Favorito** (productos favoritos)
- **Cliente** ↔ **Direccion** (direcciones de envío)
- **Producto** ↔ **Comentario** (comentarios de productos)
- **Producto** ↔ **ProductoImagen** (imágenes de productos)
- **Producto** ↔ **Oferta** (ofertas activas)
- **Producto** ↔ **Marca** (marca del producto)
- **Producto** ↔ **Categoria** (categoría del producto)
- **Producto** ↔ **Caracteristica** (características del producto)

### Esquemas Principales

```sql
-- Usuarios del sistema
tb_usuarios (id, email, password, role, created_at)

-- Clientes
tb_clientes (id, usuario_id, nombre, apellido, telefono, fecha_nacimiento)

-- Productos
tb_productos (id, nombre, descripcion, precio, stock, marca_id, categoria_id, almacen_id)

-- Carrito web
tb_carrito_web (id, cliente_id, created_at, updated_at)
tb_carrito_web_items (id, carrito_id, producto_id, cantidad, precio_unitario)

-- Comentarios
tb_comentarios (id, cliente_id, producto_id, texto, rating, created_at)
tb_comentario_imagenes (id, comentario_id, url, created_at)

-- Ofertas
tb_ofertas (id, nombre, descripcion, descuento, fecha_inicio, fecha_fin, activa)
tb_producto_ofertas (id, producto_id, oferta_id)

-- Favoritos
tb_favoritos (id, cliente_id, producto_id, created_at)

-- Características
tb_caracteristicas (id, nombre, valor, tipo_id, producto_id)
tb_tipos_caracteristica (id, nombre, descripcion)
```

## 🔐 Autenticación y Autorización

### JWT Implementation

- **Secret Key**: Configurable via `JWT_SECRET`
- **Expiration**: Configurable (default: 24h)
- **Refresh**: Implementado para renovación automática

### Google OAuth 2.0

- **Client ID**: Configurable via `GOOGLE_CLIENT_ID`
- **Client Secret**: Configurable via `GOOGLE_CLIENT_SECRET`
- **Scopes**: email, profile
- **Integration**: Con google-auth-library 10.2.0

### Middleware de Autenticación

```typescript
// Proteger rutas
app.use("/api/protected", authMiddleware);

// Validación de registro
app.use("/api/clientes/register", validateRegistration);

// Validación de carrito
app.use("/api/carrito", validateCarrito);
```

## 🖼️ Manejo de Imágenes

### Configuración

- **Productos**: `PRODUCT_IMAGES_PATH` (ej: `C:/xampp/htdocs/tecnocel/almacen/img_productos`)
- **Comentarios**: `COMMENT_IMAGES_PATH`
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
# Verificar endpoints de imágenes
npm run test:images

# Inicializar estructura de logs
npm run init:logs
```

### Scripts de Mantenimiento

- **Activar ofertas**: `scripts_test/activate-offers-now.js`
- **Verificar comentarios**: `scripts_test/check-comments-data.js`
- **Agregar ofertas de prueba**: `scripts_test/add-sample-offers.js`
- **Verificar estructura de BD**: `scripts_test/check-database-structure.js`

## 🚀 Performance y Optimización

### Base de Datos

- **Índices**: Optimizados para consultas frecuentes
- **Queries**: Eager loading con Sequelize
- **Connection Pool**: Configuración optimizada

### Caché

- **Images**: Cache de imágenes estáticas con headers apropiados
- **Memory**: Caché en memoria para datos estáticos

### Compresión

- **Images**: Optimización automática con Sharp
- **Response**: Compresión de respuestas HTTP

## 🔒 Seguridad

### CORS Configuration

```typescript
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
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

## 🆕 Características Recientes

### Sistema de Almacén Completo

- Gestión de productos con características avanzadas
- Sistema de inventario y stock
- Gestión de proveedores y compras
- Sistema de ventas y devoluciones

### Carrito Web Avanzado

- Carrito persistente por usuario
- Validación completa de productos
- Sistema de precios y descuentos
- Integración con ofertas

### Sistema de Comentarios Mejorado

- Comentarios con imágenes
- Sistema de ratings
- Moderación de contenido
- Relación con productos y usuarios

### Gestión de Direcciones

- Múltiples direcciones por usuario
- Validación de direcciones
- Integración con sistema de envíos
- Historial de direcciones utilizadas
