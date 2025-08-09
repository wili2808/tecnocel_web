import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { Sequelize } from "sequelize";

// Cargar variables de entorno
dotenv.config();

const COMMENTS_IMAGES_PATH =
  process.env.COMMENTS_IMAGES_PATH || "C:/xampp/htdocs/tecnocel/img_comments";
const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

// Configuración de la base de datos
const sequelize = new Sequelize({
  dialect: "mysql",
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "3306"),
  username: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "db_tecnocel_v3",
  logging: false,
});

console.log("🔍 Diagnóstico de imágenes de comentarios...\n");

async function debugCommentsImages() {
  try {
    // 1. Verificar directorio de imágenes
    console.log("1️⃣ Verificando directorio de imágenes...");
    console.log(`   Ruta configurada: ${COMMENTS_IMAGES_PATH}`);
    console.log(`   Existe: ${fs.existsSync(COMMENTS_IMAGES_PATH)}`);

    if (fs.existsSync(COMMENTS_IMAGES_PATH)) {
      const files = fs.readdirSync(COMMENTS_IMAGES_PATH);
      const imageFiles = files.filter((file) => {
        const ext = path.extname(file).toLowerCase();
        return [".jpg", ".jpeg", ".png", ".webp", ".gif"].includes(ext);
      });
      console.log(`   Archivos de imagen encontrados: ${imageFiles.length}`);
      if (imageFiles.length > 0) {
        console.log(`   Ejemplos: ${imageFiles.slice(0, 3).join(", ")}`);
      }
    }
    console.log("");

    // 2. Verificar base de datos
    console.log("2️⃣ Verificando base de datos...");
    await sequelize.authenticate();
    console.log("   ✅ Conexión a BD establecida");

    // Consultar imágenes de comentarios
    const [results] = await sequelize.query(`
      SELECT id_imagen, nombre_archivo, ruta_imagen, estado
      FROM tb_comentario_imagenes 
      WHERE estado = 'activo'
      ORDER BY id_imagen DESC
      LIMIT 5
    `);

    console.log(`   Imágenes en BD: ${results.length}`);
    if (results.length > 0) {
      console.log("   Últimas imágenes:");
      results.forEach((row, index) => {
        console.log(
          `     ${index + 1}. ID: ${row.id_imagen}, Ruta: ${
            row.ruta_imagen
          }, Archivo: ${row.nombre_archivo}`
        );
      });
    }
    console.log("");

    // 3. Verificar URLs generadas
    console.log("3️⃣ Verificando URLs generadas...");
    if (results.length > 0) {
      results.forEach((row, index) => {
        const imageUrl = `${BASE_URL}/api/images/${row.ruta_imagen}`;
        console.log(`   ${index + 1}. URL: ${imageUrl}`);

        // Verificar si el archivo físico existe
        const expectedPath = path.join(
          COMMENTS_IMAGES_PATH,
          row.nombre_archivo
        );
        const fileExists = fs.existsSync(expectedPath);
        console.log(
          `      Archivo físico: ${
            fileExists ? "✅ Existe" : "❌ No existe"
          } (${expectedPath})`
        );
      });
    }
    console.log("");

    // 4. Verificar rutas del middleware
    console.log("4️⃣ Verificando configuración del middleware...");
    console.log(`   BASE_URL: ${BASE_URL}`);
    console.log(`   COMMENTS_IMAGES_PATH: ${COMMENTS_IMAGES_PATH}`);

    // Simular la lógica del middleware
    if (results.length > 0) {
      const testImage = results[0];
      const filename = testImage.ruta_imagen;

      console.log(`   Prueba con imagen: ${filename}`);

      if (
        filename.startsWith("img_comments/") ||
        filename.startsWith("comments_img/") ||
        filename.startsWith("comments/")
      ) {
        const filePath = path.join(COMMENTS_IMAGES_PATH, filename);
        console.log(`   Ruta construida: ${filePath}`);
        console.log(`   Archivo existe: ${fs.existsSync(filePath)}`);
      }
    }
    console.log("");

    // 5. Verificar permisos
    console.log("5️⃣ Verificando permisos...");
    if (fs.existsSync(COMMENTS_IMAGES_PATH)) {
      try {
        const testFile = path.join(
          COMMENTS_IMAGES_PATH,
          "test-permissions.tmp"
        );
        fs.writeFileSync(testFile, "test");
        fs.unlinkSync(testFile);
        console.log("   ✅ Permisos de escritura OK");
      } catch (error) {
        console.log(`   ❌ Error de permisos: ${error.message}`);
      }
    }
  } catch (error) {
    console.error("❌ Error durante el diagnóstico:", error.message);
  } finally {
    await sequelize.close();
    console.log("\n🔌 Conexión a BD cerrada");
  }
}

// Ejecutar diagnóstico
debugCommentsImages()
  .then(() => {
    console.log("\n🎉 Diagnóstico completado");
  })
  .catch((error) => {
    console.error("\n❌ Error fatal:", error.message);
    process.exit(1);
  });
