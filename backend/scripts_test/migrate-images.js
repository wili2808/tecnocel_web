const fs = require("fs");
const path = require("path");

// Configuración de directorios
const OLD_IMAGES_PATH = "C:/xampp/htdocs/tecnocel";
const NEW_BASE_PATH = "C:/xampp/htdocs/tecnocel";
const NEW_PRODUCT_PATH = path.join(NEW_BASE_PATH, "products");
const NEW_COMMENT_PATH = path.join(NEW_BASE_PATH, "comments");

// Tipos de archivos de imagen permitidos
const ALLOWED_EXTENSIONS = [
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".gif",
  ".jfif",
  ".avif",
  ".bmp",
  ".tiff",
  ".tif",
];

// Función para crear directorio si no existe
function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`✅ Directorio creado: ${dirPath}`);
  }
}

// Función para determinar si una imagen es de comentario o producto
function classifyImage(filename) {
  // Las imágenes de comentarios tienen el prefijo "comment_"
  if (filename.startsWith("comment_")) {
    return "comment";
  }

  // Las imágenes de productos pueden tener varios patrones
  // Por defecto, si no es comentario, es producto
  return "product";
}

// Función para mover archivo
function moveFile(sourcePath, destinationPath) {
  try {
    fs.copyFileSync(sourcePath, destinationPath);
    fs.unlinkSync(sourcePath); // Eliminar archivo original
    return true;
  } catch (error) {
    console.error(`❌ Error al mover ${sourcePath}:`, error.message);
    return false;
  }
}

// Función principal de migración
function migrateImages() {
  console.log("🚀 Iniciando migración de imágenes...\n");

  // Verificar que el directorio original existe
  if (!fs.existsSync(OLD_IMAGES_PATH)) {
    console.error(`❌ El directorio original no existe: ${OLD_IMAGES_PATH}`);
    return;
  }

  // Crear nuevos directorios
  ensureDirectoryExists(NEW_PRODUCT_PATH);
  ensureDirectoryExists(NEW_COMMENT_PATH);

  // Leer archivos del directorio original
  const files = fs.readdirSync(OLD_IMAGES_PATH);
  const imageFiles = files.filter((file) => {
    const ext = path.extname(file).toLowerCase();
    return ALLOWED_EXTENSIONS.includes(ext);
  });

  console.log(`📁 Encontradas ${imageFiles.length} imágenes para migrar\n`);

  let productCount = 0;
  let commentCount = 0;
  let errorCount = 0;

  // Procesar cada imagen
  imageFiles.forEach((filename, index) => {
    const sourcePath = path.join(OLD_IMAGES_PATH, filename);
    const imageType = classifyImage(filename);

    let destinationPath;
    if (imageType === "comment") {
      destinationPath = path.join(NEW_COMMENT_PATH, filename);
      commentCount++;
    } else {
      destinationPath = path.join(NEW_PRODUCT_PATH, filename);
      productCount++;
    }

    console.log(
      `${index + 1}/${
        imageFiles.length
      } - ${imageType.toUpperCase()}: ${filename}`
    );

    if (moveFile(sourcePath, destinationPath)) {
      console.log(`   ✅ Movida a: ${destinationPath}`);
    } else {
      errorCount++;
      console.log(`   ❌ Error al mover`);
    }
  });

  // Resumen final
  console.log("\n📊 Resumen de migración:");
  console.log(`   📦 Imágenes de productos: ${productCount}`);
  console.log(`   💬 Imágenes de comentarios: ${commentCount}`);
  console.log(`   ❌ Errores: ${errorCount}`);
  console.log(`   ✅ Total procesadas: ${imageFiles.length - errorCount}`);

  // Verificar directorios finales
  const finalProductFiles = fs.existsSync(NEW_PRODUCT_PATH)
    ? fs.readdirSync(NEW_PRODUCT_PATH).length
    : 0;
  const finalCommentFiles = fs.existsSync(NEW_COMMENT_PATH)
    ? fs.readdirSync(NEW_COMMENT_PATH).length
    : 0;

  console.log("\n📁 Estado final de directorios:");
  console.log(`   📦 ${NEW_PRODUCT_PATH}: ${finalProductFiles} archivos`);
  console.log(`   💬 ${NEW_COMMENT_PATH}: ${finalCommentFiles} archivos`);

  if (errorCount === 0) {
    console.log("\n🎉 ¡Migración completada exitosamente!");
  } else {
    console.log(`\n⚠️  Migración completada con ${errorCount} errores`);
  }
}

// Función para crear imágenes por defecto
function createDefaultImages() {
  console.log("\n🖼️  Creando imágenes por defecto...");

  const defaultProductImage = path.join(
    NEW_PRODUCT_PATH,
    "default-product.png"
  );
  const defaultCommentImage = path.join(
    NEW_COMMENT_PATH,
    "default-comment.png"
  );

  // Crear imágenes por defecto simples (1x1 pixel PNG transparente)
  const defaultImageBuffer = Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
    0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
    0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4, 0x89, 0x00, 0x00, 0x00,
    0x0a, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00,
    0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00, 0x00, 0x00, 0x00, 0x49,
    0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
  ]);

  try {
    if (!fs.existsSync(defaultProductImage)) {
      fs.writeFileSync(defaultProductImage, defaultImageBuffer);
      console.log(
        `✅ Imagen por defecto de productos creada: ${defaultProductImage}`
      );
    }

    if (!fs.existsSync(defaultCommentImage)) {
      fs.writeFileSync(defaultCommentImage, defaultImageBuffer);
      console.log(
        `✅ Imagen por defecto de comentarios creada: ${defaultCommentImage}`
      );
    }
  } catch (error) {
    console.error("❌ Error al crear imágenes por defecto:", error.message);
  }
}

// Función para verificar la configuración
function verifyConfiguration() {
  console.log("🔍 Verificando configuración...\n");

  console.log("📁 Directorios configurados:");
  console.log(`   📦 Productos: ${NEW_PRODUCT_PATH}`);
  console.log(`   💬 Comentarios: ${NEW_COMMENT_PATH}`);
  console.log(`   🏠 Base: ${NEW_BASE_PATH}\n`);

  // Verificar permisos de escritura
  try {
    ensureDirectoryExists(NEW_PRODUCT_PATH);
    ensureDirectoryExists(NEW_COMMENT_PATH);

    // Probar escritura
    const testFile = path.join(NEW_PRODUCT_PATH, "test.txt");
    fs.writeFileSync(testFile, "test");
    fs.unlinkSync(testFile);

    console.log("✅ Permisos de escritura verificados");
  } catch (error) {
    console.error("❌ Error de permisos:", error.message);
    return false;
  }

  return true;
}

// Ejecutar migración
if (require.main === module) {
  console.log("🔄 MIGRADOR DE IMÁGENES TECNOCEL\n");
  console.log(
    "Este script migrará las imágenes existentes a la nueva estructura de directorios.\n"
  );

  if (verifyConfiguration()) {
    migrateImages();
    createDefaultImages();
  } else {
    console.error("❌ No se puede continuar con la migración");
    process.exit(1);
  }
}

module.exports = {
  migrateImages,
  createDefaultImages,
  verifyConfiguration,
};
