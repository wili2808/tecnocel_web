/**
 * Script de migración de imágenes locales a Cloudinary
 *
 * Uso:
 * npm run migrate:cloudinary
 *
 * Funcionalidad:
 * - Identifica todas las imágenes locales en la BD
 * - Sube cada imagen a Cloudinary
 * - Actualiza registros en BD con nuevas URLs
 * - Mantiene backup de URLs antiguas
 * - Genera reporte de migración
 */

import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { initDatabase } from '../config/database.js';
import { config } from '../config/config.js';
import logger from '../services/loggerService.js';
import ProductoImagen from '../models/ProductoImagen.js';
import ComentarioImagen from '../models/ComentarioImagen.js';
import {
  uploadBufferToCloudinary,
  isCloudinaryConfigured,
} from '../services/cloudinaryService.js';

// Cargar variables de entorno
dotenv.config();

// ============================================================================
// CONFIGURACIÓN Y TIPOS
// ============================================================================

interface MigrationStats {
  totalImages: number;
  migratedProducts: number;
  migratedComments: number;
  skipped: number;
  errors: number;
  startTime: Date;
  endTime?: Date;
  errorDetails: Array<{
    type: string;
    archivo: string;
    error: string;
  }>;
}

interface ImageRecord {
  type: 'product' | 'comment';
  id: number;
  url_imagen: string;
  filePath: string;
  exists: boolean;
}

// ============================================================================
// FUNCIONES AUXILIARES
// ============================================================================

/**
 * Valida que Cloudinary esté configurado
 */
async function validateCloudinaryConfig(): Promise<boolean> {
  if (!isCloudinaryConfigured()) {
    logger.error(
      '[MIGRATION] ❌ Cloudinary no está configurado. Verifica variables de entorno.',
      {
        cloudName: config.images.cloudinary.cloudName ? '✓' : '✗',
        apiKey: config.images.cloudinary.apiKey ? '✓' : '✗',
        apiSecret: config.images.cloudinary.apiSecret ? '✓' : '✗',
      }
    );
    return false;
  }

  logger.info('[MIGRATION] ✅ Cloudinary está configurado correctamente', {
    cloudName: config.images.cloudinary.cloudName,
    productFolder: config.images.cloudinary.productFolder,
    commentFolder: config.images.cloudinary.commentFolder,
  });

  return true;
}

/**
 * Obtiene todas las imágenes de productos de la BD
 */
async function getProductImages(): Promise<ImageRecord[]> {
  try {
    const images = await ProductoImagen.findAll({
      attributes: ['id_imagen', 'url_imagen'],
      raw: true,
    });

    const result: ImageRecord[] = [];

    for (const img of images) {
      // Si ya es URL de Cloudinary, saltar
      if (img.url_imagen.includes('res.cloudinary.com')) {
        continue;
      }

      const filePath = path.join(
        config.images.productImagesPath,
        img.url_imagen
      );

      result.push({
        type: 'product' as const,
        id: img.id_imagen,
        url_imagen: img.url_imagen,
        filePath,
        exists: fs.existsSync(filePath),
      });
    }

    return result;
  } catch (error) {
    logger.error('[MIGRATION] Error al obtener imágenes de productos:', error);
    return [];
  }
}

/**
 * Obtiene todas las imágenes de comentarios de la BD
 */
async function getCommentImages(): Promise<ImageRecord[]> {
  try {
    const images = await ComentarioImagen.findAll({
      attributes: ['id_imagen', 'url_imagen'],
      raw: true,
    });

    const result: ImageRecord[] = [];

    for (const img of images) {
      // Si ya es URL de Cloudinary, saltar
      if (img.url_imagen.includes('res.cloudinary.com')) {
        continue;
      }

      const filePath = path.join(
        config.images.commentImagesPath,
        img.url_imagen
      );

      result.push({
        type: 'comment' as const,
        id: img.id_imagen,
        url_imagen: img.url_imagen,
        filePath,
        exists: fs.existsSync(filePath),
      });
    }

    return result;
  } catch (error) {
    logger.error('[MIGRATION] Error al obtener imágenes de comentarios:', error);
    return [];
  }
}

/**
 * Sube una imagen a Cloudinary
 */
async function uploadToCloudinary(
  imagePath: string,
  type: 'product' | 'comment',
  originalFileName: string
): Promise<{ secureUrl: string; publicId: string } | null> {
  try {
    const buffer = fs.readFileSync(imagePath);
    const folder =
      type === 'product'
        ? config.images.cloudinary.productFolder
        : config.images.cloudinary.commentFolder;

    const publicIdPrefix = originalFileName
      .replace(/\.[^/.]+$/, '') // Remover extensión
      .replace(/[^a-zA-Z0-9_-]/g, '_') // Sanitizar
      .substring(0, 50); // Limitar longitud

    const result = await uploadBufferToCloudinary(
      buffer,
      folder,
      publicIdPrefix,
      originalFileName
    );

    return {
      secureUrl: result.secureUrl,
      publicId: result.publicId,
    };
  } catch (error) {
    logger.error(`[MIGRATION] Error al subir ${originalFileName}:`, error);
    return null;
  }
}

