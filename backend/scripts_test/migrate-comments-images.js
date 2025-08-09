import fs from "fs";
import path from "path";
import dotenv from "dotenv";

// Cargar variables de entorno
dotenv.config();

const OLD_COMMENTS_PATH = path.join(
  process.cwd(),
  "../htdocs/tecnocel/comments_img"
);
const NEW_COMMENTS_PATH =
  process.env.COMMENTS_IMAGES_PATH || "C:/xampp/htdocs/tecnocel/img_comments";

console.log("🔄 Iniciando migración de imágenes de comentarios...");
console.log(`📁 Directorio origen: ${OLD_COMMENTS_PATH}`);
console.log(`📁 Directorio destino: ${NEW_COMMENTS_PATH}`);

try {
  // Verificar si el directorio origen existe
  if (!fs.existsSync(OLD_COMMENTS_PATH)) {
    console.log(
      "ℹ️  El directorio origen no existe. No hay imágenes para migrar."
    );
    process.exit(0);
  }

  // Crear directorio destino si no existe
  if (!fs.existsSync(NEW_COMMENTS_PATH)) {
    console.log("📁 Creando directorio destino...");
    fs.mkdirSync(NEW_COMMENTS_PATH, { recursive: true });
  }

  // Leer archivos del directorio origen
  const files = fs.readdirSync(OLD_COMMENTS_PATH);
  const imageFiles = files.filter((file) => {
    const ext = path.extname(file).toLowerCase();
    return [".jpg", ".jpeg", ".png", ".webp", ".gif"].includes(ext);
  });

  console.log(`📊 Encontradas ${imageFiles.length} imágenes para migrar`);

  if (imageFiles.length === 0) {
    console.log("ℹ️  No hay imágenes para migrar.");
    process.exit(0);
  }

  let migratedCount = 0;
  let errorCount = 0;

  // Migrar cada archivo
  for (const file of imageFiles) {
    try {
      const sourcePath = path.join(OLD_COMMENTS_PATH, file);
      const destPath = path.join(NEW_COMMENTS_PATH, file);

      // Verificar si el archivo ya existe en el destino
      if (fs.existsSync(destPath)) {
        console.log(
          `⚠️  El archivo ${file} ya existe en el destino. Saltando...`
        );
        continue;
      }

      // Copiar archivo
      fs.copyFileSync(sourcePath, destPath);

      // Verificar que la copia fue exitosa
      const sourceStats = fs.statSync(sourcePath);
      const destStats = fs.statSync(destPath);

      if (sourceStats.size === destStats.size) {
        console.log(
          `✅ Migrado: ${file} (${(sourceStats.size / 1024).toFixed(2)} KB)`
        );
        migratedCount++;
      } else {
        console.error(`❌ Error en migración: ${file} - Tamaños no coinciden`);
        errorCount++;
      }
    } catch (error) {
      console.error(`❌ Error migrando ${file}:`, error.message);
      errorCount++;
    }
  }

  console.log("\n📊 Resumen de migración:");
  console.log(`   - Total de archivos: ${imageFiles.length}`);
  console.log(`   - Migrados exitosamente: ${migratedCount}`);
  console.log(`   - Errores: ${errorCount}`);
  console.log(
    `   - Saltados (ya existían): ${
      imageFiles.length - migratedCount - errorCount
    }`
  );

  if (migratedCount > 0) {
    console.log(
      "\n💡 Recomendación: Después de verificar que todo funciona correctamente,"
    );
    console.log(
      "   puedes eliminar el directorio origen para liberar espacio."
    );
    console.log(`   Directorio origen: ${OLD_COMMENTS_PATH}`);
  }
} catch (error) {
  console.error("❌ Error durante la migración:", error.message);
  process.exit(1);
}

console.log("\n🎉 Migración completada");
