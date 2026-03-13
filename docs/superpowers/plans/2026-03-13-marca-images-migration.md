# Marca Images Migration Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrar el manejo de imágenes de marcas del frontend estático al backend, igual que productos y comentarios, incluyendo upload via API y serving por Express.

**Architecture:** Extender `ImageType` enum, `ImageService`, `StaticImageMiddleware` y `UploadController` con soporte para `BRAND`. El `MarcaController` enriquecerá `logo_marca` con URLs completas. El frontend simplificará `BrandCard` y el componente `GestionMarcas` ganará upload de logo.

**Tech Stack:** Node.js/Express/TypeScript, Sharp, Multer, React 18/TypeScript, CSS Modules, Sequelize/MySQL

---

## Chunk 1: Backend Infrastructure

### Task 1: Agregar `marcaImagesPath` a config

**Files:**
- Modify: `backend/src/config/config.ts:7-9` (paths) y `:42-50` (objeto images)

- [ ] **Step 1: Agregar constante MARCA_IMAGES_PATH**

En `backend/src/config/config.ts`, después de la línea 9 (`const COMMENT_IMAGES_PATH = ...`), agregar:

```typescript
const MARCA_IMAGES_PATH = process.env.MARCA_IMAGES_PATH || path.join(IMAGES_BASE_PATH, 'marcas');
```

- [ ] **Step 2: Agregar al objeto config.images**

En el objeto `config.images` (después de `commentImagesPath`), agregar:

```typescript
    marcaImagesPath: MARCA_IMAGES_PATH,
    defaultMarcaImage: process.env.DEFAULT_MARCA_IMAGE || 'default-marca.png',
```

- [ ] **Step 3: Verificar compilación TypeScript**

```bash
cd backend && npx tsc --noEmit
```
Expected: sin errores.

- [ ] **Step 4: Commit**

```bash
git add backend/src/config/config.ts
git commit -m "feat(config): agregar marcaImagesPath y defaultMarcaImage"
```

---

### Task 2: Extender ImageService con ImageType.BRAND

**Files:**
- Modify: `backend/src/services/imageService.ts`

- [ ] **Step 1: Agregar BRAND al enum ImageType**

Reemplazar el enum (líneas 8-11):

```typescript
export enum ImageType {
  PRODUCT = 'product',
  COMMENT = 'comment',
  BRAND = 'brand'
}
```

- [ ] **Step 2: Extender ImageServiceConfig**

En la interface `ImageServiceConfig` (líneas 13-22), agregar al final:

```typescript
  marcaImagesPath: string;
  defaultMarcaImage: string;
```

- [ ] **Step 3: Extender ensureDirectoriesExist**

Reemplazar el array `directories` (líneas 50-54):

```typescript
    const directories = [
      this.config.basePath,
      this.config.productImagesPath,
      this.config.commentImagesPath,
      this.config.marcaImagesPath
    ];
```

- [ ] **Step 4: Agregar caso BRAND a getImagesPath**

El método ya usa `switch` (líneas 71-80). Agregar el nuevo `case` antes del `default`:

```typescript
      case ImageType.BRAND:
        return this.config.marcaImagesPath;
```

- [ ] **Step 5: Agregar caso BRAND a getDefaultImage**

El método ya usa `switch` (líneas 85-94). Agregar el nuevo `case` antes del `default`:

```typescript
      case ImageType.BRAND:
        return this.config.defaultMarcaImage;
```

- [ ] **Step 6: Corregir ternario en generateImageUrl (línea 113)**

Reemplazar:
```typescript
    const endpoint = imageType === ImageType.COMMENT ? 'comment-images' : 'images';
```
Por:
```typescript
    const endpoint = imageType === ImageType.BRAND
      ? 'marca-images'
      : imageType === ImageType.COMMENT
      ? 'comment-images'
      : 'images';
```

- [ ] **Step 7: Corregir ternario en getDefaultImageUrl (línea 125)**

Reemplazar:
```typescript
    const endpoint = imageType === ImageType.COMMENT ? 'comment-images' : 'images';
```
Por:
```typescript
    const endpoint = imageType === ImageType.BRAND
      ? 'marca-images'
      : imageType === ImageType.COMMENT
      ? 'comment-images'
      : 'images';
```

- [ ] **Step 8: Extender validateConfiguration**

En el método `validateConfiguration`, después del check de `defaultCommentPath` (línea ~368), agregar:

```typescript
    const defaultMarcaPath = path.join(this.config.marcaImagesPath, this.config.defaultMarcaImage);
    if (!fs.existsSync(defaultMarcaPath)) {
      logger.warn(`Imagen por defecto de marcas no encontrada: ${defaultMarcaPath}`);
    }
```

Y agregar `this.config.marcaImagesPath` al array `directories` dentro de `validateConfiguration` (línea ~345):

