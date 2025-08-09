/**
 * Script para probar el ImageService y verificar el manejo del campo es_principal
 */

import { Sequelize } from "sequelize";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import {
  initializeImageService,
  getImageService,
} from "../dist/services/imageService.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configurar variables de entorno
dotenv.config({ path: path.join(__dirname, "../.env") });

// Configuración de la base de datos
const sequelize = new Sequelize({
  dialect: "mysql",
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 3306,
  username: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "db_tecnocel_v3",
  logging: false,
});

const fs = require("fs");
const path = require("path");

// Configuración de prueba
const TEST_CONFIG = {
  basePath: "C:/xampp/htdocs/tecnocel",
  productImagesPath: "C:/xampp/htdocs/tecnocel/products",
  commentImagesPath: "C:/xampp/htdocs/tecnocel/comments",
  baseUrl: "http://localhost",
  defaultProductImage: "default-product.png",
  defaultCommentImage: "default-comment.png",
};

// Colores para consola
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
};

function log(message, color = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log(
    `\n${colors.cyan}${colors.bright}=== ${title} ===${colors.reset}`
  );
}

function logSuccess(message) {
  log(`✅ ${message}`, "green");
}

function logError(message) {
  log(`❌ ${message}`, "red");
}

function logWarning(message) {
  log(`⚠️  ${message}`, "yellow");
}

function logInfo(message) {
  log(`ℹ️  ${message}`, "blue");
}

// Función para verificar directorio
function checkDirectory(dirPath, description) {
  try {
    if (fs.existsSync(dirPath)) {
      const stats = fs.statSync(dirPath);
      if (stats.isDirectory()) {
        const files = fs.readdirSync(dirPath);
        const imageFiles = files.filter((file) => {
          const ext = path.extname(file).toLowerCase();
          return [".jpg", ".jpeg", ".png", ".webp", ".gif"].includes(ext);
        });
        logSuccess(
          `${description}: ${dirPath} (${imageFiles.length} imágenes)`
        );
        return { exists: true, count: imageFiles.length, files: imageFiles };
      } else {
        logError(`${description}: ${dirPath} existe pero no es un directorio`);
        return { exists: false, count: 0, files: [] };
      }
    } else {
      logWarning(`${description}: ${dirPath} no existe`);
      return { exists: false, count: 0, files: [] };
    }
  } catch (error) {
    logError(
      `${description}: Error al verificar ${dirPath} - ${error.message}`
    );
    return { exists: false, count: 0, files: [] };
  }
}

// Función para verificar archivo
function checkFile(filePath, description) {
  try {
    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      if (stats.isFile()) {
        logSuccess(
          `${description}: ${filePath} (${Math.round(stats.size / 1024)}KB)`
        );
        return true;
      } else {
        logError(`${description}: ${filePath} existe pero no es un archivo`);
        return false;
      }
    } else {
      logWarning(`${description}: ${filePath} no existe`);
      return false;
    }
  } catch (error) {
    logError(
      `${description}: Error al verificar ${filePath} - ${error.message}`
    );
    return false;
  }
}

// Función para generar URL de prueba
function generateTestUrl(filename, type) {
  const endpoint = type === "comment" ? "comment-images" : "images";
  return `${TEST_CONFIG.baseUrl}:3000/api/${endpoint}/${filename}`;
}

// Función para clasificar imagen
function classifyImage(filename) {
  if (filename.startsWith("comment_")) {
    return "comment";
  }
  return "product";
}

