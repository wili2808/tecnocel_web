/**
 * Script para Generar Imágenes Placeholder
 *
 * Este script crea imágenes placeholder para todos los productos
 * usando la librería sharp o canvas.
 *
 * Uso:
 * node database/scripts/generar_imagenes_placeholder.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const UPLOAD_DIR = path.join(__dirname, '../../backend/uploads/productos');

// Lista de todas las imágenes necesarias para los productos
const imagenesNecesarias = [
  // iPhones
  'iphone_16_pro_max_titanium_front.jpg',
  'iphone_16_pro_max_titanium_back.jpg',
  'iphone_16_pro_black_front.jpg',
  'iphone_16_pro_black_back.jpg',
  'iphone_16_blue_front.jpg',
  'iphone_16_blue_back.jpg',

  // Samsung
  's24_ultra_titanium_front.jpg',
  's24_ultra_titanium_back.jpg',
  's24_ultra_spen.jpg',
  's24_plus_violet_front.jpg',
  's24_plus_violet_back.jpg',
  'zfold6_closed.jpg',
  'zfold6_open.jpg',
  'zfold6_multitasking.jpg',

  // Xiaomi
  'xiaomi_14tpro_front.jpg',
  'xiaomi_14tpro_camera.jpg',
  'redmi_note13pro_purple.jpg',
  'redmi_note13pro_camera.jpg',

  // Motorola
  'edge50pro_blue.jpg',
  'edge50pro_camera.jpg',
  'motog84_magenta.jpg',

  // Infinix
  'infinix_note40pro.jpg',
  'infinix_hot40pro_gold.jpg',

  // Laptops
  'rog_strix_g16.jpg',
  'rog_strix_keyboard.jpg',
  'msi_katana15.jpg',
  'mbp16_m3pro.jpg',
  'mbp16_ports.jpg',
  'mba13_m2.jpg',
  'ideapad3_15.jpg',

  // Tablets
  'ipad_pro13_m4.jpg',
  'ipad_pro13_pencil.jpg',
  'ipad_109.jpg',

  // Audio
  'airpods_pro2_usbc.jpg',
  'airpods_pro2_case.jpg',
  'jbl_tune770nc.jpg',
  'sony_wh1000xm5.jpg',
  'jbl_charge5_blue.jpg',
  'jbl_flip6_red.jpg',

  // Gaming
  'ps5_slim_digital.jpg',
  'ps5_dualsense.jpg',
  'xbox_series_x.jpg',
  'switch_oled_white.jpg',
  'dualsense_white.jpg',
  'xbox_controller_black.jpg',

  // Wearables
  'apple_watch10.jpg',
  'galaxy_watch7.jpg',
  'xiaomi_band8pro.jpg',

  // Accesorios
  'magsafe_charger.jpg',
  'apple_20w_charger.jpg'
];

/**
 * Crear directorio si no existe
 */
function crearDirectorio() {
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    console.log(`✅ Directorio creado: ${UPLOAD_DIR}`);
  } else {
    console.log(`✅ Directorio existe: ${UPLOAD_DIR}`);
  }
}

/**
 * Descargar imagen placeholder desde placehold.co
 */
function descargarPlaceholder(nombreArchivo) {
  return new Promise((resolve, reject) => {
    const filePath = path.join(UPLOAD_DIR, nombreArchivo);

    // Si ya existe, no descargar
    if (fs.existsSync(filePath)) {
      console.log(`  ⏭️  ${nombreArchivo} ya existe`);
      return resolve();
    }

    // Extraer nombre del producto del nombre de archivo
    const nombreProducto = nombreArchivo
      .replace(/_/g, ' ')
      .replace(/\.(jpg|png|webp)$/, '')
      .substring(0, 30);

    // URL de placeholder con texto personalizado
    const url = `https://placehold.co/1200x1200/0EA5E9/white/png?text=${encodeURIComponent(nombreProducto)}`;

    const file = fs.createWriteStream(filePath);

    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Error ${response.statusCode} al descargar ${nombreArchivo}`));
        return;
      }

      response.pipe(file);

      file.on('finish', () => {
        file.close();
        console.log(`  ✓ ${nombreArchivo}`);
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(filePath, () => {}); // Eliminar archivo parcial
      reject(err);
    });
  });
}

/**
 * Generar todas las imágenes placeholder
 */
async function generarTodasLasImagenes() {
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║  Generador de Imágenes Placeholder - TecnoCel        ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  crearDirectorio();

  console.log(`\n📥 Descargando ${imagenesNecesarias.length} imágenes placeholder...\n`);

  let descargadas = 0;
  let existentes = 0;
  let errores = 0;

  for (const imagen of imagenesNecesarias) {
    try {
      const filePath = path.join(UPLOAD_DIR, imagen);

      if (fs.existsSync(filePath)) {
        existentes++;
      } else {
        await descargarPlaceholder(imagen);
        descargadas++;
        // Pequeña pausa para no saturar el servidor
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    } catch (error) {
      console.error(`  ❌ Error con ${imagen}:`, error.message);
      errores++;
    }
  }

  console.log('\n' + '═'.repeat(60));
  console.log('\n📊 Resumen:');
  console.log(`  ✅ Imágenes descargadas: ${descargadas}`);
  console.log(`  ⏭️  Ya existían: ${existentes}`);
  console.log(`  ❌ Errores: ${errores}`);
  console.log(`  📁 Total: ${imagenesNecesarias.length}`);
  console.log(`\n  📂 Ubicación: ${UPLOAD_DIR}`);

  console.log('\n✅ ¡Proceso completado!\n');
}

// Ejecutar
generarTodasLasImagenes().catch(error => {
  console.error('\n❌ Error fatal:', error);
  process.exit(1);
});