```typescript
    const directories = [
      this.config.basePath,
      this.config.productImagesPath,
      this.config.commentImagesPath,
      this.config.marcaImagesPath
    ];
```

- [ ] **Step 9: Verificar compilación**

```bash
cd backend && npx tsc --noEmit
```
Expected: sin errores.

- [ ] **Step 10: Commit**

```bash
git add backend/src/services/imageService.ts
git commit -m "feat(imageService): agregar ImageType.BRAND y soporte para imágenes de marcas"
```

---

### Task 3: Extender StaticImageMiddleware con serveMarcaImage

**Files:**
- Modify: `backend/src/middleware/staticImageMiddleware.ts`

- [ ] **Step 1: Extender ImageMiddlewareOptions**

En la interface `ImageMiddlewareOptions` (líneas 61-69), agregar al final:

```typescript
  marcaImagesPath: string;
  defaultMarcaImage?: string;
```

- [ ] **Step 2: Agregar campos privados al constructor**

En la clase `StaticImageMiddleware`, agregar campos privados:
```typescript
  private marcaImagesPath: string;
  private defaultMarcaImage: string;
```

Y en el constructor (líneas 100-108), agregar:
```typescript
    this.marcaImagesPath = options.marcaImagesPath;
    this.defaultMarcaImage = options.defaultMarcaImage || 'default-marca.png';
```

- [ ] **Step 3: Agregar método serveMarcaImage**

Después del método `serveCommentImage`, agregar:

```typescript
  public serveMarcaImage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const filename = req.params[0];

      logger.debug(`Solicitud de logo de marca recibida: ${filename}`, {
        originalUrl: req.originalUrl,
        method: req.method
      });

      if (!filename || !this.isValidFilename(filename)) {
        logger.warn(`Nombre de logo de marca inválido: ${filename}`);
        return this.serveDefaultMarcaImage(res);
      }

      const filePath = path.join(this.marcaImagesPath, filename);

      if (!this.fileExists(filePath)) {
        logger.warn(`Logo de marca no encontrado: ${filePath}`);
        return this.serveDefaultMarcaImage(res);
      }

      this.sendImage(res, filePath, filename);

    } catch (error) {
      logger.error('Error al servir logo de marca:', error);
      this.serveDefaultMarcaImage(res);
    }
  };
```

- [ ] **Step 4: Agregar método privado serveDefaultMarcaImage**

Después de `serveDefaultCommentImage`, agregar:

```typescript
  private serveDefaultMarcaImage(res: Response): void {
    const defaultPath = path.join(this.marcaImagesPath, this.defaultMarcaImage);
    if (this.fileExists(defaultPath)) {
      this.sendImage(res, defaultPath, this.defaultMarcaImage);
    } else {
      res.status(404).json({ error: 'Logo de marca no encontrado' });
    }
  }
```

- [ ] **Step 5: Extender validateImagesDirectory**

En el método `validateImagesDirectory`, agregar `this.marcaImagesPath` al array `directories`:

```typescript
      const directories = [
        this.basePath,
        this.productImagesPath,
        this.commentImagesPath,
        this.marcaImagesPath
      ];
```

Y actualizar el logger.info para incluir `marcaImagesPath`:
```typescript
      logger.info(`Directorios de imágenes configurados correctamente:`, {
        basePath: this.basePath,
        productImagesPath: this.productImagesPath,
        commentImagesPath: this.commentImagesPath,
        marcaImagesPath: this.marcaImagesPath
      });
```

- [ ] **Step 6: Extender getDirectoriesInfo**

Agregar campo `marcaImagesPath: string` y `marcaImagesCount: number` al tipo de retorno y a la implementación:

```typescript
  public getDirectoriesInfo(): {
    basePath: string;
    productImagesPath: string;
    commentImagesPath: string;
    marcaImagesPath: string;
    productImagesCount: number;
    commentImagesCount: number;
    marcaImagesCount: number;
  } {
    let productImagesCount = 0;
    let commentImagesCount = 0;
    let marcaImagesCount = 0;

    try {
      if (fs.existsSync(this.productImagesPath)) {
        const productFiles = fs.readdirSync(this.productImagesPath);
        productImagesCount = productFiles.filter(file => {
          const ext = path.extname(file).toLowerCase();
          return ALLOWED_IMAGE_TYPES.includes(ext);
        }).length;
      }

      if (fs.existsSync(this.commentImagesPath)) {
        const commentFiles = fs.readdirSync(this.commentImagesPath);
        commentImagesCount = commentFiles.filter(file => {
          const ext = path.extname(file).toLowerCase();
          return ALLOWED_IMAGE_TYPES.includes(ext);
        }).length;
      }

      if (fs.existsSync(this.marcaImagesPath)) {
        const marcaFiles = fs.readdirSync(this.marcaImagesPath);
        marcaImagesCount = marcaFiles.filter(file => {
          const ext = path.extname(file).toLowerCase();
          return ALLOWED_IMAGE_TYPES.includes(ext);
        }).length;
      }
    } catch (error) {
      logger.error('Error al contar imágenes:', error);
    }

    return {
      basePath: this.basePath,
      productImagesPath: this.productImagesPath,
      commentImagesPath: this.commentImagesPath,
      marcaImagesPath: this.marcaImagesPath,
      productImagesCount,
      commentImagesCount,
      marcaImagesCount
    };
  }
```

