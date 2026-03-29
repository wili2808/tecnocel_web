/**
 * Sincroniza imágenes locales a Cloudinary sin modificar la BD.
 *
 * Uso (con local-cloud activo en .env):
 *   npm run sync:cloudinary
 *
 * Comportamiento:
 * - Lee filenames de tb_imagenes_producto, tb_comentario_imagenes y tb_marcas
 * - Sube cada imagen a Cloudinary con public_id = buildCloudinaryPublicId(filename)
 * - overwrite: true → idempotente, re-ejecutable
 * - NO actualiza la BD (los filenames permanecen como están)
 *
 * Requisito: USE_CLOUDINARY=true y credenciales CLOUDINARY_* en .env
 */

import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { initDatabase } from '../../src/config/database.js';
import { config } from '../../src/config/config.js';
import logger from '../../src/services/loggerService.js';
import ProductoImagen from '../../src/models/ProductoImagen.js';
import ComentarioImagen from '../../src/models/ComentarioImagen.js';
import Marca from '../../src/models/Marca.js';
import {
  uploadBufferToCloudinary,
  isCloudinaryConfigured,
  buildCloudinaryPublicId,
} from '../../src/services/cloudinaryService.js';

dotenv.config();

interface SyncStats {
  uploaded: number;
  skipped: number;
  errors: number;
  errorDetails: string[];
}

async function syncImages(
  filenames: string[],
  imagesPath: string,
  folder: string,
  label: string,
  stats: SyncStats
): Promise<void> {
  for (const filename of filenames) {
    const filePath = path.join(imagesPath, filename);

    if (!fs.existsSync(filePath)) {
      logger.warn(`[SYNC] ⚠️ Archivo no encontrado: ${filename}`);
      stats.skipped++;
      continue;
    }

    try {
      const buffer = fs.readFileSync(filePath);
      const publicId = buildCloudinaryPublicId(filename);
      await uploadBufferToCloudinary(buffer, folder, publicId, filename);
      stats.uploaded++;
      logger.info(`[SYNC] ✅ [${label}] ${filename} → ${folder}/${publicId}`);
    } catch (error) {
      stats.errors++;
      const msg = error instanceof Error ? error.message : 'Error desconocido';
      stats.errorDetails.push(`[${label}] ${filename}: ${msg}`);
      logger.error(`[SYNC] ❌ Error subiendo ${filename}:`, error);
    }

    // Pausa para no saturar la API de Cloudinary
    await new Promise(resolve => setTimeout(resolve, 300));
  }
}

async function run() {
  const stats: SyncStats = { uploaded: 0, skipped: 0, errors: 0, errorDetails: [] };

  logger.info('═══════════════════════════════════════════════════════');
  logger.info('🚀 SINCRONIZANDO IMÁGENES LOCALES → CLOUDINARY (sin tocar BD)');
  logger.info('═══════════════════════════════════════════════════════');

  if (!isCloudinaryConfigured()) {
    logger.error('[SYNC] ❌ Cloudinary no configurado. Verificá USE_CLOUDINARY=true y credenciales CLOUDINARY_*');
    process.exit(1);
  }

  await initDatabase();
  logger.info('[SYNC] ✅ BD conectada');

  // Imágenes de productos (solo filenames, no URLs)
  const productRows = await ProductoImagen.findAll({ attributes: ['url_imagen'], raw: true });
  const productFilenames = productRows
    .map(r => r.url_imagen)
    .filter(v => v && !/^https?:\/\//i.test(v));

  logger.info(`[SYNC] Productos: ${productFilenames.length} imágenes locales a sincronizar`);
  await syncImages(
    productFilenames,
    config.images.productImagesPath,
    config.images.cloudinary.productFolder,
    'PRODUCTO',
    stats
  );

  // Imágenes de comentarios (solo filenames)
  const commentRows = await ComentarioImagen.findAll({ attributes: ['url_imagen'], raw: true });
  const commentFilenames = commentRows
    .map(r => r.url_imagen)
    .filter(v => v && !/^https?:\/\//i.test(v));

  logger.info(`[SYNC] Comentarios: ${commentFilenames.length} imágenes locales a sincronizar`);
  await syncImages(
    commentFilenames,
    config.images.commentImagesPath,
    config.images.cloudinary.commentFolder,
    'COMENTARIO',
    stats
  );

  // Logos de marcas (solo filenames)
  const marcaRows = await Marca.findAll({ attributes: ['logo_marca'], raw: true });
  const marcaFilenames = marcaRows
    .map(r => r.logo_marca)
    .filter((v): v is string => !!v && !/^https?:\/\//i.test(v));

  logger.info(`[SYNC] Marcas: ${marcaFilenames.length} logos locales a sincronizar`);
  await syncImages(
    marcaFilenames,
    config.images.marcaImagesPath,
    config.images.cloudinary.marcaFolder,
    'MARCA',
    stats
  );

  // Reporte final
  logger.info('═══════════════════════════════════════════════════════');
  logger.info(`✅ Subidas: ${stats.uploaded}`);
  logger.info(`⚠️ No encontradas en disco: ${stats.skipped}`);
  logger.info(`❌ Errores: ${stats.errors}`);
  if (stats.errorDetails.length > 0) {
    stats.errorDetails.forEach(d => logger.error(`   ${d}`));
  }
  logger.info('BD sin modificar — los filenames permanecen iguales.');
  logger.info('═══════════════════════════════════════════════════════');

  process.exit(stats.errors > 0 ? 1 : 0);
}

run();
