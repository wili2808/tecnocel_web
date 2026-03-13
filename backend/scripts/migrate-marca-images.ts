/**
 * Script de migración de logos de marcas
 *
 * Copia los logos de marcas desde frontend/public/images/marcas/
 * al directorio backend/uploads/marcas/
 *
 * NO modifica la base de datos. Solo copia archivos.
 * El campo logo_marca en BD permanece como nombre de archivo (ej: "samsung.png").
 * MarcaController enriquece la URL en tiempo de consulta.
 *
 * Uso (desde el directorio backend/):
 *   npx ts-node --esm scripts/migrate-marca-images.ts
 * O desde la raíz del proyecto:
 *   cd backend && npx ts-node --esm scripts/migrate-marca-images.ts
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar .env desde el directorio backend/
dotenv.config({ path: path.join(__dirname, '..', '.env') });

import { Sequelize } from 'sequelize';
import { config } from '../src/config/config.js';
import sharp from 'sharp';

// ============================================================================
// CONFIGURACIÓN
// ============================================================================

const BACKEND_ROOT = path.join(__dirname, '..');
const PROJECT_ROOT = path.join(BACKEND_ROOT, '..');

const SOURCE_DIR = path.join(PROJECT_ROOT, 'frontend', 'public', 'images', 'marcas');
const DEST_DIR = process.env.MARCA_IMAGES_PATH || path.join(BACKEND_ROOT, 'uploads', 'marcas');

// Colores para consola
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

const log = {
  info:    (msg: string) => console.log(`${colors.blue}[INFO]${colors.reset} ${msg}`),
  success: (msg: string) => console.log(`${colors.green}[OK]${colors.reset}   ${msg}`),
  error:   (msg: string) => console.log(`${colors.red}[ERR]${colors.reset}   ${msg}`),
  warn:    (msg: string) => console.log(`${colors.yellow}[WARN]${colors.reset}  ${msg}`),
  step:    (msg: string) => console.log(`${colors.cyan}[-->]${colors.reset}  ${msg}`),
  header:  (msg: string) => console.log(`\n${colors.bold}${msg}${colors.reset}`)
};

// ============================================================================
// BASE DE DATOS (conexión directa, sin cargar todos los modelos)
// ============================================================================

async function connectDB(): Promise<Sequelize> {
  const sequelize = new Sequelize({
    database: config.database.name,
    username: config.database.user,
    password: config.database.password,
    host: config.database.host,
    port: config.database.port,
    dialect: 'mysql',
    logging: false
  });
  await sequelize.authenticate();
  return sequelize;
}

interface MarcaRow {
  id_marca: number;
  nombre_marca: string;
  logo_marca: string | null;
}

async function getMarcasConLogo(sequelize: Sequelize): Promise<MarcaRow[]> {
  const [rows] = await sequelize.query(
    `SELECT id_marca, nombre_marca, logo_marca
     FROM tb_marcas
     WHERE logo_marca IS NOT NULL AND logo_marca != ''
     ORDER BY id_marca`
  );
  return rows as MarcaRow[];
}

// ============================================================================
// OPERACIONES DE ARCHIVOS
// ============================================================================

function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    log.step(`Directorio creado: ${dir}`);
  }
}

function listSourceFiles(): string[] {
  if (!fs.existsSync(SOURCE_DIR)) {
    throw new Error(`Directorio fuente no encontrado: ${SOURCE_DIR}`);
  }
  return fs.readdirSync(SOURCE_DIR).filter(f => /\.(png|jpg|jpeg|webp)$/i.test(f));
}

async function createDefaultMarca(destDir: string): Promise<void> {
  const defaultPath = path.join(destDir, 'default-marca.png');
  if (fs.existsSync(defaultPath)) {
    log.info('default-marca.png ya existe, omitiendo.');
    return;
  }
  await sharp({
    create: {
      width: 300,
      height: 300,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    }
  })
    .png()
    .toFile(defaultPath);
  log.success(`Creado placeholder: ${defaultPath}`);
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  console.log('\n' + '='.repeat(65));
  console.log('  MIGRACIÓN DE LOGOS DE MARCAS');
  console.log('='.repeat(65));

  log.info(`Fuente:  ${SOURCE_DIR}`);
  log.info(`Destino: ${DEST_DIR}`);

  // 1. Conectar a la BD
  log.header('Paso 1: Conectando a la base de datos...');
  let sequelize: Sequelize;
  try {
    sequelize = await connectDB();
    log.success('Conexión establecida.');
  } catch (err: any) {
    log.error(`No se pudo conectar a la BD: ${err.message}`);
    process.exit(1);
  }

  // 2. Obtener marcas con logo
  log.header('Paso 2: Leyendo registros de tb_marcas con logo_marca...');
  const marcas = await getMarcasConLogo(sequelize!);
  log.info(`Marcas encontradas con logo_marca: ${marcas.length}`);

  const dbFilenames = new Set<string>(marcas.map(m => m.logo_marca!));

  // 3. Listar archivos en disco
  log.header('Paso 3: Archivos en directorio fuente...');
  let diskFiles: string[];
  try {
    diskFiles = listSourceFiles();
  } catch (err: any) {
    log.error(err.message);
    await sequelize!.close();
    process.exit(1);
  }
  log.info(`Archivos en disco: ${diskFiles.length}`);
  diskFiles.forEach(f => log.step(f));

  const diskSet = new Set<string>(diskFiles);

  // 4. Reporte de coincidencias
  log.header('Paso 4: Análisis de coincidencias BD <-> Disco...');

  const matched: string[] = [];
  const inDbNotDisk: string[] = [];

  for (const filename of dbFilenames) {
    if (diskSet.has(filename)) {
      matched.push(filename);
      log.success(`COINCIDE  →  BD: "${filename}"  |  Disco: encontrado`);
    } else {
      inDbNotDisk.push(filename);
      log.warn(`SIN ARCHIVO  →  BD: "${filename}"  |  Disco: NO encontrado`);
    }
  }

  const inDiskNotDb: string[] = diskFiles.filter(f => !dbFilenames.has(f));
  if (inDiskNotDb.length > 0) {
    log.header('Archivos en disco sin registro en BD:');
    inDiskNotDb.forEach(f => log.warn(`Sin registro en BD: "${f}"`));
  }

  // 5. Preparar directorio destino
  log.header('Paso 5: Preparando directorio destino...');
  ensureDir(DEST_DIR);

  // 6. Copiar archivos coincidentes
  log.header('Paso 6: Copiando logos al directorio backend/uploads/marcas/...');

  let copied = 0;
  let skipped = 0;
  let errors = 0;

  for (const filename of matched) {
    const src = path.join(SOURCE_DIR, filename);
    const dst = path.join(DEST_DIR, filename);

    if (fs.existsSync(dst)) {
      log.info(`Ya existe, omitiendo: ${filename}`);
      skipped++;
      continue;
    }

    try {
      fs.copyFileSync(src, dst);
      log.success(`Copiado: ${filename}`);
      copied++;
    } catch (err: any) {
      log.error(`Error al copiar "${filename}": ${err.message}`);
      errors++;
    }
  }

  // 7. Crear default-marca.png
  log.header('Paso 7: Creando imagen por defecto...');
  try {
    await createDefaultMarca(DEST_DIR);
  } catch (err: any) {
    log.error(`Error al crear default-marca.png: ${err.message}`);
  }

  // 8. Resumen final
  console.log('\n' + '='.repeat(65));
  console.log('  RESUMEN');
  console.log('='.repeat(65));
  log.info(`Marcas en BD con logo_marca:        ${dbFilenames.size}`);
  log.info(`Archivos encontrados en disco:      ${diskFiles.length}`);
  log.success(`Archivos copiados:                  ${copied}`);
  log.info(`Archivos omitidos (ya existían):    ${skipped}`);
  if (inDbNotDisk.length > 0) {
    log.warn(`En BD pero SIN archivo en disco:    ${inDbNotDisk.length}  → ${inDbNotDisk.join(', ')}`);
  }
  if (inDiskNotDb.length > 0) {
    log.warn(`En disco sin registro en BD:        ${inDiskNotDb.length}  → ${inDiskNotDb.join(', ')}`);
  }
  if (errors > 0) {
    log.error(`Errores al copiar:                  ${errors}`);
  }
  console.log('='.repeat(65) + '\n');

  await sequelize!.close();
  process.exit(errors > 0 ? 1 : 0);
}

main().catch(err => {
  log.error('Error inesperado: ' + err.message);
  console.error(err);
  process.exit(1);
});