- [ ] **Step 7: Verificar compilación**

```bash
cd backend && npx tsc --noEmit
```
Expected: sin errores.

- [ ] **Step 8: Commit**

```bash
git add backend/src/middleware/staticImageMiddleware.ts
git commit -m "feat(middleware): agregar serveMarcaImage para logos de marcas"
```

---

### Task 4: Actualizar index.ts con marcaImagesPath y ruta

**Files:**
- Modify: `backend/src/index.ts`

- [ ] **Step 1: Agregar marcaImagesPath al destructuring**

En el destructuring de `config.images` (líneas 64-74), agregar `marcaImagesPath` y `defaultMarcaImage`:

```typescript
const {
  basePath,
  productImagesPath,
  commentImagesPath,
  marcaImagesPath,
  baseUrl,
  endpoint,
  defaultProductImage,
  defaultCommentImage,
  defaultMarcaImage,
  useCloudinary,
  cloudinary
} = config.images;
```

- [ ] **Step 2: Pasar marcaImagesPath a StaticImageMiddleware**

En `new StaticImageMiddleware({...})` (línea ~96), agregar los nuevos campos:

```typescript
const imageMiddleware = new StaticImageMiddleware({
  basePath,
  productImagesPath,
  commentImagesPath,
  marcaImagesPath,
  defaultProductImage,
  defaultCommentImage,
  defaultMarcaImage,
  maxAge: 86400,
  endpoint
});
```

- [ ] **Step 3: Pasar marcaImagesPath a initializeImageService**

En `initializeImageService({...})` (línea ~109), agregar los nuevos campos:

```typescript
  initializeImageService({
    baseUrl,
    basePath,
    productImagesPath,
    commentImagesPath,
    marcaImagesPath,
    defaultProductImage,
    defaultCommentImage,
    defaultMarcaImage,
    endpoint,
    useCloudinary
  });
```

- [ ] **Step 4: Registrar ruta marca-images**

Después de la línea `app.get('/api/comment-images/*', imageMiddleware.serveCommentImage);`, agregar:

```typescript
app.get('/api/marca-images/*', imageMiddleware.serveMarcaImage);
```

- [ ] **Step 5: Verificar compilación**

```bash
cd backend && npx tsc --noEmit
```
Expected: sin errores.

- [ ] **Step 6: Arrancar backend y verificar ruta**

```bash
cd backend && npm run dev
```

En otra terminal:
```bash
curl -I http://localhost:3000/api/marca-images/samsung.png
```
Expected: HTTP 404 (el directorio existe pero sin archivos aún — normal).

- [ ] **Step 7: Commit**

```bash
git add backend/src/index.ts
git commit -m "feat(server): registrar ruta /api/marca-images/* y pasar marcaImagesPath"
```

---

## Chunk 2: Upload Endpoint y MarcaController

### Task 5: Agregar uploadMarcaLogo al UploadController

**Files:**
- Modify: `backend/src/controllers/UploadController.ts`

- [ ] **Step 1: Agregar campo marcaImagesPath al constructor**

En la clase `UploadController`, después de `private commentImagesPath: string;` (línea 28), agregar:
```typescript
  private marcaImagesPath: string;
```

En el constructor (línea 32), después de `this.commentImagesPath = config.images.commentImagesPath;`, agregar:
```typescript
    this.marcaImagesPath = config.images.marcaImagesPath;
```

- [ ] **Step 2: Extender ensureDirectoriesExist**

En el método `ensureDirectoriesExist` (línea 47), cambiar el array:
```typescript
    const directories = [this.productImagesPath, this.commentImagesPath, this.marcaImagesPath];
```

- [ ] **Step 3: Agregar getMarcaMulterConfig (multer con límite 2MB)**

Después del método `getMulterConfig()`, agregar:

```typescript
  public getMarcaMulterConfig() {
    return multer({
      storage: multer.memoryStorage(),
      limits: {
        fileSize: 2 * 1024 * 1024, // 2MB
        files: 1
      },
      fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (allowedTypes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new Error(`Tipo no permitido: ${file.mimetype}. Solo PNG, JPG, JPEG, WebP`));
        }
      }
    });
  }
```

