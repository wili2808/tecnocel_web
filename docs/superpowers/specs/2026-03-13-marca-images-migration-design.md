# Diseño: Migración de imágenes de marcas al backend

**Fecha:** 2026-03-13
**Estado:** Aprobado
**Rama:** feat/email-system (o rama nueva feat/marca-images)

## Contexto

Las imágenes de marcas actualmente se almacenan como archivos estáticos en `frontend/public/images/marcas/` y son servidas por Vite. Esto impide que el admin pueda subir o cambiar logos desde el panel de administración sin hacer un deploy del frontend.

El objetivo es migrar el manejo de imágenes de marcas para que sea idéntico al de productos y comentarios: almacenadas en el backend, servidas por Express, subidas vía API.

## Decisiones de diseño

- Los 15 logos existentes se migran al backend (copia física + mantener `logo_marca` en BD igual)
- El formulario de GestionMarcas incluirá input de archivo para subir logos
- Los logos se procesan con Sharp (300×300px, output PNG con canal alpha para transparencia)
- El sistema local vs Aiven/producción se maneja igual que el resto: via variable de entorno `BASE_URL`
- Soporte Cloudinary: explícitamente fuera de scope (deferred) — solo se implementa el path filesystem
- SVG **no** se acepta como formato de upload (Sharp no puede procesarlo con config estándar; inconsistente con productos y comentarios)

---

## Sección 1 — Backend: configuración, storage y serving

### `backend/src/config/config.ts`

Agregar path para marcas junto a los existentes:

```typescript
const MARCA_IMAGES_PATH = process.env.MARCA_IMAGES_PATH || path.join(IMAGES_BASE_PATH, 'marcas')
```

Incluirlo en el objeto `config.images`:
```typescript
marcaImagesPath: MARCA_IMAGES_PATH,
defaultMarcaImage: process.env.DEFAULT_MARCA_IMAGE || 'default-marca.png',
```

### `backend/src/services/imageService.ts`

**`ImageType` enum** — agregar:
```typescript
BRAND = 'brand'
```

**`ImageServiceConfig`** — extender con:
```typescript
marcaImagesPath: string;
defaultMarcaImage: string;
```

**`ensureDirectoriesExist()`** — agregar `this.config.marcaImagesPath` al array de directorios.

**`getImagesPath()`** — agregar caso explícito (actualmente usa ternario, debe convertirse a switch o cadena de ternarios):
```typescript
case ImageType.BRAND:
  return this.config.marcaImagesPath;
```

**`getDefaultImage()`** — agregar caso:
```typescript
case ImageType.BRAND:
  return this.config.defaultMarcaImage;
```

**`generateImageUrl()`** — **CRÍTICO**: la línea 113 actualmente es un ternario binario:
```typescript
const endpoint = imageType === ImageType.COMMENT ? 'comment-images' : 'images';
```
Debe reemplazarse para manejar los tres tipos:
```typescript
const endpoint = imageType === ImageType.BRAND
  ? 'marca-images'
  : imageType === ImageType.COMMENT
  ? 'comment-images'
  : 'images';
```
La misma corrección aplica en `getDefaultImageUrl()` (línea 125).

**`validateConfiguration()`** — agregar verificación de `marcaImagesPath` y log de advertencia si falta `defaultMarcaImage` en disco (igual al patrón de productos y comentarios). Nota: si `default-marca.png` no existe, `validateConfiguration` retorna `true` de todas formas (comportamiento existente), pero `serveMarcaImage` devolverá 404 JSON. El script de migración debe incluir una imagen de fallback.

**`getImageStats()`** — explícitamente fuera de scope (tiene un bug preexistente con la iteración de archivos; no se toca en esta migración).

### `backend/src/middleware/staticImageMiddleware.ts`

**`ImageMiddlewareOptions`** — extender con:
```typescript
marcaImagesPath: string;
defaultMarcaImage?: string;
```

**Constructor** — almacenar `this.marcaImagesPath` y `this.defaultMarcaImage` (igual al patrón de productos/comentarios).

**Agregar método público `serveMarcaImage`** — mismo patrón exacto que `serveProductImage`, usando `this.marcaImagesPath`.

**Agregar método privado `serveDefaultMarcaImage`** — mismo patrón que `serveDefaultProductImage`.

**`validateImagesDirectory()`** — agregar `this.marcaImagesPath` al array de directorios validados.