/**
 * Actualiza un registro de imagen de producto en la BD
 */
async function updateProductImage(
  id: number,
  newUrl: string,
  oldUrl: string
): Promise<boolean> {
  try {
    await ProductoImagen.update(
      { url_imagen: newUrl },
      { where: { id_imagen: id } }
    );

    logger.info('[MIGRATION] Imagen de producto actualizada en BD', {
      id,
      oldUrl,
      newUrl: newUrl.substring(0, 80) + '...',
    });

    return true;
  } catch (error) {
    logger.error(`[MIGRATION] Error al actualizar imagen ${id}:`, error);
    return false;
  }
}

/**
 * Actualiza un registro de imagen de comentario en la BD
 */
async function updateCommentImage(
  id: number,
  newUrl: string,
  oldUrl: string
): Promise<boolean> {
  try {
    await ComentarioImagen.update(
      { url_imagen: newUrl },
      { where: { id_imagen: id } }
    );

    logger.info('[MIGRATION] Imagen de comentario actualizada en BD', {
      id,
      oldUrl,
      newUrl: newUrl.substring(0, 80) + '...',
    });

    return true;
  } catch (error) {
    logger.error(
      `[MIGRATION] Error al actualizar imagen de comentario ${id}:`,
      error
    );
    return false;
  }
}

/**
 * Genera reporte de migración
 */
function generateReport(stats: MigrationStats): string {
  const duration = stats.endTime
    ? Math.round(
        (stats.endTime.getTime() - stats.startTime.getTime()) / 1000
      )
    : 0;

  const report = `
╔════════════════════════════════════════════════════════════════════╗
║                    REPORTE DE MIGRACIÓN CLOUDINARY                 ║
╚════════════════════════════════════════════════════════════════════╝

📊 ESTADÍSTICAS GENERALES:
   • Total de imágenes procesadas: ${stats.totalImages}
   • Imágenes de productos migradas: ${stats.migratedProducts}
   • Imágenes de comentarios migradas: ${stats.migratedComments}
   • Imágenes saltadas (ya en Cloudinary): ${stats.skipped}
   • Errores: ${stats.errors}
   • Tiempo total: ${duration} segundos

🎯 RESUMEN:
   ${
     stats.errors === 0
       ? '✅ MIGRACIÓN EXITOSA - Todas las imágenes fueron procesadas correctamente'
       : `⚠️ MIGRACIÓN CON ERRORES - Revisar detalles abajo`
   }

${
  stats.errorDetails.length > 0
    ? `
❌ DETALLES DE ERRORES:
${stats.errorDetails
  .map(
    (err, idx) =>
      `   ${idx + 1}. [${err.type.toUpperCase()}] ${err.archivo}
      Error: ${err.error}`
  )
  .join('\n')}
`
    : ''
}

📁 PRÓXIMOS PASOS:
   1. Revisar el reporte anterior
   ${stats.errors > 0 ? '2. Corregir los errores listados\n   3. Ejecutar el script nuevamente\n' : '2. Hacer commit de cambios en BD\n'}
   3. Hacer backup de base de datos
   4. (Opcional) Eliminar imágenes locales de XAMPP después de validar

⚠️ IMPORTANTE:
   • Las URLs antiguas han sido reemplazadas en la BD
   • Las imágenes locales aún existen en disco (puedes eliminarlas manualmente)
   • Cloudinary contiene todas las imágenes migradas

═══════════════════════════════════════════════════════════════════════
`;

  return report;
}

// ============================================================================
// FUNCIÓN PRINCIPAL
// ============================================================================