- [ ] **Step 4: Agregar processMarcaLogo (pipeline Sharp dedicado para PNG)**

Después de `optimizeImageBuffer`, agregar:

```typescript
  private async processMarcaLogo(file: UploadedFile, marcaNombre: string): Promise<string> {
    try {
      const sanitizedName = marcaNombre
        .replace(/[^a-zA-Z0-9]/g, '_')
        .substring(0, 20)
        .toLowerCase();
      const timestamp = Date.now();
      const uniqueId = uuidv4().split('-')[0];
      const fileName = `marca_${sanitizedName}_${timestamp}_${uniqueId}.png`;
      const filePath = path.join(this.marcaImagesPath, fileName);

      // Usar .toBuffer() + writeFile para consistencia con el patrón existente
      const processedBuffer = await sharp(file.buffer)
        .resize(300, 300, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .png({ compressionLevel: 8 })
        .toBuffer();

      await fs.promises.writeFile(filePath, processedBuffer);

      return fileName;
    } catch (error) {
      logger.error('Error al procesar logo de marca:', error);
      throw new Error('Error al procesar el logo de marca');
    }
  }
```

- [ ] **Step 5: Agregar uploadMarcaLogo (método público)**

Al final de la clase, antes del cierre `}`, agregar:

```typescript
  public uploadMarcaLogo = async (req: Request, res: Response): Promise<void> => {
    try {
      const file = req.file as UploadedFile | undefined;
      const { id_marca } = req.params;

      if (!file) {
        res.status(400).json({ success: false, error: 'No se proporcionó ningún archivo' });
        return;
      }

      const Marca = (await import('../models/Marca.js')).default;
      const marca = await Marca.findByPk(id_marca);

      if (!marca) {
        res.status(404).json({ success: false, error: 'Marca no encontrada' });
        return;
      }

      // Eliminar logo anterior si existe
      if (marca.logo_marca) {
        const oldPath = path.join(this.marcaImagesPath, marca.logo_marca);
        if (fs.existsSync(oldPath)) {
          await fs.promises.unlink(oldPath);
          logger.info('[UPLOAD] Logo anterior de marca eliminado', { archivo: marca.logo_marca });
        }
      }

      // Procesar y guardar nuevo logo
      const fileName = await this.processMarcaLogo(file, marca.nombre_marca);

      // Actualizar BD
      await marca.update({
        logo_marca: fileName,
        fyh_actualizacion: new Date()
      });

      // Generar URL
      const { getImageService, ImageType } = await import('../services/imageService.js');
      const imageService = getImageService();
      const url = imageService
        ? imageService.generateImageUrl(fileName, ImageType.BRAND)
        : fileName;

      logger.info('[UPLOAD] ✅ Logo de marca subido exitosamente', {
        marca_id: id_marca,
        nombre_marca: marca.nombre_marca,
        archivo: fileName
      });

      res.status(200).json({
        success: true,
        data: { filename: fileName, url }
      });
    } catch (error) {
      logger.error('Error al subir logo de marca:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Error al subir el logo'
      });
    }
  };
```

- [ ] **Step 6: Verificar compilación**

```bash
cd backend && npx tsc --noEmit
```
Expected: sin errores.

- [ ] **Step 7: Commit**

```bash
git add backend/src/controllers/UploadController.ts
git commit -m "feat(upload): agregar uploadMarcaLogo con Sharp PNG y multer 2MB"
```

---

### Task 6: Registrar ruta de upload en uploadRoutes

**Files:**
- Modify: `backend/src/routes/uploadRoutes.ts`

- [ ] **Step 1: Agregar imports de authMiddleware y ROLES**

En `backend/src/routes/uploadRoutes.ts`, agregar a los imports:

```typescript
import { verificarToken, verificarRol } from '../middleware/authMiddleware.js';
import { ROLES } from '../constants/roles.js';
```

Verificar la ubicación de ROLES:
```bash
grep -r "export.*ROLES" backend/src --include="*.ts" -l
```
Si no existe un archivo separado, ROLES puede estar definido inline — usar `[1]` en ese caso (ADMIN = 1).

- [ ] **Step 2: Crear instancia multer para marcas**

Después de `const upload = UploadController.getMulterConfig();`, agregar:

```typescript
const uploadMarca = UploadController.getMarcaMulterConfig();
```

- [ ] **Step 3: Registrar la ruta**

Al final del router, antes de `export default router;`, agregar:

```typescript
// Ruta para subir logo de marca (solo admin)
router.post('/marca-logo/:id_marca',
  verificarToken,
  verificarRol([ROLES.ADMIN]),
  uploadMarca.single('logo'),
  UploadController.uploadMarcaLogo
);
```

- [ ] **Step 4: Verificar compilación**

