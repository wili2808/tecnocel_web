**[Documentación](../../README.md)** | **[Inicio](../../../README.md)**

---

# Servicio de Imágenes Estáticas

> Sistema completo para servir, procesar y gestionar imágenes de productos desde el directorio htdocs.

---

## Tabla de Contenidos

- [Descripción General](#descripción-general)
- [Componentes del Sistema](#componentes-del-sistema)
  - [Middleware de Imágenes](#middleware-de-imágenes)
  - [Servicio de Imágenes](#servicio-de-imágenes)
  - [Controlador de Almacén](#controlador-de-almacén)
  - [Configuración del Servidor](#configuración-del-servidor)
- [Endpoints Disponibles](#endpoints-disponibles)
  - [Endpoints de Productos](#endpoints-de-productos)
  - [Endpoints de Imágenes](#endpoints-de-imágenes)
- [Configuración](#configuración)
  - [Variables de Entorno](#variables-de-entorno)
  - [Estructura de Directorios](#estructura-de-directorios)
  - [Imagen por Defecto](#imagen-por-defecto)
- [Uso del Sistema](#uso-del-sistema)
  - [Desde el Frontend](#desde-el-frontend)
  - [Agregar Soporte de Imágenes a un Nuevo Endpoint](#agregar-soporte-de-imágenes-a-un-nuevo-endpoint)
  - [Verificar Estado del Servicio](#verificar-estado-del-servicio)
- [Consideraciones de Implementación](#consideraciones-de-implementación)
  - [Sistema de Caché](#sistema-de-caché)
  - [Manejo de Errores](#manejo-de-errores)
  - [Seguridad](#seguridad)
  - [Rendimiento](#rendimiento)
- [Troubleshooting](#troubleshooting)

---

## Descripción General

El servicio de imágenes estáticas es un sistema que permite servir archivos de imágenes de productos desde un directorio local externo (htdocs de XAMPP) a través de la API. Este sistema transforma las rutas de archivos locales en URLs completas accesibles vía HTTP.

### Características Principales

- Servicio de imágenes desde directorio externo configurable
- Validación de seguridad contra path traversal attacks
- Soporte para múltiples formatos: `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`
- Sistema de caché HTTP optimizado (1 año)
- Fallback automático a imagen por defecto
- Generación automática de URLs completas
- Patrón singleton para gestión centralizada

### Flujo de Funcionamiento

```
1. Cliente solicita productos → GET /api/almacen/productos
2. Controlador obtiene productos de la base de datos
3. ImageService transforma cada producto agregando:
   - imagen_url: URL completa de la imagen
   - imagen_disponible: boolean de disponibilidad
4. Cliente recibe productos con URLs listas para usar
5. Cliente solicita imagen → GET /api/images/filename.jpg
6. Middleware sirve imagen con headers de caché
```

---

## Componentes del Sistema

### ImageService (Servicio)

**Ubicación**: [backend/src/services/imageService.ts](../../../backend/src/services/imageService.ts)

Clase singleton que gestiona la configuración y generación de URLs de imágenes.

**Inicialización**:

```typescript
// En index.ts al iniciar el servidor
const imagesPath = process.env.IMAGES_PATH || 'C:/xampp/htdocs/tecnocel/almacen/img_productos';
const defaultImage = process.env.DEFAULT_IMAGE || 'default-product.png';
const baseUrl = process.env.BASE_URL || 'http://localhost:3000';

imageService.initialize(imagesPath, defaultImage, baseUrl);
```

**Métodos Principales**:

| Método | Descripción | Retorno |
|--------|-------------|---------|
| `initialize(path, defaultImg, baseUrl)` | Inicializa el servicio con la configuración | `void` |
| `getImageUrl(filename)` | Genera URL completa para un archivo | `string` |
| `transformProductWithImageUrl(product)` | Transforma producto agregando campos de imagen | `object` |
| `isInitialized()` | Verifica si el servicio está inicializado | `boolean` |
| `getImagesPath()` | Obtiene la ruta configurada de imágenes | `string` |

**Ejemplo de transformación**:

```typescript
// Producto desde BD
const producto = {
  id_producto: 240,
  nombre: "Samsung S24",
  imagen: "2025-05-07-06-55-39__s24 negro.jpg"
};

// Después de transformProductWithImageUrl()
const productoTransformado = {
  id_producto: 240,
  nombre: "Samsung S24",
  imagen: "2025-05-07-06-55-39__s24 negro.jpg",
  imagen_url: "http://localhost:3000/api/images/2025-05-07-06-55-39__s24%20negro.jpg",
  imagen_disponible: true
};
```

### StaticImageMiddleware (Middleware)

**Ubicación**: [backend/src/middleware/staticImageMiddleware.ts](../../../backend/src/middleware/staticImageMiddleware.ts)

Middleware de Express que sirve archivos de imagen desde el directorio configurado.

**Funcionamiento**:

1. Recibe petición con nombre de archivo
2. Valida que el nombre no contenga path traversal (`../`, `..\\`)
3. Construye ruta completa del archivo
4. Verifica extensión permitida
5. Envía archivo con headers de caché o imagen por defecto si no existe

**Headers de respuesta**:

```http
Content-Type: image/jpeg
Cache-Control: public, max-age=31536000
```

**Registro en servidor**:

```typescript
// En index.ts
app.get('/api/images/:filename', serveStaticImage);
```

**Validaciones de seguridad**:

```typescript
// Previene ataques de path traversal
if (filename.includes('..')) {
  return res.status(400).json({ error: 'Invalid filename' });
}

// Solo permite extensiones seguras
const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
```

### AlmacenController (Controlador)

**Ubicación**: [backend/src/controllers/AlmacenController.ts](../../../backend/src/controllers/AlmacenController.ts)

El controlador utiliza `imageService` para agregar información de imágenes a todos los productos.

**Implementación en endpoints**:

```typescript
static async obtenerProductos(req: Request, res: Response) {
  try {
    const productos = await Almacen.findAll({ /* ... */ });

    // Transformar cada producto para agregar imagen_url
    const productosConImagenes = productos.map(producto => {
      const productoJSON = producto.toJSON();
      return imageService.transformProductWithImageUrl(productoJSON);
    });

    res.json(productosConImagenes);
  } catch (error) {
    // Manejo de errores
  }
}
```

**Endpoints que incluyen URLs de imágenes**:

- `GET /api/almacen/productos` - Lista de productos
- `GET /api/almacen/productos/destacados` - Productos destacados
- `GET /api/almacen/productos/:id` - Producto individual
- `GET /api/almacen/productos/buscar` - Búsqueda de productos
- `GET /api/almacen/productos/categoria/:categoriaId` - Productos por categoría

### Configuración del Servidor

**Ubicación**: [backend/src/index.ts](../../../backend/src/index.ts)

El servidor inicializa el servicio de imágenes y registra las rutas necesarias.

**Secuencia de inicialización**:

```typescript
// 1. Importar servicio y middleware
import { imageService } from './services/imageService.js';
import { serveStaticImage } from './middleware/staticImageMiddleware.js';

// 2. Inicializar servicio al iniciar servidor
const imagesPath = process.env.IMAGES_PATH;
imageService.initialize(imagesPath, defaultImage, baseUrl);

// 3. Registrar rutas
app.get('/api/images/:filename', serveStaticImage);
app.get('/api/images-status', (req, res) => {
  res.json({
    service_initialized: imageService.isInitialized(),
    images_path: imageService.getImagesPath(),
    // ... más información
  });
});
```

---

## Endpoints Disponibles

### Endpoints de Productos

Todos los endpoints de productos incluyen información completa de imágenes.

#### Listar Productos

**Endpoint**: `GET /api/almacen/productos`

**Descripción**: Obtiene lista de todos los productos del almacén.

**Respuesta**:

```json
{
  "id_producto": 240,
  "codigo": "8806095390314",
  "nombre": "Samsung S24 8/256gb",
  "imagen": "2025-05-07-06-55-39__s24 negro.jpg",
  "imagen_url": "http://localhost:3000/api/images/2025-05-07-06-55-39__s24%20negro.jpg",
  "imagen_disponible": true,
  "precio_venta": "750",
  "stock": 1
}
```

#### Productos Destacados

**Endpoint**: `GET /api/almacen/productos/destacados`

**Descripción**: Obtiene productos marcados como destacados.

#### Obtener Producto

**Endpoint**: `GET /api/almacen/productos/:id`

**Descripción**: Obtiene detalles de un producto específico por ID.

#### Buscar Productos

**Endpoint**: `GET /api/almacen/productos/buscar?termino=...`

**Descripción**: Busca productos por término.

**Query Parameters**:

| Parámetro | Tipo   | Requerido | Descripción            |
| --------- | ------ | --------- | ---------------------- |
| `termino` | string | Sí        | Término de búsqueda    |

#### Productos por Categoría

**Endpoint**: `GET /api/almacen/productos/categoria/:categoriaId`

**Descripción**: Obtiene productos de una categoría específica.

**Parámetros de Ruta**:

| Parámetro     | Tipo   | Descripción         |
| ------------- | ------ | ------------------- |
| `categoriaId` | number | ID de la categoría  |

### Endpoints de Imágenes

Endpoints específicos para gestión de imágenes.

#### Servir Imagen

**Endpoint**: `GET /api/images/:filename`

**Descripción**: Sirve una imagen específica del directorio configurado.

**Parámetros de Ruta**:

| Parámetro  | Tipo   | Descripción              |
| ---------- | ------ | ------------------------ |
| `filename` | string | Nombre del archivo imagen |

**Headers de Respuesta**:

- `Cache-Control: public, max-age=31536000`
- `Content-Type: image/*`

**Ejemplo**:

```bash
GET http://localhost:3000/api/images/2025-05-07-06-55-39__s24%20negro.jpg
```

#### Estado del Servicio

**Endpoint**: `GET /api/images-status`

**Descripción**: Endpoint de diagnóstico que devuelve el estado del servicio de imágenes.

**Respuesta**:

```json
{
  "service_initialized": true,
  "images_path": "C:/xampp/htdocs/tecnocel/almacen/img_productos",
  "directory_exists": true,
  "base_url": "http://localhost:3000",
  "default_image": "default-product.png"
}
```

---

## Configuración

### Variables de Entorno

Configurar las siguientes variables en el archivo `backend/.env`:

```env
# Ruta al directorio de imágenes
IMAGES_PATH=C:/xampp/htdocs/tecnocel/almacen/img_productos

# Nombre de la imagen por defecto
DEFAULT_IMAGE=default-product.png

# URL base del servidor
BASE_URL=http://localhost:3000

# Puerto del servidor
PORT=3000
```

**Variables requeridas**:

| Variable        | Descripción                            | Ejemplo                                         |
| --------------- | -------------------------------------- | ----------------------------------------------- |
| `IMAGES_PATH`   | Ruta absoluta al directorio de imágenes | `C:/xampp/htdocs/tecnocel/almacen/img_productos` |
| `DEFAULT_IMAGE` | Nombre de la imagen por defecto        | `default-product.png`                           |
| `BASE_URL`      | URL base para generar enlaces          | `http://localhost:3000`                         |
| `PORT`          | Puerto donde corre el servidor         | `3000`                                          |

### Estructura de Directorios

El directorio de imágenes debe seguir esta estructura:

```
C:/xampp/htdocs/tecnocel/almacen/img_productos/
├── 2025-05-07-06-51-57__Realme-Note-50-4.png
├── 2025-05-07-06-55-39__s24 negro.jpg
├── default-product.png
└── ...otras imágenes de productos
```

**Requisitos**:

- El directorio debe tener permisos de lectura para Node.js
- Los nombres de archivo deben seguir el formato: `fecha-hora__nombre-producto.ext`
- Formatos soportados: `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`

### Imagen por Defecto

Se debe crear una imagen por defecto que se utilizará cuando no se encuentre la imagen de un producto.

**Especificaciones**:

- **Nombre**: `default-product.png`
- **Ubicación**: `{IMAGES_PATH}/default-product.png`
- **Tamaño recomendado**: 400x400 píxeles
- **Formato**: PNG con transparencia
- **Propósito**: Fallback para productos sin imagen o errores al cargar

**Ejemplo de creación**:

```bash
# Copiar una imagen de ejemplo como default
cp ejemplo-producto.png C:/xampp/htdocs/tecnocel/almacen/img_productos/default-product.png
```

---

## Uso del Sistema

### Desde el Frontend

El frontend consume las URLs generadas automáticamente:

```javascript
// Obtener productos
const response = await fetch('http://localhost:3000/api/almacen/productos');
const productos = await response.json();

// Usar imagen_url directamente en componentes
productos.forEach(producto => {
  console.log(producto.imagen_url); // URL completa lista para usar
  console.log(producto.imagen_disponible); // true/false
});
```

**Ejemplo en React**:

```jsx
function ProductCard({ producto }) {
  return (
    <div>
      <img
        src={producto.imagen_url}
        alt={producto.nombre}
        onError={(e) => {
          // Fallback si la imagen no carga
          e.target.src = 'http://localhost:3000/api/images/default-product.png';
        }}
      />
      <h3>{producto.nombre}</h3>
    </div>
  );
}
```

### Agregar Soporte de Imágenes a un Nuevo Endpoint

Si necesitas agregar soporte de imágenes a un nuevo endpoint de productos:

```typescript
// En tu controlador
import { imageService } from '../services/imageService.js';

static async tuNuevoEndpoint(req: Request, res: Response) {
  try {
    const productos = await Almacen.findAll({ /* ... */ });

    // Transformar productos para incluir URLs de imágenes
    const productosConImagenes = productos.map(producto => {
      const productoJSON = producto.toJSON();
      return imageService.transformProductWithImageUrl(productoJSON);
    });

    res.json(productosConImagenes);
  } catch (error) {
    logger.error('Error:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}
```

### Verificar Estado del Servicio

Endpoint de diagnóstico para verificar configuración:

```bash
GET http://localhost:3000/api/images-status
```

**Respuesta**:

```json
{
  "service_initialized": true,
  "images_path": "C:/xampp/htdocs/tecnocel/almacen/img_productos",
  "directory_exists": true,
  "base_url": "http://localhost:3000",
  "default_image": "default-product.png"
}
```

**Interpretación**:

- `service_initialized: true` → El servicio está listo para usar
- `directory_exists: true` → El directorio de imágenes existe y es accesible
- `images_path` → Ruta física donde se buscan las imágenes
- `base_url` → URL base usada para generar enlaces

---

## Consideraciones de Implementación

### Sistema de Caché

Las imágenes se sirven con headers de caché agresivos para optimizar rendimiento:

```http
Cache-Control: public, max-age=31536000
```

Esto significa que las imágenes se cachean en el navegador por 1 año. Si necesitas actualizar una imagen:

1. **Opción 1**: Cambiar el nombre del archivo en la base de datos
2. **Opción 2**: Agregar parámetro de versión en el frontend (`?v=2`)
3. **Opción 3**: Limpiar caché del navegador en desarrollo

### Manejo de Errores

El sistema incluye múltiples niveles de fallback:

```typescript
// Nivel 1: Si el archivo no existe, se sirve imagen por defecto
// Nivel 2: Si imageService no está inicializado, se retorna el nombre original
// Nivel 3: Si hay error en transformación, se retorna producto sin modificar
```

Esto asegura que la API nunca falle completamente por problemas de imágenes.

### Seguridad

**Path Traversal Protection**:

```typescript
// ❌ Bloqueado
GET /api/images/../../../etc/passwd

// ✅ Permitido
GET /api/images/2025-05-07-06-55-39__s24.jpg
```

**Extensiones Permitidas**:

Solo se sirven archivos con extensiones de imagen conocidas:
- `.jpg`, `.jpeg`
- `.png`
- `.webp`
- `.gif`

### Rendimiento

**Por qué usar singleton**:

El patrón singleton evita múltiples instancias y re-inicializaciones:

```typescript
// ✅ Correcto: Una sola instancia compartida
import { imageService } from './services/imageService.js';
imageService.getImageUrl('file.jpg'); // Rápido, usa config cacheada

// ❌ Incorrecto: Crear nuevas instancias
const service = new ImageService(); // Anti-patrón, no hacer esto
```

**Optimización de transformaciones**:

```typescript
// Si transformas muchos productos, usa map() que es eficiente
const productosConImagenes = productos.map(p =>
  imageService.transformProductWithImageUrl(p.toJSON())
);

// Evita bucles for con push innecesarios
```

---

## Troubleshooting

### Servicio no inicializado

**Síntoma**: `service_initialized: false` en `/api/images-status`

**Causas posibles**:

1. Variable `IMAGES_PATH` no configurada en `.env`
2. Directorio de imágenes no existe
3. Permisos insuficientes en el directorio

**Solución**:

```bash
# Verificar variable de entorno
echo $IMAGES_PATH  # En Linux/Mac
echo %IMAGES_PATH% # En Windows

# Verificar existencia del directorio
ls C:/xampp/htdocs/tecnocel/almacen/img_productos

# Revisar logs del servidor al iniciar
```

### Imágenes no se cargan en el frontend

**Síntoma**: Productos muestran imagen por defecto o broken image

**Diagnóstico**:

```javascript
// Verificar respuesta de API
fetch('http://localhost:3000/api/almacen/productos')
  .then(r => r.json())
  .then(productos => {
    console.log(productos[0].imagen_url); // Debe ser URL completa
    console.log(productos[0].imagen_disponible); // Debe ser true
  });
```

**Soluciones**:

1. Verificar que `imagen_url` está presente en la respuesta
2. Probar la URL directamente en el navegador
3. Verificar que el archivo existe en el directorio configurado
4. Revisar que el nombre en la BD coincide con el archivo físico

### Error 404 al solicitar imágenes

**Síntoma**: `GET /api/images/archivo.jpg` retorna 404

**Checklist de verificación**:

```typescript
// 1. Verificar que la ruta está registrada en index.ts
app.get('/api/images/:filename', serveStaticImage);

// 2. Verificar que el middleware está importado
import { serveStaticImage } from './middleware/staticImageMiddleware.js';

// 3. Verificar que el archivo existe físicamente
// Buscar en: C:/xampp/htdocs/tecnocel/almacen/img_productos/
```

**URL encoding**:

```javascript
// Si el nombre tiene espacios, debe estar URL-encoded
// ❌ Incorrecto
'http://localhost:3000/api/images/s24 negro.jpg'

// ✅ Correcto
'http://localhost:3000/api/images/s24%20negro.jpg'
```

### Campo imagen_url no aparece

**Síntoma**: La respuesta de productos no incluye `imagen_url`

**Causa**: Falta aplicar la transformación en el controlador

**Solución**:

```typescript
// Verificar que el controlador incluye esta transformación
const productosConImagenes = productos.map(producto => {
  const productoJSON = producto.toJSON();
  return imageService.transformProductWithImageUrl(productoJSON);
});

// Y retorna el array transformado
res.json(productosConImagenes);
```

### Referencias Relacionadas

- [Endpoints de API](../ENDPOINTS.md)
- [Documentación de Controladores](./CONTROLLERS.md)
- [Guía de Autenticación](../guides/AUTHENTICATION.md)

---

**Última actualización**: 17 de Octubre, 2025
**Versión**: 2.0
**Estado**: Completado

---

**[Volver arriba](#tabla-de-contenidos)** | **[Documentación](../../README.md)** | **[Inicio](../../../README.md)**