async function runMigration() {
  const stats: MigrationStats = {
    totalImages: 0,
    migratedProducts: 0,
    migratedComments: 0,
    skipped: 0,
    errors: 0,
    startTime: new Date(),
    errorDetails: [],
  };

  try {
    console.log('\n');
    logger.info('═══════════════════════════════════════════════════════');
    logger.info('🚀 INICIANDO MIGRACIÓN DE IMÁGENES LOCALES A CLOUDINARY');
    logger.info('═══════════════════════════════════════════════════════');

    // 1. Validar Cloudinary
    logger.info('\n[PASO 1] Validando configuración de Cloudinary...');
    const cloudinaryOk = await validateCloudinaryConfig();
    if (!cloudinaryOk) {
      logger.error('[MIGRATION] ❌ No se puede continuar sin Cloudinary');
      process.exit(1);
    }

    // 2. Inicializar BD
    logger.info('\n[PASO 2] Conectando a base de datos...');
    await initDatabase();
    logger.info('[MIGRATION] ✅ Conexión a BD exitosa');

    // 3. Obtener imágenes locales
    logger.info('\n[PASO 3] Obteniendo imágenes locales de la BD...');
    const productImages = await getProductImages();
    const commentImages = await getCommentImages();

    stats.totalImages = productImages.length + commentImages.length;

    logger.info('[MIGRATION] ✅ Búsqueda completada', {
      productImages: productImages.length,
      commentImages: commentImages.length,
      total: stats.totalImages,
    });

    if (stats.totalImages === 0) {
      logger.warn(
        '[MIGRATION] ⚠️ No hay imágenes locales para migrar (todas están en Cloudinary)'
      );
      stats.endTime = new Date();
      console.log(generateReport(stats));
      process.exit(0);
    }

    // 4. Migrar imágenes de productos
    logger.info('\n[PASO 4] Migrando imágenes de PRODUCTOS...');
    for (let i = 0; i < productImages.length; i++) {
      const img = productImages[i];
      const progress = `${i + 1}/${productImages.length}`;

      if (!img.exists) {
        logger.warn(`[MIGRATION] ⚠️ [${progress}] Archivo no encontrado: ${img.url_imagen}`);
        stats.errors++;
        stats.errorDetails.push({
          type: 'product',
          archivo: img.url_imagen,
          error: 'Archivo no encontrado en disco local',
        });
        continue;
      }

      logger.info(`[MIGRATION] ⏳ [${progress}] Subiendo: ${img.url_imagen}`);

      const uploaded = await uploadToCloudinary(
        img.filePath,
        'product',
        img.url_imagen
      );

      if (!uploaded) {
        stats.errors++;
        stats.errorDetails.push({
          type: 'product',
          archivo: img.url_imagen,
          error: 'Fallo al subir a Cloudinary',
        });
        continue;
      }

      const updated = await updateProductImage(
        img.id,
        uploaded.secureUrl,
        img.url_imagen
      );

      if (updated) {
        stats.migratedProducts++;
        logger.info(`[MIGRATION] ✅ [${progress}] Completado: ${img.url_imagen}`);
      } else {
        stats.errors++;
        stats.errorDetails.push({
          type: 'product',
          archivo: img.url_imagen,
          error: 'Error al actualizar BD',
        });
      }

      // Pequeña pausa entre uploads para no saturar Cloudinary
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    // 5. Migrar imágenes de comentarios
    logger.info('\n[PASO 5] Migrando imágenes de COMENTARIOS...');
    for (let i = 0; i < commentImages.length; i++) {
      const img = commentImages[i];
      const progress = `${i + 1}/${commentImages.length}`;

      if (!img.exists) {
        logger.warn(`[MIGRATION] ⚠️ [${progress}] Archivo no encontrado: ${img.url_imagen}`);
        stats.errors++;
        stats.errorDetails.push({
          type: 'comment',
          archivo: img.url_imagen,
          error: 'Archivo no encontrado en disco local',
        });
        continue;
      }

      logger.info(`[MIGRATION] ⏳ [${progress}] Subiendo: ${img.url_imagen}`);

      const uploaded = await uploadToCloudinary(
        img.filePath,
        'comment',
        img.url_imagen
      );

      if (!uploaded) {
        stats.errors++;
        stats.errorDetails.push({
          type: 'comment',
          archivo: img.url_imagen,
          error: 'Fallo al subir a Cloudinary',
        });
        continue;
      }

      const updated = await updateCommentImage(
        img.id,
        uploaded.secureUrl,
        img.url_imagen
      );

      if (updated) {
        stats.migratedComments++;
        logger.info(`[MIGRATION] ✅ [${progress}] Completado: ${img.url_imagen}`);
      } else {
        stats.errors++;
        stats.errorDetails.push({
          type: 'comment',
          archivo: img.url_imagen,
          error: 'Error al actualizar BD',
        });
      }

      // Pequeña pausa entre uploads
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    // 6. Finalizar y generar reporte
    stats.endTime = new Date();
    logger.info('\n[PASO 6] Migracion completada');

    const report = generateReport(stats);
    console.log(report);

    // Guardar reporte en archivo
    const reportPath = path.join(
      process.cwd(),
      'migration-report.txt'
    );
    fs.writeFileSync(reportPath, report);
    logger.info(`[MIGRATION] Reporte guardado en: ${reportPath}`);

    process.exit(stats.errors === 0 ? 0 : 1);
  } catch (error) {
    logger.error('[MIGRATION] ❌ Error crítico durante la migración:', error);
    stats.endTime = new Date();
    console.log(generateReport(stats));
    process.exit(1);
  }
}

// ============================================================================
// EJECUTAR MIGRACIÓN
// ============================================================================

runMigration();