```bash
cd backend && npx tsc --noEmit
```
Expected: sin errores.

- [ ] **Step 5: Arrancar backend y probar endpoint**

```bash
cd backend && npm run dev
```

Crear un archivo de prueba temporalmente y probar con curl (reemplazando TOKEN con un token admin válido):
```bash
curl -X POST http://localhost:3000/api/upload/marca-logo/1 \
  -H "Authorization: Bearer TOKEN" \
  -F "logo=@/ruta/a/imagen.png"
```
Expected: `{ "success": true, "data": { "filename": "...", "url": "..." } }`

- [ ] **Step 6: Commit**

```bash
git add backend/src/routes/uploadRoutes.ts
git commit -m "feat(routes): agregar POST /upload/marca-logo/:id_marca protegida por auth admin"
```

---

### Task 7: Enriquecer MarcaController con URLs de imagen

**Files:**
- Modify: `backend/src/controllers/MarcaController.ts`

- [ ] **Step 1: Agregar imports**

Al inicio del archivo, agregar:

```typescript
import { getImageService, ImageType } from '../services/imageService.js';
```

- [ ] **Step 2: Agregar helper para enriquecer logo_marca**

Justo antes de la clase `MarcaController`, agregar función auxiliar:

```typescript
function enriquecerLogoMarca(marca: any): any {
  const imageService = getImageService();
  if (!imageService) return marca.toJSON ? marca.toJSON() : marca;
  const data = marca.toJSON ? marca.toJSON() : marca;
  return {
    ...data,
    logo_marca: data.logo_marca
      ? imageService.generateImageUrl(data.logo_marca, ImageType.BRAND)
      : null
  };
}
```

- [ ] **Step 3: Aplicar en getAllMarcas**

En el método `getAllMarcas`, reemplazar la línea `data: marcas,` por:

```typescript
        data: marcas.map(enriquecerLogoMarca),
```

- [ ] **Step 4: Aplicar en getMarcaById**

En el método `getMarcaById`, reemplazar `data: marca` por:

```typescript
        data: enriquecerLogoMarca(marca),
```

- [ ] **Step 5: Verificar compilación**

```bash
cd backend && npx tsc --noEmit
```
Expected: sin errores.

- [ ] **Step 6: Verificar respuesta de GET /api/marcas**

```bash
cd backend && npm run dev
```

```bash
curl http://localhost:3000/api/marcas
```
Expected: cada marca tiene `logo_marca` como URL completa (`http://localhost:3000/api/marca-images/samsung.png`) o `null` si no tiene logo.

- [ ] **Step 7: Commit**

```bash
git add backend/src/controllers/MarcaController.ts
git commit -m "feat(marcas): enriquecer logo_marca con URL completa via ImageService"
```

---

### Task 8: Script de migración de logos existentes

**Files:**
- Create: `backend/scripts/migrate-marca-images.ts`

- [ ] **Step 1: Crear el script**

```typescript
/**
 * Script de migración: copia logos de marcas del frontend al backend
 * Ejecutar una sola vez: npx ts-node scripts/migrate-marca-images.ts
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SOURCE_DIR = path.resolve(__dirname, '../../frontend/public/images/marcas');
const IMAGES_BASE_PATH = process.env.IMAGES_BASE_PATH || 'C:/xampp/htdocs/tecnocel';
const TARGET_DIR = process.env.MARCA_IMAGES_PATH || path.join(IMAGES_BASE_PATH, 'marcas');

async function migrate() {
  console.log('=== Migración de logos de marcas ===');
  console.log(`Origen:  ${SOURCE_DIR}`);
  console.log(`Destino: ${TARGET_DIR}`);
  console.log('');

  // Crear directorio destino si no existe
  if (!fs.existsSync(TARGET_DIR)) {
    fs.mkdirSync(TARGET_DIR, { recursive: true });
    console.log(`✅ Directorio destino creado: ${TARGET_DIR}`);
  }

  // Listar archivos de origen
  if (!fs.existsSync(SOURCE_DIR)) {
    console.error(`❌ Directorio de origen no encontrado: ${SOURCE_DIR}`);
    process.exit(1);
  }

  const sourceFiles = fs.readdirSync(SOURCE_DIR).filter(f => {
    const ext = path.extname(f).toLowerCase();
    return ['.png', '.jpg', '.jpeg', '.webp', '.svg', '.gif'].includes(ext);
  });

  console.log(`Archivos encontrados en origen: ${sourceFiles.length}`);
  console.log(sourceFiles.map(f => `  - ${f}`).join('\n'));
  console.log('');

  // Copiar archivos
  let copiados = 0;
  let errores = 0;

  for (const file of sourceFiles) {
    const src = path.join(SOURCE_DIR, file);
    const dest = path.join(TARGET_DIR, file);

    try {
      await fs.promises.copyFile(src, dest);
      console.log(`✅ Copiado: ${file}`);
      copiados++;
    } catch (err) {
      console.error(`❌ Error al copiar ${file}:`, err);
      errores++;
    }
  }

  // Crear imagen default si no existe
  const defaultDest = path.join(TARGET_DIR, 'default-marca.png');
  if (!fs.existsSync(defaultDest)) {
    // Copiar placeholder del frontend si existe, o crear uno mínimo
    const frontendPlaceholder = path.resolve(__dirname, '../../frontend/public/placeholder.svg');
    if (fs.existsSync(frontendPlaceholder)) {
      await fs.promises.copyFile(frontendPlaceholder, path.join(TARGET_DIR, 'default-marca.svg'));
      console.log('✅ Imagen default creada (default-marca.svg desde placeholder.svg)');
      console.log('⚠️  Renombrar o reemplazar default-marca.svg/.png según configuración DEFAULT_MARCA_IMAGE');
    } else {
      console.warn('⚠️  No se encontró imagen default. Crear manualmente: backend/uploads/marcas/default-marca.png');
    }
  } else {
    console.log('✅ Imagen default ya existe');
  }

  console.log('');
  console.log('=== Resumen ===');
  console.log(`Copiados: ${copiados}`);
  console.log(`Errores:  ${errores}`);
  console.log('');
  console.log('Verificar que los valores de logo_marca en tb_marcas coincidan con los archivos copiados.');
  console.log('Si hay discrepancias, actualizar logo_marca en BD manualmente.');
}

migrate().catch(err => {
  console.error('Error en migración:', err);
  process.exit(1);
});
```

