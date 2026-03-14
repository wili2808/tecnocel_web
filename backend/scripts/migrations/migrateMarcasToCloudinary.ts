/**
 * Script de migración de logos de marcas locales a Cloudinary
 *
 * Uso:
 * npx ts-node --esm scripts/migrations/migrateMarcasToCloudinary.ts
 *
 * Requiere:
 * - USE_CLOUDINARY=true y credenciales CLOUDINARY_* en el .env activo
 * - Los archivos de logos presentes en MARCA_IMAGES_PATH
 *
 * Funcionalidad:
 * - Lee todas las marcas con logo_marca como filename local (no URL)
 * - Sube cada logo a Cloudinary en CLOUDINARY_MARCA_FOLDER
 * - Actualiza el campo logo_marca en BD con la secureUrl de Cloudinary
 * - Genera reporte de migración
 */

import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { initDatabase } from '../../src/config/database.js';
import { config } from '../../src/config/config.js';
import logger from '../../src/services/loggerService.js';
import Marca from '../../src/models/Marca.js';
import {
  uploadBufferToCloudinary,
  isCloudinaryConfigured,
} from '../../src/services/cloudinaryService.js';

dotenv.config();

// ============================================================================
// TIPOS
// ============================================================================

interface MarcaRecord {
  id_marca: number;
  nombre_marca: string;
  logo_marca: string;
  filePath: string;
  exists: boolean;
}

interface MigrationStats {
  total: number;
  migrated: number;
  skipped: number;
  errors: number;
  startTime: Date;
  endTime?: Date;
  errorDetails: Array<{ id: number; nombre: string; error: string }>;
}

// ============================================================================
// FUNCIONES
// ============================================================================