// Función principal de prueba
function testImageService() {
  logSection("PRUEBA DEL SERVICIO DE IMÁGENES TECNOCEL");
  log("Verificando la nueva arquitectura de imágenes separadas...\n");

  // 1. Verificar directorios
  logSection("1. VERIFICACIÓN DE DIRECTORIOS");

  const baseDir = checkDirectory(TEST_CONFIG.basePath, "Directorio base");
  const productDir = checkDirectory(
    TEST_CONFIG.productImagesPath,
    "Directorio de productos"
  );
  const commentDir = checkDirectory(
    TEST_CONFIG.commentImagesPath,
    "Directorio de comentarios"
  );

  // 2. Verificar imágenes por defecto
  logSection("2. VERIFICACIÓN DE IMÁGENES POR DEFECTO");

  const defaultProductPath = path.join(
    TEST_CONFIG.productImagesPath,
    TEST_CONFIG.defaultProductImage
  );
  const defaultCommentPath = path.join(
    TEST_CONFIG.commentImagesPath,
    TEST_CONFIG.defaultCommentImage
  );

  const defaultProductExists = checkFile(
    defaultProductPath,
    "Imagen por defecto de productos"
  );
  const defaultCommentExists = checkFile(
    defaultCommentPath,
    "Imagen por defecto de comentarios"
  );

  // 3. Analizar archivos existentes
  logSection("3. ANÁLISIS DE ARCHIVOS EXISTENTES");

  let productImages = [];
  let commentImages = [];

  if (productDir.exists) {
    productImages = productDir.files.filter(
      (file) => classifyImage(file) === "product"
    );
    logInfo(`Imágenes de productos encontradas: ${productImages.length}`);
    productImages.slice(0, 5).forEach((file) => {
      const url = generateTestUrl(file, "product");
      log(`   📦 ${file} -> ${url}`);
    });
    if (productImages.length > 5) {
      log(`   ... y ${productImages.length - 5} más`);
    }
  }

  if (commentDir.exists) {
    commentImages = commentDir.files.filter(
      (file) => classifyImage(file) === "comment"
    );
    logInfo(`Imágenes de comentarios encontradas: ${commentImages.length}`);
    commentImages.slice(0, 5).forEach((file) => {
      const url = generateTestUrl(file, "comment");
      log(`   💬 ${file} -> ${url}`);
    });
    if (commentImages.length > 5) {
      log(`   ... y ${commentImages.length - 5} más`);
    }
  }

  // 4. Verificar URLs generadas
  logSection("4. VERIFICACIÓN DE URLs GENERADAS");

  logInfo("URLs de productos:");
  log(`   Base: ${TEST_CONFIG.baseUrl}:3000/api/images/`);
  log(
    `   Por defecto: ${generateTestUrl(
      TEST_CONFIG.defaultProductImage,
      "product"
    )}`
  );

  logInfo("URLs de comentarios:");
  log(`   Base: ${TEST_CONFIG.baseUrl}:3000/api/comment-images/`);
  log(
    `   Por defecto: ${generateTestUrl(
      TEST_CONFIG.defaultCommentImage,
      "comment"
    )}`
  );

  // 5. Verificar configuración
  logSection("5. VERIFICACIÓN DE CONFIGURACIÓN");

  logInfo("Variables de entorno requeridas:");
  log(`   IMAGES_BASE_PATH=${TEST_CONFIG.basePath}`);
  log(`   PRODUCT_IMAGES_PATH=${TEST_CONFIG.productImagesPath}`);
  log(`   COMMENT_IMAGES_PATH=${TEST_CONFIG.commentImagesPath}`);
  log(`   DEFAULT_PRODUCT_IMAGE=${TEST_CONFIG.defaultProductImage}`);
  log(`   DEFAULT_COMMENT_IMAGE=${TEST_CONFIG.defaultCommentImage}`);

  // 6. Resumen final
  logSection("6. RESUMEN FINAL");

  const totalImages = productDir.count + commentDir.count;
  const totalDirectories = [baseDir, productDir, commentDir].filter(
    (d) => d.exists
  ).length;

  logInfo(`Estado general:`);
  log(`   📁 Directorios válidos: ${totalDirectories}/3`);
  log(`   🖼️  Total de imágenes: ${totalImages}`);
  log(`   📦 Imágenes de productos: ${productDir.count}`);
  log(`   💬 Imágenes de comentarios: ${commentDir.count}`);
  log(
    `   🔧 Imágenes por defecto: ${
      (defaultProductExists ? 1 : 0) + (defaultCommentExists ? 1 : 0)
    }/2`
  );

  // 7. Recomendaciones
  logSection("7. RECOMENDACIONES");

  if (!baseDir.exists) {
    logWarning("Crear directorio base de imágenes");
  }

  if (!productDir.exists) {
    logWarning("Crear directorio de imágenes de productos");
  }

  if (!commentDir.exists) {
    logWarning("Crear directorio de imágenes de comentarios");
  }

  if (!defaultProductExists) {
    logWarning("Crear imagen por defecto de productos");
  }

  if (!defaultCommentExists) {
    logWarning("Crear imagen por defecto de comentarios");
  }

  if (totalImages === 0) {
    logInfo("No hay imágenes para migrar");
  } else {
    logInfo(`Ejecutar migración: node scripts_test/migrate-images.js`);
  }

  // 8. Próximos pasos
  logSection("8. PRÓXIMOS PASOS");

  logInfo("Para completar la configuración:");
  log("   1. Ejecutar script de migración si hay imágenes existentes");
  log("   2. Verificar que el servidor esté corriendo");
  log("   3. Probar endpoints:");
  log(`      GET ${TEST_CONFIG.baseUrl}:3000/api/images-status`);
  log(`      GET ${TEST_CONFIG.baseUrl}:3000/api/upload/directories-info`);
  log("   4. Actualizar frontend para usar nuevas URLs");

  logSection("PRUEBA COMPLETADA");

  const success =
    totalDirectories >= 2 && (defaultProductExists || defaultCommentExists);

  if (success) {
    logSuccess("✅ El servicio de imágenes está configurado correctamente");
  } else {
    logError("❌ El servicio de imágenes necesita configuración adicional");
  }

  return success;
}

// Ejecutar prueba
if (require.main === module) {
  const success = testImageService();
  process.exit(success ? 0 : 1);
}

module.exports = {
  testImageService,
  TEST_CONFIG,
};