- [ ] **Step 2: Ejecutar el script**

```bash
cd backend && npx ts-node --esm scripts/migrate-marca-images.ts
```

Verificar la salida: todos los archivos deben aparecer como copiados.

- [ ] **Step 3: Verificar archivos en destino**

```bash
ls "$MARCA_IMAGES_PATH"
# o en Windows:
dir "%MARCA_IMAGES_PATH%"
```
Expected: los 15 logos más `default-marca.png` o `default-marca.svg`.

- [ ] **Step 4: Probar endpoint de imagen**

```bash
curl -I http://localhost:3000/api/marca-images/samsung.png
```
Expected: HTTP 200 con `Content-Type: image/png`.

- [ ] **Step 5: Commit**

```bash
git add backend/scripts/migrate-marca-images.ts
git commit -m "feat(migration): script para migrar logos de marcas del frontend al backend"
```

---

## Chunk 3: Frontend

### Task 9: Simplificar BrandCard para usar URL directa

**Files:**
- Modify: `frontend/src/components/brand/BrandCard/BrandCard.tsx`

- [ ] **Step 1: Reemplazar getLogoUrl con lógica directa**

Reemplazar la función `getLogoUrl` (líneas 55-60):

```typescript
  const getLogoUrl = () => {
    if (imageError || !brand.logo_marca) {
      return '/placeholder.svg';
    }
    return brand.logo_marca;
  };
```

La API ahora devuelve una URL completa en `logo_marca`. Si es null o hubo error, usa el placeholder. Sin cambios en el JSX.

- [ ] **Step 2: Verificar en el navegador**

Navegar a `http://localhost:5173/marcas` — los logos de marcas deben cargarse desde `http://localhost:3000/api/marca-images/`.

- [ ] **Step 3: Verificar que el fallback funciona**