async function getMarcasConLogoLocal(): Promise<MarcaRecord[]> {
  const marcas = await Marca.findAll({
    attributes: ['id_marca', 'nombre_marca', 'logo_marca'],
    raw: true,
  });

  const result: MarcaRecord[] = [];

  for (const m of marcas) {
    if (!m.logo_marca) continue;

    // Si ya es URL de Cloudinary, saltar
    if (/^https?:\/\//i.test(m.logo_marca)) continue;

    const filePath = path.join(config.images.marcaImagesPath, m.logo_marca);
    result.push({
      id_marca: m.id_marca,
      nombre_marca: m.nombre_marca,
      logo_marca: m.logo_marca,
      filePath,
      exists: fs.existsSync(filePath),
    });
  }

  return result;
}

async function uploadMarcaLogo(
  filePath: string,
  nombreMarca: string
): Promise<string | null> {
  try {
    const buffer = fs.readFileSync(filePath);
    const sanitizedName = nombreMarca
      .replace(/[^a-zA-Z0-9]/g, '_')
      .substring(0, 20)
      .toLowerCase();

    const result = await uploadBufferToCloudinary(
      buffer,
      config.images.cloudinary.marcaFolder,
      `marca_${sanitizedName}`,
      path.basename(filePath)
    );

    return result.secureUrl;
  } catch (error) {
    logger.error(`[MIGRACIÓN MARCAS] Error al subir ${nombreMarca}:`, error);
    return null;
  }
}

function generateReport(stats: MigrationStats): string {
  const duration = stats.endTime
    ? Math.round((stats.endTime.getTime() - stats.startTime.getTime()) / 1000)
    : 0;

  return `
╔══════════════════════════════════════════════════════════╗
║          REPORTE DE MIGRACIÓN — LOGOS DE MARCAS          ║
╚══════════════════════════════════════════════════════════╝

📊 ESTADÍSTICAS:
   • Marcas con logo local encontradas: ${stats.total}
   • Migradas exitosamente:             ${stats.migrated}
   • Saltadas (archivo no encontrado):  ${stats.skipped}
   • Errores:                           ${stats.errors}
   • Tiempo total:                      ${duration}s

🎯 RESULTADO: ${stats.errors === 0 ? '✅ EXITOSO' : '⚠️  CON ERRORES'}

${
  stats.errorDetails.length > 0
    ? `❌ DETALLE DE ERRORES:\n${stats.errorDetails
        .map((e) => `   • [ID ${e.id}] ${e.nombre}: ${e.error}`)
        .join('\n')}\n`
    : ''
}
📁 PRÓXIMOS PASOS:
   • Los logos locales siguen en disco — podés eliminarlos manualmente
     una vez validado que Cloudinary los sirve correctamente
   • Carpeta Cloudinary: ${config.images.cloudinary.marcaFolder}

═══════════════════════════════════════════════════════════
`;
}

// ============================================================================
// MAIN
// ============================================================================

async function run() {
  const stats: MigrationStats = {
    total: 0,
    migrated: 0,
    skipped: 0,
    errors: 0,
    startTime: new Date(),
    errorDetails: [],
  };

  try {
    logger.info('══════════════════════════════════════════════════════');
    logger.info('🚀 INICIANDO MIGRACIÓN DE LOGOS DE MARCAS A CLOUDINARY');
    logger.info('══════════════════════════════════════════════════════');

    // 1. Validar Cloudinary
    if (!isCloudinaryConfigured()) {
      logger.error('[MIGRACIÓN MARCAS] ❌ Cloudinary no configurado. Verificá las variables CLOUDINARY_* en tu .env');
      process.exit(1);
    }
    logger.info(`[MIGRACIÓN MARCAS] ✅ Cloudinary OK — carpeta destino: ${config.images.cloudinary.marcaFolder}`);

    // 2. Conectar BD
    await initDatabase();
    logger.info('[MIGRACIÓN MARCAS] ✅ Conexión a BD exitosa');

    // 3. Obtener marcas con logo local
    const marcas = await getMarcasConLogoLocal();
    stats.total = marcas.length;

    if (stats.total === 0) {
      logger.info('[MIGRACIÓN MARCAS] ℹ️  No hay logos locales para migrar — todos ya están en Cloudinary o no tienen logo');
      stats.endTime = new Date();
      console.log(generateReport(stats));
      process.exit(0);
    }

    logger.info(`[MIGRACIÓN MARCAS] ${stats.total} logo(s) encontrados para migrar`);

    // 4. Migrar cada logo
    for (let i = 0; i < marcas.length; i++) {
      const marca = marcas[i];
      const progress = `[${i + 1}/${stats.total}]`;

      if (!marca.exists) {
        logger.warn(`[MIGRACIÓN MARCAS] ⚠️ ${progress} Archivo no encontrado: ${marca.logo_marca}`);
        stats.skipped++;
        stats.errorDetails.push({
          id: marca.id_marca,
          nombre: marca.nombre_marca,
          error: `Archivo no encontrado en disco: ${marca.filePath}`,
        });
        continue;
      }

      logger.info(`[MIGRACIÓN MARCAS] ⏳ ${progress} Subiendo: ${marca.nombre_marca} (${marca.logo_marca})`);

      const secureUrl = await uploadMarcaLogo(marca.filePath, marca.nombre_marca);

      if (!secureUrl) {
        stats.errors++;
        stats.errorDetails.push({
          id: marca.id_marca,
          nombre: marca.nombre_marca,
          error: 'Fallo al subir a Cloudinary',
        });
        continue;
      }

      try {
        await Marca.update(
          { logo_marca: secureUrl, fyh_actualizacion: new Date() },
          { where: { id_marca: marca.id_marca } }
        );
        stats.migrated++;
        logger.info(`[MIGRACIÓN MARCAS] ✅ ${progress} OK: ${marca.nombre_marca}`);
      } catch (error) {
        stats.errors++;
        stats.errorDetails.push({
          id: marca.id_marca,
          nombre: marca.nombre_marca,
          error: 'Error al actualizar BD',
        });
      }

      // Pausa para no saturar Cloudinary
      await new Promise((resolve) => setTimeout(resolve, 300));
    }

    // 5. Reporte final
    stats.endTime = new Date();
    const report = generateReport(stats);
    console.log(report);

    const reportPath = path.join(
      process.cwd(),
      'scripts/migrations/migration-marcas-report.txt'
    );
    fs.writeFileSync(reportPath, report);
    logger.info(`[MIGRACIÓN MARCAS] Reporte guardado en: ${reportPath}`);

    process.exit(stats.errors === 0 ? 0 : 1);
  } catch (error) {
    logger.error('[MIGRACIÓN MARCAS] ❌ Error crítico:', error);
    stats.endTime = new Date();
    console.log(generateReport(stats));
    process.exit(1);
  }
}

run();
