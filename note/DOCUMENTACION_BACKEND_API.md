# Documentación Backend API - TecnoCel Web

## Índice

1. [Descripción General](#descripción-general)
2. [Arquitectura del Sistema](#arquitectura-del-sistema)
3. [Configuración y Variables de Entorno](#configuración-y-variables-de-entorno)
4. [Sistema de Logging Optimizado](#sistema-de-logging-optimizado)
5. [Rutas de la API](#rutas-de-la-api)
6. [Autenticación y Autorización](#autenticación-y-autorización)
7. [Servicios](#servicios)
8. [Middleware](#middleware)
9. [Modelos de Base de Datos](#modelos-de-base-de-datos)
10. [Scripts de Prueba](#scripts-de-prueba)
11. [Monitoreo y Logs](#monitoreo-y-logs)
12. [Manejo de Imágenes](#manejo-de-imágenes)
13. [Estructura de Respuestas](#estructura-de-respuestas)
14. [Validaciones y Seguridad](#validaciones-y-seguridad)

## Descripción General

El backend de TecnoCel Web es una API REST desarrollada en Node.js con TypeScript, Express y Sequelize. Proporciona funcionalidades completas para una tienda en línea de productos tecnológicos, incluyendo gestión de productos, carrito de compras, comentarios, autenticación de usuarios, gestión de imágenes y sistema de ofertas.

### Tecnologías Principales

- **Node.js** con TypeScript
- **Express.js** como framework web
- **Sequelize** como ORM para MySQL
- **JWT** para autenticación
- **Winston** para logging estructurado
- **Multer** para manejo de archivos
- **Sharp** para procesamiento de imágenes
- **Google OAuth** para autenticación social
- **Express-validator** para validaciones
- **UUID** para generación de identificadores únicos

## Arquitectura del Sistema

```
backend/
├── src/
│   ├── config/           # Configuraciones centralizadas
│   │   ├── config.ts     # Configuración principal
│   │   └── database.ts   # Configuración de BD
│   ├── controllers/      # Controladores de la API
│   │   ├── AlmacenController.ts
│   │   ├── CarritoController.ts
│   │   ├── ClienteController.ts
│   │   ├── ComentarioController.ts
│   │   ├── UploadController.ts
│   │   └── ...
│   ├── middleware/       # Middleware personalizado
│   │   ├── authMiddleware.ts
│   │   ├── staticImageMiddleware.ts
│   │   ├── validateCarrito.ts
│   │   └── validateRegistration.ts
│   ├── models/          # Modelos de Sequelize
│   ├── routes/          # Definición de rutas
│   ├── services/        # Servicios de negocio
│   │   ├── imageService.ts
│   │   └── emailService.ts
│   ├── utils/           # Utilidades y helpers
│   │   └── logger.ts
│   └── index.ts         # Punto de entrada
├── scripts_test/        # Scripts de prueba y mantenimiento
├── logs/               # Archivos de logs
└── dist/               # Código compilado
```

## Configuración y Variables de Entorno

### Variables de Entorno Requeridas

```env
# Base de Datos
DB_NAME=tecnocel_db_v2
DB_USER=root
DB_PASSWORD=
DB_HOST=localhost
DB_PORT=3306

# Servidor
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# JWT
JWT_SECRET=tu_clave_secreta_aqui

# Imágenes
IMAGES_PATH=C:/xampp/htdocs/tecnocel
PRODUCTS_IMAGES_PATH=C:/xampp/htdocs/tecnocel/almacen/img_productos
COMMENTS_IMAGES_PATH=C:/xampp/htdocs/tecnocel/img_comments
BASE_URL=http://localhost:3000
IMAGES_ENDPOINT=/api/images
DEFAULT_IMAGE=default-product.png

# Google OAuth
GOOGLE_CLIENT_ID=tu_google_client_id

# Email (opcional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=tu_email@gmail.com
EMAIL_PASS=tu_password
EMAIL_FROM=noreply@tecnocel.com

# Logging
LOG_LEVEL=info
```

### Configuración Centralizada

El sistema utiliza un archivo de configuración centralizado (`config.ts`) que organiza todas las configuraciones:

```typescript
export const config = {
  database: {
    /* configuración de BD */
  },
  server: {
    /* configuración del servidor */
  },
  jwt: {
    /* configuración JWT */
  },
  logging: {
    /* configuración de logs */
  },
  images: {
    /* configuración de imágenes */
  },
};
```

## Sistema de Logging Optimizado

### Configuración de Winston

El sistema de logging utiliza Winston con las siguientes características:

- **Formato estructurado** con timestamps y metadatos
- **Logs separados** por nivel (error.log, combined.log)
- **Rotación automática** de archivos (5MB máximo, 5 archivos)
- **Logs en consola** solo en desarrollo
- **Stack traces** para errores
- **Patrón Singleton** para evitar múltiples instancias

### Niveles de Log

- **ERROR**: Errores críticos y excepciones
- **WARN**: Advertencias y situaciones anómalas
- **INFO**: Información importante del sistema
- **DEBUG**: Información detallada (solo en desarrollo)

### Logs Automáticos Implementados

#### Logs de Request/Response (Middleware Global)

```javascript
// Middleware automático que registra todas las requests
{
  method: 'GET',
  path: '/api/almacen/productos',
  statusCode: 200,
  duration: '45ms',
  userAgent: 'Mozilla/5.0...',
  ip: '192.168.1.100'
}
```

#### Logs de Operaciones de Carrito

```javascript
// Operaciones de carrito con contexto completo
{
  operacion: 'agregar_item',
  cliente_id: 123,
  producto_id: 456,
  cantidad: 2,
  timestamp: '2024-01-15T10:30:00.000Z'
}
```

## Rutas de la API

### 1. Rutas de Almacén (`/api/almacen`)

#### Rutas Públicas

- `GET /diagnostico` - Diagnóstico de productos
- `GET /productos` - Listar todos los productos con imágenes
- `GET /productos/destacados` - Productos destacados
- `GET /productos/:id` - Obtener producto por ID con imágenes completas
- `GET /productos/buscar` - Buscar productos
- `GET /productos/categoria/:categoriaId` - Productos por categoría
- `GET /categorias` - Listar todas las categorías

#### Rutas Protegidas (requieren autenticación)

- `POST /productos` - Crear nuevo producto con imágenes
- `PUT /productos/:id` - Actualizar producto
- `DELETE /productos/:id` - Eliminar producto
- `PATCH /productos/:id/stock` - Actualizar stock

### 2. Rutas de Clientes (`/api/clientes`)

#### Rutas Públicas

- `POST /register` - Registro de cliente
- `POST /login` - Login de cliente
- `POST /google-login` - Login con Google OAuth
- `GET /verify-email` - Verificar email
- `POST /forgot-password` - Solicitar recuperación de contraseña
- `POST /reset-password` - Restablecer contraseña

#### Rutas Protegidas

- `GET /verify-token` - Verificar token válido

### 3. Rutas de Carrito (`/api/carrito`)

Todas las rutas requieren autenticación de cliente y incluyen rate limiting:

- `GET /` - Obtener carrito activo
- `POST /items` - Agregar item al carrito (con validaciones)
- `PUT /items/:id_item` - Actualizar cantidad de item
- `DELETE /items/:id_item` - Eliminar item del carrito
- `DELETE /` - Vaciar carrito completo
- `POST /confirmar-compra` - Confirmar compra
- `GET /historial` - Obtener historial de carritos

### 4. Rutas de Comentarios (`/api/comentarios`)

#### Rutas Públicas

- `GET /producto/:id_producto` - Obtener comentarios de producto
- `GET /producto/:id_producto/estadisticas` - Estadísticas de comentarios

#### Rutas Protegidas

- `POST /` - Crear nuevo comentario con imágenes
- `PUT /:id_comentario` - Actualizar comentario
- `DELETE /:id_comentario` - Eliminar comentario

### 5. Rutas de Upload (`/api/upload`)

#### Rutas Protegidas

- `POST /comment-images` - Subir imágenes de comentarios (máx. 5 archivos, 10MB cada uno)

### 6. Rutas Adicionales

- `GET /api/marcas` - Gestión de marcas
- `GET /api/caracteristicas` - Gestión de características
- `GET /api/ofertas` - Gestión de ofertas
- `GET /api/favoritos` - Gestión de favoritos
- `GET /api/direcciones` - Gestión de direcciones

### 7. Rutas del Sistema

- `GET /` - Health check de la API
- `GET /api/images/*` - Servir imágenes estáticas
- `GET /api/images-status` - Estado del servicio de imágenes

## Autenticación y Autorización

### JWT (JSON Web Tokens)

El sistema utiliza JWT para autenticación con las siguientes características:

- **Secret**: Configurado via `JWT_SECRET`
- **Expiración**: 24 horas por defecto
- **Payload**: Incluye ID de usuario/cliente y email

### Tipos de Autenticación

#### 1. Autenticación de Usuarios (Admin)

```javascript
// Middleware: verificarToken
// Para rutas administrativas y gestión de productos
{
  id_usuario: number,
  nombres: string,
  email: string,
  id_rol: number
}
```

#### 2. Autenticación de Clientes

```javascript
// Middleware: verificarTokenCliente
// Para operaciones de carrito, comentarios, etc.
{
  id_cliente: number,
  nombre_cliente: string,
  email_cliente: string
}
```

### Verificación de Roles

```javascript
// Middleware: verificarRol
// Control de acceso por roles específicos
verificarRol([1, 2]); // Solo roles 1 y 2 pueden acceder
```

## Servicios

### 1. Servicio de Imágenes (`imageService.ts`)

Gestiona la transformación y generación de URLs de imágenes:

#### Características Principales

- **Transformación automática** de productos con URLs de imágenes
- **Validación de seguridad** para nombres de archivo
- **Generación de URLs** para imágenes de productos y comentarios
- **Estadísticas de imágenes** del sistema
- **Patrón Singleton** para instancia única

#### Métodos Principales

```typescript
// Transformar producto individual
transformProductWithImageUrls(producto: any): Promise<any>

// Transformar lista de productos
transformProductsWithImageUrls(productos: any[]): Promise<any[]>

// Generar URL de imagen
generateImageUrl(imageName: string | null): string

// Verificar existencia de imagen
imageExists(imageName: string): boolean

// Obtener estadísticas
getImageStats(): Promise<object>
```

#### Estructura de Respuesta de Imágenes

```javascript
{
  imagen_url: "http://localhost:3000/tecnocel/almacen/img_productos/producto.jpg",
  imagen_disponible: true,
  imagenes: [
    {
      url: "http://localhost:3000/tecnocel/almacen/img_productos/imagen1.jpg",
      es_principal: true,
      alt_text: "Descripción de la imagen",
      orden: 1
    }
  ]
}
```

### 2. Servicio de Email (`emailService.ts`)

Gestiona el envío de emails:

- **Verificación de email** para nuevos usuarios
- **Recuperación de contraseña**
- **Configuración SMTP** flexible

### 3. Servicio de Upload (`UploadController.ts`)

Maneja la subida y procesamiento de imágenes:

#### Características

- **Procesamiento con Sharp** para optimización
- **Validación de tipos de archivo** (JPEG, PNG, WebP, GIF)
- **Generación de nombres únicos** con UUID
- **Límites configurados** (10MB por archivo, 5 archivos máximo)
- **Optimización automática** (resize a 1200x1200, calidad 85%)

#### Proceso de Upload

```javascript
// 1. Validación de archivos
// 2. Procesamiento con Sharp
// 3. Generación de nombre único
// 4. Guardado en directorio
// 5. Retorno de metadatos
{
  nombre_archivo: "comment_1705123456789_uuid.jpg",
  ruta_imagen: "img_comments/comment_1705123456789_uuid.jpg",
  tipo_archivo: "jpg",
  tamaño_archivo: 245760,
  alt_text: "Imagen 1 del comentario",
  orden: 1
}
```

## Middleware

### 1. Middleware de Autenticación (`authMiddleware.ts`)

#### Funciones Principales

- **verificarToken**: Para usuarios administrativos
- **verificarTokenCliente**: Para clientes web
- **verificarRol**: Control de acceso por roles

#### Características de Seguridad

- Validación de tokens JWT
- Verificación de existencia de usuario/cliente
- Verificación de estado de cuenta (habilitado, email verificado)
- Logs detallados de intentos de acceso

### 2. Middleware de Validación (`validateCarrito.ts`)

Validaciones específicas para operaciones de carrito:

#### Validaciones Implementadas

- **validateAgregarItem**: Validar datos para agregar items
- **validateActualizarCantidad**: Validar actualización de cantidad
- **validateEliminarItem**: Validar eliminación de items
- **validateConfirmarCompra**: Validar confirmación de compra
- **verificarLimitesCarrito**: Verificar límites de carrito
- **verificarDisponibilidadProducto**: Verificar stock disponible

#### Rate Limiting Diferenciado

```javascript
// Diferentes límites según la operación
const rateLimits = {
  obtener_carrito: { windowMs: 60000, max: 30 },
  agregar_item: { windowMs: 60000, max: 10 },
  actualizar_cantidad: { windowMs: 60000, max: 15 },
  eliminar_item: { windowMs: 60000, max: 20 },
  vaciar_carrito: { windowMs: 60000, max: 5 },
  confirmar_compra: { windowMs: 300000, max: 3 },
};
```

### 3. Middleware de Imágenes (`staticImageMiddleware.ts`)

Servicio de imágenes estáticas con características avanzadas:

#### Características de Seguridad

- **Validación de nombres de archivo** para prevenir path traversal
- **Tipos MIME** correctos según extensión
- **Cache headers** para optimización (24 horas por defecto)
- **Imagen por defecto** para archivos no encontrados
- **Validación de rutas seguras**

#### Tipos de Archivo Soportados

```javascript
const ALLOWED_IMAGE_TYPES = [
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".gif",
  ".jfif",
  ".avif",
  ".bmp",
  ".tiff",
  ".tif",
];
```

#### Rutas Seguras Permitidas

```javascript
const safePaths = [
  "img_comments/",
  "comments_img/",
  "comments/",
  "img_productos/",
  "productos/",
  "almacen/img_productos/",
  "product_images/",
];
```

### 4. Middleware de Validación de Registro (`validateRegistration.ts`)

Validaciones para registro de clientes:

- **Campos obligatorios**
- **Formato de email**
- **Longitud de contraseña**
- **Validación de NIT/CI**

## Modelos de Base de Datos

### Modelos Principales

1. **Almacen** - Productos del almacén
2. **Cliente** - Clientes del sistema web
3. **Usuario** - Usuarios administrativos
4. **Categoria** - Categorías de productos
5. **CarritoWeb** - Carritos de compra web
6. **CarritoWebItems** - Items en carritos
7. **Comentario** - Comentarios de productos
8. **ComentarioImagen** - Imágenes de comentarios
9. **ProductoImagen** - Imágenes de productos
10. **Venta** - Ventas realizadas
11. **DetalleCompra** - Detalles de compras
12. **Marca** - Marcas de productos
13. **Oferta** - Ofertas y descuentos
14. **Favorito** - Productos favoritos
15. **Direccion** - Direcciones de clientes

### Relaciones Principales

- **Almacen** ↔ **Categoria** (N:1)
- **Almacen** ↔ **Usuario** (N:1) - Creador del producto
- **Almacen** ↔ **Marca** (N:1)
- **Almacen** ↔ **ProductoImagen** (1:N)
- **Cliente** ↔ **CarritoWeb** (1:N)
- **CarritoWeb** ↔ **CarritoWebItems** (1:N)
- **CarritoWebItems** ↔ **Almacen** (N:1)
- **Comentario** ↔ **Cliente** (N:1)
- **Comentario** ↔ **Almacen** (N:1)
- **Comentario** ↔ **ComentarioImagen** (1:N)

## Manejo de Imágenes

### Arquitectura de Imágenes

El sistema maneja imágenes a través de múltiples capas optimizadas:

#### 1. Configuración Centralizada

```typescript
images: {
  imagesPath: "C:/xampp/htdocs/tecnocel",
  productsPath: "C:/xampp/htdocs/tecnocel/almacen/img_productos",
  commentsPath: "C:/xampp/htdocs/tecnocel/img_comments",
  baseUrl: "http://localhost:3000",
  endpoint: "/api/images",
  defaultImage: "default-product.png"
}
```

#### 2. Servicio de Imágenes Mejorado

- **Transformación automática** de productos con URLs
- **Validación de seguridad** para nombres de archivo
- **Generación de URLs** completas
- **Estadísticas** del sistema de imágenes
- **Gestión avanzada** de imágenes principales y orden

#### 3. Middleware de Imágenes Estáticas

- **Servicio directo** de archivos de imagen
- **Cache headers** para optimización
- **Validación de seguridad** contra path traversal
- **Imagen por defecto** para archivos no encontrados

#### 4. Procesamiento de Uploads

- **Optimización automática** con Sharp
- **Validación de tipos** de archivo
- **Generación de nombres únicos**
- **Límites de tamaño** y cantidad

### Flujo de Imágenes

#### Para Productos

1. **Almacenamiento**: Imágenes guardadas en `almacen/img_productos/`
2. **Base de Datos**: Metadatos en tabla `tb_producto_imagenes` (migración completada)
3. **Servicio**: URLs generadas por `ImageService`
4. **Acceso**: A través de `/api/images/` o URLs directas

#### Para Comentarios

1. **Upload**: Procesamiento con Sharp
2. **Almacenamiento**: Imágenes guardadas en `img_comments/`
3. **Base de Datos**: Metadatos en tabla `ComentarioImagen`
4. **Acceso**: A través de `/api/images/img_comments/`

### Migración Completada

#### Estado Actual

- ✅ **Migración de datos completada**: Campo `imagen` de `tb_almacen` migrado a `tb_producto_imagenes`
- ✅ **Código actualizado**: Eliminadas referencias al campo `imagen` en modelos y controladores
- ✅ **Frontend actualizado**: Componentes adaptados para usar la nueva estructura
- ✅ **ImageService mejorado**: Métodos adicionales para gestión avanzada

#### Estructura de Base de Datos

```sql
-- Tabla tb_producto_imagenes (estructura final)
CREATE TABLE tb_producto_imagenes (
  id_imagen INT PRIMARY KEY AUTO_INCREMENT,
  id_producto INT NOT NULL,
  url_imagen TEXT NOT NULL,
  alt_text VARCHAR(255),
  es_principal BOOLEAN DEFAULT FALSE,
  orden INT DEFAULT 0,
  fyh_creacion DATETIME NOT NULL,
  FOREIGN KEY (id_producto) REFERENCES tb_almacen(id_producto)
);
```

#### Métodos del ImageService

```typescript
// Métodos principales
transformProductWithImageUrls(producto: any): Promise<any>
transformProductsWithImageUrls(productos: any[]): Promise<any[]>
generateImageUrl(imageName: string | null): string
imageExists(imageName: string): boolean

// Métodos de gestión avanzada
setMainImage(productId: number, imageId: number): Promise<boolean>
reorderImages(productId: number, imageOrder: number[]): Promise<boolean>
deleteProductImage(imageId: number): Promise<boolean>
getProductImages(productId: number): Promise<ImageInfo[]>
validateMainImage(productId: number, newMainImageId?: number): Promise<boolean>
cleanOrphanImages(): Promise<number>
```

### Seguridad de Imágenes

#### Validaciones Implementadas

- **Path traversal protection**: Prevención de `../` en nombres
- **Tipos de archivo**: Solo extensiones permitidas
- **Tamaño de archivo**: Límites configurados
- **Caracteres peligrosos**: Filtrado de caracteres de control
- **Rutas seguras**: Solo directorios permitidos

#### Headers de Seguridad

```javascript
res.set({
  "Content-Type": mimeType,
  "Cache-Control": "public, max-age=86400",
  ETag: `"${filename}-${Date.now()}"`,
  "X-Content-Type-Options": "nosniff",
});
```

### Verificación de Migración

#### Script de Verificación

Se incluye un script para verificar la migración:

```bash
node backend/scripts_test/verify-image-migration.js
```

Este script verifica:

- Consistencia entre `tb_almacen` y `tb_producto_imagenes`
- Imágenes principales únicas por producto
- Orden de imágenes consistente
- Productos sin imágenes
- Estadísticas generales

#### Próximos Pasos

1. **Ejecutar script de verificación** para confirmar migración exitosa
2. **Eliminar campo `imagen`** de `tb_almacen` (pendiente)
3. **Actualizar documentación** de base de datos
4. **Monitorear funcionamiento** en producción

## Estructura de Respuestas

### Respuestas Estándar

#### Respuesta Exitosa

```javascript
{
  // Datos de la respuesta
  data: { /* datos específicos */ },

  // Metadatos (opcional)
  meta: {
    total: 100,
    page: 1,
    limit: 20
  }
}
```

#### Respuesta de Error

```javascript
{
  error: 'Descripción del error',
  message: 'Mensaje detallado (solo en desarrollo)',
  code: 'ERROR_CODE' // opcional
}
```

### Respuestas Específicas

#### Productos con Imágenes

```javascript
{
  id_producto: 1,
  nombre: "iPhone 13",
  precio: 1500.00,
  imagen_url: "http://localhost:3000/tecnocel/almacen/img_productos/iphone13.jpg",
  imagen_disponible: true,
  imagenes: [
    {
      url: "http://localhost:3000/tecnocel/almacen/img_productos/iphone13_1.jpg",
      es_principal: true,
      alt_text: "iPhone 13 frontal",
      orden: 1
    }
  ],
  categoria: {
    nombre_categoria: "Celulares"
  },
  marca: {
    nombre_marca: "Apple",
    logo_marca: "apple_logo.png"
  }
}
```

#### Carrito de Compras

```javascript
{
  id_carrito: 123,
  cliente_id: 456,
  items: [
    {
      id_item: 1,
      id_producto: 789,
      cantidad: 2,
      precio_unitario: 1500.00,
      subtotal: 3000.00,
      producto: {
        nombre: "iPhone 13",
        imagen_url: "http://localhost:3000/tecnocel/almacen/img_productos/iphone13.jpg"
      }
    }
  ],
  total: 3000.00,
  fecha_creacion: "2024-01-15T10:30:00.000Z"
}
```

#### Comentarios con Imágenes

```javascript
{
  id_comentario: 1,
  comentario: "Excelente producto, muy buena calidad",
  calificacion: 5,
  fecha_creacion: "2024-01-15T10:30:00.000Z",
  cliente: {
    nombre_cliente: "Juan Pérez"
  },
  imagenes: [
    {
      nombre_archivo: "comment_1705123456789_uuid.jpg",
      ruta_imagen: "img_comments/comment_1705123456789_uuid.jpg",
      tipo_archivo: "jpg",
      tamaño_archivo: 245760,
      alt_text: "Imagen 1 del comentario",
      orden: 1
    }
  ]
}
```

## Validaciones y Seguridad

### Validaciones de Entrada

#### Express-validator

El sistema utiliza `express-validator` para validaciones robustas:

```javascript
// Ejemplo de validación para crear comentario
const validateCrearComentario = [
  body("id_producto")
    .isInt({ min: 1 })
    .withMessage("El ID del producto debe ser un número entero positivo"),
  body("comentario")
    .isLength({ min: 10, max: 2000 })
    .withMessage("El comentario debe tener entre 10 y 2000 caracteres")
    .trim(),
  body("calificacion")
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage("La calificación debe ser un número entre 1 y 5"),
];
```

#### Validaciones de Carrito

```javascript
// Validaciones específicas para operaciones de carrito
validateAgregarItem: [
  body("id_producto").isInt({ min: 1 }),
  body("cantidad").isInt({ min: 1, max: 999 }),
  body("detalles_personalizacion").optional().isObject(),
];
```

### Seguridad Implementada

#### 1. Autenticación JWT

- **Tokens seguros** con expiración
- **Verificación de existencia** de usuario/cliente
- **Validación de estado** de cuenta

#### 2. Rate Limiting

- **Límites diferenciados** por operación
- **Protección contra spam** y ataques
- **Configuración flexible** de límites

#### 3. Validación de Archivos

- **Tipos MIME** verificados
- **Tamaños limitados**
- **Nombres sanitizados**

#### 4. Logs de Auditoría

- **Todas las operaciones** registradas
- **Información de contexto** completa
- **Detección de anomalías**

## Scripts de Prueba

El directorio `scripts_test/` contiene scripts para:

### Diagnóstico y Verificación

- `check-database-structure.js` - Verificar estructura de BD
- `check-database-tables.js` - Verificar tablas existentes
- `check-image-paths.js` - Verificar rutas de imágenes
- `final-verification.js` - Verificación completa del sistema

### Gestión de Comentarios

- `check-comments-data.js` - Verificar datos de comentarios
- `check-comments-images-directory.js` - Verificar directorio de imágenes
- `debug-comments-images.js` - Debug de imágenes de comentarios
- `migrate-comments-images.js` - Migración de imágenes
- `update-comments-image-paths.js` - Actualizar rutas de imágenes
- `verify-comments-images-fix.js` - Verificar corrección de imágenes

### Pruebas de Funcionalidad

- `test-google-creation.js` - Pruebas de creación con Google
- `test-google-oauth.js` - Pruebas de OAuth de Google
- `test-image-middleware.js` - Pruebas del middleware de imágenes
- `test-middleware-direct.js` - Pruebas directas de middleware

## Monitoreo y Logs

### Logs Importantes para Monitoreo

#### 1. Inicio del Sistema

```javascript
{
  port: 3000,
  environment: 'development',
  nodeVersion: 'v18.17.0',
  timestamp: '2024-01-15T10:30:00.000Z'
}
```

#### 2. Conexión a Base de Datos

```javascript
{
  host: 'localhost',
  port: 3306,
  database: 'tecnocel_db_v2',
  status: 'connected'
}
```

#### 3. Operaciones de Carrito

```javascript
{
  operacion: 'agregar_item',
  cliente_id: 123,
  producto_id: 456,
  cantidad: 2,
  resultado: 'exitoso',
  timestamp: '2024-01-15T10:30:00.000Z'
}
```

#### 4. Errores Críticos

```javascript
{
  error: 'Error de conexión a base de datos',
  stack: 'Error stack trace...',
  path: '/api/almacen/productos',
  method: 'GET',
  timestamp: '2024-01-15T10:30:00.000Z'
}
```

### Métricas Recomendadas para Monitoreo

1. **Tiempo de respuesta** de endpoints críticos
2. **Tasa de errores** por endpoint
3. **Uso de memoria** y CPU
4. **Conexiones a base de datos**
5. **Espacio en disco** para logs e imágenes
6. **Tasa de autenticaciones exitosas/fallidas**
7. **Operaciones de carrito** por minuto
8. **Uploads de imágenes** exitosos/fallidos

### Alertas Recomendadas

1. **Errores 500** en cualquier endpoint
2. **Tiempo de respuesta** > 2 segundos
3. **Errores de base de datos** consecutivos
4. **Espacio en disco** < 10%
5. **Memoria utilizada** > 80%
6. **Rate limiting** activado frecuentemente
7. **Errores de autenticación** > 10% del total

## Comandos de Desarrollo

### Instalación

```bash
npm install
```

### Desarrollo

```bash
npm run dev
```

### Compilación

```bash
npm run build
```

### Producción

```bash
npm start
```

## Consideraciones de Seguridad

1. **Validación de entrada** en todos los endpoints
2. **Sanitización de nombres de archivo** para prevenir path traversal
3. **Rate limiting** en operaciones críticas
4. **Logs de auditoría** para operaciones sensibles
5. **Validación de tipos de archivo** para uploads
6. **Tokens JWT** con expiración configurable
7. **Headers de seguridad** en respuestas
8. **Validación de roles** para acceso administrativo

## Optimizaciones Implementadas

1. **Logs estructurados** con metadatos relevantes
2. **Eliminación de logs verbosos** innecesarios
3. **Middleware de logging** automático para requests
4. **Cache de imágenes** con headers apropiados
5. **Procesamiento de imágenes** optimizado con Sharp
6. **Pool de conexiones** configurado para MySQL
7. **Validaciones centralizadas** en middleware
8. **Rate limiting diferenciado** por operación
9. **Patrón Singleton** para servicios críticos
10. **Configuración centralizada** para fácil mantenimiento

---

**Última actualización**: Enero 2024  
**Versión**: 2.0.0  
**Autor**: Sistema TecnoCel Web  
**Estado**: Documentación completa y actualizada
