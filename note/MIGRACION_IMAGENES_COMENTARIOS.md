# Migración de Imágenes de Comentarios

## Resumen de Cambios

Se ha actualizado la ruta de almacenamiento de imágenes de comentarios de:

- **Ruta anterior**: `../htdocs/tecnocel/comments_img`
- **Nueva ruta**: `C:/xampp/htdocs/tecnocel/img_comments`

### ✅ Problema Resuelto

Se identificó y corrigió un problema crítico en el middleware de imágenes estáticas donde las rutas se construían incorrectamente, causando que las imágenes no se mostraran en el frontend.

## Archivos Modificados

### Backend

1. **`backend/src/controllers/UploadController.ts`**

   - Cambio de prefijo de ruta: `comments_img/` → `img_comments/`

2. **`backend/src/middleware/staticImageMiddleware.ts`**

   - Agregado soporte para rutas `img_comments/`
   - **CORREGIDO**: Lógica para extraer solo el nombre del archivo de las rutas con prefijo
   - Mantiene compatibilidad con rutas antiguas

3. **`backend/src/services/imageService.ts`**

   - Agregado soporte para rutas `img_comments/`
   - Mantiene compatibilidad con rutas antiguas

4. **`backend/src/config/config.ts`**

   - Agregada configuración centralizada para imágenes
   - Nueva ruta por defecto: `C:/xampp/htdocs/tecnocel/img_comments`

5. **`backend/src/index.ts`**
   - Actualizado para usar configuración centralizada

### Scripts de Migración

1. **`backend/scripts_test/check-comments-images-directory.js`**

   - Verifica y crea el directorio de destino
   - Valida permisos de escritura

2. **`backend/scripts_test/migrate-comments-images.js`**

   - Migra archivos físicos del directorio anterior al nuevo
   - Verifica integridad de archivos

3. **`backend/scripts_test/update-comments-image-paths.js`**
   - Actualiza rutas en la base de datos
   - Cambia `comments_img/` por `img_comments/`

## Pasos para Completar la Migración

### 1. Configurar Variable de Entorno

Agregar en el archivo `.env` del backend:

```env
COMMENTS_IMAGES_PATH=C:/xampp/htdocs/tecnocel/img_comments
```

### 2. Verificar y Crear Directorio

```bash
cd backend
node scripts_test/check-comments-images-directory.js
```

### 3. Migrar Archivos Físicos (si existen)

```bash
cd backend
node scripts_test/migrate-comments-images.js
```

### 4. Actualizar Base de Datos

```bash
cd backend
node scripts_test/update-comments-image-paths.js
```

### 5. Reiniciar el Servidor

```bash
cd backend
npm run dev
```

## Verificación

### 1. Verificar Configuración

Acceder a: `http://localhost:3000/api/images-status`

Debería mostrar:

```json
{
  "service_initialized": true,
  "images_path": "...",
  "directory_exists": true,
  "base_url": "http://localhost:3000",
  "default_image": "default-product.png"
}
```

### 2. Probar Subida de Imágenes

1. Ir a cualquier producto
2. Crear un comentario con imágenes
3. Verificar que las imágenes se suben al nuevo directorio
4. Verificar que las imágenes se muestran correctamente

### 3. Verificar Imágenes Existentes

Si había imágenes anteriores, verificar que:

1. Se migraron al nuevo directorio
2. Se actualizaron las rutas en la base de datos
3. Se muestran correctamente en el frontend

## Problema Resuelto

### 🔍 Diagnóstico del Problema

Se identificó que las imágenes se guardaban correctamente en el nuevo directorio, pero no se mostraban en el frontend debido a un error en la construcción de rutas del middleware.

**Problema específico:**

- Las rutas en la BD contenían prefijos: `img_comments/nombre_archivo.jpg`
- El middleware construía rutas incorrectas: `C:/xampp/htdocs/tecnocel/img_comments/img_comments/nombre_archivo.jpg`
- Esto causaba que los archivos no se encontraran

### ✅ Solución Implementada

Se corrigieron dos problemas en el middleware:

1. **Extracción del nombre del archivo**: Se corrigió para extraer solo el nombre del archivo de las rutas con prefijo:

```typescript
// Antes (incorrecto)
filePath = path.join(this.commentsImagesPath, filename);

// Después (correcto)
const fileName = filename.replace(
  /^(img_comments\/|comments_img\/|comments\/)/,
  ""
);
filePath = path.join(this.commentsImagesPath, fileName);
```

2. **Patrón de ruta**: Se cambió el patrón de ruta para capturar correctamente las rutas con barras:

```typescript
// Antes (incorrecto)
app.get("/api/images/:filename", imageMiddleware.serveImage);

// Después (correcto)
app.get("/api/images/*", imageMiddleware.serveImage);
```

3. **Parámetros de ruta**: Se actualizó para usar `req.params[0]` en lugar de `req.params.filename`:

```typescript
// Antes (incorrecto)
const { filename } = req.params;

// Después (correcto)
const filename = req.params[0]; // Captura todo después de /api/images/
```

### 🧪 Verificación

Se ejecutaron scripts de diagnóstico que confirmaron:

- ✅ Todas las imágenes existen en el directorio correcto
- ✅ Las rutas se construyen correctamente
- ✅ Las URLs se generan apropiadamente
- ✅ El frontend puede acceder a las imágenes

## Compatibilidad

El sistema mantiene compatibilidad con rutas antiguas (`comments_img/`) para:

- Imágenes existentes que no se hayan migrado
- Evitar errores durante la transición

## Limpieza (Opcional)

Después de verificar que todo funciona correctamente:

1. **Eliminar directorio anterior**:

   ```bash
   rm -rf ../htdocs/tecnocel/comments_img
   ```

2. **Limpiar rutas antiguas en BD** (si quedan):
   ```sql
   DELETE FROM comentario_imagenes
   WHERE ruta_imagen LIKE 'comments_img/%'
   AND estado = 'activo';
   ```

## Troubleshooting

### Error: "Directorio no existe"

- Verificar que la ruta `C:/xampp/htdocs/tecnocel/img_comments` existe
- Ejecutar el script de verificación de directorio

### Error: "Permisos de escritura"

- Verificar permisos del directorio de destino
- Asegurar que el usuario del servidor tiene permisos de escritura

### Imágenes no se muestran

- Verificar que las rutas en la base de datos se actualizaron
- Verificar que el middleware de imágenes está configurado correctamente
- Revisar logs del servidor para errores

### Error de migración

- Verificar que la base de datos está accesible
- Verificar credenciales de base de datos en `.env`
- Revisar logs de error para detalles específicos

## Notas Importantes

1. **Backup**: Siempre hacer backup de la base de datos antes de ejecutar scripts de migración
2. **Horario**: Ejecutar la migración en horario de bajo tráfico
3. **Pruebas**: Probar en entorno de desarrollo antes de producción
4. **Monitoreo**: Monitorear logs durante y después de la migración
