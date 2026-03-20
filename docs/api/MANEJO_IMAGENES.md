# Manejo de Imágenes — TecnoCel Web

## Tipos de imagen

| Tipo | Directorio local | Carpeta Cloudinary | Endpoint |
|------|-----------------|-------------------|----------|
| Productos | `uploads/productos/` | `tecnocel/productos` | `/api/images/:filename` |
| Comentarios | `uploads/comentarios/` | `tecnocel/comentarios` | `/api/comment-images/:filename` |
| Marcas | `uploads/marcas/` | `tecnocel/marcas` | `/api/marca-images/:filename` |

---

## Variable clave: `USE_CLOUDINARY`

- `false` → las imágenes se guardan y sirven desde el **disco local**
- `true` → las imágenes se suben y sirven desde **Cloudinary CDN**

---

## Combinaciones de entorno

### Local + Filesystem (`USE_CLOUDINARY=false`)
Configuración: `.env.local`

- Las imágenes se guardan en `backend/uploads/`
- El backend las sirve desde el disco local
- No se necesita conexión a Cloudinary

### Local + Cloudinary (`USE_CLOUDINARY=true`)
Configuración: `.env.local` con `USE_CLOUDINARY=true`

- Los **uploads nuevos** van a Cloudinary, se guarda la URL completa en la BD
- Las imágenes **ya existentes** en disco siguen funcionando porque el backend corre en `localhost` y tiene acceso al disco local
- Ambos formatos coexisten sin problema

### Local + Aiven + Filesystem (`USE_CLOUDINARY=false`)
Configuración: `.env.aiven` con `USE_CLOUDINARY=false`

- La BD está en la nube (Aiven) pero el backend corre en `localhost`
- Las imágenes siguen en disco local, se sirven igual que el caso base

### Local + Aiven + Cloudinary (`USE_CLOUDINARY=true`)
Configuración: `.env.aiven` con `USE_CLOUDINARY=true`

- La BD está en Aiven, los uploads nuevos van a Cloudinary
- Las imágenes viejas (guardadas como filename) **siguen apareciendo** porque el backend aún corre en `localhost` con acceso al disco local
- **Importante:** esto cambia en producción (ver abajo)

---

## Cómo se determina de dónde viene una imagen

El `imageService.generateImageUrl()` decide el origen según el valor guardado en BD:

```
logo_marca = "marca_samsung_1234.png"
  → NO empieza con https://
  → genera: http://localhost:3000/api/marca-images/marca_samsung_1234.png
  → el middleware la sirve desde disco local

logo_marca = "https://res.cloudinary.com/..."
  → empieza con https://
  → retorna la URL tal cual → sirve desde CDN de Cloudinary
```

---

## Producción (servidor externo)

Cuando el backend se deploya a un servidor remoto (Railway, Render, VPS, etc.):

- El servidor **no tiene** los archivos de `uploads/` locales
- Las imágenes guardadas como filename (modo filesystem) **no aparecen** → muestra imagen por defecto
- Las imágenes guardadas como URL de Cloudinary **sí aparecen** ✓

**Solución antes de deployar:** re-subir los logos/imágenes desde el panel admin para que se guarden en Cloudinary, o ejecutar un script de migración.

---

## Variables de entorno relevantes

```env
USE_CLOUDINARY=false              # true = Cloudinary, false = filesystem local

# Rutas locales (solo filesystem)
IMAGES_BASE_PATH=.../uploads
PRODUCT_IMAGES_PATH=.../uploads/productos
COMMENT_IMAGES_PATH=.../uploads/comentarios
MARCA_IMAGES_PATH=.../uploads/marcas

# Imágenes por defecto (fallback)
DEFAULT_PRODUCT_IMAGE=default-product.png
DEFAULT_COMMENT_IMAGE=default-comment.png
DEFAULT_MARCA_IMAGE=default-marca.png

# Cloudinary (solo si USE_CLOUDINARY=true)
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
CLOUDINARY_PRODUCT_FOLDER=tecnocel/productos
CLOUDINARY_COMMENT_FOLDER=tecnocel/comentarios
CLOUDINARY_MARCA_FOLDER=tecnocel/marcas
```
