**[Documentación](../../README.md)** | **[Inicio](../../../README.md)**
---

# Guía de Carga de Imágenes

> Guía completa para subir, procesar y gestionar imágenes de productos y comentarios en la API de TecnoCel Web.

---

## Tabla de Contenidos

- [Visión General](#visión-general)
- [Tipos de Imágenes](#tipos-de-imágenes)
- [Límites y Restricciones](#límites-y-restricciones)
- [Procesamiento de Imágenes](#procesamiento-de-imágenes)
- [Subir Imágenes de Productos](#subir-imágenes-de-productos)
  - [Endpoint](#endpoint)
  - [Ejemplo con curl](#ejemplo-con-curl)
  - [Ejemplo con JavaScript](#ejemplo-con-javascript)
- [Subir Imágenes de Comentarios](#subir-imágenes-de-comentarios)
  - [Endpoint](#endpoint-1)
  - [Ejemplo con curl](#ejemplo-con-curl-1)
  - [Ejemplo con JavaScript](#ejemplo-con-javascript-1)
- [Acceso a Imágenes Subidas](#acceso-a-imágenes-subidas)
- [Eliminación de Imágenes](#eliminación-de-imágenes)
- [Manejo de Errores Comunes](#manejo-de-errores-comunes)
- [Buenas Prácticas](#buenas-prácticas)

---

## Visión General

El sistema de carga de imágenes de TecnoCel Web utiliza:

- **Multer** para recepción de archivos `multipart/form-data`
- **Sharp** para procesamiento y optimización automática
- **UUID + timestamp** para nombres únicos de archivo
- **Almacenamiento en sistema de archivos** con rutas organizadas

El sistema procesa las imágenes en dos pasos:
1. Validación y subida con Multer
2. Optimización y redimensionamiento con Sharp

---

## Tipos de Imágenes

El sistema maneja dos tipos de imágenes:

| Tipo | Uso | Directorio | Límite |
|------|-----|-----------|---------|
| **Productos** | Imágenes del catálogo | `backend/uploads/productos/` | 10 imágenes |
| **Comentarios** | Fotos adjuntas a reseñas | `backend/uploads/comentarios/` | 5 imágenes |

---

## Límites y Restricciones

### Formatos Permitidos

```
 image/jpeg
 image/jpg
 image/png
 image/webp
 image/gif
```

### Tamaños y Cantidades

| Restricción | Valor |
|-------------|-------|
| Tamaño máximo por archivo | **10 MB** |
| Imágenes por producto | Máximo **10** |
| Imágenes por comentario | Máximo **5** |
| Dimensiones procesadas | Máx **1200x1200px** |

### Procesamiento Automático

**GIF animados**:
- Se mantienen **sin procesar** para preservar la animación

**Otros formatos** (JPEG, PNG, WebP):
- Redimensionamiento a máximo 1200x1200px (mantiene aspecto)
- Conversión a JPEG progresivo
- Compresión a 85% de calidad
- No aumenta tamaño si la imagen es más pequeña

---

## Subir Imágenes de Productos

### Endpoint

```
POST /api/upload/product-images
```

**Autenticación**: No requerida (pero recomendada para control)

**Content-Type**: `multipart/form-data`

**Parámetros**:

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `imagenes` | File[] | Sí | Array de archivos (1-10) |
| `productName` | string | No | Nombre del producto (para nombre de archivo) |

**Respuesta Exitosa (200)**:

```json
{
  "mensaje": "Imágenes de producto subidas exitosamente",
  "datos": {
    "imagenes": [
      {
        "url_imagen": "iPhone13_1710344521000_a3b5c7d9.jpg",
        "alt_text": "Imagen de iPhone13"
      },
      {
        "url_imagen": "iPhone13_1710344522000_f4e6a8b2.jpg",
        "alt_text": "Imagen de iPhone13"
      }
    ],
    "tipo": "product"
  }
}
```

### Ejemplo con curl

```bash
# Subir una sola imagen
curl -X POST http://localhost:3000/api/upload/product-images \
  -F "imagenes=@/ruta/a/producto1.jpg" \
  -F "productName=iPhone13"

# Subir múltiples imágenes
curl -X POST http://localhost:3000/api/upload/product-images \
  -F "imagenes=@/ruta/a/frontal.jpg" \
  -F "imagenes=@/ruta/a/trasera.jpg" \
  -F "imagenes=@/ruta/a/lateral.jpg" \
  -F "productName=iPhone13Pro"
```

### Ejemplo con JavaScript

**Usando Fetch API**:

```javascript
async function subirImagenesProducto(archivos, nombreProducto) {
  const formData = new FormData();

  // Agregar archivos
  archivos.forEach(archivo => {
    formData.append('imagenes', archivo);
  });

  // Agregar nombre del producto (opcional)
  if (nombreProducto) {
    formData.append('productName', nombreProducto);
  }

  try {
    const response = await fetch('http://localhost:3000/api/upload/product-images', {
      method: 'POST',
      body: formData
      // NO incluir Content-Type header, el navegador lo establece automáticamente
    });

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }

    const data = await response.json();
    console.log('Imágenes subidas:', data.datos.imagenes);
    return data.datos.imagenes;
  } catch (error) {
    console.error('Error al subir imágenes:', error);
    throw error;
  }
}

// Uso con input file
document.getElementById('inputFile').addEventListener('change', async (e) => {
  const archivos = Array.from(e.target.files);
  const imagenes = await subirImagenesProducto(archivos, 'iPhone13');

  // Usar las URLs de las imágenes subidas
  imagenes.forEach(img => {
    console.log(`Imagen subida: ${img.url_imagen}`);
  });
});
```

**Usando Axios**:

```javascript
import axios from 'axios';

async function subirImagenesProducto(archivos, nombreProducto) {
  const formData = new FormData();

  archivos.forEach(archivo => {
    formData.append('imagenes', archivo);
  });

  if (nombreProducto) {
    formData.append('productName', nombreProducto);
  }

  try {
    const response = await axios.post(
      'http://localhost:3000/api/upload/product-images',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          const porcentaje = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          console.log(`Progreso: ${porcentaje}%`);
        }
      }
    );

    return response.data.datos.imagenes;
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
    throw error;
  }
}
```

---

## Subir Imágenes de Comentarios

### Endpoint

```
POST /api/upload/comment-images
```

**Autenticación**: **Requerida** (verificarTokenCliente)

**Headers**: `Authorization: Bearer <JWT>`

**Content-Type**: `multipart/form-data`

**Parámetros**:

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `imagenes` | File[] | Sí | Array de archivos (1-5) |

**Respuesta Exitosa (200)**:

```json
{
  "mensaje": "Imágenes de comentario subidas exitosamente",
  "datos": {
    "imagenes": [
      {
        "url_imagen": "comment_1710344521000_a3b5c7d9.jpg",
        "alt_text": "Imagen del comentario"
      }
    ],
    "tipo": "comment"
  }
}
```

### Ejemplo con curl

```bash
curl -X POST http://localhost:3000/api/upload/comment-images \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -F "imagenes=@/ruta/a/foto1.jpg" \
  -F "imagenes=@/ruta/a/foto2.jpg"
```

### Ejemplo con JavaScript

```javascript
async function subirImagenesComentario(archivos, token) {
  const formData = new FormData();

  archivos.forEach(archivo => {
    formData.append('imagenes', archivo);
  });

  try {
    const response = await fetch('http://localhost:3000/api/upload/comment-images', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Error al subir imágenes');
    }

    const data = await response.json();
    return data.datos.imagenes;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}
```

---

## Acceso a Imágenes Subidas

Las imágenes subidas se sirven vía ruta estática:

```
GET /api/uploads/productos/{nombre_archivo}
GET /api/uploads/comentarios/{nombre_archivo}
```

**Ejemplo**:

```html
<!-- Imagen de producto -->
<img src="http://localhost:3000/api/uploads/productos/iPhone13_1710344521000_a3b5c7d9.jpg"
     alt="iPhone 13" />

<!-- Imagen de comentario -->
<img src="http://localhost:3000/api/uploads/comentarios/comment_1710344521000_b5d7f9e1.jpg"
     alt="Foto del cliente" />
```

**Características**:

- Headers de caché configurados automáticamente
- Servicio directo desde el sistema de archivos
- No requiere autenticación para lectura

---

## Eliminación de Imágenes

### Eliminar Imagen de Producto

Las imágenes de productos se eliminan automáticamente al:
- Eliminar el producto completo
- Actualizar las imágenes del producto (reemplaza todas)

No hay endpoint público para eliminación individual.

### Eliminar Imagen de Comentario

```
DELETE /api/comentarios/:id_comentario/imagenes/:id_imagen
```

**Autenticación**: Requerida (solo el propietario del comentario)

**Ejemplo**:

```bash
curl -X DELETE http://localhost:3000/api/comentarios/15/imagenes/42 \
  -H "Authorization: Bearer <JWT>"
```

**Respuesta Exitosa (200)**:

```json
{
  "mensaje": "Imagen eliminada exitosamente",
  "datos": {
    "id_imagen": 42,
    "archivo_eliminado": true
  }
}
```

---

## Manejo de Errores Comunes

### Error 400: Archivo muy grande

```json
{
  "mensaje": "Error al procesar la solicitud",
  "error": "File too large"
}
```

**Solución**: Reducir el tamaño del archivo a menos de 10MB antes de subir.

### Error 400: Tipo de archivo no permitido

```json
{
  "mensaje": "Error al procesar la solicitud",
  "error": "Tipo de archivo no permitido: image/bmp. Solo se permiten: image/jpeg, image/jpg, image/png, image/webp, image/gif"
}
```

**Solución**: Convertir la imagen a un formato permitido (JPEG, PNG, WebP o GIF).

### Error 400: Demasiadas imágenes

```json
{
  "mensaje": "Demasiadas imágenes",
  "error": "Máximo 5 imágenes por comentario"
}
```

**Solución**: Reducir la cantidad de archivos en la solicitud.

### Error 401: No autenticado

```json
{
  "mensaje": "No token provided"
}
```

**Solución**: Incluir el token JWT en el header `Authorization: Bearer <token>` para imágenes de comentarios.

### Error 500: Error al procesar imagen

```json
{
  "mensaje": "Error interno del servidor",
  "error": "No se pudieron subir las imágenes"
}
```

**Causas posibles**:
- Imagen corrupta o dañada
- Falta de permisos en el directorio de uploads
- Espacio en disco insuficiente

**Solución**: Verificar integridad del archivo y permisos del servidor.

---

## Buenas Prácticas

### 1. Validación en el Cliente

```javascript
function validarImagenAntes deSubir(archivo) {
  // Validar tipo
  const tiposPermitidos = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
  if (!tiposPermitidos.includes(archivo.type)) {
    throw new Error('Tipo de archivo no permitido');
  }

  // Validar tamaño (10MB)
  const tamañoMaximo = 10 * 1024 * 1024;
  if (archivo.size > tamañoMaximo) {
    throw new Error('El archivo es demasiado grande (máximo 10MB)');
  }

  return true;
}
```

### 2. Previsualización Antes de Subir

```javascript
function previsualizarImagen(archivo) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      resolve(e.target.result);
    };

    reader.onerror = reject;
    reader.readAsDataURL(archivo);
  });
}

// Uso
const preview = await previsualizarImagen(archivo);
document.getElementById('preview').src = preview;
```

### 3. Compresión del Lado del Cliente (Opcional)

Para reducir el uso de ancho de banda, puedes comprimir imágenes en el cliente antes de subir:

```javascript
import imageCompression from 'browser-image-compression';

async function comprimirImagen(archivo) {
  const opciones = {
    maxSizeMB: 2,
    maxWidthOrHeight: 1920,
    useWebWorker: true
  };

  try {
    const archivoComprimido = await imageCompression(archivo, opciones);
    return archivoComprimido;
  } catch (error) {
    console.error('Error al comprimir:', error);
    return archivo; // Usar original si falla la compresión
  }
}
```

### 4. Manejo de Múltiples Archivos

```javascript
async function subirMultiplesImagenes(archivos) {
  // Validar todos los archivos primero
  archivos.forEach(archivo => {
    validarImagenAntesDeSubir(archivo);
  });

  // Subir en lotes si son muchas
  const TAMAÑO_LOTE = 5;
  const resultados = [];

  for (let i = 0; i < archivos.length; i += TAMAÑO_LOTE) {
    const lote = archivos.slice(i, i + TAMAÑO_LOTE);
    const resultado = await subirImagenesProducto(lote);
    resultados.push(...resultado);
  }

  return resultados;
}
```

### 5. Indicador de Progreso

```javascript
async function subirConProgreso(archivos, onProgress) {
  const xhr = new XMLHttpRequest();
  const formData = new FormData();

  archivos.forEach(archivo => {
    formData.append('imagenes', archivo);
  });

  return new Promise((resolve, reject) => {
    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        const porcentaje = (e.loaded / e.total) * 100;
        onProgress(porcentaje);
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status === 200) {
        resolve(JSON.parse(xhr.responseText));
      } else {
        reject(new Error(xhr.statusText));
      }
    });

    xhr.addEventListener('error', () => reject(new Error('Error de red')));

    xhr.open('POST', 'http://localhost:3000/api/upload/product-images');
    xhr.send(formData);
  });
}

// Uso
await subirConProgreso(archivos, (porcentaje) => {
  console.log(`Subiendo: ${porcentaje.toFixed(1)}%`);
  document.getElementById('progress').value = porcentaje;
});
```

### 6. Retry Automático en Caso de Fallo

```javascript
async function subirConReintentos(archivos, maxIntentos = 3) {
  let intento = 0;

  while (intento < maxIntentos) {
    try {
      return await subirImagenesProducto(archivos);
    } catch (error) {
      intento++;

      if (intento >= maxIntentos) {
        throw error;
      }

      // Esperar antes de reintentar (exponential backoff)
      const espera = Math.pow(2, intento) * 1000;
      console.log(`Reintentando en ${espera}ms...`);
      await new Promise(resolve => setTimeout(resolve, espera));
    }
  }
}
```

---

**Última actualización**: 15 de Octubre, 2025
**Versión**: 1.0
**Estado**: Completado

**Relacionado con**:
- [API Reference](../ENDPOINTS.md)
- [Endpoints de Upload](../endpoints/upload.md)
- [Endpoints de Productos](../endpoints/productos.md)
- [Endpoints de Comentarios](../endpoints/comentarios.md)

---

**[Volver arriba](#tabla-de-contenidos)** | **[Documentación](../../README.md)** | **[Inicio](../../../README.md)**