Verificar que una marca sin logo_marca muestra el placeholder correctamente.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/brand/BrandCard/BrandCard.tsx
git commit -m "feat(BrandCard): usar URL directa de logo_marca desde la API"
```

---

### Task 10: Agregar uploadMarcaLogo al adminProductService

**Files:**
- Modify: `frontend/src/services/adminProductService.ts`

- [ ] **Step 1: Agregar método uploadMarcaLogo**

Al final del objeto `adminProductService`, agregar:

```typescript
  uploadMarcaLogo: async (id_marca: number, file: File): Promise<{ filename: string; url: string }> => {
    const formData = new FormData();
    formData.append('logo', file);
    const response = await adminApi.post(`/upload/marca-logo/${id_marca}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 30000
    });
    return response.data.data;
  },
```

- [ ] **Step 2: Verificar compilación TypeScript**

```bash
cd frontend && npm run build 2>&1 | head -30
```
Expected: sin errores de TypeScript relacionados con adminProductService.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/services/adminProductService.ts
git commit -m "feat(adminService): agregar uploadMarcaLogo usando adminApi"
```

---

### Task 11: Agregar soporte de logo en GestionMarcas

**Files:**
- Modify: `frontend/src/components/admin/GestionProductos/GestionMarcas.tsx`
- Modify: `frontend/src/components/admin/GestionProductos/GestionMarcas.module.css`

El componente ya existe. Se agregan: columna de logo en la tabla, upload de logo en edición y creación inline.

- [ ] **Step 1: Agregar estado para logo en editForm**

Cambiar la interface `EditMarcaForm` para incluir logo:

```typescript
interface EditMarcaForm {
  nombre_marca: string;
  descripcion_marca: string;
  logoFile: File | null;
  logoPreview: string | null;
}
```

Y en `iniciarEdicion`, inicializar los nuevos campos:

```typescript
  const iniciarEdicion = useCallback((marca: Marca) => {
    setEditandoId(marca.id_marca);
    setEditForm({
      nombre_marca: marca.nombre_marca,
      descripcion_marca: marca.descripcion_marca || '',
      logoFile: null,
      logoPreview: marca.logo_marca || null,
    });
    setEliminandoId(null);
  }, []);
```

Y en `cancelarEdicion`, resetear los nuevos campos:

```typescript
  const cancelarEdicion = useCallback(() => {
    setEditandoId(null);
    setEditForm({ nombre_marca: '', descripcion_marca: '', logoFile: null, logoPreview: null });
  }, []);
```

- [ ] **Step 2: Agregar estado para logo en nuevoForm**

Cambiar interface `NuevaMarcaForm`:

```typescript
interface NuevaMarcaForm {
  nombre_marca: string;
  descripcion_marca: string;
  logoFile: File | null;
  logoPreview: string | null;
}
```

Y en `cancelarCreacion` y `iniciarCreacion`, resetear:

```typescript
  const iniciarCreacion = useCallback(() => {
    setCreando(true);
    setNuevoForm({ nombre_marca: '', descripcion_marca: '', logoFile: null, logoPreview: null });
    setEditandoId(null);
    setEliminandoId(null);
  }, []);

  const cancelarCreacion = useCallback(() => {
    setCreando(false);
    setNuevoForm({ nombre_marca: '', descripcion_marca: '', logoFile: null, logoPreview: null });
  }, []);
```

- [ ] **Step 3: Agregar handler para selección de archivo**

Dentro del componente, agregar dos handlers:

```typescript
  const handleLogoEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setEditForm(f => ({
      ...f,
      logoFile: file,
      logoPreview: URL.createObjectURL(file)
    }));
  };

  const handleLogoNuevoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setNuevoForm(f => ({
      ...f,
      logoFile: file,
      logoPreview: URL.createObjectURL(file)
    }));
  };
```

- [ ] **Step 4: Actualizar guardarEdicion para subir logo si hay archivo**

Reemplazar la función `guardarEdicion`:

```typescript
  const guardarEdicion = async (id: number) => {
    if (!editForm.nombre_marca.trim()) {
      showNotification('El nombre de la marca no puede estar vacío', 'error');
      return;
    }
    setSaving(true);
    try {
      await adminProductService.actualizarMarca(id, {
        nombre_marca: editForm.nombre_marca.trim(),
        descripcion_marca: editForm.descripcion_marca.trim() || undefined,
      });
      if (editForm.logoFile) {
        await adminProductService.uploadMarcaLogo(id, editForm.logoFile);
      }
      showNotification('Marca actualizada exitosamente', 'success');
      setEditandoId(null);
      await cargarMarcas();
    } catch (err: any) {
      showNotification(
        err.response?.data?.error || err.response?.data?.message || err.message || 'Error al actualizar la marca',
        'error'
      );
    } finally {
      setSaving(false);
    }
  };
```

- [ ] **Step 5: Actualizar guardarNueva para subir logo después de crear**

Reemplazar la función `guardarNueva`:

```typescript
  const guardarNueva = async () => {
    if (!nuevoForm.nombre_marca.trim()) {
      showNotification('El nombre de la marca no puede estar vacío', 'error');
      return;
    }
    setSaving(true);
    try {
      const nueva = await adminProductService.crearMarca({
        nombre_marca: nuevoForm.nombre_marca.trim(),
        descripcion_marca: nuevoForm.descripcion_marca.trim() || undefined,
      });
      if (nuevoForm.logoFile && nueva?.id_marca) {
        await adminProductService.uploadMarcaLogo(nueva.id_marca, nuevoForm.logoFile);
      }
      showNotification('Marca creada exitosamente', 'success');
      setCreando(false);
      await cargarMarcas();
    } catch (err: any) {
      showNotification(
        err.response?.data?.error || err.response?.data?.message || err.message || 'Error al crear la marca',
        'error'
      );
    } finally {
      setSaving(false);
    }
  };
