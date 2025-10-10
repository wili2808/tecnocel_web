[← Volver al índice de ENDPOINTS](../ENDPOINTS.md)
# Upload API

**Base Path**: `/api/upload`

Gestión de carga y procesamiento de imágenes.

---

## 📋 Índice

- [Subir imágenes de producto](#post-uploadproducto) 🔒
- [Subir imágenes de comentario](#post-uploadcomentario)
- [Obtener información de directorios](#get-uploadinfo) 🔒

🔒 = Requiere autenticación

---

## POST /upload/producto

Subir múltiples imágenes de un producto con procesamiento automático.

**Autenticación**: ✅ Requerida (JWT Admin)

**Content-Type**: `multipart/form-data`

**Form Fields**:

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `files` | File[] | Sí | Archivos de imagen (máximo 10) |
| `productName` | string | No | Nombre del producto (para nombrar archivos) |

**Restricciones**:
- **Máximo archivos**: 10 imágenes por request
- **Tamaño máximo**: 10MB por imagen
- **Formatos permitidos**: JPEG, JPG, PNG, WEBP, GIF

**Response 200**:
```json
{
  "mensaje": "Imágenes de producto subidas exitosamente",
  "datos": {
    "imagenes": [
      {
        "url_imagen": "iphone_13_pro_1696789234567_abc123-uuid.jpg",
        "alt_text": "Imagen de iPhone 13 Pro"
      },
      {
        "url_imagen": "iphone_13_pro_1696789234789_def456-uuid.jpg",
        "alt_text": "Imagen de iPhone 13 Pro"
      }
    ],
    "tipo": "producto"
  }
}
```

**Procesamiento de Imágenes**:
1. **Redimensionamiento**: Máximo 1200x1200px (mantiene proporción)
2. **Optimización**: Calidad 85% JPEG progresivo
3. **Formato**: Conversión automática a JPEG (excepto GIF)
4. **Nombre único**: `{productName}_{timestamp}_{uuid}.{ext}`
5. **GIFs**: Se conservan sin procesar para mantener animación

**Ejemplo nombre generado**:
```
iphone_13_pro_1696789234567_a1b2c3d4-e5f6-7g8h-9i0j-k1l2m3n4o5p6.jpg
```

**Errores**:
- `400`: No se proporcionaron archivos o demasiadas imágenes
- `401`: No autorizado
- `413`: Archivo demasiado grande (>10MB)
- `415`: Tipo de archivo no permitido
- `500`: Error al procesar imagen

**Ejemplo curl**:
```bash
curl -X POST "http://localhost:3000/api/upload/producto" \
  -H "Authorization: Bearer {tu_token_admin}" \
  -F "files=@imagen1.jpg" \
  -F "files=@imagen2.jpg" \
  -F "productName=iPhone 13 Pro"
```

**Ejemplo con fetch (JavaScript)**:
```javascript
const formData = new FormData();
formData.append('files', file1);
formData.append('files', file2);
formData.append('productName', 'iPhone 13 Pro');

const response = await fetch('http://localhost:3000/api/upload/producto', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});
```

---

## POST /upload/comentario

Subir múltiples imágenes de un comentario con procesamiento automático.

**Autenticación**: ✅ Requerida (JWT Cliente)

**Content-Type**: `multipart/form-data`

**Form Fields**:

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `files` | File[] | Sí | Archivos de imagen (máximo 5) |

**Restricciones**:
- **Máximo archivos**: 5 imágenes por comentario
- **Tamaño máximo**: 10MB por imagen
- **Formatos permitidos**: JPEG, JPG, PNG, WEBP, GIF

**Response 200**:
```json
{
  "mensaje": "Imágenes de comentario subidas exitosamente",
  "datos": {
    "imagenes": [
      {
        "url_imagen": "comment_1696789234567_abc123-uuid.jpg",
        "alt_text": "Imagen del comentario"
      },
      {
        "url_imagen": "comment_1696789234789_def456-uuid.jpg",
        "alt_text": "Imagen del comentario"
      }
    ],
    "tipo": "comentario"
  }
}
```

**Procesamiento de Imágenes**:
1. **Redimensionamiento**: Máximo 1200x1200px (mantiene proporción)
2. **Optimización**: Calidad 85% JPEG progresivo
3. **Formato**: Conversión automática a JPEG (excepto GIF)
4. **Nombre único**: `comment_{timestamp}_{uuid}.{ext}`
5. **GIFs**: Se conservan sin procesar para mantener animación

**Ejemplo nombre generado**:
```
comment_1696789234567_a1b2c3d4-e5f6-7g8h-9i0j-k1l2m3n4o5p6.jpg
```

**Errores**:
- `400`: No se proporcionaron archivos o demasiadas imágenes (>5)
- `401`: No autorizado
- `413`: Archivo demasiado grande (>10MB)
- `415`: Tipo de archivo no permitido
- `500`: Error al procesar imagen

**Ejemplo curl**:
```bash
curl -X POST "http://localhost:3000/api/upload/comentario" \
  -H "Authorization: Bearer {tu_token_cliente}" \
  -F "files=@foto1.jpg" \
  -F "files=@foto2.jpg"
```

**Ejemplo con fetch (JavaScript)**:
```javascript
const formData = new FormData();
formData.append('files', file1);
formData.append('files', file2);

const response = await fetch('http://localhost:3000/api/upload/comentario', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});
```

---

## GET /upload/info

Obtener información sobre los directorios de imágenes y estadísticas.

**Autenticación**: ✅ Requerida (JWT Admin)

**Response 200**:
```json
{
  "directorios": {
    "productos": "C:/Users/WiLi/Desktop/tecnocel_web/backend/uploads/productos",
    "comentarios": "C:/Users/WiLi/Desktop/tecnocel_web/backend/uploads/comentarios"
  },
  "estadisticas": {
    "imagenes_productos": 245,
    "imagenes_comentarios": 87,
    "total": 332
  }
}
```

**Información retornada**:
- Rutas absolutas de los directorios de imágenes
- Cantidad de archivos de imagen en cada directorio
- Total de imágenes almacenadas

**Errores**:
- `401`: No autorizado
- `500`: Error al obtener información

**Ejemplo curl**:
```bash
curl -X GET "http://localhost:3000/api/upload/info" \
  -H "Authorization: Bearer {tu_token_admin}"
```

---

## 📝 Notas Técnicas

### Directorios de Almacenamiento

**Productos**:
```
backend/uploads/productos/
├── iphone_13_pro_1696789234567_abc123.jpg
├── samsung_galaxy_1696789345678_def456.jpg
└── ...
```

**Comentarios**:
```
backend/uploads/comentarios/
├── comment_1696789234567_abc123.jpg
├── comment_1696789456789_def456.jpg
└── ...
```

### Procesamiento con Sharp

**Configuración de redimensionamiento**:
```javascript
sharp(buffer)
  .resize(1200, 1200, {
    fit: 'inside',              // Mantiene proporción
    withoutEnlargement: true    // No agranda imágenes pequeñas
  })
  .jpeg({
    quality: 85,                 // Calidad 85%
    progressive: true            // JPEG progresivo
  })
  .toBuffer()
```

**Excepciones GIF**:
- Los archivos GIF no se procesan con Sharp
- Se copian directamente para mantener animación
- Útil para stickers o animaciones de productos

### Nombrado de Archivos

**Productos**:
```
{productName}_{timestamp}_{uuid}.{extension}
Ejemplo: iphone_13_pro_1696789234567_a1b2c3d4-e5f6.jpg
```

**Comentarios**:
```
comment_{timestamp}_{uuid}.{extension}
Ejemplo: comment_1696789234567_a1b2c3d4-e5f6.jpg
```

**Sanitización productName**:
- Solo caracteres alfanuméricos y guiones bajos
- Máximo 20 caracteres
- Ejemplo: "iPhone 13 Pro Max" → "iphone_13_pro_max"

### Validación de Archivos

**Tipos MIME permitidos**:
- `image/jpeg`
- `image/jpg`
- `image/png`
- `image/webp`
- `image/gif`

**Límites**:
- **Tamaño por archivo**: 10MB
- **Productos**: Máximo 10 archivos por request
- **Comentarios**: Máximo 5 archivos por request

### Flujo de Subida

1. **Cliente envía archivos** vía multipart/form-data
2. **Multer recibe en memoria** (no guarda directamente)
3. **Validación**: tipo MIME y tamaño
4. **Procesamiento Sharp**: redimensionar y optimizar
5. **Generación nombre único**: timestamp + UUID
6. **Guardar en disco**: directorio correspondiente
7. **Respuesta**: URLs de archivos guardados

### Uso del Response

**Después de subir imágenes de producto**:
```javascript
// El cliente recibe:
{
  "imagenes": [
    {
      "url_imagen": "iphone_13_pro_123_abc.jpg",
      "alt_text": "Imagen de iPhone 13 Pro"
    }
  ]
}

// Luego crear el producto con estas URLs:
POST /api/almacen/productos
{
  "nombre_producto": "iPhone 13 Pro",
  "imagenes": [
    {
      "url_imagen": "iphone_13_pro_123_abc.jpg",
      "alt_text": "Imagen de iPhone 13 Pro",
      "es_principal": true,
      "orden": 1
    }
  ]
}
```

**Después de subir imágenes de comentario**:
```javascript
// El cliente recibe:
{
  "imagenes": [
    {
      "url_imagen": "comment_123_abc.jpg",
      "alt_text": "Imagen del comentario"
    }
  ]
}

// Luego crear el comentario con estas URLs:
POST /api/comentarios
{
  "id_producto": 1,
  "comentario": "Excelente producto...",
  "calificacion": 5,
  "imagenes": [
    {
      "url_imagen": "comment_123_abc.jpg",
      "alt_text": "Foto del producto en uso"
    }
  ]
}
```

### Eliminación de Imágenes

Las imágenes se eliminan automáticamente cuando:
- Se elimina un producto (vía ProductoController)
- Se elimina un comentario (vía ComentarioController)
- Se elimina una imagen individual de comentario

**Métodos internos**:
```javascript
// Uso interno por otros controladores
UploadController.deleteProductImage(url_imagen)
UploadController.deleteCommentImage(url_imagen)
```

### Optimización

**Ventajas del procesamiento**:
- Reduce tamaño de archivo (~60-80% en promedio)
- Estandariza dimensiones máximas
- Mejora velocidad de carga en frontend
- Formato JPEG progresivo mejora UX

**Ejemplo de reducción**:
```
Imagen original: 4000x3000px, 3.2MB
Procesada:       1200x900px, 450KB (-86%)
```

### Seguridad

**Validaciones implementadas**:
- ✅ Solo tipos de archivo permitidos
- ✅ Límite de tamaño por archivo
- ✅ Límite de cantidad de archivos
- ✅ Nombres únicos (previene sobrescritura)
- ✅ Autenticación requerida
- ✅ Separación por tipo (producto/comentario)

**Pendientes** (recomendaciones):
- Validación de dimensiones mínimas
- Escaneo antivirus
- Rate limiting por usuario
- Cuota de almacenamiento por usuario

---

## 🔗 Ver También

- [Productos API](./productos.md) - Para usar imágenes en productos
- [Comentarios API](./comentarios.md) - Para usar imágenes en comentarios
- [Volver al índice de API](../README.md)

---

**Última actualización**: 6 de Octubre, 2025

---

**[⬆ Volver arriba](#tabla-de-contenidos)** | **[📚 Documentación](../../../docs/README.md)** | **[🏠 Inicio](../../../README.md)**
