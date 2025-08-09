import fs from "fs";
import path from "path";
import dotenv from "dotenv";

// Cargar variables de entorno
dotenv.config();

const COMMENTS_IMAGES_PATH =
  process.env.COMMENTS_IMAGES_PATH || "C:/xampp/htdocs/tecnocel/img_comments";

console.log("🔍 Verificando directorio de imágenes de comentarios...");
console.log(`📁 Ruta configurada: ${COMMENTS_IMAGES_PATH}`);

try {
  // Verificar si el directorio existe
  if (!fs.existsSync(COMMENTS_IMAGES_PATH)) {
    console.log("❌ El directorio no existe. Creando...");

    // Crear el directorio y sus padres si es necesario
    fs.mkdirSync(COMMENTS_IMAGES_PATH, { recursive: true });

    console.log("✅ Directorio creado exitosamente");
  } else {
    console.log("✅ El directorio ya existe");
  }

  // Verificar permisos de escritura
  try {
    const testFile = path.join(COMMENTS_IMAGES_PATH, "test-write.tmp");
    fs.writeFileSync(testFile, "test");
    fs.unlinkSync(testFile);
    console.log("✅ Permisos de escritura verificados");
  } catch (error) {
    console.error("❌ Error de permisos de escritura:", error.message);
  }

  // Mostrar información del directorio
  const stats = fs.statSync(COMMENTS_IMAGES_PATH);
  console.log(`📊 Información del directorio:`);
  console.log(`   - Es directorio: ${stats.isDirectory()}`);
  console.log(`   - Permisos: ${stats.mode.toString(8)}`);
  console.log(`   - Propietario: ${stats.uid}`);
  console.log(`   - Grupo: ${stats.gid}`);
} catch (error) {
  console.error("❌ Error al verificar/crear directorio:", error.message);
  process.exit(1);
}

console.log("\n🎉 Verificación completada exitosamente");