**`getDirectoriesInfo()`** — agregar `marcaImagesPath` y `marcaImagesCount` al objeto retornado. **Actualizar también la firma del tipo de retorno** para incluir los nuevos campos.

### `backend/src/index.ts`

Hay **dos call sites** que deben actualizarse:
1. Destructuring de `config.images` (líneas 64–74): agregar `marcaImagesPath` y `defaultMarcaImage`
2. `new StaticImageMiddleware({...})` (línea 96): pasar los nuevos campos
3. `initializeImageService({...})` (línea 109): pasar los nuevos campos

Agregar ruta:
```typescript
app.get('/api/marca-images/*', imageMiddleware.serveMarcaImage);
```

**URL resultante:** `${BASE_URL}:${PORT}/api/marca-images/{filename}`
Funciona igual en local (`http://localhost:3000/api/marca-images/samsung.png`) y en producción/Aiven (cambiando `BASE_URL`).

---

## Sección 2 — Upload y MarcaController

### `backend/src/controllers/UploadController.ts`

`UploadController` es un singleton (instancia exportada). Tiene su propio `ensureDirectoriesExist()` independiente del `ImageService`.

**Extender constructor** — leer `this.marcaImagesPath = config.images.marcaImagesPath` en el cuerpo del constructor (igual al patrón de `productImagesPath` y `commentImagesPath` en las líneas 32-33). **No agregar parámetros al constructor** ya que es un singleton instanciado como `export default new UploadController()`.

**Extender `ensureDirectoriesExist()`** del controller para incluir el directorio `marcas`.

**Nuevo método `uploadMarcaLogo`:**

- **Ruta:** `POST /api/upload/marca-logo/:id_marca`
- **Protección:** `verificarToken` + `verificarRol([ROLES.ADMIN])` — middleware de usuario de sistema, **no** `verificarTokenCliente`
- **Multer:** máx 2MB, formatos PNG/JPG/JPEG/WebP (SVG excluido). **No reusar `getMulterConfig()`** (hardcodeado a 10MB/5 archivos). Crear método privado `getMarcaMulterConfig()` con límite correcto de 2MB
- **Sharp:** pipeline dedicado (no reusar `optimizeImageBuffer` que produce JPEG). Resize 300×300 con `fit: 'contain'`, output PNG, optimización. Genera nombre único con timestamp
- **Lógica:**
  1. Buscar marca por `id_marca`, retornar 404 si no existe
  2. Si `marca.logo_marca` tiene valor, eliminar archivo anterior del disco
  3. Guardar nuevo archivo en `marcaImagesPath`
  4. Actualizar `logo_marca` en `tb_marcas` con el nuevo nombre de archivo
  5. Generar URL con `imageService.generateImageUrl(filename, ImageType.BRAND)`
  6. Retornar `{ success: true, data: { filename, url } }`

### `backend/src/routes/uploadRoutes.ts`

- Agregar imports de `verificarToken` y `verificarRol` desde `authMiddleware` (actualmente solo importa `verificarTokenCliente`)
- Registrar: `router.post('/marca-logo/:id_marca', verificarToken, verificarRol([ROLES.ADMIN]), uploadController.uploadMarcaLogo)`

### `backend/src/controllers/MarcaController.ts`

Cambio mínimo en `getAllMarcas()` y `getMarcaById()`:

- Obtener `imageService` con `getImageService()`
- Por cada marca, enriquecer `logo_marca` con:
  ```typescript
  imageService.generateImageUrl(marca.logo_marca, ImageType.BRAND)
  ```
- El campo `logo_marca` pasa de ser nombre de archivo a ser URL completa en la respuesta

### `backend/scripts/migrate-marca-images.ts`

Script de migración one-time:

1. **Leer y comparar:** obtener todos los registros de `tb_marcas` con `logo_marca` no nulo + listar archivos en `frontend/public/images/marcas/`
2. **Verificar coincidencias:** loguear explícitamente qué nombres en BD coinciden con archivos en disco y cuáles no (no asumir coincidencia total)
3. **Copiar archivos coincidentes** a `MARCA_IMAGES_PATH` (`backend/uploads/marcas/`)
4. **Copiar imagen default:** incluir un `default-marca.png` (placeholder) en `backend/uploads/marcas/`
5. **Loguear resumen:** archivos copiados, faltantes en disco, sin registro en BD
6. No modifica la BD (los nombres de `logo_marca` son los mismos)