```

Nota: esto requiere que `adminProductService.crearMarca` retorne el objeto `Marca` creado (con `id_marca`). Verificar que retorna `response.data.data` o similar.

- [ ] **Step 6: Agregar columna Logo al thead de la tabla**

En el `<thead>`, agregar después del `<th>` de Nombre:

```tsx
                <th className={styles.th}>Logo</th>
```

- [ ] **Step 7: Agregar celda de logo en la fila normal (lectura)**

En la fila de lectura (`sortedMarcas.map`), agregar celda de logo después de la celda de nombre:

```tsx
                      <td className={styles.td}>
                        {marca.logo_marca ? (
                          <img
                            src={marca.logo_marca}
                            alt={`Logo ${marca.nombre_marca}`}
                            className={styles.logoPreview}
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                          />
                        ) : (
                          <span className={styles.emptyValue}>Sin logo</span>
                        )}
                      </td>
```

- [ ] **Step 8: Agregar campo de logo en fila de edición**

En la fila de edición (cuando `editandoId === marca.id_marca`), después del campo nombre, agregar:

```tsx
                        <td className={styles.td}>
                          <div className={styles.logoUpload}>
                            {editForm.logoPreview && (
                              <img
                                src={editForm.logoPreview}
                                alt="Preview"
                                className={styles.logoPreview}
                              />
                            )}
                            <input
                              type="file"
                              accept="image/png,image/jpeg,image/webp"
                              onChange={handleLogoEditChange}
                              className={styles.fileInput}
                            />
                          </div>
                        </td>
```

- [ ] **Step 9: Agregar campo de logo en fila de creación**

En la fila de nueva marca (`creando`), agregar celda de logo:

```tsx
                  <td className={styles.td}>
                    <div className={styles.logoUpload}>
                      {nuevoForm.logoPreview && (
                        <img
                          src={nuevoForm.logoPreview}
                          alt="Preview"
                          className={styles.logoPreview}
                        />
                      )}
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        onChange={handleLogoNuevoChange}
                        className={styles.fileInput}
                      />
                    </div>
                  </td>
```

- [ ] **Step 10: Agregar estilos en GestionMarcas.module.css**

```css
.logo-preview {
  width: 40px;
  height: 40px;
  object-fit: contain;
  border-radius: 4px;
  border: 1px solid var(--border-color);
  background: var(--surface-secondary);
}

.logo-upload {
  display: flex;
  align-items: center;
  gap: 8px;
}

.file-input {
  font-size: 12px;
  max-width: 160px;
}
```

- [ ] **Step 11: Verificar que crearMarca retorna el id_marca**

Revisar `adminProductService.crearMarca`:
```bash
grep -A 5 "crearMarca" frontend/src/services/adminProductService.ts
```
Si no retorna el objeto con `id_marca`, ajustar para que lo haga.

- [ ] **Step 12: Verificar en el navegador**

Navegar al panel admin → Productos → tab Marcas.
- La columna Logo debe mostrarse
- Al editar una marca, debe aparecer el input de archivo
- Al subir un logo, debe actualizarse en la tabla

- [ ] **Step 13: Commit**

```bash
git add frontend/src/components/admin/GestionProductos/GestionMarcas.tsx
git add frontend/src/components/admin/GestionProductos/GestionMarcas.module.css
git commit -m "feat(GestionMarcas): agregar columna de logo y upload de imagen"
```

---

### Task 12: Limpieza final

**Files:**
- Delete: `frontend/public/images/marcas/` (después de verificar que todo funciona)

- [ ] **Step 1: Verificar que la migración está completa**

Navegar a `http://localhost:5173/marcas` y verificar que todos los logos cargan desde la API backend.

En el Network tab del navegador, verificar que las URLs de imagen son del tipo `http://localhost:3000/api/marca-images/...` y no `/images/marcas/...`.

- [ ] **Step 2: Verificar build de producción frontend**

```bash
cd frontend && npm run build
```
Expected: sin errores.

- [ ] **Step 3: Eliminar directorio estático**

```bash
rm -rf frontend/public/images/marcas
```

- [ ] **Step 4: Verificar que las marcas siguen funcionando**

```bash
cd frontend && npm run dev
```
Navegar a `/marcas` — logos deben seguir cargando desde backend.

- [ ] **Step 5: Commit final**

```bash
git add -A
git commit -m "chore: eliminar logos estáticos de marcas del frontend (migrados al backend)"
```

---

## Verificación final

- [ ] `GET /api/marcas` retorna `logo_marca` como URL completa
- [ ] `GET /api/marca-images/samsung.png` retorna la imagen con status 200
- [ ] `POST /api/upload/marca-logo/:id` requiere auth admin y procesa la imagen con Sharp
- [ ] Panel admin permite subir logo al crear/editar marca
- [ ] Página `/marcas` muestra logos correctamente en prod y dev
- [ ] No hay referencias a `/images/marcas/` en el código fuente del frontend
