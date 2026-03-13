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
- Los logos se procesan con Sharp (300×300px, PNG) igual que los productos
- El sistema local vs Aiven/producción se maneja igual que el resto: via variable de entorno `BASE_URL`

---

## Sección 1 — Backend: configuración, storage y serving

### `backend/src/config/config.ts`

Agregar path para marcas:

```typescript
const MARCA_IMAGES_PATH = process.env.MARCA_IMAGES_PATH || path.join(IMAGES_BASE_PATH, 'marcas')
```

Incluirlo en el objeto `config.images`:
```typescript
marcaImagesPath: MARCA_IMAGES_PATH,
defaultMarcaImage: process.env.DEFAULT_MARCA_IMAGE || 'default-marca.png',
```

### `backend/src/services/imageService.ts`

- Agregar `BRAND = 'brand'` al enum `ImageType`
- Extender `ImageServiceConfig` con `marcaImagesPath: string` y `defaultMarcaImage: string`
- Extender `ensureDirectoriesExist()` para crear `marcaImagesPath`
- Extender `getImagesPath()` con caso `ImageType.BRAND → marcaImagesPath`
- Extender `getDefaultImage()` con caso `ImageType.BRAND → defaultMarcaImage`
- En `generateImageUrl()`: el endpoint para `ImageType.BRAND` es `'marca-images'`
- Agregar `validateConfiguration()` para incluir `marcaImagesPath`

### `backend/src/middleware/staticImageMiddleware.ts`

- Extender `ImageMiddlewareOptions` con `marcaImagesPath: string` y `defaultMarcaImage?: string`
- Agregar método público `serveMarcaImage` (mismo patrón que `serveProductImage`)
- Agregar método privado `serveDefaultMarcaImage`
- Extender `validateImagesDirectory()` y `getDirectoriesInfo()` para incluir marcas

### `backend/src/index.ts`

- Pasar `marcaImagesPath` y `defaultMarcaImage` al inicializar `StaticImageMiddleware` e `ImageService`
- Agregar ruta: `app.get('/api/marca-images/*', imageMiddleware.serveMarcaImage)`

**URL resultante:** `${BASE_URL}:${PORT}/api/marca-images/{filename}`
Funciona igual en local (`http://localhost:3000/api/marca-images/samsung.png`) y en producción/Aiven (cambiando `BASE_URL`).

---

## Sección 2 — Upload y MarcaController

### `backend/src/controllers/UploadController.ts`

Nuevo método `uploadMarcaLogo`:

- **Ruta:** `POST /api/upload/marca-logo/:id_marca`
- **Protección:** `verificarToken` + `verificarRol([ROLES.ADMIN])`
- **Multer:** máx 2MB, formatos PNG/JPG/JPEG/WebP/SVG
- **Sharp:** resize 300×300px, output PNG, optimización
- **Lógica:**
  1. Buscar marca por `id_marca`, retornar 404 si no existe
  2. Si `marca.logo_marca` tiene valor, eliminar archivo anterior del disco
  3. Guardar nuevo archivo en `MARCA_IMAGES_PATH`
  4. Actualizar `logo_marca` en `tb_marcas` con el nuevo nombre de archivo
  5. Retornar `{ success: true, data: { filename, url } }`

### `backend/src/routes/uploadRoutes.ts` (o donde se registre el upload)

Registrar la nueva ruta con sus middlewares.

### `backend/src/controllers/MarcaController.ts`

Cambio mínimo en `getAllMarcas()` y `getMarcaById()`:

- Después de obtener marcas de Sequelize, enriquecer `logo_marca` con:
  ```typescript
  imageService.generateImageUrl(marca.logo_marca, ImageType.BRAND)
  ```
- El campo `logo_marca` pasa de ser nombre de archivo a ser URL completa en la respuesta

### `backend/scripts/migrate-marca-images.ts`

Script de migración one-time:

- Lee los archivos de `frontend/public/images/marcas/`
- Copia cada archivo a `MARCA_IMAGES_PATH` (`backend/uploads/marcas/`)
- No modifica la BD (los nombres de `logo_marca` ya coinciden)
- Loguea por consola: archivos copiados, errores, resumen

---

## Sección 3 — Frontend

### `frontend/src/components/brand/BrandCard/BrandCard.tsx`

Cambio mínimo:
- Eliminar función `getLogoUrl()` que construye `/images/marcas/{nombre}`
- El campo `logo_marca` ya llega como URL completa desde la API — se usa directamente como `src`
- Mantener fallback a placeholder si la imagen falla o si `logo_marca` es null

### `frontend/src/services/uploadService.ts`

Agregar método:
```typescript
uploadMarcaLogo: async (id_marca: number, file: File): Promise<{ filename: string; url: string }> => {
  const formData = new FormData();
  formData.append('logo', file);
  const { data } = await adminApi.post(`/upload/marca-logo/${id_marca}`, formData);
  return data.data;
}
```

### `frontend/src/components/admin/GestionMarcas/GestionMarcas.tsx`

Agregar al formulario de crear/editar marca:
- Input `type="file"` con preview de logo actual
- Al seleccionar archivo: llama a `uploadService.uploadMarcaLogo()`
- Flujo para marca nueva: crear marca primero → luego subir logo (igual a GestionProductos)
- Mostrar preview del logo actual si existe
- Opción para quitar logo existente

### `frontend/public/images/marcas/`

Puede eliminarse una vez completada la migración y verificado que todos los logos están en el backend.

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

1. `config.ts` — agregar `marcaImagesPath`
2. `imageService.ts` — agregar `ImageType.BRAND` y soporte en métodos
3. `staticImageMiddleware.ts` — agregar `serveMarcaImage`
4. `index.ts` — pasar nuevos paths y registrar ruta `/api/marca-images/*`
5. `UploadController.ts` — agregar `uploadMarcaLogo`
6. Registrar ruta de upload
7. `MarcaController.ts` — usar `imageService` para generar URLs
8. Script de migración — copiar archivos existentes
9. `BrandCard.tsx` — simplificar, usar URL directa
10. `uploadService.ts` — agregar método
11. `GestionMarcas.tsx` — agregar campo de imagen
12. Eliminar `frontend/public/images/marcas/` (post-verificación)

## Archivos no modificados

- `Marca.ts` (modelo Sequelize) — el campo `logo_marca` TEXT sigue siendo nombre de archivo en BD
- `marcaService.ts` — sin cambios
- `BrandGrid.tsx` — sin cambios
- `useBrands.ts` — sin cambios
- Tipo `Marca` en `product.ts` — sin cambios (logo_marca sigue siendo string)