---

## Sección 3 — Frontend

### `frontend/src/components/brand/BrandCard/BrandCard.tsx`

Cambio mínimo:
- Eliminar función `getLogoUrl()` que construía `/images/marcas/{nombre}`
- El campo `logo_marca` ya llega como URL completa desde la API — se usa directamente como `src`
- Mantener fallback a placeholder si la imagen falla (`onError`) o si `logo_marca` es null/undefined

### `frontend/src/services/uploadService.ts`

El servicio `uploadService` usa `axiosInstance` (cliente). El upload de logo de marca es una operación de **admin**. Agregar el método al servicio de admin existente o crear `adminMarcaService.ts`. **No** mezclar operaciones admin en `uploadService.ts` que usa `axiosInstance`.

Opción recomendada: agregar en `adminProductService.ts` o crear `adminMarcaService.ts`:
```typescript
uploadMarcaLogo: async (id_marca: number, file: File): Promise<{ filename: string; url: string }> => {
  const formData = new FormData();
  formData.append('logo', file);
  const { data } = await adminApi.post(`/upload/marca-logo/${id_marca}`, formData);
  return data.data;
}
```

### `frontend/src/components/admin/GestionMarcas/`

Este componente **no existe aún** — debe crearse. Incluir:
- Listado de marcas con logo preview
- Formulario de crear/editar con:
  - Input `type="file"` para logo con preview
  - Al seleccionar archivo: llama al servicio de upload
  - Flujo para marca nueva: crear marca → luego subir logo
  - Opción para quitar logo existente
- Seguir el mismo patrón visual de `GestionProductos`

### `frontend/public/images/marcas/`

Puede eliminarse una vez completada la migración y verificado que todos los logos están en el backend.

### Tipo `Marca` en `frontend/src/types/product.ts`

El campo `logo_marca?: string | null` no requiere cambio de tipo (sigue siendo string). Sin embargo, el valor ya no será un nombre de archivo sino una URL completa — documentar este comportamiento en comentario inline si se considera necesario.

---

## Flujo completo post-migración

```
BD (tb_marcas)
  logo_marca = "samsung.png"  ← nombre de archivo (sin cambios)
       ↓
GET /api/marcas  (MarcaController)
  imageService.generateImageUrl("samsung.png", ImageType.BRAND)
  → "http://localhost:3000/api/marca-images/samsung.png"
       ↓
marcaService.getMarcas()  (frontend)
  logo_marca = "http://localhost:3000/api/marca-images/samsung.png"
       ↓
BrandCard
  <img src={brand.logo_marca} />
       ↓
Express GET /api/marca-images/samsung.png
  staticImageMiddleware.serveMarcaImage()
  → sirve backend/uploads/marcas/samsung.png
```

---

## Orden de implementación

1. `config.ts` — agregar `marcaImagesPath` y `defaultMarcaImage`
2. `imageService.ts` — agregar `ImageType.BRAND`, corregir ternarios en `generateImageUrl`/`getDefaultImageUrl`, extender métodos
3. `staticImageMiddleware.ts` — agregar `serveMarcaImage`, extender tipos y validaciones
4. `index.ts` — actualizar destructuring + dos call sites + registrar ruta `/api/marca-images/*`
5. `UploadController.ts` — extender constructor + `ensureDirectoriesExist` + agregar `uploadMarcaLogo`
6. `uploadRoutes.ts` — agregar imports de `verificarToken`/`verificarRol` + registrar ruta
7. `MarcaController.ts` — usar `imageService` para generar URLs de `logo_marca`
8. Script de migración — verificar coincidencias, copiar archivos + `default-marca.png`
9. `BrandCard.tsx` — eliminar `getLogoUrl()`, usar URL directa
10. Crear método de upload en servicio admin
11. Crear `GestionMarcas` component con campo de imagen
12. Eliminar `frontend/public/images/marcas/` (post-verificación)

## Archivos explícitamente fuera de scope

- `Marca.ts` (modelo Sequelize) — sin cambios
- `marcaService.ts` — sin cambios
- `BrandGrid.tsx` — sin cambios
- `useBrands.ts` — sin cambios
- `getImageStats()` en `imageService.ts` — tiene bug preexistente, no se toca
- Soporte Cloudinary para logos de marcas — deferred
